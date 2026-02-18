"use client";

/**
 * Redă un sunet scurt, plăcut (două tonuri) la comandă nouă disponibilă.
 * Folosește Web Audio API – fără fișiere externe.
 */
export function playNewOrderSound(): void {
  if (typeof window === "undefined") return;
  try {
    const ctx = new (window.AudioContext || (window as unknown as { webkitAudioContext?: typeof AudioContext }).webkitAudioContext)();
    const playTone = (frequency: number, startTime: number, duration: number) => {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.frequency.value = frequency;
      osc.type = "sine";
      gain.gain.setValueAtTime(0.15, startTime);
      gain.gain.exponentialRampToValueAtTime(0.01, startTime + duration);
      osc.start(startTime);
      osc.stop(startTime + duration);
    };
    playTone(880, 0, 0.08);
    playTone(1100, 0.1, 0.12);
  } catch (_) {
    // Ignoră dacă AudioContext nu e suportat sau e blocat (ex. autoplay policy)
  }
}
