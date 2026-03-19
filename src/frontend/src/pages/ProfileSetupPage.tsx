import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Camera, Copy, Loader2, User } from "lucide-react";
import { useEffect, useRef, useState } from "react";
import { toast } from "sonner";
import type { Page } from "../App";
import { ExternalBlob } from "../backend";
import { useActor } from "../hooks/useActor";
import { useInternetIdentity } from "../hooks/useInternetIdentity";

interface ProfileSetupProps {
  navigate: (p: Page) => void;
}

export default function ProfileSetupPage({ navigate }: ProfileSetupProps) {
  const { actor } = useActor();
  const { identity } = useInternetIdentity();
  const queryClient = useQueryClient();
  const [name, setName] = useState("");
  const [role, setRole] = useState<"creator" | "customer">("customer");
  const [phone, setPhone] = useState("");
  const [email, setEmail] = useState("");
  const [profileLoaded, setProfileLoaded] = useState(false);
  const [avatarFile, setAvatarFile] = useState<File | undefined>();
  const [avatarPreview, setAvatarPreview] = useState<string | undefined>();
  const avatarRef = useRef<HTMLInputElement>(null);

  const principalId = identity?.getPrincipal().toText() ?? null;

  const { data: existingProfile } = useQuery({
    queryKey: ["caller-profile"],
    queryFn: () => actor!.getCallerUserProfile(),
    enabled: !!actor && !!identity,
  });

  useEffect(() => {
    if (existingProfile && !profileLoaded) {
      setName(existingProfile.name ?? "");
      setRole(existingProfile.role === "creator" ? "creator" : "customer");
      setPhone(existingProfile.phone ?? "");
      setEmail(existingProfile.email ?? "");
      setProfileLoaded(true);
    }
  }, [existingProfile, profileLoaded]);

  const handleAvatarChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setAvatarFile(file);
    const url = URL.createObjectURL(file);
    setAvatarPreview(url);
  };

  const copyPrincipal = () => {
    if (principalId) {
      navigator.clipboard.writeText(principalId);
      toast.success("Principal ID copied!");
    }
  };

  const existingPic = existingProfile
    ? ((existingProfile as any).profilePictureId as ExternalBlob | undefined)
    : undefined;
  const existingPictureUrl = existingPic?.getDirectURL?.();
  const displayAvatar = avatarPreview ?? existingPictureUrl;

  const { mutate, isPending } = useMutation({
    mutationFn: async () => {
      let profilePictureId: ExternalBlob | undefined = existingPic;
      if (avatarFile) {
        profilePictureId = ExternalBlob.fromBytes(
          new Uint8Array(await avatarFile.arrayBuffer()),
        );
      }
      await actor!.saveCallerUserProfile({
        name,
        role,
        phone: phone || undefined,
        email: email || undefined,
        ...(profilePictureId ? { profilePictureId } : {}),
      } as any);
    },
    onSuccess: () => {
      queryClient.invalidateQueries();
      toast.success("Profile saved!");
      navigate({ name: "home" });
    },
    onError: () => toast.error("Failed to save profile."),
  });

  return (
    <div className="container mx-auto px-4 py-20 max-w-md">
      <h1 className="section-title font-display text-3xl font-bold mb-2">
        Your Profile
      </h1>
      <p className="text-muted-foreground mt-4 mb-8">
        Manage your account details.
      </p>

      {/* Profile Picture */}
      <div className="flex flex-col items-center mb-8">
        <div className="relative">
          <div
            className="h-28 w-28 rounded-full overflow-hidden bg-primary/10 border-2 border-primary/40 flex items-center justify-center"
            style={{ boxShadow: "0 0 24px oklch(0.65 0.25 270 / 0.3)" }}
          >
            {displayAvatar ? (
              <img
                src={displayAvatar}
                alt="Profile"
                className="w-full h-full object-cover"
              />
            ) : (
              <User className="h-12 w-12 text-primary/60" />
            )}
          </div>
          <button
            type="button"
            className="absolute bottom-0 right-0 h-9 w-9 rounded-full bg-primary flex items-center justify-center shadow-glow-blue hover:bg-primary/90 active:scale-95 transition-all duration-200"
            onClick={() => avatarRef.current?.click()}
            data-ocid="profile.avatar.upload_button"
          >
            <Camera className="h-4 w-4 text-primary-foreground" />
          </button>
        </div>
        <input
          ref={avatarRef}
          type="file"
          accept="image/*"
          className="hidden"
          onChange={handleAvatarChange}
        />
        <p className="text-xs text-muted-foreground mt-3">
          {avatarFile ? avatarFile.name : "Click camera to upload photo"}
        </p>
      </div>

      {/* Principal ID card */}
      {principalId && (
        <div
          className="mb-8 p-4 rounded-xl border border-primary/20 bg-primary/5 backdrop-blur-sm"
          style={{ boxShadow: "0 0 16px oklch(0.65 0.25 270 / 0.12)" }}
        >
          <p className="text-xs font-semibold text-primary/70 uppercase tracking-wide mb-2">
            Your Principal ID
          </p>
          <p className="text-xs text-foreground break-all font-mono mb-3 leading-relaxed">
            {principalId}
          </p>
          <Button
            variant="outline"
            size="sm"
            onClick={copyPrincipal}
            className="w-full border-primary/30 hover:border-primary/60 hover:bg-primary/10 hover:shadow-glow-blue transition-all duration-200"
            data-ocid="profile.copy_principal.button"
          >
            <Copy className="h-3 w-3 mr-2" />
            Copy Principal ID
          </Button>
          <p className="text-xs text-muted-foreground mt-2">
            Share this with an admin to be added as a team member.
          </p>
        </div>
      )}

      <div className="space-y-4">
        <div>
          <Label htmlFor="name">Display Name</Label>
          <Input
            id="name"
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="Your name"
            className="mt-1 border-border/60 bg-secondary/30 focus:border-primary/60 focus:ring-primary/20 focus:shadow-glow-blue transition-all duration-200"
            data-ocid="profile.name.input"
          />
        </div>
        <div>
          <Label htmlFor="email">Email (optional)</Label>
          <Input
            id="email"
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="your@email.com"
            className="mt-1 border-border/60 bg-secondary/30 focus:border-primary/60 focus:ring-primary/20 transition-all duration-200"
            data-ocid="profile.email.input"
          />
        </div>
        <div>
          <Label htmlFor="phone">Phone Number (optional)</Label>
          <Input
            id="phone"
            type="tel"
            value={phone}
            onChange={(e) => setPhone(e.target.value)}
            placeholder="+91 98765 43210"
            className="mt-1 border-border/60 bg-secondary/30 focus:border-primary/60 focus:ring-primary/20 transition-all duration-200"
            data-ocid="profile.phone.input"
          />
        </div>
        <div>
          <Label>I am a...</Label>
          <div className="flex gap-3 mt-2">
            <button
              type="button"
              className={`flex-1 py-3 rounded-xl border text-sm font-medium transition-all duration-200 ${
                role === "customer"
                  ? "border-primary/60 bg-primary/15 text-primary shadow-glow-blue"
                  : "border-border/60 text-muted-foreground hover:border-primary/40 hover:bg-primary/5"
              }`}
              onClick={() => setRole("customer")}
              data-ocid="profile.customer.toggle"
            >
              Reader / Viewer
            </button>
            <button
              type="button"
              className={`flex-1 py-3 rounded-xl border text-sm font-medium transition-all duration-200 ${
                role === "creator"
                  ? "border-primary/60 bg-primary/15 text-primary shadow-glow-blue"
                  : "border-border/60 text-muted-foreground hover:border-primary/40 hover:bg-primary/5"
              }`}
              onClick={() => setRole("creator")}
              data-ocid="profile.creator.toggle"
            >
              Writer / Director
            </button>
          </div>
        </div>
        <Button
          className="w-full shadow-glow-blue hover:shadow-glow-purple active:scale-[0.98] transition-all duration-200 font-semibold"
          onClick={() => mutate()}
          disabled={isPending || !name.trim()}
          data-ocid="profile.save.submit_button"
        >
          {isPending ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : null}
          Save Profile
        </Button>
      </div>
    </div>
  );
}
