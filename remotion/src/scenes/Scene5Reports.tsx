import { AbsoluteFill, useCurrentFrame, useVideoConfig, spring, interpolate } from "remotion";
import { C } from "../theme";
import { body, display } from "../components/fonts";
import { Caption } from "../components/Caption";
import { Card } from "../components/UI";

const bars = [42, 68, 55, 88, 74, 96, 61, 80];

export const Scene5Reports: React.FC = () => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const line = interpolate(frame, [20, 90], [0, 1], { extrapolateRight: "clamp", extrapolateLeft: "clamp" });
  return (
    <AbsoluteFill style={{ flexDirection: "row", alignItems: "center", padding: "0 150px", gap: 70 }}>
      <Card delay={10} style={{ flex: 1.15, padding: 36, height: 520 }}>
        <div style={{ fontFamily: body, color: C.slate, fontSize: 22 }}>Evoluție sold · ultimele 8 luni</div>
        <svg width={780} height={300} style={{ marginTop: 30, overflow: "visible" }}>
          <path
            d="M0 260 L110 210 L220 226 L330 150 L440 176 L550 92 L660 138 L770 70"
            fill="none"
            stroke={C.mint}
            strokeWidth={6}
            strokeLinecap="round"
            strokeDasharray={1100}
            strokeDashoffset={1100 - 1100 * line}
          />
          {bars.map((b, i) => {
            const s = spring({ frame: frame - 24 - i * 5, fps, config: { damping: 20, stiffness: 110 } });
            return (
              <rect
                key={i}
                x={i * 110 + 20}
                y={300 - (b * 2.6 * s)}
                width={54}
                height={b * 2.6 * s}
                rx={12}
                fill={i === 5 ? C.amber : "rgba(255,255,255,.16)"}
              />
            );
          })}
        </svg>
      </Card>
      <div style={{ flex: 1 }}>
        <Caption ro={"Rapoarte PDF\nși grafice clare"} en="Clear charts and PDF reports" size={68} delay={16} />
        <Card delay={60} style={{ marginTop: 36, padding: 26, display: "flex", gap: 18, alignItems: "center" }}>
          <div style={{ fontSize: 40 }}>📄</div>
          <div>
            <div style={{ fontFamily: display, fontWeight: 700, color: C.cream, fontSize: 28 }}>Raport lunar.pdf</div>
            <div style={{ fontFamily: body, color: C.slate, fontSize: 20, marginTop: 4 }}>
              Sumar AI · comparație lună-la-lună
            </div>
          </div>
        </Card>
        <Card delay={74} style={{ marginTop: 18, padding: 26 }}>
          <div style={{ fontFamily: body, color: C.mint, fontSize: 24 }}>
            „La ritmul actual economisești 1.240 RON luna asta.”
          </div>
        </Card>
      </div>
    </AbsoluteFill>
  );
};