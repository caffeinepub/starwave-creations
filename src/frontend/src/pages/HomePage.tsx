import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { useQuery } from "@tanstack/react-query";
import {
  ArrowRight,
  BookOpen,
  Film,
  Sparkles,
  Star,
  Users,
} from "lucide-react";
import { motion } from "motion/react";
import type { Page } from "../App";
import type { Book, ShortFilm } from "../backend";
import { useActor } from "../hooks/useActor";

interface HomePageProps {
  navigate: (p: Page) => void;
}

function BookCard({ book, onClick }: { book: Book; onClick: () => void }) {
  return (
    <motion.button
      type="button"
      className="group w-full text-left cursor-pointer rounded-xl overflow-hidden border border-border/60 bg-card hover:border-primary/50 transition-all duration-300"
      style={{
        boxShadow:
          "0 4px 24px oklch(0.10 0.05 270 / 0.7), 0 1px 0 oklch(0.65 0.25 270 / 0.10) inset",
      }}
      whileHover={{
        y: -4,
        boxShadow:
          "0 0 20px oklch(0.65 0.25 270 / 0.4), 0 4px 16px oklch(0.10 0.05 270 / 0.8)",
      }}
      transition={{ duration: 0.2 }}
      onClick={onClick}
    >
      <div className="aspect-[2/3] bg-muted overflow-hidden">
        {book.coverImageId?.getDirectURL() ? (
          <img
            src={book.coverImageId.getDirectURL()}
            alt={book.title}
            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-primary/10 to-accent/5">
            <BookOpen className="h-12 w-12 text-primary/30" />
          </div>
        )}
      </div>
      <div className="p-3">
        <h3 className="font-semibold text-sm line-clamp-2 group-hover:text-primary transition-colors">
          {book.title}
        </h3>
        <div className="flex items-center justify-between mt-2">
          <Badge
            variant="secondary"
            className="text-xs bg-primary/10 text-primary border-primary/20 group-hover:shadow-glow-blue transition-shadow duration-300"
          >
            {book.genre}
          </Badge>
          <span className="text-primary font-bold text-sm">
            ₹{(Number(book.priceCents) / 100).toFixed(0)}
          </span>
        </div>
      </div>
    </motion.button>
  );
}

function FilmCard({ film, onClick }: { film: ShortFilm; onClick: () => void }) {
  return (
    <motion.button
      type="button"
      className="group w-full text-left cursor-pointer rounded-xl overflow-hidden border border-border/60 bg-card hover:border-accent/50 transition-all duration-300"
      style={{
        boxShadow:
          "0 4px 24px oklch(0.10 0.05 270 / 0.7), 0 1px 0 oklch(0.65 0.25 270 / 0.10) inset",
      }}
      whileHover={{
        y: -4,
        boxShadow:
          "0 0 24px oklch(0.55 0.22 295 / 0.45), 0 8px 32px oklch(0.10 0.05 270 / 0.9)",
      }}
      transition={{ duration: 0.2 }}
      onClick={onClick}
    >
      <div className="aspect-video bg-muted overflow-hidden relative">
        {film.thumbnailId?.getDirectURL() ? (
          <img
            src={film.thumbnailId.getDirectURL()}
            alt={film.title}
            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-accent/10 to-primary/5">
            <Film className="h-12 w-12 text-accent/30" />
          </div>
        )}
        {/* Play overlay */}
        <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity duration-300">
          <div className="h-12 w-12 rounded-full bg-accent/90 flex items-center justify-center shadow-glow-cyan">
            <Film className="h-5 w-5 text-accent-foreground" />
          </div>
        </div>
      </div>
      <div className="p-3">
        <h3 className="font-semibold text-sm line-clamp-2 group-hover:text-accent transition-colors">
          {film.title}
        </h3>
        <div className="flex items-center justify-between mt-2">
          <Badge
            variant="secondary"
            className="text-xs bg-accent/10 text-accent border-accent/20"
          >
            {film.genre}
          </Badge>
          <span className="text-muted-foreground text-xs">
            {Math.floor(Number(film.duration) / 60)}m
          </span>
        </div>
      </div>
    </motion.button>
  );
}

