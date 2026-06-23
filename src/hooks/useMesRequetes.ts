"use client";

import { useCallback, useEffect, useState } from "react";
import { requetesApi } from "@/lib/api/requetes";
import { getApiErrorMessage } from "@/lib/api-client";
import type { Pagination, Requete } from "@/types";

interface UseMesRequetesResult {
  requetes: Requete[];
  pagination: Pagination | null;
  isLoading: boolean;
  error: string | null;
  refetch: () => Promise<void>;
}

export function useMesRequetes(page = 1, limit = 20): UseMesRequetesResult {
  const [requetes, setRequetes] = useState<Requete[]>([]);
  const [pagination, setPagination] = useState<Pagination | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchData = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      const data = await requetesApi.mesRequetes(page, limit);
      setRequetes(data.requetes);
      setPagination(data.pagination);
    } catch (err) {
      setError(getApiErrorMessage(err, "Impossible de charger vos requêtes."));
    } finally {
      setIsLoading(false);
    }
  }, [page, limit]);

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect -- fetch initial au montage, pattern standard
    fetchData();
  }, [fetchData]);

  return { requetes, pagination, isLoading, error, refetch: fetchData };
}
