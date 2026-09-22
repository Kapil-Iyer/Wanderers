import { ImageResponse } from "next/og";

export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

export default function OpengraphImage() {
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
          background:
            "radial-gradient(1200px 700px at 50% 30%, #1c0f1a 0%, #100812 55%, #0b0710 100%)",
        }}
      >
        <div
          style={{
            width: 140,
            height: 140,
            borderRadius: "50% 50% 50% 0",
            transform: "rotate(45deg)",
            background:
              "linear-gradient(135deg, #FF5A36 0%, #E0339E 50%, #8b5cf6 100%)",
            marginBottom: 48,
          }}
        />
        <div
          style={{
            fontSize: 96,
            fontWeight: 700,
            color: "#FAFAFA",
            letterSpacing: -2,
          }}
        >
          Wanderers
        </div>
        <div style={{ fontSize: 32, color: "#A5A5B8", marginTop: 12 }}>
          Find your people. Start something.
        </div>
      </div>
    ),
    { ...size }
  );
}
