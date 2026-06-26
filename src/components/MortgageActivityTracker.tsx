import React, { useState, useEffect, useMemo } from "react";
import { 
  Phone, Mail, MessageSquare, Calendar, User, Clock, Search, Filter, 
  Plus, Trash2, Save, AlertTriangle, CheckCircle2, AlertCircle, Sparkles, 
  Send, ListFilter, ChevronDown, RefreshCw, Edit2, Archive, Check, ArrowRight
} from "lucide-react";
import { Client, User as CRMUser } from "../types";
import { 
  FileNote, 
  FileFollowUp, 
  ActivityEvent, 
  getNotesForClient, 
  saveNotesForClient, 
  getActivitiesForClient, 
  logActivityEvent, 
  getFollowUpsForClient, 
  saveFollowUpsForClient 
} from "../lib/activityEngine";

interface MortgageActivityTrackerProps {
  client: Client;
  currentUser: CRMUser;
  onUpdateClient: (updated: Client) => void;
  agentNames: string[];
  activeSubTab: "notes" | "activity";
  showToast: (msg: string, type?: "success" | "error" | "info", icon?: string) => void;
}

export const MortgageActivityTracker: React.FC<MortgageActivityTrackerProps> = ({
  client,
  currentUser,
  onUpdateClient,
  agentNames,
  activeSubTab,
  showToast
}) => {
  // --- STATE ---
  const [notes, setNotes] = useState<FileNote[]>([]);
  const [activities, setActivities] = useState<ActivityEvent[]>([]);
  const [followUps, setFollowUps] = useState<FileFollowUp[]>([]);

  // Filtering states
  const [notesSearch, setNotesSearch] = useState("");
  const [notesFilterType, setNotesFilterType] = useState<string>("all");
  const [activityFilter, setActivityFilter] = useState<string>("all");

  // Input states for New Note
  const [newNoteContent, setNewNoteContent] = useState("");
  const [newNoteType, setNewNoteType] = useState<FileNote["type"]>("general");
  const [newNoteTags, setNewNoteTags] = useState("");

  // Input states for Log Communication
  const [showLogComm, setShowLogComm] = useState(false);
  const [commType, setCommType] = useState<FileNote["communicationDetails"]["type"]>("phone_call");
  const [commDirection, setCommDirection] = useState<FileNote["communicationDetails"]["direction"]>("outgoing");
  const [commSummary, setCommSummary] = useState("");
  const [commNextStep, setCommNextStep] = useState("");
  const [commNextDueDate, setCommNextDueDate] = useState("");

  // Input states for Follow Up
  const [showAddFollowUp, setShowAddFollowUp] = useState(false);
  const [followUpTitle, setFollowUpTitle] = useState("");
  const [followUpDueDate, setFollowUpDueDate] = useState("");
  const [followUpOwner, setFollowUpOwner] = useState(client.agent || "");
  const [followUpPriority, setFollowUpPriority] = useState<FileFollowUp["priority"]>("medium");

  // Edit State for existing note
  const [editingNoteId, setEditingNoteId] = useState<string | null>(null);
  const [editedNoteContent, setEditedNoteContent] = useState("");

  // Trigger loading state refresh
  const [refreshTrigger, setRefreshTrigger] = useState(0);

  // --- REFRESH DATA ---
  useEffect(() => {
    setNotes(getNotesForClient(client));
    setActivities(getActivitiesForClient(client.id));
    setFollowUps(getFollowUpsForClient(client.id));
  }, [client, refreshTrigger]);

  // Listener to pick up modifications in other components
  useEffect(() => {
    const handleChecklistOrActivityUpdate = () => {
      setRefreshTrigger(prev => prev + 1);
    };
    window.addEventListener("activity-logged", handleChecklistOrActivityUpdate);
    window.addEventListener("checklist-updated", handleChecklistOrActivityUpdate);
    return () => {
      window.removeEventListener("activity-logged", handleChecklistOrActivityUpdate);
      window.removeEventListener("checklist-updated", handleChecklistOrActivityUpdate);
    };
  }, []);

  // --- ACTIONS ---

  // Log a custom note
  const handleAddNote = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newNoteContent.trim()) return;

    const tagsArray = newNoteTags
      .split(",")
      .map(tag => tag.trim().toLowerCase())
      .filter(tag => tag !== "");

    const newNote: FileNote = {
      id: `note_${Date.now()}_${Math.random().toString(36).substr(2, 5)}`,
      clientId: client.id,
      author: `${currentUser.first} ${currentUser.last}`,
      timestamp: new Date().toISOString(),
      type: newNoteType,
      content: newNoteContent.trim(),
      tags: tagsArray.length > 0 ? tagsArray : undefined
    };

    const updatedNotes = [newNote, ...notes];
    setNotes(updatedNotes);
    saveNotesForClient(client.id, updatedNotes);

    // Auto-log system activity event
    logActivityEvent({
      clientId: client.id,
      clientName: `${client.first} ${client.last}`,
      eventType: "note_added",
      user: `${currentUser.first} ${currentUser.last}`,
      timestamp: new Date().toISOString(),
      description: `Logged a new ${newNoteType} underwriter note: "${newNote.content.substring(0, 50)}..."`
    });

    setNewNoteContent("");
    setNewNoteTags("");
    setRefreshTrigger(prev => prev + 1);
    showToast("File note successfully logged.", "success", "📝");
  };

  // Start editing a note
  const startEditNote = (note: FileNote) => {
    setEditingNoteId(note.id);
    setEditedNoteContent(note.content);
  };

  // Save edited note
  const saveEditedNote = (noteId: string) => {
    const previous = notes.find(n => n.id === noteId);
    if (!previous || !editedNoteContent.trim()) return;

    const updatedNotes = notes.map(n => {
      if (n.id === noteId) {
        const history = n.editHistory || [];
        return {
          ...n,
          content: editedNoteContent.trim(),
          editHistory: [
            ...history,
            {
              editor: `${currentUser.first} ${currentUser.last}`,
              timestamp: new Date().toISOString(),
              previousContent: previous.content
            }
          ]
        };
      }
      return n;
    });

    setNotes(updatedNotes);
    saveNotesForClient(client.id, updatedNotes);
    setEditingNoteId(null);

    logActivityEvent({
      clientId: client.id,
      clientName: `${client.first} ${client.last}`,
      eventType: "note_edited",
      user: `${currentUser.first} ${currentUser.last}`,
      timestamp: new Date().toISOString(),
      description: `Modified underwriter note details`
    });

    setRefreshTrigger(prev => prev + 1);
    showToast("Underwriter note successfully updated.", "success", "💾");
  };

  // Delete a note
  const handleDeleteNote = (noteId: string) => {
    if (window.confirm("Are you sure you want to permanently delete this file note? This action cannot be undone.")) {
      const updatedNotes = notes.filter(n => n.id !== noteId);
      setNotes(updatedNotes);
      saveNotesForClient(client.id, updatedNotes);
      setRefreshTrigger(prev => prev + 1);
      showToast("Note removed.", "info", "🗑️");
    }
  };

  // Log communication event
  const handleLogCommunication = (e: React.FormEvent) => {
    e.preventDefault();
    if (!commSummary.trim()) return;

    const commNoteId = `comm_${Date.now()}`;
    const descText = `[${commDirection.toUpperCase()} ${commType.replace("_", " ").toUpperCase()}] ${commSummary}`;

    // Create note record for communication
    const commNote: FileNote = {
      id: commNoteId,
      clientId: client.id,
      author: `${currentUser.first} ${currentUser.last}`,
      timestamp: new Date().toISOString(),
      type: "call",
      content: descText,
      communicationDetails: {
        type: commType,
        direction: commDirection,
        nextActionNeeded: commNextStep.trim() || undefined,
        nextActionDueDate: commNextDueDate || undefined,
        status: commNextStep.trim() ? "unresolved" : "resolved"
      }
    };

    const updatedNotes = [commNote, ...notes];
    setNotes(updatedNotes);
    saveNotesForClient(client.id, updatedNotes);

    // Auto log timeline activity
    logActivityEvent({
      clientId: client.id,
      clientName: `${client.first} ${client.last}`,
      eventType: "communication_logged",
      user: `${currentUser.first} ${currentUser.last}`,
      timestamp: new Date().toISOString(),
      description: `Logged client outreach: ${commType.replace("_", " ")} (${commDirection}) - "${commSummary.substring(0, 55)}..."`
    });

    // Create a follow-up automatically if next action is entered
    if (commNextStep.trim()) {
      const newFollowUp: FileFollowUp = {
        id: `fup_${Date.now()}`,
        clientId: client.id,
        clientName: `${client.first} ${client.last}`,
        title: commNextStep.trim(),
        dueDate: commNextDueDate || new Date(Date.now() + 86400000).toISOString().split("T")[0],
        assignedOwner: client.agent || `${currentUser.first} ${currentUser.last}`,
        priority: "medium",
        status: "pending",
        createdTime: new Date().toISOString()
      };

      const updatedFollowUps = [...followUps, newFollowUp];
      setFollowUps(updatedFollowUps);
      saveFollowUpsForClient(client.id, updatedFollowUps);

      logActivityEvent({
        clientId: client.id,
        clientName: `${client.first} ${client.last}`,
        eventType: "followup_added",
        user: `${currentUser.first} ${currentUser.last}`,
        timestamp: new Date().toISOString(),
        description: `Scheduled critical follow-up: "${newFollowUp.title}" due by ${newFollowUp.dueDate}`
      });
    }

    setCommSummary("");
    setCommNextStep("");
    setCommNextDueDate("");
    setShowLogComm(false);
    setRefreshTrigger(prev => prev + 1);
    showToast("Communication successfully logged.", "success", "📞");
  };

  // Add dedicated Follow-Up
  const handleCreateFollowUp = (e: React.FormEvent) => {
    e.preventDefault();
    if (!followUpTitle.trim() || !followUpDueDate) return;

    const newFollowUp: FileFollowUp = {
      id: `fup_${Date.now()}`,
      clientId: client.id,
      clientName: `${client.first} ${client.last}`,
      title: followUpTitle.trim(),
      dueDate: followUpDueDate,
      assignedOwner: followUpOwner || `${currentUser.first} ${currentUser.last}`,
      priority: followUpPriority,
      status: "pending",
      createdTime: new Date().toISOString()
    };

    const updatedFollowUps = [...followUps, newFollowUp];
    setFollowUps(updatedFollowUps);
    saveFollowUpsForClient(client.id, updatedFollowUps);

    // Log Activity Event
    logActivityEvent({
      clientId: client.id,
      clientName: `${client.first} ${client.last}`,
      eventType: "followup_added",
      user: `${currentUser.first} ${currentUser.last}`,
      timestamp: new Date().toISOString(),
      description: `Created file follow-up task: "${newFollowUp.title}" (Assigned to: ${newFollowUp.assignedOwner})`
    });

    setFollowUpTitle("");
    setFollowUpDueDate("");
    setShowAddFollowUp(false);
    setRefreshTrigger(prev => prev + 1);
    showToast(`Follow-up scheduled for ${newFollowUp.assignedOwner}`, "success", "⏰");
  };

  // Resolve / Complete Follow-Up
  const handleToggleFollowUp = (fupId: string) => {
    const updated = followUps.map(fup => {
      if (fup.id === fupId) {
        const isCompleted = fup.status === "completed";
        const newStatus = isCompleted ? "pending" : "completed";
        
        // Log event
        logActivityEvent({
          clientId: client.id,
          clientName: `${client.first} ${client.last}`,
          eventType: isCompleted ? "followup_added" : "followup_completed",
          user: `${currentUser.first} ${currentUser.last}`,
          timestamp: new Date().toISOString(),
          description: isCompleted 
            ? `Re-opened follow-up task: "${fup.title}"` 
            : `Completed follow-up task: "${fup.title}"`
        });

        return {
          ...fup,
          status: newStatus as any,
          completedTime: isCompleted ? undefined : new Date().toISOString()
        };
      }
      return fup;
    });

    setFollowUps(updated);
    saveFollowUpsForClient(client.id, updated);
    setRefreshTrigger(prev => prev + 1);
    showToast("Follow-up status changed.", "success", "✓");
  };

  // Delete Follow-Up
  const handleDeleteFollowUp = (fupId: string) => {
    if (window.confirm("Are you sure you want to remove this follow-up?")) {
      const updated = followUps.filter(fup => fup.id !== fupId);
      setFollowUps(updated);
      saveFollowUpsForClient(client.id, updated);
      setRefreshTrigger(prev => prev + 1);
      showToast("Follow-up task deleted.", "info", "🗑️");
    }
  };

  // --- FILTERS & COMPUTATIONS ---

  // Search Notes
  const filteredNotes = useMemo(() => {
    return notes.filter(n => {
      const matchesSearch = n.content.toLowerCase().includes(notesSearch.toLowerCase()) || 
                            n.author.toLowerCase().includes(notesSearch.toLowerCase()) ||
                            (n.tags && n.tags.some(t => t.includes(notesSearch.toLowerCase())));
      const matchesType = notesFilterType === "all" || n.type === notesFilterType;
      return matchesSearch && matchesType;
    });
  }, [notes, notesSearch, notesFilterType]);

  // Search Activities
  const filteredActivities = useMemo(() => {
    if (activityFilter === "all") return activities;
    return activities.filter(act => {
      if (activityFilter === "notes_only" && (act.eventType === "note_added" || act.eventType === "note_edited")) return true;
      if (activityFilter === "comm_only" && act.eventType === "communication_logged") return true;
      if (activityFilter === "followup_only" && (act.eventType === "followup_added" || act.eventType === "followup_completed")) return true;
      if (activityFilter === "doc_only" && (act.eventType === "document_uploaded" || act.eventType === "document_reviewed")) return true;
      if (activityFilter === "checklist_only" && act.eventType === "checklist_updated") return true;
      if (activityFilter === "stage_only" && act.eventType === "stage_change") return true;
      if (activityFilter === "compliance_only" && act.eventType === "compliance_flagged") return true;
      return false;
    });
  }, [activities, activityFilter]);

  // Underwriter Bottleneck Diagnostics (Manager checks)
  const auditDiagnostics = useMemo(() => {
    const hasPendingFollowUp = followUps.some(fup => fup.status === "pending");
    const activeFollowUps = followUps.filter(fup => fup.status === "pending");
    
    // Check stale (no communication/update events in last 7 days)
    const sevenDaysAgo = new Date();
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);
    
    const lastEvent = activities.length > 0 ? new Date(activities[0].timestamp) : new Date(client.createdAt || Date.now());
    const isStale = lastEvent < sevenDaysAgo;

    // Check overdue follow-ups
    const todayStr = new Date().toISOString().split("T")[0];
    const overdueFollowUps = activeFollowUps.filter(fup => fup.dueDate < todayStr);

    // Repeated document chases (where activity description logs 'Requested' or 'chase' multiple times for same document ID)
    let isChasingHeavy = false;
    const countMap: Record<string, number> = {};
    activities.forEach(act => {
      if (act.description.toLowerCase().includes("awaiting client") || act.description.toLowerCase().includes("chase")) {
        const idKey = act.details || "unknown";
        countMap[idKey] = (countMap[idKey] || 0) + 1;
        if (countMap[idKey] >= 3) {
          isChasingHeavy = true;
        }
      }
    });

    return {
      hasPendingFollowUp,
      pendingCount: activeFollowUps.length,
      isStale,
      lastInteractionDays: Math.round((Date.now() - lastEvent.getTime()) / (1000 * 60 * 60 * 24)),
      overdueFollowUps,
      hasOverdue: overdueFollowUps.length > 0,
      isChasingHeavy
    };
  }, [activities, followUps, client]);

  // Color mappings for note categories
  const noteTypeBadges: Record<FileNote["type"], { label: string; bg: string; text: string }> = {
    general: { label: "General", bg: "bg-zinc-500/10 text-zinc-400 border-zinc-500/10", text: "text-zinc-400" },
    broker: { label: "Broker Note", bg: "bg-teal-500/10 text-teal-400 border-teal-500/10", text: "text-teal-400" },
    manager: { label: "Manager Review", bg: "bg-amber-500/10 text-amber-400 border-amber-500/10", text: "text-amber-400" },
    call: { label: "Outreach Log", bg: "bg-blue-500/10 text-blue-400 border-blue-500/10", text: "text-blue-400" },
    lender: { label: "Lender Correspondence", bg: "bg-indigo-500/10 text-indigo-400 border-indigo-500/10", text: "text-indigo-400" },
    underwriting: { label: "Underwriting", bg: "bg-rose-500/10 text-rose-400 border-rose-500/10", text: "text-rose-400" },
    internal: { label: "Internal Only", bg: "bg-orange-500/10 text-orange-400 border-orange-500/10", text: "text-orange-400" },
    lawyer: { label: "Solicitor Update", bg: "bg-emerald-500/10 text-emerald-400 border-emerald-500/10", text: "text-emerald-400" },
    partner: { label: "Partner/BDM Update", bg: "bg-violet-500/10 text-violet-400 border-violet-500/ violet-10", text: "text-violet-400" }
  };

  return (
    <div className="flex flex-col xl:flex-row gap-5 text-xs text-slate-300">
      
      {/* LEFT OR UPPER SECTION: Main Notes / Activities Workspace */}
      <div className="flex-1 space-y-4">
        
        {/* TAB INTERACTIVE CONTENT */}
        {activeSubTab === "notes" ? (
          
          /* NOTES TAB WORKSPACE */
          <div className="space-y-4">
            
            {/* Notes Tool bar search and filter */}
            <div className="bg-[#131317] border border-white/5 p-3 rounded-xl flex flex-col sm:flex-row items-center justify-between gap-3">
              <div className="relative w-full sm:max-w-xs">
                <Search className="absolute left-3 top-2.5 h-3.5 w-3.5 text-white/30" />
                <input 
                  type="text" 
                  placeholder="Search file notes or keywords..."
                  value={notesSearch}
                  onChange={(e) => setNotesSearch(e.target.value)}
                  className="w-full bg-[#171720]/80 border border-white/5 rounded-lg pl-9 pr-4 py-2 text-[11px] text-white focus:outline-none focus:border-[#b5a642]"
                />
              </div>

              <div className="flex items-center gap-2 w-full sm:w-auto">
                <ListFilter className="h-3.5 w-3.5 text-white/30 shrink-0" />
                <select 
                  value={notesFilterType}
                  onChange={(e) => setNotesFilterType(e.target.value)}
                  className="bg-[#111114] border border-white/5 rounded p-1.5 text-[10px] uppercase font-black tracking-wider text-white focus:outline-none w-full sm:w-auto"
                >
                  <option value="all">All Note Types</option>
                  <option value="general">General</option>
                  <option value="broker">Broker Notes</option>
                  <option value="manager">Manager Notes</option>
                  <option value="call">Outreach/Calls</option>
                  <option value="lender">Lender Notes</option>
                  <option value="underwriting">Underwriting Notes</option>
                  <option value="internal">Internal Only</option>
                  <option value="lawyer">Solicitor/Lawyer</option>
                  <option value="partner">Partners/BDMs</option>
                </select>

                <button 
                  onClick={() => setShowLogComm(true)}
                  className="bg-[#6fa3b8]/10 hover:bg-[#6fa3b8]/20 text-[#6fa3b8] border border-[#6fa3b8]/20 rounded-md px-3 py-1.5 font-bold uppercase text-[9px] tracking-wider flex items-center gap-1 shrink-0 transition-colors"
                >
                  <Phone className="w-3 h-3" /> Log Outreach
                </button>
              </div>
            </div>

            {/* Note addition editor */}
            <form onSubmit={handleAddNote} className="bg-[#171720]/40 border border-white/5 p-4 rounded-xl space-y-3">
              <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
                <div className="flex items-center gap-2">
                  <Edit2 className="w-4 h-4 text-[#b5a642]" />
                  <span className="font-black uppercase tracking-wider text-white text-xs">New Intentional File Note</span>
                </div>
                
                {/* Note type selector */}
                <div className="flex items-center gap-2">
                  <span className="text-[9px] text-white/40 uppercase font-bold">Category:</span>
                  <select 
                    value={newNoteType}
                    onChange={(e) => setNewNoteType(e.target.value as FileNote["type"])}
                    className="bg-[#111114] border border-white/5 rounded px-2 py-1 text-[10px] uppercase font-bold text-white focus:outline-none"
                  >
                    <option value="general">General Notes</option>
                    <option value="broker">Broker Notes</option>
                    <option value="manager">Manager Notes</option>
                    <option value="lender">Lender Correspondence</option>
                    <option value="underwriting">Underwriting Details</option>
                    <option value="internal">Internal Private</option>
                    <option value="lawyer">Solicitor Information</option>
                    <option value="partner">BDM/Partner Details</option>
                  </select>
                </div>
              </div>

              {/* Text Input */}
              <textarea 
                rows={3}
                required
                value={newNoteContent}
                onChange={(e) => setNewNoteContent(e.target.value)}
                placeholder="Compose professional underwriting notes, compliance updates, phone calls, or file decisions..."
                className="w-full bg-[#101014] border border-white/5 rounded-lg p-3 text-xs text-white placeholder-white/20 focus:outline-none focus:border-[#b5a642]/60 font-semibold"
              />

              {/* Tags & Submit */}
              <div className="flex flex-col sm:flex-row items-center justify-between gap-3">
                <input 
                  type="text" 
                  value={newNoteTags}
                  onChange={(e) => setNewNoteTags(e.target.value)}
                  placeholder="Comma separated tags: (e.g. salary, appraisal, exception)"
                  className="w-full sm:max-w-xs bg-[#101014] border border-white/5 rounded px-2.5 py-1.5 text-[10px] text-white placeholder-white/25 focus:outline-none"
                />

                <button 
                  type="submit"
                  className="w-full sm:w-auto px-4 py-2 bg-[#b5a642]/10 border border-[#b5a642]/30 hover:bg-[#b5a642]/20 rounded-md text-[9px] font-black uppercase tracking-wider text-[#b5a642] flex items-center justify-center gap-1.5 transition-colors"
                >
                  <Send className="w-3.5 h-3.5" /> Log File Note
                </button>
              </div>
            </form>

            {/* Notes List Bubble Rendering */}
            <div className="space-y-3.5">
              {filteredNotes.length === 0 ? (
                <div className="p-8 text-center bg-[#131317]/20 border border-white/5 rounded-xl">
                  <p className="text-white/30 italic">No notes found matching your active filter criteria.</p>
                </div>
              ) : (
                filteredNotes.map(n => {
                  const badge = noteTypeBadges[n.type] || noteTypeBadges["general"];
                  const isEditing = editingNoteId === n.id;

                  return (
                    <div key={n.id} className="p-4 bg-[#131317] border border-white/5 rounded-xl flex flex-col gap-3 hover:border-white/10 transition-colors">
                      <div className="flex items-center justify-between gap-3">
                        <div className="flex items-center gap-2 flex-wrap">
                          <span className="font-black text-white uppercase text-[10px] tracking-wide">{n.author}</span>
                          <span className={`px-2 py-0.5 rounded text-[8px] font-black uppercase tracking-wider border bg-white/5 ${badge.bg}`}>
                            {badge.label}
                          </span>
                        </div>
                        <span className="text-white/30 font-mono text-[9px]">{new Date(n.timestamp).toLocaleString()}</span>
                      </div>

                      {isEditing ? (
                        <div className="space-y-2">
                          <textarea 
                            rows={3}
                            value={editedNoteContent}
                            onChange={(e) => setEditedNoteContent(e.target.value)}
                            className="w-full bg-[#101014] border border-white/5 rounded p-2.5 text-xs text-white focus:outline-none focus:border-[#b5a642]"
                          />
                          <div className="flex justify-end gap-2">
                            <button 
                              onClick={() => setEditingNoteId(null)}
                              className="px-2 py-1 bg-white/5 rounded text-[8.5px] uppercase font-black text-white/50"
                            >
                              Cancel
                            </button>
                            <button 
                              onClick={() => saveEditedNote(n.id)}
                              className="px-2 py-1 bg-[#b5a642]/10 border border-[#b5a642]/20 rounded text-[8.5px] uppercase font-black text-[#b5a642] flex items-center gap-1"
                            >
                              <Save className="w-3 h-3" /> Save Note
                            </button>
                          </div>
                        </div>
                      ) : (
                        <div className="space-y-2">
                          <p className="text-xs text-white/85 font-semibold leading-relaxed whitespace-pre-wrap">{n.content}</p>
                          
                          {/* Tags Rendering */}
                          {n.tags && n.tags.length > 0 && (
                            <div className="flex flex-wrap gap-1.5 pt-1">
                              {n.tags.map(tag => (
                                <span key={tag} className="text-[8px] bg-[#6fa3b8]/5 border border-[#6fa3b8]/10 text-[#6fa3b8] px-1.5 py-0.2 rounded font-mono font-bold">
                                  #{tag}
                                </span>
                              ))}
                            </div>
                          )}

                          {/* Communication Metadata if exists */}
                          {n.communicationDetails && (
                            <div className="mt-2 p-2 bg-black/20 border border-white/[0.02] rounded-lg text-[9px] text-[#8e95a3] flex flex-wrap items-center justify-between gap-3">
                              <div className="flex items-center gap-2 uppercase font-black tracking-wider text-white/50">
                                <Clock className="w-3 h-3" />
                                <span>Type: {n.communicationDetails.type.replace("_", " ")}</span>
                                <span>•</span>
                                <span>Direction: {n.communicationDetails.direction}</span>
                              </div>
                              {n.communicationDetails.nextActionNeeded && (
                                <div className="text-[#b5a642] font-semibold italic text-right">
                                  Action: {n.communicationDetails.nextActionNeeded} (Due: {n.communicationDetails.nextActionDueDate || "Immediate"})
                                </div>
                              )}
                            </div>
                          )}

                          {/* Edit History tracker */}
                          {n.editHistory && n.editHistory.length > 0 && (
                            <span className="text-[7.5px] text-white/20 block font-mono">
                              Edited {n.editHistory.length} times. Last edit by {n.editHistory[n.editHistory.length - 1].editor} at {new Date(n.editHistory[n.editHistory.length - 1].timestamp).toLocaleDateString()}
                            </span>
                          )}

                          {/* Admin tools */}
                          <div className="flex justify-end gap-2 pt-1 border-t border-white/[0.01]">
                            <button 
                              onClick={() => startEditNote(n)}
                              className="text-[9px] text-white/40 hover:text-white uppercase font-bold flex items-center gap-1 transition-colors"
                            >
                              <Edit2 className="w-2.5 h-2.5" /> Edit
                            </button>
                            <button 
                              onClick={() => handleDeleteNote(n.id)}
                              className="text-[9px] text-red-400/50 hover:text-red-400 uppercase font-bold flex items-center gap-1 transition-colors"
                            >
                              <Trash2 className="w-2.5 h-2.5" /> Delete
                            </button>
                          </div>
                        </div>
                      )}
                    </div>
                  );
                })
              )}
            </div>

          </div>
        ) : (
          
          /* ACTIVITY TIMELINE TAB WORKSPACE */
          <div className="space-y-4">
            
            {/* Timeline Filter toolbar */}
            <div className="bg-[#131317] border border-white/5 p-3 rounded-xl flex flex-col sm:flex-row items-center justify-between gap-3">
              <span className="text-[10px] text-[#b5a642] uppercase font-black tracking-widest flex items-center gap-1.5">
                <Clock className="w-4 h-4 shrink-0" /> Unified Operations Audit Trail
              </span>
              
              <div className="flex items-center gap-2 w-full sm:w-auto">
                <Filter className="h-3.5 w-3.5 text-white/30 shrink-0" />
                <select 
                  value={activityFilter}
                  onChange={(e) => setActivityFilter(e.target.value)}
                  className="bg-[#111114] border border-white/5 rounded p-1.5 text-[10px] uppercase font-black tracking-wider text-white focus:outline-none w-full sm:w-auto"
                >
                  <option value="all">All File Events</option>
                  <option value="notes_only">Notes Logs Only</option>
                  <option value="comm_only">Communications</option>
                  <option value="followup_only">Follow-Ups</option>
                  <option value="doc_only">Document Activities</option>
                  <option value="checklist_only">Workflow Changes</option>
                  <option value="stage_only">Stage Changes</option>
                  <option value="compliance_only">Compliance Exception Flags</option>
                </select>
              </div>
            </div>

            {/* Render Chronological List */}
            <div className="relative border-l-2 border-white/5 pl-4 py-1.5 space-y-5">
              {filteredActivities.length === 0 ? (
                <div className="p-8 text-center bg-[#131317]/10 border border-white/5 rounded-xl ml-2">
                  <p className="text-white/30 italic">No operational activity logs found for this filter query.</p>
                </div>
              ) : (
                filteredActivities.map((act) => {
                  // Determine dynamic icons/colors for event types
                  let dotColor = "bg-zinc-500 border-zinc-600";
                  let eventTitleColor = "text-white/95";

                  if (act.eventType === "stage_change") {
                    dotColor = "bg-[#b5a642] border-[#b5a642]";
                    eventTitleColor = "text-[#b5a642] font-black";
                  } else if (act.eventType === "compliance_flagged") {
                    dotColor = "bg-red-500 border-red-500 animate-pulse";
                    eventTitleColor = "text-red-400 font-extrabold";
                  } else if (act.eventType === "document_uploaded" || act.eventType === "document_reviewed") {
                    dotColor = "bg-[#6fa3b8] border-[#6fa3b8]";
                    eventTitleColor = "text-[#6fa3b8] font-bold";
                  } else if (act.eventType === "note_added") {
                    dotColor = "bg-indigo-500 border-indigo-600";
                  } else if (act.eventType === "followup_completed") {
                    dotColor = "bg-green-500 border-green-500";
                  }

                  return (
                    <div key={act.id} className="relative group pl-1 animate-fade-in select-none">
                      {/* Interactive Dot */}
                      <span className={`absolute -left-[21.5px] top-1 w-2.5 h-2.5 rounded-full border-2 border-black ${dotColor} transition-transform group-hover:scale-125`} />
                      
                      <div className="flex items-center justify-between text-[8px] text-white/30 uppercase tracking-widest font-black mb-1.5">
                        <span className="text-white/50">{act.user}</span>
                        <span className="font-mono">{new Date(act.timestamp).toLocaleString()}</span>
                      </div>

                      <div className={`text-xs font-semibold ${eventTitleColor} flex items-center gap-1.5 flex-wrap`}>
                        <span className="uppercase tracking-wider text-[10px] font-black">[{act.eventType.replace("_", " ")}]</span>
                        <span>{act.description}</span>
                      </div>

                      {act.details && (
                        <p className="text-[10px] text-white/45 pl-3 border-l border-white/10 mt-1 italic">
                          {act.details}
                        </p>
                      )}
                    </div>
                  );
                })
              )}
            </div>

          </div>
        )}

      </div>

      {/* RIGHT SECTION: Follow-Ups, Underwriting Warnings, and Metrics Panel */}
      <div className="w-full xl:w-72 shrink-0 space-y-4">
        
        {/* DIAGNOSTIC WARNINGS (MANAGER BOTTLE-NECK WATCH) */}
        <div className="bg-[#131317] border border-white/5 rounded-xl p-4 space-y-3 shadow-md">
          <h4 className="text-[9.5px] text-[#b5a642] uppercase font-black tracking-widest flex items-center gap-1.5 border-b border-white/5 pb-2">
            <AlertTriangle className="w-3.5 h-3.5" /> Underwriting Audit Health
          </h4>

          {/* Warning: File Stale */}
          {auditDiagnostics.isStale && (
            <div className="p-2.5 bg-amber-500/5 border border-amber-500/15 text-amber-400 rounded-lg flex items-start gap-2 text-[10px]">
              <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
              <div>
                <strong className="block font-black uppercase tracking-wider">File Touch Stale</strong>
                <span>Last file outreach or change logged was {auditDiagnostics.lastInteractionDays} days ago. Ensure files are kept updated daily.</span>
              </div>
            </div>
          )}

          {/* Warning: No follow-up scheduled */}
          {!auditDiagnostics.hasPendingFollowUp && (
            <div className="p-2.5 bg-indigo-500/5 border border-indigo-500/15 text-indigo-400 rounded-lg flex items-start gap-2 text-[10px]">
              <Clock className="w-4 h-4 shrink-0 mt-0.5" />
              <div>
                <strong className="block font-black uppercase tracking-wider">No Next Follow-Up</strong>
                <span>No future follow-up outreach is currently scheduled. We advise assigning a task.</span>
              </div>
            </div>
          )}

          {/* Warning: Overdue item exists */}
          {auditDiagnostics.hasOverdue && (
            <div className="p-2.5 bg-red-500/5 border border-red-500/15 text-red-400 rounded-lg flex items-start gap-2 text-[10px]">
              <AlertTriangle className="w-4 h-4 shrink-0 mt-0.5" />
              <div>
                <strong className="block font-black uppercase tracking-wider">Overdue Tasks Active</strong>
                <span>You have {auditDiagnostics.overdueFollowUps.length} follow-up tasks currently sitting overdue.</span>
              </div>
            </div>
          )}

          {/* Warning: Heavy document chases */}
          {auditDiagnostics.isChasingHeavy && (
            <div className="p-2.5 bg-[#b5a642]/5 border border-[#b5a642]/15 text-[#b5a642] rounded-lg flex items-start gap-2 text-[10px]">
              <Archive className="w-4 h-4 shrink-0 mt-0.5" />
              <div>
                <strong className="block font-black uppercase tracking-wider">Excessive Document Chases</strong>
                <span>At least one document requirement has triggered 3+ chases. Escalate to manager review.</span>
              </div>
            </div>
          )}

          {/* Healthy Status Display */}
          {!auditDiagnostics.isStale && auditDiagnostics.hasPendingFollowUp && !auditDiagnostics.hasOverdue && !auditDiagnostics.isChasingHeavy && (
            <div className="p-3 bg-green-500/5 border border-green-500/15 text-green-400 rounded-lg flex items-center gap-2 text-[10px] font-semibold">
              <CheckCircle2 className="w-4.5 h-4.5 shrink-0 text-green-400" />
              <span>File communication cadence and operational follow-ups are fully healthy.</span>
            </div>
          )}
        </div>

        {/* INTEGRATED FOLLOW-UPS TRACKER PANEL */}
        <div className="bg-[#131317] border border-white/5 rounded-xl p-4 space-y-3 shadow-md">
          <div className="flex items-center justify-between border-b border-white/5 pb-2">
            <h4 className="text-[9.5px] text-[#b5a642] uppercase font-black tracking-widest flex items-center gap-1.5">
              <Calendar className="w-3.5 h-3.5" /> Scheduled Follow-Ups
            </h4>
            
            <button 
              onClick={() => setShowAddFollowUp(!showAddFollowUp)}
              className="p-1 bg-white/5 hover:bg-white/10 rounded text-white/60 hover:text-white"
              title="Add follow-up task"
            >
              <Plus className="w-3.5 h-3.5" />
            </button>
          </div>

          {/* Follow-up additions input form inline */}
          {showAddFollowUp && (
            <form onSubmit={handleCreateFollowUp} className="bg-black/20 border border-white/5 p-3 rounded-lg space-y-2.5">
              <div className="space-y-1">
                <label className="text-[8px] text-white/30 uppercase font-black block">Follow-Up Action</label>
                <input 
                  type="text" 
                  required
                  placeholder="e.g. Call client for bank statements"
                  value={followUpTitle}
                  onChange={(e) => setFollowUpTitle(e.target.value)}
                  className="w-full bg-[#111114] border border-white/5 rounded p-1.5 text-xs text-white placeholder-white/20 focus:outline-none"
                />
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div className="space-y-1">
                  <label className="text-[8px] text-white/30 uppercase font-black block">Target Date</label>
                  <input 
                    type="date" 
                    required
                    value={followUpDueDate}
                    onChange={(e) => setFollowUpDueDate(e.target.value)}
                    className="w-full bg-[#111114] border border-white/5 rounded p-1 text-[10px] text-white focus:outline-none"
                  />
                </div>
                
                <div className="space-y-1">
                  <label className="text-[8px] text-white/30 uppercase font-black block">Priority</label>
                  <select 
                    value={followUpPriority}
                    onChange={(e) => setFollowUpPriority(e.target.value as any)}
                    className="w-full bg-[#111114] border border-white/5 rounded p-1 text-[10px] font-bold text-white focus:outline-none"
                  >
                    <option value="low">Low</option>
                    <option value="medium">Medium</option>
                    <option value="high">High</option>
                    <option value="critical">Critical</option>
                  </select>
                </div>
              </div>

              <div className="space-y-1">
                <label className="text-[8px] text-white/30 uppercase font-black block">Owner</label>
                <select 
                  value={followUpOwner}
                  onChange={(e) => setFollowUpOwner(e.target.value)}
                  className="w-full bg-[#111114] border border-white/5 rounded p-1 text-[10px] font-bold uppercase text-white focus:outline-none"
                >
                  {agentNames.map(name => (
                    <option key={name} value={name}>{name}</option>
                  ))}
                </select>
              </div>

              <div className="flex justify-end gap-1.5 pt-1">
                <button 
                  type="button" 
                  onClick={() => setShowAddFollowUp(false)}
                  className="px-2 py-1 bg-white/5 text-white/60 rounded text-[9px] uppercase font-black"
                >
                  Cancel
                </button>
                <button 
                  type="submit" 
                  className="px-2 py-1 bg-[#b5a642]/10 border border-[#b5a642]/20 text-[#b5a642] rounded text-[9px] uppercase font-black"
                >
                  Schedule
                </button>
              </div>
            </form>
          )}

          {/* List Follow-Ups */}
          <div className="space-y-2 max-h-[220px] overflow-y-auto pr-1">
            {followUps.length === 0 ? (
              <p className="text-[10px] text-white/30 italic text-center py-4">No follow-ups recorded on this file.</p>
            ) : (
              followUps.map(fup => {
                const isCompleted = fup.status === "completed";
                const isOverdue = !isCompleted && fup.dueDate < new Date().toISOString().split("T")[0];

                let priorityStyle = "text-zinc-400 bg-zinc-500/10";
                if (fup.priority === "high") priorityStyle = "text-orange-400 bg-orange-500/10";
                if (fup.priority === "critical") priorityStyle = "text-red-400 bg-red-500/10 animate-pulse";

                return (
                  <div 
                    key={fup.id} 
                    className={`p-2.5 rounded-lg border flex items-center justify-between gap-2.5 transition-colors ${
                      isCompleted 
                        ? "bg-green-500/5 border-green-500/10 text-white/40" 
                        : isOverdue
                        ? "bg-red-500/5 border-red-500/15 hover:bg-red-500/10"
                        : "bg-black/20 border-white/5 hover:bg-white/[0.02]"
                    }`}
                  >
                    <div className="flex items-start gap-2 flex-1 min-w-0">
                      {/* Check box control */}
                      <button 
                        onClick={() => handleToggleFollowUp(fup.id)}
                        className={`w-4 h-4 mt-0.5 rounded border flex items-center justify-center shrink-0 transition-colors ${
                          isCompleted ? "bg-green-500 border-green-600 text-black" : "border-white/20 bg-black/40 text-transparent"
                        }`}
                      >
                        <Check className="w-2.5 h-2.5 stroke-[4px]" />
                      </button>

                      <div className="min-w-0 flex-1">
                        <span className={`block font-bold truncate text-[10.5px] ${isCompleted ? "line-through text-white/30 font-medium" : "text-white/80"}`}>
                          {fup.title}
                        </span>
                        
                        <div className="flex items-center gap-2 mt-1 text-[8px] uppercase font-black text-white/35">
                          <span className={`px-1 py-0.2 rounded font-black tracking-widest ${priorityStyle}`}>{fup.priority}</span>
                          <span className={isOverdue ? "text-red-400" : ""}>Due: {fup.dueDate}</span>
                        </div>
                      </div>
                    </div>

                    <button 
                      onClick={() => handleDeleteFollowUp(fup.id)}
                      className="text-[#8e95a3]/40 hover:text-red-400 shrink-0 p-1 rounded"
                    >
                      <Trash2 className="w-3 h-3" />
                    </button>
                  </div>
                );
              })
            )}
          </div>
        </div>

      </div>

      {/* OUTREACH LOGGING MODAL popup */}
      {showLogComm && (
        <div className="fixed inset-0 bg-black/85 z-50 flex items-center justify-center p-4 backdrop-blur-sm select-none animate-fade-in">
          <form 
            onSubmit={handleLogCommunication}
            className="bg-[#131317] border border-white/5 rounded-2xl w-full max-w-md p-5 shadow-2xl relative flex flex-col gap-4 text-xs"
          >
            <h3 className="text-xs font-black uppercase text-[#b5a642] tracking-widest border-b border-white/5 pb-2">
              Log Operations Outreach or Touchpoint
            </h3>

            <div className="grid grid-cols-2 gap-4">
              {/* Comm Type */}
              <div className="space-y-1.5">
                <label className="block text-[8px] text-white/40 uppercase font-black">Outreach Type</label>
                <select 
                  value={commType}
                  onChange={(e) => setCommType(e.target.value as any)}
                  className="w-full bg-[#111114] border border-white/5 rounded p-2 text-white focus:outline-none focus:border-[#b5a642] font-bold uppercase"
                >
                  <option value="phone_call">📞 Phone Call</option>
                  <option value="voicemail">📟 Voicemail</option>
                  <option value="email">✉️ Outgoing Email</option>
                  <option value="sms">💬 SMS / SMS Text</option>
                  <option value="meeting">👥 In-person Meeting</option>
                  <option value="lender_update">🏛️ Lender Underwriter</option>
                  <option value="client_chase">🔄 Document Chase</option>
                  <option value="solicitor">⚖️ Solicitor Lawyer</option>
                </select>
              </div>

              {/* Direction */}
              <div className="space-y-1.5">
                <label className="block text-[8px] text-white/40 uppercase font-black">Outreach Direction</label>
                <select 
                  value={commDirection}
                  onChange={(e) => setCommDirection(e.target.value as any)}
                  className="w-full bg-[#111114] border border-white/5 rounded p-2 text-white focus:outline-none focus:border-[#b5a642] font-bold uppercase"
                >
                  <option value="outgoing">Outgoing Outbound</option>
                  <option value="incoming">Incoming Inbound</option>
                </select>
              </div>
            </div>

            {/* Conversation Summary */}
            <div className="space-y-1.5">
              <label className="block text-[8px] text-white/40 uppercase font-black">Outreach Summary & notes</label>
              <textarea 
                rows={3}
                required
                value={commSummary}
                onChange={(e) => setCommSummary(e.target.value)}
                placeholder="Log exact discussion parameters, files discussed, lender confirmation numbers, or follow up promises..."
                className="w-full bg-[#111114] border border-white/5 rounded p-2 text-white focus:outline-none focus:border-[#b5a642] font-semibold"
              />
            </div>

            {/* Next Action Scheduling */}
            <div className="border-t border-white/5 pt-3.5 space-y-3">
              <span className="text-[9px] text-[#b5a642] font-black uppercase tracking-widest block">Optionally Schedule Future Follow-Up Outreach</span>
              
              <div className="space-y-1.5">
                <label className="block text-[8px] text-white/40 uppercase font-black">Next Planned Action</label>
                <input 
                  type="text" 
                  value={commNextStep}
                  onChange={(e) => setCommNextStep(e.target.value)}
                  placeholder="e.g. Call client back to confirm receipt of paystub files"
                  className="w-full bg-[#111114] border border-white/5 rounded p-2 text-white focus:outline-none"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <label className="block text-[8px] text-white/40 uppercase font-black">Planned Action Due Date</label>
                  <input 
                    type="date" 
                    value={commNextDueDate}
                    onChange={(e) => setCommNextDueDate(e.target.value)}
                    className="w-full bg-[#111114] border border-white/5 rounded p-1.5 text-white focus:outline-none"
                  />
                </div>
              </div>
            </div>

            {/* Controls */}
            <div className="flex justify-end gap-2.5 border-t border-white/5 pt-3">
              <button 
                type="button" 
                onClick={() => setShowLogComm(false)}
                className="px-3 py-1.5 bg-white/5 hover:bg-white/10 text-white/60 rounded-lg text-[9px] font-black uppercase border border-white/5"
              >
                Cancel
              </button>
              <button 
                type="submit" 
                className="px-3 py-1.5 bg-[#b5a642]/10 border border-[#b5a642]/30 hover:bg-[#b5a642]/20 text-[#b5a642] rounded-lg text-[9px] font-black uppercase flex items-center gap-1.5"
              >
                <Check className="w-3.5 h-3.5" /> Log Touchpoint
              </button>
            </div>
          </form>
        </div>
      )}

    </div>
  );
};
