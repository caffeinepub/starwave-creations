import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Skeleton } from "@/components/ui/skeleton";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Textarea } from "@/components/ui/textarea";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
  BookOpen,
  DollarSign,
  Film,
  Loader2,
  Plus,
  Trash2,
  Upload,
} from "lucide-react";
import { useRef, useState } from "react";
import { toast } from "sonner";
import type { Page } from "../App";
import { type Book, ExternalBlob, type ShortFilm } from "../backend";
import { useActor } from "../hooks/useActor";
import { useInternetIdentity } from "../hooks/useInternetIdentity";

interface CreatorDashboardProps {
  navigate: (p: Page) => void;
}

function useFileUpload() {
  const [progress, setProgress] = useState(0);
  const upload = async (file: File): Promise<ExternalBlob> => {
    const bytes = new Uint8Array(await file.arrayBuffer());
    return ExternalBlob.fromBytes(bytes).withUploadProgress(setProgress);
  };
  return { upload, progress };
}

function BookForm({
  onSubmit,
}: { onSubmit: (b: Partial<Book> & { coverFile?: File }) => void }) {
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [genre, setGenre] = useState("");
  const [price, setPrice] = useState("");
  const [coverFile, setCoverFile] = useState<File | undefined>();
  const fileRef = useRef<HTMLInputElement>(null);

  return (
    <div className="space-y-4">
      <div>
        <Label>Title</Label>
        <Input
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          className="mt-1"
          data-ocid="book_form.title.input"
        />
      </div>
      <div>
        <Label>Description</Label>
        <Textarea
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          className="mt-1"
          data-ocid="book_form.description.textarea"
        />
      </div>
      <div>
        <Label>Genre</Label>
        <Input
          value={genre}
          onChange={(e) => setGenre(e.target.value)}
          className="mt-1"
          data-ocid="book_form.genre.input"
        />
      </div>
      <div>
        <Label>Price (USD)</Label>
        <Input
          type="number"
          value={price}
          onChange={(e) => setPrice(e.target.value)}
          className="mt-1"
          placeholder="9.99"
          data-ocid="book_form.price.input"
        />
      </div>
      <div>
        <Label>Cover Image</Label>
        <div className="mt-1 flex items-center gap-3">
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={() => fileRef.current?.click()}
            data-ocid="book_form.cover.upload_button"
          >
            <Upload className="h-4 w-4 mr-1" />
            {coverFile ? coverFile.name : "Choose File"}
          </Button>
          <input
            ref={fileRef}
            type="file"
            accept="image/*"
            className="hidden"
            onChange={(e) => setCoverFile(e.target.files?.[0])}
          />
        </div>
      </div>
      <Button
        className="w-full"
        onClick={() =>
          onSubmit({
            title,
            description,
            genre,
            priceCents: BigInt(Math.round(Number.parseFloat(price) * 100)),
            coverFile,
          })
        }
        disabled={!title || !price}
        data-ocid="book_form.submit.submit_button"
      >
        Save Book
      </Button>
    </div>
  );
}

