import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { useQuery } from "@tanstack/react-query";
import { BookOpen } from "lucide-react";
import type { Page } from "../App";
import { useActor } from "../hooks/useActor";
import { useInternetIdentity } from "../hooks/useInternetIdentity";

interface LibraryPageProps {
  navigate: (p: Page) => void;
}

export default function LibraryPage({ navigate }: LibraryPageProps) {
  const { actor } = useActor();
  const { identity, login } = useInternetIdentity();

  const { data: purchases = [], isLoading } = useQuery({
    queryKey: ["my-purchases"],
    queryFn: () => actor!.getMyPurchases(),
    enabled: !!actor && !!identity,
  });

  const { data: allBooks = [] } = useQuery({
    queryKey: ["published-books"],
    queryFn: () => actor!.getPublishedBooks(),
    enabled: !!actor,
  });

  const purchasedBooks = allBooks.filter((b) =>
    purchases.some((p) => p.bookId === b.id),
  );

  if (!identity) {
    return (
      <div className="container mx-auto px-4 py-20 text-center">
        <BookOpen className="h-16 w-16 mx-auto text-muted-foreground/30 mb-4" />
        <h2 className="font-display text-2xl font-bold mb-2">
          Sign In to View Your Library
        </h2>
        <p className="text-muted-foreground mb-6">
          Your purchased books will appear here.
        </p>
        <Button onClick={login} data-ocid="library.login.button">
          Sign In
        </Button>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-10">
      <h1 className="font-display text-4xl font-bold mb-2">My Library</h1>
      <p className="text-muted-foreground mb-8">Your purchased books.</p>
      {isLoading ? (
        <div
          className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-4"
          data-ocid="library.loading_state"
        >
          {Array.from({ length: 5 }).map((_, i) => (
            // biome-ignore lint/suspicious/noArrayIndexKey: skeleton placeholders
            <div key={i}>
              <Skeleton className="aspect-[2/3] rounded-lg mb-2" />
              <Skeleton className="h-4 w-3/4" />
            </div>
          ))}
        </div>
      ) : purchasedBooks.length === 0 ? (
        <div
          className="text-center py-20 text-muted-foreground"
          data-ocid="library.empty_state"
        >
          <BookOpen className="h-12 w-12 mx-auto mb-3 opacity-30" />
          <p>No books in your library yet.</p>
          <Button
            variant="outline"
            className="mt-4"
            onClick={() => navigate({ name: "books" })}
            data-ocid="library.browse.button"
          >
            Browse Books
          </Button>
        </div>
      ) : (
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-4">
          {purchasedBooks.map((book, i) => (
            <button
              key={book.id}
              type="button"
              className="group w-full text-left cursor-pointer rounded-lg overflow-hidden border border-border bg-card hover:border-primary/50 transition-all"
              onClick={() => navigate({ name: "book", id: book.id })}
              data-ocid={`library.item.${i + 1}`}
            >
              <div className="aspect-[2/3] bg-muted overflow-hidden">
                {book.coverImageId?.getDirectURL() ? (
                  <img
                    src={book.coverImageId.getDirectURL()}
                    alt={book.title}
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <div className="w-full h-full flex items-center justify-center">
                    <BookOpen className="h-10 w-10 text-muted-foreground/30" />
                  </div>
                )}
              </div>
              <div className="p-3">
                <h3 className="font-semibold text-sm line-clamp-2">
                  {book.title}
                </h3>
              </div>
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
