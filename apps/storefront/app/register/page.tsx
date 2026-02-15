"use client";

import { Suspense, useState, FormEvent } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import { useAuthStore } from "@/stores/authStore";
import BottomNavigation from "@/components/ui/BottomNavigation";

function RegisterContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const next = searchParams.get("next") || "/profile";
  const { register, isLoading, error, clearError } = useAuthStore();
  
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    password: "",
    confirmPassword: "",
    phone: "",
  });
  const [localError, setLocalError] = useState<string | null>(null);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value,
    });
  };

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setLocalError(null);
    clearError();

    // Validare
    if (!formData.name || !formData.email || !formData.password) {
      setLocalError("Te rog completează toate câmpurile obligatorii");
      return;
    }

    if (formData.password.length < 6) {
      setLocalError("Parola trebuie să aibă minim 6 caractere");
      return;
    }

    if (formData.password !== formData.confirmPassword) {
      setLocalError("Parolele nu coincid");
      return;
    }

    try {
      await register(
        formData.email,
        formData.password,
        formData.name,
        formData.phone || undefined
      );
      router.push(next.startsWith("/") ? next : "/profile");
    } catch (err: any) {
      setLocalError(err.message || "Eroare la înregistrare");
    }
  };

  const displayError = localError || error;

  return (
    <main className="min-h-screen text-white bg-gradient-to-b from-[#050610] via-[#040411] to-[#050610] pb-24">
      <div className="container mx-auto px-4 py-12 max-w-md">
        <div className="mb-8">
          <h1 className="text-3xl font-bold mb-2">Creează cont</h1>
          <p className="text-white/70">Înregistrează-te pentru a începe</p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-5">
          {/* Name */}
          <div>
            <label htmlFor="name" className="block text-sm font-medium mb-2">
              Nume complet *
            </label>
            <input
              id="name"
              name="name"
              type="text"
              value={formData.name}
              onChange={handleChange}
              className="w-full px-4 py-3 rounded-xl bg-white/10 backdrop-blur-md border border-white/20 text-white placeholder:text-white/50 focus:outline-none focus:ring-2 focus:ring-white/30 transition"
              placeholder="Ion Popescu"
              required
              disabled={isLoading}
            />
          </div>

          {/* Email */}
          <div>
            <label htmlFor="email" className="block text-sm font-medium mb-2">
              Email *
            </label>
            <input
              id="email"
              name="email"
              type="email"
              value={formData.email}
              onChange={handleChange}
              className="w-full px-4 py-3 rounded-xl bg-white/10 backdrop-blur-md border border-white/20 text-white placeholder:text-white/50 focus:outline-none focus:ring-2 focus:ring-white/30 transition"
              placeholder="nume@example.com"
              required
              disabled={isLoading}
            />
          </div>

          {/* Phone */}
          <div>
            <label htmlFor="phone" className="block text-sm font-medium mb-2">
              Telefon (opțional)
            </label>
            <input
              id="phone"
              name="phone"
              type="tel"
              value={formData.phone}
              onChange={handleChange}
              className="w-full px-4 py-3 rounded-xl bg-white/10 backdrop-blur-md border border-white/20 text-white placeholder:text-white/50 focus:outline-none focus:ring-2 focus:ring-white/30 transition"
              placeholder="+40 123 456 789"
              disabled={isLoading}
            />
          </div>

          {/* Password */}
          <div>
            <label htmlFor="password" className="block text-sm font-medium mb-2">
              Parolă * (minim 6 caractere)
            </label>
            <input
              id="password"
              name="password"
              type="password"
              value={formData.password}
              onChange={handleChange}
              className="w-full px-4 py-3 rounded-xl bg-white/10 backdrop-blur-md border border-white/20 text-white placeholder:text-white/50 focus:outline-none focus:ring-2 focus:ring-white/30 transition"
              placeholder="••••••••"
              required
              disabled={isLoading}
            />
          </div>

          {/* Confirm Password */}
          <div>
            <label htmlFor="confirmPassword" className="block text-sm font-medium mb-2">
              Confirmă parola *
            </label>
            <input
              id="confirmPassword"
              name="confirmPassword"
              type="password"
              value={formData.confirmPassword}
              onChange={handleChange}
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
            {isLoading ? "Se înregistrează..." : "Înregistrează-te"}
          </button>
        </form>

        {/* Login Link */}
        <div className="mt-6 text-center">
          <p className="text-white/70 text-sm">
            Ai deja cont?{" "}
            <Link href="/login" className="text-white font-semibold hover:underline">
              Autentifică-te
            </Link>
          </p>
        </div>
      </div>

      <BottomNavigation />
    </main>
  );
}

export default function RegisterPage() {
  return (
    <Suspense fallback={
      <main className="min-h-screen flex items-center justify-center text-white bg-gradient-to-b from-[#050610] via-[#040411] to-[#050610]">
        <p className="text-white/70">Se încarcă...</p>
      </main>
    }>
      <RegisterContent />
    </Suspense>
  );
}
