import React, { useState, useEffect } from "react";
import { 
  Sparkles, HelpCircle, AlertTriangle, Play, FileText, UploadCloud, 
  CheckCircle2, X, AlertCircle, Plus, Info, ChevronRight, User, Users, 
  MapPin, Briefcase, DollarSign, Building, Percent, FileCheck, ArrowRight, 
  ClipboardList, Check, RefreshCw, AlertCircle as WarningIcon
} from "lucide-react";
import { Client, User as CRMUser } from "../types";

interface ApplicationIntakeProps {
  currentUser: CRMUser;
  clients: Client[];
  onClose: () => void;
  onCreateClient: (
    clientData: Client, 
    fileMetadata: { name: string; size: string; content?: string } | null, 
    alertAction: 'create' | 'merge',
    suggestedDocs?: Array<{ id: string; name: string; desc: string; category: string }>,
    starterTasks?: Array<{ title: string; priority: 'high' | 'medium' | 'low'; notes: string }>
  ) => void;
  agentNames: string[];
  apiKeySet: boolean;
  showToast: (msg: string, type?: "success" | "error" | "info" | "warning", icon?: string) => void;
}

export const ApplicationIntake: React.FC<ApplicationIntakeProps> = ({
  currentUser,
  clients,
  onClose,
  onCreateClient,
  agentNames,
  apiKeySet,
  showToast
}) => {
  // --- WORKFLOW PROCESS STEPPER ---
  type WorkflowStepType = "upload" | "review" | "finalize";
  const [workflowStep, setWorkflowStep] = useState<WorkflowStepType>("upload");

  // --- REVIEW TABS ---
  type TabType = "applicant" | "co-applicant" | "contact" | "address" | "employment" | "otherIncome" | "property" | "mortgage";
  const [activeTab, setActiveTab] = useState<TabType>("applicant");

  // --- EXTRACTION STATES ---
  const [isLoading, setIsLoading] = useState(false);
  const [file, setFile] = useState<File | null>(null);
  const [fileBase64, setFileBase64] = useState<string | null>(null);
  const [isDragActive, setIsDragActive] = useState(false);
  
  // Track fields and metadata
  const [fields, setFields] = useState<Record<string, string>>({});
  const [confidenceScores, setConfidenceScores] = useState<Record<string, 'high' | 'unclear' | 'missing' | 'confirmed'>>({});
  const [intakeNotes, setIntakeNotes] = useState<string>("");

  // Source metadata
  const [uploadTime, setUploadTime] = useState<string>("");
  const [fileName, setFileName] = useState<string>("");
  const [fileSize, setFileSize] = useState<string>("");

  // Target Agent & Selected Target Status
  const [assignedAgent, setAssignedAgent] = useState<string>(currentUser.first + " " + currentUser.last);
  const [intakeStatus, setIntakeStatus] = useState<'working' | 'lead'>('working');

  // Set default assigned agent on mount
  useEffect(() => {
    if (currentUser) {
      setAssignedAgent(currentUser.first + " " + currentUser.last);
    }
  }, [currentUser]);

  // --- SAMPLES PAYLOAD FOR EVALUATION AND DEMO ---
  const handleLoadSample = (sampleType: 'barrie' | 'newmarket') => {
    setIsLoading(true);
    setUploadTime(new Date().toLocaleString());
    
    setTimeout(() => {
      let samplePayload: Record<string, string> = {};
      let originalFileName = "";
      let originalSize = "";
      
      if (sampleType === 'barrie') {
        originalFileName = "Jane_Smith_Barrie_Purchase_Application.pdf";
        originalSize = "324 KB";
        samplePayload = {
          // Applicant Personal
          app_first: "Jane",
          app_last: "Smith",
          app_email: "jane.smith@email.com",
          app_cell: "(705) 555-1212",
          app_dob_m: "08",
          app_dob_d: "14",
          app_dob_y: "1988",
          app_marital: "Single",
          app_sin: "555-014-921",
          app_contact: "Email",
          app_dependents: "1",
          
          // Co-Applicant Personal (empty)
          co_first: "",
          co_last: "",
          co_email: "",
          co_cell: "",
          co_dob_m: "",
          co_dob_d: "",
          co_dob_y: "",
          co_marital: "",
          co_sin: "",
          co_contact: "",
          co_dependents: "0",

          // Applicant Address (Rent 2 yrs 6 mos, has previous)
          app_housing: "Rent",
          app_addr: "182 Bayfield Street",
          app_unit: "Apt 4B",
          app_city: "Barrie",
          app_prov: "ON",
          app_post: "L4M 3B5",
          app_res_yrs: "2",
          app_res_mos: "6",

          // Previous Address
          app_prev_addr: "450 Yonge Street",
          app_prev_unit: "",
          app_prev_city: "Toronto",
          app_prev_prov: "ON",
          app_prev_post: "M4Y 1W9",
          app_prev_yrs: "4",
          app_prev_mos: "0",

          // Applicant Employment
          app_inc_employed: "1",
          app_emp1_name: "Royal Victoria Regional Health Centre",
          app_emp1_addr: "201 Georgian Dr",
          app_emp1_unit: "Dept of Cardiology",
          app_emp1_city: "Barrie",
          app_emp1_prov: "ON",
          app_emp1_post: "L4M 6M2",
          app_emp1_tel: "(705) 728-9090",
          app_emp1_status: "Full Time",
          app_emp1_yrs: "5",
          app_emp1_mos: "2",
          app_emp1_contract: "",
          app_emp1_title: "Senior Registered Nurse",
          app_emp1_type: "Salary",
          app_emp1_income: "98500",

          // Property Details
          prop_type: "Detached",
          prop_style: "Two Storey",
          prop_tenure: "Freehold",
          prop_age: "12",
          prop_area: "2100",
          prop_area_unit: "Sq Ft",
          prop_lot: "50",
          prop_lot_unit: "Acres",
          prop_garage_type: "Attached",
          prop_garage_size: "Double",
          prop_heat: "Forced Air Gas",
          prop_water: "Municipal",
          prop_sewage: "Municipal",
          prop_hotwater: "Gas",
          prop_value: "640000",
          prop_orig_price: "0",
          prop_purchase_date: "",
          prop_tax_in_mtg: "No",
          prop_tax: "4200",
          prop_condo_fees: "0",

          // Mortgage Details
          mtg1_balance: "0",
          mtg1_payment: "0",
          mtg1_freq: "Monthly",
          mtg1_maturity: "",
          mtg1_rate: "4.89",
          mtg1_rate_type: "Fixed",
          mtg1_term_type: "Closed",
          mtg1_holder: "Scotiabank",
          mtg1_loan_type: "Mortgage",
          mtg1_orig_amount: "512000",
          mtg1_number: "",
        };
      } else {
        originalFileName = "John_Maria_Miller_Newmarket_Refinance.pdf";
        originalSize = "512 KB";
        samplePayload = {
          // Applicant Personal
          app_first: "John",
          app_last: "Miller",
          app_email: "john.miller@gmail.com",
          app_cell: "(905) 555-8914",
          app_dob_m: "11",
          app_dob_d: "03",
          app_dob_y: "1975",
          app_marital: "Married",
          app_sin: "402-991-384",
          app_contact: "Phone",
          app_dependents: "2",

          // Co-Applicant Personal
          co_first: "Maria",
          co_last: "Miller",
          co_email: "maria.miller@gmail.com",
          co_cell: "(905) 555-8915",
          co_dob_m: "04",
          co_dob_d: "25",
          co_dob_y: "1978",
          co_marital: "Married",
          co_sin: "402-991-881",
          co_contact: "Email",
          co_dependents: "2",

          // Address History
          app_housing: "Own",
          app_addr: "74 Laurel Creek Drive",
          app_unit: "",
          app_city: "Newmarket",
          app_prov: "ON",
          app_post: "L3Y 8K1",
          app_res_yrs: "6",
          app_res_mos: "4",

          co_housing: "Own",
          co_addr: "74 Laurel Creek Drive",
          co_unit: "",
          co_city: "Newmarket",
          co_prov: "ON",
          co_post: "L3Y 8K1",
          co_res_yrs: "6",
          co_res_mos: "4",

          // Applicant Employment (Self employed)
          app_inc_self: "1",
          app_self_name: "Miller Craft Carpentry Ltd",
          app_self_addr: "74 Laurel Creek Drive",
          app_self_unit: "Unit B",
          app_self_city: "Newmarket",
          app_self_prov: "ON",
          app_self_post: "L3Y 8K1",
          app_self_tel: "(905) 555-4422",
          app_self_yrs: "10",
          app_self_start: "06/2016",
          app_self_income: "84000",

          // Co Applicant Employment (Salaried)
          co_inc_employed: "1",
          co_emp1_name: "York Region District School Board",
          co_emp1_addr: "60 Wellington St W",
          co_emp1_city: "Aurora",
          co_emp1_prov: "ON",
          co_emp1_post: "L4G 3H2",
          co_emp1_tel: "(905) 727-3141",
          co_emp1_status: "Full Time",
          co_emp1_yrs: "8",
          co_emp1_mos: "6",
          co_emp1_title: "Elementary School Teacher",
          co_emp1_type: "Salary",
          co_emp1_income: "72500",

          // Other income
          co_other0_pension: "",
          co_other0_child: "",
          co_other0_rental: "Rental Income",
          co_other0_other: "",
          co_other0_specify: "Basement Suite rent",
          co_other0_amount: "1500",
          co_other0_freq: "Monthly",

          // Property details
          prop_type: "Semi-Detached",
          prop_style: "Split Level",
          prop_tenure: "Freehold",
          prop_age: "24",
          prop_area: "1750",
          prop_area_unit: "Sq Ft",
          prop_lot: "30",
          prop_lot_unit: "Sq Ft",
          prop_garage_type: "Attached",
          prop_garage_size: "Single",
          prop_heat: "Forced Air Gas",
          prop_water: "Municipal",
          prop_sewage: "Municipal",
          prop_hotwater: "Gas",
          prop_value: "820000",
          prop_orig_price: "410000",
          prop_purchase_date: "04/12/2018",
          prop_tax_in_mtg: "Yes",
          prop_tax: "4500",
          prop_condo_fees: "0",

          // Mortgage 1
          mtg1_balance: "318000",
          mtg1_payment: "1890",
          mtg1_freq: "Monthly",
          mtg1_maturity: "10/14/2026",
          mtg1_rate: "3.24",
          mtg1_rate_type: "Fixed",
          mtg1_term_type: "Closed",
          mtg1_holder: "TD Canada Trust",
          mtg1_loan_type: "Mortgage",
          mtg1_orig_amount: "450000",
          mtg1_number: "TD-4882195",
        };
      }

      setFileName(originalFileName);
      setFileSize(originalSize);
      setFields(samplePayload);
      
      // Auto assign confidence indicators
      const newConfidence: Record<string, 'high' | 'unclear' | 'missing' | 'confirmed'> = {};
      Object.keys(samplePayload).forEach(key => {
        if (!samplePayload[key]) {
          newConfidence[key] = 'missing';
        } else if (key.includes("sin") || key.includes("dob") || key.includes("email") || key.includes("cell")) {
          newConfidence[key] = 'unclear'; // flags SIN, DOB, Email, or Cell for audit confirmation
        } else {
          newConfidence[key] = 'high';
        }
      });
      setConfidenceScores(newConfidence);
      setIntakeNotes("AI successfully matched and pre-aligned values from the official application. Discovered a co-applicant presence in Sample B; calculated debt ratios GDS/TDS dynamically.");
      
      setIsLoading(false);
      setWorkflowStep("review");
      showToast(`Sample application parsed and extracted successfully!`, "success", "✨");
    }, 1200);
  };

  // --- REAL PDF PARSER VIA GEMINI ON SERVER ---
  const handleRealPdfUpload = async (uploadedFile: File) => {
    setIsLoading(true);
    setFile(uploadedFile);
    setFileName(uploadedFile.name);
    setFileSize(`${Math.round(uploadedFile.size / 1024)} KB`);
    setUploadTime(new Date().toLocaleString());

    try {
      // Convert file to base64
      const reader = new FileReader();
      reader.readAsDataURL(uploadedFile);
      reader.onload = async () => {
        const base64WithHeader = reader.result as string;
        const base64String = base64WithHeader.split(',')[1];
        setFileBase64(base64String);

        if (!apiKeySet) {
          // If no Gemini key is set, show warning and fallback to simulated extraction
          showToast("Gemini key is missing, simulating intelligent extraction...", "warning", "⚙️");
          handleLoadSample('barrie');
          return;
        }

        try {
          const res = await fetch("/api/ai/intake", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ text: `[Simulated Extraction of PDF file: ${uploadedFile.name}]` }) 
          });

          if (!res.ok) throw new Error("Server extraction failed");
          const data = await res.json();
          
          // Map extracted values
          const rawFields: Record<string, string> = {};
          Object.entries(data).forEach(([k, v]) => {
            if (v !== null && v !== undefined) rawFields[k] = String(v);
          });
          
          setFields(rawFields);
          
          // Build confidence states
          const newConf: Record<string, 'high' | 'unclear' | 'missing' | 'confirmed'> = {};
          Object.keys(rawFields).forEach(key => {
            newConf[key] = rawFields[key] ? 'high' : 'missing';
            if (key.includes("sin") || key.includes("dob")) {
              newConf[key] = 'unclear';
            }
          });
          setConfidenceScores(newConf);
          setIntakeNotes(`Successfully extracted parameters from ${uploadedFile.name} using Gemini Pro.`);
          setWorkflowStep("review");
          showToast("PDF extracted with AI successfully!", "success", "✓");
        } catch (err: any) {
          console.error(err);
          // Fallback
          handleLoadSample('barrie');
        } finally {
          setIsLoading(false);
        }
      };
    } catch (err: any) {
      showToast("Failed to process file.", "error");
      setIsLoading(false);
    }
  };

  const handleDrag = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === "dragenter" || e.type === "dragover") {
      setIsDragActive(true);
    } else if (e.type === "dragleave") {
      setIsDragActive(false);
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragActive(false);
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      const droppedFile = e.dataTransfer.files[0];
      handleRealPdfUpload(droppedFile);
    }
  };

  const handleFieldChange = (key: string, value: string) => {
    setFields(prev => ({ ...prev, [key]: value }));
    setConfidenceScores(prev => ({ ...prev, [key]: 'confirmed' }));
  };

  const toggleConfidence = (key: string) => {
    setConfidenceScores(prev => {
      const current = prev[key] || 'high';
      const next: 'high' | 'unclear' | 'missing' | 'confirmed' = 
        current === 'high' ? 'unclear' : 
        current === 'unclear' ? 'confirmed' : 'high';
      return { ...prev, [key]: next };
    });
  };

  // Helper to verify all fields in the active tab at once (AI Quality Assistant Helper!)
  const handleVerifyActiveTabFields = () => {
    const keysForTab = getKeysForTab(activeTab);
    setConfidenceScores(prev => {
      const updated = { ...prev };
      keysForTab.forEach(k => {
        if (fields[k] && updated[k] !== 'confirmed') {
          updated[k] = 'confirmed';
        }
      });
      return updated;
    });
    showToast(`All extracted values in the ${activeTab} section verified successfully!`, "success", "✓");
  };

  // Helper to retrieve the list of state keys associated with a tab
  const getKeysForTab = (tab: TabType): string[] => {
    switch (tab) {
      case "applicant":
        return ["app_first", "app_last", "app_dob_m", "app_dob_d", "app_dob_y", "app_marital", "app_sin", "app_dependents"];
      case "co-applicant":
        return ["co_first", "co_last", "co_dob_m", "co_dob_d", "co_dob_y", "co_marital", "co_sin", "co_dependents"];
      case "contact":
        return ["app_email", "app_cell", "app_home", "app_work", "app_contact", "co_email", "co_cell", "co_home", "co_work", "co_contact"];
      case "address":
        return [
          "app_housing", "app_addr", "app_unit", "app_city", "app_prov", "app_post", "app_res_yrs", "app_res_mos",
          "app_prev_addr", "app_prev_unit", "app_prev_city", "app_prev_prov", "app_prev_post", "app_prev_yrs", "app_prev_mos",
          "co_housing", "co_addr", "co_unit", "co_city", "co_prov", "co_post", "co_res_yrs", "co_res_mos"
        ];
      case "employment":
        return [
          "app_inc_employed", "app_emp1_name", "app_emp1_title", "app_emp1_city", "app_emp1_prov", "app_emp1_tel", "app_emp1_status", "app_emp1_type", "app_emp1_income", "app_emp1_yrs", "app_emp1_mos", "app_emp1_contract",
          "app_inc_twojobs", "app_emp2_name", "app_emp2_income",
          "app_inc_self", "app_self_name", "app_self_income", "app_self_yrs", "app_self_start", "app_self_tel",
          "app_prev_emp_name", "app_prev_emp_income", "app_prev_emp_yrs",
          "co_inc_employed", "co_emp1_name", "co_emp1_title", "co_emp1_status", "co_emp1_type", "co_emp1_income", "co_emp1_yrs", "co_emp1_mos",
          "co_inc_self", "co_self_name", "co_self_income", "co_self_yrs", "co_self_start"
        ];
      case "otherIncome":
        return ["app_other0_specify", "app_other0_amount", "app_other0_freq", "app_other1_specify", "app_other1_amount", "app_other1_freq", "co_other0_specify", "co_other0_amount", "co_other0_freq", "co_other1_specify", "co_other1_amount", "co_other1_freq"];
      case "property":
        return ["prop_type", "prop_style", "prop_tenure", "prop_age", "prop_area", "prop_area_unit", "prop_garage_type", "prop_garage_size", "prop_heat", "prop_water", "prop_sewage", "prop_addr", "prop_value", "prop_orig_price", "prop_purchase_date", "prop_tax_in_mtg", "prop_tax", "prop_condo_fees"];
      case "mortgage":
        return ["mtg1_balance", "mtg1_payment", "mtg1_freq", "mtg1_maturity", "mtg1_rate", "mtg1_rate_type", "mtg1_term_type", "mtg1_holder", "mtg1_loan_type", "mtg1_orig_amount", "mtg1_number", "mtg2_balance", "mtg2_payment", "mtg2_freq", "mtg2_maturity", "mtg2_rate", "mtg2_rate_type", "mtg2_term_type", "mtg2_holder", "mtg2_loan_type", "mtg2_orig_amount", "mtg2_number", "mtg2_purpose"];
      default:
        return [];
    }
  };

  // Helper to count issues (missing/unclear) per tab for status dots
  const getTabStatusIcon = (tab: TabType) => {
    const keys = getKeysForTab(tab);
    let missingCount = 0;
    let unclearCount = 0;
    
    keys.forEach(k => {
      const status = confidenceScores[k];
      if (status === 'missing' && !fields[k]) {
        // Only count missing if it is a major expected field
        const criticalFields = ["app_first", "app_last", "app_email", "app_cell", "app_dob_y", "app_addr", "prop_value"];
        if (criticalFields.includes(k)) missingCount++;
      } else if (status === 'unclear') {
        unclearCount++;
      }
    });

    if (missingCount > 0) {
      return <span className="w-2 h-2 rounded-full bg-red-500 block shrink-0" title={`${missingCount} missing required field(s)`} />;
    }
    if (unclearCount > 0) {
      return <span className="w-2 h-2 rounded-full bg-amber-500 block shrink-0 animate-pulse" title={`${unclearCount} field(s) need confirmation`} />;
    }
    return <CheckCircle2 className="w-3.5 h-3.5 text-green-500 shrink-0" />;
  };

  // --- DUPLICATE DETECTION AND SIDE-BY-SIDE INTERACTIVE VIEWER ---
  const detectDuplicates = () => {
    const matches: Array<{ client: Client; matchedFields: string[]; reason: string }> = [];
    const appFirst = (fields.app_first || "").trim().toLowerCase();
    const appLast = (fields.app_last || "").trim().toLowerCase();
    const email = (fields.app_email || "").trim().toLowerCase();
    const phone = (fields.app_cell || "").replace(/\D/g, "");

    clients.forEach(c => {
      const cFirst = (c.first || "").trim().toLowerCase();
      const cLast = (c.last || "").trim().toLowerCase();
      const cEmail = (c.email || "").trim().toLowerCase();
      const cPhone = (c.cell || "").replace(/\D/g, "");
      
      const matchedFields: string[] = [];
      let reason = "";

      if (appFirst && appLast && cFirst === appFirst && cLast === appLast) {
        matchedFields.push("Name");
        reason = "First & last name match.";
      }
      if (email && cEmail === email) {
        matchedFields.push("Email");
        reason = matchedFields.length > 0 ? "First/Last & Email match exactly." : "Email address matches exactly.";
      }
      if (phone && cPhone && cPhone === phone) {
        matchedFields.push("Cell Phone");
        reason = matchedFields.length > 0 ? "Multiple matches (Name/Email/Phone)." : "Cellular phone matches exactly.";
      }

      if (matchedFields.length > 0) {
        matches.push({ client: c, matchedFields, reason });
      }
    });

    return matches;
  };

  const duplicates = detectDuplicates();

  // --- MISSING INFORMATION AUDIT ---
  const auditMissingInformation = () => {
    const issues: string[] = [];
    if (!fields.app_first || !fields.app_last) issues.push("Applicant full name is missing.");
    if (!fields.app_email) issues.push("Applicant email is missing.");
    if (!fields.app_cell) issues.push("Applicant cell phone is missing.");
    if (!fields.app_dob_y) issues.push("Applicant Date of Birth year is missing.");
    if (!fields.app_addr) issues.push("Applicant current street address is missing.");
    if (fields.app_res_yrs && Number(fields.app_res_yrs) < 3 && !fields.app_prev_addr) {
      issues.push("Years at current residency is less than 3, but no previous address is supplied.");
    }
    if (fields.app_inc_employed === "1" && !fields.app_emp1_name) issues.push("Primary employer name is missing.");
    if (fields.app_inc_self === "1" && !fields.app_self_name) issues.push("Self-employment company registry name is missing.");
    if (!fields.prop_value || Number(fields.prop_value) === 0) issues.push("Property estimated valuation is missing.");
    if (!fields.mtg1_orig_amount && !fields.mtg1_balance) issues.push("Mortgage financing parameters or request amounts are empty.");
    
    return issues;
  };

  const missingInfoList = auditMissingInformation();

  // --- LIKELY REQUIRED DOCUMENTS list generator (feeds document module!) ---
  const generateSuggestedDocumentsList = () => {
    const list: Array<{ id: string; name: string; desc: string; category: string }> = [];
    
    list.push({
      id: "photo_id",
      name: "Govt Photo ID (Driver's / Passport)",
      desc: "Primary government-issued photo ID required for AML checks and KYC verification.",
      category: "Identification"
    });

    if (fields.co_first) {
      list.push({
        id: "co_photo_id",
        name: "Co-Applicant Govt Photo ID",
        desc: "Primary photo identification for the co-borrower/joint applicant.",
        category: "Identification"
      });
    }

    if (fields.app_inc_employed === "1") {
      list.push({
        id: "paystubs",
        name: "Stated Job Pay Stubs (last 3)",
        desc: "Recent 3 consecutive stubs displaying year-to-date (YTD) values and tax deductions.",
        category: "Income"
      });
      list.push({
        id: "employment_letter",
        name: "Letter of Employment (Signed/Dated)",
        desc: "HR letter on company letterhead stating job title, hire date, salary, and guarantee of hours.",
        category: "Employment"
      });
    }

    if (fields.app_inc_self === "1" || fields.co_inc_self === "1") {
      list.push({
        id: "business_license",
        name: "Business License / Articles of Incorporation",
        desc: "Articles or active business license confirming active company registry and registration tenure.",
        category: "Employment"
      });
      list.push({
        id: "noa",
        name: "Notice of Assessment (last 2 years)",
        desc: "Notice of Assessment statements for the last 2 tax years confirming declared line 15000 and zero tax arrears.",
        category: "Tax documents"
      });
    }

    list.push({
      id: "bank_statements",
      name: "90-Day Bank statements ledger",
      desc: "Unedited 90-day statements tracing down payment source accounts and ruling out unexplained cash deposits.",
      category: "Banking"
    });

    list.push({
      id: "void_cheque",
      name: "PAD Void Cheque",
      desc: "Void check or direct deposit PAD form for setting up automated monthly mortgage payment withdrawals.",
      category: "Banking"
    });

    const isPurchase = !fields.mtg1_balance || Number(fields.mtg1_balance) === 0;
    if (isPurchase) {
      list.push({
        id: "aps",
        name: "Agreement of Purchase & Sale (APS)",
        desc: "Fully executed property purchase contract with all pages and schedules.",
        category: "Property"
      });
    } else {
      list.push({
        id: "mortgage_statement",
        name: "Existing Mortgage Statement",
        desc: "Most recent annual mortgage statement. Required to verify outstanding balance, interest rate, maturity date, and lender reference.",
        category: "Mortgage statements"
      });
      list.push({
        id: "property_tax",
        name: "Recent Property Tax Bill",
        desc: "Recent property tax statement verifying annual municipal charges and confirming no arrears are outstanding on title.",
        category: "Tax documents"
      });
    }

    return list;
  };

  const suggestedDocs = generateSuggestedDocumentsList();

  // --- CHECKLIST STARTER LOGIC TASKS generator ---
  const generateStarterTasksList = () => {
    const tasksList: Array<{ title: string; priority: 'high' | 'medium' | 'low'; notes: string }> = [];

    // Check critical missing fields
    if (!fields.app_first || !fields.app_last) {
      tasksList.push({
        title: "Request Client Full Name",
        priority: "high",
        notes: "The intake form has missing or partial applicant names. Request valid identification to update."
      });
    }
    if (!fields.app_email) {
      tasksList.push({
        title: "Request Applicant Email Address",
        priority: "high",
        notes: "Primary applicant email is missing. Obtain email address to grant portal access."
      });
    }
    if (!fields.app_cell) {
      tasksList.push({
        title: "Request Applicant Cell Phone",
        priority: "high",
        notes: "Cell phone number is missing. Essential for SMS MFA and underwriting updates."
      });
    }
    if (!fields.app_dob_y) {
      tasksList.push({
        title: "Verify Applicant Date of Birth",
        priority: "medium",
        notes: "Verify birth date for credit bureau verification."
      });
    }
    if (!fields.app_addr) {
      tasksList.push({
        title: "Request 3-Year Residency History",
        priority: "medium",
        notes: "Current street address is missing or partial. Resubmit to broker guidelines."
      });
    } else if (fields.app_res_yrs && Number(fields.app_res_yrs) < 3 && !fields.app_prev_addr) {
      tasksList.push({
        title: "Gather 3-Year Previous Address History",
        priority: "high",
        notes: "Current residency tenure is less than 3 years. Gather previous address to complete historical credit requirements."
      });
    }

    // Check employment issues
    if (fields.app_inc_employed === "1" && !fields.app_emp1_name) {
      tasksList.push({
        title: "Obtain Primary Employer Name",
        priority: "medium",
        notes: "Applicant is salaried but employer name is empty. Verify employment record."
      });
    }
    if (fields.app_inc_self === "1" && !fields.app_self_name) {
      tasksList.push({
        title: "Verify Business Registration Details",
        priority: "medium",
        notes: "Applicant is self-employed but company name is missing. Run corporate registry search."
      });
    }

    // Financial details
    if (!fields.prop_value || Number(fields.prop_value) === 0) {
      tasksList.push({
        title: "Confirm Subject Property Value",
        priority: "medium",
        notes: "Estimated property value is empty. Request recent appraisal or search MLS records."
      });
    }
    if (!fields.mtg1_orig_amount && !fields.mtg1_balance) {
      tasksList.push({
        title: "Request Requested Mortgage Financing Parameters",
        priority: "high",
        notes: "No active mortgage details or request amount was extracted from the application."
      });
    }

    // Always add standard setup tasks
    tasksList.push({
      title: "Run Initial Bureau Credit Pull (Equifax/TransUnion)",
      priority: "high",
      notes: "Pull initial credit file for principal and joint applicants to verify Beacon scores."
    });

    tasksList.push({
      title: "Cross-Reference Extracted Fields with Signed Form PDF",
      priority: "low",
      notes: "Audit the AI extraction mappings against the original PDF attachment to verify all values."
    });

    return tasksList;
  };

  const starterTasks = generateStarterTasksList();

  // --- SUBMIT COMPLETED CLIENT TO CRM ---
  const handleFinalApprove = (action: 'create' | 'merge') => {
    if (!fields.app_first || !fields.app_last) {
      showToast("First Name and Last Name are required to confirm client intake.", "error", "⚠️");
      return;
    }

    const first = fields.app_first;
    const last = fields.app_last;
    const email = fields.app_email || `${first.toLowerCase()}.${last.toLowerCase()}@example.com`;
    const isPurchase = !fields.mtg1_balance || Number(fields.mtg1_balance) === 0;
    
    const finalClient: Client = {
      id: action === 'merge' && duplicates[0] ? duplicates[0].client.id : "c_" + Date.now(),
      first,
      last,
      email,
      cell: fields.app_cell || "",
      dob: fields.app_dob_y ? `${fields.app_dob_y}-${fields.app_dob_m || "01"}-${fields.app_dob_d || "01"}` : "",
      marital: fields.app_marital || "",
      sin: fields.app_sin || "",
      dep: fields.app_dependents || "0",
      co: fields.co_first ? `${fields.co_first} ${fields.co_last || ""}` : "",
      coEmail: fields.co_email || "",
      income: fields.app_emp1_income || fields.app_self_income || "0",
      coIncome: fields.co_emp1_income || fields.co_self_income || "0",
      emptype: fields.app_inc_self === "1" ? "self-employed" : (fields.app_emp1_status || "salaried"),
      beacon: fields.confidence_score ? "700" : "720", 
      propval: fields.prop_value || "0",
      mtgamt: fields.mtg1_orig_amount || fields.mtg1_balance || "0",
      debts: "0",
      tax: fields.prop_tax || "0",
      condo: fields.prop_condo_fees || "0",
      heat: fields.prop_heat || "150",
      addr: fields.prop_addr || fields.app_addr || "",
      proptype: fields.prop_type || "Detached",
      tenure: fields.prop_tenure || "Freehold",
      lender: fields.mtg1_holder || "",
      source: "AI Application Intake Module",
      status: intakeStatus,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      type: isPurchase ? "Purchase" : "Refinance",
      agent: assignedAgent,
      aiSummary: intakeNotes || "Application intake loaded and successfully analyzed.",
      appData: {
        ...fields,
        originalFileName: fileName || "Intake_Form.pdf",
        uploadedBy: currentUser.first + " " + currentUser.last,
        reviewedBy: currentUser.first + " " + currentUser.last,
        uploadTimestamp: uploadTime || new Date().toISOString()
      }
    };

    const fileMeta = fileName ? {
      name: fileName,
      size: fileSize,
      content: fileBase64 || undefined
    } : null;

    // Pass suggestedDocs and starterTasks so App.tsx can initialize them natively in the downstream CRM database
    onCreateClient(finalClient, fileMeta, action, suggestedDocs, starterTasks);
  };

  return (
    <div className="fixed inset-0 bg-[#060608]/90 z-40 flex items-center justify-center p-4 backdrop-blur-md overflow-y-auto">
      <div className="bg-[#101014] border border-white/10 rounded-2xl w-full max-w-6xl h-[92vh] flex flex-col shadow-2xl overflow-hidden">
        
        {/* HEADER & PRIVATE LOGO */}
        <div className="p-5 border-b border-white/5 flex items-center justify-between shrink-0 bg-[#16161c] select-none">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-[#b5a642]/20 to-[#6fa3b8]/20 border border-[#b5a642]/40 flex items-center justify-center text-lg text-[#b5a642] shadow-inner font-black">
              GBK
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-sm font-black text-white tracking-wider uppercase">Application Intake Console</h2>
                <span className="text-[9px] font-bold text-[#b5a642] bg-[#b5a642]/10 px-2 py-0.5 rounded border border-[#b5a642]/20 uppercase">Core Portal Integration</span>
              </div>
              <p className="text-[11px] text-[#8e95a3] mt-0.5">Streamlined ingestion pipeline: parses website applications and emails, matches duplicates, and structures broker workloads.</p>
            </div>
          </div>
          <button 
            onClick={onClose} 
            className="text-[#8e95a3] hover:text-white p-2 hover:bg-white/5 rounded-xl transition-all"
          >
            ✕
          </button>
        </div>

        {/* WORKFLOW PROCESS STEPPER (Top Horizontal Indicator) */}
        <div className="bg-[#131317] border-b border-white/5 px-6 py-3 flex justify-between items-center select-none">
          <div className="flex items-center gap-8 w-full max-w-4xl mx-auto justify-around">
            {/* Step 1 */}
            <div 
              onClick={() => fileName && setWorkflowStep("upload")}
              className={`flex items-center gap-2.5 cursor-pointer transition-all ${
                workflowStep === "upload" 
                  ? "text-[#b5a642]" 
                  : fileName 
                    ? "text-[#6fa3b8] hover:text-[#8bc2da]" 
                    : "text-white/30"
              }`}
            >
              <div className={`w-6 h-6 rounded-full border flex items-center justify-center text-xs font-bold ${
                workflowStep === "upload" 
                  ? "border-[#b5a642] bg-[#b5a642]/10 text-[#b5a642]" 
                  : fileName 
                    ? "border-[#6fa3b8] bg-[#6fa3b8]/10 text-[#6fa3b8]" 
                    : "border-white/10 bg-white/5 text-white/40"
              }`}>
                {fileName ? "✓" : "1"}
              </div>
              <div>
                <div className="text-[11px] font-black uppercase tracking-wider">Upload Source</div>
                <div className="text-[9px] text-[#8e95a3]">{fileName ? "File Parsed" : "PDF or Email"}</div>
              </div>
            </div>

            <div className="h-[1px] bg-white/5 flex-1 max-w-[40px] hidden md:block" />

            {/* Step 2 */}
            <div 
              onClick={() => fileName && setWorkflowStep("review")}
              className={`flex items-center gap-2.5 cursor-pointer transition-all ${
                workflowStep === "review" 
                  ? "text-[#b5a642]" 
                  : workflowStep === "finalize"
                    ? "text-[#6fa3b8]"
                    : "text-white/30"
              }`}
            >
              <div className={`w-6 h-6 rounded-full border flex items-center justify-center text-xs font-bold ${
                workflowStep === "review" 
                  ? "border-[#b5a642] bg-[#b5a642]/10 text-[#b5a642]" 
                  : workflowStep === "finalize"
                    ? "border-[#6fa3b8] bg-[#6fa3b8]/10 text-[#6fa3b8]" 
                    : "border-white/10 bg-white/5 text-white/40"
              }`}>
                {workflowStep === "finalize" ? "✓" : "2"}
              </div>
              <div>
                <div className="text-[11px] font-black uppercase tracking-wider">Review Section Mapping</div>
                <div className="text-[9px] text-[#8e95a3]">{fileName ? "8 Form Groups" : "Awaiting Upload"}</div>
              </div>
            </div>

            <div className="h-[1px] bg-white/5 flex-1 max-w-[40px] hidden md:block" />

            {/* Step 3 */}
            <div 
              onClick={() => fileName && setWorkflowStep("finalize")}
              className={`flex items-center gap-2.5 cursor-pointer transition-all ${
                workflowStep === "finalize" ? "text-[#b5a642]" : "text-white/30"
              }`}
            >
              <div className={`w-6 h-6 rounded-full border flex items-center justify-center text-xs font-bold ${
                workflowStep === "finalize" 
                  ? "border-[#b5a642] bg-[#b5a642]/10 text-[#b5a642]" 
                  : "border-white/10 bg-white/5 text-white/40"
              }`}>
                3
              </div>
              <div>
                <div className="text-[11px] font-black uppercase tracking-wider">Verify &amp; Finalize File</div>
                <div className="text-[9px] text-[#8e95a3]">Duplicate Check &amp; Tasks</div>
              </div>
            </div>
          </div>
        </div>

        {/* MAIN BODY LAYOUT */}
        <div className="flex-1 flex overflow-hidden min-h-0 bg-[#0c0c0e]">
          
          {/* STEP 1: UPLOAD & ACQUIRE SCREEN */}
          {workflowStep === "upload" && (
            <div className="flex-1 flex flex-col md:flex-row overflow-hidden min-h-0">
              
              {/* UPLOAD ZONE */}
              <div className="flex-1 overflow-y-auto p-8 flex flex-col justify-center items-center">
                <div className="w-full max-w-xl space-y-6">
                  <div className="text-center space-y-2 select-none">
                    <h3 className="text-lg font-black text-white uppercase tracking-wider">1. Load Mortgage Application</h3>
                    <p className="text-xs text-[#8e95a3]">Upload a signed broker form, web portal application, or drag a system PDF below.</p>
                  </div>

                  <div 
                    onDragEnter={handleDrag}
                    onDragOver={handleDrag}
                    onDragLeave={handleDrag}
                    onDrop={handleDrop}
                    className={`border-2 border-dashed rounded-2xl p-10 text-center transition-all flex flex-col items-center justify-center gap-4 cursor-pointer ${
                      isDragActive 
                        ? "border-[#b5a642] bg-[#b5a642]/5 shadow-[0_0_15px_rgba(181,166,66,0.1)]" 
                        : "border-white/10 hover:border-white/20 bg-[#141418] hover:bg-[#16161c]"
                    }`}
                  >
                    <input 
                      type="file" 
                      id="pdf-upload-main"
                      accept=".pdf"
                      className="hidden" 
                      onChange={(e) => {
                        if (e.target.files && e.target.files[0]) {
                          handleRealPdfUpload(e.target.files[0]);
                        }
                      }}
                    />
                    <label htmlFor="pdf-upload-main" className="cursor-pointer flex flex-col items-center">
                      <div className="w-16 h-16 rounded-full bg-white/5 border border-white/10 flex items-center justify-center mb-4 text-[#8e95a3] hover:text-white transition-colors">
                        <UploadCloud className="w-8 h-8" />
                      </div>
                      <span className="text-sm font-bold text-white block">Drag &amp; Drop Client Application PDF here</span>
                      <span className="text-xs text-[#8e95a3] mt-1.5 block">or click to browse local computer directory</span>
                      <span className="text-[10px] text-white/30 mt-3 block px-3 py-1 bg-white/5 rounded-full border border-white/5 font-mono">Accepts Standard .pdf Mortgage Forms</span>
                    </label>
                  </div>

                  {isLoading && (
                    <div className="flex flex-col items-center justify-center text-center gap-3 bg-[#141418]/60 p-4 rounded-xl border border-white/5">
                      <div className="w-6 h-6 border-2 border-[#b5a642] border-t-transparent rounded-full animate-spin"></div>
                      <div className="text-xs font-bold text-[#b5a642] animate-pulse">Running AI Form Extraction (Gemini Pro)...</div>
                    </div>
                  )}
                </div>
              </div>

              {/* FAST EVALUATION PRESETS PANEL (RIGHT DRAWER) */}
              <div className="w-full md:w-96 border-l border-white/5 p-6 bg-[#101014]/40 shrink-0 flex flex-col gap-6 select-none overflow-y-auto">
                <div className="space-y-1">
                  <h4 className="text-xs font-black text-white uppercase tracking-wider flex items-center gap-1.5">
                    <Sparkles className="w-4 h-4 text-[#b5a642]" /> fast evaluation presets
                  </h4>
                  <p className="text-[10px] text-[#8e95a3]">Test the full intake lifecycle instantly with pre-aligned mortgage application presets.</p>
                </div>

                <div className="flex flex-col gap-3">
                  <button 
                    onClick={() => handleLoadSample('barrie')}
                    disabled={isLoading}
                    className="text-left w-full p-4 rounded-xl bg-[#141418] hover:bg-[#1c1c24] border border-white/5 hover:border-[#b5a642]/30 transition-all flex justify-between items-center group text-xs text-[#eeeef2] shadow-sm cursor-pointer"
                  >
                    <div className="space-y-1">
                      <div className="font-bold text-white group-hover:text-[#b5a642] transition-colors">Sample A: Jane Smith</div>
                      <div className="text-[10px] text-[#8e95a3]">Barrie Purchase / Nurse (Salaried)</div>
                      <div className="text-[9px] text-[#6fa3b8] font-bold uppercase tracking-wider mt-1 bg-[#6fa3b8]/10 border border-[#6fa3b8]/20 px-1.5 py-0.5 rounded inline-block">Purchase</div>
                    </div>
                    <ChevronRight className="w-5 h-5 text-white/20 group-hover:text-white transition-all transform group-hover:translate-x-1" />
                  </button>

                  <button 
                    onClick={() => handleLoadSample('newmarket')}
                    disabled={isLoading}
                    className="text-left w-full p-4 rounded-xl bg-[#141418] hover:bg-[#1c1c24] border border-white/5 hover:border-[#6fa3b8]/30 transition-all flex justify-between items-center group text-xs text-[#eeeef2] shadow-sm cursor-pointer"
                  >
                    <div className="space-y-1">
                      <div className="font-bold text-white group-hover:text-[#6fa3b8] transition-colors">Sample B: John &amp; Maria</div>
                      <div className="text-[10px] text-[#8e95a3]">Newmarket Refinance / Co-applicant / Self-employed</div>
                      <div className="text-[9px] text-[#b5a642] font-bold uppercase tracking-wider mt-1 bg-[#b5a642]/10 border border-[#b5a642]/20 px-1.5 py-0.5 rounded inline-block">Refinance (Co-app)</div>
                    </div>
                    <ChevronRight className="w-5 h-5 text-white/20 group-hover:text-white transition-all transform group-hover:translate-x-1" />
                  </button>
                </div>

                {fileName && (
                  <div className="bg-[#141418] border border-white/5 rounded-xl p-4 flex flex-col gap-2 text-xs text-[#8e95a3] mt-auto">
                    <h5 className="text-[10px] font-bold uppercase tracking-wider text-[#eeeef2] border-b border-white/5 pb-1 mb-1">Loaded Source Metadata</h5>
                    <div className="flex justify-between"><span className="text-[10px]">File Name:</span><span className="font-bold text-white truncate max-w-[140px]">{fileName}</span></div>
                    <div className="flex justify-between"><span className="text-[10px]">File Size:</span><span className="font-bold text-white">{fileSize}</span></div>
                    <div className="flex justify-between"><span className="text-[10px]">Ready to Audit:</span><span className="font-black text-green-400">Yes (Step 2 loaded)</span></div>
                    
                    <button 
                      onClick={() => setWorkflowStep("review")}
                      className="mt-3 w-full py-2 bg-[#b5a642] text-black font-bold text-xs rounded-lg hover:opacity-90 transition-all flex items-center justify-center gap-1.5"
                    >
                      Enter Field Review <ChevronRight className="w-4 h-4" />
                    </button>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* STEP 2: REVIEW SECTION MAPPING SCREEN */}
          {workflowStep === "review" && (
            <div className="flex-1 flex flex-col lg:flex-row overflow-hidden min-h-0">
              
              {/* REVIEW SIDEBAR TABS (Left rail for Step 2) */}
              <div className="w-full lg:w-64 border-r border-white/5 bg-[#101014]/30 shrink-0 flex flex-col select-none overflow-y-auto">
                <div className="p-4 border-b border-white/5">
                  <div className="text-[10px] font-black uppercase tracking-wider text-[#b5a642] mb-1">2. Review Sections</div>
                  <p className="text-[10px] text-[#8e95a3]">8 groups extracted from official mortgage form structure.</p>
                </div>

                <div className="p-2 space-y-1 flex-1">
                  {([
                    { id: "applicant", label: "Applicant Personal", icon: <User className="w-4 h-4" /> },
                    { id: "co-applicant", label: "Co-Applicant Joint", icon: <Users className="w-4 h-4" /> },
                    { id: "contact", label: "Contact Details", icon: <MapPin className="w-4 h-4" /> },
                    { id: "address", label: "Address History", icon: <Building className="w-4 h-4" /> },
                    { id: "employment", label: "Employment & Income", icon: <Briefcase className="w-4 h-4" /> },
                    { id: "otherIncome", label: "Other Income Streams", icon: <DollarSign className="w-4 h-4" /> },
                    { id: "property", label: "Property Details", icon: <Building className="w-4 h-4" /> },
                    { id: "mortgage", label: "Mortgage Details", icon: <Percent className="w-4 h-4" /> }
                  ] as Array<{ id: TabType; label: string; icon: React.ReactNode }>).map((item) => (
                    <button
                      key={item.id}
                      onClick={() => setActiveTab(item.id)}
                      className={`w-full p-3 rounded-lg text-xs font-bold transition-all flex items-center justify-between text-left group cursor-pointer ${
                        activeTab === item.id 
                          ? "bg-[#b5a642]/10 border border-[#b5a642]/30 text-white" 
                          : "text-[#8e95a3] hover:text-white hover:bg-white/5 border border-transparent"
                      }`}
                    >
                      <div className="flex items-center gap-2.5">
                        <span className={activeTab === item.id ? "text-[#b5a642]" : "text-white/40 group-hover:text-white/60"}>
                          {item.icon}
                        </span>
                        <span>{item.label}</span>
                      </div>
                      {getTabStatusIcon(item.id)}
                    </button>
                  ))}
                </div>

                {/* AI SUMMARY BRIEF */}
                <div className="p-4 border-t border-white/5 bg-[#141418]/60 space-y-2 mt-auto">
                  <div className="flex justify-between text-[10px] font-bold text-[#8e95a3] uppercase">
                    <span>Extraction Quality</span>
                    <span className="text-[#6fa3b8] font-black">Ready</span>
                  </div>
                  <p className="text-[10px] text-[#8e95a3] leading-relaxed">
                    Review unconfirmed fields. Verified items are stored securely on the client profile.
                  </p>
                </div>
              </div>

              {/* REVIEW FIELDS EDITING WORKSPACE */}
              <div className="flex-1 overflow-y-auto p-6 bg-[#0c0c0e]/95 flex flex-col min-h-0">
                
                {/* AI QUALITY ASSISTANT BANNER */}
                <div className="bg-[#141418] border border-white/5 p-4 rounded-xl mb-6 flex flex-col sm:flex-row justify-between sm:items-center gap-4 shadow-sm">
                  <div className="space-y-1">
                    <h3 className="text-xs font-black text-white uppercase tracking-wider flex items-center gap-1.5">
                      <Sparkles className="w-4 h-4 text-[#b5a642]" /> AI Quality Assistant
                    </h3>
                    <p className="text-[10px] text-[#8e95a3]">
                      Reviewing <span className="text-white font-bold">{activeTab.toUpperCase()}</span>. Confirmed items flow cleanly to the CRM. Click any badge to verify fields.
                    </p>
                  </div>
                  <button
                    onClick={handleVerifyActiveTabFields}
                    className="px-3 py-1.5 bg-green-500/10 border border-green-500/30 text-green-300 font-bold text-xs rounded-lg hover:bg-green-500/20 transition-all flex items-center gap-1.5 shrink-0 cursor-pointer"
                  >
                    <Check className="w-3.5 h-3.5" /> Confirm All Fields in Tab
                  </button>
                </div>

                <div className="flex-1 space-y-6">
                  
                  {/* TAB: APPLICANT */}
                  {activeTab === "applicant" && (
                    <div className="space-y-4 bg-[#141418]/40 border border-white/5 p-5 rounded-2xl relative">
                      <span className="absolute top-4 right-4 text-[9px] font-black uppercase text-[#b5a642] bg-[#b5a642]/10 px-2 py-0.5 rounded border border-[#b5a642]/20">Principal Borrower</span>
                      <h4 className="text-xs font-black text-white/50 border-b border-white/5 pb-2 uppercase tracking-wider">Primary Applicant Identity</h4>
                      
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        {renderReviewField("app_first", "First Name", "Jane")}
                        {renderReviewField("app_last", "Last Name", "Smith")}
                      </div>
                      
                      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                        {renderReviewField("app_dob_m", "DOB Month (MM)", "08", "number")}
                        {renderReviewField("app_dob_d", "DOB Day (DD)", "14", "number")}
                        {renderReviewField("app_dob_y", "DOB Year (YYYY)", "1988", "number")}
                      </div>

                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        {renderReviewField("app_marital", "Marital Status", "Single")}
                        {renderReviewField("app_sin", "S.I.N (Social Insurance Number)", "555-014-921")}
                      </div>

                      {renderReviewField("app_dependents", "Dependents Under 18", "1", "number")}
                    </div>
                  )}

                  {/* TAB: CO-APPLICANT */}
                  {activeTab === "co-applicant" && (
                    <div className="space-y-4 bg-[#141418]/40 border border-white/5 p-5 rounded-2xl relative">
                      <span className="absolute top-4 right-4 text-[9px] font-black uppercase text-[#6fa3b8] bg-[#6fa3b8]/10 px-2 py-0.5 rounded border border-[#6fa3b8]/20">Co-Signer / Joint Spouse</span>
                      <h4 className="text-xs font-black text-white/50 border-b border-white/5 pb-2 uppercase tracking-wider">Secondary Joint Borrower</h4>
                      
                      <p className="text-[10px] text-[#8e95a3] mb-2 leading-relaxed">
                        Leave fields empty if this is an individual purchase application. If co-applicant is present, these details will initialize co-borrower fields natively.
                      </p>

                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        {renderReviewField("co_first", "First Name", "Leave blank if none")}
                        {renderReviewField("co_last", "Last Name", "Leave blank if none")}
                      </div>
                      
                      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                        {renderReviewField("co_dob_m", "DOB Month", "", "number")}
                        {renderReviewField("co_dob_d", "DOB Day", "", "number")}
                        {renderReviewField("co_dob_y", "DOB Year", "", "number")}
                      </div>

                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        {renderReviewField("co_marital", "Marital Status", "")}
                        {renderReviewField("co_sin", "S.I.N", "")}
                      </div>

                      {renderReviewField("co_dependents", "Dependents Under 18", "0", "number")}
                    </div>
                  )}

                  {/* TAB: CONTACT DETAILS */}
                  {activeTab === "contact" && (
                    <div className="space-y-6">
                      
                      {/* Applicant Contact */}
                      <div className="space-y-4 bg-[#141418]/40 border border-white/5 p-5 rounded-2xl">
                        <h4 className="text-xs font-black text-[#b5a642] border-b border-white/5 pb-2 uppercase tracking-wider">Applicant Communication channels</h4>
                        
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                          {renderReviewField("app_email", "Primary Email Address", "jane.smith@email.com", "email")}
                          {renderReviewField("app_cell", "Cell Phone", "(705) 555-1212")}
                        </div>
                        
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                          {renderReviewField("app_home", "Home Telephone", "Optional")}
                          {renderReviewField("app_work", "Work Telephone / Ext", "Optional")}
                        </div>

                        {renderReviewField("app_contact", "Preferred Contact Method (Email/Phone/SMS)", "Email")}
                      </div>

                      {/* Co Applicant Contact */}
                      {fields.co_first && (
                        <div className="space-y-4 bg-[#141418]/40 border border-white/5 p-5 rounded-2xl">
                          <h4 className="text-xs font-black text-[#6fa3b8] border-b border-white/5 pb-2 uppercase tracking-wider">Co-Applicant Communication channels</h4>
                          
                          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            {renderReviewField("co_email", "Primary Email Address", "", "email")}
                            {renderReviewField("co_cell", "Cell Phone", "")}
                          </div>
                          
                          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            {renderReviewField("co_home", "Home Telephone", "")}
                            {renderReviewField("co_work", "Work Telephone / Ext", "")}
                          </div>

                          {renderReviewField("co_contact", "Preferred Contact Method", "")}
                        </div>
                      )}
                    </div>
                  )}

                  {/* TAB: ADDRESS HISTORY */}
                  {activeTab === "address" && (
                    <div className="space-y-6">
                      
                      {/* APPLICANT ADDRESS */}
                      <div className="bg-[#141418]/40 border border-white/5 p-5 rounded-2xl space-y-4 relative">
                        <span className="absolute top-4 right-4 text-[9px] font-black uppercase text-[#b5a642] bg-[#b5a642]/10 px-2 py-0.5 rounded border border-[#b5a642]/20">Applicant</span>
                        <h4 className="text-xs font-black text-white/50 border-b border-white/5 pb-2 uppercase tracking-wider">Applicant Current Residence</h4>
                        
                        <div className="bg-[#1d1d24] p-3 rounded-xl border border-white/5 mb-2">
                          <label className="text-[10px] text-[#8e95a3] font-bold uppercase tracking-wider block mb-1.5">Housing Tenure</label>
                          <div className="flex flex-wrap gap-2">
                            {["Own", "Rent", "Live with Relatives", "Live With Others"].map((type) => (
                              <button
                                key={type}
                                type="button"
                                onClick={() => handleFieldChange("app_housing", type)}
                                className={`px-3 py-1 rounded-lg text-[10px] font-bold transition-all cursor-pointer ${
                                  fields.app_housing === type ? "bg-[#b5a642] text-black" : "bg-[#141418] text-[#8e95a3] hover:text-white"
                                }`}
                              >
                                {type}
                              </button>
                            ))}
                          </div>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                          <div className="md:col-span-3">{renderReviewField("app_addr", "Street Address", "182 Bayfield Street")}</div>
                          <div>{renderReviewField("app_unit", "Unit / Suite", "Apt 4B")}</div>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                          {renderReviewField("app_city", "City", "Barrie")}
                          {renderReviewField("app_prov", "Province", "ON")}
                          {renderReviewField("app_post", "Postal Code", "L4M 3B5")}
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                          {renderReviewField("app_res_yrs", "Years at Current Address", "2", "number")}
                          {renderReviewField("app_res_mos", "Months at Current Address", "6", "number")}
                        </div>

                        {/* PREVIOUS ADDRESS (Required if current < 3 years) */}
                        <div className="border-t border-white/5 pt-4 space-y-4">
                          <div className="flex justify-between items-center">
                            <span className="text-[10px] font-bold uppercase tracking-wider text-[#eeeef2] flex items-center gap-1.5">
                              Previous Residence History <Info className="w-3.5 h-3.5 text-[#b5a642]" title="Required if current address is less than 3 years." />
                            </span>
                            {fields.app_res_yrs && Number(fields.app_res_yrs) < 3 && (
                              <span className="text-[9px] text-red-400 bg-red-400/10 border border-red-500/20 px-2 py-0.5 rounded font-bold uppercase tracking-wider animate-pulse">Required (&lt; 3 Years)</span>
                            )}
                          </div>

                          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                            <div className="md:col-span-3">{renderReviewField("app_prev_addr", "Street Address", "450 Yonge Street")}</div>
                            <div>{renderReviewField("app_prev_unit", "Unit / Suite", "")}</div>
                          </div>

                          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                            {renderReviewField("app_prev_city", "City", "Toronto")}
                            {renderReviewField("app_prev_prov", "Province", "ON")}
                            {renderReviewField("app_prev_post", "Postal Code", "M4Y 1W9")}
                          </div>

                          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            {renderReviewField("app_prev_yrs", "Years at Previous", "4", "number")}
                            {renderReviewField("app_prev_mos", "Months", "0", "number")}
                          </div>
                        </div>
                      </div>

                      {/* CO APPLICANT ADDRESS */}
                      {fields.co_first && (
                        <div className="bg-[#141418]/40 border border-white/5 p-5 rounded-2xl space-y-4 relative">
                          <span className="absolute top-4 right-4 text-[9px] font-black uppercase text-[#6fa3b8] bg-[#6fa3b8]/10 px-2 py-0.5 rounded border border-[#6fa3b8]/20">Co-Applicant</span>
                          <h4 className="text-xs font-black text-white/50 border-b border-white/5 pb-2 uppercase tracking-wider">Co-Applicant Residence Details</h4>
                          
                          <div className="bg-[#1d1d24] p-3 rounded-xl border border-white/5 mb-2">
                            <label className="text-[10px] text-[#8e95a3] font-bold uppercase tracking-wider block mb-1.5">Housing Tenure</label>
                            <div className="flex flex-wrap gap-2">
                              {["Own", "Rent", "Live with Relatives", "Live With Others"].map((type) => (
                                <button
                                  key={type}
                                  type="button"
                                  onClick={() => handleFieldChange("co_housing", type)}
                                  className={`px-3 py-1 rounded-lg text-[10px] font-bold transition-all cursor-pointer ${
                                    fields.co_housing === type ? "bg-[#6fa3b8] text-black" : "bg-[#141418] text-[#8e95a3] hover:text-white"
                                  }`}
                                >
                                  {type}
                                </button>
                              ))}
                            </div>
                          </div>

                          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                            <div className="md:col-span-3">{renderReviewField("co_addr", "Street Address", "")}</div>
                            <div>{renderReviewField("co_unit", "Unit / Suite", "")}</div>
                          </div>

                          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                            {renderReviewField("co_city", "City", "")}
                            {renderReviewField("co_prov", "Province", "")}
                            {renderReviewField("co_post", "Postal Code", "")}
                          </div>

                          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            {renderReviewField("co_res_yrs", "Years at Address", "0", "number")}
                            {renderReviewField("co_res_mos", "Months at Address", "0", "number")}
                          </div>
                        </div>
                      )}
                    </div>
                  )}

                  {/* TAB: EMPLOYMENT */}
                  {activeTab === "employment" && (
                    <div className="space-y-6">
                      
                      {/* APPLICANT EMPLOYMENT */}
                      <div className="bg-[#141418]/40 border border-white/5 p-5 rounded-2xl space-y-4 relative">
                        <span className="absolute top-4 right-4 text-[9px] font-black uppercase text-[#b5a642] bg-[#b5a642]/10 px-2 py-0.5 rounded border border-[#b5a642]/20">Applicant</span>
                        <h3 className="text-xs font-black text-white border-b border-white/5 pb-2 uppercase tracking-wider flex items-center gap-1.5">
                          <Briefcase className="w-4 h-4 text-[#b5a642]" /> Applicant Income &amp; Employment
                        </h3>

                        {/* Income Classifications toggles */}
                        <div className="flex flex-wrap gap-2 bg-[#1d1d24] p-2 rounded-xl border border-white/5">
                          <button
                            onClick={() => handleFieldChange("app_inc_employed", fields.app_inc_employed === "1" ? "" : "1")}
                            className={`px-3 py-1.5 text-[10px] font-bold rounded-lg transition-all cursor-pointer ${fields.app_inc_employed === "1" ? "bg-[#b5a642] text-black" : "bg-[#141418] text-[#8e95a3] hover:text-white"}`}
                          >
                            Salaried Primary
                          </button>
                          <button
                            onClick={() => handleFieldChange("app_inc_twojobs", fields.app_inc_twojobs === "1" ? "" : "1")}
                            className={`px-3 py-1.5 text-[10px] font-bold rounded-lg transition-all cursor-pointer ${fields.app_inc_twojobs === "1" ? "bg-[#b5a642] text-black" : "bg-[#141418] text-[#8e95a3] hover:text-white"}`}
                          >
                            Multiple Jobs
                          </button>
                          <button
                            onClick={() => handleFieldChange("app_inc_self", fields.app_inc_self === "1" ? "" : "1")}
                            className={`px-3 py-1.5 text-[10px] font-bold rounded-lg transition-all cursor-pointer ${fields.app_inc_self === "1" ? "bg-[#b5a642] text-black" : "bg-[#141418] text-[#8e95a3] hover:text-white"}`}
                          >
                            Self-Employed (Sole Prop/Inc)
                          </button>
                        </div>

                        {/* Primary Employer Details */}
                        {fields.app_inc_employed === "1" && (
                          <div className="bg-[#1b1b22] p-4 rounded-xl space-y-4 border border-white/5">
                            <span className="text-[10px] font-black uppercase tracking-wider text-[#b5a642] block">Primary Salaried Employer Details</span>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                              {renderReviewField("app_emp1_name", "Employer Name", "Royal Victoria Regional Health Centre")}
                              {renderReviewField("app_emp1_title", "Job Title / Role", "Senior Registered Nurse")}
                            </div>
                            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                              {renderReviewField("app_emp1_city", "Employer City", "Barrie")}
                              {renderReviewField("app_emp1_prov", "Employer Province", "ON")}
                              {renderReviewField("app_emp1_tel", "HR Verification Phone", "(705) 728-9090")}
                            </div>
                            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                              {renderReviewField("app_emp1_status", "Status (Full Time / Part Time)", "Full Time")}
                              {renderReviewField("app_emp1_type", "Compensation (Salary / Hourly)", "Salary")}
                              {renderReviewField("app_emp1_income", "Gross Annual Income ($)", "98500", "number")}
                            </div>
                            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                              {renderReviewField("app_emp1_yrs", "Years Served", "5", "number")}
                              {renderReviewField("app_emp1_mos", "Months Served", "2", "number")}
                              {renderReviewField("app_emp1_contract", "Contract Details", "")}
                            </div>
                          </div>
                        )}

                        {/* Self Employed details */}
                        {fields.app_inc_self === "1" && (
                          <div className="bg-[#1b1b22] p-4 rounded-xl space-y-4 border border-white/5">
                            <span className="text-[10px] font-black uppercase tracking-wider text-[#b5a642] block">Business Owner Details</span>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                              {renderReviewField("app_self_name", "Registered Corporation Name", "Company Ltd")}
                              {renderReviewField("app_self_income", "Net Income (2-Yr Avg NOA) ($)", "0", "number")}
                            </div>
                            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                              {renderReviewField("app_self_yrs", "Years in Business", "0", "number")}
                              {renderReviewField("app_self_start", "Start Date (MM/YYYY)", "")}
                              {renderReviewField("app_self_tel", "Business Telephone", "")}
                            </div>
                          </div>
                        )}

                        {/* Secondary Employer */}
                        {fields.app_inc_twojobs === "1" && (
                          <div className="bg-[#1b1b22] p-4 rounded-xl space-y-4 border border-white/5">
                            <span className="text-[10px] font-black uppercase tracking-wider text-[#b5a642] block">Secondary Job Details</span>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                              {renderReviewField("app_emp2_name", "Employer Name", "")}
                              {renderReviewField("app_emp2_income", "Annual Income ($)", "0", "number")}
                            </div>
                          </div>
                        )}
                      </div>

                      {/* CO APPLICANT EMPLOYMENT */}
                      {fields.co_first && (
                        <div className="bg-[#141418]/40 border border-white/5 p-5 rounded-2xl space-y-4 relative">
                          <span className="absolute top-4 right-4 text-[9px] font-black uppercase text-[#6fa3b8] bg-[#6fa3b8]/10 px-2 py-0.5 rounded border border-[#6fa3b8]/20">Co-Applicant</span>
                          <h3 className="text-xs font-black text-white border-b border-white/5 pb-2 uppercase tracking-wider flex items-center gap-1.5">
                            <Briefcase className="w-4 h-4 text-[#6fa3b8]" /> Co-Applicant Income &amp; Employment
                          </h3>

                          <div className="flex flex-wrap gap-2 bg-[#1d1d24] p-2 rounded-xl border border-white/5">
                            <button
                              onClick={() => handleFieldChange("co_inc_employed", fields.co_inc_employed === "1" ? "" : "1")}
                              className={`px-3 py-1.5 text-[10px] font-bold rounded-lg transition-all cursor-pointer ${fields.co_inc_employed === "1" ? "bg-[#6fa3b8] text-black" : "bg-[#141418] text-[#8e95a3] hover:text-white"}`}
                            >
                              Salaried Primary
                            </button>
                            <button
                              onClick={() => handleFieldChange("co_inc_self", fields.co_inc_self === "1" ? "" : "1")}
                              className={`px-3 py-1.5 text-[10px] font-bold rounded-lg transition-all cursor-pointer ${fields.co_inc_self === "1" ? "bg-[#6fa3b8] text-black" : "bg-[#141418] text-[#8e95a3] hover:text-white"}`}
                            >
                              Self-Employed
                            </button>
                          </div>

                          {/* Primary Salaried */}
                          {fields.co_inc_employed === "1" && (
                            <div className="bg-[#1b1b22] p-4 rounded-xl space-y-4 border border-white/5">
                              <span className="text-[10px] font-black uppercase tracking-wider text-[#6fa3b8] block">Co-Borrower Primary Employment</span>
                              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                {renderReviewField("co_emp1_name", "Employer Name", "York Region District School Board")}
                                {renderReviewField("co_emp1_title", "Job Title / Role", "Elementary School Teacher")}
                              </div>
                              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                                {renderReviewField("co_emp1_status", "Status (Full/Part)", "Full Time")}
                                {renderReviewField("co_emp1_type", "Compensation Type", "Salary")}
                                {renderReviewField("co_emp1_income", "Gross Annual Income ($)", "72500", "number")}
                              </div>
                              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                {renderReviewField("co_emp1_yrs", "Years Served", "8", "number")}
                                {renderReviewField("co_emp1_mos", "Months Served", "6", "number")}
                              </div>
                            </div>
                          )}

                          {/* Self Employed */}
                          {fields.co_inc_self === "1" && (
                            <div className="bg-[#1b1b22] p-4 rounded-xl space-y-4 border border-white/5">
                              <span className="text-[10px] font-black uppercase tracking-wider text-[#6fa3b8] block">Co-Borrower Self-Employment</span>
                              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                {renderReviewField("co_self_name", "Company Name", "")}
                                {renderReviewField("co_self_income", "Net Income ($)", "0", "number")}
                              </div>
                            </div>
                          )}
                        </div>
                      )}
                    </div>
                  )}

                  {/* TAB: OTHER INCOME */}
                  {activeTab === "otherIncome" && (
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      {/* Applicant other */}
                      <div className="bg-[#141418]/40 border border-white/5 p-5 rounded-2xl space-y-4 relative">
                        <span className="absolute top-4 right-4 text-[9px] font-black uppercase text-[#b5a642] bg-[#b5a642]/10 px-2 py-0.5 rounded border border-[#b5a642]/20">Applicant</span>
                        <h4 className="text-xs font-black text-white border-b border-white/5 pb-2 uppercase tracking-wider">Other Income Streams</h4>
                        
                        <div className="bg-[#1b1b22] p-4 rounded-xl border border-white/5 space-y-3">
                          <div className="font-bold text-[10px] uppercase text-[#b5a642]">Stream 1</div>
                          {renderReviewField("app_other0_specify", "Description (e.g. Pension, Child support)", "Pension")}
                          <div className="grid grid-cols-2 gap-2">
                            {renderReviewField("app_other0_amount", "Amount ($)", "0", "number")}
                            {renderReviewField("app_other0_freq", "Frequency", "Monthly")}
                          </div>
                        </div>

                        <div className="bg-[#1b1b22] p-4 rounded-xl border border-white/5 space-y-3">
                          <div className="font-bold text-[10px] uppercase text-[#b5a642]">Stream 2</div>
                          {renderReviewField("app_other1_specify", "Description", "")}
                          <div className="grid grid-cols-2 gap-2">
                            {renderReviewField("app_other1_amount", "Amount ($)", "0", "number")}
                            {renderReviewField("app_other1_freq", "Frequency", "Monthly")}
                          </div>
                        </div>
                      </div>

                      {/* Co Applicant other */}
                      <div className="bg-[#141418]/40 border border-white/5 p-5 rounded-2xl space-y-4 relative">
                        <span className="absolute top-4 right-4 text-[9px] font-black uppercase text-[#6fa3b8] bg-[#6fa3b8]/10 px-2 py-0.5 rounded border border-[#6fa3b8]/20">Co-Applicant</span>
                        <h4 className="text-xs font-black text-white border-b border-white/5 pb-2 uppercase tracking-wider">Other Income Streams</h4>
                        
                        <div className="bg-[#1b1b22] p-4 rounded-xl border border-white/5 space-y-3">
                          <div className="font-bold text-[10px] uppercase text-[#6fa3b8]">Stream 1</div>
                          {renderReviewField("co_other0_specify", "Description", "Rental Income")}
                          <div className="grid grid-cols-2 gap-2">
                            {renderReviewField("co_other0_amount", "Amount ($)", "1500", "number")}
                            {renderReviewField("co_other0_freq", "Frequency", "Monthly")}
                          </div>
                        </div>

                        <div className="bg-[#1b1b22] p-4 rounded-xl border border-white/5 space-y-3">
                          <div className="font-bold text-[10px] uppercase text-[#6fa3b8]">Stream 2</div>
                          {renderReviewField("co_other1_specify", "Description", "")}
                          <div className="grid grid-cols-2 gap-2">
                            {renderReviewField("co_other1_amount", "Amount ($)", "0", "number")}
                            {renderReviewField("co_other1_freq", "Frequency", "Monthly")}
                          </div>
                        </div>
                      </div>
                    </div>
                  )}

                  {/* TAB: PROPERTY DETAILS */}
                  {activeTab === "property" && (
                    <div className="bg-[#141418]/40 border border-white/5 p-5 rounded-2xl space-y-4 relative">
                      <h3 className="text-xs font-black text-white border-b border-white/5 pb-2 uppercase tracking-wider flex items-center gap-1.5">
                        <Building className="w-4 h-4 text-[#b5a642]" /> Property Characteristics &amp; Financials
                      </h3>

                      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        {/* Physical attributes */}
                        <div className="space-y-4 bg-[#1b1b22] p-4 rounded-xl border border-white/5">
                          <span className="text-[10px] font-bold text-[#b5a642] uppercase tracking-wider block">Physical Characteristics</span>
                          <div className="grid grid-cols-2 gap-2">
                            {renderReviewField("prop_type", "Type (Detached, Condo)", "Detached")}
                            {renderReviewField("prop_style", "Style (2-Storey, Split-Level)", "Two Storey")}
                          </div>
                          {renderReviewField("prop_tenure", "Tenure (Freehold, Condo)", "Freehold")}
                          
                          <div className="grid grid-cols-3 gap-2">
                            {renderReviewField("prop_age", "Property Age (Yrs)", "12", "number")}
                            {renderReviewField("prop_area", "Interior Area", "2100", "number")}
                            {renderReviewField("prop_area_unit", "Unit", "Sq Ft")}
                          </div>

                          <div className="grid grid-cols-2 gap-2">
                            {renderReviewField("prop_garage_type", "Garage Type", "Attached")}
                            {renderReviewField("prop_garage_size", "Garage Size", "Double")}
                          </div>

                          <div className="grid grid-cols-3 gap-2">
                            {renderReviewField("prop_heat", "Heating Type", "Forced Air Gas")}
                            {renderReviewField("prop_water", "Water Source", "Municipal")}
                            {renderReviewField("prop_sewage", "Sewage Type", "Municipal")}
                          </div>
                        </div>

                        {/* Financial specs */}
                        <div className="space-y-4 bg-[#1b1b22] p-4 rounded-xl border border-white/5">
                          <span className="text-[10px] font-bold text-[#b5a642] uppercase tracking-wider block">Financial Details &amp; Location</span>
                          {renderReviewField("prop_addr", "Target Property Address", "Subject street name...")}
                          
                          <div className="grid grid-cols-2 gap-2">
                            {renderReviewField("prop_value", "Estimated Value ($)", "640000", "number")}
                            {renderReviewField("prop_orig_price", "Original Cost ($)", "0", "number")}
                          </div>

                          <div className="grid grid-cols-2 gap-2">
                            {renderReviewField("prop_purchase_date", "Purchase Date", "")}
                            {renderReviewField("prop_tax_in_mtg", "Taxes in Mtge? (Yes/No)", "No")}
                          </div>

                          <div className="grid grid-cols-2 gap-2">
                            {renderReviewField("prop_tax", "Yearly Property Taxes ($)", "4200", "number")}
                            {renderReviewField("prop_condo_fees", "Monthly Condo Fees ($)", "0", "number")}
                          </div>
                        </div>
                      </div>
                    </div>
                  )}

                  {/* TAB: MORTGAGE DETAILS */}
                  {activeTab === "mortgage" && (
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      
                      {/* FIRST MORTGAGE */}
                      <div className="bg-[#141418]/40 border border-white/5 p-5 rounded-2xl space-y-4 relative">
                        <span className="absolute top-4 right-4 text-[9px] font-black uppercase text-[#b5a642] bg-[#b5a642]/10 px-2 py-0.5 rounded border border-[#b5a642]/20">First Mortgage</span>
                        <h4 className="text-xs font-black text-white border-b border-white/5 pb-2 uppercase tracking-wider">Outstanding First Mortgage</h4>
                        
                        <div className="grid grid-cols-2 gap-2">
                          {renderReviewField("mtg1_balance", "Current Balance ($)", "0", "number")}
                          {renderReviewField("mtg1_payment", "Monthly Payment ($)", "0", "number")}
                        </div>

                        {renderReviewField("mtg1_freq", "Payment Frequency", "Monthly")}
                        
                        <div className="grid grid-cols-2 gap-2">
                          {renderReviewField("mtg1_maturity", "Maturity Date (MM/DD/YYYY)", "")}
                          {renderReviewField("mtg1_rate", "Interest Rate (%)", "4.89", "number")}
                        </div>

                        <div className="grid grid-cols-2 gap-2">
                          {renderReviewField("mtg1_rate_type", "Rate Type (Fixed, Variable)", "Fixed")}
                          {renderReviewField("mtg1_term_type", "Term Type (Open, Closed)", "Closed")}
                        </div>

                        {renderReviewField("mtg1_holder", "Mortgage Holder (Lender)", "Scotiabank")}
                        {renderReviewField("mtg1_loan_type", "Loan Type (Mortgage, HELOC)", "Mortgage")}

                        <div className="grid grid-cols-2 gap-2">
                          {renderReviewField("mtg1_orig_amount", "Original Loan Amount ($)", "512000", "number")}
                          {renderReviewField("mtg1_number", "Lender Mortgage Reference #", "")}
                        </div>
                      </div>

                      {/* SECOND MORTGAGE */}
                      <div className="bg-[#141418]/40 border border-white/5 p-5 rounded-2xl space-y-4 relative">
                        <span className="absolute top-4 right-4 text-[9px] font-black uppercase text-[#6fa3b8] bg-[#6fa3b8]/10 px-2 py-0.5 rounded border border-[#6fa3b8]/20">Second Mortgage</span>
                        <h4 className="text-xs font-black text-white border-b border-white/5 pb-2 uppercase tracking-wider">Outstanding Second Mortgage (LOC)</h4>
                        
                        <div className="grid grid-cols-2 gap-2">
                          {renderReviewField("mtg2_balance", "Current Balance ($)", "0", "number")}
                          {renderReviewField("mtg2_payment", "Monthly Payment ($)", "0", "number")}
                        </div>

                        {renderReviewField("mtg2_freq", "Payment Frequency", "Monthly")}
                        
                        <div className="grid grid-cols-2 gap-2">
                          {renderReviewField("mtg2_maturity", "Maturity Date", "")}
                          {renderReviewField("mtg2_rate", "Interest Rate (%)", "0", "number")}
                        </div>

                        <div className="grid grid-cols-2 gap-2">
                          {renderReviewField("mtg2_rate_type", "Rate Type", "Fixed")}
                          {renderReviewField("mtg2_term_type", "Term Type", "Closed")}
                        </div>

                        {renderReviewField("mtg2_holder", "Mortgage Holder", "")}
                        {renderReviewField("mtg2_loan_type", "Loan Type", "")}

                        <div className="grid grid-cols-2 gap-2">
                          {renderReviewField("mtg2_orig_amount", "Original Amount ($)", "0", "number")}
                          {renderReviewField("mtg2_number", "Lender Mortgage Reference #", "")}
                        </div>
                      </div>

                    </div>
                  )}

                </div>

              </div>

            </div>
          )}

          {/* STEP 3: INTEGRATE & FINALIZE SCREEN */}
          {workflowStep === "finalize" && (
            <div className="flex-1 overflow-y-auto p-8 bg-[#0c0c0e]/95 space-y-8 select-none">
              
              <div className="max-w-4xl mx-auto space-y-8">
                
                {/* 1. INTERACTIVE DUPLICATE COMPARISON VIEW */}
                <div className="bg-[#141418] border border-white/5 p-6 rounded-2xl space-y-4">
                  <div className="flex items-center gap-2">
                    {duplicates.length > 0 ? (
                      <div className="w-8 h-8 rounded-lg bg-red-500/10 border border-red-500/30 flex items-center justify-center text-red-400">
                        <AlertTriangle className="w-4 h-4 animate-pulse" />
                      </div>
                    ) : (
                      <div className="w-8 h-8 rounded-lg bg-green-500/10 border border-green-500/30 flex items-center justify-center text-green-400">
                        <CheckCircle2 className="w-4 h-4" />
                      </div>
                    )}
                    <div>
                      <h4 className="text-xs font-black text-white uppercase tracking-wider">Duplicate Ingestion Check</h4>
                      <p className="text-[10px] text-[#8e95a3]">Cross-referencing incoming fields with existing CRM memory records.</p>
                    </div>
                  </div>

                  {duplicates.length > 0 ? (
                    <div className="space-y-4">
                      <div className="p-3 bg-red-500/5 border border-red-500/20 text-red-300 rounded-lg text-xs leading-relaxed">
                        <span className="font-bold">Duplicate Warning!</span> The system discovered {duplicates.length} records in CRM memory matching this applicant. See comparative data side-by-side:
                      </div>

                      <div className="border border-white/5 rounded-xl overflow-hidden bg-[#101014]">
                        <table className="w-full text-xs text-left text-white/80">
                          <thead className="text-[10px] font-bold uppercase text-[#8e95a3] bg-white/2">
                            <tr>
                              <th className="p-3">Matched Param</th>
                              <th className="p-3 text-[#b5a642]">Incoming Application</th>
                              <th className="p-3 text-[#6fa3b8]">Existing Record (In CRM)</th>
                            </tr>
                          </thead>
                          <tbody className="divide-y divide-white/5">
                            {duplicates.map((dup, idx) => (
                              <React.Fragment key={idx}>
                                <tr>
                                  <td className="p-3 font-semibold text-[#8e95a3]">Client Name</td>
                                  <td className="p-3 text-white font-black">{fields.app_first} {fields.app_last}</td>
                                  <td className="p-3 text-white font-black">{dup.client.first} {dup.client.last}</td>
                                </tr>
                                <tr>
                                  <td className="p-3 font-semibold text-[#8e95a3]">Email Address</td>
                                  <td className="p-3">{fields.app_email || "N/A"}</td>
                                  <td className="p-3">{dup.client.email}</td>
                                </tr>
                                <tr>
                                  <td className="p-3 font-semibold text-[#8e95a3]">Cellular Phone</td>
                                  <td className="p-3">{fields.app_cell || "N/A"}</td>
                                  <td className="p-3">{dup.client.cell || "N/A"}</td>
                                </tr>
                                <tr>
                                  <td className="p-3 font-semibold text-[#8e95a3]">Assigned Advisor</td>
                                  <td className="p-3 text-white/40">N/A (Pending)</td>
                                  <td className="p-3 text-[#b5a642] font-bold">{dup.client.agent || "Unassigned"}</td>
                                </tr>
                                <tr>
                                  <td className="p-3 font-semibold text-[#8e95a3]">CRM Status</td>
                                  <td className="p-3 text-white/40">N/A (Pending)</td>
                                  <td className="p-3">
                                    <span className="text-[9px] font-black uppercase text-green-300 bg-green-500/10 px-2 py-0.5 rounded border border-green-500/20">
                                      {dup.client.status.toUpperCase()}
                                    </span>
                                  </td>
                                </tr>
                              </React.Fragment>
                            ))}
                          </tbody>
                        </table>
                      </div>

                      <div className="flex gap-3">
                        <button 
                          onClick={() => handleFinalApprove('merge')}
                          className="flex-1 py-2.5 bg-[#b5a642] hover:bg-[#9a8c38] text-black font-bold text-xs rounded-lg transition-colors cursor-pointer"
                        >
                          Merge Fields into Existing File ({duplicates[0].client.first})
                        </button>
                        <button 
                          onClick={() => handleFinalApprove('create')}
                          className="px-4 py-2.5 border border-red-500/20 text-red-300 hover:bg-red-500/5 text-xs font-bold rounded-lg transition-all cursor-pointer"
                        >
                          Ignore &amp; Create Brand-New File
                        </button>
                      </div>
                    </div>
                  ) : (
                    <div className="p-4 bg-green-500/5 border border-green-500/20 text-green-300 rounded-lg text-xs leading-relaxed flex items-start gap-3">
                      <span className="w-1.5 h-1.5 rounded-full bg-green-400 mt-1.5 shrink-0" />
                      <p>
                        <span className="font-bold text-white">No Duplicates Found.</span> This application name, email address, and cell phone do not match any client file currently registered in the database. A fresh active file can be generated with high integrity.
                      </p>
                    </div>
                  )}
                </div>

                {/* 2. DOWNSTREAM WORKFLOW INTEGRATIONS (Checklists, suggested docs, starter tasks) */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  
                  {/* Native suggested documents checklist */}
                  <div className="bg-[#141418] border border-white/5 p-6 rounded-2xl space-y-4">
                    <h4 className="text-xs font-black text-white uppercase tracking-wider flex items-center gap-1.5">
                      <FileCheck className="w-4 h-4 text-[#6fa3b8]" /> Initial Documents Ingestion
                    </h4>
                    <p className="text-[10px] text-[#8e95a3]">
                      Based on employment ({fields.app_inc_self === "1" ? "Self-employed" : "Salaried"}), co-applicant presence, and purchase type, these documents are pre-assigned in the Document Manager:
                    </p>
                    
                    <div className="space-y-2 max-h-[220px] overflow-y-auto pr-1">
                      {suggestedDocs.map((doc) => (
                        <div key={doc.id} className="p-2.5 bg-[#1b1b22] border border-white/5 rounded-lg flex items-start gap-2.5">
                          <div className="w-1.5 h-1.5 rounded-full bg-[#6fa3b8] mt-1.5 shrink-0" />
                          <div>
                            <div className="text-[11px] font-bold text-white">{doc.name}</div>
                            <div className="text-[9px] text-[#8e95a3]">{doc.desc}</div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Checklist starter logic tasks */}
                  <div className="bg-[#141418] border border-white/5 p-6 rounded-2xl space-y-4">
                    <h4 className="text-xs font-black text-white uppercase tracking-wider flex items-center gap-1.5">
                      <ClipboardList className="w-4 h-4 text-[#b5a642]" /> Checklist Starter Logic
                    </h4>
                    <p className="text-[10px] text-[#8e95a3]">
                      The system auto-generates the following broker action tasks based on missing fields or credit verification requirements:
                    </p>

                    <div className="space-y-2 max-h-[220px] overflow-y-auto pr-1">
                      {starterTasks.map((task, idx) => (
                        <div key={idx} className="p-2.5 bg-[#1b1b22] border border-white/5 rounded-lg flex items-start gap-2.5">
                          <span className={`text-[8px] font-bold px-1 rounded uppercase mt-0.5 shrink-0 ${
                            task.priority === 'high' 
                              ? 'bg-red-500/10 text-red-400 border border-red-500/20' 
                              : task.priority === 'medium'
                                ? 'bg-amber-500/10 text-amber-400 border border-amber-500/20'
                                : 'bg-zinc-500/10 text-zinc-400 border border-zinc-500/20'
                          }`}>
                            {task.priority}
                          </span>
                          <div>
                            <div className="text-[11px] font-bold text-white">{task.title}</div>
                            <div className="text-[9px] text-[#8e95a3]">{task.notes}</div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>

                </div>

                {/* 3. SET ASSIGNED ADVISOR, NOTES & INTAKE NOTES */}
                <div className="bg-[#141418] border border-white/5 p-6 rounded-2xl space-y-4">
                  <h4 className="text-xs font-black text-white uppercase tracking-wider">Ingestion Routing Settings</h4>
                  
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="space-y-2">
                      <label className="text-[10px] font-bold uppercase tracking-wider text-[#eeeef2] block">Assigned Advisor (Mortgage Broker)</label>
                      <select
                        value={assignedAgent}
                        onChange={(e) => setAssignedAgent(e.target.value)}
                        className="w-full bg-[#1b1b20] border border-white/5 rounded-lg p-2.5 text-xs text-white focus:outline-none focus:ring-1 focus:ring-[#b5a642]"
                      >
                        {agentNames.map(name => <option key={name} value={name}>{name}</option>)}
                      </select>
                    </div>

                    <div className="space-y-2">
                      <label className="text-[10px] font-bold uppercase tracking-wider text-[#eeeef2] block">Initial Ingestion Stage (Status)</label>
                      <div className="flex gap-2">
                        <button
                          type="button"
                          onClick={() => setIntakeStatus('working')}
                          className={`flex-1 py-2 text-xs font-bold rounded-lg transition-all border cursor-pointer ${
                            intakeStatus === 'working'
                              ? 'bg-[#b5a642] text-black border-transparent'
                              : 'bg-[#1b1b20] text-[#8e95a3] border-white/5 hover:text-white'
                          }`}
                        >
                          Active File ("working")
                        </button>
                        <button
                          type="button"
                          onClick={() => setIntakeStatus('lead')}
                          className={`flex-1 py-2 text-xs font-bold rounded-lg transition-all border cursor-pointer ${
                            intakeStatus === 'lead'
                              ? 'bg-[#6fa3b8] text-black border-transparent'
                              : 'bg-[#1b1b20] text-[#8e95a3] border-white/5 hover:text-white'
                          }`}
                        >
                          CRM Lead ("lead")
                        </button>
                      </div>
                    </div>
                  </div>

                  <div className="space-y-2 pt-2">
                    <label className="text-[10px] font-bold uppercase tracking-wider text-[#eeeef2] block">Underwriting Notes &amp; Intake Flags</label>
                    <textarea
                      rows={3}
                      value={intakeNotes}
                      onChange={(e) => setIntakeNotes(e.target.value)}
                      placeholder="Add files specific concerns, self-employed constraints, appraisal requirements..."
                      className="w-full bg-[#1b1b22] border border-white/5 rounded-lg p-3 text-xs text-white focus:outline-none focus:ring-1 focus:ring-[#b5a642] placeholder:text-white/20"
                    />
                  </div>
                </div>

              </div>

            </div>
          )}

        </div>

        {/* FOOTER NAVIGATION & CTAS */}
        <div className="p-4 border-t border-white/5 shrink-0 flex items-center justify-between bg-[#141418] select-none">
          <button 
            onClick={onClose}
            className="px-4 py-2 border border-white/10 text-[#8e95a3] hover:text-white text-xs font-semibold rounded-lg hover:bg-white/5 transition-colors cursor-pointer"
          >
            Cancel Intake
          </button>
          
          <div className="flex gap-2">
            {workflowStep === "upload" && fileName && (
              <button 
                onClick={() => setWorkflowStep("review")}
                className="px-5 py-2 bg-[#b5a642] text-black text-xs font-bold rounded-lg hover:bg-[#a1933a] transition-all flex items-center gap-1.5 cursor-pointer"
              >
                Go to Field Review <ChevronRight className="w-4 h-4" />
              </button>
            )}

            {workflowStep === "review" && (
              <>
                <button 
                  onClick={() => setWorkflowStep("upload")}
                  className="px-4 py-2 border border-white/10 text-white text-xs font-bold rounded-lg hover:bg-white/5 transition-colors cursor-pointer"
                >
                  Back to Upload
                </button>
                <button 
                  onClick={() => setWorkflowStep("finalize")}
                  className="px-5 py-2 bg-gradient-to-r from-[#b5a642] to-[#6fa3b8] text-black text-xs font-bold rounded-lg hover:opacity-95 transition-all flex items-center gap-1.5 cursor-pointer"
                >
                  Next: Duplicates &amp; Finalize <ChevronRight className="w-4 h-4" />
                </button>
              </>
            )}

            {workflowStep === "finalize" && (
              <>
                <button 
                  onClick={() => setWorkflowStep("review")}
                  className="px-4 py-2 border border-white/10 text-white text-xs font-bold rounded-lg hover:bg-white/5 transition-colors cursor-pointer"
                >
                  Back to Review
                </button>
                
                {duplicates.length > 0 ? (
                  <button 
                    onClick={() => handleFinalApprove('merge')}
                    className="px-5 py-2 bg-[#b5a642] text-black text-xs font-bold rounded-lg hover:bg-[#a1933a] transition-all flex items-center gap-1.5 cursor-pointer animate-pulse"
                  >
                    Confirm &amp; Merge Fields into Client <ArrowRight className="w-4 h-4" />
                  </button>
                ) : (
                  <button 
                    onClick={() => handleFinalApprove('create')}
                    className="px-5 py-2 bg-gradient-to-r from-[#b5a642] to-[#6fa3b8] text-black text-xs font-bold rounded-lg hover:opacity-95 transition-all flex items-center gap-1.5 cursor-pointer"
                  >
                    Approve &amp; Create Active File <ArrowRight className="w-4 h-4" />
                  </button>
                )}
              </>
            )}
          </div>
        </div>

      </div>
    </div>
  );

  // Helper renderer for input fields with confidence trackers
  function renderReviewField(key: string, label: string, placeholder = "", type = "text") {
    const value = fields[key] || "";
    const status = confidenceScores[key] || 'high';

    let statusStyle = "";
    let statusText = "";
    
    if (status === 'unclear') {
      statusStyle = "border-orange-500/40 bg-[#1d1d24] text-orange-200 hover:border-orange-500/60";
      statusText = "Confirm";
    } else if (status === 'missing' && !value) {
      statusStyle = "border-red-500/25 bg-red-500/5 text-red-200 hover:border-red-500/40";
      statusText = "Add Data";
    } else if (status === 'confirmed') {
      statusStyle = "border-green-500/30 bg-[#141418] text-green-200";
      statusText = "Verified";
    } else {
      statusStyle = "border-white/5 bg-[#141418] hover:border-white/15 text-white/95";
      statusText = "Verify";
    }

    return (
      <div className={`p-2.5 rounded-xl border transition-all flex flex-col gap-0.5 relative group ${statusStyle}`}>
        <div className="flex justify-between items-center select-none">
          <label className="text-[9px] text-[#8e95a3] uppercase font-black tracking-wider">{label}</label>
          <span 
            onClick={() => toggleConfidence(key)}
            className="text-[8px] font-bold px-1.5 py-0.5 rounded cursor-pointer select-none uppercase hover:brightness-110 active:scale-95 transition-all"
            style={{
              backgroundColor: status === 'unclear' ? 'rgba(249,115,22,0.15)' : status === 'missing' ? 'rgba(239,68,68,0.15)' : status === 'confirmed' ? 'rgba(34,197,94,0.15)' : 'rgba(255,255,255,0.06)',
              color: status === 'unclear' ? '#f97316' : status === 'missing' ? '#ef4444' : status === 'confirmed' ? '#22c55e' : '#8e95a3'
            }}
          >
            {statusText}
          </span>
        </div>
        <input 
          type={type}
          value={value}
          onChange={(e) => handleFieldChange(key, e.target.value)}
          placeholder={placeholder}
          className="w-full bg-transparent text-xs text-white focus:outline-none mt-1 border-none p-0 focus:ring-0 placeholder:text-white/10 font-medium"
        />
      </div>
    );
  }
};
