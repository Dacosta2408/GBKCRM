import React from "react";
import { 
  Users, Layers, BrainCircuit, Calculator, Globe, Calendar, 
  CheckSquare, MessageSquare, Mail, Heart, ShieldCheck, ShieldAlert,
  Settings, Lock, BarChart3
} from "lucide-react";
import { User, Client, Task, Event } from "../types";

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
  const birthdaysTodayCount = events.filter(e => e.type === "birthday" && e.date === new Date().toISOString().split("T")[0]).length;

  return (
    <aside className="w-56 bg-[#111115] border-r border-white/5 flex flex-col h-full shrink-0 z-40 relative shadow-lg">
      <div className="p-4 border-b border-white/5 flex flex-col bg-gradient-to-b from-[#b5a642]/10 to-transparent">
        <div className="flex items-center gap-2">
          <span className="text-xl font-bold bg-gradient-to-r from-[#b5a642] via-[#eeeef2] to-[#6fa3b8] bg-clip-text text-transparent font-sans">GBK Financial</span>
        </div>
        <span className="text-[9px] text-[#eeeef2]/30 tracking-[1.5px] uppercase font-semibold mt-1">Ontario Mortgage CRM</span>
      </div>

      <nav className="flex-1 overflow-y-auto px-2 py-3 flex flex-col gap-1 select-none">
        <div className="text-[10px] text-white/20 uppercase tracking-[1.5px] font-bold px-3 py-1">Main</div>
        <button 
          onClick={() => setActiveTab("dashboard")} 
          className={`flex items-center gap-3 px-3 py-2 text-xs font-semibold rounded-lg transition-all ${activeTab === "dashboard" ? "bg-[#b5a642]/10 text-[#b5a642]" : "text-white/60 hover:bg-white/5"}`}
        >
          <Layers className="h-4 w-4" /> Dashboard
        </button>
        <button 
          onClick={() => setActiveTab("clients")} 
          className={`flex items-center gap-3 px-3 py-2 text-xs font-semibold rounded-lg transition-all relative ${activeTab === "clients" ? "bg-[#b5a642]/10 text-[#b5a642]" : "text-white/60 hover:bg-white/5"}`}
        >
          <Users className="h-4 w-4" /> Client Database
          <span className="absolute right-3 bg-[#b5a642]/20 text-[#b5a642] text-[9px] font-bold px-2 py-0.5 rounded-full">{clients.length}</span>
        </button>
        <button 
          onClick={() => setActiveTab("pipeline")} 
          className={`flex items-center gap-3 px-3 py-2 text-xs font-semibold rounded-lg transition-all ${activeTab === "pipeline" ? "bg-[#b5a642]/10 text-[#b5a642]" : "text-white/60 hover:bg-white/5"}`}
        >
          <svg className="h-4 w-4 stroke-current" viewBox="0 0 24 24" fill="none" strokeWidth="2"><polyline points="22 12 18 12 15 21 9 3 6 12 2 12"/></svg> Pipeline Board
        </button>

        <div className="text-[10px] text-white/20 uppercase tracking-[1.5px] font-bold px-3 py-1 mt-3">Tools & AI</div>
        <button 
          onClick={() => setActiveTab("ai")} 
          className={`flex items-center gap-3 px-3 py-2 text-xs font-semibold rounded-lg transition-all bg-gradient-to-r ${activeTab === "ai" ? "from-[#b5a642]/20 to-[#6fa3b8]/10 text-[#b5a642]" : "text-white/60 hover:bg-white/5"}`}
        >
          <BrainCircuit className="h-4 w-4 text-[#b5a642]" /> AI Assistant ✦
        </button>
        <button 
          onClick={() => setActiveTab("calculators")} 
          className={`flex items-center gap-3 px-3 py-2 text-xs font-semibold rounded-lg transition-all ${activeTab === "calculators" ? "bg-[#b5a642]/10 text-[#b5a642]" : "text-white/60 hover:bg-white/5"}`}
        >
          <Calculator className="h-4 w-4" /> Calculators
        </button>
        <button 
          onClick={() => setActiveTab("lenders")} 
          className={`flex items-center gap-3 px-3 py-2 text-xs font-semibold rounded-lg transition-all ${activeTab === "lenders" ? "bg-[#b5a642]/10 text-[#b5a642]" : "text-white/60 hover:bg-white/5"}`}
        >
          <Globe className="h-4 w-4" /> Lender Sheets
        </button>

        <div className="text-[10px] text-white/20 uppercase tracking-[1.5px] font-bold px-3 py-1 mt-3">Team & Comms</div>
        <button 
          onClick={() => setActiveTab("calendar")} 
          className={`flex items-center gap-3 px-3 py-2 text-xs font-semibold rounded-lg transition-all ${activeTab === "calendar" ? "bg-[#b5a642]/10 text-[#b5a642]" : "text-white/60 hover:bg-white/5"}`}
        >
          <Calendar className="h-4 w-4" /> Calendar
        </button>
        <button 
          onClick={() => setActiveTab("tasks")} 
          className={`flex items-center gap-3 px-3 py-2 text-xs font-semibold rounded-lg transition-all relative ${activeTab === "tasks" ? "bg-[#b5a642]/10 text-[#b5a642]" : "text-white/60 hover:bg-white/5"}`}
        >
          <CheckSquare className="h-4 w-4" /> Daily Tasks
          {activeTasksCount > 0 && (
            <span className="absolute right-3 bg-red-500/20 text-red-300 text-[9px] font-bold px-2 py-0.5 rounded-full">{activeTasksCount}</span>
          )}
        </button>
        <button 
          onClick={() => setActiveTab("messages")} 
          className={`flex items-center gap-3 px-3 py-2 text-xs font-semibold rounded-lg transition-all ${activeTab === "messages" ? "bg-[#b5a642]/10 text-[#b5a642]" : "text-white/60 hover:bg-white/5"}`}
        >
          <MessageSquare className="h-4 w-4" /> Team Channels
        </button>
        <button 
          onClick={() => setActiveTab("emails")} 
          className={`flex items-center gap-3 px-3 py-2 text-xs font-semibold rounded-lg transition-all ${activeTab === "emails" ? "bg-[#b5a642]/10 text-[#b5a642]" : "text-white/60 hover:bg-white/5"}`}
        >
          <Mail className="h-4 w-4" /> Email
        </button>

        <div className="text-[10px] text-white/20 uppercase tracking-[1.5px] font-bold px-3 py-1 mt-3">Operations</div>
        <button 
          onClick={() => setActiveTab("retention")} 
          className={`flex items-center gap-3 px-3 py-2 text-xs font-semibold rounded-lg transition-all ${activeTab === "retention" ? "bg-[#b5a642]/10 text-[#b5a642]" : "text-white/60 hover:bg-white/5"}`}
        >
          <Heart className="h-4 w-4" /> CRM Retention
        </button>
        <button 
          onClick={() => setActiveTab("partners")} 
          className={`flex items-center gap-3 px-3 py-2 text-xs font-semibold rounded-lg transition-all ${activeTab === "partners" ? "bg-[#b5a642]/10 text-[#b5a642]" : "text-white/60 hover:bg-white/5"}`}
        >
          <svg className="h-4 w-4 stroke-current" viewBox="0 0 24 24" fill="none" strokeWidth="2"><circle cx="18" cy="18" r="3"/><circle cx="12" cy="7" r="4"/><path d="M12 12c-2.3 0-5.3 1.1-6.1 3.5"/></svg> Partner Network
        </button>
        <button 
          onClick={() => setActiveTab("reports")} 
          className={`flex items-center gap-3 px-3 py-2 text-xs font-semibold rounded-lg transition-all ${activeTab === "reports" ? "bg-[#b5a642]/10 text-[#b5a642]" : "text-white/60 hover:bg-white/5"}`}
        >
          <BarChart3 className="h-4 w-4" /> Reports
        </button>
        <button 
          onClick={() => setActiveTab("compliance")} 
          className={`flex items-center gap-3 px-3 py-2 text-xs font-semibold rounded-lg transition-all ${activeTab === "compliance" ? "bg-[#b5a642]/10 text-[#b5a642]" : "text-white/60 hover:bg-white/5"}`}
        >
          <ShieldCheck className="h-4 w-4" /> Compliance
        </button>
        <button 
          onClick={() => setActiveTab("file_readiness")} 
          className={`flex items-center gap-3 px-3 py-2 text-xs font-semibold rounded-lg transition-all ${activeTab === "file_readiness" ? "bg-[#b5a642]/10 text-[#b5a642]" : "text-white/60 hover:bg-white/5"}`}
        >
          <svg className="h-4 w-4 stroke-current" viewBox="0 0 24 24" fill="none" strokeWidth="2">
            <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/>
            <polyline points="14 2 14 8 20 8"/>
            <path d="m9 15 2 2 4-4"/>
          </svg> File Readiness
        </button>
        {(isOwner || currentUser.role === "Owner / Master Admin" || currentUser.role === "Super Admin" || currentUser.role === "IT / Developer") && (
          <button 
            onClick={() => setActiveTab("admin")} 
            className={`flex items-center gap-3 px-3 py-2 text-xs font-semibold rounded-lg transition-all ${activeTab === "admin" ? "bg-[#b5a642]/10 text-[#b5a642]" : "text-white/60 hover:bg-white/5"}`}
          >
            <ShieldAlert className="h-4 w-4 text-red-400" /> Admin Panel
          </button>
        )}
        <button 
          onClick={() => setActiveTab("settings")} 
          className={`flex items-center gap-3 px-3 py-2 text-xs font-semibold rounded-lg transition-all ${activeTab === "settings" ? "bg-[#b5a642]/10 text-[#b5a642]" : "text-white/60 hover:bg-white/5"}`}
        >
          <Settings className="h-4 w-4" /> Settings
        </button>
      </nav>
    </aside>
  );
};