function FilmFormComponent({
  onSubmit,
}: {
  onSubmit: (
    data: Partial<ShortFilm> & { videoFile?: File; thumbFile?: File },
  ) => void;
}) {
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [genre, setGenre] = useState("");
  const [duration, setDuration] = useState("");
  const [videoFile, setVideoFile] = useState<File | undefined>();
  const [thumbFile, setThumbFile] = useState<File | undefined>();
  const videoRef = useRef<HTMLInputElement>(null);
  const thumbRef = useRef<HTMLInputElement>(null);

  return (
    <div className="space-y-4">
      <div>
        <Label>Title</Label>
        <Input
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          className="mt-1"
          data-ocid="film_form.title.input"
        />
      </div>
      <div>
        <Label>Description</Label>
        <Textarea
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          className="mt-1"
          data-ocid="film_form.description.textarea"
        />
      </div>
      <div>
        <Label>Genre</Label>
        <Input
          value={genre}
          onChange={(e) => setGenre(e.target.value)}
          className="mt-1"
          data-ocid="film_form.genre.input"
        />
      </div>
      <div>
        <Label>Duration (seconds)</Label>
        <Input
          type="number"
          value={duration}
          onChange={(e) => setDuration(e.target.value)}
          className="mt-1"
          placeholder="120"
          data-ocid="film_form.duration.input"
        />
      </div>
      <div>
        <Label>Video File</Label>
        <div className="mt-1">
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={() => videoRef.current?.click()}
            data-ocid="film_form.video.upload_button"
          >
            <Upload className="h-4 w-4 mr-1" />
            {videoFile ? videoFile.name : "Choose Video"}
          </Button>
          <input
            ref={videoRef}
            type="file"
            accept="video/*"
            className="hidden"
            onChange={(e) => setVideoFile(e.target.files?.[0])}
          />
        </div>
      </div>
      <div>
        <Label>Thumbnail</Label>
        <div className="mt-1">
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={() => thumbRef.current?.click()}
            data-ocid="film_form.thumbnail.upload_button"
          >
            <Upload className="h-4 w-4 mr-1" />
            {thumbFile ? thumbFile.name : "Choose Thumbnail"}
          </Button>
          <input
            ref={thumbRef}
            type="file"
            accept="image/*"
            className="hidden"
            onChange={(e) => setThumbFile(e.target.files?.[0])}
          />
        </div>
      </div>
      <Button
        className="w-full"
        onClick={() =>
          onSubmit({
            title,
            description,
            genre,
            duration: BigInt(Number.parseInt(duration) || 0),
            videoFile,
            thumbFile,
          })
        }
        disabled={!title}
        data-ocid="film_form.submit.submit_button"
      >
        Save Film
      </Button>
    </div>
  );
}

