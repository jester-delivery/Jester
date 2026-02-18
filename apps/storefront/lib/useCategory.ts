"use client";

import { useState, useEffect, useCallback } from "react";
import { api } from "@/lib/api";

export type CategoryProduct = {
  id: string;
  name: string;
  price: string;
  image?: string | null;
  description?: string | null;
  isAvailable: boolean;
  categoryId: string;
};

export type CategoryWithProducts = {
  id: string;
  name: string;
  slug: string;
  image?: string | null;
  products: CategoryProduct[];
};

/**
 * Încarcă o categorie după slug cu produsele ei (doar active; isAvailable din API).
 * Pentru toate paginile bulelor: pizza, grill, bake, antiq, supply, jester-24-24.
 */
export function useCategory(slug: string) {
  const [category, setCategory] = useState<CategoryWithProducts | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const refetch = useCallback(async () => {
    if (!slug) {
      setLoading(false);
      return;
    }
    setLoading(true);
    setError(null);
    try {
      const res = await api.categories.getById(slug);
      const cat = res.data.category as CategoryWithProducts;
      setCategory(cat ?? null);
    } catch {
      setError("Nu s-au putut încărca produsele.");
      setCategory(null);
    } finally {
      setLoading(false);
    }
  }, [slug]);

  useEffect(() => {
    refetch();
  }, [refetch]);

  return { category, products: category?.products ?? [], loading, error, refetch };
}
