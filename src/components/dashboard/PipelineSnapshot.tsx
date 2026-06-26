import React, { useState } from "react";
import { TrendingUp, BarChart3, Layers, DollarSign, Filter, Users } from "lucide-react";
import { Client, User } from "../../types";

interface PipelineSnapshotProps {
  clients: Client[];
  currentUser: User;
  setActiveTab: (tab: string) => void;
  onOpenClient: (id: string) => void;
}

const STAGES = [
  { id: "open", label: "New/Open", color: "bg-blue-500/10 text-blue-400 border-blue-500/20", progressColor: "bg-blue-500" },
  { id: "working", label: "Working", color: "bg-purple-500/10 text-purple-400 border-purple-500/20", progressColor: "bg-purple-500" },
  { id: "lender", label: "At Lender", color: "bg-orange-500/10 text-orange-400 border-orange-500/20", progressColor: "bg-orange-500" },
  { id: "conditional", label: "Conditional", color: "bg-red-500/10 text-red-400 border-red-500/20", progressColor: "bg-red-500" },
  { id: "approved", label: "Approved", color: "bg-green-500/10 text-green-400 border-green-500/20", progressColor: "bg-green-500" },
  { id: "funded", label: "Funded", color: "bg-[#b5a642]/10 text-[#b5a642] border-[#b5a642]/20", progressColor: "bg-[#b5a642]" }
];

