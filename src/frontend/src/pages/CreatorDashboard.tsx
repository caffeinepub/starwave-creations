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
  Film,
  Loader2,
  Plus,
  Trash2,
  TrendingUp,
  Upload,
} from "lucide-react";
import { useRef, useState } from "react";
import { toast } from "sonner";
import type { Page } from "../App";
import { type Book, ExternalBlob, type ShortFilm } from "../backend";
import { useActor } from "../hooks/useActor";
import { useInternetIdentity } from "../hooks/useInternetIdentity";
import { formatINR, splitNote } from "../lib/bookPricing";

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

interface BookFormData {
  title: string;
  description: string;
  genre: string;
  priceCents: bigint;
  offlinePriceCents: [] | [bigint];
  offlineLocation?: string;
  coverFile?: File;
  bookFile?: File;
}

function BookForm({ onSubmit }: { onSubmit: (data: BookFormData) => void }) {
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [creatorNote, setCreatorNote] = useState("");
  const [genre, setGenre] = useState("");
  const [onlinePrice, setOnlinePrice] = useState("");
  const [offlinePrice, setOfflinePrice] = useState("");
  const [coverFile, setCoverFile] = useState<File | undefined>();
  const [bookFile, setBookFile] = useState<File | undefined>();
  const [offlineLocation, setOfflineLocation] = useState("");
  const fileRef = useRef<HTMLInputElement>(null);
  const bookFileRef = useRef<HTMLInputElement>(null);

  const onlinePaise = onlinePrice
    ? Math.round(Number.parseFloat(onlinePrice) * 100)
    : 0;
  const offlinePaise = offlinePrice
    ? Math.round(Number.parseFloat(offlinePrice) * 100)
    : 0;
  const hasOfflineLocation = offlineLocation.trim().length > 0;

  const finalDescription =
    description +
    (creatorNote.trim() ? `\n\nCreator's Note: ${creatorNote.trim()}` : "");

  return (
    <div className="space-y-4">
      <div>
        <Label>Title</Label>
        <Input
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          className="mt-1 border-border/60 bg-secondary/30 focus:border-primary/60 transition-all duration-200"
          data-ocid="book_form.title.input"
        />
      </div>
      <div>
        <Label>Description</Label>
        <Textarea
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          className="mt-1 border-border/60 bg-secondary/30 focus:border-primary/60 transition-all duration-200"
          data-ocid="book_form.description.textarea"
        />
      </div>
      <div>
        <Label>
          Creator's Note{" "}
          <span className="text-muted-foreground font-normal">(optional)</span>
        </Label>
        <Textarea
          value={creatorNote}
          onChange={(e) => setCreatorNote(e.target.value)}
          placeholder="Add a personal note or message for your readers..."
          className="mt-1 border-border/60 bg-secondary/30 focus:border-primary/60 transition-all duration-200 min-h-[80px]"
          data-ocid="book_form.creator_note.textarea"
        />
        <p className="text-xs text-muted-foreground mt-1">
          This note will appear at the end of your book description.
        </p>
      </div>
      <div>
        <Label>Genre</Label>
        <Input
          value={genre}
          onChange={(e) => setGenre(e.target.value)}
          className="mt-1 border-border/60 bg-secondary/30"
          data-ocid="book_form.genre.input"
        />
      </div>

      <div>
        <Label>Online Price (₹)</Label>
        <Input
          type="number"
          value={onlinePrice}
          onChange={(e) => setOnlinePrice(e.target.value)}
          className="mt-1 border-border/60 bg-secondary/30"
          placeholder="e.g. 199"
          data-ocid="book_form.online_price.input"
        />
        {onlinePaise > 0 && (
          <p className="text-xs text-accent mt-1">{splitNote(onlinePaise)}</p>
        )}
      </div>

      <div>
        <Label>Offline Location (optional)</Label>
        <Input
          value={offlineLocation}
          onChange={(e) => setOfflineLocation(e.target.value)}
          className="mt-1 border-border/60 bg-secondary/30"
          placeholder="e.g. My Bookshop, Hyderabad"
          data-ocid="book_form.offline_location.input"
        />
        <p className="text-xs text-muted-foreground mt-1">
          Where can readers find this book offline? Leave blank if not available
          offline.
        </p>
      </div>

      {hasOfflineLocation && (
        <div>
          <Label>
            Offline Price (₹){" "}
            <span className="text-muted-foreground font-normal">
              (for physical copy)
            </span>
          </Label>
          <Input
            type="number"
            value={offlinePrice}
            onChange={(e) => setOfflinePrice(e.target.value)}
            className="mt-1 border-border/60 bg-secondary/30"
            placeholder="e.g. 299"
            data-ocid="book_form.offline_price.input"
          />
          {offlinePaise > 0 && (
            <p className="text-xs text-accent mt-1">
              {splitNote(offlinePaise)}
            </p>
          )}
        </div>
      )}

      <div>
        <Label>Cover Image</Label>
        <div className="mt-1 flex items-center gap-3">
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={() => fileRef.current?.click()}
            className="border-border/60 hover:border-primary/50 hover:bg-primary/10 transition-all duration-200"
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

      <div>
        <Label>Book Content File (PDF, EPUB, DOC) — optional</Label>
        <div className="mt-1 flex items-center gap-3">
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={() => bookFileRef.current?.click()}
            className="border-border/60 hover:border-primary/50 hover:bg-primary/10 transition-all duration-200"
            data-ocid="book_form.book_file.upload_button"
          >
            <Upload className="h-4 w-4 mr-1" />
            {bookFile ? bookFile.name : "Choose Book File"}
          </Button>
          <input
            ref={bookFileRef}
            type="file"
            accept=".pdf,.epub,.doc,.docx"
            className="hidden"
            onChange={(e) => setBookFile(e.target.files?.[0])}
          />
        </div>
        <p className="text-xs text-muted-foreground mt-1">
          Upload the book file so purchased readers can read and download it
          online.
        </p>
      </div>

      <Button
        className="w-full shadow-glow-blue hover:shadow-glow-purple transition-all duration-200 font-semibold"
        onClick={() =>
          onSubmit({
            title,
            description: finalDescription,
            genre,
            priceCents: BigInt(onlinePaise),
            offlinePriceCents:
              hasOfflineLocation && offlinePaise > 0
                ? [BigInt(offlinePaise)]
                : [],
            offlineLocation: offlineLocation.trim() || undefined,
            coverFile,
            bookFile,
          })
        }
        disabled={!title || !onlinePrice}
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
  const [creatorNote, setCreatorNote] = useState("");
  const [genre, setGenre] = useState("");
  const [duration, setDuration] = useState("");
  const [videoFile, setVideoFile] = useState<File | undefined>();
  const [thumbFile, setThumbFile] = useState<File | undefined>();
  const videoRef = useRef<HTMLInputElement>(null);
  const thumbRef = useRef<HTMLInputElement>(null);

  const finalDescription =
    description +
    (creatorNote.trim() ? `\n\nCreator's Note: ${creatorNote.trim()}` : "");

  return (
    <div className="space-y-4">
      <div>
        <Label>Title</Label>
        <Input
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          className="mt-1 border-border/60 bg-secondary/30 focus:border-primary/60 transition-all duration-200"
          data-ocid="film_form.title.input"
        />
      </div>
      <div>
        <Label>Description</Label>
        <Textarea
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          className="mt-1 border-border/60 bg-secondary/30 focus:border-primary/60 transition-all duration-200"
          data-ocid="film_form.description.textarea"
        />
      </div>
      <div>
        <Label>
          Creator's Note{" "}
          <span className="text-muted-foreground font-normal">(optional)</span>
        </Label>
        <Textarea
          value={creatorNote}
          onChange={(e) => setCreatorNote(e.target.value)}
          placeholder="Add a personal note or message for your viewers..."
          className="mt-1 border-border/60 bg-secondary/30 focus:border-primary/60 transition-all duration-200 min-h-[80px]"
          data-ocid="film_form.creator_note.textarea"
        />
        <p className="text-xs text-muted-foreground mt-1">
          This note will appear at the end of your film description.
        </p>
      </div>
      <div>
        <Label>Genre</Label>
        <Input
          value={genre}
          onChange={(e) => setGenre(e.target.value)}
          className="mt-1 border-border/60 bg-secondary/30"
          data-ocid="film_form.genre.input"
        />
      </div>
      <div>
        <Label>Duration (seconds)</Label>
        <Input
          type="number"
          value={duration}
          onChange={(e) => setDuration(e.target.value)}
          className="mt-1 border-border/60 bg-secondary/30"
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
            className="border-border/60 hover:border-accent/50 hover:bg-accent/10 hover:text-accent transition-all duration-200"
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
            className="border-border/60 hover:border-primary/50 hover:bg-primary/10 transition-all duration-200"
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
        className="w-full shadow-glow-blue hover:shadow-glow-purple transition-all duration-200 font-semibold"
        onClick={() =>
          onSubmit({
            title,
            description: finalDescription,
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

  const submitBook = useMutation({
    mutationFn: async (data: BookFormData) => {
      let coverImageId = ExternalBlob.fromBytes(new Uint8Array());
      if (data.coverFile) {
        coverImageId = await upload(data.coverFile);
      }
      let fileId: ExternalBlob | undefined;
      if (data.bookFile) {
        fileId = ExternalBlob.fromBytes(
          new Uint8Array(await data.bookFile.arrayBuffer()),
        );
      }
      const principal = identity!.getPrincipal();
      const book = {
        id: crypto.randomUUID(),
        title: data.title,
        description: data.description,
        genre: data.genre,
        priceCents: data.priceCents,
        coverImageId,
        fileId,
        author: principal,
        isPublished: false,
        offlineLocation: data.offlineLocation,
      } as Book;
      const a = actor as any;
      if (typeof a.submitBookWithPricing === "function") {
        await a.submitBookWithPricing(book, data.offlinePriceCents);
      } else {
        await actor!.submitBook(book);
        if (
          data.offlinePriceCents.length > 0 &&
          typeof a.setBookOfflinePrice === "function"
        ) {
          await a.setBookOfflinePrice(book.id, data.offlinePriceCents);
        }
      }
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
      if (data.videoFile) videoId = await upload(data.videoFile);
      if (data.thumbFile) thumbnailId = await upload(data.thumbFile);
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

  const earningsData = (earnings as any)?.totalCreatorShareCents ?? BigInt(0);

  return (
    <div className="container mx-auto px-4 py-8 max-w-5xl">
      <div className="mb-8">
        <h1 className="font-display text-3xl font-bold text-foreground mb-1">
          Creator Dashboard
        </h1>
        <p className="text-muted-foreground text-sm">
          Manage your books and films, track your earnings.
        </p>
      </div>

      {/* Earnings summary */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-8">
        <div className="rounded-xl border border-border bg-card/60 p-5 shadow-glow-blue">
          <div className="flex items-center gap-2 mb-2">
            <TrendingUp className="h-5 w-5 text-accent" />
            <span className="text-sm font-medium text-muted-foreground">
              Your Earnings (60%)
            </span>
          </div>
          <p className="text-2xl font-bold text-accent">
            {formatINR(earningsData)}
          </p>
        </div>
        <div className="rounded-xl border border-border bg-card/60 p-5">
          <div className="flex items-center gap-2 mb-2">
            <BookOpen className="h-5 w-5 text-primary" />
            <span className="text-sm font-medium text-muted-foreground">
              Books
            </span>
          </div>
          <p className="text-2xl font-bold">{myBooks.length}</p>
        </div>
        <div className="rounded-xl border border-border bg-card/60 p-5">
          <div className="flex items-center gap-2 mb-2">
            <Film className="h-5 w-5 text-primary" />
            <span className="text-sm font-medium text-muted-foreground">
              Films
            </span>
          </div>
          <p className="text-2xl font-bold">{myFilms.length}</p>
        </div>
      </div>

      <Tabs defaultValue="books">
        <TabsList className="mb-6">
          <TabsTrigger value="books" data-ocid="creator.books.tab">
            <BookOpen className="h-4 w-4 mr-1.5" />
            My Books
          </TabsTrigger>
          <TabsTrigger value="films" data-ocid="creator.films.tab">
            <Film className="h-4 w-4 mr-1.5" />
            My Films
          </TabsTrigger>
        </TabsList>

        {/* Books tab */}
        <TabsContent value="books">
          <div className="flex items-center justify-between mb-4">
            <h2 className="font-semibold text-lg">Your Books</h2>
            <Dialog open={bookDialogOpen} onOpenChange={setBookDialogOpen}>
              <DialogTrigger asChild>
                <Button
                  size="sm"
                  className="shadow-glow-blue hover:shadow-glow-purple transition-all"
                  data-ocid="creator.add_book.open_modal_button"
                >
                  <Plus className="h-4 w-4 mr-1" />
                  Add Book
                </Button>
              </DialogTrigger>
              <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
                <DialogHeader>
                  <DialogTitle>Publish a New Book</DialogTitle>
                </DialogHeader>
                <BookForm onSubmit={(data) => submitBook.mutate(data)} />
                {submitBook.isPending && (
                  <div
                    className="flex items-center gap-2 text-sm text-muted-foreground mt-2"
                    data-ocid="creator.book_submit.loading_state"
                  >
                    <Loader2 className="h-4 w-4 animate-spin" />
                    Uploading and submitting...
                  </div>
                )}
              </DialogContent>
            </Dialog>
          </div>

          {loadingBooks ? (
            <div className="space-y-3" data-ocid="creator.books.loading_state">
              {[1, 2].map((i) => (
                <Skeleton key={i} className="h-16 w-full" />
              ))}
            </div>
          ) : myBooks.length === 0 ? (
            <div
              className="text-center py-12 text-muted-foreground"
              data-ocid="creator.books.empty_state"
            >
              <BookOpen className="h-10 w-10 mx-auto mb-3 opacity-30" />
              <p>No books published yet. Add your first book!</p>
            </div>
          ) : (
            <div className="space-y-3">
              {myBooks.map((book, idx) => (
                <div
                  key={book.id}
                  className="flex items-center gap-4 rounded-xl border border-border bg-card/50 p-4 shadow-sm hover:border-primary/30 transition-all duration-200"
                  data-ocid={`creator.book.item.${idx + 1}`}
                >
                  <div className="w-10 h-14 rounded bg-muted flex items-center justify-center flex-shrink-0">
                    {book.coverImageId?.getDirectURL() ? (
                      <img
                        src={book.coverImageId.getDirectURL()}
                        alt=""
                        className="w-full h-full object-cover rounded"
                      />
                    ) : (
                      <BookOpen className="h-5 w-5 text-muted-foreground/40" />
                    )}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="font-medium truncate">{book.title}</p>
                    <div className="flex items-center gap-2 mt-1">
                      <Badge variant="outline" className="text-xs">
                        {book.genre}
                      </Badge>
                      <span className="text-xs text-accent font-medium">
                        {formatINR(book.priceCents)}
                      </span>
                      <Badge
                        variant={book.isPublished ? "default" : "secondary"}
                        className="text-xs"
                      >
                        {book.isPublished ? "Published" : "Pending Review"}
                      </Badge>
                    </div>
                  </div>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="text-destructive hover:bg-destructive/10 flex-shrink-0"
                    onClick={() => deleteBook.mutate(book.id)}
                    disabled={deleteBook.isPending}
                    data-ocid={`creator.book.delete_button.${idx + 1}`}
                  >
                    {deleteBook.isPending ? (
                      <Loader2 className="h-4 w-4 animate-spin" />
                    ) : (
                      <Trash2 className="h-4 w-4" />
                    )}
                  </Button>
                </div>
              ))}
            </div>
          )}
        </TabsContent>

        {/* Films tab */}
        <TabsContent value="films">
          <div className="flex items-center justify-between mb-4">
            <h2 className="font-semibold text-lg">Your Films</h2>
            <Dialog open={filmDialogOpen} onOpenChange={setFilmDialogOpen}>
              <DialogTrigger asChild>
                <Button
                  size="sm"
                  className="shadow-glow-blue hover:shadow-glow-purple transition-all"
                  data-ocid="creator.add_film.open_modal_button"
                >
                  <Plus className="h-4 w-4 mr-1" />
                  Add Film
                </Button>
              </DialogTrigger>
              <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
                <DialogHeader>
                  <DialogTitle>Upload a Short Film</DialogTitle>
                </DialogHeader>
                <FilmFormComponent
                  onSubmit={(data) => submitFilm.mutate(data)}
                />
                {submitFilm.isPending && (
                  <div
                    className="flex items-center gap-2 text-sm text-muted-foreground mt-2"
                    data-ocid="creator.film_submit.loading_state"
                  >
                    <Loader2 className="h-4 w-4 animate-spin" />
                    Uploading and submitting...
                  </div>
                )}
              </DialogContent>
            </Dialog>
          </div>

          {loadingFilms ? (
            <div className="space-y-3" data-ocid="creator.films.loading_state">
              {[1, 2].map((i) => (
                <Skeleton key={i} className="h-16 w-full" />
              ))}
            </div>
          ) : myFilms.length === 0 ? (
            <div
              className="text-center py-12 text-muted-foreground"
              data-ocid="creator.films.empty_state"
            >
              <Film className="h-10 w-10 mx-auto mb-3 opacity-30" />
              <p>No films uploaded yet. Upload your first short film!</p>
            </div>
          ) : (
            <div className="space-y-3">
              {myFilms.map((film, idx) => (
                <div
                  key={film.id}
                  className="flex items-center gap-4 rounded-xl border border-border bg-card/50 p-4 shadow-sm hover:border-primary/30 transition-all duration-200"
                  data-ocid={`creator.film.item.${idx + 1}`}
                >
                  <div className="w-16 h-10 rounded bg-muted flex items-center justify-center flex-shrink-0 overflow-hidden">
                    {film.thumbnailId?.getDirectURL() ? (
                      <img
                        src={film.thumbnailId.getDirectURL()}
                        alt=""
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      <Film className="h-5 w-5 text-muted-foreground/40" />
                    )}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="font-medium truncate">{film.title}</p>
                    <div className="flex items-center gap-2 mt-1">
                      <Badge variant="outline" className="text-xs">
                        {film.genre}
                      </Badge>
                      <span className="text-xs text-muted-foreground">
                        {Math.floor(Number(film.duration) / 60)}m{" "}
                        {Number(film.duration) % 60}s
                      </span>
                      <Badge
                        variant={film.isPublished ? "default" : "secondary"}
                        className="text-xs"
                      >
                        {film.isPublished ? "Published" : "Pending Review"}
                      </Badge>
                    </div>
                  </div>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="text-destructive hover:bg-destructive/10 flex-shrink-0"
                    onClick={() => deleteFilm.mutate(film.id)}
                    disabled={deleteFilm.isPending}
                    data-ocid={`creator.film.delete_button.${idx + 1}`}
                  >
                    {deleteFilm.isPending ? (
                      <Loader2 className="h-4 w-4 animate-spin" />
                    ) : (
                      <Trash2 className="h-4 w-4" />
                    )}
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
