import React from "react";
import { 
  UserPlus, FileCheck, CheckSquare, Handshake, Calendar, Search 
} from "lucide-react";

interface QuickActionsProps {
  onAddClient: () => void;
  onOpenNewClientIntake: () => void;
  onOpenAIIntake: () => void;
  onAddTask: () => void;
  onAddPartner: () => void;
  setActiveTab: (tab: string) => void;
}

export const QuickActions: React.FC<QuickActionsProps> = ({
  onAddClient,
  onOpenNewClientIntake,
  onOpenAIIntake,
  onAddTask,
  onAddPartner,
  setActiveTab
}) => {
  const actions = [
    {
      label: "New Client File",
      desc: "Create client folder",
      icon: UserPlus,
      onClick: onAddClient,
      iconColor: "text-[var(--color-accent)]"
    },
    {
      label: "Full Loan Intake",
      desc: "Detailed application",
      icon: FileCheck,
      onClick: onOpenNewClientIntake,
      iconColor: "text-[var(--color-info)]"
    },
    {
      label: "AI Smart Extractor",
      desc: "Extract from PDF / email",
      icon: Search,
      onClick: onOpenAIIntake,
      iconColor: "text-[var(--color-accent)]"
    },
    {
      label: "Log Task / Action",
      desc: "Add to daily list",
      icon: CheckSquare,
      onClick: onAddTask,
      iconColor: "text-[var(--color-success)]"
    },
    {
      label: "Onboard Partner",
      desc: "Professional contact",
      icon: Handshake,
      onClick: onAddPartner,
      iconColor: "text-[var(--color-warning)]"
    },
    {
      label: "Open Calendar",
      desc: "Book client meeting",
      icon: Calendar,
      onClick: () => setActiveTab("calendar"),
      iconColor: "text-[var(--color-text-muted)]"
    }
  ];

  return (
    <div className="flex flex-col gap-2 select-none" id="quick-actions-bar">
      <div className="text-[10px] text-[var(--color-text-muted)] uppercase tracking-wider font-extrabold">
        Quick Action Command Deck
      </div>
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
        {actions.map((act, i) => {
          const Icon = act.icon;
          return (
            <button
              key={i}
              onClick={act.onClick}
              className="glass-card flex items-center gap-3 p-3.5 rounded-xl border text-left transition-all duration-300 cursor-pointer hover:-translate-y-1 hover:border-[var(--color-accent)]/30 hover:shadow-[0_0_20px_rgba(200, 146, 42, 0.15)] group"
            >
              <div className="p-2 rounded-lg bg-[var(--color-surface-3)]/30 shrink-0 group-hover:bg-[var(--color-surface-3)]/60 transition-colors">
                <Icon className={`w-4 h-4 ${act.iconColor}`} />
              </div>
              <div className="min-w-0">
                <div className="text-xs font-black text-[var(--color-text)] truncate leading-tight">
                  {act.label}
                </div>
                <div className="text-[9px] text-[var(--color-text-faint)] truncate mt-0.5 font-bold">
                  {act.desc}
                </div>
              </div>
            </button>
          );
        })}
      </div>
    </div>
  );
};
