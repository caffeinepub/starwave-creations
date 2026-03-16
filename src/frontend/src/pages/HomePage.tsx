import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { useQuery } from "@tanstack/react-query";
import { ArrowRight, BookOpen, Film, Star } from "lucide-react";
import type { Page } from "../App";
import type { Book, ShortFilm } from "../backend";
import { useActor } from "../hooks/useActor";

interface HomePageProps {
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
            <BookOpen className="h-12 w-12 text-muted-foreground/30" />
          </div>
        )}
      </div>
      <div className="p-3">
        <h3 className="font-semibold text-sm line-clamp-2 group-hover:text-primary transition-colors">
          {book.title}
        </h3>
        <div className="flex items-center justify-between mt-2">
          <Badge variant="secondary" className="text-xs">
            {book.genre}
          </Badge>
          <span className="text-accent font-bold text-sm">
            ${(Number(book.priceCents) / 100).toFixed(2)}
          </span>
        </div>
      </div>
    </button>
  );
}

function FilmCard({ film, onClick }: { film: ShortFilm; onClick: () => void }) {
  return (
    <button
      type="button"
      className="group w-full text-left cursor-pointer rounded-lg overflow-hidden border border-border bg-card hover:border-primary/50 transition-all duration-300 hover:shadow-lg hover:shadow-primary/10"
      onClick={onClick}
    >
      <div className="aspect-video bg-muted overflow-hidden">
        {film.thumbnailId?.getDirectURL() ? (
          <img
            src={film.thumbnailId.getDirectURL()}
            alt={film.title}
            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center">
            <Film className="h-12 w-12 text-muted-foreground/30" />
          </div>
        )}
      </div>
      <div className="p-3">
        <h3 className="font-semibold text-sm line-clamp-2 group-hover:text-primary transition-colors">
          {film.title}
        </h3>
        <div className="flex items-center justify-between mt-2">
          <Badge variant="secondary" className="text-xs">
            {film.genre}
          </Badge>
          <span className="text-muted-foreground text-xs">
            {Math.floor(Number(film.duration) / 60)}m
          </span>
        </div>
      </div>
    </button>
  );
}

export default function HomePage({ navigate }: HomePageProps) {
  const { actor } = useActor();

  const { data: content, isLoading } = useQuery({
    queryKey: ["published-content"],
    queryFn: () => actor!.getAllPublishedContent(),
    enabled: !!actor,
  });

  const books = content?.books?.slice(0, 6) ?? [];
  const films = content?.shortFilms?.slice(0, 4) ?? [];

  return (
    <div>
      <section className="relative overflow-hidden py-24 px-4">
        <div className="absolute inset-0 bg-gradient-to-br from-primary/10 via-background to-accent/5" />
        <div className="relative container mx-auto text-center max-w-3xl">
          <div className="flex items-center justify-center gap-2 mb-4">
            <Star className="h-5 w-5 text-accent" fill="currentColor" />
            <span className="text-accent text-sm font-semibold uppercase tracking-widest">
              Discover & Create
            </span>
            <Star className="h-5 w-5 text-accent" fill="currentColor" />
          </div>
          <h1 className="font-display text-5xl sm:text-6xl font-bold mb-6 leading-tight">
            Where Stories
            <br />
            <span className="text-primary">Come to Life</span>
          </h1>
          <p className="text-muted-foreground text-lg mb-8 max-w-xl mx-auto">
            Discover books and short films from independent writers and
            directors. Support creators directly.
          </p>
          <div className="flex flex-wrap gap-3 justify-center">
            <Button
              size="lg"
              onClick={() => navigate({ name: "books" })}
              data-ocid="hero.books.button"
            >
              <BookOpen className="h-4 w-4 mr-2" />
              Browse Books
            </Button>
            <Button
              size="lg"
              variant="outline"
              onClick={() => navigate({ name: "films" })}
              data-ocid="hero.films.button"
            >
              <Film className="h-4 w-4 mr-2" />
              Watch Films
            </Button>
          </div>
        </div>
      </section>

      <section className="container mx-auto px-4 py-12">
        <div className="flex items-center justify-between mb-6">
          <h2 className="font-display text-2xl font-bold">Featured Books</h2>
          <button
            type="button"
            className="flex items-center gap-1 text-sm text-primary hover:underline"
            onClick={() => navigate({ name: "books" })}
            data-ocid="home.books.link"
          >
            View all <ArrowRight className="h-3 w-3" />
          </button>
        </div>
        {isLoading ? (
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-4">
            {Array.from({ length: 6 }).map((_, i) => (
              // biome-ignore lint/suspicious/noArrayIndexKey: skeleton placeholders
              <div key={i}>
                <Skeleton className="aspect-[2/3] rounded-lg mb-2" />
                <Skeleton className="h-4 w-3/4 mb-1" />
              </div>
            ))}
          </div>
        ) : books.length === 0 ? (
          <div
            className="text-center py-12 text-muted-foreground"
            data-ocid="home.books.empty_state"
          >
            No books published yet. Be the first creator!
          </div>
        ) : (
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-4">
            {books.map((book, i) => (
              <div key={book.id} data-ocid={`home.books.item.${i + 1}`}>
                <BookCard
                  book={book}
                  onClick={() => navigate({ name: "book", id: book.id })}
                />
              </div>
            ))}
          </div>
        )}
      </section>

      <section className="container mx-auto px-4 py-12">
        <div className="flex items-center justify-between mb-6">
          <h2 className="font-display text-2xl font-bold">Short Films</h2>
          <button
            type="button"
            className="flex items-center gap-1 text-sm text-primary hover:underline"
            onClick={() => navigate({ name: "films" })}
            data-ocid="home.films.link"
          >
            View all <ArrowRight className="h-3 w-3" />
          </button>
        </div>
        {isLoading ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {Array.from({ length: 4 }).map((_, i) => (
              // biome-ignore lint/suspicious/noArrayIndexKey: skeleton placeholders
              <div key={i}>
                <Skeleton className="aspect-video rounded-lg mb-2" />
                <Skeleton className="h-4 w-3/4 mb-1" />
              </div>
            ))}
          </div>
        ) : films.length === 0 ? (
          <div
            className="text-center py-12 text-muted-foreground"
            data-ocid="home.films.empty_state"
          >
            No films published yet.
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {films.map((film, i) => (
              <div key={film.id} data-ocid={`home.films.item.${i + 1}`}>
                <FilmCard
                  film={film}
                  onClick={() => navigate({ name: "film", id: film.id })}
                />
              </div>
            ))}
          </div>
        )}
      </section>

      <section className="container mx-auto px-4 py-16">
        <div className="rounded-2xl border border-primary/30 bg-primary/5 p-10 text-center">
          <h2 className="font-display text-3xl font-bold mb-3">
            Are You a Creator?
          </h2>
          <p className="text-muted-foreground mb-6">
            Publish your books and short films. Earn 60% on every book sale.
          </p>
          <Button
            onClick={() => navigate({ name: "creator" })}
            data-ocid="home.creator_cta.button"
          >
            Start Creating
          </Button>
        </div>
      </section>
    </div>
  );
}
