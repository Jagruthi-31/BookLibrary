#!/usr/bin/env node
/**
 * Athenaeum — one-time bulk importer
 * ------------------------------------------------------------------------
 * Reads a "Booked & Planned"-style JSON backup (title/author/rating/pdf URL
 * per book) and, for every entry that has a PDF, downloads it and re-uploads
 * it into THIS project's private "books" Storage bucket, then inserts the
 * matching row into the "books" table.
 *
 * This script uses your Supabase SERVICE ROLE key, which bypasses Row Level
 * Security. That's intentional — it lets the script insert rows across the
 * board without you being logged into the app 50 times — but it also means
 * this key must never be committed to git or used anywhere in the deployed
 * app itself. Run this once, locally, then treat the key as sensitive.
 *
 * Setup:
 *   1. Copy scripts/import.config.example.json to scripts/import.config.json
 *      and fill in supabaseUrl, serviceRoleKey, and userId.
 *   2. Put your backup JSON file somewhere accessible, e.g. scripts/data/backup.json
 *
 * Usage:
 *   node scripts/bulk-import.mjs scripts/data/backup.json
 *
 * Safe to re-run: books already imported (matched by title + author for the
 * same user) are skipped rather than duplicated.
 * ------------------------------------------------------------------------
 */

import fs from "node:fs";
import path from "node:path";
import { randomUUID } from "node:crypto";
import { fileURLToPath } from "node:url";
import { createClient } from "@supabase/supabase-js";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const CONFIG_PATH = path.join(__dirname, "import.config.json");

function fail(message) {
  console.error(`\n✖ ${message}\n`);
  process.exit(1);
}

// ---------------------------------------------------------------------------
// 1. Load config + backup file
// ---------------------------------------------------------------------------
if (!fs.existsSync(CONFIG_PATH)) {
  fail(
    `Missing scripts/import.config.json.\n` +
      `Copy scripts/import.config.example.json to scripts/import.config.json and fill it in first.`
  );
}

const config = JSON.parse(fs.readFileSync(CONFIG_PATH, "utf-8"));
const { supabaseUrl, serviceRoleKey, userId } = config;

if (!supabaseUrl || !serviceRoleKey || !userId) {
  fail("scripts/import.config.json is missing supabaseUrl, serviceRoleKey, or userId.");
}

const backupPathArg = process.argv[2];
if (!backupPathArg) {
  fail("Tell the script where your backup file is, e.g.\n  node scripts/bulk-import.mjs scripts/data/backup.json");
}

const backupPath = path.resolve(process.cwd(), backupPathArg);
if (!fs.existsSync(backupPath)) {
  fail(`Can't find a file at: ${backupPath}`);
}

const backup = JSON.parse(fs.readFileSync(backupPath, "utf-8"));
const rawBooks = Array.isArray(backup) ? backup : backup.library;

if (!Array.isArray(rawBooks)) {
  fail('Could not find a book list in that file (expected an array, or a "library" array field).');
}

const supabase = createClient(supabaseUrl, serviceRoleKey, {
  auth: { persistSession: false },
});

// ---------------------------------------------------------------------------
// 2. Helpers — mapping the old app's shape onto Athenaeum's schema
// ---------------------------------------------------------------------------
function sanitizeFileName(name) {
  return name.replace(/[^a-zA-Z0-9._-]/g, "_").slice(-120) || "book.pdf";
}

function parseTimestamp(value) {
  if (!value) return null;
  const date = typeof value === "number" ? new Date(value) : new Date(String(value));
  return Number.isNaN(date.getTime()) ? null : date.toISOString();
}

function computeProgress(book) {
  const pages = Number(book.pages) || null;
  const status = String(book.status || "").toLowerCase();
  let currentPage = Number(book.currentPage) || 0;
  let readingProgress = 0;

  if (status === "finished") {
    currentPage = pages || currentPage || 0;
    readingProgress = 100;
  } else if (status === "reading") {
    readingProgress = pages ? Math.min(100, Math.round((currentPage / pages) * 10000) / 100) : 0;
  } else {
    // "Planned"/"To Read"/anything else — no progress yet.
    currentPage = 0;
    readingProgress = 0;
  }

  return { currentPage, totalPages: pages, readingProgress };
}

function buildTags(book) {
  const tags = new Set();
  if (book.subGenre) {
    for (const part of String(book.subGenre).split(",")) {
      const t = part.trim();
      if (t) tags.add(t);
    }
  }
  if (book.series && String(book.series).trim()) tags.add(String(book.series).trim());
  return Array.from(tags);
}

