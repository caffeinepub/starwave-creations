import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";
import { useQuery } from "@tanstack/react-query";
import { BookOpen, Search } from "lucide-react";
import { useState } from "react";
import type { Page } from "../App";
import type { Book } from "../backend";
import { useActor } from "../hooks/useActor";

interface BooksPageProps {
  navigate: (p: Page) => void;
}

function BookCard({ book, onClick }: { book: Book; onClick: () => void }) {
  return (
    <button
      type="button"
      className="group w-full text-left cursor-pointer rounded-lg overflow-hidden border border-border bg-card hover:border-primary/50 transition-all duration-300 hover:shadow-lg hover:shadow-primary/10"
      onClick={onClick}
    >
      <div className="aspect-[2/3] bg-muted overflow-hidden">
        {book.coverImageId?.getDirectURL() ? (
          <img
            src={book.coverImageId.getDirectURL()}
            alt={book.title}
            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center">
            <BookOpen className="h-16 w-16 text-muted-foreground/30" />
          </div>
        )}
      </div>
      <div className="p-4">
        <h3 className="font-semibold line-clamp-2 group-hover:text-primary transition-colors">
          {book.title}
        </h3>
        <p className="text-muted-foreground text-sm mt-1 line-clamp-2">
          {book.description}
        </p>
        <div className="flex items-center justify-between mt-3">
          <Badge variant="secondary">{book.genre}</Badge>
          <span className="text-accent font-bold">
            ${(Number(book.priceCents) / 100).toFixed(2)}
          </span>
        </div>
      </div>
    </button>
  );
}

export default function BooksPage({ navigate }: BooksPageProps) {
  const { actor } = useActor();
  const [search, setSearch] = useState("");
  const [genre, setGenre] = useState("All");

  const { data: books = [], isLoading } = useQuery({
    queryKey: ["published-books"],
    queryFn: () => actor!.getPublishedBooks(),
    enabled: !!actor,
  });

  const genres = [
    "All",
    ...Array.from(new Set(books.map((b) => b.genre).filter(Boolean))),
  ];

  const filtered = books.filter((b) => {
    const matchSearch = b.title.toLowerCase().includes(search.toLowerCase());
    const matchGenre = genre === "All" || b.genre === genre;
    return matchSearch && matchGenre;
  });

  return (
    <div className="container mx-auto px-4 py-10">
      <h1 className="font-display text-4xl font-bold mb-2">Books</h1>
      <p className="text-muted-foreground mb-8">
        Discover stories from independent writers.
      </p>
      <div className="flex flex-col sm:flex-row gap-3 mb-8">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search books..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-9"
            data-ocid="books.search_input"
          />
        </div>
        <div className="flex gap-2 flex-wrap">
          {genres.map((g) => (
            <button
              key={g}
              type="button"
              className={`px-3 py-1.5 rounded-md text-sm border transition-colors ${genre === g ? "bg-primary text-primary-foreground border-primary" : "border-border text-muted-foreground hover:border-primary/50"}`}
              onClick={() => setGenre(g)}
              data-ocid="books.genre.tab"
            >
              {g}
            </button>
          ))}
        </div>
      </div>
      {isLoading ? (
        <div
          className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-4"
          data-ocid="books.loading_state"
        >
          {Array.from({ length: 10 }).map((_, i) => (
            // biome-ignore lint/suspicious/noArrayIndexKey: skeleton placeholders
            <div key={i}>
              <Skeleton className="aspect-[2/3] rounded-lg mb-2" />
              <Skeleton className="h-4 w-3/4" />
            </div>
          ))}
        </div>
      ) : filtered.length === 0 ? (
        <div
          className="text-center py-20 text-muted-foreground"
          data-ocid="books.empty_state"
        >
          No books found.
        </div>
      ) : (
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-4">
          {filtered.map((book, i) => (
            <div key={book.id} data-ocid={`books.item.${i + 1}`}>
              <BookCard
                book={book}
                onClick={() => navigate({ name: "book", id: book.id })}
              />
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
