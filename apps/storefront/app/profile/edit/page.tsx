"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { useAuthStore } from "@/stores/authStore";
import ProtectedRoute from "@/components/auth/ProtectedRoute";
import BottomNavigation from "@/components/ui/BottomNavigation";
import { api } from "@/lib/api";

function EditProfileContent() {
  const router = useRouter();
  const { user, isLoading, fetchUser } = useAuthStore();
  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [saving, setSaving] = useState(false);
  const [saveSuccess, setSaveSuccess] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!user) fetchUser();
  }, [user, fetchUser]);

  useEffect(() => {
    if (user) {
      setName(user.name || "");
      setPhone(user.phone || "");
    }
  }, [user]);

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setError(null);
    setSaveSuccess(false);
    try {
      const res = await api.me.updateProfile({ name: name.trim(), phone: phone.trim() || null });
      useAuthStore.setState({ user: res.data.user });
      setSaveSuccess(true);
      setTimeout(() => {
        setSaveSuccess(false);
        router.push("/profile");
      }, 800);
    } catch (err: any) {
      setError(err.response?.data?.error || "Eroare la salvare");
    } finally {
      setSaving(false);
    }
  };

  if (isLoading) {
    return (
      <main className="min-h-screen text-white bg-gradient-to-b from-[#050610] via-[#040411] to-[#050610] pb-24 flex items-center justify-center">
        <p className="text-white/70">Se încarcă...</p>
        <BottomNavigation />
      </main>
    );
  }

  if (!user) {
    return (
      <main className="min-h-screen text-white bg-gradient-to-b from-[#050610] via-[#040411] to-[#050610] pb-24 flex items-center justify-center">
        <p className="text-white/70">Se redirecționează...</p>
        <BottomNavigation />
      </main>
    );
  }

  return (
    <main className="min-h-screen text-white bg-gradient-to-b from-[#050610] via-[#040411] to-[#050610] pb-24">
      <div className="container mx-auto px-4 py-8 max-w-lg">
        <div className="flex items-center gap-3 mb-8">
          <Link
            href="/profile"
            className="p-2 rounded-xl bg-white/10 border border-white/20 hover:bg-white/15 transition"
            aria-label="Înapoi"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
            </svg>
          </Link>
          <div>
            <h1 className="text-xl font-semibold">Edit profile</h1>
            <p className="text-white/60 text-sm">Nume și telefon</p>
          </div>
        </div>

        <form onSubmit={handleSave} className="rounded-2xl bg-white/10 backdrop-blur-md border border-white/20 p-5 space-y-4">
          <div>
            <label htmlFor="email" className="block text-sm text-white/70 mb-1">Email</label>
            <input
              id="email"
              type="email"
              value={user.email}
              readOnly
              className="w-full rounded-xl bg-white/5 border border-white/20 px-4 py-3 text-white/60 cursor-not-allowed text-sm"
            />
            <p className="mt-1 text-xs text-white/50">Emailul nu poate fi schimbat</p>
          </div>

          <div>
            <label htmlFor="name" className="block text-sm font-medium text-white/90 mb-1">Nume</label>
            <input
              id="name"
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Numele tău"
              className="w-full rounded-xl bg-white/10 border border-white/20 px-4 py-3 text-white placeholder:text-white/40 focus:outline-none focus:ring-2 focus:ring-amber-500/50 focus:border-amber-500/50 transition"
              required
              minLength={2}
              disabled={saving}
            />
          </div>

          <div>
            <label htmlFor="phone" className="block text-sm font-medium text-white/90 mb-1">Telefon</label>
            <input
              id="phone"
              type="tel"
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              placeholder="07xx xxx xxx"
              className="w-full rounded-xl bg-white/10 border border-white/20 px-4 py-3 text-white placeholder:text-white/40 focus:outline-none focus:ring-2 focus:ring-amber-500/50 focus:border-amber-500/50 transition"
              disabled={saving}
            />
          </div>

          {error && (
            <div className="p-3 rounded-xl bg-red-500/20 border border-red-500/30 text-red-200 text-sm">
              {error}
            </div>
          )}
          {saveSuccess && (
            <div className="p-3 rounded-xl bg-green-500/20 border border-green-500/30 text-green-200 text-sm">
              Salvat cu succes!
            </div>
          )}

          <button
            type="submit"
            disabled={saving}
            className="w-full py-3.5 rounded-xl bg-amber-500 text-black font-semibold hover:bg-amber-400 transition disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {saving ? "Se salvează..." : "Salvează"}
          </button>
        </form>
      </div>

      <BottomNavigation />
    </main>
  );
}

export default function EditProfilePage() {
  return (
    <ProtectedRoute>
      <EditProfileContent />
    </ProtectedRoute>
  );
}
