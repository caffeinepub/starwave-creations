import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Copy, Loader2 } from "lucide-react";
import { useEffect, useState } from "react";
import { toast } from "sonner";
import type { Page } from "../App";
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

  const copyPrincipal = () => {
    if (principalId) {
      navigator.clipboard.writeText(principalId);
      toast.success("Principal ID copied!");
    }
  };

  const { mutate, isPending } = useMutation({
    mutationFn: async () => {
      await actor!.saveCallerUserProfile({
        name,
        role,
        phone: phone || undefined,
        email: email || undefined,
      });
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
      <h1 className="font-display text-3xl font-bold mb-2">Your Profile</h1>
      <p className="text-muted-foreground mb-8">Manage your account details.</p>

      {principalId && (
        <div className="mb-8 p-4 rounded-lg border border-border bg-secondary/30">
          <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-1">
            Your Principal ID
          </p>
          <p className="text-xs text-foreground break-all font-mono mb-3">
            {principalId}
          </p>
          <Button
            variant="outline"
            size="sm"
            onClick={copyPrincipal}
            className="w-full"
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
            className="mt-1"
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
            className="mt-1"
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
            className="mt-1"
            data-ocid="profile.phone.input"
          />
        </div>
        <div>
          <Label>I am a...</Label>
          <div className="flex gap-3 mt-1">
            <button
              type="button"
              className={`flex-1 py-3 rounded-lg border text-sm transition-colors ${
                role === "customer"
                  ? "border-primary bg-primary/10 text-primary"
                  : "border-border text-muted-foreground hover:border-primary/50"
              }`}
              onClick={() => setRole("customer")}
              data-ocid="profile.customer.toggle"
            >
              Reader / Viewer
            </button>
            <button
              type="button"
              className={`flex-1 py-3 rounded-lg border text-sm transition-colors ${
                role === "creator"
                  ? "border-primary bg-primary/10 text-primary"
                  : "border-border text-muted-foreground hover:border-primary/50"
              }`}
              onClick={() => setRole("creator")}
              data-ocid="profile.creator.toggle"
            >
              Writer / Director
            </button>
          </div>
        </div>
        <Button
          className="w-full"
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
