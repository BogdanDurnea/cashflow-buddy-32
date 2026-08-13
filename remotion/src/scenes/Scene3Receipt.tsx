import { AbsoluteFill, useCurrentFrame, useVideoConfig, spring, interpolate } from "remotion";
import { C } from "../theme";
import { body } from "../components/fonts";
import { Caption } from "../components/Caption";
import { Phone } from "../components/Phone";
import { Card } from "../components/UI";

export const Scene3Receipt: React.FC = () => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const scanY = interpolate(frame % 60, [0, 60], [0, 300]);
  const done = spring({ frame: frame - 80, fps, config: { damping: 200 } });
  return (
    <AbsoluteFill style={{ flexDirection: "row-reverse", alignItems: "center", padding: "0 140px", gap: 100 }}>
      <div style={{ flex: 1 }}>
        <Caption ro={"Fotografiezi bonul.\nAI-ul face restul."} en="Snap the receipt — AI does the rest" />
        <div style={{ marginTop: 40, display: "flex", flexDirection: "column", gap: 16, maxWidth: 620 }}>
          {["Sumă, magazin și dată extrase automat", "Categorie sugerată inteligent", "Bonul salvat securizat în cloud"].map((t, i) => (
            <Card key={t} delay={30 + i * 10} style={{ display: "flex", gap: 16, alignItems: "center" }}>
              <div style={{ width: 34, height: 34, borderRadius: 17, background: C.mint, color: C.navyDeep, fontFamily: body, fontWeight: 800, display: "flex", alignItems: "center", justifyContent: "center" }}>✓</div>
              <span style={{ fontFamily: body, color: C.cream, fontSize: 26 }}>{t}</span>
            </Card>
          ))}
        </div>
      </div>
      <div style={{ transform: "rotate(2.5deg)" }}>
        <Phone>
          <div style={{ marginTop: 40, position: "relative", height: 340, borderRadius: 20, background: "rgba(255,255,255,.07)", overflow: "hidden", border: `1px solid rgba(255,255,255,.14)` }}>
            <div style={{ padding: 22, fontFamily: body, color: C.slate, fontSize: 18, lineHeight: 1.9 }}>
              KAUFLAND SRL
              <br />Lapte 3.5% ....... 8,90
              <br />Pâine integrală ... 6,50
              <br />Cafea boabe ...... 42,00
              <br />Ouă 10 buc ....... 18,40
              <br />——————————
              <br />TOTAL ........... 75,80
            </div>
            <div style={{ position: "absolute", left: 0, right: 0, top: scanY, height: 4, background: C.mint, boxShadow: `0 0 30px 8px ${C.mint}88`, opacity: frame < 80 ? 1 : 0 }} />
          </div>
          <Card delay={80} style={{ opacity: done, padding: 18 }}>
            <div style={{ fontFamily: body, color: C.slate, fontSize: 18 }}>Detectat automat</div>
            <div style={{ fontFamily: body, fontWeight: 800, color: C.cream, fontSize: 30, marginTop: 6 }}>Kaufland · 75,80 RON</div>
            <div style={{ fontFamily: body, color: C.mint, fontSize: 20, marginTop: 6 }}>Categorie: Alimente</div>
          </Card>
        </Phone>
      </div>
    </AbsoluteFill>
  );
};