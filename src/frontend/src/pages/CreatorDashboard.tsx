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
  const [offlineLocation, setOfflineLocation] = useState("");
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
        <Label>Offline Location (optional)</Label>
        <Input
          value={offlineLocation}
          onChange={(e) => setOfflineLocation(e.target.value)}
          className="mt-1"
          placeholder="e.g. My Bookshop, Hyderabad"
          data-ocid="book_form.offline_location.input"
        />
        <p className="text-xs text-muted-foreground mt-1">
          Where can readers find this book offline?
        </p>
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
            offlineLocation: offlineLocation || undefined,
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
        <Label>Thumbnail Image</Label>
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
            duration: BigInt(duration || "0"),
            videoFile,
            thumbFile,
          })
        }
        disabled={!title || !duration}
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
  const { identity } = useInternetIdentity();
  const queryClient = useQueryClient();
  const { upload } = useFileUpload();
  const [bookDialogOpen, setBookDialogOpen] = useState(false);
  const [filmDialogOpen, setFilmDialogOpen] = useState(false);

  const { data: myBooks, isLoading: booksLoading } = useQuery({
    queryKey: ["my-books"],
    queryFn: () => actor!.getMyBooks(),
    enabled: !!actor && !!identity,
  });

  const { data: myFilms, isLoading: filmsLoading } = useQuery({
    queryKey: ["my-films"],
    queryFn: () => actor!.getMyShortFilms(),
    enabled: !!actor && !!identity,
  });

  const { data: earnings } = useQuery({
    queryKey: ["my-earnings"],
    queryFn: () => actor!.getMyEarnings(),
    enabled: !!actor && !!identity,
  });

  const submitBook = useMutation({
    mutationFn: async (data: Partial<Book> & { coverFile?: File }) => {
      let coverImageId = ExternalBlob.fromBytes(new Uint8Array());
      if (data.coverFile) {
        coverImageId = await upload(data.coverFile);
      }
      const principal = identity!.getPrincipal();
      await actor!.submitBook({
        id: crypto.randomUUID(),
        title: data.title ?? "",
        description: data.description ?? "",
        genre: data.genre ?? "",
        priceCents: data.priceCents ?? BigInt(0),
        coverImageId,
        author: principal,
        isPublished: false,
        offlineLocation: data.offlineLocation,
      } as Book);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["my-books"] });
      toast.success("Book submitted for review!");
      setBookDialogOpen(false);
    },
    onError: () => toast.error("Failed to submit book."),
  });

  const submitFilm = useMutation({
    mutationFn: async (
      data: Partial<ShortFilm> & { videoFile?: File; thumbFile?: File },
    ) => {
      let videoId = ExternalBlob.fromBytes(new Uint8Array());
      let thumbnailId = ExternalBlob.fromBytes(new Uint8Array());
      if (data.videoFile) {
        videoId = await upload(data.videoFile);
      }
      if (data.thumbFile) {
        thumbnailId = await upload(data.thumbFile);
      }
      const principal = identity!.getPrincipal();
      await actor!.submitShortFilm({
        id: crypto.randomUUID(),
        title: data.title ?? "",
        description: data.description ?? "",
        genre: data.genre ?? "",
        duration: data.duration ?? BigInt(0),
        videoId,
        thumbnailId,
        director: principal,
        isPublished: false,
      } as ShortFilm);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["my-films"] });
      toast.success("Film submitted for review!");
      setFilmDialogOpen(false);
    },
    onError: () => toast.error("Failed to submit film."),
  });

  const deleteBook = useMutation({
    mutationFn: (id: string) => actor!.deleteBook(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["my-books"] });
      toast.success("Book deleted.");
    },
    onError: () => toast.error("Failed to delete book."),
  });

  const deleteFilm = useMutation({
    mutationFn: (id: string) => actor!.deleteShortFilm(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["my-films"] });
      toast.success("Film deleted.");
    },
    onError: () => toast.error("Failed to delete film."),
  });

  if (!identity) {
    return (
      <div className="container mx-auto px-4 py-20 text-center">
        <p className="text-muted-foreground">
          Please sign in to access Creator Dashboard.
        </p>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-12 max-w-5xl">
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="font-display text-3xl font-bold mb-1">
            Creator Dashboard
          </h1>
          <p className="text-muted-foreground">Manage your books and films</p>
        </div>
        {earnings !== undefined && (
          <div className="rounded-lg border border-border bg-card px-4 py-3 text-right">
            <div className="flex items-center gap-2 text-muted-foreground text-sm">
              <DollarSign className="h-4 w-4" />
              Total Earnings
            </div>
            <p className="font-bold text-xl text-primary">
              ${(Number(earnings) / 100).toFixed(2)}
            </p>
          </div>
        )}
      </div>

      <Tabs defaultValue="books">
        <TabsList className="mb-6">
          <TabsTrigger value="books" data-ocid="creator.books.tab">
            <BookOpen className="h-4 w-4 mr-2" /> My Books
          </TabsTrigger>
          <TabsTrigger value="films" data-ocid="creator.films.tab">
            <Film className="h-4 w-4 mr-2" /> My Films
          </TabsTrigger>
        </TabsList>

        <TabsContent value="books">
          <div className="flex justify-end mb-4">
            <Dialog open={bookDialogOpen} onOpenChange={setBookDialogOpen}>
              <DialogTrigger asChild>
                <Button data-ocid="creator.add_book.open_modal_button">
                  <Plus className="h-4 w-4 mr-2" /> Add Book
                </Button>
              </DialogTrigger>
              <DialogContent className="max-w-md max-h-[90vh] overflow-y-auto">
                <DialogHeader>
                  <DialogTitle>Submit a Book</DialogTitle>
                </DialogHeader>
                <BookForm onSubmit={(data) => submitBook.mutate(data)} />
              </DialogContent>
            </Dialog>
          </div>

          {booksLoading ? (
            <div className="space-y-3">
              {Array.from({ length: 3 }).map((_, i) => (
                // biome-ignore lint/suspicious/noArrayIndexKey: skeleton
                <Skeleton key={i} className="h-20 w-full rounded-lg" />
              ))}
            </div>
          ) : !myBooks || myBooks.length === 0 ? (
            <div
              className="text-center py-12 text-muted-foreground border border-border rounded-lg"
              data-ocid="creator.books.empty_state"
            >
              No books yet. Add your first book!
            </div>
          ) : (
            <div className="space-y-3">
              {myBooks.map((book, i) => (
                <div
                  key={book.id}
                  data-ocid={`creator.books.item.${i + 1}`}
                  className="flex items-center gap-4 rounded-lg border border-border bg-card p-4"
                >
                  <BookOpen className="h-8 w-8 text-muted-foreground shrink-0" />
                  <div className="flex-1 min-w-0">
                    <p className="font-semibold truncate">{book.title}</p>
                    <div className="flex items-center gap-2 mt-1">
                      <Badge variant="secondary" className="text-xs">
                        {book.genre}
                      </Badge>
                      <Badge
                        variant={book.isPublished ? "default" : "outline"}
                        className="text-xs"
                      >
                        {book.isPublished ? "Published" : "Pending"}
                      </Badge>
                    </div>
                  </div>
                  <span className="text-primary font-bold">
                    ${(Number(book.priceCents) / 100).toFixed(2)}
                  </span>
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => deleteBook.mutate(book.id)}
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
                  <Plus className="h-4 w-4 mr-2" /> Add Film
                </Button>
              </DialogTrigger>
              <DialogContent className="max-w-md max-h-[90vh] overflow-y-auto">
                <DialogHeader>
                  <DialogTitle>Submit a Short Film</DialogTitle>
                </DialogHeader>
                <FilmFormComponent
                  onSubmit={(data) => submitFilm.mutate(data)}
                />
              </DialogContent>
            </Dialog>
          </div>

          {filmsLoading ? (
            <div className="space-y-3">
              {Array.from({ length: 3 }).map((_, i) => (
                // biome-ignore lint/suspicious/noArrayIndexKey: skeleton
                <Skeleton key={i} className="h-20 w-full rounded-lg" />
              ))}
            </div>
          ) : !myFilms || myFilms.length === 0 ? (
            <div
              className="text-center py-12 text-muted-foreground border border-border rounded-lg"
              data-ocid="creator.films.empty_state"
            >
              No films yet. Add your first short film!
            </div>
          ) : (
            <div className="space-y-3">
              {myFilms.map((film, i) => (
                <div
                  key={film.id}
                  data-ocid={`creator.films.item.${i + 1}`}
                  className="flex items-center gap-4 rounded-lg border border-border bg-card p-4"
                >
                  <Film className="h-8 w-8 text-muted-foreground shrink-0" />
                  <div className="flex-1 min-w-0">
                    <p className="font-semibold truncate">{film.title}</p>
                    <div className="flex items-center gap-2 mt-1">
                      <Badge variant="secondary" className="text-xs">
                        {film.genre}
                      </Badge>
                      <Badge
                        variant={film.isPublished ? "default" : "outline"}
                        className="text-xs"
                      >
                        {film.isPublished ? "Published" : "Pending"}
                      </Badge>
                    </div>
                  </div>
                  <span className="text-muted-foreground text-sm">
                    {Math.floor(Number(film.duration) / 60)}m
                  </span>
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => deleteFilm.mutate(film.id)}
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
