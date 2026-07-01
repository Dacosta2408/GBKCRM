import React, { useState, useEffect, useRef } from "react";
import { 
  Users, Layers, Calendar, CheckSquare, MessageSquare, 
  BrainCircuit, Calculator, ShieldAlert, Mail, BarChart3, Heart, 
  ShieldCheck, FileText, Key, LogOut, Lock, Search, ChevronDown, Settings as SettingsIcon, 
  Trash2, Copy, Send, Plus, CheckCircle2, AlertTriangle, 
  Clock, Award, Globe, FileSpreadsheet, Share2, Sparkles, Filter, 
  MailOpen, RefreshCw, Phone, MessageCircle, HardDrive, Sun, Moon
} from "lucide-react";
import { motion, AnimatePresence } from "motion/react";
import { encryptValue, decryptValue } from "./lib/cryptoUtils";
import { hashPin } from "./hooks/useAuth";
import { 
  DEFAULT_CLIENTS, DEFAULT_LENDERS, DEFAULT_USERS, DEFAULT_MESSAGES, 
  DEFAULT_EMAILS, DEFAULT_TEMPLATES, DEFAULT_PARTNERS 
} from "./data";
import { Client, Lender, User, Task, Event, Email, EmailTemplate, Partner, Post } from "./types";
import { Sidebar } from "./components/Sidebar";
import { Dashboard } from "./components/Dashboard";
import { ClientsList } from "./components/ClientsList";
import { Calculators } from "./components/Calculators";
import { AIAssistantCenter } from "./components/AIAssistantCenter";
import { ApplicationIntake } from "./components/ApplicationIntake";
import { Messages } from "./components/Messages";
import { EmailView } from "./components/EmailView";
import { LenderSheets } from "./components/LenderSheets";
import { CalendarView } from "./components/CalendarView";
import { TasksView } from "./components/TasksView";
import { Partners } from "./components/Partners";
import { Reports } from "./components/Reports";
import { Retention } from "./components/Retention";
import { Compliance } from "./components/Compliance";
import { AdminPanel } from "./components/AdminPanel";
import { FileReadiness } from "./components/FileReadiness";
import { Settings } from "./components/Settings";
import { ZDrivePanel } from "./components/ZDrivePanel";
import { logActivityEvent } from "./lib/activityEngine";
import { useClients } from "./hooks/useClients";
import { useTasks } from "./hooks/useTasks";
import { useCalendar } from "./hooks/useCalendar";
import { useAI } from "./hooks/useAI";
import { useAuth } from "./hooks/useAuth";
import { useCalculators } from "./hooks/useCalculators";
import { fd, pn, cPmt, pToAmt } from "./lib/formatters";
import { ClientDetailPanel } from "./components/ClientDetailPanel";
import { checkBridgeHealth, getBridgeVersion } from "./lib/bridgeService";

