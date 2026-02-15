"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { useAuthStore } from "@/stores/authStore";
import ProtectedRoute from "@/components/auth/ProtectedRoute";
import BottomNavigation from "@/components/ui/BottomNavigation";
import { api } from "@/lib/api";

function ProfilePageContent() {
  const router = useRouter();
  const { user, isLoading, fetchUser, logout } = useAuthStore();
  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [saving, setSaving] = useState(false);
  const [saveSuccess, setSaveSuccess] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!user) {
      fetchUser();
    }
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
      setTimeout(() => setSaveSuccess(false), 3000);
    } catch (err: any) {
      setError(err.response?.data?.error || "Eroare la salvare");
    } finally {
      setSaving(false);
    }
  };

  const handleLogout = () => {
    logout();
    router.push("/login");
  };

  if (isLoading) {
    return (
      <main className="min-h-screen text-white bg-gradient-to-b from-[#050610] via-[#040411] to-[#050610] pb-24">
        <div className="container mx-auto px-4 py-12">
          <div className="text-center">
            <p className="text-white/70">Se încarcă...</p>
          </div>
        </div>
        <BottomNavigation />
      </main>
    );
  }

  if (!user) {
    return (
      <main className="min-h-screen text-white bg-gradient-to-b from-[#050610] via-[#040411] to-[#050610] pb-24 flex items-center justify-center">
        <p className="text-white/70">Se redirecționează la login...</p>
        <BottomNavigation />
      </main>
    );
  }

  return (
    <main className="min-h-screen text-white bg-gradient-to-b from-[#050610] via-[#040411] to-[#050610] pb-24">
      <div className="container mx-auto px-4 py-12 max-w-2xl">
        <div className="mb-8">
          <h1 className="text-3xl font-bold mb-2">Profilul Meu</h1>
          <p className="text-white/70">Gestionează informațiile tale</p>
        </div>

        <form onSubmit={handleSave} className="rounded-2xl bg-white/10 backdrop-blur-md border border-white/20 p-6 mb-6 space-y-4">
          <div className="flex items-center gap-4 mb-6">
            <div className="w-16 h-16 rounded-full bg-white/20 flex items-center justify-center text-2xl font-bold">
              {(name || user?.name || "?").charAt(0).toUpperCase()}
            </div>
            <div>
              <h2 className="text-xl font-bold">{name || user?.name}</h2>
              <p className="text-white/70 text-sm">{user?.email}</p>
            </div>
          </div>

          <div>
            <label className="block text-sm text-white/70 mb-1">Email</label>
            <input
              type="email"
              value={user?.email || ""}
              readOnly
              className="w-full rounded-xl bg-white/5 border border-white/20 px-4 py-3 text-white/70 cursor-not-allowed"
            />
            <p className="mt-1 text-xs text-white/50">Emailul nu poate fi schimbat</p>
          </div>

          <div>
            <label className="block text-sm text-white/70 mb-1">Nume</label>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Numele tău"
              className="w-full rounded-xl bg-white/5 border border-white/20 px-4 py-3 text-white placeholder:text-white/40 focus:border-amber-500/60 focus:outline-none"
              required
              minLength={2}
            />
          </div>

          <div>
            <label className="block text-sm text-white/70 mb-1">Telefon</label>
            <input
              type="tel"
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              placeholder="07xx xxx xxx"
              className="w-full rounded-xl bg-white/5 border border-white/20 px-4 py-3 text-white placeholder:text-white/40 focus:border-amber-500/60 focus:outline-none"
            />
          </div>

          {error && <p className="text-red-300 text-sm">{error}</p>}
          {saveSuccess && <p className="text-green-300 text-sm">Salvat cu succes!</p>}

          <button
            type="submit"
            disabled={saving}
            className="w-full py-3 rounded-xl bg-amber-500 text-black font-semibold hover:bg-amber-400 transition disabled:opacity-50"
          >
            {saving ? "Se salvează..." : "Salvează"}
          </button>
        </form>

        <div className="space-y-3">
          <Link
            href="/addresses"
            className="block w-full py-3 rounded-xl bg-white/10 backdrop-blur-md border border-white/20 text-white font-semibold hover:bg-white/15 transition text-center"
          >
            Adrese salvate
          </Link>
          <button
            onClick={() => router.push("/orders")}
            className="w-full py-3 rounded-xl bg-white/10 backdrop-blur-md border border-white/20 text-white font-semibold hover:bg-white/15 transition"
          >
            Vezi Comenzile Mele
          </button>
          <button
            onClick={handleLogout}
            className="w-full py-3 rounded-xl bg-red-500/20 border border-red-500/30 text-red-200 font-semibold hover:bg-red-500/30 transition"
          >
            Deconectează-te
          </button>
        </div>
      </div>

      <BottomNavigation />
    </main>
  );
}

export default function ProfilePage() {
  return (
    <ProtectedRoute>
      <ProfilePageContent />
    </ProtectedRoute>
  );
}
