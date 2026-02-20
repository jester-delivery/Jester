import { ImageResponse } from "next/og";

export const alt = "Jester – Livrări și comenzi Sulina";
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

export default function OpenGraphImage() {
  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          justifyContent: "center",
          background: "linear-gradient(135deg, #0a0a12 0%, #1a1a2e 50%, #0f172a 100%)",
          color: "white",
          fontFamily: "system-ui, sans-serif",
        }}
      >
        <div
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            width: 120,
            height: 120,
            background: "linear-gradient(135deg, #f59e0b 0%, #d97706 100%)",
            borderRadius: 24,
            fontSize: 64,
            fontWeight: 800,
            marginBottom: 32,
          }}
        >
          J
        </div>
        <div style={{ fontSize: 56, fontWeight: 800, marginBottom: 16 }}>Jester</div>
        <div style={{ fontSize: 28, color: "#94a3b8" }}>
          Livrări și comenzi în Sulina
        </div>
        <div style={{ fontSize: 22, color: "#64748b", marginTop: 12 }}>
          Jester 24/24 · Meniu · Pizza · Delivery
        </div>
      </div>
    ),
    { ...size }
  );
}
