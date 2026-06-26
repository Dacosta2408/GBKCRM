import React, { useState, useMemo } from "react";
import { 
  ShieldCheck, ShieldAlert, FileText, Clock, Search, Filter, 
  Download, Eye, Edit3, Lock, CheckCircle, AlertTriangle, 
  FileSpreadsheet, Sparkles, User, RefreshCw, X, Shield, 
  Layers, Database, ArrowRight, Check, AlertCircle, Info,
  CheckSquare, Activity
} from "lucide-react";
import { Client, Task, User as SystemUser } from "../types";

interface ComplianceProps {
  clients: Client[];
  setClients: React.Dispatch<React.SetStateAction<Client[]>>;
  tasks: Task[];
  setTasks: React.Dispatch<React.SetStateAction<Task[]>>;
  userRoster: SystemUser[];
  currentUser: SystemUser;
  auditLogs: any[];
  setAuditLogs: React.Dispatch<React.SetStateAction<any[]>>;
  docVault: Record<string, any>;
  setDocVault: React.Dispatch<React.SetStateAction<Record<string, any>>>;
  sessionAutoLock: boolean;
  setAutoLockEnabled: (val: boolean) => void;
  autoLockMinutes: number;
  setAutoLockMinutes: (val: number) => void;
  auditLoggingEnabled: boolean;
  setAuditLogEnabled: (val: boolean) => void;
  onLockApp: () => void;
  showToast: (msg: string, type?: "success" | "error" | "info" | "warning", icon?: string) => void;
}

type ComplianceTab = "checklist" | "timeline" | "security" | "exceptions";

