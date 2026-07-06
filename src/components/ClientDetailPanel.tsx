import React from "react";
import { motion, AnimatePresence } from "motion/react";
import { Sparkles, ShieldCheck, ShieldAlert, Download, Trash2, FileText, ChevronDown } from "lucide-react";
import { Client, User, Lender } from "../types";
import { ApplicationDetailsForm } from "./ApplicationDetailsForm";
import { DocumentManager } from "./DocumentManager";
import { MortgageChecklist } from "./MortgageChecklist";
import { MortgageActivityTracker } from "./MortgageActivityTracker";
import { getClientDocuments } from "../lib/bridgeService";

export interface ClientDetailPanelProps {
  currentClient: Client | null;
  currentUser: User;
  clients: Client[];
  lenders: Lender[];
  docVault: Record<string, any>;
  setDocVault: React.Dispatch<React.SetStateAction<Record<string, any>>>;
  detailTab: string;
  setDetailTab: (tab: string) => void;
  closeDetail: () => void;
  openClient: (id: string, initialTab?: string) => void;
  handleUpdateClient: (updatedClient: Client) => void;
  handleUpdateClientStatus: (id: string, status: any) => void;
  triggerUnderwritingAnalysis: (client: Client) => void;
  underwritingLoading?: boolean;
  underwritingError?: string | null;
  getAgentNames: () => string[];
  showToast: (msg: string, type?: "success" | "error", icon?: string) => void;
  bridgeOnline?: boolean;
  handleDeleteClient: (id: string) => Promise<void>;
}

