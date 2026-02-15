"use client";

type ToastProps = {
  message: string | null;
  onDismiss?: () => void;
};

export default function Toast({ message, onDismiss }: ToastProps) {
  if (!message) return null;

  return (
    <div
      role="status"
      className="fixed bottom-24 left-1/2 z-[60] -translate-x-1/2 rounded-xl bg-white/95 px-4 py-2.5 text-sm font-medium text-black shadow-lg transition-opacity duration-300"
      aria-live="polite"
    >
      {message}
    </div>
  );
}
