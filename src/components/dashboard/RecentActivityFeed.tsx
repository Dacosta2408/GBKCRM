import React from "react";
import { ListFilter, Shield, Mail, UserPlus, CheckCircle, RefreshCw, FileText, Settings } from "lucide-react";

interface RecentActivityFeedProps {
  auditLogs: any[];
  setActiveTab: (tab: string) => void;
  currentUser: any;
}

export const RecentActivityFeed: React.FC<RecentActivityFeedProps> = ({
  auditLogs,
  setActiveTab,
  currentUser
}) => {
  const isManager = ["Owner / Master Admin", "Super Admin", "IT / Developer"].includes(currentUser.role);

  const timeAgo = (isoStr: string) => {
    if (!isoStr) return "Some time ago";
    const seconds = Math.floor((Date.now() - new Date(isoStr).getTime()) / 1000);
    if (seconds < 60) return "Just now";
    const mins = Math.floor(seconds / 60);
    if (mins < 60) return mins + "m ago";
    const hrs = Math.floor(mins / 60);
    if (hrs < 24) return hrs + "h ago";
    return new Date(isoStr).toLocaleDateString("en-CA");
  };

  // Get color and left border based on action type
  const getActivityStyles = (action: string) => {
    const act = action.toLowerCase();
    
    // 1. Accent for new clients
    if (act.includes("onboard") || act.includes("client") || act.includes("add") || act.includes("intake")) {
      return {
        icon: UserPlus,
        borderColor: "#F9B17A", // --color-accent
        iconColor: "text-[#F9B17A]",
        bg: "rgba(249, 177, 122, 0.08)"
      };
    }

    // 2. Soft coral for alerts / configs
    if (act.includes("setting") || act.includes("config") || act.includes("lock") || act.includes("security") || act.includes("warning") || act.includes("overdue") || act.includes("alert")) {
      return {
        icon: Settings,
        borderColor: "#7A5063", // --grad-warm color / soft coral
        iconColor: "text-[#F4A384]",
        bg: "rgba(122, 80, 99, 0.08)"
      };
    }

    // 3. Muted blue/slate for updates
    return {
      icon: act.includes("email") || act.includes("mail") ? Mail : act.includes("doc") ? FileText : RefreshCw,
      borderColor: "#676F9D", // --color-muted
      iconColor: "text-[#9a9db8]",
      bg: "rgba(103, 111, 157, 0.08)"
    };
  };

  return (
    <div className="glass-card shadow-md p-5 flex flex-col gap-4" id="recent-activity-feed">
      <div className="flex items-center justify-between border-b border-white/5 pb-3">
        <div className="flex items-center gap-2.5">
          <div className="p-2 bg-[#676F9D]/10 rounded-lg text-[#9a9db8]">
            <ListFilter className="w-4 h-4" />
          </div>
          <div>
            <h3 className="text-xs font-black uppercase text-white tracking-wider">Activity Feed</h3>
            <p className="text-[10px] text-[var(--color-text-faint)] mt-0.5 font-bold leading-none">
              Chronological log of verified workstation actions
            </p>
          </div>
        </div>
        {isManager && (
          <button
            onClick={() => setActiveTab("admin")}
            className="text-[10px] text-[#F9B17A] font-bold hover:underline tracking-tight uppercase"
          >
            Manage Audit &rarr;
          </button>
        )}
      </div>

      <div className="overflow-y-auto max-h-[300px] flex flex-col gap-2.5 pr-1">
        {auditLogs.length > 0 ? (
          auditLogs.map((log, idx) => {
            const styles = getActivityStyles(log.action || "");
            const Icon = styles.icon;
            return (
              <div 
                key={idx} 
                className="flex items-start gap-3 p-3 rounded-xl transition-all duration-200"
                style={{
                  background: "var(--glass-bg)",
                  border: "1px solid var(--glass-border)",
                  borderLeft: `3px solid ${styles.borderColor}`
                }}
              >
                <div className={`p-1.5 rounded-lg shrink-0 mt-0.5 ${styles.iconColor}`} style={{ background: styles.bg }}>
                  <Icon className="w-3.5 h-3.5" />
                </div>
                
                <div className="flex-1 min-w-0">
                  <div className="text-xs text-[var(--color-text)] leading-relaxed">
                    <span className="font-extrabold text-[#F9B17A] mr-1">{log.user || "System"}</span>
                    <span className="text-white/80 font-medium">{log.action || ""}</span>
                    {log.target && (
                      <span className="font-bold text-blue-300 ml-1.5 bg-[#486D83]/20 px-1.5 py-0.5 rounded border border-[#486D83]/30 text-[10px]">
                        {log.target}
                      </span>
                    )}
                  </div>
                  <div className="text-[9px] text-[var(--color-text-faint)] font-mono font-bold mt-1.5 flex items-center gap-1.5">
                    <span>{timeAgo(log.time)}</span>
                    <span>•</span>
                    <span className="uppercase tracking-wider text-[8px] opacity-75">Verified</span>
                  </div>
                </div>
              </div>
            );
          })
        ) : (
          <div className="text-center py-12 text-xs text-[var(--color-text-faint)] italic font-bold">
            No recent activity recorded in this session.
          </div>
        )}
      </div>
    </div>
  );
};
