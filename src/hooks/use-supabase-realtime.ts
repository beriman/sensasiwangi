import { useEffect, useState } from "react";
import { RealtimeChannel } from "@supabase/supabase-js";
import { useSupabase } from "@/lib/supabase-provider";

type RealtimeSubscription = {
  table: string;
  schema?: string;
  filter?: string;
  event?: "INSERT" | "UPDATE" | "DELETE" | "*";
};

export function useSupabaseRealtime<T>(
  subscription: RealtimeSubscription,
  initialData: T[] = [],
) {
  const { supabase } = useSupabase();
  const [data, setData] = useState<T[]>(initialData);
  const [error, setError] = useState<Error | null>(null);

  useEffect(() => {
    let channel: RealtimeChannel;

    try {
      const { table, schema = "public", filter, event = "*" } = subscription;

      // Create a unique channel name
      const channelName = `${table}:${event}:${filter || "all"}`;

      // Set up the channel
      channel = supabase.channel(channelName);

      // Configure the subscription
      const changes = {
        schema,
        table,
        event,
      };

      if (filter) {
        Object.assign(changes, { filter });
      }

      // Subscribe to changes
      channel
        .on("postgres_changes", changes, (payload) => {
          try {
            const newRecord = payload.new as T;
            const oldRecord = payload.old as T;

            setData((currentData) => {
              // Handle different events
              switch (payload.eventType) {
                case "INSERT":
                  return [...currentData, newRecord];

                case "UPDATE":
                  return currentData.map((item: any) =>
                    item.id === (newRecord as any).id ? newRecord : item,
                  );

                case "DELETE":
                  return currentData.filter(
                    (item: any) => item.id !== (oldRecord as any).id,
                  );

                default:
                  return currentData;
              }
            });
          } catch (err) {
            console.error("Error processing realtime update:", err);
            setError(err instanceof Error ? err : new Error(String(err)));
          }
        })
        .subscribe((status) => {
          if (status !== "SUBSCRIBED") {
            console.warn("Realtime subscription status:", status);
          }
        });
    } catch (err) {
      console.error("Error setting up realtime subscription:", err);
      setError(err instanceof Error ? err : new Error(String(err)));
    }

    // Cleanup function
    return () => {
      if (channel) {
        supabase.removeChannel(channel);
      }
    };
  }, [supabase, subscription]);

  return { data, error, setData };
}
