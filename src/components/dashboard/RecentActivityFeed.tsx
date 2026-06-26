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

  // Assign appropriate icon to activity type based on text matching
  const getActivityIcon = (action: string) => {
    const act = action.toLowerCase();
    if (act.includes("email") || act.includes("mail") || act.includes("outreach")) {
      return { icon: Mail, bg: "bg-blue-500/10 text-blue-400 border-blue-500/10" };
    }
    if (act.includes("onboard") || act.includes("client") || act.includes("add") || act.includes("intake")) {
      return { icon: UserPlus, bg: "bg-[#b5a642]/10 text-[#b5a642] border-[#b5a642]/10" };
    }
    if (act.includes("status") || act.includes("stage") || act.includes("complete") || act.includes("approve") || act.includes("fund")) {
      return { icon: CheckCircle, bg: "bg-green-500/10 text-green-400 border-green-500/10" };
    }
    if (act.includes("update") || act.includes("edit") || act.includes("change")) {
      return { icon: RefreshCw, bg: "bg-purple-500/10 text-purple-400 border-purple-500/10" };
    }
    if (act.includes("document") || act.includes("doc") || act.includes("checklist")) {
      return { icon: FileText, bg: "bg-orange-500/10 text-orange-400 border-orange-500/10" };
    }
    if (act.includes("setting") || act.includes("config") || act.includes("lock") || act.includes("security")) {
      return { icon: Settings, bg: "bg-slate-500/10 text-slate-400 border-slate-500/10" };
    }
    return { icon: Shield, bg: "bg-gray-500/10 text-gray-400 border-white/5" };
  };

  return (
    <div className="bg-[#141418] border border-white/5 rounded-xl shadow-md p-5 flex flex-col gap-4" id="recent-activity-feed">
      <div className="flex items-center justify-between border-b border-white/5 pb-3">
        <div className="flex items-center gap-2">
          <div className="p-1.5 bg-purple-500/10 rounded-lg text-purple-400">
            <ListFilter className="w-4 h-4" />
          </div>
          <div>
            <h3 className="text-sm font-semibold text-[#eeeef2]">System Activity Audit Feed</h3>
            <p className="text-[10px] text-[#8e95a3] mt-0.5">
              Live chronological trail of actions and records updated in this session
            </p>
          </div>
        </div>
        {isManager && (
          <button
            onClick={() => setActiveTab("admin")}
            className="text-[10px] text-[#b5a642] font-semibold hover:underline"
          >
            Detailed Audit Log &rarr;
          </button>
        )}
      </div>

      <div className="overflow-y-auto max-h-[300px] flex flex-col gap-3 pr-1 bg-gradient-to-b from-transparent to-[#101014]/10 rounded-lg">
        {auditLogs.length > 0 ? (
          auditLogs.map((log, idx) => {
            const { icon: Icon, bg } = getActivityIcon(log.action || "");
            return (
              <div 
                key={idx} 
                className="flex items-start gap-3 p-2.5 rounded-lg border border-white/[0.02] bg-[#1b1b20]/25 hover:bg-[#1b1b20]/45 hover:border-white/5 transition-all"
              >
                <div className={`p-1.5 rounded-md border shrink-0 mt-0.5 ${bg}`}>
                  <Icon className="w-3.5 h-3.5" />
                </div>
                
                <div className="flex-1 min-w-0">
                  <div className="text-xs text-[#eeeef2] leading-relaxed">
                    <span className="font-bold text-[#b5a642] mr-1">{log.user || "System"}</span>
                    <span className="text-white/85">{log.action || ""}</span>
                    {log.target && (
                      <span className="font-semibold text-blue-400 ml-1 bg-blue-500/[0.04] px-1.5 py-0.5 rounded border border-blue-500/[0.08]">
                        {log.target}
                      </span>
                    )}
                  </div>
                  <div className="text-[9px] text-white/30 font-mono mt-1.5 flex items-center gap-1.5">
                    <span>{timeAgo(log.time)}</span>
                    <span>•</span>
                    <span className="uppercase tracking-wider text-[8px] opacity-75">Verified Action</span>
                  </div>
                </div>
              </div>
            );
          })
        ) : (
          <div className="text-center py-12 text-xs text-[#8e95a3]">
            No recent activity recorded in this session.
          </div>
        )}
      </div>
    </div>
  );
};