export const Compliance: React.FC<ComplianceProps> = ({
  clients,
  setClients,
  tasks,
  setTasks,
  userRoster,
  currentUser,
  auditLogs,
  setAuditLogs,
  docVault,
  setDocVault,
  sessionAutoLock,
  setAutoLockEnabled,
  autoLockMinutes,
  setAutoLockMinutes,
  auditLoggingEnabled,
  setAuditLogEnabled,
  onLockApp,
  showToast
}) => {
  const [activeTab, setActiveTab] = useState<ComplianceTab>("checklist");
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedAgent, setSelectedAgent] = useState("All");
  
  // Timeline filters
  const [timelineSearch, setTimelineSearch] = useState("");
  const [timelineActionFilter, setTimelineActionFilter] = useState("All");

  // Selection states for detail modals
  const [selectedClient, setSelectedClient] = useState<Client | null>(null);
  const [showExportModal, setShowExportModal] = useState(false);
  const [newComplianceNote, setNewComplianceNote] = useState("");

  // Check permissions: Owner/Admin see all, brokers see their own.
  const isPrivileged = useMemo(() => {
    return ["Owner / Master Admin", "Super Admin", "Senior Broker", "IT / Developer"].includes(currentUser.role);
  }, [currentUser]);

  const activeAgentFilter = useMemo(() => {
    if (!isPrivileged) {
      return `${currentUser.first} ${currentUser.last}`;
    }
    return selectedAgent;
  }, [isPrivileged, currentUser, selectedAgent]);

  // Standard required documents list
  const REQUIRED_DOC_TYPES = [
    { id: "photo_id", label: "Govt Photo ID (Driver's / Passport)", req: true },
    { id: "paystubs", label: "Stated Job Pay Stubs (last 3)", req: true },
    { id: "t4_current", label: "T4 Slip — Current Fiscal Year", req: true },
    { id: "noa_current", label: "Notice of Assessment (NOA)", req: true },
    { id: "emp_letter", label: "Letter of Employment (Signed/Dated)", req: true },
    { id: "bank_chq", label: "90-Day Bank transaction ledger", req: true }
  ];

  // Utility to check status of documents for a client
  const getClientDocStats = (clientId: string) => {
    const clientDocs = docVault[clientId] || {};
    let requiredCount = 0;
    let receivedCount = 0;
    let verifiedCount = 0;

    REQUIRED_DOC_TYPES.forEach(doc => {
      const state = clientDocs[doc.id] || { status: doc.req ? "required" : "na" };
      if (doc.req) {
        requiredCount++;
        if (state.status === "received") {
          receivedCount++;
        } else if (state.status === "verified") {
          receivedCount++;
          verifiedCount++;
        }
      }
    });

    const isComplete = receivedCount === requiredCount;
    const isVerified = verifiedCount === requiredCount;

    return {
      totalRequired: requiredCount,
      totalReceived: receivedCount,
      totalVerified: verifiedCount,
      isComplete,
      isVerified,
      percent: requiredCount > 0 ? Math.round((receivedCount / requiredCount) * 100) : 0
    };
  };

  // Helper to check SIN masking compliance
  const formatSinValue = (sin?: string) => {
    if (!sin) return "Not Entered";
    const cleaned = sin.replace(/\D/g, "");
    if (cleaned.length === 9) {
      return `XXX-XXX-${cleaned.slice(5)}`;
    }
    return sin.length > 4 ? `*...* ${sin.slice(-4)}` : "Masked File";
  };

  // Filter clients for compliance monitoring
  const clientComplianceList = useMemo(() => {
    return clients.filter(c => {
      const owner = c.retentionOwner || (c.source && c.source.toLowerCase().includes("brown") ? "Jeff Brown" : "David Acosta");
      const matchesAgent = activeAgentFilter === "All" || owner.toLowerCase() === activeAgentFilter.toLowerCase();
      
      if (!matchesAgent) return false;

      const s = searchTerm.toLowerCase();
      return (
        c.first.toLowerCase().includes(s) ||
        c.last.toLowerCase().includes(s) ||
        (c.email && c.email.toLowerCase().includes(s)) ||
        (c.lender && c.lender.toLowerCase().includes(s)) ||
        (c.status && c.status.toLowerCase().includes(s))
      );
    });
  }, [clients, activeAgentFilter, searchTerm]);

  // Expose exceptions radar
  const complianceExceptions = useMemo(() => {
    const now = new Date();
    const anomalies: {
      clientId: string;
      clientName: string;
      agent: string;
      type: "missing_docs" | "stagnation" | "no_communication" | "ai_unconfirmed" | "financials_incomplete";
      severity: "high" | "medium" | "low";
      description: string;
      actionable: string;
    }[] = [];

    clients.forEach(c => {
      const owner = c.retentionOwner || (c.source && c.source.toLowerCase().includes("brown") ? "Jeff Brown" : "David Acosta");
      const docStats = getClientDocStats(c.id);

      // Exception 1: In lender status but missing key documents
      if ((c.status === "lender" || c.status === "conditional") && docStats.totalReceived < docStats.totalRequired) {
        anomalies.push({
          clientId: c.id,
          clientName: `${c.first} ${c.last}`,
          agent: owner,
          type: "missing_docs",
          severity: "high",
          description: `Active folder sitting in ${c.status.toUpperCase()} stage but missing ${docStats.totalRequired - docStats.totalReceived} mandatory underwriting files.`,
          actionable: "Open Client documents tab and upload missing PDF verification files."
        });
      }

      // Exception 2: Folder stagnation (sitting in stage too long without updates)
      const lastUpdateStr = c.updatedAt || c.createdAt;
      const daysInStage = Math.ceil((now.getTime() - new Date(lastUpdateStr).getTime()) / (24 * 3600000));
      if (daysInStage > 30 && ["open", "working", "conditional", "lender"].includes(c.status)) {
        anomalies.push({
          clientId: c.id,
          clientName: `${c.first} ${c.last}`,
          agent: owner,
          type: "stagnation",
          severity: "medium",
          description: `Folder sitting inactive in "${c.status.toUpperCase()}" status for ${daysInStage} consecutive days without workflow change.`,
          actionable: "Audit files pipeline. Update lender comments, or advance status to clear backlog."
        });
      }

      // Exception 3: Quiet relationship (no recorded follow-up in 90 days for funded clients)
      const lastTouchStr = c.lastContactedDate || c.updatedAt || c.createdAt;
      const daysSinceTouch = Math.ceil((now.getTime() - new Date(lastTouchStr).getTime()) / (24 * 3600000));
      if (daysSinceTouch > 90 && c.status === "funded") {
        anomalies.push({
          clientId: c.id,
          clientName: `${c.first} ${c.last}`,
          agent: owner,
          type: "no_communication",
          severity: "low",
          description: `Post-close client has zero noted outreach logs for ${daysSinceTouch} days since file funding.`,
          actionable: "Trigger CRM Birthday or Mortgage Anniversary retention check-in template."
        });
      }

      // Exception 4: Incomplete core data on newly opened files
      const hasCrucialData = c.email && c.dob && c.income;
      if (!hasCrucialData && ["open", "working"].includes(c.status)) {
        anomalies.push({
          clientId: c.id,
          clientName: `${c.first} ${c.last}`,
          agent: owner,
          type: "financials_incomplete",
          severity: "medium",
          description: `Core KYC parameters missing (such as DOB, validated income streams, or verified co-signer profiles).`,
          actionable: "Conduct formal client interview to complete GDS/TDS safety benchmarks."
        });
      }

      // Exception 5: AI Summaries lacking human broker confirmation
      if (c.aiSummary && (!c.appData || !c.appData.aiConfirmed)) {
        anomalies.push({
          clientId: c.id,
          clientName: `${c.first} ${c.last}`,
          agent: owner,
          type: "ai_unconfirmed",
          severity: "low",
          description: "AI-generated intake report is active but has not received human broker compliance validation.",
          actionable: "Open file, review AI-synthesized report parameters, and click Confirm Compliance Checklist."
        });
      }
    });

    return anomalies;
  }, [clients, docVault]);

  // Overall metric calculations
  const metrics = useMemo(() => {
    const totalCount = clients.length;
    let cleanCount = 0;
    let attentionCount = 0;
    let riskCount = 0;

    clients.forEach(c => {
      const docStats = getClientDocStats(c.id);
      const isMissingCritical = (c.status === "lender" || c.status === "conditional") && docStats.totalReceived < 4;
      const daysSinceTouch = c.lastContactedDate 
        ? Math.ceil((new Date().getTime() - new Date(c.lastContactedDate).getTime()) / (24 * 3600000)) 
        : 100;

      if (isMissingCritical || (c.status === "funded" && daysSinceTouch > 180)) {
        riskCount++;
      } else if (docStats.totalReceived < docStats.totalRequired || !c.dob || !c.email) {
        attentionCount++;
      } else {
        cleanCount++;
      }
    });

    const cleanPct = totalCount > 0 ? Math.round((cleanCount / totalCount) * 100) : 100;

    // Filtered timeline count for the active user
    const totalViews = auditLogs.filter(log => log.action.toLowerCase().includes("view")).length;
    const totalSensitive = auditLogs.filter(log => 
      log.action.toLowerCase().includes("sin") || 
      log.action.toLowerCase().includes("export") ||
      log.action.toLowerCase().includes("credentials")
    ).length;

    return {
      totalClients: totalCount,
      cleanCount,
      attentionCount,
      riskCount,
      cleanPct,
      totalViews,
      totalSensitive,
      exceptionsCount: complianceExceptions.length
    };
  }, [clients, docVault, auditLogs, complianceExceptions]);

  // Handler to log compliance audit notes
  const handleAddComplianceNote = () => {
    if (!selectedClient || !newComplianceNote.trim()) return;

    const formattedTime = new Date().toLocaleString();
    const updatedClients = clients.map(c => {
      if (c.id === selectedClient.id) {
        const currentNotes = c.retentionNotes || "";
        return {
          ...c,
          retentionNotes: currentNotes 
            ? `${currentNotes}\n[Compliance - ${formattedTime}]: ${newComplianceNote}`
            : `[Compliance - ${formattedTime}]: ${newComplianceNote}`,
          updatedAt: new Date().toISOString()
        };
      }
      return c;
    });

    setClients(updatedClients);
    
    // Log in Audit Logs
    const logItem = {
      user: `${currentUser.first} ${currentUser.last}`,
      action: "Logged compliance note",
      target: `${selectedClient.first} ${selectedClient.last}`,
      time: new Date().toISOString()
    };
    setAuditLogs(prev => [logItem, ...prev]);

    showToast(`Compliance note registered for ${selectedClient.first}!`, "success");
    setNewComplianceNote("");
  };

  // Human Confirmation of AI summaries
  const handleConfirmAiSummary = (clientId: string) => {
    const updated = clients.map(c => {
      if (c.id === clientId) {
        return {
          ...c,
          appData: {
            ...(c.appData || {}),
            aiConfirmed: "true",
            aiConfirmedBy: `${currentUser.first} ${currentUser.last}`,
            aiConfirmedAt: new Date().toISOString()
          }
        };
      }
      return c;
    });
    setClients(updated);

    const logItem = {
      user: `${currentUser.first} ${currentUser.last}`,
      action: "Confirmed AI report compliance",
      target: clientId,
      time: new Date().toISOString()
    };
    setAuditLogs(prev => [logItem, ...prev]);

    showToast("AI Intake summary successfully certified and locked.", "success");
  };

  // CSV Audit log exporter
  const generateCsvReport = () => {
    let csv = "Timestamp,User,Action,Target Client/Resource\n";
    auditLogs.forEach(log => {
      csv += `"${log.time}","${log.user}","${log.action}","${log.target}"\n`;
    });
    return csv;
  };

  // Individual Document Status Modifier inside checklist expander
  const handleUpdateDocStatusChecklist = (clientId: string, docId: string, status: string) => {
    const clientDocs = docVault[clientId] || {};
    const updatedDocs = {
      ...clientDocs,
      [docId]: {
        ...(clientDocs[docId] || {}),
        status,
        path: clientDocs[docId]?.path || `Status updated via compliance checklist to ${status}`
      }
    };
    setDocVault(prev => ({
      ...prev,
      [clientId]: updatedDocs
    }));

    // Audit log
    const logItem = {
      user: `${currentUser.first} ${currentUser.last}`,
      action: `Set doc ${docId} status to ${status}`,
      target: clientId,
      time: new Date().toISOString()
    };
    setAuditLogs(prev => [logItem, ...prev]);

    showToast(`Updated document status to ${status.toUpperCase()}`, "info");
  };

  // Filtered Audit logs for the search table
  const filteredAuditLogs = useMemo(() => {
    return auditLogs.filter(log => {
      const s = timelineSearch.toLowerCase();
      const matchesSearch = 
        log.user.toLowerCase().includes(s) || 
        log.action.toLowerCase().includes(s) || 
        log.target.toLowerCase().includes(s);

      if (timelineActionFilter === "All") return matchesSearch;
      if (timelineActionFilter === "sensitive") {
        return matchesSearch && (
          log.action.toLowerCase().includes("sin") ||
          log.action.toLowerCase().includes("export") ||
          log.action.toLowerCase().includes("login") ||
          log.action.toLowerCase().includes("unlock")
        );
      }
      if (timelineActionFilter === "documents") {
        return matchesSearch && log.action.toLowerCase().includes("doc");
      }
      if (timelineActionFilter === "view") {
        return matchesSearch && log.action.toLowerCase().includes("view");
      }
      return matchesSearch;
    });
  }, [auditLogs, timelineSearch, timelineActionFilter]);

  return (
    <div className="flex flex-col h-full bg-[#0c0c0e] text-[#eeeef2] overflow-hidden font-sans" id="compliance-module-root">
      
      {/* Central Header */}
      <div className="bg-[#111115] border-b border-white/5 p-4 shrink-0 flex flex-col md:flex-row justify-between items-start md:items-center gap-4" id="compliance-header">
        <div>
          <h2 className="text-sm font-black uppercase text-[#b5a642] tracking-widest flex items-center gap-1.5">
            <Shield className="h-4 w-4 text-[#b5a642]" /> CRM COMPLIANCE &amp; OVERSIGHT CENTRAL
          </h2>
          <p className="text-[10px] text-white/40 font-semibold mt-0.5">Risk control, user accountability timeline, SIN masking audits, and process quality checkrooms</p>
        </div>

        {/* Filters */}
        <div className="flex items-center flex-wrap gap-2.5">
          {isPrivileged ? (
            <div className="flex items-center gap-1.5 bg-[#16161c] border border-white/5 px-2 py-1 rounded-lg text-xs">
              <Filter className="h-3 w-3 text-[#b5a642]" />
              <select
                value={selectedAgent}
                onChange={(e) => setSelectedAgent(e.target.value)}
                className="bg-transparent border-none text-[11px] text-white focus:outline-none font-bold"
              >
                <option value="All">All Broker ledgers</option>
                {userRoster.map(u => (
                  <option key={u.id} value={`${u.first} ${u.last}`}>{u.first} {u.last}</option>
                ))}
              </select>
            </div>
          ) : (
            <div className="bg-[#b5a642]/10 border border-[#b5a642]/20 text-[10px] text-[#b5a642] font-black uppercase px-2.5 py-1.5 rounded-lg flex items-center gap-1.5">
              <ShieldAlert className="h-3.5 w-3.5" /> PERSONAL COMPLIANCE SCREEN
            </div>
          )}

          {activeTab === "checklist" && (
            <div className="relative bg-[#16161c] border border-white/5 rounded-lg px-2.5 py-1 flex items-center w-48 sm:w-60">
              <Search className="h-3.5 w-3.5 text-white/30 shrink-0 mr-1.5" />
              <input
                type="text"
                placeholder="Search file checklists..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="bg-transparent border-none text-[11px] text-white focus:outline-none w-full font-semibold"
              />
            </div>
          )}
        </div>
      </div>

      {/* Metric Stats Banner */}
      <div className="bg-[#131318] px-6 py-4 border-b border-white/[0.03] grid grid-cols-2 md:grid-cols-4 gap-4 shrink-0" id="compliance-metrics">
        <div className="bg-[#16161c]/80 border border-white/5 rounded-xl p-3 text-left">
          <div className="flex justify-between items-center text-white/40">
            <span className="text-[9px] uppercase font-black tracking-wider">File Cleanliness Index</span>
            <span className="text-[#b5a642] font-bold text-xs">★</span>
          </div>
          <span className="text-xl font-black block mt-1 text-white">{metrics.cleanPct}%</span>
          <span className="text-[8px] text-white/40 block mt-0.5">
            {metrics.cleanCount} of {metrics.totalClients} folders certified ready
          </span>
        </div>

        <div className="bg-[#16161c]/80 border border-white/5 rounded-xl p-3 text-left">
          <div className="flex justify-between items-center text-white/40">
            <span className="text-[9px] uppercase font-black tracking-wider">Process Gaps Radar</span>
            <span className="text-red-400 font-bold text-xs">⚠️</span>
          </div>
          <span className="text-xl font-black block mt-1 text-red-400 font-mono">{metrics.exceptionsCount}</span>
          <span className="text-[8px] text-white/40 block mt-0.5">
            Files needing manual audit confirmation
          </span>
        </div>

        <div className="bg-[#16161c]/80 border border-white/5 rounded-xl p-3 text-left">
          <div className="flex justify-between items-center text-white/40">
            <span className="text-[9px] uppercase font-black tracking-wider">Sensitive Field Accesses</span>
            <span className="text-amber-300 font-bold text-xs">🛡️</span>
          </div>
          <span className="text-xl font-black block mt-1 text-amber-300 font-mono">{metrics.totalSensitive}</span>
          <span className="text-[8px] text-white/40 block mt-0.5">
            SIN, settings, and credential requests audited
          </span>
        </div>

        <div className="bg-[#16161c]/80 border border-white/5 rounded-xl p-3 text-left">
          <div className="flex justify-between items-center text-white/40">
            <span className="text-[9px] uppercase font-black tracking-wider">Audit timeline Volume</span>
            <span className="text-emerald-400 font-bold text-xs">📈</span>
          </div>
          <span className="text-xl font-black block mt-1 text-emerald-400 font-mono">{auditLogs.length}</span>
          <span className="text-[8px] text-white/40 block mt-0.5">
            Immutable process steps logged to date
          </span>
        </div>
      </div>

      {/* Tab Selectors */}
      <div className="bg-[#111114] border-b border-white/5 px-6 py-2 shrink-0 flex items-center justify-between" id="compliance-tab-bar">
        <div className="flex items-center gap-1">
          <button
            onClick={() => setActiveTab("checklist")}
            className={`px-4 py-2 rounded-lg text-xs font-bold transition-all flex items-center gap-2 ${
              activeTab === "checklist" ? "bg-white/5 text-[#b5a642] border border-white/5" : "text-white/40 hover:text-white/80"
            }`}
          >
            <CheckSquare className="h-3.5 w-3.5" /> File Checklists &amp; Audit
          </button>
          <button
            onClick={() => setActiveTab("exceptions")}
            className={`px-4 py-2 rounded-lg text-xs font-bold transition-all flex items-center gap-2 relative ${
              activeTab === "exceptions" ? "bg-white/5 text-[#b5a642] border border-white/5" : "text-white/40 hover:text-white/80"
            }`}
          >
            <AlertCircle className="h-3.5 w-3.5" /> Exceptions Radar
            {metrics.exceptionsCount > 0 && (
              <span className="absolute -top-1 -right-1 bg-red-500 text-black text-[8px] font-black w-4.5 h-4.5 rounded-full flex items-center justify-center">
                {metrics.exceptionsCount}
              </span>
            )}
          </button>
          <button
            onClick={() => setActiveTab("timeline")}
            className={`px-4 py-2 rounded-lg text-xs font-bold transition-all flex items-center gap-2 ${
              activeTab === "timeline" ? "bg-white/5 text-[#b5a642] border border-white/5" : "text-white/40 hover:text-white/80"
            }`}
          >
            <Activity className="h-3.5 w-3.5" /> Audit log Timeline
          </button>
          <button
            onClick={() => setActiveTab("security")}
            className={`px-4 py-2 rounded-lg text-xs font-bold transition-all flex items-center gap-2 ${
              activeTab === "security" ? "bg-white/5 text-[#b5a642] border border-white/5" : "text-white/40 hover:text-white/80"
            }`}
          >
            <Lock className="h-3.5 w-3.5" /> Security &amp; SIN Access
          </button>
        </div>

        <button
          onClick={() => {
            onLockApp();
            showToast("Workstation workstation locked instantly for compliance security.", "info");
          }}
          className="bg-red-500/10 hover:bg-red-500/20 text-red-400 border border-red-500/20 text-[10px] font-black uppercase px-3 py-1.5 rounded-lg flex items-center gap-1 transition-all"
        >
          <Lock className="h-3 w-3" /> Emergency Lock
        </button>
      </div>

      {/* Content Canvas */}
      <div className="flex-1 overflow-y-auto p-6">
        
        {/* CHECKLISTS AND READINESS RADAR */}
        {activeTab === "checklist" && (
          <div className="space-y-6">
            <div className="bg-[#16161c]/45 border border-white/5 rounded-xl p-4 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
              <div className="text-xs">
                <span className="text-[#b5a642] font-black uppercase tracking-wider block">🛡️ Client File Cleanliness Verification Engine</span>
                <span className="text-white/40 block mt-0.5 font-semibold">
                  Review mandatory document collections, verify GDS/TDS parameters, log clearance decisions, and mark files as "Broker Audit-Ready".
                </span>
              </div>
            </div>

            <div className="bg-[#121216] border border-white/5 rounded-2xl overflow-hidden">
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs font-semibold">
                  <thead className="bg-[#16161c] text-white/40 uppercase text-[9px] tracking-wider border-b border-white/5">
                    <tr>
                      <th className="p-4">Borrower Name</th>
                      <th className="p-4">Assigned Broker</th>
                      <th className="p-4">Pipeline Stage</th>
                      <th className="p-4">Income / debt</th>
                      <th className="p-4">Doc Checklist</th>
                      <th className="p-4">Verification Score</th>
                      <th className="p-4 text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-white/[0.03]">
                    {clientComplianceList.map(c => {
                      const docStats = getClientDocStats(c.id);
                      const owner = c.retentionOwner || (c.source && c.source.toLowerCase().includes("brown") ? "Jeff Brown" : "David Acosta");
                      const verifiedScore = Math.round((docStats.totalVerified / docStats.totalRequired) * 100);

                      let indexColor = "text-emerald-400 bg-emerald-500/10 border-emerald-500/20";
                      let label = "CLEAN & COHERENT";
                      if (docStats.totalReceived < 3) {
                        indexColor = "text-red-400 bg-red-500/10 border-red-500/20";
                        label = "CRITICAL COMPLIANCE RISK";
                      } else if (docStats.totalReceived < docStats.totalRequired) {
                        indexColor = "text-amber-400 bg-amber-500/10 border-amber-500/20";
                        label = "ATTENTION NEEDED";
                      }

                      return (
                        <React.Fragment key={c.id}>
                          <tr className="hover:bg-white/[0.02] transition-colors">
                            <td className="p-4">
                              <div className="text-white font-bold">{c.first} {c.last}</div>
                              <div className="text-[10px] text-white/30 truncate max-w-[180px] mt-0.5">{c.addr || "No registered address"}</div>
                            </td>
                            <td className="p-4 text-white/70 font-semibold">{owner}</td>
                            <td className="p-4">
                              <span className="bg-white/5 text-white/60 text-[9px] font-black uppercase px-2 py-0.5 rounded border border-white/5">
                                {c.status.toUpperCase()}
                              </span>
                            </td>
                            <td className="p-4">
                              <div className="text-white">${Number(c.income || 0).toLocaleString()}/yr</div>
                              <div className="text-[10px] text-white/30 mt-0.5">Debts: ${Number(c.debts || 0).toLocaleString()}</div>
                            </td>
                            <td className="p-4">
                              <div className="flex items-center gap-1.5">
                                <span className="text-white font-mono">{docStats.totalReceived}/{docStats.totalRequired}</span>
                                <div className="w-16 bg-white/5 h-1.5 rounded-full overflow-hidden">
                                  <div className="bg-[#b5a642] h-full" style={{ width: `${docStats.percent}%` }} />
                                </div>
                              </div>
                            </td>
                            <td className="p-4">
                              <span className={`px-2 py-1 rounded-full text-[9px] border font-black uppercase ${indexColor}`}>
                                {label} ({verifiedScore}% verified)
                              </span>
                            </td>
                            <td className="p-4 text-right">
                              <button
                                onClick={() => setSelectedClient(selectedClient?.id === c.id ? null : c)}
                                className="px-3 py-1.5 bg-[#b5a642]/10 hover:bg-[#b5a642]/20 border border-[#b5a642]/20 text-[#b5a642] rounded-lg text-[10px] font-black uppercase transition-all"
                              >
                                {selectedClient?.id === c.id ? "Close Audit" : "Audit File"}
                              </button>
                            </td>
                          </tr>

                          {/* Nested compliance client detail audit card */}
                          {selectedClient?.id === c.id && (
                            <tr>
                              <td colSpan={7} className="bg-[#141419]/90 p-6 border-y border-white/5">
                                <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 text-xs font-semibold">
                                  
                                  {/* Left col: documents checklist */}
                                  <div>
                                    <h4 className="text-[10px] text-white/30 uppercase font-black tracking-widest mb-3 flex items-center gap-1">
                                      <FileText className="h-3.5 w-3.5 text-[#b5a642]" /> Required Document Audit
                                    </h4>
                                    <div className="space-y-2 max-h-72 overflow-y-auto pr-1">
                                      {REQUIRED_DOC_TYPES.map(doc => {
                                        const state = (docVault[c.id] || {})[doc.id] || { status: doc.req ? "required" : "na" };
                                        return (
                                          <div key={doc.id} className="p-2.5 bg-[#17171e] rounded-lg border border-white/5 flex items-center justify-between gap-2">
                                            <div className="min-w-0 flex-1">
                                              <div className="text-white/80 font-bold truncate">{doc.label}</div>
                                              <div className="text-[9px] text-[#8e95a3] truncate mt-0.5">
                                                {state.path || "No file uploaded yet"}
                                              </div>
                                            </div>
                                            <select
                                              value={state.status}
                                              onChange={(e) => handleUpdateDocStatusChecklist(c.id, doc.id, e.target.value)}
                                              className="bg-[#111114] border border-white/10 text-[9px] font-black uppercase p-1.5 rounded focus:outline-none focus:border-[#b5a642]"
                                            >
                                              <option value="required">Required</option>
                                              <option value="received">✓ Received</option>
                                              <option value="verified">★ Verified</option>
                                              <option value="na">N/A</option>
                                            </select>
                                          </div>
                                        );
                                      })}
                                    </div>
                                  </div>

                                  {/* Center col: financial safety parameters */}
                                  <div className="space-y-4">
                                    <div>
                                      <h4 className="text-[10px] text-white/30 uppercase font-black tracking-widest mb-3">
                                        📈 Mortgage GDS/TDS safety constraints
                                      </h4>
                                      <div className="p-3.5 bg-[#17171e] rounded-xl border border-white/5 space-y-2.5">
                                        <div className="flex justify-between border-b border-white/5 pb-1.5">
                                          <span className="text-white/50">Primary Income:</span>
                                          <span className="text-white font-mono">${Number(c.income || 0).toLocaleString()}/yr</span>
                                        </div>
                                        <div className="flex justify-between border-b border-white/5 pb-1.5">
                                          <span className="text-white/50">Mortgage Loan Amt:</span>
                                          <span className="text-white font-mono">${Number(c.mtgamt || 0).toLocaleString()}</span>
                                        </div>
                                        <div className="flex justify-between border-b border-white/5 pb-1.5">
                                          <span className="text-white/50">Registered SIN:</span>
                                          <span className="text-amber-300 font-mono">{c.sin ? formatSinValue(c.sin) : "Not Provided"}</span>
                                        </div>
                                        <div className="flex justify-between border-b border-white/5 pb-1.5">
                                          <span className="text-white/50">Client Date of Birth:</span>
                                          <span className="text-white font-mono">{c.dob || "Not Entered"}</span>
                                        </div>
                                        {c.co && (
                                          <div className="flex justify-between">
                                            <span className="text-white/50">Co-Signer Added:</span>
                                            <span className="text-[#b5a642] truncate max-w-[120px]">{c.co}</span>
                                          </div>
                                        )}
                                      </div>
                                    </div>

                                    {/* AI summaries check */}
                                    {c.aiSummary && (
                                      <div className="p-3 bg-[#16161c] border border-white/5 rounded-xl space-y-2">
                                        <div className="flex justify-between items-center">
                                          <span className="text-[10px] text-white/40 uppercase font-black">AI Intake report Verification</span>
                                          {c.appData?.aiConfirmed ? (
                                            <span className="text-[9px] bg-emerald-500/10 text-emerald-400 font-bold px-1.5 py-0.5 rounded uppercase flex items-center gap-0.5">
                                              ✓ Locked
                                            </span>
                                          ) : (
                                            <span className="text-[9px] bg-amber-500/10 text-amber-400 font-bold px-1.5 py-0.5 rounded uppercase">
                                              Awaiting Review
                                            </span>
                                          )}
                                        </div>
                                        <p className="text-[10px] text-white/50 line-clamp-3 leading-relaxed italic">
                                          {c.aiSummary}
                                        </p>
                                        {!c.appData?.aiConfirmed && (
                                          <button
                                            onClick={() => handleConfirmAiSummary(c.id)}
                                            className="w-full py-1.5 bg-[#b5a642] hover:bg-[#9a8c38] text-black font-black text-[9px] uppercase rounded-lg tracking-wider transition-all"
                                          >
                                            Confirm AI Accuracy &amp; Approve Intake
                                          </button>
                                        )}
                                      </div>
                                    )}
                                  </div>

                                  {/* Right col: log notes, outcomes, and clearance actions */}
                                  <div className="flex flex-col justify-between">
                                    <div>
                                      <h4 className="text-[10px] text-white/30 uppercase font-black tracking-widest mb-3">
                                        📝 Compliance Auditing notes &amp; decisions
                                      </h4>
                                      <div className="bg-[#17171e] border border-white/5 p-3 rounded-xl max-h-40 overflow-y-auto mb-3 text-[11px] leading-relaxed text-white/70 whitespace-pre-line font-mono">
                                        {c.retentionNotes || "No manual compliance clearance records logged yet for this folder."}
                                      </div>
                                      
                                      <textarea
                                        rows={3}
                                        value={newComplianceNote}
                                        onChange={(e) => setNewComplianceNote(e.target.value)}
                                        placeholder="Add permanent auditor commentary regarding document validation exceptions or GDS overrides..."
                                        className="w-full bg-[#16161c] border border-white/10 rounded-lg p-2.5 text-xs text-white placeholder-white/30 focus:outline-none focus:border-[#b5a642]/30 font-semibold"
                                      />
                                    </div>

                                    <div className="flex gap-2 mt-4">
                                      <button
                                        onClick={handleAddComplianceNote}
                                        className="flex-1 py-2 bg-white/5 hover:bg-white/10 text-white rounded-lg text-[10px] font-black uppercase border border-white/5 transition-all"
                                      >
                                        Log Auditor Note
                                      </button>
                                      <button
                                        onClick={() => {
                                          const logItem = {
                                            user: `${currentUser.first} ${currentUser.last}`,
                                            action: "Certified Client File Audit-Ready",
                                            target: `${c.first} ${c.last}`,
                                            time: new Date().toISOString()
                                          };
                                          setAuditLogs(prev => [logItem, ...prev]);
                                          
                                          // Update status to approved or add a verified flag
                                          const updated = clients.map(cl => {
                                            if (cl.id === c.id) {
                                              return {
                                                ...cl,
                                                appData: {
                                                  ...(cl.appData || {}),
                                                  complianceCertified: "true",
                                                  complianceCertifiedBy: `${currentUser.first} ${currentUser.last}`,
                                                  complianceCertifiedAt: new Date().toISOString()
                                                }
                                              };
                                            }
                                            return cl;
                                          });
                                          setClients(updated);

                                          showToast(`File certified and cleared for submission!`, "success");
                                          setSelectedClient(null);
                                        }}
                                        className="flex-1 py-2 bg-emerald-500 hover:bg-emerald-600 text-black rounded-lg text-[10px] font-black uppercase transition-all"
                                      >
                                        Clear File Compliance
                                      </button>
                                    </div>
                                  </div>

                                </div>
                              </td>
                            </tr>
                          )}
                        </React.Fragment>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}

        {/* EXCEPTIONS RADAR */}
        {activeTab === "exceptions" && (
          <div className="space-y-6">
            <div className="bg-[#16161c]/45 border border-white/5 rounded-xl p-4 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
              <div className="text-xs">
                <span className="text-[#b5a642] font-black uppercase tracking-wider block">⚠️ Real-Time Process Exception &amp; Stagnation Radar</span>
                <span className="text-white/40 block mt-0.5 font-semibold">
                  This radar scans the database dynamically to catch incomplete file openings, overdue deadlines, documents gap, inactive pipelines, and unconfirmed AI structures.
                </span>
              </div>
            </div>

            {complianceExceptions.length === 0 ? (
              <div className="bg-[#131318]/40 border border-white/5 rounded-2xl p-16 text-center space-y-2">
                <ShieldCheck className="h-10 w-10 text-emerald-400 mx-auto" />
                <p className="text-sm font-black text-white/50 uppercase">Zero exception anomalies flagged</p>
                <p className="text-xs text-white/30 max-w-sm mx-auto font-medium">Excellent work! All active folders, communication channels, and documentation vaults conform to GBK Financial's process standards.</p>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4" id="exceptions-grid">
                {complianceExceptions.map((ex, index) => {
                  let badge = "bg-red-500/10 text-red-400 border-red-500/20";
                  if (ex.severity === "medium") badge = "bg-amber-500/10 text-amber-300 border-amber-500/20";
                  if (ex.severity === "low") badge = "bg-purple-500/10 text-purple-300 border-purple-500/20";

                  return (
                    <div key={index} className="bg-[#141419] border border-white/5 hover:border-white/10 rounded-2xl p-5 flex flex-col justify-between transition-all">
                      <div>
                        <div className="flex justify-between items-start gap-4">
                          <div>
                            <span className="text-xs text-white font-black">{ex.clientName}</span>
                            <span className="text-[10px] text-white/30 block mt-0.5">Assigned broker: {ex.agent}</span>
                          </div>
                          <span className={`px-2 py-0.5 text-[8px] border font-black uppercase rounded ${badge}`}>
                            {ex.severity} RISK
                          </span>
                        </div>

                        <div className="my-4 space-y-2 text-xs">
                          <p className="text-[#eeeef2] font-semibold leading-relaxed">{ex.description}</p>
                          <div className="bg-[#191922] border border-white/5 p-3 rounded-xl flex gap-2">
                            <Info className="h-4 w-4 text-[#b5a642] shrink-0 mt-0.5" />
                            <div>
                              <span className="text-[10px] text-white/40 uppercase font-black block">Suggested Resolution Action:</span>
                              <p className="text-[11px] text-white/70 font-semibold mt-0.5 leading-relaxed">{ex.actionable}</p>
                            </div>
                          </div>
                        </div>
                      </div>

                      <div className="border-t border-white/5 pt-3 flex justify-end gap-2">
                        <button
                          onClick={() => {
                            // Find the client object
                            const found = clients.find(cl => cl.id === ex.clientId);
                            if (found) {
                              setSelectedClient(found);
                              setActiveTab("checklist");
                              showToast(`Loaded auditing desk for ${found.first}!`, "info");
                            }
                          }}
                          className="px-3 py-1.5 bg-[#b5a642]/10 hover:bg-[#b5a642]/20 border border-[#b5a642]/20 text-[#b5a642] rounded-lg text-[10px] font-black uppercase transition-all flex items-center gap-1"
                        >
                          Audit Document Checklist <ArrowRight className="h-3 w-3" />
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        )}

        {/* AUDIT LOG TIMELINE */}
        {activeTab === "timeline" && (
          <div className="space-y-6">
            <div className="bg-[#16161c]/45 border border-white/5 rounded-xl p-4 flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
              <div className="text-xs">
                <span className="text-[#b5a642] font-black uppercase tracking-wider block">🕒 Immutable Operations Activity Timeline</span>
                <span className="text-white/40 block mt-0.5 font-semibold">
                  Real-time accountability stream tracking profile views, exports, credentials access, document state modifications, and logins.
                </span>
              </div>
              <button
                onClick={() => setShowExportModal(true)}
                className="px-3.5 py-2 bg-[#b5a642] hover:bg-[#9a8c38] text-black font-black text-[10px] uppercase rounded-lg flex items-center gap-1.5 shrink-0 transition-all"
              >
                <Download className="h-3.5 w-3.5" /> Export Audit Records
              </button>
            </div>

            {/* Audit log filters */}
            <div className="bg-[#131317] border border-white/5 rounded-xl p-4 flex flex-col sm:flex-row justify-between gap-3">
              <div className="flex items-center gap-2">
                <span className="text-[10px] text-white/40 uppercase font-black">Timeline Actions:</span>
                <div className="flex gap-1.5 flex-wrap">
                  {[
                    { id: "All", label: "All Logs" },
                    { id: "sensitive", label: "Sensitive Only" },
                    { id: "documents", label: "Documents" },
                    { id: "view", label: "File Views" }
                  ].map(btn => (
                    <button
                      key={btn.id}
                      onClick={() => setTimelineActionFilter(btn.id)}
                      className={`px-3 py-1.5 rounded-lg text-[10px] font-black uppercase transition-all ${
                        timelineActionFilter === btn.id 
                          ? "bg-[#b5a642] text-black" 
                          : "bg-white/5 hover:bg-white/10 text-white"
                      }`}
                    >
                      {btn.label}
                    </button>
                  ))}
                </div>
              </div>

              <div className="relative bg-[#16161c] border border-white/5 rounded-lg px-2.5 py-1.5 flex items-center w-full sm:w-64">
                <Search className="h-3.5 w-3.5 text-white/30 shrink-0 mr-1.5" />
                <input
                  type="text"
                  placeholder="Filter timeline records..."
                  value={timelineSearch}
                  onChange={(e) => setTimelineSearch(e.target.value)}
                  className="bg-transparent border-none text-[11px] text-white focus:outline-none w-full font-semibold"
                />
              </div>
            </div>

            {/* Timeline Stream */}
            <div className="bg-[#121216] border border-white/5 rounded-2xl overflow-hidden p-6 space-y-4">
              {filteredAuditLogs.length === 0 ? (
                <div className="text-center py-10 text-white/30 font-semibold text-xs">
                  No logged entries match your search criteria.
                </div>
              ) : (
                <div className="relative border-l border-white/5 ml-3 pl-6 space-y-6">
                  {filteredAuditLogs.map((log, index) => {
                    let isSensitive = 
                      log.action.toLowerCase().includes("sin") || 
                      log.action.toLowerCase().includes("export") ||
                      log.action.toLowerCase().includes("credentials") ||
                      log.action.toLowerCase().includes("locked") ||
                      log.action.toLowerCase().includes("unlock");

                    return (
                      <div key={index} className="relative group">
                        {/* Bullet */}
                        <div className={`absolute -left-[30px] top-1 w-3 h-3 rounded-full border-2 bg-[#0c0c0e] group-hover:scale-125 transition-transform ${
                          isSensitive ? "border-amber-400" : "border-[#b5a642]"
                        }`} />
                        
                        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-1">
                          <div className="text-xs">
                            <span className="text-white font-black">{log.user}</span>
                            <span className="text-white/40 mx-1.5">performed</span>
                            <span className={`font-mono text-[11px] font-semibold px-2 py-0.5 rounded ${
                              isSensitive ? "text-amber-300 bg-amber-500/10" : "text-white bg-white/5"
                            }`}>
                              {log.action}
                            </span>
                            {log.target && (
                              <>
                                <span className="text-white/40 mx-1.5">on</span>
                                <span className="text-white font-semibold">{log.target}</span>
                              </>
                            )}
                          </div>
                          <span className="text-[10px] text-white/30 font-mono">
                            {new Date(log.time).toLocaleString()}
                          </span>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          </div>
        )}

        {/* SECURITY & SENSITIVE DATA CONTROLS */}
        {activeTab === "security" && (
          <div className="space-y-6">
            <div className="bg-[#16161c]/45 border border-white/5 rounded-xl p-4 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
              <div className="text-xs">
                <span className="text-[#b5a642] font-black uppercase tracking-wider block">🔒 Automated Workstation Security &amp; SIN Masking Rules</span>
                <span className="text-white/40 block mt-0.5 font-semibold">
                  Verify internal process accountability, configure workstation auto-lock timers, audit failed lockouts, and manage masked SIN views.
                </span>
              </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              
              {/* Left Column: Security Settings Toggles */}
              <div className="bg-[#121216] border border-white/5 rounded-2xl p-6 space-y-6">
                <div>
                  <h3 className="text-xs font-black uppercase tracking-wider text-white/80 border-b border-white/5 pb-2.5">
                    Security Policy Configuration
                  </h3>
                  <p className="text-[10px] text-white/40 mt-1 font-semibold leading-relaxed">
                    Set operational guidelines for local workstation idle timers,failed unlock constraints, and audit log pipelines.
                  </p>
                </div>

                <div className="space-y-4 text-xs font-semibold">
                  {/* Toggle 1: Auto-Lock */}
                  <div className="flex items-center justify-between p-3.5 bg-[#17171e] rounded-xl border border-white/5">
                    <div>
                      <span className="text-white font-bold block">Session Auto-Lock</span>
                      <span className="text-[10px] text-white/30 mt-0.5 block leading-relaxed">Automatically lock the workspace if no keyboard or mouse activity is observed.</span>
                    </div>
                    <button
                      onClick={() => {
                        const nextVal = !sessionAutoLock;
                        setAutoLockEnabled(nextVal);
                        localStorage.setItem("gbk_sec_autolock", String(nextVal));
                        showToast(`Session auto-lock ${nextVal ? "enabled" : "disabled"}.`, "info");
                      }}
                      className={`w-12 h-6.5 rounded-full p-1 transition-colors duration-200 focus:outline-none ${
                        sessionAutoLock ? "bg-[#b5a642]" : "bg-white/10"
                      }`}
                    >
                      <div className={`bg-[#121216] w-4.5 h-4.5 rounded-full transition-transform duration-200 transform ${
                        sessionAutoLock ? "translate-x-5.5" : "translate-x-0"
                      }`} />
                    </button>
                  </div>

                  {/* Selector: Auto-Lock Minutes */}
                  {sessionAutoLock && (
                    <div className="flex items-center justify-between p-3.5 bg-[#17171e] rounded-xl border border-white/5">
                      <div>
                        <span className="text-white font-bold block">Lockstation Idle Timer</span>
                        <span className="text-[10px] text-white/30 mt-0.5 block">Threshold duration of idle state before app requires a 4-digit security PIN.</span>
                      </div>
                      <select
                        value={autoLockMinutes}
                        onChange={(e) => {
                          const val = Number(e.target.value);
                          setAutoLockMinutes(val);
                          localStorage.setItem("gbk_sec_idle_min", String(val));
                          showToast(`Lockstation idle threshold updated to ${val} minutes.`, "info");
                        }}
                        className="bg-[#111114] border border-white/10 text-white font-black text-xs p-2 rounded focus:outline-none focus:border-[#b5a642]"
                      >
                        <option value={3}>3 Minutes (High Secure)</option>
                        <option value={5}>5 Minutes</option>
                        <option value={10}>10 Minutes</option>
                        <option value={15}>15 Minutes</option>
                        <option value={30}>30 Minutes</option>
                      </select>
                    </div>
                  )}

                  {/* Toggle 2: Immutable Auditing */}
                  <div className="flex items-center justify-between p-3.5 bg-[#17171e] rounded-xl border border-white/5">
                    <div>
                      <span className="text-white font-bold block">Immutable Audit Logging</span>
                      <span className="text-[10px] text-white/30 mt-0.5 block leading-relaxed">Mandate persistent audit trails for all critical folder modifications, exports, and document actions.</span>
                    </div>
                    <button
                      onClick={() => {
                        const nextVal = !auditLoggingEnabled;
                        setAuditLogEnabled(nextVal);
                        localStorage.setItem("gbk_sec_audit", String(nextVal));
                        showToast(`Process audit log pipeline ${nextVal ? "active" : "dormant"}.`, "info");
                      }}
                      className={`w-12 h-6.5 rounded-full p-1 transition-colors duration-200 focus:outline-none ${
                        auditLoggingEnabled ? "bg-[#b5a642]" : "bg-white/10"
                      }`}
                    >
                      <div className={`bg-[#121216] w-4.5 h-4.5 rounded-full transition-transform duration-200 transform ${
                        auditLoggingEnabled ? "translate-x-5.5" : "translate-x-0"
                      }`} />
                    </button>
                  </div>
                </div>
              </div>

              {/* Right Column: SIN Masking Verification list */}
              <div className="bg-[#121216] border border-white/5 rounded-2xl p-6 space-y-6">
                <div>
                  <h3 className="text-xs font-black uppercase tracking-wider text-white/80 border-b border-white/5 pb-2.5 flex items-center justify-between">
                    <span>SIN Information Masking &amp; Auditing</span>
                    <span className="text-[9px] bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 px-2 py-0.5 rounded uppercase font-black">
                      active &amp; enforced
                    </span>
                  </h3>
                  <p className="text-[10px] text-white/40 mt-1 font-semibold leading-relaxed">
                    Social Insurance Numbers (SIN) are strictly masked by default. The last 4 digits are only visible to authorized brokers. Full SIN edits require manual re-validation.
                  </p>
                </div>

                <div className="space-y-3 max-h-72 overflow-y-auto pr-1">
                  {clients.map(cl => (
                    <div key={cl.id} className="p-3 bg-[#17171e] rounded-xl border border-white/5 flex justify-between items-center text-xs">
                      <div>
                        <span className="text-white font-bold block">{cl.first} {cl.last}</span>
                        <span className="text-[10px] text-white/30 mt-0.5 block">File status: {cl.status.toUpperCase()}</span>
                      </div>
                      <div className="text-right">
                        <span className="bg-[#111114] border border-white/5 px-2.5 py-1.5 rounded-lg text-amber-300 font-mono text-[11px] block select-none">
                          {cl.sin ? formatSinValue(cl.sin) : "Not Configured"}
                        </span>
                        {cl.sin && (
                          <button
                            onClick={() => {
                              // Log audit trace of SIN inspection
                              const logItem = {
                                user: `${currentUser.first} ${currentUser.last}`,
                                action: "Audited masked SIN field",
                                target: `${cl.first} ${cl.last}`,
                                time: new Date().toISOString()
                              };
                              setAuditLogs(prev => [logItem, ...prev]);
                              showToast(`SIN access for ${cl.first} logged to immutable database audit records!`, "warning", "🛡️");
                            }}
                            className="text-[9px] text-[#b5a642] hover:underline font-black uppercase mt-1 inline-block"
                          >
                            Trace Access Log
                          </button>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </div>

            </div>
          </div>
        )}

      </div>

      {/* Export CSV Audit Log Modal */}
      {showExportModal && (
        <div className="fixed inset-0 bg-black/80 flex items-center justify-center z-50 p-4 animate-fade-in" id="export-overlay">
          <div className="bg-[#121216] border border-white/10 rounded-2xl w-full max-w-xl p-6 relative flex flex-col text-xs font-semibold">
            <button 
              onClick={() => setShowExportModal(false)}
              className="absolute right-4 top-4 text-white/40 hover:text-white"
            >
              <X className="h-5 w-5" />
            </button>

            <h3 className="text-base font-black uppercase tracking-wider text-[#b5a642] flex items-center gap-2 mb-2">
              <FileSpreadsheet className="h-5 w-5 text-[#b5a642]" /> Export Compliance Audit CSV Text
            </h3>
            <p className="text-xs text-white/40 font-semibold mb-4 border-b border-white/5 pb-3">
              Copy and compile the following standardized audit logs format to meet FSRA license compliance checks or backups.
            </p>

            <textarea 
              rows={12}
              readOnly
              value={generateCsvReport()}
              className="w-full bg-[#16161c] border border-white/5 text-white p-3.5 rounded-lg font-mono text-[10px] leading-relaxed focus:outline-none"
              onClick={(e) => (e.target as HTMLTextAreaElement).select()}
            />

            <div className="border-t border-white/5 mt-5 pt-4 flex justify-end gap-3 shrink-0">
              <button
                onClick={() => {
                  navigator.clipboard.writeText(generateCsvReport());
                  showToast("CSV data copied to system clipboard!", "success");
                  
                  // Log export action
                  const logItem = {
                    user: `${currentUser.first} ${currentUser.last}`,
                    action: "Exported Compliance Audit Log CSV",
                    target: "System Audit Table",
                    time: new Date().toISOString()
                  };
                  setAuditLogs(prev => [logItem, ...prev]);

                  setShowExportModal(false);
                }}
                className="px-4 py-2 bg-[#b5a642] hover:bg-[#9a8c38] text-black rounded-lg text-xs font-black uppercase flex items-center gap-1.5 transition-all"
              >
                Copy to Clipboard
              </button>
              <button
                onClick={() => setShowExportModal(false)}
                className="px-4 py-2 bg-white/5 hover:bg-white/10 text-white rounded-lg text-xs font-bold transition-all border border-white/5"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
};
