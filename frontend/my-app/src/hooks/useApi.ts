import { useCallback, useEffect, useMemo, useState } from 'react';

export type UseApiState<T> = {
  data: T | null;
  loading: boolean;
  error: Error | null;
};

interface UseApiOptions<T> {
  immediate?: boolean;
  initialData?: T | null;
}

export function useApi<T>(
  request: () => Promise<T>,
  deps: React.DependencyList = [],
  options: UseApiOptions<T> = {}
) {
  const { immediate = true, initialData = null } = options;
  const [state, setState] = useState<UseApiState<T>>({
    data: initialData,
    loading: false,
    error: null,
  });

  const run = useCallback(async () => {
    setState((prev) => ({ ...prev, loading: true, error: null }));

    try {
      const response = await request();
      setState({ data: response, loading: false, error: null });
      return response;
    } catch (err) {
      const error = err instanceof Error ? err : new Error('Request failed');
      setState({ data: initialData, loading: false, error });
      throw error;
    }
  }, [request, initialData, ...deps]);

  useEffect(() => {
    if (!immediate) return;
    void run();
  }, [run, immediate]);

  return useMemo(() => ({
    ...state,
    refetch: run,
    reset: () => setState({ data: initialData, loading: false, error: null }),
  }), [state, run, initialData]);
}

export function useMutation<TData, TVariables>(
  mutation: (variables: TVariables) => Promise<TData>
) {
  const [data, setData] = useState<TData | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<Error | null>(null);

  const mutate = useCallback(async (variables: TVariables) => {
    setLoading(true);
    setError(null);

    try {
      const result = await mutation(variables);
      setData(result);
      return result;
    } catch (err) {
      const thrownError = err instanceof Error ? err : new Error('Mutation failed');
      setError(thrownError);
      throw thrownError;
    } finally {
      setLoading(false);
    }
  }, [mutation]);

  return { data, loading, error, mutate };
}
