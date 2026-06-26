import React, { useState } from "react";
import { motion } from "motion/react";
import { X, User, DollarSign, Home, Landmark, Plus, Briefcase, Users } from "lucide-react";
import { Client, Lender } from "../types";

interface NewClientModalProps {
  isOpen: boolean;
  onClose: () => void;
  onCreateClient: (client: Client) => void;
  lenders: Lender[];
  agentNames: string[];
  currentUser: { first: string; last: string; role: string };
  showToast: (msg: string, type: "success" | "error" | "warning" | "info") => void;
}

export const NewClientModal: React.FC<NewClientModalProps> = ({
  isOpen,
  onClose,
  onCreateClient,
  lenders,
  agentNames,
  currentUser,
  showToast
}) => {
  const currentAgentName = `${currentUser.first} ${currentUser.last}`;

  // Form States
  const [first, setFirst] = useState("");
  const [last, setLast] = useState("");
  const [email, setEmail] = useState("");
  const [cell, setCell] = useState("");
  const [dob, setDob] = useState("");
  const [marital, setMarital] = useState("");
  const [emptype, setEmptype] = useState("Salaried");
  const [beacon, setBeacon] = useState("");
  const [income, setIncome] = useState("");
  
  // Co-applicant
  const [hasCoApplicant, setHasCoApplicant] = useState(false);
  const [co, setCo] = useState("");
  const [coEmail, setCoEmail] = useState("");
  const [coIncome, setCoIncome] = useState("");

  // Property Details
  const [addr, setAddr] = useState("");
  const [propval, setPropval] = useState("");
  const [mtgamt, setMtgamt] = useState("");
  const [proptype, setProptype] = useState("");
  const [tenure, setTenure] = useState("");

  // System Details
  const [lender, setLender] = useState("");
  const [agent, setAgent] = useState(agentNames.includes(currentAgentName) ? currentAgentName : agentNames[0] || "");
  const [status, setStatus] = useState<Client["status"]>("lead");

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    if (!first.trim() || !last.trim() || !email.trim()) {
      showToast("First name, last name, and email are required fields.", "error");
      return;
    }

    // Generate a unique ID
    const uniqueId = "c_" + Date.now().toString(36) + Math.random().toString(36).substr(2, 5);

    const newClient: Client = {
      id: uniqueId,
      first: first.trim(),
      last: last.trim(),
      email: email.trim(),
      cell: cell.trim() || undefined,
      dob: dob || undefined,
      marital: marital || undefined,
      emptype: emptype || undefined,
      beacon: beacon ? parseInt(beacon) || "" : undefined,
      income: income ? parseFloat(income.replace(/[$,\s]/g, "")) || "" : "",
      
      // Co-applicant info
      co: hasCoApplicant && co.trim() ? co.trim() : undefined,
      coEmail: hasCoApplicant && coEmail.trim() ? coEmail.trim() : undefined,
      coIncome: hasCoApplicant && coIncome ? parseFloat(coIncome.replace(/[$,\s]/g, "")) || "" : undefined,

      // Property info
      addr: addr.trim() || undefined,
      propval: propval ? parseFloat(propval.replace(/[$,\s]/g, "")) || "" : "",
      mtgamt: mtgamt ? parseFloat(mtgamt.replace(/[$,\s]/g, "")) || "" : "",
      proptype: proptype || undefined,
      tenure: tenure || undefined,

      // System tags
      lender: lender || undefined,
      agent: agent || undefined,
      status: status,
      source: "Manual Intake CRM",
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };

    onCreateClient(newClient);
    onClose();

    // Reset Form
    setFirst("");
    setLast("");
    setEmail("");
    setCell("");
    setDob("");
    setMarital("");
    setEmptype("Salaried");
    setBeacon("");
    setIncome("");
    setHasCoApplicant(false);
    setCo("");
    setCoEmail("");
    setCoIncome("");
    setAddr("");
    setPropval("");
    setMtgamt("");
    setProptype("");
    setTenure("");
    setLender("");
  };

  return (
    <div className="fixed inset-0 bg-black/75 backdrop-blur-sm z-50 flex items-center justify-center p-4 overflow-y-auto">
      <motion.div 
        initial={{ opacity: 0, scale: 0.95, y: 15 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.95, y: 15 }}
        transition={{ duration: 0.2 }}
        className="bg-[#101014] border border-white/10 rounded-2xl w-full max-w-4xl p-6 shadow-2xl relative flex flex-col max-h-[90vh]"
        id="new-client-modal-container"
      >
        {/* Header */}
        <div className="flex items-center justify-between border-b border-white/5 pb-4 mb-5 shrink-0">
          <div className="flex items-center gap-2.5">
            <div className="p-2 bg-[#b5a642]/10 rounded-xl border border-[#b5a642]/20 text-[#b5a642]">
              <Plus className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base font-extrabold text-white uppercase tracking-wider">Manual Client Intake Form</h2>
              <p className="text-[10px] text-white/40 mt-0.5">Quickly commission a new file onto the workstation pipeline.</p>
            </div>
          </div>
          <button 
            onClick={onClose}
            className="p-1.5 bg-white/5 hover:bg-white/10 border border-white/5 rounded-lg text-white/50 hover:text-white transition-all"
            id="close-new-client-modal-btn"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Content Form Scroll area */}
        <form onSubmit={handleSubmit} className="flex-grow overflow-y-auto pr-2 space-y-6 scrollbar-thin scrollbar-thumb-white/10">
          
          {/* Section 1: Core Applicant Profile */}
          <div className="space-y-3">
            <div className="flex items-center gap-2 text-[#b5a642] border-b border-white/5 pb-1 text-xs font-black uppercase tracking-wider">
              <User className="w-3.5 h-3.5" />
              <span>Primary Applicant Profile</span>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <label className="block text-[10px] font-bold text-white/50 uppercase mb-1">First Name <span className="text-[#b5a642]">*</span></label>
                <input 
                  type="text"
                  required
                  placeholder="e.g. Sarah"
                  value={first}
                  onChange={(e) => setFirst(e.target.value)}
                  className="w-full bg-[#141418] border border-white/5 rounded-lg px-3 py-2 text-xs text-white focus:outline-none focus:border-[#b5a642]/40"
                  id="client-first-name"
                />
              </div>
              <div>
                <label className="block text-[10px] font-bold text-white/50 uppercase mb-1">Last Name <span className="text-[#b5a642]">*</span></label>
                <input 
                  type="text"
                  required
                  placeholder="e.g. Jenkins"
                  value={last}
                  onChange={(e) => setLast(e.target.value)}
                  className="w-full bg-[#141418] border border-white/5 rounded-lg px-3 py-2 text-xs text-white focus:outline-none focus:border-[#b5a642]/40"
                  id="client-last-name"
                />
              </div>
              <div>
                <label className="block text-[10px] font-bold text-white/50 uppercase mb-1">Email Address <span className="text-[#b5a642]">*</span></label>
                <input 
                  type="email"
                  required
                  placeholder="sarah.j@example.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full bg-[#141418] border border-white/5 rounded-lg px-3 py-2 text-xs text-white focus:outline-none focus:border-[#b5a642]/40"
                  id="client-email"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              <div>
                <label className="block text-[10px] font-bold text-white/50 uppercase mb-1">Cell Phone</label>
                <input 
                  type="text"
                  placeholder="e.g. (416) 555-0199"
                  value={cell}
                  onChange={(e) => setCell(e.target.value)}
                  className="w-full bg-[#141418] border border-white/5 rounded-lg px-3 py-2 text-xs text-white focus:outline-none focus:border-[#b5a642]/40"
                />
              </div>
              <div>
                <label className="block text-[10px] font-bold text-white/50 uppercase mb-1">Date of Birth</label>
                <input 
                  type="date"
                  value={dob}
                  onChange={(e) => setDob(e.target.value)}
                  className="w-full bg-[#141418] border border-white/5 rounded-lg px-3 py-2 text-xs text-white focus:outline-none focus:border-[#b5a642]/40"
                />
              </div>
              <div>
                <label className="block text-[10px] font-bold text-white/50 uppercase mb-1">Marital Status</label>
                <select 
                  value={marital}
                  onChange={(e) => setMarital(e.target.value)}
                  className="w-full bg-[#141418] border border-white/5 rounded-lg px-3 py-2 text-xs text-white focus:outline-none focus:border-[#b5a642]/40"
                >
                  <option value="">-- Select Status --</option>
                  <option value="Single">Single</option>
                  <option value="Married">Married</option>
                  <option value="Common-Law">Common-Law</option>
                  <option value="Divorced">Divorced</option>
                  <option value="Separated">Separated</option>
                  <option value="Widowed">Widowed</option>
                </select>
              </div>
              <div>
                <label className="block text-[10px] font-bold text-white/50 uppercase mb-1">Employment Type</label>
                <select 
                  value={emptype}
                  onChange={(e) => setEmptype(e.target.value)}
                  className="w-full bg-[#141418] border border-white/5 rounded-lg px-3 py-2 text-xs text-white focus:outline-none focus:border-[#b5a642]/40"
                >
                  <option value="Salaried">Salaried</option>
                  <option value="BFS / Self-Employed">BFS / Self-Employed</option>
                  <option value="Commission">Commission</option>
                  <option value="Contract">Contract</option>
                  <option value="Retired">Retired</option>
                </select>
              </div>
            </div>
          </div>

          {/* Section 2: Financial Strength */}
          <div className="space-y-3">
            <div className="flex items-center gap-2 text-[#b5a642] border-b border-white/5 pb-1 text-xs font-black uppercase tracking-wider">
              <DollarSign className="w-3.5 h-3.5" />
              <span>Financial Qualification Profile</span>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <label className="block text-[10px] font-bold text-white/50 uppercase mb-1">Annual Personal Income ($)</label>
                <input 
                  type="text"
                  placeholder="e.g. 120000"
                  value={income}
                  onChange={(e) => setIncome(e.target.value)}
                  className="w-full bg-[#141418] border border-white/5 rounded-lg px-3 py-2 text-xs text-white focus:outline-none focus:border-[#b5a642]/40"
                />
              </div>
              <div>
                <label className="block text-[10px] font-bold text-white/50 uppercase mb-1">Credit Score (Beacon Score)</label>
                <input 
                  type="number"
                  placeholder="e.g. 740"
                  min="300"
                  max="900"
                  value={beacon}
                  onChange={(e) => setBeacon(e.target.value)}
                  className="w-full bg-[#141418] border border-white/5 rounded-lg px-3 py-2 text-xs text-white focus:outline-none focus:border-[#b5a642]/40"
                />
              </div>
              <div className="flex items-end pb-1">
                <label className="flex items-center gap-2.5 px-3 py-2 bg-[#141418] border border-white/5 rounded-lg w-full cursor-pointer hover:bg-white/[0.01] transition-all">
                  <input 
                    type="checkbox"
                    checked={hasCoApplicant}
                    onChange={(e) => setHasCoApplicant(e.target.checked)}
                    className="rounded border-white/10 bg-transparent text-[#b5a642] focus:ring-[#b5a642]/20"
                  />
                  <span className="text-[11px] font-bold text-white/70">Include Co-Applicant?</span>
                </label>
              </div>
            </div>

            {hasCoApplicant && (
              <motion.div 
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: "auto" }}
                className="p-4 bg-white/[0.01] border border-white/5 rounded-xl grid grid-cols-1 md:grid-cols-3 gap-4 mt-2"
              >
                <div>
                  <label className="block text-[10px] font-bold text-white/40 uppercase mb-1">Co-Applicant Name</label>
                  <input 
                    type="text"
                    placeholder="e.g. David Jenkins"
                    value={co}
                    onChange={(e) => setCo(e.target.value)}
                    className="w-full bg-[#141418] border border-white/5 rounded-lg px-3 py-2 text-xs text-white focus:outline-none focus:border-[#b5a642]/40"
                  />
                </div>
                <div>
                  <label className="block text-[10px] font-bold text-white/40 uppercase mb-1">Co-Applicant Email</label>
                  <input 
                    type="email"
                    placeholder="david.j@example.com"
                    value={coEmail}
                    onChange={(e) => setCoEmail(e.target.value)}
                    className="w-full bg-[#141418] border border-white/5 rounded-lg px-3 py-2 text-xs text-white focus:outline-none focus:border-[#b5a642]/40"
                  />
                </div>
                <div>
                  <label className="block text-[10px] font-bold text-white/40 uppercase mb-1">Co-Applicant Income ($)</label>
                  <input 
                    type="text"
                    placeholder="e.g. 85000"
                    value={coIncome}
                    onChange={(e) => setCoIncome(e.target.value)}
                    className="w-full bg-[#141418] border border-white/5 rounded-lg px-3 py-2 text-xs text-white focus:outline-none focus:border-[#b5a642]/40"
                  />
                </div>
              </motion.div>
            )}
          </div>

          {/* Section 3: Subject Property Details */}
          <div className="space-y-3">
            <div className="flex items-center gap-2 text-[#b5a642] border-b border-white/5 pb-1 text-xs font-black uppercase tracking-wider">
              <Home className="w-3.5 h-3.5" />
              <span>Subject Property &amp; Financing Request</span>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="md:col-span-2">
                <label className="block text-[10px] font-bold text-white/50 uppercase mb-1">Property Street Address</label>
                <input 
                  type="text"
                  placeholder="e.g. 154 Simcoe Street, Unit 201, Toronto ON"
                  value={addr}
                  onChange={(e) => setAddr(e.target.value)}
                  className="w-full bg-[#141418] border border-white/5 rounded-lg px-3 py-2 text-xs text-white focus:outline-none focus:border-[#b5a642]/40"
                />
              </div>
              <div>
                <label className="block text-[10px] font-bold text-white/50 uppercase mb-1">Property Type</label>
                <select 
                  value={proptype}
                  onChange={(e) => setProptype(e.target.value)}
                  className="w-full bg-[#141418] border border-white/5 rounded-lg px-3 py-2 text-xs text-white focus:outline-none focus:border-[#b5a642]/40"
                >
                  <option value="">-- Select Type --</option>
                  <option value="Detached">Detached Single Family</option>
                  <option value="Semi-Detached">Semi-Detached</option>
                  <option value="Townhouse">Townhouse / Row</option>
                  <option value="Condo Apartment">Condo Apartment</option>
                  <option value="Duplex">Duplex / Triplex</option>
                  <option value="Other">Other Recreational / Commercial</option>
                </select>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <label className="block text-[10px] font-bold text-white/50 uppercase mb-1">Estimated Property Value ($)</label>
                <input 
                  type="text"
                  placeholder="e.g. 750000"
                  value={propval}
                  onChange={(e) => setPropval(e.target.value)}
                  className="w-full bg-[#141418] border border-white/5 rounded-lg px-3 py-2 text-xs text-white focus:outline-none focus:border-[#b5a642]/40"
                />
              </div>
              <div>
                <label className="block text-[10px] font-bold text-white/50 uppercase mb-1">Mortgage Amount Requested ($)</label>
                <input 
                  type="text"
                  placeholder="e.g. 525000"
                  value={mtgamt}
                  onChange={(e) => setMtgamt(e.target.value)}
                  className="w-full bg-[#141418] border border-white/5 rounded-lg px-3 py-2 text-xs text-white focus:outline-none focus:border-[#b5a642]/40"
                />
              </div>
              <div>
                <label className="block text-[10px] font-bold text-white/50 uppercase mb-1">Property Tenure</label>
                <select 
                  value={tenure}
                  onChange={(e) => setTenure(e.target.value)}
                  className="w-full bg-[#141418] border border-white/5 rounded-lg px-3 py-2 text-xs text-white focus:outline-none focus:border-[#b5a642]/40"
                >
                  <option value="">-- Select Tenure --</option>
                  <option value="Freehold">Freehold</option>
                  <option value="Condominium">Condominium</option>
                  <option value="Leasehold">Leasehold</option>
                  <option value="Co-op">Co-operative</option>
                </select>
              </div>
            </div>
          </div>

          {/* Section 4: System Assignment & Stage */}
          <div className="space-y-3">
            <div className="flex items-center gap-2 text-[#b5a642] border-b border-white/5 pb-1 text-xs font-black uppercase tracking-wider">
              <Landmark className="w-3.5 h-3.5" />
              <span>Pipeline &amp; Brokerage Assignment</span>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              <div>
                <label className="block text-[10px] font-bold text-white/50 uppercase mb-1">Preferred Lender</label>
                <select 
                  value={lender}
                  onChange={(e) => setLender(e.target.value)}
                  className="w-full bg-[#141418] border border-white/5 rounded-lg px-3 py-2 text-xs text-white focus:outline-none focus:border-[#b5a642]/40"
                >
                  <option value="">-- No Preferred Lender --</option>
                  {lenders.map((l, i) => (
                    <option key={`${l.name || 'lender'}-${i}`} value={l.name}>{l.name}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-[10px] font-bold text-white/50 uppercase mb-1">Assigned Agent <span className="text-[#b5a642]">*</span></label>
                <select 
                  value={agent}
                  onChange={(e) => setAgent(e.target.value)}
                  className="w-full bg-[#141418] border border-white/5 rounded-lg px-3 py-2 text-xs text-white focus:outline-none focus:border-[#b5a642]/40"
                >
                  {agentNames.map((name, i) => (
                    <option key={`${name || 'agent'}-${i}`} value={name}>{name}</option>
                  ))}
                </select>
              </div>
              <div className="md:col-span-2">
                <label className="block text-[10px] font-bold text-white/50 uppercase mb-1">Workstation Pipeline Stage <span className="text-[#b5a642]">*</span></label>
                <select 
                  value={status}
                  onChange={(e) => setStatus(e.target.value as Client["status"])}
                  className="w-full bg-[#141418] border border-white/5 rounded-lg px-3 py-2 text-xs text-white focus:outline-none focus:border-[#b5a642]/40"
                >
                  <option value="lead">📁 Lead Generation Stage</option>
                  <option value="open">📁 New/Open Mortgage Application</option>
                  <option value="working">📁 Working (Collecting Paystubs &amp; Docs)</option>
                  <option value="lender">📁 Lender Submissions Active</option>
                  <option value="conditional">📁 Conditionally Approved</option>
                  <option value="approved">📁 Firmly Approved File</option>
                  <option value="funded">📁 Funded/Closed - Active Retention Stream</option>
                </select>
              </div>
            </div>
          </div>

        </form>

        {/* Footer */}
        <div className="border-t border-white/5 pt-4 mt-5 flex items-center justify-end gap-3 shrink-0">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 bg-white/5 hover:bg-white/10 border border-white/5 text-white/70 hover:text-white font-bold text-xs rounded-xl transition-all"
            id="cancel-new-client-modal-btn"
          >
            Cancel Intake
          </button>
          <button
            onClick={handleSubmit}
            className="px-5 py-2.5 bg-[#b5a642] hover:bg-[#9a8c38] text-black font-extrabold text-xs rounded-xl transition-all flex items-center gap-1.5 shadow-lg shadow-[#b5a642]/10"
            id="submit-new-client-modal-btn"
          >
            <Plus className="w-4 h-4 stroke-[2.5]" /> Commission New File
          </button>
        </div>

      </motion.div>
    </div>
  );
};
