import { Toaster } from "@/components/ui/sonner";
import { useEffect, useState } from "react";
import type { UserRole } from "./backend";
import Navbar from "./components/Navbar";
import { useActor } from "./hooks/useActor";
import { useInternetIdentity } from "./hooks/useInternetIdentity";
import AdminDashboard from "./pages/AdminDashboard";
import BookDetailPage from "./pages/BookDetailPage";
import BooksPage from "./pages/BooksPage";
import CreatorDashboard from "./pages/CreatorDashboard";
import FilmDetailPage from "./pages/FilmDetailPage";
import FilmsPage from "./pages/FilmsPage";
import HomePage from "./pages/HomePage";
import LibraryPage from "./pages/LibraryPage";
import ProfileSetupPage from "./pages/ProfileSetupPage";

export type Page =
  | { name: "home" }
  | { name: "books" }
  | { name: "films" }
  | { name: "book"; id: string }
  | { name: "film"; id: string }
  | { name: "creator" }
  | { name: "admin" }
  | { name: "library" }
  | { name: "profile" };

export default function App() {
  const [page, setPage] = useState<Page>({ name: "home" });
  const { actor } = useActor();
  const { identity } = useInternetIdentity();
  const [userRole, setUserRole] = useState<UserRole | null>(null);

  useEffect(() => {
    if (actor && identity) {
      actor
        .getCallerUserRole()
        .then(setUserRole)
        .catch(() => {});
    } else if (!identity) {
      setUserRole(null);
    }
  }, [actor, identity]);

  const navigate = (p: Page) => setPage(p);

  const renderPage = () => {
    switch (page.name) {
      case "home":
        return <HomePage navigate={navigate} />;
      case "books":
        return <BooksPage navigate={navigate} />;
      case "films":
        return <FilmsPage navigate={navigate} />;
      case "book":
        return <BookDetailPage id={page.id} navigate={navigate} />;
      case "film":
        return <FilmDetailPage id={page.id} navigate={navigate} />;
      case "creator":
        return <CreatorDashboard navigate={navigate} />;
      case "admin":
        return <AdminDashboard navigate={navigate} />;
      case "library":
        return <LibraryPage navigate={navigate} />;
      case "profile":
        return <ProfileSetupPage navigate={navigate} />;
      default:
        return <HomePage navigate={navigate} />;
    }
  };

  return (
    <div className="min-h-screen bg-background">
      <Navbar navigate={navigate} currentPage={page.name} userRole={userRole} />
      <main>{renderPage()}</main>
      <Toaster />
    </div>
  );
}
