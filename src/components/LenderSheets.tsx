import React, { useState } from "react";
import { 
  Search, Plus, Edit2, Trash2, Globe, Mail, Phone, 
  ShieldAlert, CheckCircle2, AlertCircle, Sparkles, 
  ExternalLink, FileText, Check, TrendingUp, User, X, Info
} from "lucide-react";
import { Lender, Client } from "../types";

interface LenderSheetsProps {
  lenders: Lender[];
  setLenders: React.Dispatch<React.SetStateAction<Lender[]>>;
  clients: Client[];
  showToast: (msg: string, type?: "success" | "error" | "info" | "warning", icon?: string) => void;
  onOpenComposeEmail?: (defaultTo: string, defaultSubject: string, defaultBody: string) => void;
}

export const LenderSheets: React.FC<LenderSheetsProps> = ({
  lenders,
  setLenders,
  clients,
  showToast,
  onOpenComposeEmail
}) => {
  // Tabs and view filters
  const [activeTier, setActiveTier] = useState<string>("All");
  const [searchQuery, setSearchQuery] = useState<string>("");
  const [activeSubTab, setActiveSubTab] = useState<"directory" | "matcher" | "trends">("directory");

  // Client matcher state
  const [selectedMatchClient, setSelectedMatchClient] = useState<string>("");
  const [matcherBeacon, setMatcherBeacon] = useState<number>(720);
  const [matcherBFS, setMatcherBFS] = useState<boolean>(false);
  const [matcherLTV, setMatcherLTV] = useState<number>(75);
  const [matcherAmortization, setMatcherAmortization] = useState<number>(25);
  const [matcherPropertyType, setMatcherPropertyType] = useState<string>("residential");

  // Selected Lender details modal & scenario builder
  const [selectedLender, setSelectedLender] = useState<Lender | null>(null);
  const [scenarioText, setScenarioText] = useState<string>("");

  // Editor states
  const [isEditModalOpen, setIsEditModalOpen] = useState<boolean>(false);
  const [editingLender, setEditingLender] = useState<Lender | null>(null); // null means adding a new lender

  // Form input states
  const [formName, setFormName] = useState<string>("");
  const [formTier, setFormTier] = useState<"A" | "CU" | "B" | "P">("A");
  const [formRate, setFormRate] = useState<string>("");
  const [formBdm, setFormBdm] = useState<string>("");
  const [formPhone, setFormPhone] = useState<string>("");
  const [formEmail, setFormEmail] = useState<string>("");
  const [formProducts, setFormProducts] = useState<string>("");
  const [formNotes, setFormNotes] = useState<string>("");

  // Handlers
  const handleOpenEditModal = (lender?: Lender) => {
    if (lender) {
      setEditingLender(lender);
      setFormName(lender.name);
      setFormTier(lender.tier);
      setFormRate(String(lender.rate || ""));
      setFormBdm(lender.bdm || "");
      setFormPhone(lender.phone || "");
      setFormEmail(lender.email || "");
      setFormProducts(lender.products || "");
      setFormNotes(lender.notes || "");
    } else {
      setEditingLender(null);
      setFormName("");
      setFormTier("A");
      setFormRate("");
      setFormBdm("");
      setFormPhone("");
      setFormEmail("");
      setFormProducts("");
      setFormNotes("");
    }
    setIsEditModalOpen(true);
  };

  const handleSaveLender = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formName.trim()) {
      showToast("Lender name is required.", "error", "⚠️");
      return;
    }

    const lenderData: Lender = {
      name: formName.trim(),
      tier: formTier,
      rate: formRate.trim(),
      bdm: formBdm.trim(),
      phone: formPhone.trim(),
      email: formEmail.trim(),
      products: formProducts.trim(),
      notes: formNotes.trim()
    };

    if (editingLender) {
      // Update existing
      setLenders(prev => prev.map(x => x.name === editingLender.name ? lenderData : x));
      showToast(`${lenderData.name} details key updated!`, "success", "✓");
    } else {
      // Add new
      if (lenders.some(x => x.name.toLowerCase() === lenderData.name.toLowerCase())) {
        showToast("A lender with this name already exists.", "error", "⚠️");
        return;
      }
      setLenders(prev => [...prev, lenderData]);
      showToast(`${lenderData.name} added to lender registry!`, "success", "✓");
    }
    setIsEditModalOpen(false);
  };

  const handleDeleteLender = (name: string) => {
    if (window.confirm(`Are you sure you want to remove ${name} from your lender sheets?`)) {
      setLenders(prev => prev.filter(x => x.name !== name));
      showToast(`${name} removed, custom state updated.`, "info", "✓");
      if (selectedLender?.name === name) {
        setSelectedLender(null);
      }
    }
  };

  // Pre-load client details into scenario matcher
  const handleLoadClientDetails = (clientId: string) => {
    const cl = clients.find(c => c.id === clientId);
    if (!cl) return;
    setSelectedMatchClient(clientId);

    // Extract credit, BFS, LTV from client, handling default cases
    const score = parseInt(String(cl.beacon || "700")) || 700;
    setMatcherBeacon(score);

    const isBfs = cl.emptype?.toLowerCase() === "bfs" || cl.emptype?.toLowerCase() === "self-employed";
    setMatcherBFS(isBfs);

    const ltvVal = cl.propval && cl.mtgamt ? Math.round((parseFloat(String(cl.mtgamt)) / parseFloat(String(cl.propval))) * 100) : 75;
    setMatcherLTV(ltvVal > 0 && ltvVal <= 100 ? ltvVal : 80);

    const condoVal = parseFloat(String(cl.condo || "0")) > 0;
    setMatcherPropertyType(condoVal ? "condo" : "residential");

    showToast(`Scenario constraints pre-populated from ${cl.first} ${cl.last}!`, "success", "✓");
  };

  // Compile Scenario Email Draft
  const handleCompileScenarioEmail = (lender: Lender) => {
    if (!lender.email) {
      showToast("No BDM email listed for this lender.", "error", "⚠️");
      return;
    }

    const clientLabel = selectedMatchClient 
      ? clients.find(c => c.id === selectedMatchClient)?.first || "Client"
      : "Client";

    const emailSubject = `Scenarios Check: BFS/Alt-A File Check - ${clientLabel}`;
    const emailBody = `Hi ${lender.bdm || "BDM"},\n\nHope you are doing well.\n\nI wanted to test a quick scenario with ${lender.name} before submitting:\n- Property Type/State: ${matcherPropertyType === "condo" ? "Condominium" : "Single Residential"}\n- Borrower Beacon: ${matcherBeacon}\n- Loan-to-Value (LTV): ${matcherLTV}%\n- Self-Employed (BFS): ${matcherBFS ? "Stated Stated BFS (Yes)" : "Standard Salaried (No)"}\n- Required Amortization: ${matcherAmortization} year${matcherAmortization > 25 ? "s (Alt Program)" : ""}\n\nCould you please let me know if your current policy supports this risk profile under your A-tier or Alt-B programs, and confirm if special rates (currently listed at ${lender.rate || "standard"}%) would apply?\n\nThank you, and speak soon!\n\nBroker Team\nGBK Financial`;

    if (onOpenComposeEmail) {
      onOpenComposeEmail(lender.email, emailSubject, emailBody);
      showToast(`Draft created. Opening Gmail compose tab...`, "success", "✉");
    } else {
      // Fallback: Copy to clipboard
      navigator.clipboard.writeText(emailBody);
      showToast(`Draft copied to clipboard. (Receiver: ${lender.email})`, "success", "📋");
    }
  };

  // Algorithm scoring for Scenario Matcher
  const getMatchScore = (lender: Lender) => {
    let score = 100;
    const notesLower = (lender.notes || "").toLowerCase();
    const prodLower = (lender.products || "").toLowerCase();

    // 1. Beacon Score Checks
    if (matcherBeacon < 580) {
      if (lender.tier === "A") score -= 70; // Hard fail for Big A
      else if (lender.tier === "CU") score -= 50;
      else if (lender.tier === "B") score -= 20; // Alt-B accepts lower
      else if (lender.tier === "P") score += 15; // Private thrives here
    } else if (matcherBeacon < 620) {
      if (lender.tier === "A") score -= 45;
      else if (lender.tier === "CU") score -= 30;
      else if (lender.tier === "B") score += 10;
    } else if (matcherBeacon >= 680) {
      if (lender.tier === "A") score += 10;
    }

    // 2. BFS stated business
    if (matcherBFS) {
      if (lender.tier === "A") {
        if (!notesLower.includes("self") && !notesLower.includes("bfs") && !prodLower.includes("bfs")) {
          score -= 30; // Not a BFS focused lender
        } else score += 10;
      }
      if (lender.tier === "B") {
        if (notesLower.includes("self") || notesLower.includes("stated") || notesLower.includes("bfs")) {
          score += 20; // Prime BFS program
        }
      }
    }

    // 3. LTV Checks
    if (matcherLTV > 80) {
      if (lender.tier === "B") {
        score -= 40; // Alt-B max 80% LTV typically
      }
      if (lender.tier === "P") {
        score -= 50; // Privates max 65-75% typically
      }
      if (lender.tier === "A") {
        // High ratio monoline support
        if (notesLower.includes("high-ratio") || notesLower.includes("high ratio") || notesLower.includes("monoline")) {
          score += 15;
        }
      }
    }

    // 4. Condo products matching
    if (matcherPropertyType === "condo") {
      if (notesLower.includes("condo") || prodLower.includes("condo")) {
        score += 10;
      }
    }

    // Return bounded score
    return Math.max(0, Math.min(100, score));
  };

  const getMatchBadge = (score: number) => {
    if (score >= 85) return <span className="bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 text-[9px] px-2 py-0.5 rounded font-bold uppercase tracking-wide">Excellent Fit</span>;
    if (score >= 60) return <span className="bg-[#b5a642]/10 text-[#b5a642] border border-[#b5a642]/20 text-[9px] px-2 py-0.5 rounded font-bold uppercase tracking-wide">Moderate Option</span>;
    return <span className="bg-red-500/10 text-red-400 border border-red-500/20 text-[9px] px-2 py-0.5 rounded font-bold uppercase tracking-wide">Risky / Unlikely</span>;
  };

  // Filtering
  const filteredLenders = lenders.filter(x => {
    const matchesTier = activeTier === "All" || x.tier === activeTier;
    const matchesSearch = searchQuery === "" || 
      x.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (x.bdm || "").toLowerCase().includes(searchQuery.toLowerCase()) ||
      (x.products || "").toLowerCase().includes(searchQuery.toLowerCase()) ||
      (x.notes || "").toLowerCase().includes(searchQuery.toLowerCase());
    return matchesTier && matchesSearch;
  });

  return (
    <div className="flex flex-col h-full bg-[#111115]" id="lender-sheets-parent">
      {/* Sub tabs and top menu */}
      <div className="flex items-center justify-between border-b border-white/5 bg-[#141418]/60 p-4 shrink-0">
        <div className="flex items-center gap-2">
          <Globe className="h-4 w-4 text-[#b5a642]" />
          <div>
            <h2 className="text-sm font-bold text-[#eeeef2]">Ontario Lender Sheets</h2>
            <p className="text-[10px] text-white/40">Real-time rates, prime monolines, credit unions, alt-B and quick-close scenario matchers</p>
          </div>
        </div>

        <div className="flex items-center gap-1.5">
          <button 
            onClick={() => setActiveSubTab("directory")}
            className={`px-3 py-1.5 text-xs font-semibold rounded-lg transition-all ${activeSubTab === "directory" ? "bg-[#b5a642]/10 text-[#b5a642] border border-[#b5a642]/20" : "text-white/60 hover:bg-white/5"}`}
          >
            Lender Directory
          </button>
          <button 
            onClick={() => setActiveSubTab("matcher")}
            className={`px-3 py-1.5 text-xs font-semibold rounded-lg transition-all flex items-center gap-1.5 ${activeSubTab === "matcher" ? "bg-[#b5a642]/10 text-[#b5a642] border border-[#b5a642]/20" : "text-white/60 hover:bg-white/5"}`}
          >
            <Sparkles className="w-3.5 h-3.5" /> Scenario Matcher
          </button>
          <button 
            onClick={() => setActiveSubTab("trends")}
            className={`px-3 py-1.5 text-xs font-semibold rounded-lg transition-all flex items-center gap-1.5 ${activeSubTab === "trends" ? "bg-[#b5a642]/10 text-[#b5a642] border border-[#b5a642]/20" : "text-white/60 hover:bg-white/5"}`}
          >
            <TrendingUp className="w-3.5 h-3.5" /> Stress Test Rates
          </button>
        </div>
      </div>

      {activeSubTab === "directory" && (
        <div className="flex-1 flex flex-col min-h-0">
          {/* Filters Bar */}
          <div className="p-4 bg-[#141418]/20 border-b border-white/5 flex flex-col sm:flex-row sm:items-center justify-between gap-3 shrink-0">
            {/* Tiers Toggles */}
            <div className="flex items-center gap-1 select-none">
              {["All", "A", "CU", "B", "P"].map(tier => {
                const label = tier === "All" ? "All Lenders" : tier === "A" ? "Tier A (Banks & Monolines)" : tier === "CU" ? "Credit Unions" : tier === "B" ? "Alt-B Lenders" : "Privates & MICs";
                return (
                  <button
                    key={tier}
                    onClick={() => setActiveTier(tier)}
                    className={`px-3 py-1.5 text-[11px] font-bold rounded-lg transition-all border ${activeTier === tier ? "bg-[#b5a642] text-black border-[#b5a642]" : "bg-transparent text-white/55 border-white/5 hover:bg-white/5"}`}
                    title={label}
                  >
                    {tier === "All" ? "All" : tier}
                  </button>
                );
              })}
            </div>

            {/* Search and additions */}
            <div className="flex items-center gap-2">
              <div className="relative w-64">
                <Search className="absolute left-2.5 top-2.5 h-3.5 w-3.5 text-white/40" />
                <input 
                  type="text" 
                  placeholder="Filter by name, products, notes..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full bg-[#1b1b20] border border-white/5 rounded-lg pl-8 pr-3 py-1.5 text-xs text-[#eeeef2] placeholder-white/35 focus:outline-none focus:border-[#b5a642]/20"
                />
              </div>

              <button
                onClick={() => handleOpenEditModal()}
                className="flex items-center gap-1 px-3 py-1.5 text-xs font-bold rounded-lg bg-[#b5a642] text-black hover:bg-[#9a8c38] transition-all"
              >
                <Plus className="w-3.5 h-3.5" /> Add Lender
              </button>
            </div>
          </div>

          {/* Grid of Lenders */}
          <div className="flex-grow overflow-y-auto p-5 select-none">
            {filteredLenders.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-16 text-center border-2 border-dashed border-white/5 rounded-xl bg-[#141418]/10">
                <div className="w-10 h-10 rounded-full bg-[#b5a642]/10 flex items-center justify-center mb-3">
                  <Globe className="text-[#b5a642]/60 w-5 h-5" />
                </div>
                <h3 className="text-xs font-bold text-white/80">No Lenders Found</h3>
                <p className="text-[10px] text-white/30 max-w-sm mt-1">Try resetting your active tier filter or check your query text.</p>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {filteredLenders.map((lender) => (
                  <div 
                    key={lender.name}
                    className="bg-[#141418] border border-white/5 rounded-xl flex flex-col hover:border-[#b5a642]/15 transition-all p-4 relative group"
                  >
                    {/* Header bar */}
                    <div className="flex items-start justify-between gap-1.5 mb-2.5">
                      <div>
                        <div className="flex items-center gap-1.5">
                          <h4 className="text-sm font-bold text-white/95 group-hover:text-[#b5a642] transition-colors">{lender.name}</h4>
                          <span className={`text-[9px] font-extrabold uppercase px-1.5 py-0.5 rounded border ${
                            lender.tier === "A" ? "bg-[#b5a642]/15 text-[#b5a642] border-[#b5a642]/30" :
                            lender.tier === "CU" ? "bg-[#6fa3b8]/15 text-[#6fa3b8] border-[#6fa3b8]/30" :
                            lender.tier === "B" ? "bg-orange-500/10 text-orange-400 border-orange-500/20" :
                            "bg-purple-500/10 text-purple-400 border-purple-500/20"
                          }`}>
                            T-{lender.tier}
                          </span>
                        </div>
                        <p className="text-[10px] text-white/40 mt-0.5 line-clamp-1">{lender.products || "No specialized products listed"}</p>
                      </div>

                      {/* Main Rate Highlight */}
                      <div className="text-right shrink-0">
                        <div className="text-xs font-mono font-extrabold text-white text-gradient-to-r from-emerald-400 to-[#b5a642]">
                          {lender.rate ? `${lender.rate}%` : "Cpty"}
                        </div>
                        <span className="text-[8px] uppercase tracking-wide text-white/30 font-semibold block">5yr Fixed</span>
                      </div>
                    </div>

                    {/* Guidelines highlight */}
                    <div className="bg-[#1b1b20]/60 border border-white/5 rounded-lg p-2.5 text-[11px] text-white/70 leading-relaxed mb-3 flex-grow">
                      <p className="line-clamp-2 italic">{lender.notes || "No standard underwriting notes added."}</p>
                    </div>

                    {/* BDM Contact Card info if exists */}
                    <div className="border-t border-white/5 pt-2.5 flex items-center justify-between text-[11px] text-white/50">
                      <div className="flex items-center gap-2">
                        {lender.bdm ? (
                          <>
                            <div className="w-5 h-5 rounded-full bg-white/5 border border-white/10 flex items-center justify-center font-bold text-[9px] text-white/80 uppercase">
                              {lender.bdm.charAt(0)}
                            </div>
                            <div>
                              <div className="text-white/85 font-semibold text-[10px]">{lender.bdm}</div>
                              <div className="text-[8px] text-white/30">BDM Coordinator</div>
                            </div>
                          </>
                        ) : (
                          <div className="text-[10px] text-white/25 flex items-center gap-1.5"><User className="w-3.5 h-3.5 text-white/20" /> No BDM Listed</div>
                        )}
                      </div>

                      <div className="flex items-center gap-1">
                        <button 
                          onClick={() => setSelectedLender(lender)}
                          className="p-1 px-2 border border-white/5 bg-[#1b1b20]/20 rounded text-[10px] text-[#b5a642] font-semibold hover:bg-[#b5a642]/10 transition-colors"
                        >
                          View Details
                        </button>
                        <button
                          onClick={() => handleOpenEditModal(lender)}
                          className="p-1 border border-white/5 hover:border-white/10 rounded text-white/40 hover:text-[#b5a642] hover:bg-white/5 max-sm:hidden transition-all"
                          title="Tweak Rates / Edit Lender"
                        >
                          <Edit2 className="w-3 h-3" />
                        </button>
                        <button
                          onClick={() => handleDeleteLender(lender.name)}
                          className="p-1 border border-white/5 hover:border-red-900/40 rounded text-white/30 hover:text-red-400 hover:bg-red-500/10 transition-all text-right"
                          title="Remove Lender"
                        >
                          <Trash2 className="w-3 h-3" />
                        </button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}

      {activeSubTab === "matcher" && (
        <div className="flex-1 flex flex-col md:flex-row min-h-0 overflow-hidden">
          {/* Match Criteria Panel */}
          <div className="w-full md:w-80 bg-[#141418] border-r border-white/5 flex flex-col h-full shrink-0 overflow-y-auto p-4 select-none">
            <h3 className="text-xs uppercase font-bold tracking-wider text-[#b5a642] mb-3 flex items-center gap-1.5">
              <Sparkles className="w-3.5 h-3.5 text-[#b5a642] fill-[#b5a642]/30" /> Scenario Matching Rules
            </h3>

            {/* Quick Profile Importer */}
            <div className="mb-4 p-3 bg-[#1b1b20]/80 border border-white/5 rounded-xl">
              <label className="text-[10px] font-bold text-white/50 uppercase tracking-wide block mb-1">Populate from client profile</label>
              <select 
                value={selectedMatchClient}
                onChange={(e) => handleLoadClientDetails(e.target.value)}
                className="w-full bg-[#111115] border border-white/5 rounded-lg px-2.5 py-1.5 text-xs text-[#eeeef2] focus:outline-none focus:border-[#b5a642]/20"
              >
                <option value="">-- Choose client to extract characteristics --</option>
                {clients.map(cl => (
                  <option key={cl.id} value={cl.id}>{cl.first} {cl.last} ({cl.beacon ? `Credit: ${cl.beacon}` : "No Credit"})</option>
                ))}
              </select>
            </div>

            <div className="space-y-4">
              {/* Credit check slider */}
              <div>
                <div className="flex justify-between text-xs mb-1.5">
                  <span className="text-white/60">Minimum Beacon Score</span>
                  <span className="font-mono text-[#b5a642] font-semibold">{matcherBeacon}</span>
                </div>
                <input 
                  type="range" 
                  min="400" 
                  max="850" 
                  value={matcherBeacon}
                  onChange={(e) => setMatcherBeacon(parseInt(e.target.value))}
                  className="w-full h-1.5 bg-[#1b1b20] rounded-lg appearance-none cursor-pointer accent-[#b5a642]"
                />
                <div className="flex justify-between text-[9px] text-white/30 mt-1">
                  <span>Subprime (&lt;580)</span>
                  <span>Alt-B (600-680)</span>
                  <span>Prime A (700+)</span>
                </div>
              </div>

              {/* LTV */}
              <div>
                <div className="flex justify-between text-xs mb-1.5">
                  <span className="text-white/60">Target-LTV Percentage</span>
                  <span className="font-mono text-[#b5a642] font-semibold">{matcherLTV}%</span>
                </div>
                <input 
                  type="range" 
                  min="50" 
                  max="95" 
                  value={matcherLTV}
                  onChange={(e) => setMatcherLTV(parseInt(e.target.value))}
                  className="w-full h-1.5 bg-[#1b1b20] rounded-lg appearance-none cursor-pointer accent-[#b5a642]"
                />
                <div className="flex justify-between text-[9px] text-white/30 mt-1">
                  <span>Standard Alt (&le;80%)</span>
                  <span>High-Ratio (80%+)</span>
                </div>
              </div>

              {/* Self Employment */}
              <div className="flex items-center justify-between p-2.5 bg-[#1b1b20]/40 rounded-lg border border-white/5">
                <div className="flex flex-col">
                  <span className="text-xs text-white/70 font-semibold">Self-Employed (BFS Stated)</span>
                  <span className="text-[9px] text-white/30">Needs stated income underwriting</span>
                </div>
                <input 
                  type="checkbox"
                  checked={matcherBFS}
                  onChange={(e) => setMatcherBFS(e.target.checked)}
                  className="w-4 h-4 rounded border-white/10 bg-[#1b1b20] accent-[#b5a642]"
                />
              </div>

              {/* Amortization Options */}
              <div>
                <label className="text-xs text-white/60 block mb-1.5">Required Amortization Term</label>
                <div className="grid grid-cols-2 gap-2">
                  {[25, 30].map(yr => (
                    <button
                      key={yr}
                      type="button"
                      onClick={() => setMatcherAmortization(yr)}
                      className={`py-1.5 text-xs font-bold rounded-lg transition-all border ${matcherAmortization === yr ? "bg-[#b5a642]/15 border-[#b5a642] text-[#b5a642]" : "bg-[#1b1b20] text-white/50 border-white/5"}`}
                    >
                      {yr} Years
                    </button>
                  ))}
                </div>
                <p className="text-[8px] text-white/20 mt-1">Note: 30 year limits disqualify standard insured high-ratio products.</p>
              </div>

              {/* Condominium Filter */}
              <div>
                <label className="text-xs text-white/60 block mb-1.5">Property Risk Classification</label>
                <div className="grid grid-cols-2 gap-2">
                  {["residential", "condo"].map(pt => (
                    <button
                      key={pt}
                      type="button"
                      onClick={() => setMatcherPropertyType(pt)}
                      className={`py-1.5 text-xs font-bold rounded-lg transition-all border capitalize ${matcherPropertyType === pt ? "bg-[#b5a642]/15 border-[#b5a642] text-[#b5a642]" : "bg-[#1b1b20] text-white/50 border-white/5"}`}
                    >
                      {pt === "condo" ? "Condo Suite" : "Residential"}
                    </button>
                  ))}
                </div>
              </div>
            </div>
          </div>

          {/* Matches Output List */}
          <div className="flex-1 overflow-y-auto p-5 select-none">
            <h3 className="text-sm font-bold text-white mb-3">Live Recommended Underwriters</h3>
            <p className="text-xs text-white/40 mb-4">Ranked list based on credit threshold matrix, employment constraints, and general monoline allowances.</p>

            <div className="space-y-3">
              {lenders
                .map(l => ({ lender: l, score: getMatchScore(l) }))
                .sort((a, b) => b.score - a.score)
                .map(({ lender, score }) => (
                  <div 
                    key={lender.name}
                    className="p-4 bg-[#141418] border border-white/5 rounded-xl hover:border-[#b5a642]/10 transition-all flex flex-col md:flex-row md:items-center justify-between gap-4"
                  >
                    <div className="flex items-center gap-3">
                      {/* Percent Match Donut Chart placeholder */}
                      <div className="w-11 h-11 rounded-full border-2 border-white/5 bg-[#1b1b20]/60 flex items-center justify-center font-mono font-bold text-xs text-white relative">
                        {score}%
                        <svg className="absolute inset-0 w-full h-full -rotate-90">
                          <circle 
                            cx="20" 
                            cy="20" 
                            r="19" 
                            stroke="currentColor" 
                            strokeWidth="2" 
                            fill="transparent" 
                            className={`${score >= 85 ? "text-emerald-500" : score >= 60 ? "text-[#b5a642]" : "text-red-500"} opacity-40`}
                            strokeDasharray={`${2 * Math.PI * 19}`}
                            strokeDashoffset={`${2 * Math.PI * 19 * (1 - score / 100)}`}
                          />
                        </svg>
                      </div>

                      <div>
                        <div className="flex items-center gap-1.5">
                          <h4 className="text-sm font-bold text-white/90">{lender.name}</h4>
                          <span className="text-[10px] text-white/30 font-semibold uppercase">T- {lender.tier}</span>
                          {getMatchBadge(score)}
                        </div>
                        <p className="text-[10px] text-white/40 line-clamp-1">{lender.products}</p>
                      </div>
                    </div>

                    <div className="flex items-center gap-2 max-sm:justify-between">
                      <div className="text-right mr-3 max-sm:text-left">
                        <div className="text-xs font-bold text-white/80">Listed Rate</div>
                        <div className="text-sm font-mono font-bold text-emerald-400">{lender.rate ? `${lender.rate}%` : "Contact BDM"}</div>
                      </div>

                      <div className="flex items-center gap-1.5">
                        <button
                          onClick={() => handleCompileScenarioEmail(lender)}
                          className="px-3 py-1.5 bg-[#b5a642]/10 text-[#b5a642] hover:bg-[#b5a642]/20 border border-[#b5a642]/20 rounded-lg text-xs font-bold flex items-center gap-1.5"
                          title="Generate a custom BDM Scenario confirmation draft"
                        >
                          <Mail className="w-3.5 h-3.5" /> Email BDM
                        </button>
                        <button
                          onClick={() => setSelectedLender(lender)}
                          className="px-2.5 py-1.5 bg-[#1b1b20] text-white/60 hover:text-white rounded-lg text-xs"
                        >
                          Policy Notes
                        </button>
                      </div>
                    </div>
                  </div>
                ))}
            </div>
          </div>
        </div>
      )}

      {activeSubTab === "trends" && (
        <div className="flex-grow overflow-y-auto p-6 select-none space-y-6">
          <div className="p-4 bg-[#141418] border border-white/5 rounded-xl">
            <h3 className="text-xs uppercase font-extrabold text-[#b5a642] mb-1.5 tracking-[1.5px] flex items-center gap-2"><TrendingUp className="w-4 h-4 text-[#b5a642]" /> Federal Stress Test Rate sheets</h3>
            <p className="text-xs text-white/40 mb-3 leading-relaxed">
              When qualifying files for traditional standard A-Lenders (banks and prime monolines) in Ontario, the qualifying contract rate is stress-tested under either of two thresholds mandated by standard Office of the Superintendent of Financial Institutions (OSFI) regulations:
            </p>
            <div className="bg-[#1b1b20] border border-white/5 rounded-lg p-3 text-xs text-white/80 leading-relaxed mb-4">
              <strong>OSFI Guideline B-20 Stress Test Qualifying Rate:</strong> The greater of <strong>Contract Rate + 2.00%</strong> or the benchmark floor of <strong>5.25%</strong>.
            </div>

            {/* Rates Table */}
            <div className="border border-white/5 rounded-xl overflow-hidden bg-[#111115]">
              <table className="w-full text-left text-xs text-white/70">
                <thead className="bg-[#1b1b20]/60 text-white/40 uppercase text-[9px] tracking-wider border-b border-white/5 select-none">
                  <tr>
                    <th className="p-3 font-extrabold">Scenario / Option</th>
                    <th className="p-3 font-extrabold text-center">Typical contract rate</th>
                    <th className="p-3 font-extrabold text-center">Required stress test rate</th>
                    <th className="p-3 font-extrabold">Qualifying Requirement Type</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-white/5">
                  <tr>
                    <td className="p-3 font-bold text-white/95">Insured Purchases &lt; $1 million (High Ratio)</td>
                    <td className="p-3 text-center font-mono text-emerald-400">4.54% - 4.79%</td>
                    <td className="p-3 text-center font-mono text-red-400">6.54% - 6.79%</td>
                    <td className="p-3 text-white/50">Contract rate + 2.0% threshold applies</td>
                  </tr>
                  <tr>
                    <td className="p-3 font-bold text-white/95">Uninsured Conventional Purchases (GDS/TDS stress)</td>
                    <td className="p-3 text-center font-mono text-emerald-400">4.84% - 5.09%</td>
                    <td className="p-3 text-center font-mono text-red-400">6.84% - 7.09%</td>
                    <td className="p-3 text-white/50">Contract rate + 2.0% (LTV under 80%)</td>
                  </tr>
                  <tr>
                    <td className="p-3 font-bold text-white/95">Alt-B Program files (Equitable/Home Trust)</td>
                    <td className="p-3 text-center font-mono text-emerald-400">5.99% - 6.49%</td>
                    <td className="p-3 text-center font-mono text-red-400">7.99% - 8.49%</td>
                    <td className="p-3 text-white/50">Stated qualification using lender benchmark rate + 2%</td>
                  </tr>
                  <tr>
                    <td className="p-3 font-bold text-white/95">Private Standalone Funding (Unregulated)</td>
                    <td className="p-3 text-center font-mono text-emerald-400">7.99% - 10.99%</td>
                    <td className="p-3 text-center font-mono text-[#b5a642]">Interest Only</td>
                    <td className="p-3 text-white/50">Exempt from OSFI stress test restrictions (Equity based)</td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="p-4 bg-[#141418] border border-white/5 rounded-xl flex items-start gap-3">
              <div className="w-8 h-8 rounded bg-[#b5a642]/10 border border-[#b5a642]/20 flex items-center justify-center text-[#b5a642] shrink-0 font-bold">1</div>
              <div>
                <h4 className="text-xs font-bold text-white/90">GDS Limit Rules for Stressing</h4>
                <p className="text-[11px] text-white/40 mt-1">
                  A-lenders generally limit Gross Debt Service (GDS) ratios to 39% based on household income plus house heat estimates ($100 default) and 50% condo fees check (if applicable).
                </p>
              </div>
            </div>
            <div className="p-4 bg-[#141418] border border-white/5 rounded-xl flex items-start gap-3">
              <div className="w-8 h-8 rounded bg-[#b5a642]/10 border border-[#b5a642]/20 flex items-center justify-center text-[#b5a642] shrink-0 font-bold">2</div>
              <div>
                <h4 className="text-xs font-bold text-white/90">TDS Debt Limit Stressing</h4>
                <p className="text-[11px] text-white/40 mt-1">
                  Total Debt Service (TDS) ratios must remain under 44% of gross income. Minimum monthly repayment estimates apply (3% on outstanding credit card lines, 1% on traditional HELOC interest loans).
                </p>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Lender details slideout modal */}
      {selectedLender && (
        <div className="fixed inset-0 bg-black/60 z-50 flex items-center justify-end select-none">
          <div className="relative w-full max-w-lg h-full bg-[#141418] border-l border-white/10 shadow-2xl flex flex-col p-6 overflow-y-auto">
            {/* Header */}
            <div className="flex items-start justify-between border-b border-white/5 pb-4 mb-4">
              <div>
                <span className="text-[9px] font-extrabold uppercase bg-[#b5a642]/15 text-[#b5a642] border border-[#b5a642]/30 px-2 py-0.5 rounded mr-2">
                  Tier {selectedLender.tier}
                </span>
                <h3 className="text-base font-extrabold text-white mt-1.5">{selectedLender.name}</h3>
                <p className="text-xs text-white/40 mt-0.5">Underwriting Guidelines & Contact coordinates</p>
              </div>
              <button 
                onClick={() => setSelectedLender(null)} 
                className="text-white/40 hover:text-white p-1 rounded hover:bg-white/5 transition-all"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Core Rates Highlight */}
            <div className="grid grid-cols-2 gap-4 mb-5">
              <div className="p-3 bg-[#1b1b20] border border-white/5 rounded-xl">
                <span className="text-[9px] text-white/35 uppercase font-bold block">Typical Prime 5yr Fixed</span>
                <span className="text-lg font-mono font-extrabold text-[#b5a642]">{selectedLender.rate ? `${selectedLender.rate}%` : "Quote basis / MIC"}</span>
              </div>
              <div className="p-3 bg-[#1b1b20] border border-white/5 rounded-xl">
                <span className="text-[9px] text-white/35 uppercase font-bold block">Typical Stress rate</span>
                <span className="text-lg font-mono font-extrabold text-red-400">
                  {selectedLender.rate ? `${(parseFloat(String(selectedLender.rate)) + 2).toFixed(2)}%` : "Exempt / Private"}
                </span>
              </div>
            </div>

            {/* BDM drawer */}
            <div className="bg-[#1b1b20]/40 border border-white/5 rounded-xl p-4 mb-5">
              <h4 className="text-xs font-bold text-white mb-2.5 flex items-center gap-1.5">
                <User className="w-3.5 h-3.5 text-[#b5a642]" /> BDM Information
              </h4>
              <div className="space-y-2">
                <div className="flex justify-between items-center text-xs">
                  <span className="text-white/45">Representative:</span>
                  <span className="text-white font-medium">{selectedLender.bdm || "No specified BDM"}</span>
                </div>
                {selectedLender.email && (
                  <div className="flex justify-between items-center text-xs">
                    <span className="text-white/45">Direct Email:</span>
                    <a href={`mailto:${selectedLender.email}`} className="text-[#6fa3b8] hover:underline font-mono">{selectedLender.email}</a>
                  </div>
                )}
                {selectedLender.phone && (
                  <div className="flex justify-between items-center text-xs">
                    <span className="text-white/45">Office Phone:</span>
                    <a href={`tel:${selectedLender.phone}`} className="text-white hover:text-[#b5a642] font-mono">{selectedLender.phone}</a>
                  </div>
                )}
              </div>

              {selectedLender.email && (
                <div className="mt-3.5 pt-3.5 border-t border-white/5 flex gap-2">
                  <button
                    onClick={() => handleCompileScenarioEmail(selectedLender)}
                    className="flex-1 py-1.5 bg-[#b5a642] text-black hover:bg-[#9a8c38] font-bold rounded-lg text-xs flex items-center justify-center gap-1.5 transition-colors"
                  >
                    <Mail className="w-3.5 h-3.5" /> Start Scenario Check Template
                  </button>
                </div>
              )}
            </div>

            {/* Specific Policies */}
            <div className="space-y-4 mb-5">
              <div>
                <h4 className="text-xs font-bold text-white mb-1">Stated Products & Programs</h4>
                <p className="text-xs text-white/70 bg-[#1b1b20]/60 p-2.5 rounded-lg border border-white/5 leading-relaxed">{selectedLender.products || "Purchase, Refinance, HELOC and general equity programs"}</p>
              </div>

              <div>
                <h4 className="text-xs font-bold text-white mb-1">Underwriting Guidelines & Notes</h4>
                <p className="text-xs text-white/70 bg-[#1b1b20]/60 p-2.5 rounded-lg border border-white/5 leading-relaxed italic">{selectedLender.notes || "Call BDM regarding special high-ratio exception checklists. Standard appraisals require third-party verification from AIC certified appraisers."}</p>
              </div>
            </div>

            <div className="mt-auto pt-4 border-t border-white/5 flex gap-3">
              <button
                onClick={() => {
                  setSelectedLender(null);
                  handleOpenEditModal(selectedLender);
                }}
                className="flex-1 py-2 bg-white/5 hover:bg-white/10 text-white font-bold rounded-lg text-xs transition-colors"
              >
                Edit Specifications
              </button>
              <button
                onClick={() => setSelectedLender(null)}
                className="px-4 py-2 bg-[#1b1b20] hover:bg-[#27272e] text-white/75 font-semibold rounded-lg text-xs"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Editor Modal for Adding/Editing Lender */}
      {isEditModalOpen && (
        <div className="fixed inset-0 bg-black/75 z-50 flex items-center justify-center p-4 select-none">
          <div className="bg-[#141418] border border-white/10 rounded-xl w-full max-w-md shadow-2xl flex flex-col overflow-hidden">
            <div className="p-4 border-b border-white/5 bg-[#1b1b20]/40 flex items-center justify-between">
              <h3 className="text-xs uppercase font-extrabold text-[#b5a642] tracking-wider flex items-center gap-1.5">
                {editingLender ? <Edit2 className="w-3.5 h-3.5" /> : <Plus className="w-3.5 h-3.5" />}
                {editingLender ? "Edit Lender Specifications" : "Register New Lender Profile"}
              </h3>
              <button
                onClick={() => setIsEditModalOpen(false)}
                className="text-white/40 hover:text-white p-1 rounded-lg bg-white/5 hover:bg-white/10 transition-colors"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleSaveLender} className="p-4 space-y-3.5 overflow-y-auto max-h-[80vh] text-left">
              <div>
                <label className="text-[10px] text-white/45 font-bold uppercase tracking-wider block mb-1">Lender Corporation Name <span className="text-red-400">*</span></label>
                <input
                  type="text"
                  required
                  placeholder="e.g., MCAP, Romspen MIC"
                  value={formName}
                  onChange={(e) => setFormName(e.target.value)}
                  className="w-full bg-[#1b1b20] border border-white/5 rounded-lg px-3 py-2 text-xs text-white focus:outline-none focus:border-[#b5a642]/20"
                />
              </div>

              <div className="grid grid-cols-2 gap-3.5">
                <div>
                  <label className="text-[10px] text-white/45 font-bold uppercase tracking-wider block mb-1">Underwriter Tier</label>
                  <select
                    value={formTier}
                    onChange={(e) => setFormTier(e.target.value as any)}
                    className="w-full bg-[#1b1b20] border border-white/5 rounded-lg px-2.5 py-2 text-xs text-white focus:outline-none focus:border-[#b5a642]/20"
                  >
                    <option value="A">Tier A (Banks & Prime)</option>
                    <option value="CU">Tier CU (Credit Unions)</option>
                    <option value="B">Tier B (Alt Underwriters)</option>
                    <option value="P">Tier P (Privates & MICs)</option>
                  </select>
                </div>
                <div>
                  <label className="text-[10px] text-white/45 font-bold uppercase tracking-wider block mb-1">Contract rate %</label>
                  <input
                    type="text"
                    placeholder="e.g., 4.79"
                    value={formRate}
                    onChange={(e) => setFormRate(e.target.value)}
                    className="w-full bg-[#1b1b20] border border-white/5 rounded-lg px-3 py-2 text-xs text-white font-mono focus:outline-none focus:border-[#b5a642]/20"
                  />
                </div>
              </div>

              <div>
                <h4 className="text-[10px] font-bold text-[#b5a642] uppercase tracking-[1.5px] border-b border-white/5 pb-1 mt-4 mb-2">BDM Representative Details</h4>
                <div className="space-y-3">
                  <div>
                    <label className="text-[9px] text-white/40 uppercase block mb-1">BDM Contact Full Name</label>
                    <input
                      type="text"
                      placeholder="e.g., Jane Watson"
                      value={formBdm}
                      onChange={(e) => setFormBdm(e.target.value)}
                      className="w-full bg-[#1b1b20] border border-white/5 rounded-lg px-3 py-1.5 text-xs text-white focus:outline-none focus:border-[#b5a642]/20"
                    />
                  </div>
                  <div className="grid grid-cols-2 gap-3.5">
                    <div>
                      <label className="text-[9px] text-white/40 uppercase block mb-1">Email address</label>
                      <input
                        type="email"
                        placeholder="e.g., bdm@company.ca"
                        value={formEmail}
                        onChange={(e) => setFormEmail(e.target.value)}
                        className="w-full bg-[#1b1b20] border border-white/5 rounded-lg px-3 py-1.5 text-xs text-white font-mono focus:outline-none"
                      />
                    </div>
                    <div>
                      <label className="text-[9px] text-white/40 uppercase block mb-1">Mobile/Office Direct</label>
                      <input
                        type="text"
                        placeholder="e.g., (416) 555-0100"
                        value={formPhone}
                        onChange={(e) => setFormPhone(e.target.value)}
                        className="w-full bg-[#1b1b20] border border-white/5 rounded-lg px-3 py-1.5 text-xs text-white font-mono focus:outline-none"
                      />
                    </div>
                  </div>
                </div>
              </div>

              <div>
                <h4 className="text-[10px] font-bold text-[#b5a642] uppercase tracking-[1.5px] border-b border-white/5 pb-1 mt-4 mb-2">Policy & Notes Parameters</h4>
                <div className="space-y-3">
                  <div>
                    <label className="text-[9px] text-white/40 uppercase block mb-1">Capabilities Highlights (Comma separated)</label>
                    <input
                      type="text"
                      placeholder="e.g., 5yr Fixed, Stated BFS, HELOC"
                      value={formProducts}
                      onChange={(e) => setFormProducts(e.target.value)}
                      className="w-full bg-[#1b1b20] border border-white/5 rounded-lg px-3 py-1.5 text-xs text-white focus:outline-none"
                    />
                  </div>
                  <div>
                    <label className="text-[9px] text-white/40 uppercase block mb-1">Underwriting Notes / Exceptions Handbook</label>
                    <textarea
                      rows={3}
                      placeholder="Specify GDS/TDS thresholds or key self-employed policy exceptions..."
                      value={formNotes}
                      onChange={(e) => setFormNotes(e.target.value)}
                      className="w-full bg-[#1b1b20] border border-white/5 rounded-lg px-3 py-2 text-xs text-white placeholder-white/30 focus:outline-none focus:border-[#b5a642]/20"
                    />
                  </div>
                </div>
              </div>

              <div className="pt-4 border-t border-white/5 flex justify-end gap-2.5">
                <button
                  type="button"
                  onClick={() => setIsEditModalOpen(false)}
                  className="px-4 py-2 rounded-lg bg-[#1b1b20] hover:bg-[#27272e] text-xs font-semibold text-white/70 transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 rounded-lg bg-[#b5a642] text-black hover:bg-[#9a8c38] text-xs font-bold transition-all"
                >
                  Save Changes
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
