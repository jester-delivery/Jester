"use client";

import { Suspense, useState, FormEvent } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import { useAuthStore } from "@/stores/authStore";
import BottomNavigation from "@/components/ui/BottomNavigation";

function LoginContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const next = searchParams.get("next") || "/";
  const { login, isLoading, error, clearError } = useAuthStore();
  
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [localError, setLocalError] = useState<string | null>(null);

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setLocalError(null);
    clearError();

    if (!email || !password) {
      setLocalError("Te rog completează toate câmpurile");
      return;
    }

    try {
      await login(email, password);
      router.push(next.startsWith("/") ? next : "/");
    } catch (err: any) {
      setLocalError(err.message || "Eroare la autentificare");
    }
  };

  const displayError = localError || error;

  return (
    <main className="min-h-screen text-white bg-gradient-to-b from-[#050610] via-[#040411] to-[#050610] pb-24">
      <div className="container mx-auto px-4 py-12 max-w-md">
        <div className="mb-8">
          <h1 className="text-3xl font-bold mb-2">Bun venit înapoi!</h1>
          <p className="text-white/70">Autentifică-te pentru a continua</p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Email */}
          <div>
            <label htmlFor="email" className="block text-sm font-medium mb-2">
              Email
            </label>
            <input
              id="email"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full px-4 py-3 rounded-xl bg-white/10 backdrop-blur-md border border-white/20 text-white placeholder:text-white/50 focus:outline-none focus:ring-2 focus:ring-white/30 transition"
              placeholder="nume@example.com"
              required
              disabled={isLoading}
            />
          </div>

          {/* Password */}
          <div>
            <label htmlFor="password" className="block text-sm font-medium mb-2">
              Parolă
            </label>
            <input
              id="password"
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full px-4 py-3 rounded-xl bg-white/10 backdrop-blur-md border border-white/20 text-white placeholder:text-white/50 focus:outline-none focus:ring-2 focus:ring-white/30 transition"
              placeholder="••••••••"
              required
              disabled={isLoading}
            />
          </div>

          {/* Error Message */}
          {displayError && (
            <div className="p-3 rounded-xl bg-red-500/20 border border-red-500/30 text-red-200 text-sm">
              {displayError}
            </div>
          )}

          {/* Submit Button */}
          <button
            type="submit"
            disabled={isLoading}
            className="w-full py-3 rounded-xl bg-white text-black font-semibold hover:bg-white/90 transition disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isLoading ? "Se autentifică..." : "Autentifică-te"}
          </button>
        </form>

        {/* Register Link */}
        <div className="mt-6 text-center">
          <p className="text-white/70 text-sm">
            Nu ai cont?{" "}
            <Link href="/register" className="text-white font-semibold hover:underline">
              Înregistrează-te
            </Link>
          </p>
        </div>
      </div>

      <BottomNavigation />
    </main>
  );
}

export default function LoginPage() {
  return (
    <Suspense fallback={
      <main className="min-h-screen flex items-center justify-center text-white bg-gradient-to-b from-[#050610] via-[#040411] to-[#050610]">
        <p className="text-white/70">Se încarcă...</p>
      </main>
    }>
      <LoginContent />
    </Suspense>
  );
}
