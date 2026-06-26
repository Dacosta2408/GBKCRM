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
      color: "bg-[#b5a642]/10 border-[#b5a642]/20 text-[#b5a642] hover:bg-[#b5a642]/20"
    },
    {
      label: "Full Loan Intake",
      desc: "Detailed application form",
      icon: FileCheck,
      onClick: onOpenNewClientIntake,
      color: "bg-blue-500/10 border-blue-500/20 text-blue-400 hover:bg-blue-500/20"
    },
    {
      label: "AI Smart Extractor",
      desc: "Extract from email / PDF",
      icon: Search,
      onClick: onOpenAIIntake,
      color: "bg-purple-500/10 border-purple-500/20 text-purple-400 hover:bg-purple-500/20"
    },
    {
      label: "Log Task / Action",
      desc: "Add to daily list",
      icon: CheckSquare,
      onClick: onAddTask,
      color: "bg-emerald-500/10 border-emerald-500/20 text-emerald-400 hover:bg-emerald-500/20"
    },
    {
      label: "Onboard Partner",
      desc: "Add professional contact",
      icon: Handshake,
      onClick: onAddPartner,
      color: "bg-orange-500/10 border-orange-500/20 text-orange-400 hover:bg-orange-500/20"
    },
    {
      label: "Open Calendar",
      desc: "Book client meeting",
      icon: Calendar,
      onClick: () => setActiveTab("calendar"),
      color: "bg-slate-400/10 border-slate-400/20 text-slate-300 hover:bg-slate-400/20"
    }
  ];

  return (
    <div className="flex flex-col gap-2" id="quick-actions-bar">
      <div className="text-[10px] text-[#8e95a3] uppercase tracking-wider font-semibold">
        Quick Action Command Deck
      </div>
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
        {actions.map((act, i) => {
          const Icon = act.icon;
          return (
            <button
              key={i}
              onClick={act.onClick}
              className={`flex items-center gap-3 p-3 rounded-xl border text-left transition-all duration-200 hover:-translate-y-0.5 active:translate-y-0 shadow-sm ${act.color}`}
            >
              <div className="p-2 rounded-lg bg-black/20 shrink-0">
                <Icon className="w-4 h-4" />
              </div>
              <div className="min-w-0">
                <div className="text-xs font-bold leading-tight truncate">
                  {act.label}
                </div>
                <div className="text-[9px] text-white/40 truncate mt-0.5">
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