function mapBook(book) {
  const { currentPage, totalPages, readingProgress } = computeProgress(book);
  const status = String(book.status || "").toLowerCase();
  const lastOpenedAt =
    status === "finished"
      ? parseTimestamp(book.finished) || parseTimestamp(book.started)
      : status === "reading"
      ? parseTimestamp(book.started)
      : null;

  return {
    title: (book.title || "Untitled").trim(),
    author: book.author ? String(book.author).trim() : null,
    description: book.review && String(book.review).trim() ? String(book.review).trim() : null,
    cover_url: book.cover || null,
    rating: typeof book.rating === "number" ? Math.max(0, Math.min(5, book.rating)) : 0,
    category: book.genre ? String(book.genre).trim() : null,
    tags: buildTags(book),
    current_page: currentPage,
    total_pages: totalPages,
    reading_progress: readingProgress,
    is_favorite: Boolean(book.favourite),
    created_at: parseTimestamp(book.addedAt) || new Date().toISOString(),
    last_opened_at: lastOpenedAt,
  };
}

// ---------------------------------------------------------------------------
// 3. Import loop
// ---------------------------------------------------------------------------
async function alreadyImported(title, author) {
  const { data, error } = await supabase
    .from("books")
    .select("id")
    .eq("user_id", userId)
    .eq("title", title)
    .eq("author", author)
    .maybeSingle();
  if (error) return false;
  return Boolean(data);
}

async function downloadPdf(url) {
  const res = await fetch(url);
  if (!res.ok) throw new Error(`HTTP ${res.status}`);
  const arrayBuffer = await res.arrayBuffer();
  return Buffer.from(arrayBuffer);
}

async function importBook(rawBook, index, total) {
  const mapped = mapBook(rawBook);
  const label = `[${index + 1}/${total}] "${mapped.title}"`;

  if (!rawBook.pdf) {
    console.log(`${label} — skipped (no PDF in backup)`);
    return { status: "skipped_no_pdf", title: mapped.title };
  }

  if (await alreadyImported(mapped.title, mapped.author)) {
    console.log(`${label} — already imported, skipping`);
    return { status: "already_imported", title: mapped.title };
  }

  let pdfBuffer;
  try {
    pdfBuffer = await downloadPdf(rawBook.pdf);
  } catch (err) {
    console.log(`${label} — ✖ couldn't download PDF (${err.message})`);
    return { status: "download_failed", title: mapped.title, error: err.message };
  }

  const bookId = randomUUID();
  const fileName = sanitizeFileName(`${mapped.title}.pdf`);
  const storagePath = `${userId}/${bookId}/book.pdf`;

  const { error: uploadError } = await supabase.storage.from("books").upload(storagePath, pdfBuffer, {
    contentType: "application/pdf",
    upsert: true,
  });
  if (uploadError) {
    console.log(`${label} — ✖ upload failed (${uploadError.message})`);
    return { status: "upload_failed", title: mapped.title, error: uploadError.message };
  }

  const { error: insertError } = await supabase.from("books").insert({
    id: bookId,
    user_id: userId,
    ...mapped,
    pdf_path: storagePath,
    pdf_file_name: fileName,
    pdf_size: pdfBuffer.byteLength,
  });

  if (insertError) {
    // Clean up the orphaned file so we don't leave storage inconsistent with the DB.
    await supabase.storage.from("books").remove([storagePath]).catch(() => {});
    console.log(`${label} — ✖ database insert failed (${insertError.message})`);
    return { status: "insert_failed", title: mapped.title, error: insertError.message };
  }

  console.log(`${label} — ✓ imported`);
  return { status: "imported", title: mapped.title };
}

async function main() {
  console.log(`\nImporting ${rawBooks.length} books from ${path.basename(backupPath)}\n`);

  const results = [];
  for (let i = 0; i < rawBooks.length; i++) {
    results.push(await importBook(rawBooks[i], i, rawBooks.length));
  }

  const byStatus = (status) => results.filter((r) => r.status === status);

  console.log("\n─────────────────────────────────────────");
  console.log(`Imported:         ${byStatus("imported").length}`);
  console.log(`Already existed:  ${byStatus("already_imported").length}`);
  console.log(`Skipped (no PDF): ${byStatus("skipped_no_pdf").length}`);
  console.log(`Failed downloads: ${byStatus("download_failed").length}`);
  console.log(`Failed uploads:   ${byStatus("upload_failed").length}`);
  console.log(`Failed inserts:   ${byStatus("insert_failed").length}`);
  console.log("─────────────────────────────────────────\n");

  const needsAttention = results.filter((r) => r.status !== "imported" && r.status !== "already_imported");
  if (needsAttention.length > 0) {
    console.log("These need a look:");
    for (const r of needsAttention) {
      console.log(`  • ${r.title} — ${r.status}${r.error ? `: ${r.error}` : ""}`);
    }
    console.log("");
  }
}

main().catch((err) => {
  console.error("\nUnexpected error:", err);
  process.exit(1);
});
