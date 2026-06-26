import React, { useState, useEffect, useRef } from "react";
import { 
  Users, Layers, Calendar, CheckSquare, MessageSquare, 
  BrainCircuit, Calculator, ShieldAlert, Mail, BarChart3, Heart, 
  ShieldCheck, FileText, Key, LogOut, Lock, Search, ChevronDown, Settings as SettingsIcon, 
  Trash2, Copy, Send, Plus, CheckCircle2, AlertTriangle, 
  Clock, Award, Globe, FileSpreadsheet, Share2, Sparkles, Filter, 
  MailOpen, RefreshCw, Phone, MessageCircle
} from "lucide-react";
import { motion, AnimatePresence } from "motion/react";
import { 
  DEFAULT_CLIENTS, DEFAULT_LENDERS, DEFAULT_USERS, DEFAULT_MESSAGES, 
  DEFAULT_EMAILS, DEFAULT_TEMPLATES, DEFAULT_PARTNERS 
} from "./data";
import { Client, Lender, User, Task, Event, Email, EmailTemplate, Partner, Post } from "./types";
import { Sidebar } from "./components/Sidebar";
import { Dashboard } from "./components/Dashboard";
import { ClientsList } from "./components/ClientsList";
import { Calculators } from "./components/Calculators";
import { AIIntake } from "./components/AIIntake";
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
import { DocumentManager } from "./components/DocumentManager";
import { FileReadiness } from "./components/FileReadiness";
import { Settings } from "./components/Settings";
import { MortgageChecklist } from "./components/MortgageChecklist";
import { MortgageActivityTracker } from "./components/MortgageActivityTracker";
import { logActivityEvent } from "./lib/activityEngine";
import { CHECKLIST_RULES, STATUS_STYLING } from "./components/document/constants";

