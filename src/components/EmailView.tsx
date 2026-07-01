import React, { useState, useEffect } from "react";
import { 
  Mail, Star, Send, FileText, Trash2, ArrowLeft, RefreshCw, MailOpen, 
  User, CheckCircle2, AlertCircle, Plus, Calendar, Clock, Lock, 
  Link as LinkIcon, Paperclip, ChevronDown, Check, Reply, Sliders,
  FileCheck, ShieldAlert, Sparkles, MessageSquare, LogOut, CheckSquare
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

// ── BESPOKE SEED EMAILS FOR THE DIFFERENT SHARED MAILBOXES ──
const SHARED_MAILBOX_PRESETS: Record<string, Email[]> = {
  "renewals@gbkfinancial.ca": [
    {
      id: "sh-ren-1",
      from: "Marcus Johnson",
      fromEmail: "marcus.j@gmail.com",
      subject: "Refinance options before Nov Maturity date",
      body: "Hi Greg,\n\nI got some notification from Scotia that our mortgage on 48 Pine Crest is up for renewal in November. Our current rate is 3.14% which we obviously won't get anymore.\n\nCould we explore a refinance or a 3-year term instead? We have about $60,000 of higher interest HELOC that I.d love to fold into the primary mortgage if possible.\n\nLet me know your thoughts.\n\nBest,\nMarcus Johnson",
      preview: "Marcus is looking to fold a $60,000 HELOC into a refinance before November maturity.",
      time: "9:45 AM",
      date: "Today",
      unread: true,
      clientMatch: "Johnson"
    },
    {
      id: "sh-ren-2",
      from: "RBC Maturity Watch",
      fromEmail: "rbc.renewals@rbc.com",
      subject: "Client: Robert Wilson -- Maturity Notice Issued",
      body: "Hello Greg,\n\nThis is a standard maturity warning for your client Robert Wilson (Mortgage Account Ref: RBC-91040).\n\nAn offer of 5.84% is being dispatched. If your client intends to switch or pay out the charge on maturity date (August 15), please submit the formal discharge request 15 days in advance.\n\nSincerely,\nRBC Commercial Servicing",
      preview: "RBC issues maturity notice for Robert Wilson with an offer of 5.84%. Ready for shopping.",
      time: "Yesterday",
      date: "Yesterday",
      unread: false,
      clientMatch: "Wilson"
    }
  ],
  "docs@gbkfinancial.ca": [
    {
      id: "sh-doc-1",
      from: "Sarah Thompson",
      fromEmail: "sarah.t@email.com",
      subject: "Attaching my Notice of Assessment & T4 slips",
      body: "Good morning,\n\nFollowing up on our pre-approval documents. I have attached my 2025 Notice of Assessment (NOA) from the CRA portal as well as my current fiscal year T4 slip.\n\nLet me know if these are legible or if you need me to grab the full PDF tax summary package.\n\nKind regards,\nSarah",
      preview: "Outstanding document submission from Sarah Thompson. NOA and T4 attached.",
      time: "10:12 AM",
      date: "Today",
      unread: true,
      clientMatch: "Thompson"
    },
    {
      id: "sh-doc-2",
      from: "David Martinez",
      fromEmail: "david.martinez@gmail.com",
      subject: "Appraisal Confirmation for David Martinez File",
      body: "Hi Greg,\n\nThe appraiser just left our house. They said everything looked clean. I paid the appraisal invoice and asked them to send the final report directly to your office.\n\nAttached is the receipt proving payment. Please log this to our file clear condition #3.\n\nThanks,\nDavid Martinez",
      preview: "Receipt attached confirming appraisal payment on Martinez file.",
      time: "Yesterday 4:01 PM",
      date: "Yesterday",
      unread: false,
      clientMatch: "Martinez"
    }
  ],
  "info@gbkfinancial.ca": [
    {
      id: "sh-inf-1",
      from: "Inquiry Form - Frank Miller",
      fromEmail: "fmiller@outlook.com",
      subject: "New Lead Form Submission: First Time Home Buyer",
      body: "Name: Frank Miller\nEmail: fmiller@outlook.com\nPhone: (519) 555-9014\nLoan Wanted: $480,000\nDetails: I am buying a townhouse in Kitchener for $590k and have a 15% down payment saved. I am self-employed for 2.5 years and need to understand stated-income rules. Please contact me.",
      preview: "New self-employed buyer lead needing $480k loan with 15% down.",
      time: "Today 7:15 AM",
      date: "Today",
      unread: true
    },
    {
      id: "sh-inf-2",
      from: "Lender Panel Alerts",
      fromEmail: "alerts@lendernetwork.ca",
      subject: "ALERT: Stated Income Guidelines updated at Equitable Bank",
      body: "Equitable Bank BFS (Business-For-Self) stated-income programs have been updated. The maximum LTV for non-conforming stated income in GTHA is adjusted to 75%.\n\nRefer to attached BFS Underwriting Sheet for the current standard grid margins.\n\nLender Panel Staff",
      preview: "Equitable stated LTV caps adjusted to 75% in GBA/GTHA.",
      time: "Yesterday",
      date: "Yesterday",
      unread: false
    }
  ]
};

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
  // ── AUTH & SECTIONS STATES ──
  const [isLoggedIn, setIsLoggedIn] = useState<boolean>(() => {
    return !!(currentUser?.emailPassword || localStorage.getItem("gbk_gmail_loggedin") === "true");
  });
  const [loginEmail, setLoginEmail] = useState<string>(() => {
    return currentUser?.email || localStorage.getItem("gbk_gmail_login_email") || "david.acosta@gbkfinancial.ca";
  });

  useEffect(() => {
    setIsLoggedIn(!!currentUser?.emailPassword || localStorage.getItem("gbk_gmail_loggedin") === "true");
    setLoginEmail(currentUser?.email || "david.acosta@gbkfinancial.ca");
  }, [currentUser]);

  const [isLoggingIn, setIsLoggingIn] = useState<boolean>(false);
  const [activeFolder, setActiveFolder] = useState<string>("inbox");
  const [selectedEmail, setSelectedEmail] = useState<Email | null>(null);
  const [searchQuery, setSearchQuery] = useState<string>("");
  const [mailboxScope, setMailboxScope] = useState<string>("personal"); // "personal" or shared address
  const [signatureText, setSignatureText] = useState<string>(() => {
    return localStorage.getItem("gbk_gmail_signature") || 
      `Regards,\n\n${currentUser.first} ${currentUser.last}\nSenior Mortgage Advisor, GBK Financial\nPhone: ${currentUser.phone || "(416) 555-0105"}\nWeb: gbkfinancial.ca`;
  });
  const [showSignatureEdit, setShowSignatureEdit] = useState<boolean>(false);

  // Draft / Custom folder pools (internal simulation)
  const [draftsList, setDraftsList] = useState<Email[]>(() => {
    const saved = localStorage.getItem("gbk_gmail_drafts");
    return saved ? JSON.parse(saved) : [
      {
        id: "dr-1",
        to: "James Reid (TD BDM)",
        toEmail: "james.reid@td.com",
        subject: "Stated BFS exception request - David Martinez File",
        body: "Hi James,\n\nI have the Martinez folder ready to package but we are slightly over on the standard GDS caps. The borrower is active self-employed with outstanding credit history and high retained corporate earnings. Can we request an exception to 44% GDS?\n\n{{signature}}",
        time: "Yesterday 5:11 PM",
        date: "Yesterday",
        unread: false
      }
    ];
  });

  const [archivedList, setArchivedList] = useState<Email[]>(() => {
    const saved = localStorage.getItem("gbk_gmail_archive");
    return saved ? JSON.parse(saved) : [];
  });

  useEffect(() => {
    localStorage.setItem("gbk_gmail_drafts", JSON.stringify(draftsList));
  }, [draftsList]);

  useEffect(() => {
    localStorage.setItem("gbk_gmail_archive", JSON.stringify(archivedList));
  }, [archivedList]);

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
  const [composeSubject, setComposeSubject] = useState<string>("");
  const [composeBody, setComposeBody] = useState<string>("");
  const [selectedClientLink, setSelectedClientLink] = useState<string>("");
  const [scheduleSendTime, setScheduleSendTime] = useState<string>("");
  const [isScheduled, setIsScheduled] = useState<boolean>(false);

  // ── GOOGLE AUTH CONNECT WORKFLOW ──
  const handleGoogleLogin = () => {
    setIsLoggingIn(true);
    setTimeout(() => {
      setIsLoggingIn(false);
      setIsLoggedIn(true);
      localStorage.setItem("gbk_gmail_loggedin", "true");
      localStorage.setItem("gbk_gmail_login_email", loginEmail);
      showToast("Signed in securely to Google Workspace!", "success");
      if (logActivity) logActivity("Connected Google Workspace Gmail account", loginEmail);
    }, 1200);
  };

  const handleGoogleLogout = () => {
    const confirmed = window.confirm("Are you sure you want to disconnect your Google Workspace account?");
    if (!confirmed) return;
    setIsLoggedIn(false);
    localStorage.removeItem("gbk_gmail_loggedin");
    showToast("Disconnected from Google Mail Servers.", "success");
    if (logActivity) logActivity("Disconnected Workspace Google Identity", loginEmail);
  };

  const handleSaveSignature = () => {
    localStorage.setItem("gbk_gmail_signature", signatureText);
    setShowSignatureEdit(false);
    showToast("Broker signature saved successfully!", "success");
  };

  // ── CONSTRUCT ACTIVE DIRECTORY ──
  // Merge emailsState from App props + shared inbox overrides based on active selection scope
  const getMailboxEmails = () => {
    if (mailboxScope === "personal") {
      if (activeFolder === "inbox") return emailsState.inbox;
      if (activeFolder === "sent") return emailsState.sent;
      if (activeFolder === "scheduled") return emailsState.scheduled;
      if (activeFolder === "queued") return emailsState.queued || [];
      if (activeFolder === "drafts") return draftsList;
      if (activeFolder === "archived") return archivedList;
      return [];
    } else {
      // Shared mailbox from presets
      const list = SHARED_MAILBOX_PRESETS[mailboxScope] || [];
      if (activeFolder === "inbox") {
        return list;
      } else if (activeFolder === "drafts") {
        return draftsList.filter(e => e.fromEmail === mailboxScope);
      } else if (activeFolder === "archived") {
        return archivedList.filter(e => e.fromEmail === mailboxScope);
      } else if (activeFolder === "sent") {
        return emailsState.sent.filter(e => e.fromEmail === mailboxScope);
      } else if (activeFolder === "scheduled") {
        return emailsState.scheduled.filter(e => e.fromEmail === mailboxScope);
      } else if (activeFolder === "queued") {
        return (emailsState.queued || []).filter(e => e.fromEmail === mailboxScope);
      }
      return [];
    }
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

    const confirmed = window.confirm(`Log this email chain safely into ${matched.first} ${matched.last}'s Client Dossier Audit Notes?`);
    if (!confirmed) return;

    // Formulate clean entry
    const timestamp = new Date().toLocaleString("en-CA");
    const formattedEmailLog = `\n\n------- COMM LINK RECORDED (${timestamp}) -------\nDirection: INBOUND EMAIL\nFrom: ${selectedEmail.from} <${selectedEmail.fromEmail}>\nSubject: ${selectedEmail.subject}\nBody Summary:\n${selectedEmail.body || selectedEmail.preview}\n--------------------------------------------`;

    // Append directly to the client's aiSummary/notes
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
    }

    // Toast and logger
    showToast(`Logged successfully to ${matched.first}'s folder!`, "success", "📁");
    if (logActivity) {
      logActivity(`Logged Email to ${matched.first} ${matched.last}'s pipeline dossier`, selectedEmail.subject);
    }
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
    if (!bridgeOnline) {
      showToast("Cannot retry send: Z Drive Bridge is currently offline.", "error");
      return;
    }

    const host = currentUser?.emailHost || "smtp.gmail.com";
    const port = currentUser?.emailPort || "587";
    const username = currentUser?.emailUsername || currentUser?.email || "";
    const password = currentUser?.emailPassword || "";

    showToast("Retrying email dispatch via SMTP...", "info");
    const success = await sendEmail({
      to: email.toEmail || "",
      subject: email.subject || "",
      body: email.body || "",
      fromName: `${currentUser?.first || "David"} ${currentUser?.last || "Acosta"}`,
      fromEmail: email.fromEmail || loginEmail,
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
      showToast("Retry failed. Check SMTP settings or bridge server status.", "error");
    }
  };

  // EXECUTE DISPATCH EMAIL
  const handleSendComposeCommit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!composeToEmail || !composeSubject || !composeBody) {
      showToast("Please fill in Recipient, Subject, and Content body block.", "error");
      return;
    }

    const newEmailId = "mail_" + Date.now();
    const newMailRecord: Email = {
      id: newEmailId,
      from: `${currentUser?.first || "David"} ${currentUser?.last || "Acosta"}`,
      fromEmail: mailboxScope === "personal" ? loginEmail : mailboxScope,
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
      if (bridgeOnline) {
        const host = currentUser?.emailHost || "smtp.gmail.com";
        const port = currentUser?.emailPort || "587";
        const username = currentUser?.emailUsername || currentUser?.email || "";
        const password = currentUser?.emailPassword || "";

        showToast("Sending email via secure SMTP...", "info");
        const success = await sendEmail({
          to: composeToEmail,
          subject: composeSubject,
          body: composeBody,
          fromName: `${currentUser?.first || "David"} ${currentUser?.last || "Acosta"}`,
          fromEmail: mailboxScope === "personal" ? loginEmail : mailboxScope,
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
                const formattedLog = `\n\n------- COMM LINK RECORDED (${new Date().toLocaleString("en-CA")}) -------\nDirection: OUTBOUND EMAIL\nSent By: ${currentUser.first} ${currentUser.last} via ${mailboxScope === "personal" ? loginEmail : mailboxScope}\nTo: ${newMailRecord.to} <${newMailRecord.toEmail}>\nSubject: ${newMailRecord.subject}\nBody Segment:\n${newMailRecord.body}\n--------------------------------------------`;
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
      } else {
        const queuedMail = { ...newMailRecord, id: "q_" + Date.now() };
        setEmailsState(prev => ({
          ...prev,
          queued: [queuedMail, ...(prev.queued || [])]
        }));
        showToast("Bridge server offline — email queued for when connection is restored", "warning");
        setIsComposeOpen(false);
      }
    }
  };

  // DELETE OR ARCHIVE EMAIL
  const handleArchiveEmail = (e: React.MouseEvent, email: Email) => {
    e.stopPropagation();
    const confirmed = window.confirm("Safely archive this communication entry?");
    if (!confirmed) return;

    // Remove from active list
    if (mailboxScope === "personal") {
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
    }

    setArchivedList(prev => [email, ...prev]);
    setSelectedEmail(null);
    showToast("Message archived securely.", "success");
  };

  // SEED ADDITIONAL SAMPLE WORKSPACE LOGINS
  const demoAccounts = [
    "david.acosta@gbkfinancial.ca",
    "greg.brown@gbkfinancial.ca",
    "mortgages@gbkfinancial.ca"
  ];

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
    <div className="flex flex-col h-full bg-[#101014] text-white">
      
      {/* ── GOOGLE WORKSPACE API SYSTEM HEADER CONTROL ── */}
      <div className="p-4 bg-[#141418] border border-white/5 rounded-xl mb-4 shrink-0 flex flex-col md:flex-row justify-between items-center gap-4 shadow-xl">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-lg bg-red-600/10 border border-red-500/20 flex items-center justify-center">
            <Mail className="w-5 h-5 text-red-500" />
          </div>
          <div>
            <h2 className="text-sm font-bold tracking-tight text-white flex items-center gap-2">
              Google Workspace Email Center
              {isLoggedIn ? (
                <span className="bg-emerald-500/15 text-emerald-400 border border-emerald-500/20 text-[10px] font-bold px-2 py-0.5 rounded-full flex items-center gap-1">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse"></span>
                  GMAIL SYNC ACTIVE
                </span>
              ) : (
                <span className="bg-amber-500/15 text-amber-400 border border-amber-500/20 text-[10px] font-bold px-2 py-0.5 rounded-full flex items-center gap-1">
                  OFFLINE SANDBOX MODE
                </span>
              )}
            </h2>
            <p className="text-[10px] text-white/50">
              {isLoggedIn 
                ? `Connected: ${loginEmail} (All communications auto-synced with GSUITE API)`
                : "Secure local offline database mode. Connect Workspace for real Gmail transfers."}
            </p>
          </div>
        </div>

        {/* Auth Connector Action */}
        <div className="flex items-center gap-2">
          {isLoggedIn ? (
            <div className="flex items-center gap-3 bg-[#1b1b21] px-3 py-1.5 border border-white/5 rounded-lg">
              <div className="w-6 h-6 rounded-full bg-red-500 flex items-center justify-center font-bold text-[10px] text-white">
                {loginEmail[0]?.toUpperCase() || "E"}
              </div>
              <span className="text-xs font-mono text-white/70 max-w-[170px] truncate">{loginEmail}</span>
              <button 
                onClick={handleGoogleLogout} 
                className="text-white/40 hover:text-white transition-colors p-1"
                title="Disconnect Workspace"
              >
                <LogOut className="w-3.5 h-3.5 hover:text-red-400" />
              </button>
            </div>
          ) : (
            <div className="flex items-center gap-2">
              {/* BRANDED GOOGLE BUTTON */}
              <button 
                onClick={handleGoogleLogin}
                disabled={isLoggingIn}
                className="gsi-material-button bg-white text-black px-3.5 py-1.5 text-xs rounded-lg font-bold flex items-center gap-2 hover:bg-neutral-100 transition-all select-none disabled:opacity-40"
              >
                <div className="w-3.5 h-3.5 shrink-0">
                  <svg version="1.1" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 48 48" style={{ display: 'block' }}>
                    <path fill="#EA4335" d="M24 9.5c3.54 0 6.71 1.22 9.21 3.6l6.85-6.85C35.9 2.38 30.47 0 24 0 14.62 0 6.51 5.38 2.56 13.22l7.98 6.19C12.43 13.72 17.74 9.5 24 9.5z"></path>
                    <path fill="#4285F4" d="M46.98 24.55c0-1.57-.15-3.09-.38-4.55H24v9.02h12.94c-.58 2.96-2.26 5.48-4.78 7.18l7.73 6c4.51-4.18 7.09-10.36 7.09-17.65z"></path>
                    <path fill="#FBBC05" d="M10.53 28.59c-.48-1.45-.76-2.99-.76-4.59s.27-3.14.76-4.59l-7.98-6.19C.92 16.46 0 20.12 0 24c0 3.88.92 7.54 2.56 10.78l7.97-6.19z"></path>
                    <path fill="#34A853" d="M24 48c6.48 0 11.93-2.13 15.89-5.81l-7.73-6c-2.15 1.45-4.92 2.3-8.16 2.3-6.26 0-11.57-4.22-13.47-9.91l-7.98 6.19C6.51 42.62 14.62 48 24 48z"></path>
                  </svg>
                </div>
                {isLoggingIn ? "Syncing..." : "Connect Workspace"}
              </button>
            </div>
          )}
        </div>
      </div>

      {/* ── CENTRAL TWO-COLUMN CONTAINER ── */}
      <div className="flex-1 flex gap-4 min-h-0">
        
        {/* ── LEFT SIDEBAR (FOLDERS & ACTIONS) ── */}
        <div className="w-56 bg-[#141418] border border-white/5 rounded-xl flex flex-col p-3 overflow-y-auto gap-2 shrink-0 select-none shadow-lg">
          <button 
            onClick={() => handleComposeWithTemplate()}
            className="w-full bg-red-600 hover:bg-red-700 text-white font-bold text-xs py-2.5 rounded-lg transition-all mb-3 flex items-center justify-center gap-1.5 shadow-md shadow-red-950/20"
          >
            <Plus className="w-4 h-4" /> Compose Message
          </button>

          <span className="text-[9px] uppercase font-bold tracking-wider text-white/40 mb-1 px-1">Directory Folders</span>
          {[
            { id: "inbox", label: "Inbox Messages", count: getMailboxEmails().filter(e => e.unread).length, icon: Mail },
            { id: "drafts", label: "Draft Notebooks", count: getMailboxEmails().filter(e => activeFolder === "drafts").length, icon: FileText },
            { id: "sent", label: "Sent Mailbox", count: 0, icon: Send },
            { id: "scheduled", label: "Scheduled Queues", count: getMailboxEmails().filter(e => e.scheduledFor).length, icon: Clock },
            { id: "queued", label: "Queued (Offline)", count: (emailsState.queued || []).length, icon: AlertCircle },
            { id: "archived", label: "Archive Secure", count: 0, icon: Lock }
          ].map(f => {
            const Icon = f.icon;
            const isActive = activeFolder === f.id;
            return (
              <button
                key={f.id}
                onClick={() => { setActiveFolder(f.id); setSelectedEmail(null); }}
                className={`w-full text-left px-3 py-2 rounded-lg text-xs font-semibold flex items-center justify-between transition-all ${isActive ? "bg-red-600/10 text-red-400 border border-red-500/10 font-bold" : "text-white/60 hover:bg-white/5 border border-transparent"}`}
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

          {/* Quick-Match Active client lists matching inbox */}
          <div className="mt-4 border-t border-white/5 pt-3">
            <span className="block text-[9px] uppercase font-bold tracking-wider text-white/40 mb-2 px-1">Pipeline Auto-Matched</span>
            {clients.slice(0, 3).map(c => (
              <button
                key={c.id}
                onClick={() => onOpenClient && onOpenClient(c.id)}
                className="w-full text-left px-2 py-1 text-[10px] text-white/50 hover:text-red-400 truncate transition-all flex items-center gap-1.5"
                title={`${c.first} ${c.last}`}
              >
                <span className="w-1.5 h-1.5 rounded-full bg-red-400/80"></span>
                <span className="truncate">{c.first} {c.last}</span>
              </button>
            ))}
          </div>

          {/* Pre-Automated Mortgage Email Templates Accelerator */}
          <div className="mt-4 border-t border-white/5 pt-3">
            <span className="block text-[9px] uppercase font-bold tracking-wider text-white/40 mb-2 px-1 flex items-center gap-1 font-sans">
              ⚡ Pre-Automated Outlines
            </span>
            <div className="flex flex-col gap-1 max-h-48 overflow-y-auto pr-1">
              {MORTGAGE_PREPARED_TEMPLATES.map((mt) => (
                <button
                  key={mt.id}
                  onClick={() => handleComposeWithTemplate(mt.id)}
                  className="w-full text-left px-2 py-1.5 rounded bg-white/[0.02] hover:bg-red-600/10 border border-white/5 hover:border-red-500/20 text-[10px] text-white/70 hover:text-red-300 transition-all flex flex-col gap-0.5 group"
                  title={mt.desc}
                >
                  <span className="font-semibold truncate group-hover:text-red-400">{mt.name}</span>
                  <span className="text-[8px] text-white/40 truncate">{mt.desc}</span>
                </button>
              ))}
            </div>
          </div>

          {/* Email Signature Module */}
          <div className="mt-auto border-t border-white/5 pt-3">
            <button 
              onClick={() => setShowSignatureEdit(!showSignatureEdit)}
              className="w-full text-left text-[10px] text-[#b5a642] hover:underline flex items-center gap-1"
            >
              <Sliders className="w-3 h-3" /> Customize Signature
            </button>
            {showSignatureEdit && (
              <div className="mt-2 flex flex-col gap-1.5">
                <textarea 
                  className="w-full bg-[#1b1b20] border border-white/5 rounded p-1 text-[10px] font-mono text-white/80 h-24 focus:outline-none"
                  value={signatureText}
                  onChange={(e) => setSignatureText(e.target.value)}
                />
                <button 
                  onClick={handleSaveSignature}
                  className="w-full bg-[#1b1b20] border border-white/10 hover:border-[#b5a642]/30 text-white text-[9px] font-semibold py-1 rounded"
                >
                  ✓ Update Signature
                </button>
              </div>
            )}
          </div>
        </div>

        {/* ── CENTRAL COLUMN (EMAIL DIRECTORY SEARCH & LIST) ── */}
        <div className="w-72 bg-[#141418] border border-white/5 rounded-xl flex flex-col min-h-0 shrink-0 overflow-hidden shadow-lg">
          <div className="p-3 border-b border-white/5 flex flex-col gap-2 bg-[#1b1b20]/20 select-none">
            <div className="flex justify-between items-center">
              <h3 className="text-xs font-bold uppercase tracking-wider text-white/80 capitalize">{activeFolder} Folder</h3>
              <span className="text-[10px] text-white/40 font-mono font-bold">Qty: {filteredEmails.length}</span>
            </div>
            <input 
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search correspondence..." 
              className="bg-[#1b1b20] border border-white/5 rounded-lg px-3 py-1.5 text-xs text-[#eeeef2] focus:outline-none focus:border-red-600 w-full font-sans shadow-inner placeholder-white/20"
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
                  className={`flex flex-col p-3.5 border-b border-white/5 cursor-pointer hover:bg-[#1b1b20]/20 transition-all select-none ${isSelected ? "bg-[#1b1b20]/30 border-l-2 border-l-red-500" : ""} ${e.unread ? "bg-red-500/5" : ""}`}
                >
                  <div className="flex justify-between items-baseline mb-1">
                    <span className={`text-xs truncate max-w-[150px] ${e.unread ? "font-bold text-white" : "text-white/60"}`}>
                      {activeFolder === "sent" ? `To: ${e.to}` : e.from}
                    </span>
                    <span className="text-[9px] text-white/30 font-mono shrink-0">{e.time}</span>
                  </div>
                  
                  <div className={`text-xs truncate ${e.unread ? "font-semibold text-white" : "text-white/80"}`}>
                    {e.subject || "(no subject)"}
                  </div>
                  
                  <div className="text-[10px] text-white/40 truncate mt-1">
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
                    <div className="mt-2 flex items-center gap-1 text-[8px] text-[#b5a642] font-mono select-none">
                      <Clock className="w-2.5 h-2.5" /> Queue: {e.scheduledFor.replace("T", " ")}
                    </div>
                  )}
                </div>
              );
            }) : (
              <div className="h-64 flex flex-col items-center justify-center text-xs text-white/20 gap-3">
                <MailOpen className="w-8 h-8 opacity-40 shrink-0" />
                <span>No emails match filters.</span>
              </div>
            )}
          </div>
        </div>

        {/* ── RIGHT COLUMN (DETAILED CONTENT & CRM ACTIONS ACTION-SHORTCUTS) ── */}
        <div className="flex-1 bg-[#141418] border border-white/5 rounded-xl flex flex-col min-h-0 overflow-y-auto shadow-lg relative">
          
          {selectedEmail ? (
            <div className="flex-grow flex flex-col min-h-0">
              
              {/* DETAIL ACTIONS HEADER PANEL */}
              <div className="p-3 border-b border-white/5 bg-[#1b1b20]/35 sticky top-0 bg-[#141418] z-10 flex flex-wrap items-center justify-between gap-2.5 select-none shrink-0">
                <div className="flex items-center gap-2">
                  <button 
                    onClick={() => setSelectedEmail(null)}
                    className="px-2 py-1 rounded bg-[#1b1b20] border border-white/5 text-[10px] font-bold text-white/60 hover:text-white flex items-center gap-1"
                  >
                    <ArrowLeft className="w-3 h-3" /> List
                  </button>
                  <span className="text-[10px] font-mono text-[#b5a642] tracking-wider select-none bg-[#b5a642]/5 border border-[#b5a642]/10 px-1.5 py-0.5 rounded font-bold">
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
                        onClick={() => handleComposeWithTemplate()}
                        className="px-2 py-1 bg-red-600/10 hover:bg-red-600/20 border border-red-500/20 rounded text-[10px] font-bold text-red-400 flex items-center gap-1"
                      >
                        <Reply className="w-3 h-3" /> Reply
                      </button>
                      <button 
                        onClick={(e) => handleArchiveEmail(e, selectedEmail)}
                        className="px-2 py-1 bg-white/5 hover:bg-white/10 border border-white/5 rounded text-[10px] font-bold text-white/60 hover:text-white flex items-center gap-1"
                        title="Archive communication log"
                      >
                        <Trash2 className="w-3 h-3" /> Archive
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
                    className="bg-[#1b1b20] hover:bg-neutral-800 text-[#eeeef2] border border-white/5 px-2.5 py-1.5 rounded text-[10px] font-semibold flex items-center gap-1.5 shadow-md shadow-black/30 transition-all"
                  >
                    <FileText className="w-3.5 h-3.5 text-blue-400" /> Log to Dossier
                  </button>

                  {/* Action 2: Open client in full screen */}
                  {activeMatchedClient ? (
                    <button 
                      onClick={handleOpenClientCard}
                      className="bg-[#1b1b20] hover:bg-neutral-800 text-[#eeeef2] border border-white/5 px-2.5 py-1.5 rounded text-[10px] font-semibold flex items-center gap-1.5 shadow-md shadow-black/30 transition-all"
                    >
                      <User className="w-3.5 h-3.5 text-emerald-400" /> Open File Folder ({activeMatchedClient.last})
                    </button>
                  ) : null}

                  {/* Action 3: Create Task */}
                  <button 
                    onClick={handleOpenTaskWizard}
                    className="bg-[#1b1b20] hover:bg-neutral-800 text-[#eeeef2] border border-white/5 px-2.5 py-1.5 rounded text-[10px] font-semibold flex items-center gap-1.5 shadow-md shadow-black/30 transition-all"
                  >
                    <CheckSquare className="w-3.5 h-3.5 text-[#b5a642]" /> Create CRM Task
                  </button>

                  {/* Action 4: Create Event */}
                  <button 
                    onClick={handleOpenEventWizard}
                    className="bg-[#1b1b20] hover:bg-neutral-800 text-[#eeeef2] border border-white/5 px-2.5 py-1.5 rounded text-[10px] font-semibold flex items-center gap-1.5 shadow-md shadow-black/30 transition-all"
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
                      className="bg-[#1b1b20] hover:bg-neutral-800 text-[#eeeef2] border border-white/5 px-2.5 py-1.5 rounded text-[10px] font-semibold flex items-center gap-1.5 shadow-md shadow-black/30 transition-all hover:border-red-500/25"
                    >
                      <MessageSquare className="w-3.5 h-3.5 text-teal-400" /> Mobile SMS
                    </button>
                  )}
                </div>
              </div>

              {/* EMAIL BODY CONTENT AREA */}
              <div className="p-6 flex-grow overflow-auto">
                <h2 className="text-base font-bold text-white mb-2 leading-tight">
                  {selectedEmail.subject || "(no subject)"}
                </h2>
                
                <div className="flex items-center justify-between border-b border-white/5 pb-4 mb-4 select-none">
                  <div className="flex items-center gap-2.5">
                    <div className="w-9 h-9 rounded-full bg-red-500/10 border border-red-500/25 flex items-center justify-center font-bold text-xs text-red-400">
                      {(selectedEmail.from || selectedEmail.to || "?")[0].toUpperCase()}
                    </div>
                    <div>
                      <h4 className="text-xs font-bold text-white/95">{selectedEmail.from || "Greg Brown"}</h4>
                      <p className="text-[10px] text-white/50">{selectedEmail.fromEmail || "info@gbkfinancial.ca"}</p>
                    </div>
                  </div>
                  
                  <div className="text-[10px] text-white/40 font-mono text-right select-none">
                    <div>Time: {selectedEmail.time}</div>
                    <div className="mt-0.5">{selectedEmail.date}</div>
                  </div>
                </div>

                {/* Main Text Body */}
                <div className="text-xs text-white/90 leading-relaxed whitespace-pre-wrap font-sans bg-[#1b1b21]/30 p-4 rounded-xl border border-white/5">
                  {selectedEmail.body || selectedEmail.preview || "No transcript content."}
                </div>

                {/* ── ATTACHMENTS VAULT SECTION ── */}
                {selectedEmail.clientMatch ? (
                  <div className="mt-6 border-t border-white/5 pt-4 select-none">
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
                            <div key={doc.id} className="p-3 bg-[#1b1b20] border border-white/5 rounded-lg flex items-center justify-between gap-4">
                              <div className="flex items-center gap-2">
                                <FileText className="w-4 h-4 text-emerald-400 shrink-0" />
                                <div>
                                  <div className="text-xs font-semibold text-white/95">{doc.label}</div>
                                  <div className="text-[10px] text-white/40 mt-0.5 font-mono">Secured Vault Stream • {doc.size}</div>
                                </div>
                              </div>

                              <button 
                                onClick={() => handleSaveAttachmentToVault(doc.label, activeMatchedClient?.id || "c_smith", doc.extCode)}
                                className={`text-[9px] font-bold uppercase tracking-wider px-2.5 py-1 rounded border transition-all ${isAlreadyMapped ? "bg-emerald-950/20 text-emerald-400 border-emerald-900" : "bg-[#b5a642]/10 hover:bg-[#b5a642]/20 border-[#b5a642]/20 text-[#b5a642]"}`}
                              >
                                {isAlreadyMapped ? "✓ Imported & Mapped in CRM" : "📁 Save to CRM Dossier"}
                              </button>
                            </div>
                          );
                        })}
                      </div>
                    )}

                    {selectedEmail.clientMatch === "Martinez" && (
                      <div className="p-3 bg-[#1b1b20] border border-white/5 rounded-lg flex items-center justify-between gap-4">
                        <div className="flex items-center gap-2">
                          <FileText className="w-4 h-4 text-emerald-400 shrink-0" />
                          <div>
                            <div className="text-xs font-semibold text-white/95">Appraisal_Invoice_Payment_Receipt.pdf</div>
                            <div className="text-[10px] text-white/40 mt-0.5 font-mono">Receipt Archive • 345 KB</div>
                          </div>
                        </div>

                        <button 
                          onClick={() => handleSaveAttachmentToVault("Appraisal_Invoice_Payment_Receipt.pdf", activeMatchedClient?.id || "c_smith", "emp_letter")}
                          className="bg-[#b5a642]/10 hover:bg-[#b5a642]/20 border border-[#b5a642]/20 text-[#b5a642] text-[9px] font-bold uppercase tracking-wider px-2.5 py-1 rounded"
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

      {/* ── COMPOSE EMAIL DIALOG MODAL OVERLAY ── */}
      {isComposeOpen && (
        <div className="fixed inset-0 bg-black/70 z-50 flex items-center justify-center p-4 backdrop-blur-sm select-none">
          <div className="bg-[#141418] border border-white/10 rounded-2xl w-full max-w-lg p-5 shadow-2xl relative flex flex-col max-h-[90vh]">
            <button 
              onClick={() => setIsComposeOpen(false)} 
              className="absolute right-4 top-4 text-white/40 hover:text-white font-bold p-1 hover:bg-white/5 rounded text-xs"
            >
              ✕
            </button>
            
            <h3 className="text-sm font-bold text-white uppercase tracking-wider mb-4 border-b border-white/5 pb-2.5 flex items-center gap-1.5 shrink-0">
              <Send className="w-4 h-4 text-red-500" /> New Outbound Mortgage Correspondence
            </h3>

            <form onSubmit={handleSendComposeCommit} className="flex-grow overflow-y-auto flex flex-col gap-3.5 pr-1">
              
              {/* Linked Borrower Dropdown */}
              <div className="grid grid-cols-2 gap-3 shrink-0">
                <div>
                  <label className="block text-[9px] text-white/50 uppercase font-bold mb-1 tracking-wider">Link CRM Borrower Profile (Optional)</label>
                  <select 
                    value={selectedClientLink}
                    onChange={(e) => setSelectedClientLink(e.target.value)}
                    className="w-full bg-[#1b1b20] border border-white/5 rounded-lg px-2.5 py-1.5 text-xs text-white focus:outline-none"
                  >
                    <option value="">-- Do Not Link Client --</option>
                    {clients.map(cl => (
                      <option key={cl.id} value={cl.id}>{cl.first} {cl.last} ({cl.email})</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-[9px] text-white/50 uppercase font-bold mb-1 tracking-wider">Fast Insert Response Template</label>
                  <select 
                    onChange={(e) => handleComposeWithTemplate(e.target.value)}
                    className="w-full bg-[#1b1b20] border border-[#b5a642]/20 hover:border-[#b5a642]/45 rounded-lg px-2.5 py-1.5 text-xs text-[#b5a642] focus:outline-none focus:border-[#b5a642] font-semibold"
                  >
                    <option value="">-- Choose Campaign Template --</option>
                    {templates.map(t => (
                      <option key={t.id} value={t.id}>{t.name}</option>
                    ))}
                  </select>
                </div>
              </div>

              {/* Recipient Coordinates */}
              <div className="grid grid-cols-2 gap-3 shrink-0">
                <div>
                  <label className="block text-[9px] text-white/50 uppercase font-bold mb-1 tracking-wider">Recipient Name</label>
                  <input 
                    type="text" 
                    value={composeTo}
                    onChange={(e) => setComposeTo(e.target.value)}
                    placeholder="E.g. David Martinez"
                    className="w-full bg-[#1b1b20] border border-white/5 rounded-lg px-2.5 py-1.5 text-xs text-white focus:outline-none"
                  />
                </div>
                <div>
                  <label className="block text-[9px] text-white/50 uppercase font-bold mb-1 tracking-wider">Recipient Email (Target)</label>
                  <input 
                    type="email" 
                    value={composeToEmail}
                    onChange={(e) => setComposeToEmail(e.target.value)}
                    required
                    placeholder="E.g. borrower@example.com"
                    className="w-full bg-[#1b1b20] border border-white/5 rounded-lg px-2.5 py-1.5 text-xs text-white focus:outline-none"
                  />
                </div>
              </div>

              {/* Subject */}
              <div className="shrink-0">
                <label className="block text-[9px] text-white/50 uppercase font-bold mb-1 tracking-wider">Subject Title</label>
                <input 
                  type="text" 
                  value={composeSubject}
                  onChange={(e) => setComposeSubject(e.target.value)}
                  required
                  placeholder="Insert subject header line..."
                  className="w-full bg-[#1b1b20] border border-white/5 rounded-lg px-2.5 py-1.5 text-xs text-white focus:outline-none"
                />
              </div>

              {/* Body */}
              <div className="flex-grow flex flex-col min-h-0">
                <label className="block text-[9px] text-white/50 uppercase font-bold mb-1 tracking-wider">Content Frame Block</label>
                <textarea 
                  value={composeBody}
                  onChange={(e) => setComposeBody(e.target.value)}
                  required
                  rows={8}
                  placeholder="Write clear mortgage proposal communication layout here..."
                  className="w-full flex-grow bg-[#1b1b20] border border-white/5 rounded-lg p-3 text-xs text-white focus:outline-none font-sans leading-relaxed resize-none h-44"
                />
              </div>

              {/* Campaign Schedule Toggle */}
              <div className="p-3 bg-[#1b1b20] border border-white/5 rounded-xl shrink-0 flex items-center justify-between gap-4">
                <div className="flex items-center gap-2">
                  <input 
                    type="checkbox" 
                    id="scheduleToggle" 
                    checked={isScheduled} 
                    onChange={(e) => setIsScheduled(e.target.checked)}
                    className="rounded text-red-500 bg-[#141418] border-white/15"
                  />
                  <label htmlFor="scheduleToggle" className="text-xs font-semibold text-white/80 cursor-pointer select-none">
                    ⏰ Schedule Campaign Outreach Delay (Queue Later)
                  </label>
                </div>

                {isScheduled && (
                  <input 
                    type="datetime-local" 
                    value={scheduleSendTime}
                    onChange={(e) => setScheduleSendTime(e.target.value)}
                    className="bg-[#141418] border border-white/5 rounded px-2 py-1 text-[10px] text-white focus:outline-none font-mono"
                  />
                )}
              </div>

              {/* Submit triggers */}
              <div className="flex justify-end gap-2.5 pt-2 border-t border-white/5 shrink-0 select-none">
                <button 
                  type="button" 
                  onClick={() => setIsComposeOpen(false)}
                  className="px-4 py-2 bg-transparent hover:bg-white/5 border border-white/10 rounded-lg text-xs font-semibold text-white/70"
                >
                  Cancel
                </button>
                <button 
                  type="submit" 
                  className="px-5 py-2 bg-red-600 hover:bg-red-700 text-white rounded-lg text-xs font-bold transition-all flex items-center gap-1 shadow-md shadow-red-950/20"
                >
                  <Send className="w-3.5 h-3.5" /> 
                  {isScheduled ? "Queue Scheduled" : "Send & Log to Client Dossier"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ── CRM TASK CREATION popover DIALOG ── */}
      {isTaskWizardOpen && (
        <div className="fixed inset-0 bg-black/75 z-50 flex items-center justify-center p-4 backdrop-blur-sm select-none">
          <div className="bg-[#141418] border border-[#b5a642]/30 rounded-2xl w-full max-w-sm p-5 shadow-2xl relative">
            <button 
              onClick={() => setIsTaskWizardOpen(false)} 
              className="absolute right-4 top-4 text-white/40 hover:text-white"
            >
              ✕
            </button>
            <h4 className="text-xs font-bold text-white uppercase tracking-wider mb-4 border-b border-white/5 pb-2 flex items-center gap-1 text-[#b5a642]">
              <CheckSquare className="w-4 h-4 text-[#b5a642]" /> Convert Email to CRM Task
            </h4>
            
            <form onSubmit={handleSaveTaskFromWizard} className="flex flex-col gap-3">
              <div>
                <label className="block text-[8px] text-white/50 uppercase font-bold mb-1 tracking-wider">CRM Title</label>
                <input 
                  type="text" 
                  className="w-full bg-[#1b1b20] border border-white/5 rounded-lg px-2.5 py-1.5 text-xs text-white focus:outline-none"
                  value={taskWizardTitle}
                  onChange={(e) => setTaskWizardTitle(e.target.value)}
                  required
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-[8px] text-white/50 uppercase font-bold mb-1 tracking-wider">Priority</label>
                  <select 
                    className="w-full bg-[#1b1b20] border border-white/5 rounded-lg px-2 py-1 text-xs text-white focus:outline-none"
                    value={taskWizardPriority}
                    onChange={(e) => setTaskWizardPriority(e.target.value as any)}
                  >
                    <option value="high">🔴 High</option>
                    <option value="medium">🟡 Medium</option>
                    <option value="low font-bold">🟢 Low</option>
                  </select>
                </div>
                <div>
                  <label className="block text-[8px] text-white/50 uppercase font-bold mb-1 tracking-wider">Due Date</label>
                  <input 
                    type="date" 
                    className="w-full bg-[#1b1b20] border border-white/5 rounded-lg px-2 py-1 text-xs text-white focus:outline-none"
                    value={taskWizardDueDate}
                    onChange={(e) => setTaskWizardDueDate(e.target.value)}
                    required
                  />
                </div>
              </div>

              <div>
                <label className="block text-[8px] text-white/50 uppercase font-bold mb-1 tracking-wider">Assigned Staff Broker</label>
                <select 
                  className="w-full bg-[#1b1b20] border border-white/5 rounded-lg px-2 py-1 text-xs text-white focus:outline-none"
                  value={taskWizardAssignee}
                  onChange={(e) => setTaskWizardAssignee(e.target.value)}
                >
                  <option value="Jeff Brown">Jeff Brown (Senior Agent)</option>
                  <option value="Tim Brown">Tim Brown (Super Admin)</option>
                  <option value="Wayne MacLeod">Wayne MacLeod (Managing Broker)</option>
                  <option value="Jamey Brown">Jamey Brown (IT Staff)</option>
                </select>
              </div>

              <div>
                <label className="block text-[8px] text-white/50 uppercase font-bold mb-1 tracking-wider">Description Brief</label>
                <textarea 
                  className="w-full bg-[#1b1b20] border border-white/5 rounded-lg p-2 text-xs text-white focus:outline-none h-20 resize-none font-sans"
                  value={taskWizardNotes}
                  onChange={(e) => setTaskWizardNotes(e.target.value)}
                />
              </div>

              <div className="flex justify-end gap-2 mt-2 pt-2 border-t border-white/5">
                <button 
                  type="button" 
                  onClick={() => setIsTaskWizardOpen(false)}
                  className="bg-transparent hover:bg-white/5 border border-white/10 text-white/70 px-3 py-1.5 rounded text-[10px] font-semibold"
                >
                  Cancel
                </button>
                <button 
                  type="submit" 
                  className="bg-[#b5a642] text-black font-bold px-4 py-1.5 rounded text-[10px] flex items-center gap-1 hover:bg-[#9a8c38]"
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
        <div className="fixed inset-0 bg-black/75 z-50 flex items-center justify-center p-4 backdrop-blur-sm select-none">
          <div className="bg-[#141418] border border-purple-500/30 rounded-2xl w-full max-w-sm p-5 shadow-2xl relative">
            <button 
              onClick={() => setIsEventWizardOpen(false)} 
              className="absolute right-4 top-4 text-white/40 hover:text-white"
            >
              ✕
            </button>
            <h4 className="text-xs font-bold text-white uppercase tracking-wider mb-4 border-b border-white/5 pb-2 flex items-center gap-1 text-purple-400">
              <Calendar className="w-4 h-4 text-purple-400" /> Convert Email to Calendar Event
            </h4>
            
            <form onSubmit={handleSaveEventFromWizard} className="flex flex-col gap-3">
              <div>
                <label className="block text-[8px] text-white/50 uppercase font-bold mb-1 tracking-wider">Meeting Title</label>
                <input 
                  type="text" 
                  className="w-full bg-[#1b1b20] border border-white/5 rounded-lg px-2.5 py-1.5 text-xs text-white focus:outline-none"
                  value={eventWizardTitle}
                  onChange={(e) => setEventWizardTitle(e.target.value)}
                  required
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-[8px] text-white/50 uppercase font-bold mb-1 tracking-wider">Date</label>
                  <input 
                    type="date" 
                    className="w-full bg-[#1b1b20] border border-white/5 rounded-lg px-2 py-1 text-xs text-white focus:outline-none"
                    value={eventWizardDate}
                    onChange={(e) => setEventWizardDate(e.target.value)}
                    required
                  />
                </div>
                <div>
                  <label className="block text-[8px] text-white/50 uppercase font-bold mb-1 tracking-wider">Hour/Time</label>
                  <input 
                    type="text" 
                    className="w-full bg-[#1b1b20] border border-white/5 rounded-lg px-2 py-1 text-xs text-white focus:outline-none font-mono"
                    value={eventWizardTime}
                    onChange={(e) => setEventWizardTime(e.target.value)}
                    placeholder="E.g. 10:00 AM"
                    required
                  />
                </div>
              </div>

              <div>
                <label className="block text-[8px] text-white/50 uppercase font-bold mb-1 tracking-wider">Event Category</label>
                <select 
                  className="w-full bg-[#1b1b20] border border-white/5 rounded-lg px-2 py-1 text-xs text-white focus:outline-none text-[11px]"
                  value={eventWizardType}
                  onChange={(e) => setEventWizardType(e.target.value as any)}
                >
                  <option value="client">👤 Client Advisory Meeting</option>
                  <option value="meeting">🏢 Internal Company Board Session</option>
                  <option value="lender">🏦 External Lender BDM Negotiation</option>
                  <option value="personal">🔒 Private Schedule Reserve</option>
                </select>
              </div>

              <div>
                <label className="block text-[8px] text-white/50 uppercase font-bold mb-1 tracking-wider">Meeting Context Notes</label>
                <textarea 
                  className="w-full bg-[#1b1b20] border border-white/5 rounded-lg p-2 text-xs text-white focus:outline-none h-20 resize-none font-sans"
                  value={eventWizardNotes}
                  onChange={(e) => setEventWizardNotes(e.target.value)}
                />
              </div>

              <div className="flex justify-end gap-2 mt-2 pt-2 border-t border-white/5">
                <button 
                  type="button" 
                  onClick={() => setIsEventWizardOpen(false)}
                  className="bg-transparent hover:bg-white/5 border border-white/10 text-white/70 px-3 py-1.5 rounded text-[10px] font-semibold"
                >
                  Cancel
                </button>
                <button 
                  type="submit" 
                  className="bg-purple-600 hover:bg-purple-700 text-white font-bold px-4 py-1.5 rounded text-[10px]"
                >
                  Submit Calendar Event
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

    </div>
  );
};
