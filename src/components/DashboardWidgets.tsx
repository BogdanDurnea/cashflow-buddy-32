import { useState, useEffect, useCallback } from "react";
import { useTranslation } from "react-i18next";
import { motion, Reorder } from "framer-motion";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { GripVertical, Eye, EyeOff, Settings2, X } from "lucide-react";
import { Transaction } from "./TransactionForm";
import { QuickStatsDonut } from "./QuickStatsDonut";
import { BalanceEvolutionChart } from "./BalanceEvolutionChart";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";

type WidgetId = "balance-evolution" | "category-donut";

interface WidgetConfig {
  id: WidgetId;
  label: string;
  visible: boolean;
}

const STORAGE_KEY = "dashboard-widgets-config";

const defaultWidgets: WidgetConfig[] = [
  { id: "balance-evolution", label: "Evoluție sold", visible: true },
  { id: "category-donut", label: "Cheltuieli pe categorii", visible: true },
];

function loadConfig(): WidgetConfig[] {
  try {
    const saved = localStorage.getItem(STORAGE_KEY);
    if (saved) {
      const parsed = JSON.parse(saved) as WidgetConfig[];
      // Merge with defaults to handle new widgets
      const ids = new Set(parsed.map((w) => w.id));
      const merged = [
        ...parsed,
        ...defaultWidgets.filter((w) => !ids.has(w.id)),
      ];
      return merged;
    }
  } catch {}
  return defaultWidgets;
}

function saveConfig(config: WidgetConfig[]) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(config));
}

interface DashboardWidgetsProps {
  transactions: Transaction[];
}

export function DashboardWidgets({ transactions }: DashboardWidgetsProps) {
  const { t } = useTranslation();
  const [widgets, setWidgets] = useState<WidgetConfig[]>(loadConfig);
  const [settingsOpen, setSettingsOpen] = useState(false);

  useEffect(() => {
    saveConfig(widgets);
  }, [widgets]);

  const handleReorder = useCallback((newOrder: WidgetConfig[]) => {
    setWidgets(newOrder);
  }, []);

  const toggleVisibility = useCallback((id: WidgetId) => {
    setWidgets((prev) =>
      prev.map((w) => (w.id === id ? { ...w, visible: !w.visible } : w))
    );
  }, []);

  const visibleWidgets = widgets.filter((w) => w.visible);

  const renderWidget = (widget: WidgetConfig) => {
    switch (widget.id) {
      case "balance-evolution":
        return <BalanceEvolutionChart transactions={transactions} />;
      case "category-donut":
        return <QuickStatsDonut transactions={transactions} />;
      default:
        return null;
    }
  };

  return (
    <div className="space-y-4">
      {/* Header with settings */}
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-semibold flex items-center gap-2">
          📊 Dashboard
        </h3>
        <Dialog open={settingsOpen} onOpenChange={setSettingsOpen}>
          <DialogTrigger asChild>
            <Button variant="outline" size="sm" className="gap-2">
              <Settings2 className="h-4 w-4" />
              <span className="hidden sm:inline">Personalizare</span>
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Personalizare Dashboard</DialogTitle>
            </DialogHeader>
            <div className="space-y-4 py-4">
              <p className="text-sm text-muted-foreground">
                Activează/dezactivează widget-urile și trage pentru a reordona.
              </p>
              <Reorder.Group
                axis="y"
                values={widgets}
                onReorder={setWidgets}
                className="space-y-2"
              >
                {widgets.map((widget) => (
                  <Reorder.Item
                    key={widget.id}
                    value={widget}
                    className="flex items-center gap-3 p-3 bg-muted/50 rounded-lg border cursor-grab active:cursor-grabbing"
                  >
                    <GripVertical className="h-4 w-4 text-muted-foreground shrink-0" />
                    <Label className="flex-1 cursor-grab">{widget.label}</Label>
                    <Switch
                      checked={widget.visible}
                      onCheckedChange={() => toggleVisibility(widget.id)}
                    />
                  </Reorder.Item>
                ))}
              </Reorder.Group>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      {/* Widgets */}
      {visibleWidgets.length === 0 ? (
        <Card className="shadow-card">
          <CardContent className="py-8 text-center text-muted-foreground">
            <p>Niciun widget activ. Apasă pe Personalizare pentru a adăuga widget-uri.</p>
          </CardContent>
        </Card>
      ) : (
        <Reorder.Group
          axis="y"
          values={visibleWidgets}
          onReorder={(newOrder) => {
            // Rebuild full list preserving hidden items' relative positions
            const visibleIds = new Set(newOrder.map((w) => w.id));
            const hidden = widgets.filter((w) => !visibleIds.has(w.id));
            setWidgets([...newOrder, ...hidden]);
          }}
          className="space-y-4"
        >
          {visibleWidgets.map((widget) => (
            <Reorder.Item
              key={widget.id}
              value={widget}
              className="cursor-grab active:cursor-grabbing"
              whileDrag={{ scale: 1.02, boxShadow: "0 8px 25px rgba(0,0,0,0.15)" }}
            >
              <div className="relative group">
                <div className="absolute -left-2 top-1/2 -translate-y-1/2 opacity-0 group-hover:opacity-100 transition-opacity z-10">
                  <div className="p-1 rounded bg-muted border shadow-sm">
                    <GripVertical className="h-4 w-4 text-muted-foreground" />
                  </div>
                </div>
                {renderWidget(widget)}
              </div>
            </Reorder.Item>
          ))}
        </Reorder.Group>
      )}
    </div>
  );
}