function SectionHeader({
  title,
  onViewAll,
  ocid,
}: {
  title: string;
  onViewAll: () => void;
  ocid: string;
}) {
  return (
    <div className="flex items-center justify-between mb-8">
      <h2 className="section-title font-display text-2xl font-bold">{title}</h2>
      <button
        type="button"
        className="flex items-center gap-1.5 text-sm text-primary hover:text-accent transition-colors font-medium group"
        onClick={onViewAll}
        data-ocid={ocid}
      >
        View all
        <ArrowRight className="h-3.5 w-3.5 group-hover:translate-x-1 transition-transform" />
      </button>
    </div>
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
      <section className="relative overflow-hidden py-32 px-4 starfield">
        {/* Deep space gradient layers */}
        <div className="absolute inset-0 bg-gradient-to-b from-background via-background/95 to-background" />
        <div
          className="absolute inset-0"
          style={{
            background:
              "radial-gradient(ellipse 70% 60% at 50% 0%, oklch(0.65 0.25 270 / 0.12), transparent 70%), radial-gradient(ellipse 50% 40% at 20% 100%, oklch(0.55 0.22 295 / 0.10), transparent 60%)",
          }}
        />

        <div className="relative container mx-auto text-center max-w-5xl">
          {/* Top badge */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
            className="flex items-center justify-center gap-3 mb-6"
          >
            <div className="flex items-center gap-2 px-4 py-1.5 rounded-full border border-primary/30 bg-primary/8 backdrop-blur-sm">
              <Sparkles className="h-4 w-4 text-accent shimmer" />
              <span className="text-primary text-xs font-semibold uppercase tracking-[0.3em]">
                Independent Stories
              </span>
              <Sparkles className="h-4 w-4 text-accent shimmer" />
            </div>
          </motion.div>

          {/* Main title */}
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.7, delay: 0.1 }}
          >
            <h1
              className="font-display text-6xl sm:text-8xl font-extrabold mb-1 leading-none tracking-tight"
              style={{
                background:
                  "linear-gradient(135deg, oklch(0.96 0.008 270), oklch(0.65 0.25 270), oklch(0.72 0.20 225))",
                WebkitBackgroundClip: "text",
                WebkitTextFillColor: "transparent",
                backgroundClip: "text",
                filter: "drop-shadow(0 0 40px oklch(0.65 0.25 270 / 0.4))",
              }}
            >
              STARWAVE
            </h1>
            <h2
              className="font-display text-3xl sm:text-5xl font-bold mb-3 tracking-[0.15em]"
              style={{
                background:
                  "linear-gradient(135deg, oklch(0.65 0.25 270), oklch(0.72 0.20 225))",
                WebkitBackgroundClip: "text",
                WebkitTextFillColor: "transparent",
                backgroundClip: "text",
              }}
            >
              CREATIONS
            </h2>
          </motion.div>

          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.6, delay: 0.3 }}
          >
            <p className="text-muted-foreground text-xs uppercase tracking-[0.35em] mb-3 font-semibold">
              BOOKSTORE &amp; FILM PLATFORM
            </p>

            {/* Category pills */}
            <div className="flex flex-wrap justify-center gap-2 mb-8">
              {[
                "Fiction",
                "Non-Fiction",
                "Drama",
                "Thriller",
                "Romance",
                "Sci-Fi",
                "Short Films",
                "Documentary",
              ].map((cat) => (
                <span
                  key={cat}
                  className="px-3 py-1 rounded-full text-xs border border-border/40 bg-secondary/50 text-muted-foreground backdrop-blur-sm"
                >
                  {cat}
                </span>
              ))}
            </div>

            <p className="text-muted-foreground text-lg mb-10 max-w-xl mx-auto">
              Discover books and short films from independent writers and
              directors
            </p>

            <div className="flex flex-wrap gap-4 justify-center">
              <Button
                size="lg"
                onClick={() => navigate({ name: "books" })}
                data-ocid="hero.books.button"
                className="px-8 shadow-glow-blue hover:shadow-glow-purple active:scale-[0.97] transition-all duration-200 font-semibold"
              >
                <BookOpen className="h-4 w-4 mr-2" />
                Browse Books
              </Button>
              <Button
                size="lg"
                variant="outline"
                onClick={() => navigate({ name: "films" })}
                data-ocid="hero.films.button"
                className="px-8 border-accent/40 text-accent hover:bg-accent/10 hover:border-accent/60 hover:shadow-glow-cyan active:scale-[0.97] transition-all duration-200 font-semibold"
              >
                <Film className="h-4 w-4 mr-2" />
                Watch Films
              </Button>
            </div>
          </motion.div>

          {/* Floating stars */}
          <div className="absolute top-8 left-[15%] opacity-40">
            <Star className="h-3 w-3 text-accent shimmer" fill="currentColor" />
          </div>
          <div
            className="absolute top-20 right-[12%] opacity-30"
            style={{ animationDelay: "1s" }}
          >
            <Star
              className="h-2 w-2 text-primary shimmer"
              fill="currentColor"
            />
          </div>
          <div
            className="absolute bottom-12 left-[8%] opacity-25"
            style={{ animationDelay: "1.8s" }}
          >
            <Star
              className="h-4 w-4 text-primary shimmer"
              fill="currentColor"
            />
          </div>
          <div
            className="absolute bottom-8 right-[20%] opacity-35"
            style={{ animationDelay: "0.7s" }}
          >
            <Star className="h-2 w-2 text-accent shimmer" fill="currentColor" />
          </div>
        </div>
      </section>

      {/* Featured Books */}
      <section className="container mx-auto px-4 py-16">
        <SectionHeader
          title="Featured Books"
          onViewAll={() => navigate({ name: "books" })}
          ocid="home.books.link"
        />
        {isLoading ? (
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-4">
            {Array.from({ length: 6 }).map((_, k) => (
              // biome-ignore lint/suspicious/noArrayIndexKey: skeleton
              <div key={k}>
                <Skeleton className="aspect-[2/3] rounded-xl mb-2" />
                <Skeleton className="h-4 w-3/4 mb-1" />
              </div>
            ))}
          </div>
        ) : books.length === 0 ? (
          <div
            className="text-center py-16 text-muted-foreground border border-border/40 rounded-xl bg-card/40 backdrop-blur-sm"
            data-ocid="home.books.empty_state"
          >
            <BookOpen className="h-10 w-10 mx-auto mb-3 opacity-20" />
            <p>No books published yet. Be the first creator!</p>
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
      <section className="container mx-auto px-4 py-16">
        <SectionHeader
          title="Short Films"
          onViewAll={() => navigate({ name: "films" })}
          ocid="home.films.link"
        />
        {isLoading ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
            {Array.from({ length: 4 }).map((_, k) => (
              // biome-ignore lint/suspicious/noArrayIndexKey: skeleton
              <div key={k}>
                <Skeleton className="aspect-video rounded-xl mb-2" />
                <Skeleton className="h-4 w-3/4 mb-1" />
              </div>
            ))}
          </div>
        ) : films.length === 0 ? (
          <div
            className="text-center py-16 text-muted-foreground border border-border/40 rounded-xl bg-card/40 backdrop-blur-sm"
            data-ocid="home.films.empty_state"
          >
            <Film className="h-10 w-10 mx-auto mb-3 opacity-20" />
            <p>No films published yet. Be the first director!</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
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
      <section className="container mx-auto px-4 py-16">
        <SectionHeader
          title="Meet Our Creators"
          onViewAll={() => navigate({ name: "creators" })}
          ocid="home.creators.link"
        />
        {creatorsLoading ? (
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-4">
            {["s1", "s2", "s3", "s4", "s5", "s6"].map((k) => (
              <div
                key={k}
                className="rounded-xl border border-border/60 bg-card/60 p-4"
              >
                <Skeleton className="h-12 w-12 rounded-full mb-3 mx-auto" />
                <Skeleton className="h-4 w-3/4 mx-auto mb-2" />
                <Skeleton className="h-3 w-1/2 mx-auto" />
              </div>
            ))}
          </div>
        ) : featuredCreators.length === 0 ? (
          <div
            className="text-center py-16 text-muted-foreground border border-border/40 rounded-xl bg-card/40 backdrop-blur-sm"
            data-ocid="home.creators.empty_state"
          >
            <Users className="h-10 w-10 mx-auto mb-3 opacity-20" />
            <p>No creators have registered yet.</p>
          </div>
        ) : (
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-4">
            {featuredCreators.map((creator, i) => (
              <motion.div
                key={creator.principal.toString()}
                data-ocid={`home.creators.item.${i + 1}`}
                className="rounded-xl border border-border/60 bg-card/80 p-4 flex flex-col items-center text-center backdrop-blur-sm cursor-pointer"
                style={{ boxShadow: "0 4px 24px oklch(0.10 0.05 270 / 0.7)" }}
                whileHover={{
                  borderColor: "oklch(0.65 0.25 270 / 0.5)",
                  boxShadow:
                    "0 0 20px oklch(0.65 0.25 270 / 0.4), 0 4px 16px oklch(0.10 0.05 270 / 0.8)",
                  y: -3,
                }}
                transition={{ duration: 0.2 }}
              >
                <div className="h-12 w-12 rounded-full bg-primary/15 border border-primary/30 flex items-center justify-center mb-3 shadow-glow-blue">
                  <Users className="h-6 w-6 text-primary" />
                </div>
                <p className="font-semibold text-sm line-clamp-1 mb-1">
                  {creator.name}
                </p>
                <Badge
                  variant="secondary"
                  className="text-xs mb-3 bg-primary/10 text-primary border-primary/20"
                >
                  Creator
                </Badge>
                <Button
                  size="sm"
                  variant="outline"
                  className="w-full text-xs border-border/60 hover:border-primary/50 hover:bg-primary/10 hover:text-primary transition-all duration-200"
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
              </motion.div>
            ))}
          </div>
        )}
      </section>

      {/* Footer */}
      <footer className="border-t border-border/40 mt-8 py-10 text-center">
        <div className="container mx-auto px-4">
          <div className="flex items-center justify-center gap-2 mb-3">
            <Star
              className="h-4 w-4 text-primary shimmer"
              fill="currentColor"
            />
            <span className="font-display font-bold text-sm tracking-widest text-muted-foreground/60 uppercase">
              STARWAVE CREATIONS
            </span>
            <Star
              className="h-4 w-4 text-primary shimmer"
              fill="currentColor"
            />
          </div>
          <p className="text-sm text-muted-foreground/50">
            &copy; {new Date().getFullYear()}. Built with{" "}
            <span className="text-primary/60">♥</span> using{" "}
            <a
              href={`https://caffeine.ai?utm_source=caffeine-footer&utm_medium=referral&utm_content=${encodeURIComponent(window.location.hostname)}`}
              target="_blank"
              rel="noopener noreferrer"
              className="text-primary/70 hover:text-primary transition-colors"
            >
              caffeine.ai
            </a>
          </p>
        </div>
      </footer>
    </div>
  );
}
