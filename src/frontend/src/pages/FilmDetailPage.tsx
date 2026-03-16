import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { useQuery } from "@tanstack/react-query";
import { ArrowLeft, Clock, Film } from "lucide-react";
import type { Page } from "../App";
import { useActor } from "../hooks/useActor";

interface FilmDetailProps {
  id: string;
  navigate: (p: Page) => void;
}

export default function FilmDetailPage({ id, navigate }: FilmDetailProps) {
  const { actor } = useActor();

  const { data: film, isLoading } = useQuery({
    queryKey: ["film", id],
    queryFn: () => actor!.getShortFilm(id),
    enabled: !!actor,
  });

  if (isLoading) {
    return (
      <div
        className="container mx-auto px-4 py-10 max-w-4xl"
        data-ocid="film_detail.loading_state"
      >
        <Skeleton className="h-8 w-32 mb-6" />
        <Skeleton className="aspect-video rounded-xl mb-6" />
        <Skeleton className="h-8 w-3/4 mb-3" />
        <Skeleton className="h-24 w-full" />
      </div>
    );
  }

  if (!film)
    return (
      <div className="container mx-auto px-4 py-10 text-center text-muted-foreground">
        Film not found.
      </div>
    );

  const mins = Math.floor(Number(film.duration) / 60);
  const secs = Number(film.duration) % 60;
  const videoUrl = film.videoId?.getDirectURL();

  return (
    <div className="container mx-auto px-4 py-10 max-w-4xl">
      <button
        type="button"
        className="flex items-center gap-1 text-muted-foreground hover:text-foreground mb-6 text-sm"
        onClick={() => navigate({ name: "films" })}
        data-ocid="film_detail.back.button"
      >
        <ArrowLeft className="h-4 w-4" />
        Back to Films
      </button>
      <div className="rounded-xl overflow-hidden bg-black mb-6">
        {videoUrl ? (
          // biome-ignore lint/a11y/useMediaCaption: user-uploaded content
          <video
            controls
            className="w-full aspect-video"
            data-ocid="film_detail.canvas_target"
          >
            <source src={videoUrl} />
          </video>
        ) : (
          <div className="aspect-video flex items-center justify-center bg-muted">
            <Film className="h-16 w-16 text-muted-foreground/30" />
          </div>
        )}
      </div>
      <div className="flex items-start justify-between mb-3">
        <div>
          <Badge className="mb-2">{film.genre}</Badge>
          <h1 className="font-display text-3xl font-bold">{film.title}</h1>
          <p className="text-muted-foreground text-sm mt-1">
            Directed by {film.director.toString().slice(0, 12)}...
          </p>
        </div>
        <div className="flex items-center gap-1 text-muted-foreground text-sm mt-1">
          <Clock className="h-4 w-4" />
          {mins}:{secs.toString().padStart(2, "0")}
        </div>
      </div>
      <p className="text-foreground/80 leading-relaxed">{film.description}</p>
    </div>
  );
}