function fd(n: any) {
  if (n === null || n === undefined || isNaN(Number(n))) return "$0";
  return "$" + Math.round(Number(n)).toLocaleString("en-CA");
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

export function ClientDetailPanel({
  currentClient,
  currentUser,
  clients,
  lenders,
  docVault,
  setDocVault,
  detailTab,
  setDetailTab,
  closeDetail,
  openClient,
  handleUpdateClient,
  handleUpdateClientStatus,
  triggerUnderwritingAnalysis,
  underwritingLoading = false,
  underwritingError = null,
  getAgentNames,
  showToast,
  bridgeOnline = false,
  handleDeleteClient
}: ClientDetailPanelProps) {
  if (!currentClient) return null;

  const [showDeleteConfirmModal, setShowDeleteConfirmModal] = React.useState(false);
  const [deleteConfirmInput, setDeleteConfirmInput] = React.useState("");
  const [isDeleting, setIsDeleting] = React.useState(false);

  const handleExportData = async () => {
    try {
      showToast("Preparing complete dossier export...", "success", "📦");
      const docsList = await getClientDocuments(currentClient.id);
      
      const dossier = {
        exportedAt: new Date().toISOString(),
        regulation: "PIPEDA Compliant Single-Client Export",
        clientInfo: currentClient,
        documentsInVault: docsList,
        auditLogsPlaceholder: `Exported by ${currentUser.first} ${currentUser.last} (${currentUser.role})`
      };

      const dataStr = "data:text/json;charset=utf-8," + encodeURIComponent(JSON.stringify(dossier, null, 2));
      const downloadAnchor = document.createElement('a');
      downloadAnchor.setAttribute("href", dataStr);
      downloadAnchor.setAttribute("download", `gbkcrm_dossier_${currentClient.last}_${currentClient.first}.json`);
      document.body.appendChild(downloadAnchor);
      downloadAnchor.click();
      downloadAnchor.remove();

      showToast("Complete dossier downloaded!", "success", "✓");
    } catch (err: any) {
      showToast("Failed to compile export dossier", "error");
    }
  };

  return (
    <AnimatePresence>
      <motion.div 
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 bg-[rgba(12,13,20,0.75)] z-30 backdrop-blur-[8px]"
        onClick={closeDetail}
      >
        <motion.div 
          initial={{ x: "100%" }}
          animate={{ x: 0 }}
          exit={{ x: "100%" }}
          transition={{ type: "spring", damping: 25, stiffness: 180 }}
          onClick={(e) => e.stopPropagation()}
          className="absolute right-0 top-0 bottom-0 w-full max-w-2xl border-l flex flex-col shadow-2xl h-full select-none"
          style={{
            background: "var(--color-surface)",
            backdropFilter: "blur(24px)",
            WebkitBackdropFilter: "blur(24px)",
            borderColor: "var(--color-divider)"
          }}
        >
          {/* Header */}
          <div className="p-5 border-b flex justify-between items-center shrink-0" style={{ borderColor: "var(--color-divider)" }}>
            <div className="flex items-center gap-3">
              <div 
                className="w-10 h-10 rounded-lg font-black text-sm text-[var(--color-text-inverse)] flex items-center justify-center shadow-inner"
                style={{ background: "var(--grad-warm)" }}
              >
                {currentClient.first[0]}{currentClient.last[0]}
              </div>
              <div>
                <h3 className="text-base font-black text-[var(--color-text)]">{currentClient.first} {currentClient.last}</h3>
                <p className="text-[10px] text-[var(--color-text-faint)] font-bold uppercase tracking-wider">{currentClient.type || "Purchase File"}</p>
              </div>
            </div>

            <div className="flex items-center gap-2">
              <div 
                className="flex items-center gap-2 px-3 py-1.5 rounded-full border shadow-sm"
                style={{
                  background: "var(--glass-bg)",
                  borderColor: "var(--glass-border)"
                }}
              >
                <span className="w-1.5 h-1.5 rounded-full bg-[var(--color-accent)] animate-pulse shadow-[0_0_8px_var(--color-accent)]" />
                <span className="text-[9px] text-[var(--color-text-muted)] uppercase font-black tracking-widest leading-none">Stage:</span>
                <select
                  value={currentClient.status}
                  onChange={(e) => handleUpdateClientStatus(currentClient.id, e.target.value)}
                  className="bg-transparent border-none text-[10px] font-black uppercase text-[var(--color-accent)] focus:outline-none cursor-pointer pr-1"
                >
                  {["lead", "open", "working", "lender", "conditional", "approved", "funded", "closed"].map(st => (
                    <option key={st} value={st} className="bg-[var(--color-surface)] text-[var(--color-text)] font-bold uppercase">{st}</option>
                  ))}
                </select>
              </div>
              
              <button 
                onClick={closeDetail} 
                className="text-[var(--color-text-muted)] hover:text-[var(--color-text)] p-2 rounded-full hover:bg-[var(--color-surface-2)]/80 transition-all cursor-pointer border border-transparent hover:border-[var(--color-border)]"
              >
                ✕
              </button>
            </div>
          </div>

          {/* TABS SELECT */}
          <div 
            className="flex border-b text-xs py-1.5 select-none overflow-x-auto shrink-0 px-3.5 gap-1.5 scrollbar-thin"
            style={{ 
              borderColor: "var(--color-divider)",
              background: "rgba(255, 255, 255, 0.01)"
            }}
          >
            {["Overview", "Application Details", "Documents", "Checklist", "Notes", "Activity", "AI Analysis", "Compliance"].map(tab => {
              const isSelected = detailTab === tab.toLowerCase();
              return (
                <button
                  key={tab}
                  onClick={() => setDetailTab(tab.toLowerCase())}
                  className={`px-3.5 py-1.5 font-bold tracking-tight text-[11px] rounded-full transition-all duration-200 shrink-0 cursor-pointer ${
                    isSelected 
                      ? "bg-[var(--color-accent)] text-[#12131a] shadow-md font-black" 
                      : "text-[var(--color-text-muted)] hover:text-[var(--color-text)] hover:bg-[var(--color-surface-2)]/80"
                  }`}
                >
                  {tab}
                </button>
              );
            })}
          </div>

          {/* TAB CONTENT PANEL */}
          <div className="flex-grow overflow-y-auto p-6 scrollbar-thin">
            
            {/* 1. OVERVIEW TAB */}
            {detailTab === "overview" && (
              (() => {
                const inc = pn(currentClient.income) + pn(currentClient.coIncome);
                const mtg = pn(currentClient.mtgamt);
                const prop = pn(currentClient.propval);
                const monthlyMtg = cPmt(mtg, 5.25, 25);
                const tax = pn(currentClient.tax) / 12;
                const condo = pn(currentClient.condo);
                const heat = pn(currentClient.heat) || 150;
                const gds = inc > 0 ? ((monthlyMtg + tax + condo + heat) / (inc / 12) * 100) : 0;
                const debts = pn(currentClient.debts);
                const tds = inc > 0 ? ((monthlyMtg + tax + condo + heat + debts) / (inc / 12) * 100) : 0;

                return (
                  <div className="flex flex-col gap-5">
                    {/* Rich Client Summary Header Cards */}
                    <div className="grid grid-cols-2 gap-4">
                      <div className="glass-card p-4 flex flex-col justify-between">
                        <div>
                          <div className="text-[9px] text-[var(--color-text-muted)] uppercase font-extrabold tracking-wider">Mortgage Requested</div>
                          <div className="text-xl font-black text-[var(--color-text)] mt-1">{fd(mtg)}</div>
                        </div>
                        <div className="text-[9px] text-[var(--color-text-faint)] font-bold mt-2.5 border-t border-[var(--color-border)] pt-2">
                          Amortization: 25 Years @ 5.25% (Qualifying)
                        </div>
                      </div>
                      
                      <div className="glass-card p-4 flex flex-col justify-between">
                        <div>
                          <div className="text-[9px] text-[var(--color-text-muted)] uppercase font-extrabold tracking-wider">Property Value</div>
                          <div className="text-xl font-black text-[var(--color-text)] mt-1">{fd(prop)}</div>
                        </div>
                        <div className="text-[9px] text-[var(--color-text-faint)] font-bold mt-2.5 border-t border-[var(--color-border)] pt-2">
                          LTV Ratio: <span className="font-extrabold text-[var(--color-accent)]">{prop > 0 ? ((mtg / prop) * 100).toFixed(1) : "0.0"}%</span>
                        </div>
                      </div>
                    </div>

                    {/* GDS / TDS Debt Ratios */}
                    <div className="glass-card p-4.5">
                      <div className="flex items-center justify-between mb-3 border-b border-[var(--color-border)] pb-2">
                        <h4 className="text-[9px] uppercase font-black tracking-widest text-[var(--color-accent)]">Debt Service Ratios</h4>
                        <span className="text-[8px] text-[var(--color-text-faint)] uppercase font-black tracking-wide">Qualifying benchmarks: GDS &lt; 39% | TDS &lt; 44%</span>
                      </div>
                      
                      <div className="space-y-4">
                        <div>
                          <div className="flex justify-between items-center text-[10px] mb-1">
                            <span className="text-[var(--color-text-muted)] font-bold">Gross Debt Service (GDS)</span>
                            <span className={`font-mono font-black ${gds > 39 ? "text-[var(--color-error)]" : "text-[var(--color-success)]"}`}>{gds > 0 ? `${gds.toFixed(1)}%` : "0.0%"}</span>
                          </div>
                          <div className="h-1.5 bg-[var(--color-surface-2)] rounded-full overflow-hidden">
                            <div 
                              className={`h-full rounded-full transition-all duration-500 ${gds > 39 ? "bg-[var(--color-error)]" : "bg-[var(--color-success)]"}`} 
                              style={{ width: `${Math.min(gds, 100)}%` }}
                            ></div>
                          </div>
                        </div>

                        <div>
                          <div className="flex justify-between items-center text-[10px] mb-1">
                            <span className="text-[var(--color-text-muted)] font-bold">Total Debt Service (TDS)</span>
                            <span className={`font-mono font-black ${tds > 44 ? "text-[var(--color-error)]" : "text-[var(--color-success)]"}`}>{tds > 0 ? `${tds.toFixed(1)}%` : "0.0%"}</span>
                          </div>
                          <div className="h-1.5 bg-[var(--color-surface-2)] rounded-full overflow-hidden">
                            <div 
                              className={`h-full rounded-full transition-all duration-500 ${tds > 44 ? "bg-[var(--color-error)]" : "bg-[var(--color-success)]"}`} 
                              style={{ width: `${Math.min(tds, 100)}%` }}
                            ></div>
                          </div>
                        </div>
                      </div>
                    </div>

                    {/* Quick Link Button to Application Details */}
                    <div className="flex justify-end">
                      <button
                        onClick={() => setDetailTab("application details")}
                        className="text-[10px] uppercase tracking-wider bg-[var(--color-accent)]/10 text-[var(--color-accent)] border border-[var(--color-accent)]/20 hover:bg-[var(--color-accent)]/20 font-black px-4 py-2 rounded-full transition-colors flex items-center gap-1.5 cursor-pointer"
                      >
                        📝 Go to Application Details
                      </button>
                    </div>

                    {/* General Borrower Details Grid */}
                    <div className="grid grid-cols-2 gap-3.5">
                      <div className="p-3.5 bg-[var(--color-surface-2)]/40 border border-[var(--color-border)] rounded-xl">
                        <div className="text-[9px] text-[var(--color-text-faint)] uppercase font-extrabold tracking-wider">Borrower Name</div>
                        <div className="text-xs font-bold text-[var(--color-text)] mt-1">{currentClient.first} {currentClient.last}</div>
                      </div>
                      <div className="p-3.5 bg-[var(--color-surface-2)]/40 border border-[var(--color-border)] rounded-xl">
                        <div className="text-[9px] text-[var(--color-text-faint)] uppercase font-extrabold tracking-wider">Email Address</div>
                        <div className="text-xs font-bold text-[var(--color-text)] mt-1 truncate">{currentClient.email || "—"}</div>
                      </div>
                      <div className="p-3.5 bg-[var(--color-surface-2)]/40 border border-[var(--color-border)] rounded-xl">
                        <div className="text-[9px] text-[var(--color-text-faint)] uppercase font-extrabold tracking-wider">Cell Phone</div>
                        <div className="text-xs font-bold text-[var(--color-text)] mt-1">{currentClient.cell || "—"}</div>
                      </div>
                      <div className="p-3.5 bg-[var(--color-surface-2)]/40 border border-[var(--color-border)] rounded-xl">
                        <div className="text-[9px] text-[var(--color-text-faint)] uppercase font-extrabold tracking-wider">Employment Type</div>
                        <div className="text-xs font-bold text-[var(--color-text)] mt-1 uppercase tracking-wide">{currentClient.emptype || "Salaried"}</div>
                      </div>
                      <div className="p-3.5 bg-[var(--color-surface-2)]/40 border border-[var(--color-border)] rounded-xl">
                        <div className="text-[9px] text-[var(--color-text-faint)] uppercase font-extrabold tracking-wider">Assigned Broker</div>
                        <div className="text-xs font-bold text-[var(--color-text)] mt-1">{currentClient.agent || "Unassigned"}</div>
                      </div>
                      <div className="p-3.5 bg-[var(--color-surface-2)]/40 border border-[var(--color-border)] rounded-xl">
                        <div className="text-[9px] text-[var(--color-text-faint)] uppercase font-extrabold tracking-wider">Lender Partner</div>
                        <div className="text-xs font-bold text-[var(--color-text)] mt-1">{currentClient.lender || "Not submitted"}</div>
                      </div>
                    </div>
                  </div>
                );
              })()
            )}

            {/* 2. APPLICATION DETAILS TAB (INTERACTIVE SAVING FORM) */}
            {detailTab === "application details" && (
              <ApplicationDetailsForm 
                key={currentClient.id}
                client={currentClient}
                currentUser={currentUser}
                onUpdateClient={handleUpdateClient}
                agentNames={getAgentNames()}
                lenders={lenders}
                showToast={showToast}
              />
            )}

            {/* 4. DOCUMENTS VAULT TAB */}
            {detailTab === "documents" && (
              <div className="flex flex-col gap-4 h-full min-h-[400px]">
                <DocumentManager 
                  key={currentClient.id}
                  clients={clients}
                  currentUser={currentUser}
                  docVault={docVault}
                  setDocVault={setDocVault}
                  onOpenClient={openClient}
                  showToast={showToast}
                  agentNames={getAgentNames()}
                  isOwnerOrManager={currentUser.role === 'Owner / Master Admin' || currentUser.role === 'Super Admin' || currentUser.role === 'IT / Developer'}
                  embeddedClientId={currentClient.id}
                  bridgeOnline={bridgeOnline}
                />
              </div>
            )}

            {/* 5. CHECKLIST STATUS MANAGER TAB */}
            {detailTab === "checklist" && (
              <MortgageChecklist
                key={currentClient.id}
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
                key={currentClient.id}
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
                key={currentClient.id}
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
                  disabled={underwritingLoading}
                  className="w-full text-[var(--color-text-inverse)] disabled:opacity-50 font-black uppercase text-[10px] tracking-wider py-3 rounded-xl hover:opacity-90 transition-all flex items-center justify-center gap-1.5 cursor-pointer shadow-md hover:shadow-[0_0_20px_rgba(200, 146, 42, 0.2)]"
                  style={{ background: "var(--grad-warm)" }}
                >
                  <Sparkles className="w-3.5 h-3.5 fill-current" /> {underwritingLoading ? "Analyzing File..." : "Run Deep Underwrite Analysis (Gemini)"}
                </button>

                {underwritingLoading ? (
                  <div className="glass-card p-4 flex flex-col gap-3.5 animate-pulse">
                    <div className="text-[10px] font-black text-[var(--color-accent)] uppercase tracking-wider flex items-center gap-1.5">
                      <Sparkles className="w-3.5 h-3.5 text-[var(--color-accent)]" /> Formulating Automated Underwriter Report...
                    </div>
                    <div className="h-4 bg-[var(--color-surface-2)] rounded w-3/4"></div>
                    <div className="h-4 bg-[var(--color-surface-2)] rounded w-5/6"></div>
                    <div className="h-4 bg-[var(--color-surface-2)] rounded w-2/3"></div>
                    <div className="h-4 bg-[var(--color-surface-2)] rounded w-1/2"></div>
                  </div>
                ) : underwritingError ? (
                  <div className="p-4 bg-[var(--color-error-subtle)] border border-[var(--color-error)]/20 rounded-xl flex flex-col gap-2">
                    <div className="text-[9px] font-black text-[var(--color-error)] uppercase tracking-widest flex items-center gap-1.5">
                      ⚠️ Diagnostics Error
                    </div>
                    <p className="text-xs text-[var(--color-text)] leading-relaxed font-sans bg-[var(--color-surface-2)] p-2.5 rounded border border-[var(--color-error)]/15 font-mono">
                      {underwritingError}
                    </p>
                    <p className="text-[9px] text-[var(--color-text-muted)] font-bold">
                      Please check bridge server console logs, verify network Z drive connectivity, or configure VITE_GEMINI_API_KEY.
                    </p>
                  </div>
                ) : (
                  <div className="glass-card p-4">
                    <div className="text-[9px] font-black text-[var(--color-accent)] uppercase tracking-widest mb-3 pb-2 border-b border-[var(--color-border)]">Automated AI Underwriter Dossier</div>
                    <div className="text-xs leading-relaxed text-[var(--color-text)] whitespace-pre-wrap font-medium">
                      {currentClient.aiSummary || "No dossier report has been compiled yet. Click the button above to initiate deep Gemini engine analysis."}
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* 9. COMPLIANCE & PIPEDA TAB */}
            {detailTab === "compliance" && (
              <div className="flex flex-col gap-6">
                <div className="glass-card p-5 flex flex-col gap-3.5">
                  <div className="flex items-start gap-3">
                    <div className="p-2.5 bg-[var(--color-success-subtle)] rounded-xl text-[var(--color-success)] mt-0.5 animate-pulse">
                      <ShieldCheck className="w-5 h-5" />
                    </div>
                    <div>
                      <h4 className="text-xs font-black text-[var(--color-text)] uppercase tracking-wider">PIPEDA Portability & Archive Right</h4>
                      <p className="text-[10px] text-[var(--color-text-muted)] font-semibold leading-relaxed mt-1">
                        Under personal electronic portability standards (PIPEDA), clients have a legal "Right to Portability". You can export a comprehensive single-client backup archive containing all personal assets, checklists, and metadata.
                      </p>
                    </div>
                  </div>

                  <div className="border-t border-[var(--color-border)] pt-3.5 mt-1 flex justify-end">
                    <button
                      onClick={handleExportData}
                      className="bg-[var(--color-surface-2)] hover:bg-[var(--color-surface-3)] text-[var(--color-text)] border border-[var(--color-border)] font-black uppercase text-[10px] tracking-wider px-4 py-2.5 rounded-full transition-all flex items-center gap-1.5 cursor-pointer"
                    >
                      <Download className="w-3.5 h-3.5" /> Export Client Dossier
                    </button>
                  </div>
                </div>

                <div className="bg-[var(--color-error-subtle)]/30 border border-[var(--color-error)]/20 rounded-xl p-5 flex flex-col gap-3.5">
                  <div className="flex items-start gap-3">
                    <div className="p-2.5 bg-[var(--color-error-subtle)] rounded-xl text-[var(--color-error)] mt-0.5">
                      <ShieldAlert className="w-5 h-5" />
                    </div>
                    <div>
                      <h4 className="text-xs font-black text-[var(--color-error)] uppercase tracking-wider">Absolute Erasure under PIPEDA</h4>
                      <p className="text-[10px] text-[var(--color-text-muted)] font-semibold leading-relaxed mt-1">
                        Permanently destroy this client folder, including all uploaded electronic assets, checklist states, and logs from local storage. This erasure is binding, permanent, and completely irreversible.
                      </p>
                    </div>
                  </div>

                  <div className="border-t border-[var(--color-error)]/15 pt-3.5 mt-1 flex justify-end">
                    <button
                      onClick={() => setShowDeleteConfirmModal(true)}
                      className="bg-[var(--color-error-subtle)] hover:bg-[var(--color-error-subtle)]/80 text-[var(--color-error)] border border-[var(--color-error)]/25 font-black uppercase text-[10px] tracking-wider px-4 py-2.5 rounded-full transition-all flex items-center gap-1.5 cursor-pointer"
                    >
                      <Trash2 className="w-3.5 h-3.5" /> Request Absolute erasure
                    </button>
                  </div>
                </div>
              </div>
            )}
          </div>
        </motion.div>
      </motion.div>

      {/* Absolute PIPEDA Delete Confirmation Modal */}
      {showDeleteConfirmModal && (
        <div className="fixed inset-0 bg-[rgba(12,13,20,0.75)] z-50 flex items-center justify-center p-4 backdrop-blur-[8px]">
          <div className="panel-card border border-[var(--color-error)]/20 rounded-2xl w-full max-w-md p-6 shadow-2xl relative">
            <button 
              onClick={() => {
                setShowDeleteConfirmModal(false);
                setDeleteConfirmInput("");
              }} 
              className="absolute right-4 top-4 text-[var(--color-text-muted)] hover:text-[var(--color-text)] p-1 rounded-full hover:bg-[var(--color-surface-2)] transition-all cursor-pointer"
            >
              ✕
            </button>
            <div className="flex items-center gap-2 text-[var(--color-error)] font-black text-xs uppercase tracking-wider mb-2">
              <ShieldAlert className="w-4 h-4" /> Absolute Deletion Request
            </div>
            <p className="text-[11px] text-[var(--color-text-muted)] font-semibold leading-relaxed mb-4">
              This erasure operation is <span className="text-[var(--color-error)] font-bold">PERMANENT and IRREVERSIBLE</span>. All personal records, uploaded mortgage documents, checklist states, and notes associated with <strong>{currentClient.first} {currentClient.last}</strong> will be wiped forever.
            </p>
            
            <div className="bg-[var(--color-error-subtle)] border border-[var(--color-error)]/15 rounded-xl p-3.5 mb-4 text-[11px] text-[var(--color-error)] font-bold">
              To authorize this request, please type the client's full name exactly: <strong className="text-[var(--color-text)] select-all">{currentClient.first} {currentClient.last}</strong>
            </div>

            <input 
              type="text" 
              placeholder="Type client's full name to authorize"
              value={deleteConfirmInput}
              onChange={(e) => setDeleteConfirmInput(e.target.value)}
              className="w-full bg-[var(--color-bg)] border border-[var(--color-error)]/25 rounded-xl px-4 py-3 text-xs text-[var(--color-text)] focus:outline-none focus:border-[var(--color-error)]/50 mb-4 text-center font-bold tracking-wide"
            />

            <div className="flex gap-3">
              <button
                type="button"
                onClick={() => {
                  setShowDeleteConfirmModal(false);
                  setDeleteConfirmInput("");
                }}
                className="flex-1 bg-[var(--color-surface-2)] hover:bg-[var(--color-surface-3)] text-[var(--color-text)] font-black uppercase text-[10px] tracking-wider py-3 rounded-xl transition-all cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="button"
                disabled={deleteConfirmInput !== `${currentClient.first} ${currentClient.last}` || isDeleting}
                onClick={async () => {
                  if (deleteConfirmInput !== `${currentClient.first} ${currentClient.last}`) return;
                  setIsDeleting(true);
                  try {
                    await handleDeleteClient(currentClient.id);
                    showToast(`Client dossier for ${currentClient.first} ${currentClient.last} deleted under PIPEDA.`, "success", "🗑️");
                    closeDetail();
                  } catch (err) {
                    showToast("Failed to delete client dossier.", "error");
                  } finally {
                    setIsDeleting(false);
                    setShowDeleteConfirmModal(false);
                    setDeleteConfirmInput("");
                  }
                }}
                className="flex-1 bg-[var(--color-error)] hover:opacity-90 disabled:opacity-30 text-white font-black uppercase text-[10px] tracking-wider py-3 rounded-xl transition-all cursor-pointer"
              >
                {isDeleting ? "Processing Erasure..." : "Absolute Erasure"}
              </button>
            </div>
          </div>
        </div>
      )}

    </AnimatePresence>
  );
}