export default function App() {
  // ─── STATE MANAGEMENT ───
  const [clients, setClients] = useState<Client[]>(() => {
    const saved = localStorage.getItem("gbk_clients");
    return saved ? JSON.parse(saved) : DEFAULT_CLIENTS;
  });
  const [lenders, setLenders] = useState<Lender[]>(() => {
    const saved = localStorage.getItem("gbk_lenders");
    return saved ? JSON.parse(saved) : DEFAULT_LENDERS;
  });
  const [partners, setPartners] = useState<Partner[]>(() => {
    const saved = localStorage.getItem("gbk_partners");
    return saved ? JSON.parse(saved) : DEFAULT_PARTNERS;
  });
  const [tasks, setTasks] = useState<Task[]>(() => {
    const saved = localStorage.getItem("gbk_tasks");
    const arr = saved ? JSON.parse(saved) : [];
    if (!arr.length) {
      // Seed initial tasks
      return [
        { id: "t_1", title: "Follow up with David Martinez regarding teacher salary paystubs", status: "open", priority: "high", dueDate: new Date().toISOString().split("T")[0], clientId: "c_smith", clientName: "David Martinez", assignedTo: "David Acosta", notes: "Lender condition outstanding on loan.", createdAt: new Date().toISOString(), updatedAt: new Date().toISOString(), createdBy: "System" },
        { id: "t_2", title: "Run GDS/TDS stress analysis on Marcus Jackson stated income", status: "open", priority: "medium", dueDate: new Date().toISOString().split("T")[0], clientId: "c_jackson", clientName: "Marcus Jackson", assignedTo: "David Acosta", notes: "Alt-A applicant scenario.", createdAt: new Date().toISOString(), updatedAt: new Date().toISOString(), createdBy: "System" }
      ];
    }
    return arr;
  });
  const [events, setEvents] = useState<Event[]>(() => {
    const saved = localStorage.getItem("gbk_events");
    const initialEvents: Event[] = [];
    const yearStr = new Date().getFullYear();
    const monthStr = String(new Date().getMonth() + 1).padStart(2, "0");

    DEFAULT_CLIENTS.forEach(c => {
      if (c.dob) {
        const d = new Date(c.dob);
        initialEvents.push({
          id: `bd_${c.id}`,
          title: `🎂 ${c.first} ${c.last}'s Birthday`,
          date: `${yearStr}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`,
          type: "birthday",
          clientId: c.id,
          createdBy: "System"
        });
      }
    });

    // Add high-quality mortgage CRM events
    initialEvents.push(
      {
        id: "ev_1",
        title: "TD BDM Appraisal Review - David Martinez",
        date: `${yearStr}-${monthStr}-22`,
        time: "10:00",
        type: "lender",
        clientId: "c_smith",
        notes: "Discuss appraisal valuation on Simcoe property with Sarah Jenkins.",
        createdBy: "System"
      },
      {
        id: "ev_2",
        title: "Martinez Commitment Sign-off Call",
        date: `${yearStr}-${monthStr}-22`,
        time: "14:00",
        type: "client",
        clientId: "c_smith",
        notes: "Review commitment conditions and collect outstanding paystubs.",
        createdBy: "System"
      },
      {
        id: "ev_3",
        title: "RBC Rate Lock Strategy Review",
        date: `${yearStr}-${monthStr}-23`,
        time: "11:30",
        type: "meeting",
        clientId: "c_chen",
        notes: "Analyze GDS/TDS ratios and explore 5-year fixed lock options.",
        createdBy: "System"
      },
      {
        id: "ev_4",
        title: "Stated Income BFS Underwriting Audit",
        date: `${yearStr}-${monthStr}-23`,
        time: "16:00",
        type: "lender",
        clientId: "c_chen",
        notes: "Internal files audit with Wayne on self-employed documentation guidelines.",
        createdBy: "System"
      },
      {
        id: "ev_5",
        title: "Sarah Thompson NOA Verification call",
        date: `${yearStr}-${monthStr}-24`,
        time: "09:30",
        type: "client",
        clientId: "c_thompson",
        notes: "Verification of Notice of Assessments for Sarah Thompson pre-approval.",
        createdBy: "System"
      },
      {
        id: "ev_6",
        title: "First National Escalation Sync",
        date: `${yearStr}-${monthStr}-24`,
        time: "13:00",
        type: "lender",
        notes: "BDM escalation call regarding underwriting pre-approval exception.",
        createdBy: "System"
      },
      {
        id: "ev_7",
        title: "GBK Team Weekly Pipeline Review",
        date: `${yearStr}-${monthStr}-24`,
        time: "15:30",
        type: "meeting",
        notes: "Brokerage-wide active deals review with Tim Brown and Jamey Brown.",
        createdBy: "System"
      },
      {
        id: "ev_8",
        title: "Equity Bank Alt-A BFS Submission",
        date: `${yearStr}-${monthStr}-25`,
        time: "11:00",
        type: "lender",
        notes: "Submit and pitch stated income file to Equitable Bank.",
        createdBy: "System"
      },
      {
        id: "ev_9",
        title: "Henderson Firm Approval Milestone",
        date: `${yearStr}-${monthStr}-26`,
        time: "10:00",
        type: "client",
        notes: "Closing and firm sign-off celebration with the buyers.",
        createdBy: "System"
      }
    );

    if (saved) {
      const parsed = JSON.parse(saved);
      if (!parsed.some((e: any) => e.id.startsWith("ev_"))) {
        localStorage.setItem("gbk_events", JSON.stringify(initialEvents));
        return initialEvents;
      }
      return parsed;
    }

    localStorage.setItem("gbk_events", JSON.stringify(initialEvents));
    return initialEvents;
  });
  const [messages, setMessages] = useState<Record<string, any[]>>(() => {
    const saved = localStorage.getItem("gbk_messages");
    return saved ? JSON.parse(saved) : DEFAULT_MESSAGES;
  });
  const [emailsState, setEmailsState] = useState<{ inbox: Email[]; sent: Email[]; scheduled: Email[] }>(() => {
    const saved = localStorage.getItem("gbk_emails");
    return saved ? JSON.parse(saved) : DEFAULT_EMAILS;
  });
  const [posts, setPosts] = useState<Post[]>(() => {
    const saved = localStorage.getItem("gbk_posts");
    return saved ? JSON.parse(saved) : [];
  });

  const [activeTab, setActiveTab ] = useState<string>("dashboard");
  const [globalSearchSearch, setGlobalSearchSearch] = useState<string>("");
  const [currentClient, setCurrentClient] = useState<Client | null>(null);
  const [detailTab, setDetailTab] = useState<string>("overview");

  // Notifications / Toast
  const [toastMessage, setToastMessage] = useState<{ msg: string; icon?: string; type: "success" | "error" } | null>(null);

  // Authentication & Security state
  const [currentUser, setCurrentUser] = useState<User>(DEFAULT_USERS[0]); // David Acosta (Owner)
  const [appLocked, setAppLocked] = useState<boolean>(false);
  const [pinInput, setPinInput] = useState<string>("");
  const [pinError, setPinError] = useState<string>("");
  const [userRoster, setUserRoster] = useState<User[]>(() => {
    const saved = localStorage.getItem("gbk_roster");
    return saved ? JSON.parse(saved) : DEFAULT_USERS;
  });
  const [profileModalOpen, setProfileModalOpen] = useState<boolean>(false);
  const [profileTab, setProfileTab] = useState<'profile' | 'signup' | 'switch'>('profile');
  
  // Active User Email Edit Credentials State
  const [activeHost, setActiveHost] = useState("");
  const [activePort, setActivePort] = useState("");
  const [activeUsername, setActiveUsername] = useState("");
  const [activePassword, setActivePassword] = useState("");

  // Signup form state
  const [suFirst, setSuFirst] = useState("");
  const [suLast, setSuLast] = useState("");
  const [suEmail, setSuEmail] = useState("");
  const [suRole, setSuRole] = useState<'Owner / Master Admin' | 'Super Admin' | 'IT / Developer' | 'Senior Broker' | 'Agent'>('Agent');
  const [suPhone, setSuPhone] = useState("");
  const [suPin, setSuPin] = useState("");
  const [suFsra, setSuFsra] = useState("");
  const [suHost, setSuHost] = useState("imap.gmail.com");
  const [suPort, setSuPort] = useState("993");
  const [suPass, setSuPass] = useState("");

  // Switch User Form State
  const [swTargetId, setSwTargetId] = useState("");
  const [swPin, setSwPin] = useState("");
  const [swError, setSwError] = useState("");

  // Synchronize state when the active user switches
  useEffect(() => {
    setActiveHost(currentUser.emailHost || "imap.gmail.com");
    setActivePort(currentUser.emailPort || "993");
    setActiveUsername(currentUser.emailUsername || currentUser.email);
    setActivePassword(currentUser.emailPassword || "");
  }, [currentUser]);

  // Client view sub mode (Directory table vs KanBan columns)
  const [clientViewMode, setClientViewMode] = useState<'database' | 'pipeline'>("database");

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
  const [lockoutTries, setLockoutTries] = useState<number>(3);

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
  }, [activeTab]);

  // Calculator linked client state
  const [calcClientId, setCalcClientId] = useState<string>("");
  const [stIncome, setStIncome] = useState<string>("");
  const [stCoIncome, setStCoIncome] = useState<string>("");
  const [stDebts, setStDebts] = useState<string>("");
  const [stCondo, setStCondo] = useState<string>("");
  const [stTax, setStTax] = useState<string>("4800");
  const [stHeat, setStHeat] = useState<string>("150");
  const [stRate, setStRate] = useState<string>("4.79");
  const [stAmortization, setStAmortization] = useState<string>("25");

  // Payment Calculator state
  const [pcAmount, setPcAmount] = useState<string>("500000");
  const [pcRate, setPcRate] = useState<string>("4.79");
  const [pcAm, setPcAm] = useState<string>("25");
  const [pcFreq, setPcFreq] = useState<string>("monthly");

  // GDS / TDS state
  const [gcIncome, setGcIncome] = useState<string>("120000");
  const [gcPmt, setGcPmt] = useState<string>("2000");
  const [gcTax, setGcTax] = useState<string>("400");
  const [gcHeat, setGcHeat] = useState<string>("150");
  const [gcCondo, setGcCondo] = useState<string>("0");
  const [gcDebts, setGcDebts] = useState<string>("500");

  // Hourly / SE state
  const [hrRate, setHrRate] = useState<string>("25.00");
  const [hrHrs, setHrHrs] = useState<string>("40");
  const [seY1, setSeY1] = useState<string>("80000");
  const [seY2, setSeY2] = useState<string>("95000");

  // Document Vault Drop Area Highlight state
  const [isDragOver, setIsDragOver] = useState<boolean>(false);

  // AI Chat & Underwrite states
  const [aiClientId, setAiClientId] = useState<string>("");
  const [aiSelectedClient, setAiSelectedClient] = useState<Client | null>(null);
  const [aiHistory, setAiHistory] = useState<Array<{ role: 'user' | 'assistant'; content: string }>>([]);
  const [aiInputText, setAiInputText] = useState<string>("");
  const [aiLoading, setAiLoading] = useState<boolean>(false);

  // Application Intake Modal & Quick Extract states
  const [aiIntakeOpen, setAiIntakeOpen] = useState<boolean>(false);
  const [applicationIntakeOpen, setApplicationIntakeOpen] = useState<boolean>(false);
  const [aiIntakeEditingId, setAiIntakeOpenEditId] = useState<string | null>(null);
  const [aiIntakeText, setAiIntakeText] = useState<string>("");
  const [aiIntakeLoading, setAiIntakeLoading] = useState<boolean>(false);
  const [aiIntakeFields, setAiIntakeFields] = useState<Record<string, string>>({});
  const [highlightedAiFields, setHighlightedAiFields] = useState<string[]>([]);

  // Email Compose state
  const [emailComposeOpen, setEmailComposeOpen] = useState<boolean>(false);
  const [compTo, setCompTo] = useState<string>("");
  const [compSubject, setCompSubject] = useState<string>("");
  const [compBody, setCompBody] = useState<string>("");
  const [compClientLink, setCompClientLink] = useState<string>("");
  const [compScheduleMode, setCompScheduleMode] = useState<boolean>(false);
  const [compScheduleTime, setCompScheduleTime] = useState<string>("");

  // Social / Marketing state
  const [autoTopic, setAutoTopic] = useState<string>("Rate Update");
  const [autoTone, setAutoTone] = useState<string>("Professional");
  const [customTopic, setCustomTopic] = useState<string>("");
  const [platforms, setPlatforms] = useState<Record<string, boolean>>({ facebook: true, instagram: true, linkedin: true });
  const [postedDraft, setPostedDraft] = useState<string>("");
  const [isGeneratingPost, setIsGeneratingPost] = useState<boolean>(false);

  // Partner filter / dialog
  const [partnerFilter, setPartnerFilter] = useState<string>("all");
  const [partnerModalOpen, setPartnerModalOpen] = useState<boolean>(false);
  const [editingPartnerId, setEditingPartnerId] = useState<string | null>(null);

  // Local calendar date focus
  const [calDate, setCalDate] = useState<Date>(new Date());
  const [calSelectedDate, setCalSelectedDate] = useState<string | null>(fiso(new Date()));

  // Active channel in Direct/Announcements chat
  const [activeChannel, setActiveChannel] = useState<string>("general");
  const [dmLinkClientOpen, setDmLinkClientOpen] = useState<boolean>(false);
  const [linkedChatClientId, setLinkedChatClientId] = useState<string | null>(null);

  // Document Vault State Storage
  const [docVault, setDocVault] = useState<Record<string, any>>(() => {
    const saved = localStorage.getItem("gbk_doc_vault");
    return saved ? JSON.parse(saved) : {};
  });

  // Client retention View focus
  const [retView, setRetView] = useState<string>("birthdays");

  // Modals Inputs
  const [newClientOpen, setNewClientOpen] = useState<boolean>(false);
  const [taskModalOpen, setTaskModalOpen] = useState<boolean>(false);
  const [editingTaskId, setEditingTaskId] = useState<string | null>(null);
  const [calEventModalOpen, setCalEventModalOpen] = useState<boolean>(false);
  const [lenderModalOpen, setLenderModalOpen] = useState<boolean>(false);
  const [userModalOpen, setUserModalOpen] = useState<boolean>(false);
  const [editingUserId, setEditingUserId] = useState<string | null>(null);
  const [settingsModalOpen, setSettingsModalOpen] = useState<boolean>(false);
  const [headerProfileOpen, setHeaderProfileOpen] = useState<boolean>(false);

  // Active inputs for modals
  const [fFirst, setFFirst] = useState("");
  const [fLast, setFLast] = useState("");
  const [fEmail, setFEmail] = useState("");
  const [fCell, setFCell] = useState("");
  const [fDob, setFDob] = useState("");
  const [fMarital, setFMarital] = useState("");
  const [fSin, setFSin] = useState("");
  const [fDep, setFDep] = useState("0");
  const [fCo, setFCo] = useState("");
  const [fType, setFType] = useState("Purchase");
  const [fAgent, setFAgent] = useState("");
  const [fStatus, setFStatus] = useState("open");
  const [fLender, setFLender] = useState("");
  const [fIncome, setFIncome] = useState("");
  const [fCoIncome, setFCoIncome] = useState("");
  const [fEmpType, setFEmpType] = useState("");
  const [fBeacon, setFBeacon] = useState("");
  const [fPropVal, setFPropVal] = useState("");
  const [fMtgAmt, setFMtgAmt] = useState("");
  const [fDebts, setFDebts] = useState("");
  const [fTax, setFTax] = useState("");
  const [fCondo, setFCondo] = useState("");
  const [fHeat, setFHeat] = useState("150");
  const [fAddr, setFAddr] = useState("");
  const [fPropType, setFPropType] = useState("");
  const [fTenure, setFTenure] = useState("");
  const [fNote, setFNote] = useState("");

  // Task lists filter
  const [taskFilter, setTaskFilter] = useState<string>("all");

  // Local storage writing side-effects
  useEffect(() => { localStorage.setItem("gbk_clients", JSON.stringify(clients)); }, [clients]);
  useEffect(() => { localStorage.setItem("gbk_lenders", JSON.stringify(lenders)); }, [lenders]);
  useEffect(() => { localStorage.setItem("gbk_partners", JSON.stringify(partners)); }, [partners]);
  useEffect(() => { localStorage.setItem("gbk_tasks", JSON.stringify(tasks)); }, [tasks]);
  useEffect(() => { localStorage.setItem("gbk_events", JSON.stringify(events)); }, [events]);
  useEffect(() => { localStorage.setItem("gbk_messages", JSON.stringify(messages)); }, [messages]);
  useEffect(() => { localStorage.setItem("gbk_emails", JSON.stringify(emailsState)); }, [emailsState]);
  useEffect(() => { localStorage.setItem("gbk_posts", JSON.stringify(posts)); }, [posts]);
  useEffect(() => { localStorage.setItem("gbk_roster", JSON.stringify(userRoster)); }, [userRoster]);
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

  // ─── UTILITIES & HELPER FUNCTIONS ───
  function showToast(msg: string, type: "success" | "error" = "success", icon?: string) {
    setToastMessage({ msg, type, icon });
    setTimeout(() => setToastMessage(null), 3500);
  }

  function logActivity(action: string, target?: string) {
    if (!auditLoggingEnabled) return;
    const logItem = {
      user: currentUser.first + " " + currentUser.last,
      action,
      target: target || "",
      time: new Date().toISOString()
    };
    setAuditLogs(prev => [logItem, ...prev.slice(0, 199)]);
  }

  function fd(n: any) {
    if (n === null || n === undefined || isNaN(Number(n))) return "$0";
    return "$" + Math.round(Number(n)).toLocaleString("en-CA");
  }

  function fiso(d: Date) {
    return d.getFullYear() + "-" + String(d.getMonth() + 1).padStart(2, "0") + "-" + String(d.getDate()).padStart(2, "0");
  }

  function pn(s: any) {
    if (!s) return 0;
    return parseFloat(String(s).replace(/[$,\s]/g, "")) || 0;
  }

  function cPmt(P: number, rPct: number, yrs: number) {
    if (!P || !rPct || !yrs) return 0;
    const r = rPct / 100 / 12;
    const n = yrs * 12;
    if (r === 0) return P / n;
    return P * (r * Math.pow(1 + r, n)) / (Math.pow(1 + r, n) - 1);
  }

  function pToAmt(pmt: number, rPct: number, yrs: number) {
    const r = rPct / 100 / 12;
    const n = yrs * 12;
    if (r === 0 || pmt <= 0) return 0;
    return pmt * (Math.pow(1 + r, n) - 1) / (r * Math.pow(1 + r, n));
  }

  const isOwner = () => currentUser.isOwner || currentUser.role === "Owner / Master Admin";

  const getAgentNames = () => userRoster.filter(u => u.status === "active").map(u => u.first + " " + u.last);

  // ─── LOGIN OVERLAY HANDLE ───
  function handleUnlock() {
    const match = userRoster.find(u => u.pin === pinInput && u.status === "active");
    if (match) {
      setCurrentUser(match);
      setAppLocked(false);
      setPinInput("");
      setPinError("");
      logActivity("Unlocked Station (" + match.role + ")");
      showToast("Workstation Unlocked", "success", "🔓");
    } else {
      setPinError("Invalid security PIN");
      setPinInput("");
    }
  }

  // ─── AI ASSISTANT FUNCTIONS ───
  async function runGeneralAIChat() {
    if (!aiInputText.trim()) return;
    setAiLoading(true);
    const userMsg = aiInputText;
    setAiInputText("");

    const newHistory = [...aiHistory, { role: "user" as const, content: userMsg }];
    setAiHistory(newHistory);

    try {
      const clientCtx = aiSelectedClient ? `
Client: ${aiSelectedClient.first} ${aiSelectedClient.last} ${aiSelectedClient.co ? `& Co-App: ${aiSelectedClient.co}` : ""}
Property: ${aiSelectedClient.addr || "Not specified"} | Value: ${fd(aiSelectedClient.propval)}
Income: ${fd(pn(aiSelectedClient.income) + pn(aiSelectedClient.coIncome))}/yr | credit score: ${aiSelectedClient.beacon || "N/A"}
Mortgage Requested: ${fd(aiSelectedClient.mtgamt)} | Status: ${aiSelectedClient.status}
` : "";

      const resp = await fetch("/api/ai/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          message: userMsg,
          history: aiHistory,
          clientContext: clientCtx
        })
      });

      const data = await resp.json();
      if (!resp.ok) throw new Error(data.error || "Failed to contact Gemini");

      setAiHistory([...newHistory, { role: "assistant", content: data.reply }]);
      logActivity("Invoked AI general assistant", aiSelectedClient ? aiSelectedClient.first : "General");
    } catch (err: any) {
      setAiHistory([...newHistory, { role: "assistant", content: `⚠️ Error: ${err.message}` }]);
      showToast(err.message, "error", "⚠️");
    } finally {
      setAiLoading(false);
    }
  }

  async function triggerUnderwritingAnalysis(client: Client) {
    showToast("Generating AI underwriting assessment...", "success", "✦");
    try {
      const resp = await fetch("/api/ai/underwrite", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ clientData: client })
      });

      const data = await resp.json();
      if (!resp.ok) throw new Error(data.error || "Failed to make underwriting report");

      const updated = clients.map(c => c.id === client.id ? { ...c, aiSummary: data.reply, updatedAt: new Date().toISOString() } : c);
      setClients(updated);
      if (currentClient && currentClient.id === client.id) {
        setCurrentClient({ ...currentClient, aiSummary: data.reply, updatedAt: new Date().toISOString() });
      }
      logActivity("Generated AI Underwriting Analysis", client.first + " " + client.last);
      showToast("Underwriting summary completed!", "success", "✓");
    } catch (err: any) {
      showToast(err.message, "error", "⚠️");
    }
  }

  async function triggerAIIntakeExtract() {
    if (!aiIntakeText.trim()) {
      showToast("Please enter broker notes or application text first.", "error", "⚠️");
      return;
    }
    setAiIntakeLoading(true);
    try {
      const resp = await fetch("/api/ai/intake", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ text: aiIntakeText })
      });
      const data = await resp.json();
      if (!resp.ok) throw new Error(data.error || "AI Intake extract failed");

      const newFields: Record<string, string> = {};
      const fieldsToHighlight: string[] = [];
      Object.entries(data).forEach(([key, val]) => {
        if (val !== null && val !== undefined) {
          newFields[key] = String(val);
          fieldsToHighlight.push(key);
        }
      });

      setAiIntakeFields(newFields);
      setHighlightedAiFields(fieldsToHighlight);
      showToast("Information successfully extracted by AI!", "success", "✦");
      logActivity("Extracted application data with AI");
    } catch (err: any) {
      showToast(err.message, "error", "⚠️");
    } finally {
      setAiIntakeLoading(false);
    }
  }

  function handleSaveAIIntake(targetStatus: 'lead' | 'open') {
    const first = aiIntakeFields.app_first || "";
    const last = aiIntakeFields.app_last || "";
    const email = aiIntakeFields.app_email || "";
    const agent = aiIntakeFields.in_agent || currentUser.first + " " + currentUser.last;

    if (!first || !last) {
      showToast("First Name and Last Name are required to save client.", "error", "⚠️");
      return;
    }

    const newId = aiIntakeEditingId || "c_" + Date.now();
    const finalClient: Client = {
      id: newId,
      first,
      last,
      email,
      cell: aiIntakeFields.app_cell || "",
      dob: aiIntakeFields.app_dob || "",
      marital: aiIntakeFields.app_marital || "",
      sin: aiIntakeFields.app_sin || "",
      dep: aiIntakeFields.app_dependents || "",
      co: aiIntakeFields.co_first ? `${aiIntakeFields.co_first} ${aiIntakeFields.co_last || ""}` : "",
      coEmail: aiIntakeFields.co_email || "",
      income: aiIntakeFields.app_emp1_income || "",
      coIncome: aiIntakeFields.co_emp1_income || "",
      emptype: aiIntakeFields.app_emp1_status || "",
      beacon: aiIntakeFields.beacon || "",
      propval: aiIntakeFields.prop_value || aiIntakeFields.propval || "",
      mtgamt: aiIntakeFields.mtg_requested || "",
      debts: aiIntakeFields.debts || "",
      tax: aiIntakeFields.prop_tax || "",
      condo: aiIntakeFields.prop_condo_fees || "",
      heat: aiIntakeFields.prop_heat || "150",
      addr: aiIntakeFields.prop_addr || "",
      proptype: aiIntakeFields.prop_type || "",
      tenure: aiIntakeFields.prop_tenure || "",
      lender: aiIntakeFields.mtg1_holder || "",
      source: "AI Intake Platform",
      status: targetStatus,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      appData: aiIntakeFields
    };

    if (aiIntakeEditingId) {
      setClients(prev => prev.map(c => c.id === aiIntakeEditingId ? finalClient : c));
      logActivity("Updated client with AI application", first + " " + last);
      showToast("File successfully upgraded and re-saved!", "success");
    } else {
      setClients(prev => [finalClient, ...prev]);
      logActivity("Created new file via AI Application", first + " " + last);
      showToast(`New ${targetStatus === "lead" ? "Lead" : "Active File"} created!`, "success");
    }

    setAiIntakeOpen(false);
    setAiIntakeOpenEditId(null);
    setAiIntakeText("");
    setAiIntakeFields({});
    setHighlightedAiFields([]);
  }

  function handleCreateClientFromIntake(
    finalClient: Client, 
    fileMeta: { name: string; size: string; content?: string } | null,
    alertAction: 'create' | 'merge',
    suggestedDocs?: Array<{ id: string; name: string; desc: string; category: string }>,
    starterTasks?: Array<{ title: string; priority: 'high' | 'medium' | 'low'; notes: string }>
  ) {
    if (alertAction === 'merge') {
      setClients(prev => prev.map(c => c.id === finalClient.id ? { ...finalClient, id: c.id, status: c.status } : c));
      logActivity("Merged Intake application fields into existing client", finalClient.first + " " + finalClient.last);
      showToast("Data successfully merged into existing client record!", "success");
    } else {
      setClients(prev => [finalClient, ...prev]);
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

  // Load client parameters into the GDS stress tools
  function handleLoadClientToCalc(id: string) {
    const c = clients.find(x => x.id === id);
    if (!c) return;
    setStIncome(String(c.income || ""));
    setStCoIncome(String(c.coIncome || ""));
    setStDebts(String(c.debts || ""));
    setStCondo(String(c.condo || ""));
    setStTax(c.tax ? String(pn(c.tax)) : "4800");
    setStHeat(c.heat ? String(c.heat) : "150");
    setGcIncome(String(pn(c.income) + pn(c.coIncome)));
    
    const mtg = pn(c.mtgamt);
    if (mtg > 0) {
      setGcPmt(String(Math.round(cPmt(mtg, 4.79, 25))));
      setPcAmount(String(mtg));
    }
    setGcTax(c.tax ? String(Math.round(pn(c.tax) / 12)) : "400");
    setGcHeat(c.heat ? String(c.heat) : "150");
    setGcCondo(c.condo ? String(c.condo) : "0");
    setGcDebts(c.debts ? String(c.debts) : "500");
  }

  function handleClearCalcClient() {
    setCalcClientId("");
    setStIncome("");
    setStCoIncome("");
    setStDebts("");
    setStCondo("");
    setStTax("4800");
    setStHeat("150");
    setGcIncome("120000");
    setGcPmt("2000");
    setGcTax("400");
    setGcHeat("150");
    setGcCondo("0");
    setGcDebts("500");
    setPcAmount("500000");
  }

  // Double click or context opener
  function openClient(id: string, initialTab?: string) {
    const target = clients.find(cl => cl.id === id);
    if (target) {
      setCurrentClient(target);
      setDetailTab(initialTab || "overview");
      logActivity("Viewed client file folder", target.first + " " + target.last);
    }
  }

  function closeDetail() {
    setCurrentClient(null);
  }

  function handleDragOver(e: React.DragEvent) {
    e.preventDefault();
    setIsDragOver(true);
  }

  function handleDragLeave() {
    setIsDragOver(false);
  }

  function handleDrop(e: React.DragEvent, docId: string) {
    e.preventDefault();
    setIsDragOver(false);
    if (!currentClient) return;

    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      const file = e.dataTransfer.files[0];
      // Instant PDF/Image Validation
      const isAllowed = file.type === "application/pdf" || file.type.startsWith("image/");
      if (!isAllowed) {
        showToast("Invalid file format. Only PDF or Images are accepted.", "error", "⚠️");
        return;
      }

      // Verify max 12MB limit
      const twelveMbBytes = 12 * 1024 * 1024;
      if (file.size > twelveMbBytes) {
        showToast("File size exceeds 12MB industry threshold.", "error", "⚠️");
        return;
      }

      const clientDocs = docVault[currentClient.id] || {};
      const updatedDocs = {
        ...clientDocs,
        [docId]: {
          status: "received",
          name: file.name,
          size: (file.size / (1024 * 1024)).toFixed(2) + " MB",
          path: `gbk-secured-vault://${currentClient.id}/${docId}/${file.name}`,
          uploadedAt: new Date().toISOString()
        }
      };

      setDocVault(prev => ({
        ...prev,
        [currentClient.id]: updatedDocs
      }));

      logActivity("Uploaded document " + file.name, currentClient.first + " " + currentClient.last);
      showToast(`${file.name} successfully vaulted & verified!`, "success", "✓");
    }
  }

  function updateClientDoc(clientId: string, docId: string, status: string) {
    const clientDocs = docVault[clientId] || {};
    const updatedDocs = {
      ...clientDocs,
      [docId]: {
        ...(clientDocs[docId] || {}),
        status,
        path: clientDocs[docId]?.path || `Manual state change to ${status}`
      }
    };
    setDocVault(prev => ({
      ...prev,
      [clientId]: updatedDocs
    }));
    logActivity(`Updated ${docId} doc status to ${status}`, clientId);
  }

  function bulkCompleteDocs(clientId: string) {
    const list = ["photo_id", "paystubs", "t4_current", "noa_current", "emp_letter", "bank_chq"];
    const clientDocs = docVault[clientId] || {};
    const updatedDocs = { ...clientDocs };
    list.forEach(id => {
      updatedDocs[id] = {
        ...(updatedDocs[id] || {}),
        status: "received",
        path: updatedDocs[id]?.path || "Marked as received by Broker"
      };
    });
    setDocVault(prev => ({
      ...prev,
      [clientId]: updatedDocs
    }));
    logActivity("Bulk marked all docs received", clientId);
    showToast("All documents marked as received", "success");
  }

  function handleUpdateClientStatus(id: string, s: any) {
    const updated = clients.map(c => c.id === id ? { ...c, status: s, updatedAt: new Date().toISOString() } : c);
    setClients(updated);
    const updatedCl = updated.find(x => x.id === id);
    if (updatedCl) {
      setCurrentClient(updatedCl);
      logActivityEvent({
        clientId: id,
        clientName: `${updatedCl.first} ${updatedCl.last}`,
        eventType: "stage_change",
        user: `${currentUser.first} ${currentUser.last}`,
        timestamp: new Date().toISOString(),
        description: `Transitioned mortgage file folder stage to [${s.toUpperCase()}]`
      });
    }
    showToast("Status updated successfully!", "success");
    logActivity("Updated client status", `${updatedCl?.first} ${updatedCl?.last} → ${s}`);
  }

  function handleUpdateClient(updatedClient: Client) {
    const updated = clients.map(c => c.id === updatedClient.id ? updatedClient : c);
    setClients(updated);
    if (currentClient && currentClient.id === updatedClient.id) {
      setCurrentClient(updatedClient);
    }
  }

  function handleOpenComposeWithDetails(to: string, subject: string, body: string) {
    setCompTo(to);
    setCompSubject(subject);
    setCompBody(body);
    setEmailComposeOpen(true);
    setActiveTab("emails");
  }

  return (
    <div className="flex h-screen bg-[#0c0c0e] font-sans text-[#eeeef2] overflow-hidden">
      
      {/* ── Security Lock Screen Overlay ── */}
      <AnimatePresence>
        {appLocked && (
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-[#0c0c0e]/95 backdrop-blur-md z-50 flex items-center justify-center flex-col gap-6"
          >
            <motion.div 
              initial={{ scale: 0.9, y: 15 }}
              animate={{ scale: 1, y: 0 }}
              className="bg-[#141418] border border-white/5 rounded-2xl p-8 w-80 text-center shadow-2xl relative"
            >
              <div className="text-4xl mb-3">🛡️</div>
              <h3 className="text-lg font-semibold mb-1">Session Inactive</h3>
              <p className="text-xs text-[#8e95a3] mb-6">Enter security PIN to resume</p>
              
              <input 
                type="password" 
                maxLength={4}
                value={pinInput}
                onChange={(e) => setPinInput(e.target.value.replace(/\D/g, ""))}
                placeholder="••••"
                className="w-full tracking-widest text-center text-3xl font-mono py-2 bg-[#1b1b20] border border-white/10 rounded-lg text-white mb-4 focus:outline-none focus:border-[#b5a642] focus:ring-1 focus:ring-[#b5a642]"
                onKeyDown={(e) => { if (e.key === "Enter") handleUnlock(); }}
              />

              <button 
                onClick={handleUnlock}
                className="w-full bg-[#b5a642] text-black font-semibold text-sm py-3 rounded-lg hover:bg-[#9a8c38] transition-all"
              >
                Unlock Workstation
              </button>

              {pinError && (
                <div className="text-xs text-red-400 mt-3">{pinError}</div>
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
            className={`fixed bottom-6 right-6 z-50 flex items-center gap-3 px-5 py-3 rounded-xl border max-w-sm shadow-xl bg-[#1b1b20] ${toastMessage.type === "error" ? "border-red-500/30 text-red-300" : "border-[#b5a642]/30 text-[#eeeef2]"}`}
          >
            <span className="text-lg">{toastMessage.icon || "✓"}</span>
            <span className="text-xs font-medium">{toastMessage.msg}</span>
          </motion.div>
        )}
      </AnimatePresence>

      {/* ─── Sidebar Navigation Panel ─── */}
      <Sidebar 
        activeTab={activeTab}
        setActiveTab={setActiveTab}
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
      <div className="flex-1 flex flex-col h-full min-w-0 bg-[#0c0c0e]">
        
        {/* Top Header */}
        <header className="h-14 border-b border-white/5 flex items-center justify-between px-6 shrink-0 bg-[#111115]/40 select-none">
          <div className="text-sm font-semibold capitalize text-white/90">{activeTab} Section</div>
          <div className="flex items-center gap-3">
            {/* Quick search input */}
            <div className="bg-[#141418] border border-white/5 rounded-lg px-2.5 py-1 flex items-center gap-2 w-48 focus-within:w-60 focus-within:border-[#b5a642]/40 transition-all">
              <Search className="w-3.5 h-3.5 text-[#8e95a3]" />
              <input 
                type="text" 
                placeholder="Quick locate client…" 
                value={globalSearchSearch}
                onChange={(e) => {
                  setGlobalSearchSearch(e.target.value);
                  setActiveTab("clients");
                }}
                className="bg-transparent border-none text-[11px] text-[#eeeef2] focus:outline-none w-full"
              />
            </div>
            <button 
              onClick={() => setNewClientOpen(true)}
              className="flex items-center gap-1 px-3 py-1.5 text-[11px] font-bold rounded-lg bg-[#b5a642] text-black hover:bg-[#9a8c38] transition-all shrink-0"
              id="header-new-client-btn"
            >
              <Plus className="w-3.5 h-3.5 stroke-[2.5]" /> New Client
            </button>

            {/* Vertical Divider */}
            <div className="w-px h-5 bg-white/5 shrink-0 mx-0.5" />

            {/* Top Header Profile Section */}
            <div className="relative shrink-0" id="header-profile-dropdown-container">
              <button
                onClick={() => setHeaderProfileOpen(!headerProfileOpen)}
                className="flex items-center gap-2.5 px-2.5 py-1.5 rounded-lg bg-[#141418] border border-white/5 hover:border-white/10 active:bg-white/[0.02] hover:bg-white/[0.01] transition-all cursor-pointer text-left select-none"
                id="header-profile-button"
              >
                {currentUser.photo ? (
                  <img
                    src={currentUser.photo}
                    alt="Profile"
                    referrerPolicy="no-referrer"
                    className="w-6 h-6 rounded-full object-cover border border-[#b5a642]/30"
                  />
                ) : (
                  <div className="w-6 h-6 rounded-full bg-[#b5a642]/20 border border-[#b5a642]/40 flex items-center justify-center font-bold text-[10px] text-[#b5a642]">
                    {currentUser.first[0]}{currentUser.last[0]}
                  </div>
                )}
                <div className="hidden md:block">
                  <div className="text-[11px] font-semibold text-[#eeeef2] leading-tight">
                    {currentUser.displayName || `${currentUser.first} ${currentUser.last}`}
                  </div>
                  <div className="text-[9px] text-white/40 leading-none">
                    {currentUser.role}
                  </div>
                </div>
                <ChevronDown className="w-3.5 h-3.5 text-[#8e95a3] shrink-0" />
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
                    className="absolute right-0 mt-2 w-56 rounded-xl bg-[#101014] border border-white/10 p-1.5 shadow-2xl z-50 animate-in fade-in slide-in-from-top-2 duration-100"
                    id="header-profile-dropdown-menu"
                  >
                    <div className="px-2.5 py-2 border-b border-white/5 mb-1.5">
                      <p className="text-[9px] uppercase font-bold tracking-wider text-[#8e95a3]">Broker Account</p>
                      <p className="text-xs font-bold text-white mt-0.5 truncate">{currentUser.first} {currentUser.last}</p>
                      <p className="text-[10px] text-white/50 truncate font-mono">{currentUser.email}</p>
                    </div>

                    <button
                      onClick={() => {
                        setActiveTab("settings");
                        setHeaderProfileOpen(false);
                      }}
                      className="w-full flex items-center gap-2.5 px-2.5 py-2 text-xs font-semibold text-white/80 hover:text-white hover:bg-[#b5a642]/10 hover:text-[#b5a642] rounded-lg transition-all text-left"
                    >
                      <SettingsIcon className="w-4 h-4 text-[#b5a642]" />
                      <span>My Profile &amp; Settings</span>
                    </button>

                    <button
                      onClick={() => {
                        setProfileTab("profile");
                        setProfileModalOpen(true);
                        setHeaderProfileOpen(false);
                      }}
                      className="w-full flex items-center gap-2.5 px-2.5 py-2 text-xs font-semibold text-white/80 hover:text-white hover:bg-[#6fa3b8]/10 hover:text-[#6fa3b8] rounded-lg transition-all text-left"
                    >
                      <Key className="w-4 h-4 text-[#6fa3b8]" />
                      <span>Sync Credentials</span>
                    </button>

                    <div className="border-t border-white/5 my-1.5" />

                    <button
                      onClick={() => {
                        setAppLocked(true);
                        setHeaderProfileOpen(false);
                      }}
                      className="w-full flex items-center gap-2.5 px-2.5 py-2 text-xs font-semibold text-red-400 hover:text-red-300 hover:bg-red-500/10 rounded-lg transition-all text-left"
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

        {/* Active System Broadcast Banners */}
        {broadcastBanners.filter(b => b.active).map((banner) => (
          <div 
            key={banner.id} 
            className={`px-6 py-2.5 text-xs flex items-center justify-between gap-4 border-b shrink-0 font-medium select-none ${
              banner.type === "critical" 
                ? "bg-red-500/10 border-red-500/15 text-red-300" 
                : banner.type === "warning"
                ? "bg-amber-500/10 border-amber-500/15 text-amber-300"
                : "bg-emerald-500/10 border-emerald-500/15 text-emerald-300"
            }`}
          >
            <div className="flex items-center gap-2 truncate">
              {banner.type === "critical" ? (
                <ShieldAlert className="w-4 h-4 text-red-400 shrink-0" />
              ) : (
                <AlertTriangle className="w-4 h-4 text-amber-400 shrink-0" />
              )}
              <span className="truncate">
                <strong className="uppercase mr-1.5 font-bold">[{banner.type} broadcast]:</strong>
                {banner.message}
              </span>
            </div>
            <button 
              onClick={() => {
                setBroadcastBanners(prev => prev.map(b => b.id === banner.id ? { ...b, active: false } : b));
              }}
              className="text-white/40 hover:text-white shrink-0 font-bold px-1.5 py-0.5 hover:bg-white/5 rounded transition-all"
            >
              ✕ Dismiss
            </button>
          </div>
        ))}

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
              onAddClient={() => setNewClientOpen(true)}
              onOpenNewClientIntake={() => setApplicationIntakeOpen(true)}
              onOpenAIIntake={() => setAiIntakeOpen(true)}
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
              onAddClient={() => setNewClientOpen(true)}
              onOpenAIIntake={() => setAiIntakeOpen(true)}
              onOpenNewClientIntake={() => setApplicationIntakeOpen(true)}
              viewMode={clientViewMode}
              setViewMode={setClientViewMode}
              agentNames={getAgentNames()}
            />
          )}

          {activeTab === "pipeline" && (
            <ClientsList 
              clients={clients}
              lenders={lenders}
              onOpenClient={openClient}
              onAddClient={() => setNewClientOpen(true)}
              onOpenAIIntake={() => setAiIntakeOpen(true)}
              onOpenNewClientIntake={() => setApplicationIntakeOpen(true)}
              viewMode="pipeline"
              setViewMode={setClientViewMode}
              agentNames={getAgentNames()}
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
            <div className="flex h-full gap-5">
              {/* Chat proxy */}
              <div className="flex-1 bg-[#141418] border border-white/5 rounded-xl flex flex-col h-full shadow-md overflow-hidden">
                <div className="p-4 border-b border-white/5 bg-[#1b1b20]/25 flex items-center justify-between">
                  <h3 className="text-xs font-bold uppercase tracking-wider text-[#b5a642] flex items-center gap-1.5">
                    <Sparkles className="w-3.5 h-3.5 fill-current" /> GBK Mortgage Advisor ✦
                  </h3>
                  <select 
                    value={aiClientId}
                    onChange={(e) => {
                      setAiClientId(e.target.value);
                      const c = clients.find(x => x.id === e.target.value);
                      setAiSelectedClient(c || null);
                    }}
                    className="bg-[#1b1b20] border border-white/5 rounded-lg px-3 py-1.5 text-xs text-[#eeeef2]"
                  >
                    <option value="">General advice (No selected client)</option>
                    {clients.map(c => <option key={c.id} value={c.id}>{c.first} {c.last}</option>)}
                  </select>
                </div>

                <div className="flex-1 overflow-y-auto p-4 flex flex-col gap-3">
                  {aiHistory.map((m, idx) => (
                    <div key={idx} className={`p-3 rounded-xl text-xs max-w-[80%] leading-relaxed ${m.role === "user" ? "self-end bg-[#b5a642]/10 border border-[#b5a642]/20 text-white rounded-br-none" : "self-start bg-[#1b1b20] border border-white/5 text-white/90 rounded-bl-none"}`}>
                      {m.content}
                    </div>
                  ))}
                  {aiLoading && (
                    <div className="self-start p-3 rounded-xl bg-[#1b1b20] text-xs text-[#8e95a3]/50 flex items-center gap-2">
                      <span className="w-1.5 h-1.5 rounded-full bg-[#b5a642] animate-bounce"></span>
                      <span className="w-1.5 h-1.5 rounded-full bg-[#b5a642] animate-bounce delay-75"></span>
                      <span className="w-1.5 h-1.5 rounded-full bg-[#b5a642] animate-bounce delay-150"></span>
                      Thinking...
                    </div>
                  )}
                </div>

                <div className="p-3 border-t border-white/5 bg-[#1b1b20]/10 flex gap-2">
                  <input 
                    type="text"
                    value={aiInputText}
                    onChange={(e) => setAiInputText(e.target.value)}
                    placeholder="Ask about CMHC limits, qualifying GDS/TDS, or request draft emails..."
                    onKeyDown={(e) => { if (e.key === "Enter") runGeneralAIChat(); }}
                    className="flex-grow bg-[#1b1b20] border border-white/5 rounded-lg px-3 py-2 text-xs text-white focus:outline-none focus:border-[#b5a642]/30"
                  />
                  <button onClick={runGeneralAIChat} className="px-4 py-2 bg-[#b5a642] text-black rounded-lg text-xs font-bold hover:bg-[#9a8c38]">Send</button>
                </div>
              </div>
            </div>
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

      {/* ✦ AI Intake Form Overlay ✦ */}
      {aiIntakeOpen && (
        <AIIntake 
          appLocked={appLocked}
          aiIntakeText={aiIntakeText}
          setAiIntakeText={setAiIntakeText}
          aiIntakeLoading={aiIntakeLoading}
          onTriggerAIIntakeExtract={triggerAIIntakeExtract}
          aiIntakeFields={aiIntakeFields}
          setAiIntakeFields={setAiIntakeFields}
          highlightedAiFields={highlightedAiFields}
          onSubmitAIIntake={handleSaveAIIntake}
          onClose={() => setAiIntakeOpen(false)}
          agentNames={getAgentNames()}
          apiKeySet={!!settings.apiKey}
        />
      )}

      {/* ✦ New Client Intake / PDF Application Intake Overlay ✦ */}
      {applicationIntakeOpen && (
        <ApplicationIntake
          currentUser={currentUser}
          clients={clients}
          onClose={() => setApplicationIntakeOpen(false)}
          onCreateClient={handleCreateClientFromIntake}
          agentNames={getAgentNames()}
          apiKeySet={!!settings.apiKey}
          showToast={showToast}
        />
      )}

      {/* Detail panel slider */}
      <AnimatePresence>
        {currentClient && (
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/60 z-30"
            onClick={closeDetail}
          >
            <motion.div 
              initial={{ x: "100%" }}
              animate={{ x: 0 }}
              exit={{ x: "100%" }}
              transition={{ type: "spring", damping: 25, stiffness: 180 }}
              onClick={(e) => e.stopPropagation()}
              className="absolute right-0 top-0 bottom-0 w-full max-w-2xl bg-[#141418] border-l border-white/5 flex flex-col shadow-2xl h-full"
            >
              {/* Header */}
              <div className="p-5 border-b border-white/5 flex justify-between items-start bg-[#1b1b20]/20 shrink-0">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded bg-[#b5a642]/10 border border-[#b5a642]/20 font-bold text-sm text-[#b5a642] flex items-center justify-center">
                    {currentClient.first[0]}{currentClient.last[0]}
                  </div>
                  <div>
                    <h3 className="text-base font-bold text-white/95">{currentClient.first} {currentClient.last}</h3>
                    <p className="text-[10px] text-[#8e95a3]">{currentClient.type || "Purchase File"}</p>
                  </div>
                </div>
                <button onClick={closeDetail} className="text-white/40 hover:text-white p-1.5 rounded-lg bg-white/5 hover:bg-white/10">✕</button>
              </div>

              {/* TABS SELECT */}
              <div className="flex border-b border-white/5 text-xs bg-[#1b1b20]/10 py-1 select-none overflow-x-auto shrink-0">
                {["Overview", "Mortgage Details", "Financials", "Documents", "Checklist", "Notes", "Activity", "AI Analysis"].map(tab => (
                  <button
                    key={tab}
                    onClick={() => setDetailTab(tab.toLowerCase())}
                    className={`px-4 py-2 font-semibold transition-all border-b-2 shrink-0 ${detailTab === tab.toLowerCase() ? "border-[#b5a642] text-[#b5a642]" : "border-transparent text-white/50 hover:text-white"}`}
                  >
                    {tab}
                  </button>
                ))}
              </div>

              {/* TAB CONTENT PANEL */}
              <div className="flex-grow overflow-y-auto p-6 focus:outline-none">
                
                {/* 1. OVERVIEW TAB */}
                {detailTab === "overview" && (
                  <div className="flex flex-col gap-5">
                    <div className="p-4 bg-[#1b1b20] border border-white/5 rounded-xl">
                      <h4 className="text-[10px] uppercase font-bold tracking-wider text-[#b5a642] mb-3">Set Pipeline Stage</h4>
                      <div className="flex flex-wrap gap-1.5">
                        {["open", "working", "lender", "conditional", "approved", "funded", "closed"].map(st => (
                          <button
                            key={st}
                            onClick={() => handleUpdateClientStatus(currentClient.id, st)}
                            className={`px-3 py-1.5 text-[10px] font-bold uppercase tracking-wider rounded border transition-colors ${currentClient.status === st ? "bg-[#b5a642] text-black border-[#b5a642]" : "bg-transparent text-white/50 border-white/5 hover:bg-white/5"}`}
                          >
                            {st}
                          </button>
                        ))}
                      </div>
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                      <div className="p-3 bg-[#1b1b20] rounded-xl border border-white/5">
                        <div className="text-[10px] text-[#8e95a3] uppercase font-semibold">Borrower Name</div>
                        <div className="text-xs font-bold text-white mt-0.5">{currentClient.first} {currentClient.last}</div>
                      </div>
                      <div className="p-3 bg-[#1b1b20] rounded-xl border border-white/5">
                        <div className="text-[10px] text-[#8e95a3] uppercase font-semibold">Email Address</div>
                        <div className="text-xs font-bold text-white mt-0.5">{currentClient.email || "—"}</div>
                      </div>
                      <div className="p-3 bg-[#1b1b20] rounded-xl border border-white/5">
                        <div className="text-[10px] text-[#8e95a3] uppercase font-semibold">Cell Phone</div>
                        <div className="text-xs font-bold text-white mt-0.5">{currentClient.cell || "—"}</div>
                      </div>
                      <div className="p-3 bg-[#1b1b20] rounded-xl border border-white/5">
                        <div className="text-[10px] text-[#8e95a3] uppercase font-semibold">Employment Type</div>
                        <div className="text-xs font-bold text-white mt-0.5 uppercase tracking-wide">{currentClient.emptype || "Salaried"}</div>
                      </div>
                      <div className="p-3 bg-white/2 bg-[#1b1b20] rounded-xl border border-white/5">
                        <div className="text-[10px] text-[#8e95a3] uppercase font-semibold">Assigned Broker</div>
                        <div className="text-xs font-bold text-white mt-0.5">{currentClient.agent || "Unassigned"}</div>
                      </div>
                      <div className="p-3 bg-white/2 bg-[#1b1b20] rounded-xl border border-white/5">
                        <div className="text-[10px] text-[#8e95a3] uppercase font-semibold">Lender Partner</div>
                        <div className="text-xs font-bold text-white mt-0.5">{currentClient.lender || "Not submitted"}</div>
                      </div>
                    </div>
                  </div>
                )}

                {/* 2. MORTGAGE DETAILS TAB (INTERACTIVE SAVING FORM) */}
                {detailTab === "mortgage details" && (
                  <form 
                    onSubmit={(e) => {
                      e.preventDefault();
                      const fd = new FormData(e.currentTarget);
                      const updatedClient = {
                        ...currentClient,
                        type: fd.get("type") as string,
                        propval: fd.get("propval") as string,
                        mtgamt: fd.get("mtgamt") as string,
                        lender: fd.get("lender") as string,
                        agent: fd.get("agent") as string,
                        appData: {
                          ...(currentClient.appData || {}),
                          interestRate: fd.get("interestRate") as string,
                          amortization: fd.get("amortization") as string,
                          tenure: fd.get("tenure") as string,
                          maturityDate: fd.get("maturityDate") as string,
                          referredBy: fd.get("referredBy") as string,
                        },
                        updatedAt: new Date().toISOString()
                      };
                      handleUpdateClient(updatedClient);
                      showToast("Mortgage parameters saved successfully!", "success", "🏠");
                    }}
                    className="flex flex-col gap-4 text-xs"
                  >
                    <div className="grid grid-cols-2 gap-4">
                      <div className="space-y-1">
                        <label className="block text-[10px] uppercase font-bold tracking-wide text-white/40">Mortgage Goal</label>
                        <select 
                          name="type" 
                          defaultValue={currentClient.type || "purchase"}
                          className="w-full bg-[#1b1b20] border border-white/5 text-xs rounded-lg p-2 font-semibold text-white focus:outline-none focus:border-[#b5a642]"
                        >
                          <option value="purchase">Purchase</option>
                          <option value="refinance">Refinance</option>
                          <option value="renewal">Renewal</option>
                          <option value="heloc">HELOC</option>
                        </select>
                      </div>

                      <div className="space-y-1">
                        <label className="block text-[10px] uppercase font-bold tracking-wide text-white/40">Property Value ($)</label>
                        <input 
                          type="number" 
                          name="propval" 
                          defaultValue={currentClient.propval || ""}
                          className="w-full bg-[#1b1b20] border border-white/5 text-xs rounded-lg p-2 font-semibold text-white focus:outline-none focus:border-[#b5a642]"
                          placeholder="e.g. 650000"
                        />
                      </div>

                      <div className="space-y-1">
                        <label className="block text-[10px] uppercase font-bold tracking-wide text-white/40">Loan Amount ($)</label>
                        <input 
                          type="number" 
                          name="mtgamt" 
                          defaultValue={currentClient.mtgamt || ""}
                          className="w-full bg-[#1b1b20] border border-white/5 text-xs rounded-lg p-2 font-semibold text-white focus:outline-none focus:border-[#b5a642]"
                          placeholder="e.g. 520000"
                        />
                      </div>

                      <div className="space-y-1">
                        <label className="block text-[10px] uppercase font-bold tracking-wide text-white/40">Interest Rate</label>
                        <input 
                          type="text" 
                          name="interestRate" 
                          defaultValue={currentClient.appData?.interestRate || currentClient.rate || "3.99%"}
                          className="w-full bg-[#1b1b20] border border-white/5 text-xs rounded-lg p-2 font-semibold text-white focus:outline-none focus:border-[#b5a642]"
                          placeholder="e.g. 3.89%"
                        />
                      </div>

                      <div className="space-y-1">
                        <label className="block text-[10px] uppercase font-bold tracking-wide text-white/40">Amortization (Years)</label>
                        <select 
                          name="amortization" 
                          defaultValue={currentClient.appData?.amortization || "25"}
                          className="w-full bg-[#1b1b20] border border-white/5 text-xs rounded-lg p-2 font-semibold text-white focus:outline-none focus:border-[#b5a642]"
                        >
                          <option value="15">15 Years</option>
                          <option value="20">20 Years</option>
                          <option value="25">25 Years</option>
                          <option value="30">30 Years</option>
                        </select>
                      </div>

                      <div className="space-y-1">
                        <label className="block text-[10px] uppercase font-bold tracking-wide text-white/40">Occupancy Type</label>
                        <select 
                          name="tenure" 
                          defaultValue={currentClient.appData?.tenure || "owner-occupied"}
                          className="w-full bg-[#1b1b20] border border-white/5 text-xs rounded-lg p-2 font-semibold text-white focus:outline-none focus:border-[#b5a642]"
                        >
                          <option value="owner-occupied">Owner Occupied</option>
                          <option value="rental">Rental / Investment</option>
                          <option value="second-home">Second Home</option>
                        </select>
                      </div>

                      <div className="space-y-1">
                        <label className="block text-[10px] uppercase font-bold tracking-wide text-white/40">Maturity Date</label>
                        <input 
                          type="date" 
                          name="maturityDate" 
                          defaultValue={currentClient.appData?.maturityDate || ""}
                          className="w-full bg-[#1b1b20] border border-white/5 text-xs rounded-lg p-2 font-semibold text-white focus:outline-none focus:border-[#b5a642]"
                        />
                      </div>

                      <div className="space-y-1">
                        <label className="block text-[10px] uppercase font-bold tracking-wide text-white/40">Referred By</label>
                        <input 
                          type="text" 
                          name="referredBy" 
                          defaultValue={currentClient.appData?.referredBy || currentClient.referredBy || ""}
                          className="w-full bg-[#1b1b20] border border-white/5 text-xs rounded-lg p-2 font-semibold text-white focus:outline-none focus:border-[#b5a642]"
                          placeholder="Broker network, etc."
                        />
                      </div>

                      <div className="space-y-1">
                        <label className="block text-[10px] uppercase font-bold tracking-wide text-white/40">Lender Partner</label>
                        <select 
                          name="lender" 
                          defaultValue={currentClient.lender || ""}
                          className="w-full bg-[#1b1b20] border border-white/5 text-xs rounded-lg p-2 font-semibold text-white focus:outline-none focus:border-[#b5a642]"
                        >
                          <option value="">No submission</option>
                          {lenders.map(l => (
                            <option key={l.name} value={l.name}>{l.name}</option>
                          ))}
                        </select>
                      </div>

                      <div className="space-y-1">
                        <label className="block text-[10px] uppercase font-bold tracking-wide text-white/40">Assigned Broker</label>
                        <select 
                          name="agent" 
                          defaultValue={currentClient.agent || ""}
                          className="w-full bg-[#1b1b20] border border-white/5 text-xs rounded-lg p-2 font-semibold text-white focus:outline-none focus:border-[#b5a642]"
                        >
                          <option value="">Unassigned</option>
                          {getAgentNames().map(name => (
                            <option key={name} value={name}>{name}</option>
                          ))}
                        </select>
                      </div>
                    </div>

                    <button 
                      type="submit"
                      className="w-full bg-[#b5a642] text-black font-black uppercase tracking-widest text-[10px] py-3 rounded-lg hover:bg-[#9a8c38] transition-colors mt-3"
                    >
                      ✓ Save Mortgage Parameters
                    </button>
                  </form>
                )}

                {/* 3. FINANCIALS TAB */}
                {detailTab === "financials" && (
                  <div className="flex flex-col gap-4">
                    <div className="p-4 bg-[#1b1b20] border border-white/5 rounded-xl flex flex-col gap-1">
                      <div className="text-[10px] text-white/40 uppercase tracking-wide font-black">Loan To Value (LTV)</div>
                      <div className="text-2xl font-bold text-[#b5a642]">
                        {pn(currentClient.propval) > 0 ? `${(pn(currentClient.mtgamt) / pn(currentClient.propval) * 100).toFixed(1)}%` : "N/A"}
                      </div>
                      <div className="text-[10px] text-[#8e95a3] mt-1">
                        Value: {fd(pn(currentClient.propval))} | Loan: {fd(pn(currentClient.mtgamt))}
                      </div>
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                      <div className="p-3 bg-[#1b1b20] rounded-xl border border-white/5">
                        <div className="text-[10px] text-white/40 uppercase font-black">Primary Income</div>
                        <div className="text-sm font-bold text-white mt-1">{currentClient.income ? fd(pn(currentClient.income)) : "—"}</div>
                      </div>
                      <div className="p-3 bg-[#1b1b20] rounded-xl border border-white/5">
                        <div className="text-[10px] text-white/40 uppercase font-black">Joint/Co Income</div>
                        <div className="text-sm font-bold text-white mt-1">{currentClient.coIncome ? fd(pn(currentClient.coIncome)) : "—"}</div>
                      </div>
                      <div className="p-3 bg-[#1b1b20] rounded-xl border border-white/5">
                        <div className="text-[10px] text-white/40 uppercase font-black">Total Debts / Month</div>
                        <div className="text-sm font-bold text-white mt-1">{currentClient.debts ? fd(pn(currentClient.debts)) : "—"}</div>
                      </div>
                      <div className="p-3 bg-[#1b1b20] rounded-xl border border-white/5">
                        <div className="text-[10px] text-white/40 uppercase font-black">Condo Fees / Month</div>
                        <div className="text-sm font-bold text-white mt-1">{currentClient.condo ? fd(pn(currentClient.condo)) : "—"}</div>
                      </div>
                    </div>
                  </div>
                )}

                {/* 4. DOCUMENTS VAULT TAB */}
                {detailTab === "documents" && (
                  <div className="flex flex-col gap-4 h-full min-h-[400px]">
                    <DocumentManager 
                      clients={clients}
                      currentUser={currentUser}
                      docVault={docVault}
                      setDocVault={setDocVault}
                      onOpenClient={openClient}
                      showToast={showToast}
                      agentNames={getAgentNames()}
                      isOwnerOrManager={currentUser.role === 'Owner / Master Admin' || currentUser.role === 'Super Admin' || currentUser.role === 'IT / Developer'}
                      embeddedClientId={currentClient.id}
                    />
                  </div>
                )}

                {/* 5. CHECKLIST STATUS MANAGER TAB */}
                {detailTab === "checklist" && (
                  <MortgageChecklist
                    client={currentClient}
                    currentUser={currentUser}
                    docVault={docVault}
                    setDocVault={setDocVault}
                    agentNames={getAgentNames()}
                    showToast={showToast}
                  />
                )}

                {/* 6. INTERNAL NOTES TAB */}
                {detailTab === "notes" && (
                  <MortgageActivityTracker
                    client={currentClient}
                    currentUser={currentUser}
                    onUpdateClient={handleUpdateClient}
                    agentNames={getAgentNames()}
                    activeSubTab="notes"
                    showToast={showToast}
                  />
                )}

                {/* 7. ACTIVITY AUDIT TIMELINE TAB */}
                {detailTab === "activity" && (
                  <MortgageActivityTracker
                    client={currentClient}
                    currentUser={currentUser}
                    onUpdateClient={handleUpdateClient}
                    agentNames={getAgentNames()}
                    activeSubTab="activity"
                    showToast={showToast}
                  />
                )}

                {/* 8. AI ANALYSIS / DEEP UNDERWRITE TAB */}
                {detailTab === "ai analysis" && (
                  <div className="flex flex-col gap-4">
                    <button 
                      onClick={() => triggerUnderwritingAnalysis(currentClient)}
                      className="w-full bg-[#b5a642] text-black font-semibold text-xs py-2.5 rounded-lg hover:bg-[#9a8c38] transition-all flex items-center justify-center gap-1.5"
                    >
                      <Sparkles className="w-3.5 h-3.5 fill-current" /> Run Deep Underwrite Analysis (Gemini)
                    </button>

                    <div className="p-4 bg-[#1b1b20] border border-white/5 rounded-xl">
                      <div className="text-[10px] font-bold text-[#b5a642] uppercase tracking-wider mb-2">Automated Underwriter Notes</div>
                      <div className="text-xs leading-relaxed text-[#eeeef2] whitespace-pre-wrap font-sans">
                        {currentClient.aiSummary || "No report generated. Click button above to initiate Gemini analysis."}
                      </div>
                    </div>
                  </div>
                )}
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Settings Modal config */}
      <AnimatePresence>
        {settingsModalOpen && (
          <div className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center p-4 backdrop-blur-sm">
            <div className="bg-[#141418] border border-white/10 rounded-2xl w-full max-w-sm p-6 shadow-2xl relative">
              <button onClick={() => setSettingsModalOpen(false)} className="absolute right-4 top-4 text-[#8e95a3] hover:text-white">✕</button>
              <h3 className="text-sm font-bold text-white uppercase tracking-wider mb-4 border-b border-white/5 pb-2">CRM Configuration</h3>
              
              <div className="flex flex-col gap-4">
                <div>
                  <label className="block text-[10px] text-[#8e95a3] uppercase font-bold tracking-wider mb-1">Interactive Advisor Name</label>
                  <input 
                    type="text" 
                    value={currentUser.first + " " + currentUser.last}
                    onChange={(e) => {
                      const parts = e.target.value.split(" ");
                      setCurrentUser(prev => ({ ...prev, first: parts[0] || "", last: parts.slice(1).join(" ") }));
                    }}
                    className="w-full bg-[#1b1b20] border border-white/5 rounded-lg px-3 py-2 text-xs text-white focus:outline-none"
                  />
                </div>

                <div>
                  <label className="block text-[10px] text-[#8e95a3] uppercase font-bold tracking-wider mb-1">Gemini API Key</label>
                  <input 
                    type="password" 
                    value={settings.apiKey || ""}
                    onChange={(e) => {
                      const apiVal = e.target.value;
                      setSettings(prev => ({ ...prev, apiKey: apiVal }));
                      localStorage.setItem("gbk_apiKey", apiVal);
                    }}
                    placeholder="sk-ant-api03-..."
                    className="w-full bg-[#1b1b20] border border-white/5 rounded-lg px-3 py-2 text-xs text-white focus:outline-none focus:border-[#b5a642]/30"
                  />
                  <span className="text-[9px] text-[#8e95a3] mt-1 block">Stored locally inside browser sandbox cache. Allows instant AI reports.</span>
                </div>

                <button 
                  onClick={() => {
                    setSettingsModalOpen(false);
                    showToast("Configuration safely saved!", "success");
                  }}
                  className="w-full mt-2 bg-[#b5a642] text-black font-semibold text-xs py-2.5 rounded-lg hover:bg-[#9a8c38] transition-all"
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
            <div className="bg-[#141418] border border-white/10 rounded-2xl w-full max-w-md p-6 shadow-2xl relative max-h-[90vh] overflow-y-auto flex flex-col">
              <button 
                onClick={() => setProfileModalOpen(false)} 
                className="absolute right-4 top-4 text-[#8e95a3] hover:text-white text-sm"
              >
                ✕
              </button>
              
              <h3 className="text-xs font-bold text-white uppercase tracking-wider mb-2 pb-1 border-b border-white/5">
                Broker Account & credentials
              </h3>
              
              {/* Tabs */}
              <div className="flex border-b border-white/5 mb-4 shrink-0">
                <button 
                  onClick={() => setProfileTab('profile')} 
                  className={`flex-1 pb-2 text-[10px] uppercase font-bold tracking-wider text-center border-b-2 transition-colors ${profileTab === 'profile' ? 'border-[#b5a642] text-[#b5a642]' : 'border-transparent text-white/40 hover:text-white'}`}
                >
                  Active sync
                </button>
                <button 
                  onClick={() => setProfileTab('signup')} 
                  className={`flex-1 pb-2 text-[10px] uppercase font-bold tracking-wider text-center border-b-2 transition-colors ${profileTab === 'signup' ? 'border-[#b5a642] text-[#b5a642]' : 'border-transparent text-white/40 hover:text-white'}`}
                >
                  Sign Up
                </button>
                <button 
                  onClick={() => {
                    setProfileTab('switch');
                    setSwError("");
                    setSwPin("");
                  }} 
                  className={`flex-1 pb-2 text-[10px] uppercase font-bold tracking-wider text-center border-b-2 transition-colors ${profileTab === 'switch' ? 'border-[#b5a642] text-[#b5a642]' : 'border-transparent text-white/40 hover:text-white'}`}
                >
                  Switch Broker
                </button>
              </div>

              {/* TAB CONTENT: PROFILE SYNC EDIT */}
              {profileTab === 'profile' && (
                <div className="flex flex-col gap-3">
                  <div className="bg-[#1b1b20] p-3 rounded-lg border border-white/5">
                    <div className="text-xs font-bold text-white mb-0.5">{currentUser.first} {currentUser.last}</div>
                    <div className="text-[10px] text-[#b5a642] font-semibold mb-2">{currentUser.role}</div>
                    <div className="text-[10px] text-white/50 flex flex-col gap-0.5 font-mono">
                      <span>Email: {currentUser.email}</span>
                      {currentUser.phone && <span>Phone: {currentUser.phone}</span>}
                      {currentUser.fsraNum && <span>Licence FSRA: {currentUser.fsraNum}</span>}
                    </div>
                  </div>

                  <span className="text-[9px] uppercase font-bold tracking-wider text-white/40 mt-1">Workspace Credentials Settings</span>
                  
                  <div className="flex flex-col gap-2.5">
                    <div>
                      <label className="block text-[8px] text-[#8e95a3] uppercase font-bold tracking-wider mb-1">Incoming IMAP/SMTP Username</label>
                      <input 
                        type="text" 
                        placeholder="e.g. email@gbkfinancial.ca"
                        value={activeUsername}
                        onChange={(e) => setActiveUsername(e.target.value)}
                        className="w-full bg-[#1b1b20] border border-white/5 rounded-lg px-2.5 py-1.5 text-xs text-white focus:outline-none"
                      />
                    </div>

                    <div>
                      <label className="block text-[8px] text-[#8e95a3] uppercase font-bold tracking-wider mb-1">Email App Password</label>
                      <input 
                        type="password" 
                        placeholder="••••••••••••••••"
                        value={activePassword}
                        onChange={(e) => setActivePassword(e.target.value)}
                        className="w-full bg-[#1b1b20] border border-white/5 rounded-lg px-2.5 py-1.5 text-xs text-white focus:outline-none font-mono"
                      />
                    </div>

                    <div className="grid grid-cols-2 gap-3">
                      <div>
                        <label className="block text-[8px] text-[#8e95a3] uppercase font-bold tracking-wider mb-1">Server Host</label>
                        <input 
                          type="text" 
                          placeholder="e.g. imap.gmail.com"
                          value={activeHost}
                          onChange={(e) => setActiveHost(e.target.value)}
                          className="w-full bg-[#1b1b20] border border-white/5 rounded-lg px-2.5 py-1.5 text-xs text-white focus:outline-none font-mono"
                        />
                      </div>
                      <div>
                        <label className="block text-[8px] text-[#8e95a3] uppercase font-bold tracking-wider mb-1">Server Port (SSL/TLS)</label>
                        <input 
                          type="text" 
                          placeholder="993"
                          value={activePort}
                          onChange={(e) => setActivePort(e.target.value)}
                          className="w-full bg-[#1b1b20] border border-white/5 rounded-lg px-2.5 py-1.5 text-xs text-white focus:outline-none font-mono"
                        />
                      </div>
                    </div>

                    <div className="flex gap-2 mt-2 border-t border-white/5 pt-3">
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
                        className="flex-1 bg-red-600/10 hover:bg-red-600/20 border border-red-500/20 text-red-400 font-bold text-[10px] py-2 rounded-lg transition-all"
                      >
                        Disconnect Sync
                      </button>
                      <button 
                        onClick={() => {
                          const updatedUser = {
                            ...currentUser,
                            emailHost: activeHost,
                            emailPort: activePort,
                            emailUsername: activeUsername,
                            emailPassword: activePassword
                          };
                          setCurrentUser(updatedUser);
                          const updatedRoster = userRoster.map(u => u.id === currentUser.id ? updatedUser : u);
                          setUserRoster(updatedRoster);
                          localStorage.setItem("gbk_roster", JSON.stringify(updatedRoster));
                          logActivity(`Configured custom email credentials`, currentUser.email);
                          showToast("Workspace Credentials Sync Enabled!", "success", "🔐");
                          setProfileModalOpen(false);
                        }}
                        className="flex-1 bg-[#b5a642] hover:bg-[#9a8c38] text-black font-bold text-[10px] py-2 rounded-lg transition-all"
                      >
                        ✓ Save & Sync Workspace
                      </button>
                    </div>
                  </div>
                </div>
              )}

              {/* TAB CONTENT: SIGN UP */}
              {profileTab === 'signup' && (
                <form 
                  onSubmit={(e) => {
                    e.preventDefault();
                    if (!suFirst || !suLast || !suEmail || !suPin) {
                      showToast("Please fill out First Name, Last Name, Email, and PIN.", "error");
                      return;
                    }
                    const newUserId = `u_${Date.now()}`;
                    const newUserRecord: User = {
                      id: newUserId,
                      first: suFirst,
                      last: suLast,
                      email: suEmail,
                      role: suRole,
                      status: 'active',
                      phone: suPhone || undefined,
                      pin: suPin,
                      lastLogin: new Date().toISOString(),
                      created: new Date().toISOString().split("T")[0],
                      fsraNum: suFsra || undefined,
                      emailHost: suHost,
                      emailPort: suPort,
                      emailUsername: suEmail,
                      emailPassword: suPass || undefined
                    };
                    const newRoster = [...userRoster, newUserRecord];
                    setUserRoster(newRoster);
                    localStorage.setItem("gbk_roster", JSON.stringify(newRoster));
                    setCurrentUser(newUserRecord);
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
                  className="flex flex-col gap-2.5"
                >
                  <div className="grid grid-cols-2 gap-2">
                    <div>
                      <label className="block text-[8px] text-[#8e95a3] uppercase font-bold tracking-wider mb-1">First Name</label>
                      <input 
                        type="text" 
                        value={suFirst}
                        onChange={(e) => setSuFirst(e.target.value)}
                        className="w-full bg-[#1b1b20] border border-white/5 rounded px-2.5 py-1.5 text-xs text-white focus:outline-none"
                        required
                      />
                    </div>
                    <div>
                      <label className="block text-[8px] text-[#8e95a3] uppercase font-bold tracking-wider mb-1">Last Name</label>
                      <input 
                        type="text" 
                        value={suLast}
                        onChange={(e) => setSuLast(e.target.value)}
                        className="w-full bg-[#1b1b20] border border-white/5 rounded px-2.5 py-1.5 text-xs text-white focus:outline-none"
                        required
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-[8px] text-[#8e95a3] uppercase font-bold tracking-wider mb-1">Business Email</label>
                    <input 
                      type="email" 
                      value={suEmail}
                      onChange={(e) => setSuEmail(e.target.value)}
                      placeholder="e.g. agent@gbkfinancial.ca"
                      className="w-full bg-[#1b1b20] border border-white/5 rounded px-2.5 py-1.5 text-xs text-white focus:outline-none"
                      required
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-2">
                    <div>
                      <label className="block text-[8px] text-[#8e95a3] uppercase font-bold tracking-wider mb-1">Security PIN (4 Digits)</label>
                      <input 
                        type="password" 
                        maxLength={4}
                        value={suPin}
                        onChange={(e) => setSuPin(e.target.value.replace(/\D/g, ""))}
                        placeholder="••••"
                        className="w-full bg-[#1b1b20] border border-white/5 rounded px-2.5 py-1.5 text-xs text-white text-center tracking-widest font-mono focus:outline-none"
                        required
                      />
                    </div>
                    <div>
                      <label className="block text-[8px] text-[#8e95a3] uppercase font-bold tracking-wider mb-1">FSRA Licence #</label>
                      <input 
                        type="text" 
                        value={suFsra}
                        onChange={(e) => setSuFsra(e.target.value)}
                        placeholder="e.g. M230045"
                        className="w-full bg-[#1b1b20] border border-white/5 rounded px-2.5 py-1.5 text-xs text-white focus:outline-none"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-[8px] text-[#8e95a3] uppercase font-bold tracking-wider mb-1">Operational Role</label>
                    <select 
                      value={suRole}
                      onChange={(e) => setSuRole(e.target.value as any)}
                      className="w-full bg-[#1b1b20] border border-white/5 rounded p-1.5 text-xs text-white focus:outline-none"
                    >
                      <option value="Agent">🏡 Licensed Mortgage Agent</option>
                      <option value="Senior Broker">🥇 Senior Broker Consultant</option>
                      <option value="Super Admin">💼 Operations Super Admin</option>
                      <option value="Owner / Master Admin">👑 Owner / Master Director</option>
                    </select>
                  </div>

                  <span className="text-[9px] uppercase font-bold tracking-wider text-white/40 mt-1">Optional GSuite Email host Sync</span>
                  <div className="grid grid-cols-2 gap-2">
                    <input 
                      type="text" 
                      placeholder="imap.gmail.com"
                      value={suHost}
                      onChange={(e) => setSuHost(e.target.value)}
                      className="w-full bg-[#1b1b20]/60 border border-white/5 rounded px-2 py-1 text-[11px] text-white focus:outline-none"
                    />
                    <input 
                      type="password" 
                      placeholder="Gmail App Password"
                      value={suPass}
                      onChange={(e) => setSuPass(e.target.value)}
                      className="w-full bg-[#1b1b20]/60 border border-white/5 rounded px-2 py-1 text-[11px] text-white focus:outline-none"
                    />
                  </div>

                  <button 
                    type="submit"
                    className="w-full mt-2 bg-[#b5a642] text-black font-bold text-xs py-2.5 rounded-lg hover:bg-[#9a8c38] transition-all"
                  >
                    Register and Login as Agent
                  </button>
                </form>
              )}

              {/* TAB CONTENT: SWITCH ACTIVE USER */}
              {profileTab === 'switch' && (
                <div className="flex flex-col gap-3">
                  <div className="max-h-56 overflow-y-auto flex flex-col gap-1.5 pr-1">
                    {userRoster.map(u => (
                      <button
                        key={u.id}
                        type="button"
                        onClick={() => {
                          setSwTargetId(u.id);
                          setSwPin("");
                          setSwError("");
                        }}
                        className={`p-2.5 rounded-lg border text-left flex items-center justify-between transition-all ${swTargetId === u.id ? 'border-[#b5a642] bg-[#b5a642]/5' : 'border-white/5 bg-[#1b1b20]/30 hover:bg-[#1b1b20]/60'}`}
                      >
                        <div>
                          <div className={`text-xs font-semibold ${swTargetId === u.id ? 'text-[#b5a642]' : 'text-white'}`}>{u.first} {u.last}</div>
                          <div className="text-[9px] text-[#8e95a3]">{u.role}</div>
                        </div>
                        <div className="text-[10px] text-white/30 truncate font-mono max-w-[140px]">{u.email}</div>
                      </button>
                    ))}
                  </div>

                  {swTargetId && (
                    <form 
                      onSubmit={(e) => {
                        e.preventDefault();
                        const match = userRoster.find(u => u.id === swTargetId);
                        if (!match) {
                          setSwError("Target user profile not found");
                          return;
                        }
                        if (match.pin === swPin) {
                          setCurrentUser(match);
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
                      className="mt-2 border-t border-white/5 pt-3 flex flex-col gap-2"
                    >
                      <div className="text-[10px] text-white/60 mb-1">Enter your 4-digit Security PIN to switch:</div>
                      
                      <div className="flex gap-2">
                        <input 
                          type="password"
                          maxLength={4}
                          value={swPin}
                          onChange={(e) => setSwPin(e.target.value.replace(/\D/g, ""))}
                          placeholder="••••"
                          className="w-32 bg-[#1b1b20] border border-white/10 rounded px-2 text-center text-sm font-mono tracking-widest text-[#b5a642] focus:outline-none"
                          required
                        />
                        <button 
                          type="submit"
                          className="flex-1 bg-white/10 hover:bg-white/15 border border-white/10 text-white font-bold text-[10px] py-1.5 rounded"
                        >
                          Confirm Switch
                        </button>
                      </div>

                      {swError && (
                        <span className="text-[10px] text-red-400 mt-1">{swError}</span>
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

// ── Shared local state getters
const settingsStorageKey = "gbk_apiKey";
const initialSettings = { apiKey: localStorage.getItem(settingsStorageKey) || "" };
function setSettings(v: any) {
  // Mock settings helper
  if (v.apiKey !== undefined) localStorage.setItem(settingsStorageKey, v.apiKey);
}
const settings = {
  get apiKey() { return localStorage.getItem(settingsStorageKey) || ""; }
};
