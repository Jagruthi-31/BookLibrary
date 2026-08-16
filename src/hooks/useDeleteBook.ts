import { useState } from "react";
import type { Book } from "@/types/book";
import { deleteBookRow } from "@/services/booksService";
import { deleteBookPdf } from "@/services/storageService";
import { useToast } from "@/context/ToastContext";

export function useDeleteBook(onDeleted?: (id: string) => void) {
  const toast = useToast();
  const [pendingBook, setPendingBook] = useState<Book | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);

  const requestDelete = (book: Book) => setPendingBook(book);
  const cancelDelete = () => {
    if (isDeleting) return;
    setPendingBook(null);
  };

  const confirmDelete = async () => {
    if (!pendingBook) return;
    setIsDeleting(true);

    try {
      await deleteBookPdf(pendingBook.pdf_path);
    } catch {
      toast.error("Couldn't delete the file from cloud storage. Please check your connection and try again.");
      setIsDeleting(false);
      return;
    }

    try {
      await deleteBookRow(pendingBook.id);
    } catch {
      toast.error(
        "The file was removed, but your library couldn't be updated. Refresh and try deleting this book again.",
        "Delete incomplete"
      );
      setIsDeleting(false);
      return;
    }

    toast.success(`"${pendingBook.title}" was deleted.`);
    onDeleted?.(pendingBook.id);
    setPendingBook(null);
    setIsDeleting(false);
  };

  return { pendingBook, requestDelete, cancelDelete, confirmDelete, isDeleting };
}
