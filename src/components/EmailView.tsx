import React, { useState, useEffect } from "react";
import { 
  Mail, Star, Send, FileText, Trash2, ArrowLeft, RefreshCw, MailOpen, 
  User, CheckCircle2, AlertCircle, Plus, Calendar, Clock, Lock, 
  Link as LinkIcon, Paperclip, ChevronDown, Check, Reply, Sliders,
  FileCheck, ShieldAlert, Sparkles, MessageSquare, LogOut, CheckSquare,
  Archive, Inbox, ShieldCheck
} from "lucide-react";
import { Email, EmailTemplate, Client, Task, Event } from "../types";
import { sendEmail } from "../lib/bridgeService";

interface EmailViewProps {
  emailsState: { inbox: Email[]; sent: Email[]; scheduled: Email[]; queued: Email[] };
  setEmailsState: React.Dispatch<React.SetStateAction<{ inbox: Email[]; sent: Email[]; scheduled: Email[]; queued: Email[] }>>;
  templates: EmailTemplate[];
  currentUser: any;
  onOpenCompose?: (templateId?: string) => void;
  showToast: (msg: string, type?: any) => void;
  clients?: Client[];
  setClients?: React.Dispatch<React.SetStateAction<Client[]>>;
  tasks?: Task[];
  setTasks?: React.Dispatch<React.SetStateAction<Task[]>>;
  events?: Event[];
  setEvents?: React.Dispatch<React.SetStateAction<Event[]>>;
  onOpenClient?: (id: string) => void;
  logActivity?: (action: string, target?: string) => void;
  docVault?: Record<string, any>;
  setDocVault?: React.Dispatch<React.SetStateAction<Record<string, any>>>;
}

const MORTGAGE_PREPARED_TEMPLATES = [
  {
    id: "m-welcome",
    name: "1. Intro & Document Checklist",
    desc: "Welcome letter & required initial files list",
    subject: "Welcome to GBK Financial — Next Steps & Document Checklist",
    body: "Hi {{first}},\n\nThank you for choosing GBK Financial for your mortgage needs! We're excited to guide you through your home financing journey.\n\nTo begin preparing your file for underwriting, please send over the following initial documents at your earliest convenience:\n• Government Photo ID (Passport or Driver's Licence for all borrowers)\n• Two most recent pay stubs\n• Letter of Employment (on corporate letterhead, signed)\n• 2 years of T4s and Notice of Assessments (NOAs)\n• 90-day bank statements showing down payment source\n\nYou can reply directly to this email with attachments or drag them into our client portal. Reach out anytime if you have questions.\n\nBest regards,\n\n{{signature}}"
  },
  {
    id: "m-preapproval",
    name: "2. Pre-Approval Best Practices",
    desc: "Pre-approved home buyers rules",
    subject: "Congratulations! Your GBK Mortgage Pre-Approval is Ready",
    body: "Hi {{first}},\n\nFantastic news! We have successfully structured your pre-approval up to a maximum purchase budget of ${{amount}} based on our preliminary review.\n\nBefore you start submitting active offers, please keep these crucial rules in mind to protect your approval status:\n1. Do NOT make any major purchases on credit (avoid financing new cars, furniture, appliances etc.).\n2. Maintain your current employment status (do not switch positions or change pay structures).\n3. Keep your down payment stability intact and trackable in your primary accounts.\n\nLet us know as soon as you find a property you love so we can verify the address details and confirm the rate sheet.\n\nBest regards,\n\n{{signature}}"
  },
  {
    id: "m-commitment",
    name: "3. Conditional Commitment Conditions",
    desc: "Lender commitment conditions task",
    subject: "Outstanding Client Conditions - Commitment Approval Issued by {{lender}}",
    body: "Hi {{first}},\n\nWe have received a conditional commitment from {{lender}} for your loan request of ${{amount}} at an interest rate of {{rate}}%!\n\nTo get the final sign-off and move your file to fully approved, the underwriter has requested the following outstanding conditions immediately:\n• Signed mortgage application and borrower consent forms (attached)\n• Completed Gift Letter from immediate family (if any portion of downpayment is gifted)\n• Proof of deposit check clearance from your solicitor\n\nPlease submit these items as soon as possible so we can secure your final mortgage package.\n\nBest regards,\n\n{{signature}}"
  },
  {
    id: "m-appraisal",
    name: "4. Property Appraisal Coordinator",
    desc: "Underwriting appraisal payment link",
    subject: "Action Required: Property Appraisal Order — {{first}}",
    body: "Hi {{first}},\n\nAs part of the underwriter clearance guidelines, {{lender}} requires an independent professional appraisal of the property to verify its market valuation.\n\nWe have scheduled the appraiser to visit the property this week. To finalize the scheduling, please complete the appraisal payment at the secure link below:\n\n🔗 Appraisal Invoice Payment Portal: gbkfinancial.ca/pay/appraisal-deposit\n\nOnce paid, the team will transmit the electronic report directly to {{lender}} to resolve this file's condition.\n\nBest regards,\n\n{{signature}}"
  },
  {
    id: "m-finalclear",
    name: "5. Fully Approved & Legal Instructions",
    desc: "Cleared commitment and instructed lawyer",
    subject: "Great News! Your File is Fully Approved & Instructed",
    body: "Hi {{first}},\n\nWe are thrilled to let you know that {{lender}} has cleared all outstanding conditions! Your mortgage file is officially fully approved.\n\nOur operations desk has transmitted the final legal instructions to your real estate lawyer. Here are your next steps:\n1. Your solicitor will contact you shortly to schedule an appointment to sign the final transfer deeds and mortgage charge registry.\n2. You will need to bring bank drafts for the remaining balance of the down payment and closing costs.\n3. Keep a copy of your home insurance binder ready for your lawyer.\n\nIf you have any last-minute questions before closing day, don't hesitate to reach out!\n\nBest regards,\n\n{{signature}}"
  },
  {
    id: "m-funded",
    name: "6. Closed congratulation & First Repay",
    desc: "Successful checkout closed greetings",
    subject: "Welcome Home! Your Mortgage has Funded successfully",
    body: "Hi {{first}},\n\nCongratulations! Your transaction has officially closed and funded today. The keys are yours!\n\nHere is a quick summary of your mortgage details for your peace of mind:\n• Primary Lender: {{lender}}\n• Principal Loan: ${{amount}}\n• Interest Rate: {{rate}}%\n\nYour first automated repayment is scheduled to draw from your bank account shortly. We will check in with you in a few weeks to make sure everything has settled in beautifully.\n\nThank you for choosing GBK Financial. It was an honor working with you!\n\nBest regards,\n\n{{signature}}"
  }
];

interface ConfirmModalConfig {
  title: string;
  message: string;
  confirmText?: string;
  confirmVariant?: "danger" | "primary";
  onConfirm: () => void;
}

// Module-level in-memory cache for EmailView state preservation across component mounts
let inMemoryGmailLoggedIn = false;
let inMemoryGmailLoginEmail = "";
let inMemoryGmailSignature = "";
let inMemoryGmailDrafts: string | null = null;
let inMemoryGmailArchive: string | null = null;

