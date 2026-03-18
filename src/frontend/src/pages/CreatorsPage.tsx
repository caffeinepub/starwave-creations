import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { useQuery } from "@tanstack/react-query";
import { Mail, Phone, Users } from "lucide-react";
import type { Page } from "../App";
import { useActor } from "../hooks/useActor";

interface CreatorsPageProps {
  navigate: (p: Page) => void;
}

export default function CreatorsPage({ navigate }: CreatorsPageProps) {
  const { actor } = useActor();

  const { data: creators, isLoading } = useQuery({
    queryKey: ["creator-profiles"],
    queryFn: () => actor!.getCreatorProfiles(),
    enabled: !!actor,
  });

  return (
    <div className="container mx-auto px-4 py-12 max-w-6xl">
      <div className="mb-10">
        <h1 className="font-display text-4xl font-bold mb-2">Our Creators</h1>
        <p className="text-muted-foreground">
          Discover talented writers and directors on STARWAVE CREATIONS.
        </p>
      </div>

      {isLoading ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {["c1", "c2", "c3", "c4", "c5", "c6"].map((k) => (
            <div
              key={k}
              className="rounded-lg border border-border bg-card p-6"
            >
              <Skeleton className="h-16 w-16 rounded-full mb-4" />
              <Skeleton className="h-5 w-2/3 mb-2" />
              <Skeleton className="h-4 w-1/3 mb-4" />
              <Skeleton className="h-9 w-full" />
            </div>
          ))}
        </div>
      ) : !creators || creators.length === 0 ? (
        <div
          className="text-center py-20 text-muted-foreground"
          data-ocid="creators.empty_state"
        >
          <Users className="h-16 w-16 mx-auto mb-4 opacity-20" />
          <p className="text-lg">No creators have registered yet.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {creators.map((creator, i) => (
            <div
              key={creator.principal.toString()}
              data-ocid={`creators.item.${i + 1}`}
              className="rounded-lg border border-border bg-card p-6 hover:border-primary/50 transition-all duration-300 hover:shadow-lg hover:shadow-primary/10"
            >
              <div className="flex items-start gap-4 mb-4">
                <div className="h-14 w-14 rounded-full bg-primary/20 flex items-center justify-center shrink-0">
                  <Users className="h-7 w-7 text-primary" />
                </div>
                <div className="flex-1 min-w-0">
                  <h3 className="font-semibold text-lg line-clamp-1">
                    {creator.name}
                  </h3>
                  <Badge variant="secondary" className="mt-1">
                    Creator
                  </Badge>
                </div>
              </div>
              {creator.email && (
                <div className="flex items-center gap-2 text-sm text-muted-foreground mb-2">
                  <Mail className="h-3.5 w-3.5 shrink-0" />
                  <span className="truncate">{creator.email}</span>
                </div>
              )}
              {creator.phone && (
                <div className="flex items-center gap-2 text-sm text-muted-foreground mb-4">
                  <Phone className="h-3.5 w-3.5 shrink-0" />
                  <span>{creator.phone}</span>
                </div>
              )}
              <Button
                variant="outline"
                className="w-full mt-auto"
                onClick={() =>
                  navigate({
                    name: "creator-profile",
                    id: creator.principal.toString(),
                  })
                }
                data-ocid={`creators.view.button.${i + 1}`}
              >
                View Profile
              </Button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
