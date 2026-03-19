import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { useQuery } from "@tanstack/react-query";
import { Mail, Phone, Users } from "lucide-react";
import { motion } from "motion/react";
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
      {/* Header */}
      <div className="mb-12">
        <h1 className="section-title font-display text-4xl font-bold mb-4">
          Our Creators
        </h1>
        <p className="text-muted-foreground mt-4">
          Discover talented writers and directors on STARWAVE CREATIONS.
        </p>
      </div>

      {isLoading ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {["a", "b", "c", "d", "e", "f"].map((k) => (
            <div
              key={k}
              className="rounded-xl border border-border/60 bg-card/60 p-6"
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
          className="text-center py-24 text-muted-foreground border border-border/40 rounded-2xl bg-card/30 backdrop-blur-sm"
          data-ocid="creators.empty_state"
        >
          <Users className="h-16 w-16 mx-auto mb-4 opacity-20" />
          <p className="text-lg">No creators have registered yet.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {creators.map((creator, i) => (
            <motion.div
              key={creator.principal.toString()}
              data-ocid={`creators.item.${i + 1}`}
              className="rounded-xl border border-border/60 bg-card/80 backdrop-blur-sm p-6 flex flex-col"
              style={{
                boxShadow:
                  "0 4px 24px oklch(0.10 0.05 270 / 0.7), 0 1px 0 oklch(0.65 0.25 270 / 0.10) inset",
              }}
              whileHover={{
                borderColor: "oklch(0.65 0.25 270 / 0.5)",
                boxShadow:
                  "0 0 20px oklch(0.65 0.25 270 / 0.4), 0 4px 16px oklch(0.10 0.05 270 / 0.8)",
                y: -4,
              }}
              transition={{ duration: 0.2 }}
            >
              <div className="flex items-start gap-4 mb-4">
                <div className="h-14 w-14 rounded-full bg-primary/15 border border-primary/30 flex items-center justify-center shrink-0 shadow-glow-blue">
                  <Users className="h-7 w-7 text-primary" />
                </div>
                <div className="flex-1 min-w-0">
                  <h3 className="font-semibold text-lg line-clamp-1">
                    {creator.name}
                  </h3>
                  <Badge
                    variant="secondary"
                    className="mt-1 bg-primary/10 text-primary border-primary/25 text-xs"
                  >
                    Creator
                  </Badge>
                </div>
              </div>

              {creator.email && (
                <div className="flex items-center gap-2 text-sm text-muted-foreground mb-2">
                  <Mail className="h-3.5 w-3.5 shrink-0 text-accent" />
                  <span className="truncate">{creator.email}</span>
                </div>
              )}
              {creator.phone && (
                <div className="flex items-center gap-2 text-sm text-muted-foreground mb-4">
                  <Phone className="h-3.5 w-3.5 shrink-0 text-accent" />
                  <span>{creator.phone}</span>
                </div>
              )}

              <div className="mt-auto pt-2">
                <Button
                  variant="outline"
                  className="w-full border-border/60 hover:border-primary/50 hover:bg-primary/10 hover:text-primary hover:shadow-glow-blue transition-all duration-200"
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
            </motion.div>
          ))}
        </div>
      )}
    </div>
  );
}
