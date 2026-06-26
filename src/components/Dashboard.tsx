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
      
      {/* Dynamic Header Section */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-white/5 pb-4 bg-gradient-to-r from-[#141418] to-transparent p-4 rounded-xl">
        <div>
          <div className="flex items-center gap-2">
            <h2 className="text-2xl font-bold tracking-tight text-[#eeeef2]">{getGreeting()}</h2>
            <span className="text-[10px] font-bold bg-[#b5a642]/10 text-[#b5a642] px-2.5 py-0.5 rounded-full border border-[#b5a642]/15 flex items-center gap-1">
              <span className="w-1.5 h-1.5 rounded-full bg-green-500 animate-ping" />
              {currentUser.role} Session Active
            </span>
          </div>
          <p className="text-xs text-[#8e95a3] mt-1 flex items-center gap-1.5">
            <Calendar className="w-3.5 h-3.5" />
            <span>{getFormattedDate()}</span>
            <span>•</span>
            <span className="font-mono text-[#b5a642]">{liveTime} EST</span>
          </p>
        </div>

        {/* Calendar outreach reminder / stats indicator */}
        <div className="flex items-center gap-3">
          <div className="text-right">
            <span className="text-[9px] text-[#8e95a3] uppercase tracking-wider font-semibold">Total Portfolios Managed</span>
            <div className="text-sm font-bold text-[#eeeef2] font-mono">{clients.length} Active Records</div>
          </div>
          <button 
            onClick={onAddEvent}
            className="flex items-center gap-1.5 px-3.5 py-2 text-xs font-bold rounded-lg bg-[#b5a642]/10 border border-[#b5a642]/30 hover:bg-[#b5a642]/20 text-[#b5a642] transition-all"
          >
            <Clock className="w-3.5 h-3.5" /> Log Outreach Event
          </button>
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