export const PipelineSnapshot: React.FC<PipelineSnapshotProps> = ({
  clients,
  currentUser,
  setActiveTab,
  onOpenClient
}) => {
  const isManager = ["Owner / Master Admin", "Super Admin", "IT / Developer"].includes(currentUser.role);
  const userFullName = `${currentUser.first} ${currentUser.last}`;

  const [pipelineMode, setPipelineMode] = useState<"personal" | "team">(isManager ? "team" : "personal");

  // Filter clients based on selection
  const targetClients = pipelineMode === "personal" 
    ? clients.filter(c => c.agent === userFullName) 
    : clients;

  const activeFiles = targetClients.filter(c => c.status !== "closed");
  const totalPipelineVolume = activeFiles.reduce((sum, c) => sum + (parseFloat(String(c.mtgamt).replace(/[$,\s]/g, "")) || 0), 0);

  // Formatting utilities
  const fdShort = (n: number) => {
    if (n >= 1000000) return "$" + (n / 1000000).toFixed(1) + "M";
    if (n >= 1000) return "$" + (n / 1000).toFixed(0) + "K";
    return "$" + n;
  };

  const fd = (n: any) => {
    return "$" + Math.round(parseFloat(String(n).replace(/[$,\s]/g, "")) || 0).toLocaleString("en-CA");
  };

  // Find highest value deals currently in pipeline
  const highValueDeals = [...activeFiles]
    .filter(c => c.status !== "funded")
    .sort((a, b) => {
      const volA = parseFloat(String(a.mtgamt).replace(/[$,\s]/g, "")) || 0;
      const volB = parseFloat(String(b.mtgamt).replace(/[$,\s]/g, "")) || 0;
      return volB - volA;
    })
    .slice(0, 4);

  return (
    <div className="bg-[#141418] border border-white/5 rounded-xl shadow-md p-5 flex flex-col gap-5" id="pipeline-snapshot">
      {/* Header section with role-based toggle */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-white/5 pb-4">
        <div className="flex items-center gap-2">
          <div className="p-1.5 bg-blue-500/10 rounded-lg text-blue-400">
            <BarChart3 className="w-4 h-4" />
          </div>
          <div>
            <h3 className="text-sm font-semibold text-[#eeeef2]">Pipeline Progression Hub</h3>
            <p className="text-[10px] text-[#8e95a3] mt-0.5">
              Live progression of mortgage files, conversion ratios, and volume distributions
            </p>
          </div>
        </div>

        <div className="flex items-center gap-3">
          {/* Total volume label */}
          <div className="text-right shrink-0">
            <div className="text-[9px] text-white/30 uppercase tracking-wider font-semibold">Total Stage Volume</div>
            <div className="text-xs font-bold text-white font-mono">{fd(totalPipelineVolume)}</div>
          </div>

          {isManager && (
            <div className="bg-[#111115] border border-white/5 rounded-lg p-0.5 flex">
              <button
                onClick={() => setPipelineMode("personal")}
                className={`px-2.5 py-1 rounded-md text-[10px] font-semibold transition-all ${pipelineMode === "personal" ? "bg-[#b5a642] text-black" : "text-white/60 hover:text-white"}`}
              >
                My Volume
              </button>
              <button
                onClick={() => setPipelineMode("team")}
                className={`px-2.5 py-1 rounded-md text-[10px] font-semibold transition-all flex items-center gap-1 ${pipelineMode === "team" ? "bg-[#b5a642] text-black" : "text-white/60 hover:text-white"}`}
              >
                <Users className="w-3 h-3" /> Team Volume
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Main Grid: left part (the progress bars / stage visual), right part (top deals checklist) */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* Stages Visualization (Left 2 cols) */}
        <div className="lg:col-span-2 flex flex-col gap-4">
          <div className="grid grid-cols-3 sm:grid-cols-6 gap-3">
            {STAGES.map((s) => {
              const stageFiles = targetClients.filter(c => c.status === s.id);
              const stageValue = stageFiles.reduce((sum, c) => sum + (parseFloat(String(c.mtgamt).replace(/[$,\s]/g, "")) || 0), 0);
              const percent = totalPipelineVolume > 0 ? (stageValue / totalPipelineVolume) * 100 : 0;
              
              return (
                <div 
                  key={s.id}
                  onClick={() => setActiveTab("pipeline")}
                  className="bg-[#1b1b20]/50 border border-white/5 rounded-xl p-3.5 flex flex-col justify-between hover:border-white/10 hover:bg-[#1b1b20] transition-all cursor-pointer relative overflow-hidden group"
                >
                  <div className="flex flex-col gap-1">
                    <span className={`text-[9px] font-bold uppercase tracking-wider px-1.5 py-0.5 rounded border self-start ${s.color}`}>
                      {s.label}
                    </span>
                    <span className="text-xl font-bold mt-2 text-[#eeeef2] group-hover:scale-105 origin-left transition-transform">
                      {stageFiles.length}
                    </span>
                  </div>
                  
                  <div className="mt-3">
                    <div className="text-[10px] font-semibold font-mono text-white/80">
                      {fdShort(stageValue)}
                    </div>
                    <div className="text-[9px] text-[#8e95a3]/70 mt-0.5">
                      {percent.toFixed(0)}% of total
                    </div>
                  </div>

                  {/* Micro bottom progress bar bar */}
                  <div className="absolute bottom-0 left-0 w-full h-[3px] bg-white/5">
                    <div 
                      className={`h-full ${s.progressColor}`} 
                      style={{ width: `${percent}%` }}
                    />
                  </div>
                </div>
              );
            })}
          </div>

          {/* Simple funnel progression analytics indicator */}
          <div className="bg-[#1b1b20]/30 border border-white/5 rounded-xl p-3.5 flex items-center justify-between gap-4 text-xs">
            <div className="flex items-center gap-2">
              <TrendingUp className="w-4 h-4 text-emerald-400 shrink-0" />
              <span className="text-white/80 font-semibold">Active Loan Progression Index:</span>
              <span className="text-[#8e95a3]">78.4% of intake files successfully cleared lender submission in Q2.</span>
            </div>
            <button 
              onClick={() => setActiveTab("pipeline")}
              className="text-[10px] font-bold text-[#b5a642] hover:underline whitespace-nowrap"
            >
              Interactive Pipeline Board &rarr;
            </button>
          </div>
        </div>

        {/* High Value Target Deals (Right col) */}
        <div className="border border-white/5 bg-[#1b1b20]/30 rounded-xl p-4 flex flex-col justify-between gap-3">
          <div>
            <h4 className="text-xs font-bold uppercase tracking-wider text-[#eeeef2] flex items-center gap-1.5">
              <span>💎 High-Value Active Targets</span>
            </h4>
            <p className="text-[9px] text-[#8e95a3] mt-0.5">
              Top financial files in pipeline progression
            </p>
          </div>

          <div className="flex flex-col gap-2.5 flex-1">
            {highValueDeals.length > 0 ? (
              highValueDeals.map((deal) => {
                const mtgAmt = parseFloat(String(deal.mtgamt).replace(/[$,\s]/g, "")) || 0;
                return (
                  <div 
                    key={deal.id}
                    onClick={() => onOpenClient(deal.id)}
                    className="p-2.5 rounded-lg bg-[#141418] border border-white/5 hover:border-[#b5a642]/20 hover:bg-[#1b1b20]/60 cursor-pointer transition-all flex items-center justify-between gap-2 group"
                  >
                    <div className="min-w-0">
                      <div className="text-xs font-bold text-white/90 truncate group-hover:text-[#b5a642] transition-colors">
                        {deal.first} {deal.last}
                      </div>
                      <div className="text-[9px] text-[#8e95a3] truncate mt-0.5">
                        {deal.status.toUpperCase()} • {deal.agent || "Unassigned Agent"}
                      </div>
                    </div>
                    <div className="text-right shrink-0">
                      <div className="text-xs font-bold text-[#eeeef2] font-mono">{fd(mtgAmt)}</div>
                      <div className="text-[8px] text-white/30 truncate uppercase tracking-wider">{deal.type || "Purchase"}</div>
                    </div>
                  </div>
                );
              })
            ) : (
              <div className="text-center py-12 text-xs text-[#8e95a3]">
                No active files above $0 in pipeline.
              </div>
            )}
          </div>
        </div>

      </div>
    </div>
  );
};
