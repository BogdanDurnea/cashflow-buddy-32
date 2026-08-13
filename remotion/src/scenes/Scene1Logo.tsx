import { AbsoluteFill, useCurrentFrame, useVideoConfig, spring, interpolate } from "remotion";
import { C } from "../theme";
import { display, body } from "./../components/fonts";

export const Scene1Logo: React.FC = () => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const mark = spring({ frame, fps, config: { damping: 12, stiffness: 120 } });
  const title = spring({ frame: frame - 14, fps, config: { damping: 200 } });
  const sub = spring({ frame: frame - 26, fps, config: { damping: 200 } });
  const ring = interpolate(frame, [0, 130], [0, 1]);

  return (
    <AbsoluteFill style={{ justifyContent: "center", alignItems: "center" }}>
      <div style={{ position: "relative", display: "flex", flexDirection: "column", alignItems: "center" }}>
        <svg width={220} height={220} style={{ transform: `scale(${mark}) rotate(${(1 - mark) * -40}deg)` }}>
          <circle cx={110} cy={110} r={92} fill="none" stroke="rgba(255,255,255,.14)" strokeWidth={10} />
          <circle
            cx={110}
            cy={110}
            r={92}
            fill="none"
            stroke={C.mint}
            strokeWidth={10}
            strokeLinecap="round"
            strokeDasharray={578}
            strokeDashoffset={578 - 578 * ring * 0.78}
            transform="rotate(-90 110 110)"
          />
          <path
            d="M70 128 L98 100 L124 122 L156 82"
            fill="none"
            stroke={C.amber}
            strokeWidth={11}
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeDasharray={160}
            strokeDashoffset={160 - 160 * interpolate(frame, [16, 52], [0, 1], { extrapolateRight: "clamp", extrapolateLeft: "clamp" })}
          />
        </svg>
        <div
          style={{
            fontFamily: display,
            fontWeight: 700,
            fontSize: 96,
            color: C.cream,
            letterSpacing: -3,
            marginTop: 24,
            opacity: title,
            transform: `translateY(${interpolate(title, [0, 1], [30, 0])}px)`,
          }}
        >
          Cashflow Buddy
        </div>
        <div
          style={{
            fontFamily: body,
            fontWeight: 600,
            fontSize: 34,
            color: C.mint,
            marginTop: 16,
            opacity: sub,
            letterSpacing: 1,
          }}
        >
          Controlează-ți banii
          <span style={{ color: C.slate, marginLeft: 18, fontWeight: 400 }}>
            Take control of your money
          </span>
        </div>
      </div>
    </AbsoluteFill>
  );
};