"use client";

import { Suspense, useState, FormEvent } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import { useAuthStore } from "@/stores/authStore";
import BottomNavigation from "@/components/ui/BottomNavigation";

const inputBase =
  "w-full px-4 py-3.5 rounded-xl bg-white/10 border border-white/20 text-white placeholder:text-white/40 focus:outline-none transition disabled:opacity-50";
const inputError = "border-red-500/50 focus:ring-2 focus:ring-red-500/30";
const inputOk = "focus:ring-2 focus:ring-amber-500/40 focus:border-amber-500/50";

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
  const [touched, setTouched] = useState({
    name: false,
    email: false,
    password: false,
    confirmPassword: false,
  });

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleBlur = (field: keyof typeof touched) => {
    setTouched((t) => ({ ...t, [field]: true }));
  };

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setLocalError(null);
    clearError();
    setTouched({ name: true, email: true, password: true, confirmPassword: true });

    if (!formData.name?.trim()) {
      setLocalError("Numele este obligatoriu");
      return;
    }
    if (!formData.email?.trim()) {
      setLocalError("Emailul este obligatoriu");
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
        formData.email.trim(),
        formData.password,
        formData.name.trim(),
        formData.phone?.trim() || undefined
      );
      router.push(next.startsWith("/") ? next : "/profile");
    } catch (err: any) {
      setLocalError(err.message || "Eroare la înregistrare");
    }
  };

  const displayError = localError || error;
  const nameInvalid = touched.name && !formData.name?.trim();
  const emailInvalid = touched.email && !formData.email?.trim();
  const passwordInvalid = touched.password && formData.password.length > 0 && formData.password.length < 6;
  const confirmInvalid = touched.confirmPassword && formData.password !== formData.confirmPassword;

  return (
    <main className="min-h-screen text-white bg-gradient-to-b from-[#050610] via-[#040411] to-[#050610] pb-24">
      <div className="container mx-auto px-4 py-10 max-w-md">
        <div className="mb-8">
          <h1 className="text-2xl sm:text-3xl font-bold mb-2">Creează cont</h1>
          <p className="text-white/70 text-sm sm:text-base">Înregistrează-te pentru a începe</p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label htmlFor="name" className="block text-sm font-medium text-white/90 mb-2">
              Nume complet *
            </label>
            <input
              id="name"
              name="name"
              type="text"
              value={formData.name}
              onChange={handleChange}
              onBlur={() => handleBlur("name")}
              className={`${inputBase} ${nameInvalid ? inputError : inputOk}`}
              placeholder="Ion Popescu"
              required
              disabled={isLoading}
              autoComplete="name"
            />
            {nameInvalid && <p className="mt-1.5 text-xs text-red-300">Numele este obligatoriu</p>}
          </div>

          <div>
            <label htmlFor="email" className="block text-sm font-medium text-white/90 mb-2">
              Email *
            </label>
            <input
              id="email"
              name="email"
              type="email"
              value={formData.email}
              onChange={handleChange}
              onBlur={() => handleBlur("email")}
              className={`${inputBase} ${emailInvalid ? inputError : inputOk}`}
              placeholder="nume@example.com"
              required
              disabled={isLoading}
              autoComplete="email"
            />
            {emailInvalid && <p className="mt-1.5 text-xs text-red-300">Emailul este obligatoriu</p>}
          </div>

          <div>
            <label htmlFor="phone" className="block text-sm font-medium text-white/90 mb-2">
              Telefon (opțional)
            </label>
            <input
              id="phone"
              name="phone"
              type="tel"
              value={formData.phone}
              onChange={handleChange}
              className={inputBase + " " + inputOk}
              placeholder="07xx xxx xxx"
              disabled={isLoading}
              autoComplete="tel"
            />
          </div>

          <div>
            <label htmlFor="password" className="block text-sm font-medium text-white/90 mb-2">
              Parolă * (min. 6 caractere)
            </label>
            <input
              id="password"
              name="password"
              type="password"
              value={formData.password}
              onChange={handleChange}
              onBlur={() => handleBlur("password")}
              className={`${inputBase} ${passwordInvalid ? inputError : inputOk}`}
              placeholder="••••••••"
              required
              disabled={isLoading}
              autoComplete="new-password"
            />
            {passwordInvalid && (
              <p className="mt-1.5 text-xs text-red-300">Minim 6 caractere</p>
            )}
          </div>

          <div>
            <label htmlFor="confirmPassword" className="block text-sm font-medium text-white/90 mb-2">
              Confirmă parola *
            </label>
            <input
              id="confirmPassword"
              name="confirmPassword"
              type="password"
              value={formData.confirmPassword}
              onChange={handleChange}
              onBlur={() => handleBlur("confirmPassword")}
              className={`${inputBase} ${confirmInvalid ? inputError : inputOk}`}
              placeholder="••••••••"
              required
              disabled={isLoading}
              autoComplete="new-password"
            />
            {confirmInvalid && (
              <p className="mt-1.5 text-xs text-red-300">Parolele nu coincid</p>
            )}
          </div>

          {displayError && (
            <div className="p-3 rounded-xl bg-red-500/20 border border-red-500/30 text-red-200 text-sm">
              {displayError}
            </div>
          )}

          <button
            type="submit"
            disabled={isLoading}
            className="w-full py-3.5 rounded-xl bg-white text-black font-semibold hover:bg-white/95 active:scale-[0.99] transition disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isLoading ? "Se înregistrează..." : "Înregistrează-te"}
          </button>
        </form>

        <p className="mt-6 text-center text-white/70 text-sm">
          Ai deja cont?{" "}
          <Link
            href={`/login?next=${encodeURIComponent(next)}`}
            className="text-white font-semibold hover:underline"
          >
            Autentifică-te
          </Link>
        </p>
      </div>

      <BottomNavigation />
    </main>
  );
}

export default function RegisterPage() {
  return (
    <Suspense
      fallback={
        <main className="min-h-screen flex items-center justify-center text-white bg-gradient-to-b from-[#050610] via-[#040411] to-[#050610]">
          <p className="text-white/70">Se încarcă...</p>
        </main>
      }
    >
      <RegisterContent />
    </Suspense>
  );
}
