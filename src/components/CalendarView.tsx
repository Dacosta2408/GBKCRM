import React, { useState, useMemo, useEffect, useRef } from "react";
import { 
  motion, AnimatePresence 
} from "motion/react";
import { 
  Calendar as CalendarIcon, Clock, ChevronLeft, ChevronRight, 
  Plus, CheckSquare, Edit3, Trash2, X, AlertCircle, HelpCircle, 
  Check, Info, Sparkles, User, ListFilter, Layers, ArrowRight,
  MapPin, Bell, Star, AlertTriangle, Play
} from "lucide-react";
import { Event, Task, Client } from "../types";

// Extended Event typing for optional duration support (in minutes)
interface CalendarEvent extends Event {
  duration?: number; // duration in minutes
}

// Helper to match events with flexible 15-minute slot range
const isEventInSlot = (evTime: string | undefined, slotTime: string): boolean => {
  if (!evTime) return false;
  const [evH, evM] = evTime.split(":").map(Number);
  if (isNaN(evH) || isNaN(evM)) return false;
  const evMins = evH * 60 + evM;

  const [slotH, slotM] = slotTime.split(":").map(Number);
  if (isNaN(slotH) || isNaN(slotM)) return false;
  const slotMins = slotH * 60 + slotM;

  return evMins >= slotMins && evMins < slotMins + 15;
};

interface CalendarViewProps {
  events: Event[];
  setEvents: React.Dispatch<React.SetStateAction<Event[]>>;
  tasks: Task[];
  setTasks: React.Dispatch<React.SetStateAction<Task[]>>;
  clients: Client[];
  showToast: (msg: string, type?: "success" | "error" | "info" | "warning", icon?: string) => void;
}

