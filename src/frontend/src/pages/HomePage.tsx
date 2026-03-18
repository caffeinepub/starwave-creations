import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { useQuery } from "@tanstack/react-query";
import { ArrowRight, BookOpen, Film, Star, Users } from "lucide-react";
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
      className="group w-full text-left cursor-pointer rounded-lg overflow-hidden border border-border bg-card hover:border-primary/50 transition-all duration-300 hover:shadow-lg hover:shadow-primary/20"
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
          <span className="text-primary font-bold text-sm">
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
      className="group w-full text-left cursor-pointer rounded-lg overflow-hidden border border-border bg-card hover:border-primary/50 transition-all duration-300 hover:shadow-lg hover:shadow-primary/20"
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

  const { data: creators, isLoading: creatorsLoading } = useQuery({
    queryKey: ["creator-profiles"],
    queryFn: () => actor!.getCreatorProfiles(),
    enabled: !!actor,
  });

  const books = content?.books?.slice(0, 6) ?? [];
  const films = content?.shortFilms?.slice(0, 4) ?? [];
  const featuredCreators = creators?.slice(0, 6) ?? [];

  return (
    <div>
      {/* Hero Section */}
      <section className="relative overflow-hidden py-28 px-4">
        <div className="absolute inset-0 bg-gradient-to-br from-primary/20 via-background to-accent/10" />
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top,oklch(0.68_0.22_290/0.15),transparent_60%)]" />
        <div className="relative container mx-auto text-center max-w-4xl">
          <div className="flex items-center justify-center gap-3 mb-5">
            <Star className="h-5 w-5 text-primary" fill="currentColor" />
            <span className="text-primary text-xs font-semibold uppercase tracking-[0.3em]">
              Independent Stories
            </span>
            <Star className="h-5 w-5 text-primary" fill="currentColor" />
          </div>
          <h1 className="font-display text-5xl sm:text-7xl font-bold mb-3 leading-none tracking-tight">
            STARWAVE
          </h1>
          <h2 className="font-display text-3xl sm:text-4xl font-bold mb-2 text-primary tracking-widest">
            CREATIONS
          </h2>
          <p className="text-muted-foreground text-base uppercase tracking-[0.25em] mb-3 font-semibold">
            BOOKSTORE &amp; FILM PLATFORM
          </p>
          <p className="text-muted-foreground text-lg mb-10 max-w-xl mx-auto">
            Discover books and short films from independent writers and
            directors
          </p>
          <div className="flex flex-wrap gap-3 justify-center">
            <Button
              size="lg"
              onClick={() => navigate({ name: "books" })}
              data-ocid="hero.books.button"
              className="px-8"
            >
              <BookOpen className="h-4 w-4 mr-2" />
              Browse Books
            </Button>
            <Button
              size="lg"
              variant="outline"
              onClick={() => navigate({ name: "films" })}
              data-ocid="hero.films.button"
              className="px-8"
            >
              <Film className="h-4 w-4 mr-2" />
              Watch Films
            </Button>
          </div>
        </div>
      </section>

      {/* Featured Books */}
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
            {["c1", "c2", "c3", "c4", "c5", "c6"].map((k) => (
              <div key={k}>
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

      {/* Short Films */}
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
            {["f1", "f2", "f3", "f4"].map((k) => (
              <div key={k}>
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
            No films published yet. Be the first director!
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

      {/* Meet Our Creators */}
      <section className="container mx-auto px-4 py-12">
        <div className="flex items-center justify-between mb-6">
          <h2 className="font-display text-2xl font-bold">Meet Our Creators</h2>
          <button
            type="button"
            className="flex items-center gap-1 text-sm text-primary hover:underline"
            onClick={() => navigate({ name: "creators" })}
            data-ocid="home.creators.link"
          >
            View all <ArrowRight className="h-3 w-3" />
          </button>
        </div>
        {creatorsLoading ? (
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-4">
            {["c1", "c2", "c3", "c4", "c5", "c6"].map((k) => (
              <div
                key={k}
                className="rounded-lg border border-border bg-card p-4"
              >
                <Skeleton className="h-12 w-12 rounded-full mb-3 mx-auto" />
                <Skeleton className="h-4 w-3/4 mx-auto mb-2" />
                <Skeleton className="h-3 w-1/2 mx-auto" />
              </div>
            ))}
          </div>
        ) : featuredCreators.length === 0 ? (
          <div
            className="text-center py-12 text-muted-foreground"
            data-ocid="home.creators.empty_state"
          >
            No creators have registered yet.
          </div>
        ) : (
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-4">
            {featuredCreators.map((creator, i) => (
              <div
                key={creator.principal.toString()}
                data-ocid={`home.creators.item.${i + 1}`}
                className="rounded-lg border border-border bg-card p-4 flex flex-col items-center text-center hover:border-primary/50 transition-colors"
              >
                <div className="h-12 w-12 rounded-full bg-primary/20 flex items-center justify-center mb-3">
                  <Users className="h-6 w-6 text-primary" />
                </div>
                <p className="font-semibold text-sm line-clamp-1 mb-1">
                  {creator.name}
                </p>
                <Badge variant="secondary" className="text-xs mb-3">
                  Creator
                </Badge>
                <Button
                  size="sm"
                  variant="outline"
                  className="w-full text-xs"
                  onClick={() =>
                    navigate({
                      name: "creator-profile",
                      id: creator.principal.toString(),
                    })
                  }
                  data-ocid={`home.creators.view.button.${i + 1}`}
                >
                  View Profile
                </Button>
              </div>
            ))}
          </div>
        )}
      </section>

      {/* Footer */}
      <footer className="border-t border-border mt-16 py-8 text-center text-sm text-muted-foreground">
        <p>
          &copy; {new Date().getFullYear()}. Built with love using{" "}
          <a
            href={`https://caffeine.ai?utm_source=caffeine-footer&utm_medium=referral&utm_content=${encodeURIComponent(window.location.hostname)}`}
            target="_blank"
            rel="noopener noreferrer"
            className="text-primary hover:underline"
          >
            caffeine.ai
          </a>
        </p>
      </footer>
    </div>
  );
}
