import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";
import { useQuery } from "@tanstack/react-query";
import { Clock, Film, Search } from "lucide-react";
import { useState } from "react";
import type { Page } from "../App";
import type { ShortFilm } from "../backend";
import { useActor } from "../hooks/useActor";

interface FilmsPageProps {
  navigate: (p: Page) => void;
}

function FilmCard({ film, onClick }: { film: ShortFilm; onClick: () => void }) {
  const mins = Math.floor(Number(film.duration) / 60);
  const secs = Number(film.duration) % 60;
  return (
    <button
      type="button"
      className="group w-full text-left cursor-pointer rounded-lg overflow-hidden border border-border bg-card hover:border-primary/50 transition-all duration-300 hover:shadow-lg hover:shadow-primary/10"
      onClick={onClick}
    >
      <div className="aspect-video bg-muted overflow-hidden relative">
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
        <div className="absolute bottom-2 right-2 bg-black/70 rounded px-1.5 py-0.5 text-xs flex items-center gap-1">
          <Clock className="h-3 w-3" />
          {mins}:{secs.toString().padStart(2, "0")}
        </div>
      </div>
      <div className="p-4">
        <h3 className="font-semibold line-clamp-2 group-hover:text-primary transition-colors">
          {film.title}
        </h3>
        <p className="text-muted-foreground text-sm mt-1 line-clamp-2">
          {film.description}
        </p>
        <div className="mt-3">
          <Badge variant="secondary">{film.genre}</Badge>
        </div>
      </div>
    </button>
  );
}

export default function FilmsPage({ navigate }: FilmsPageProps) {
  const { actor } = useActor();
  const [search, setSearch] = useState("");
  const [genre, setGenre] = useState("All");

  const { data: films = [], isLoading } = useQuery({
    queryKey: ["published-films"],
    queryFn: () => actor!.getPublishedShortFilms(),
    enabled: !!actor,
  });

  const genres = [
    "All",
    ...Array.from(new Set(films.map((f) => f.genre).filter(Boolean))),
  ];

  const filtered = films.filter((f) => {
    const matchSearch = f.title.toLowerCase().includes(search.toLowerCase());
    const matchGenre = genre === "All" || f.genre === genre;
    return matchSearch && matchGenre;
  });

  return (
    <div className="container mx-auto px-4 py-10">
      <h1 className="font-display text-4xl font-bold mb-2">Short Films</h1>
      <p className="text-muted-foreground mb-8">
        Watch films from independent directors. Free to stream.
      </p>
      <div className="flex flex-col sm:flex-row gap-3 mb-8">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search films..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-9"
            data-ocid="films.search_input"
          />
        </div>
        <div className="flex gap-2 flex-wrap">
          {genres.map((g) => (
            <button
              key={g}
              type="button"
              className={`px-3 py-1.5 rounded-md text-sm border transition-colors ${genre === g ? "bg-primary text-primary-foreground border-primary" : "border-border text-muted-foreground hover:border-primary/50"}`}
              onClick={() => setGenre(g)}
              data-ocid="films.genre.tab"
            >
              {g}
            </button>
          ))}
        </div>
      </div>
      {isLoading ? (
        <div
          className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6"
          data-ocid="films.loading_state"
        >
          {Array.from({ length: 6 }).map((_, i) => (
            // biome-ignore lint/suspicious/noArrayIndexKey: skeleton placeholders
            <div key={i}>
              <Skeleton className="aspect-video rounded-lg mb-2" />
              <Skeleton className="h-4 w-3/4" />
            </div>
          ))}
        </div>
      ) : filtered.length === 0 ? (
        <div
          className="text-center py-20 text-muted-foreground"
          data-ocid="films.empty_state"
        >
          No films found.
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {filtered.map((film, i) => (
            <div key={film.id} data-ocid={`films.item.${i + 1}`}>
              <FilmCard
                film={film}
                onClick={() => navigate({ name: "film", id: film.id })}
              />
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
