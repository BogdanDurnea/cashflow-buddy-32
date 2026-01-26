import { Home, TrendingUp, Wallet, FileText, Settings, Trophy } from "lucide-react";
import { useTranslation } from "react-i18next";
import {
  Sidebar,
  SidebarContent,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  useSidebar,
} from "@/components/ui/sidebar";

interface AppSidebarProps {
  activeSection: string;
  onSectionChange: (section: string) => void;
}

const getSections = (t: (key: string) => string) => [
  { id: "transactions", title: t("nav.transactions"), icon: Home },
  { id: "analytics", title: t("analytics.title"), icon: TrendingUp },
  { id: "budgets", title: t("budgets.title"), icon: Wallet },
  { id: "achievements", title: t("achievements.title"), icon: Trophy },
  { id: "reports", title: t("reports.title"), icon: FileText },
  { id: "settings", title: t("settings.title"), icon: Settings },
];

export function AppSidebar({ activeSection, onSectionChange }: AppSidebarProps) {
  const { open } = useSidebar();
  const { t } = useTranslation();
  const sections = getSections(t);

  const scrollToSection = (sectionId: string) => {
    onSectionChange(sectionId);
    const element = document.getElementById(`section-${sectionId}`);
    if (element) {
      element.scrollIntoView({ behavior: "smooth", block: "start" });
    }
  };

  return (
    <Sidebar collapsible="icon">
      <SidebarContent>
        <SidebarGroup>
          <SidebarGroupLabel className={open ? "" : "sr-only"}>
            {t("nav.dashboard")}
          </SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              {sections.map((section) => {
                const Icon = section.icon;
                const isActive = activeSection === section.id;
                
                return (
                  <SidebarMenuItem key={section.id}>
                    <SidebarMenuButton
                      onClick={() => scrollToSection(section.id)}
                      className={isActive ? "bg-muted text-primary font-medium" : ""}
                      tooltip={section.title}
                    >
                      <Icon className="h-4 w-4" />
                      <span>{section.title}</span>
                    </SidebarMenuButton>
                  </SidebarMenuItem>
                );
              })}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>
    </Sidebar>
  );
}
