import { useState, useEffect } from "react";
import { PostgrestError } from "@supabase/supabase-js";
import { useSupabase } from "../lib/supabase-provider";

type QueryFn<T> = (supabase: any) => Promise<{
  data: T | null;
  error: PostgrestError | null;
}>;

export function useSupabaseQuery<T>(
  queryFn: QueryFn<T>,
  dependencies: any[] = [],
  options = { enabled: true },
) {
  const { supabase } = useSupabase();
  const [data, setData] = useState<T | null>(null);
  const [error, setError] = useState<PostgrestError | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    let isMounted = true;

    const fetchData = async () => {
      if (!options.enabled) {
        setIsLoading(false);
        return;
      }

      setIsLoading(true);
      try {
        const { data, error } = await queryFn(supabase);

        if (isMounted) {
          setData(data);
          setError(error);
          setIsLoading(false);
        }
      } catch (err) {
        if (isMounted) {
          console.error("Error in useSupabaseQuery:", err);
          setError(err as PostgrestError);
          setIsLoading(false);
        }
      }
    };

    fetchData();

    return () => {
      isMounted = false;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [supabase, options.enabled, ...dependencies]);

  const refetch = async () => {
    setIsLoading(true);
    try {
      const { data, error } = await queryFn(supabase);
      setData(data);
      setError(error);
    } catch (err) {
      console.error("Error in refetch:", err);
      setError(err as PostgrestError);
    } finally {
      setIsLoading(false);
    }
  };

  return { data, error, isLoading, refetch };
}

