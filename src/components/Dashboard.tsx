import React, { useState, useEffect } from "react";
import { Sparkles, Calendar, User, Clock, ShieldAlert } from "lucide-react";
import { Client, Task, Event, User as UserType } from "../types";

// Import modular sub-components
import { KPICards } from "./dashboard/KPICards";
import { QuickActions } from "./dashboard/QuickActions";
import { DailyActionQueue } from "./dashboard/DailyActionQueue";
import { PipelineSnapshot } from "./dashboard/PipelineSnapshot";
import { IntakeOverview } from "./dashboard/IntakeOverview";
import { MissingDocuments } from "./dashboard/MissingDocuments";
import { UpcomingDeadlines } from "./dashboard/UpcomingDeadlines";
import { RecentActivityFeed } from "./dashboard/RecentActivityFeed";
import { MortgageUpdates } from "./dashboard/MortgageUpdates";

interface DashboardProps {
  clients: Client[];
  tasks: Task[];
  events: Event[];
  auditLogs: any[];
  currentUser: UserType;
  docVault?: Record<string, any>;
  onOpenClient: (id: string) => void;
  onAddClient: () => void;
  onOpenNewClientIntake?: () => void;
  onOpenAIIntake?: () => void;
  onAddTask?: () => void;
  onAddPartner?: () => void;
  onAddEvent: () => void;
  setActiveTab: (tab: string) => void;
  onCompleteTask?: (taskId: string) => void;
}

export const Dashboard: React.FC<DashboardProps> = ({
  clients,
  tasks,
  events,
  auditLogs,
  currentUser,
  docVault = {},
  onOpenClient,
  onAddClient,
  onOpenNewClientIntake = () => {},
  onOpenAIIntake = () => {},
  onAddTask = () => {},
  onAddPartner = () => {},
  onAddEvent,
  setActiveTab,
  onCompleteTask
}) => {
  const [liveTime, setLiveTime] = useState<string>("");

  useEffect(() => {
    const updateTime = () => {
      const now = new Date();
      setLiveTime(now.toLocaleTimeString("en-US", { hour: "2-digit", minute: "2-digit", second: "2-digit" }));
    };
    updateTime();
    const interval = setInterval(updateTime, 1000);
    return () => clearInterval(interval);
  }, []);

  const getGreeting = () => {
    const hrs = new Date().getHours();
    if (hrs < 12) return `Good morning, ${currentUser.first}! 👋`;
    if (hrs < 17) return `Good afternoon, ${currentUser.first}!`;
    return `Good evening, ${currentUser.first}! 🌙`;
  };

  const getFormattedDate = () => {
    return new Date().toLocaleDateString("en-US", { 
      weekday: "long", 
      year: "numeric", 
      month: "long", 
      day: "numeric" 
    });
  };

  return (
    <div className="flex flex-col gap-6 h-full overflow-y-auto pr-2 pb-6 text-sans" id="gbk-crm-dashboard">
      
      {/* Dynamic Executive Console Header Section */}
      <div className="relative overflow-visible rounded-2xl border border-[var(--color-border)] bg-gradient-to-r from-[var(--color-surface-2)]/85 via-[var(--color-surface)]/70 to-[var(--color-surface-2)]/40 p-6 shadow-xl backdrop-blur-md">
        {/* Subtle upper light reflection bar */}
        <div className="absolute top-0 left-0 right-0 h-[1.5px] bg-gradient-to-r from-white/15 via-white/5 to-transparent" />
        
        <div className="relative flex flex-col md:flex-row md:items-center justify-between gap-5">
          <div className="space-y-1.5">
            <div className="flex flex-wrap items-center gap-3">
              <h2 className="text-2xl font-black tracking-tight text-[var(--color-text)] font-sans">{getGreeting()}</h2>
            </div>
            <p className="text-xs text-[var(--color-text-muted)] font-medium flex flex-wrap items-center gap-2">
              <Calendar className="w-3.5 h-3.5 text-[var(--color-primary)] shrink-0" />
              <span>{getFormattedDate()}</span>
              <span className="text-[var(--color-border)]">•</span>
              <span className="font-mono text-[var(--color-accent)] font-bold tracking-wide bg-[var(--color-surface-3)]/40 px-2 py-0.5 rounded border border-[var(--color-border)]/50">{liveTime} EST</span>
            </p>
          </div>

          {/* Portfolio Metrics & Control Panel */}
          <div className="flex items-center gap-4">
            <div className="px-4 py-2 bg-[var(--color-surface-3)]/30 border border-[var(--color-border)]/70 rounded-xl text-right shrink-0 shadow-sm backdrop-blur-sm">
              <span className="text-[8px] text-[var(--color-text-muted)] uppercase tracking-widest font-black block">Total Asset Portfolio</span>
              <div className="text-sm font-black text-[var(--color-text)] font-mono mt-0.5">{clients.length} Active Accounts</div>
            </div>
          </div>
        </div>
      </div>

      {/* Row 1: KPI Stats Summary Deck */}
      <KPICards 
        clients={clients}
        tasks={tasks}
        docVault={docVault}
        currentUser={currentUser}
        setActiveTab={setActiveTab}
      />

      {/* Row 2: Quick Command shortcut deck */}
      <QuickActions 
        onAddClient={onAddClient}
        onOpenNewClientIntake={onOpenNewClientIntake}
        onOpenAIIntake={onOpenAIIntake}
        onAddTask={onAddTask}
        onAddPartner={onAddPartner}
        setActiveTab={setActiveTab}
      />

      {/* Row 3 (Split): Left part (My Daily Action Queue), Right part (Session Activity Logs) */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2">
          <DailyActionQueue 
            clients={clients}
            tasks={tasks}
            currentUser={currentUser}
            onOpenClient={onOpenClient}
            setActiveTab={setActiveTab}
            onCompleteTask={onCompleteTask}
          />
        </div>
        <div className="lg:col-span-1">
          <RecentActivityFeed 
            auditLogs={auditLogs}
            setActiveTab={setActiveTab}
            currentUser={currentUser}
          />
        </div>
      </div>

      {/* Row 4: Pipeline board Snapshot overview with distributions */}
      <PipelineSnapshot 
        clients={clients}
        currentUser={currentUser}
        setActiveTab={setActiveTab}
        onOpenClient={onOpenClient}
      />

      {/* Row 5: 3-column Operational Grid (Intake Review, Missing Documents, Upcoming dates/Deadlines) */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <IntakeOverview 
          clients={clients}
          currentUser={currentUser}
          onOpenClient={onOpenClient}
          setActiveTab={setActiveTab}
          onOpenAIIntake={onOpenAIIntake}
        />
        
        <MissingDocuments 
          clients={clients}
          docVault={docVault}
          currentUser={currentUser}
          onOpenClient={onOpenClient}
          setActiveTab={setActiveTab}
        />

        <UpcomingDeadlines 
          clients={clients}
          currentUser={currentUser}
          onOpenClient={onOpenClient}
          setActiveTab={setActiveTab}
        />
      </div>

      {/* Row 6: AI-powered Mortgage & Industry intel Crawler Updates */}
      <MortgageUpdates />

    </div>
  );
};
