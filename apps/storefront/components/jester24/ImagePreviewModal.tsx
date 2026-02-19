"use client";

import { useState, useEffect } from "react";
import * as Dialog from "@radix-ui/react-dialog";
import * as VisuallyHidden from "@radix-ui/react-visually-hidden";
import { X, ImageOff } from "lucide-react";
import { getProxiedImageUrl } from "@/lib/imageProxy";

type ImagePreviewModalProps = {
  open: boolean;
  onClose: () => void;
  imageUrl: string;
  title: string;
};

/**
 * Preview mic (nu full screen): card fix 300px, imagine directă + fallback la proxy.
 */
export default function ImagePreviewModal({
  open,
  onClose,
  imageUrl,
  title,
}: ImagePreviewModalProps) {
  const [imgError, setImgError] = useState(false);
  const [tryProxy, setTryProxy] = useState(false);
  const effectiveUrl =
    !imageUrl || imgError
      ? ""
      : tryProxy
        ? getProxiedImageUrl(imageUrl)
        : imageUrl;

  useEffect(() => {
    setImgError(false);
    setTryProxy(false);
  }, [imageUrl]);

  const handleImgError = () => {
    if (!tryProxy && imageUrl?.startsWith("http")) {
      setTryProxy(true);
    } else {
      setImgError(true);
    }
  };

  return (
    <Dialog.Root open={open} onOpenChange={(o) => !o && onClose()}>
      <Dialog.Portal>
        <Dialog.Overlay
          className="fixed inset-0 z-50 bg-black/70"
          onClick={onClose}
        />
        <Dialog.Content
          onPointerDownOutside={onClose}
          onEscapeKeyDown={onClose}
          onClick={(e) => e.target === e.currentTarget && onClose()}
          className="fixed left-1/2 top-1/2 z-50 -translate-x-1/2 -translate-y-1/2 outline-none focus:outline-none rounded-xl shadow-2xl border border-white/20 overflow-hidden"
          style={{
            width: 300,
            maxWidth: "calc(100vw - 32px)",
            background: "#1a1a2e",
          }}
        >
          <VisuallyHidden.Root>
            <Dialog.Title>Previzualizare: {title}</Dialog.Title>
          </VisuallyHidden.Root>

          <div className="p-2 flex flex-col gap-1.5">
            {!effectiveUrl || imgError ? (
              <div className="flex flex-col items-center gap-2 py-4 text-white/70">
                <ImageOff className="h-10 w-10" />
                <p className="text-xs">Imagine indisponibilă</p>
                <p className="text-sm font-semibold text-white/90">{title}</p>
              </div>
            ) : (
              <div className="w-full h-[260px] rounded-lg overflow-hidden shrink-0">
                <img
                  src={effectiveUrl}
                  alt={title}
                  draggable={false}
                  loading="eager"
                  referrerPolicy="no-referrer"
                  onError={handleImgError}
                  className="w-full h-full object-cover"
                />
              </div>
            )}
            <p className="text-center text-xs font-medium text-white/80 w-full truncate shrink-0">
              {title}
            </p>
          </div>

          <Dialog.Close
            onClick={onClose}
            className="absolute right-2 top-2 z-10 flex h-8 w-8 items-center justify-center rounded-full bg-black/60 text-white hover:bg-black/80"
            aria-label="Închide"
          >
            <X className="h-4 w-4" />
          </Dialog.Close>
        </Dialog.Content>
      </Dialog.Portal>
    </Dialog.Root>
  );
}
