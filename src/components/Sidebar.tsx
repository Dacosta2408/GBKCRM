import React from "react";
import { 
  Users, Layers, BrainCircuit, Calculator, Globe, Calendar, 
  CheckSquare, MessageSquare, Mail, Heart, ShieldCheck, ShieldAlert,
  Settings, BarChart3
} from "lucide-react";
import { User, Client, Task, Event } from "../types";
import { motion } from "motion/react";

interface SidebarProps {
  activeTab: string;
  setActiveTab: (tab: string) => void;
  currentUser: User;
  clients: Client[];
  tasks: Task[];
  events: Event[];
  onOpenSettings: () => void;
  onLockApp: () => void;
  isOwner: boolean;
  onOpenProfileManager: () => void;
}

export const Sidebar: React.FC<SidebarProps> = ({
  activeTab,
  setActiveTab,
  currentUser,
  clients,
  tasks,
  events,
  onOpenSettings,
  onLockApp,
  isOwner,
  onOpenProfileManager
}) => {
  const activeTasksCount = tasks.filter(t => t.status === "open").length;

  const menuGroups = [
    {
      label: "Main",
      items: [
        { id: "dashboard", label: "Dashboard", icon: Layers },
        { 
          id: "clients", 
          label: "Client Database", 
          icon: Users,
          badge: clients.length 
        },
        { 
          id: "pipeline", 
          label: "Pipeline Board", 
          icon: () => (
            <svg className="h-4 w-4 stroke-current" viewBox="0 0 24 24" fill="none" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <polyline points="22 12 18 12 15 21 9 3 6 12 2 12"/>
            </svg>
          ) 
        },
      ]
    },
    {
      label: "Tools & AI",
      items: [
        { id: "ai", label: "AI Assistant ✦", icon: BrainCircuit, highlight: true },
        { id: "calculators", label: "Calculators", icon: Calculator },
        { id: "lenders", label: "Lender Sheets", icon: Globe },
      ]
    },
    {
      label: "Team & Comms",
      items: [
        { id: "calendar", label: "Calendar", icon: Calendar },
        { 
          id: "tasks", 
          label: "Daily Tasks", 
          icon: CheckSquare,
          badge: activeTasksCount 
        },
        { id: "messages", label: "Team Channels", icon: MessageSquare },
        { id: "emails", label: "Email", icon: Mail },
      ]
    },
    {
      label: "Operations",
      items: [
        { id: "retention", label: "CRM Retention", icon: Heart },
        { 
          id: "partners", 
          label: "Partner Network", 
          icon: () => (
            <svg className="h-4 w-4 stroke-current" viewBox="0 0 24 24" fill="none" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <circle cx="18" cy="18" r="3"/>
              <circle cx="12" cy="7" r="4"/>
              <path d="M12 12c-2.3 0-5.3 1.1-6.1 3.5"/>
            </svg>
          ) 
        },
        { id: "reports", label: "Reports", icon: BarChart3 },
        { id: "compliance", label: "Compliance", icon: ShieldCheck },
        { 
          id: "file_readiness", 
          label: "File Readiness", 
          icon: () => (
            <svg className="h-4 w-4 stroke-current" viewBox="0 0 24 24" fill="none" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/>
              <polyline points="14 2 14 8 20 8"/>
              <path d="m9 15 2 2 4-4"/>
            </svg>
          ) 
        },
        // Admin tab condition preserved exactly
        ...((isOwner || currentUser.role === "Owner / Master Admin" || currentUser.role === "Super Admin" || currentUser.role === "IT / Developer") 
          ? [{ id: "admin", label: "Admin Panel", icon: ShieldAlert, alert: true }] 
          : []),
        { id: "settings", label: "Settings", icon: Settings },
      ]
    }
  ];

  return (
    <aside 
      className="w-56 flex flex-col h-full shrink-0 z-40 relative border-r border-white/5 select-none"
      style={{ backgroundColor: "#2D3250" }}
    >
      {/* Top Header Block - linear-gradient */}
      <div 
        className="h-20 flex flex-col justify-center px-4 border-b border-[var(--glass-border)] relative overflow-hidden" 
        style={{ background: "linear-gradient(135deg, #486D83 0%, #4A2C3F 100%)" }}
      >
        <div className="absolute inset-0 bg-black/10 mix-blend-overlay" />
        <div className="flex items-center gap-2 z-10">
          <svg className="w-5 h-5 text-[#F9B17A] shrink-0" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
            <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/>
          </svg>
          <span className="text-sm font-extrabold text-white tracking-wide">GBK Financial</span>
        </div>
        <span className="text-[9px] text-white/50 tracking-[1.5px] uppercase font-bold mt-1 z-10">Ontario Mortgage CRM</span>
      </div>

      {/* Nav List Area */}
      <nav className="flex-1 overflow-y-auto px-2 py-3.5 flex flex-col gap-3 select-none">
        {menuGroups.map((group, gIdx) => (
          <div key={gIdx} className="flex flex-col gap-0.5">
            <div className="text-[10px] text-white/35 uppercase tracking-[1.5px] font-bold px-3 py-1 mb-1">
              {group.label}
            </div>
            {group.items.map((item) => {
              const isActive = activeTab === item.id;
              const Icon = item.icon;
              return (
                <button
                  key={item.id}
                  onClick={() => setActiveTab(item.id)}
                  className={`group relative flex items-center justify-between px-3 py-2 text-xs font-semibold rounded-lg transition-all duration-200 outline-none cursor-pointer ${
                    isActive 
                      ? "text-[var(--color-accent)] font-bold" 
                      : "text-[var(--color-text-muted)] hover:text-white hover:bg-[rgba(103,111,157,0.15)]"
                  }`}
                >
                  {/* Framer motion slide background active indicator */}
                  {isActive && (
                    <motion.div
                      layoutId="sidebar-active"
                      className="absolute inset-0 bg-[rgba(249,177,122,0.12)] border-l-2 border-[var(--color-accent)] rounded-lg pointer-events-none"
                    />
                  )}

                  <span className="flex items-center gap-2.5 z-10">
                    <Icon className={`h-4 w-4 shrink-0 transition-colors duration-200 ${
                      isActive 
                        ? "text-[#F9B17A]" 
                        : item.highlight 
                          ? "text-[#F9B17A]" 
                          : item.alert 
                            ? "text-red-400" 
                            : "text-[#676F9D] group-hover:text-white/80"
                    }`} />
                    <span className="truncate">{item.label}</span>
                  </span>

                  {item.badge !== undefined && item.badge > 0 && (
                    <span className="z-10 text-[9px] font-black px-1.5 py-0.5 rounded-full bg-[#F9B17A] text-[#12131a] min-w-4 text-center">
                      {item.badge}
                    </span>
                  )}
                </button>
              );
            })}
          </div>
        ))}
      </nav>

      {/* Bottom User Area */}
      <div className="p-3 border-t border-[var(--color-divider)] flex flex-col gap-3 shrink-0">
        <div 
          onClick={onOpenProfileManager}
          className="p-2.5 cursor-pointer rounded-xl transition-all duration-300 glass-card hover:border-[#F9B17A]/40 flex items-center gap-2.5 select-none"
        >
          <div 
            className="w-8 h-8 rounded-lg flex items-center justify-center font-bold text-xs text-white shrink-0" 
            style={{ background: "var(--grad-warm)" }}
          >
            {currentUser.name ? currentUser.name.split(" ").map(n => n[0]).join("").toUpperCase() : "U"}
          </div>
          <div className="flex-1 min-w-0">
            <div className="text-xs font-black text-white truncate">{currentUser.name || "Broker Profile"}</div>
            <div className="text-[10px] text-white/40 truncate font-semibold leading-none mt-0.5">{currentUser.role || "Mortgage Broker"}</div>
          </div>
        </div>

        {/* Version banner */}
        <div className="px-1 flex items-center justify-between text-[10px] text-white/30 font-mono font-bold select-none leading-none">
          <div className="flex items-center gap-1.5">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse"></span>
            <span>v{(import.meta as any).env?.VITE_APP_VERSION || "1.0.0"}</span>
          </div>
          <span className="px-1 py-0.5 bg-white/5 border border-[var(--color-border)] rounded text-[8px] font-black tracking-wider uppercase text-white/40">
            {(import.meta as any).env?.VITE_APP_ENV || "DEV"}
          </span>
        </div>
      </div>
    </aside>
  );
};
