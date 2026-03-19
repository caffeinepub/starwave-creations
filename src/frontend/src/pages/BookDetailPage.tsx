import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import {
  ArrowLeft,
  BookOpen,
  CreditCard,
  Download,
  Loader2,
  MapPin,
  ShieldCheck,
  ShoppingCart,
  Smartphone,
} from "lucide-react";
import { useEffect, useState } from "react";
import { toast } from "sonner";
import type { Page } from "../App";
import type { ExternalBlob } from "../backend";
import { useActor } from "../hooks/useActor";
import { useInternetIdentity } from "../hooks/useInternetIdentity";
import { formatINR, unwrapOptionalBigint } from "../lib/bookPricing";

interface BookDetailProps {
  id: string;
  navigate: (p: Page) => void;
}

export default function BookDetailPage({ id, navigate }: BookDetailProps) {
  const { actor } = useActor();
  const { identity, login } = useInternetIdentity();
  const queryClient = useQueryClient();
  const [isPurchasing, setIsPurchasing] = useState(false);

  const { data: book, isLoading } = useQuery({
    queryKey: ["book", id],
    queryFn: () => actor!.getBook(id),
    enabled: !!actor,
  });

  const { data: myPurchases = [] } = useQuery({
    queryKey: ["my-purchases"],
    queryFn: () => actor!.getMyPurchases(),
    enabled: !!actor && !!identity,
  });

  const { data: isAdmin } = useQuery({
    queryKey: ["is-admin"],
    queryFn: () => actor!.isCallerAdmin(),
    enabled: !!actor && !!identity,
  });

  // Fetch offline price from separate backend map
  const { data: offlinePriceRaw } = useQuery({
    queryKey: ["book-offline-price", id],
    queryFn: async () => {
      const a = actor as any;
      if (typeof a.getBookOfflinePrice === "function") {
        return a.getBookOfflinePrice(id) as Promise<[] | [bigint]>;
      }
      return [] as [] | [bigint];
    },
    enabled: !!actor && !!book,
  });

  // After Stripe redirect: verify session and record purchase
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const sessionId = params.get("session_id");
    const isPurchaseSuccess = params.get("purchase") === "success";
    if (!sessionId || !isPurchaseSuccess || !actor || !identity) return;

    // Remove params from URL immediately
    window.history.replaceState({}, "", window.location.pathname);

    const recordPurchase = async () => {
      const toastId = toast.loading("Verifying your payment...");
      try {
        const status = await actor.getStripeSessionStatus(sessionId);
        if (
          (status as any).__kind__ === "completed" ||
          (status as any).status === "complete"
        ) {
          const bookData = await actor.getBook(id);
          if (bookData) {
            const purchaseRecord = {
              id: `${Date.now()}-${Math.random().toString(36).slice(2)}`,
              bookId: id,
              buyerPrincipal: identity.getPrincipal(),
              creatorPrincipal: bookData.author,
              totalAmountCents: bookData.priceCents,
              creatorShareCents: BigInt(
                Math.floor(Number(bookData.priceCents) * 0.6),
              ),
              adminShareCents: BigInt(
                Math.floor(Number(bookData.priceCents) * 0.4),
              ),
              stripePaymentIntentId: sessionId,
              purchasedAt: BigInt(Date.now()),
            };
            await actor.addPurchase(purchaseRecord);
            toast.dismiss(toastId);
            toast.success("Purchase confirmed! You now have full access.");
            queryClient.invalidateQueries();
          }
        } else {
          toast.dismiss(toastId);
          toast.error("Payment verification failed. Contact support.");
        }
      } catch {
        toast.dismiss(toastId);
        toast.error("Could not verify payment. Please contact support.");
      }
    };

    recordPurchase();
  }, [actor, identity, id, queryClient]);

  const offlinePrice = unwrapOptionalBigint(offlinePriceRaw);
  const alreadyPurchased = myPurchases.some((p) => p.bookId === id);
  const hasAccess = alreadyPurchased || isAdmin === true;

  // Access fileId via any cast since backend.ts may not have it yet
  const bookFileId = book
    ? ((book as any).fileId as ExternalBlob | undefined)
    : undefined;

  const handleBuyOnline = async () => {
    if (!identity) {
      login();
      return;
    }
    if (!actor || !book) return;
    setIsPurchasing(true);
    try {
      const successUrl = `${window.location.origin}${window.location.pathname}?session_id={CHECKOUT_SESSION_ID}&purchase=success`;
      const url = await actor.createCheckoutSession(
        [
          {
            productName: book.title,
            currency: "inr",
            quantity: 1n,
            priceInCents: book.priceCents,
            productDescription: book.description,
          },
        ],
        successUrl,
        window.location.href,
      );
      window.location.href = url;
    } catch {
      toast.error("Failed to start checkout. Please try again.");
      setIsPurchasing(false);
    }
  };

  const handleReadOnline = () => {
    const url = bookFileId?.getDirectURL?.();
    if (url) window.open(url, "_blank");
  };

  const handleDownload = () => {
    const url = bookFileId?.getDirectURL?.();
    if (!url) return;
    const a = document.createElement("a");
    a.href = url;
    a.download = book?.title ?? "book";
    a.click();
  };

  if (isLoading) {
    return (
      <div
        className="container mx-auto px-4 py-10 max-w-4xl"
        data-ocid="book_detail.loading_state"
      >
        <Skeleton className="h-8 w-32 mb-6" />
        <div className="flex gap-8">
          <Skeleton className="w-64 aspect-[2/3] rounded-lg" />
          <div className="flex-1 space-y-4">
            <Skeleton className="h-8 w-3/4" />
            <Skeleton className="h-4 w-1/2" />
            <Skeleton className="h-24 w-full" />
          </div>
        </div>
      </div>
    );
  }

  if (!book)
    return (
      <div className="container mx-auto px-4 py-10 text-center text-muted-foreground">
        Book not found.
      </div>
    );

  return (
    <div className="container mx-auto px-4 py-10 max-w-4xl">
      <button
        type="button"
        className="flex items-center gap-1 text-muted-foreground hover:text-foreground mb-6 text-sm"
        onClick={() => navigate({ name: "books" })}
        data-ocid="book_detail.back.button"
      >
        <ArrowLeft className="h-4 w-4" />
        Back to Books
      </button>
      <div className="flex flex-col sm:flex-row gap-8">
        <div className="w-full sm:w-56 flex-shrink-0">
          <div className="aspect-[2/3] rounded-lg overflow-hidden bg-muted">
            {book.coverImageId?.getDirectURL() ? (
              <img
                src={book.coverImageId.getDirectURL()}
                alt={book.title}
                className="w-full h-full object-cover"
              />
            ) : (
              <div className="w-full h-full flex items-center justify-center">
                <BookOpen className="h-16 w-16 text-muted-foreground/30" />
              </div>
            )}
          </div>
        </div>
        <div className="flex-1">
          <div className="flex items-center gap-2 mb-3">
            <Badge>{book.genre}</Badge>
            {isAdmin === true && (
              <Badge
                variant="secondary"
                className="flex items-center gap-1 bg-amber-500/20 text-amber-400 border-amber-500/30"
                data-ocid="book_detail.admin_access.badge"
              >
                <ShieldCheck className="h-3 w-3" />
                Admin Access — Free
              </Badge>
            )}
          </div>
          <h1 className="font-display text-3xl font-bold mb-2">{book.title}</h1>
          <p className="text-muted-foreground text-sm mb-4">
            by {book.author.toString().slice(0, 12)}...
          </p>
          <p className="text-foreground/80 leading-relaxed mb-6">
            {book.description}
          </p>

          {/* Read / Download — shown to admin or purchasers who have a file */}
          {hasAccess && bookFileId?.getDirectURL?.() && (
            <div className="flex gap-3 mb-6">
              <Button
                variant="default"
                onClick={handleReadOnline}
                data-ocid="book_detail.read.button"
              >
                <BookOpen className="h-4 w-4 mr-2" />
                Read Online
              </Button>
              <Button
                variant="outline"
                onClick={handleDownload}
                data-ocid="book_detail.download.button"
              >
                <Download className="h-4 w-4 mr-2" />
                Download
              </Button>
            </div>
          )}

          {/* Pricing section */}
          <div className="space-y-4">
            {/* Online purchase */}
            <div className="rounded-lg border border-border bg-card/50 p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="font-semibold text-sm text-muted-foreground uppercase tracking-wide">
                    Buy Online
                  </p>
                  <p className="text-accent text-3xl font-bold mt-1">
                    {formatINR(book.priceCents)}
                  </p>
                  <p className="text-xs text-muted-foreground mt-1">
                    Digital copy &mdash; read in-app &amp; download
                  </p>
                </div>
                {alreadyPurchased || isAdmin === true ? (
                  <Button
                    variant="secondary"
                    disabled
                    data-ocid="book_detail.purchased.button"
                  >
                    {isAdmin === true ? "Admin Access" : "Already Purchased"}
                  </Button>
                ) : (
                  <Button
                    onClick={handleBuyOnline}
                    disabled={isPurchasing}
                    size="lg"
                    data-ocid="book_detail.buy.button"
                  >
                    {isPurchasing ? (
                      <Loader2 className="h-4 w-4 animate-spin mr-2" />
                    ) : (
                      <ShoppingCart className="h-4 w-4 mr-2" />
                    )}
                    {isPurchasing ? "Processing..." : "Buy Now"}
                  </Button>
                )}
              </div>

              {/* Payment methods note */}
              {!(alreadyPurchased || isAdmin === true) && (
                <div className="mt-3 pt-3 border-t border-border/40">
                  <div className="flex items-center gap-2 flex-wrap">
                    <Smartphone className="h-3.5 w-3.5 text-muted-foreground" />
                    <span className="text-xs text-muted-foreground">
                      Supports:
                    </span>
                    {[
                      "UPI",
                      "PhonePe",
                      "Google Pay",
                      "Paytm",
                      "Credit Card",
                      "Debit Card",
                    ].map((method) => (
                      <span
                        key={method}
                        className="inline-flex items-center gap-1 text-xs bg-secondary/60 text-secondary-foreground px-2 py-0.5 rounded-full border border-border/30"
                      >
                        <CreditCard className="h-2.5 w-2.5" />
                        {method}
                      </span>
                    ))}
                  </div>
                  <p className="text-xs text-muted-foreground/70 mt-1.5">
                    Secure payment via Stripe. Indian UPI apps accepted.
                  </p>
                </div>
              )}
            </div>

            {/* Offline purchase — only shown when location + offline price exist */}
            {offlinePrice !== null && book.offlineLocation && (
              <div className="rounded-lg border border-emerald-500/30 bg-emerald-950/20 p-4 shadow-[0_0_16px_0_rgba(16,185,129,0.08)]">
                <div className="flex items-center gap-2 mb-2">
                  <div className="flex items-center gap-1.5 bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 rounded-full px-2.5 py-0.5">
                    <MapPin className="h-3.5 w-3.5" />
                    <span className="text-xs font-semibold uppercase tracking-wide">
                      Physical Copy Available
                    </span>
                  </div>
                </div>
                <p className="text-emerald-400 text-2xl font-bold">
                  {formatINR(offlinePrice)}
                </p>
                <div className="flex items-start gap-2 mt-3 bg-emerald-900/20 rounded-lg p-3 border border-emerald-500/20">
                  <MapPin className="h-4 w-4 text-emerald-400 shrink-0 mt-0.5" />
                  <div>
                    <p className="text-xs text-emerald-400/70 uppercase tracking-wide font-medium mb-0.5">
                      Location
                    </p>
                    <p className="text-sm text-foreground font-medium">
                      {book.offlineLocation}
                    </p>
                  </div>
                </div>
                <p className="text-xs text-muted-foreground mt-2">
                  Visit the location above to purchase a physical copy. Cash or
                  UPI accepted on-site.
                </p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
