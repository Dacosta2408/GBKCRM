import React, { useState, useMemo } from "react";
import { 
  Heart, Calendar, Mail, MessageSquare, Plus, CheckSquare, 
  UserPlus, CheckCircle, RefreshCw, AlertTriangle, ChevronRight, 
  Clock, Search, User, Filter, ArrowUpRight, DollarSign, Send,
  Trash, Edit2, Check, X, ShieldAlert, Award, FileText, Sparkles
} from "lucide-react";
import { Client, Task, User as SystemUser } from "../types";

interface RetentionProps {
  clients: Client[];
  setClients: React.Dispatch<React.SetStateAction<Client[]>>;
  tasks: Task[];
  setTasks: React.Dispatch<React.SetStateAction<Task[]>>;
  userRoster: SystemUser[];
  currentUser: SystemUser;
  showToast: (msg: string, type?: "success" | "error" | "info" | "warning", icon?: string) => void;
}

type StreamType = "birthdays" | "renewals" | "anniversaries" | "reengage";

interface RetentionTemplate {
  id: string;
  name: string;
  type: "email" | "sms";
  subject?: string;
  body: string;
}

export const Retention: React.FC<RetentionProps> = ({
  clients,
  setClients,
  tasks,
  setTasks,
  userRoster,
  currentUser,
  showToast
}) => {
  const [activeStream, setActiveStream] = useState<StreamType>("birthdays");
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedAgent, setSelectedAgent] = useState<string>("All");

  // Interaction Modal/Drawer States
  const [outreachClient, setOutreachClient] = useState<Client | null>(null);
  const [outreachType, setOutreachType] = useState<"email" | "sms" | "outcome" | null>(null);

  // Email / SMS Composition States
  const [compSubject, setCompSubject] = useState("");
  const [compBody, setCompBody] = useState("");
  const [customSms, setCustomSms] = useState("");

  // Outcome Logging States
  const [outcomeType, setOutcomeType] = useState<string>("contacted");
  const [outcomeNotes, setOutcomeNotes] = useState("");
  const [nextFollowUp, setNextFollowUp] = useState("");

  // Task Creation inline state
  const [taskClient, setTaskClient] = useState<Client | null>(null);
  const [taskTitle, setTaskTitle] = useState("");
  const [taskDueDate, setTaskDueDate] = useState("");
  const [taskPriority, setTaskPriority] = useState<"high" | "medium" | "low">("medium");

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

  // Stream calculations
  const streamsData = useMemo(() => {
    const now = new Date();
    const currentYear = now.getFullYear();

    // 1. Birthdays (next 30 days or passed in last 7 days)
    const birthdays = clients.filter(c => {
      if (!c.dob) return false;
      const dobDate = new Date(c.dob);
      const bMonth = dobDate.getMonth();
      const bDay = dobDate.getDate();
      
      const thisYearBD = new Date(currentYear, bMonth, bDay);
      let diffDays = Math.ceil((thisYearBD.getTime() - now.getTime()) / (24 * 3600000));
      
      if (diffDays < -7) {
        // Try next year
        const nextYearBD = new Date(currentYear + 1, bMonth, bDay);
        diffDays = Math.ceil((nextYearBD.getTime() - now.getTime()) / (24 * 3600000));
      }
      
      return diffDays >= -7 && diffDays <= 30;
    });

    // 2. Renewals (approaching maturity within 6 months)
    const renewals = clients.filter(c => {
      // Typically funded/closed status
      if (c.status !== "funded" && c.status !== "closed") return false;
      
      let matDate: Date | null = null;
      if (c.maturityDate) {
        matDate = new Date(c.maturityDate);
      } else if (c.fundedDate) {
        // Assume 5 years from funded Date
        const fDate = new Date(c.fundedDate);
        matDate = new Date(fDate.getFullYear() + 5, fDate.getMonth(), fDate.getDate());
      }

      if (!matDate) return false;
      
      const diffMs = matDate.getTime() - now.getTime();
      const diffDays = Math.ceil(diffMs / (24 * 3600000));
      return diffDays >= 0 && diffDays <= 180; // 6 months
    });

    // 3. Funding Anniversaries (within 30 days)
    const anniversaries = clients.filter(c => {
      if (!c.fundedDate) return false;
      const fDate = new Date(c.fundedDate);
      const fMonth = fDate.getMonth();
      const fDay = fDate.getDate();

      const thisYearAnn = new Date(currentYear, fMonth, fDay);
      let diffDays = Math.ceil((thisYearAnn.getTime() - now.getTime()) / (24 * 3600000));

      if (diffDays < -7) {
        const nextYearAnn = new Date(currentYear + 1, fMonth, fDay);
        diffDays = Math.ceil((nextYearAnn.getTime() - now.getTime()) / (24 * 3600000));
      }

      return diffDays >= -7 && diffDays <= 30;
    });

    // 4. Re-engage targets (no touchpoint for > 90 days and in post-close or active state)
    const reengage = clients.filter(c => {
      const activeOrFunded = ["funded", "closed", "open", "working"].includes(c.status);
      if (!activeOrFunded) return false;

      const lastTouchStr = c.lastContactedDate || c.updatedAt || c.createdAt;
      const lastTouch = new Date(lastTouchStr);
      const diffDays = Math.ceil((now.getTime() - lastTouch.getTime()) / (24 * 3600000));
      return diffDays >= 90;
    });

    return { birthdays, renewals, anniversaries, reengage };
  }, [clients]);

  // Filter clients under the active stream by search + agent owner
  const filteredStreamClients = useMemo(() => {
    let list: Client[] = [];
    if (activeStream === "birthdays") list = streamsData.birthdays;
    else if (activeStream === "renewals") list = streamsData.renewals;
    else if (activeStream === "anniversaries") list = streamsData.anniversaries;
    else if (activeStream === "reengage") list = streamsData.reengage;

    return list.filter(c => {
      // Agent filter
      const clientOwner = c.retentionOwner || (c.source && c.source.toLowerCase().includes("brown") ? "Jeff Brown" : "David Acosta");
      const matchesAgent = activeAgentFilter === "All" || 
                           clientOwner.toLowerCase() === activeAgentFilter.toLowerCase() ||
                           (c.source && c.source.toLowerCase().includes(activeAgentFilter.toLowerCase()));

      if (!matchesAgent) return false;

      // Search term filter
      const s = searchTerm.toLowerCase();
      return (
        c.first.toLowerCase().includes(s) ||
        c.last.toLowerCase().includes(s) ||
        (c.email && c.email.toLowerCase().includes(s)) ||
        (c.lender && c.lender.toLowerCase().includes(s))
      );
    });
  }, [activeStream, streamsData, searchTerm, activeAgentFilter]);

  // Overall metric stats
  const metrics = useMemo(() => {
    const totalClients = clients.length;
    const completedOutreach = clients.filter(c => c.lastContactedDate).length;
    const rate = totalClients > 0 ? Math.round((completedOutreach / totalClients) * 100) : 0;
    
    return {
      totalBirthdays: streamsData.birthdays.length,
      totalRenewals: streamsData.renewals.length,
      totalAnniversaries: streamsData.anniversaries.length,
      totalReengage: streamsData.reengage.length,
      outreachCompletionRate: rate
    };
  }, [streamsData, clients]);

  // Default Email / SMS templates per category
  const getTemplates = (type: StreamType, client: Client): { email: RetentionTemplate; sms: RetentionTemplate } => {
    const signature = `${currentUser.first} ${currentUser.last}`;
    const lenderName = client.lender || "your lender";
    const mtgValStr = client.mtgamt ? `$${Number(client.mtgamt).toLocaleString()}` : "$350,000";
    
    // Anniversary calculations
    let yearsFunded = 1;
    if (client.fundedDate) {
      yearsFunded = new Date().getFullYear() - new Date(client.fundedDate).getFullYear();
      if (yearsFunded <= 0) yearsFunded = 1;
    }

    const templatesMap: Record<StreamType, { email: RetentionTemplate; sms: RetentionTemplate }> = {
      birthdays: {
        email: {
          id: "temp_bd_email",
          name: "Happy Birthday Check-in",
          type: "email",
          subject: `Happy Birthday, ${client.first}! 🎂 From GBK Financial`,
          body: `Hi ${client.first},\n\nWishing you a truly spectacular birthday today! 🎂\n\nI wanted to take a quick moment away from mortgage charts to wish you and your loved ones an exceptional day filled with joy, celebration, and relaxation. Thank you so much for being an incredibly valued member of the GBK Financial family. We deeply appreciate your trust and partnership.\n\nEnjoy your special day, and let me know if there's ever anything we can do to make your financial journey smoother!\n\nBest regards,\n\n${signature}\nGBK Financial`
        },
        sms: {
          id: "temp_bd_sms",
          name: "SMS Birthday Note",
          type: "sms",
          body: `Happy Birthday, ${client.first}! 🎂 Wishing you an amazing day of celebration and relaxation. Thank you for being a wonderful client of GBK Financial! - ${signature}`
        }
      },
      renewals: {
        email: {
          id: "temp_ren_email",
          name: "6-Month Renewal Advisory",
          type: "email",
          subject: `Mortgage Renewal Advisory: Clear Savings Ahead for ${client.first}`,
          body: `Hi ${client.first},\n\nI hope everything is going wonderfully with your home. I'm reaching out proactively because your mortgage with ${lenderName} is approaching its maturity and renewal window in approximately 6 months.\n\nTypically, lenders send automated renewal packages with standard retail interest rates, hoping you'll sign without checking other options. At GBK Financial, we have direct access to over 50 prime, alternative, and private underwriting panels. By planning early, we can lock in maximum savings and protect your household budget from unnecessary expenses.\n\nLet's schedule a brief 10-minute strategy call this week to review your current rate, explore optimization opportunities, or discuss equity options. Here's my direct line. When works best for you?\n\nWarm regards,\n\n${signature}\nOntario Mortgage Broker, GBK Financial`
        },
        sms: {
          id: "temp_ren_sms",
          name: "SMS Renewal Warning",
          type: "sms",
          body: `Hi ${client.first}, your mortgage with ${lenderName} is renewing soon! Don't sign the bank's automatic package without shopping around. Let's find you the best market rates. When's a good time for a quick call? - ${signature}, GBK`
        }
      },
      anniversaries: {
        email: {
          id: "temp_ann_email",
          name: "Funding Anniversary Value Check",
          type: "email",
          subject: `Happy Mortgage Anniversary, ${client.first}! 🎉 (Equity Review Inside)`,
          body: `Hi ${client.first},\n\nCan you believe it has been ${yearsFunded} year${yearsFunded > 1 ? "s" : ""} since your mortgage at ${lenderName} was funded? Time flies! 🎉\n\nI always like to mark this milestone by checking in and offering a complimentary Equity & Market Valuation review. Over the past few years, mortgage terms and property values have fluctuated, and there may be strategic ways to optimize your current financial layout (like consolidated restructuring, home improvement financing, or simply auditing GDS/TDS health).\n\nHow is the home treating you? I'd love to hear how you're doing. Let's connect for a quick friendly check-in whenever you have a moment!\n\nBest regards,\n\n${signature}\nGBK Financial`
        },
        sms: {
          id: "temp_ann_sms",
          name: "SMS Anniversary Check-in",
          type: "sms",
          body: `Happy mortgage anniversary, ${client.first}! 🎉 Can't believe it's been ${yearsFunded} year${yearsFunded > 1 ? "s" : ""} since we funded your home loan with ${lenderName}. Hope the home is treating you excellently! Let me know if you ever need an equity check-in. - ${signature}`
        }
      },
      reengage: {
        email: {
          id: "temp_re_email",
          name: "Long-Time Friendly Re-engagement",
          type: "email",
          subject: `Friendly hello from GBK Financial / Thinking of you, ${client.first}`,
          body: `Hi ${client.first},\n\nIt's been a while since we last spoke, and I wanted to reach out to check in and see how everything is going with you and your family!\n\nAt GBK Financial, we consider our clients relationships for life, not just transactions. I wanted to verify if your current home setup is still meeting your needs, or if you've been contemplating any new real estate ventures, purchase renewals, or family expansions.\n\nEven if you're not planning any changes today, I'm always here to answer market questions, discuss the latest Bank of Canada interest rate decisions, or run custom calculators for you. \n\nI'd love to hear how you're doing. Drop me a line whenever you're free!\n\nBest regards,\n\n${signature}\nPrincipal Broker Team, GBK Financial`
        },
        sms: {
          id: "temp_re_sms",
          name: "SMS Light Catch-up",
          type: "sms",
          body: `Hi ${client.first}! It's been a while since we last caught up. Hope you and the family are doing great in the home. Just checking in to see how everything is going! - ${signature}, GBK Financial`
        }
      }
    };

    return templatesMap[type];
  };

  // Launch outreach interface
  const handleOpenOutreach = (client: Client, type: "email" | "sms" | "outcome") => {
    setOutreachClient(client);
    setOutreachType(type);
    
    const temps = getTemplates(activeStream, client);

    if (type === "email") {
      setCompSubject(temps.email.subject || "");
      setCompBody(temps.email.body);
    } else if (type === "sms") {
      setCustomSms(temps.sms.body);
    } else if (type === "outcome") {
      setOutcomeType("contacted");
      setOutcomeNotes("");
      setNextFollowUp("");
    }
  };

  // Handle saving direct outcomes
  const handleLogOutcomeSave = () => {
    if (!outreachClient) return;

    const todayStr = new Date().toISOString().split("T")[0];

    const updatedClients = clients.map(c => {
      if (c.id === outreachClient.id) {
        return {
          ...c,
          lastContactedDate: todayStr,
          nextFollowUpDate: nextFollowUp || c.nextFollowUpDate,
          retentionOutcome: outcomeType,
          retentionNotes: outcomeNotes || c.retentionNotes,
          updatedAt: new Date().toISOString()
        };
      }
      return c;
    });

    setClients(updatedClients);
    showToast(`Logged outreach outcome for ${outreachClient.first} ${outreachClient.last}: ${outcomeType.toUpperCase()}`, "success");
    
    // Close modal
    setOutreachClient(null);
    setOutreachType(null);
  };

  // One-click Task trigger modal loading
  const handleOpenTaskCreation = (client: Client) => {
    setTaskClient(client);
    
    let reason = "Follow up";
    if (activeStream === "birthdays") reason = "Send birthday congratulations card & call";
    else if (activeStream === "renewals") reason = "Conduct mortgage renewal review analysis";
    else if (activeStream === "anniversaries") reason = "Reach out for mortgage anniversary check-in and equity review";
    else if (activeStream === "reengage") reason = "Re-engage client, touchpoint regarding current rates";

    setTaskTitle(`${reason} for ${client.first} ${client.last}`);
    
    // Set due date to 3 days from now
    const d = new Date();
    d.setDate(d.getDate() + 3);
    setTaskDueDate(d.toISOString().split("T")[0]);
    setTaskPriority("medium");
  };

  const handleSaveTask = () => {
    if (!taskClient) return;

    const newTask: Task = {
      id: `task_ret_${Date.now()}`,
      title: taskTitle,
      status: "open",
      priority: taskPriority,
      dueDate: taskDueDate,
      clientId: taskClient.id,
      clientName: `${taskClient.first} ${taskClient.last}`,
      assignedTo: taskClient.retentionOwner || `${currentUser.first} ${currentUser.last}`,
      notes: `Retention stream automated workflow follow-up task. Triggered from ${activeStream.toUpperCase()} category list.`,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      createdBy: `${currentUser.first} ${currentUser.last}`
    };

    setTasks([newTask, ...tasks]);
    showToast(`Successfully scheduled retention task for ${taskClient.first}!`, "success");
    setTaskClient(null);
  };

  // Convert retention item into new Lead/Active file
  const handleConvertToLead = (client: Client) => {
    // We clone the client's record as a brand new lead file to preserve history
    const isConfirmed = window.confirm(`Convert ${client.first} ${client.last} to a new active mortgage lead? This clones their general profile into an active 'lead' file while preserving their historic closed/funded mortgage records.`);
    
    if (!isConfirmed) return;

    const clonedLead: Client = {
      ...client,
      id: `c_lead_${Date.now()}`,
      status: "lead",
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      fundedDate: undefined,
      maturityDate: undefined,
      lender: undefined,
      mtgamt: client.mtgamt, // keep the amount or set as general scenario
      source: `CRM Retention (${activeStream.toUpperCase()})`,
      aiSummary: `Created from past client retention follow-up. Historical file ID: ${client.id}.`
    };

    // Update the parent's status or notes to indicate opportunity was identified and lead created
    const updatedClients = clients.map(c => {
      if (c.id === client.id) {
        return {
          ...c,
          retentionNotes: `Converted to new lead file ${clonedLead.id} on ${new Date().toLocaleDateString()}`,
          retentionOutcome: "renewal opportunity created",
          lastContactedDate: new Date().toISOString().split("T")[0]
        };
      }
      return c;
    });

    setClients([clonedLead, ...updatedClients]);
    showToast(`Success! Generated new active CRM Lead file for ${client.first} ${client.last}!`, "success");
  };

  // Fast email sender simulation
  const handleSendEmailSimulation = () => {
    if (!outreachClient) return;

    // Simulate sending email (adds notes to the client)
    const todayStr = new Date().toISOString().split("T")[0];
    const updatedClients = clients.map(c => {
      if (c.id === outreachClient.id) {
        return {
          ...c,
          lastContactedDate: todayStr,
          retentionOutcome: "contacted",
          retentionNotes: `Sent Retention Email: "${compSubject}"`,
          updatedAt: new Date().toISOString()
        };
      }
      return c;
    });

    setClients(updatedClients);
    showToast(`Email successfully delivered to ${outreachClient.first} (${outreachClient.email})!`, "success");
    
    setOutreachClient(null);
    setOutreachType(null);
  };

  // Fast SMS sender simulation
  const handleSendSmsSimulation = () => {
    if (!outreachClient) return;

    const todayStr = new Date().toISOString().split("T")[0];
    const updatedClients = clients.map(c => {
      if (c.id === outreachClient.id) {
        return {
          ...c,
          lastContactedDate: todayStr,
          retentionOutcome: "contacted",
          retentionNotes: `Sent SMS Outreach: "${customSms.slice(0, 40)}..."`,
          updatedAt: new Date().toISOString()
        };
      }
      return c;
    });

    setClients(updatedClients);
    showToast(`SMS outreach sent to ${outreachClient.cell || "client device"}!`, "success");

    setOutreachClient(null);
    setOutreachType(null);
  };

  // Update Owner assigned to client
  const handleUpdateOwner = (clientId: string, ownerName: string) => {
    const updated = clients.map(c => {
      if (c.id === clientId) {
        return { ...c, retentionOwner: ownerName, updatedAt: new Date().toISOString() };
      }
      return c;
    });
    setClients(updated);
    showToast("Updated relationship owner assignment.", "info");
  };

  return (
    <div className="flex flex-col h-full bg-[var(--color-bg)] text-[var(--color-text)] overflow-hidden" id="retention-module-root">
      
      {/* Top Header Panel */}
      <div className="bg-[var(--color-surface)] border-b border-[var(--color-border)] p-4 shrink-0 flex flex-col md:flex-row justify-between items-start md:items-center gap-4" id="retention-header-bar">
        <div>
          <h2 className="text-sm font-black uppercase text-[var(--color-accent)] tracking-widest flex items-center gap-1.5">
            <Heart className="h-4 w-4 fill-current text-[var(--color-accent)]" /> CRM Client Retention Desk
          </h2>
          <p className="text-[10px] text-[var(--color-text-muted)] font-semibold mt-0.5">Post-close lifecycle automation, relationship nurturing, and proactive renewal locks</p>
        </div>

        {/* Global Controls */}
        <div className="flex items-center flex-wrap gap-2.5">
          {/* Agent Filter */}
          {isPrivileged ? (
            <div className="flex items-center gap-1.5 bg-[var(--color-surface-2)] border border-[var(--color-border)] px-2 py-1 rounded-lg text-xs">
              <Filter className="h-3 w-3 text-[var(--color-accent)]" />
              <select
                value={selectedAgent}
                onChange={(e) => setSelectedAgent(e.target.value)}
                className="bg-transparent border-none text-[11px] text-[var(--color-text)] focus:outline-none font-bold"
              >
                <option value="All" className="bg-[var(--color-bg)]">All Owners</option>
                {userRoster.map(u => (
                  <option key={u.id} value={`${u.first} ${u.last}`} className="bg-[var(--color-bg)]">{u.first} {u.last}</option>
                ))}
              </select>
            </div>
          ) : (
            <div className="bg-[var(--color-accent)]/10 border border-[var(--color-accent)]/20 text-[10px] text-[var(--color-accent)] font-black uppercase px-2.5 py-1.5 rounded-lg flex items-center gap-1.5">
              <ShieldAlert className="h-3.5 w-3.5" /> personal client ledger
            </div>
          )}

          {/* Search */}
          <div className="relative bg-[var(--color-surface-2)] border border-[var(--color-border)] rounded-lg px-2.5 py-1 flex items-center w-48 sm:w-60">
            <Search className="h-3.5 w-3.5 text-[var(--color-text-faint)] shrink-0 mr-1.5" />
            <input
              type="text"
              placeholder="Search past clients..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="bg-transparent border-none text-[11px] text-[var(--color-text)] focus:outline-none w-full font-semibold placeholder-[var(--color-text-faint)]"
            />
          </div>
        </div>
      </div>

      {/* Overview Metric Stats Dashboard Banner */}
      <div className="bg-[var(--color-surface)] px-6 py-4 border-b border-[var(--color-border)]/60 grid grid-cols-2 md:grid-cols-5 gap-3 shrink-0" id="retention-stats-panel">
        <button 
          onClick={() => setActiveStream("birthdays")}
          className={`p-3 rounded-xl border text-left transition-all relative overflow-hidden group ${
            activeStream === "birthdays" 
              ? "bg-[#b5a642]/10 border-[#b5a642]/40 shadow-md" 
              : "bg-[var(--color-surface-2)] border-[var(--color-border)] hover:bg-[var(--color-surface-3)] text-[var(--color-text)]"
          }`}
        >
          <div className="flex justify-between items-center text-[var(--color-text-muted)] group-hover:text-[var(--color-text)] transition-all">
            <span className="text-[9px] uppercase font-black tracking-wider">Birthdays (30d)</span>
            <span className="text-pink-400 font-bold text-xs">🎂</span>
          </div>
          <span className="text-lg font-black block mt-1 text-[var(--color-text)]">{metrics.totalBirthdays}</span>
          <span className="text-[8px] text-[#b5a642] font-bold block mt-0.5">Nurture Touchpoint</span>
        </button>

        <button 
          onClick={() => setActiveStream("renewals")}
          className={`p-3 rounded-xl border text-left transition-all relative overflow-hidden group ${
            activeStream === "renewals" 
              ? "bg-[#6fa3b8]/10 border-[#6fa3b8]/40 shadow-md" 
              : "bg-[var(--color-surface-2)] border-[var(--color-border)] hover:bg-[var(--color-surface-3)] text-[var(--color-text)]"
          }`}
        >
          <div className="flex justify-between items-center text-[var(--color-text-muted)] group-hover:text-[var(--color-text)] transition-all">
            <span className="text-[9px] uppercase font-black tracking-wider">Renewals (6m)</span>
            <span className="text-[#6fa3b8] font-bold text-xs">🔄</span>
          </div>
          <span className="text-lg font-black block mt-1 text-[var(--color-text)]">{metrics.totalRenewals}</span>
          <span className="text-[8px] text-emerald-500 font-bold block mt-0.5">High revenue risk</span>
        </button>

        <button 
          onClick={() => setActiveStream("anniversaries")}
          className={`p-3 rounded-xl border text-left transition-all relative overflow-hidden group ${
            activeStream === "anniversaries" 
              ? "bg-amber-500/10 border-amber-500/30 shadow-md" 
              : "bg-[var(--color-surface-2)] border-[var(--color-border)] hover:bg-[var(--color-surface-3)] text-[var(--color-text)]"
          }`}
        >
          <div className="flex justify-between items-center text-[var(--color-text-muted)] group-hover:text-[var(--color-text)] transition-all">
            <span className="text-[9px] uppercase font-black tracking-wider">Anniversaries</span>
            <span className="text-amber-400 font-bold text-xs">🎉</span>
          </div>
          <span className="text-lg font-black block mt-1 text-[var(--color-text)]">{metrics.totalAnniversaries}</span>
          <span className="text-[8px] text-amber-500 dark:text-amber-300 font-bold block mt-0.5">Equity leverage moment</span>
        </button>

        <button 
          onClick={() => setActiveStream("reengage")}
          className={`p-3 rounded-xl border text-left transition-all relative overflow-hidden group ${
            activeStream === "reengage" 
              ? "bg-purple-500/10 border-purple-500/30 shadow-md" 
              : "bg-[var(--color-surface-2)] border-[var(--color-border)] hover:bg-[var(--color-surface-3)] text-[var(--color-text)]"
          }`}
        >
          <div className="flex justify-between items-center text-[var(--color-text-muted)] group-hover:text-[var(--color-text)] transition-all">
            <span className="text-[9px] uppercase font-black tracking-wider">Re-engage Cold</span>
            <span className="text-purple-400 font-bold text-xs">⏰</span>
          </div>
          <span className="text-lg font-black block mt-1 text-[var(--color-text)]">{metrics.totalReengage}</span>
          <span className="text-[8px] text-purple-500 dark:text-purple-300 font-bold block mt-0.5">Quiet &gt; 90 Days</span>
        </button>

        <div className="p-3 bg-[var(--color-surface-2)] border border-[var(--color-border)] rounded-xl text-left hidden md:block">
          <span className="text-[9px] text-[var(--color-text-faint)] uppercase font-black tracking-wider block">CRM Touchpoint Density</span>
          <span className="text-lg font-black block mt-1 text-[var(--color-accent)] font-mono">{metrics.outreachCompletionRate}%</span>
          <div className="w-full bg-[var(--color-surface)] h-1 rounded-full mt-1.5 overflow-hidden">
            <div className="bg-[var(--color-accent)] h-full" style={{ width: `${metrics.outreachCompletionRate}%` }} />
          </div>
        </div>
      </div>

      {/* Main Stream Content Area */}
      <div className="flex-1 overflow-y-auto p-6 space-y-6">
        
        {/* Stream Banner description */}
        <div className="bg-[var(--color-surface-2)]/45 border border-[var(--color-border)] rounded-xl p-4 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
          <div className="text-xs">
            <span className="text-[var(--color-accent)] font-black uppercase tracking-wider block">
              {activeStream === "birthdays" && "🎂 Client Birthday Nurture Engine"}
              {activeStream === "renewals" && "🔄 6-Month Mortgage Renewal Defense Pipeline"}
              {activeStream === "anniversaries" && "🎉 Mortgage Funding Anniversary Touchpoints"}
              {activeStream === "reengage" && "⏰ Long-Time Cold Relationship Recovery Radar"}
            </span>
            <span className="text-[var(--color-text-muted)] block mt-0.5 font-semibold">
              {activeStream === "birthdays" && "Nurturing professional goodwill. Send birthdays warm check-ins without pressure."}
              {activeStream === "renewals" && "Defend funded clients before retail lenders lock them into high-rate default renewals."}
              {activeStream === "anniversaries" && "Identify strategic mortgage equity adjustments, GDS/TDS health reviews or property appreciation metrics."}
              {activeStream === "reengage" && "Ensure no client goes quiet. Rekindle relationships with personalized market updates."}
            </span>
          </div>
          <div className="shrink-0 bg-[var(--color-accent)]/10 px-3 py-1 rounded-full text-[10px] font-black text-[var(--color-accent)] border border-[var(--color-accent)]/20">
            {filteredStreamClients.length} targets identified
          </div>
        </div>

        {/* Targets List */}
        {filteredStreamClients.length === 0 ? (
          <div className="bg-[var(--color-surface)]/40 border border-[var(--color-border)] rounded-2xl p-16 text-center space-y-2">
            <Heart className="h-10 w-10 text-[var(--color-text-faint)] mx-auto" />
            <p className="text-sm font-black text-[var(--color-text-muted)] uppercase">No target files matched</p>
            <p className="text-xs text-[var(--color-text-faint)] max-w-sm mx-auto font-medium">There are no client portfolios matching these timeline variables or filters at this time.</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 xl:grid-cols-2 gap-5" id="retention-client-grid">
            {filteredStreamClients.map((client) => {
              const currentOwner = client.retentionOwner || (client.source && client.source.toLowerCase().includes("brown") ? "Jeff Brown" : "David Acosta");
              
              // Anniversary year computation
              let yearsVal = 0;
              if (client.fundedDate) {
                yearsVal = new Date().getFullYear() - new Date(client.fundedDate).getFullYear();
                if (yearsVal <= 0) yearsVal = 1;
              }

              return (
                <div 
                  key={client.id}
                  className="bg-[var(--color-surface)] border border-[var(--color-border)] hover:border-[var(--color-border-hover)] rounded-2xl p-5 flex flex-col justify-between transition-all"
                  id={`retention-card-${client.id}`}
                >
                  {/* Card upper row */}
                  <div className="flex justify-between items-start">
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="text-sm font-black text-[var(--color-text)] hover:text-[var(--color-accent)] transition-all cursor-pointer">
                          {client.first} {client.last}
                        </span>
                        <span className="bg-[var(--color-surface-2)] text-[var(--color-text-muted)] text-[8px] font-black uppercase px-2 py-0.5 rounded border border-[var(--color-border)]">
                          {client.status.toUpperCase()}
                        </span>
                      </div>
                      <span className="text-[10px] text-[var(--color-text-faint)] font-semibold block mt-1">{client.addr || "No registered address"}</span>
                    </div>

                    <div className="text-right text-xs">
                      {activeStream === "birthdays" && (
                        <div className="bg-pink-500/10 border border-pink-500/20 text-pink-300 text-[10px] font-black px-2.5 py-1 rounded-full uppercase">
                          Birthday: {client.dob ? new Date(client.dob).toLocaleDateString("en-US", { month: "short", day: "numeric" }) : "N/A"}
                        </div>
                      )}
                      {activeStream === "renewals" && (
                        <div className="bg-[#6fa3b8]/15 border border-[#6fa3b8]/30 text-[#6fa3b8] text-[10px] font-black px-2.5 py-1 rounded-full uppercase">
                          Maturity: {client.maturityDate ? new Date(client.maturityDate).toLocaleDateString("en-US", { year: "numeric", month: "short", day: "numeric" }) : "5-Yr Default"}
                        </div>
                      )}
                      {activeStream === "anniversaries" && (
                        <div className="bg-amber-500/10 border border-amber-500/20 text-amber-300 text-[10px] font-black px-2.5 py-1 rounded-full uppercase">
                          Anniversary: {yearsVal} Year{yearsVal > 1 ? "s" : ""}
                        </div>
                      )}
                      {activeStream === "reengage" && (
                        <div className="bg-purple-500/15 border border-purple-500/30 text-purple-300 text-[10px] font-black px-2.5 py-1 rounded-full uppercase">
                          Quiet: {client.lastContactedDate ? "Last Touch " + client.lastContactedDate : "Never Contacted"}
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Portfolio parameters panel */}
                  <div className="grid grid-cols-3 gap-2 bg-[var(--color-surface-2)]/40 border border-[var(--color-border)] rounded-xl p-3 my-4 text-xs font-semibold">
                    <div>
                      <span className="text-[9px] text-[var(--color-text-faint)] uppercase font-bold block">Funded Lender</span>
                      <span className="text-[var(--color-text)] truncate block mt-0.5">{client.lender || "Scotiabank"}</span>
                    </div>
                    <div>
                      <span className="text-[9px] text-[var(--color-text-faint)] uppercase font-bold block">Mortgage Amount</span>
                      <span className="text-[var(--color-text)] block mt-0.5">${(Number(client.mtgamt || 0)).toLocaleString()}</span>
                    </div>
                    <div>
                      <span className="text-[9px] text-[var(--color-text-faint)] uppercase font-bold block">Client Contact</span>
                      <span className="text-[var(--color-text)] block mt-0.5 text-[10px] truncate">{client.email}</span>
                    </div>
                  </div>

                  {/* Operational Settings panel */}
                  <div className="border-t border-[var(--color-border)] pt-3 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3 text-xs">
                    
                    {/* Relationship Owner Assignment */}
                    <div className="flex items-center gap-1.5 w-full sm:w-auto">
                      <span className="text-[10px] text-[var(--color-text-muted)] font-semibold shrink-0">Owner:</span>
                      <select
                        value={currentOwner}
                        onChange={(e) => handleUpdateOwner(client.id, e.target.value)}
                        className="bg-[var(--color-surface-2)] border border-[var(--color-border)] rounded px-2 py-1 text-[11px] text-[var(--color-text)] font-bold max-w-[140px]"
                      >
                        {userRoster.map(u => (
                          <option key={u.id} value={`${u.first} ${u.last}`} className="bg-[var(--color-bg)]">{u.first} {u.last}</option>
                        ))}
                      </select>
                    </div>

                    {/* Follow up status indicators */}
                    <div className="flex flex-wrap gap-2.5 text-[10px] font-black uppercase text-[var(--color-text-faint)]">
                      <div>
                        <span className="text-[var(--color-text-faint)]/60 mr-1">Last Touch:</span>
                        <span className="text-[var(--color-text-muted)] font-mono">{client.lastContactedDate || "None Logged"}</span>
                      </div>
                      <div>
                        <span className="text-[var(--color-text-faint)]/60 mr-1">Next Call:</span>
                        <span className="text-[var(--color-accent)] font-mono">{client.nextFollowUpDate || "Not Set"}</span>
                      </div>
                    </div>
                  </div>

                  {/* Outcome indicator summary if present */}
                  {client.retentionOutcome && (
                    <div className="bg-[var(--color-surface-2)] border-l-2 border-[var(--color-accent)] px-3 py-1.5 rounded-r mt-3 text-[11px] text-[var(--color-text-muted)] italic flex justify-between items-center">
                      <span>Outcome: "{client.retentionOutcome.toUpperCase()}" - {client.retentionNotes}</span>
                      <span className="text-[9px] text-[var(--color-text-faint)] not-italic font-mono">{client.lastContactedDate}</span>
                    </div>
                  )}

                  {/* Action Controls Section */}
                  <div className="border-t border-[var(--color-border)] mt-4 pt-4 flex flex-wrap gap-2 justify-between">
                    {/* Quick outreach channels */}
                    <div className="flex items-center gap-2">
                      <button 
                        onClick={() => handleOpenOutreach(client, "email")}
                        className="p-2 bg-[var(--color-surface-2)] hover:bg-[var(--color-surface-3)] text-[var(--color-text)] rounded-lg transition-all flex items-center gap-1 text-[11px] font-black uppercase border border-[var(--color-border)]"
                        title="Send Email Campaign"
                      >
                        <Mail className="h-3.5 w-3.5 text-[var(--color-accent)]" /> Email
                      </button>
                      <button 
                        onClick={() => handleOpenOutreach(client, "sms")}
                        className="p-2 bg-[var(--color-surface-2)] hover:bg-[var(--color-surface-3)] text-[var(--color-text)] rounded-lg transition-all flex items-center gap-1 text-[11px] font-black uppercase border border-[var(--color-border)]"
                        title="Send SMS check-in"
                      >
                        <MessageSquare className="h-3.5 w-3.5 text-[#6fa3b8]" /> SMS
                      </button>
                      <button 
                        onClick={() => handleOpenOutreach(client, "outcome")}
                        className="p-2 bg-[var(--color-accent)]/10 hover:bg-[var(--color-accent)]/20 text-[var(--color-accent)] rounded-lg transition-all flex items-center gap-1 text-[11px] font-black uppercase border border-[var(--color-accent)]/20"
                        title="Log Outreach Action"
                      >
                        <CheckCircle className="h-3.5 w-3.5" /> Log Outcome
                      </button>
                    </div>

                    {/* Process / Scheduler triggers */}
                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => handleOpenTaskCreation(client)}
                        className="p-2 bg-[var(--color-surface-2)] hover:bg-[var(--color-surface-3)] text-[var(--color-text-muted)] rounded-lg transition-all text-[11px] font-black uppercase border border-[var(--color-border)] flex items-center gap-1"
                      >
                        <Plus className="h-3.5 w-3.5 text-amber-500" /> Create Task
                      </button>
                      
                      {(activeStream === "renewals" || activeStream === "reengage" || activeStream === "anniversaries") && (
                        <button
                          onClick={() => handleConvertToLead(client)}
                          className="px-3 py-2 bg-[var(--color-accent)] hover:bg-[var(--color-accent-hover)] text-black font-black rounded-lg transition-all text-[11px] font-black uppercase flex items-center gap-1"
                        >
                          <UserPlus className="h-3.5 w-3.5" /> Convert to Lead
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Outreach modal windows overlay */}
      {outreachClient && outreachType && (
        <div className="fixed inset-0 bg-black/80 flex items-center justify-center z-50 p-4 animate-fade-in" id="outreach-overlay">
          <div className="bg-[var(--color-surface)] border border-[var(--color-border)] rounded-2xl w-full max-w-2xl p-6 relative flex flex-col max-h-[90vh] overflow-hidden shadow-xl">
            
            {/* Close */}
            <button 
              onClick={() => { setOutreachClient(null); setOutreachType(null); }}
              className="absolute right-4 top-4 text-[var(--color-text-muted)] hover:text-[var(--color-text)]"
            >
              <X className="h-5 w-5" />
            </button>

            <h3 className="text-base font-black uppercase tracking-wider text-[var(--color-accent)] flex items-center gap-2 mb-2">
              {outreachType === "email" && <Mail className="h-5 w-5" />}
              {outreachType === "sms" && <MessageSquare className="h-5 w-5" />}
              {outreachType === "outcome" && <CheckCircle className="h-5 w-5" />}
              {outreachType === "email" && `Send Retention Email to ${outreachClient.first}`}
              {outreachType === "sms" && `Compose SMS to ${outreachClient.first}`}
              {outreachType === "outcome" && `Log Interaction Outcome: ${outreachClient.first} ${outreachClient.last}`}
            </h3>
            <p className="text-xs text-[var(--color-text-faint)] font-semibold mb-4 border-b border-[var(--color-border)] pb-3">
              Target Profile: ID {outreachClient.id} • Assigned Owner: {outreachClient.retentionOwner || "David Acosta"}
            </p>

            <div className="flex-1 overflow-y-auto pr-1 space-y-4 text-xs font-semibold">
              {/* EMAIL COMPOSER PANEL */}
              {outreachType === "email" && (
                <>
                  <div className="flex flex-col gap-1.5">
                    <label className="text-[10px] uppercase text-[var(--color-text-faint)] font-bold">To Email Address</label>
                    <input 
                      type="text" 
                      value={outreachClient.email} 
                      disabled 
                      className="bg-[var(--color-surface-2)]/60 border border-[var(--color-border)] text-[var(--color-text-muted)] px-3 py-2 rounded-lg cursor-not-allowed"
                    />
                  </div>

                  <div className="flex flex-col gap-1.5">
                    <label className="text-[10px] uppercase text-[var(--color-text-faint)] font-bold">Email Subject</label>
                    <input 
                      type="text" 
                      value={compSubject} 
                      onChange={(e) => setCompSubject(e.target.value)}
                      className="bg-[var(--color-surface-2)] border border-[var(--color-border)] text-[var(--color-text)] px-3 py-2 rounded-lg focus:outline-none focus:border-[var(--color-accent)]/30 font-bold"
                    />
                  </div>

                  <div className="flex flex-col gap-1.5">
                    <div className="flex justify-between items-center">
                      <label className="text-[10px] uppercase text-[var(--color-text-faint)] font-bold">Email Body Content</label>
                      <span className="text-[9px] text-[var(--color-accent)]">Placeholders resolved</span>
                    </div>
                    <textarea 
                      rows={12}
                      value={compBody} 
                      onChange={(e) => setCompBody(e.target.value)}
                      className="bg-[var(--color-surface-2)] border border-[var(--color-border)] text-[var(--color-text)] px-3 py-2.5 rounded-lg focus:outline-none focus:border-[var(--color-accent)]/30 font-sans leading-relaxed"
                    />
                  </div>
                </>
              )}

              {/* SMS COMPOSER PANEL */}
              {outreachType === "sms" && (
                <>
                  <div className="flex flex-col gap-1.5">
                    <label className="text-[10px] uppercase text-[var(--color-text-faint)] font-bold">Client Mobile Number</label>
                    <input 
                      type="text" 
                      value={outreachClient.cell || "(No Mobile Registered)"} 
                      disabled 
                      className="bg-[var(--color-surface-2)]/60 border border-[var(--color-border)] text-[var(--color-text-muted)] px-3 py-2 rounded-lg cursor-not-allowed"
                    />
                  </div>

                  <div className="flex flex-col gap-1.5">
                    <label className="text-[10px] uppercase text-[var(--color-text-faint)] font-bold">SMS Text Message</label>
                    <textarea 
                      rows={6}
                      value={customSms} 
                      onChange={(e) => setCustomSms(e.target.value)}
                      className="bg-[var(--color-surface-2)] border border-[var(--color-border)] text-[var(--color-text)] px-3 py-2.5 rounded-lg focus:outline-none focus:border-[var(--color-accent)]/30 font-semibold"
                    />
                    <div className="flex justify-between text-[9px] text-[var(--color-text-faint)] mt-1">
                      <span>SMS character limit check (standard length)</span>
                      <span>{customSms.length} chars</span>
                    </div>
                  </div>
                </>
              )}

              {/* MANUAL INTERACTION OUTCOME LOGGER */}
              {outreachType === "outcome" && (
                <>
                  <div className="grid grid-cols-2 gap-4">
                    <div className="flex flex-col gap-1.5">
                      <label className="text-[10px] uppercase text-[var(--color-text-faint)] font-bold">Interaction Outcome Type</label>
                      <select
                        value={outcomeType}
                        onChange={(e) => setOutcomeType(e.target.value)}
                        className="bg-[var(--color-surface-2)] border border-[var(--color-border)] text-[var(--color-text)] px-3 py-2 rounded-lg focus:outline-none focus:border-[var(--color-accent)]/30"
                      >
                        <option value="contacted" className="bg-[var(--color-bg)] text-[var(--color-text)]">Contacted (Spoke directly)</option>
                        <option value="no response" className="bg-[var(--color-bg)] text-[var(--color-text)]">No Response (Left Voicemail/Text)</option>
                        <option value="booked review" className="bg-[var(--color-bg)] text-[var(--color-text)]">Booked Mortgage Review Meeting</option>
                        <option value="referred someone" className="bg-[var(--color-bg)] text-[var(--color-text)]">Referred Someone New</option>
                        <option value="renewal opportunity created" className="bg-[var(--color-bg)] text-[var(--color-text)]">Renewal Opportunity Created</option>
                      </select>
                    </div>

                    <div className="flex flex-col gap-1.5">
                      <label className="text-[10px] uppercase text-[var(--color-text-faint)] font-bold">Next Follow-up Due Date</label>
                      <input 
                        type="date"
                        value={nextFollowUp}
                        onChange={(e) => setNextFollowUp(e.target.value)}
                        className="bg-[var(--color-surface-2)] border border-[var(--color-border)] text-[var(--color-text)] px-3 py-1.5 rounded-lg focus:outline-none focus:border-[var(--color-accent)]/30"
                      />
                    </div>
                  </div>

                  <div className="flex flex-col gap-1.5 mt-3">
                    <label className="text-[10px] uppercase text-[var(--color-text-faint)] font-bold">Conversation Log Notes</label>
                    <textarea 
                      rows={5}
                      value={outcomeNotes} 
                      onChange={(e) => setOutcomeNotes(e.target.value)}
                      placeholder="Add summary notes regarding current housing updates, GDS interest rates discussed, or next timeline expectations..."
                      className="bg-[var(--color-surface-2)] border border-[var(--color-border)] text-[var(--color-text)] px-3 py-2 rounded-lg focus:outline-none focus:border-[var(--color-accent)]/30 font-medium"
                    />
                  </div>
                </>
              )}
            </div>

            {/* Modal actions footer */}
            <div className="border-t border-[var(--color-border)] mt-5 pt-4 flex justify-end gap-3 shrink-0">
              <button
                onClick={() => { setOutreachClient(null); setOutreachType(null); }}
                className="px-4 py-2 bg-[var(--color-surface-2)] hover:bg-[var(--color-surface-3)] text-[var(--color-text)] rounded-lg text-xs font-bold transition-all border border-[var(--color-border)]"
              >
                Cancel
              </button>
              
              {outreachType === "email" && (
                <button
                  onClick={handleSendEmailSimulation}
                  className="px-4 py-2 bg-[var(--color-accent)] hover:bg-[var(--color-accent-hover)] text-black rounded-lg text-xs font-black uppercase flex items-center gap-1.5 transition-all"
                >
                  <Send className="h-3.5 w-3.5" /> Deliver Email
                </button>
              )}

              {outreachType === "sms" && (
                <button
                  onClick={handleSendSmsSimulation}
                  className="px-4 py-2 bg-[#6fa3b8] hover:bg-[#568fa5] text-black rounded-lg text-xs font-black uppercase flex items-center gap-1.5 transition-all"
                >
                  <Send className="h-3.5 w-3.5" /> Transmit SMS
                </button>
              )}

              {outreachType === "outcome" && (
                <button
                  onClick={handleLogOutcomeSave}
                  className="px-4 py-2 bg-emerald-500 hover:bg-emerald-600 text-black rounded-lg text-xs font-black uppercase transition-all"
                >
                  Save Log Entry
                </button>
              )}
            </div>

          </div>
        </div>
      )}

      {/* Task Creation Modal overlay */}
      {taskClient && (
        <div className="fixed inset-0 bg-black/80 flex items-center justify-center z-50 p-4 animate-fade-in" id="task-creation-overlay">
          <div className="bg-[var(--color-surface)] border border-[var(--color-border)] rounded-2xl w-full max-w-md p-6 relative flex flex-col text-xs font-semibold shadow-xl">
            
            {/* Close */}
            <button 
              onClick={() => setTaskClient(null)}
              className="absolute right-4 top-4 text-[var(--color-text-muted)] hover:text-[var(--color-text)]"
            >
              <X className="h-5 w-5" />
            </button>

            <h3 className="text-base font-black uppercase tracking-wider text-[var(--color-accent)] flex items-center gap-2 mb-3">
              <CheckSquare className="h-5 w-5" /> Create Retention Follow-up Task
            </h3>
            <p className="text-[var(--color-text-faint)] mb-4 border-b border-[var(--color-border)] pb-2 font-semibold">
              Client: {taskClient.first} {taskClient.last} • Assigned: {taskClient.retentionOwner || "David Acosta"}
            </p>

            <div className="space-y-4">
              <div className="flex flex-col gap-1.5">
                <label className="text-[10px] uppercase text-[var(--color-text-faint)] font-bold">Task Objective Title</label>
                <input 
                  type="text"
                  value={taskTitle}
                  onChange={(e) => setTaskTitle(e.target.value)}
                  className="bg-[var(--color-surface-2)] border border-[var(--color-border)] text-[var(--color-text)] px-3 py-2 rounded-lg font-bold focus:outline-none focus:border-[var(--color-accent)]/30"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="flex flex-col gap-1.5">
                  <label className="text-[10px] uppercase text-[var(--color-text-faint)] font-bold">Action Due Date</label>
                  <input 
                    type="date"
                    value={taskDueDate}
                    onChange={(e) => setTaskDueDate(e.target.value)}
                    className="bg-[var(--color-surface-2)] border border-[var(--color-border)] text-[var(--color-text)] px-3 py-1.5 rounded-lg focus:outline-none focus:border-[var(--color-accent)]/30"
                  />
                </div>

                <div className="flex flex-col gap-1.5">
                  <label className="text-[10px] uppercase text-[var(--color-text-faint)] font-bold">Priority Status</label>
                  <select
                    value={taskPriority}
                    onChange={(e) => setTaskPriority(e.target.value as any)}
                    className="bg-[var(--color-surface-2)] border border-[var(--color-border)] text-[var(--color-text)] px-3 py-1.5 rounded-lg focus:outline-none focus:border-[var(--color-accent)]/30"
                  >
                    <option value="high" className="bg-[var(--color-bg)]">🔴 High Priority</option>
                    <option value="medium" className="bg-[var(--color-bg)]">🟡 Medium Priority</option>
                    <option value="low" className="bg-[var(--color-bg)]">🟢 Low Priority</option>
                  </select>
                </div>
              </div>
            </div>

            <div className="border-t border-[var(--color-border)] mt-5 pt-4 flex justify-end gap-3">
              <button
                onClick={() => setTaskClient(null)}
                className="px-4 py-2 bg-[var(--color-surface-2)] hover:bg-[var(--color-surface-3)] text-[var(--color-text)] rounded-lg text-xs font-bold transition-all border border-[var(--color-border)]"
              >
                Cancel
              </button>
              <button
                onClick={handleSaveTask}
                className="px-4 py-2 bg-[var(--color-accent)] hover:bg-[var(--color-accent-hover)] text-black rounded-lg text-xs font-black uppercase transition-all"
              >
                Schedule Task
              </button>
            </div>

          </div>
        </div>
      )}

    </div>
  );
};
