"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useAuthStore } from "@/stores/authStore";
import { api, type Address } from "@/lib/api";
import { PACKAGE_DELIVERY_FEE } from "@/lib/config/delivery";
import Toast from "@/components/ui/Toast";

const MAX_WEIGHT_KG = 20;
const TOAST_DURATION_MS = 3000;

type ServiceType = "trimite" | "primeste";
type AddressSource = "saved" | "custom";

function formatAddressLine(addr: Address): string {
  const parts = [addr.street];
  if (addr.number) parts.push(`nr. ${addr.number}`);
  if (addr.details) parts.push(addr.details);
  parts.push(addr.city);
  return parts.join(", ");
}

export default function DeliveryPage() {
  const router = useRouter();
  const { isAuthenticated, user } = useAuthStore();
  const [mounted, setMounted] = useState(false);
  const [serviceType, setServiceType] = useState<ServiceType>("trimite");

  // Trimite: ridicare + predare + colet
  const [numeExpeditor, setNumeExpeditor] = useState("");
  const [telefonExpeditor, setTelefonExpeditor] = useState("");
  const [adresaRidicare, setAdresaRidicare] = useState("");
  const [reperRidicare, setReperRidicare] = useState("");
  const [observatiiRidicare, setObservatiiRidicare] = useState("");
  const [numeDestinatar, setNumeDestinatar] = useState("");
  const [telefonDestinatar, setTelefonDestinatar] = useState("");
  const [adresaPredare, setAdresaPredare] = useState("");
  const [reperPredare, setReperPredare] = useState("");
  const [observatiiPredare, setObservatiiPredare] = useState("");
  const [greutate, setGreutate] = useState("");
  const [observatiiColet, setObservatiiColet] = useState("");

  // Primeste: destinatar (tu) + expeditor + colet
  const [adresaLivrare, setAdresaLivrare] = useState("");
  const [reperDestinatar, setReperDestinatar] = useState("");
  const [detaliiExpeditor, setDetaliiExpeditor] = useState("");
  const [numeExpeditorOpt, setNumeExpeditorOpt] = useState("");
  const [telefonExpeditorOpt, setTelefonExpeditorOpt] = useState("");

  const [addresses, setAddresses] = useState<Address[]>([]);
  const [addressSourceRidicare, setAddressSourceRidicare] = useState<AddressSource>("custom");
  const [addressSourcePredare, setAddressSourcePredare] = useState<AddressSource>("custom");
  const [addressSourceLivrare, setAddressSourceLivrare] = useState<AddressSource>("custom");
  const [selectedAddressIdRidicare, setSelectedAddressIdRidicare] = useState<string | null>(null);
  const [selectedAddressIdPredare, setSelectedAddressIdPredare] = useState<string | null>(null);
  const [selectedAddressIdLivrare, setSelectedAddressIdLivrare] = useState<string | null>(null);

  const [errors, setErrors] = useState<Record<string, string>>({});
  const [loading, setLoading] = useState(false);
  const [toastMessage, setToastMessage] = useState<string | null>(null);
  const toastTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => setMounted(true), []);

  useEffect(() => {
    if (!mounted || !isAuthenticated) return;
    api.me
      .getAddresses()
      .then((res) => setAddresses(res.data.addresses ?? []))
      .catch(() => setAddresses([]));
  }, [mounted, isAuthenticated]);

  useEffect(() => {
    if (!mounted || !isAuthenticated || !user) return;
    setNumeExpeditor(user.name || "");
    setTelefonExpeditor(user.phone || "");
    if (serviceType === "primeste") {
      setNumeDestinatar(user.name || "");
      setTelefonDestinatar(user.phone || "");
    }
  }, [mounted, isAuthenticated, user, serviceType]);

  useEffect(() => {
    if (!mounted) return;
    if (!isAuthenticated || !user) {
      router.replace("/login?next=" + encodeURIComponent("/delivery"));
    }
  }, [mounted, isAuthenticated, user, router]);

  const showToast = useCallback((msg: string) => {
    if (toastTimerRef.current) clearTimeout(toastTimerRef.current);
    setToastMessage(msg);
    toastTimerRef.current = setTimeout(() => {
      setToastMessage(null);
      toastTimerRef.current = null;
    }, TOAST_DURATION_MS);
  }, []);

  useEffect(() => () => {
    if (toastTimerRef.current) clearTimeout(toastTimerRef.current);
  }, []);

  const isValidROPhone = (ph: string) => {
    const digits = ph.replace(/\D/g, "");
    return (digits.length === 10 && /^07/.test(digits)) || (digits.length === 12 && /^40/.test(digits));
  };

  const getAdresaRidicareValue = () => {
    if (addressSourceRidicare === "saved" && selectedAddressIdRidicare) {
      const a = addresses.find((x) => x.id === selectedAddressIdRidicare);
      return a ? formatAddressLine(a) : "";
    }
    return adresaRidicare;
  };
  const getAdresaPredareValue = () => {
    if (addressSourcePredare === "saved" && selectedAddressIdPredare) {
      const a = addresses.find((x) => x.id === selectedAddressIdPredare);
      return a ? formatAddressLine(a) : "";
    }
    return adresaPredare;
  };
  const getAdresaLivrareValue = () => {
    if (addressSourceLivrare === "saved" && selectedAddressIdLivrare) {
      const a = addresses.find((x) => x.id === selectedAddressIdLivrare);
      return a ? formatAddressLine(a) : "";
    }
    return adresaLivrare;
  };

  const validate = useCallback((): boolean => {
    const e: Record<string, string> = {};
    const kg = parseFloat(greutate.replace(",", "."));
    if (greutate.trim() === "" || isNaN(kg) || kg <= 0) e.greutate = "Introdu greutatea estimată (kg)";
    else if (kg > MAX_WEIGHT_KG) e.greutate = `Momentan livrăm doar până la ${MAX_WEIGHT_KG} kg`;

    if (serviceType === "trimite") {
      if (!numeExpeditor.trim()) e.numeExpeditor = "Numele expeditorului este obligatoriu";
      if (!telefonExpeditor.trim()) e.telefonExpeditor = "Telefonul expeditorului este obligatoriu";
      else if (!isValidROPhone(telefonExpeditor)) e.telefonExpeditor = "Telefon invalid (ex: 07xx xxx xxx)";
      const addrR = getAdresaRidicareValue();
      if (!addrR.trim() || addrR.length < 5) e.adresaRidicare = "Adresa de ridicare este obligatorie (min. 5 caractere)";
      if (!numeDestinatar.trim()) e.numeDestinatar = "Numele destinatarului este obligatoriu";
      if (!telefonDestinatar.trim()) e.telefonDestinatar = "Telefonul destinatarului este obligatoriu";
      else if (!isValidROPhone(telefonDestinatar)) e.telefonDestinatar = "Telefon invalid";
      const addrP = getAdresaPredareValue();
      if (!addrP.trim() || addrP.length < 5) e.adresaPredare = "Adresa de predare este obligatorie (min. 5 caractere)";
    } else {
      if (!numeDestinatar.trim()) e.numeDestinatar = "Numele tău este obligatoriu";
      if (!telefonDestinatar.trim()) e.telefonDestinatar = "Telefonul tău este obligatoriu";
      else if (!isValidROPhone(telefonDestinatar)) e.telefonDestinatar = "Telefon invalid";
      const addrL = getAdresaLivrareValue();
      if (!addrL.trim() || addrL.length < 5) e.adresaLivrare = "Adresa de livrare este obligatorie (min. 5 caractere)";
      if (!detaliiExpeditor.trim() || detaliiExpeditor.trim().length < 3)
        e.detaliiExpeditor = "Detalii colet / de unde vine (min. 3 caractere)";
    }
    setErrors(e);
    return Object.keys(e).length === 0;
  }, [
    serviceType,
    numeExpeditor,
    telefonExpeditor,
    numeDestinatar,
    telefonDestinatar,
    adresaRidicare,
    adresaPredare,
    adresaLivrare,
    greutate,
    detaliiExpeditor,
    addressSourceRidicare,
    addressSourcePredare,
    addressSourceLivrare,
    selectedAddressIdRidicare,
    selectedAddressIdPredare,
    selectedAddressIdLivrare,
    addresses,
  ]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validate()) return;
    setLoading(true);
    setErrors({});
    try {
      const tipLabel = serviceType === "trimite" ? "Trimite pachet" : "Primește pachet";
      const notesParts = [`Tip: ${tipLabel}`, `Greutate: ${greutate.trim()} kg`];
      if (serviceType === "trimite") {
        notesParts.push(
          `Expeditor: ${numeExpeditor.trim()}, Tel: ${telefonExpeditor.trim()}`,
          `Adresă ridicare: ${getAdresaRidicareValue()}`
        );
        if (reperRidicare.trim()) notesParts.push(`Reper ridicare: ${reperRidicare.trim()}`);
        if (observatiiRidicare.trim()) notesParts.push(`Obs ridicare: ${observatiiRidicare.trim()}`);
        notesParts.push(
          `Destinatar: ${numeDestinatar.trim()}, Tel: ${telefonDestinatar.trim()}`,
          `Adresă predare: ${getAdresaPredareValue()}`
        );
        if (reperPredare.trim()) notesParts.push(`Reper predare: ${reperPredare.trim()}`);
        if (observatiiPredare.trim()) notesParts.push(`Obs predare: ${observatiiPredare.trim()}`);
        if (observatiiColet.trim()) notesParts.push(`Obs colet: ${observatiiColet.trim()}`);
      } else {
        notesParts.push(
          `Destinatar: ${numeDestinatar.trim()}, Tel: ${telefonDestinatar.trim()}`,
          `Adresă livrare: ${getAdresaLivrareValue()}`
        );
        if (reperDestinatar.trim()) notesParts.push(`Reper: ${reperDestinatar.trim()}`);
        notesParts.push(`Detalii expeditor/colet: ${detaliiExpeditor.trim()}`);
        if (numeExpeditorOpt.trim()) notesParts.push(`Expeditor: ${numeExpeditorOpt.trim()}`);
        if (telefonExpeditorOpt.trim()) notesParts.push(`Tel expeditor: ${telefonExpeditorOpt.trim()}`);
        if (observatiiColet.trim()) notesParts.push(`Obs: ${observatiiColet.trim()}`);
      }
      const notes = notesParts.join("\n");
      const deliveryAddr = serviceType === "trimite" ? getAdresaPredareValue() : getAdresaLivrareValue();

      await api.cartOrders.create({
        orderType: "package_delivery",
        items: [{ name: "Serviciu livrare pachet", price: PACKAGE_DELIVERY_FEE, quantity: 1 }],
        total: PACKAGE_DELIVERY_FEE,
        deliveryAddress: deliveryAddr,
        phone: telefonDestinatar.trim(),
        name: numeDestinatar.trim(),
        notes,
        paymentMethod: "CASH_ON_DELIVERY",
      });
      showToast("Solicitarea ta a fost trimisă");
      router.push("/orders");
    } catch (err: unknown) {
      const msg = (err as { response?: { data?: { error?: string } } })?.response?.data?.error ?? "Eroare la trimitere. Încearcă din nou.";
      setErrors({ submit: msg });
    } finally {
      setLoading(false);
    }
  };

  const inputBase =
    "w-full px-4 py-3 rounded-xl bg-white/10 border border-white/20 text-white placeholder:text-white/40 focus:outline-none focus:ring-2 focus:ring-amber-500/40 focus:border-amber-500/50 transition";
  const inputErr = "border-red-500/50 focus:ring-red-500/30";

  if (!mounted || !isAuthenticated || !user) {
    return (
      <main className="min-h-screen text-white bg-gradient-to-b from-[#050610] via-[#040411] to-[#050610] flex items-center justify-center">
        <p className="text-white/70">Se redirecționează la login...</p>
      </main>
    );
  }

  const hasSavedAddresses = addresses.length > 0;
  const AddressSourceToggle = ({
    source,
    onSource,
    selectedId,
    onSelectId,
    customValue,
    onCustomValue,
    label,
    errorKey,
  }: {
    source: AddressSource;
    onSource: (s: AddressSource) => void;
    selectedId: string | null;
    onSelectId: (id: string | null) => void;
    customValue: string;
    onCustomValue: (v: string) => void;
    label: string;
    errorKey: string;
  }) => (
    <div>
      <label className="mb-1 block text-xs text-white/70">{label}</label>
      {hasSavedAddresses && (
        <div className="mb-2 flex gap-2">
          <button
            type="button"
            onClick={() => {
              onSource("saved");
              onSelectId(addresses[0]?.id ?? null);
            }}
            className={`rounded-lg border px-3 py-2 text-xs font-medium transition ${
              source === "saved" ? "border-amber-500/60 bg-amber-500/20 text-white" : "border-white/20 bg-white/5 text-white/80"
            }`}
          >
            Alege din adrese salvate
          </button>
          <button
            type="button"
            onClick={() => {
              onSource("custom");
              onSelectId(null);
            }}
            className={`rounded-lg border px-3 py-2 text-xs font-medium transition ${
              source === "custom" ? "border-amber-500/60 bg-amber-500/20 text-white" : "border-white/20 bg-white/5 text-white/80"
            }`}
          >
            Altă adresă
          </button>
        </div>
      )}
      {source === "saved" && hasSavedAddresses ? (
        <select
          value={selectedId ?? ""}
          onChange={(e) => onSelectId(e.target.value || null)}
          className={`${inputBase} ${errors[errorKey] ? inputErr : ""}`}
        >
          <option value="">Selectează adresa</option>
          {addresses.map((addr) => (
            <option key={addr.id} value={addr.id}>
              {addr.street}, {addr.city}
            </option>
          ))}
        </select>
      ) : (
        <input
          type="text"
          value={customValue}
          onChange={(e) => onCustomValue(e.target.value)}
          className={`${inputBase} ${errors[errorKey] ? inputErr : ""}`}
          placeholder={label}
        />
      )}
      {errors[errorKey] && <p className="mt-1 text-xs text-red-400">{errors[errorKey]}</p>}
    </div>
  );

  return (
    <main className="relative z-10 min-h-screen text-white bg-gradient-to-b from-[#050610] via-[#040411] to-[#050610] pb-12 isolate">
      <div className="mx-auto max-w-2xl px-4 py-8 relative z-10">
        <Link href="/" className="text-sm text-white/70 underline hover:text-white">
          ← Înapoi
        </Link>

        <div className="mt-6 rounded-2xl border border-white/20 bg-white/5 p-5">
          <h1 className="text-2xl font-bold sm:text-3xl">Jester Delivery</h1>
          <p className="mt-2 text-white/80">Livrare locală Sulina + peste Dunăre.</p>
          <p className="mt-1 text-sm text-amber-300/90">
            Tarif fix: {PACKAGE_DELIVERY_FEE} lei / până la {MAX_WEIGHT_KG} kg
          </p>
        </div>

        <div className="mt-8">
          <p className="mb-3 text-sm font-semibold text-white/90">Alege tipul</p>
          <div className="flex gap-3">
            <button
              type="button"
              onClick={() => setServiceType("trimite")}
              className={`flex-1 rounded-xl border px-4 py-3 text-center text-sm font-semibold transition ${
                serviceType === "trimite"
                  ? "border-amber-500/60 bg-amber-500/20 text-white"
                  : "border-white/20 bg-white/5 text-white/80 hover:bg-white/10"
              }`}
            >
              Trimite pachet
            </button>
            <button
              type="button"
              onClick={() => setServiceType("primeste")}
              className={`flex-1 rounded-xl border px-4 py-3 text-center text-sm font-semibold transition ${
                serviceType === "primeste"
                  ? "border-amber-500/60 bg-amber-500/20 text-white"
                  : "border-white/20 bg-white/5 text-white/80 hover:bg-white/10"
              }`}
            >
              Primește pachet
            </button>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="mt-8 space-y-6 relative z-10" style={{ touchAction: "manipulation" }}>
          {serviceType === "trimite" ? (
            <>
              <section>
                <h2 className="mb-3 text-sm font-bold uppercase tracking-wide text-white/80">1. Ridicare (de la expeditor)</h2>
                <div className="space-y-3">
                  <div>
                    <label className="mb-1 block text-xs text-white/70">Nume expeditor</label>
                    <input
                      type="text"
                      value={numeExpeditor}
                      onChange={(e) => setNumeExpeditor(e.target.value)}
                      className={`${inputBase} ${errors.numeExpeditor ? inputErr : ""}`}
                      placeholder="Numele expeditorului"
                    />
                    {errors.numeExpeditor && <p className="mt-1 text-xs text-red-400">{errors.numeExpeditor}</p>}
                  </div>
                  <div>
                    <label className="mb-1 block text-xs text-white/70">Telefon expeditor</label>
                    <input
                      type="tel"
                      value={telefonExpeditor}
                      onChange={(e) => setTelefonExpeditor(e.target.value)}
                      className={`${inputBase} ${errors.telefonExpeditor ? inputErr : ""}`}
                      placeholder="07xx xxx xxx"
                    />
                    {errors.telefonExpeditor && <p className="mt-1 text-xs text-red-400">{errors.telefonExpeditor}</p>}
                  </div>
                  <AddressSourceToggle
                    source={addressSourceRidicare}
                    onSource={setAddressSourceRidicare}
                    selectedId={selectedAddressIdRidicare}
                    onSelectId={setSelectedAddressIdRidicare}
                    customValue={adresaRidicare}
                    onCustomValue={setAdresaRidicare}
                    label="Adresă ridicare"
                    errorKey="adresaRidicare"
                  />
                  <div>
                    <label className="mb-1 block text-xs text-white/70">Reper (opțional)</label>
                    <input
                      type="text"
                      value={reperRidicare}
                      onChange={(e) => setReperRidicare(e.target.value)}
                      className={inputBase}
                      placeholder="Ex: lângă magazin"
                    />
                  </div>
                  <div>
                    <label className="mb-1 block text-xs text-white/70">Observații ridicare (opțional)</label>
                    <textarea
                      value={observatiiRidicare}
                      onChange={(e) => setObservatiiRidicare(e.target.value)}
                      rows={2}
                      className={`${inputBase} resize-none`}
                      placeholder="Instrucțiuni pentru ridicare"
                    />
                  </div>
                </div>
              </section>

              <section>
                <h2 className="mb-3 text-sm font-bold uppercase tracking-wide text-white/80">2. Predare (către destinatar)</h2>
                <div className="space-y-3">
                  <div>
                    <label className="mb-1 block text-xs text-white/70">Nume destinatar</label>
                    <input
                      type="text"
                      value={numeDestinatar}
                      onChange={(e) => setNumeDestinatar(e.target.value)}
                      className={`${inputBase} ${errors.numeDestinatar ? inputErr : ""}`}
                      placeholder="Numele destinatarului"
                    />
                    {errors.numeDestinatar && <p className="mt-1 text-xs text-red-400">{errors.numeDestinatar}</p>}
                  </div>
                  <div>
                    <label className="mb-1 block text-xs text-white/70">Telefon destinatar</label>
                    <input
                      type="tel"
                      value={telefonDestinatar}
                      onChange={(e) => setTelefonDestinatar(e.target.value)}
                      className={`${inputBase} ${errors.telefonDestinatar ? inputErr : ""}`}
                      placeholder="07xx xxx xxx"
                    />
                    {errors.telefonDestinatar && <p className="mt-1 text-xs text-red-400">{errors.telefonDestinatar}</p>}
                  </div>
                  <AddressSourceToggle
                    source={addressSourcePredare}
                    onSource={setAddressSourcePredare}
                    selectedId={selectedAddressIdPredare}
                    onSelectId={setSelectedAddressIdPredare}
                    customValue={adresaPredare}
                    onCustomValue={setAdresaPredare}
                    label="Adresă predare"
                    errorKey="adresaPredare"
                  />
                  <div>
                    <label className="mb-1 block text-xs text-white/70">Reper (opțional)</label>
                    <input type="text" value={reperPredare} onChange={(e) => setReperPredare(e.target.value)} className={inputBase} placeholder="Ex: bloc A" />
                  </div>
                  <div>
                    <label className="mb-1 block text-xs text-white/70">Observații predare (opțional)</label>
                    <textarea value={observatiiPredare} onChange={(e) => setObservatiiPredare(e.target.value)} rows={2} className={`${inputBase} resize-none`} placeholder="Instrucțiuni predare" />
                  </div>
                </div>
              </section>

              <section>
                <h2 className="mb-3 text-sm font-bold uppercase tracking-wide text-white/80">3. Colet</h2>
                <div className="space-y-3">
                  <div>
                    <label className="mb-1 block text-xs text-white/70">Greutate estimată (kg)</label>
                    <input
                      type="text"
                      inputMode="decimal"
                      value={greutate}
                      onChange={(e) => setGreutate(e.target.value)}
                      className={`${inputBase} ${errors.greutate ? inputErr : ""}`}
                      placeholder="Max 20 kg"
                    />
                    {errors.greutate && <p className="mt-1 text-xs text-red-400">{errors.greutate}</p>}
                  </div>
                  <div>
                    <label className="mb-1 block text-xs text-white/70">Observații colet (opțional)</label>
                    <textarea value={observatiiColet} onChange={(e) => setObservatiiColet(e.target.value)} rows={2} className={`${inputBase} resize-none`} placeholder="Detalii despre pachet" />
                  </div>
                </div>
              </section>
            </>
          ) : (
            <>
              <section>
                <h2 className="mb-3 text-sm font-bold uppercase tracking-wide text-white/80">1. Date destinatar (tu)</h2>
                <div className="space-y-3">
                  <div>
                    <label className="mb-1 block text-xs text-white/70">Nume destinatar</label>
                    <input
                      type="text"
                      value={numeDestinatar}
                      onChange={(e) => setNumeDestinatar(e.target.value)}
                      className={`${inputBase} ${errors.numeDestinatar ? inputErr : ""}`}
                      placeholder="Numele tău"
                    />
                    {errors.numeDestinatar && <p className="mt-1 text-xs text-red-400">{errors.numeDestinatar}</p>}
                  </div>
                  <div>
                    <label className="mb-1 block text-xs text-white/70">Telefon destinatar</label>
                    <input
                      type="tel"
                      value={telefonDestinatar}
                      onChange={(e) => setTelefonDestinatar(e.target.value)}
                      className={`${inputBase} ${errors.telefonDestinatar ? inputErr : ""}`}
                      placeholder="07xx xxx xxx"
                    />
                    {errors.telefonDestinatar && <p className="mt-1 text-xs text-red-400">{errors.telefonDestinatar}</p>}
                  </div>
                  <AddressSourceToggle
                    source={addressSourceLivrare}
                    onSource={setAddressSourceLivrare}
                    selectedId={selectedAddressIdLivrare}
                    onSelectId={setSelectedAddressIdLivrare}
                    customValue={adresaLivrare}
                    onCustomValue={setAdresaLivrare}
                    label="Adresă livrare"
                    errorKey="adresaLivrare"
                  />
                  <div>
                    <label className="mb-1 block text-xs text-white/70">Reper (opțional)</label>
                    <input type="text" value={reperDestinatar} onChange={(e) => setReperDestinatar(e.target.value)} className={inputBase} placeholder="Ex: apartament 2" />
                  </div>
                </div>
              </section>

              <section>
                <h2 className="mb-3 text-sm font-bold uppercase tracking-wide text-white/80">2. Date expeditor (de unde vine coletul)</h2>
                <div className="space-y-3">
                  <div>
                    <label className="mb-1 block text-xs text-white/70">Nume expeditor (opțional)</label>
                    <input type="text" value={numeExpeditorOpt} onChange={(e) => setNumeExpeditorOpt(e.target.value)} className={inputBase} placeholder="Dacă se cunoaște" />
                  </div>
                  <div>
                    <label className="mb-1 block text-xs text-white/70">Telefon expeditor (opțional)</label>
                    <input type="tel" value={telefonExpeditorOpt} onChange={(e) => setTelefonExpeditorOpt(e.target.value)} className={inputBase} placeholder="07xx xxx xxx" />
                  </div>
                  <div>
                    <label className="mb-1 block text-xs text-white/70">Detalii colet / de unde vine</label>
                    <textarea
                      value={detaliiExpeditor}
                      onChange={(e) => setDetaliiExpeditor(e.target.value)}
                      rows={3}
                      className={`${inputBase} resize-none ${errors.detaliiExpeditor ? inputErr : ""}`}
                      placeholder="Ex: pachet de la X, vine cu barca din Tulcea..."
                    />
                    {errors.detaliiExpeditor && <p className="mt-1 text-xs text-red-400">{errors.detaliiExpeditor}</p>}
                  </div>
                </div>
              </section>

              <section>
                <h2 className="mb-3 text-sm font-bold uppercase tracking-wide text-white/80">3. Colet</h2>
                <div className="space-y-3">
                  <div>
                    <label className="mb-1 block text-xs text-white/70">Greutate estimată (kg)</label>
                    <input
                      type="text"
                      inputMode="decimal"
                      value={greutate}
                      onChange={(e) => setGreutate(e.target.value)}
                      className={`${inputBase} ${errors.greutate ? inputErr : ""}`}
                      placeholder="Max 20 kg"
                    />
                    {errors.greutate && <p className="mt-1 text-xs text-red-400">{errors.greutate}</p>}
                  </div>
                  <div>
                    <label className="mb-1 block text-xs text-white/70">Observații (opțional)</label>
                    <textarea value={observatiiColet} onChange={(e) => setObservatiiColet(e.target.value)} rows={2} className={`${inputBase} resize-none`} placeholder="Detalii despre pachet" />
                  </div>
                </div>
              </section>
            </>
          )}

          <div className="rounded-xl border border-white/20 bg-white/5 p-4">
            <p className="text-lg font-bold text-white">Tarif transport: {PACKAGE_DELIVERY_FEE} lei (până la {MAX_WEIGHT_KG} kg)</p>
            <p className="mt-1 text-xs text-white/60">TVA inclus (informativ). Livrare locală Sulina + peste Dunăre.</p>
            <p className="mt-2 text-base font-semibold text-white">Total: {PACKAGE_DELIVERY_FEE} lei</p>
          </div>

          {errors.submit && (
            <div className="rounded-xl border border-red-500/30 bg-red-500/20 px-4 py-3">
              <p className="text-sm text-red-200">{errors.submit}</p>
            </div>
          )}

          <button
            type="submit"
            disabled={loading}
            className="w-full rounded-xl bg-amber-500 py-3.5 font-semibold text-black transition hover:bg-amber-400 active:scale-[0.99] disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {loading ? "Se trimite..." : "Solicită livrare"}
          </button>
        </form>
      </div>
      <Toast message={toastMessage} />
    </main>
  );
}
