import React from "react";

export interface SteampunkCardProps {
  name: string;
  handle: string;
  title: string;
  imageUrl?: string;
  subtitle?: string;
}

const PARCHMENT = "#f2e4c0";
const MAHOGANY = "#1c0e02";
const BRASS = "#8b6410";
const GILT = "#c9a227";
const GOLD_TEXT = "#e8c44a";

function Gear({ style }: { style?: React.CSSProperties }) {
  return (
    <svg
      width="48"
      height="48"
      viewBox="0 0 48 48"
      fill="none"
      style={{ opacity: 0.55, ...style }}
      aria-hidden
    >
      <g fill={BRASS}>
        <circle cx="24" cy="24" r="8" />
        <circle cx="24" cy="24" r="3" fill={PARCHMENT} />
        {Array.from({ length: 10 }).map((_, i) => {
          const a = (i * Math.PI * 2) / 10;
          const x = 24 + Math.cos(a) * 15;
          const y = 24 + Math.sin(a) * 15;
          return (
            <rect
              key={i}
              x={x - 2.5}
              y={y - 3.5}
              width="5"
              height="7"
              transform={`rotate(${(a * 180) / Math.PI + 90} ${x} ${y})`}
            />
          );
        })}
      </g>
    </svg>
  );
}

function Rivet({ style }: { style?: React.CSSProperties }) {
  return (
    <span
      style={{
        position: "absolute",
        width: 10,
        height: 10,
        borderRadius: "50%",
        background:
          "radial-gradient(circle at 30% 30%, #e9c770 0%, #8b6410 60%, #3a2a08 100%)",
        boxShadow: "inset 0 -1px 1px rgba(0,0,0,0.5), 0 1px 1px rgba(0,0,0,0.4)",
        ...style,
      }}
    />
  );
}

