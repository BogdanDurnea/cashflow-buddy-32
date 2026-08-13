import React from "react";
import { C } from "../theme";

export const Phone: React.FC<{ children: React.ReactNode; style?: React.CSSProperties }> = ({
  children,
  style,
}) => (
  <div
    style={{
      width: 430,
      height: 880,
      borderRadius: 54,
      padding: 12,
      background: "linear-gradient(160deg, #3a5a7d, #10243a)",
      boxShadow: "0 60px 120px rgba(0,0,0,.55), inset 0 0 0 2px rgba(255,255,255,.12)",
      ...style,
    }}
  >
    <div
      style={{
        width: "100%",
        height: "100%",
        borderRadius: 44,
        background: `linear-gradient(180deg, ${C.navyDeep} 0%, #041d38 100%)`,
        overflow: "hidden",
        position: "relative",
        padding: 24,
        display: "flex",
        flexDirection: "column",
        gap: 16,
      }}
    >
      <div
        style={{
          position: "absolute",
          top: 14,
          left: "50%",
          transform: "translateX(-50%)",
          width: 120,
          height: 26,
          borderRadius: 20,
          background: "rgba(0,0,0,.6)",
          zIndex: 5,
        }}
      />
      {children}
    </div>
  </div>
);