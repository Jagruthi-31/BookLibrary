import { useNavigate } from "react-router-dom";
import { AddEditBookForm } from "@/components/books/AddEditBookForm";

export default function AddBookPage() {
  const navigate = useNavigate();
  return (
    <div className="mx-auto max-w-2xl">
      <button onClick={() => navigate(-1)} className="focus-ring mb-6 text-sm font-medium text-ink-muted hover:text-ink">
        ← Back
      </button>
      <h1 className="font-display text-2xl font-semibold text-ink sm:text-3xl">Add Book</h1>
      <p className="mt-1 text-sm text-ink-muted">Enter the details and upload the PDF you own.</p>
      <div className="mt-8">
        <AddEditBookForm mode="add" />
      </div>
    </div>
  );
}
