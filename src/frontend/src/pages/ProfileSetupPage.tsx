import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { Loader2 } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";
import type { Page } from "../App";
import { useActor } from "../hooks/useActor";

interface ProfileSetupProps {
  navigate: (p: Page) => void;
}

export default function ProfileSetupPage({ navigate }: ProfileSetupProps) {
  const { actor } = useActor();
  const queryClient = useQueryClient();
  const [name, setName] = useState("");
  const [role, setRole] = useState<"creator" | "customer">("customer");

  const { mutate, isPending } = useMutation({
    mutationFn: async () => {
      await actor!.saveCallerUserProfile({ name, role });
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
      <h1 className="font-display text-3xl font-bold mb-2">
        Set Up Your Profile
      </h1>
      <p className="text-muted-foreground mb-8">
        Tell us a bit about yourself.
      </p>
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
          <Label>I am a...</Label>
          <div className="flex gap-3 mt-1">
            <button
              type="button"
              className={`flex-1 py-3 rounded-lg border text-sm transition-colors ${role === "customer" ? "border-primary bg-primary/10 text-primary" : "border-border text-muted-foreground hover:border-primary/50"}`}
              onClick={() => setRole("customer")}
              data-ocid="profile.customer.toggle"
            >
              Reader / Viewer
            </button>
            <button
              type="button"
              className={`flex-1 py-3 rounded-lg border text-sm transition-colors ${role === "creator" ? "border-primary bg-primary/10 text-primary" : "border-border text-muted-foreground hover:border-primary/50"}`}
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