export default function App() {
  const TAB_LABELS: Record<string, string> = {
    dashboard: "Dashboard",
    clients: "Clients",
    pipeline: "Pipeline",
    calculators: "Calculators",
    ai: "AI Assistant Center",
    messages: "Messages",
    emails: "Email",
    lenders: "Lender Sheets",
    calendar: "Calendar",
    tasks: "Tasks",
    partners: "Partners",
    reports: "Reports",
    retention: "Client Retention",
    compliance: "Compliance",
    file_readiness: "File Readiness",
    admin: "Admin Panel",
    settings: "Settings"
  };

  // ─── REMAINING SHARED STATE ───
  const [lenders, setLenders] = useState<Lender[]>(() => {
    const saved = localStorage.getItem("gbk_lenders");
    return saved ? JSON.parse(saved) : DEFAULT_LENDERS;
  });
  const [partners, setPartners] = useState<Partner[]>(() => {
    const saved = localStorage.getItem("gbk_partners");
    return saved ? JSON.parse(saved) : DEFAULT_PARTNERS;
  });
  const [messages, setMessages] = useState<Record<string, any[]>>(() => {
    const saved = localStorage.getItem("gbk_messages");
    return saved ? JSON.parse(saved) : DEFAULT_MESSAGES;
  });
  const [emailsState, setEmailsState] = useState<{ inbox: Email[]; sent: Email[]; scheduled: Email[]; queued: Email[] }>(() => {
    const saved = localStorage.getItem("gbk_emails");
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        if (!parsed.queued) parsed.queued = [];
        return parsed;
      } catch (e) {
        return DEFAULT_EMAILS;
      }
    }
    return DEFAULT_EMAILS;
  });
  const [posts, setPosts] = useState<Post[]>(() => {
    const saved = localStorage.getItem("gbk_posts");
    return saved ? JSON.parse(saved) : [];
  });

  const [activeTab, setActiveTab ] = useState<string>("dashboard");
  const [globalSearch, setGlobalSearch] = useState<string>("");
  const [detailTab, setDetailTab] = useState<string>("overview");

  const [theme, setTheme] = useState<"dark" | "light">("dark");

  useEffect(() => {
    document.documentElement.setAttribute("data-theme", theme);
  }, [theme]);

  // Z Drive Bridge online state
  const [bridgeOnline, setBridgeOnline] = useState<boolean>(false);
  const [bridgeVersion, setBridgeVersion] = useState<string | null>(null);
  const [versionMismatch, setVersionMismatch] = useState<boolean>(false);

  // Monitor bridge server connectivity
  useEffect(() => {
    async function checkHealth() {
      const isOnline = await checkBridgeHealth();
      setBridgeOnline(isOnline);
      if (isOnline) {
        const verInfo = await getBridgeVersion();
        if (verInfo) {
          setBridgeVersion(verInfo.version);
          const appVer = (import.meta as any).env?.VITE_APP_VERSION || "1.0.0";
          setVersionMismatch(verInfo.version !== appVer);
        }
      } else {
        setBridgeVersion(null);
        setVersionMismatch(false);
      }
    }
    checkHealth();
    const interval = setInterval(checkHealth, 30000);
    return () => clearInterval(interval);
  }, []);

  // Notifications / Toast
  const [toastMessage, setToastMessage] = useState<{ msg: string; icon?: string; type: "success" | "error" } | null>(null);

  // Audit Logs
  const [auditLogs, setAuditLogs] = useState<any[]>(() => {
    const saved = localStorage.getItem("gbk_audit_logs");
    return saved ? JSON.parse(saved) : [
      { user: "David Acosta", action: "Logged in", target: "CRM Packager Portal", time: new Date(Date.now() - 400000).toISOString() },
      { user: "David Acosta", action: "Viewed file", target: "David Martinez", time: new Date(Date.now() - 300000).toISOString() }
    ];
  });

  // Security toggles
  const [autoLockMinutes, setAutoLockMinutes] = useState<number>(() => {
    return Number(localStorage.getItem("gbk_sec_idle_min") || "10");
  });
  const [sessionAutoLock, setAutoLockEnabled] = useState<boolean>(() => {
    return localStorage.getItem("gbk_sec_autolock") !== "false";
  });
  const [auditLoggingEnabled, setAuditLogEnabled] = useState<boolean>(() => {
    return localStorage.getItem("gbk_sec_audit") !== "false";
  });
  // Broadcast Notification Banners
  const [broadcastBanners, setBroadcastBanners] = useState<any[]>(() => {
    const saved = localStorage.getItem("gbk_admin_broadcasts");
    return saved ? JSON.parse(saved) : [];
  });

  useEffect(() => {
    const saved = localStorage.getItem("gbk_admin_broadcasts");
    if (saved) {
      setBroadcastBanners(JSON.parse(saved));
    }
  }, []);

  // Email Compose state
  const [emailComposeOpen, setEmailComposeOpen] = useState<boolean>(false);
  const [compTo, setCompTo] = useState<string>("");
  const [compSubject, setCompSubject] = useState<string>("");
  const [compBody, setCompBody] = useState<string>("");

  // Active channel in Direct/Announcements chat
  const [activeChannel, setActiveChannel] = useState<string>("general");
  const [linkedChatClientId, setLinkedChatClientId] = useState<string | null>(null);

  // Document Vault State Storage
  const [docVault, setDocVault] = useState<Record<string, any>>(() => {
    const saved = localStorage.getItem("gbk_doc_vault");
    return saved ? JSON.parse(saved) : {};
  });

  // Modals Inputs
  const [newClientOpen, setNewClientOpen] = useState<boolean>(false);
  const [zDriveOpen, setZDriveOpen] = useState<boolean>(false);
  const [settingsModalOpen, setSettingsModalOpen] = useState<boolean>(false);
  const [headerProfileOpen, setHeaderProfileOpen] = useState<boolean>(false);

  const [settings, setSettings] = useState({ 
    apiKey: localStorage.getItem("gbk_apiKey") || "" 
  });

  useEffect(() => { 
    localStorage.setItem("gbk_apiKey", settings.apiKey); 
  }, [settings.apiKey]);

  // ─── UTILITIES & HELPER FUNCTIONS ───

  function showToast(msg: string, type: "success" | "error" = "success", icon?: string) {
    setToastMessage({ msg, type, icon });
    setTimeout(() => setToastMessage(null), 3500);
  }

  const sessionIdRef = useRef<string>("");
  if (!sessionIdRef.current) {
    sessionIdRef.current = typeof crypto.randomUUID === "function" ? crypto.randomUUID() : Math.random().toString(36).substring(2, 15);
  }

  function logActivity(action: string, target?: string) {
    if (!auditLoggingEnabled) return;
    const logItem = {
      user: currentUser.first + " " + currentUser.last,
      action,
      target: target || "",
      time: new Date().toISOString(),
      ipAddress: "localhost",
      sessionId: sessionIdRef.current,
      tabContext: activeTab
    };
    setAuditLogs(prev => [logItem, ...prev.slice(0, 199)]);
  }

  // ─── HOOK CALLS ───
  const {
    currentUser,
    setCurrentUser,
    appLocked,
    setAppLocked,
    pinInput,
    setPinInput,
    pinError,
    setPinError,
    userRoster,
    setUserRoster,
    lockoutTries,
    setLockoutTries,
    lockoutActive,
    setLockoutActive,
    profileModalOpen,
    setProfileModalOpen,
    profileTab,
    setProfileTab,
    activeHost,
    setActiveHost,
    activePort,
    setActivePort,
    activeUsername,
    setActiveUsername,
    activePassword,
    setActivePassword,
    suFirst,
    setSuFirst,
    suLast,
    setSuLast,
    suEmail,
    setSuEmail,
    suRole,
    setSuRole,
    suPhone,
    setSuPhone,
    suPin,
    setSuPin,
    suFsra,
    setSuFsra,
    suHost,
    setSuHost,
    suPort,
    setSuPort,
    suPass,
    setSuPass,
    swTargetId,
    setSwTargetId,
    swPin,
    setSwPin,
    swError,
    setSwError,
    handleUnlock,
    isOwner,
    getAgentNames
  } = useAuth({ showToast, logActivity });

  const {
    clients,
    setClients,
    currentClient,
    setCurrentClient,
    clientViewMode,
    setClientViewMode,
    openClient,
    closeDetail,
    handleUpdateClient,
    handleUpdateClientStatus,
    handleCreateClient,
    handleDeleteClient
  } = useClients({
    currentUser,
    logActivity,
    showToast,
    setDetailTab,
    logActivityEvent
  });

  const {
    tasks,
    setTasks,
    taskFilter,
    setTaskFilter,
    taskModalOpen,
    setTaskModalOpen,
    editingTaskId,
    setEditingTaskId
  } = useTasks({
    currentUser,
    showToast
  });

  const {
    events,
    setEvents,
    calDate,
    setCalDate,
    calSelectedDate,
    setCalSelectedDate,
    calEventModalOpen,
    setCalEventModalOpen
  } = useCalendar();

  const {
    aiClientId,
    setAiClientId,
    aiSelectedClient,
    setAiSelectedClient,
    aiHistory,
    setAiHistory,
    aiInputText,
    setAiInputText,
    aiLoading,
    setAiLoading,
    aiIntakeOpen,
    setAiIntakeOpen,
    applicationIntakeOpen,
    setApplicationIntakeOpen,
    aiIntakeEditingId,
    setAiIntakeOpenEditId,
    aiIntakeText,
    setAiIntakeText,
    aiIntakeLoading,
    setAiIntakeLoading,
    aiIntakeFields,
    setAiIntakeFields,
    highlightedAiFields,
    setHighlightedAiFields,
    intakePreloadedText,
    setIntakePreloadedText,
    intakePreloadedFileName,
    setIntakePreloadedFileName,
    runGeneralAIChat,
    triggerUnderwritingAnalysis,
    underwritingLoading,
    underwritingError,
    triggerAIIntakeExtract,
    handleSaveAIIntake,
    openApplicationIntake,
    openManualIntake
  } = useAI({
    clients,
    setClients,
    currentUser,
    showToast,
    logActivity,
    setCurrentClient,
    setNewClientOpen,
    currentClient
  });

  const {
    calcClientId,
    setCalcClientId,
    stIncome,
    setStIncome,
    stCoIncome,
    setStCoIncome,
    stDebts,
    setStDebts,
    stCondo,
    setStCondo,
    stTax,
    setStTax,
    stHeat,
    setStHeat,
    stRate,
    setStRate,
    stAmortization,
    setStAmortization,
    pcAmount,
    setPcAmount,
    pcRate,
    setPcRate,
    pcAm,
    setPcAm,
    pcFreq,
    setPcFreq,
    gcIncome,
    setGcIncome,
    gcPmt,
    setGcPmt,
    gcTax,
    setGcTax,
    gcHeat,
    setGcHeat,
    gcCondo,
    setGcCondo,
    gcDebts,
    setGcDebts,
    hrRate,
    setHrRate,
    hrHrs,
    setHrHrs,
    seY1,
    setSeY1,
    seY2,
    setSeY2,
    handleLoadClientToCalc,
    handleClearCalcClient
  } = useCalculators({ clients });

  // Local storage writing side-effects
  useEffect(() => { localStorage.setItem("gbk_lenders", JSON.stringify(lenders)); }, [lenders]);
  useEffect(() => { localStorage.setItem("gbk_partners", JSON.stringify(partners)); }, [partners]);
  useEffect(() => { localStorage.setItem("gbk_messages", JSON.stringify(messages)); }, [messages]);
  useEffect(() => { localStorage.setItem("gbk_emails", JSON.stringify(emailsState)); }, [emailsState]);
  useEffect(() => { localStorage.setItem("gbk_posts", JSON.stringify(posts)); }, [posts]);
  useEffect(() => { localStorage.setItem("gbk_audit_logs", JSON.stringify(auditLogs)); }, [auditLogs]);
  useEffect(() => { localStorage.setItem("gbk_doc_vault", JSON.stringify(docVault)); }, [docVault]);

  // Idle Timer auto-locking mechanism
  const idleTimeoutRef = useRef<any>(null);
  const resetIdleTimer = () => {
    if (idleTimeoutRef.current) clearTimeout(idleTimeoutRef.current);
    if (!sessionAutoLock) return;
    idleTimeoutRef.current = setTimeout(() => {
      if (currentUser.pin && currentUser.pin.length === 4) {
        setAppLocked(true);
      }
    }, autoLockMinutes * 60 * 1000);
  };

  const handleTabChange = (tab: string) => {
    resetIdleTimer();
    setActiveTab(tab);
  };

  useEffect(() => {
    const handleActivity = () => resetIdleTimer();
    window.addEventListener("mousemove", handleActivity);
    window.addEventListener("keydown", handleActivity);
    window.addEventListener("click", handleActivity);
    window.addEventListener("scroll", handleActivity);
    resetIdleTimer();
    return () => {
      window.removeEventListener("mousemove", handleActivity);
      window.removeEventListener("keydown", handleActivity);
      window.removeEventListener("click", handleActivity);
      window.removeEventListener("scroll", handleActivity);
      if (idleTimeoutRef.current) clearTimeout(idleTimeoutRef.current);
    };
  }, [sessionAutoLock, autoLockMinutes, currentUser]);

  // Global listener for the Backup Restore event to synchronize all states in memory
  useEffect(() => {
    const handleRestoreEvent = (e: any) => {
      const savedClients = localStorage.getItem("gbk_clients");
      if (savedClients) setClients(JSON.parse(savedClients));
      
      const savedLenders = localStorage.getItem("gbk_lenders");
      if (savedLenders) setLenders(JSON.parse(savedLenders));
      
      const savedPartners = localStorage.getItem("gbk_partners");
      if (savedPartners) setPartners(JSON.parse(savedPartners));
      
      const savedTasks = localStorage.getItem("gbk_tasks");
      if (savedTasks) setTasks(JSON.parse(savedTasks));
      
      const savedEvents = localStorage.getItem("gbk_events");
      if (savedEvents) setEvents(JSON.parse(savedEvents));
      
      const savedMessages = localStorage.getItem("gbk_messages");
      if (savedMessages) setMessages(JSON.parse(savedMessages));
      
      const savedEmails = localStorage.getItem("gbk_emails");
      if (savedEmails) setEmailsState(JSON.parse(savedEmails));
      
      const savedPosts = localStorage.getItem("gbk_posts");
      if (savedPosts) setPosts(JSON.parse(savedPosts));
      
      const savedRoster = localStorage.getItem("gbk_roster");
      if (savedRoster) setUserRoster(JSON.parse(savedRoster));
      
      const savedAudit = localStorage.getItem("gbk_audit_logs");
      if (savedAudit) setAuditLogs(JSON.parse(savedAudit));
      
      // Update our current user state if they still exist or have updated parameters
      if (savedRoster) {
        const currentRoster = JSON.parse(savedRoster);
        const updatedSelf = currentRoster.find((u: any) => u.id === currentUser.id);
        if (updatedSelf) {
          setCurrentUser(updatedSelf);
        }
      }
    };

    window.addEventListener("gbk-crm-restored", handleRestoreEvent);
    return () => {
      window.removeEventListener("gbk-crm-restored", handleRestoreEvent);
    };
  }, [currentUser]);



  function handleCreateClientFromIntake(
    finalClient: Client, 
    fileMeta: { name: string; size: string; content?: string } | null,
    alertAction: 'create' | 'merge',
    suggestedDocs?: Array<{ id: string; name: string; desc: string; category: string }>,
    starterTasks?: Array<{ title: string; priority: 'high' | 'medium' | 'low'; notes: string }>
  ) {
    if (alertAction === 'merge') {
      handleUpdateClient({ ...finalClient, id: finalClient.id });
      logActivity("Merged Intake application fields into existing client", finalClient.first + " " + finalClient.last);
      showToast("Data successfully merged into existing client record!", "success");
    } else {
      handleCreateClient(finalClient);
      logActivity("Created new file via Application Intake PDF", finalClient.first + " " + finalClient.last);
      showToast("Active mortgage file created successfully!", "success");
    }

    // Initialize/update docVault for original PDF AND suggested documents
    setDocVault(prev => {
      const clientDocs = prev[finalClient.id] || {};
      const updated = { ...clientDocs };

      if (fileMeta) {
        updated.original_application_pdf = {
          id: "original_application_pdf",
          clientId: finalClient.id,
          status: "approved" as const,
          notes: "Uploaded source application PDF",
          files: [
            {
              id: "v_1",
              fileName: fileMeta.name,
              fileSize: fileMeta.size,
              uploadedAt: new Date().toISOString(),
              uploadedBy: currentUser.first + " " + currentUser.last,
              path: "/uploads/" + fileMeta.name
            }
          ],
          label: "Source Mortgage Application Form (Uploaded PDF)",
          category: "Other",
          description: "Original signed/uploaded web or portal mortgage application.",
          isCustom: true
        };
      }

      // Populate required document slots to setup downstream Document Manager
      if (suggestedDocs && suggestedDocs.length > 0) {
        suggestedDocs.forEach(doc => {
          if (!updated[doc.id]) {
            updated[doc.id] = {
              id: doc.id,
              clientId: finalClient.id,
              status: "required",
              files: [],
              label: doc.name,
              category: doc.category,
              description: doc.desc,
              isCustom: false
            };
          }
        });
      }

      const newVault = {
        ...prev,
        [finalClient.id]: updated
      };
      
      // Persist in localStorage to match the core state strategy
      localStorage.setItem("gbk_doc_vault", JSON.stringify(newVault));
      return newVault;
    });

    if (fileMeta) {
      const savedActivities = localStorage.getItem("gbk_doc_activities");
      const currentActivities = savedActivities ? JSON.parse(savedActivities) : [];
      const newActivity = {
        id: "act_" + Date.now(),
        clientId: finalClient.id,
        clientName: finalClient.first + " " + finalClient.last,
        docId: "original_application_pdf",
        docName: "Source Mortgage Application Form (Uploaded PDF)",
        action: "uploaded",
        user: currentUser.first + " " + currentUser.last,
        timestamp: new Date().toISOString(),
        details: `Uploaded source application PDF ${fileMeta.name} (${fileMeta.size}) via Intake panel.`
      };
      localStorage.setItem("gbk_doc_activities", JSON.stringify([newActivity, ...currentActivities]));
    }

    // Populate checklist starter logic tasks to setup downstream Task Manager
    if (starterTasks && starterTasks.length > 0) {
      const newTasks: Task[] = starterTasks.map((t, index) => ({
        id: "task_" + (Date.now() + index),
        title: t.title,
        status: "open",
        priority: t.priority,
        clientId: finalClient.id,
        clientName: finalClient.first + " " + finalClient.last,
        assignedTo: finalClient.agent || (currentUser.first + " " + currentUser.last),
        notes: t.notes,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        createdBy: currentUser.first + " " + currentUser.last
      }));
      setTasks(prev => {
        const updated = [...newTasks, ...prev];
        localStorage.setItem("gbk_tasks", JSON.stringify(updated));
        return updated;
      });
    }

    setApplicationIntakeOpen(false);
  }



  function handleOpenComposeWithDetails(to: string, subject: string, body: string) {
    setCompTo(to);
    setCompSubject(subject);
    setCompBody(body);
    setEmailComposeOpen(true);
    setActiveTab("emails");
  }

  return (
    <div className="flex h-screen bg-[var(--color-bg)] font-sans text-[var(--color-text)] overflow-hidden">
      
      {/* ── Security Lock Screen Overlay ── */}
      <AnimatePresence>
        {appLocked && (
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center flex-col gap-6"
            style={{
              background: "radial-gradient(circle at center, #1F2232 0%, #0c0c0e 100%)"
            }}
          >
            <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,rgba(249,177,122,0.08)_0%,transparent_60%)] animate-pulse pointer-events-none" />
            <motion.div 
              initial={{ scale: 0.92, y: 15 }}
              animate={{ scale: 1, y: 0 }}
              className="border rounded-2xl p-8 w-80 text-center shadow-2xl relative"
              style={{
                background: "rgba(18, 19, 26, 0.75)",
                borderColor: "rgba(255, 255, 255, 0.05)",
                backdropFilter: "blur(24px)",
                WebkitBackdropFilter: "blur(24px)"
              }}
            >
              <div className="w-14 h-14 rounded-full flex items-center justify-center mx-auto mb-4" style={{ background: "var(--grad-soft)", border: "1px solid rgba(255,255,255,0.05)" }}>
                <Lock className="w-6 h-6 text-[#12131a]" />
              </div>
              <h3 className="text-sm font-black uppercase tracking-widest text-white mb-1">Workstation Locked</h3>
              <p className="text-[10px] text-[var(--color-text-faint)] font-bold uppercase tracking-wider mb-6">Enter 4-digit security PIN to resume</p>
              
              <input 
                type="password" 
                maxLength={4}
                value={pinInput}
                onChange={(e) => setPinInput(e.target.value.replace(/\D/g, ""))}
                placeholder="••••"
                disabled={lockoutActive}
                className="w-full tracking-widest text-center text-3xl font-mono py-2.5 bg-black/30 border border-white/5 rounded-xl text-[#F9B17A] mb-4 focus:outline-none focus:border-[#F9B17A] focus:ring-1 focus:ring-[#F9B17A] disabled:opacity-50 disabled:cursor-not-allowed font-black"
                onKeyDown={(e) => { if (e.key === "Enter") handleUnlock(); }}
              />

              <button 
                onClick={handleUnlock}
                disabled={lockoutActive}
                className="w-full text-[#12131a] font-black uppercase tracking-wider text-[11px] py-3.5 rounded-xl hover:opacity-95 transition-all disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer shadow-md hover:shadow-[0_0_20px_rgba(249,177,122,0.3)]"
                style={{ background: "var(--grad-warm)" }}
              >
                Unlock Workstation
              </button>

              {pinError && (
                <div className="text-xs text-red-400 mt-4 font-bold uppercase tracking-wide">{pinError}</div>
              )}
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* ─── Global Live Toast Alert ─── */}
      <AnimatePresence>
        {toastMessage && (
          <motion.div 
            initial={{ opacity: 0, y: 30, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 15, scale: 0.95 }}
            className="fixed bottom-6 right-6 z-50 flex items-center gap-3 px-5 py-3.5 rounded-xl border max-w-sm shadow-xl"
            style={{
              background: "var(--glass-bg)",
              borderColor: toastMessage.type === "error" ? "rgba(224,92,110,0.3)" : "rgba(249,177,122,0.3)",
              backdropFilter: "var(--glass-blur)",
              WebkitBackdropFilter: "var(--glass-blur)",
              boxShadow: toastMessage.type === "error" ? "0 4px 20px rgba(224,92,110,0.15)" : "0 4px 20px rgba(249,177,122,0.15)"
            }}
          >
            <div className="text-base select-none shrink-0">{toastMessage.icon || "✓"}</div>
            <span className="text-[11px] font-bold text-white leading-tight">{toastMessage.msg}</span>
          </motion.div>
        )}
      </AnimatePresence>

      {/* ─── Sidebar Navigation Panel ─── */}
      <Sidebar 
        activeTab={activeTab}
        setActiveTab={handleTabChange}
        currentUser={currentUser}
        clients={clients}
        tasks={tasks}
        events={events}
        onOpenSettings={() => setSettingsModalOpen(true)}
        onLockApp={() => setAppLocked(true)}
        isOwner={isOwner()}
        onOpenProfileManager={() => setProfileModalOpen(true)}
      />

      {/* Main Workspace */}
      <div className="flex-1 flex flex-col h-full min-w-0 bg-[var(--color-bg)]">
        
        {/* Version Mismatch Banner */}
        {versionMismatch && (
          <div className="bg-amber-500/10 border-b border-amber-500/20 px-6 py-2 flex items-center gap-2 text-xs text-amber-300 font-medium select-none shrink-0">
            <span>⚠️</span>
            <span>
              Version mismatch detected. Bridge server is running <strong>v{bridgeVersion}</strong> but the app is <strong>v{(import.meta as any).env?.VITE_APP_VERSION || "1.0.0"}</strong>. Please restart the bridge server.
            </span>
          </div>
        )}
        
        {/* Top Header */}
        <header 
          className="h-14 border-b flex items-center justify-between px-6 shrink-0 select-none"
          style={{
            background: "rgba(18, 19, 26, 0.85)",
            backdropFilter: "blur(16px)",
            WebkitBackdropFilter: "blur(16px)",
            borderBottom: "1px solid var(--color-divider)"
          }}
        >
          <div className="text-sm font-semibold text-[var(--color-text)] tracking-tight">{TAB_LABELS[activeTab] || activeTab} Section</div>
          <div className="flex items-center gap-3">
            {/* Quick search input */}
            <div className="relative">
              <div 
                className="px-3.5 py-1.5 flex items-center gap-2 w-48 focus-within:w-64 transition-all duration-300 rounded-full"
                style={{
                  background: "var(--glass-bg)",
                  backdropFilter: "var(--glass-blur)",
                  WebkitBackdropFilter: "var(--glass-blur)",
                  border: "1px solid var(--glass-border)"
                }}
              >
                <Search className="w-3.5 h-3.5 text-[var(--color-text-muted)]" />
                <input 
                  type="text" 
                  placeholder="Quick locate client…" 
                  value={globalSearch}
                  onChange={(e) => {
                    setGlobalSearch(e.target.value);
                  }}
                  className="bg-transparent border-none text-[11px] text-[var(--color-text)] placeholder-[var(--color-text-muted)] focus:outline-none w-full font-medium"
                />
              </div>

              {activeTab !== "clients" && activeTab !== "pipeline" && globalSearch.trim().length > 0 && (
                <div className="absolute top-full mt-1 right-0 w-60 bg-[var(--color-surface)] border border-[var(--color-border)] rounded-lg shadow-xl z-50 overflow-hidden py-1">
                  <div className="px-2.5 py-1 text-[9px] font-black uppercase tracking-wider text-[var(--color-text-faint)] border-b border-[var(--color-divider)]">
                    Matched Clients
                  </div>
                  {(() => {
                    const matched = clients.filter(c => {
                      const q = globalSearch.toLowerCase();
                      return (c.first + " " + c.last).toLowerCase().includes(q) ||
                             (c.email || "").toLowerCase().includes(q) ||
                             (c.cell || "").includes(q) ||
                             (c.addr || "").toLowerCase().includes(q) ||
                             (c.lender || "").toLowerCase().includes(q);
                    }).slice(0, 5);

                    if (matched.length > 0) {
                      return matched.map(c => (
                        <button
                          key={c.id}
                          onClick={() => {
                            openClient(c.id);
                            setGlobalSearch("");
                          }}
                          className="w-full text-left px-2.5 py-2 text-xs text-[var(--color-text)] hover:bg-[var(--color-surface-2)] transition-colors flex flex-col gap-0.5 cursor-pointer"
                        >
                          <span className="font-bold">{c.first} {c.last}</span>
                          <span className="text-[10px] text-[var(--color-text-muted)] capitalize">{c.status} • {c.email || "No email"}</span>
                        </button>
                      ));
                    } else {
                      return (
                        <div className="px-2.5 py-2 text-xs text-[var(--color-text-faint)] italic">
                          No clients matched
                        </div>
                      );
                    }
                  })()}
                </div>
              )}
            </div>

            {/* Z Drive Button with Online Indicator */}
            <div className="flex items-center gap-1.5 shrink-0">
              <button 
                onClick={() => setZDriveOpen(true)}
                className="flex items-center gap-1.5 px-3.5 py-1.5 text-[11px] font-bold rounded-full transition-all duration-200 cursor-pointer shadow-sm hover:shadow-[0_0_15px_rgba(72,109,131,0.25)] hover:border-[#486D83]"
                style={{
                  background: "var(--glass-bg)",
                  backdropFilter: "var(--glass-blur)",
                  WebkitBackdropFilter: "var(--glass-blur)",
                  border: "1px solid var(--glass-border)",
                  color: "var(--color-text-muted)"
                }}
                id="header-z-drive-btn"
              >
                <HardDrive className="w-3.5 h-3.5" /> Z Drive
              </button>
              {bridgeOnline && (
                <div className="flex items-center" title="Z Drive Online">
                  <span className="relative flex h-2 w-2">
                    <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                    <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500 animate-pulse"></span>
                  </span>
                </div>
              )}
            </div>

            {/* New Client Button */}
            <button 
              onClick={openManualIntake}
              className="flex items-center gap-1 px-4 py-1.5 text-[11px] font-extrabold text-white transition-all shrink-0 hover:shadow-[0_0_20px_rgba(244,163,132,0.3)] duration-200 active:scale-95 cursor-pointer"
              style={{
                background: "var(--grad-warm)",
                borderRadius: "10px"
              }}
              id="header-new-client-btn"
            >
              <Plus className="w-3.5 h-3.5 stroke-[3]" /> New Client
            </button>

            {/* Theme Toggle Button */}
            <button
              onClick={() => setTheme(prev => prev === "dark" ? "light" : "dark")}
              className="p-1.5 rounded-full hover:bg-white/5 transition-all cursor-pointer text-[var(--color-text-muted)] hover:text-white shrink-0"
              title={`Switch to ${theme === "dark" ? "Light" : "Dark"} Mode`}
            >
              {theme === "dark" ? (
                <Sun className="w-4 h-4 text-[#F9B17A]" />
              ) : (
                <Moon className="w-4 h-4 text-[#7A5063]" />
              )}
            </button>

            {/* Vertical Divider */}
            <div className="w-px h-5 bg-white/5 shrink-0 mx-0.5" />

            {/* Top Header Profile Section */}
            <div className="relative shrink-0" id="header-profile-dropdown-container">
              <button
                onClick={() => setHeaderProfileOpen(!headerProfileOpen)}
                className="flex items-center gap-2.5 px-3 py-1.5 rounded-full transition-all duration-200 cursor-pointer text-left select-none"
                style={{
                  background: "var(--glass-bg)",
                  backdropFilter: "var(--glass-blur)",
                  WebkitBackdropFilter: "var(--glass-blur)",
                  border: "1px solid var(--glass-border)"
                }}
                id="header-profile-button"
              >
                {currentUser.photo ? (
                  <img
                    src={currentUser.photo}
                    alt="Profile"
                    referrerPolicy="no-referrer"
                    className="w-5.5 h-5.5 rounded-full object-cover border border-[#F9B17A]/30"
                  />
                ) : (
                  <div 
                    className="w-5.5 h-5.5 rounded-full flex items-center justify-center font-bold text-[9px] text-[#12131a] shrink-0"
                    style={{ background: "var(--grad-warm)" }}
                  >
                    {currentUser.first[0]}{currentUser.last[0]}
                  </div>
                )}
                <div className="hidden md:block">
                  <div className="text-[10px] font-black text-white leading-tight">
                    {currentUser.displayName || `${currentUser.first} ${currentUser.last}`}
                  </div>
                  <div className="text-[8px] text-white/40 leading-none font-bold uppercase tracking-wider">
                    {currentUser.role}
                  </div>
                </div>
                <ChevronDown className="w-3.5 h-3.5 text-white/50 shrink-0" />
              </button>

              {/* Dropdown Menu */}
              {headerProfileOpen && (
                <>
                  {/* Invisible full-screen overlay to close the dropdown */}
                  <div 
                    className="fixed inset-0 z-40 cursor-default" 
                    onClick={() => setHeaderProfileOpen(false)} 
                  />
                  
                  <div 
                    className="absolute right-0 mt-2 w-56 rounded-xl bg-[var(--color-surface)] border border-[var(--color-border)] p-1.5 shadow-2xl z-50 animate-in fade-in slide-in-from-top-2 duration-100"
                    id="header-profile-dropdown-menu"
                  >
                    <div className="px-2.5 py-2 border-b border-[var(--color-divider)] mb-1.5">
                      <p className="text-[9px] uppercase font-black tracking-widest text-[var(--color-text-faint)]">Broker Account</p>
                      <p className="text-xs font-black text-[var(--color-text)] mt-0.5 truncate">{currentUser.first} {currentUser.last}</p>
                      <p className="text-[10px] text-[var(--color-text-muted)] truncate font-mono">{currentUser.email}</p>
                    </div>

                    <button
                      onClick={() => {
                        setActiveTab("settings");
                        setHeaderProfileOpen(false);
                      }}
                      className="w-full flex items-center gap-2.5 px-2.5 py-2 text-xs font-bold text-[var(--color-text-muted)] hover:text-[var(--color-text)] hover:bg-[var(--color-surface-2)] rounded-lg transition-all text-left cursor-pointer"
                    >
                      <SettingsIcon className="w-4 h-4 text-[var(--color-accent)]" />
                      <span>My Profile &amp; Settings</span>
                    </button>

                    <button
                      onClick={() => {
                        setProfileTab("profile");
                        setProfileModalOpen(true);
                        setHeaderProfileOpen(false);
                      }}
                      className="w-full flex items-center gap-2.5 px-2.5 py-2 text-xs font-bold text-[var(--color-text-muted)] hover:text-[var(--color-text)] hover:bg-[var(--color-surface-2)] rounded-lg transition-all text-left cursor-pointer"
                    >
                      <Key className="w-4 h-4 text-[var(--color-accent)]" />
                      <span>Sync Credentials</span>
                    </button>

                    <div className="border-t border-[var(--color-divider)] my-1.5" />

                    <button
                      onClick={() => {
                        setAppLocked(true);
                        setHeaderProfileOpen(false);
                      }}
                      className="w-full flex items-center gap-2.5 px-2.5 py-2 text-xs font-bold text-red-400 hover:text-red-300 hover:bg-red-500/10 rounded-lg transition-all text-left cursor-pointer"
                    >
                      <Lock className="w-4 h-4" />
                      <span>Lock Workstation</span>
                    </button>
                  </div>
                </>
              )}
            </div>
          </div>
        </header>

        {/* Persistent Z Drive Offline Banner */}
        {!bridgeOnline && (
          <div 
            className="px-6 py-2.5 text-[10px] flex items-center gap-2.5 text-[#e05c6e] font-bold uppercase tracking-wider select-none shrink-0 border-b animate-pulse"
            style={{
              background: "rgba(224,92,110,0.06)",
              borderColor: "rgba(224,92,110,0.15)",
              backdropFilter: "blur(12px)",
              WebkitBackdropFilter: "blur(12px)"
            }}
          >
            <span>🔌</span>
            <span>Z Drive Offline — Working from local browser sandbox storage. Changes will automatically sync upon reconnecting the bridge.</span>
          </div>
        )}

        {/* Active System Broadcast Banners */}
        {broadcastBanners.filter(b => b.active).map((banner) => {
          const isCritical = banner.type === "critical";
          const isWarning = banner.type === "warning";
          const colorClass = isCritical ? "text-[#e05c6e]" : isWarning ? "text-[#F4A384]" : "text-[#34D399]";
          const bgVal = isCritical ? "rgba(224,92,110,0.06)" : isWarning ? "rgba(244,163,132,0.06)" : "rgba(52,211,153,0.06)";
          const borderVal = isCritical ? "rgba(224,92,110,0.15)" : isWarning ? "rgba(244,163,132,0.15)" : "rgba(52,211,153,0.15)";
          
          return (
            <div 
              key={banner.id} 
              className="px-6 py-2.5 text-[10px] flex items-center justify-between gap-4 border-b shrink-0 font-bold uppercase tracking-wider select-none"
              style={{
                background: bgVal,
                borderColor: borderVal,
                backdropFilter: "blur(12px)",
                WebkitBackdropFilter: "blur(12px)"
              }}
            >
              <div className={`flex items-center gap-2 truncate ${colorClass}`}>
                {isCritical ? (
                  <ShieldAlert className="w-4 h-4 shrink-0" />
                ) : (
                  <AlertTriangle className="w-4 h-4 shrink-0" />
                )}
                <span className="truncate">
                  <strong className="mr-1.5 font-black">[{banner.type} broadcast]:</strong>
                  <span className="text-white normal-case font-semibold">{banner.message}</span>
                </span>
              </div>
              <button 
                onClick={() => {
                  setBroadcastBanners(prev => prev.map(b => b.id === banner.id ? { ...b, active: false } : b));
                }}
                className="text-white/40 hover:text-white shrink-0 font-black px-2 py-1 bg-white/5 hover:bg-white/10 rounded-full transition-all text-[8px] tracking-widest cursor-pointer border border-white/5"
              >
                ✕ Dismiss
              </button>
            </div>
          );
        })}

        {/* Tab content viewer area */}
        <main className="flex-1 overflow-hidden p-6">
          {activeTab === "dashboard" && (
            <Dashboard 
              clients={clients}
              tasks={tasks}
              events={events}
              auditLogs={auditLogs}
              currentUser={currentUser}
              docVault={docVault}
              onOpenClient={openClient}
              onAddClient={openManualIntake}
              onOpenNewClientIntake={openApplicationIntake}
              onOpenAIIntake={openApplicationIntake}
              onAddTask={() => setActiveTab("tasks")}
              onAddPartner={() => setActiveTab("partners")}
              onAddEvent={() => setCalEventModalOpen(true)}
              setActiveTab={setActiveTab}
              onCompleteTask={(taskId) => {
                setTasks(prev => prev.map(t => t.id === taskId ? { ...t, status: "done", completedAt: new Date().toISOString() } : t));
                showToast("Task completed successfully!", "success");
              }}
            />
          )}

           {activeTab === "clients" && (
            <ClientsList 
              clients={clients}
              lenders={lenders}
              onOpenClient={openClient}
              onAddClient={openManualIntake}
              onOpenAIIntake={openApplicationIntake}
              onOpenNewClientIntake={openApplicationIntake}
              viewMode={clientViewMode}
              setViewMode={setClientViewMode}
              agentNames={getAgentNames()}
              searchQuery={globalSearch}
              onSearchQueryChange={setGlobalSearch}
            />
          )}

          {activeTab === "pipeline" && (
            <ClientsList 
              clients={clients}
              lenders={lenders}
              onOpenClient={openClient}
              onAddClient={openManualIntake}
              onOpenAIIntake={openApplicationIntake}
              onOpenNewClientIntake={openApplicationIntake}
              viewMode="pipeline"
              setViewMode={setClientViewMode}
              agentNames={getAgentNames()}
              searchQuery={globalSearch}
              onSearchQueryChange={setGlobalSearch}
            />
          )}

          {activeTab === "calculators" && (
            <Calculators 
              clients={clients}
              calcClientId={calcClientId}
              setCalcClientId={setCalcClientId}
              stIncome={stIncome}
              setStIncome={setStIncome}
              stCoIncome={stCoIncome}
              setStCoIncome={setStCoIncome}
              stDebts={stDebts}
              setStDebts={setStDebts}
              stCondo={stCondo}
              setStCondo={setStCondo}
              stTax={stTax}
              setStTax={setStTax}
              stHeat={stHeat}
              setStHeat={setStHeat}
              stRate={stRate}
              setStRate={setStRate}
              stAmortization={stAmortization}
              setStAmortization={setStAmortization}
              pcAmount={pcAmount}
              setPcAmount={setPcAmount}
              pcRate={pcRate}
              setPcRate={setPcRate}
              pcAm={pcAm}
              setPcAm={setPcAm}
              pcFreq={pcFreq}
              setPcFreq={setPcFreq}
              gcIncome={gcIncome}
              setGcIncome={setGcIncome}
              gcPmt={gcPmt}
              setGcPmt={setGcPmt}
              gcTax={gcTax}
              setGcTax={setGcTax}
              gcHeat={gcHeat}
              setGcHeat={setGcHeat}
              gcCondo={gcCondo}
              setGcCondo={setGcCondo}
              gcDebts={gcDebts}
              setGcDebts={setGcDebts}
              hrRate={hrRate}
              setHrRate={setHrRate}
              hrHrs={hrHrs}
              setHrHrs={setHrHrs}
              seY1={seY1}
              setSeY1={setSeY1}
              seY2={seY2}
              setSeY2={setSeY2}
              onLoadClientToCalc={handleLoadClientToCalc}
              onClearCalcClient={handleClearCalcClient}
              cPmt={cPmt}
              pToAmt={pToAmt}
              fd={fd}
              showToast={showToast}
            />
          )}

          {activeTab === "ai" && (
            <AIAssistantCenter 
              clients={clients}
              currentUser={currentUser}
              docVault={docVault}
              tasks={tasks}
              onAddTask={(newTask) => {
                const addedTask: Task = {
                  ...newTask,
                  id: `task_${Date.now()}_${Math.random().toString(36).substr(2, 5)}`,
                  createdAt: new Date().toISOString(),
                  updatedAt: new Date().toISOString(),
                  createdBy: `${currentUser.first} ${currentUser.last}`
                };
                setTasks(prev => {
                  const updated = [...prev, addedTask];
                  localStorage.setItem("gbk_tasks", JSON.stringify(updated));
                  return updated;
                });
              }}
              onUpdateClient={handleUpdateClient}
              showToast={showToast}
            />
          )}

          {activeTab === "messages" && (
            <Messages 
              messages={messages}
              setMessages={setMessages}
              clients={clients}
              currentUser={currentUser}
              activeChannel={activeChannel}
              setActiveChannel={setActiveChannel}
              linkedChatClientId={linkedChatClientId}
              setLinkedChatClientId={setLinkedChatClientId}
              onOpenClient={openClient}
              tasks={tasks}
              setTasks={setTasks}
              showToast={showToast}
            />
          )}

          {activeTab === "emails" && (
            <EmailView 
              emailsState={emailsState}
              setEmailsState={setEmailsState}
              templates={DEFAULT_TEMPLATES}
              currentUser={currentUser}
              onOpenCompose={() => setEmailComposeOpen(true)}
              showToast={showToast}
              clients={clients}
              setClients={setClients}
              tasks={tasks}
              setTasks={setTasks}
              events={events}
              setEvents={setEvents}
              onOpenClient={openClient}
              logActivity={logActivity}
              docVault={docVault}
              setDocVault={setDocVault}
              bridgeOnline={bridgeOnline}
            />
          )}

          {activeTab === "lenders" && (
            <LenderSheets 
              lenders={lenders}
              setLenders={setLenders}
              clients={clients}
              showToast={showToast}
              onOpenComposeEmail={handleOpenComposeWithDetails}
            />
          )}

          {activeTab === "calendar" && (
            <CalendarView 
              events={events}
              setEvents={setEvents}
              tasks={tasks}
              setTasks={setTasks}
              clients={clients}
              showToast={showToast}
            />
          )}

          {activeTab === "tasks" && (
            <TasksView 
              tasks={tasks}
              setTasks={setTasks}
              clients={clients}
              showToast={showToast}
              events={events}
              setEvents={setEvents}
              userRoster={userRoster}
              currentUser={currentUser}
            />
          )}

          {activeTab === "partners" && (
            <Partners 
              partners={partners}
              setPartners={setPartners}
              clients={clients}
              tasks={tasks}
              setTasks={setTasks}
              currentUser={currentUser}
              userRoster={userRoster}
              showToast={showToast}
              onOpenComposeEmail={handleOpenComposeWithDetails}
            />
          )}

          {activeTab === "reports" && (
            <Reports 
              clients={clients}
              lenders={lenders}
              userRoster={userRoster}
              currentUser={currentUser}
              tasks={tasks}
              partners={partners}
              showToast={showToast}
            />
          )}

          {activeTab === "retention" && (
            <Retention 
              clients={clients}
              setClients={setClients}
              tasks={tasks}
              setTasks={setTasks}
              userRoster={userRoster}
              currentUser={currentUser}
              showToast={showToast}
            />
          )}

          {activeTab === "compliance" && (
            <Compliance 
              clients={clients}
              setClients={setClients}
              tasks={tasks}
              setTasks={setTasks}
              userRoster={userRoster}
              currentUser={currentUser}
              auditLogs={auditLogs}
              setAuditLogs={setAuditLogs}
              docVault={docVault}
              setDocVault={setDocVault}
              sessionAutoLock={sessionAutoLock}
              setAutoLockEnabled={setAutoLockEnabled}
              autoLockMinutes={autoLockMinutes}
              setAutoLockMinutes={setAutoLockMinutes}
              auditLoggingEnabled={auditLoggingEnabled}
              setAuditLogEnabled={setAuditLogEnabled}
              onLockApp={() => setAppLocked(true)}
              showToast={showToast}
            />
          )}

          {activeTab === "file_readiness" && (
            <FileReadiness 
              clients={clients}
              currentUser={currentUser}
              docVault={docVault}
              setDocVault={setDocVault}
              onOpenClient={openClient}
              showToast={showToast}
              agentNames={getAgentNames()}
              isOwnerOrManager={currentUser.role === 'Owner / Master Admin' || currentUser.role === 'Super Admin' || currentUser.role === 'IT / Developer'}
              onUpdateClient={handleUpdateClient}
            />
          )}

          {activeTab === "admin" && (
            <AdminPanel 
              userRoster={userRoster}
              setUserRoster={setUserRoster}
              currentUser={currentUser}
              setCurrentUser={setCurrentUser}
              clients={clients}
              tasks={tasks}
              auditLogs={auditLogs}
              setAuditLogs={setAuditLogs}
              sessionAutoLock={sessionAutoLock}
              setAutoLockEnabled={setAutoLockEnabled}
              autoLockMinutes={autoLockMinutes}
              setAutoLockMinutes={setAutoLockMinutes}
              auditLoggingEnabled={auditLoggingEnabled}
              setAuditLogEnabled={setAuditLogEnabled}
              onLockApp={() => setAppLocked(true)}
              showToast={showToast}
              lenders={lenders}
              settings={settings}
              bridgeOnline={bridgeOnline}
              versionMismatch={versionMismatch}
              bridgeVersion={bridgeVersion}
            />
          )}

          {activeTab === "settings" && (
            <Settings 
              currentUser={currentUser}
              setCurrentUser={setCurrentUser}
              userRoster={userRoster}
              setUserRoster={setUserRoster}
              showToast={showToast}
              onLockApp={() => setAppLocked(true)}
              clients={clients}
            />
          )}
        </main>
      </div>

      {/* ✦ New Client Intake / PDF Application Intake Overlay ✦ */}
      {applicationIntakeOpen && (
        <ApplicationIntake
          mode="ai"
          preloadedText={intakePreloadedText}
          preloadedFileName={intakePreloadedFileName}
          onClearPreloaded={() => {
            setIntakePreloadedText("");
            setIntakePreloadedFileName("");
          }}
          currentUser={currentUser}
          clients={clients}
          onClose={() => setApplicationIntakeOpen(false)}
          onCreateClient={handleCreateClientFromIntake}
          agentNames={getAgentNames()}
          apiKeySet={!!settings.apiKey}
          showToast={showToast}
        />
      )}

      {/* ✦ Manual Client Intake Form Modal Overlay ✦ */}
      {newClientOpen && (
        <ApplicationIntake
          mode="manual"
          currentUser={currentUser}
          clients={clients}
          onClose={() => setNewClientOpen(false)}
          onCreateClient={(newClient) => {
            handleCreateClient(newClient);
            logActivity("Created new file manually", `${newClient.first} ${newClient.last}`);
            showToast("Manual client file created successfully!", "success");
          }}
          agentNames={getAgentNames()}
          apiKeySet={!!settings.apiKey}
          showToast={showToast}
        />
      )}

      {/* ✦ Z Drive Panel Overlay ✦ */}
      {zDriveOpen && (
        <ZDrivePanel
          isOpen={zDriveOpen}
          onClose={() => setZDriveOpen(false)}
          onSendToIntake={(content, name) => {
            setIntakePreloadedText(content);
            setIntakePreloadedFileName(name);
            openApplicationIntake();
            setZDriveOpen(false);
          }}
          showToast={showToast}
        />
      )}

      {/* Detail panel slider */}
      <ClientDetailPanel
        currentClient={currentClient}
        currentUser={currentUser}
        clients={clients}
        lenders={lenders}
        docVault={docVault}
        setDocVault={setDocVault}
        detailTab={detailTab}
        setDetailTab={setDetailTab}
        closeDetail={closeDetail}
        openClient={openClient}
        handleUpdateClient={handleUpdateClient}
        handleUpdateClientStatus={handleUpdateClientStatus}
        handleDeleteClient={handleDeleteClient}
        triggerUnderwritingAnalysis={triggerUnderwritingAnalysis}
        underwritingLoading={underwritingLoading}
        underwritingError={underwritingError}
        getAgentNames={getAgentNames}
        showToast={showToast}
        bridgeOnline={bridgeOnline}
      />

      {/* Settings Modal config */}
      <AnimatePresence>
        {settingsModalOpen && (
          <div className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center p-4 backdrop-blur-sm">
            <div 
              className="border rounded-2xl w-full max-w-sm p-6 shadow-2xl relative"
              style={{
                background: "rgba(18, 19, 26, 0.85)",
                borderColor: "rgba(255, 255, 255, 0.05)",
                backdropFilter: "blur(24px)",
                WebkitBackdropFilter: "blur(24px)"
              }}
            >
              <button onClick={() => setSettingsModalOpen(false)} className="absolute right-4 top-4 text-white/50 hover:text-white p-1 rounded-full hover:bg-white/5 transition-all cursor-pointer">✕</button>
              <h3 className="text-[10px] font-black text-white uppercase tracking-widest mb-4 border-b pb-2" style={{ borderColor: "var(--color-divider)" }}>CRM Configuration</h3>
              
              <div className="flex flex-col gap-4">
                <div>
                  <label className="block text-[8px] text-[var(--color-text-muted)] uppercase font-black tracking-widest mb-1.5">Interactive Advisor Name</label>
                  <input 
                    type="text" 
                    value={currentUser.first + " " + currentUser.last}
                    onChange={(e) => {
                      const parts = e.target.value.split(" ");
                      setCurrentUser(prev => ({ ...prev, first: parts[0] || "", last: parts.slice(1).join(" ") }));
                    }}
                    className="w-full bg-black/20 border border-white/5 rounded-xl px-4 py-2.5 text-xs text-white focus:outline-none focus:border-[#F9B17A]/40 transition-all font-semibold"
                  />
                </div>

                <div>
                  <label className="block text-[8px] text-[var(--color-text-muted)] uppercase font-black tracking-widest mb-1.5">Gemini API Key</label>
                  <input 
                    type="password" 
                    value={settings.apiKey || ""}
                    onChange={(e) => {
                      const apiVal = e.target.value;
                      setSettings(prev => ({ ...prev, apiKey: apiVal }));
                      localStorage.setItem("gbk_apiKey", apiVal);
                    }}
                    placeholder="sk-ant-api03-..."
                    className="w-full bg-black/20 border border-white/5 rounded-xl px-4 py-2.5 text-xs text-white focus:outline-none focus:border-[#F9B17A]/40 transition-all font-semibold"
                  />
                  <span className="text-[9px] text-[var(--color-text-faint)] font-bold mt-1.5 block leading-normal">Stored locally inside browser sandbox cache. Allows instant AI reports.</span>
                </div>

                <button 
                  onClick={() => {
                    setSettingsModalOpen(false);
                    showToast("Configuration safely saved!", "success");
                  }}
                  className="w-full mt-2 text-[#12131a] font-black uppercase tracking-wider text-[10px] py-3 rounded-xl hover:opacity-95 transition-all cursor-pointer shadow-md hover:shadow-[0_0_20px_rgba(249,177,122,0.25)]"
                  style={{ background: "var(--grad-warm)" }}
                >
                  Save and Dismiss
                </button>
              </div>
            </div>
          </div>
        )}
      </AnimatePresence>

      {/* Profile/Signup & Credential Manager Modal */}
      <AnimatePresence>
        {profileModalOpen && (
          <div className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center p-4 backdrop-blur-sm">
            <div 
              className="border rounded-2xl w-full max-w-md p-6 shadow-2xl relative max-h-[90vh] overflow-y-auto flex flex-col scrollbar-thin"
              style={{
                background: "rgba(18, 19, 26, 0.85)",
                borderColor: "rgba(255, 255, 255, 0.05)",
                backdropFilter: "blur(24px)",
                WebkitBackdropFilter: "blur(24px)"
              }}
            >
              <button 
                onClick={() => setProfileModalOpen(false)} 
                className="absolute right-4 top-4 text-white/50 hover:text-white p-1 rounded-full hover:bg-white/5 transition-all cursor-pointer text-sm"
              >
                ✕
              </button>
              
              <h3 className="text-[10px] font-black text-white uppercase tracking-widest mb-4 pb-2 border-b" style={{ borderColor: "var(--color-divider)" }}>
                Broker Account & Credentials
              </h3>
              
              {/* Tabs */}
              <div className="flex border-b mb-5 shrink-0" style={{ borderColor: "var(--color-divider)" }}>
                {[
                  { id: 'profile', label: 'Active Sync' },
                  { id: 'signup', label: 'Sign Up' },
                  { id: 'switch', label: 'Switch Broker' }
                ].map(tab => {
                  const isSelected = profileTab === tab.id;
                  return (
                    <button 
                      key={tab.id}
                      onClick={() => {
                        setProfileTab(tab.id as any);
                        if (tab.id === 'switch') {
                          setSwError("");
                          setSwPin("");
                        }
                      }} 
                      className={`flex-1 pb-2.5 text-[9px] uppercase font-black tracking-widest text-center border-b-2 transition-colors cursor-pointer ${
                        isSelected 
                          ? 'border-[#F9B17A] text-[#F9B17A]' 
                          : 'border-transparent text-white/40 hover:text-white'
                      }`}
                    >
                      {tab.label}
                    </button>
                  );
                })}
              </div>

              {/* TAB CONTENT: PROFILE SYNC EDIT */}
              {profileTab === 'profile' && (
                <div className="flex flex-col gap-4">
                  <div className="bg-white/[0.02] p-4 rounded-xl border border-white/5">
                    <div className="text-xs font-black text-white mb-0.5">{currentUser.first} {currentUser.last}</div>
                    <div className="text-[10px] text-[#F9B17A] font-extrabold uppercase tracking-wider mb-2">{currentUser.role}</div>
                    <div className="text-[10px] text-[var(--color-text-muted)] flex flex-col gap-1 font-mono font-bold leading-relaxed">
                      <span>Email: {currentUser.email}</span>
                      {currentUser.phone && <span>Phone: {currentUser.phone}</span>}
                      {currentUser.fsraNum && <span>Licence FSRA: {currentUser.fsraNum}</span>}
                    </div>
                  </div>

                  <span className="text-[8px] uppercase font-black tracking-widest text-[var(--color-text-faint)] mt-1">Workspace Credentials Settings</span>
                  
                  <div className="flex flex-col gap-3">
                    <div>
                      <label className="block text-[8px] text-[var(--color-text-muted)] uppercase font-black tracking-widest mb-1.5">Incoming IMAP/SMTP Username</label>
                      <input 
                        type="text" 
                        placeholder="e.g. email@gbkfinancial.ca"
                        value={activeUsername}
                        onChange={(e) => setActiveUsername(e.target.value)}
                        className="w-full bg-black/20 border border-white/5 rounded-xl px-4 py-2.5 text-xs text-white focus:outline-none focus:border-[#F9B17A]/40 transition-all font-semibold"
                      />
                    </div>

                    <div>
                      <label className="block text-[8px] text-[var(--color-text-muted)] uppercase font-black tracking-widest mb-1.5">Email App Password</label>
                      <input 
                        type="password" 
                        placeholder="••••••••••••••••"
                        value={activePassword}
                        onChange={(e) => setActivePassword(e.target.value)}
                        className="w-full bg-black/20 border border-white/5 rounded-xl px-4 py-2.5 text-xs text-white focus:outline-none focus:border-[#F9B17A]/40 transition-all font-mono font-semibold"
                      />
                    </div>

                    <div className="grid grid-cols-2 gap-3">
                      <div>
                        <label className="block text-[8px] text-[var(--color-text-muted)] uppercase font-black tracking-widest mb-1.5">Server Host</label>
                        <input 
                          type="text" 
                          placeholder="e.g. imap.gmail.com"
                          value={activeHost}
                          onChange={(e) => setActiveHost(e.target.value)}
                          className="w-full bg-black/20 border border-white/5 rounded-xl px-4 py-2.5 text-xs text-white focus:outline-none focus:border-[#F9B17A]/40 transition-all font-mono font-semibold"
                        />
                      </div>
                      <div>
                        <label className="block text-[8px] text-[var(--color-text-muted)] uppercase font-black tracking-widest mb-1.5">Server Port</label>
                        <input 
                          type="text" 
                          placeholder="993"
                          value={activePort}
                          onChange={(e) => setActivePort(e.target.value)}
                          className="w-full bg-black/20 border border-white/5 rounded-xl px-4 py-2.5 text-xs text-white focus:outline-none focus:border-[#F9B17A]/40 transition-all font-mono font-semibold"
                        />
                      </div>
                    </div>

                    <div className="flex gap-3 mt-3 border-t pt-4" style={{ borderColor: "var(--color-divider)" }}>
                      <button 
                        onClick={() => {
                          const updatedUser = {
                            ...currentUser,
                            emailHost: "",
                            emailPort: "",
                            emailUsername: "",
                            emailPassword: ""
                          };
                          setCurrentUser(updatedUser);
                          const updatedRoster = userRoster.map(u => u.id === currentUser.id ? updatedUser : u);
                          setUserRoster(updatedRoster);
                          localStorage.setItem("gbk_roster", JSON.stringify(updatedRoster));
                          localStorage.removeItem("gbk_gmail_loggedin");
                          logActivity(`Disconnected Workspace email credentials`, currentUser.email);
                          showToast("Workspace credentials disconnected successfully.", "success", "🔓");
                          setProfileModalOpen(false);
                        }}
                        className="flex-1 bg-red-600/10 hover:bg-red-600/25 border border-red-500/25 text-red-400 font-bold text-[10px] py-3 rounded-xl transition-all cursor-pointer"
                      >
                        Disconnect Sync
                      </button>
                      <button 
                        onClick={async () => {
                          const plainPin = currentUser.pin;
                          const encryptedPassword = activePassword ? await encryptValue(activePassword, plainPin) : "";
                          const encryptedPin = await encryptValue(plainPin, plainPin);
                          const pinHash = await hashPin(plainPin, currentUser.id);
 
                          const updatedUserForRoster = {
                            ...currentUser,
                            emailHost: activeHost,
                            emailPort: activePort,
                            emailUsername: activeUsername,
                            emailPassword: encryptedPassword,
                            pin: encryptedPin,
                            pinHash
                          };
 
                          const updatedUserInMemory = {
                            ...currentUser,
                            emailHost: activeHost,
                            emailPort: activePort,
                            emailUsername: activeUsername,
                            emailPassword: activePassword
                          };
 
                          setCurrentUser(updatedUserInMemory);
                          const updatedRoster = userRoster.map(u => u.id === currentUser.id ? updatedUserForRoster : u);
                          setUserRoster(updatedRoster);
                          localStorage.setItem("gbk_roster", JSON.stringify(updatedRoster));
                          logActivity(`Configured custom email credentials`, currentUser.email);
                          showToast("Workspace Credentials Sync Enabled!", "success", "🔐");
                          setProfileModalOpen(false);
                        }}
                        className="flex-1 text-[#12131a] font-black uppercase tracking-wider text-[10px] py-3 rounded-xl hover:opacity-95 transition-all cursor-pointer shadow-md hover:shadow-[0_0_20px_rgba(249,177,122,0.25)]"
                        style={{ background: "var(--grad-warm)" }}
                      >
                        ✓ Save & Sync
                      </button>
                    </div>
                  </div>
                </div>
              )}

              {/* TAB CONTENT: SIGN UP */}
              {profileTab === 'signup' && (
                <form 
                  onSubmit={async (e) => {
                    e.preventDefault();
                    if (!suFirst || !suLast || !suEmail || !suPin) {
                      showToast("Please fill out First Name, Last Name, Email, and PIN.", "error");
                      return;
                    }
                    const newUserId = `u_${Date.now()}`;
                    const pinHash = await hashPin(suPin, newUserId);
                    const encryptedPin = await encryptValue(suPin, suPin);
                    const encryptedEmailPassword = suPass ? await encryptValue(suPass, suPin) : undefined;
 
                    const newUserRecord: User = {
                      id: newUserId,
                      first: suFirst,
                      last: suLast,
                      email: suEmail,
                      role: suRole,
                      status: 'active',
                      phone: suPhone || undefined,
                      pin: encryptedPin,
                      pinHash,
                      lastLogin: new Date().toISOString(),
                      created: new Date().toISOString().split("T")[0],
                      fsraNum: suFsra || undefined,
                      emailHost: suHost,
                      emailPort: suPort,
                      emailUsername: suEmail,
                      emailPassword: encryptedEmailPassword
                    };
                    const newRoster = [...userRoster, newUserRecord];
                    setUserRoster(newRoster);
                    localStorage.setItem("gbk_roster", JSON.stringify(newRoster));
                    
                    const decryptedUserRecord: User = {
                      ...newUserRecord,
                      pin: suPin,
                      emailPassword: suPass || undefined
                    };
                    setCurrentUser(decryptedUserRecord);
                    setProfileModalOpen(false);
                    setSuFirst("");
                    setSuLast("");
                    setSuEmail("");
                    setSuPin("");
                    setSuPhone("");
                    setSuFsra("");
                    setSuPass("");
                    logActivity(`Signed up new Broker account: ${newUserRecord.first} ${newUserRecord.last}`, newUserRecord.email);
                    showToast(`Welcome aboard, ${newUserRecord.first}! Signed up successfully!`, "success", "🌟");
                  }} 
                  className="flex flex-col gap-3"
                >
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="block text-[8px] text-[var(--color-text-muted)] uppercase font-black tracking-widest mb-1.5">First Name</label>
                      <input 
                        type="text" 
                        value={suFirst}
                        onChange={(e) => setSuFirst(e.target.value)}
                        className="w-full bg-black/20 border border-white/5 rounded-xl px-4 py-2.5 text-xs text-white focus:outline-none focus:border-[#F9B17A]/40 transition-all font-semibold"
                        required
                      />
                    </div>
                    <div>
                      <label className="block text-[8px] text-[var(--color-text-muted)] uppercase font-black tracking-widest mb-1.5">Last Name</label>
                      <input 
                        type="text" 
                        value={suLast}
                        onChange={(e) => setSuLast(e.target.value)}
                        className="w-full bg-black/20 border border-white/5 rounded-xl px-4 py-2.5 text-xs text-white focus:outline-none focus:border-[#F9B17A]/40 transition-all font-semibold"
                        required
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-[8px] text-[var(--color-text-muted)] uppercase font-black tracking-widest mb-1.5">Business Email</label>
                    <input 
                      type="email" 
                      value={suEmail}
                      onChange={(e) => setSuEmail(e.target.value)}
                      placeholder="e.g. agent@gbkfinancial.ca"
                      className="w-full bg-black/20 border border-white/5 rounded-xl px-4 py-2.5 text-xs text-white focus:outline-none focus:border-[#F9B17A]/40 transition-all font-semibold"
                      required
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="block text-[8px] text-[var(--color-text-muted)] uppercase font-black tracking-widest mb-1.5">Security PIN (4 Digits)</label>
                      <input 
                        type="password" 
                        maxLength={4}
                        value={suPin}
                        onChange={(e) => setSuPin(e.target.value.replace(/\D/g, ""))}
                        placeholder="••••"
                        className="w-full bg-black/20 border border-white/5 rounded-xl px-4 py-2.5 text-xs text-white text-center tracking-widest font-mono focus:outline-none focus:border-[#F9B17A]/40 transition-all font-semibold"
                        required
                      />
                    </div>
                    <div>
                      <label className="block text-[8px] text-[var(--color-text-muted)] uppercase font-black tracking-widest mb-1.5">FSRA Licence #</label>
                      <input 
                        type="text" 
                        value={suFsra}
                        onChange={(e) => setSuFsra(e.target.value)}
                        placeholder="e.g. M230045"
                        className="w-full bg-black/20 border border-white/5 rounded-xl px-4 py-2.5 text-xs text-white focus:outline-none focus:border-[#F9B17A]/40 transition-all font-semibold"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-[8px] text-[var(--color-text-muted)] uppercase font-black tracking-widest mb-1.5">Operational Role</label>
                    <select 
                      value={suRole}
                      onChange={(e) => setSuRole(e.target.value as any)}
                      className="w-full bg-black/20 border border-white/5 rounded-xl p-3 text-xs text-white focus:outline-none focus:border-[#F9B17A]/40 transition-all font-bold cursor-pointer"
                    >
                      <option value="Agent">🏡 Licensed Mortgage Agent</option>
                      <option value="Senior Broker">🥇 Senior Broker Consultant</option>
                      <option value="Super Admin">💼 Operations Super Admin</option>
                      <option value="Owner / Master Admin">👑 Owner / Master Director</option>
                    </select>
                  </div>

                  <span className="text-[8px] uppercase font-black tracking-widest text-[var(--color-text-faint)] mt-1.5">Optional GSuite Email host Sync</span>
                  <div className="grid grid-cols-2 gap-3">
                    <input 
                      type="text" 
                      placeholder="imap.gmail.com"
                      value={suHost}
                      onChange={(e) => setSuHost(e.target.value)}
                      className="w-full bg-black/20 border border-white/5 rounded-xl px-4 py-2.5 text-xs text-white focus:outline-none focus:border-[#F9B17A]/40 transition-all font-mono font-semibold"
                    />
                    <input 
                      type="password" 
                      placeholder="Gmail App Password"
                      value={suPass}
                      onChange={(e) => setSuPass(e.target.value)}
                      className="w-full bg-black/20 border border-white/5 rounded-xl px-4 py-2.5 text-xs text-white focus:outline-none focus:border-[#F9B17A]/40 transition-all font-mono font-semibold"
                    />
                  </div>

                  <button 
                    type="submit"
                    className="w-full mt-2 text-[#12131a] font-black uppercase tracking-wider text-[10px] py-3 rounded-xl hover:opacity-95 transition-all cursor-pointer shadow-md hover:shadow-[0_0_20px_rgba(249,177,122,0.25)]"
                    style={{ background: "var(--grad-warm)" }}
                  >
                    Register and Login as Agent
                  </button>
                </form>
              )}

              {/* TAB CONTENT: SWITCH ACTIVE USER */}
              {profileTab === 'switch' && (
                <div className="flex flex-col gap-3">
                  <div className="max-h-56 overflow-y-auto flex flex-col gap-1.5 pr-1 scrollbar-thin">
                    {userRoster.map(u => (
                      <button
                        key={u.id}
                        type="button"
                        onClick={() => {
                          setSwTargetId(u.id);
                          setSwPin("");
                          setSwError("");
                        }}
                        className={`p-3 rounded-xl border text-left flex items-center justify-between transition-all cursor-pointer ${
                          swTargetId === u.id 
                            ? 'border-[#F9B17A] bg-[#F9B17A]/5' 
                            : 'border-white/5 bg-white/[0.01] hover:bg-white/5'
                        }`}
                      >
                        <div>
                          <div className={`text-xs font-black ${swTargetId === u.id ? 'text-[#F9B17A]' : 'text-white'}`}>{u.first} {u.last}</div>
                          <div className="text-[9px] text-[var(--color-text-muted)] font-black uppercase tracking-wider mt-0.5">{u.role}</div>
                        </div>
                        <div className="text-[10px] text-white/30 truncate font-mono max-w-[140px] font-bold">{u.email}</div>
                      </button>
                    ))}
                  </div>

                  {swTargetId && (
                    <form 
                      onSubmit={async (e) => {
                        e.preventDefault();
                        const match = userRoster.find(u => u.id === swTargetId);
                        if (!match) {
                          setSwError("Target user profile not found");
                          return;
                        }

                        let pinMatches = false;
                        if (match.pinHash) {
                          const hashed = await hashPin(swPin, match.id);
                          pinMatches = (match.pinHash === hashed);
                        } else {
                          pinMatches = (match.pin === swPin);
                        }

                        if (pinMatches) {
                          const decryptedEmailPassword = match.emailPassword ? await decryptValue(match.emailPassword, swPin) : undefined;
                          const decryptedUser: User = {
                            ...match,
                            pin: swPin,
                            emailPassword: decryptedEmailPassword || undefined
                          };
                          setCurrentUser(decryptedUser);
                          setProfileModalOpen(false);
                          setSwTargetId("");
                          setSwPin("");
                          setSwError("");
                          logActivity(`Switched Workspace to user ${match.first} ${match.last}`, match.email);
                          showToast(`Switched workspace to ${match.first} ${match.last}!`, "success", "👤");
                        } else {
                          setSwError("Incorrect 4-digit PIN code");
                          setSwPin("");
                        }
                      }} 
                      className="mt-2 border-t pt-4 flex flex-col gap-2.5"
                      style={{ borderColor: "var(--color-divider)" }}
                    >
                      <div className="text-[10px] text-white/60 mb-1 font-bold">Enter your 4-digit Security PIN to switch:</div>
                      
                      <div className="flex gap-3">
                        <input 
                          type="password"
                          maxLength={4}
                          value={swPin}
                          onChange={(e) => setSwPin(e.target.value.replace(/\D/g, ""))}
                          placeholder="••••"
                          className="w-32 bg-black/20 border border-white/10 rounded-xl px-4 text-center text-sm font-mono font-black tracking-widest text-[#F9B17A] focus:outline-none focus:border-[#F9B17A]/40"
                          required
                        />
                        <button 
                          type="submit"
                          className="flex-1 bg-[#F9B17A]/10 hover:bg-[#F9B17A]/15 border border-[#F9B17A]/25 text-[#F9B17A] font-black uppercase tracking-wider text-[10px] py-3 rounded-xl transition-all cursor-pointer"
                        >
                          Confirm Switch
                        </button>
                      </div>

                      {swError && (
                        <span className="text-[10px] text-red-400 mt-1 font-bold uppercase tracking-wider">{swError}</span>
                      )}
                    </form>
                  )}
                </div>
              )}
            </div>
          </div>
        )}
      </AnimatePresence>

    </div>
  );
}