export default function CreatorDashboard({
  navigate: _navigate,
}: CreatorDashboardProps) {
  const { actor } = useActor();
  const { identity, login } = useInternetIdentity();
  const queryClient = useQueryClient();
  const { upload } = useFileUpload();
  const [bookDialogOpen, setBookDialogOpen] = useState(false);
  const [filmDialogOpen, setFilmDialogOpen] = useState(false);
  const [isSubmittingBook, setIsSubmittingBook] = useState(false);
  const [isSubmittingFilm, setIsSubmittingFilm] = useState(false);

  const { data: myBooks = [], isLoading: loadingBooks } = useQuery({
    queryKey: ["my-books"],
    queryFn: () => actor!.getMyBooks(),
    enabled: !!actor && !!identity,
  });

  const { data: myFilms = [], isLoading: loadingFilms } = useQuery({
    queryKey: ["my-films"],
    queryFn: () => actor!.getMyShortFilms(),
    enabled: !!actor && !!identity,
  });

  const { data: earnings } = useQuery({
    queryKey: ["my-earnings"],
    queryFn: () => actor!.getMyEarnings(),
    enabled: !!actor && !!identity,
  });

  const deleteBookMutation = useMutation({
    mutationFn: (id: string) => actor!.deleteBook(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["my-books"] });
      toast.success("Book deleted.");
    },
    onError: () => toast.error("Failed to delete book."),
  });

  const deleteFilmMutation = useMutation({
    mutationFn: (id: string) => actor!.deleteShortFilm(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["my-films"] });
      toast.success("Film deleted.");
    },
    onError: () => toast.error("Failed to delete film."),
  });

  const handleSubmitBook = async (
    data: Partial<Book> & { coverFile?: File },
  ) => {
    if (!actor || !identity) return;
    setIsSubmittingBook(true);
    try {
      let coverBlob = ExternalBlob.fromBytes(new Uint8Array());
      if (data.coverFile) coverBlob = await upload(data.coverFile);
      const book: Book = {
        id: crypto.randomUUID(),
        title: data.title ?? "",
        description: data.description ?? "",
        author: identity.getPrincipal(),
        genre: data.genre ?? "",
        priceCents: data.priceCents ?? 0n,
        coverImageId: coverBlob,
        isPublished: false,
        publishedAt: undefined,
      };
      await actor.submitBook(book);
      queryClient.invalidateQueries({ queryKey: ["my-books"] });
      setBookDialogOpen(false);
      toast.success("Book submitted for review!");
    } catch {
      toast.error("Failed to submit book.");
    } finally {
      setIsSubmittingBook(false);
    }
  };

  const handleSubmitFilm = async (
    data: Partial<ShortFilm> & { videoFile?: File; thumbFile?: File },
  ) => {
    if (!actor || !identity) return;
    setIsSubmittingFilm(true);
    try {
      let videoBlob = ExternalBlob.fromBytes(new Uint8Array());
      let thumbBlob = ExternalBlob.fromBytes(new Uint8Array());
      if (data.videoFile) videoBlob = await upload(data.videoFile);
      if (data.thumbFile) thumbBlob = await upload(data.thumbFile);
      const film: ShortFilm = {
        id: crypto.randomUUID(),
        title: data.title ?? "",
        description: data.description ?? "",
        director: identity.getPrincipal(),
        genre: data.genre ?? "",
        duration: data.duration ?? 0n,
        videoId: videoBlob,
        thumbnailId: thumbBlob,
        isPublished: false,
        publishedAt: undefined,
      };
      await actor.submitShortFilm(film);
      queryClient.invalidateQueries({ queryKey: ["my-films"] });
      setFilmDialogOpen(false);
      toast.success("Film submitted for review!");
    } catch {
      toast.error("Failed to submit film.");
    } finally {
      setIsSubmittingFilm(false);
    }
  };

  if (!identity) {
    return (
      <div className="container mx-auto px-4 py-20 text-center">
        <h2 className="font-display text-2xl font-bold mb-2">
          Sign In to Access Creator Dashboard
        </h2>
        <p className="text-muted-foreground mb-6">
          Manage your books and films here.
        </p>
        <Button onClick={login} data-ocid="creator.login.button">
          Sign In
        </Button>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-10">
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="font-display text-4xl font-bold">Creator Dashboard</h1>
          <p className="text-muted-foreground mt-1">
            Manage your content and track earnings.
          </p>
        </div>
        {earnings !== undefined && (
          <div className="text-right">
            <div className="flex items-center gap-1 text-accent text-2xl font-bold">
              <DollarSign className="h-5 w-5" />
              {(Number(earnings) / 100).toFixed(2)}
            </div>
            <p className="text-muted-foreground text-xs">Total Earnings</p>
          </div>
        )}
      </div>
      <Tabs defaultValue="books">
        <TabsList className="mb-6" data-ocid="creator.tabs.tab">
          <TabsTrigger value="books">
            <BookOpen className="h-4 w-4 mr-1" />
            Books
          </TabsTrigger>
          <TabsTrigger value="films">
            <Film className="h-4 w-4 mr-1" />
            Films
          </TabsTrigger>
        </TabsList>
        <TabsContent value="books">
          <div className="flex justify-end mb-4">
            <Dialog open={bookDialogOpen} onOpenChange={setBookDialogOpen}>
              <DialogTrigger asChild>
                <Button data-ocid="creator.add_book.open_modal_button">
                  <Plus className="h-4 w-4 mr-1" />
                  Add Book
                </Button>
              </DialogTrigger>
              <DialogContent data-ocid="creator.book_form.dialog">
                <DialogHeader>
                  <DialogTitle>Submit a New Book</DialogTitle>
                </DialogHeader>
                {isSubmittingBook ? (
                  <div
                    className="flex items-center justify-center py-10"
                    data-ocid="creator.book_form.loading_state"
                  >
                    <Loader2 className="h-8 w-8 animate-spin text-primary" />
                    <span className="ml-2 text-muted-foreground">
                      Uploading...
                    </span>
                  </div>
                ) : (
                  <BookForm onSubmit={handleSubmitBook} />
                )}
              </DialogContent>
            </Dialog>
          </div>
          {loadingBooks ? (
            <div className="space-y-3" data-ocid="creator.books.loading_state">
              {Array.from({ length: 3 }).map((_, i) => (
                // biome-ignore lint/suspicious/noArrayIndexKey: skeleton placeholders
                <Skeleton key={i} className="h-20 rounded-lg" />
              ))}
            </div>
          ) : myBooks.length === 0 ? (
            <div
              className="text-center py-16 text-muted-foreground"
              data-ocid="creator.books.empty_state"
            >
              No books yet. Submit your first book!
            </div>
          ) : (
            <div className="space-y-3">
              {myBooks.map((book, i) => (
                <div
                  key={book.id}
                  className="flex items-center justify-between p-4 rounded-lg border border-border bg-card"
                  data-ocid={`creator.books.item.${i + 1}`}
                >
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="font-semibold">{book.title}</span>
                      <Badge
                        variant={book.isPublished ? "default" : "secondary"}
                      >
                        {book.isPublished ? "Published" : "Pending Review"}
                      </Badge>
                    </div>
                    <p className="text-muted-foreground text-sm">
                      {book.genre} &bull; $
                      {(Number(book.priceCents) / 100).toFixed(2)}
                    </p>
                  </div>
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => deleteBookMutation.mutate(book.id)}
                    data-ocid={`creator.books.delete_button.${i + 1}`}
                  >
                    <Trash2 className="h-4 w-4 text-destructive" />
                  </Button>
                </div>
              ))}
            </div>
          )}
        </TabsContent>
        <TabsContent value="films">
          <div className="flex justify-end mb-4">
            <Dialog open={filmDialogOpen} onOpenChange={setFilmDialogOpen}>
              <DialogTrigger asChild>
                <Button data-ocid="creator.add_film.open_modal_button">
                  <Plus className="h-4 w-4 mr-1" />
                  Add Film
                </Button>
              </DialogTrigger>
              <DialogContent data-ocid="creator.film_form.dialog">
                <DialogHeader>
                  <DialogTitle>Submit a New Short Film</DialogTitle>
                </DialogHeader>
                {isSubmittingFilm ? (
                  <div
                    className="flex items-center justify-center py-10"
                    data-ocid="creator.film_form.loading_state"
                  >
                    <Loader2 className="h-8 w-8 animate-spin text-primary" />
                    <span className="ml-2 text-muted-foreground">
                      Uploading...
                    </span>
                  </div>
                ) : (
                  <FilmFormComponent onSubmit={handleSubmitFilm} />
                )}
              </DialogContent>
            </Dialog>
          </div>
          {loadingFilms ? (
            <div className="space-y-3" data-ocid="creator.films.loading_state">
              {Array.from({ length: 3 }).map((_, i) => (
                // biome-ignore lint/suspicious/noArrayIndexKey: skeleton placeholders
                <Skeleton key={i} className="h-20 rounded-lg" />
              ))}
            </div>
          ) : myFilms.length === 0 ? (
            <div
              className="text-center py-16 text-muted-foreground"
              data-ocid="creator.films.empty_state"
            >
              No films yet. Submit your first film!
            </div>
          ) : (
            <div className="space-y-3">
              {myFilms.map((film, i) => (
                <div
                  key={film.id}
                  className="flex items-center justify-between p-4 rounded-lg border border-border bg-card"
                  data-ocid={`creator.films.item.${i + 1}`}
                >
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="font-semibold">{film.title}</span>
                      <Badge
                        variant={film.isPublished ? "default" : "secondary"}
                      >
                        {film.isPublished ? "Published" : "Pending Review"}
                      </Badge>
                    </div>
                    <p className="text-muted-foreground text-sm">
                      {film.genre} &bull;{" "}
                      {Math.floor(Number(film.duration) / 60)}m
                    </p>
                  </div>
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => deleteFilmMutation.mutate(film.id)}
                    data-ocid={`creator.films.delete_button.${i + 1}`}
                  >
                    <Trash2 className="h-4 w-4 text-destructive" />
                  </Button>
                </div>
              ))}
            </div>
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
}
