import { useCurrentFrame, useVideoConfig, spring, interpolate } from "remotion";
import { C } from "../theme";
import { display, body } from "./fonts";

export const Caption: React.FC<{
  ro: string;
  en: string;
  delay?: number;
  align?: "left" | "center";
  size?: number;
}> = ({ ro, en, delay = 0, align = "left", size = 76 }) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const s = spring({ frame: frame - delay, fps, config: { damping: 200 } });
  const y = interpolate(s, [0, 1], [42, 0]);
  const blur = interpolate(s, [0, 1], [14, 0]);
  const s2 = spring({ frame: frame - delay - 7, fps, config: { damping: 200 } });
  return (
    <div style={{ textAlign: align, opacity: s, transform: `translateY(${y}px)`, filter: `blur(${blur}px)` }}>
      <div
        style={{
          fontFamily: display,
          fontWeight: 700,
          fontSize: size,
          lineHeight: 1.05,
          color: C.cream,
          letterSpacing: -1.5,
          whiteSpace: "pre-line",
        }}
      >
        {ro}
      </div>
      <div
        style={{
          fontFamily: body,
          fontWeight: 600,
          fontSize: size * 0.32,
          marginTop: 14,
          color: C.mint,
          opacity: s2 * 0.95,
          letterSpacing: 0.5,
        }}
      >
        {en}
      </div>
    </div>
  );
};