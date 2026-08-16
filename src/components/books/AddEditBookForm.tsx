import { useMemo, useState, type FormEvent } from "react";
import { useNavigate } from "react-router-dom";
import { X } from "lucide-react";
import { Input, Textarea, Label, FieldError } from "@/components/ui/Input";
import { Button } from "@/components/ui/Button";
import { RatingInput } from "@/components/ui/RatingStars";
import { PdfUploadField } from "@/components/books/PdfUploadField";
import { useAuth } from "@/context/AuthContext";
import { useToast } from "@/context/ToastContext";
import { useBookUpload } from "@/hooks/useBookUpload";
import * as booksService from "@/services/booksService";
import { deleteBookPdf } from "@/services/storageService";
import { emptyBookForm, type Book, type BookFormValues } from "@/types/book";
import { toFriendlyError } from "@/lib/utils";

interface AddEditBookFormProps {
  mode: "add" | "edit";
  book?: Book;
}

export function AddEditBookForm({ mode, book }: AddEditBookFormProps) {
  const { user } = useAuth();
  const navigate = useNavigate();
  const toast = useToast();

  const bookId = useMemo(() => book?.id ?? crypto.randomUUID(), [book?.id]);

  const [values, setValues] = useState<BookFormValues>(
    book
      ? {
          title: book.title,
          author: book.author ?? "",
          description: book.description ?? "",
          cover_url: book.cover_url ?? "",
          rating: book.rating,
          category: book.category ?? "",
          tags: book.tags ?? [],
        }
      : emptyBookForm
  );
  const [tagDraft, setTagDraft] = useState("");
  const [titleError, setTitleError] = useState<string | null>(null);
  const [pdfError, setPdfError] = useState<string | null>(null);
  const [isSaving, setIsSaving] = useState(false);

  const upload = useBookUpload(user?.id, bookId);

  const setField = <K extends keyof BookFormValues>(key: K, value: BookFormValues[K]) =>
    setValues((prev) => ({ ...prev, [key]: value }));

  const addTag = () => {
    const tag = tagDraft.trim();
    if (!tag || values.tags.includes(tag)) {
      setTagDraft("");
      return;
    }
    setField("tags", [...values.tags, tag]);
    setTagDraft("");
  };

  const removeTag = (tag: string) => setField("tags", values.tags.filter((t) => t !== tag));

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    if (!user) return;

    let hasError = false;
    if (!values.title.trim()) {
      setTitleError("Give your book a title.");
      hasError = true;
    } else {
      setTitleError(null);
    }

    const hasPdf = mode === "edit" ? Boolean(book?.pdf_path) || upload.uploadState.status === "success" : upload.uploadState.status === "success";
    if (!hasPdf) {
      setPdfError("Upload a PDF to continue.");
      hasError = true;
    } else {
      setPdfError(null);
    }

    if (upload.uploadState.status === "uploading") {
      toast.toast("Hang tight — your PDF is still uploading.");
      return;
    }

    if (hasError) return;

    setIsSaving(true);
    try {
      if (mode === "add") {
        await booksService.createBook({
          id: bookId,
          user_id: user.id,
          ...values,
          pdf_path: upload.resolvedPath!,
          pdf_file_name: upload.selectedFile!.name,
          pdf_size: upload.selectedFile!.size,
        });
        toast.success("Your book was added to the library.");
        navigate(`/books/${bookId}`);
      } else if (book) {
        const previousPath = book.pdf_path;
        const replacedPdf = upload.uploadState.status === "success" && upload.resolvedPath;

        await booksService.updateBook(book.id, {
          ...values,
          ...(replacedPdf
            ? {
                pdf_path: upload.resolvedPath!,
                pdf_file_name: upload.selectedFile!.name,
                pdf_size: upload.selectedFile!.size,
              }
            : {}),
        });

        // Only remove the old file once the new one is safely referenced by the DB.
        if (replacedPdf && previousPath !== upload.resolvedPath) {
          deleteBookPdf(previousPath).catch(() => {
            // Non-critical: an orphaned object doesn't affect the user's book.
          });
        }

        toast.success("Changes saved.");
        navigate(`/books/${book.id}`);
      }
    } catch (err) {
      toast.error(toFriendlyError(err, "We couldn't save this book. Please try again."));
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6" noValidate>
      <div>
        <Label htmlFor="title">
          Book Name <span className="text-danger">*</span>
        </Label>
        <Input
          id="title"
          value={values.title}
          onChange={(e) => setField("title", e.target.value)}
          placeholder="Atomic Habits"
          error={!!titleError}
          autoFocus
        />
        <FieldError>{titleError}</FieldError>
      </div>

      <div className="grid gap-6 sm:grid-cols-2">
        <div>
          <Label htmlFor="author">Author</Label>
          <Input id="author" value={values.author} onChange={(e) => setField("author", e.target.value)} placeholder="James Clear" />
        </div>
        <div>
          <Label htmlFor="category">Category</Label>
          <Input
            id="category"
            value={values.category}
            onChange={(e) => setField("category", e.target.value)}
            placeholder="Self-Help"
          />
        </div>
      </div>

      <div>
        <Label htmlFor="cover_url">Book Cover URL</Label>
        <Input
          id="cover_url"
          type="url"
          value={values.cover_url}
          onChange={(e) => setField("cover_url", e.target.value)}
          placeholder="https://example.com/cover.jpg"
        />
        <p className="mt-1.5 text-xs text-ink-faint">Leave blank and we'll generate a cover from the title.</p>
      </div>

      <div>
        <Label>Rating</Label>
        <RatingInput value={values.rating} onChange={(v) => setField("rating", v)} />
      </div>

      <div>
        <Label htmlFor="description">Description</Label>
        <Textarea
          id="description"
          rows={4}
          value={values.description}
          onChange={(e) => setField("description", e.target.value)}
          placeholder="What's this book about?"
        />
      </div>

      <div>
        <Label htmlFor="tags">Tags</Label>
        <div className="flex flex-wrap items-center gap-1.5 rounded-card border border-border bg-card p-2">
          {values.tags.map((tag) => (
            <span
              key={tag}
              className="flex items-center gap-1 rounded-full bg-paper-soft px-2 py-1 text-xs font-medium text-ink-muted"
            >
              {tag}
              <button type="button" onClick={() => removeTag(tag)} aria-label={`Remove tag ${tag}`} className="focus-ring text-ink-faint hover:text-danger">
                <X size={11} />
              </button>
            </span>
          ))}
          <input
            id="tags"
            value={tagDraft}
            onChange={(e) => setTagDraft(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter" || e.key === ",") {
                e.preventDefault();
                addTag();
              }
            }}
            onBlur={addTag}
            placeholder={values.tags.length === 0 ? "Add a tag and press Enter" : ""}
            className="focus-ring min-w-[8rem] flex-1 border-none bg-transparent px-1 py-0.5 text-sm text-ink placeholder:text-ink-faint focus:outline-none"
          />
        </div>
      </div>

      <div>
        <Label>
          PDF <span className="text-danger">*</span>
        </Label>
        <PdfUploadField
          uploadState={upload.uploadState}
          onSelectFile={upload.selectFile}
          onCancel={upload.cancelUpload}
          onRetry={upload.retryUpload}
          existingFileName={book?.pdf_file_name}
          existingFileSize={book?.pdf_size}
          required
        />
        <FieldError>{pdfError}</FieldError>
      </div>

      <div className="flex items-center justify-end gap-3 border-t border-border pt-6">
        <Button type="button" variant="secondary" onClick={() => navigate(-1)} disabled={isSaving}>
          Cancel
        </Button>
        <Button type="submit" isLoading={isSaving} disabled={upload.uploadState.status === "uploading"}>
          {mode === "add" ? "Upload Book" : "Save Changes"}
        </Button>
      </div>
    </form>
  );
}
