import React, { useState, useMemo, useEffect } from "react";
import { 
  ShieldCheck, AlertTriangle, Clock, CheckCircle2, UserPlus, 
  Search, Filter, ChevronRight, Eye, FileText, CheckSquare, 
  Activity, ArrowRight, User, RefreshCw, X, MessageSquare, AlertCircle
} from "lucide-react";
import { Client, User as CRMUser } from "../types";
import { CHECKLIST_RULES, STATUS_STYLING } from "./document/constants";
import { generateChecklistForClient, evaluateChecklistReadiness } from "../lib/checklistEngine";
import { motion } from "motion/react";

interface FileReadinessProps {
  clients: Client[];
  currentUser: CRMUser;
  docVault: Record<string, any>;
  setDocVault: React.Dispatch<React.SetStateAction<Record<string, any>>>;
  onOpenClient: (id: string, initialTab?: string) => void;
  showToast: (msg: string, type?: "success" | "error" | "info", icon?: string) => void;
  agentNames: string[];
  isOwnerOrManager: boolean;
  onUpdateClient: (updated: Client) => void;
}

export const FileReadiness: React.FC<FileReadinessProps> = ({
  clients,
  currentUser,
  docVault,
  setDocVault,
  onOpenClient,
  showToast,
  agentNames,
  isOwnerOrManager,
  onUpdateClient
}) => {
  // --- FILTERS STATE ---
  const [searchQuery, setSearchQuery] = useState("");
  const [brokerFilter, setBrokerFilter] = useState("all");
  const [typeFilter, setTypeFilter] = useState("all");
  const [stageFilter, setStageFilter] = useState("all");
  const [stateFilter, setStateFilter] = useState("all");
  const [missingFilter, setMissingFilter] = useState("any");
  const [staleOnly, setStaleOnly] = useState(false);
  const [complianceOnly, setComplianceOnly] = useState(false);
  const [dateFilter, setDateFilter] = useState("any");

  // Quick action overlays/modals state
  const [assigningClientId, setAssigningClientId] = useState<string | null>(null);
  const [reviewClientId, setReviewClientId] = useState<string | null>(null);
  const [reviewAction, setReviewAction] = useState<"approve" | "reject" | "flag" | "note">("approve");
  const [reviewNotes, setReviewNotes] = useState("");

  const [refreshCounter, setRefreshCounter] = useState(0);

  useEffect(() => {
    const handleUpdate = () => {
      setRefreshCounter(prev => prev + 1);
    };
    window.addEventListener("checklist-updated", handleUpdate);
    return () => window.removeEventListener("checklist-updated", handleUpdate);
  }, []);

  // --- DYNAMIC READINESS CALCULATOR ---
  const fileReadinessList = useMemo(() => {
    return clients.map(client => {
      // Load or generate checklist
      const saved = localStorage.getItem(`gbk_checklist_items_${client.id}`);
      let checklistItems = [];
      if (saved) {
        try {
          checklistItems = JSON.parse(saved);
        } catch (e) {
          checklistItems = generateChecklistForClient(client);
        }
      } else {
        checklistItems = generateChecklistForClient(client);
      }

      // Evaluate checklist
      const summary = evaluateChecklistReadiness(client, checklistItems, docVault);

      // Extract details
      const totalCount = checklistItems.length;
      const score = summary.checklistScore;
      const blockers = [...summary.activeBlockers];

      let staleExpiredCount = 0;
      let complianceIssueCount = 0;

      // Document Expiry/Stale/Compliance Audit
      const clientVault = docVault[client.id] || {};
      const activeRules = CHECKLIST_RULES.filter(rule => rule.evaluate(client));
      activeRules.forEach(rule => {
        const doc = clientVault[rule.id] || {};
        const status = doc.status || "required";

        let isExpired = false;
        let isStale = false;
        if (doc.expiryDate) {
          const exp = new Date(doc.expiryDate);
          if (exp.getTime() < Date.now()) {
            isExpired = true;
          }
        } else if (status === "received" && doc.uploadedAt) {
          const ageDays = (Date.now() - new Date(doc.uploadedAt).getTime()) / (1000 * 3600 * 24);
          if (rule.category === "Income" && ageDays > 45) isStale = true;
          if (rule.category === "Banking" && ageDays > 60) isStale = true;
        }

        if (isExpired || isStale || status === "expired") {
          staleExpiredCount++;
          blockers.push(`${rule.label} is ${isExpired ? "expired" : "stale"}`);
        }

        if (status === "rejected" || status === "missing_pages" || status === "follow_up") {
          complianceIssueCount++;
          blockers.push(`Compliance exception: ${rule.label} (${status.replace("_", " ")})`);
        }
      });

      // Final readiness state determination
      let state: "Ready" | "Almost Ready" | "Waiting on Client" | "Waiting on Internal Review" | "Blocked" | "Stale" | "Compliance Issue" = "Blocked";
      if (complianceIssueCount > 0) {
        state = "Compliance Issue";
      } else if (staleExpiredCount > 0) {
        state = "Stale";
      } else {
        state = summary.readinessState;
      }

      // Latest Update derivation
      let lastUpdated = client.updatedAt || client.createdAt;
      Object.keys(clientVault).forEach(key => {
        const v = clientVault[key];
        if (v?.uploadedAt && v.uploadedAt > lastUpdated) {
          lastUpdated = v.uploadedAt;
        }
        if (v?.reviewedAt && v.reviewedAt > lastUpdated) {
          lastUpdated = v.reviewedAt;
        }
      });

      checklistItems.forEach(item => {
        if (item.updatedAt && item.updatedAt > lastUpdated) {
          lastUpdated = item.updatedAt;
        }
      });

      // Check follow up status
      const isMarkedFollowUp = client.appData?.markedFollowUp === "true";

      return {
        client,
        score,
        state,
        totalCount,
        missingCount: summary.missingRequiredCount,
        requestedCount: summary.waitingOnClientCount,
        receivedCount: summary.waitingOnInternalReviewCount,
        underReviewCount: summary.waitingOnInternalReviewCount,
        complianceIssueCount,
        staleExpiredCount,
        blockers,
        primaryBlocker: blockers[0] || "All stage tasks & document conditions cleared",
        lastUpdated,
        isMarkedFollowUp
      };
    });
  }, [clients, docVault, refreshCounter]);

  // --- KPI CARD COMPUTATIONS ---
  const kpis = useMemo(() => {
    let ready = 0;
    let missingCritical = 0;
    let waitingOnClient = 0;
    let underReview = 0;
    let staleExpired = 0;
    let blockedByChecklist = 0;
    let complianceIssues = 0;

    fileReadinessList.forEach(item => {
      if (item.state === "Ready") ready++;
      if (item.missingCount > 0) missingCritical++;
      if (item.state === "Waiting on Client") waitingOnClient++;
      if (item.state === "Waiting on Internal Review") underReview++;
      if (item.staleExpiredCount > 0) staleExpired++;
      if (item.state === "Blocked") blockedByChecklist++;
      if (item.complianceIssueCount > 0) complianceIssues++;
    });

    return { ready, missingCritical, waitingOnClient, underReview, staleExpired, blockedByChecklist, complianceIssues };
  }, [fileReadinessList]);

  // --- FILTERED QUEUE ---
  const filteredList = useMemo(() => {
    return fileReadinessList.filter(item => {
      // Search
      const name = `${item.client.first} ${item.client.last}`.toLowerCase();
      if (searchQuery && !name.includes(searchQuery.toLowerCase()) && !item.client.id.toLowerCase().includes(searchQuery.toLowerCase())) {
        return false;
      }

      // Broker
      if (brokerFilter !== "all" && item.client.agent !== brokerFilter) {
        return false;
      }

      // File Type
      if (typeFilter !== "all" && (item.client.type || "purchase").toLowerCase() !== typeFilter.toLowerCase()) {
        return false;
      }

      // Mortgage Stage
      if (stageFilter !== "all" && item.client.status !== stageFilter) {
        return false;
      }

      // Readiness State
      if (stateFilter !== "all" && item.state !== stateFilter) {
        return false;
      }

      // Missing item count
      if (missingFilter === "none" && item.missingCount > 0) return false;
      if (missingFilter === "1plus" && item.missingCount === 0) return false;
      if (missingFilter === "3plus" && item.missingCount < 3) return false;

      // Toggles
      if (staleOnly && item.staleExpiredCount === 0) return false;
      if (complianceOnly && item.complianceIssueCount === 0) return false;

      // Date Updated
      if (dateFilter !== "any") {
        const lastUp = new Date(item.lastUpdated).getTime();
        const diffMs = Date.now() - lastUp;
        const diffDays = diffMs / (1000 * 3600 * 24);
        if (dateFilter === "today" && diffDays > 1) return false;
        if (dateFilter === "week" && diffDays > 7) return false;
        if (dateFilter === "month" && diffDays > 30) return false;
      }

      return true;
    });
  }, [fileReadinessList, searchQuery, brokerFilter, typeFilter, stageFilter, stateFilter, missingFilter, staleOnly, complianceOnly, dateFilter]);

  // --- HIGH PRIORITY WORK GROUPS (SIDEBAR) ---
  const sidebarWorkflow = useMemo(() => {
    const sortedByUpdate = [...fileReadinessList].sort((a, b) => new Date(b.lastUpdated).getTime() - new Date(a.lastUpdated).getTime());
    
    // 1. Urgent missing docs files (Blocked or missing count is highest)
    const urgentMissing = [...fileReadinessList]
      .filter(f => f.missingCount > 0)
      .sort((a, b) => b.missingCount - a.missingCount)
      .slice(0, 3);

    // 2. Review needed items (Waiting on Internal Review state)
    const reviewNeeded = [...fileReadinessList]
      .filter(f => f.state === "Waiting on Internal Review")
      .slice(0, 3);

    // 3. Stale Files
    const staleFiles = [...fileReadinessList]
      .filter(f => f.staleExpiredCount > 0)
      .slice(0, 3);

    // 4. Recently Updated
    const recentlyUpdated = sortedByUpdate.slice(0, 4);

    return { urgentMissing, reviewNeeded, staleFiles, recentlyUpdated };
  }, [fileReadinessList]);

  // --- ACTIONS ---
  const toggleFollowUp = (clientId: string) => {
    const file = fileReadinessList.find(f => f.client.id === clientId);
    if (!file) return;

    const currentFlag = file.client.appData?.markedFollowUp === "true";
    const updatedClient = {
      ...file.client,
      appData: {
        ...(file.client.appData || {}),
        markedFollowUp: currentFlag ? "false" : "true"
      }
    };

    onUpdateClient(updatedClient);
    showToast(
      currentFlag ? `Removed follow-up flag from ${file.client.first}'s file` : `Flagged ${file.client.first}'s file for review follow-up`,
      "success",
      currentFlag ? "🕊️" : "📌"
    );
  };

  const handleAssignBroker = (clientId: string, agentName: string) => {
    const file = fileReadinessList.find(f => f.client.id === clientId);
    if (!file) return;

    const updatedClient = {
      ...file.client,
      agent: agentName,
      updatedAt: new Date().toISOString()
    };

    onUpdateClient(updatedClient);
    setAssigningClientId(null);
    showToast(`Reassigned ${file.client.first} ${file.client.last} to broker: ${agentName}`, "success", "👤");
  };

  const submitInternalReview = (e: React.FormEvent) => {
    e.preventDefault();
    if (!reviewClientId) return;

    const file = fileReadinessList.find(f => f.client.id === reviewClientId);
    if (!file) return;

    // Log a note or update client status
    let actionText = "";
    if (reviewAction === "approve") {
      actionText = "Manager marked checklist as review-approved.";
      // Let's also transition any pending docs to approved dynamically in vault
      const clientDocs = docVault[file.client.id] || {};
      const updatedDocs = { ...clientDocs };
      Object.keys(updatedDocs).forEach(key => {
        if (updatedDocs[key].status === "received" || updatedDocs[key].status === "under_review") {
          updatedDocs[key] = {
            ...updatedDocs[key],
            status: "approved",
            reviewedBy: `${currentUser.first} ${currentUser.last}`,
            reviewedAt: new Date().toISOString()
          };
        }
      });
      setDocVault(prev => ({ ...prev, [file.client.id]: updatedDocs }));
    } else if (reviewAction === "reject") {
      actionText = `Manager rejected conditions. Reason: ${reviewNotes}`;
    } else if (reviewAction === "flag") {
      actionText = `Manager placed compliance warning flag. Comment: ${reviewNotes}`;
    } else {
      actionText = `Internal Manager Note: ${reviewNotes}`;
    }

    // Append to internal client notes array or just log toast and note
    const updatedClient = {
      ...file.client,
      appData: {
        ...(file.client.appData || {}),
        internalNotes: `${file.client.appData?.internalNotes || ""}\n[Review ${new Date().toLocaleDateString()}] ${actionText}`.trim()
      },
      updatedAt: new Date().toISOString()
    };

    onUpdateClient(updatedClient);
    setReviewClientId(null);
    setReviewNotes("");
    showToast(`Review action registered successfully!`, "success", "🛡️");
  };

  // Helper styling for Readiness States
  const stateStyling: Record<string, { label: string; bg: string; border: string; text: string; dot: string }> = {
    "Ready": { label: "Ready", bg: "bg-green-500/10", border: "border-green-500/20", text: "text-green-400", dot: "bg-green-400" },
    "Almost Ready": { label: "Almost Ready", bg: "bg-emerald-500/5", border: "border-emerald-500/20", text: "text-emerald-400/80", dot: "bg-emerald-400" },
    "Waiting on Client": { label: "Waiting on Client", bg: "bg-amber-500/10", border: "border-amber-500/20", text: "text-amber-400", dot: "bg-amber-400" },
    "Waiting on Internal Review": { label: "Needs Review", bg: "bg-blue-500/10", border: "border-blue-500/20", text: "text-blue-400", dot: "bg-blue-400" },
    "Blocked": { label: "Blocked", bg: "bg-red-500/10", border: "border-red-500/20", text: "text-red-400", dot: "bg-red-400" },
    "Stale": { label: "Stale Docs", bg: "bg-orange-500/10", border: "border-orange-500/20", text: "text-orange-400", dot: "bg-orange-400" },
    "Compliance Issue": { label: "Compliance Issue", bg: "bg-rose-500/10", border: "border-rose-500/20", text: "text-rose-400", dot: "bg-rose-400" }
  };

  return (
    <div className="flex flex-col gap-6 h-full select-none overflow-hidden text-xs">
      
      {/* 1. OPERATIONS HEADER */}
      <div className="flex flex-col gap-1.5 border-b border-white/5 pb-4 bg-gradient-to-r from-[#141418] to-transparent p-4 rounded-xl">
        <div className="flex items-center gap-2">
          <ShieldCheck className="h-5 w-5 text-[#b5a642]" />
          <h2 className="text-sm font-black uppercase text-white tracking-wider">File Readiness Dashboard</h2>
        </div>
        <p className="text-[10px] text-white/40 font-medium">
          Global underwriting queue &amp; checklist exceptions audit page for managers, admins, and brokers.
        </p>
      </div>

      {/* 2. READINESS KPI SUMMARY CARDS */}
      <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-7 gap-3">
        {[
          { id: "ready", label: "Ready Files", value: kpis.ready, color: "text-green-400", bg: "bg-green-500/5", border: "border-green-500/15" },
          { id: "blocked", label: "Blocked Files", value: kpis.blockedByChecklist, color: "text-red-400", bg: "bg-red-500/5", border: "border-red-500/15" },
          { id: "client", label: "Waiting Client", value: kpis.waitingOnClient, color: "text-amber-400", bg: "bg-amber-500/5", border: "border-amber-500/15" },
          { id: "review", label: "Awaiting Review", value: kpis.underReview, color: "text-blue-400", bg: "bg-blue-500/5", border: "border-blue-500/15" },
          { id: "stale", label: "Stale/Expired", value: kpis.staleExpired, color: "text-orange-400", bg: "bg-orange-500/5", border: "border-orange-500/15" },
          { id: "missing", label: "Missing Docs", value: kpis.missingCritical, color: "text-zinc-400", bg: "bg-zinc-500/5", border: "border-zinc-500/15" },
          { id: "compliance", label: "Compliance Issue", value: kpis.complianceIssues, color: "text-rose-400", bg: "bg-rose-500/5", border: "border-rose-500/15" }
        ].map(card => (
          <div key={card.id} className={`p-3 rounded-xl border ${card.bg} ${card.border} flex flex-col justify-between h-20 shadow-sm relative group hover:scale-[1.01] transition-transform`}>
            <span className="text-[9px] text-white/40 uppercase font-black tracking-wider">{card.label}</span>
            <div className="flex items-baseline justify-between mt-1">
              <span className={`text-2xl font-black ${card.color}`}>{card.value}</span>
            </div>
          </div>
        ))}
      </div>

      {/* 3. WORKSPACE: QUEUE & MANAGER SIDEBAR PANEL */}
      <div className="flex flex-col lg:flex-row gap-5 flex-grow overflow-hidden">
        
        {/* LEFT WORK QUEUE */}
        <div className="flex-1 bg-[#131317] border border-white/5 rounded-2xl flex flex-col overflow-hidden">
          
          {/* INTERACTIVE COMPREHENSIVE FILTERING BAR */}
          <div className="p-4 border-b border-white/5 bg-[#171720]/40 space-y-3">
            <div className="flex flex-col md:flex-row gap-3">
              {/* Search */}
              <div className="relative flex-1">
                <input 
                  type="text" 
                  placeholder="Search borrower name or folder ID..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full bg-[#111114] border border-white/5 text-xs rounded-lg pl-8 pr-3 py-2 text-white placeholder-white/20 focus:outline-none focus:border-[#b5a642] font-semibold"
                />
                <Search className="absolute left-2.5 top-2.5 h-3.5 w-3.5 text-white/30" />
              </div>

              {/* Broker select */}
              <div className="w-full md:w-44">
                <select 
                  value={brokerFilter}
                  onChange={(e) => setBrokerFilter(e.target.value)}
                  className="w-full bg-[#111114] border border-white/5 text-xs rounded-lg p-2 font-bold uppercase text-white/80 focus:outline-none cursor-pointer"
                >
                  <option value="all">All Brokers</option>
                  {agentNames.map(name => (
                    <option key={name} value={name}>{name}</option>
                  ))}
                </select>
              </div>

              {/* State Filter */}
              <div className="w-full md:w-44">
                <select 
                  value={stateFilter}
                  onChange={(e) => setStateFilter(e.target.value)}
                  className="w-full bg-[#111114] border border-white/5 text-xs rounded-lg p-2 font-bold uppercase text-white/80 focus:outline-none cursor-pointer"
                >
                  <option value="all">All States</option>
                  {Object.keys(stateStyling).map(state => (
                    <option key={state} value={state}>{state}</option>
                  ))}
                </select>
              </div>
            </div>

            <div className="flex flex-wrap gap-3 items-center justify-between text-[10px]">
              <div className="flex flex-wrap gap-3 items-center">
                {/* File Type */}
                <div className="flex items-center gap-1">
                  <span className="text-white/30 font-bold">Type:</span>
                  <select 
                    value={typeFilter} 
                    onChange={(e) => setTypeFilter(e.target.value)}
                    className="bg-[#111114] border border-white/5 text-[10px] rounded px-1.5 py-0.5 font-bold uppercase text-white/70"
                  >
                    <option value="all">All</option>
                    <option value="purchase">Purchase</option>
                    <option value="refinance">Refinance</option>
                    <option value="renewal">Renewal</option>
                    <option value="heloc">HELOC</option>
                  </select>
                </div>

                {/* Mortgage Stage */}
                <div className="flex items-center gap-1">
                  <span className="text-white/30 font-bold">Stage:</span>
                  <select 
                    value={stageFilter} 
                    onChange={(e) => setStageFilter(e.target.value)}
                    className="bg-[#111114] border border-white/5 text-[10px] rounded px-1.5 py-0.5 font-bold uppercase text-white/70"
                  >
                    <option value="all">All</option>
                    <option value="open">Open</option>
                    <option value="working">Working</option>
                    <option value="lender">Lender</option>
                    <option value="conditional">Conditional</option>
                    <option value="approved">Approved</option>
                    <option value="funded">Funded</option>
                    <option value="closed">Closed</option>
                  </select>
                </div>

                {/* Missing Items */}
                <div className="flex items-center gap-1">
                  <span className="text-white/30 font-bold">Missing Docs:</span>
                  <select 
                    value={missingFilter} 
                    onChange={(e) => setMissingFilter(e.target.value)}
                    className="bg-[#111114] border border-white/5 text-[10px] rounded px-1.5 py-0.5 font-bold uppercase text-white/70"
                  >
                    <option value="any">Any</option>
                    <option value="none">No missing</option>
                    <option value="1plus">1+ missing</option>
                    <option value="3plus">3+ missing</option>
                  </select>
                </div>

                {/* Update Date */}
                <div className="flex items-center gap-1">
                  <span className="text-white/30 font-bold">Updated:</span>
                  <select 
                    value={dateFilter} 
                    onChange={(e) => setDateFilter(e.target.value)}
                    className="bg-[#111114] border border-white/5 text-[10px] rounded px-1.5 py-0.5 font-bold uppercase text-white/70"
                  >
                    <option value="any">Any time</option>
                    <option value="today">Today</option>
                    <option value="week">Last 7 Days</option>
                    <option value="month">Last 30 Days</option>
                  </select>
                </div>
              </div>

              {/* Checkboxes */}
              <div className="flex gap-4">
                <label className="flex items-center gap-1.5 cursor-pointer hover:text-white transition-colors">
                  <input 
                    type="checkbox" 
                    checked={staleOnly} 
                    onChange={(e) => setStaleOnly(e.target.checked)}
                    className="rounded border-white/10 bg-black/40 text-[#b5a642] focus:ring-0 w-3 h-3 cursor-pointer"
                  />
                  <span className="font-bold text-white/50 text-[10px] uppercase">Stale / Expired Only</span>
                </label>

                <label className="flex items-center gap-1.5 cursor-pointer hover:text-white transition-colors">
                  <input 
                    type="checkbox" 
                    checked={complianceOnly} 
                    onChange={(e) => setComplianceOnly(e.target.checked)}
                    className="rounded border-white/10 bg-black/40 text-[#b5a642] focus:ring-0 w-3 h-3 cursor-pointer"
                  />
                  <span className="font-bold text-white/50 text-[10px] uppercase">Compliance Issues Only</span>
                </label>
              </div>
            </div>
          </div>

          {/* MAIN QUEUE TABLE */}
          <div className="flex-grow overflow-auto p-4">
            {filteredList.length === 0 ? (
              <div className="h-64 flex flex-col items-center justify-center text-center p-6 border border-dashed border-white/5 rounded-2xl bg-white/[0.01]">
                <AlertCircle className="h-8 w-8 text-[#b5a642]/40 mb-2" />
                <span className="text-xs text-white/50 font-bold">No portfolio files found matching the search and filter constraints.</span>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-left font-semibold border-collapse">
                  <thead>
                    <tr className="border-b border-white/5 text-[9px] text-white/30 uppercase tracking-widest pb-3">
                      <th className="pb-3 pr-3 font-black">Borrower</th>
                      <th className="pb-3 pr-3 font-black">Broker</th>
                      <th className="pb-3 pr-3 font-black">LTV &amp; Stage</th>
                      <th className="pb-3 pr-3 font-black">Readiness Score</th>
                      <th className="pb-3 pr-3 font-black">Underwriting Blocker Intelligence</th>
                      <th className="pb-3 pr-3 font-black">Flags &amp; updates</th>
                      <th className="pb-3 text-right font-black">Quick Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-white/[0.02]">
                    {filteredList.map((item) => {
                      const style = stateStyling[item.state] || stateStyling["Blocked"];
                      
                      // Calculate LTV
                      const prop = Number(item.client.propval || 0);
                      const loan = Number(item.client.mtgamt || 0);
                      const ltv = prop > 0 ? Math.round((loan / prop) * 100) : 0;

                      return (
                        <tr key={item.client.id} className="hover:bg-white/[0.01] transition-colors relative group">
                          {/* Borrower Column */}
                          <td className="py-3.5 pr-3">
                            <div className="flex items-center gap-2">
                              {item.isMarkedFollowUp && (
                                <span className="w-1.5 h-1.5 rounded-full bg-rose-500 animate-ping absolute left-1" title="High Priority Follow-Up" />
                              )}
                              <div>
                                <button 
                                  onClick={() => onOpenClient(item.client.id, "overview")}
                                  className="hover:text-[#b5a642] hover:underline font-black text-white/90 text-left text-xs"
                                >
                                  {item.client.first} {item.client.last}
                                </button>
                                <span className="block text-[8px] text-[#8e95a3] font-black uppercase mt-0.5">
                                  ID: {item.client.id} | {item.client.type || "Purchase"}
                                </span>
                              </div>
                            </div>
                          </td>

                          {/* Broker Column */}
                          <td className="py-3.5 pr-3 text-white/60 font-medium">
                            <div className="flex items-center gap-1.5">
                              <span>{item.client.agent || "Unassigned"}</span>
                              <button 
                                onClick={() => setAssigningClientId(item.client.id)}
                                className="text-white/20 hover:text-[#b5a642] p-1 rounded hover:bg-white/5 transition-all"
                                title="Reassign Broker"
                              >
                                <UserPlus className="h-3 w-3" />
                              </button>
                            </div>
                          </td>

                          {/* Stage Column */}
                          <td className="py-3.5 pr-3">
                            <div className="flex flex-col gap-0.5">
                              <span className="text-[10px] font-bold text-white/80 uppercase tracking-wider">
                                {item.client.status}
                              </span>
                              <span className="text-[8px] text-white/40 font-mono">
                                LTV: {ltv > 0 ? `${ltv}%` : "—"}
                              </span>
                            </div>
                          </td>

                          {/* Score Column */}
                          <td className="py-3.5 pr-3">
                            <div className="flex items-center gap-2">
                              {/* Circle percentage */}
                              <div className="relative w-8 h-8 flex items-center justify-center shrink-0">
                                <svg className="w-full h-full transform -rotate-90">
                                  <circle cx="16" cy="16" r="12" stroke="rgba(255,255,255,0.03)" strokeWidth="2.5" fill="transparent" />
                                  <circle cx="16" cy="16" r="12" stroke={item.score === 100 ? "#22c55e" : item.score >= 75 ? "#10b981" : "#ef4444"} strokeWidth="2.5" fill="transparent" 
                                    strokeDasharray={2 * Math.PI * 12}
                                    strokeDashoffset={2 * Math.PI * 12 * (1 - item.score / 100)}
                                  />
                                </svg>
                                <span className="absolute text-[8px] font-black font-mono text-white/90">{item.score}%</span>
                              </div>

                              <span className={`px-2 py-0.5 rounded-full text-[8px] font-black uppercase tracking-wider ${style.bg} ${style.border} ${style.text} flex items-center gap-1`}>
                                <span className={`w-1 h-1 rounded-full ${style.dot}`} />
                                {style.label}
                              </span>
                            </div>
                          </td>

                          {/* Blocker Column */}
                          <td className="py-3.5 pr-3 max-w-[200px]">
                            {item.state === "Ready" ? (
                              <span className="text-[9px] text-green-400 font-bold flex items-center gap-1">
                                <CheckCircle2 className="h-3 w-3 shrink-0" /> Ready to Submit
                              </span>
                            ) : (
                              <div className="flex flex-col gap-0.5">
                                <span className="text-[10px] text-white/80 font-semibold line-clamp-1">
                                  {item.primaryBlocker}
                                </span>
                                {item.blockers.length > 1 && (
                                  <span className="text-[8px] text-white/30 font-black uppercase tracking-wider">
                                    +{item.blockers.length - 1} other exceptions
                                  </span>
                                )}
                              </div>
                            )}
                          </td>

                          {/* Warnings & Update Column */}
                          <td className="py-3.5 pr-3">
                            <div className="flex flex-col gap-0.5">
                              <span className="text-white/40 font-mono text-[9px]">
                                {new Date(item.lastUpdated).toLocaleDateString("en-CA")}
                              </span>
                              <div className="flex gap-1.5 mt-0.5">
                                {item.staleExpiredCount > 0 && (
                                  <span className="bg-orange-500/10 border border-orange-500/15 text-orange-400 text-[8px] px-1 py-0.2 rounded font-mono font-bold" title="Stale Document Files">STALE</span>
                                )}
                                {item.complianceIssueCount > 0 && (
                                  <span className="bg-rose-500/10 border border-rose-500/15 text-rose-400 text-[8px] px-1 py-0.2 rounded font-mono font-bold" title="Compliance Issues Found">ERR</span>
                                )}
                              </div>
                            </div>
                          </td>

                          {/* Operations/Quick Actions */}
                          <td className="py-3.5 text-right">
                            <div className="flex items-center justify-end gap-1 relative">
                              <button 
                                onClick={() => onOpenClient(item.client.id, "overview")}
                                className="px-2 py-1 bg-white/5 hover:bg-white/10 rounded-lg text-[9px] font-black uppercase text-white/70 border border-white/5"
                                title="Open File Overview"
                              >
                                View
                              </button>
                              
                              <button 
                                onClick={() => onOpenClient(item.client.id, "documents")}
                                className="px-2 py-1 bg-[#b5a642]/10 border border-[#b5a642]/20 hover:bg-[#b5a642]/20 rounded-lg text-[9px] font-black uppercase text-[#b5a642]"
                                title="Open Detailed Document Vault"
                              >
                                Vault
                              </button>

                              <button 
                                onClick={() => onOpenClient(item.client.id, "checklist")}
                                className="px-2 py-1 bg-[#6fa3b8]/10 border border-[#6fa3b8]/20 hover:bg-[#6fa3b8]/20 rounded-lg text-[9px] font-black uppercase text-[#6fa3b8]"
                                title="View Compliance Checklist"
                              >
                                Rules
                              </button>

                              <button 
                                onClick={() => toggleFollowUp(item.client.id)}
                                className={`p-1 rounded-lg border transition-all ${
                                  item.isMarkedFollowUp 
                                    ? "bg-rose-500/20 text-rose-400 border-rose-500/30" 
                                    : "bg-white/2 text-white/30 border-white/5 hover:text-rose-400 hover:bg-rose-500/5 hover:border-rose-500/10"
                                }`}
                                title={item.isMarkedFollowUp ? "Remove follow-up priority" : "Mark as high-priority follow-up"}
                              >
                                📌
                              </button>

                              <button 
                                onClick={() => setReviewClientId(item.client.id)}
                                className="px-1.5 py-1 bg-zinc-500/10 hover:bg-zinc-500/20 text-zinc-300 rounded border border-zinc-500/15"
                                title="Log Manager Internal Review Action"
                              >
                                Review
                              </button>
                            </div>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            )}
          </div>

        </div>

        {/* RIGHT SIDEBAR: HIGH PRIORITY MANAGER WORKFLOWS */}
        <div className="w-full lg:w-72 bg-[#131317] border border-white/5 rounded-2xl p-4 flex flex-col gap-5 shrink-0 overflow-y-auto">
          <div>
            <h4 className="text-[10px] text-white/30 uppercase font-black tracking-widest">Manager Action Center</h4>
            <div className="h-0.5 bg-[#b5a642]/20 mt-1.5 rounded" />
          </div>

          {/* 1. REVIEW NEEDED ITEMS */}
          <div className="space-y-2.5">
            <span className="text-[9px] text-[#b5a642] uppercase font-black tracking-wider flex items-center gap-1">
              <Clock className="w-3.5 h-3.5" /> Awaiting Review ({sidebarWorkflow.reviewNeeded.length})
            </span>
            {sidebarWorkflow.reviewNeeded.length === 0 ? (
              <p className="text-[10px] text-white/30 italic">No files awaiting audit approval.</p>
            ) : (
              <div className="flex flex-col gap-2">
                {sidebarWorkflow.reviewNeeded.map(f => (
                  <div 
                    key={f.client.id}
                    onClick={() => onOpenClient(f.client.id, "documents")}
                    className="p-2.5 bg-blue-500/[0.02] hover:bg-blue-500/[0.06] border border-blue-500/10 rounded-xl cursor-pointer transition-all flex justify-between items-center group"
                  >
                    <div>
                      <h5 className="font-bold text-white group-hover:text-[#b5a642] text-[11px] truncate w-40">{f.client.first} {f.client.last}</h5>
                      <p className="text-[9px] text-[#8e95a3] mt-0.5 uppercase tracking-wide">Broker: {f.client.agent || "None"}</p>
                    </div>
                    <ChevronRight className="h-3.5 w-3.5 text-white/25 group-hover:text-white transition-all transform group-hover:translate-x-0.5" />
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* 2. URGENT MISSING DOCS FILES */}
          <div className="space-y-2.5">
            <span className="text-[9px] text-rose-400 uppercase font-black tracking-wider flex items-center gap-1">
              <AlertTriangle className="w-3.5 h-3.5 text-rose-400" /> Blocker Exceptions ({sidebarWorkflow.urgentMissing.length})
            </span>
            {sidebarWorkflow.urgentMissing.length === 0 ? (
              <p className="text-[10px] text-white/30 italic">All files meet criteria.</p>
            ) : (
              <div className="flex flex-col gap-2">
                {sidebarWorkflow.urgentMissing.map(f => (
                  <div 
                    key={f.client.id}
                    onClick={() => onOpenClient(f.client.id, "checklist")}
                    className="p-2.5 bg-rose-500/[0.01] hover:bg-rose-500/[0.04] border border-rose-500/10 rounded-xl cursor-pointer transition-all flex justify-between items-center group"
                  >
                    <div>
                      <h5 className="font-bold text-white group-hover:text-[#b5a642] text-[11px] truncate w-40">{f.client.first} {f.client.last}</h5>
                      <p className="text-[9px] text-rose-300 font-mono mt-0.5 uppercase tracking-wide">{f.missingCount} Missing Checklist Items</p>
                    </div>
                    <ChevronRight className="h-3.5 w-3.5 text-white/25 group-hover:text-white transition-all transform group-hover:translate-x-0.5" />
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* 3. STALE OR EXPIRED RECORDS */}
          <div className="space-y-2.5">
            <span className="text-[9px] text-orange-400 uppercase font-black tracking-wider flex items-center gap-1">
              <RefreshCw className="w-3 h-3 text-orange-400" /> Stale / Outdated Docs ({sidebarWorkflow.staleFiles.length})
            </span>
            {sidebarWorkflow.staleFiles.length === 0 ? (
              <p className="text-[10px] text-white/30 italic">No stale files found.</p>
            ) : (
              <div className="flex flex-col gap-2">
                {sidebarWorkflow.staleFiles.map(f => (
                  <div 
                    key={f.client.id}
                    onClick={() => onOpenClient(f.client.id, "documents")}
                    className="p-2.5 bg-orange-500/[0.01] hover:bg-orange-500/[0.04] border border-orange-500/10 rounded-xl cursor-pointer transition-all flex justify-between items-center group"
                  >
                    <div>
                      <h5 className="font-bold text-white group-hover:text-[#b5a642] text-[11px] truncate w-40">{f.client.first} {f.client.last}</h5>
                      <p className="text-[9px] text-orange-300 font-mono mt-0.5 uppercase tracking-wide">{f.staleExpiredCount} Outdated Records</p>
                    </div>
                    <ChevronRight className="h-3.5 w-3.5 text-white/25 group-hover:text-white transition-all transform group-hover:translate-x-0.5" />
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* 4. RECENT ACTIVITY MONITOR */}
          <div className="space-y-2.5 pt-2 border-t border-white/5">
            <span className="text-[9px] text-white/40 uppercase font-black tracking-wider flex items-center gap-1">
              <Activity className="w-3.5 h-3.5" /> Recently Updated Files
            </span>
            <div className="flex flex-col gap-2">
              {sidebarWorkflow.recentlyUpdated.map(f => (
                <div 
                  key={f.client.id}
                  onClick={() => onOpenClient(f.client.id, "overview")}
                  className="p-2 bg-white/[0.01] hover:bg-white/[0.03] border border-white/5 rounded-xl cursor-pointer transition-all flex justify-between items-center group"
                >
                  <div className="min-w-0 flex-1">
                    <h5 className="font-semibold text-white/80 group-hover:text-white text-[10.5px] truncate">{f.client.first} {f.client.last}</h5>
                    <div className="flex items-center gap-2 mt-0.5">
                      <span className="text-[8px] text-white/30 font-mono">{new Date(f.lastUpdated).toLocaleDateString("en-CA")}</span>
                      <span className="text-[8.5px] font-black uppercase text-[#b5a642]">{f.score}% ready</span>
                    </div>
                  </div>
                  <ArrowRight className="h-3 w-3 text-white/20 group-hover:text-white transition-all transform group-hover:translate-x-0.5 shrink-0" />
                </div>
              ))}
            </div>
          </div>

        </div>

      </div>

      {/* --- QUICK MODAL: REASSIGN BROKER AGENT --- */}
      {assigningClientId && (
        <div className="fixed inset-0 bg-black/85 z-50 flex items-center justify-center p-4 backdrop-blur-sm animate-fade-in">
          <div className="bg-[#131317] border border-white/5 rounded-2xl w-full max-w-sm p-5 shadow-2xl relative">
            <button 
              onClick={() => setAssigningClientId(null)}
              className="absolute right-4 top-4 text-white/40 hover:text-white p-1 rounded bg-white/5"
            >
              <X className="h-4 w-4" />
            </button>

            <h3 className="text-xs font-black uppercase text-[#b5a642] tracking-widest mb-4 border-b border-white/5 pb-2">
              Assign Broker to File
            </h3>

            <div className="space-y-2">
              {agentNames.map(name => (
                <button
                  key={name}
                  onClick={() => handleAssignBroker(assigningClientId, name)}
                  className="w-full text-left bg-white/[0.02] hover:bg-white/[0.05] border border-white/5 p-2.5 rounded-lg text-white font-bold text-xs uppercase flex items-center justify-between transition-colors"
                >
                  <span>{name}</span>
                  <ChevronRight className="h-3.5 w-3.5 text-white/40" />
                </button>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* --- QUICK MODAL: LOG INTERNAL REVIEW ACTION --- */}
      {reviewClientId && (
        <div className="fixed inset-0 bg-black/85 z-50 flex items-center justify-center p-4 backdrop-blur-sm animate-fade-in">
          <div className="bg-[#131317] border border-white/5 rounded-2xl w-full max-w-md p-6 shadow-2xl relative">
            <button 
              onClick={() => setReviewClientId(null)}
              className="absolute right-4 top-4 text-white/40 hover:text-white p-1 rounded bg-white/5"
            >
              <X className="h-4 w-4" />
            </button>

            <h3 className="text-xs font-black uppercase text-[#b5a642] tracking-widest mb-4 border-b border-white/5 pb-2">
              Log Manager Internal Review Action
            </h3>

            <form onSubmit={submitInternalReview} className="space-y-4">
              <div className="space-y-1.5">
                <label className="block text-[9px] text-white/40 font-bold uppercase tracking-wider">Operational Action</label>
                <div className="grid grid-cols-2 gap-2">
                  {[
                    { id: "approve", label: "Approve File" },
                    { id: "reject", label: "Reject File" },
                    { id: "flag", label: "Place Warning Flag" },
                    { id: "note", label: "Add General Note" }
                  ].map(act => (
                    <button
                      key={act.id}
                      type="button"
                      onClick={() => setReviewAction(act.id as any)}
                      className={`py-2 rounded-lg text-[10px] font-black uppercase border text-center transition-colors ${
                        reviewAction === act.id 
                          ? "bg-[#b5a642] text-black border-[#b5a642]" 
                          : "bg-white/[0.01] border-white/5 text-white/60 hover:bg-white/5"
                      }`}
                    >
                      {act.label}
                    </button>
                  ))}
                </div>
              </div>

              <div className="space-y-1.5">
                <label className="block text-[9px] text-white/40 font-bold uppercase tracking-wider">Internal Review Log Notes</label>
                <textarea 
                  value={reviewNotes}
                  onChange={(e) => setReviewNotes(e.target.value)}
                  placeholder="Specify review findings, checklists approved, or rejection details..."
                  className="w-full bg-[#111114] border border-white/5 text-xs rounded-lg p-2.5 text-white placeholder-white/20 h-24 focus:outline-none focus:border-[#b5a642] font-semibold"
                  required={reviewAction !== "approve"}
                />
              </div>

              <button 
                type="submit"
                className="w-full bg-[#b5a642] text-black font-black uppercase text-xs tracking-widest py-3 rounded-lg hover:bg-[#9a8c38] transition-colors flex items-center justify-center gap-1.5"
              >
                ✓ Register Review Action
              </button>
            </form>
          </div>
        </div>
      )}

    </div>
  );
};
