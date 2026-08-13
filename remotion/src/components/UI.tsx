import React from "react";
import { useCurrentFrame, useVideoConfig, spring, interpolate } from "remotion";
import { C } from "../theme";
import { body, display } from "./fonts";

export const Card: React.FC<{
  children: React.ReactNode;
  delay?: number;
  style?: React.CSSProperties;
}> = ({ children, delay = 0, style }) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const s = spring({ frame: frame - delay, fps, config: { damping: 18, stiffness: 140 } });
  return (
    <div
      style={{
        background: "rgba(255,255,255,.06)",
        border: "1px solid rgba(255,255,255,.12)",
        borderRadius: 22,
        padding: 18,
        opacity: Math.min(1, s * 1.2),
        transform: `translateY(${interpolate(s, [0, 1], [30, 0])}px) scale(${interpolate(s, [0, 1], [0.96, 1])})`,
        ...style,
      }}
    >
      {children}
    </div>
  );
};

export const Counter: React.FC<{
  to: number;
  delay?: number;
  suffix?: string;
  style?: React.CSSProperties;
}> = ({ to, delay = 0, suffix = " RON", style }) => {
  const frame = useCurrentFrame();
  const v = interpolate(frame - delay, [0, 45], [0, to], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
    easing: (t) => 1 - Math.pow(1 - t, 3),
  });
  return (
    <span style={{ fontFamily: display, fontWeight: 700, ...style }}>
      {Math.round(v).toLocaleString("ro-RO")}
      {suffix}
    </span>
  );
};

export const Bar: React.FC<{
  label: string;
  pct: number;
  color: string;
  delay?: number;
  amount: string;
}> = ({ label, pct, color, delay = 0, amount }) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const s = spring({ frame: frame - delay, fps, config: { damping: 20, stiffness: 90 } });
  return (
    <div style={{ marginBottom: 16, fontFamily: body, color: C.cream }}>
      <div style={{ display: "flex", justifyContent: "space-between", fontSize: 20, marginBottom: 8 }}>
        <span style={{ fontWeight: 600 }}>{label}</span>
        <span style={{ color: C.slate }}>{amount}</span>
      </div>
      <div style={{ height: 14, borderRadius: 10, background: "rgba(255,255,255,.09)", overflow: "hidden" }}>
        <div
          style={{
            width: `${pct * s}%`,
            height: "100%",
            borderRadius: 10,
            background: `linear-gradient(90deg, ${color}, ${color}aa)`,
          }}
        />
      </div>
    </div>
  );
};