import { Button } from "@/components/ui/button";
import { Toaster } from "@/components/ui/sonner";
import { Crown, Shield } from "lucide-react";
import { AnimatePresence, motion } from "motion/react";
import { useEffect, useState } from "react";
import { toast } from "sonner";
import type { UserRole } from "./backend";
import { UserRole as UserRoleEnum } from "./backend";
import Navbar from "./components/Navbar";
import { useActor } from "./hooks/useActor";
import { useInternetIdentity } from "./hooks/useInternetIdentity";
import AdminDashboard from "./pages/AdminDashboard";
import BookDetailPage from "./pages/BookDetailPage";
import BooksPage from "./pages/BooksPage";
import CreatorDashboard from "./pages/CreatorDashboard";
import CreatorProfilePage from "./pages/CreatorProfilePage";
import CreatorsPage from "./pages/CreatorsPage";
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
  | { name: "creators" }
  | { name: "creator-profile"; id: string }
  | { name: "admin" }
  | { name: "library" }
  | { name: "profile" };

export default function App() {
  const [page, setPage] = useState<Page>({ name: "home" });
  const { actor } = useActor();
  const { identity } = useInternetIdentity();
  const [userRole, setUserRole] = useState<UserRole | null>(null);
  const [roleLoaded, setRoleLoaded] = useState(false);
  const [adminAssigned, setAdminAssigned] = useState<boolean>(true); // default true = hide banner until confirmed
  const [isClaiming, setIsClaiming] = useState(false);

  useEffect(() => {
    if (actor && identity) {
      setRoleLoaded(false);
      Promise.all([actor.getCallerUserRole(), actor.hasAdminBeenAssigned()])
        .then(([role, assigned]) => {
          setUserRole(role as UserRole);
          setAdminAssigned(assigned);
          setRoleLoaded(true);
        })
        .catch(() => {
          setUserRole(UserRoleEnum.guest);
          setAdminAssigned(true);
          setRoleLoaded(true);
        });
    } else if (!identity) {
      setUserRole(null);
      setAdminAssigned(true);
      setRoleLoaded(false);
    }
  }, [actor, identity]);

  const handleClaimAdmin = async () => {
    if (!actor) return;
    setIsClaiming(true);
    try {
      const result = await actor.claimFirstAdmin();
      if (result === true) {
        const role = await actor.getCallerUserRole();
        setUserRole(role);
        setAdminAssigned(true);
        toast.success("You are now the admin! Opening Admin Dashboard...");
        setPage({ name: "admin" });
      } else {
        toast.error("Admin has already been claimed by another user.");
        const role = await actor.getCallerUserRole();
        setUserRole(role);
        setAdminAssigned(true);
      }
    } catch {
      toast.error("Failed to claim admin. Please try again.");
    } finally {
      setIsClaiming(false);
    }
  };

  const navigate = (p: Page) => setPage(p);

  // Show banner only when:
  // 1. User is signed in
  // 2. Role data has loaded
  // 3. No admin has been assigned yet in the system
  // 4. Current user is not already an admin
  const showClaimBanner =
    !!identity &&
    roleLoaded &&
    !adminAssigned &&
    userRole !== UserRoleEnum.admin;

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
      case "creators":
        return <CreatorsPage navigate={navigate} />;
      case "creator-profile":
        return <CreatorProfilePage id={page.id} navigate={navigate} />;
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

      <AnimatePresence>
        {showClaimBanner && (
          <motion.div
            key="claim-banner"
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            transition={{ duration: 0.3 }}
            style={{ backgroundColor: "#fbbf24", color: "#1c1917" }}
            className="relative z-40 shadow-lg"
            data-ocid="admin.claim_banner"
          >
            <div className="container mx-auto flex flex-col sm:flex-row items-center justify-between gap-3 px-4 py-4">
              <div className="flex items-center gap-3">
                <Crown className="h-6 w-6 shrink-0 text-amber-900" />
                <div>
                  <p className="text-sm font-bold text-amber-950">
                    🎬 Claim Admin Access for STARWAVE CREATIONS!
                  </p>
                  <p className="text-xs text-amber-800">
                    Manage content, users, and revenue for STARWAVE CREATIONS.
                  </p>
                </div>
              </div>
              <Button
                size="default"
                onClick={handleClaimAdmin}
                disabled={isClaiming}
                style={{ backgroundColor: "#1c1917", color: "#fef3c7" }}
                className="shrink-0 font-bold hover:opacity-90"
                data-ocid="admin.claim.button"
              >
                <Shield className="h-4 w-4 mr-2" />
                {isClaiming ? "Claiming..." : "Claim Admin Now"}
              </Button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      <main>{renderPage()}</main>
      <Toaster />
    </div>
  );
}
