import { Button } from "@/components/ui/button";
import {
  BookOpen,
  Film,
  LayoutDashboard,
  Library,
  LogIn,
  LogOut,
  Shield,
  Star,
} from "lucide-react";
import type { Page } from "../App";
import { UserRole } from "../backend";
import { useInternetIdentity } from "../hooks/useInternetIdentity";

interface NavbarProps {
  navigate: (p: Page) => void;
  currentPage: string;
  userRole: UserRole | null;
}

export default function Navbar({
  navigate,
  currentPage,
  userRole,
}: NavbarProps) {
  const { identity, login, clear } = useInternetIdentity();

  return (
    <nav
      className="sticky top-0 z-50 border-b border-border bg-background/80 backdrop-blur-md"
      data-ocid="nav.panel"
    >
      <div className="container mx-auto flex items-center justify-between py-3 px-4">
        <button
          type="button"
          className="flex items-center gap-2 cursor-pointer"
          onClick={() => navigate({ name: "home" })}
          data-ocid="nav.home.link"
        >
          <Star className="h-6 w-6 text-primary" fill="currentColor" />
          <span className="font-display text-xl font-bold tracking-tight">
            STARWAVE
          </span>
        </button>
        <div className="flex items-center gap-1 sm:gap-2">
          <button
            type="button"
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-md text-sm transition-colors ${currentPage === "books" ? "bg-primary/20 text-primary" : "text-muted-foreground hover:text-foreground hover:bg-secondary"}`}
            onClick={() => navigate({ name: "books" })}
            data-ocid="nav.books.link"
          >
            <BookOpen className="h-4 w-4" />
            <span className="hidden sm:inline">Books</span>
          </button>
          <button
            type="button"
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-md text-sm transition-colors ${currentPage === "films" ? "bg-primary/20 text-primary" : "text-muted-foreground hover:text-foreground hover:bg-secondary"}`}
            onClick={() => navigate({ name: "films" })}
            data-ocid="nav.films.link"
          >
            <Film className="h-4 w-4" />
            <span className="hidden sm:inline">Films</span>
          </button>
          {identity && (
            <button
              type="button"
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-md text-sm transition-colors ${currentPage === "library" ? "bg-primary/20 text-primary" : "text-muted-foreground hover:text-foreground hover:bg-secondary"}`}
              onClick={() => navigate({ name: "library" })}
              data-ocid="nav.library.link"
            >
              <Library className="h-4 w-4" />
              <span className="hidden sm:inline">Library</span>
            </button>
          )}
          {identity &&
            (userRole === UserRole.user || userRole === UserRole.admin) && (
              <button
                type="button"
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-md text-sm transition-colors ${currentPage === "creator" ? "bg-primary/20 text-primary" : "text-muted-foreground hover:text-foreground hover:bg-secondary"}`}
                onClick={() => navigate({ name: "creator" })}
                data-ocid="nav.creator.link"
              >
                <LayoutDashboard className="h-4 w-4" />
                <span className="hidden sm:inline">Create</span>
              </button>
            )}
          {identity && userRole === UserRole.admin && (
            <button
              type="button"
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-md text-sm transition-colors ${currentPage === "admin" ? "bg-primary/20 text-primary" : "text-muted-foreground hover:text-foreground hover:bg-secondary"}`}
              onClick={() => navigate({ name: "admin" })}
              data-ocid="nav.admin.link"
            >
              <Shield className="h-4 w-4" />
              <span className="hidden sm:inline">Admin</span>
            </button>
          )}
          {identity ? (
            <Button
              variant="outline"
              size="sm"
              onClick={clear}
              className="ml-1"
              data-ocid="nav.logout.button"
            >
              <LogOut className="h-4 w-4 mr-1" />
              <span className="hidden sm:inline">Sign Out</span>
            </Button>
          ) : (
            <Button
              size="sm"
              onClick={login}
              className="ml-1"
              data-ocid="nav.login.button"
            >
              <LogIn className="h-4 w-4 mr-1" />
              Sign In
            </Button>
          )}
        </div>
      </div>
    </nav>
  );
}
