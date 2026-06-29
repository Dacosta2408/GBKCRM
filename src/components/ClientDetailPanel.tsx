import React from "react";
import { motion, AnimatePresence } from "motion/react";
import { Sparkles } from "lucide-react";
import { Client, User, Lender } from "../types";
import { ApplicationDetailsForm } from "./ApplicationDetailsForm";
import { DocumentManager } from "./DocumentManager";
import { MortgageChecklist } from "./MortgageChecklist";
import { MortgageActivityTracker } from "./MortgageActivityTracker";

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
  getAgentNames: () => string[];
  showToast: (msg: string, type?: "success" | "error", icon?: string) => void;
}

// Helpers inside the component
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
  getAgentNames,
  showToast
}: ClientDetailPanelProps) {
  if (!currentClient) return null;

  return (
    <AnimatePresence>
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
            <div className="flex items-center gap-2">
              <div className="flex items-center gap-1.5 bg-[#141418] border border-white/10 px-2.5 py-1 rounded-lg">
                <span className="text-[9px] text-[#8e95a3] uppercase font-black tracking-wider">File Stage:</span>
                <select
                  value={currentClient.status}
                  onChange={(e) => handleUpdateClientStatus(currentClient.id, e.target.value)}
                  className="bg-transparent border-none text-[10px] font-extrabold uppercase text-[#b5a642] focus:outline-none cursor-pointer"
                >
                  {["lead", "open", "working", "lender", "conditional", "approved", "funded", "closed"].map(st => (
                    <option key={st} value={st} className="bg-[#141418] text-white font-bold uppercase">{st}</option>
                  ))}
                </select>
              </div>
              <button onClick={closeDetail} className="text-white/40 hover:text-white p-1.5 rounded-lg bg-white/5 hover:bg-white/10 transition-colors">✕</button>
            </div>
          </div>

          {/* TABS SELECT */}
          <div className="flex border-b border-white/5 text-xs bg-[#1b1b20]/10 py-1 select-none overflow-x-auto shrink-0">
            {["Overview", "Application Details", "Documents", "Checklist", "Notes", "Activity", "AI Analysis"].map(tab => (
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
                      <div className="p-4 bg-[#1b1b20] border border-white/5 rounded-xl flex flex-col justify-between">
                        <div>
                          <div className="text-[10px] text-[#8e95a3] uppercase font-semibold">Mortgage Requested</div>
                          <div className="text-xl font-black text-white mt-1">{fd(mtg)}</div>
                        </div>
                        <div className="text-[10px] text-[#8e95a3] mt-2 border-t border-white/5 pt-2">
                          Amortization: 25 Years @ 5.25% (Qualifying)
                        </div>
                      </div>
                      
                      <div className="p-4 bg-[#1b1b20] border border-white/5 rounded-xl flex flex-col justify-between">
                        <div>
                          <div className="text-[10px] text-[#8e95a3] uppercase font-semibold">Property Value</div>
                          <div className="text-xl font-black text-white mt-1">{fd(prop)}</div>
                        </div>
                        <div className="text-[10px] text-[#8e95a3] mt-2 border-t border-white/5 pt-2">
                          LTV Ratio: <span className="font-bold text-[#b5a642]">{prop > 0 ? ((mtg / prop) * 100).toFixed(1) : "0.0"}%</span>
                        </div>
                      </div>
                    </div>

                    {/* GDS / TDS Debt Ratios */}
                    <div className="p-4 bg-[#1b1b20] border border-white/5 rounded-xl">
                      <div className="flex items-center justify-between mb-3 border-b border-white/5 pb-2">
                        <h4 className="text-[10px] uppercase font-bold tracking-wider text-[#b5a642]">Debt Service Ratios</h4>
                        <span className="text-[9px] text-[#8e95a3] uppercase font-medium">Standard thresholds: GDS &lt; 39% | TDS &lt; 44%</span>
                      </div>
                      
                      <div className="space-y-3.5">
                        <div>
                          <div className="flex justify-between items-center text-[10px] mb-1">
                            <span className="text-white/70">Gross Debt Service (GDS)</span>
                            <span className={`font-mono font-bold ${gds > 39 ? "text-red-400" : "text-green-400"}`}>{gds > 0 ? `${gds.toFixed(1)}%` : "0.0%"}</span>
                          </div>
                          <div className="h-1.5 bg-white/5 rounded-full overflow-hidden">
                            <div 
                              className={`h-full rounded-full transition-all duration-500 ${gds > 39 ? "bg-red-500" : "bg-green-500"}`} 
                              style={{ width: `${Math.min(gds, 100)}%` }}
                            ></div>
                          </div>
                        </div>

                        <div>
                          <div className="flex justify-between items-center text-[10px] mb-1">
                            <span className="text-white/70">Total Debt Service (TDS)</span>
                            <span className={`font-mono font-bold ${tds > 44 ? "text-red-400" : "text-green-400"}`}>{tds > 0 ? `${tds.toFixed(1)}%` : "0.0%"}</span>
                          </div>
                          <div className="h-1.5 bg-white/5 rounded-full overflow-hidden">
                            <div 
                              className={`h-full rounded-full transition-all duration-500 ${tds > 44 ? "bg-red-500" : "bg-green-500"}`} 
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
                        className="text-xs bg-[#b5a642]/10 text-[#b5a642] border border-[#b5a642]/20 hover:bg-[#b5a642]/20 font-semibold px-4 py-2 rounded-lg transition-colors flex items-center gap-1.5"
                      >
                        📝 Go to Application Details
                      </button>
                    </div>

                    {/* General Borrower Details Grid */}
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
    </AnimatePresence>
  );
}
