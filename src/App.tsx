import { Routes, Route, Navigate } from "react-router-dom";
import { ProtectedRoute } from "@/routes/ProtectedRoute";
import { AppShell } from "@/components/layout/AppShell";
import LoginPage from "@/pages/LoginPage";
import LibraryPage from "@/pages/LibraryPage";
import FavoritesPage from "@/pages/FavoritesPage";
import ContinueReadingPage from "@/pages/ContinueReadingPage";
import RecentlyAddedPage from "@/pages/RecentlyAddedPage";
import BookDetailsPage from "@/pages/BookDetailsPage";
import AddBookPage from "@/pages/AddBookPage";
import EditBookPage from "@/pages/EditBookPage";
import SettingsPage from "@/pages/SettingsPage";
import ReaderPage from "@/pages/ReaderPage";

export default function App() {
  return (
    <Routes>
      <Route path="/login" element={<LoginPage />} />

      {/* The reader is a dedicated full-viewport experience without the app shell. */}
      <Route element={<ProtectedRoute />}>
        <Route path="/reader/:bookId" element={<ReaderPage />} />
      </Route>

      <Route element={<ProtectedRoute />}>
        <Route element={<AppShell />}>
          <Route index element={<Navigate to="/library" replace />} />
          <Route path="/library" element={<LibraryPage />} />
          <Route path="/favorites" element={<FavoritesPage />} />
          <Route path="/continue-reading" element={<ContinueReadingPage />} />
          <Route path="/recently-added" element={<RecentlyAddedPage />} />
          <Route path="/books/new" element={<AddBookPage />} />
          <Route path="/books/:bookId" element={<BookDetailsPage />} />
          <Route path="/books/:bookId/edit" element={<EditBookPage />} />
          <Route path="/settings" element={<SettingsPage />} />
        </Route>
      </Route>

      <Route path="*" element={<Navigate to="/library" replace />} />
    </Routes>
  );
}
