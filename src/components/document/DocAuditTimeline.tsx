import React, { useState, useMemo } from "react";
import { 
  History, Search, Filter, Calendar, FileText, Send, UploadCloud, Eye, Trash2, Tag, CheckSquare 
} from "lucide-react";
import { DocActivityLog } from "./types";

interface DocAuditTimelineProps {
  activities: DocActivityLog[];
}

export const DocAuditTimeline: React.FC<DocAuditTimelineProps> = ({ activities }) => {
  const [search, setSearch] = useState("");
  const [actionFilter, setActionFilter] = useState("all");

  const getActionIcon = (action: string) => {
    switch (action.toLowerCase()) {
      case "requested":
        return <Send className="h-3.5 w-3.5 text-[#6fa3b8]" />;
      case "uploaded":
        return <UploadCloud className="h-3.5 w-3.5 text-blue-400" />;
      case "reviewed":
        return <Eye className="h-3.5 w-3.5 text-orange-400" />;
      case "status_changed":
        return <Tag className="h-3.5 w-3.5 text-[#b5a642]" />;
      case "deleted":
        return <Trash2 className="h-3.5 w-3.5 text-red-400" />;
      default:
        return <CheckSquare className="h-3.5 w-3.5 text-green-400" />;
    }
  };

  const filteredLogs = useMemo(() => {
    return activities.filter(act => {
      const matchesSearch = 
        act.clientName.toLowerCase().includes(search.toLowerCase()) ||
        act.docName.toLowerCase().includes(search.toLowerCase()) ||
        act.details.toLowerCase().includes(search.toLowerCase()) ||
        act.user.toLowerCase().includes(search.toLowerCase());

      const matchesAction = actionFilter === "all" || act.action === actionFilter;

      return matchesSearch && matchesAction;
    });
  }, [activities, search, actionFilter]);

  return (
    <div className="flex flex-col h-full overflow-hidden">
      
      {/* Filters bar */}
      <div className="p-4 border-b border-white/5 bg-[#171720]/40 flex flex-col sm:flex-row gap-3">
        <div className="relative flex-grow">
          <input 
            type="text" 
            placeholder="Search audit trail logs..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full bg-[#111114] border border-white/5 text-[11px] rounded-lg pl-8 pr-3 py-1.5 text-white placeholder-white/20 focus:outline-none focus:border-[#b5a642]"
          />
          <Search className="absolute left-2.5 top-2.5 h-3.5 w-3.5 text-white/30" />
        </div>
        
        <select 
          value={actionFilter}
          onChange={(e) => setActionFilter(e.target.value)}
          className="bg-[#111114] border border-white/5 text-[10px] font-bold uppercase rounded-lg px-2.5 py-1.5 text-white/80 focus:outline-none"
        >
          <option value="all">All Operations</option>
          <option value="requested">Requests</option>
          <option value="uploaded">Uploads</option>
          <option value="reviewed">Audits/Reviews</option>
          <option value="status_changed">Status Toggles</option>
          <option value="deleted">Deletions</option>
        </select>
      </div>

      {/* Timeline entries scroll */}
      <div className="flex-grow overflow-y-auto p-5">
        {filteredLogs.length === 0 ? (
          <div className="h-60 flex flex-col items-center justify-center text-center p-6 border border-dashed border-white/5 rounded-xl">
            <History className="h-8 w-8 text-white/10 mb-2" />
            <span className="text-xs text-white/40 font-bold">No matching activity logs captured.</span>
          </div>
        ) : (
          <div className="relative border-l border-white/5 pl-4 ml-2.5 space-y-4 py-2">
            {filteredLogs.map(act => (
              <div key={act.id} className="relative group animate-fade-in">
                {/* Visual Bullet Icon */}
                <span className="absolute -left-6 top-1 w-4 h-4 bg-[#131317] border border-white/10 rounded-full flex items-center justify-center shadow group-hover:scale-110 transition-transform">
                  {getActionIcon(act.action)}
                </span>
                
                <div className="bg-[#16161c] border border-white/5 hover:border-white/10 rounded-xl p-3.5 space-y-2 transition-all shadow-sm">
                  <div className="flex justify-between items-start text-[10px] text-white/30">
                    <div>
                      <strong className="text-white/85">{act.user}</strong>
                      <span> triggered </span>
                      <span className="text-[#b5a642] uppercase font-bold text-[8.5px] border border-[#b5a642]/25 px-1.5 py-0.5 rounded-full ml-1">
                        {act.action}
                      </span>
                    </div>
                    <span className="font-mono text-[9px]">
                      {new Date(act.timestamp).toLocaleString("en-CA")}
                    </span>
                  </div>

                  <div className="text-[11px] text-[#eeeef2] font-semibold bg-[#111115] border border-white/5 p-2.5 rounded-lg font-mono">
                    {act.details}
                  </div>

                  <div className="text-[9px] text-white/40 flex items-center justify-between">
                    <span>Client Folder: <strong className="text-white/70">{act.clientName}</strong></span>
                    <span>Requirement: <strong className="text-white/70">{act.docName}</strong></span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

    </div>
  );
};
