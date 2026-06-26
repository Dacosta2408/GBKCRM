import React, { useState, useEffect } from "react";
import { 
  User, MapPin, Briefcase, Building, Percent, ShieldAlert, 
  Sparkles, Save, Landmark, RefreshCw, Info, AlertCircle 
} from "lucide-react";
import { Client, User as CRMUser } from "../types";

interface ApplicationDetailsFormProps {
  client: Client;
  currentUser: CRMUser;
  onUpdateClient: (updated: Client) => void;
  agentNames: string[];
  lenders: Array<{ name: string }>;
  showToast: (msg: string, type?: "success" | "error" | "info" | "warning", icon?: string) => void;
}

export const ApplicationDetailsForm: React.FC<ApplicationDetailsFormProps> = ({
  client,
  currentUser,
  onUpdateClient,
  agentNames,
  lenders,
  showToast
}) => {
  // --- SUB-TABS STATE ---
  type SubTabType = "personal" | "address" | "employment" | "property" | "mortgage";
  const [activeSubTab, setActiveSubTab] = useState<SubTabType>("personal");

  // --- LOCAL FORM FIELDS STATE ---
  const [fields, setFields] = useState<Record<string, string>>({});

  // Sync with client prop updates
  useEffect(() => {
    const rawFields: Record<string, string> = {
      app_first: client.first || "",
      app_last: client.last || "",
      app_email: client.email || "",
      app_cell: client.cell || "",
      app_marital: client.marital || client.appData?.app_marital || "",
      app_sin: client.sin || client.appData?.app_sin || "",
      beacon: String(client.beacon || client.appData?.beacon || "700"),
      app_dependents: String(client.dep || client.appData?.app_dependents || "0"),
      app_home: client.appData?.app_home || "",
      app_work: client.appData?.app_work || "",
      app_contact: client.appData?.app_contact || "Email",

      // Co-Applicant
      co_first: client.appData?.co_first || (client.co ? client.co.split(" ")[0] : ""),
      co_last: client.appData?.co_last || (client.co ? client.co.split(" ").slice(1).join(" ") : ""),
      co_email: client.coEmail || client.appData?.co_email || "",
      co_cell: client.appData?.co_cell || "",
      co_marital: client.appData?.co_marital || "",
      co_sin: client.appData?.co_sin || "",

      // Address
      app_housing: client.appData?.app_housing || (client.appData?.app_housing_Own === "1" ? "Own" : "Rent"),
      app_addr: client.addr || client.appData?.app_addr || "",
      app_unit: client.appData?.app_unit || "",
      app_city: client.appData?.app_city || "",
      app_prov: client.appData?.app_prov || "ON",
      app_post: client.appData?.app_post || "",
      app_res_yrs: client.appData?.app_res_yrs || "",

      // Employment
      app_inc_employed: client.appData?.app_inc_employed || "1",
      app_emp1_name: client.appData?.app_emp1_name || "",
      app_emp1_title: client.appData?.app_emp1_title || "",
      app_emp1_yrs: client.appData?.app_emp1_yrs || "",
      app_emp1_tel: client.appData?.app_emp1_tel || "",
      app_emp1_city: client.appData?.app_emp1_city || "",
      app_emp1_income: String(client.income || client.appData?.app_emp1_income || ""),
      app_self_income: String(client.income || client.appData?.app_self_income || ""),
      app_emp1_status: client.emptype || client.appData?.app_emp1_status || "Full Time",

      // Co-Employment
      co_emp1_income: String(client.coIncome || client.appData?.co_emp1_income || ""),

      // Property
      prop_type: client.proptype || client.appData?.prop_type || "",
      prop_style: client.appData?.prop_style || "",
      prop_tenure: client.appData?.prop_tenure || "",
      prop_age: client.appData?.prop_age || "",
      prop_area: client.appData?.prop_area || "",
      prop_lot: client.appData?.prop_lot || "",
      prop_garage_type: client.appData?.prop_garage_type || "",
      prop_heat: String(client.heat || client.appData?.prop_heat || "150"),
      prop_tax: String(client.tax || client.appData?.prop_tax || ""),
      prop_condo_fees: String(client.condo || client.appData?.prop_condo_fees || "0"),
      prop_value: String(client.propval || client.appData?.prop_value || ""),

      // Mortgage
      mtg1_balance: String(client.mtgamt || client.appData?.mtg1_balance || ""),
      interestRate: client.appData?.interestRate || client.rate || "4.79%",
      amortization: client.appData?.amortization || "25",
      tenure: client.appData?.tenure || "owner-occupied",
      maturityDate: client.appData?.maturityDate || "",
      referredBy: client.appData?.referredBy || client.referredBy || "",
      lender: client.lender || "",
      agent: client.agent || ""
    };

    // Extract DOB fields if available
    if (client.dob && client.dob.includes("-")) {
      const parts = client.dob.split("-");
      if (parts.length === 3) {
        rawFields.app_dob_y = parts[0];
        rawFields.app_dob_m = parts[1];
        rawFields.app_dob_d = parts[2];
      }
    } else {
      rawFields.app_dob_m = client.appData?.app_dob_m || "";
      rawFields.app_dob_d = client.appData?.app_dob_d || "";
      rawFields.app_dob_y = client.appData?.app_dob_y || "";
    }

    setFields(rawFields);
  }, [client]);

  const handleFieldChange = (key: string, value: string) => {
    setFields(prev => ({ ...prev, [key]: value }));
  };

  // --- DYNAMIC PARAMETER PARSING ---
  const pn = (s: any) => {
    if (!s) return 0;
    return parseFloat(String(s).replace(/[$,\s]/g, "")) || 0;
  };

  const fd = (n: number) => {
    return "$" + Math.round(n).toLocaleString("en-CA");
  };

  // Underwriting values
  const propVal = pn(fields.prop_value);
  const mtgAmt = pn(fields.mtg1_balance);
  const ltv = propVal > 0 ? (mtgAmt / propVal) * 100 : 0;

  // GDS calculations
  const primaryIncome = pn(fields.app_emp1_income) || pn(fields.app_self_income);
  const coIncome = pn(fields.co_emp1_income);
  const totalIncome = primaryIncome + coIncome;
  const monthlyTax = (pn(fields.prop_tax) || 0) / 12;
  const monthlyCondo = pn(fields.prop_condo_fees) || 0;
  const monthlyHeat = pn(fields.prop_heat) || 150;

  const rateValue = pn(fields.interestRate) || 4.79;
  const amortYears = pn(fields.amortization) || 25;
  const r = (rateValue / 100) / 12;
  const n = amortYears * 12;
  const monthlyMtg = mtgAmt && r ? (mtgAmt * r * Math.pow(1 + r, n)) / (Math.pow(1 + r, n) - 1) : 0;
  const gds = totalIncome > 0 ? (((monthlyMtg + monthlyTax + monthlyCondo + monthlyHeat) / (totalIncome / 12)) * 100) : 0;

  // --- SAVE OPERATION ---
  const handleFormSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    const app_first = fields.app_first?.trim();
    const app_last = fields.app_last?.trim();
    const app_email = fields.app_email?.trim();

    if (!app_first || !app_last) {
      showToast("First and Last name are required.", "error");
      setActiveSubTab("personal");
      return;
    }

    if (!app_email || !app_email.includes("@")) {
      showToast("A valid email address is required.", "error");
      setActiveSubTab("personal");
      return;
    }

    // DOB reconstruction
    let dobString = "";
    if (fields.app_dob_y && fields.app_dob_m && fields.app_dob_d) {
      dobString = `${fields.app_dob_y}-${fields.app_dob_m.padStart(2, '0')}-${fields.app_dob_d.padStart(2, '0')}`;
    }

    // Assemble updated client object
    const updatedClient: Client = {
      ...client,
      first: app_first,
      last: app_last,
      email: app_email,
      cell: fields.app_cell || "",
      dob: dobString || undefined,
      marital: fields.app_marital || "",
      sin: fields.app_sin || "",
      dep: pn(fields.app_dependents),
      co: fields.co_first && fields.co_last ? `${fields.co_first} ${fields.co_last}` : undefined,
      coEmail: fields.co_email || "",
      income: primaryIncome || undefined,
      coIncome: coIncome || undefined,
      emptype: fields.app_emp1_status || "Salaried",
      beacon: pn(fields.beacon) || 700,
      propval: propVal || undefined,
      mtgamt: mtgAmt || undefined,
      tax: pn(fields.prop_tax) || undefined,
      condo: pn(fields.prop_condo_fees) || undefined,
      heat: pn(fields.prop_heat) || undefined,
      addr: fields.app_addr || "",
      proptype: fields.prop_type || "",
      tenure: fields.tenure || "owner-occupied",
      lender: fields.lender || "",
      agent: fields.agent || "",
      updatedAt: new Date().toISOString(),
      appData: {
        ...(client.appData || {}),
        ...fields
      }
    };

    onUpdateClient(updatedClient);
    showToast("Application file sections updated successfully!", "success", "✓");
  };

  return (
    <form onSubmit={handleFormSubmit} className="flex flex-col gap-5 text-xs h-full" id="application-details-form-root">
      
      {/* 📊 UNDERWRITING HUD CARD */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-3 p-4 bg-[#1b1b20]/40 border border-white/5 rounded-xl">
        <div className="space-y-0.5">
          <div className="text-[10px] text-white/40 uppercase font-black">Loan To Value (LTV)</div>
          <div className={`text-xl font-bold ${ltv > 80 ? "text-red-400" : "text-[#b5a642]"}`}>
            {ltv > 0 ? `${ltv.toFixed(1)}%` : "0.0%"}
          </div>
          <div className="text-[9px] text-[#8e95a3]">
            Value: {fd(propVal)} | Loan: {fd(mtgAmt)}
          </div>
        </div>

        <div className="space-y-0.5 border-l border-white/5 pl-4">
          <div className="text-[10px] text-white/40 uppercase font-black">Estimated Monthly Pmt</div>
          <div className="text-xl font-bold text-white">
            {monthlyMtg > 0 ? fd(monthlyMtg) : "$0"}
          </div>
          <div className="text-[9px] text-[#8e95a3]">
            At {rateValue}% • {amortYears}yr Amortization
          </div>
        </div>

        <div className="space-y-0.5 border-l border-white/5 pl-4">
          <div className="text-[10px] text-white/40 uppercase font-black">Estimated GDS Ratio</div>
          <div className={`text-xl font-bold ${gds > 39 ? "text-red-400" : gds > 0 ? "text-green-400" : "text-white/40"}`}>
            {gds > 0 ? `${gds.toFixed(1)}%` : "0.0%"}
          </div>
          <div className="text-[9px] text-[#8e95a3]">
            Total Combined Income: {fd(totalIncome)}/yr
          </div>
        </div>
      </div>

      {/* 🧭 SECTION TABS */}
      <div className="flex border-b border-white/5 bg-[#141418] p-1 rounded-lg select-none">
        {(["personal", "address", "employment", "property", "mortgage"] as SubTabType[]).map((tab) => {
          const labelMap: Record<SubTabType, string> = {
            personal: "👤 Personal",
            address: "📍 Address",
            employment: "💼 Employment",
            property: "🏠 Property",
            mortgage: "💳 Mortgage"
          };
          return (
            <button
              key={tab}
              type="button"
              onClick={() => setActiveSubTab(tab)}
              className={`flex-1 py-2 text-[10px] uppercase tracking-wider font-extrabold text-center rounded-md transition-all ${
                activeSubTab === tab 
                  ? "bg-[#b5a642] text-black shadow-md" 
                  : "text-white/50 hover:text-white"
              }`}
            >
              {labelMap[tab]}
            </button>
          );
        })}
      </div>

      {/* 🛠️ TAB WORKSPACE */}
      <div className="flex-1 overflow-y-auto min-h-[300px] bg-[#141418]/20 border border-white/5 p-5 rounded-xl">
        
        {/* 1. PERSONAL ROSTER */}
        {activeSubTab === "personal" && (
          <div className="space-y-4" id="section-personal">
            <h4 className="text-[10px] text-[#b5a642] uppercase font-black tracking-wider flex items-center gap-1.5 border-b border-white/5 pb-1">
              Applicant Details
            </h4>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-[9px] text-white/40 uppercase font-black tracking-wider mb-1">First Name *</label>
                <input type="text" value={fields.app_first || ""} onChange={(e) => handleFieldChange("app_first", e.target.value)} placeholder="First" className="w-full bg-[#1b1b20] border border-white/5 rounded-lg p-2.5 text-xs text-white focus:outline-none" />
              </div>
              <div>
                <label className="block text-[9px] text-white/40 uppercase font-black tracking-wider mb-1">Last Name *</label>
                <input type="text" value={fields.app_last || ""} onChange={(e) => handleFieldChange("app_last", e.target.value)} placeholder="Last" className="w-full bg-[#1b1b20] border border-white/5 rounded-lg p-2.5 text-xs text-white focus:outline-none" />
              </div>
              <div>
                <label className="block text-[9px] text-white/40 uppercase font-black tracking-wider mb-1">Email *</label>
                <input type="email" value={fields.app_email || ""} onChange={(e) => handleFieldChange("app_email", e.target.value)} placeholder="name@email.com" className="w-full bg-[#1b1b20] border border-white/5 rounded-lg p-2.5 text-xs text-white focus:outline-none" />
              </div>
              <div>
                <label className="block text-[9px] text-white/40 uppercase font-black tracking-wider mb-1">Cell Phone</label>
                <input type="text" value={fields.app_cell || ""} onChange={(e) => handleFieldChange("app_cell", e.target.value)} placeholder="(705) 555-1212" className="w-full bg-[#1b1b20] border border-white/5 rounded-lg p-2.5 text-xs text-white focus:outline-none" />
              </div>
              <div>
                <label className="block text-[9px] text-white/40 uppercase font-black tracking-wider mb-1">Date of Birth</label>
                <div className="grid grid-cols-3 gap-2">
                  <input type="text" value={fields.app_dob_m || ""} onChange={(e) => handleFieldChange("app_dob_m", e.target.value)} placeholder="MM" className="w-full bg-[#1b1b20] border border-white/5 rounded-lg p-2 text-xs text-white text-center focus:outline-none" />
                  <input type="text" value={fields.app_dob_d || ""} onChange={(e) => handleFieldChange("app_dob_d", e.target.value)} placeholder="DD" className="w-full bg-[#1b1b20] border border-white/5 rounded-lg p-2 text-xs text-white text-center focus:outline-none" />
                  <input type="text" value={fields.app_dob_y || ""} onChange={(e) => handleFieldChange("app_dob_y", e.target.value)} placeholder="YYYY" className="w-full bg-[#1b1b20] border border-white/5 rounded-lg p-2 text-xs text-white text-center focus:outline-none" />
                </div>
              </div>
              <div>
                <label className="block text-[9px] text-white/40 uppercase font-black tracking-wider mb-1">Marital Status</label>
                <input type="text" value={fields.app_marital || ""} onChange={(e) => handleFieldChange("app_marital", e.target.value)} placeholder="Single, Married, Divorced, etc." className="w-full bg-[#1b1b20] border border-white/5 rounded-lg p-2.5 text-xs text-white focus:outline-none" />
              </div>
              <div>
                <label className="block text-[9px] text-white/40 uppercase font-black tracking-wider mb-1">Social Insurance Number (SIN)</label>
                <input type="text" value={fields.app_sin || ""} onChange={(e) => handleFieldChange("app_sin", e.target.value)} placeholder="e.g. 8104" className="w-full bg-[#1b1b20] border border-white/5 rounded-lg p-2.5 text-xs text-white focus:outline-none" />
              </div>
              <div>
                <label className="block text-[9px] text-white/40 uppercase font-black tracking-wider mb-1">Credit Beacon Score</label>
                <input type="number" value={fields.beacon || ""} onChange={(e) => handleFieldChange("beacon", e.target.value)} placeholder="720" className="w-full bg-[#1b1b20] border border-white/5 rounded-lg p-2.5 text-xs text-white focus:outline-none" />
              </div>
              <div>
                <label className="block text-[9px] text-white/40 uppercase font-black tracking-wider mb-1">Dependents</label>
                <input type="number" value={fields.app_dependents || "0"} onChange={(e) => handleFieldChange("app_dependents", e.target.value)} placeholder="0" className="w-full bg-[#1b1b20] border border-white/5 rounded-lg p-2.5 text-xs text-white focus:outline-none" />
              </div>
            </div>

            <h4 className="text-[10px] text-[#b5a642] uppercase font-black tracking-wider flex items-center gap-1.5 border-b border-white/5 pt-4 pb-1">
              Co-Applicant Details (Optional)
            </h4>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-[9px] text-white/40 uppercase font-black tracking-wider mb-1">Co-Applicant First Name</label>
                <input type="text" value={fields.co_first || ""} onChange={(e) => handleFieldChange("co_first", e.target.value)} placeholder="Co First" className="w-full bg-[#1b1b20] border border-white/5 rounded-lg p-2.5 text-xs text-white focus:outline-none" />
              </div>
              <div>
                <label className="block text-[9px] text-white/40 uppercase font-black tracking-wider mb-1">Co-Applicant Last Name</label>
                <input type="text" value={fields.co_last || ""} onChange={(e) => handleFieldChange("co_last", e.target.value)} placeholder="Co Last" className="w-full bg-[#1b1b20] border border-white/5 rounded-lg p-2.5 text-xs text-white focus:outline-none" />
              </div>
              <div>
                <label className="block text-[9px] text-white/40 uppercase font-black tracking-wider mb-1">Co-Applicant Email</label>
                <input type="email" value={fields.co_email || ""} onChange={(e) => handleFieldChange("co_email", e.target.value)} placeholder="co.applicant@email.com" className="w-full bg-[#1b1b20] border border-white/5 rounded-lg p-2.5 text-xs text-white focus:outline-none" />
              </div>
              <div>
                <label className="block text-[9px] text-white/40 uppercase font-black tracking-wider mb-1">Co-Applicant SIN</label>
                <input type="text" value={fields.co_sin || ""} onChange={(e) => handleFieldChange("co_sin", e.target.value)} placeholder="SIN" className="w-full bg-[#1b1b20] border border-white/5 rounded-lg p-2.5 text-xs text-white focus:outline-none" />
              </div>
            </div>
          </div>
        )}

        {/* 2. CURRENT ADDRESS */}
        {activeSubTab === "address" && (
          <div className="space-y-4" id="section-address">
            <h4 className="text-[10px] text-[#b5a642] uppercase font-black tracking-wider flex items-center gap-1.5 border-b border-white/5 pb-1">
              Current Address Details
            </h4>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-[9px] text-white/40 uppercase font-black tracking-wider mb-1">Housing Status</label>
                <select value={fields.app_housing || ""} onChange={(e) => handleFieldChange("app_housing", e.target.value)} className="w-full bg-[#1b1b20] border border-white/5 rounded-lg p-2.5 text-xs text-white focus:outline-none">
                  <option value="Own">Owns</option>
                  <option value="Rent">Rents</option>
                  <option value="Live with Relatives">Live with Relatives</option>
                  <option value="Live with Others">Live with Others</option>
                </select>
              </div>
              <div>
                <label className="block text-[9px] text-white/40 uppercase font-black tracking-wider mb-1">Street Address</label>
                <input type="text" value={fields.app_addr || ""} onChange={(e) => handleFieldChange("app_addr", e.target.value)} placeholder="123 Oak St" className="w-full bg-[#1b1b20] border border-white/5 rounded-lg p-2.5 text-xs text-white focus:outline-none" />
              </div>
              <div>
                <label className="block text-[9px] text-white/40 uppercase font-black tracking-wider mb-1">Unit / Apt</label>
                <input type="text" value={fields.app_unit || ""} onChange={(e) => handleFieldChange("app_unit", e.target.value)} placeholder="Apt 4" className="w-full bg-[#1b1b20] border border-white/5 rounded-lg p-2.5 text-xs text-white focus:outline-none" />
              </div>
              <div>
                <label className="block text-[9px] text-white/40 uppercase font-black tracking-wider mb-1">City</label>
                <input type="text" value={fields.app_city || ""} onChange={(e) => handleFieldChange("app_city", e.target.value)} placeholder="Barrie" className="w-full bg-[#1b1b20] border border-white/5 rounded-lg p-2.5 text-xs text-white focus:outline-none" />
              </div>
              <div>
                <label className="block text-[9px] text-white/40 uppercase font-black tracking-wider mb-1">Province</label>
                <input type="text" value={fields.app_prov || ""} onChange={(e) => handleFieldChange("app_prov", e.target.value)} placeholder="ON" className="w-full bg-[#1b1b20] border border-white/5 rounded-lg p-2.5 text-xs text-white focus:outline-none" />
              </div>
              <div>
                <label className="block text-[9px] text-white/40 uppercase font-black tracking-wider mb-1">Postal Code</label>
                <input type="text" value={fields.app_post || ""} onChange={(e) => handleFieldChange("app_post", e.target.value)} placeholder="L4M 1X1" className="w-full bg-[#1b1b20] border border-white/5 rounded-lg p-2.5 text-xs text-white focus:outline-none" />
              </div>
              <div>
                <label className="block text-[9px] text-white/40 uppercase font-black tracking-wider mb-1">Years at Residence</label>
                <input type="text" value={fields.app_res_yrs || ""} onChange={(e) => handleFieldChange("app_res_yrs", e.target.value)} placeholder="e.g. 5" className="w-full bg-[#1b1b20] border border-white/5 rounded-lg p-2.5 text-xs text-white focus:outline-none" />
              </div>
            </div>
          </div>
        )}

        {/* 3. EMPLOYMENT & INCOME */}
        {activeSubTab === "employment" && (
          <div className="space-y-4" id="section-employment">
            <h4 className="text-[10px] text-[#b5a642] uppercase font-black tracking-wider flex items-center gap-1.5 border-b border-white/5 pb-1">
              Employment Details
            </h4>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-[9px] text-white/40 uppercase font-black tracking-wider mb-1">Employment Status</label>
                <select value={fields.app_emp1_status || ""} onChange={(e) => handleFieldChange("app_emp1_status", e.target.value)} className="w-full bg-[#1b1b20] border border-white/5 rounded-lg p-2.5 text-xs text-white focus:outline-none">
                  <option value="Full Time Salaried">Full Time Salaried</option>
                  <option value="BFS / Self-Employed">BFS / Self-Employed</option>
                  <option value="Part-Time">Part-Time</option>
                  <option value="Retired">Retired</option>
                  <option value="Contract">Contract</option>
                </select>
              </div>
              <div>
                <label className="block text-[9px] text-white/40 uppercase font-black tracking-wider mb-1">Employer / Company Name</label>
                <input type="text" value={fields.app_emp1_name || ""} onChange={(e) => handleFieldChange("app_emp1_name", e.target.value)} placeholder="Employer" className="w-full bg-[#1b1b20] border border-white/5 rounded-lg p-2.5 text-xs text-white focus:outline-none" />
              </div>
              <div>
                <label className="block text-[9px] text-white/40 uppercase font-black tracking-wider mb-1">Job Title</label>
                <input type="text" value={fields.app_emp1_title || ""} onChange={(e) => handleFieldChange("app_emp1_title", e.target.value)} placeholder="Title" className="w-full bg-[#1b1b20] border border-white/5 rounded-lg p-2.5 text-xs text-white focus:outline-none" />
              </div>
              <div>
                <label className="block text-[9px] text-white/40 uppercase font-black tracking-wider mb-1">Years on Job</label>
                <input type="text" value={fields.app_emp1_yrs || ""} onChange={(e) => handleFieldChange("app_emp1_yrs", e.target.value)} placeholder="Years" className="w-full bg-[#1b1b20] border border-white/5 rounded-lg p-2.5 text-xs text-white focus:outline-none" />
              </div>
              <div>
                <label className="block text-[9px] text-white/40 uppercase font-black tracking-wider mb-1">Primary Salary / Income ($)</label>
                <input type="number" value={fields.app_emp1_income || ""} onChange={(e) => handleFieldChange("app_emp1_income", e.target.value)} placeholder="e.g. 95000" className="w-full bg-[#1b1b20] border border-white/5 rounded-lg p-2.5 text-xs text-white focus:outline-none" />
              </div>
              <div>
                <label className="block text-[9px] text-white/40 uppercase font-black tracking-wider mb-1">Co-Applicant Income ($)</label>
                <input type="number" value={fields.co_emp1_income || ""} onChange={(e) => handleFieldChange("co_emp1_income", e.target.value)} placeholder="e.g. 60000" className="w-full bg-[#1b1b20] border border-white/5 rounded-lg p-2.5 text-xs text-white focus:outline-none" />
              </div>
            </div>
          </div>
        )}

        {/* 4. PROPERTY DETAILS */}
        {activeSubTab === "property" && (
          <div className="space-y-4" id="section-property">
            <h4 className="text-[10px] text-[#b5a642] uppercase font-black tracking-wider flex items-center gap-1.5 border-b border-white/5 pb-1">
              Subject Property Details
            </h4>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-[9px] text-white/40 uppercase font-black tracking-wider mb-1">Estimated Purchase Price / Value ($)</label>
                <input type="number" value={fields.prop_value || ""} onChange={(e) => handleFieldChange("prop_value", e.target.value)} placeholder="e.g. 685000" className="w-full bg-[#1b1b20] border border-white/5 rounded-lg p-2.5 text-xs text-white focus:outline-none" />
              </div>
              <div>
                <label className="block text-[9px] text-white/40 uppercase font-black tracking-wider mb-1">Property Type</label>
                <select value={fields.prop_type || ""} onChange={(e) => handleFieldChange("prop_type", e.target.value)} className="w-full bg-[#1b1b20] border border-white/5 rounded-lg p-2.5 text-xs text-white focus:outline-none">
                  <option value="">Select type</option>
                  <option value="Detached">Detached House</option>
                  <option value="Semi-Detached">Semi-Detached</option>
                  <option value="Townhouse">Townhouse</option>
                  <option value="Condo Apartment">Condo Apartment</option>
                  <option value="Duplex / Triplex">Duplex / Triplex</option>
                </select>
              </div>
              <div>
                <label className="block text-[9px] text-white/40 uppercase font-black tracking-wider mb-1">Property Style</label>
                <input type="text" value={fields.prop_style || ""} onChange={(e) => handleFieldChange("prop_style", e.target.value)} placeholder="e.g. Two Storey" className="w-full bg-[#1b1b20] border border-white/5 rounded-lg p-2.5 text-xs text-white focus:outline-none" />
              </div>
              <div>
                <label className="block text-[9px] text-white/40 uppercase font-black tracking-wider mb-1">Tenure</label>
                <input type="text" value={fields.prop_tenure || ""} onChange={(e) => handleFieldChange("prop_tenure", e.target.value)} placeholder="e.g. Freehold" className="w-full bg-[#1b1b20] border border-white/5 rounded-lg p-2.5 text-xs text-white focus:outline-none" />
              </div>
              <div>
                <label className="block text-[9px] text-white/40 uppercase font-black tracking-wider mb-1">Annual Property Taxes ($)</label>
                <input type="number" value={fields.prop_tax || ""} onChange={(e) => handleFieldChange("prop_tax", e.target.value)} placeholder="e.g. 4200" className="w-full bg-[#1b1b20] border border-white/5 rounded-lg p-2.5 text-xs text-white focus:outline-none" />
              </div>
              <div>
                <label className="block text-[9px] text-white/40 uppercase font-black tracking-wider mb-1">Monthly Condo Fees ($)</label>
                <input type="number" value={fields.prop_condo_fees || ""} onChange={(e) => handleFieldChange("prop_condo_fees", e.target.value)} placeholder="e.g. 350" className="w-full bg-[#1b1b20] border border-white/5 rounded-lg p-2.5 text-xs text-white focus:outline-none" />
              </div>
              <div>
                <label className="block text-[9px] text-white/40 uppercase font-black tracking-wider mb-1">Monthly Heating Utilities ($)</label>
                <input type="number" value={fields.prop_heat || "150"} onChange={(e) => handleFieldChange("prop_heat", e.target.value)} placeholder="e.g. 150" className="w-full bg-[#1b1b20] border border-white/5 rounded-lg p-2.5 text-xs text-white focus:outline-none" />
              </div>
              <div>
                <label className="block text-[9px] text-white/40 uppercase font-black tracking-wider mb-1">Property Age (Years)</label>
                <input type="text" value={fields.prop_age || ""} onChange={(e) => handleFieldChange("prop_age", e.target.value)} placeholder="e.g. 15" className="w-full bg-[#1b1b20] border border-white/5 rounded-lg p-2.5 text-xs text-white focus:outline-none" />
              </div>
            </div>
          </div>
        )}

        {/* 5. MORTGAGE PARAMETERS */}
        {activeSubTab === "mortgage" && (
          <div className="space-y-4" id="section-mortgage">
            <h4 className="text-[10px] text-[#b5a642] uppercase font-black tracking-wider flex items-center gap-1.5 border-b border-white/5 pb-1">
              Mortgage Application Parameters
            </h4>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-[9px] text-white/40 uppercase font-black tracking-wider mb-1">Mortgage Requested / Size ($)</label>
                <input type="number" value={fields.mtg1_balance || ""} onChange={(e) => handleFieldChange("mtg1_balance", e.target.value)} placeholder="e.g. 548000" className="w-full bg-[#1b1b20] border border-white/5 rounded-lg p-2.5 text-xs text-white focus:outline-none" />
              </div>
              <div>
                <label className="block text-[9px] text-white/40 uppercase font-black tracking-wider mb-1">Interest Rate</label>
                <input type="text" value={fields.interestRate || ""} onChange={(e) => handleFieldChange("interestRate", e.target.value)} placeholder="e.g. 4.79%" className="w-full bg-[#1b1b20] border border-white/5 rounded-lg p-2.5 text-xs text-white focus:outline-none" />
              </div>
              <div>
                <label className="block text-[9px] text-white/40 uppercase font-black tracking-wider mb-1">Amortization (Years)</label>
                <select value={fields.amortization || "25"} onChange={(e) => handleFieldChange("amortization", e.target.value)} className="w-full bg-[#1b1b20] border border-white/5 rounded-lg p-2.5 text-xs text-white focus:outline-none">
                  <option value="15">15 Years</option>
                  <option value="20">20 Years</option>
                  <option value="25">25 Years</option>
                  <option value="30">30 Years</option>
                </select>
              </div>
              <div>
                <label className="block text-[9px] text-white/40 uppercase font-black tracking-wider mb-1">Occupancy Type</label>
                <select value={fields.tenure || "owner-occupied"} onChange={(e) => handleFieldChange("tenure", e.target.value)} className="w-full bg-[#1b1b20] border border-white/5 rounded-lg p-2.5 text-xs text-white focus:outline-none">
                  <option value="owner-occupied">Owner Occupied</option>
                  <option value="rental">Rental / Investment</option>
                  <option value="second-home">Second Home</option>
                </select>
              </div>
              <div>
                <label className="block text-[9px] text-white/40 uppercase font-black tracking-wider mb-1">Lender Partner</label>
                <select value={fields.lender || ""} onChange={(e) => handleFieldChange("lender", e.target.value)} className="w-full bg-[#1b1b20] border border-white/5 rounded-lg p-2.5 text-xs text-white focus:outline-none">
                  <option value="">No active submission</option>
                  {lenders.map(l => (
                    <option key={l.name} value={l.name}>{l.name}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-[9px] text-white/40 uppercase font-black tracking-wider mb-1">Assigned Agent</label>
                <select value={fields.agent || ""} onChange={(e) => handleFieldChange("agent", e.target.value)} className="w-full bg-[#1b1b20] border border-white/5 rounded-lg p-2.5 text-xs text-white focus:outline-none">
                  <option value="">Unassigned</option>
                  {agentNames.map(name => (
                    <option key={name} value={name}>{name}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-[9px] text-white/40 uppercase font-black tracking-wider mb-1">Maturity Date</label>
                <input type="date" value={fields.maturityDate || ""} onChange={(e) => handleFieldChange("maturityDate", e.target.value)} className="w-full bg-[#1b1b20] border border-white/5 rounded-lg p-2.5 text-xs text-white focus:outline-none" />
              </div>
              <div>
                <label className="block text-[9px] text-white/40 uppercase font-black tracking-wider mb-1">Referred By</label>
                <input type="text" value={fields.referredBy || ""} onChange={(e) => handleFieldChange("referredBy", e.target.value)} placeholder="e.g. Broker Network" className="w-full bg-[#1b1b20] border border-white/5 rounded-lg p-2.5 text-xs text-white focus:outline-none" />
              </div>
            </div>
          </div>
        )}

      </div>

      {/* 💾 ACTION BUTTON */}
      <button
        type="submit"
        className="w-full bg-[#b5a642] text-black font-black uppercase tracking-widest text-[10px] py-3 rounded-lg hover:bg-[#9a8c38] hover:shadow-md transition-all flex items-center justify-center gap-1.5 shrink-0"
      >
        <Save className="w-3.5 h-3.5" /> Save Application Sections
      </button>

    </form>
  );
};
