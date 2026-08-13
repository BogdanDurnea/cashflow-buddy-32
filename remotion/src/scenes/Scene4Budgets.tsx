import { AbsoluteFill, useCurrentFrame, useVideoConfig, spring } from "remotion";
import { C } from "../theme";
import { body } from "../components/fonts";
import { Caption } from "../components/Caption";
import { Card, Bar } from "../components/UI";

export const Scene4Budgets: React.FC = () => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const alert = spring({ frame: frame - 92, fps, config: { damping: 10, stiffness: 160 } });
  return (
    <AbsoluteFill style={{ justifyContent: "center", padding: "0 150px" }}>
      <Caption ro="Bugete care te opresc la timp" en="Budgets that stop you in time" size={70} />
      <div style={{ marginTop: 50, display: "flex", gap: 40, alignItems: "flex-start" }}>
        <Card delay={18} style={{ flex: 1, padding: 34 }}>
          <Bar label="Alimente" pct={64} color={C.mint} delay={26} amount="640 / 1.000 RON" />
          <Bar label="Transport" pct={82} color={C.amber} delay={36} amount="410 / 500 RON" />
          <Bar label="Distracție" pct={96} color={C.coral} delay={46} amount="288 / 300 RON" />
          <Bar label="Economii" pct={45} color={C.mint} delay={56} amount="900 / 2.000 RON" />
        </Card>
        <Card
          delay={90}
          style={{
            width: 520,
            padding: 30,
            background: `${C.amber}1f`,
            borderColor: `${C.amber}66`,
            transform: `scale(${0.9 + alert * 0.1}) rotate(${(1 - alert) * 3}deg)`,
          }}
        >
          <div style={{ fontFamily: body, fontWeight: 800, color: C.amber, fontSize: 30 }}>⚠ Alertă buget</div>
          <div style={{ fontFamily: body, color: C.cream, fontSize: 26, marginTop: 12, lineHeight: 1.4 }}>
            Ai atins 96% din bugetul „Distracție”.
          </div>
          <div style={{ fontFamily: body, color: C.slate, fontSize: 20, marginTop: 10 }}>
            You've reached 96% of your Fun budget
          </div>
        </Card>
      </div>
    </AbsoluteFill>
  );
};