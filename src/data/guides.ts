import { Wallet, PieChart, FileText, type LucideIcon } from "lucide-react";

export interface GuideEntry {
  to: string;
  icon: LucideIcon;
  title: string;
  text: string;
}

/** Single source of truth for the guide pages, used by the homepage and for
 *  the recurrent "Ghiduri similare" cross-links between guides. */
export const guides: GuideEntry[] = [
  {
    to: "/urmarirea-cheltuielilor",
    icon: Wallet,
    title: "Urmărirea cheltuielilor",
    text: "Cum îți ții evidența cheltuielilor zilnice cu categorii, bonuri scanate și import CSV.",
  },
  {
    to: "/bugete-personale",
    icon: PieChart,
    title: "Buget personal",
    text: "Regula 50/30/20, bugete pe categorii, alerte de depășire și obiective de economii.",
  },
  {
    to: "/rapoarte-financiare",
    icon: FileText,
    title: "Rapoarte financiare",
    text: "Indicatorii lunari esențiali, comparații între luni și export PDF sau CSV.",
  },
];

export const relatedGuides = (currentPath: string) =>
  guides.filter((g) => g.to !== currentPath);
