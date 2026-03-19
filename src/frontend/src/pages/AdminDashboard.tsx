import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Principal } from "@dfinity/principal";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
  Ban,
  BookOpen,
  CheckCircle,
  Copy,
  DollarSign,
  Film,
  Loader2,
  RotateCcw,
  Settings,
  Shield,
  Trash2,
  UserPlus,
  Users,
  XCircle,
} from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";
import type { Page } from "../App";
import type { StripeConfiguration } from "../backend";
import { UserRole } from "../backend";
import { useActor } from "../hooks/useActor";
import { useInternetIdentity } from "../hooks/useInternetIdentity";

interface AdminDashboardProps {
  navigate: (p: Page) => void;
}

interface UserProfileEntry {
  principal: Principal;
  name: string;
  role: string;
}

interface DeletedProfileEntry {
  principal: Principal;
  name: string;
  role: string;
}

export default function AdminDashboard({
  navigate: _navigate,
}: AdminDashboardProps) {
  const { actor } = useActor();
  const { identity, login } = useInternetIdentity();
  const queryClient = useQueryClient();
  const [stripeKey, setStripeKey] = useState("");
  const [isSavingStripe, setIsSavingStripe] = useState(false);
  const [principalInput, setPrincipalInput] = useState("");
  const [isAssigningAdmin, setIsAssigningAdmin] = useState(false);
  const [deletingId, setDeletingId] = useState<string | null>(null);

  const { data: isAdmin } = useQuery({
    queryKey: ["is-admin"],
    queryFn: () => actor!.isCallerAdmin(),
    enabled: !!actor && !!identity,
  });

  const { data: allBooks = [], isLoading: loadingBooks } = useQuery({
    queryKey: ["all-books"],
    queryFn: () => actor!.getAllBooks(),
    enabled: !!actor && !!identity && !!isAdmin,
  });

  const { data: allFilms = [], isLoading: loadingFilms } = useQuery({
    queryKey: ["all-films"],
    queryFn: () => actor!.getAllShortFilms(),
    enabled: !!actor && !!identity && !!isAdmin,
  });

  const { data: allPurchases = [], isLoading: loadingPurchases } = useQuery({
    queryKey: ["all-purchases"],
    queryFn: () => actor!.getAllPurchases(),
    enabled: !!actor && !!identity && !!isAdmin,
  });

  const { data: allUserProfiles = [], isLoading: loadingProfiles } = useQuery<
    UserProfileEntry[]
  >({
    queryKey: ["all-user-profiles"],
    queryFn: async () => {
      const result = await actor!.getAllUserProfiles();
      return (result ?? []) as UserProfileEntry[];
    },
    enabled: !!actor && !!identity && !!isAdmin,
  });

  const { data: deletedProfiles = [], isLoading: loadingDeleted } = useQuery<
    DeletedProfileEntry[]
  >({
    queryKey: ["deleted-profiles"],
    queryFn: async () => {
      const result = await actor!.getDeletedProfiles();
      return (result ?? []) as DeletedProfileEntry[];
    },
    enabled: !!actor && !!identity && !!isAdmin,
  });

  const { data: restrictedCreators = [] } = useQuery<Principal[]>({
    queryKey: ["restricted-creators"],
    queryFn: async () => {
      const result = await actor!.getRestrictedCreators();
      return (result ?? []) as Principal[];
    },
    enabled: !!actor && !!identity && !!isAdmin,
  });

  const restrictedSet = new Set(
    restrictedCreators.map((p: Principal) => p.toString()),
  );

  const approveMutation = useMutation({
    mutationFn: ({ id, type }: { id: string; type: string }) =>
      actor!.approveContent(id, type === "film" ? "shortFilm" : type),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["all-books"] });
      queryClient.invalidateQueries({ queryKey: ["all-films"] });
      toast.success("Content approved.");
    },
    onError: () => toast.error("Failed to approve."),
  });

  const rejectMutation = useMutation({
    mutationFn: ({ id, type }: { id: string; type: string }) =>
      actor!.rejectContent(id, type === "film" ? "shortFilm" : type),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["all-books"] });
      queryClient.invalidateQueries({ queryKey: ["all-films"] });
      toast.success("Content rejected.");
    },
    onError: () => toast.error("Failed to reject."),
  });

  const deleteUserMutation = useMutation({
    mutationFn: async (principal: Principal) => {
      await actor!.deleteUserProfile(principal);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["all-user-profiles"] });
      queryClient.invalidateQueries({ queryKey: ["deleted-profiles"] });
      toast.success("Account deleted successfully.");
    },
    onError: () => toast.error("Failed to delete account."),
  });

  const restoreUserMutation = useMutation({
    mutationFn: async (principal: Principal) => {
      await actor!.restoreUserProfile(principal);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["all-user-profiles"] });
      queryClient.invalidateQueries({ queryKey: ["deleted-profiles"] });
      toast.success("Account restored successfully.");
    },
    onError: () => toast.error("Failed to restore account."),
  });

  const restrictMutation = useMutation({
    mutationFn: async (principal: Principal) => {
      await actor!.restrictCreatorFromPublishing(principal);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["restricted-creators"] });
      toast.success("Creator restricted from publishing.");
    },
    onError: () => toast.error("Failed to restrict creator."),
  });

  const unrestrictMutation = useMutation({
    mutationFn: async (principal: Principal) => {
      await actor!.unrestrictCreatorFromPublishing(principal);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["restricted-creators"] });
      toast.success("Creator publishing restriction removed.");
    },
    onError: () => toast.error("Failed to unrestrict creator."),
  });

  const handleDeleteBook = async (id: string) => {
    if (!actor) return;
    if (!window.confirm("Delete this book permanently? This cannot be undone."))
      return;
    setDeletingId(id);
    try {
      await actor.deleteBook(id);
      queryClient.invalidateQueries({ queryKey: ["all-books"] });
      toast.success("Book deleted.");
    } catch {
      toast.error("Failed to delete book.");
    } finally {
      setDeletingId(null);
    }
  };

  const handleDeleteFilm = async (id: string) => {
    if (!actor) return;
    if (!window.confirm("Delete this film permanently? This cannot be undone."))
      return;
    setDeletingId(id);
    try {
      await actor.deleteShortFilm(id);
      queryClient.invalidateQueries({ queryKey: ["all-films"] });
      toast.success("Film deleted.");
    } catch {
      toast.error("Failed to delete film.");
    } finally {
      setDeletingId(null);
    }
  };

  const handleSaveStripe = async () => {
    if (!actor || !stripeKey) return;
    setIsSavingStripe(true);
    try {
      const config: StripeConfiguration = {
        secretKey: stripeKey,
        allowedCountries: ["IN", "US", "GB", "CA", "AU"],
      };
      await actor.setStripeConfiguration(config);
      toast.success(
        "Stripe configured! UPI payments (PhonePe, Google Pay, Paytm) are now enabled for India.",
      );
      setStripeKey("");
    } catch {
      toast.error("Failed to save Stripe config.");
    } finally {
      setIsSavingStripe(false);
    }
  };

  const handleMakeAdmin = async () => {
    if (!actor) return;
    if (!principalInput.trim()) {
      toast.error("Please enter a Principal ID");
      return;
    }
    let principal: Principal;
    try {
      principal = Principal.fromText(principalInput.trim());
    } catch {
      toast.error("Invalid Principal ID format");
      return;
    }
    setIsAssigningAdmin(true);
    try {
      await actor.assignRole(principal, UserRole.admin);
      toast.success("Admin access granted!");
      setPrincipalInput("");
    } catch {
      toast.error(
        "Failed to assign admin role. Make sure the Principal ID is correct.",
      );
    } finally {
      setIsAssigningAdmin(false);
    }
  };

  const handleCopyPrincipal = (principalStr: string) => {
    navigator.clipboard.writeText(principalStr);
    toast.success("Principal ID copied!");
  };

  const handleDeleteUser = (user: UserProfileEntry) => {
    if (
      !window.confirm(
        `Permanently delete account for "${user.name || "Unnamed"}"? This action cannot be undone.`,
      )
    )
      return;
    deleteUserMutation.mutate(user.principal);
  };

  const handleToggleRestrict = (user: UserProfileEntry) => {
    const principalStr = user.principal.toString();
    const isRestricted = restrictedSet.has(principalStr);
    if (isRestricted) {
      unrestrictMutation.mutate(user.principal);
    } else {
      if (
        !window.confirm(
          `Restrict "${user.name || "Unnamed"}" from publishing new content?`,
        )
      )
        return;
      restrictMutation.mutate(user.principal);
    }
  };

  const totalRevenue = allPurchases.reduce(
    (sum, p) => sum + Number(p.totalAmountCents),
    0,
  );
  const adminRevenue = allPurchases.reduce(
    (sum, p) => sum + Number(p.adminShareCents),
    0,
  );

  if (!identity) {
    return (
      <div className="container mx-auto px-4 py-20 text-center">
        <Shield className="h-16 w-16 mx-auto text-muted-foreground/30 mb-4" />
        <h2 className="font-display text-2xl font-bold mb-2">
          Admin Access Required
        </h2>
        <Button onClick={login} data-ocid="admin.login.button">
          Sign In
        </Button>
      </div>
    );
  }

  if (isAdmin === false) {
    return (
      <div className="container mx-auto px-4 py-20 text-center">
        <Shield className="h-16 w-16 mx-auto text-muted-foreground/30 mb-4" />
        <h2 className="font-display text-2xl font-bold mb-2">Access Denied</h2>
        <p className="text-muted-foreground">
          You do not have admin privileges.
        </p>
      </div>
    );
  }

  const pendingBooks = allBooks.filter((b) => !b.isPublished);
  const pendingFilms = allFilms.filter((f) => !f.isPublished);

  return (
    <div className="container mx-auto px-4 py-10">
      <div className="flex items-center gap-3 mb-8">
        <Shield className="h-8 w-8 text-primary" />
        <div>
          <h1 className="font-display text-4xl font-bold">Admin Dashboard</h1>
          <p className="text-muted-foreground mt-1">
            Manage content, users, and revenue.
          </p>
        </div>
      </div>
      <div className="grid grid-cols-2 sm:grid-cols-3 gap-4 mb-8">
        <div className="rounded-lg border border-border bg-card p-4">
          <p className="text-muted-foreground text-sm">Total Sales</p>
          <p className="text-2xl font-bold text-accent mt-1">
            ${(totalRevenue / 100).toFixed(2)}
          </p>
        </div>
        <div className="rounded-lg border border-border bg-card p-4">
          <p className="text-muted-foreground text-sm">Admin Revenue (40%)</p>
          <p className="text-2xl font-bold text-primary mt-1">
            ${(adminRevenue / 100).toFixed(2)}
          </p>
        </div>
        <div className="rounded-lg border border-border bg-card p-4">
          <p className="text-muted-foreground text-sm">Total Purchases</p>
          <p className="text-2xl font-bold mt-1">{allPurchases.length}</p>
        </div>
      </div>
      <Tabs defaultValue="content">
        <TabsList className="mb-6 flex-wrap h-auto" data-ocid="admin.tabs.tab">
          <TabsTrigger value="content">Content Review</TabsTrigger>
          <TabsTrigger value="all-content">All Content</TabsTrigger>
          <TabsTrigger value="purchases">
            <DollarSign className="h-4 w-4 mr-1" />
            Purchases
          </TabsTrigger>
          <TabsTrigger value="users" data-ocid="admin.users.tab">
            <Users className="h-4 w-4 mr-1" />
            Users
          </TabsTrigger>
          <TabsTrigger value="stripe">
            <Settings className="h-4 w-4 mr-1" />
            Stripe
          </TabsTrigger>
          <TabsTrigger value="team" data-ocid="admin.team.tab">
            <UserPlus className="h-4 w-4 mr-1" />
            Team
          </TabsTrigger>
        </TabsList>

        {/* Pending Review Tab */}
        <TabsContent value="content">
          <h2 className="font-semibold text-lg mb-4">
            Pending Review ({pendingBooks.length + pendingFilms.length})
          </h2>
          {loadingBooks || loadingFilms ? (
            <div className="space-y-3" data-ocid="admin.content.loading_state">
              {Array.from({ length: 3 }).map((_, i) => (
                // biome-ignore lint/suspicious/noArrayIndexKey: skeleton placeholders
                <Skeleton key={i} className="h-16 rounded-lg" />
              ))}
            </div>
          ) : pendingBooks.length + pendingFilms.length === 0 ? (
            <div
              className="text-center py-12 text-muted-foreground"
              data-ocid="admin.content.empty_state"
            >
              All content reviewed!
            </div>
          ) : (
            <div className="space-y-2">
              {pendingBooks.map((book, i) => (
                <div
                  key={book.id}
                  className="flex items-center justify-between p-4 rounded-lg border border-border bg-card"
                  data-ocid={`admin.books.item.${i + 1}`}
                >
                  <div>
                    <span className="font-semibold">{book.title}</span>
                    <Badge variant="secondary" className="ml-2">
                      Book
                    </Badge>
                    <p className="text-muted-foreground text-sm">
                      {book.genre}
                    </p>
                  </div>
                  <div className="flex gap-2">
                    <Button
                      size="sm"
                      onClick={() =>
                        approveMutation.mutate({ id: book.id, type: "book" })
                      }
                      data-ocid={`admin.books.approve.button.${i + 1}`}
                    >
                      <CheckCircle className="h-4 w-4 mr-1" />
                      Approve
                    </Button>
                    <Button
                      size="sm"
                      variant="destructive"
                      onClick={() =>
                        rejectMutation.mutate({ id: book.id, type: "book" })
                      }
                      data-ocid={`admin.books.reject.button.${i + 1}`}
                    >
                      <XCircle className="h-4 w-4 mr-1" />
                      Reject
                    </Button>
                    <Button
                      size="sm"
                      variant="outline"
                      className="text-destructive border-destructive hover:bg-destructive hover:text-destructive-foreground"
                      onClick={() => handleDeleteBook(book.id)}
                      disabled={deletingId === book.id}
                    >
                      {deletingId === book.id ? (
                        <Loader2 className="h-4 w-4 animate-spin" />
                      ) : (
                        <Trash2 className="h-4 w-4" />
                      )}
                    </Button>
                  </div>
                </div>
              ))}
              {pendingFilms.map((film, i) => (
                <div
                  key={film.id}
                  className="flex items-center justify-between p-4 rounded-lg border border-border bg-card"
                  data-ocid={`admin.films.item.${i + 1}`}
                >
                  <div>
                    <span className="font-semibold">{film.title}</span>
                    <Badge variant="outline" className="ml-2">
                      Film
                    </Badge>
                    <p className="text-muted-foreground text-sm">
                      {film.genre}
                    </p>
                  </div>
                  <div className="flex gap-2">
                    <Button
                      size="sm"
                      onClick={() =>
                        approveMutation.mutate({ id: film.id, type: "film" })
                      }
                      data-ocid={`admin.films.approve.button.${i + 1}`}
                    >
                      <CheckCircle className="h-4 w-4 mr-1" />
                      Approve
                    </Button>
                    <Button
                      size="sm"
                      variant="destructive"
                      onClick={() =>
                        rejectMutation.mutate({ id: film.id, type: "film" })
                      }
                      data-ocid={`admin.films.reject.button.${i + 1}`}
                    >
                      <XCircle className="h-4 w-4 mr-1" />
                      Reject
                    </Button>
                    <Button
                      size="sm"
                      variant="outline"
                      className="text-destructive border-destructive hover:bg-destructive hover:text-destructive-foreground"
                      onClick={() => handleDeleteFilm(film.id)}
                      disabled={deletingId === film.id}
                    >
                      {deletingId === film.id ? (
                        <Loader2 className="h-4 w-4 animate-spin" />
                      ) : (
                        <Trash2 className="h-4 w-4" />
                      )}
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </TabsContent>

        {/* All Content Tab with delete for published items */}
        <TabsContent value="all-content">
          <div className="space-y-6">
            <div>
              <h2 className="font-semibold text-lg mb-3 flex items-center gap-2">
                <BookOpen className="h-5 w-5" />
                All Books ({allBooks.length})
              </h2>
              {loadingBooks ? (
                <div className="space-y-2">
                  {Array.from({ length: 3 }).map((_, i) => (
                    // biome-ignore lint/suspicious/noArrayIndexKey: skeleton
                    <Skeleton key={i} className="h-14 rounded-lg" />
                  ))}
                </div>
              ) : allBooks.length === 0 ? (
                <p className="text-muted-foreground text-sm py-4">
                  No books uploaded yet.
                </p>
              ) : (
                <div className="space-y-2">
                  {allBooks.map((book, i) => (
                    <div
                      key={book.id}
                      className="flex items-center justify-between p-3 rounded-lg border border-border bg-card"
                    >
                      <div className="flex items-center gap-3">
                        <div>
                          <span className="font-medium text-sm">
                            {book.title}
                          </span>
                          <div className="flex items-center gap-2 mt-0.5">
                            <span className="text-muted-foreground text-xs">
                              {book.genre}
                            </span>
                            <Badge
                              variant={
                                book.isPublished ? "default" : "secondary"
                              }
                              className="text-xs py-0"
                            >
                              {book.isPublished ? "Live" : "Pending"}
                            </Badge>
                          </div>
                        </div>
                      </div>
                      <Button
                        size="sm"
                        variant="destructive"
                        onClick={() => handleDeleteBook(book.id)}
                        disabled={deletingId === book.id}
                        data-ocid={`admin.all_books.delete.button.${i + 1}`}
                      >
                        {deletingId === book.id ? (
                          <Loader2 className="h-4 w-4 animate-spin mr-1" />
                        ) : (
                          <Trash2 className="h-4 w-4 mr-1" />
                        )}
                        Delete
                      </Button>
                    </div>
                  ))}
                </div>
              )}
            </div>

            <div>
              <h2 className="font-semibold text-lg mb-3 flex items-center gap-2">
                <Film className="h-5 w-5" />
                All Films ({allFilms.length})
              </h2>
              {loadingFilms ? (
                <div className="space-y-2">
                  {Array.from({ length: 3 }).map((_, i) => (
                    // biome-ignore lint/suspicious/noArrayIndexKey: skeleton
                    <Skeleton key={i} className="h-14 rounded-lg" />
                  ))}
                </div>
              ) : allFilms.length === 0 ? (
                <p className="text-muted-foreground text-sm py-4">
                  No films uploaded yet.
                </p>
              ) : (
                <div className="space-y-2">
                  {allFilms.map((film, i) => (
                    <div
                      key={film.id}
                      className="flex items-center justify-between p-3 rounded-lg border border-border bg-card"
                    >
                      <div>
                        <span className="font-medium text-sm">
                          {film.title}
                        </span>
                        <div className="flex items-center gap-2 mt-0.5">
                          <span className="text-muted-foreground text-xs">
                            {film.genre}
                          </span>
                          <Badge
                            variant={film.isPublished ? "default" : "secondary"}
                            className="text-xs py-0"
                          >
                            {film.isPublished ? "Live" : "Pending"}
                          </Badge>
                        </div>
                      </div>
                      <Button
                        size="sm"
                        variant="destructive"
                        onClick={() => handleDeleteFilm(film.id)}
                        disabled={deletingId === film.id}
                        data-ocid={`admin.all_films.delete.button.${i + 1}`}
                      >
                        {deletingId === film.id ? (
                          <Loader2 className="h-4 w-4 animate-spin mr-1" />
                        ) : (
                          <Trash2 className="h-4 w-4 mr-1" />
                        )}
                        Delete
                      </Button>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </TabsContent>

        <TabsContent value="purchases">
          {loadingPurchases ? (
            <div data-ocid="admin.purchases.loading_state">
              <Skeleton className="h-64 rounded-lg" />
            </div>
          ) : allPurchases.length === 0 ? (
            <div
              className="text-center py-12 text-muted-foreground"
              data-ocid="admin.purchases.empty_state"
            >
              No purchases yet.
            </div>
          ) : (
            <div className="rounded-lg border border-border overflow-hidden">
              <Table data-ocid="admin.purchases.table">
                <TableHeader>
                  <TableRow>
                    <TableHead>Date</TableHead>
                    <TableHead>Book</TableHead>
                    <TableHead>Total</TableHead>
                    <TableHead>Creator (60%)</TableHead>
                    <TableHead>Admin (40%)</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {allPurchases.map((p, i) => (
                    <TableRow
                      key={p.id}
                      data-ocid={`admin.purchases.row.${i + 1}`}
                    >
                      <TableCell className="text-sm text-muted-foreground">
                        {new Date(
                          Number(p.purchasedAt) / 1_000_000,
                        ).toLocaleDateString()}
                      </TableCell>
                      <TableCell className="text-sm">
                        {p.bookId.slice(0, 8)}...
                      </TableCell>
                      <TableCell>
                        ${(Number(p.totalAmountCents) / 100).toFixed(2)}
                      </TableCell>
                      <TableCell className="text-accent">
                        ${(Number(p.creatorShareCents) / 100).toFixed(2)}
                      </TableCell>
                      <TableCell className="text-primary">
                        ${(Number(p.adminShareCents) / 100).toFixed(2)}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
        </TabsContent>

        {/* Users Tab */}
        <TabsContent value="users">
          {/* Active Users Section */}
          <div className="mb-8">
            <div className="flex items-center justify-between mb-4">
              <h2 className="font-semibold text-lg">
                Active Accounts ({allUserProfiles.length})
              </h2>
            </div>
            {loadingProfiles ? (
              <div className="space-y-3" data-ocid="admin.users.loading_state">
                {Array.from({ length: 4 }).map((_, i) => (
                  // biome-ignore lint/suspicious/noArrayIndexKey: skeleton placeholders
                  <Skeleton key={i} className="h-14 rounded-lg" />
                ))}
              </div>
            ) : allUserProfiles.length === 0 ? (
              <div
                className="text-center py-12 text-muted-foreground"
                data-ocid="admin.users.empty_state"
              >
                <Users className="h-12 w-12 mx-auto mb-3 opacity-25" />
                <p>No profiles saved yet.</p>
                <p className="text-sm mt-1">
                  Users who save their profile will appear here.
                </p>
              </div>
            ) : (
              <div className="rounded-lg border border-border overflow-hidden">
                <Table data-ocid="admin.users.table">
                  <TableHeader>
                    <TableRow>
                      <TableHead>Name</TableHead>
                      <TableHead>Role</TableHead>
                      <TableHead>Principal ID</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead className="text-right">Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {allUserProfiles.map((user, i) => {
                      const principalStr = user.principal.toString();
                      const truncated = `${principalStr.slice(0, 10)}...${principalStr.slice(-6)}`;
                      const isCreator =
                        user.role === "creator" ||
                        user.role === "writer" ||
                        user.role === "director";
                      const isRestricted = restrictedSet.has(principalStr);
                      const isDeletingUser =
                        deleteUserMutation.isPending &&
                        deleteUserMutation.variables?.toString() ===
                          principalStr;
                      const isRestrictingUser =
                        (restrictMutation.isPending ||
                          unrestrictMutation.isPending) &&
                        (restrictMutation.variables?.toString() ===
                          principalStr ||
                          unrestrictMutation.variables?.toString() ===
                            principalStr);
                      return (
                        <TableRow
                          key={principalStr}
                          data-ocid={`admin.users.row.${i + 1}`}
                        >
                          <TableCell className="font-medium">
                            {user.name || (
                              <span className="text-muted-foreground italic">
                                Unnamed
                              </span>
                            )}
                          </TableCell>
                          <TableCell>
                            <Badge
                              variant={
                                user.role === "admin" ? "default" : "secondary"
                              }
                            >
                              {user.role}
                            </Badge>
                          </TableCell>
                          <TableCell>
                            <div className="flex items-center gap-2">
                              <span className="font-mono text-xs text-muted-foreground">
                                {truncated}
                              </span>
                              <Button
                                size="icon"
                                variant="ghost"
                                className="h-6 w-6"
                                onClick={() =>
                                  handleCopyPrincipal(principalStr)
                                }
                                data-ocid={`admin.users.copy.button.${i + 1}`}
                                title="Copy Principal ID"
                              >
                                <Copy className="h-3 w-3" />
                              </Button>
                            </div>
                          </TableCell>
                          <TableCell>
                            {isCreator && isRestricted ? (
                              <Badge variant="destructive" className="text-xs">
                                Restricted
                              </Badge>
                            ) : (
                              <Badge
                                variant="outline"
                                className="text-xs text-green-400 border-green-400/40"
                              >
                                Active
                              </Badge>
                            )}
                          </TableCell>
                          <TableCell className="text-right">
                            <div className="flex items-center justify-end gap-1.5">
                              {isCreator && (
                                <Button
                                  size="sm"
                                  variant="outline"
                                  className={
                                    isRestricted
                                      ? "border-green-500/40 text-green-400 hover:bg-green-500/10 hover:text-green-300 text-xs px-2"
                                      : "border-yellow-500/40 text-yellow-400 hover:bg-yellow-500/10 hover:text-yellow-300 text-xs px-2"
                                  }
                                  onClick={() => handleToggleRestrict(user)}
                                  disabled={isRestrictingUser}
                                  data-ocid={
                                    isRestricted
                                      ? `admin.users.unrestrict.button.${i + 1}`
                                      : `admin.users.restrict.button.${i + 1}`
                                  }
                                  title={
                                    isRestricted
                                      ? "Allow publishing"
                                      : "Restrict from publishing"
                                  }
                                >
                                  {isRestrictingUser ? (
                                    <Loader2 className="h-3 w-3 animate-spin" />
                                  ) : isRestricted ? (
                                    <>
                                      <CheckCircle className="h-3 w-3 mr-1" />
                                      Unrestrict
                                    </>
                                  ) : (
                                    <>
                                      <Ban className="h-3 w-3 mr-1" />
                                      Restrict
                                    </>
                                  )}
                                </Button>
                              )}
                              <Button
                                size="sm"
                                variant="outline"
                                className="border-destructive/40 text-destructive hover:bg-destructive/10 text-xs px-2"
                                onClick={() => handleDeleteUser(user)}
                                disabled={isDeletingUser}
                                data-ocid={`admin.users.delete_button.${i + 1}`}
                                title="Delete account"
                              >
                                {isDeletingUser ? (
                                  <Loader2 className="h-3 w-3 animate-spin" />
                                ) : (
                                  <>
                                    <Trash2 className="h-3 w-3 mr-1" />
                                    Delete
                                  </>
                                )}
                              </Button>
                            </div>
                          </TableCell>
                        </TableRow>
                      );
                    })}
                  </TableBody>
                </Table>
              </div>
            )}
          </div>

          {/* Deleted Accounts Section */}
          <div>
            <div className="flex items-center gap-2 mb-4">
              <Trash2 className="h-5 w-5 text-destructive/70" />
              <h2 className="font-semibold text-lg">
                Deleted Accounts ({deletedProfiles.length})
              </h2>
            </div>
            {loadingDeleted ? (
              <div
                className="space-y-3"
                data-ocid="admin.deleted_users.loading_state"
              >
                {Array.from({ length: 2 }).map((_, i) => (
                  // biome-ignore lint/suspicious/noArrayIndexKey: skeleton
                  <Skeleton key={i} className="h-14 rounded-lg" />
                ))}
              </div>
            ) : deletedProfiles.length === 0 ? (
              <div
                className="text-center py-10 text-muted-foreground border border-dashed border-border rounded-lg"
                data-ocid="admin.deleted_users.empty_state"
              >
                <p className="text-sm">No deleted accounts.</p>
              </div>
            ) : (
              <div className="rounded-lg border border-border overflow-hidden">
                <Table data-ocid="admin.deleted_users.table">
                  <TableHeader>
                    <TableRow>
                      <TableHead>Name</TableHead>
                      <TableHead>Role</TableHead>
                      <TableHead>Principal ID</TableHead>
                      <TableHead className="text-right">Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {deletedProfiles.map((user, i) => {
                      const principalStr = user.principal.toString();
                      const truncated = `${principalStr.slice(0, 10)}...${principalStr.slice(-6)}`;
                      const isRestoringUser =
                        restoreUserMutation.isPending &&
                        restoreUserMutation.variables?.toString() ===
                          principalStr;
                      return (
                        <TableRow
                          key={principalStr}
                          className="opacity-70"
                          data-ocid={`admin.deleted_users.row.${i + 1}`}
                        >
                          <TableCell className="font-medium">
                            {user.name || (
                              <span className="text-muted-foreground italic">
                                Unnamed
                              </span>
                            )}
                          </TableCell>
                          <TableCell>
                            <Badge variant="outline" className="text-xs">
                              {user.role}
                            </Badge>
                          </TableCell>
                          <TableCell>
                            <div className="flex items-center gap-2">
                              <span className="font-mono text-xs text-muted-foreground">
                                {truncated}
                              </span>
                              <Button
                                size="icon"
                                variant="ghost"
                                className="h-6 w-6"
                                onClick={() =>
                                  handleCopyPrincipal(principalStr)
                                }
                                title="Copy Principal ID"
                              >
                                <Copy className="h-3 w-3" />
                              </Button>
                            </div>
                          </TableCell>
                          <TableCell className="text-right">
                            <Button
                              size="sm"
                              variant="outline"
                              className="border-green-500/40 text-green-400 hover:bg-green-500/10 hover:text-green-300 text-xs px-2"
                              onClick={() =>
                                restoreUserMutation.mutate(user.principal)
                              }
                              disabled={isRestoringUser}
                              data-ocid={`admin.deleted_users.restore.button.${i + 1}`}
                              title="Restore account"
                            >
                              {isRestoringUser ? (
                                <Loader2 className="h-3 w-3 animate-spin" />
                              ) : (
                                <>
                                  <RotateCcw className="h-3 w-3 mr-1" />
                                  Restore
                                </>
                              )}
                            </Button>
                          </TableCell>
                        </TableRow>
                      );
                    })}
                  </TableBody>
                </Table>
              </div>
            )}
          </div>
        </TabsContent>

        <TabsContent value="stripe">
          <div className="max-w-md">
            <h2 className="font-semibold text-lg mb-4">Stripe Configuration</h2>
            <p className="text-muted-foreground text-sm mb-4">
              Enter your Stripe secret key to enable purchases. UPI payments
              (PhonePe, Google Pay, Paytm) are enabled for India. Creators earn
              60%, you keep 40%.
            </p>
            <div className="space-y-4">
              <div>
                <Label htmlFor="stripe-key">Stripe Secret Key</Label>
                <Input
                  id="stripe-key"
                  type="password"
                  value={stripeKey}
                  onChange={(e) => setStripeKey(e.target.value)}
                  placeholder="sk_live_..."
                  className="mt-1"
                  data-ocid="admin.stripe_key.input"
                />
              </div>
              <Button
                onClick={handleSaveStripe}
                disabled={!stripeKey || isSavingStripe}
                data-ocid="admin.stripe.save.submit_button"
              >
                {isSavingStripe ? (
                  <Loader2 className="h-4 w-4 animate-spin mr-2" />
                ) : null}
                Save Configuration
              </Button>
            </div>
          </div>
        </TabsContent>
        <TabsContent value="team">
          <div className="max-w-md">
            <h2 className="font-semibold text-lg mb-2">Add Admin</h2>
            <p className="text-muted-foreground text-sm mb-6">
              Enter a user's Principal ID to grant them admin access. They can
              find their Principal ID by signing in and checking their profile.
            </p>
            <div className="space-y-4">
              <div>
                <Label htmlFor="principal-id">User Principal ID</Label>
                <Input
                  id="principal-id"
                  type="text"
                  value={principalInput}
                  onChange={(e) => setPrincipalInput(e.target.value)}
                  placeholder="aaaaa-bbbbb-ccccc-ddddd-eee"
                  className="mt-1 font-mono text-sm"
                  data-ocid="admin.team.input"
                />
              </div>
              <Button
                onClick={handleMakeAdmin}
                disabled={isAssigningAdmin}
                data-ocid="admin.team.submit_button"
              >
                {isAssigningAdmin ? (
                  <Loader2 className="h-4 w-4 animate-spin mr-2" />
                ) : (
                  <UserPlus className="h-4 w-4 mr-2" />
                )}
                {isAssigningAdmin ? "Granting Access..." : "Make Admin"}
              </Button>
            </div>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}
