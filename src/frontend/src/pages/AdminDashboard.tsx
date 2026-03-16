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
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
  CheckCircle,
  DollarSign,
  Loader2,
  Settings,
  Shield,
  XCircle,
} from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";
import type { Page } from "../App";
import type { StripeConfiguration } from "../backend";
import { useActor } from "../hooks/useActor";
import { useInternetIdentity } from "../hooks/useInternetIdentity";

interface AdminDashboardProps {
  navigate: (p: Page) => void;
}

export default function AdminDashboard({
  navigate: _navigate,
}: AdminDashboardProps) {
  const { actor } = useActor();
  const { identity, login } = useInternetIdentity();
  const queryClient = useQueryClient();
  const [stripeKey, setStripeKey] = useState("");
  const [isSavingStripe, setIsSavingStripe] = useState(false);

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

  const approveMutation = useMutation({
    mutationFn: ({ id, type }: { id: string; type: string }) =>
      actor!.approveContent(id, type),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["all-books"] });
      queryClient.invalidateQueries({ queryKey: ["all-films"] });
      toast.success("Content approved.");
    },
    onError: () => toast.error("Failed to approve."),
  });

  const rejectMutation = useMutation({
    mutationFn: ({ id, type }: { id: string; type: string }) =>
      actor!.rejectContent(id, type),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["all-books"] });
      queryClient.invalidateQueries({ queryKey: ["all-films"] });
      toast.success("Content rejected.");
    },
    onError: () => toast.error("Failed to reject."),
  });

  const handleSaveStripe = async () => {
    if (!actor || !stripeKey) return;
    setIsSavingStripe(true);
    try {
      const config: StripeConfiguration = {
        secretKey: stripeKey,
        allowedCountries: ["US", "GB", "CA", "AU"],
      };
      await actor.setStripeConfiguration(config);
      toast.success("Stripe configured!");
      setStripeKey("");
    } catch {
      toast.error("Failed to save Stripe config.");
    } finally {
      setIsSavingStripe(false);
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
        <TabsList className="mb-6" data-ocid="admin.tabs.tab">
          <TabsTrigger value="content">Content Review</TabsTrigger>
          <TabsTrigger value="purchases">
            <DollarSign className="h-4 w-4 mr-1" />
            Purchases
          </TabsTrigger>
          <TabsTrigger value="stripe">
            <Settings className="h-4 w-4 mr-1" />
            Stripe
          </TabsTrigger>
        </TabsList>
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
                  </div>
                </div>
              ))}
            </div>
          )}
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
        <TabsContent value="stripe">
          <div className="max-w-md">
            <h2 className="font-semibold text-lg mb-4">Stripe Configuration</h2>
            <p className="text-muted-foreground text-sm mb-4">
              Enter your Stripe secret key to enable book purchases. Creators
              earn 60%, you keep 40%.
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
      </Tabs>
    </div>
  );
}
