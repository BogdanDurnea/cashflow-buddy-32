import { AbsoluteFill, useCurrentFrame, interpolate } from "remotion";
import { C, bg } from "../theme";

export const Background: React.FC = () => {
  const frame = useCurrentFrame();
  const drift = Math.sin(frame / 90) * 40;
  const drift2 = Math.cos(frame / 120) * 60;
  return (
    <AbsoluteFill style={{ background: bg }}>
      <AbsoluteFill
        style={{
          background: `radial-gradient(closest-side, ${C.mint}22, transparent 70%)`,
          transform: `translate(${1180 + drift}px, ${120 + drift2}px)`,
          width: 900,
          height: 900,
        }}
      />
      <AbsoluteFill
        style={{
          background: `radial-gradient(closest-side, ${C.amber}18, transparent 70%)`,
          transform: `translate(${-180 - drift2}px, ${560 + drift}px)`,
          width: 800,
          height: 800,
        }}
      />
      <AbsoluteFill
        style={{
          opacity: 0.06,
          backgroundImage:
            "linear-gradient(rgba(255,255,255,.6) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,.6) 1px, transparent 1px)",
          backgroundSize: "80px 80px",
          transform: `translateY(${interpolate(frame, [0, 900], [0, -80])}px)`,
        }}
      />
    </AbsoluteFill>
  );
};