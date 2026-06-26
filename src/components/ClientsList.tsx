import React, { useState } from "react";
import { 
  Plus, Search, ArrowRight, UserCheck, Calendar, Filter, 
  MapPin, Landmark, BadgePercent, ShieldAlert, BadgeInfo 
} from "lucide-react";
import { Client, Lender } from "../types";

interface ClientsListProps {
  clients: Client[];
  lenders: Lender[];
  onOpenClient: (id: string) => void;
  onAddClient: () => void;
  onOpenAIIntake: () => void;
  onOpenNewClientIntake: () => void;
  viewMode: 'database' | 'pipeline';
  setViewMode: (mode: 'database' | 'pipeline') => void;
  agentNames: string[];
}

export const ClientsList: React.FC<ClientsListProps> = ({
  clients,
  lenders,
  onOpenClient,
  onAddClient,
  onOpenAIIntake,
  onOpenNewClientIntake,
  viewMode,
  setViewMode,
  agentNames
}) => {
  const [dbFilter, setDbFilter] = useState<string>("all");
  const [agentFilter, setAgentFilter] = useState<string>("");
  const [searchQuery, setSearchQuery] = useState<string>("");

  const pn = (s: any) => {
    if (!s) return 0;
    return parseFloat(String(s).replace(/[$,\s]/g, "")) || 0;
  };

  const fd = (n: number) => {
    return "$" + Math.round(n).toLocaleString("en-CA");
  };

  const fdShort = (val: number) => {
    if (val >= 1000000) return "$" + (val / 1000000).toFixed(1) + "M";
    if (val >= 1000) return "$" + Math.round(val / 1000) + "k";
    return "$" + Math.round(val);
  };

  // Stress tests GDS/TDS estimates helper
  const calculateRatios = (c: Client) => {
    const inc = pn(c.income) + pn(c.coIncome);
    const mtg = pn(c.mtgamt);
    const pmt = mtg ? (mtg * (0.0525 / 12) * Math.pow(1 + 0.0525 / 12, 300)) / (Math.pow(1 + 0.0525 / 12, 300) - 1) : 0; // rough 25yr at 5.25 qualifying
    const tax = pn(c.tax) / 12;
    const condo = pn(c.condo);
    const heat = pn(c.heat) || 150;
    const gds = inc > 0 ? ((pmt + tax + condo + heat) / (inc / 12) * 100) : 0;
    return gds;
  };

  // Filter pipeline or DB clients
  const filterList = () => {
    let list = [...clients];
    if (dbFilter !== "all") {
      list = list.filter(c => c.status === dbFilter);
    }
    if (agentFilter) {
      list = list.filter(c => c.agent === agentFilter);
    }
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      list = list.filter(c => 
        (c.first + " " + c.last).toLowerCase().includes(q) ||
        (c.email || "").toLowerCase().includes(q) ||
        (c.cell || "").includes(q) ||
        (c.addr || "").toLowerCase().includes(q) ||
        (c.lender || "").toLowerCase().includes(q)
      );
    }
    return list;
  };

  const filteredClients = filterList();

  const STAGES = [
    { id: "lead", label: "Leads", color: "var(--brand-grey)", style: "bg-neutral-500/10 text-neutral-400 border-neutral-500/25" },
    { id: "open", label: "New/Open", color: "var(--brand-blue)", style: "bg-blue-500/10 text-blue-400 border-blue-500/25" },
    { id: "working", label: "Working", color: "#9b8be0", style: "bg-purple-500/10 text-purple-400 border-purple-500/25" },
    { id: "lender", label: "Submissions", color: "var(--brand-gold-d)", style: "bg-orange-500/10 text-orange-400 border-orange-500/25" },
    { id: "conditional", label: "Conditional", color: "var(--danger)", style: "bg-red-500/10 text-red-400 border-red-500/25" },
    { id: "approved", label: "Approved", color: "var(--success)", style: "bg-green-500/10 text-green-400 border-green-500/25" },
    { id: "funded", label: "Funded", color: "var(--brand-gold)", style: "bg-yellow-500/10 text-[#b5a642] border-[#b5a642]/25" }
  ];

  return (
    <div className="flex flex-col gap-5 h-full overflow-hidden">
      
      {/* Header bar and sub tabs */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 shrink-0">
        <div className="flex bg-[#141418] border border-white/5 rounded-lg p-0.5 select-none self-start">
          <button 
            onClick={() => setViewMode("database")}
            className={`px-4 py-1.5 text-xs font-semibold rounded-md transition-all ${viewMode === "database" ? "bg-[#b5a642] text-black" : "text-white/60 hover:text-white"}`}
          >
            📋 Directory Table
          </button>
          <button 
            onClick={() => setViewMode("pipeline")}
            className={`px-4 py-1.5 text-xs font-semibold rounded-md transition-all ${viewMode === "pipeline" ? "bg-[#b5a642] text-black" : "text-white/60 hover:text-white"}`}
          >
            📊 KanBan stages
          </button>
        </div>

        {/* Global search */}
        <div className="flex flex-wrap items-center gap-2 self-stretch sm:self-auto">
          <div className="bg-[#141418] border border-white/5 rounded-lg px-3 py-1.5 flex items-center gap-2 w-full sm:w-60 focus-within:border-[#b5a642]/40 transition-all">
            <Search className="w-3.5 h-3.5 text-[#8e95a3]" />
            <input 
              type="text" 
              placeholder="Search by name, site, or lender…" 
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="bg-transparent border-none text-xs text-[#eeeef2] focus:outline-none w-full"
            />
          </div>
          <button 
            onClick={onOpenNewClientIntake}
            className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold rounded-lg bg-[#141418] text-[#b5a642] border border-[#b5a642]/30 hover:bg-[#b5a642]/10 transition-all cursor-pointer"
          >
            ✦ New Client Intake (PDF)
          </button>
          <button 
            onClick={onOpenAIIntake}
            className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold rounded-lg bg-gradient-to-r from-[#b5a642] to-[#6fa3b8] text-black hover:opacity-90 transition-all cursor-pointer"
          >
            ✦ AI Application Intake
          </button>
          <button 
            onClick={onAddClient}
            className="flex items-center gap-1 px-3 py-1.5 text-xs font-semibold rounded-lg bg-[#b5a642] text-black hover:bg-[#9a8c38] transition-all"
          >
            <Plus className="w-3.5 h-3.5 stroke-[2.5]" /> New Client
          </button>
        </div>
      </div>

      {/* Database Mode View */}
      {viewMode === "database" ? (
        <div className="flex-1 flex flex-col min-h-0 bg-[#141418] border border-white/5 rounded-xl shadow-md overflow-hidden">
          
          {/* Quick Filters */}
          <div className="p-3 border-b border-white/5 flex flex-wrap items-center gap-1.5 bg-[#1b1b20]/30 select-none">
            <span className="text-[10px] text-[#8e95a3] uppercase font-bold px-2 tracking-wider">Status:</span>
            {[
              { id: "all", label: "All Files" },
              { id: "lead", label: "🔍 Leads" },
              { id: "open", label: "Open" },
              { id: "working", label: "Working" },
              { id: "lender", label: "At Lender" },
              { id: "conditional", label: "Conditional" },
              { id: "approved", label: "Approved" },
              { id: "funded", label: "Funded" },
              { id: "closed", label: "Closed" }
            ].map(f => (
              <button
                key={f.id}
                onClick={() => setDbFilter(f.id)}
                className={`px-3 py-1 rounded-full text-xs font-semibold border transition-all ${dbFilter === f.id ? "bg-[#b5a642]/15 text-[#b5a642] border-[#b5a642]/30" : "bg-transparent text-white/50 border-transparent hover:text-white"}`}
              >
                {f.label}
              </button>
            ))}

            <select 
              value={agentFilter}
              onChange={(e) => setAgentFilter(e.target.value)}
              className="ml-auto bg-[#1b1b20] border border-white/5 rounded-md px-2 py-1 text-xs text-[#eeeef2] focus:outline-none"
            >
              <option value="">All Advising Agents</option>
              {agentNames.map(name => <option key={name} value={name}>{name}</option>)}
            </select>
            <span className="text-xs text-[#8e95a3] font-medium border-l border-white/5 pl-3 ml-1">{filteredClients.length} clients</span>
          </div>

          {/* Grid table */}
          <div className="flex-1 overflow-y-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="border-b border-white/5 bg-[#1b1b20]/25 text-[10px] text-[#8e95a3] uppercase tracking-wider sticky top-0 z-10">
                  <th className="p-3.5 pl-6">Profile</th>
                  <th className="p-3.5">Goal Type</th>
                  <th className="p-3.5">Filing Stage</th>
                  <th className="p-3.5">Requested</th>
                  <th className="p-3.5">Estimated LTV</th>
                  <th className="p-3.5">Beacon Credit</th>
                  <th className="p-3.5">Estimated GDS</th>
                  <th className="p-3.5">Lead Advisor</th>
                  <th className="p-3.5 text-right pr-6">Added On</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/5">
                {filteredClients.map((c, i) => {
                  const avatar = (c.first[0] + c.last[0]).toUpperCase();
                  const ltv = pn(c.propval) > 0 ? (pn(c.mtgamt) / pn(c.propval) * 100) : 0;
                  const gds = calculateRatios(c);

                  return (
                    <tr 
                      key={c.id} 
                      onClick={() => onOpenClient(c.id)}
                      className="hover:bg-[#1b1b20]/30 transition-colors cursor-pointer group"
                    >
                      <td className="p-3.5 pl-6 flex items-center gap-3">
                        <div className="w-8 h-8 rounded-full bg-[#1b1b20] border border-white/10 flex items-center justify-center font-bold text-xs text-[#8e95a3] group-hover:scale-105 transition-transform">
                          {avatar}
                        </div>
                        <div>
                          <div className="text-xs font-semibold group-hover:text-[#b5a642] transition-colors">{c.first} {c.last}</div>
                          {c.cell && <div className="text-[10px] text-[#8e95a3]">{c.cell}</div>}
                        </div>
                      </td>
                      <td className="p-3.5 text-xs text-[#8e95a3]">{c.type || "Purchase"}</td>
                      <td className="p-3.5 text-xs">
                        <span className={`inline-block px-2 py-0.5 rounded-full text-[9px] font-bold uppercase tracking-wider ${
                          c.status === "funded" ? "bg-yellow-500/10 text-[#b5a642]" :
                          c.status === "approved" ? "bg-green-500/10 text-green-400" :
                          c.status === "conditional" ? "bg-red-500/10 text-red-400" :
                          c.status === "lender" ? "bg-orange-500/10 text-orange-400" :
                          "bg-blue-500/10 text-blue-400"
                        }`}>
                          {c.status}
                        </span>
                      </td>
                      <td className="p-3.5 text-xs font-mono font-medium">{c.mtgamt ? fd(pn(c.mtgamt)) : "—"}</td>
                      <td className="p-3.5 text-xs font-mono text-[#8e95a3]">
                        {ltv > 0 ? `${ltv.toFixed(0)}%` : "—"}
                      </td>
                      <td className="p-3.5 text-xs font-mono">
                        <span className={pn(c.beacon) >= 680 ? "text-green-400" : pn(c.beacon) >= 600 ? "text-orange-400" : "text-red-400"}>
                          {c.beacon || "—"}
                        </span>
                      </td>
                      <td className="p-3.5 text-xs font-mono">
                        <span className={gds <= 39 && gds > 0 ? "text-green-400" : gds > 39 ? "text-red-400" : "text-white/40"}>
                          {gds > 0 ? `${gds.toFixed(1)}%` : "—"}
                        </span>
                      </td>
                      <td className="p-3.5 text-xs text-[#8e95a3]">{c.agent || "Unassigned"}</td>
                      <td className="p-3.5 text-right text-xs text-white/40 font-mono pr-6">
                        {new Date(c.createdAt).toLocaleDateString("en-CA")}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      ) : (
        /* Board KanBan stages View */
        <div className="flex-1 overflow-x-auto overflow-y-hidden pb-2 select-none">
          <div className="flex gap-3 h-full min-w-[1240px]">
            {STAGES.map((s) => {
              const colClients = clients.filter(c => c.status === s.id);
              const colValue = colClients.reduce((sum, c) => sum + pn(c.mtgamt), 0);

              return (
                <div 
                  key={s.id}
                  className="w-80 h-full flex flex-col bg-[#141418] border border-white/5 rounded-xl max-h-full"
                >
                  {/* Column Header */}
                  <div className="p-4.5 border-b border-white/5 flex items-center justify-between shrink-0">
                    <div className="flex items-center gap-2">
                      <div className="w-2 h-2 rounded-full" style={{ backgroundColor: s.color }}></div>
                      <h4 className="text-xs font-bold uppercase tracking-wider text-white/90">{s.label}</h4>
                      <span className="text-[10px] font-bold px-1.5 py-0.5 rounded bg-[#1b1b20] text-white/40">{colClients.length}</span>
                    </div>
                    <span className="text-[11px] font-mono text-[#8e95a3] font-semibold">{fdShort(colValue)}</span>
                  </div>

                  {/* Column Body Cards Area */}
                  <div className="flex-1 overflow-y-auto p-2 flex flex-col gap-2 min-h-0 bg-[#0c0c0e]/30">
                    {colClients.length > 0 ? colClients.map(c => {
                      const initials = (c.first[0] + c.last[0]).toUpperCase();
                      const daysStale = Math.floor((Date.now() - new Date(c.updatedAt || c.createdAt).getTime()) / (24 * 3600 * 1000));
                      const isStale = daysStale > 30;

                      return (
                        <div
                          key={c.id}
                          onClick={() => onOpenClient(c.id)}
                          className={`p-3 rounded-lg border bg-[#1b1b20] hover:scale-[1.02] active:scale-[0.98] transition-all cursor-pointer ${isStale ? "border-red-500/20 hover:border-red-500/35" : "border-white/5 hover:border-white/10"}`}
                        >
                          <div className="flex justify-between items-start gap-2 mb-2">
                            <div className="flex items-center gap-2.5 min-w-0">
                              <div className="w-7 h-7 rounded bg-[#141418] border border-white/5 text-[10px] font-bold flex items-center justify-center text-[#8e95a3]">
                                {initials}
                              </div>
                              <div className="min-w-0">
                                <h5 className="text-xs font-semibold text-white/90 truncate">{c.first} {c.last}</h5>
                                <div className="text-[10px] text-white/30 truncate mt-0.5">{c.type || "Purchase"}</div>
                              </div>
                            </div>
                            <div className="text-xs font-mono font-bold text-[#b5a642] whitespace-nowrap">
                              {c.mtgamt ? fdShort(pn(c.mtgamt)) : "—"}
                            </div>
                          </div>

                          <div className="flex justify-between items-center text-[10px] border-t border-white/5 pt-2 mt-2">
                            <span className="px-1.5 py-0.5 rounded bg-white/5 text-[#8e95a3] font-medium max-w-[1240px] truncate">
                              👤 {(c.agent || "Unassigned").split(" ")[0]}
                            </span>
                            <span className={`font-mono font-semibold ${isStale ? "text-red-400" : "text-white/30"}`}>
                              {daysStale === 0 ? "today" : `${daysStale}d idle`}
                            </span>
                          </div>
                        </div>
                      );
                    }) : (
                      <div className="h-24 flex items-center justify-center text-[11px] text-white/20 italic">No files in stage</div>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

    </div>
  );
};
