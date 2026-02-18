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

function LoginContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const rawNext = searchParams.get("next") || "/";
  const next = (() => {
    if (rawNext.startsWith("/login")) return "/";
    if (!rawNext.startsWith("/") || rawNext.startsWith("//") || rawNext.includes(":")) return "/";
    return rawNext;
  })();
  const { login, isLoading, error, clearError } = useAuthStore();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [localError, setLocalError] = useState<string | null>(null);
  const [touched, setTouched] = useState({ email: false, password: false });

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setLocalError(null);
    clearError();
    setTouched({ email: true, password: true });

    if (!email.trim()) {
      setLocalError("Introdu adresa de email");
      return;
    }
    if (!password) {
      setLocalError("Introdu parola");
      return;
    }

    try {
      await login(email.trim(), password);
      router.push(next);
    } catch (err: any) {
      setLocalError(err.message || "Eroare la autentificare");
    }
  };

  const displayError = localError || error;
  const emailInvalid = touched.email && !email.trim();
  const passwordInvalid = touched.password && !password;

  return (
    <main className="relative z-10 min-h-screen text-white bg-gradient-to-b from-[#050610] via-[#040411] to-[#050610] pb-24 isolate">
      <div className="container mx-auto px-4 py-10 max-w-md">
        <div className="mb-10">
          <h1 className="text-2xl sm:text-3xl font-bold mb-2">Bun venit înapoi</h1>
          <p className="text-white/70 text-sm sm:text-base">Autentifică-te pentru a continua</p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-5 relative z-10" style={{ touchAction: "manipulation" }}>
          <div>
            <label htmlFor="login-email" className="block text-sm font-medium text-white/90 mb-2">
              Email
            </label>
            <input
              id="login-email"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              onBlur={() => setTouched((t) => ({ ...t, email: true }))}
              className={`${inputBase} ${emailInvalid ? inputError : inputOk}`}
              placeholder="nume@example.com"
              required
              disabled={isLoading}
              autoComplete="email"
            />
            {emailInvalid && (
              <p className="mt-1.5 text-xs text-red-300">Introdu adresa de email</p>
            )}
          </div>

          <div>
            <label htmlFor="login-password" className="block text-sm font-medium text-white/90 mb-2">
              Parolă
            </label>
            <div className="relative">
              <input
                id="login-password"
                type={showPassword ? "text" : "password"}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                onBlur={() => setTouched((t) => ({ ...t, password: true }))}
                className={`${inputBase} ${passwordInvalid ? inputError : inputOk} pr-12`}
                placeholder="••••••••"
                required
                disabled={isLoading}
                autoComplete="current-password"
              />
              <button
                type="button"
                onClick={() => setShowPassword((v) => !v)}
                className="absolute right-3 top-1/2 -translate-y-1/2 p-1 rounded-lg text-white/60 hover:text-white hover:bg-white/10 transition"
                aria-label={showPassword ? "Ascunde parola" : "Arată parola"}
                tabIndex={-1}
              >
                {showPassword ? (
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden>
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.88 9.88l-3.29-3.29m7.532 7.532l3.29 3.29M3 3l3.59 3.59m0 0A9.953 9.953 0 0112 5c4.478 0 8.268 2.943 9.543 7a10.025 10.025 0 01-4.132 5.411m0 0L21 21" />
                  </svg>
                ) : (
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden>
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                  </svg>
                )}
              </button>
            </div>
            {passwordInvalid && (
              <p className="mt-1.5 text-xs text-red-300">Introdu parola</p>
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
            {isLoading ? "Se autentifică..." : "Autentifică-te"}
          </button>
        </form>

        <div className="mt-6 space-y-4">
          <p className="text-center">
            <Link
              href="#"
              className="text-sm text-white/60 hover:text-white/90 transition"
              onClick={(e) => e.preventDefault()}
              aria-disabled
            >
              Ai uitat parola?
            </Link>
            <span className="text-white/40 text-sm ml-1">(în curând)</span>
          </p>

          <button
            type="button"
            onClick={() => router.push("/")}
            className="block w-full py-3 rounded-xl bg-white/10 border border-white/20 text-white font-medium text-center hover:bg-white/15 transition"
          >
            Continuă ca oaspete
          </button>

          <p className="text-center text-white/70 text-sm">
            Nu ai cont?{" "}
            <Link href={`/register?next=${encodeURIComponent(next)}`} className="text-white font-semibold hover:underline">
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
    <Suspense
      fallback={
        <main className="min-h-screen flex items-center justify-center text-white bg-gradient-to-b from-[#050610] via-[#040411] to-[#050610]">
          <p className="text-white/70">Se încarcă...</p>
        </main>
      }
    >
      <LoginContent />
    </Suspense>
  );
}