export const CalendarView: React.FC<CalendarViewProps> = ({
  events,
  setEvents,
  tasks,
  setTasks,
  clients,
  showToast
}) => {
  // Navigation & view mode controls
  const [currentDate, setCurrentDate] = useState<Date>(() => new Date());
  const [selectedDateStr, setSelectedDateStr] = useState<string>(() => new Date().toISOString().split("T")[0]);
  const [filterType, setFilterType] = useState<string>("all");
  const [viewMode, setViewMode] = useState<"day" | "week" | "month" | "list">("week");

  // Scroll handler for timelines
  const timelineScrollRef = useRef<HTMLDivElement>(null);

  // Auto scroll to business hours (08:00 AM) inside Day/Week timelines on render
  useEffect(() => {
    if (viewMode === "day" || viewMode === "week") {
      setTimeout(() => {
        const matchingElem = document.getElementById("hour-slot-08");
        if (matchingElem && timelineScrollRef.current) {
          timelineScrollRef.current.scrollTop = matchingElem.offsetTop - 40;
        }
      }, 100);
    }
  }, [viewMode, selectedDateStr]);

  // Task & Event editing wizardry
  const [isEventModalOpen, setIsEventModalOpen] = useState(false);
  const [editingEvent, setEditingEvent] = useState<Event | null>(null);

  // Form states and enhancements
  const [eventTitle, setEventTitle] = useState("");
  const [eventDate, setEventDate] = useState("");
  const [eventTime, setEventTime] = useState("");
  const [eventDuration, setEventDuration] = useState<number>(60); // Default minutes
  const [eventType, setEventType] = useState<Event["type"]>("meeting");
  const [eventNotes, setEventNotes] = useState("");
  const [eventClientId, setEventClientId] = useState<string>("");

  // Helpers to fetch month and year details
  const currentMonth = currentDate.getMonth();
  const currentYear = currentDate.getFullYear();

  const monthNames = [
    "January", "February", "March", "April", "May", "June", 
    "July", "August", "September", "October", "November", "December"
  ];

  // List of event types with professional visual parameters
  const eventTypes = [
    { value: "meeting", label: "Meeting / Call", color: "bg-amber-500", border: "border-amber-500/25", text: "text-amber-400", lightBg: "bg-amber-500/10", glow: "shadow-[0_0_12px_rgba(245,158,11,0.15)]" },
    { value: "client", label: "Client Deadline", color: "bg-rose-500", border: "border-rose-500/25", text: "text-rose-400", lightBg: "bg-rose-500/10", glow: "shadow-[0_0_12px_rgba(244,63,94,0.15)]" },
    { value: "lender", label: "Lender Review", color: "bg-cyan-500", border: "border-cyan-500/25", text: "text-cyan-400", lightBg: "bg-cyan-500/10", glow: "shadow-[0_0_12px_rgba(6,182,212,0.15)]" },
    { value: "personal", label: "Personal Task", color: "bg-violet-500", border: "border-violet-500/25", text: "text-violet-400", lightBg: "bg-violet-500/10", glow: "shadow-[0_0_12px_rgba(139,92,246,0.15)]" },
    { value: "holiday", label: "Stat Holiday", color: "bg-emerald-500", border: "border-emerald-500/25", text: "text-emerald-400", lightBg: "bg-emerald-500/10", glow: "shadow-[0_0_12px_rgba(16,185,129,0.15)]" },
    { value: "birthday", label: "Birthday Greeting", color: "bg-pink-500", border: "border-pink-500/25", text: "text-pink-400", lightBg: "bg-pink-500/10", glow: "shadow-[0_0_12px_rgba(236,72,153,0.15)]" }
  ];

  const getTypeColor = (type: string) => {
    return eventTypes.find(t => t.value === type) || {
      color: "bg-gray-500",
      border: "border-gray-500/25",
      text: "text-gray-400",
      lightBg: "bg-gray-500/10",
      glow: ""
    };
  };

  // Build current week dates based on selectedDateStr (Mon-Sun)
  const weekDays = useMemo(() => {
    const selected = new Date(selectedDateStr + "T00:00:00");
    const dayOfWeek = selected.getDay(); // 0 is Sunday, 1 is Monday...
    const diff = selected.getDate() - dayOfWeek + (dayOfWeek === 0 ? -6 : 1);
    const monday = new Date(selected.setDate(diff));

    const days = [];
    for (let i = 0; i < 7; i++) {
      const day = new Date(monday);
      day.setDate(monday.getDate() + i);
      const dateStr = day.toISOString().split("T")[0];
      days.push({
        dateStr,
        dayNum: day.getDate(),
        dayLabel: day.toLocaleDateString("en-US", { weekday: "short" }), // e.g., "Mon"
        fullLabel: day.toLocaleDateString("en-US", { month: "short", day: "numeric" }),
        isToday: dateStr === new Date().toISOString().split("T")[0],
        isCurrentMonth: day.getMonth() === currentMonth
      });
    }
    return days;
  }, [selectedDateStr, currentMonth]);

  // Build monthly grid dates
  const monthDays = useMemo(() => {
    const firstDayOfMonth = new Date(currentYear, currentMonth, 1);
    const lastDayOfMonth = new Date(currentYear, currentMonth + 1, 0);

    const firstDayIndex = firstDayOfMonth.getDay(); 
    const totalDays = lastDayOfMonth.getDate();
    const prevMonthLastDay = new Date(currentYear, currentMonth, 0).getDate();

    const days: { dateStr: string; dayNum: number; isCurrentMonth: boolean; isToday: boolean }[] = [];

    // Prev month padding
    const paddingCount = firstDayIndex === 0 ? 6 : firstDayIndex - 1; // Align to start on Monday
    for (let i = paddingCount - 1; i >= 0; i--) {
      const dayNum = prevMonthLastDay - i;
      const m = currentMonth === 0 ? 11 : currentMonth - 1;
      const y = currentMonth === 0 ? currentYear - 1 : currentYear;
      const dateStr = `${y}-${String(m + 1).padStart(2, "0")}-${String(dayNum).padStart(2, "0")}`;
      days.push({
        dateStr,
        dayNum,
        isCurrentMonth: false,
        isToday: dateStr === new Date().toISOString().split("T")[0]
      });
    }

    // Current month
    for (let i = 1; i <= totalDays; i++) {
      const dateStr = `${currentYear}-${String(currentMonth + 1).padStart(2, "0")}-${String(i).padStart(2, "0")}`;
      days.push({
        dateStr,
        dayNum: i,
        isCurrentMonth: true,
        isToday: dateStr === new Date().toISOString().split("T")[0]
      });
    }

    // Next month padding to fill grid
    const remaining = 42 - days.length;
    for (let i = 1; i <= remaining; i++) {
      const m = currentMonth === 11 ? 0 : currentMonth + 1;
      const y = currentMonth === 11 ? currentYear + 1 : currentYear;
      const dateStr = `${y}-${String(m + 1).padStart(2, "0")}-${String(i).padStart(2, "0")}`;
      days.push({
        dateStr,
        dayNum: i,
        isCurrentMonth: false,
        isToday: dateStr === new Date().toISOString().split("T")[0]
      });
    }

    return days;
  }, [currentMonth, currentYear]);

  // Navigate month
  const prevMonth = () => {
    setCurrentDate(new Date(currentYear, currentMonth - 1, 1));
  };
  const nextMonth = () => {
    setCurrentDate(new Date(currentYear, currentMonth + 1, 1));
  };

  // Navigate days/weeks
  const prevTimeFrame = () => {
    if (viewMode === "day") {
      const current = new Date(selectedDateStr + "T00:00:00");
      current.setDate(current.getDate() - 1);
      const nextStr = current.toISOString().split("T")[0];
      setSelectedDateStr(nextStr);
      setCurrentDate(current);
    } else if (viewMode === "week") {
      const current = new Date(selectedDateStr + "T00:00:00");
      current.setDate(current.getDate() - 7);
      const nextStr = current.toISOString().split("T")[0];
      setSelectedDateStr(nextStr);
      setCurrentDate(current);
    } else {
      prevMonth();
    }
  };

  const nextTimeFrame = () => {
    if (viewMode === "day") {
      const current = new Date(selectedDateStr + "T00:00:00");
      current.setDate(current.getDate() + 1);
      const nextStr = current.toISOString().split("T")[0];
      setSelectedDateStr(nextStr);
      setCurrentDate(current);
    } else if (viewMode === "week") {
      const current = new Date(selectedDateStr + "T00:00:00");
      current.setDate(current.getDate() + 7);
      const nextStr = current.toISOString().split("T")[0];
      setSelectedDateStr(nextStr);
      setCurrentDate(current);
    } else {
      nextMonth();
    }
  };

  const goToToday = () => {
    const today = new Date();
    const todayStr = today.toISOString().split("T")[0];
    setSelectedDateStr(todayStr);
    setCurrentDate(today);
  };

  // Select a cell
  const selectDay = (dateStr: string) => {
    setSelectedDateStr(dateStr);
    const d = new Date(dateStr + "T00:00:00");
    setCurrentDate(d);
  };

  // Memoized lists based on selections
  const selectedDayInfo = useMemo(() => {
    const d = new Date(selectedDateStr + "T00:00:00");
    const label = d.toLocaleDateString("en-CA", { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' });
    const dayEvs = events.filter(e => e.date === selectedDateStr);
    const dayTs = tasks.filter(t => t.dueDate === selectedDateStr);
    return {
      dateStr: selectedDateStr,
      label,
      events: dayEvs,
      tasks: dayTs
    };
  }, [selectedDateStr, events, tasks]);

  // Dynamic filter lists
  const filteredEventsForMonth = useMemo(() => {
    return events.filter(e => filterType === "all" || e.type === filterType);
  }, [events, filterType]);

  // Overdue and open tasks count
  const openTasks = useMemo(() => {
    return tasks.filter(t => t.status === "open");
  }, [tasks]);

  // Interactive Task checking
  const toggleTaskStatus = (taskId: string) => {
    setTasks(prev => prev.map(t => {
      if (t.id === taskId) {
        const nextStatus = t.status === "open" ? "done" : "open";
        showToast(nextStatus === "done" ? "Workflow task completed!" : "Task marked outstanding", "success", "✓");
        return { ...t, status: nextStatus, updatedAt: new Date().toISOString() };
      }
      return t;
    }));
  };

  // Schedule an existing Task onto the timeline
  const scheduleTaskOntoTimeline = (task: Task, timeStr: string) => {
    // Generates calendar event out of selected task
    const newEv: Event = {
      id: `ev_task_${Date.now()}`,
      title: `[TASK Task] ${task.title}`,
      date: selectedDateStr,
      time: timeStr,
      type: task.priority === "high" ? "client" : "personal",
      notes: task.notes || "Auto-scheduled from tasks queue.",
      clientId: task.clientId || null,
      createdBy: "Automated Desk"
    };

    setEvents(prev => [...prev, newEv]);
    
    // Set task to complete or linked
    setTasks(prev => prev.map(t => {
      if (t.id === task.id) {
        return { ...t, status: "done", notes: `Scheduled: ${selectedDateStr} @ ${timeStr}. ` + (t.notes || "") };
      }
      return t;
    }));

    showToast(`Task successfully booked on selected date timeline!`, "success", "🗓️");
  };

  // Open modal handlers
  const handleOpenAddModal = (dateStr?: string, timeStr?: string) => {
    setEditingEvent(null);
    setEventTitle("");
    setEventDate(dateStr || selectedDateStr);
    setEventTime(timeStr || "09:00");
    setEventDuration(60);
    setEventType("meeting");
    setEventNotes("");
    setEventClientId("");
    setIsEventModalOpen(true);
  };

  const handleOpenEditModal = (event: any) => {
    setEditingEvent(event);
    setEventTitle(event.title);
    setEventDate(event.date);
    setEventTime(event.time || "09:00");
    setEventDuration(event.duration || 60);
    setEventType(event.type);
    setEventNotes(event.notes || "");
    setEventClientId(event.clientId || "");
    setIsEventModalOpen(true);
  };

  // Save changes
  const saveEvent = (e: React.FormEvent) => {
    e.preventDefault();
    if (!eventTitle.trim()) {
      showToast("Please enter an event title.", "error", "⚠️");
      return;
    }

    if (editingEvent) {
      setEvents(prev => prev.map(ev => {
        if (ev.id === editingEvent.id) {
          return {
            ...ev,
            title: eventTitle.trim(),
            date: eventDate,
            time: eventTime || undefined,
            type: eventType,
            clientId: eventClientId || null,
            notes: eventNotes.trim(),
            duration: eventDuration // save extended property
          } as any;
        }
        return ev;
      }));
      showToast("Timeline entry updated!", "success", "✓");
    } else {
      const newEv: any = {
        id: `ev_${Date.now()}`,
        title: eventTitle.trim(),
        date: eventDate,
        time: eventTime || undefined,
        type: eventType,
        clientId: eventClientId || null,
        notes: eventNotes.trim(),
        duration: eventDuration,
        createdBy: "User"
      };
      setEvents(prev => [...prev, newEv]);
      showToast("Appointed scheduled to timeline!", "success", "📅");
    }

    setIsEventModalOpen(false);
  };

  // Delete event
  const handleRemoveEvent = (eventId: string) => {
    if (window.confirm("Delete this scheduled event from timeline?")) {
      setEvents(prev => prev.filter(e => e.id !== eventId));
      showToast("Event removed from timeline.", "info", "🗑️");
      setIsEventModalOpen(false);
    }
  };

  // Helper arrays for timeline increments & 24 hours format
  // 24 Hour blocks from 00:00 to 24:00
  const hoursOfDay = useMemo(() => {
    const blocks = [];
    for (let h = 0; h < 24; h++) {
      const hourStr = String(h).padStart(2, "0");
      blocks.push({
        num: h,
        label: `${hourStr}:00`,
        slots: [
          { time: `${hourStr}:00`, label: ":00" },
          { time: `${hourStr}:15`, label: ":15" },
          { time: `${hourStr}:30`, label: ":30" },
          { time: `${hourStr}:45`, label: ":45" }
        ]
      });
    }
    return blocks;
  }, []);

  // Check if an event falls inside a slot range
  // Let's compute if an event is starting at a given hour / minute slot
  const getEventsForTimeSlot = (dateStr: string, timeSlot: string) => {
    return events.filter(ev => ev.date === dateStr && isEventInSlot(ev.time, timeSlot) && (filterType === "all" || ev.type === filterType));
  };

  return (
    <div className="flex-1 flex flex-col xl:flex-row h-full min-h-0 bg-[#0c0c0e] select-none text-left" id="broker-calendar-panel">
      
      {/* LEFT COLUMN: Mini Monthly Picker, Categories and Quick Tasks Queue */}
      <div className="w-full xl:w-80 shrink-0 border-b xl:border-b-0 xl:border-r border-white/5 flex flex-col min-h-0 bg-[#101014]/40 overflow-y-auto p-4 space-y-5">
        
        {/* Compact Month Mini-Picker Widget */}
        <div className="bg-[#141418] border border-white/5 rounded-2xl p-3.5">
          <div className="flex items-center justify-between mb-2">
            <span className="text-[12px] font-extrabold text-[#b5a642] tracking-wider uppercase font-sans">
              {monthNames[currentMonth]} {currentYear}
            </span>
            <div className="flex items-center gap-1">
              <button 
                onClick={prevMonth}
                className="p-1 border border-white/5 bg-[#1b1b20] rounded hover:bg-white/5 transition-all"
              >
                <ChevronLeft className="w-3.5 h-3.5 text-white/50 hover:text-white" />
              </button>
              <button 
                onClick={nextMonth}
                className="p-1 border border-white/5 bg-[#1b1b20] rounded hover:bg-white/5 transition-all"
              >
                <ChevronRight className="w-3.5 h-3.5 text-white/50 hover:text-white" />
              </button>
            </div>
          </div>

          {/* Days Week labels */}
          <div className="grid grid-cols-7 text-center text-[9px] uppercase font-bold text-white/30 tracking-wider mb-1.5">
            {["Mo", "Tu", "We", "Th", "Fr", "Sa", "Su"].map(d => <div key={d}>{d}</div>)}
          </div>

          {/* Month grid days */}
          <div className="grid grid-cols-7 gap-1">
            {monthDays.map((md, idx) => {
              const worksOnThisDate = events.some(e => e.date === md.dateStr);
              const isSelected = selectedDateStr === md.dateStr;
              
              return (
                <button
                  key={idx}
                  onClick={() => selectDay(md.dateStr)}
                  className={`h-7 w-7 text-[10px] font-bold rounded-lg flex flex-col items-center justify-center relative transition-all ${
                    isSelected 
                      ? "bg-[#b5a642] text-black font-extrabold shadow-[0_0_12px_rgba(181,166,66,0.3)]"
                      : md.isToday 
                        ? "bg-white/10 text-white border border-white/20"
                        : md.isCurrentMonth
                          ? "text-white/80 hover:bg-white/5"
                          : "text-white/20 hover:text-white/40"
                  }`}
                >
                  <span>{md.dayNum}</span>
                  {/* Event indicator dot */}
                  {worksOnThisDate && !isSelected && (
                    <span className="absolute bottom-1 w-1 h-1 rounded-full bg-[#b5a642]" />
                  )}
                </button>
              );
            })}
          </div>
        </div>

        {/* Categories Color-Coded Filter List */}
        <div className="bg-[#141418] border border-white/5 rounded-2xl p-3.5">
          <h4 className="text-[10.5px] font-extrabold text-white/40 uppercase tracking-widest mb-3 flex items-center gap-1.5">
            <Layers className="w-3.5 h-3.5 text-[#b5a642]" /> 
            Categories Legend
          </h4>
          <div className="space-y-2">
            <button
              onClick={() => setFilterType("all")}
              className={`w-full flex items-center justify-between p-2 rounded-xl text-left border text-[11px] font-bold transition-all ${
                filterType === "all" 
                  ? "bg-[#b5a642]/10 border-[#b5a642]/25 text-[#b5a642]" 
                  : "bg-transparent border-transparent text-white/55 hover:bg-white/5 hover:text-white"
              }`}
            >
              <span className="flex items-center gap-2">
                <span className="w-2.5 h-2.5 rounded-full bg-white/70" />
                All Activities
              </span>
              <span className="font-mono text-[10px] opacity-60">({events.length})</span>
            </button>

            {eventTypes.map(et => {
              const count = events.filter(e => e.type === et.value).length;
              return (
                <button
                  key={et.value}
                  onClick={() => setFilterType(et.value)}
                  className={`w-full flex items-center justify-between p-2 rounded-xl text-left border text-[11px] font-bold transition-all ${
                    filterType === et.value 
                      ? `${et.lightBg} ${et.border} ${et.text}` 
                      : "bg-transparent border-transparent text-white/55 hover:bg-[#1b1b20]/50 hover:text-white"
                  }`}
                >
                  <span className="flex items-center gap-2">
                    <span className={`w-2.5 h-2.5 rounded-full ${et.color} ${et.glow}`} />
                    {et.label}
                  </span>
                  <span className="font-mono text-[10px] opacity-50">({count})</span>
                </button>
              );
            })}
          </div>
        </div>

        {/* Tasks Hub Connection Panel */}
        <div className="bg-[#141418] border border-white/5 rounded-2xl p-3.5 flex-1 flex flex-col min-h-0">
          <div className="flex items-center justify-between mb-3 shrink-0">
            <h4 className="text-[10.5px] font-extrabold text-white/40 uppercase tracking-widest flex items-center gap-1.5">
              <CheckSquare className="w-3.5 h-3.5 text-emerald-400" /> 
              Tasks to Schedule
            </h4>
            <span className="text-[9px] bg-emerald-500/10 text-emerald-400 font-extrabold border border-emerald-500/15 rounded-md px-1.5 py-0.5 font-mono">
              {openTasks.length} pending
            </span>
          </div>

          <p className="text-[10px] text-white/40 mb-3 leading-relaxed shrink-0">
            Click on the green play arrow to instantly book any pending file target directly into the selected date timeline!
          </p>

          <div className="flex-1 overflow-y-auto space-y-2.5 pr-1 min-h-[160px]">
            {openTasks.length === 0 ? (
              <div className="h-full flex flex-col justify-center items-center py-6 text-center text-white/20 select-none">
                <Check className="w-5 h-5 text-emerald-500 opacity-60 mb-2" />
                <span className="text-[10px] font-bold uppercase tracking-wider">All Tasks Slated</span>
              </div>
            ) : (
              openTasks.map(t => (
                <div 
                  key={t.id}
                  className="p-2.5 bg-[#1b1b20]/60 border border-white/5 rounded-xl flex items-start justify-between gap-1.5 hover:border-white/10 transition-colors group"
                >
                  <div className="min-w-0 flex-1">
                    <span className="text-[11px] font-bold text-white/95 line-clamp-2 leading-tight">
                      {t.title}
                    </span>
                    {t.clientName && (
                      <span className="text-[9px] text-[#b5a642] font-semibold block mt-1">
                        File: {t.clientName}
                      </span>
                    )}
                  </div>

                  <button
                    onClick={() => scheduleTaskOntoTimeline(t, "10:00")}
                    className="p-1 px-1.5 bg-emerald-500/10 hover:bg-emerald-500 hover:text-black border border-emerald-500/20 text-emerald-400 rounded-lg text-[9px] font-black transition-all flex items-center gap-0.5 shrink-0"
                    title="Schedule at 10:00 AM"
                  >
                    <Play className="w-2.5 h-2.5 fill-current" />
                    Book
                  </button>
                </div>
              ))
            )}
          </div>
        </div>

      </div>

      {/* RIGHT COLUMN: Chronological Timeline Canvas & Multi-Views */}
      <div className="flex-grow flex flex-col min-h-0 p-5">
        
        {/* Timeline Navigation Custom Header */}
        <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4 mb-4 border-b border-white/5 pb-4 shrink-0">
          <div>
            <div className="flex items-center gap-2 text-xs font-bold text-white/40 font-mono mb-1">
              <span>ONTARIO LOAN PORTFOLIO SYSTEM</span>
              <span className="h-1.5 w-1.5 bg-green-500 rounded-full animate-pulse" />
              <span className="text-green-400 text-[9px] uppercase tracking-wider">Live Scheduler Connected</span>
            </div>
            
            <h2 className="text-lg font-black text-white flex items-center gap-2">
              {viewMode === "day" && selectedDayInfo.label}
              {viewMode === "week" && `Week Agenda Framework: ${weekDays[0]?.fullLabel} - ${weekDays[6]?.fullLabel}, ${currentYear}`}
              {viewMode === "month" && `Broker Month Grid: ${monthNames[currentMonth]} ${currentYear}`}
              {viewMode === "list" && "Full Agenda Backlog Index"}
            </h2>
          </div>

          <div className="flex items-center gap-2 self-stretch md:self-auto justify-between md:justify-end">
            {/* View Multi-Tabs Segmented control */}
            <div className="bg-[#141418] border border-white/5 p-1 rounded-xl flex items-center">
              <button 
                onClick={() => setViewMode("day")}
                className={`px-3 py-1.5 text-xs font-extrabold rounded-lg transition-all ${viewMode === "day" ? "bg-[#b5a642] text-black" : "text-white/45 hover:text-white"}`}
              >
                Day Timeline
              </button>
              <button 
                onClick={() => setViewMode("week")}
                className={`px-3 py-1.5 text-xs font-extrabold rounded-lg transition-all ${viewMode === "week" ? "bg-[#b5a642] text-black" : "text-white/45 hover:text-white"}`}
              >
                Week Timeline
              </button>
              <button 
                onClick={() => setViewMode("month")}
                className={`px-3 py-1.5 text-xs font-extrabold rounded-lg transition-all ${viewMode === "month" ? "bg-[#b5a642] text-black" : "text-white/45 hover:text-white"}`}
              >
                Month
              </button>
              <button 
                onClick={() => setViewMode("list")}
                className={`px-3 py-1.5 text-xs font-extrabold rounded-lg transition-all ${viewMode === "list" ? "bg-[#b5a642] text-black" : "text-white/45 hover:text-white"}`}
              >
                List
              </button>
            </div>

            {/* Quick action buttons */}
            <div className="flex items-center gap-1.5">
              <button 
                onClick={prevTimeFrame}
                className="p-2 border border-white/5 bg-[#141418] rounded-xl hover:bg-white/5 transition-all text-white/70"
                title="Previous schedule page"
              >
                <ChevronLeft className="w-4 h-4" />
              </button>
              <button 
                onClick={goToToday}
                className="px-3.5 py-2 border border-[#b5a642]/20 text-[#b5a642] bg-[#b5a642]/5 font-extrabold rounded-xl text-xs hover:bg-[#b5a642]/15 transition-all"
              >
                Get Today
              </button>
              <button 
                onClick={nextTimeFrame}
                className="p-2 border border-white/5 bg-[#141418] rounded-xl hover:bg-white/5 transition-all text-white/70"
                title="Next schedule page"
              >
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>
          </div>
        </div>

        {/* TIME STICKER BAR FOR TIMELINE DAY/WEEK RANGE */}
        <div className="flex-1 min-h-0 flex flex-col bg-[#141418]/30 border border-white/5 rounded-2xl overflow-hidden select-none">
          
          {/* VIEW CASE 1: DAY TIMELINE VIEW (Clean Chronological Day Agenda) */}
          {viewMode === "day" && (
            <div className="flex-1 flex flex-col min-h-0 bg-[#0c0c0e]/30" id="view-timeline-day">
              {/* Day header */}
              <div className="p-4 bg-[#141418] border-b border-white/5 flex items-center justify-between shrink-0 select-none">
                <div className="flex items-center gap-2">
                  <span className="text-xs font-bold text-white/60 uppercase tracking-wide">Schedule for:</span>
                  <span className="text-xs font-extrabold text-[#b5a642] uppercase tracking-wider">{selectedDayInfo.label}</span>
                </div>
                <button
                  onClick={() => handleOpenAddModal(selectedDateStr)}
                  className="px-3 py-1.5 bg-[#b5a642]/10 border border-[#b5a642]/20 hover:bg-[#b5a642]/20 text-[#b5a642] font-bold text-[11px] rounded-lg transition-all flex items-center gap-1"
                >
                  <Plus className="w-3.5 h-3.5" /> Book Appointment
                </button>
              </div>

              {/* Agenda list container */}
              <div className="flex-1 overflow-y-auto p-4 space-y-3">
                {selectedDayInfo.events.length === 0 ? (
                  <div className="h-full flex flex-col justify-center items-center py-20 text-center select-none">
                    <div className="p-4 bg-[#141418] border border-white/5 rounded-2xl mb-3 text-white/20">
                      <CalendarIcon className="w-8 h-8 opacity-40" />
                    </div>
                    <h4 className="text-xs font-bold text-white/80 uppercase tracking-wider">No Scheduled Items Today</h4>
                    <p className="text-[10px] text-white/40 mt-1 max-w-xs">
                      This date has no recorded meetings, lender reviews, or client actions scheduled yet.
                    </p>
                    <button
                      onClick={() => handleOpenAddModal(selectedDateStr)}
                      className="mt-4 px-4 py-2 bg-[#b5a642] text-black hover:bg-[#9a8c38] font-bold text-xs rounded-xl flex items-center gap-1.5 transition-all"
                    >
                      <Plus className="w-4 h-4" /> Schedule First Item
                    </button>
                  </div>
                ) : (
                  selectedDayInfo.events
                    .sort((a, b) => (a.time || "").localeCompare(b.time || ""))
                    .map(ev => {
                      const scheme = getTypeColor(ev.type);
                      const matchedClient = clients.find(c => c.id === ev.clientId);
                      return (
                        <div
                          key={ev.id}
                          className="p-4 bg-[#141418]/80 border border-white/5 hover:border-white/10 rounded-xl transition-all flex flex-col sm:flex-row sm:items-center justify-between gap-4 group text-left"
                        >
                          <div className="flex items-start gap-4 min-w-0">
                            {/* Time badge */}
                            <div className="flex flex-col items-center justify-center shrink-0 w-16 p-2 bg-black/30 border border-white/5 rounded-xl font-mono">
                              <span className="text-xs font-extrabold text-white">{ev.time || "All Day"}</span>
                              <span className="text-[9px] text-white/40 mt-0.5 uppercase tracking-wider">
                                {ev.duration ? `${ev.duration}m` : "60m"}
                              </span>
                            </div>

                            {/* Info */}
                            <div className="min-w-0">
                              <div className="flex flex-wrap items-center gap-2">
                                <h4 className="text-sm font-bold text-white group-hover:text-[#b5a642] transition-colors truncate">
                                  {ev.title}
                                </h4>
                                <span className={`text-[9px] font-bold uppercase tracking-wider px-2 py-0.5 rounded border ${scheme.lightBg} ${scheme.border} ${scheme.text} ${scheme.glow}`}>
                                  {ev.type}
                                </span>
                              </div>
                              {ev.notes && (
                                <p className="text-[11px] text-white/50 mt-1.5 leading-relaxed">
                                  {ev.notes}
                                </p>
                              )}
                              {matchedClient && (
                                <div className="mt-2 flex items-center gap-1.5 text-[10px] text-[#b5a642] font-semibold">
                                  <User className="w-3.5 h-3.5" />
                                  <span>Client File: {matchedClient.first} {matchedClient.last}</span>
                                </div>
                              )}
                            </div>
                          </div>

                          {/* Quick Actions */}
                          <div className="flex items-center gap-1.5 sm:self-center shrink-0 justify-end sm:opacity-0 group-hover:opacity-100 transition-opacity">
                            <button
                              onClick={() => handleOpenEditModal(ev)}
                              className="p-1.5 px-2 bg-white/5 border border-white/5 rounded-lg text-white/50 hover:text-[#b5a642] hover:bg-white/10 transition-all text-[10px] font-bold flex items-center gap-1"
                            >
                              <Edit3 className="w-3.5 h-3.5" /> Edit
                            </button>
                            <button
                              onClick={() => handleRemoveEvent(ev.id)}
                              className="p-1.5 px-2 bg-red-500/10 border border-red-500/10 rounded-lg text-red-400 hover:bg-red-500/20 transition-all text-[10px] font-bold flex items-center gap-1"
                            >
                              <Trash2 className="w-3.5 h-3.5" /> Delete
                            </button>
                          </div>
                        </div>
                      );
                    })
                )}
              </div>
            </div>
          )}

          {/* VIEW CASE 2: WEEK TIMELINE GRID (Clean 7-Day Agenda Columns) */}
          {viewMode === "week" && (
            <div className="flex-1 flex flex-col min-h-0 bg-[#0c0c0e]/30" id="view-timeline-week">
              {/* Header summary info */}
              <div className="p-3 bg-[#141418] border-b border-white/5 flex items-center justify-between shrink-0 select-none text-[10.5px]">
                <span className="font-bold text-white/60">Weekly Agenda Schedule</span>
                <span className="text-[#b5a642] font-mono font-bold tracking-wider">Active Month Grid Sync</span>
              </div>

              {/* Columns container */}
              <div className="flex-1 overflow-x-auto overflow-y-hidden p-4 flex gap-4 min-w-0 h-full">
                {weekDays.map(wd => {
                  const dayEvents = events.filter(e => e.date === wd.dateStr && (filterType === "all" || e.type === filterType));
                  const isDaySelected = selectedDateStr === wd.dateStr;

                  return (
                    <div
                      key={wd.dateStr}
                      className={`flex-1 min-w-[200px] bg-[#141418]/45 border rounded-2xl flex flex-col min-h-0 transition-all ${
                        isDaySelected 
                          ? "border-[#b5a642]/30 bg-[#141418]/70 ring-1 ring-[#b5a642]/10" 
                          : wd.isToday 
                            ? "border-white/10 bg-[#141418]/60" 
                            : "border-white/5"
                      }`}
                    >
                      {/* Day Header */}
                      <div className="p-3 border-b border-white/5 flex items-center justify-between shrink-0 bg-black/10 rounded-t-2xl">
                        <div 
                          onClick={() => selectDay(wd.dateStr)}
                          className="cursor-pointer group flex flex-col text-left"
                        >
                          <span className={`text-[9px] uppercase font-bold tracking-widest ${isDaySelected ? "text-[#b5a642]" : "text-white/40 group-hover:text-[#b5a642]"}`}>
                            {wd.dayLabel}
                          </span>
                          <span className={`text-sm font-black mt-0.5 ${isDaySelected ? "text-[#b5a642]" : "text-white"}`}>
                            {wd.dayNum}
                          </span>
                        </div>

                        <button
                          onClick={() => handleOpenAddModal(wd.dateStr)}
                          className="p-1 bg-white/5 hover:bg-[#b5a642] hover:text-black rounded-lg border border-white/5 transition-all text-white"
                          title={`Book for ${wd.fullLabel}`}
                        >
                          <Plus className="w-3 h-3" />
                        </button>
                      </div>

                      {/* Day Events List */}
                      <div className="flex-grow overflow-y-auto p-2.5 space-y-2 min-h-[220px]">
                        {dayEvents.length === 0 ? (
                          <div className="h-full flex flex-col items-center justify-center py-10 text-center select-none text-white/10">
                            <CalendarIcon className="w-6 h-6 opacity-40 mb-1" />
                            <span className="text-[8.5px] font-bold uppercase tracking-wider">No Events</span>
                          </div>
                        ) : (
                          dayEvents
                            .sort((a, b) => (a.time || "").localeCompare(b.time || ""))
                            .map(ev => {
                              const scheme = getTypeColor(ev.type);
                              return (
                                <div
                                  key={ev.id}
                                  onClick={() => handleOpenEditModal(ev)}
                                  className={`p-2.5 rounded-xl border text-[11px] font-bold cursor-pointer select-none relative group hover:brightness-110 active:scale-[0.98] transition-all flex flex-col gap-1 text-left ${scheme.lightBg} ${scheme.border} ${scheme.text} ${scheme.glow}`}
                                >
                                  <div className="flex items-center justify-between gap-1">
                                    <span className="font-mono text-[9px] opacity-75">{ev.time || "All Day"}</span>
                                    <span className={`w-1.5 h-1.5 rounded-full ${scheme.color} shrink-0`} />
                                  </div>
                                  <div className="line-clamp-2 leading-tight text-white/95 mt-0.5 font-semibold group-hover:text-white">
                                    {ev.title}
                                  </div>
                                  {ev.notes && (
                                    <p className="text-[9px] opacity-50 truncate font-normal mt-0.5 text-white/75">
                                      {ev.notes}
                                    </p>
                                  )}
                                </div>
                              );
                            })
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* VIEW CASE 3: STANDARD MONTH PLANNER GRID */}
          {viewMode === "month" && (
            <div className="flex-1 flex flex-col min-h-0" id="view-timeline-month">
              {/* Days of Week Header */}
              <div className="grid grid-cols-7 text-center select-none text-[10px] uppercase font-bold text-white/35 tracking-wider py-2.5 bg-[#141418] border-b border-white/5">
                {["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"].map(day => (
                  <div key={day}>{day}</div>
                ))}
              </div>

              {/* Dates Grid */}
              <div className="flex-grow grid grid-cols-7 gap-1 p-2 bg-[#101014]/20 overflow-y-auto">
                {monthDays.map((md, idx) => {
                  const dayEvs = filteredEventsForMonth.filter(e => e.date === md.dateStr);
                  const dayTs = tasks.filter(t => t.dueDate === md.dateStr && t.status === "open");
                  const isSelected = selectedDateStr === md.dateStr;

                  return (
                    <div
                      key={idx}
                      onClick={() => selectDay(md.dateStr)}
                      className={`min-h-[90px] flex flex-col justify-between border rounded-xl p-2 relative transition-all cursor-pointer ${
                        isSelected 
                          ? "bg-[#b5a642]/15 border-[#b5a642] shadow-[0_0_15px_rgba(181,166,66,0.1)]" 
                          : md.isToday 
                            ? "bg-white/5 border-white/20" 
                            : md.isCurrentMonth 
                              ? "bg-[#141418] border-white/5 hover:border-white/10 hover:bg-white/5" 
                              : "bg-transparent border-transparent text-white/20 hover:border-white/5 hover:bg-white/5"
                      }`}
                    >
                      <div className="flex items-start justify-between select-none">
                        <span className={`text-[11px] font-bold font-mono px-1.5 py-0.5 rounded-md ${
                          md.isToday ? "bg-[#b5a642] text-black font-extrabold shadow" : "text-white/60"
                        }`}>
                          {md.dayNum}
                        </span>

                        {dayTs.length > 0 && (
                          <span className="h-2 w-2 rounded-full bg-red-400" title={`${dayTs.length} pending obligations!`} />
                        )}
                      </div>

                      {/* Month Days Inner events list */}
                      <div className="space-y-1.5 mt-2 overflow-hidden flex-1 flex flex-col justify-end">
                        {dayEvs.slice(0, 3).map(ev => {
                          const scheme = getTypeColor(ev.type);
                          return (
                            <div
                              key={ev.id}
                              onClick={(e) => { e.stopPropagation(); handleOpenEditModal(ev); }}
                              className={`text-[8.5px] font-black rounded px-1.5 py-0.5 border truncate ${scheme.lightBg} ${scheme.text} ${scheme.border} hover:brightness-110`}
                              title={`${ev.time || ""} ${ev.title}`}
                            >
                              {ev.time ? <span className="opacity-70 mr-0.5 font-mono text-[8px]">{ev.time}</span> : null}
                              {ev.title}
                            </div>
                          );
                        })}
                        {dayEvs.length > 3 && (
                          <div className="text-[8px] text-[#b5a642] font-semibold text-center select-none pt-0.5">
                            + {dayEvs.length - 3} further items
                          </div>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* VIEW CASE 4: AGENDA INDEX LIST */}
          {viewMode === "list" && (
            <div className="flex-1 bg-[#141418]/10 p-4 overflow-y-auto" id="view-timeline-list">
              <h4 className="text-xs font-bold uppercase text-white/45 mb-4 tracking-widest">Active Scheduled Items Ledger</h4>
              {filteredEventsForMonth.length === 0 ? (
                <div className="text-center py-20 bg-[#141418]/30 rounded-xl border border-dashed border-white/5">
                  <p className="text-xs text-white/35">No events found matching current category filters.</p>
                </div>
              ) : (
                <div className="divide-y divide-white/5">
                  {filteredEventsForMonth
                    .sort((a, b) => a.date.localeCompare(b.date) || (a.time || "").localeCompare(b.time || ""))
                    .map(ev => {
                      const scheme = getTypeColor(ev.type);
                      return (
                        <div key={ev.id} className="py-3 flex items-center justify-between group hover:bg-white/[0.01] px-2.5 rounded-lg transition-colors">
                          <div className="flex items-center gap-3.5">
                            <span className={`w-3 h-3 rounded-full ${scheme.color} ${scheme.glow} shrink-0`} />
                            <div>
                              <span className="text-xs font-bold text-white/95">{ev.title}</span>
                              <div className="flex items-center gap-2.5 text-[10px] text-white/40 mt-1 font-semibold">
                                <span className="font-mono bg-white/5 px-1.5 py-0.5 rounded text-white/60">{ev.date}</span>
                                {ev.time && <span className="font-mono bg-[#b5a642]/5 text-[#b5a642] px-1.5 py-0.5 rounded border border-[#b5a642]/10">{ev.time}</span>}
                                <span className="capitalize font-bold">{ev.type}</span>
                              </div>
                            </div>
                          </div>

                          <div className="flex items-center gap-1.5 opacity-0 group-hover:opacity-100 transition-opacity">
                            <button
                              onClick={() => handleOpenEditModal(ev)}
                              className="p-1 px-1.5 border border-white/5 rounded text-white/40 hover:text-[#b5a642] hover:bg-white/5 transition-colors"
                            >
                              <Edit3 className="w-3.5 h-3.5" />
                            </button>
                            <button
                              onClick={() => handleRemoveEvent(ev.id)}
                              className="p-1 px-1.5 border border-white/5 rounded text-white/30 hover:text-red-400 hover:bg-red-500/10 transition-colors"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        </div>
                      );
                    })}
                </div>
              )}
            </div>
          )}

        </div>

        {/* Selected Day Agenda Side-drawer inside workflow */}
        <div className="mt-4 p-4 bg-[#141418]/60 border border-white/5 rounded-2xl flex flex-col sm:flex-row sm:items-center justify-between gap-4 select-none shrink-0">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-[#b5a642]/10 border border-[#b5a642]/20 rounded-xl text-[#b5a642]">
              <Clock className="w-4 h-4" />
            </div>
            <div>
              <span className="text-[10px] font-bold text-white/40 uppercase tracking-widest block">Selected Focus Date</span>
              <span className="text-xs font-black text-white/80">{selectedDayInfo.label}</span>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <span className="text-[10px] text-white/30 italic">Have a meeting or deadline to slate?</span>
            <button
              onClick={() => handleOpenAddModal(selectedDateStr)}
              className="px-4 py-2 bg-[#b5a642] text-black hover:bg-[#9a8c38] font-bold text-xs rounded-xl flex items-center gap-1.5 transition-all"
            >
              <Plus className="w-4 h-4" /> Schedule on selected
            </button>
          </div>
        </div>

      </div>

      {/* COMPREHENSIVE RE-ENGINEERED APPOINTMENT EDIT / CREATE MODAL */}
      <AnimatePresence>
        {isEventModalOpen && (
          <div className="fixed inset-0 bg-black/80 z-50 flex items-center justify-center p-4">
            <motion.div 
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="bg-[#141418] border border-white/10 rounded-2xl w-full max-w-md shadow-2xl flex flex-col overflow-hidden"
            >
              {/* Header */}
              <div className="p-4 border-b border-white/5 bg-[#1b1b20]/40 flex items-center justify-between">
                <h3 className="text-xs uppercase font-extrabold text-[#b5a642] tracking-wider flex items-center gap-1.5">
                  <Sparkles className="w-3.5 h-3.5 fill-[#b5a642]/30 text-[#b5a642]" />
                  {editingEvent ? "Tweak Calendar Record" : "Book New Action Record"}
                </h3>
                <button
                  onClick={() => setIsEventModalOpen(false)}
                  className="text-white/40 hover:text-white p-1 rounded-lg bg-white/5 hover:bg-white/10 transition-colors"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              {/* Form container */}
              <form onSubmit={saveEvent} className="p-4 space-y-4 text-left">
                
                {/* Title */}
                <div>
                  <label className="text-[10px] text-white/45 font-bold uppercase tracking-wider block mb-1">Appointment / Milestone Title <span className="text-red-400">*</span></label>
                  <input
                    type="text"
                    required
                    placeholder="e.g., RBC Refinance Signing, Call Equifax underwriter"
                    value={eventTitle}
                    onChange={(e) => setEventTitle(e.target.value)}
                    className="w-full bg-[#1b1b20] border border-white/5 rounded-lg px-3 py-2 text-xs text-white focus:outline-none focus:border-[#b5a642]/20 font-bold"
                  />
                </div>

                {/* Date and Time selectors */}
                <div className="grid grid-cols-2 gap-3.5">
                  <div>
                    <label className="text-[10px] text-white/45 font-bold uppercase tracking-wider block mb-1">Target Date</label>
                    <input
                      type="date"
                      required
                      value={eventDate}
                      onChange={(e) => setEventDate(e.target.value)}
                      className="w-full bg-[#1b1b20] border border-white/5 rounded-lg px-2.5 py-2 text-xs text-white focus:outline-none focus:border-[#b5a642]/20 font-mono"
                    />
                  </div>
                  <div>
                    <label className="text-[10px] text-white/45 font-bold uppercase tracking-wider block mb-1">Target Start Time</label>
                    <input
                      type="time"
                      required
                      value={eventTime}
                      onChange={(e) => setEventTime(e.target.value)}
                      className="w-full bg-[#1b1b20] border border-white/5 rounded-lg px-3 py-2 text-xs text-white focus:outline-none focus:border-[#b5a642]/20 font-mono"
                    />
                  </div>
                </div>

                {/* Duration select */}
                <div>
                  <label className="text-[10px] text-white/45 font-bold uppercase tracking-wider block mb-1">Planned Duration</label>
                  <select
                    value={eventDuration}
                    onChange={(e) => setEventDuration(Number(e.target.value))}
                    className="w-full bg-[#1b1b20] border border-white/5 rounded-lg px-2.5 py-2 text-xs text-white focus:outline-none focus:border-[#b5a642]/20"
                  >
                    <option value={15}>15 Minutes Slot</option>
                    <option value={30}>30 Minutes</option>
                    <option value={45}>45 Minutes Slot</option>
                    <option value={60}>1 Hour Framework</option>
                    <option value={90}>1.5 Hours</option>
                    <option value={120}>2 Hours block</option>
                    <option value={180}>3 Hours block</option>
                    <option value={240}>4 Hours block</option>
                  </select>
                </div>

                {/* Color-Coded classification selector matching layout legend */}
                <div>
                  <label className="text-[10px] text-white/45 font-bold uppercase tracking-wider block mb-2">Classification Group</label>
                  <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                    {eventTypes.map(et => {
                      const isSelected = eventType === et.value;
                      return (
                        <button
                          key={et.value}
                          type="button"
                          onClick={() => setEventType(et.value as any)}
                          className={`flex items-center gap-2 px-3 py-2.5 rounded-xl text-left border text-[11px] font-bold transition-all ${
                            isSelected 
                              ? `${et.lightBg} ${et.border} ${et.text} ${et.glow} border-white/20 ring-1 ring-white/10` 
                              : "bg-[#1b1b20]/40 border-white/5 text-white/60 hover:bg-white/5 hover:text-white"
                          }`}
                        >
                          <span className={`w-2 h-2 rounded-full ${et.color} ${et.glow} shrink-0`} />
                          <span>{et.label}</span>
                        </button>
                      );
                    })}
                  </div>
                </div>

                {/* Linked Deal client file */}
                <div>
                  <label className="text-[10px] text-white/45 font-bold uppercase tracking-wider block mb-1.5">Linked Client File</label>
                  <select
                    value={eventClientId}
                    onChange={(e) => setEventClientId(e.target.value)}
                    className="w-full bg-[#1b1b20] border border-white/5 rounded-lg px-3 py-2.5 text-xs text-white focus:outline-none focus:border-[#b5a642]/20 font-semibold"
                  >
                    <option value="">-- No active link --</option>
                    {clients.map(cl => (
                      <option key={cl.id} value={cl.id}>{cl.first} {cl.last}</option>
                    ))}
                  </select>
                </div>

                {/* Description and Agenda notes */}
                <div>
                  <label className="text-[10px] text-white/45 font-bold uppercase tracking-wider block mb-1">Internal Instructions & Agenda Notes</label>
                  <textarea
                    rows={3}
                    placeholder="Provide specific guidelines, location details, phone coordinates, or items to finalize..."
                    value={eventNotes}
                    onChange={(e) => setEventNotes(e.target.value)}
                    className="w-full bg-[#1b1b20] border border-white/5 rounded-lg px-3 py-2 text-xs text-white placeholder-white/20 focus:outline-none"
                  />
                </div>

                {/* Operations buttons */}
                <div className="pt-4 border-t border-white/5 flex gap-2.5 justify-between">
                  {editingEvent ? (
                    <button
                      type="button"
                      onClick={() => handleRemoveEvent(editingEvent.id)}
                      className="px-4 py-2 bg-red-500/10 text-red-500 hover:bg-red-500/20 rounded-xl text-xs font-bold transition-all border border-red-500/20"
                    >
                      Delete Event
                    </button>
                  ) : <div />}

                  <div className="flex gap-2.5">
                    <button
                      type="button"
                      onClick={() => setIsEventModalOpen(false)}
                      className="px-4 py-2 rounded-xl bg-[#1b1b20] hover:bg-[#27272e] text-xs font-bold text-white/70 transition-colors"
                    >
                      Cancel
                    </button>
                    <button
                      type="submit"
                      className="px-4 py-2 rounded-xl bg-[#b5a642] text-black hover:bg-[#9a8c38] text-xs font-extrabold transition-all"
                    >
                      Save appointment
                    </button>
                  </div>
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
};
