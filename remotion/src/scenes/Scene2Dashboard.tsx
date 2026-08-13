import { AbsoluteFill, useCurrentFrame, interpolate } from "remotion";
import { C } from "../theme";
import { body, display } from "../components/fonts";
import { Caption } from "../components/Caption";
import { Phone } from "../components/Phone";
import { Card, Counter } from "../components/UI";

const Spark: React.FC = () => {
  const frame = useCurrentFrame();
  const p = interpolate(frame, [10, 70], [0, 1], { extrapolateRight: "clamp", extrapolateLeft: "clamp" });
  const d = "M0 90 L40 70 L80 78 L120 44 L160 56 L200 26 L240 34 L280 10";
  return (
    <svg width={280} height={100} style={{ overflow: "visible" }}>
      <path d={d} fill="none" stroke={C.mint} strokeWidth={5} strokeLinecap="round" strokeDasharray={420} strokeDashoffset={420 - 420 * p} />
    </svg>
  );
};

export const Scene2Dashboard: React.FC = () => {
  const frame = useCurrentFrame();
  return (
    <AbsoluteFill style={{ flexDirection: "row", alignItems: "center", padding: "0 130px", gap: 90 }}>
      <div style={{ flex: 1 }}>
        <Caption ro={"Toți banii tăi,\nîntr-un singur ecran"} en="All your money on one screen" />
        <div style={{ marginTop: 46, display: "flex", gap: 22 }}>
          {[
            { l: "Venituri", v: 8450, c: C.mint },
            { l: "Cheltuieli", v: 5120, c: C.coral },
            { l: "Balanță", v: 3330, c: C.amber },
          ].map((k, i) => (
            <Card key={k.l} delay={24 + i * 8} style={{ minWidth: 200 }}>
              <div style={{ fontFamily: body, color: C.slate, fontSize: 20, marginBottom: 8 }}>{k.l}</div>
              <Counter to={k.v} delay={30 + i * 8} style={{ color: k.c, fontSize: 34 }} />
            </Card>
          ))}
        </div>
      </div>
      <div style={{ transform: `translateY(${interpolate(frame, [0, 165], [26, -26])}px) rotate(-3deg)` }}>
        <Phone>
          <div style={{ marginTop: 34, fontFamily: body, color: C.slate, fontSize: 18 }}>Bună, Bogdan 👋</div>
          <div style={{ fontFamily: display, fontWeight: 700, color: C.cream, fontSize: 46 }}>
            <Counter to={3330} delay={16} />
          </div>
          <Card delay={20} style={{ padding: 20 }}>
            <Spark />
          </Card>
          {["Salariu", "Kaufland", "Netflix", "Benzină"].map((t, i) => (
            <Card key={t} delay={30 + i * 6} style={{ padding: 14, display: "flex", justifyContent: "space-between" }}>
              <span style={{ fontFamily: body, color: C.cream, fontSize: 20 }}>{t}</span>
              <span style={{ fontFamily: body, color: i === 0 ? C.mint : C.coral, fontSize: 20 }}>
                {i === 0 ? "+6.200" : ["-248", "-55", "-320"][i - 1]}
              </span>
            </Card>
          ))}
        </Phone>
      </div>
    </AbsoluteFill>
  );
};