export function SteampunkCard({
  name,
  handle,
  title,
  imageUrl,
  subtitle = "ZO HOUSE · BANGALORE",
}: SteampunkCardProps) {
  const cleanHandle = handle.replace(/^@/, "");
  const portrait =
    imageUrl ||
    `https://unavatar.io/twitter/${cleanHandle}?fallback=https://unavatar.io/github/${cleanHandle}`;

  return (
    <div
      style={{
        width: 340,
        height: 500,
        position: "relative",
        background: PARCHMENT,
        fontFamily: "Georgia, 'Times New Roman', serif",
        color: MAHOGANY,
        border: `2.5px solid ${BRASS}`,
        boxShadow:
          "0 20px 50px rgba(0,0,0,0.45), 0 2px 6px rgba(0,0,0,0.3)",
        overflow: "hidden",
      }}
    >
      {/* Inner gilt border */}
      <div
        style={{
          position: "absolute",
          inset: 6,
          border: `1px solid ${GILT}`,
          pointerEvents: "none",
          zIndex: 2,
        }}
      />

      {/* Paper texture — faint grid */}
      <div
        style={{
          position: "absolute",
          inset: 0,
          backgroundImage:
            "repeating-linear-gradient(0deg, rgba(28,14,2,0.05) 0 1px, transparent 1px 22px), repeating-linear-gradient(90deg, rgba(28,14,2,0.05) 0 1px, transparent 1px 22px)",
          pointerEvents: "none",
        }}
      />

      {/* Radial vignette */}
      <div
        style={{
          position: "absolute",
          inset: 0,
          background:
            "radial-gradient(ellipse at center, transparent 40%, rgba(28,14,2,0.35) 100%)",
          pointerEvents: "none",
          zIndex: 1,
        }}
      />

      {/* Corner gears */}
      <Gear style={{ position: "absolute", top: 4, left: 4, zIndex: 1 }} />
      <Gear style={{ position: "absolute", top: 4, right: 4, zIndex: 1 }} />
      <Gear style={{ position: "absolute", bottom: 4, left: 4, zIndex: 1 }} />
      <Gear style={{ position: "absolute", bottom: 4, right: 4, zIndex: 1 }} />

      {/* Rivets — corners + top/bottom midpoints */}
      <Rivet style={{ top: 12, left: 12 }} />
      <Rivet style={{ top: 12, right: 12 }} />
      <Rivet style={{ bottom: 12, left: 12 }} />
      <Rivet style={{ bottom: 12, right: 12 }} />
      <Rivet style={{ top: 12, left: "50%", transform: "translateX(-50%)" }} />
      <Rivet
        style={{ bottom: 12, left: "50%", transform: "translateX(-50%)" }}
      />

      {/* Content */}
      <div
        style={{
          position: "relative",
          height: "100%",
          display: "flex",
          flexDirection: "column",
          padding: "28px 22px 0",
          zIndex: 2,
        }}
      >
        {/* Masthead */}
        <div style={{ textAlign: "center", marginBottom: 10 }}>
          <div
            style={{
              fontSize: 9,
              letterSpacing: "0.35em",
              color: BRASS,
              marginBottom: 2,
            }}
          >
            ⚙ THE AETHERIC CHRONICLES ⚙
          </div>
          <div
            style={{
              fontSize: 8,
              fontStyle: "italic",
              color: "rgba(28,14,2,0.6)",
              letterSpacing: "0.1em",
            }}
          >
            Est. MDCCCXCII · {subtitle}
          </div>
        </div>

        {/* Portrait — fills most of the card */}
        <div
          style={{
            position: "relative",
            flex: 1,
            margin: "0 4px",
            border: `2px solid ${BRASS}`,
            outline: `1px solid ${GILT}`,
            outlineOffset: 2,
            background: MAHOGANY,
            overflow: "hidden",
          }}
        >
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={portrait}
            alt={name}
            style={{
              width: "100%",
              height: "100%",
              objectFit: "cover",
              filter: "sepia(55%) contrast(1.05) brightness(0.95)",
            }}
          />
          {/* Handle caption bar */}
          <div
            style={{
              position: "absolute",
              left: 0,
              right: 0,
              bottom: 0,
              padding: "6px 10px",
              background:
                "linear-gradient(to top, rgba(28,14,2,0.92) 0%, rgba(28,14,2,0) 100%)",
              color: GOLD_TEXT,
              fontSize: 11,
              letterSpacing: "0.15em",
              fontStyle: "italic",
              textAlign: "right",
            }}
          >
            @{cleanHandle}
          </div>
        </div>

        {/* Title banner */}
        <div
          style={{
            marginTop: 14,
            marginBottom: 14,
            background: MAHOGANY,
            border: `1px solid ${GILT}`,
            padding: "10px 8px 12px",
            textAlign: "center",
            boxShadow: "0 2px 0 rgba(0,0,0,0.3)",
          }}
        >
          <div
            style={{
              fontSize: 8,
              letterSpacing: "0.35em",
              color: "rgba(232,196,74,0.6)",
              marginBottom: 4,
            }}
          >
            — HEREBY DESIGNATED AS —
          </div>
          <div
            style={{
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              gap: 8,
              color: GOLD_TEXT,
              fontStyle: "italic",
              fontSize: 22,
              letterSpacing: "0.08em",
              fontVariant: "small-caps",
              fontWeight: 700,
              lineHeight: 1,
            }}
          >
            <span style={{ color: GILT, fontSize: 10 }}>◆ ◆ ◆</span>
            <span>{title}</span>
            <span style={{ color: GILT, fontSize: 10 }}>◆ ◆ ◆</span>
          </div>
          <div
            style={{
              marginTop: 6,
              fontSize: 9,
              letterSpacing: "0.25em",
              color: "rgba(232,196,74,0.65)",
            }}
          >
            {name.toUpperCase()}
          </div>
        </div>
      </div>
    </div>
  );
}

export default SteampunkCard;
