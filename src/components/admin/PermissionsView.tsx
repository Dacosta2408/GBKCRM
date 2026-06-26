import React, { useState, useMemo } from "react";
import { 
  ShieldCheck, Shield, Users, Layers, LayoutGrid, CheckSquare, 
  Settings, Key, AlertTriangle, AlertCircle, Sparkles, Check, X
} from "lucide-react";
import { User } from "../../types";

interface PermissionsViewProps {
  userRoster: User[];
  setUserRoster: React.Dispatch<React.SetStateAction<User[]>>;
  currentUser: User;
  showToast: (msg: string, type?: "success" | "error") => void;
  logActivity: (action: string, details: string) => void;
}

// Key CRM modules and permissions
interface ModulePermission {
  key: string;
  name: string;
  description: string;
}

export const PermissionsView: React.FC<PermissionsViewProps> = ({
  userRoster,
  setUserRoster,
  currentUser,
  showToast,
  logActivity
}) => {
  const [selectedUserId, setSelectedUserId] = useState<string>(userRoster[0]?.id || "");
  const [activeRoleTab, setActiveRoleTab] = useState<User["role"]>("Agent");

  // Define CRM Modules
  const crmModules: ModulePermission[] = [
    { key: "dashboard", name: "Operations Dashboard", description: "Overview of brokerage parameters, recent messages, and tasks." },
    { key: "clients", name: "Client Database & SIN", description: "Access detailed borrower records, credit scores, and financial data." },
    { key: "pipeline", name: "Underwriting Pipeline", description: "Manage mortgage stages from lead to final funded milestone." },
    { key: "ai_intake", name: "AI Intake Parsing", description: "Trigger Gemini AI document reading and OCR application ingestion." },
    { key: "documents", name: "Secure Document Vault", description: "Download and organize legal checklists, identity proof, and tax stubs." },
    { key: "checklist", name: "Mortgage Checklists", description: "Set progress objectives, underwriting conditions, and stress tests." },
    { key: "calendar", name: "Events Timeline & Birthday Trackers", description: "Coordinate meetings, loan maturity dates, and team events." },
    { key: "messages", name: "Secure Team Chat Channels", description: "Join real-time internal group chats and broker forums." },
    { key: "email", name: "Connected Email Workspace", description: "Send client commitment templates and synchronize IMAP accounts." },
    { key: "reports", name: "Pipeline analytics & KPI Audits", description: "Inspect conversion, lender share charts, and performance logs." },
    { key: "settings", name: "Personal Account Settings", description: "Configure personal pins, profile avatars, and IMAP SMTP nodes." },
    { key: "admin_control", name: "Admin Control Center", description: "Ultimate oversight: backups, user recruitment, and logging." }
  ];

  // Role Default Templates Mappings
  const roleDefaultPermissions: Record<User["role"], Record<string, boolean>> = {
    "Owner / Master Admin": {
      dashboard: true, clients: true, pipeline: true, ai_intake: true, documents: true, 
      checklist: true, calendar: true, messages: true, email: true, reports: true, 
      settings: true, admin_control: true
    },
    "Super Admin": {
      dashboard: true, clients: true, pipeline: true, ai_intake: true, documents: true, 
      checklist: true, calendar: true, messages: true, email: true, reports: true, 
      settings: true, admin_control: true
    },
    "IT / Developer": {
      dashboard: true, clients: false, pipeline: false, ai_intake: true, documents: false, 
      checklist: false, calendar: true, messages: true, email: false, reports: true, 
      settings: true, admin_control: true
    },
    "Senior Broker": {
      dashboard: true, clients: true, pipeline: true, ai_intake: true, documents: true, 
      checklist: true, calendar: true, messages: true, email: true, reports: true, 
      settings: true, admin_control: false
    },
    "Agent": {
      dashboard: true, clients: true, pipeline: true, ai_intake: true, documents: true, 
      checklist: true, calendar: true, messages: true, email: true, reports: false, 
      settings: true, admin_control: false
    }
  };

  // Find currently selected user
  const selectedUser = useMemo(() => {
    return userRoster.find(u => u.id === selectedUserId) || userRoster[0];
  }, [userRoster, selectedUserId]);

  // Handle custom user-level override toggling
  const handleToggleOverride = (moduleKey: string) => {
    if (!selectedUser) return;
    
    // Safety check: Cannot revoke your own master access
    if (selectedUser.id === currentUser.id && moduleKey === "admin_control") {
      showToast("Compliance Rule: You cannot revoke Admin Control access from your own credentials.", "error");
      return;
    }

    const currentOverrides = selectedUser.permOverrides || {};
    const defaultValue = roleDefaultPermissions[selectedUser.role]?.[moduleKey] ?? false;
    
    // Toggle: if it is explicitly set, toggle it, otherwise set opposite of default
    const currentExplicit = currentOverrides[moduleKey];
    let nextOverride: boolean | undefined = undefined;

    if (currentExplicit === undefined) {
      // Not yet overridden, set opposite of default
      nextOverride = !defaultValue;
    } else {
      // If it matches default, remove override, else return to default
      nextOverride = undefined;
    }

    const nextOverrides = { ...currentOverrides };
    if (nextOverride === undefined) {
      delete nextOverrides[moduleKey];
    } else {
      nextOverrides[moduleKey] = nextOverride;
    }

    const updatedUser = { ...selectedUser, permOverrides: nextOverrides };
    const updated = userRoster.map(u => u.id === selectedUser.id ? updatedUser : u);
    
    setUserRoster(updated);
    logActivity(
      "Permission Override Changed", 
      `User ${selectedUser.first} ${selectedUser.last} custom override for '${moduleKey}' set to ${nextOverride === undefined ? "Default" : nextOverride}`
    );
    showToast(`Access updated for ${selectedUser.first}.`, "success");
  };

  // Check if a module is allowed for the selected user (default + overrides)
  const isModuleAllowedForUser = (user: User, moduleKey: string) => {
    const overrides = user.permOverrides || {};
    if (overrides[moduleKey] !== undefined) {
      return overrides[moduleKey];
    }
    return roleDefaultPermissions[user.role]?.[moduleKey] ?? false;
  };

  return (
    <div className="space-y-6" id="permissions-manager">
      
      {/* Upper Grid: Role templates showcase vs Single user selector */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* Role Templates Card */}
        <div className="lg:col-span-1 bg-[#121216] border border-white/5 p-5 rounded-xl shadow-lg flex flex-col h-[340px]">
          <div className="flex items-center gap-2 border-b border-white/5 pb-3 mb-4">
            <ShieldCheck className="w-4.5 h-4.5 text-[#b5a642]" />
            <h4 className="text-xs font-bold text-[#eeeef2] uppercase tracking-wider">Default Role Templates</h4>
          </div>

          {/* Role selector list */}
          <div className="flex flex-col gap-1.5 overflow-y-auto flex-1 pr-1">
            {Object.keys(roleDefaultPermissions).map((role) => {
              const count = userRoster.filter(u => u.role === role).length;
              const isSelected = activeRoleTab === role;

              return (
                <button
                  key={role}
                  onClick={() => setActiveRoleTab(role as User["role"])}
                  className={`px-3 py-2.5 rounded-lg border text-left flex items-center justify-between transition-all ${
                    isSelected 
                      ? "bg-[#b5a642]/10 border-[#b5a642]/30 text-[#b5a642]" 
                      : "bg-[#181820]/40 border-white/5 text-white/60 hover:text-white hover:bg-[#181820]"
                  }`}
                >
                  <div>
                    <span className="text-xs font-bold block">{role}</span>
                    <span className="text-[10px] opacity-60 mt-0.5 block">{count} Active Members</span>
                  </div>
                  <Shield className="w-3.5 h-3.5 opacity-60" />
                </button>
              );
            })}
          </div>
        </div>

        {/* Override Inspector User selector */}
        <div className="lg:col-span-2 bg-[#121216] border border-white/5 p-5 rounded-xl shadow-lg flex flex-col h-[340px]">
          <div className="flex items-center justify-between border-b border-white/5 pb-3 mb-4">
            <div className="flex items-center gap-2">
              <Users className="w-4.5 h-4.5 text-[#6fa3b8]" />
              <h4 className="text-xs font-bold text-[#eeeef2] uppercase tracking-wider">Custom Override Selector</h4>
            </div>
            <span className="text-[9px] bg-[#6fa3b8]/15 text-[#6fa3b8] font-mono px-2 py-0.5 rounded border border-[#6fa3b8]/20">
              User-Specific Adjustments
            </span>
          </div>

          <div className="space-y-4 flex-1 flex flex-col justify-between">
            <div>
              <label className="block text-[10px] font-black uppercase text-white/40 tracking-wider mb-2">Select Target Broker Account</label>
              <select
                value={selectedUserId}
                onChange={(e) => setSelectedUserId(e.target.value)}
                className="w-full bg-[#181820] border border-white/5 rounded-lg px-3 py-2.5 text-xs text-white outline-none cursor-pointer focus:border-[#6fa3b8]/30 transition-all"
              >
                {userRoster.map(u => (
                  <option key={u.id} value={u.id}>{u.first} {u.last} ({u.role})</option>
                ))}
              </select>
            </div>

            {selectedUser && (
              <div className="bg-[#181822]/40 border border-white/5 rounded-xl p-4 flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full bg-[#6fa3b8]/10 border border-[#6fa3b8]/30 flex items-center justify-center font-bold text-sm text-[#6fa3b8]">
                    {selectedUser.first[0]}{selectedUser.last[0]}
                  </div>
                  <div>
                    <p className="text-xs font-bold text-white">{selectedUser.first} {selectedUser.last}</p>
                    <p className="text-[10px] text-white/40 font-semibold">{selectedUser.jobTitle || selectedUser.role} • {selectedUser.email}</p>
                  </div>
                </div>

                <div className="text-right">
                  <span className="text-[10px] font-black uppercase tracking-wider text-[#b5a642] block">
                    {Object.keys(selectedUser.permOverrides || {}).length} Overrides
                  </span>
                  <button
                    onClick={() => {
                      const updated = userRoster.map(u => u.id === selectedUser.id ? { ...u, permOverrides: {} } : u);
                      setUserRoster(updated);
                      showToast(`Cleared all access overrides for ${selectedUser.first}.`, "success");
                    }}
                    disabled={!selectedUser.permOverrides || Object.keys(selectedUser.permOverrides).length === 0}
                    className="text-[9px] text-red-400 hover:text-red-300 font-bold uppercase mt-1 tracking-wider block disabled:opacity-40 disabled:no-underline hover:underline cursor-pointer"
                  >
                    Reset to defaults
                  </button>
                </div>
              </div>
            )}

            <div className="text-[11px] text-white/30 italic">
              💡 Select any module below to override the default access permissions. Red-labeled overrides are denied, green are authorized.
            </div>
          </div>
        </div>

      </div>

      {/* Permissions Matrix Layout */}
      <div className="bg-[#111115] border border-white/5 rounded-xl overflow-hidden shadow-lg" id="permissions-grid">
        <div className="bg-[#141419] px-5 py-3 border-b border-white/5 flex items-center justify-between">
          <span className="text-[10px] text-white/40 font-black uppercase tracking-wider">CRM Modules Matrix</span>
          <span className="text-[10px] text-[#b5a642] font-semibold">
            Configuring override for: <span className="font-bold underline">{selectedUser?.first} {selectedUser?.last}</span>
          </span>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 divide-y md:divide-y-0 md:divide-x divide-white/5">
          
          {/* Col 1 */}
          <div className="divide-y divide-white/5">
            {crmModules.slice(0, 6).map((mod) => {
              const allowed = selectedUser ? isModuleAllowedForUser(selectedUser, mod.key) : false;
              const isOverridden = selectedUser?.permOverrides?.[mod.key] !== undefined;

              return (
                <div key={mod.key} className="p-4 flex items-center justify-between gap-4 hover:bg-white/[0.01] transition-all">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <span className="text-xs font-bold text-[#eeeef2]">{mod.name}</span>
                      {isOverridden && (
                        <span className="text-[8px] bg-[#6fa3b8]/15 text-[#6fa3b8] font-mono px-1.5 py-0.5 rounded border border-[#6fa3b8]/20 uppercase">
                          Override
                        </span>
                      )}
                    </div>
                    <p className="text-[10px] text-white/40 font-semibold leading-relaxed mt-1">{mod.description}</p>
                  </div>

                  <button
                    onClick={() => handleToggleOverride(mod.key)}
                    className={`shrink-0 w-20 py-1.5 rounded-lg text-[9px] font-black uppercase tracking-wider border text-center transition-all ${
                      allowed
                        ? "bg-emerald-500/10 text-emerald-400 border-emerald-500/20 hover:bg-emerald-500/20"
                        : "bg-red-500/10 text-red-400 border-red-500/20 hover:bg-red-500/20"
                    }`}
                  >
                    {allowed ? "Allowed" : "Denied"}
                  </button>
                </div>
              );
            })}
          </div>

          {/* Col 2 */}
          <div className="divide-y divide-white/5">
            {crmModules.slice(6, 12).map((mod) => {
              const allowed = selectedUser ? isModuleAllowedForUser(selectedUser, mod.key) : false;
              const isOverridden = selectedUser?.permOverrides?.[mod.key] !== undefined;

              return (
                <div key={mod.key} className="p-4 flex items-center justify-between gap-4 hover:bg-white/[0.01] transition-all">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <span className="text-xs font-bold text-[#eeeef2]">{mod.name}</span>
                      {isOverridden && (
                        <span className="text-[8px] bg-[#6fa3b8]/15 text-[#6fa3b8] font-mono px-1.5 py-0.5 rounded border border-[#6fa3b8]/20 uppercase">
                          Override
                        </span>
                      )}
                    </div>
                    <p className="text-[10px] text-white/40 font-semibold leading-relaxed mt-1">{mod.description}</p>
                  </div>

                  <button
                    onClick={() => handleToggleOverride(mod.key)}
                    className={`shrink-0 w-20 py-1.5 rounded-lg text-[9px] font-black uppercase tracking-wider border text-center transition-all ${
                      allowed
                        ? "bg-emerald-500/10 text-emerald-400 border-emerald-500/20 hover:bg-emerald-500/20"
                        : "bg-red-500/10 text-red-400 border-red-500/20 hover:bg-red-500/20"
                    }`}
                  >
                    {allowed ? "Allowed" : "Denied"}
                  </button>
                </div>
              );
            })}
          </div>

        </div>
      </div>

    </div>
  );
};