export const EmailView: React.FC<EmailViewProps> = ({
  emailsState,
  setEmailsState,
  templates,
  currentUser,
  showToast,
  clients = [],
  setClients,
  tasks = [],
  setTasks,
  events = [],
  setEvents,
  onOpenClient,
  logActivity,
  docVault = {},
  setDocVault,
  bridgeOnline = false
}) => {
  const [confirmModal, setConfirmModal] = useState<ConfirmModalConfig | null>(null);

  // ── AUTH & SECTIONS STATES ──
  const [loginEmail, setLoginEmail] = useState<string>(() => {
    return currentUser?.email || inMemoryGmailLoginEmail || "david.acosta@gbkfinancial.ca";
  });

  const [smtpHost, setSmtpHost] = useState<string>("smtp.gmail.com");
  const [smtpPort, setSmtpPort] = useState<string>("587");
  const [smtpUsername, setSmtpUsername] = useState<string>(loginEmail || "");
  const [smtpPassword, setSmtpPassword] = useState<string>("");

  const [isLoggedIn, setIsLoggedIn] = useState<boolean>(() => {
    const savedFlag = localStorage.getItem("gbk_gmail_smtp_configured") === "true";
    return savedFlag;
  });

  useEffect(() => {
    const savedFlag = localStorage.getItem("gbk_gmail_smtp_configured") === "true";
    setIsLoggedIn(savedFlag);
    const uEmail = currentUser?.email || "david.acosta@gbkfinancial.ca";
    setLoginEmail(uEmail);
    setSmtpUsername(uEmail || smtpUsername || "");
  }, [currentUser]);

  useEffect(() => {
    const savedHost = localStorage.getItem("gbk_gmail_smtp_host");
    const savedPort = localStorage.getItem("gbk_gmail_smtp_port");
    const savedUser = localStorage.getItem("gbk_gmail_smtp_username");
    const savedConfigured = localStorage.getItem("gbk_gmail_smtp_configured") === "true";
    if (savedHost) setSmtpHost(savedHost);
    if (savedPort) setSmtpPort(savedPort);
    if (savedUser) setSmtpUsername(savedUser);
    setIsLoggedIn(savedConfigured);
  }, []);

  const [activeFolder, setActiveFolder] = useState<string>("inbox");
  const [selectedEmail, setSelectedEmail] = useState<Email | null>(null);
  const [searchQuery, setSearchQuery] = useState<string>("");
  const [mailboxScope, setMailboxScope] = useState<string>("personal");
  const [signatureText, setSignatureText] = useState<string>(() => {
    return inMemoryGmailSignature || 
      `Regards,\n\n${currentUser.first} ${currentUser.last}\nSenior Mortgage Advisor, GBK Financial\nPhone: ${currentUser.phone || "(416) 555-0105"}\nWeb: gbkfinancial.ca`;
  });
  const [showSignatureEdit, setShowSignatureEdit] = useState<boolean>(false);

  // Draft / Custom folder pools (internal simulation)
  const [draftsList, setDraftsList] = useState<Email[]>(() => {
    const saved = localStorage.getItem("gbk_gmail_drafts");
    if (saved) {
      try {
        const parsed: Email[] = JSON.parse(saved);
        return parsed.filter(e => e && e.id && !e.id.startsWith("ie") && !e.id.startsWith("dr-"));
      } catch (e) {
        return [];
      }
    }
    return [];
  });

  const [archivedList, setArchivedList] = useState<Email[]>(() => {
    const saved = localStorage.getItem("gbk_gmail_archives");
    if (saved) {
      try {
        const parsed: Email[] = JSON.parse(saved);
        return parsed.filter(e => e && e.id && !e.id.startsWith("ie") && !e.id.startsWith("dr-"));
      } catch (e) {
        return [];
      }
    }
    return [];
  });

  const [trashList, setTrashList] = useState<Email[]>(() => {
    const saved = localStorage.getItem("gbk_gmail_trash");
    if (saved) {
      try {
        const parsed: Email[] = JSON.parse(saved);
        return parsed.filter(e => e && e.id && !e.id.startsWith("ie") && !e.id.startsWith("dr-"));
      } catch (e) {
        return [];
      }
    }
    return [];
  });

  useEffect(() => {
    localStorage.setItem("gbk_gmail_drafts", JSON.stringify(draftsList));
    inMemoryGmailDrafts = JSON.stringify(draftsList);
  }, [draftsList]);

  useEffect(() => {
    localStorage.setItem("gbk_gmail_archives", JSON.stringify(archivedList));
    inMemoryGmailArchive = JSON.stringify(archivedList);
  }, [archivedList]);

  useEffect(() => {
    localStorage.setItem("gbk_gmail_trash", JSON.stringify(trashList));
  }, [trashList]);

  // ── WIZARD DIALOG STATES (TASK/EVENT CREATION OVERLAYS) ──
  const [isTaskWizardOpen, setIsTaskWizardOpen] = useState<boolean>(false);
  const [taskWizardTitle, setTaskWizardTitle] = useState<string>("");
  const [taskWizardPriority, setTaskWizardPriority] = useState<"high" | "medium" | "low">("high");
  const [taskWizardDueDate, setTaskWizardDueDate] = useState<string>(new Date(Date.now() + 86400000).toISOString().split("T")[0]);
  const [taskWizardNotes, setTaskWizardNotes] = useState<string>("");
  const [taskWizardAssignee, setTaskWizardAssignee] = useState<string>("Jeff Brown");

  const [isEventWizardOpen, setIsEventWizardOpen] = useState<boolean>(false);
  const [eventWizardTitle, setEventWizardTitle] = useState<string>("");
  const [eventWizardDate, setEventWizardDate] = useState<string>(new Date(Date.now() + 172800000).toISOString().split("T")[0]);
  const [eventWizardTime, setEventWizardTime] = useState<string>("10:00 AM");
  const [eventWizardType, setEventWizardType] = useState<"client" | "meeting" | "lender" | "personal">("client");
  const [eventWizardNotes, setEventWizardNotes] = useState<string>("");

  // ── COMPOSE FLOW DIALOG STATES ──
  const [isComposeOpen, setIsComposeOpen] = useState<boolean>(false);
  const [composeTo, setComposeTo] = useState<string>("");
  const [composeToEmail, setComposeToEmail] = useState<string>("");
  const [showCc, setShowCc] = useState<boolean>(false);
  const [showBcc, setShowBcc] = useState<boolean>(false);
  const [composeCc, setComposeCc] = useState<string>("");
  const [composeBcc, setComposeBcc] = useState<string>("");
  const [composeSubject, setComposeSubject] = useState<string>("");
  const [composeBody, setComposeBody] = useState<string>("");
  const [composeAttachments, setComposeAttachments] = useState<Array<{ name: string; size: string }>>([]);
  const [selectedClientLink, setSelectedClientLink] = useState<string>("");
  const [scheduleSendTime, setScheduleSendTime] = useState<string>("");
  const [isScheduled, setIsScheduled] = useState<boolean>(false);

  // ── GMAIL SMTP CONNECT & DISCONNECT WORKFLOW ──
  const handleGoogleLogin = () => {
    if (!smtpHost || !smtpPort || !smtpUsername || !smtpPassword) {
      showToast("Please fill SMTP host, port, Gmail address, and app password/token before saving.", "error");
      return;
    }
    localStorage.setItem("gbk_gmail_smtp_host", smtpHost);
    localStorage.setItem("gbk_gmail_smtp_port", smtpPort);
    localStorage.setItem("gbk_gmail_smtp_username", smtpUsername);
    localStorage.setItem("gbk_gmail_smtp_password_placeholder", smtpPassword ? "set" : "");
    localStorage.setItem("gbk_gmail_smtp_configured", "true");
    setIsLoggedIn(true);
    showToast("Gmail SMTP settings saved successfully!", "success");
    if (logActivity) {
      logActivity("Configured Gmail SMTP settings", smtpUsername);
    }
  };

  const handleGoogleLogout = () => {
    const confirmed = window.confirm("Clear Gmail SMTP settings and disconnect?");
    if (!confirmed) return;
    setIsLoggedIn(false);
    localStorage.removeItem("gbk_gmail_smtp_configured");
    localStorage.removeItem("gbk_gmail_smtp_host");
    localStorage.removeItem("gbk_gmail_smtp_port");
    localStorage.removeItem("gbk_gmail_smtp_username");
    localStorage.removeItem("gbk_gmail_smtp_password_placeholder");
    showToast("Gmail SMTP settings removed.", "success");
    if (logActivity) logActivity("Cleared Gmail SMTP settings", smtpUsername);
  };

  // STAR / UNSTAR EMAIL TOGGLE
  const toggleStarEmail = (e: React.MouseEvent, email: Email) => {
    e.stopPropagation();
    const nextStarred = !email.starred;

    const updateArr = (arr: Email[]) => (arr || []).map(item => item.id === email.id ? { ...item, starred: nextStarred } : item);

    setEmailsState(prev => ({
      inbox: updateArr(prev.inbox),
      sent: updateArr(prev.sent),
      scheduled: updateArr(prev.scheduled),
      queued: updateArr(prev.queued || [])
    }));
    setDraftsList(updateArr);
    setArchivedList(updateArr);
    setTrashList(updateArr);

    if (selectedEmail && selectedEmail.id === email.id) {
      setSelectedEmail(prev => prev ? { ...prev, starred: nextStarred } : null);
    }

    showToast(nextStarred ? "Starred email" : "Unstarred email", "info", "★");
  };

  // RESTORE EMAIL FROM TRASH TO INBOX
  const handleRestoreFromTrash = (email: Email) => {
    setTrashList(prev => prev.filter(item => item.id !== email.id));
    setEmailsState(prev => ({
      ...prev,
      inbox: [{ ...email, unread: false }, ...prev.inbox]
    }));
    showToast(`Restored "${email.subject || 'message'}" back to Inbox!`, "success", "📥");
    if (logActivity) logActivity("Restored email from trash to inbox", email.subject);
  };

  const handleDeleteEmail = (e: React.MouseEvent | undefined, email: Email) => {
    if (e) {
      e.stopPropagation();
      e.preventDefault();
    }
    if (!email || !email.id) return;

    if (activeFolder === "trash") {
      setConfirmModal({
        title: "Permanently Delete Email",
        message: `Are you sure you want to permanently delete "${email.subject || '(no subject)'}" from Trash? This action cannot be undone.`,
        confirmText: "Permanently Delete",
        confirmVariant: "danger",
        onConfirm: () => {
          setTrashList(prev => prev.filter(item => item.id !== email.id));
          if (selectedEmail?.id === email.id) {
            setSelectedEmail(null);
          }
          showToast("Email permanently removed from Trash.", "success");
          if (logActivity) logActivity("Permanently deleted email from trash", email.subject);
        }
      });
    } else {
      // Move to Trash
      setEmailsState(prev => ({
        inbox: (prev.inbox || []).filter(item => item.id !== email.id),
        sent: (prev.sent || []).filter(item => item.id !== email.id),
        scheduled: (prev.scheduled || []).filter(item => item.id !== email.id),
        queued: (prev.queued || []).filter(item => item.id !== email.id)
      }));

      setDraftsList(prev => prev.filter(item => item.id !== email.id));
      setArchivedList(prev => prev.filter(item => item.id !== email.id));

      setTrashList(prev => [{ ...email }, ...prev]);

      if (selectedEmail?.id === email.id) {
        setSelectedEmail(null);
      }

      showToast("Email moved to Trash.", "info", "🗑️");
      if (logActivity) logActivity("Moved email correspondence to Trash", email.subject);
    }
  };

  const handleClearCurrentFolder = () => {
    const currentList = getMailboxEmails();
    if (currentList.length === 0) return;

    setConfirmModal({
      title: `Clear ${activeFolder.toUpperCase()} Folder`,
      message: `Are you sure you want to permanently delete ALL ${currentList.length} emails in the ${activeFolder} folder?`,
      confirmText: "Clear All",
      confirmVariant: "danger",
      onConfirm: () => {
        if (activeFolder === "drafts") {
          setDraftsList([]);
        } else if (activeFolder === "archived") {
          setArchivedList([]);
        } else if (activeFolder === "trash") {
          setTrashList([]);
        } else {
          setEmailsState(prev => {
            const key = activeFolder as keyof typeof prev;
            if (key && prev[key]) {
              return {
                ...prev,
                [key]: []
              };
            }
            return prev;
          });
        }

        setSelectedEmail(null);
        showToast(`Permanently cleared all emails in ${activeFolder} folder.`, "success");
        if (logActivity) logActivity("Cleared email folder", activeFolder);
      }
    });
  };

  const handleSaveSignature = () => {
    inMemoryGmailSignature = signatureText;
    setShowSignatureEdit(false);
    showToast("Broker signature saved successfully!", "success");
  };

  const openReplyCompose = (email: Email) => {
    setIsComposeOpen(true);
    setSelectedClientLink(email.clientId || "");
    setComposeTo(email.from || "");
    setComposeToEmail(email.fromEmail || "");
    const baseSubject = email.subject || "";
    setComposeSubject(baseSubject.startsWith("Re:") ? baseSubject : `Re: ${baseSubject}`);
    const quoted = email.body || email.preview || "";
    setComposeBody(
      `Hi ${email.from || ""},\n\n` +
      `\n\n--- Original message ---\nFrom: ${email.from} <${email.fromEmail}>\nSubject: ${email.subject}\n\n${quoted}`
    );
    setIsScheduled(false);
  };

  // ── CONSTRUCT ACTIVE DIRECTORY (GMAIL STRUCTURE) ──
  const getMailboxEmails = () => {
    if (activeFolder === "inbox") return emailsState.inbox;
    if (activeFolder === "starred") {
      const all = [
        ...emailsState.inbox,
        ...emailsState.sent,
        ...emailsState.scheduled,
        ...(emailsState.queued || []),
        ...draftsList,
        ...archivedList,
        ...trashList
      ];
      const seen = new Set<string>();
      return all.filter(e => {
        if (e && e.starred && !seen.has(e.id)) {
          seen.add(e.id);
          return true;
        }
        return false;
      });
    }
    if (activeFolder === "scheduled") return emailsState.scheduled;
    if (activeFolder === "sent") return emailsState.sent;
    if (activeFolder === "drafts") return draftsList;
    if (activeFolder === "archived") return archivedList;
    if (activeFolder === "trash") return trashList;
    return [];
  };

  const currentEmails = getMailboxEmails();

  // Search filter
  const filteredEmails = currentEmails.filter(email => {
    const query = searchQuery.toLowerCase();
    if (!query) return true;
    return (
      (email.from || "").toLowerCase().includes(query) ||
      (email.to || "").toLowerCase().includes(query) ||
      (email.fromEmail || "").toLowerCase().includes(query) ||
      (email.toEmail || "").toLowerCase().includes(query) ||
      (email.subject || "").toLowerCase().includes(query) ||
      (email.preview || "").toLowerCase().includes(query) ||
      (email.body || "").toLowerCase().includes(query) ||
      (email.clientMatch || "").toLowerCase().includes(query)
    );
  });

  // Client matcher engine
  const findClientMatch = (email: Email | null): Client | undefined => {
    if (!email) return undefined;
    const testEmail = (email.fromEmail || email.toEmail || "").toLowerCase();
    const testName = (email.from || email.to || "").toLowerCase();
    
    // First match by exact email fields
    const directMatch = clients.find(c => 
      c.email.toLowerCase() === testEmail || 
      c.coEmail?.toLowerCase() === testEmail
    );
    if (directMatch) return directMatch;

    // Fallback match on client match label
    if (email.clientMatch) {
      const labelMatch = clients.find(c => 
        c.last.toLowerCase().includes(email.clientMatch!.toLowerCase()) ||
        c.first.toLowerCase().includes(email.clientMatch!.toLowerCase())
      );
      if (labelMatch) return labelMatch;
    }

    // Match on content containing first/last names
    const wordMatch = clients.find(c => 
      testName.includes(c.first.toLowerCase()) || 
      testName.includes(c.last.toLowerCase())
    );
    return wordMatch;
  };

  const activeMatchedClient = findClientMatch(selectedEmail);

  // ── CRM SHORTCUT DIRECT CALLS ──

  // LOG TO CLIENT notes
  const handleLogToClientFile = () => {
    if (!selectedEmail) return;
    const matched = findClientMatch(selectedEmail);
    if (!matched) {
      showToast("Cannot Log: No corresponding CRM Client matched to this sender address.", "error");
      return;
    }

    setConfirmModal({
      title: "Log to Client Dossier",
      message: `Log this email chain safely into ${matched.first} ${matched.last}'s Client Dossier Audit Notes?`,
      confirmText: "Log to Dossier",
      confirmVariant: "primary",
      onConfirm: () => {
        const timestamp = new Date().toLocaleString("en-CA");
        const formattedEmailLog = `\n\n------- COMM LINK RECORDED (${timestamp}) -------\nDirection: INBOUND EMAIL\nFrom: ${selectedEmail.from} <${selectedEmail.fromEmail}>\nSubject: ${selectedEmail.subject}\nBody Summary:\n${selectedEmail.body || selectedEmail.preview}\n--------------------------------------------`;

        if (setClients) {
          setClients(prev => prev.map(c => {
            if (c.id === matched.id) {
              const currentSummary = c.aiSummary || "";
              return {
                ...c,
                aiSummary: currentSummary ? `${currentSummary}${formattedEmailLog}` : `Email Link Logged:${formattedEmailLog}`,
                updatedAt: new Date().toISOString()
              };
            }
            return c;
          }));
          showToast(`Recorded communication log into ${matched.first} ${matched.last}'s file dossier!`, "success", "📋");
          if (logActivity) logActivity(`Logged email correspondence to ${matched.first} ${matched.last}`, selectedEmail.subject);
        }
      }
    });
  };

  // OPEN CLIENT CARD OVERLAY
  const handleOpenClientCard = () => {
    if (!selectedEmail) return;
    const matched = findClientMatch(selectedEmail);
    if (!matched) {
      showToast("No matched client to open.", "error");
      return;
    }
    if (onOpenClient) {
      onOpenClient(matched.id);
      showToast(`Showing CRM details for ${matched.first} ${matched.last}...`, "success");
    }
  };

  // TRIGGER CREATE TASK Popover
  const handleOpenTaskWizard = () => {
    if (!selectedEmail) return;
    setTaskWizardTitle(`Follow up on: ${selectedEmail.subject}`);
    setTaskWizardNotes(`Transposed from Email received from ${selectedEmail.from} (${selectedEmail.fromEmail}):\n\n"${selectedEmail.preview || selectedEmail.body?.substring(0, 300)}"`);
    setIsTaskWizardOpen(true);
  };

  const handleSaveTaskFromWizard = (e: React.FormEvent) => {
    e.preventDefault();
    if (!taskWizardTitle) return;

    const matched = findClientMatch(selectedEmail);
    const newTask: Task = {
      id: "ct_" + Date.now(),
      title: taskWizardTitle,
      status: "open",
      priority: taskWizardPriority,
      dueDate: taskWizardDueDate,
      clientId: matched?.id,
      clientName: matched ? `${matched.first} ${matched.last}` : undefined,
      assignedTo: taskWizardAssignee,
      notes: taskWizardNotes,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      createdBy: currentUser.first + " " + currentUser.last
    };

    if (setTasks) {
      setTasks(prev => [newTask, ...prev]);
    }

    setIsTaskWizardOpen(false);
    showToast(`Task assigned to ${taskWizardAssignee} from email!`, "success", "✓");
    
    if (logActivity) {
      logActivity(
        `Created follow-up task "${taskWizardTitle}" from inbox item`,
        matched ? `${matched.first} ${matched.last}` : "Unlinked email"
      );
    }
  };

  // TRIGGER EVENT MEETING POPUP
  const handleOpenEventWizard = () => {
    if (!selectedEmail) return;
    setEventWizardTitle(`Meeting with ${selectedEmail.from}`);
    setEventWizardNotes(`Inbound Callback request stemming from:\n"${selectedEmail.subject}"`);
    setIsEventWizardOpen(true);
  };

  const handleSaveEventFromWizard = (e: React.FormEvent) => {
    e.preventDefault();
    if (!eventWizardTitle) return;

    const matched = findClientMatch(selectedEmail);
    const newEvent: Event = {
      id: "ce_" + Date.now(),
      title: eventWizardTitle,
      date: eventWizardDate,
      time: eventWizardTime,
      type: eventWizardType,
      clientId: matched?.id || null,
      notes: eventWizardNotes,
      createdBy: currentUser.first + " " + currentUser.last
    };

    if (setEvents) {
      setEvents(prev => [newEvent, ...prev]);
    }

    setIsEventWizardOpen(false);
    showToast("Event successfully plotted on Calendar!", "success", "📅");

    if (logActivity) {
      logActivity(
        `Scheduled calendar deadline "${eventWizardTitle}" from email`,
        matched ? `${matched.first} ${matched.last}` : "Unlinked email"
      );
    }
  };

  // FILE VERIFICATION AUTO UPLOAD
  const handleSaveAttachmentToVault = (fileName: string, matchedClientId: string, docIndexId: string) => {
    if (!setDocVault || !docVault) {
      showToast("Integration Error: Document vault state missing.", "error");
      return;
    }

    const clientObj = clients.find(c => c.id === matchedClientId);
    const targetClientName = clientObj ? `${clientObj.first} ${clientObj.last}` : "Client File";

    const confirmed = window.confirm(`Import physical attachment file "${fileName}" directly into ${targetClientName}'s CRM folder?`);
    if (!confirmed) return;

    const clientDocs = docVault[matchedClientId] || {};
    const updatedDocs = {
      ...clientDocs,
      [docIndexId]: {
        status: "received",
        path: `gbk-secured-vault://${matchedClientId}/${docIndexId}/${fileName}`,
        notes: `Extracted automatically from Workspace Inbox Attachment`,
        receivedAt: new Date().toISOString()
      }
    };

    setDocVault(prev => ({
      ...prev,
      [matchedClientId]: updatedDocs
    }));

    showToast(`Approved & mapped "${fileName}" inside CRM checklist folder!`, "success", "★");

    if (logActivity) {
      logActivity(`Verified attachment upload: ${fileName} mapped on system checklist`, targetClientName);
    }
  };

  // ── COMPOSE INTERACTION HANDLERS ──

  // Open rich template insert or blank compose
  const handleComposeWithTemplate = (templateId?: string) => {
    setIsComposeOpen(true);
    if (!templateId) {
      setComposeTo("");
      setComposeToEmail("");
      setComposeSubject("");
      setComposeBody("");
      setSelectedClientLink("");
      setIsScheduled(false);
      return;
    }

    const selectedTemplate = MORTGAGE_PREPARED_TEMPLATES.find(t => t.id === templateId) || 
                             templates.find(t => t.id === templateId) || 
                             MORTGAGE_PREPARED_TEMPLATES.find(t => t.id === "m-welcome");

    if (selectedTemplate) {
      let clientObj: Client | undefined;
      if (selectedClientLink) {
        clientObj = clients.find(c => c.id === selectedClientLink);
      } else {
        // Grab first borrower for quick autofill preview
        clientObj = clients[0];
        if (clientObj) setSelectedClientLink(clientObj.id);
      }

      setComposeSubject(selectedTemplate.subject);
      setComposeTo(clientObj ? `${clientObj.first} ${clientObj.last}` : "");
      setComposeToEmail(clientObj ? clientObj.email : "");

      // Compile dynamic template variables
      const formattedBody = applyTemplate(selectedTemplate.body, clientObj, signatureText);
      setComposeBody(formattedBody);
    }
  };

  // Update body in real time when client dropdown fluctuates inside compose modal
  useEffect(() => {
    if (isComposeOpen && selectedClientLink) {
      const activeC = clients.find(cl => cl.id === selectedClientLink);
      if (activeC) {
        setComposeTo(`${activeC.first} ${activeC.last}`);
        setComposeToEmail(activeC.email);
        
        // If subject matches a template, update body
        const isTemplated = MORTGAGE_PREPARED_TEMPLATES.some(t => t.subject === composeSubject) || 
                            templates.some(t => t.subject === composeSubject || composeBody.includes("CRA portal") || composeBody.includes("Notice of Assessment"));
        if (isTemplated) {
          // Re-trigger template fill if possible
          const matchedTemp = MORTGAGE_PREPARED_TEMPLATES.find(t => t.subject === composeSubject) || 
                              templates.find(t => t.subject === composeSubject) || 
                              MORTGAGE_PREPARED_TEMPLATES[0];
          if (matchedTemp) {
            setComposeBody(applyTemplate(matchedTemp.body, activeC, signatureText));
          }
        }
      }
    }
  }, [selectedClientLink, composeSubject]);

  const handleRetrySend = async (email: Email) => {
    const host = smtpHost;
    const port = smtpPort;
    const username = smtpUsername;
    const password = smtpPassword;

    if (!host || !port || !username || !password) {
      showToast("Cannot send: Gmail SMTP settings are incomplete. Please configure host, port, username, and app password.", "error");
      return;
    }

    showToast("Retrying email dispatch via SMTP...", "info");
    const success = await sendEmail({
      to: email.toEmail || "",
      subject: email.subject || "",
      body: email.body || "",
      fromName: `${currentUser?.first || "David"} ${currentUser?.last || "Acosta"}`,
      fromEmail: smtpUsername || loginEmail,
      host,
      port,
      username,
      password
    });

    if (success) {
      setEmailsState(prev => ({
        ...prev,
        queued: (prev.queued || []).filter(item => item.id !== email.id),
        sent: [
          { 
            ...email, 
            id: "mail_" + Date.now(), 
            time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }), 
            date: "Today" 
          }, 
          ...prev.sent
        ]
      }));

      showToast("Email dispatched successfully on SMTP retry!", "success");
      setSelectedEmail(null);
      if (logActivity) logActivity(`Dispatched queued email via SMTP retry`, email.subject);
    } else {
      showToast("Retry failed. Check SMTP settings or connection status.", "error");
    }
  };

  // SAVE DRAFT FUNCTION
  const handleSaveDraft = () => {
    if (!composeSubject && !composeBody && !composeToEmail) {
      showToast("Nothing to save in draft.", "error");
      return;
    }
    const draftItem: Email = {
      id: "dr_" + Date.now(),
      from: `${currentUser?.first || "David"} ${currentUser?.last || "Acosta"}`,
      fromEmail: loginEmail,
      to: composeTo || composeToEmail || "Unspecified recipient",
      toEmail: composeToEmail,
      subject: composeSubject || "(Draft)",
      body: composeBody,
      preview: composeBody ? composeBody.substring(0, 100) + "..." : "Draft message...",
      time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      date: "Today",
      unread: false,
      clientId: selectedClientLink
    };

    setDraftsList(prev => [draftItem, ...prev]);
    setIsComposeOpen(false);
    showToast("Saved message as Draft", "success", "📝");
    if (logActivity) logActivity("Saved email draft", draftItem.subject);
  };

  const handleAttachmentChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      const filesArray = Array.from(e.target.files).map((file: File) => ({
        name: file.name,
        size: (file.size / 1024).toFixed(1) + " KB"
      }));
      setComposeAttachments(prev => [...prev, ...filesArray]);
      showToast(`Attached ${filesArray.length} file(s)`, "success", "📎");
    }
  };

  const handleRemoveAttachment = (index: number) => {
    setComposeAttachments(prev => prev.filter((_, i) => i !== index));
  };

  // EXECUTE DISPATCH EMAIL
  const handleSendComposeCommit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!composeToEmail || !composeSubject || !composeBody) {
      showToast("Please fill in Recipient, Subject, and Content body block.", "error");
      return;
    }

    const host = smtpHost;
    const port = smtpPort;
    const username = smtpUsername;
    const password = smtpPassword;

    if (!host || !port || !username || !password) {
      showToast("Cannot send: Gmail SMTP settings are incomplete. Please configure host, port, username, and app password.", "error");
      return;
    }

    const newEmailId = "mail_" + Date.now();
    const newMailRecord: Email = {
      id: newEmailId,
      from: `${currentUser?.first || "David"} ${currentUser?.last || "Acosta"}`,
      fromEmail: smtpUsername || loginEmail,
      to: composeTo || composeToEmail,
      toEmail: composeToEmail,
      subject: composeSubject,
      body: composeBody,
      preview: composeBody.substring(0, 100) + "...",
      time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      date: "Today",
      unread: false,
      clientId: selectedClientLink
    };

    if (isScheduled) {
      if (!scheduleSendTime) {
        showToast("Please select a targeted datetime queue.", "error");
        return;
      }
      newMailRecord.scheduledFor = scheduleSendTime;
      
      // Save to scheduled registry
      setEmailsState(prev => ({
        ...prev,
        scheduled: [newMailRecord, ...prev.scheduled]
      }));

      showToast(`Campaign queue created! Sending at ${scheduleSendTime.replace("T", " ")}`, "success", "⏰");
      if (logActivity) logActivity(`Scheduled automated outreach email queue`, composeSubject);
      setIsComposeOpen(false);
    } else {
      showToast("Sending email via secure SMTP...", "info");
      const success = await sendEmail({
        to: composeToEmail,
        subject: composeSubject,
        body: composeBody,
        fromName: `${currentUser?.first || "David"} ${currentUser?.last || "Acosta"}`,
        fromEmail: smtpUsername || loginEmail,
        host,
        port,
        username,
        password
      });

      if (success) {
        setEmailsState(prev => ({
          ...prev,
          sent: [newMailRecord, ...prev.sent]
        }));

        // AUTO-LOG OPT-IN Option: Automatically add email contents to Client Dossier Note immediately on outbound
        if (selectedClientLink && setClients) {
          setClients(prev => prev.map(c => {
            if (c.id === selectedClientLink) {
              const currentSummary = c.aiSummary || "";
              const formattedLog = `\n\n------- COMM LINK RECORDED (${new Date().toLocaleString("en-CA")}) -------\nDirection: OUTBOUND EMAIL\nSent By: ${currentUser?.first || "David"} ${currentUser?.last || "Acosta"} via ${smtpUsername || loginEmail}\nTo: ${newMailRecord.to} <${newMailRecord.toEmail}>\nSubject: ${newMailRecord.subject}\nBody Segment:\n${newMailRecord.body}\n--------------------------------------------`;
              return {
                ...c,
                aiSummary: `${currentSummary}${formattedLog}`,
                updatedAt: new Date().toISOString()
              };
            }
            return c;
          }));
          showToast(`Dispatched! Message logged to ${composeTo}'s CRM Dossier file!`, "success", "🚀");
        } else {
          showToast("Email dispatched successfully!", "success", "🚀");
        }

        if (logActivity) logActivity(`Dispatched outbound email template`, composeSubject);
        setIsComposeOpen(false);
      } else {
        showToast("Failed to send email via SMTP. Check SMTP configurations or connection.", "error");
      }
    }
  };

  // DELETE OR ARCHIVE EMAIL
  const handleArchiveEmail = (e: React.MouseEvent, email: Email) => {
    e.stopPropagation();
    if (!email) return;

    setConfirmModal({
      title: "Archive Communication",
      message: `Safely archive "${email.subject || '(no subject)'}" into secure storage?`,
      confirmText: "Archive Email",
      confirmVariant: "primary",
      onConfirm: () => {
        setEmailsState(prev => {
          const key = activeFolder as keyof typeof prev;
          if (key && prev[key]) {
            return {
              ...prev,
              [key]: prev[key].filter(item => item.id !== email.id)
            };
          }
          return prev;
        });

        setArchivedList(prev => [email, ...prev]);
        if (selectedEmail?.id === email.id) {
          setSelectedEmail(null);
        }
        showToast("Message archived securely.", "success");
      }
    });
  };

  const applyTemplate = (templateBody: string, client?: Client, signature?: string) => {
    let body = templateBody;
    if (client) {
      body = body.replace(/\{\{first\}\}/g, client.first || "");
      body = body.replace(/\{\{lender\}\}/g, client.lender || "TD Canada Trust");
      body = body.replace(/\{\{amount\}\}/g, client.mtgamt ? `$${Number(client.mtgamt).toLocaleString("en-CA")}` : "$550,000");
      const rateVal = client.appData?.rate || "4.79";
      body = body.replace(/\{\{rate\}\}/g, rateVal);
    } else {
      body = body.replace(/\{\{first\}\}/g, "Client");
      body = body.replace(/\{\{lender\}\}/g, "[Lender Name]");
      body = body.replace(/\{\{amount\}\}/g, "[Mortgage Amount]");
      body = body.replace(/\{\{rate\}\}/g, "[Rate]");
    }
    body = body.replace(/\{\{signature\}\}/g, signature || `${currentUser.first} ${currentUser.last}\nGBK Financial Brokerage`);
    return body;
  };

  return (
    <div className="flex flex-col h-full bg-[var(--color-bg)] text-[var(--color-text)]">
      
      {/* ── GMAIL SMTP CONNECTION HEADER ── */}
      <div className="p-3.5 bg-[var(--color-surface)] border border-[var(--color-border)] rounded-xl mb-4 shrink-0 shadow-md">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-red-600/10 border border-red-500/20 flex items-center justify-center shrink-0">
              <Mail className="w-5 h-5 text-red-500" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-xs font-bold tracking-tight text-[var(--color-text)]">Email Center (Gmail)</h2>
                {isLoggedIn ? (
                  <span className="bg-emerald-500/15 text-emerald-400 border border-emerald-500/20 text-[9px] font-bold px-2 py-0.5 rounded-full flex items-center gap-1">
                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse"></span>
                    SMTP CONFIGURED
                  </span>
                ) : (
                  <span className="bg-amber-500/15 text-amber-400 border border-amber-500/20 text-[9px] font-bold px-2 py-0.5 rounded-full flex items-center gap-1">
                    SMTP NOT CONFIGURED
                  </span>
                )}
              </div>
              <p className="text-[10px] text-[var(--color-text-muted)] mt-0.5">
                {isLoggedIn 
                  ? `Connected: ${smtpUsername || loginEmail} (Using configured Gmail SMTP settings)` 
                  : "Preview mode. Configure Gmail SMTP to send real emails."}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2 shrink-0 w-full sm:w-auto justify-end">
            {isLoggedIn ? (
              <div className="flex items-center gap-2">
                <span className="text-xs font-mono text-[var(--color-text-muted)] bg-[var(--color-surface-2)] px-2.5 py-1 rounded-lg border border-[var(--color-border)] max-w-[220px] truncate">
                  {smtpUsername || loginEmail}
                </span>
                <button
                  type="button"
                  onClick={handleGoogleLogout}
                  className="px-2.5 py-1 text-xs font-medium text-red-400 hover:text-red-300 hover:bg-red-500/10 rounded-lg border border-red-500/20 transition-colors flex items-center gap-1.5 cursor-pointer"
                  title="Disconnect account"
                >
                  <LogOut className="w-3.5 h-3.5" />
                  Disconnect
                </button>
              </div>
            ) : (
              <button
                type="button"
                onClick={handleGoogleLogin}
                className="bg-red-600 hover:bg-red-700 text-white font-bold py-1.5 px-4 rounded-lg text-xs transition-all flex items-center gap-1.5 cursor-pointer shadow-sm"
              >
                <Lock className="w-3.5 h-3.5" />
                Save Gmail SMTP Settings
              </button>
            )}
          </div>
        </div>

        {/* Visible Gmail SMTP Configuration Fields */}
        <div className="mt-3 pt-3 border-t border-[var(--color-border)]">
          <div className="mb-2 flex items-center justify-between">
            <span className="text-[10px] font-bold uppercase tracking-wider text-[var(--color-text-muted)] flex items-center gap-1">
              <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" /> Gmail SMTP Configuration
            </span>
            <span className="text-[9px] text-[var(--color-text-faint)] font-mono">
              Use a 16-character Gmail App Password (myaccount.google.com/apppasswords)
            </span>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-2 text-xs">
            <div>
              <label className="text-[10px] text-[var(--color-text-muted)] font-medium mb-1 block">SMTP Host</label>
              <input
                placeholder="smtp.gmail.com"
                value={smtpHost}
                onChange={e => setSmtpHost(e.target.value)}
                className="w-full bg-[var(--color-surface-2)] border border-[var(--color-border)] rounded px-2.5 py-1.5 text-[var(--color-text)] focus:outline-none focus:border-red-500/50"
              />
            </div>
            <div>
              <label className="text-[10px] text-[var(--color-text-muted)] font-medium mb-1 block">Port</label>
              <input
                placeholder="587"
                value={smtpPort}
                onChange={e => setSmtpPort(e.target.value)}
                className="w-full bg-[var(--color-surface-2)] border border-[var(--color-border)] rounded px-2.5 py-1.5 text-[var(--color-text)] focus:outline-none focus:border-red-500/50"
              />
            </div>
            <div>
              <label className="text-[10px] text-[var(--color-text-muted)] font-medium mb-1 block">Gmail Address (Username)</label>
              <input
                placeholder="david.acosta@gbkfinancial.ca"
                value={smtpUsername}
                onChange={e => setSmtpUsername(e.target.value)}
                className="w-full bg-[var(--color-surface-2)] border border-[var(--color-border)] rounded px-2.5 py-1.5 text-[var(--color-text)] focus:outline-none focus:border-red-500/50"
              />
            </div>
            <div>
              <label className="text-[10px] text-[var(--color-text-muted)] font-medium mb-1 block">Gmail App Password / Token</label>
              <input
                type="password"
                placeholder="16-character App Password"
                value={smtpPassword}
                onChange={e => setSmtpPassword(e.target.value)}
                className="w-full bg-[var(--color-surface-2)] border border-[var(--color-border)] rounded px-2.5 py-1.5 text-[var(--color-text)] focus:outline-none focus:border-red-500/50"
              />
            </div>
          </div>
          <div className="flex justify-end mt-2.5">
            <button
              type="button"
              onClick={handleGoogleLogin}
              className="bg-red-600 hover:bg-red-700 text-white font-bold py-1.5 px-4 rounded-lg text-xs transition-all cursor-pointer shadow-sm flex items-center gap-1.5"
            >
              <CheckCircle2 className="w-3.5 h-3.5" />
              Save Gmail SMTP Settings
            </button>
          </div>
        </div>
      </div>

      {/* ── CENTRAL TWO-COLUMN CONTAINER ── */}
      <div className="flex-1 flex gap-4 min-h-0">
        
        {/* ── LEFT SIDEBAR (FOLDERS & ACTIONS) ── */}
        <div className="w-56 bg-[var(--color-surface)] border border-[var(--color-border)] rounded-xl flex flex-col p-3 overflow-y-auto gap-2 shrink-0 select-none shadow-lg">
          <button 
            onClick={() => handleComposeWithTemplate()}
            className="w-full bg-red-600 hover:bg-red-700 text-white font-bold text-xs py-2.5 rounded-lg transition-all mb-3 flex items-center justify-center gap-1.5 shadow-md shadow-red-950/20 cursor-pointer"
          >
            <Plus className="w-4 h-4" /> Compose Message
          </button>

          <span className="text-[9px] uppercase font-bold tracking-wider text-[var(--color-text-muted)] mb-1 px-1">Directory Folders</span>
          {[
            { id: "inbox", label: "Inbox", count: emailsState.inbox.filter(e => e.unread).length, icon: Mail },
            { id: "starred", label: "Starred", count: getMailboxEmails().filter(e => e.starred).length, icon: Star },
            { id: "scheduled", label: "Snoozed & Scheduled", count: emailsState.scheduled.length, icon: Clock },
            { id: "sent", label: "Sent", count: emailsState.sent.length, icon: Send },
            { id: "drafts", label: "Drafts", count: draftsList.length, icon: FileText },
            { id: "archived", label: "Archive", count: archivedList.length, icon: Archive },
            { id: "trash", label: "Trash", count: trashList.length, icon: Trash2 }
          ].map(f => {
            const Icon = f.icon;
            const isActive = activeFolder === f.id;
            return (
              <button
                key={f.id}
                onClick={() => { setActiveFolder(f.id); setSelectedEmail(null); }}
                className={`w-full text-left px-3 py-2 rounded-lg text-xs font-semibold flex items-center justify-between transition-all cursor-pointer border ${isActive ? "bg-red-600/10 text-red-400 border-red-500/10 font-bold" : "text-[var(--color-text-muted)] hover:bg-[var(--color-surface-2)] border-transparent"}`}
              >
                <div className="flex items-center gap-2">
                  <Icon className="w-3.5 h-3.5" />
                  <span>{f.label}</span>
                </div>
                {f.count > 0 && (
                  <span className="text-[9px] font-bold px-1.5 py-0.5 rounded bg-red-600/20 text-red-300">
                    {f.count}
                  </span>
                )}
              </button>
            );
          })}



          {/* Pre-Automated Mortgage Email Templates Accelerator */}
          <div className="mt-4 border-t border-[var(--color-border)] pt-3">
            <span className="block text-[9px] uppercase font-bold tracking-wider text-[var(--color-text-muted)] mb-2 px-1 flex items-center gap-1 font-sans">
              ⚡ Pre-Automated Outlines
            </span>
            <div className="flex flex-col gap-1 max-h-48 overflow-y-auto pr-1">
              {MORTGAGE_PREPARED_TEMPLATES.map((mt) => (
                <button
                  key={mt.id}
                  onClick={() => handleComposeWithTemplate(mt.id)}
                  className="w-full text-left px-2 py-1.5 rounded bg-[var(--color-surface-2)]/20 hover:bg-red-600/10 border border-[var(--color-border)] hover:border-red-500/20 text-[10px] text-[var(--color-text-muted)] hover:text-red-300 transition-all flex flex-col gap-0.5 group cursor-pointer"
                  title={mt.desc}
                >
                  <span className="font-semibold truncate group-hover:text-red-400">{mt.name}</span>
                  <span className="text-[8px] text-[var(--color-text-faint)] truncate">{mt.desc}</span>
                </button>
              ))}
            </div>
          </div>

          {/* Email Signature Module */}
          <div className="mt-auto border-t border-[var(--color-border)] pt-3">
            <button 
              onClick={() => setShowSignatureEdit(!showSignatureEdit)}
              className="w-full text-left text-[10px] text-[var(--color-accent)] hover:underline flex items-center gap-1 cursor-pointer bg-transparent border-none"
            >
              <Sliders className="w-3 h-3" /> Customize Signature
            </button>
            {showSignatureEdit && (
              <div className="mt-2 flex flex-col gap-1.5">
                <textarea 
                  className="w-full bg-[var(--color-surface-2)] border border-[var(--color-border)] rounded p-1 text-[10px] font-mono text-[var(--color-text)] h-24 focus:outline-none"
                  value={signatureText}
                  onChange={(e) => setSignatureText(e.target.value)}
                />
                <button 
                  onClick={handleSaveSignature}
                  className="w-full bg-[var(--color-surface-2)] border border-[var(--color-border)] hover:border-[var(--color-accent)]/30 text-[var(--color-text)] text-[9px] font-semibold py-1 rounded cursor-pointer"
                >
                  ✓ Update Signature
                </button>
              </div>
            )}
          </div>
        </div>

        {/* ── CENTRAL COLUMN (EMAIL DIRECTORY SEARCH & LIST) ── */}
        <div className="w-72 bg-[var(--color-surface)] border border-[var(--color-border)] rounded-xl flex flex-col min-h-0 shrink-0 overflow-hidden shadow-lg">
          <div className="p-3 border-b border-[var(--color-border)] flex flex-col gap-2 bg-[var(--color-surface-2)]/20 select-none">
            <div className="flex justify-between items-center">
              <h3 className="text-xs font-bold uppercase tracking-wider text-[var(--color-text)] capitalize">{activeFolder} Folder</h3>
              <div className="flex items-center gap-2">
                <span className="text-[10px] text-[var(--color-text-muted)] font-mono font-bold">Qty: {filteredEmails.length}</span>
                {filteredEmails.length > 0 && (
                  <button
                    onClick={handleClearCurrentFolder}
                    className="text-[9px] text-red-500 hover:text-red-700 hover:underline cursor-pointer font-bold uppercase"
                    title="Permanently delete all emails in this folder"
                  >
                    Clear All
                  </button>
                )}
              </div>
            </div>
            <input 
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search correspondence..." 
              className="bg-[var(--color-surface-2)] border border-[var(--color-border)] rounded-lg px-3 py-1.5 text-xs text-[var(--color-text)] focus:outline-none focus:border-red-600 w-full font-sans shadow-inner placeholder-[var(--color-text-faint)]"
            />
          </div>

          <div className="flex-1 overflow-y-auto">
            {filteredEmails.length > 0 ? filteredEmails.map((e) => {
              const matchedC = findClientMatch(e);
              const initials = (e.from || e.to || "?").split(" ").map(w => w[0]).join("").toUpperCase().substring(0, 2);
              const isSelected = selectedEmail?.id === e.id;
              
              return (
                <div 
                  key={e.id}
                  onClick={() => {
                    setSelectedEmail(e);
                    // Mock mark unread read
                    if (e.unread) {
                      e.unread = false;
                    }
                  }}
                  className={`flex flex-col p-3.5 border-b border-[var(--color-border)] cursor-pointer hover:bg-[var(--color-surface-2)] transition-all select-none ${isSelected ? "bg-[var(--color-surface-3)] border-l-2 border-l-red-500" : ""} ${e.unread ? "bg-red-500/5" : ""}`}
                >
                  <div className="flex justify-between items-center mb-1 gap-2">
                    <span className={`text-xs truncate max-w-[140px] ${e.unread ? "font-bold text-[var(--color-text)]" : "text-[var(--color-text-muted)]"}`}>
                      {activeFolder === "sent" ? `To: ${e.to}` : e.from}
                    </span>
                    <div className="flex items-center gap-1.5 shrink-0">
                      <span className="text-[9px] text-[var(--color-text-faint)] font-mono">{e.time}</span>
                      <button
                        onClick={(event) => toggleStarEmail(event, e)}
                        className={`p-0.5 rounded transition-colors cursor-pointer ${e.starred ? "text-amber-400 hover:text-amber-300" : "text-[var(--color-text-faint)] hover:text-amber-400"}`}
                        title={e.starred ? "Unstar message" : "Star message"}
                      >
                        <Star className={`w-3 h-3 ${e.starred ? "fill-amber-400" : ""}`} />
                      </button>
                      {activeFolder === "trash" && (
                        <button
                          onClick={(event) => { event.stopPropagation(); handleRestoreFromTrash(e); }}
                          className="text-[var(--color-text-faint)] hover:text-emerald-400 p-0.5 rounded hover:bg-emerald-500/10 transition-colors cursor-pointer"
                          title="Restore email to Inbox"
                        >
                          <Inbox className="w-3 h-3" />
                        </button>
                      )}
                      <button
                        onClick={(event) => handleDeleteEmail(event, e)}
                        className="text-[var(--color-text-faint)] hover:text-red-500 transition-colors p-0.5 rounded hover:bg-red-500/10 cursor-pointer"
                        title={activeFolder === "trash" ? "Permanently delete email" : "Move to Trash"}
                      >
                        <Trash2 className="w-3 h-3" />
                      </button>
                    </div>
                  </div>
                  
                  <div className={`text-xs truncate ${e.unread ? "font-semibold text-[var(--color-text)]" : "text-[var(--color-text-muted)]"}`}>
                    {e.subject || "(no subject)"}
                  </div>
                  
                  <div className="text-[10px] text-[var(--color-text-muted)] truncate mt-1">
                    {e.preview || e.body || ""}
                  </div>

                  {/* AUTO MATCHED BADGE ELEMENT */}
                  {matchedC && (
                    <div className="mt-2 flex items-center justify-between text-[8px] bg-red-950/20 text-red-300 border border-red-900/45 px-1.5 py-0.5 rounded w-max select-none">
                      <span className="font-semibold flex items-center gap-1">
                        <User className="w-2.5 h-2.5" /> Link Mapped: {matchedC.first} {matchedC.last}
                      </span>
                    </div>
                  )}
                  
                  {e.scheduledFor && (
                    <div className="mt-2 flex items-center gap-1 text-[8px] text-[var(--color-accent)] font-mono select-none">
                      <Clock className="w-2.5 h-2.5" /> Queue: {e.scheduledFor.replace("T", " ")}
                    </div>
                  )}
                </div>
              );
            }) : (
              <div className="h-64 flex flex-col items-center justify-center text-xs text-[var(--color-text-faint)] gap-3">
                <MailOpen className="w-8 h-8 opacity-40 shrink-0" />
                <span>No emails match filters.</span>
              </div>
            )}
          </div>
        </div>

        {/* ── RIGHT COLUMN (DETAILED CONTENT & CRM ACTIONS ACTION-SHORTCUTS) ── */}
        <div className="flex-1 bg-[var(--color-surface)] border border-[var(--color-border)] rounded-xl flex flex-col min-h-0 overflow-y-auto shadow-lg relative">
          
          {selectedEmail ? (
            <div className="flex-grow flex flex-col min-h-0">
              
              {/* DETAIL ACTIONS HEADER PANEL */}
              <div className="p-3 border-b border-[var(--color-border)] bg-[var(--color-surface-2)]/35 sticky top-0 bg-[var(--color-surface)] z-10 flex flex-wrap items-center justify-between gap-2.5 select-none shrink-0">
                <div className="flex items-center gap-2">
                  <button 
                    onClick={() => setSelectedEmail(null)}
                    className="px-2 py-1 rounded bg-[var(--color-surface-2)] border border-[var(--color-border)] text-[10px] font-bold text-[var(--color-text-muted)] hover:text-[var(--color-text)] flex items-center gap-1 cursor-pointer"
                  >
                    <ArrowLeft className="w-3 h-3" /> List
                  </button>
                  <span className="text-[10px] font-mono text-[var(--color-accent)] tracking-wider select-none bg-[var(--color-accent)]/5 border border-[var(--color-accent)]/10 px-1.5 py-0.5 rounded font-bold">
                    ID: {selectedEmail.id}
                  </span>
                </div>

                <div className="flex items-center gap-1.5">
                  {activeFolder === "queued" ? (
                    <button 
                      onClick={() => handleRetrySend(selectedEmail)}
                      className="px-2.5 py-1.5 bg-emerald-600 hover:bg-emerald-700 border border-emerald-500/20 rounded text-[10px] font-bold text-white flex items-center gap-1 cursor-pointer"
                    >
                      <RefreshCw className="w-3 h-3" /> Retry Send
                    </button>
                  ) : (
                    <>
                      <button 
                        onClick={() => selectedEmail && openReplyCompose(selectedEmail)}
                        className="px-2 py-1 bg-red-600/10 hover:bg-red-600/20 border border-red-500/20 rounded text-[10px] font-bold text-red-400 flex items-center gap-1 cursor-pointer"
                      >
                        <Reply className="w-3 h-3" /> Reply
                      </button>
                      <button 
                        onClick={(e) => handleArchiveEmail(e, selectedEmail)}
                        className="px-2 py-1 bg-[var(--color-surface-3)] hover:bg-[var(--color-surface-3)]/80 border border-[var(--color-border)] rounded text-[10px] font-bold text-[var(--color-text-muted)] hover:text-[var(--color-text)] flex items-center gap-1 cursor-pointer"
                        title="Archive communication log"
                      >
                        <Archive className="w-3 h-3" /> Archive
                      </button>
                      <button 
                        onClick={(e) => selectedEmail && handleDeleteEmail(e, selectedEmail)}
                        className="px-2 py-1 bg-red-600/10 hover:bg-red-600/20 border border-red-500/20 rounded text-[10px] font-bold text-red-400 flex items-center gap-1 cursor-pointer"
                        title="Permanently delete email"
                      >
                        <Trash2 className="w-3 h-3 text-red-400" /> Delete
                      </button>
                      <button
                        onClick={() => {
                          if (!selectedEmail) return;
                          setEmailsState(prev => {
                            const key = activeFolder as keyof typeof prev;
                            if (!key || !prev[key]) return prev;
                            return {
                              ...prev,
                              [key]: prev[key].map(item =>
                                item.id === selectedEmail.id ? { ...item, unread: true } : item
                              )
                            };
                          });
                          setSelectedEmail({ ...selectedEmail, unread: true });
                        }}
                        className="px-2 py-1 bg-[var(--color-surface-2)] hover:bg-[var(--color-surface-3)] border border-[var(--color-border)] rounded text-[10px] font-bold text-[var(--color-text-muted)] hover:text-[var(--color-text)] flex items-center gap-1 cursor-pointer"
                      >
                        <MailOpen className="w-3 h-3" /> Mark unread
                      </button>
                    </>
                  )}
                </div>
              </div>

              {/* CRM WORKFLOW ACTION SIDEBAR SHORTCUTS */}
              <div className="bg-red-500/5 border-b border-red-500/10 p-3 select-none">
                <span className="block text-[8px] tracking-wider uppercase font-bold text-red-400 mb-2">
                  🛡 COMM DESK INTEGRATION SHORTCUTS (ACTIVE OPERATIONAL WORKFLOW)
                </span>
                
                <div className="flex flex-wrap gap-2">
                  {/* Action 1: Log message to dossier */}
                  <button 
                    onClick={handleLogToClientFile}
                    className="bg-[var(--color-surface-2)] hover:bg-[var(--color-surface-3)] text-[var(--color-text)] border border-[var(--color-border)] px-2.5 py-1.5 rounded text-[10px] font-semibold flex items-center gap-1.5 shadow-md shadow-black/30 transition-all cursor-pointer"
                  >
                    <FileText className="w-3.5 h-3.5 text-blue-400" /> Log to Dossier
                  </button>

                  {/* Action 2: Open client in full screen */}
                  {activeMatchedClient ? (
                    <button 
                      onClick={handleOpenClientCard}
                      className="bg-[var(--color-surface-2)] hover:bg-[var(--color-surface-3)] text-[var(--color-text)] border border-[var(--color-border)] px-2.5 py-1.5 rounded text-[10px] font-semibold flex items-center gap-1.5 shadow-md shadow-black/30 transition-all cursor-pointer"
                    >
                      <User className="w-3.5 h-3.5 text-emerald-400" /> Open File Folder ({activeMatchedClient.last})
                    </button>
                  ) : null}

                  {/* Action 3: Create Task */}
                  <button 
                    onClick={handleOpenTaskWizard}
                    className="bg-[var(--color-surface-2)] hover:bg-[var(--color-surface-3)] text-[var(--color-text)] border border-[var(--color-border)] px-2.5 py-1.5 rounded text-[10px] font-semibold flex items-center gap-1.5 shadow-md shadow-black/30 transition-all cursor-pointer"
                  >
                    <CheckSquare className="w-3.5 h-3.5 text-[var(--color-accent)]" /> Create CRM Task
                  </button>

                  {/* Action 4: Create Event */}
                  <button 
                    onClick={handleOpenEventWizard}
                    className="bg-[var(--color-surface-2)] hover:bg-[var(--color-surface-3)] text-[var(--color-text)] border border-[var(--color-border)] px-2.5 py-1.5 rounded text-[10px] font-semibold flex items-center gap-1.5 shadow-md shadow-black/30 transition-all cursor-pointer"
                  >
                    <Calendar className="w-3.5 h-3.5 text-purple-400" /> Calendar Meeting
                  </button>

                  {/* Action 5: Mock Quick SMS out */}
                  {activeMatchedClient?.cell && (
                    <button 
                      onClick={() => {
                        const smsMsg = window.prompt(`Type follow-up SMS message to send directly to matched mobile ${activeMatchedClient.cell}:`, `Hi ${activeMatchedClient.first}, got your email! Appulating underwriter conditions check sheet now. - David`);
                        if (smsMsg) {
                          showToast(`Direct SMS outreach sent to ${activeMatchedClient.first}!`, "success", "💬");
                          if (logActivity) logActivity(`Dispatched out SMS ping to borrower`, activeMatchedClient.first);
                        }
                      }}
                      className="bg-[var(--color-surface-2)] hover:bg-[var(--color-surface-3)] text-[var(--color-text)] border border-[var(--color-border)] px-2.5 py-1.5 rounded text-[10px] font-semibold flex items-center gap-1.5 shadow-md shadow-black/30 transition-all hover:border-red-500/25 cursor-pointer"
                    >
                      <MessageSquare className="w-3.5 h-3.5 text-teal-400" /> Mobile SMS
                    </button>
                  )}
                </div>
              </div>

              {/* EMAIL BODY CONTENT AREA */}
              <div className="p-6 flex-grow overflow-auto">
                <h2 className="text-base font-bold text-[var(--color-text)] mb-2 leading-tight">
                  {selectedEmail.subject || "(no subject)"}
                </h2>
                
                <div className="flex items-center justify-between border-b border-[var(--color-border)] pb-4 mb-4 select-none">
                  <div className="flex items-center gap-2.5">
                    <div className="w-9 h-9 rounded-full bg-red-500/10 border border-red-500/25 flex items-center justify-center font-bold text-xs text-red-400">
                      {(selectedEmail.from || selectedEmail.to || "?")[0].toUpperCase()}
                    </div>
                    <div>
                      <h4 className="text-xs font-bold text-[var(--color-text)]">{selectedEmail.from || "Greg Brown"}</h4>
                      <p className="text-[10px] text-[var(--color-text-muted)]">{selectedEmail.fromEmail || loginEmail || "VDacosta247@gmail.com"}</p>
                    </div>
                  </div>
                  
                  <div className="text-[10px] text-[var(--color-text-muted)] font-mono text-right select-none">
                    <div>Time: {selectedEmail.time}</div>
                    <div className="mt-0.5">{selectedEmail.date}</div>
                  </div>
                </div>

                {/* Main Text Body */}
                <div className="text-xs text-[var(--color-text)] leading-relaxed whitespace-pre-wrap font-sans bg-[var(--color-surface-2)]/30 p-4 rounded-xl border border-[var(--color-border)]">
                  {selectedEmail.body || selectedEmail.preview || "No transcript content."}
                </div>

                {/* ── ATTACHMENTS VAULT SECTION ── */}
                {selectedEmail.clientMatch ? (
                  <div className="mt-6 border-t border-[var(--color-border)] pt-4 select-none">
                    <span className="block text-[10px] uppercase font-bold tracking-wider text-red-400 mb-3 flex items-center gap-1">
                      <Paperclip className="w-3.5 h-3.5" /> Extracted Secure Email Attachments ({selectedEmail.clientMatch === "Thompson" ? "2 Files" : "1 File"})
                    </span>

                    {/* MOCK SENDER SPECIFIC FILES EXTRAPOLATION */}
                    {selectedEmail.clientMatch === "Thompson" && (
                      <div className="flex flex-col gap-2">
                        {[
                          { id: "paystubs", label: "Borrower_Paystubs_3_Months.pdf", size: "1.4 MB", extCode: "paystubs" },
                          { id: "t4_current", label: "CRA_T4_NoticeOfAssessment_Sarah.pdf", size: "870 KB", extCode: "noa_current" }
                        ].map((doc) => {
                          const isAlreadyMapped = docVault[activeMatchedClient?.id || ""]?.[doc.extCode]?.status === "received";
                          return (
                            <div key={doc.id} className="p-3 bg-[var(--color-surface-2)] border border-[var(--color-border)] rounded-lg flex items-center justify-between gap-4">
                              <div className="flex items-center gap-2">
                                <FileText className="w-4 h-4 text-emerald-400 shrink-0" />
                                <div>
                                  <div className="text-xs font-semibold text-[var(--color-text)]">{doc.label}</div>
                                  <div className="text-[10px] text-[var(--color-text-muted)] mt-0.5 font-mono">Secured Vault Stream • {doc.size}</div>
                                </div>
                              </div>

                              <button 
                                onClick={() => handleSaveAttachmentToVault(doc.label, activeMatchedClient?.id || "c_smith", doc.extCode)}
                                className={`text-[9px] font-bold uppercase tracking-wider px-2.5 py-1 rounded border transition-all cursor-pointer ${isAlreadyMapped ? "bg-emerald-950/20 text-emerald-400 border-emerald-900" : "bg-[var(--color-accent)]/10 hover:bg-[var(--color-accent)]/20 border-[var(--color-accent)]/20 text-[var(--color-accent)]"}`}
                              >
                                {isAlreadyMapped ? "✓ Imported & Mapped in CRM" : "📁 Save to CRM Dossier"}
                              </button>
                            </div>
                          );
                        })}
                      </div>
                    )}

                    {selectedEmail.clientMatch === "Martinez" && (
                      <div className="p-3 bg-[var(--color-surface-2)] border border-[var(--color-border)] rounded-lg flex items-center justify-between gap-4">
                        <div className="flex items-center gap-2">
                          <FileText className="w-4 h-4 text-emerald-400 shrink-0" />
                          <div>
                            <div className="text-xs font-semibold text-[var(--color-text)]">Appraisal_Invoice_Payment_Receipt.pdf</div>
                            <div className="text-[10px] text-[var(--color-text-muted)] mt-0.5 font-mono">Receipt Archive • 345 KB</div>
                          </div>
                        </div>

                        <button 
                          onClick={() => handleSaveAttachmentToVault("Appraisal_Invoice_Payment_Receipt.pdf", activeMatchedClient?.id || "c_smith", "emp_letter")}
                          className="bg-[var(--color-accent)]/10 hover:bg-[var(--color-accent)]/20 border border-[var(--color-accent)]/20 text-[var(--color-accent)] text-[9px] font-bold uppercase tracking-wider px-2.5 py-1 rounded cursor-pointer"
                        >
                          📁 Save to CRM Dossier
                        </button>
                      </div>
                    )}
                  </div>
                ) : null}

              </div>
            </div>
          ) : (
            <div className="flex-1 flex flex-col items-center justify-center p-8 select-none text-white/30 text-center">
              <MailOpen className="w-12 h-12 opacity-30 mb-3 text-white" />
              <h3 className="text-sm font-semibold mb-1">No Message Selected</h3>
              <p className="text-[11px] max-w-sm leading-relaxed text-white/40">
                Pick a communication record thread from the sidebar list catalog to read headers, attachments, and trigger integrated workflow loggers.
              </p>
            </div>
          )}
        </div>
      </div>

      {/* ── COMPOSE EMAIL DIALOG MODAL OVERLAY (GMAIL PARITY) ── */}
      {isComposeOpen && (
        <div className="fixed inset-0 bg-[var(--glass-bg)] backdrop-blur-md z-50 flex items-center justify-center p-4 select-none">
          <div className="bg-[var(--color-surface)] border border-[var(--color-border)] rounded-2xl w-full max-w-xl p-5 shadow-2xl relative flex flex-col max-h-[92vh]">
            <button 
              onClick={() => setIsComposeOpen(false)} 
              className="absolute right-4 top-4 text-[var(--color-text-muted)] hover:text-[var(--color-text)] font-bold p-1 hover:bg-[var(--color-surface-2)] rounded text-xs cursor-pointer"
            >
              ✕
            </button>
            
            <h3 className="text-sm font-bold text-[var(--color-text)] uppercase tracking-wider mb-3 border-b border-[var(--color-border)] pb-2.5 flex items-center gap-1.5 shrink-0">
              <Send className="w-4 h-4 text-red-500" /> New Outbound Message
            </h3>

            <div className="mb-2 flex items-center justify-between gap-3 shrink-0">
              <span className="text-[10px] text-[var(--color-text-muted)] uppercase tracking-wider font-semibold">
                From Account
              </span>
              <span className="text-[10px] font-mono text-[var(--color-text)] bg-[var(--color-surface-2)] px-2.5 py-1 rounded-lg border border-[var(--color-border)]">
                {loginEmail}
              </span>
            </div>

            <form onSubmit={handleSendComposeCommit} className="flex-grow overflow-y-auto flex flex-col gap-3 pr-1">
              
              {/* Linked Borrower & Templates */}
              <div className="grid grid-cols-2 gap-2.5 shrink-0">
                <div>
                  <label className="block text-[9px] text-[var(--color-text-muted)] uppercase font-bold mb-1 tracking-wider">Link CRM Client (Optional)</label>
                  <select 
                    value={selectedClientLink}
                    onChange={(e) => setSelectedClientLink(e.target.value)}
                    className="w-full bg-[var(--color-surface-2)] border border-[var(--color-border)] rounded-lg px-2.5 py-1.5 text-xs text-[var(--color-text)] focus:outline-none"
                  >
                    <option value="">-- Do Not Link Client --</option>
                    {clients.map(cl => (
                      <option key={cl.id} value={cl.id}>{cl.first} {cl.last} ({cl.email})</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-[9px] text-[var(--color-text-muted)] uppercase font-bold mb-1 tracking-wider">Fast Response Template</label>
                  <select 
                    onChange={(e) => handleComposeWithTemplate(e.target.value)}
                    className="w-full bg-[var(--color-surface-2)] border border-[var(--color-accent)]/20 hover:border-[var(--color-accent)]/45 rounded-lg px-2.5 py-1.5 text-xs text-[var(--color-accent)] focus:outline-none focus:border-[var(--color-accent)] font-semibold"
                  >
                    <option value="">-- Choose Campaign Template --</option>
                    {templates.map(t => (
                      <option key={t.id} value={t.id}>{t.name}</option>
                    ))}
                  </select>
                </div>
              </div>

              {/* Recipient Coordinates & Cc/Bcc toggles */}
              <div className="flex flex-col gap-2 shrink-0 bg-[var(--color-surface-2)]/30 p-2.5 rounded-xl border border-[var(--color-border)]">
                <div className="flex items-center justify-between gap-2">
                  <div className="flex-1 grid grid-cols-2 gap-2">
                    <div>
                      <label className="block text-[9px] text-[var(--color-text-muted)] uppercase font-bold mb-0.5 tracking-wider">To Name</label>
                      <input 
                        type="text" 
                        value={composeTo}
                        onChange={(e) => setComposeTo(e.target.value)}
                        placeholder="E.g. David Martinez"
                        className="w-full bg-[var(--color-surface)] border border-[var(--color-border)] rounded-lg px-2.5 py-1 text-xs text-[var(--color-text)] focus:outline-none"
                      />
                    </div>
                    <div>
                      <label className="block text-[9px] text-[var(--color-text-muted)] uppercase font-bold mb-0.5 tracking-wider">To Email *</label>
                      <input 
                        type="email" 
                        value={composeToEmail}
                        onChange={(e) => setComposeToEmail(e.target.value)}
                        required
                        placeholder="E.g. borrower@example.com"
                        className="w-full bg-[var(--color-surface)] border border-[var(--color-border)] rounded-lg px-2.5 py-1 text-xs text-[var(--color-text)] focus:outline-none"
                      />
                    </div>
                  </div>

                  <div className="flex items-center gap-1 pt-3 shrink-0">
                    <button
                      type="button"
                      onClick={() => setShowCc(!showCc)}
                      className={`px-2 py-1 text-[10px] font-bold rounded transition-colors cursor-pointer border ${showCc ? "bg-red-600/10 text-red-400 border-red-500/20" : "text-[var(--color-text-muted)] hover:bg-[var(--color-surface)] border-transparent"}`}
                    >
                      Cc
                    </button>
                    <button
                      type="button"
                      onClick={() => setShowBcc(!showBcc)}
                      className={`px-2 py-1 text-[10px] font-bold rounded transition-colors cursor-pointer border ${showBcc ? "bg-red-600/10 text-red-400 border-red-500/20" : "text-[var(--color-text-muted)] hover:bg-[var(--color-surface)] border-transparent"}`}
                    >
                      Bcc
                    </button>
                  </div>
                </div>

                {/* Optional Cc input */}
                {showCc && (
                  <div className="animate-fade-in">
                    <label className="block text-[9px] text-[var(--color-text-muted)] uppercase font-bold mb-0.5 tracking-wider">Cc Email</label>
                    <input 
                      type="email" 
                      value={composeCc}
                      onChange={(e) => setComposeCc(e.target.value)}
                      placeholder="E.g. lawyer@realestatellp.com"
                      className="w-full bg-[var(--color-surface)] border border-[var(--color-border)] rounded-lg px-2.5 py-1 text-xs text-[var(--color-text)] focus:outline-none"
                    />
                  </div>
                )}

                {/* Optional Bcc input */}
                {showBcc && (
                  <div className="animate-fade-in">
                    <label className="block text-[9px] text-[var(--color-text-muted)] uppercase font-bold mb-0.5 tracking-wider">Bcc Email</label>
                    <input 
                      type="email" 
                      value={composeBcc}
                      onChange={(e) => setComposeBcc(e.target.value)}
                      placeholder="E.g. archive@example.com"
                      className="w-full bg-[var(--color-surface)] border border-[var(--color-border)] rounded-lg px-2.5 py-1 text-xs text-[var(--color-text)] focus:outline-none"
                    />
                  </div>
                )}
              </div>

              {/* Subject */}
              <div className="shrink-0">
                <input 
                  type="text" 
                  value={composeSubject}
                  onChange={(e) => setComposeSubject(e.target.value)}
                  required
                  placeholder="Subject title..."
                  className="w-full bg-[var(--color-surface-2)] border border-[var(--color-border)] rounded-lg px-3 py-1.5 text-xs font-semibold text-[var(--color-text)] focus:outline-none focus:border-red-500/50"
                />
              </div>

              {/* Body & Rich Actions Toolbar */}
              <div className="flex-grow flex flex-col min-h-0 relative border border-[var(--color-border)] rounded-xl overflow-hidden bg-[var(--color-surface-2)]/30">
                {/* Rich Toolbar */}
                <div className="flex items-center justify-between p-2 border-b border-[var(--color-border)] bg-[var(--color-surface-2)]/60 text-xs">
                  <div className="flex items-center gap-1 text-[var(--color-text-muted)]">
                    <label className="px-2 py-1 hover:bg-[var(--color-surface-3)] rounded hover:text-[var(--color-text)] cursor-pointer flex items-center gap-1 text-[10px] font-medium" title="Attach file">
                      <Paperclip className="w-3.5 h-3.5 text-red-400" /> Attach
                      <input type="file" multiple onChange={handleAttachmentChange} className="hidden" />
                    </label>
                    <button 
                      type="button" 
                      onClick={() => setComposeBody(prev => prev + `\n\n${signatureText}`)}
                      className="px-2 py-1 hover:bg-[var(--color-surface-3)] rounded hover:text-[var(--color-text)] cursor-pointer flex items-center gap-1 text-[10px] font-medium" 
                      title="Insert Signature"
                    >
                      <Sliders className="w-3.5 h-3.5 text-blue-400" /> Signature
                    </button>
                  </div>
                  <span className="text-[9px] text-[var(--color-text-faint)] font-mono">Gmail Rich Composer</span>
                </div>

                <textarea 
                  value={composeBody}
                  onChange={(e) => setComposeBody(e.target.value)}
                  required
                  rows={8}
                  placeholder="Write message here..."
                  className="w-full flex-grow bg-transparent p-3 text-xs text-[var(--color-text)] focus:outline-none font-sans leading-relaxed resize-none h-44"
                />

                {/* Attachments chips display */}
                {composeAttachments.length > 0 && (
                  <div className="p-2 border-t border-[var(--color-border)] bg-[var(--color-surface)] flex flex-wrap gap-1.5">
                    {composeAttachments.map((att, i) => (
                      <span key={i} className="inline-flex items-center gap-1 bg-[var(--color-surface-2)] border border-[var(--color-border)] text-[10px] text-[var(--color-text)] px-2 py-0.5 rounded-full font-mono">
                        <Paperclip className="w-3 h-3 text-emerald-400" />
                        {att.name} ({att.size})
                        <button type="button" onClick={() => handleRemoveAttachment(i)} className="text-red-400 hover:text-red-300 ml-1 font-bold cursor-pointer">✕</button>
                      </span>
                    ))}
                  </div>
                )}
              </div>

              {/* Campaign Schedule Toggle */}
              <div className="p-2.5 bg-[var(--color-surface-2)] border border-[var(--color-border)] rounded-xl shrink-0 flex items-center justify-between gap-3">
                <div className="flex items-center gap-2">
                  <input 
                    type="checkbox" 
                    id="scheduleToggle" 
                    checked={isScheduled} 
                    onChange={(e) => setIsScheduled(e.target.checked)}
                    className="rounded text-red-500 bg-[var(--color-surface)] border-[var(--color-border)]/15 cursor-pointer"
                  />
                  <label htmlFor="scheduleToggle" className="text-xs font-semibold text-[var(--color-text-muted)] cursor-pointer select-none flex items-center gap-1">
                    <Clock className="w-3.5 h-3.5 text-amber-400" /> Schedule Delivery
                  </label>
                </div>

                {isScheduled && (
                  <input 
                    type="datetime-local" 
                    value={scheduleSendTime}
                    onChange={(e) => setScheduleSendTime(e.target.value)}
                    className="bg-[var(--color-surface)] border border-[var(--color-border)] rounded px-2 py-1 text-[10px] text-[var(--color-text)] focus:outline-none font-mono"
                  />
                )}
              </div>

              {/* Submit triggers */}
              <div className="flex items-center justify-between pt-2 border-t border-[var(--color-border)] shrink-0 select-none">
                <button
                  type="button"
                  onClick={() => setIsComposeOpen(false)}
                  className="p-2 text-[var(--color-text-muted)] hover:text-red-400 hover:bg-red-500/10 rounded-lg transition-colors cursor-pointer"
                  title="Discard draft"
                >
                  <Trash2 className="w-4 h-4" />
                </button>

                <div className="flex items-center gap-2">
                  <button 
                    type="button" 
                    onClick={handleSaveDraft}
                    className="px-3.5 py-1.5 bg-[var(--color-surface-2)] hover:bg-[var(--color-surface-3)] border border-[var(--color-border)] rounded-lg text-xs font-semibold text-[var(--color-text-muted)] hover:text-[var(--color-text)] transition-all cursor-pointer"
                  >
                    Save Draft
                  </button>
                  <button 
                    type="submit" 
                    className="px-5 py-1.5 bg-red-600 hover:bg-red-700 text-white rounded-lg text-xs font-bold transition-all flex items-center gap-1.5 shadow-md shadow-red-950/20 cursor-pointer"
                  >
                    <Send className="w-3.5 h-3.5" /> 
                    {isScheduled ? "Queue Delivery" : "Send Message"}
                  </button>
                </div>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ── CRM TASK CREATION popover DIALOG ── */}
      {isTaskWizardOpen && (
        <div className="fixed inset-0 bg-[rgba(12,13,20,0.75)] z-50 flex items-center justify-center p-4 backdrop-blur-[8px] select-none">
          <div className="panel-card border border-[var(--color-accent)]/30 w-full max-w-sm p-5 shadow-2xl relative">
            <button 
              onClick={() => setIsTaskWizardOpen(false)} 
              className="absolute right-4 top-4 text-[var(--color-text-faint)] hover:text-[var(--color-text)]"
            >
              ✕
            </button>
            <h4 className="text-xs font-bold text-[var(--color-text)] uppercase tracking-wider mb-4 border-b border-[var(--color-divider)] pb-2 flex items-center gap-1 text-[var(--color-accent)]">
              <CheckSquare className="w-4 h-4 text-[var(--color-accent)]" /> Convert Email to CRM Task
            </h4>
            
            <form onSubmit={handleSaveTaskFromWizard} className="flex flex-col gap-3">
              <div>
                <label className="block text-[8px] text-[var(--color-text-muted)] uppercase font-bold mb-1 tracking-wider">CRM Title</label>
                <input 
                  type="text" 
                  className="w-full bg-[var(--color-surface)] border border-[var(--color-border)] rounded-lg px-2.5 py-1.5 text-xs text-[var(--color-text)] focus:outline-none focus:border-[var(--color-accent)]/30"
                  value={taskWizardTitle}
                  onChange={(e) => setTaskWizardTitle(e.target.value)}
                  required
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-[8px] text-[var(--color-text-muted)] uppercase font-bold mb-1 tracking-wider">Priority</label>
                  <select 
                    className="w-full bg-[var(--color-surface)] border border-[var(--color-border)] rounded-lg px-2 py-1 text-xs text-[var(--color-text)] focus:outline-none"
                    value={taskWizardPriority}
                    onChange={(e) => setTaskWizardPriority(e.target.value as any)}
                  >
                    <option value="high" className="bg-[var(--color-surface-3)] text-[var(--color-text)]">🔴 High</option>
                    <option value="medium" className="bg-[var(--color-surface-3)] text-[var(--color-text)]">🟡 Medium</option>
                    <option value="low font-bold" className="bg-[var(--color-surface-3)] text-[var(--color-text)]">🟢 Low</option>
                  </select>
                </div>
                <div>
                  <label className="block text-[8px] text-[var(--color-text-muted)] uppercase font-bold mb-1 tracking-wider">Due Date</label>
                  <input 
                    type="date" 
                    className="w-full bg-[var(--color-surface)] border border-[var(--color-border)] rounded-lg px-2 py-1 text-xs text-[var(--color-text)] focus:outline-none"
                    value={taskWizardDueDate}
                    onChange={(e) => setTaskWizardDueDate(e.target.value)}
                    required
                  />
                </div>
              </div>

              <div>
                <label className="block text-[8px] text-[var(--color-text-muted)] uppercase font-bold mb-1 tracking-wider">Assigned Staff Broker</label>
                <select 
                  className="w-full bg-[var(--color-surface)] border border-[var(--color-border)] rounded-lg px-2 py-1 text-xs text-[var(--color-text)] focus:outline-none"
                  value={taskWizardAssignee}
                  onChange={(e) => setTaskWizardAssignee(e.target.value)}
                >
                  <option value="Jeff Brown" className="bg-[var(--color-surface-3)] text-[var(--color-text)]">Jeff Brown (Broker)</option>
                  <option value="Tim Brown" className="bg-[var(--color-surface-3)] text-[var(--color-text)]">Tim Brown (Admin)</option>
                  <option value="Wayne MacLeod" className="bg-[var(--color-surface-3)] text-[var(--color-text)]">Wayne MacLeod (Admin)</option>
                  <option value="Jamey Brown" className="bg-[var(--color-surface-3)] text-[var(--color-text)]">Jamey Brown (Broker)</option>
                </select>
              </div>

              <div>
                <label className="block text-[8px] text-[var(--color-text-muted)] uppercase font-bold mb-1 tracking-wider">Description Brief</label>
                <textarea 
                  className="w-full bg-[var(--color-surface)] border border-[var(--color-border)] rounded-lg p-2 text-xs text-[var(--color-text)] focus:outline-none h-20 resize-none font-sans"
                  value={taskWizardNotes}
                  onChange={(e) => setTaskWizardNotes(e.target.value)}
                />
              </div>

              <div className="flex justify-end gap-2 mt-2 pt-2 border-t border-[var(--color-border)]">
                <button 
                  type="button" 
                  onClick={() => setIsTaskWizardOpen(false)}
                  className="bg-transparent hover:bg-[var(--color-surface-2)] border border-[var(--color-border)] text-[var(--color-text-muted)] px-3 py-1.5 rounded text-[10px] font-semibold transition-colors"
                >
                  Cancel
                </button>
                <button 
                  type="submit" 
                  className="bg-[var(--color-accent)] text-[var(--color-text-inverse)] font-bold px-4 py-1.5 rounded text-[10px] flex items-center gap-1 hover:bg-[var(--color-accent-hover)] transition-colors"
                >
                  Create Task Record
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ── CRM CALENDAR EVENT DIALOG ── */}
      {isEventWizardOpen && (
        <div className="fixed inset-0 bg-[rgba(12,13,20,0.75)] z-50 flex items-center justify-center p-4 backdrop-blur-[8px] select-none">
          <div className="panel-card border border-[var(--color-accent)]/30 w-full max-w-sm p-5 shadow-2xl relative">
            <button 
              onClick={() => setIsEventWizardOpen(false)} 
              className="absolute right-4 top-4 text-[var(--color-text-faint)] hover:text-[var(--color-text)]"
            >
              ✕
            </button>
            <h4 className="text-xs font-bold text-[var(--color-text)] uppercase tracking-wider mb-4 border-b border-[var(--color-divider)] pb-2 flex items-center gap-1 text-[var(--color-accent)]">
              <Calendar className="w-4 h-4 text-[var(--color-accent)]" /> Convert Email to Calendar Event
            </h4>
            
            <form onSubmit={handleSaveEventFromWizard} className="flex flex-col gap-3">
              <div>
                <label className="block text-[8px] text-[var(--color-text-muted)] uppercase font-bold mb-1 tracking-wider">Meeting Title</label>
                <input 
                  type="text" 
                  className="w-full bg-[var(--color-surface)] border border-[var(--color-border)] rounded-lg px-2.5 py-1.5 text-xs text-[var(--color-text)] focus:outline-none"
                  value={eventWizardTitle}
                  onChange={(e) => setEventWizardTitle(e.target.value)}
                  required
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-[8px] text-[var(--color-text-muted)] uppercase font-bold mb-1 tracking-wider">Date</label>
                  <input 
                    type="date" 
                    className="w-full bg-[var(--color-surface)] border border-[var(--color-border)] rounded-lg px-2 py-1 text-xs text-[var(--color-text)] focus:outline-none"
                    value={eventWizardDate}
                    onChange={(e) => setEventWizardDate(e.target.value)}
                    required
                  />
                </div>
                <div>
                  <label className="block text-[8px] text-[var(--color-text-muted)] uppercase font-bold mb-1 tracking-wider">Hour/Time</label>
                  <input 
                    type="text" 
                    className="w-full bg-[var(--color-surface)] border border-[var(--color-border)] rounded-lg px-2 py-1 text-xs text-[var(--color-text)] focus:outline-none font-mono"
                    value={eventWizardTime}
                    onChange={(e) => setEventWizardTime(e.target.value)}
                    placeholder="E.g. 10:00 AM"
                    required
                  />
                </div>
              </div>

              <div>
                <label className="block text-[8px] text-[var(--color-text-muted)] uppercase font-bold mb-1 tracking-wider">Event Category</label>
                <select 
                  className="w-full bg-[var(--color-surface)] border border-[var(--color-border)] rounded-lg px-2 py-1 text-xs text-[var(--color-text)] focus:outline-none text-[11px]"
                  value={eventWizardType}
                  onChange={(e) => setEventWizardType(e.target.value as any)}
                >
                  <option value="client" className="bg-[var(--color-surface-3)] text-[var(--color-text)]">👤 Client Advisory Meeting</option>
                  <option value="meeting" className="bg-[var(--color-surface-3)] text-[var(--color-text)]">🏢 Internal Company Board Session</option>
                  <option value="lender" className="bg-[var(--color-surface-3)] text-[var(--color-text)]">🏦 External Lender BDM Negotiation</option>
                  <option value="personal" className="bg-[var(--color-surface-3)] text-[var(--color-text)]">🔒 Private Schedule Reserve</option>
                </select>
              </div>

              <div>
                <label className="block text-[8px] text-[var(--color-text-muted)] uppercase font-bold mb-1 tracking-wider">Meeting Context Notes</label>
                <textarea 
                  className="w-full bg-[var(--color-surface)] border border-[var(--color-border)] rounded-lg p-2 text-xs text-[var(--color-text)] focus:outline-none h-20 resize-none font-sans"
                  value={eventWizardNotes}
                  onChange={(e) => setEventWizardNotes(e.target.value)}
                />
              </div>

              <div className="flex justify-end gap-2 mt-2 pt-2 border-t border-[var(--color-border)]">
                <button 
                  type="button" 
                  onClick={() => setIsEventWizardOpen(false)}
                  className="bg-transparent hover:bg-[var(--color-surface-2)] border border-[var(--color-border)] text-[var(--color-text-muted)] px-3 py-1.5 rounded text-[10px] font-semibold transition-colors"
                >
                  Cancel
                </button>
                <button 
                  type="submit" 
                  className="bg-[var(--color-accent)] hover:bg-[var(--color-accent-hover)] text-[var(--color-text-inverse)] font-bold px-4 py-1.5 rounded text-[10px] transition-colors"
                >
                  Submit Calendar Event
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ── CUSTOM REUSABLE CONFIRMATION MODAL (IFRAME-SAFE) ── */}
      {confirmModal && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4 animate-fade-in">
          <div className="bg-[var(--color-surface)] border border-[var(--color-border)] rounded-xl max-w-md w-full p-5 shadow-2xl space-y-4">
            <div className="flex items-center gap-3">
              <div className={`p-2.5 rounded-full shrink-0 ${confirmModal.confirmVariant === "danger" ? "bg-red-500/10 text-red-500" : "bg-amber-500/10 text-amber-500"}`}>
                <Trash2 className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-sm font-bold text-[var(--color-text)]">{confirmModal.title}</h3>
                <p className="text-xs text-[var(--color-text-muted)] mt-0.5 leading-relaxed">{confirmModal.message}</p>
              </div>
            </div>

            <div className="flex items-center justify-end gap-2.5 pt-3 border-t border-[var(--color-border)]">
              <button
                type="button"
                onClick={() => setConfirmModal(null)}
                className="px-3.5 py-1.5 rounded-lg border border-[var(--color-border)] text-xs font-semibold text-[var(--color-text-muted)] hover:bg-[var(--color-surface-2)] hover:text-[var(--color-text)] transition-colors cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={() => {
                  const action = confirmModal.onConfirm;
                  setConfirmModal(null);
                  action();
                }}
                className={`px-4 py-1.5 rounded-lg text-xs font-bold text-white transition-colors cursor-pointer shadow-sm ${
                  confirmModal.confirmVariant === "danger"
                    ? "bg-red-600 hover:bg-red-700"
                    : "bg-red-600 hover:bg-red-700"
                }`}
              >
                {confirmModal.confirmText || "Confirm"}
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
};
