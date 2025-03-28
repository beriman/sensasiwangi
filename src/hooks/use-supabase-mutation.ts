import { useState } from "react";
import { PostgrestError } from "@supabase/supabase-js";
import { useSupabase } from "@/lib/supabase-provider";

type MutationFn<TVariables, TData> = (
  supabase: any,
  variables: TVariables,
) => Promise<{
  data: TData | null;
  error: PostgrestError | null;
}>;

export function useSupabaseMutation<TVariables, TData>(
  mutationFn: MutationFn<TVariables, TData>,
) {
  const { supabase } = useSupabase();
  const [data, setData] = useState<TData | null>(null);
  const [error, setError] = useState<PostgrestError | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  const mutate = async (variables: TVariables) => {
    setIsLoading(true);
    try {
      const { data, error } = await mutationFn(supabase, variables);
      setData(data);
      setError(error);
      return { data, error };
    } catch (err) {
      console.error("Error in useSupabaseMutation:", err);
      const error = err as PostgrestError;
      setError(error);
      return { data: null, error };
    } finally {
      setIsLoading(false);
    }
  };

  const reset = () => {
    setData(null);
    setError(null);
  };

  return { mutate, data, error, isLoading, reset };
}
