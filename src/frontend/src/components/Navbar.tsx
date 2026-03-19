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
  User,
  Users,
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
      className="sticky top-0 z-50 border-b border-border/60 bg-background/75 backdrop-blur-xl shadow-header"
      data-ocid="nav.panel"
    >
      <div className="container mx-auto flex items-center justify-between py-3 px-4">
        {/* Logo */}
        <button
          type="button"
          className="flex items-center gap-2 cursor-pointer group"
          onClick={() => navigate({ name: "home" })}
          data-ocid="nav.home.link"
        >
          <Star
            className="h-6 w-6 text-primary group-hover:drop-shadow-[0_0_8px_oklch(0.65_0.25_270/0.9)] transition-all duration-300 shimmer"
            fill="currentColor"
          />
          <span className="font-display text-xl font-bold tracking-tight bg-gradient-to-r from-primary via-accent to-primary bg-clip-text text-transparent">
            STARWAVE
          </span>
        </button>

        {/* Nav links */}
        <div className="flex items-center gap-1 sm:gap-1.5">
          {(
            [
              { name: "books" as const, icon: BookOpen, label: "Books" },
              { name: "films" as const, icon: Film, label: "Films" },
              { name: "creators" as const, icon: Users, label: "Creators" },
            ] as const
          ).map(({ name, icon: Icon, label }) => (
            <button
              key={name}
              type="button"
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-md text-sm font-medium transition-all duration-200 ${
                currentPage === name
                  ? "bg-primary/15 text-primary shadow-glow-blue ring-1 ring-primary/30"
                  : "text-muted-foreground hover:text-foreground hover:bg-secondary/80"
              }`}
              onClick={() => navigate({ name })}
              data-ocid={`nav.${name}.link`}
            >
              <Icon
                className={`h-4 w-4 transition-all duration-200 ${
                  currentPage === name
                    ? "text-primary drop-shadow-[0_0_4px_oklch(0.65_0.25_270/0.8)]"
                    : ""
                }`}
              />
              <span className="hidden sm:inline">{label}</span>
            </button>
          ))}

          {identity && (
            <button
              type="button"
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-md text-sm font-medium transition-all duration-200 ${
                currentPage === "library"
                  ? "bg-primary/15 text-primary shadow-glow-blue ring-1 ring-primary/30"
                  : "text-muted-foreground hover:text-foreground hover:bg-secondary/80"
              }`}
              onClick={() => navigate({ name: "library" })}
              data-ocid="nav.library.link"
            >
              <Library
                className={`h-4 w-4 ${currentPage === "library" ? "text-primary" : ""}`}
              />
              <span className="hidden sm:inline">Library</span>
            </button>
          )}

          {identity &&
            (userRole === UserRole.user || userRole === UserRole.admin) && (
              <button
                type="button"
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-md text-sm font-medium transition-all duration-200 ${
                  currentPage === "creator"
                    ? "bg-primary/15 text-primary shadow-glow-blue ring-1 ring-primary/30"
                    : "text-muted-foreground hover:text-foreground hover:bg-secondary/80"
                }`}
                onClick={() => navigate({ name: "creator" })}
                data-ocid="nav.creator.link"
              >
                <LayoutDashboard
                  className={`h-4 w-4 ${currentPage === "creator" ? "text-primary" : ""}`}
                />
                <span className="hidden sm:inline">Create</span>
              </button>
            )}

          {identity && userRole === UserRole.admin && (
            <button
              type="button"
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-md text-sm font-medium transition-all duration-200 ${
                currentPage === "admin"
                  ? "bg-primary/15 text-primary shadow-glow-blue ring-1 ring-primary/30"
                  : "text-muted-foreground hover:text-foreground hover:bg-secondary/80"
              }`}
              onClick={() => navigate({ name: "admin" })}
              data-ocid="nav.admin.link"
            >
              <Shield
                className={`h-4 w-4 ${currentPage === "admin" ? "text-primary" : ""}`}
              />
              <span className="hidden sm:inline">Admin</span>
            </button>
          )}

          {identity && (
            <button
              type="button"
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-md text-sm font-medium transition-all duration-200 ${
                currentPage === "profile"
                  ? "bg-primary/15 text-primary shadow-glow-blue ring-1 ring-primary/30"
                  : "text-muted-foreground hover:text-foreground hover:bg-secondary/80"
              }`}
              onClick={() => navigate({ name: "profile" })}
              data-ocid="nav.profile.link"
            >
              <User
                className={`h-4 w-4 ${currentPage === "profile" ? "text-primary" : ""}`}
              />
              <span className="hidden sm:inline">Profile</span>
            </button>
          )}

          {identity ? (
            <Button
              variant="outline"
              size="sm"
              onClick={clear}
              className="ml-1 border-border/60 hover:border-primary/50 hover:shadow-glow-blue transition-all duration-200"
              data-ocid="nav.logout.button"
            >
              <LogOut className="h-4 w-4 mr-1" />
              <span className="hidden sm:inline">Sign Out</span>
            </Button>
          ) : (
            <Button
              size="sm"
              onClick={login}
              className="ml-1 shadow-glow-blue hover:shadow-glow-purple active:scale-95 transition-all duration-200"
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
