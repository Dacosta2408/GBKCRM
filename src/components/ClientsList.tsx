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
  searchQuery?: string;
  onSearchQueryChange?: (q: string) => void;
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
  agentNames,
  searchQuery,
  onSearchQueryChange
}) => {
  const [dbFilter, setDbFilter] = useState<string>("all");
  const [agentFilter, setAgentFilter] = useState<string>("");
  const [localSearchQuery, setLocalSearchQuery] = useState<string>("");

  const activeSearchQuery = searchQuery !== undefined ? searchQuery : localSearchQuery;
  const handleSearchChange = onSearchQueryChange || setLocalSearchQuery;

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

  const calculateRatios = (c: Client) => {
    const inc = pn(c.income) + pn(c.coIncome);
    const mtg = pn(c.mtgamt);
    const pmt = mtg ? (mtg * (0.0525 / 12) * Math.pow(1 + 0.0525 / 12, 300)) / (Math.pow(1 + 0.0525 / 12, 300) - 1) : 0; 
    const tax = pn(c.tax) / 12;
    const condo = pn(c.condo);
    const heat = pn(c.heat) || 150;
    const gds = inc > 0 ? ((pmt + tax + condo + heat) / (inc / 12) * 100) : 0;
    return gds;
  };

  const filterList = () => {
    let list = [...clients];
    if (dbFilter !== "all") {
      list = list.filter(c => c.status === dbFilter);
    }
    if (agentFilter) {
      list = list.filter(c => c.agent === agentFilter);
    }
    if (activeSearchQuery.trim()) {
      const q = activeSearchQuery.toLowerCase();
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
    { 
      id: "lead", 
      label: "Leads", 
      color: "var(--color-primary)", 
      style: "bg-[var(--color-primary-subtle)] text-[var(--color-primary)] border border-[var(--color-primary)]/20 shadow-sm" 
    },
    { 
      id: "open", 
      label: "New/Open", 
      color: "var(--color-info)", 
      style: "bg-[var(--color-info-subtle)] text-[var(--color-info)] border border-[var(--color-info)]/20 shadow-sm" 
    },
    { 
      id: "working", 
      label: "Working", 
      color: "var(--color-warning)", 
      style: "bg-[var(--color-warning-subtle)] text-[var(--color-warning)] border border-[var(--color-warning)]/20 shadow-sm" 
    },
    { 
      id: "lender", 
      label: "Submissions", 
      color: "var(--color-primary-hover)", 
      style: "bg-[var(--color-primary-subtle)] text-[var(--color-primary-hover)] border border-[var(--color-primary-hover)]/20 shadow-sm" 
    },
    { 
      id: "conditional", 
      label: "Conditional", 
      color: "var(--color-error)", 
      style: "bg-[var(--color-error-subtle)] text-[var(--color-error)] border border-[var(--color-error)]/20 shadow-sm" 
    },
    { 
      id: "approved", 
      label: "Approved", 
      color: "var(--color-success)", 
      style: "bg-[var(--color-success-subtle)] text-[var(--color-success)] border border-[var(--color-success)]/20 shadow-sm" 
    },
    { 
      id: "funded", 
      label: "Funded", 
      color: "var(--color-accent)", 
      style: "bg-[var(--color-accent-subtle)] text-[var(--color-accent)] border border-[var(--color-accent)]/20 shadow-sm" 
    }
  ];

  return (
    <div className="flex flex-col gap-5 h-full overflow-hidden select-none">
      
      {/* Header bar and sub tabs */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 shrink-0">
        <div className="flex bg-[var(--color-surface-3)]/35 border border-[var(--color-border)] rounded-full p-1 select-none self-start backdrop-blur-md">
          <button 
            onClick={() => setViewMode("database")}
            className={`px-4 py-1.5 text-xs font-black uppercase tracking-tight rounded-full transition-all duration-200 cursor-pointer ${viewMode === "database" ? "bg-[var(--color-accent)] text-[var(--color-text-inverse)] shadow-[var(--shadow-sm)]" : "text-[var(--color-text-muted)] hover:text-[var(--color-text)] hover:bg-[var(--color-surface-3)]/40"}`}
          >
            📋 Directory Table
          </button>
          <button 
            onClick={() => setViewMode("pipeline")}
            className={`px-4 py-1.5 text-xs font-black uppercase tracking-tight rounded-full transition-all duration-200 cursor-pointer ${viewMode === "pipeline" ? "bg-[var(--color-accent)] text-[var(--color-text-inverse)] shadow-[var(--shadow-sm)]" : "text-[var(--color-text-muted)] hover:text-[var(--color-text)] hover:bg-[var(--color-surface-3)]/40"}`}
          >
            📊 Stages
          </button>
        </div>

        {/* Global search */}
        <div className="flex flex-wrap items-center gap-2 self-stretch sm:self-auto">
          <div 
            className="px-3.5 py-1.5 flex items-center gap-2 w-full sm:w-64 transition-all duration-300 rounded-full border focus-within:border-[var(--color-accent)]/50 focus-within:shadow-[0_0_12px_var(--color-accent-subtle)]"
            style={{
              background: "var(--glass-bg)",
              backdropFilter: "var(--glass-blur)",
              WebkitBackdropFilter: "var(--glass-blur)",
              borderColor: "var(--glass-border)"
            }}
          >
            <Search className="w-3.5 h-3.5 text-[var(--color-text-muted)]" />
            <input 
              type="text" 
              placeholder="Search name, email, phone, address, or lender…" 
              value={activeSearchQuery}
              onChange={(e) => handleSearchChange(e.target.value)}
              className="bg-transparent border-none text-xs text-[var(--color-text)] placeholder-[var(--color-text-muted)] focus:outline-none w-full font-medium"
            />
          </div>

          <button 
            onClick={onOpenNewClientIntake}
            className="flex items-center gap-1.5 px-4 py-1.5 text-xs font-bold rounded-full transition-all duration-200 cursor-pointer border border-[var(--color-border)] hover:bg-[var(--color-surface-2)] text-[var(--color-text)] hover:shadow-md"
            style={{
              background: "var(--glass-bg)",
              backdropFilter: "var(--glass-blur)",
              WebkitBackdropFilter: "var(--glass-blur)"
            }}
          >
            ✦ Intake (PDF)
          </button>

          <button 
            onClick={onOpenAIIntake}
            className="flex items-center gap-1.5 px-4 py-1.5 text-xs font-bold rounded-full text-[var(--color-text-inverse)] hover:opacity-90 transition-all cursor-pointer hover:shadow-md"
            style={{
              background: "var(--grad-deep)"
            }}
          >
            ✦ AI Extraction
          </button>

          <button 
            onClick={onAddClient}
            className="flex items-center gap-1 px-4 py-1.5 text-xs font-extrabold text-[var(--color-text-inverse)] transition-all cursor-pointer hover:shadow-md hover:opacity-95 active:scale-95 duration-200"
            style={{
              background: "var(--grad-warm-highlight)",
              borderRadius: "999px"
            }}
          >
            <Plus className="w-3.5 h-3.5 stroke-[3]" /> Add Client
          </button>
        </div>
      </div>

      {/* Database Mode View */}
      {viewMode === "database" ? (
        <div className="flex-1 flex flex-col min-h-0 glass-card shadow-md overflow-hidden">
          
          {/* Quick Filters */}
          <div className="p-3 border-b flex flex-wrap items-center gap-1.5 bg-[var(--color-surface-2)]/30 backdrop-blur-sm select-none" style={{ borderBottomColor: "var(--color-divider)" }}>
            <span className="text-[9px] text-[var(--color-text-muted)] uppercase font-extrabold tracking-widest pl-2">Filter Stage:</span>
            {[
              { id: "all", label: "All Files" },
              { id: "lead", label: "Leads" },
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
                className={`px-3 py-1 rounded-full text-xs font-extrabold border transition-all cursor-pointer ${
                  dbFilter === f.id 
                    ? "bg-[var(--color-accent-subtle)] text-[var(--color-accent)] border-[var(--color-accent)]/35 shadow-[var(--shadow-sm)]" 
                    : "bg-transparent text-[var(--color-text-muted)] border-transparent hover:text-[var(--color-text)] hover:bg-[var(--color-surface-3)]/60"
                }`}
              >
                {f.label}
              </button>
            ))}

            <select 
              value={agentFilter}
              onChange={(e) => setAgentFilter(e.target.value)}
              className="ml-auto bg-[var(--color-surface-2)] border border-[var(--color-border)]/70 rounded-full px-4 py-1 text-xs text-[var(--color-text-muted)] focus:outline-none cursor-pointer hover:border-[var(--color-accent)]/30 transition-all"
            >
              <option value="" className="bg-[var(--color-bg)]">All Advising Agents</option>
              {agentNames.map(name => <option key={name} value={name} className="bg-[var(--color-bg)]">{name}</option>)}
            </select>
            <span className="text-xs text-[var(--color-text-faint)] font-bold border-l border-[var(--color-divider)] pl-3 ml-1">{filteredClients.length} clients</span>
          </div>

          {/* Grid table */}
          <div className="flex-1 overflow-y-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="border-b bg-[var(--color-surface-2)]/90 backdrop-blur-md text-[9px] text-[var(--color-text-muted)] font-black uppercase tracking-wider sticky top-0 z-10" style={{ borderBottomColor: "var(--color-divider)" }}>
                  <th className="p-3.5 pl-6">Profile</th>
                  <th className="p-3.5">Goal Type</th>
                  <th className="p-3.5">Filing Stage</th>
                  <th className="p-3.5">Requested</th>
                  <th className="p-3.5">Lender</th>
                  <th className="p-3.5">Estimated LTV</th>
                  <th className="p-3.5">Beacon Credit</th>
                  <th className="p-3.5">Estimated GDS</th>
                  <th className="p-3.5">Lead Advisor</th>
                  <th className="p-3.5 text-right pr-6">Last Updated</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[var(--color-divider)]">
                {filteredClients.length > 0 ? (
                  filteredClients.map((c, i) => {
                    const avatar = (c.first[0] + c.last[0]).toUpperCase();
                    const ltv = pn(c.propval) > 0 ? (pn(c.mtgamt) / pn(c.propval) * 100) : 0;
                    const gds = calculateRatios(c);
                    const matchingStage = STAGES.find(s => s.id === c.status);
                    
                    const updateTime = new Date(c.updatedAt || c.createdAt).getTime();
                    const staleThreshold = Date.now() - 14 * 24 * 60 * 60 * 1000;
                    const isStale = (c.status !== "funded" && c.status !== "closed") && (updateTime < staleThreshold);

                    return (
                      <tr 
                        key={c.id} 
                        onClick={() => onOpenClient(c.id)}
                        className={`transition-all duration-150 cursor-pointer group ${
                          isStale 
                            ? "bg-[var(--color-warning-subtle)] hover:bg-[var(--color-warning-subtle)]/80" 
                            : "hover:bg-[var(--color-surface-2)]"
                        }`}
                      >
                        <td className="p-3.5 pl-6 flex items-center gap-3">
                          <div 
                            className="w-8 h-8 rounded-full flex items-center justify-center font-black text-[10px] text-[var(--color-text-inverse)] shadow-sm"
                            style={{ background: "var(--color-primary)" }}
                          >
                            {avatar}
                          </div>
                          <div>
                            <div className="flex items-center gap-1.5">
                              <span className="text-xs font-bold text-[var(--color-text)] group-hover:text-[var(--color-accent)] transition-colors">{c.first} {c.last}</span>
                              {isStale && (
                                <span className="text-[7px] font-black uppercase tracking-widest px-1.5 py-0.5 rounded bg-[var(--color-warning)] text-[var(--color-text-inverse)] shadow-sm animate-pulse">
                                  Stale
                                </span>
                              )}
                            </div>
                            {c.cell && <div className="text-[10px] text-[var(--color-text-muted)] font-extrabold">{c.cell}</div>}
                          </div>
                        </td>
                        <td className="p-3.5 text-xs text-[var(--color-text-muted)] font-semibold">{c.type || "Purchase"}</td>
                        <td className="p-3.5 text-xs">
                          <span className={`inline-block px-2.5 py-0.5 rounded-full text-[9px] font-black uppercase tracking-wider ${
                            matchingStage ? matchingStage.style : "bg-[var(--color-surface-3)] text-[var(--color-text-muted)] border border-[var(--color-border)] shadow-sm"
                           }`}>
                            {matchingStage ? matchingStage.label : c.status}
                          </span>
                        </td>
                        <td className="p-3.5 text-xs font-mono font-bold text-[var(--color-text)]">{c.mtgamt ? fd(pn(c.mtgamt)) : "—"}</td>
                        <td className="p-3.5 text-xs text-[var(--color-text-muted)] font-semibold">{c.lender || "—"}</td>
                        <td className="p-3.5 text-xs font-mono text-[var(--color-text-muted)] font-bold">
                          {ltv > 0 ? `${ltv.toFixed(0)}%` : "—"}
                        </td>
                        <td className="p-3.5 text-xs font-mono font-bold">
                          <span className={pn(c.beacon) >= 680 ? "text-[var(--color-success)]" : pn(c.beacon) >= 600 ? "text-[var(--color-warning)]" : "text-[var(--color-error)]"}>
                            {c.beacon || "—"}
                          </span>
                        </td>
                        <td className="p-3.5 text-xs font-mono font-bold">
                          <span className={gds <= 39 && gds > 0 ? "text-[var(--color-success)]" : gds > 39 ? "text-[var(--color-error)]" : "text-[var(--color-text-faint)]"}>
                            {gds > 0 ? `${gds.toFixed(1)}%` : "—"}
                          </span>
                        </td>
                        <td className="p-3.5 text-xs text-[var(--color-text-muted)] font-bold">{c.agent || "Unassigned"}</td>
                        <td className="p-3.5 text-right text-xs text-[var(--color-text-faint)] font-mono pr-6 font-bold">
                          {new Date(c.updatedAt || c.createdAt).toLocaleDateString("en-CA")}
                        </td>
                      </tr>
                    );
                  })
                ) : (
                  <tr>
                    <td colSpan={9} className="p-16 text-center">
                      <div className="flex flex-col items-center justify-center max-w-md mx-auto p-8 rounded-2xl border border-[var(--color-border)] bg-[var(--color-surface-2)]/40 backdrop-blur-md shadow-lg space-y-5">
                        <div className="w-14 h-14 rounded-full bg-[var(--color-surface-3)]/60 flex items-center justify-center border border-[var(--color-border)]/80 text-[var(--color-accent)] shadow-inner">
                          <Search className="h-6 w-6 stroke-[2]" />
                        </div>
                        <div className="space-y-2">
                          <h4 className="text-xs font-black uppercase text-[var(--color-text)] tracking-wider">No matching clients found</h4>
                          <p className="text-[11px] text-[var(--color-text-muted)] leading-relaxed font-sans max-w-xs mx-auto">
                            We couldn't find any file matching your criteria. Try loosening your filter settings or search query.
                          </p>
                        </div>
                        <div className="flex items-center gap-3 justify-center pt-2">
                          <button
                            onClick={() => {
                              handleSearchChange("");
                              setDbFilter("all");
                              setAgentFilter("");
                            }}
                            className="px-4 py-1.5 bg-[var(--color-surface-3)] hover:bg-[var(--color-surface-3)]/80 text-[var(--color-text)] border border-[var(--color-border)] text-[10px] font-extrabold uppercase tracking-wider rounded-full cursor-pointer transition-all active:scale-95 shadow-sm"
                          >
                            Reset filters
                          </button>
                          <button
                            onClick={onAddClient}
                            className="px-4 py-1.5 bg-[var(--color-accent)] hover:bg-[var(--color-accent)]/90 text-[var(--color-text-inverse)] text-[10px] font-extrabold uppercase tracking-wider rounded-full cursor-pointer transition-all active:scale-95 shadow-md"
                          >
                            + Onboard Client
                          </button>
                        </div>
                      </div>
                    </td>
                  </tr>
                )}
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
                  className="w-80 h-full flex flex-col rounded-2xl max-h-full"
                  style={{
                    background: "var(--glass-bg)",
                    border: "1px solid var(--glass-border)",
                    backdropFilter: "var(--glass-blur)",
                    WebkitBackdropFilter: "var(--glass-blur)"
                  }}
                >
                  {/* Column Header */}
                  <div className="p-4 border-b flex items-center justify-between shrink-0" style={{ borderColor: "var(--color-divider)" }}>
                    <div className="flex items-center gap-2">
                      <div className="w-2.5 h-2.5 rounded-full animate-pulse" style={{ backgroundColor: s.color, boxShadow: `0 0 8px ${s.color}` }}></div>
                      <h4 className="text-xs font-black uppercase tracking-wider text-[var(--color-text)]">{s.label}</h4>
                      <span className="text-[10px] font-black px-2 py-0.5 rounded-full bg-[var(--color-surface-3)]/80 text-[var(--color-text-muted)] border border-[var(--color-border)]/50">{colClients.length}</span>
                    </div>
                    <span className="text-xs font-bold font-mono text-[var(--color-accent)]">{fdShort(colValue)}</span>
                  </div>

                  {/* Column Body Cards Area */}
                  <div className="flex-1 overflow-y-auto p-2.5 flex flex-col gap-2.5 min-h-0 bg-[var(--color-surface-2)]/30 rounded-b-2xl">
                    {colClients.length > 0 ? colClients.map(c => {
                      const initials = (c.first[0] + c.last[0]).toUpperCase();
                      const daysStale = Math.floor((Date.now() - new Date(c.updatedAt || c.createdAt).getTime()) / (24 * 3600 * 1000));
                      const isStale = daysStale > 30;

                      return (
                        <div
                          key={c.id}
                          onClick={() => onOpenClient(c.id)}
                          className={`p-3.5 rounded-xl border transition-all duration-300 ease-out cursor-pointer shadow-sm ${
                            isStale 
                              ? "border-[var(--color-error)]/25 hover:border-[var(--color-error)]/55 hover:shadow-[0_0_15px_var(--color-error-subtle)] bg-[var(--color-error-subtle)]" 
                              : "border-[var(--color-border)] hover:border-[var(--color-accent)]/30 hover:shadow-[0_0_15px_var(--color-accent-subtle)] bg-[var(--color-surface)]"
                          }`}
                        >
                          <div className="flex justify-between items-start gap-2 mb-2">
                            <div className="flex items-center gap-2.5 min-w-0">
                              <div 
                                className="w-7.5 h-7.5 rounded-lg text-[9px] font-black flex items-center justify-center text-[var(--color-text-inverse)] shadow-sm"
                                style={{ background: "var(--color-primary)" }}
                              >
                                {initials}
                              </div>
                              <div className="min-w-0">
                                <h5 className="text-xs font-bold text-[var(--color-text)] truncate">{c.first} {c.last}</h5>
                                <div className="text-[10px] text-[var(--color-text-muted)] font-extrabold truncate mt-0.5 uppercase tracking-wider">{c.type || "Purchase"}</div>
                              </div>
                            </div>
                            <div className="text-xs font-mono font-bold text-[var(--color-accent)] whitespace-nowrap mt-0.5">
                              {c.mtgamt ? fdShort(pn(c.mtgamt)) : "—"}
                            </div>
                          </div>

                          <div className="flex justify-between items-center text-[10px] border-t border-[var(--color-divider)] pt-2 mt-2">
                            <span className="px-2 py-0.5 rounded-full bg-[var(--color-surface-2)] text-[var(--color-text-muted)] font-bold text-[9px] max-w-[120px] truncate">
                              👤 {(c.agent || "Unassigned").split(" ")[0]}
                            </span>
                            <span className={`font-mono font-bold uppercase text-[8px] tracking-wider ${isStale ? "text-[var(--color-error)]" : "text-[var(--color-text-faint)]"}`}>
                              {daysStale === 0 ? "today" : `${daysStale}d idle`}
                            </span>
                          </div>
                        </div>
                      );
                    }) : (
                      <div className="flex-1 flex flex-col items-center justify-center min-h-[140px] border border-dashed border-[var(--color-border)]/75 rounded-xl p-4 bg-[var(--color-surface)]/20 text-center m-1.5 shadow-inner">
                        <div className="w-8 h-8 rounded-full bg-[var(--color-surface-2)]/50 flex items-center justify-center border border-[var(--color-border)]/40 text-[var(--color-text-faint)] mb-2">
                          <Landmark className="w-4 h-4 opacity-70 text-[var(--color-accent)]" />
                        </div>
                        <span className="text-[10px] font-black uppercase text-[var(--color-text-muted)] tracking-wider">Empty stage</span>
                        <p className="text-[9px] text-[var(--color-text-faint)] leading-tight mt-1 max-w-[150px]">No active files are currently in this underwriting phase.</p>
                      </div>
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
