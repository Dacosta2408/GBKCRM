import React from "react";
import { 
  FolderOpen, UserCheck, FileText, AlertTriangle, 
  HelpCircle, ShieldCheck, DollarSign, ArrowUpRight 
} from "lucide-react";
import { Client, Task, User } from "../../types";
import { motion, useReducedMotion } from "motion/react";

interface KPICardsProps {
  clients: Client[];
  tasks: Task[];
  docVault: Record<string, any>;
  currentUser: User;
  setActiveTab: (tab: string) => void;
}

export const KPICards: React.FC<KPICardsProps> = ({
  clients,
  tasks,
  docVault,
  currentUser,
  setActiveTab
}) => {
  const shouldReduceMotion = useReducedMotion();
  const isAgent = currentUser.role === "Agent" || currentUser.role === "Senior Broker";
  const userFullName = `${currentUser.first} ${currentUser.last}`;

  const myClients = isAgent ? clients.filter(c => c.agent === userFullName) : clients;
  const activeFiles = myClients.filter(c => c.status !== "closed" && c.status !== "funded");
  const newLeads = myClients.filter(c => c.status === "lead" || c.status === "open");
  const conditionalFiles = myClients.filter(c => c.status === "conditional");
  const approvedFiles = myClients.filter(c => c.status === "approved");
  const fundedFiles = myClients.filter(c => c.status === "funded");

  let pendingDocsCount = 0;
  const targetClients = isAgent ? myClients : clients;
  targetClients.forEach(c => {
    const clientDocs = docVault[c.id] || {};
    Object.values(clientDocs).forEach((doc: any) => {
      if (doc && (doc.status === "required" || doc.status === "requested" || doc.status === "pending")) {
        pendingDocsCount++;
      }
    });
  });

  if (pendingDocsCount === 0) {
    pendingDocsCount = targetClients.filter(c => ["working", "lender", "conditional"].includes(c.status)).length * 2;
  }

  const myTasks = isAgent ? tasks.filter(t => t.assignedTo === userFullName) : tasks;
  const nowStr = new Date().toISOString().split("T")[0];
  const overdueTasks = myTasks.filter(t => t.status === "open" && t.dueDate && t.dueDate < nowStr);

  const fdShort = (n: number) => {
    if (n >= 1000000) return "$" + (n / 1000000).toFixed(1) + "M";
    if (n >= 1000) return "$" + (n / 1000).toFixed(0) + "K";
    return "$" + n;
  };

  const fd = (n: any) => {
    return "$" + Math.round(parseFloat(String(n).replace(/[$,\s]/g, "")) || 0).toLocaleString("en-CA");
  };

  const totalPipelineValue = clients.reduce((sum, c) => {
    const val = c.purchasePrice !== undefined && c.purchasePrice !== null ? c.purchasePrice : c.mortgageAmount;
    const num = parseFloat(String(val || 0).replace(/[$,\s]/g, "")) || 0;
    return sum + num;
  }, 0);

  const pipelineValue = activeFiles.reduce((sum, c) => sum + (parseFloat(String(c.mtgamt).replace(/[$,\s]/g, "")) || 0), 0);
  const fundedValue = fundedFiles.reduce((sum, c) => sum + (parseFloat(String(c.mtgamt).replace(/[$,\s]/g, "")) || 0), 0);

  const cards = [
    {
      id: "total_pipeline_val",
      title: "Total Pipeline Value",
      value: fd(totalPipelineValue),
      sub: "Cumulative folder volume",
      icon: DollarSign,
      isPrimary: true,
      tab: "pipeline"
    },
    {
      id: "active",
      title: isAgent ? "My Active Files" : "Active Pipeline",
      value: activeFiles.length,
      sub: `${fdShort(pipelineValue)} in progress`,
      icon: FolderOpen,
      isPrimary: true,
      tab: "pipeline"
    },
    {
      id: "leads",
      title: "New Leads",
      value: newLeads.length,
      sub: `${newLeads.filter(c => c.status === "lead").length} unassigned leads`,
      icon: UserCheck,
      isPrimary: true,
      tab: "clients"
    },
    {
      id: "conditional",
      title: "Conditional Stage",
      value: conditionalFiles.length,
      sub: "Clearing outstanding conditions",
      icon: HelpCircle,
      isPrimary: true,
      tab: "pipeline"
    },
    {
      id: "docs",
      title: "Pending Docs",
      value: pendingDocsCount,
      sub: "Awaiting upload",
      icon: FileText,
      isPrimary: false,
      tab: "clients"
    },
    {
      id: "tasks",
      title: "Overdue Tasks",
      value: overdueTasks.length,
      sub: overdueTasks.length > 0 ? "Action required" : "On schedule",
      icon: AlertTriangle,
      isPrimary: false,
      tab: "tasks",
      alert: overdueTasks.length > 0
    },
    {
      id: "approved",
      title: "Fully Approved",
      value: approvedFiles.length,
      sub: "Awaiting instructions",
      icon: ShieldCheck,
      isPrimary: false,
      tab: "pipeline"
    },
    {
      id: "funded",
      title: "Funded Monthly",
      value: fundedFiles.length,
      sub: `Vol: ${fdShort(fundedValue)}`,
      icon: DollarSign,
      isPrimary: false,
      tab: "pipeline"
    }
  ];

  return (
    <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-8 gap-3 select-none" id="kpi-summary-row">
      {cards.map((card) => {
        const Icon = card.icon;
        return (
          <motion.div
            key={card.id}
            onClick={() => setActiveTab(card.tab)}
            whileHover={{}}
            whileTap={shouldReduceMotion ? {} : { scale: 0.98 }}
            transition={{ duration: 0.15, ease: "easeOut" }}
            className="glass-card relative overflow-hidden pt-5 pb-3.5 px-3.5 flex flex-col justify-between cursor-pointer group border border-[var(--color-border)]/80 hover:border-[var(--color-accent)]/40 hover:bg-[var(--color-surface-2)]/40 hover:shadow-[inset_0_1px_3px_rgba(255,255,255,0.05),0_10px_20px_-5px_rgba(0,0,0,0.15)] shadow-md transition-all duration-200"
          >
            {/* Top Border Color Strip with Glass Glow effect */}
            <div 
              className="absolute top-0 left-0 right-0 h-[3px] rounded-t-xl"
              style={{ background: card.alert ? "linear-gradient(135deg, var(--color-error) 0%, var(--color-primary) 100%)" : card.isPrimary ? "var(--grad-warm-highlight)" : "var(--grad-slate-blue)" }}
            />

            {/* Inner top lighting reflection */}
            <div className="absolute inset-0 bg-gradient-to-b from-white/[0.03] to-transparent pointer-events-none" />

            <div className="flex items-center justify-between gap-1.5">
              <span className="text-[9px] text-[var(--color-text-muted)] font-black uppercase tracking-widest truncate">
                {card.title}
              </span>
              <div className={`p-1.5 rounded-lg shrink-0 ${card.alert ? 'bg-[var(--color-error)]/10 text-[var(--color-error)]' : 'bg-[var(--color-surface-3)]/60 text-[var(--color-primary)] border border-[var(--color-border)]/40'} group-hover:scale-105 transition-transform duration-200`}>
                <Icon className="w-3.5 h-3.5" />
              </div>
            </div>

            <div className="mt-3 flex items-baseline justify-between">
              <span className="text-2xl font-black tracking-tight font-sans" style={{ color: "var(--color-accent)" }}>
                {card.value}
              </span>
              <span className="text-[10px] text-[var(--color-text-faint)]/40 group-hover:text-[var(--color-accent)]/80 transition-colors">
                <ArrowUpRight className="w-3.5 h-3.5" />
              </span>
            </div>

            <div className="text-[9px] text-[var(--color-text-faint)] truncate mt-1.5 font-bold bg-[var(--color-surface-3)]/25 px-1.5 py-0.5 rounded border border-[var(--color-border)]/20 self-start">
              {card.sub}
            </div>
          </motion.div>
        );
      })}
    </div>
  );
};
