import { AbsoluteFill, useCurrentFrame, useVideoConfig, spring, interpolate } from "remotion";
import { C } from "../theme";
import { body, display } from "../components/fonts";
import { Card } from "../components/UI";

const flags = ["🇷🇴", "🇬🇧", "🇩🇪", "🇫🇷", "🇪🇸", "🇮🇹", "🇳🇱", "🇵🇱", "🇵🇹"];

export const Scene6CTA: React.FC = () => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const lock = spring({ frame, fps, config: { damping: 12, stiffness: 130 } });
  const cta = spring({ frame: frame - 96, fps, config: { damping: 16, stiffness: 120 } });
  const pulse = 1 + Math.sin(frame / 9) * 0.015;
  return (
    <AbsoluteFill style={{ justifyContent: "center", alignItems: "center" }}>
      <div style={{ display: "flex", gap: 30, marginBottom: 46 }}>
        <Card delay={4} style={{ padding: 30, width: 380, transform: `scale(${0.9 + lock * 0.1})` }}>
          <div style={{ fontSize: 52 }}>🔒</div>
          <div style={{ fontFamily: display, fontWeight: 700, color: C.cream, fontSize: 30, marginTop: 12 }}>
            Blocare biometrică
          </div>
          <div style={{ fontFamily: body, color: C.slate, fontSize: 20, marginTop: 8 }}>
            Fingerprint & Face ID lock
          </div>
        </Card>
        <Card delay={16} style={{ padding: 30, width: 380 }}>
          <div style={{ fontSize: 40, letterSpacing: 4 }}>{flags.slice(0, 5).join(" ")}</div>
          <div style={{ fontFamily: display, fontWeight: 700, color: C.cream, fontSize: 30, marginTop: 12 }}>
            9 limbi
          </div>
          <div style={{ fontFamily: body, color: C.slate, fontSize: 20, marginTop: 8 }}>Available in 9 languages</div>
        </Card>
        <Card delay={28} style={{ padding: 30, width: 380 }}>
          <div style={{ fontSize: 52 }}>📶</div>
          <div style={{ fontFamily: display, fontWeight: 700, color: C.cream, fontSize: 30, marginTop: 12 }}>
            Funcționează offline
          </div>
          <div style={{ fontFamily: body, color: C.slate, fontSize: 20, marginTop: 8 }}>Works offline, syncs later</div>
        </Card>
      </div>

      <div
        style={{
          fontFamily: display,
          fontWeight: 700,
          fontSize: 92,
          color: C.cream,
          letterSpacing: -3,
          opacity: cta,
          transform: `translateY(${interpolate(cta, [0, 1], [40, 0])}px)`,
          textAlign: "center",
        }}
      >
        Cashflow Buddy
      </div>
      <div
        style={{
          marginTop: 26,
          opacity: cta,
          transform: `scale(${pulse})`,
          background: C.mint,
          color: C.navyDeep,
          fontFamily: body,
          fontWeight: 800,
          fontSize: 34,
          padding: "20px 54px",
          borderRadius: 999,
          boxShadow: `0 20px 60px ${C.mint}55`,
        }}
      >
        Descarcă gratuit · Download free
      </div>
    </AbsoluteFill>
  );
};