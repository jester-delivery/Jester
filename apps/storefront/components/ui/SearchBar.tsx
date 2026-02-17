"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import { api } from "@/lib/api";
import { useDeliveryAddressStore } from "@/stores/deliveryAddressStore";
import { useAuthStore } from "@/stores/authStore";

const DEBOUNCE_MS = 250;

function formatAddressForPrefill(addr: { street: string; number?: string | null; details?: string | null; city: string }) {
  const parts = [addr.street];
  if (addr.number) parts.push(`nr. ${addr.number}`);
  if (addr.details) parts.push(addr.details);
  parts.push(addr.city);
  return parts.join(", ");
}

export default function SearchBar() {
  const { address, setAddress, clearAddress } = useDeliveryAddressStore();
  const { isAuthenticated } = useAuthStore();
  const [inputValue, setInputValue] = useState("");
  const [suggestions, setSuggestions] = useState<string[]>([]);
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  const fetchSuggestions = useCallback(async (q: string) => {
    setLoading(true);
    try {
      const res = await api.addresses.search(q);
      setSuggestions(res.data.suggestions ?? []);
      setOpen(true);
    } catch {
      setSuggestions([]);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    setInputValue(address);
  }, [address]);

  useEffect(() => {
    if (!isAuthenticated || address) return;
    api.me
      .getAddresses()
      .then((res) => {
        const addrs = res.data.addresses ?? [];
        const defaultAddr = addrs.find((a) => a.isDefault) ?? addrs[0];
        if (defaultAddr) {
          const formatted = formatAddressForPrefill(defaultAddr);
          setAddress(formatted);
          setInputValue(formatted);
        }
      })
      .catch(() => {});
  }, [isAuthenticated, address]);

  useEffect(() => {
    return () => {
      if (debounceRef.current) clearTimeout(debounceRef.current);
    };
  }, []);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const v = e.target.value;
    setInputValue(v);
    if (debounceRef.current) clearTimeout(debounceRef.current);
    if (!v.trim()) {
      setSuggestions([]);
      setOpen(false);
      clearAddress();
      return;
    }
    debounceRef.current = setTimeout(() => fetchSuggestions(v), DEBOUNCE_MS);
  };

  const handleSelect = (suggestion: string) => {
    setAddress(suggestion);
    setInputValue(suggestion);
    setOpen(false);
    setSuggestions([]);
  };

  const handleBlur = () => {
    setTimeout(() => setOpen(false), 200);
  };

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  return (
    <div className="relative z-20 w-full pt-4 pb-2 px-4 sm:px-6" ref={containerRef}>
      <div className="relative mx-auto w-full max-w-2xl">
        <div className="flex items-center gap-3 rounded-2xl bg-white/10 backdrop-blur-md border border-white/20 px-4 py-3.5 shadow-lg hover:bg-white/12 transition-colors">
          <div className="flex-shrink-0">
            <svg
              className="w-5 h-5 text-white/70"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
              aria-hidden="true"
            >
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
            </svg>
          </div>
          <input
            type="text"
            value={inputValue}
            onChange={handleInputChange}
            onFocus={() => inputValue.trim() && suggestions.length > 0 && setOpen(true)}
            onBlur={handleBlur}
            placeholder="Introdu adresa ta de livrare"
            className="flex-1 bg-transparent outline-none text-sm text-white placeholder:text-white/50 font-medium min-w-0"
            autoComplete="off"
            aria-autocomplete="list"
            aria-expanded={open}
            aria-controls="search-bar-suggestions"
            id="delivery-address-input"
          />
          {loading && (
            <div className="flex-shrink-0 w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
          )}
          {!loading && (
            <div className="flex-shrink-0 opacity-50">
              <svg className="w-5 h-5 text-white/50" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
              </svg>
            </div>
          )}
        </div>

        {open && suggestions.length > 0 && (
          <ul
            id="search-bar-suggestions"
            className="absolute left-0 right-0 top-full mt-1 max-h-60 overflow-y-auto rounded-xl border border-white/20 bg-[#0a0a12] shadow-xl z-50"
            role="listbox"
          >
            {suggestions.map((s) => (
              <li key={s} role="option">
                <button
                  type="button"
                  onClick={() => handleSelect(s)}
                  className="w-full px-4 py-3 text-left text-sm text-white hover:bg-white/10 focus:bg-white/10 focus:outline-none border-b border-white/5 last:border-0"
                >
                  {s}
                </button>
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
}
