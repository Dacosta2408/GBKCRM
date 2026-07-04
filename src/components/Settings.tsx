import React, { useState, useEffect, useMemo } from "react";
import { 
  User as UserIcon, Palette, Bell, Shield, Sliders, Users, Key, Settings2,
  CheckCircle2, Sparkles, RefreshCw, Plus, Edit3, Trash2, ArrowRight,
  Info, Mail, Phone, Calendar, ShieldCheck, AlertCircle, ToggleLeft, ToggleRight,
  Lock, Laptop, Smartphone, Eye, EyeOff, ShieldAlert, Check, HelpCircle
} from "lucide-react";
import { User, Client } from "../types";
import { encryptValue, decryptValue } from "../lib/cryptoUtils";
import { hashPin } from "../hooks/useAuth";

interface SettingsProps {
  currentUser: User;
  setCurrentUser: React.Dispatch<React.SetStateAction<User>>;
  userRoster: User[];
  setUserRoster: React.Dispatch<React.SetStateAction<User[]>>;
  showToast: (msg: string, type?: "success" | "error", icon?: string) => void;
  onLockApp?: () => void;
  clients: Client[];
}

export const Settings: React.FC<SettingsProps> = ({
  currentUser,
  setCurrentUser,
  userRoster,
  setUserRoster,
  showToast,
  onLockApp,
  clients
}) => {
  // Navigation tabs
  type SettingsTab = "profile" | "appearance" | "notifications" | "security" | "preferences" | "team" | "permissions" | "defaults";
  const [activeTab, setActiveTab] = useState<SettingsTab>("profile");

  // --- 1. PROFILE STATE ---
  const [profileFirst, setProfileFirst] = useState(currentUser.first);
  const [profileLast, setProfileLast] = useState(currentUser.last);
  const [profileDisplayName, setProfileDisplayName] = useState(currentUser.displayName || `${currentUser.first} ${currentUser.last}`);
  const [profileEmail, setProfileEmail] = useState(currentUser.email);
  const [profilePhone, setProfilePhone] = useState(currentUser.phone || "");
  const [profilePhoto, setProfilePhoto] = useState(currentUser.photo || "");
  const [profileJobTitle, setProfileJobTitle] = useState(currentUser.jobTitle || "Senior Mortgage Agent");
  
  // Custom Avatar Pre-sets
  const avatarPresets = [
    "https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&auto=format&fit=crop&q=80",
    "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150&auto=format&fit=crop&q=80",
    "https://images.unsplash.com/photo-1492562080023-ab3db95bfbce?w=150&auto=format&fit=crop&q=80",
    "https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?w=150&auto=format&fit=crop&q=80",
    "https://images.unsplash.com/photo-1519085360753-af0119f7cbe7?w=150&auto=format&fit=crop&q=80"
  ];

  // Sync profile values when currentUser changes
  useEffect(() => {
    setProfileFirst(currentUser.first);
    setProfileLast(currentUser.last);
    setProfileDisplayName(currentUser.displayName || `${currentUser.first} ${currentUser.last}`);
    setProfileEmail(currentUser.email);
    setProfilePhone(currentUser.phone || "");
    setProfilePhoto(currentUser.photo || "");
    setProfileJobTitle(currentUser.jobTitle || "Senior Mortgage Agent");
  }, [currentUser]);

  // Handle Profile Save
  const handleSaveProfile = (e: React.FormEvent) => {
    e.preventDefault();
    if (!profileFirst || !profileLast || !profileEmail) {
      showToast("First name, last name, and email are required.", "error");
      return;
    }

    const updatedUser: User = {
      ...currentUser,
      first: profileFirst,
      last: profileLast,
      displayName: profileDisplayName,
      email: profileEmail,
      phone: profilePhone || undefined,
      photo: profilePhoto || null,
      jobTitle: profileJobTitle
    };

    // Update active user
    setCurrentUser(updatedUser);

    // Update in roster
    const updatedRoster = userRoster.map(u => u.id === currentUser.id ? updatedUser : u);
    setUserRoster(updatedRoster);
    localStorage.setItem("gbk_roster", JSON.stringify(updatedRoster));

    showToast("Personal profile updated successfully!", "success", "👤");
  };

  // --- 2. APPEARANCE STATE ---
  const [themeMode, setThemeMode] = useState<"dark" | "light">(() => {
    return (localStorage.getItem("gbk_app_theme") as "dark" | "light") || "dark";
  });
  const [accentTheme, setAccentTheme] = useState(() => {
    return localStorage.getItem("gbk_accent_theme") || "gold";
  });
  const [density, setDensity] = useState(() => {
    return localStorage.getItem("gbk_interface_density") || "comfortable";
  });
  const [enableAnimations, setEnableAnimations] = useState(() => {
    return localStorage.getItem("gbk_enable_animations") !== "false";
  });

  const handleSaveAppearance = () => {
    localStorage.setItem("gbk_app_theme", themeMode);
    localStorage.setItem("gbk_accent_theme", accentTheme);
    localStorage.setItem("gbk_interface_density", density);
    localStorage.setItem("gbk_enable_animations", enableAnimations ? "true" : "false");
    
    // Apply changes visually to document element if light/dark mode is updated
    if (themeMode === "light") {
      document.documentElement.classList.add("light");
    } else {
      document.documentElement.classList.remove("light");
    }

    showToast("Appearance and style preferences saved!", "success", "🎨");
  };

  // --- 3. NOTIFICATIONS STATE ---
  const [notifTaskReminders, setNotifTaskReminders] = useState(true);
  const [notifFileUpdates, setNotifFileUpdates] = useState(true);
  const [notifFollowUps, setNotifFollowUps] = useState(true);
  const [notifDocAlerts, setNotifDocAlerts] = useState(true);
  const [notifCommsAlerts, setNotifCommsAlerts] = useState(false);
  const [notifEmailDigest, setNotifEmailDigest] = useState(true);

  // Load notifications state
  useEffect(() => {
    const saved = localStorage.getItem(`gbk_notif_prefs_${currentUser.id}`);
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        setNotifTaskReminders(parsed.tasks ?? true);
        setNotifFileUpdates(parsed.files ?? true);
        setNotifFollowUps(parsed.followups ?? true);
        setNotifDocAlerts(parsed.docs ?? true);
        setNotifCommsAlerts(parsed.comms ?? false);
        setNotifEmailDigest(parsed.emailDigest ?? true);
      } catch (e) {
        console.error("Failed loading notification preferences", e);
      }
    }
  }, [currentUser.id]);

  const handleSaveNotifications = () => {
    const prefs = {
      tasks: notifTaskReminders,
      files: notifFileUpdates,
      followups: notifFollowUps,
      docs: notifDocAlerts,
      comms: notifCommsAlerts,
      emailDigest: notifEmailDigest
    };
    localStorage.setItem(`gbk_notif_prefs_${currentUser.id}`, JSON.stringify(prefs));
    showToast("Notification triggers configured successfully!", "success", "🔔");
  };

  // --- 4. SECURITY STATE ---
  const [userPin, setUserPin] = useState(currentUser.pin || "0000");
  const [showPin, setShowPin] = useState(false);
  const [requirePinForSin, setRequirePinForSin] = useState(() => {
    return localStorage.getItem("gbk_security_pin_sin") === "true";
  });
  const [mfaEnabled, setMfaEnabled] = useState(false);
  const [showMfaSetup, setShowMfaSetup] = useState(false);
  const [mfaCode, setMfaCode] = useState("");
  const [mfaSuccess, setMfaSuccess] = useState(false);

  const handleSaveSecurity = async () => {
    if (userPin.length < 4 || isNaN(Number(userPin))) {
      showToast("Access PIN must be a 4-digit number.", "error");
      return;
    }

    const pinHash = await hashPin(userPin, currentUser.id);
    const encryptedPin = await encryptValue(userPin, userPin);
    const encryptedEmailPassword = currentUser.emailPassword ? await encryptValue(currentUser.emailPassword, userPin) : undefined;

    const updatedUserForRoster: User = {
      ...currentUser,
      pin: encryptedPin,
      pinHash,
      emailPassword: encryptedEmailPassword
    };

    const decryptedUser: User = {
      ...currentUser,
      pin: userPin
    };

    setCurrentUser(decryptedUser);

    const updatedRoster = userRoster.map(u => u.id === currentUser.id ? updatedUserForRoster : u);
    setUserRoster(updatedRoster);
    localStorage.setItem("gbk_roster", JSON.stringify(updatedRoster));
    localStorage.setItem("gbk_security_pin_sin", requirePinForSin ? "true" : "false");

    showToast("Security settings successfully locked!", "success", "🔒");
  };

  const handleSimulateResetPassword = () => {
    showToast("A reset password link has been generated & routed to your email inbox.", "success", "✉️");
  };

  const handleVerifyMfa = () => {
    if (mfaCode === "123456" || mfaCode.length === 6) {
      setMfaSuccess(true);
      setMfaEnabled(true);
      setShowMfaSetup(false);
      showToast("Two-factor authentication successfully configured!", "success", "🔐");
    } else {
      showToast("Verification code is incorrect. Try 123456.", "error");
    }
  };

  // --- 5. PERSONAL PREFERENCES STATE ---
  const [prefLanding, setPrefLanding] = useState(() => localStorage.getItem("gbk_pref_landing") || "dashboard");
  const [prefDashboard, setPrefDashboard] = useState(() => localStorage.getItem("gbk_pref_dashboard_view") || "bento");
  const [prefLayout, setPrefLayout] = useState(() => localStorage.getItem("gbk_pref_layout_mode") || "table");
  const [prefDateFormat, setPrefDateFormat] = useState(() => localStorage.getItem("gbk_pref_date_format") || "YYYY-MM-DD");
  const [prefTimeFormat, setPrefTimeFormat] = useState(() => localStorage.getItem("gbk_pref_time_format") || "12");

  const handleSavePreferences = () => {
    localStorage.setItem("gbk_pref_landing", prefLanding);
    localStorage.setItem("gbk_pref_dashboard_view", prefDashboard);
    localStorage.setItem("gbk_pref_layout_mode", prefLayout);
    localStorage.setItem("gbk_pref_date_format", prefDateFormat);
    localStorage.setItem("gbk_pref_time_format", prefTimeFormat);
    
    showToast("Personal workspace defaults updated!", "success", "⚙️");
  };

  // --- 6. TEAM MANAGEMENT (ADMINS/MANAGERS ONLY) ---
  const [teamSearch, setTeamSearch] = useState("");
  const [showAddUserModal, setShowAddUserModal] = useState(false);
  const [editingUser, setEditingUser] = useState<User | null>(null);

  // New team member fields
  const [newFirst, setNewFirst] = useState("");
  const [newLast, setNewLast] = useState("");
  const [newEmail, setNewEmail] = useState("");
  const [newPhone, setNewPhone] = useState("");
  const [newRole, setNewRole] = useState<User["role"]>("Agent");
  const [newPin, setNewPin] = useState("");
  const [newFsra, setNewFsra] = useState("");
  const [newEoCarrier, setNewEoCarrier] = useState("");
  const [newEoPolicy, setNewEoPolicy] = useState("");
  const [newEoExpiry, setNewEoExpiry] = useState("");

  // Edit team member fields
  const [editFirst, setEditFirst] = useState("");
  const [editLast, setEditLast] = useState("");
  const [editEmail, setEditEmail] = useState("");
  const [editPhone, setEditPhone] = useState("");
  const [editRole, setEditRole] = useState<User["role"]>("Agent");
  const [editPin, setEditPin] = useState("");
  const [editStatus, setEditStatus] = useState<"active" | "inactive">("active");
  const [editFsra, setEditFsra] = useState("");
  const [editEoCarrier, setEditEoCarrier] = useState("");
  const [editEoPolicy, setEditEoPolicy] = useState("");
  const [editEoExpiry, setEditEoExpiry] = useState("");

  const isAdminOrManager = useMemo(() => {
    return ["Owner / Master Admin", "Super Admin", "IT / Developer"].includes(currentUser.role);
  }, [currentUser]);

  const filteredRoster = useMemo(() => {
    return userRoster.filter(u => {
      const search = teamSearch.toLowerCase();
      return (
        u.first.toLowerCase().includes(search) ||
        u.last.toLowerCase().includes(search) ||
        u.email.toLowerCase().includes(search) ||
        u.role.toLowerCase().includes(search)
      );
    });
  }, [userRoster, teamSearch]);

  const handleCreateUserSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newFirst || !newLast || !newEmail) {
      showToast("First name, last name, and email are mandatory.", "error");
      return;
    }

    const emailTaken = userRoster.some(u => u.email.toLowerCase() === newEmail.toLowerCase());
    if (emailTaken) {
      showToast("Email address is already in use by another broker.", "error");
      return;
    }

    const targetPin = newPin || "0000";
    const newUserId = `u_${Date.now()}`;
    const pinHash = await hashPin(targetPin, newUserId);
    const encryptedPin = await encryptValue(targetPin, targetPin);

    const newUserRecord: User = {
      id: newUserId,
      first: newFirst,
      last: newLast,
      email: newEmail,
      phone: newPhone || undefined,
      role: newRole,
      status: "active",
      pin: encryptedPin,
      pinHash,
      lastLogin: new Date().toISOString(),
      created: new Date().toISOString().split("T")[0],
      fsraNum: newFsra || undefined,
      eoInsurer: newEoCarrier || undefined,
      eoPolicy: newEoPolicy || undefined,
      eoExpiry: newEoExpiry || undefined,
      permOverrides: {}
    };

    const updatedRoster = [...userRoster, newUserRecord];
    setUserRoster(updatedRoster);
    localStorage.setItem("gbk_roster", JSON.stringify(updatedRoster));

    // Clear inputs
    setNewFirst("");
    setNewLast("");
    setNewEmail("");
    setNewPhone("");
    setNewRole("Agent");
    setNewPin("");
    setNewFsra("");
    setNewEoCarrier("");
    setNewEoPolicy("");
    setNewEoExpiry("");
    setShowAddUserModal(false);

    showToast(`Staff broker ${newUserRecord.first} ${newUserRecord.last} onboarded successfully!`, "success", "👤");
  };

  const handleStartEditUser = (user: User) => {
    setEditingUser(user);
    setEditFirst(user.first);
    setEditLast(user.last);
    setEditEmail(user.email);
    setEditPhone(user.phone || "");
    setEditRole(user.role);
    setEditPin(user.pin || "0000");
    setEditStatus(user.status);
    setEditFsra(user.fsraNum || "");
    setEditEoCarrier(user.eoInsurer || "");
    setEditEoPolicy(user.eoPolicy || "");
    setEditEoExpiry(user.eoExpiry || "");
  };

  const handleSaveEditUserSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingUser) return;

    const targetPin = editPin || "0000";
    const pinHash = await hashPin(targetPin, editingUser.id);
    const encryptedPin = await encryptValue(targetPin, targetPin);
    const encryptedEmailPassword = editingUser.emailPassword ? await encryptValue(editingUser.emailPassword, targetPin) : editingUser.emailPassword;

    const updatedRoster = userRoster.map(u => {
      if (u.id === editingUser.id) {
        return {
          ...u,
          first: editFirst,
          last: editLast,
          email: editEmail,
          phone: editPhone || undefined,
          role: editRole,
          pin: encryptedPin,
          pinHash,
          emailPassword: encryptedEmailPassword,
          status: editStatus,
          fsraNum: editFsra || undefined,
          eoInsurer: editEoCarrier || undefined,
          eoPolicy: editEoPolicy || undefined,
          eoExpiry: editEoExpiry || undefined
        };
      }
      return u;
    });

    setUserRoster(updatedRoster);
    localStorage.setItem("gbk_roster", JSON.stringify(updatedRoster));

    // Also update current user details in case we edited ourselves
    if (editingUser.id === currentUser.id) {
      setCurrentUser(prev => ({
        ...prev,
        first: editFirst,
        last: editLast,
        email: editEmail,
        phone: editPhone || undefined,
        role: editRole,
        pin: targetPin, // in-memory decrypted
        status: editStatus,
        fsraNum: editFsra || undefined,
        eoInsurer: editEoCarrier || undefined,
        eoPolicy: editEoPolicy || undefined,
        eoExpiry: editEoExpiry || undefined
      }));
    }

    setEditingUser(null);
    showToast("Team member profile saved successfully!", "success", "✓");
  };

  const handleToggleUserStatus = (userId: string) => {
    const updated = userRoster.map(u => {
      if (u.id === userId) {
        const nextStatus = u.status === "active" ? "inactive" : "active";
        return { ...u, status: nextStatus as "active" | "inactive" };
      }
      return u;
    });
    setUserRoster(updated);
    localStorage.setItem("gbk_roster", JSON.stringify(updated));
    showToast("Broker status toggled!", "success");
  };

  // --- 7. ACCESS & PERMISSIONS (ADMINS/MANAGERS ONLY) ---
  const [selectedPermUserId, setSelectedPermUserId] = useState<string>(userRoster[0]?.id || "");
  
  const selectedPermUser = useMemo(() => {
    return userRoster.find(u => u.id === selectedPermUserId);
  }, [userRoster, selectedPermUserId]);

  const permissionMatrix = [
    { key: "view_clients", name: "View Client Records", desc: "Allows full viewing of existing CRM mortgage files" },
    { key: "edit_clients", name: "Edit Client Parameters", desc: "Modify rates, down payments, and debt inputs" },
    { key: "override_warnings", name: "Override GDS/TDS Warnings", desc: "Ability to bypass ratios limits in pipeline" },
    { key: "verify_sin", name: "Access & Verify SIN Profiles", desc: "Access primary borrower social insurance number" },
    { key: "upload_docs", name: "Upload & Audit Legal Documents", desc: "Verify document vaults, upload checklists" },
    { key: "delete_clients", name: "Delete Client Files", desc: "Permanently purge a customer mortgage record" },
    { key: "modify_roster", name: "Modify Team Rosters & PINs", desc: "Add new brokers, override security lock codes" },
    { key: "export_audit", name: "Export Immutable Audit Logs", desc: "Download operational security reports" },
    { key: "config_smtp", name: "Configure Workspace email SMTP", desc: "Adjust core email servers & IMAP settings" }
  ];

  const handleTogglePermissionOverride = (key: string) => {
    if (!selectedPermUserId) return;
    
    const updated = userRoster.map(u => {
      if (u.id === selectedPermUserId) {
        const overrides = u.permOverrides || {};
        return {
          ...u,
          permOverrides: {
            ...overrides,
            [key]: !overrides[key]
          }
        };
      }
      return u;
    });

    setUserRoster(updated);
    localStorage.setItem("gbk_roster", JSON.stringify(updated));
    showToast(`Override for permission updated successfully!`, "success", "⚙️");
  };

  // --- 8. CRM DEFAULTS (ADMINS/MANAGERS ONLY) ---
  const [pipelineLabels, setPipelineLabels] = useState(() => {
    const saved = localStorage.getItem("gbk_pipeline_labels");
    return saved ? JSON.parse(saved) : {
      lead: "New Leads / Ingestion",
      open: "Active Files / Drafting",
      working: "Broker Audit & GDS/TDS Check",
      lender: "Submitted to Lender",
      conditional: "Conditional Approval",
      approved: "Approved & Commitment",
      funded: "Funded Transactions",
      closed: "Archived / Closed"
    };
  });

  const [defaultSource, setDefaultSource] = useState(() => localStorage.getItem("gbk_default_source") || "AI Ingestion Portal");
  const [defaultAgentId, setDefaultAgentId] = useState(() => localStorage.getItem("gbk_default_agent_id") || currentUser.id);
  const [require90DayBank, setRequire90DayBank] = useState(() => localStorage.getItem("gbk_require_90_day_bank") !== "false");
  const [requireTaxBill, setRequireTaxBill] = useState(() => localStorage.getItem("gbk_require_tax_bill") !== "false");
  const [requireApsPurchase, setRequireApsPurchase] = useState(() => localStorage.getItem("gbk_require_aps_purchase") !== "false");

  const handleSaveCRMDefaults = () => {
    localStorage.setItem("gbk_pipeline_labels", JSON.stringify(pipelineLabels));
    localStorage.setItem("gbk_default_source", defaultSource);
    localStorage.setItem("gbk_default_agent_id", defaultAgentId);
    localStorage.setItem("gbk_require_90_day_bank", require90DayBank ? "true" : "false");
    localStorage.setItem("gbk_require_tax_bill", requireTaxBill ? "true" : "false");
    localStorage.setItem("gbk_require_aps_purchase", requireApsPurchase ? "true" : "false");

    showToast("CRM organizational configurations updated globally!", "success", "⚙️");
  };

  const handlePipelineLabelChange = (stageKey: string, val: string) => {
    setPipelineLabels((prev: any) => ({
      ...prev,
      [stageKey]: val
    }));
  };

  return (
    <div className="flex-1 flex flex-col h-full overflow-hidden bg-[#0c0c0e] text-white">
      {/* Title Header */}
      <div className="p-6 border-b border-white/5 bg-[#101014] shrink-0 flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold tracking-tight bg-gradient-to-r from-white via-[#eeeef2] to-[#b5a642] bg-clip-text text-transparent font-sans">
            CRM Workspace Settings
          </h1>
          <p className="text-xs text-[#8e95a3] mt-1">
            Configure personal client workspace layouts, notification channels, security override matrices, and corporate pipeline defaults.
          </p>
        </div>
        <div className="flex items-center gap-2">
          <span className="text-[10px] uppercase font-bold text-[#b5a642] bg-[#b5a642]/10 border border-[#b5a642]/20 px-2.5 py-1 rounded-full flex items-center gap-1.5">
            <ShieldCheck className="w-3.5 h-3.5" /> {currentUser.role}
          </span>
          {onLockApp && (
            <button 
              onClick={onLockApp}
              className="text-xs font-semibold px-3 py-1.5 bg-white/5 hover:bg-red-500/10 hover:text-red-300 border border-white/10 rounded-lg transition-all flex items-center gap-1.5"
            >
              <Lock className="w-3.5 h-3.5" /> Lock Workstation
            </button>
          )}
        </div>
      </div>

      {/* Main Container */}
      <div className="flex-1 flex overflow-hidden min-h-0">
        
        {/* Left Sub-Navigation Navigation (Tabs) */}
        <aside className="w-64 border-r border-white/5 bg-[#101014]/40 shrink-0 flex flex-col p-4 gap-1 overflow-y-auto select-none">
          <div className="text-[10px] text-white/30 uppercase tracking-[1.5px] font-bold px-3 py-1.5 mb-1">
            Personal Settings
          </div>
          
          <button
            onClick={() => setActiveTab("profile")}
            className={`w-full text-left px-3 py-2 text-xs font-semibold rounded-lg transition-all flex items-center gap-3 ${
              activeTab === "profile" ? "bg-[#b5a642]/10 text-[#b5a642]" : "text-[#8e95a3] hover:text-white hover:bg-white/5"
            }`}
          >
            <UserIcon className="w-4 h-4" /> My Profile
          </button>
          
          <button
            onClick={() => setActiveTab("appearance")}
            className={`w-full text-left px-3 py-2 text-xs font-semibold rounded-lg transition-all flex items-center gap-3 ${
              activeTab === "appearance" ? "bg-[#b5a642]/10 text-[#b5a642]" : "text-[#8e95a3] hover:text-white hover:bg-white/5"
            }`}
          >
            <Palette className="w-4 h-4" /> Appearance
          </button>
          
          <button
            onClick={() => setActiveTab("notifications")}
            className={`w-full text-left px-3 py-2 text-xs font-semibold rounded-lg transition-all flex items-center gap-3 ${
              activeTab === "notifications" ? "bg-[#b5a642]/10 text-[#b5a642]" : "text-[#8e95a3] hover:text-white hover:bg-white/5"
            }`}
          >
            <Bell className="w-4 h-4" /> Notifications
          </button>
          
          <button
            onClick={() => setActiveTab("security")}
            className={`w-full text-left px-3 py-2 text-xs font-semibold rounded-lg transition-all flex items-center gap-3 ${
              activeTab === "security" ? "bg-[#b5a642]/10 text-[#b5a642]" : "text-[#8e95a3] hover:text-white hover:bg-white/5"
            }`}
          >
            <Shield className="w-4 h-4" /> Security
          </button>
          
          <button
            onClick={() => setActiveTab("preferences")}
            className={`w-full text-left px-3 py-2 text-xs font-semibold rounded-lg transition-all flex items-center gap-3 ${
              activeTab === "preferences" ? "bg-[#b5a642]/10 text-[#b5a642]" : "text-[#8e95a3] hover:text-white hover:bg-white/5"
            }`}
          >
            <Sliders className="w-4 h-4" /> Personal Preferences
          </button>

          {isAdminOrManager && (
            <>
              <div className="text-[10px] text-white/30 uppercase tracking-[1.5px] font-bold px-3 py-1.5 mt-5 mb-1 border-t border-white/5 pt-4">
                Admin Controls
              </div>
              
              <button
                onClick={() => setActiveTab("team")}
                className={`w-full text-left px-3 py-2 text-xs font-semibold rounded-lg transition-all flex items-center gap-3 ${
                  activeTab === "team" ? "bg-[#b5a642]/10 text-[#b5a642]" : "text-[#8e95a3] hover:text-white hover:bg-white/5"
                }`}
              >
                <Users className="w-4 h-4" /> Team Management
              </button>
              
              <button
                onClick={() => setActiveTab("permissions")}
                className={`w-full text-left px-3 py-2 text-xs font-semibold rounded-lg transition-all flex items-center gap-3 ${
                  activeTab === "permissions" ? "bg-[#b5a642]/10 text-[#b5a642]" : "text-[#8e95a3] hover:text-white hover:bg-white/5"
                }`}
              >
                <Key className="w-4 h-4" /> Access &amp; Permissions
              </button>
              
              <button
                onClick={() => setActiveTab("defaults")}
                className={`w-full text-left px-3 py-2 text-xs font-semibold rounded-lg transition-all flex items-center gap-3 ${
                  activeTab === "defaults" ? "bg-[#b5a642]/10 text-[#b5a642]" : "text-[#8e95a3] hover:text-white hover:bg-white/5"
                }`}
              >
                <Settings2 className="w-4 h-4" /> CRM Defaults
              </button>
            </>
          )}
        </aside>

        {/* Right Settings Content Section Workspace */}
        <section className="flex-1 bg-[#09090c] p-6 overflow-y-auto select-text">
          
          {/* TAB 1: MY PROFILE */}
          {activeTab === "profile" && (
            <div className="max-w-2xl space-y-6">
              <div className="bg-[#101014] border border-white/5 p-6 rounded-xl shadow-sm space-y-6">
                <div>
                  <h3 className="text-sm font-bold text-white uppercase tracking-wider mb-1">My Account Profile</h3>
                  <p className="text-[11px] text-[#8e95a3]">Update your broker bio details, contact lines, job title, and active photo avatar.</p>
                </div>

                <form onSubmit={handleSaveProfile} className="space-y-4">
                  {/* Photo / Avatar Section */}
                  <div className="flex items-center gap-4 border-b border-white/5 pb-5">
                    <div className="relative group shrink-0">
                      {profilePhoto ? (
                        <img 
                          src={profilePhoto} 
                          alt="Avatar" 
                          referrerPolicy="no-referrer"
                          className="w-16 h-16 rounded-full object-cover border border-[#b5a642]/40"
                        />
                      ) : (
                        <div className="w-16 h-16 rounded-full bg-[#b5a642]/20 border border-[#b5a642]/40 flex items-center justify-center font-bold text-xl text-[#b5a642]">
                          {profileFirst[0]}{profileLast[0]}
                        </div>
                      )}
                    </div>
                    <div className="space-y-2 flex-1">
                      <label className="block text-[10px] font-bold text-[#8e95a3] uppercase tracking-wider">Profile Photo Avatar URL</label>
                      <input 
                        type="text"
                        value={profilePhoto}
                        onChange={(e) => setProfilePhoto(e.target.value)}
                        placeholder="https://images.unsplash.com/..."
                        className="w-full bg-[#141418] border border-white/5 rounded-lg px-3 py-1.5 text-xs text-white placeholder-white/20 focus:outline-none focus:border-[#b5a642]/40"
                      />
                      <div className="flex gap-2 items-center mt-1">
                        <span className="text-[9px] text-[#8e95a3]">Or choose a preset:</span>
                        {avatarPresets.map((preset, idx) => (
                          <button
                            key={idx}
                            type="button"
                            onClick={() => setProfilePhoto(preset)}
                            className="w-6 h-6 rounded-full overflow-hidden border border-white/10 hover:border-[#b5a642] transition-colors"
                          >
                            <img src={preset} alt="" className="w-full h-full object-cover" />
                          </button>
                        ))}
                      </div>
                    </div>
                  </div>

                  {/* Grid Fields */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-[10px] font-bold text-[#8e95a3] uppercase tracking-wider mb-1.5">First Name</label>
                      <input 
                        type="text"
                        value={profileFirst}
                        onChange={(e) => setProfileFirst(e.target.value)}
                        className="w-full bg-[#141418] border border-white/5 rounded-lg px-3 py-2 text-xs text-white focus:outline-none focus:border-[#b5a642]/30"
                      />
                    </div>
                    <div>
                      <label className="block text-[10px] font-bold text-[#8e95a3] uppercase tracking-wider mb-1.5">Last Name</label>
                      <input 
                        type="text"
                        value={profileLast}
                        onChange={(e) => setProfileLast(e.target.value)}
                        className="w-full bg-[#141418] border border-white/5 rounded-lg px-3 py-2 text-xs text-white focus:outline-none focus:border-[#b5a642]/30"
                      />
                    </div>
                    <div>
                      <label className="block text-[10px] font-bold text-[#8e95a3] uppercase tracking-wider mb-1.5">Display Name</label>
                      <input 
                        type="text"
                        value={profileDisplayName}
                        onChange={(e) => setProfileDisplayName(e.target.value)}
                        className="w-full bg-[#141418] border border-white/5 rounded-lg px-3 py-2 text-xs text-white focus:outline-none focus:border-[#b5a642]/30"
                      />
                    </div>
                    <div>
                      <label className="block text-[10px] font-bold text-[#8e95a3] uppercase tracking-wider mb-1.5">Job Title</label>
                      <input 
                        type="text"
                        value={profileJobTitle}
                        onChange={(e) => setProfileJobTitle(e.target.value)}
                        className="w-full bg-[#141418] border border-white/5 rounded-lg px-3 py-2 text-xs text-white focus:outline-none focus:border-[#b5a642]/30"
                      />
                    </div>
                    <div>
                      <label className="block text-[10px] font-bold text-[#8e95a3] uppercase tracking-wider mb-1.5">Email Address</label>
                      <input 
                        type="email"
                        value={profileEmail}
                        onChange={(e) => setProfileEmail(e.target.value)}
                        className="w-full bg-[#141418] border border-white/5 rounded-lg px-3 py-2 text-xs text-white focus:outline-none focus:border-[#b5a642]/30"
                      />
                    </div>
                    <div>
                      <label className="block text-[10px] font-bold text-[#8e95a3] uppercase tracking-wider mb-1.5">Cellular Phone</label>
                      <input 
                        type="text"
                        value={profilePhone}
                        onChange={(e) => setProfilePhone(e.target.value)}
                        className="w-full bg-[#141418] border border-white/5 rounded-lg px-3 py-2 text-xs text-white focus:outline-none focus:border-[#b5a642]/30"
                      />
                    </div>
                  </div>

                  {/* Read Only Role display */}
                  <div className="bg-[#141418] p-3.5 rounded-lg border border-white/5 flex items-center justify-between mt-6">
                    <div>
                      <span className="text-[10px] font-bold uppercase tracking-wider text-[#8e95a3] block">Internal Workspace Role</span>
                      <span className="text-xs font-semibold text-white mt-0.5 block">{currentUser.role}</span>
                    </div>
                    <span className="text-[9px] font-bold uppercase text-white/30 bg-white/5 border border-white/10 px-2.5 py-1 rounded">
                      Contact Admin to Modify
                    </span>
                  </div>

                  <button 
                    type="submit"
                    className="w-full py-2.5 bg-[#b5a642] text-black font-bold text-xs rounded-lg hover:opacity-90 transition-all uppercase tracking-wider mt-4"
                  >
                    Save Profile Changes
                  </button>
                </form>
              </div>
            </div>
          )}

          {/* TAB 2: APPEARANCE */}
          {activeTab === "appearance" && (
            <div className="max-w-2xl space-y-6">
              <div className="bg-[#101014] border border-white/5 p-6 rounded-xl shadow-sm space-y-6">
                <div>
                  <h3 className="text-sm font-bold text-white uppercase tracking-wider mb-1">Theme &amp; Appearance</h3>
                  <p className="text-[11px] text-[#8e95a3]">Adjust visual layouts, interface contrast, density, and animation speeds.</p>
                </div>

                <div className="space-y-5">
                  {/* Theme Mode Selector */}
                  <div className="space-y-2">
                    <label className="block text-[10px] font-bold text-[#8e95a3] uppercase tracking-wider">Contrast Mode</label>
                    <div className="grid grid-cols-2 gap-4">
                      <button
                        onClick={() => setThemeMode("dark")}
                        className={`p-4 rounded-lg border flex flex-col items-center gap-2 transition-all ${
                          themeMode === "dark" 
                            ? "bg-[#1b1b20] border-[var(--color-primary)] text-[var(--color-primary)]" 
                            : "bg-[#141418]/60 border-white/5 text-[#8e95a3] hover:text-white"
                        }`}
                      >
                        <Lock className="w-5 h-5" />
                        <span className="text-xs font-bold">Deep Slate Dark</span>
                        <span className="text-[9px] text-white/40">Eye-safe operations mode</span>
                      </button>

                      <button
                        onClick={() => setThemeMode("light")}
                        className={`p-4 rounded-lg border flex flex-col items-center gap-2 transition-all ${
                          themeMode === "light" 
                            ? "bg-white/10 border-[var(--color-primary)] text-[var(--color-primary)]" 
                            : "bg-[#141418]/60 border-white/5 text-[#8e95a3] hover:text-white"
                        }`}
                      >
                        <Palette className="w-5 h-5" />
                        <span className="text-xs font-bold">Workspace Light</span>
                        <span className="text-[9px] text-white/40">High-contrast daylight mode</span>
                      </button>
                    </div>
                  </div>

                  {/* Accent Presets */}
                  <div className="space-y-2">
                    <label className="block text-[10px] font-bold text-[#8e95a3] uppercase tracking-wider">Brand Accent Theme</label>
                    <div className="grid grid-cols-5 gap-2">
                      {([
                        { id: "gold", label: "Olive Gold", color: "bg-[#b5a642]" },
                        { id: "blue", label: "Steel Blue", color: "bg-[#6fa3b8]" },
                        { id: "emerald", label: "Emerald", color: "bg-[#2e7d32]" },
                        { id: "purple", label: "Velvet", color: "bg-[#7b1fa2]" },
                        { id: "slate", label: "Slate", color: "bg-[#90a4ae]" }
                      ]).map((accent) => (
                        <button
                          key={accent.id}
                          onClick={() => setAccentTheme(accent.id)}
                          className={`p-2 rounded-lg border flex flex-col items-center gap-1.5 transition-all text-[10px] font-semibold ${
                            accentTheme === accent.id 
                              ? "bg-[#1b1b20] border-[var(--color-primary)] text-white" 
                              : "bg-[#141418]/50 border-white/5 text-[#8e95a3] hover:text-white"
                          }`}
                        >
                          <div className={`w-3.5 h-3.5 rounded-full ${accent.color}`} />
                          <span>{accent.label}</span>
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Interface Density */}
                  <div className="space-y-2">
                    <label className="block text-[10px] font-bold text-[#8e95a3] uppercase tracking-wider">Interface Density</label>
                    <div className="grid grid-cols-3 gap-3">
                      {["compact", "comfortable", "spacious"].map((dens) => (
                        <button
                          key={dens}
                          onClick={() => setDensity(dens)}
                          className={`p-2.5 rounded-lg border text-xs font-bold capitalize transition-all ${
                            density === dens 
                              ? "bg-[#1b1b20] border-[var(--color-primary)] text-white" 
                              : "bg-[#141418]/60 border-white/5 text-[#8e95a3] hover:text-white"
                          }`}
                        >
                          {dens}
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Animations Toggle */}
                  <div className="flex items-center justify-between bg-[#141418] p-4 rounded-lg border border-white/5">
                    <div>
                      <span className="text-xs font-bold text-white block">Subtle UI Animations</span>
                      <span className="text-[10px] text-[#8e95a3] mt-0.5 block">Enable spring transitions, route fades, and micro-interactions.</span>
                    </div>
                    <button
                      onClick={() => setEnableAnimations(!enableAnimations)}
                      className="text-[var(--color-primary)]"
                    >
                      {enableAnimations ? <ToggleRight className="w-9 h-9" /> : <ToggleLeft className="w-9 h-9 text-white/30" />}
                    </button>
                  </div>

                  <button 
                    onClick={handleSaveAppearance}
                    className="w-full py-2.5 bg-[var(--color-primary)] text-black font-bold text-xs rounded-lg hover:opacity-90 transition-all uppercase tracking-wider mt-2"
                  >
                    Apply Theme Changes
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* TAB 3: NOTIFICATIONS */}
          {activeTab === "notifications" && (
            <div className="max-w-2xl space-y-6">
              <div className="bg-[#101014] border border-white/5 p-6 rounded-xl shadow-sm space-y-6">
                <div>
                  <h3 className="text-sm font-bold text-white uppercase tracking-wider mb-1">Notification Preferences</h3>
                  <p className="text-[11px] text-[#8e95a3]">Configure automated browser notifications, sound reminders, and email digest logs.</p>
                </div>

                <div className="space-y-3.5">
                  <div className="flex items-start justify-between bg-[#141418]/50 p-4 rounded-lg border border-white/5">
                    <div className="space-y-0.5">
                      <label className="text-xs font-bold text-white block">Daily Task Reminders</label>
                      <span className="text-[10px] text-[#8e95a3] block">Notify me of uncompleted tasks assigned to me daily at 9:00 AM.</span>
                    </div>
                    <button onClick={() => setNotifTaskReminders(!notifTaskReminders)} className="shrink-0 text-[var(--color-primary)]">
                      {notifTaskReminders ? <ToggleRight className="w-9 h-9" /> : <ToggleLeft className="w-9 h-9 text-white/30" />}
                    </button>
                  </div>

                  <div className="flex items-start justify-between bg-[#141418]/50 p-4 rounded-lg border border-white/5">
                    <div className="space-y-0.5">
                      <label className="text-xs font-bold text-white block">Client Assigned Alerts</label>
                      <span className="text-[10px] text-[#8e95a3] block">Notify me immediately when an active file is reassigned to my roster.</span>
                    </div>
                    <button onClick={() => setNotifFileUpdates(!notifFileUpdates)} className="shrink-0 text-[var(--color-primary)]">
                      {notifFileUpdates ? <ToggleRight className="w-9 h-9" /> : <ToggleLeft className="w-9 h-9 text-white/30" />}
                    </button>
                  </div>

                  <div className="flex items-start justify-between bg-[#141418]/50 p-4 rounded-lg border border-white/5">
                    <div className="space-y-0.5">
                      <label className="text-xs font-bold text-white block">Retention &amp; Follow-up Triggers</label>
                      <span className="text-[10px] text-[#8e95a3] block">Notify me when a client's 5-year mortgage renewal is approaching threshold.</span>
                    </div>
                    <button onClick={() => setNotifFollowUps(!notifFollowUps)} className="shrink-0 text-[var(--color-primary)]">
                      {notifFollowUps ? <ToggleRight className="w-9 h-9" /> : <ToggleLeft className="w-9 h-9 text-white/30" />}
                    </button>
                  </div>

                  <div className="flex items-start justify-between bg-[#141418]/50 p-4 rounded-lg border border-white/5">
                    <div className="space-y-0.5">
                      <label className="text-xs font-bold text-white block">Document Vault Submissions</label>
                      <span className="text-[10px] text-[#8e95a3] block">Notify me when a client uploads required checklist PDF in the client portal.</span>
                    </div>
                    <button onClick={() => setNotifDocAlerts(!notifDocAlerts)} className="shrink-0 text-[var(--color-primary)]">
                      {notifDocAlerts ? <ToggleRight className="w-9 h-9" /> : <ToggleLeft className="w-9 h-9 text-white/30" />}
                    </button>
                  </div>

                  <div className="flex items-start justify-between bg-[#141418]/50 p-4 rounded-lg border border-white/5">
                    <div className="space-y-0.5">
                      <label className="text-xs font-bold text-white block">Team Mentions Alerts</label>
                      <span className="text-[10px] text-[#8e95a3] block">Notify me of standard team channel mentions or active chat dialogues.</span>
                    </div>
                    <button onClick={() => setNotifCommsAlerts(!notifCommsAlerts)} className="shrink-0 text-[var(--color-primary)]">
                      {notifCommsAlerts ? <ToggleRight className="w-9 h-9" /> : <ToggleLeft className="w-9 h-9 text-white/30" />}
                    </button>
                  </div>

                  <div className="flex items-start justify-between bg-[#141418]/50 p-4 rounded-lg border border-white/5">
                    <div className="space-y-0.5">
                      <label className="text-xs font-bold text-white block">Weekly Email Activity Digest</label>
                      <span className="text-[10px] text-[#8e95a3] block">Receive email report of operational pipelines, funded values and metrics.</span>
                    </div>
                    <button onClick={() => setNotifEmailDigest(!notifEmailDigest)} className="shrink-0 text-[var(--color-primary)]">
                      {notifEmailDigest ? <ToggleRight className="w-9 h-9" /> : <ToggleLeft className="w-9 h-9 text-white/30" />}
                    </button>
                  </div>

                  <button 
                    onClick={handleSaveNotifications}
                    className="w-full py-2.5 bg-[var(--color-primary)] text-black font-bold text-xs rounded-lg hover:opacity-90 transition-all uppercase tracking-wider mt-4"
                  >
                    Save Notification Prefs
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* TAB 4: SECURITY */}
          {activeTab === "security" && (
            <div className="max-w-2xl space-y-6">
              <div className="bg-[#101014] border border-white/5 p-6 rounded-xl shadow-sm space-y-6">
                <div>
                  <h3 className="text-sm font-bold text-white uppercase tracking-wider mb-1">Personal Account Security</h3>
                  <p className="text-[11px] text-[#8e95a3]">Adjust broker access codes, multi-factor setups, and monitor active sessions.</p>
                </div>

                <div className="space-y-5">
                  {/* Access PIN */}
                  <div className="bg-[#141418] p-4 rounded-lg border border-white/5 space-y-3">
                    <div className="flex justify-between items-center">
                      <div>
                        <span className="text-xs font-bold text-white block">CRM Workstation Access PIN</span>
                        <span className="text-[10px] text-[#8e95a3] block">The 4-digit code required to unlock your broker session.</span>
                      </div>
                      <button 
                        onClick={() => setShowPin(!showPin)}
                        className="text-xs font-bold text-[#6fa3b8] hover:underline"
                      >
                        {showPin ? "Hide Code" : "Reveal Code"}
                      </button>
                    </div>

                    <div className="flex gap-2">
                      <input 
                        type={showPin ? "text" : "password"}
                        value={userPin}
                        maxLength={4}
                        onChange={(e) => setUserPin(e.target.value.replace(/\D/g, ""))}
                        className="bg-[#0c0c0e] border border-white/5 rounded px-3 py-1.5 text-center text-sm font-mono tracking-widest text-white w-24 focus:outline-none focus:border-[var(--color-primary)]/30"
                      />
                      <span className="text-[10px] text-[#8e95a3] self-center">Used during credentials quick-switching.</span>
                    </div>
                  </div>

                  {/* Password reset simulation */}
                  <div className="flex items-center justify-between bg-[#141418]/50 p-4 rounded-lg border border-white/5">
                    <div>
                      <span className="text-xs font-bold text-white block">Corporate Email Password</span>
                      <span className="text-[10px] text-[#8e95a3] mt-0.5 block">Trigger secure reset flow for portal password.</span>
                    </div>
                    <button 
                      onClick={handleSimulateResetPassword}
                      className="px-3 py-1.5 bg-white/5 hover:bg-white/10 text-xs font-bold rounded-lg border border-white/10 transition-colors"
                    >
                      Reset Password
                    </button>
                  </div>

                  {/* Require PIN for SIN */}
                  <div className="flex items-center justify-between bg-[#141418]/50 p-4 rounded-lg border border-white/5">
                    <div>
                      <span className="text-xs font-bold text-white block">Audit Access Protection</span>
                      <span className="text-[10px] text-[#8e95a3] mt-0.5 block">Require manual PIN reentry when auditing SIN numbers.</span>
                    </div>
                    <button onClick={() => setRequirePinForSin(!requirePinForSin)} className="shrink-0 text-[var(--color-primary)]">
                      {requirePinForSin ? <ToggleRight className="w-9 h-9" /> : <ToggleLeft className="w-9 h-9 text-white/30" />}
                    </button>
                  </div>

                  {/* Multi Factor Authentication (MFA) Mock */}
                  <div className="bg-[#141418]/50 p-4 rounded-lg border border-white/5 space-y-4">
                    <div className="flex items-center justify-between">
                      <div>
                        <span className="text-xs font-bold text-white block">Two-Factor Authentication (MFA)</span>
                        <span className="text-[10px] text-[#8e95a3] mt-0.5 block">Require dynamic security codes for administrative tasks.</span>
                      </div>
                      {mfaEnabled ? (
                        <span className="text-[9px] uppercase font-bold text-green-400 bg-green-500/10 px-2 py-0.5 rounded border border-green-500/25">
                          Active (MFA Secured)
                        </span>
                      ) : (
                        <button
                          onClick={() => setShowMfaSetup(true)}
                          className="px-3 py-1.5 bg-[var(--color-primary)]/10 border border-[var(--color-primary)]/20 hover:bg-[var(--color-primary)]/20 text-xs font-bold text-[var(--color-primary)] rounded-lg transition-colors"
                        >
                          Enable Setup
                        </button>
                      )}
                    </div>

                    {showMfaSetup && (
                      <div className="bg-[#0c0c0e] p-3 rounded-lg border border-white/5 space-y-3">
                        <div className="text-[10px] text-[#8e95a3] leading-relaxed">
                          Scan the Authenticator barcode, then input the 6-digit confirmation code below (Use <strong>123456</strong> for testing setup).
                        </div>
                        <div className="flex gap-2">
                          <input 
                            type="text" 
                            placeholder="000000"
                            value={mfaCode}
                            onChange={(e) => setMfaCode(e.target.value.replace(/\D/g, ""))}
                            className="bg-[#141418] border border-white/5 rounded px-2.5 py-1 text-xs font-mono tracking-widest text-white w-24 text-center focus:outline-none"
                          />
                          <button
                            onClick={handleVerifyMfa}
                            className="px-3 py-1 bg-[#6fa3b8] hover:bg-[#8bc2da] text-black text-xs font-bold rounded"
                          >
                            Verify &amp; Activate
                          </button>
                          <button
                            onClick={() => setShowMfaSetup(false)}
                            className="px-2 py-1 text-xs text-[#8e95a3] hover:text-white"
                          >
                            Cancel
                          </button>
                        </div>
                      </div>
                    )}
                  </div>

                  {/* Active Session logs */}
                  <div className="space-y-2 pt-2">
                    <label className="block text-[10px] font-bold text-[#8e95a3] uppercase tracking-wider">Active Workspace Login Devices</label>
                    <div className="space-y-2">
                      <div className="flex items-center gap-3 p-3 bg-[#141418] rounded-lg border border-white/5 text-xs text-[#8e95a3]">
                        <Laptop className="w-5 h-5 text-[var(--color-primary)] shrink-0" />
                        <div className="flex-1">
                          <div className="font-bold text-white">Firefox 134.0 on macOS Ventura (Current Session)</div>
                          <div className="text-[10px] mt-0.5">IP: 198.162.24.9 • Ontario, Canada</div>
                        </div>
                        <span className="text-[9px] uppercase font-bold text-green-400 bg-green-500/10 px-1.5 py-0.5 rounded">Active Now</span>
                      </div>

                      <div className="flex items-center gap-3 p-3 bg-[#141418]/60 rounded-lg border border-white/5 text-xs text-[#8e95a3]">
                        <Smartphone className="w-5 h-5 text-white/20 shrink-0" />
                        <div className="flex-1">
                          <div className="font-bold text-white/70">GBK Mobile iOS Companion App</div>
                          <div className="text-[10px] mt-0.5">IP: 24.112.92.122 • Toronto, Canada</div>
                        </div>
                        <span className="text-[9px] text-white/40">3 hours ago</span>
                      </div>
                    </div>
                  </div>

                  <button 
                    onClick={handleSaveSecurity}
                    className="w-full py-2.5 bg-[var(--color-primary)] text-black font-bold text-xs rounded-lg hover:opacity-90 transition-all uppercase tracking-wider mt-2"
                  >
                    Save Security Settings
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* TAB 5: PERSONAL PREFERENCES */}
          {activeTab === "preferences" && (
            <div className="max-w-2xl space-y-6">
              <div className="bg-[#101014] border border-white/5 p-6 rounded-xl shadow-sm space-y-6">
                <div>
                  <h3 className="text-sm font-bold text-white uppercase tracking-wider mb-1">Personal Workspace Preferences</h3>
                  <p className="text-[11px] text-[#8e95a3]">Configure layout modes, metric summaries, date formatting, and default landing views.</p>
                </div>

                <div className="space-y-4">
                  {/* Landing Screen */}
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-white/5 pb-4">
                    <div>
                      <span className="text-xs font-bold text-white block">Default Landing Page</span>
                      <span className="text-[10px] text-[#8e95a3] mt-0.5 block">The CRM section displayed immediately after workspace PIN input.</span>
                    </div>
                    <select
                      value={prefLanding}
                      onChange={(e) => setPrefLanding(e.target.value)}
                      className="bg-[var(--color-surface-2)] border border-[var(--color-border)] rounded-lg px-3 py-1.5 text-xs text-white focus:outline-none focus:border-[var(--color-primary)]/50 w-full sm:w-48"
                    >
                      <option value="dashboard">Dashboard Overview</option>
                      <option value="clients">Client Database</option>
                      <option value="pipeline">Pipeline Board</option>
                      <option value="ai">AI Intake Console</option>
                    </select>
                  </div>

                  {/* Dashboard Visual View */}
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-white/5 pb-4">
                    <div>
                      <span className="text-xs font-bold text-white block">Preferred Dashboard View</span>
                      <span className="text-[10px] text-[#8e95a3] mt-0.5 block">Visual layout style used on primary dashboard workspace.</span>
                    </div>
                    <select
                      value={prefDashboard}
                      onChange={(e) => setPrefDashboard(e.target.value)}
                      className="bg-[var(--color-surface-2)] border border-[var(--color-border)] rounded-lg px-3 py-1.5 text-xs text-white focus:outline-none focus:border-[var(--color-primary)]/50 w-full sm:w-48"
                    >
                      <option value="bento">Bento Layout Dashboard</option>
                      <option value="summary">Summary Focus Cards</option>
                      <option value="metrics">Metric Trends &amp; Charts</option>
                    </select>
                  </div>

                  {/* Table vs Cards */}
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-white/5 pb-4">
                    <div>
                      <span className="text-xs font-bold text-white block">Default Client Layout View</span>
                      <span className="text-[10px] text-[#8e95a3] mt-0.5 block">Preferred display configuration in client directory database.</span>
                    </div>
                    <select
                      value={prefLayout}
                      onChange={(e) => setPrefLayout(e.target.value)}
                      className="bg-[var(--color-surface-2)] border border-[var(--color-border)] rounded-lg px-3 py-1.5 text-xs text-white focus:outline-none focus:border-[var(--color-primary)]/50 w-full sm:w-48"
                    >
                      <option value="table">Table List Layout</option>
                      <option value="cards">Interactive Cards Grid</option>
                    </select>
                  </div>

                  {/* Date Formats */}
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-white/5 pb-4">
                    <div>
                      <span className="text-xs font-bold text-white block">Corporate Date Format</span>
                      <span className="text-[10px] text-[#8e95a3] mt-0.5 block">Format representation for checklist limits and maturity dates.</span>
                    </div>
                    <select
                      value={prefDateFormat}
                      onChange={(e) => setPrefDateFormat(e.target.value)}
                      className="bg-[var(--color-surface-2)] border border-[var(--color-border)] rounded-lg px-3 py-1.5 text-xs text-white focus:outline-none focus:border-[var(--color-primary)]/50 w-full sm:w-48"
                    >
                      <option value="YYYY-MM-DD">YYYY-MM-DD (2026-06-24)</option>
                      <option value="DD/MM/YYYY">DD/MM/YYYY (24/06/2026)</option>
                      <option value="MM/DD/YYYY">MM/DD/YYYY (06/24/2026)</option>
                    </select>
                  </div>

                  {/* Time format */}
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                    <div>
                      <span className="text-xs font-bold text-white block">Calendar Time Layout</span>
                      <span className="text-[10px] text-[#8e95a3] mt-0.5 block">Hour scale used inside communications and appointment sheets.</span>
                    </div>
                    <select
                      value={prefTimeFormat}
                      onChange={(e) => setPrefTimeFormat(e.target.value)}
                      className="bg-[var(--color-surface-2)] border border-[var(--color-border)] rounded-lg px-3 py-1.5 text-xs text-white focus:outline-none focus:border-[var(--color-primary)]/50 w-full sm:w-48"
                    >
                      <option value="12">12-hour scale (AM / PM)</option>
                      <option value="24">24-hour military scale</option>
                    </select>
                  </div>

                  <button 
                    onClick={handleSavePreferences}
                    className="w-full py-2.5 bg-[var(--color-primary)] text-black font-bold text-xs rounded-lg hover:opacity-90 transition-all uppercase tracking-wider mt-4"
                  >
                    Save Personal Preferences
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* TAB 6: TEAM MANAGEMENT (ADMINS/MANAGERS ONLY) */}
          {activeTab === "team" && isAdminOrManager && (
            <div className="space-y-6">
              
              {/* Add user form toggle & Search */}
              <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3">
                <div className="relative w-full sm:w-64">
                  <input 
                    type="text"
                    placeholder="Search workspace brokers..."
                    value={teamSearch}
                    onChange={(e) => setTeamSearch(e.target.value)}
                    className="w-full bg-[#101014] border border-white/5 rounded-lg pl-9 pr-4 py-1.5 text-xs text-white placeholder-white/30 focus:outline-none"
                  />
                  <Users className="w-4 h-4 text-white/30 absolute left-3 top-2" />
                </div>
                <button
                  onClick={() => setShowAddUserModal(true)}
                  className="px-4 py-1.5 bg-[var(--color-primary)] text-black text-xs font-bold rounded-lg hover:opacity-90 transition-all flex items-center gap-1.5 shrink-0"
                >
                  <Plus className="w-4 h-4" /> Add New Broker
                </button>
              </div>

              {/* Roster Directory Table */}
              <div className="bg-[#101014] border border-white/5 rounded-xl overflow-hidden shadow-sm">
                <div className="overflow-x-auto">
                  <table className="w-full text-left text-xs border-collapse">
                    <thead>
                      <tr className="border-b border-white/5 bg-[#141418] text-[#8e95a3] font-bold text-[10px] uppercase tracking-wider select-none">
                        <th className="p-3">Staff Profile</th>
                        <th className="p-3">License &amp; E&amp;O</th>
                        <th className="p-3">Email &amp; Cell</th>
                        <th className="p-3">PIN Code</th>
                        <th className="p-3">Account Status</th>
                        <th className="p-3 text-right">Actions</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-white/5">
                      {filteredRoster.map((user) => (
                        <tr key={user.id} className="hover:bg-white/[0.01] transition-colors">
                          <td className="p-3 flex items-center gap-3">
                            {user.photo ? (
                              <img 
                                src={user.photo} 
                                alt="" 
                                className="w-8 h-8 rounded-full object-cover border border-white/10" 
                                referrerPolicy="no-referrer"
                              />
                            ) : (
                              <div className="w-8 h-8 rounded-full bg-[var(--color-primary)]/20 border border-[var(--color-primary)]/30 flex items-center justify-center font-bold text-xs text-[var(--color-primary)]">
                                {user.first[0]}{user.last[0]}
                              </div>
                            )}
                            <div>
                              <div className="font-bold text-white text-xs">{user.first} {user.last}</div>
                              <div className="text-[10px] text-[#8e95a3] mt-0.5">{user.role}</div>
                            </div>
                          </td>
                          <td className="p-3">
                            <div className="font-mono text-[10px] text-white">FSRA: {user.fsraNum || "Not Registered"}</div>
                            <div className="text-[9px] text-[#8e95a3] mt-0.5">E&amp;O Expiry: {user.eoExpiry || "None"}</div>
                          </td>
                          <td className="p-3">
                            <div className="text-white font-semibold">{user.email}</div>
                            <div className="text-[10px] text-[#8e95a3] mt-0.5">{user.phone || "No Phone"}</div>
                          </td>
                          <td className="p-3 font-mono text-xs tracking-widest text-[#6fa3b8] font-bold">
                            •••• ({user.pin || "0000"})
                          </td>
                          <td className="p-3">
                            <button
                              onClick={() => handleToggleUserStatus(user.id)}
                              className={`px-2.5 py-0.5 rounded text-[9px] font-bold uppercase border tracking-wider transition-all ${
                                user.status === "active" 
                                  ? "bg-green-500/10 text-green-400 border-green-500/20 hover:bg-green-500/20" 
                                  : "bg-red-500/10 text-red-400 border-red-500/20 hover:bg-red-500/20"
                              }`}
                            >
                              {user.status}
                            </button>
                          </td>
                          <td className="p-3 text-right">
                            <button
                              onClick={() => handleStartEditUser(user)}
                              className="px-2.5 py-1 bg-white/5 hover:bg-[var(--color-primary)]/20 hover:text-[var(--color-primary)] text-xs font-semibold rounded border border-white/5 transition-all inline-flex items-center gap-1"
                            >
                              <Edit3 className="w-3.5 h-3.5" /> Edit
                            </button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>

              {/* MODAL: ADD TEAM MEMBER */}
              {showAddUserModal && (
                <div className="fixed inset-0 bg-black/70 z-50 flex items-center justify-center p-4 backdrop-blur-md">
                  <div className="bg-[#101014] border border-white/10 rounded-xl w-full max-w-2xl max-h-[90vh] overflow-y-auto shadow-2xl p-6 relative">
                    <button 
                      onClick={() => setShowAddUserModal(false)}
                      className="absolute right-4 top-4 text-[#8e95a3] hover:text-white"
                    >
                      ✕
                    </button>
                    
                    <h3 className="text-sm font-bold text-white uppercase tracking-wider mb-1 flex items-center gap-2">
                      <Users className="w-5 h-5 text-[var(--color-primary)]" /> Onboard New CRM Broker Account
                    </h3>
                    <p className="text-[11px] text-[#8e95a3] mb-5">Create a secure profile record, assign operational roles, and record license numbers.</p>

                    <form onSubmit={handleCreateUserSubmit} className="space-y-4">
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        <div>
                          <label className="block text-[10px] text-[#8e95a3] uppercase font-bold tracking-wider mb-1">First Name</label>
                          <input 
                            type="text" required
                            value={newFirst}
                            onChange={(e) => setNewFirst(e.target.value)}
                            className="w-full bg-[#141418] border border-white/5 rounded-lg px-3 py-2 text-xs text-white focus:outline-none"
                          />
                        </div>
                        <div>
                          <label className="block text-[10px] text-[#8e95a3] uppercase font-bold tracking-wider mb-1">Last Name</label>
                          <input 
                            type="text" required
                            value={newLast}
                            onChange={(e) => setNewLast(e.target.value)}
                            className="w-full bg-[#141418] border border-white/5 rounded-lg px-3 py-2 text-xs text-white focus:outline-none"
                          />
                        </div>
                        <div>
                          <label className="block text-[10px] text-[#8e95a3] uppercase font-bold tracking-wider mb-1">Broker Role</label>
                          <select 
                            value={newRole}
                            onChange={(e) => setNewRole(e.target.value as any)}
                            className="w-full bg-[#141418] border border-white/5 rounded-lg px-3 py-2 text-xs text-white focus:outline-none"
                          >
                            <option value="Agent">Agent (Standard)</option>
                            <option value="Senior Broker">Senior Broker</option>
                            <option value="Super Admin">Super Admin</option>
                            <option value="IT / Developer">IT / Developer</option>
                            <option value="Owner / Master Admin">Owner / Master Admin</option>
                          </select>
                        </div>
                        <div>
                          <label className="block text-[10px] text-[#8e95a3] uppercase font-bold tracking-wider mb-1">Security Login PIN (4 Digits)</label>
                          <input 
                            type="text" maxLength={4} placeholder="0000"
                            value={newPin}
                            onChange={(e) => setNewPin(e.target.value.replace(/\D/g, ""))}
                            className="w-full bg-[#141418] border border-white/5 rounded-lg px-3 py-2 text-xs font-mono text-white focus:outline-none"
                          />
                        </div>
                        <div>
                          <label className="block text-[10px] text-[#8e95a3] uppercase font-bold tracking-wider mb-1">Email Address</label>
                          <input 
                            type="email" required
                            value={newEmail}
                            onChange={(e) => setNewEmail(e.target.value)}
                            className="w-full bg-[#141418] border border-white/5 rounded-lg px-3 py-2 text-xs text-white focus:outline-none"
                          />
                        </div>
                        <div>
                          <label className="block text-[10px] text-[#8e95a3] uppercase font-bold tracking-wider mb-1">Phone Number</label>
                          <input 
                            type="text"
                            value={newPhone}
                            onChange={(e) => setNewPhone(e.target.value)}
                            className="w-full bg-[#141418] border border-white/5 rounded-lg px-3 py-2 text-xs text-white focus:outline-none"
                          />
                        </div>
                      </div>

                      <div className="border-t border-white/5 pt-4 space-y-3">
                        <span className="text-[10px] font-bold uppercase tracking-wider text-[var(--color-primary)] block">Licensing &amp; E&amp;O Registry</span>
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                          <div>
                            <label className="block text-[8px] text-[#8e95a3] uppercase font-bold tracking-wider mb-1">FSRA Registry Number</label>
                            <input 
                              type="text" placeholder="e.g. M18002991"
                              value={newFsra}
                              onChange={(e) => setNewFsra(e.target.value)}
                              className="w-full bg-[#141418] border border-white/5 rounded-lg px-3 py-1.5 text-xs text-white focus:outline-none"
                            />
                          </div>
                          <div>
                            <label className="block text-[8px] text-[#8e95a3] uppercase font-bold tracking-wider mb-1">E&amp;O Insurance Carrier</label>
                            <input 
                              type="text" placeholder="e.g. Creechurch / Lloyds"
                              value={newEoCarrier}
                              onChange={(e) => setNewEoCarrier(e.target.value)}
                              className="w-full bg-[#141418] border border-white/5 rounded-lg px-3 py-1.5 text-xs text-white focus:outline-none"
                            />
                          </div>
                          <div>
                            <label className="block text-[8px] text-[#8e95a3] uppercase font-bold tracking-wider mb-1">E&amp;O Policy Code</label>
                            <input 
                              type="text" placeholder="e.g. EO-882195"
                              value={newEoPolicy}
                              onChange={(e) => setNewEoPolicy(e.target.value)}
                              className="w-full bg-[#141418] border border-white/5 rounded-lg px-3 py-1.5 text-xs text-white focus:outline-none"
                            />
                          </div>
                          <div>
                            <label className="block text-[8px] text-[#8e95a3] uppercase font-bold tracking-wider mb-1">E&amp;O Policy Expiry Date</label>
                            <input 
                              type="date"
                              value={newEoExpiry}
                              onChange={(e) => setNewEoExpiry(e.target.value)}
                              className="w-full bg-[#141418] border border-white/5 rounded-lg px-3 py-1.5 text-xs text-white focus:outline-none"
                            />
                          </div>
                        </div>
                      </div>

                      <div className="flex justify-end gap-3 pt-4 border-t border-white/5">
                        <button
                          type="button"
                          onClick={() => setShowAddUserModal(false)}
                          className="px-4 py-2 bg-white/5 hover:bg-white/10 text-xs font-semibold rounded-lg text-white"
                        >
                          Cancel
                        </button>
                        <button
                          type="submit"
                          className="px-5 py-2 bg-[var(--color-primary)] hover:opacity-90 text-black text-xs font-bold rounded-lg uppercase tracking-wider"
                        >
                          Complete Onboarding
                        </button>
                      </div>
                    </form>
                  </div>
                </div>
              )}

              {/* MODAL: EDIT TEAM MEMBER */}
              {editingUser && (
                <div className="fixed inset-0 bg-black/70 z-50 flex items-center justify-center p-4 backdrop-blur-md">
                  <div className="bg-[#101014] border border-white/10 rounded-xl w-full max-w-2xl max-h-[90vh] overflow-y-auto shadow-2xl p-6 relative">
                    <button 
                      onClick={() => setEditingUser(null)}
                      className="absolute right-4 top-4 text-[#8e95a3] hover:text-white"
                    >
                      ✕
                    </button>
                    
                    <h3 className="text-sm font-bold text-white uppercase tracking-wider mb-1 flex items-center gap-2">
                      <Edit3 className="w-5 h-5 text-[var(--color-primary)]" /> Edit Team Member Profile
                    </h3>
                    <p className="text-[11px] text-[#8e95a3] mb-5">Update details for {editingUser.first} {editingUser.last}.</p>

                    <form onSubmit={handleSaveEditUserSubmit} className="space-y-4">
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        <div>
                          <label className="block text-[10px] text-[#8e95a3] uppercase font-bold tracking-wider mb-1">First Name</label>
                          <input 
                            type="text" required
                            value={editFirst}
                            onChange={(e) => setEditFirst(e.target.value)}
                            className="w-full bg-[#141418] border border-white/5 rounded-lg px-3 py-2 text-xs text-white focus:outline-none"
                          />
                        </div>
                        <div>
                          <label className="block text-[10px] text-[#8e95a3] uppercase font-bold tracking-wider mb-1">Last Name</label>
                          <input 
                            type="text" required
                            value={editLast}
                            onChange={(e) => setEditLast(e.target.value)}
                            className="w-full bg-[#141418] border border-white/5 rounded-lg px-3 py-2 text-xs text-white focus:outline-none"
                          />
                        </div>
                        <div>
                          <label className="block text-[10px] text-[#8e95a3] uppercase font-bold tracking-wider mb-1">Broker Role</label>
                          <select 
                            value={editRole}
                            onChange={(e) => setEditRole(e.target.value as any)}
                            className="w-full bg-[#141418] border border-white/5 rounded-lg px-3 py-2 text-xs text-white focus:outline-none"
                          >
                            <option value="Agent">Agent (Standard)</option>
                            <option value="Senior Broker">Senior Broker</option>
                            <option value="Super Admin">Super Admin</option>
                            <option value="IT / Developer">IT / Developer</option>
                            <option value="Owner / Master Admin">Owner / Master Admin</option>
                          </select>
                        </div>
                        <div>
                          <label className="block text-[10px] text-[#8e95a3] uppercase font-bold tracking-wider mb-1">Security PIN (4 Digits)</label>
                          <input 
                            type="text" maxLength={4}
                            value={editPin}
                            onChange={(e) => setEditPin(e.target.value.replace(/\D/g, ""))}
                            className="w-full bg-[#141418] border border-white/5 rounded-lg px-3 py-2 text-xs font-mono text-white focus:outline-none"
                          />
                        </div>
                        <div>
                          <label className="block text-[10px] text-[#8e95a3] uppercase font-bold tracking-wider mb-1">Email Address</label>
                          <input 
                            type="email" required
                            value={editEmail}
                            onChange={(e) => setEditEmail(e.target.value)}
                            className="w-full bg-[#141418] border border-white/5 rounded-lg px-3 py-2 text-xs text-white focus:outline-none"
                          />
                        </div>
                        <div>
                          <label className="block text-[10px] text-[#8e95a3] uppercase font-bold tracking-wider mb-1">Phone Number</label>
                          <input 
                            type="text"
                            value={editPhone}
                            onChange={(e) => setEditPhone(e.target.value)}
                            className="w-full bg-[#141418] border border-white/5 rounded-lg px-3 py-2 text-xs text-white focus:outline-none"
                          />
                        </div>
                        <div>
                          <label className="block text-[10px] text-[#8e95a3] uppercase font-bold tracking-wider mb-1">Account Active Status</label>
                          <select 
                            value={editStatus}
                            onChange={(e) => setEditStatus(e.target.value as any)}
                            className="w-full bg-[#141418] border border-white/5 rounded-lg px-3 py-2 text-xs text-white focus:outline-none"
                          >
                            <option value="active">Active (On Duty)</option>
                            <option value="inactive">Inactive (Deactivated)</option>
                          </select>
                        </div>
                      </div>

                      <div className="border-t border-white/5 pt-4 space-y-3">
                        <span className="text-[10px] font-bold uppercase tracking-wider text-[var(--color-primary)] block">Licensing &amp; E&amp;O Registry</span>
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                          <div>
                            <label className="block text-[8px] text-[#8e95a3] uppercase font-bold tracking-wider mb-1">FSRA Registry Number</label>
                            <input 
                              type="text" placeholder="M18002991"
                              value={editFsra}
                              onChange={(e) => setEditFsra(e.target.value)}
                              className="w-full bg-[#141418] border border-white/5 rounded-lg px-3 py-1.5 text-xs text-white focus:outline-none"
                            />
                          </div>
                          <div>
                            <label className="block text-[8px] text-[#8e95a3] uppercase font-bold tracking-wider mb-1">E&amp;O Insurance Carrier</label>
                            <input 
                              type="text" placeholder="Creechurch / Lloyds"
                              value={editEoCarrier}
                              onChange={(e) => setEditEoCarrier(e.target.value)}
                              className="w-full bg-[#141418] border border-white/5 rounded-lg px-3 py-1.5 text-xs text-white focus:outline-none"
                            />
                          </div>
                          <div>
                            <label className="block text-[8px] text-[#8e95a3] uppercase font-bold tracking-wider mb-1">E&amp;O Policy Code</label>
                            <input 
                              type="text" placeholder="EO-882195"
                              value={editEoPolicy}
                              onChange={(e) => setEditEoPolicy(e.target.value)}
                              className="w-full bg-[#141418] border border-white/5 rounded-lg px-3 py-1.5 text-xs text-white focus:outline-none"
                            />
                          </div>
                          <div>
                            <label className="block text-[8px] text-[#8e95a3] uppercase font-bold tracking-wider mb-1">E&amp;O Policy Expiry Date</label>
                            <input 
                              type="date"
                              value={editEoExpiry}
                              onChange={(e) => setEditEoExpiry(e.target.value)}
                              className="w-full bg-[#141418] border border-white/5 rounded-lg px-3 py-1.5 text-xs text-white focus:outline-none"
                            />
                          </div>
                        </div>
                      </div>

                      <div className="flex justify-end gap-3 pt-4 border-t border-white/5">
                        <button
                          type="button"
                          onClick={() => setEditingUser(null)}
                          className="px-4 py-2 bg-white/5 hover:bg-white/10 text-xs font-semibold rounded-lg text-white"
                        >
                          Cancel
                        </button>
                        <button
                          type="submit"
                          className="px-5 py-2 bg-[var(--color-primary)] hover:opacity-90 text-black text-xs font-bold rounded-lg uppercase tracking-wider"
                        >
                          Save Changes
                        </button>
                      </div>
                    </form>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* TAB 7: ACCESS & PERMISSIONS (ADMINS/MANAGERS ONLY) */}
          {activeTab === "permissions" && isAdminOrManager && (
            <div className="max-w-3xl space-y-6">
              <div className="bg-[#101014] border border-white/5 p-6 rounded-xl shadow-sm space-y-6">
                <div>
                  <h3 className="text-sm font-bold text-white uppercase tracking-wider mb-1">Role-Based Override Console</h3>
                  <p className="text-[11px] text-[#8e95a3]">Inspect corporate permissions by role, or issue individual custom capability overrides.</p>
                </div>

                <div className="space-y-4">
                  {/* Select user to override */}
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-[#141418]/50 p-4 rounded-lg border border-white/5">
                    <div>
                      <span className="text-xs font-bold text-white block">Target Broker overrides</span>
                      <span className="text-[10px] text-[#8e95a3] block">Select any team member to customize individual permission overrides.</span>
                    </div>
                    
                    <select
                      value={selectedPermUserId}
                      onChange={(e) => setSelectedPermUserId(e.target.value)}
                      className="bg-[#0c0c0e] border border-white/10 rounded-lg px-3 py-1.5 text-xs text-white focus:outline-none w-full sm:w-64"
                    >
                      <option value="">-- Choose a team member --</option>
                      {userRoster.map(u => (
                        <option key={u.id} value={u.id}>{u.first} {u.last} ({u.role})</option>
                      ))}
                    </select>
                  </div>

                  {selectedPermUser ? (
                    <div className="space-y-3.5 pt-2">
                      <div className="text-xs font-bold text-white flex items-center gap-1.5 pb-1 border-b border-white/5">
                        <Key className="w-4 h-4 text-[var(--color-primary)]" /> Override Checklist: {selectedPermUser.first} {selectedPermUser.last}
                      </div>
                      
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                        {permissionMatrix.map((perm) => {
                          const activeOverrides = selectedPermUser.permOverrides || {};
                          const hasCustomOverride = activeOverrides[perm.key] === true;
                          
                          return (
                            <div 
                              key={perm.key} 
                              className="p-3 bg-[#141418] border border-white/5 rounded-lg flex items-center justify-between gap-3 text-xs"
                            >
                              <div className="space-y-0.5">
                                <span className="font-bold text-white block">{perm.name}</span>
                                <span className="text-[9px] text-[#8e95a3] leading-tight block">{perm.desc}</span>
                              </div>
                              <button
                                onClick={() => handleTogglePermissionOverride(perm.key)}
                                className={`px-2 py-1 text-[10px] font-bold rounded transition-colors ${
                                  hasCustomOverride 
                                    ? "bg-[var(--color-primary)] text-black" 
                                    : "bg-white/5 hover:bg-white/10 text-[#8e95a3]"
                                }`}
                              >
                                {hasCustomOverride ? "Override ON" : "Default"}
                              </button>
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  ) : (
                    <div className="p-10 border border-dashed border-white/5 rounded-xl text-center text-xs text-[#8e95a3] bg-[#141418]/10 select-none">
                      Select a staff member above to adjust fine-grained permissions overrides.
                    </div>
                  )}

                  {/* Operational lock control */}
                  <div className="border-t border-white/5 pt-5 space-y-3">
                    <span className="text-[10px] font-bold uppercase tracking-wider text-[#eeeef2] block">Role Permissions Hierarchy Overview</span>
                    <div className="grid grid-cols-5 text-[9px] font-bold bg-[#141418] border border-white/5 rounded p-2 select-none text-center">
                      <span className="text-left text-[#8e95a3]">OPERATION</span>
                      <span className="text-white">Owner</span>
                      <span className="text-[#6fa3b8]">SuperAdmin</span>
                      <span className="text-[#eeeef2]/60">SrBroker</span>
                      <span className="text-[#8e95a3]">Agent</span>
                    </div>
                    <div className="space-y-1 divide-y divide-white/5">
                      {([
                        { op: "View Clients", owner: "✓", sa: "✓", sb: "✓", ag: "✓" },
                        { op: "Edit Clients", owner: "✓", sa: "✓", sb: "✓", ag: "✓" },
                        { op: "GDS Overrides", owner: "✓", sa: "✓", sb: "✓", ag: "—" },
                        { op: "SIN Decryption", owner: "✓", sa: "✓", sb: "✓", ag: "—" },
                        { op: "Delete Files", owner: "✓", sa: "—", sb: "—", ag: "—" }
                      ]).map((row, idx) => (
                        <div key={idx} className="grid grid-cols-5 text-[9px] py-1.5 text-center text-[#8e95a3] font-mono">
                          <span className="text-left font-sans text-white text-[10px]">{row.op}</span>
                          <span className="text-green-400 font-bold">{row.owner}</span>
                          <span className="text-green-400 font-bold">{row.sa}</span>
                          <span className="text-green-400 font-bold">{row.sb}</span>
                          <span className={row.ag === "✓" ? "text-green-400 font-bold" : "text-white/20"}>{row.ag}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* TAB 8: CRM DEFAULTS (ADMINS/MANAGERS ONLY) */}
          {activeTab === "defaults" && isAdminOrManager && (
            <div className="max-w-2xl space-y-6">
              <div className="bg-[#101014] border border-white/5 p-6 rounded-xl shadow-sm space-y-6">
                <div>
                  <h3 className="text-sm font-bold text-white uppercase tracking-wider mb-1">CRM Pipeline &amp; Checklist Defaults</h3>
                  <p className="text-[11px] text-[#8e95a3]">Modify pipeline label names, set default assigned agents, and configure document vaults checkmarks.</p>
                </div>

                <div className="space-y-5">
                  {/* Pipeline Stage Renaming */}
                  <div className="space-y-2.5">
                    <span className="text-[10px] font-bold uppercase tracking-wider text-[var(--color-primary)] block">Pipeline Board Stage Labels</span>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5 bg-[#141418]/60 p-4 rounded-lg border border-white/5">
                      {Object.keys(pipelineLabels).map((key) => (
                        <div key={key}>
                          <label className="block text-[9px] text-[#8e95a3] uppercase font-bold tracking-wider mb-1">
                            {key} Stage Label
                          </label>
                          <input 
                            type="text"
                            value={pipelineLabels[key]}
                            onChange={(e) => handlePipelineLabelChange(key, e.target.value)}
                            className="w-full bg-[#0c0c0e] border border-white/5 rounded px-2.5 py-1.5 text-xs text-white focus:outline-none"
                          />
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* General Ingestion Defaults */}
                  <div className="space-y-3">
                    <span className="text-[10px] font-bold uppercase tracking-wider text-[var(--color-primary)] block">Ingestion &amp; Allocation Defaults</span>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 bg-[#141418]/60 p-4 rounded-lg border border-white/5">
                      <div>
                        <label className="block text-[9px] text-[#8e95a3] uppercase font-bold tracking-wider mb-1">Default Assigned Agent</label>
                        <select 
                          value={defaultAgentId}
                          onChange={(e) => setDefaultAgentId(e.target.value)}
                          className="w-full bg-[#0c0c0e] border border-white/5 rounded px-2.5 py-1.5 text-xs text-white"
                        >
                          {userRoster.map(u => (
                            <option key={u.id} value={u.id}>{u.first} {u.last}</option>
                          ))}
                        </select>
                      </div>

                      <div>
                        <label className="block text-[9px] text-[#8e95a3] uppercase font-bold tracking-wider mb-1">Default Ingestion Source</label>
                        <input 
                          type="text"
                          value={defaultSource}
                          onChange={(e) => setDefaultSource(e.target.value)}
                          className="w-full bg-[#0c0c0e] border border-white/5 rounded px-2.5 py-1.5 text-xs text-white"
                        />
                      </div>
                    </div>
                  </div>

                  {/* Checklist Rules Defaults */}
                  <div className="space-y-3">
                    <span className="text-[10px] font-bold uppercase tracking-wider text-[var(--color-primary)] block">Intake Document Rules Checklist</span>
                    <div className="bg-[#141418]/60 p-4 rounded-lg border border-white/5 space-y-3.5 text-xs text-[#8e95a3]">
                      
                      <div className="flex items-center justify-between">
                        <div>
                          <span className="font-bold text-white block">Require 90-Day Bank Statement Ledger</span>
                          <span className="text-[9px] block">Include down payment ledger trigger on all new purchases automatically.</span>
                        </div>
                        <button onClick={() => setRequire90DayBank(!require90DayBank)}>
                          {require90DayBank ? <ToggleRight className="w-8 h-8 text-[var(--color-primary)]" /> : <ToggleLeft className="w-8 h-8 text-white/20" />}
                        </button>
                      </div>

                      <div className="flex items-center justify-between">
                        <div>
                          <span className="font-bold text-white block">Require Municipal Property Tax Statement</span>
                          <span className="text-[9px] block">Trigger property tax bill verification for all refinance intakes.</span>
                        </div>
                        <button onClick={() => setRequireTaxBill(!requireTaxBill)}>
                          {requireTaxBill ? <ToggleRight className="w-8 h-8 text-[var(--color-primary)]" /> : <ToggleLeft className="w-8 h-8 text-white/20" />}
                        </button>
                      </div>

                      <div className="flex items-center justify-between">
                        <div>
                          <span className="font-bold text-white block">Require Agreement of Purchase &amp; Sale (APS)</span>
                          <span className="text-[9px] block">Enforce APS document slot immediately on purchase client setup.</span>
                        </div>
                        <button onClick={() => setRequireApsPurchase(!requireApsPurchase)}>
                          {requireApsPurchase ? <ToggleRight className="w-8 h-8 text-[var(--color-primary)]" /> : <ToggleLeft className="w-8 h-8 text-white/20" />}
                        </button>
                      </div>

                    </div>
                  </div>

                  <button 
                    onClick={handleSaveCRMDefaults}
                    className="w-full py-2.5 bg-[var(--color-primary)] text-black font-bold text-xs rounded-lg hover:opacity-90 transition-all uppercase tracking-wider mt-2"
                  >
                    Save Corporate Defaults
                  </button>
                </div>
              </div>
            </div>
          )}

        </section>

      </div>
    </div>
  );
};
