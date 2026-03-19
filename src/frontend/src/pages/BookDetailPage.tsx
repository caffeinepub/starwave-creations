import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { useQuery } from "@tanstack/react-query";
import {
  ArrowLeft,
  BookOpen,
  Loader2,
  MapPin,
  ShoppingCart,
} from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";
import type { Page } from "../App";
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

  const offlinePrice = unwrapOptionalBigint(offlinePriceRaw);
  const alreadyPurchased = myPurchases.some((p) => p.bookId === id);

  const handleBuyOnline = async () => {
    if (!identity) {
      login();
      return;
    }
    if (!actor || !book) return;
    setIsPurchasing(true);
    try {
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
        `${window.location.href}?purchase=success`,
        window.location.href,
      );
      window.location.href = url;
    } catch {
      toast.error("Failed to start checkout. Please try again.");
      setIsPurchasing(false);
    }
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
          <Badge className="mb-3">{book.genre}</Badge>
          <h1 className="font-display text-3xl font-bold mb-2">{book.title}</h1>
          <p className="text-muted-foreground text-sm mb-4">
            by {book.author.toString().slice(0, 12)}...
          </p>
          <p className="text-foreground/80 leading-relaxed mb-6">
            {book.description}
          </p>

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
                {alreadyPurchased ? (
                  <Button
                    variant="secondary"
                    disabled
                    data-ocid="book_detail.purchased.button"
                  >
                    Already Purchased
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
            </div>

            {/* Offline purchase — only shown when location + offline price exist */}
            {offlinePrice !== null && book.offlineLocation && (
              <div className="rounded-lg border border-border bg-card/50 p-4">
                <p className="font-semibold text-sm text-muted-foreground uppercase tracking-wide">
                  Buy Offline (Physical Copy)
                </p>
                <p className="text-primary text-2xl font-bold mt-1">
                  {formatINR(offlinePrice)}
                </p>
                <div className="flex items-start gap-2 mt-2">
                  <MapPin className="h-4 w-4 text-primary shrink-0 mt-0.5" />
                  <p className="text-sm text-foreground/80">
                    {book.offlineLocation}
                  </p>
                </div>
                <p className="text-xs text-muted-foreground mt-2">
                  Visit the location above to purchase a physical copy.
                </p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
