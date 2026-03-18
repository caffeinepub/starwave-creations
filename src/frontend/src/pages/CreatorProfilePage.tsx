import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { useQuery } from "@tanstack/react-query";
import {
  ArrowLeft,
  BookOpen,
  Film,
  Mail,
  MapPin,
  Phone,
  Users,
} from "lucide-react";
import type { Page } from "../App";
import type { Book, ShortFilm } from "../backend";
import { useActor } from "../hooks/useActor";

interface CreatorProfilePageProps {
  id: string;
  navigate: (p: Page) => void;
}

export default function CreatorProfilePage({
  id,
  navigate,
}: CreatorProfilePageProps) {
  const { actor } = useActor();

  const { data: creators, isLoading: creatorsLoading } = useQuery({
    queryKey: ["creator-profiles"],
    queryFn: () => actor!.getCreatorProfiles(),
    enabled: !!actor,
  });

  const { data: allBooks, isLoading: booksLoading } = useQuery({
    queryKey: ["published-books"],
    queryFn: () => actor!.getPublishedBooks(),
    enabled: !!actor,
  });

  const { data: allFilms, isLoading: filmsLoading } = useQuery({
    queryKey: ["published-films"],
    queryFn: () => actor!.getPublishedShortFilms(),
    enabled: !!actor,
  });

  const creator = creators?.find((c) => c.principal.toString() === id);
  const creatorBooks =
    allBooks?.filter((b: Book) => b.author.toString() === id) ?? [];
  const creatorFilms =
    allFilms?.filter((f: ShortFilm) => f.director.toString() === id) ?? [];

  const isLoading = creatorsLoading || booksLoading || filmsLoading;

  if (isLoading) {
    return (
      <div className="container mx-auto px-4 py-12 max-w-4xl">
        <Skeleton className="h-8 w-32 mb-8" />
        <div className="flex items-center gap-4 mb-8">
          <Skeleton className="h-20 w-20 rounded-full" />
          <div>
            <Skeleton className="h-6 w-48 mb-2" />
            <Skeleton className="h-4 w-24" />
          </div>
        </div>
      </div>
    );
  }

  if (!creator) {
    return (
      <div className="container mx-auto px-4 py-20 text-center">
        <p className="text-muted-foreground text-lg">Creator not found.</p>
        <Button
          variant="outline"
          className="mt-4"
          onClick={() => navigate({ name: "creators" })}
          data-ocid="creator_profile.back.button"
        >
          <ArrowLeft className="h-4 w-4 mr-2" /> Back to Creators
        </Button>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-12 max-w-5xl">
      <Button
        variant="ghost"
        className="mb-6"
        onClick={() => navigate({ name: "creators" })}
        data-ocid="creator_profile.back.button"
      >
        <ArrowLeft className="h-4 w-4 mr-2" /> Back to Creators
      </Button>

      {/* Creator Info */}
      <div className="rounded-xl border border-border bg-card p-8 mb-10">
        <div className="flex flex-col sm:flex-row items-start gap-6">
          <div className="h-20 w-20 rounded-full bg-primary/20 flex items-center justify-center shrink-0">
            <Users className="h-10 w-10 text-primary" />
          </div>
          <div className="flex-1">
            <h1 className="font-display text-3xl font-bold mb-2">
              {creator.name}
            </h1>
            <Badge className="mb-4">Creator</Badge>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mt-2">
              {creator.email && (
                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                  <Mail className="h-4 w-4 text-primary" />
                  <span>{creator.email}</span>
                </div>
              )}
              {creator.phone && (
                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                  <Phone className="h-4 w-4 text-primary" />
                  <span>{creator.phone}</span>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Creator's Books */}
      <section className="mb-12">
        <h2 className="font-display text-2xl font-bold mb-6 flex items-center gap-2">
          <BookOpen className="h-6 w-6 text-primary" /> Published Books
        </h2>
        {creatorBooks.length === 0 ? (
          <div
            className="text-center py-10 text-muted-foreground border border-border rounded-lg"
            data-ocid="creator_profile.books.empty_state"
          >
            No books published yet.
          </div>
        ) : (
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4">
            {creatorBooks.map((book, i) => (
              <button
                key={book.id}
                type="button"
                data-ocid={`creator_profile.books.item.${i + 1}`}
                className="group text-left cursor-pointer rounded-lg overflow-hidden border border-border bg-card hover:border-primary/50 transition-all duration-300"
                onClick={() => navigate({ name: "book", id: book.id })}
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
                      <BookOpen className="h-10 w-10 text-muted-foreground/30" />
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
                  {book.offlineLocation && (
                    <div className="mt-2 flex items-start gap-1 text-xs text-muted-foreground">
                      <MapPin className="h-3 w-3 shrink-0 mt-0.5 text-primary" />
                      <span>
                        Also available offline at: {book.offlineLocation}
                      </span>
                    </div>
                  )}
                </div>
              </button>
            ))}
          </div>
        )}
      </section>

      {/* Creator's Films */}
      <section>
        <h2 className="font-display text-2xl font-bold mb-6 flex items-center gap-2">
          <Film className="h-6 w-6 text-primary" /> Short Films
        </h2>
        {creatorFilms.length === 0 ? (
          <div
            className="text-center py-10 text-muted-foreground border border-border rounded-lg"
            data-ocid="creator_profile.films.empty_state"
          >
            No films published yet.
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {creatorFilms.map((film, i) => (
              <button
                key={film.id}
                type="button"
                data-ocid={`creator_profile.films.item.${i + 1}`}
                className="group text-left cursor-pointer rounded-lg overflow-hidden border border-border bg-card hover:border-primary/50 transition-all duration-300"
                onClick={() => navigate({ name: "film", id: film.id })}
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
                      <Film className="h-10 w-10 text-muted-foreground/30" />
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
            ))}
          </div>
        )}
      </section>
    </div>
  );
}
