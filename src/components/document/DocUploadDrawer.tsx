import React, { useState, useEffect } from "react";
import { 
  X, UploadCloud, FileDown, Trash2, ShieldAlert, CheckCircle2, AlertTriangle, 
  RefreshCw, CornerDownRight, Calendar, Info, FileText, Check, Lock, ShieldCheck, HelpCircle
} from "lucide-react";
import { Client } from "../../types";
import { EnhancedDocState, DocVersion } from "./types";
import { ISSUE_CHECKBOXES, STATUS_STYLING } from "./constants";

interface DocUploadDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  client: Client | null;
  docId: string;
  docLabel: string;
  docCategory: string;
  docVault: Record<string, any>;
  setDocVault: React.Dispatch<React.SetStateAction<Record<string, any>>>;
  currentUser: any;
  showToast: (msg: string, type?: "success" | "error" | "info", icon?: string) => void;
  logDocActivity: (clientId: string, clientName: string, docId: string, docName: string, action: string, details: string) => void;
}

export const DocUploadDrawer: React.FC<DocUploadDrawerProps> = ({
  isOpen,
  onClose,
  client,
  docId,
  docLabel,
  docCategory,
  docVault,
  setDocVault,
  currentUser,
  showToast,
  logDocActivity
}) => {
  const [dragActive, setDragActive] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(-1); // -1 means no active upload
  const [uploadStepMsg, setUploadStepMsg] = useState("");
  const [fileNameOverride, setFileNameOverride] = useState("");
  const [reviewNote, setReviewNote] = useState("");
  const [expiryDate, setExpiryDate] = useState("");
  const [selectedIssues, setSelectedIssues] = useState<Record<string, boolean>>({});
  const [mockOCRData, setMockOCRData] = useState<any>(null);

  // Load existing doc settings when client or docId shifts
  const savedDoc = client ? docVault[client.id]?.[docId] || {} : {};
  const files: DocVersion[] = savedDoc.files || (savedDoc.name ? [{
    id: "v-initial",
    fileName: savedDoc.name,
    fileSize: savedDoc.size || "1.8 MB",
    uploadedAt: savedDoc.uploadedAt || new Date().toISOString(),
    uploadedBy: "System Legacy",
    path: savedDoc.path || ""
  }] : []);

  useEffect(() => {
    if (client && docId) {
      const currentVaultState = docVault[client.id]?.[docId] || {};
      setReviewNote(currentVaultState.notes || "");
      setExpiryDate(currentVaultState.expiryDate || "");
      setSelectedIssues({});
      setMockOCRData(null);
      setUploadProgress(-1);
    }
  }, [client, docId, docVault]);

  if (!isOpen || !client) return null;

  // Toggle flags and auto-compose note text
  const handleIssueToggle = (id: string, label: string) => {
    const updated = { ...selectedIssues, [id]: !selectedIssues[id] };
    setSelectedIssues(updated);

    const activeIssues = Object.keys(updated)
      .filter(k => updated[k])
      .map(k => ISSUE_CHECKBOXES.find(ic => ic.id === k)?.label || k);

    if (activeIssues.length > 0) {
      setReviewNote(prev => {
        const cleanBase = prev.split("⚠️ UNDERWRITING ISSUES IDENTIFIED:")[0].trim();
        return `${cleanBase}\n\n⚠️ UNDERWRITING ISSUES IDENTIFIED:\n- ${activeIssues.join("\n- ")}`.trim();
      });
    } else {
      setReviewNote(prev => prev.split("⚠️ UNDERWRITING ISSUES IDENTIFIED:")[0].trim());
    }
  };

  // Drag and drop events
  const handleDrag = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === "dragenter" || e.type === "dragover") {
      setDragActive(true);
    } else if (e.type === "dragleave") {
      setDragActive(false);
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);

    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      startSimulatedUpload(e.dataTransfer.files[0].name, e.dataTransfer.files[0].size);
    }
  };

  const handleManualUploadChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      startSimulatedUpload(e.target.files[0].name, e.target.files[0].size);
    }
  };

  // 1-Click Status Toggles from drawer
  const handleDirectStatusSet = (status: any) => {
    const clientDocs = docVault[client.id] || {};
    const existingDoc = clientDocs[docId] || {};

    const updatedDocState = {
      ...existingDoc,
      status,
      notes: reviewNote,
      expiryDate,
      reviewedBy: `${currentUser.first} ${currentUser.last}`,
      reviewedAt: new Date().toISOString(),
      reviewHistory: [
        ...(existingDoc.reviewHistory || []),
        {
          date: new Date().toISOString(),
          user: `${currentUser.first} ${currentUser.last}`,
          status,
          notes: `Set status to ${STATUS_STYLING[status]?.label}. Manual review comment: "${reviewNote || 'None'}"`
        }
      ]
    };

    setDocVault(prev => ({
      ...prev,
      [client.id]: {
        ...clientDocs,
        [docId]: updatedDocState
      }
    }));

    logDocActivity(
      client.id,
      `${client.first} ${client.last}`,
      docId,
      docLabel,
      "reviewed",
      `Underwriter directly set status to ${status.toUpperCase()} and saved review profile`
    );

    showToast(`Status updated to ${STATUS_STYLING[status]?.label}!`, "success", "✓");
    onClose();
  };

  // Simulated Upload with high-fidelity progression
  const startSimulatedUpload = (name: string, sizeBytes: number) => {
    const sizeStr = (sizeBytes / (1024 * 1024)).toFixed(2) + " MB";
    setUploadProgress(0);
    setUploadStepMsg("Establishing GBK Secured SSH Session...");

    const steps = [
      { p: 15, m: "Establishing GBK Secured SSH Session..." },
      { p: 40, m: "Scanning payload for malware & malware signatures..." },
      { p: 70, m: "Watermarking with brokerage digital stamp..." },
      { p: 90, m: "Analyzing Document Structure & Extracting Metadata..." },
      { p: 100, m: "Safe storage verified in vault cluster. Finalizing..." }
    ];

    let currentStepIdx = 0;
    const interval = setInterval(() => {
      if (currentStepIdx < steps.length) {
        setUploadProgress(steps[currentStepIdx].p);
        setUploadStepMsg(steps[currentStepIdx].m);
        currentStepIdx++;
      } else {
        clearInterval(interval);
        setTimeout(() => {
          finalizeUpload(name, sizeStr);
        }, 500);
      }
    }, 450);
  };

  const finalizeUpload = (fName: string, fSize: string) => {
    const finalName = fileNameOverride || fName;
    const clientDocs = docVault[client.id] || {};
    const existingDoc = clientDocs[docId] || {};
    const currentFiles = existingDoc.files || [];

    const newVersion: DocVersion = {
      id: "v-" + Date.now(),
      fileName: finalName,
      fileSize: fSize,
      uploadedAt: new Date().toISOString(),
      uploadedBy: `${currentUser.first} ${currentUser.last}`,
      notes: reviewNote || "Direct secure upload.",
      path: `gbk-secured-vault://${client.id}/${docId}/${finalName}`
    };

    const updatedFiles = [...currentFiles, newVersion];
    const isFirst = updatedFiles.length === 1;

    const updatedDocState = {
      ...existingDoc,
      status: (isFirst ? "received" : existingDoc.status || "received") as any,
      path: newVersion.path,
      expiryDate,
      notes: reviewNote,
      files: updatedFiles,
      reviewedBy: `${currentUser.first} ${currentUser.last}`,
      reviewedAt: new Date().toISOString(),
      reviewHistory: [
        ...(existingDoc.reviewHistory || []),
        {
          date: new Date().toISOString(),
          user: `${currentUser.first} ${currentUser.last}`,
          status: isFirst ? "received" : (existingDoc.status || "received"),
          notes: `Uploaded version ${updatedFiles.length}: ${finalName}`
        }
      ]
    };

    setDocVault(prev => ({
      ...prev,
      [client.id]: {
        ...clientDocs,
        [docId]: updatedDocState
      }
    }));

    logDocActivity(
      client.id,
      `${client.first} ${client.last}`,
      docId,
      docLabel,
      "uploaded",
      `Successfully vaulted new version: ${finalName} (Size: ${fSize}, v${updatedFiles.length})`
    );

    // Simulated OCR extraction
    const ocrMock = {
      docHash: "SHA-256#" + Math.floor(Math.random() * 900000 + 100000),
      detectedFields: docId === "photo_id" ? [
        { field: "Full Name", value: `${client.first} ${client.last}` },
        { field: "Expiry Date", value: "2030-11-20" },
        { field: "Watermark Verified", value: "CRA / ONTARIO DMV" }
      ] : docId === "paystubs" ? [
        { field: "Employee Name", value: `${client.first} ${client.last}` },
        { field: "Year-To-Date Pay", value: "$45,210.00" },
        { field: "Stated Employer", value: "Standard Corporation" }
      ] : [
        { field: "Matches Client Profile", value: "CONFIRMED" },
        { field: "Uploaded By", value: `${currentUser.first} ${currentUser.last}` }
      ]
    };

    setMockOCRData(ocrMock);
    setUploadProgress(-1);
    setFileNameOverride("");
    showToast(`Successfully uploaded ${finalName}!`, "success", "✓");
  };

  // Delete specific version
  const handleDeleteVersion = (versionId: string, verName: string) => {
    if (!window.confirm(`Are you sure you want to delete file version "${verName}"? This leaves previous versions intact but is permanent.`)) return;

    const clientDocs = docVault[client.id] || {};
    const existingDoc = clientDocs[docId] || {};
    const updatedFiles = (existingDoc.files || []).filter((f: any) => f.id !== versionId);

    const updatedDocState = {
      ...existingDoc,
      files: updatedFiles,
      path: updatedFiles.length > 0 ? updatedFiles[updatedFiles.length - 1].path : ""
    };

    setDocVault(prev => ({
      ...prev,
      [client.id]: {
        ...clientDocs,
        [docId]: updatedDocState
      }
    }));

    logDocActivity(
      client.id,
      `${client.first} ${client.last}`,
      docId,
      docLabel,
      "deleted",
      `Removed file version: ${verName}`
    );

    showToast(`Removed version: ${verName}`, "info", "🗑️");
  };

  // Mock upload manual button click
  const handleTriggerUploadSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const fileInput = document.getElementById("hidden-file-input") as HTMLInputElement;
    if (fileInput && fileInput.files && fileInput.files[0]) {
      startSimulatedUpload(fileInput.files[0].name, fileInput.files[0].size);
    } else {
      // Simulate random selection if empty
      startSimulatedUpload(`Secured_Document_${Date.now().toString().slice(-4)}.pdf`, 1950000);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/70 z-50 flex justify-end backdrop-blur-sm select-none animate-fade-in">
      <div className="bg-[#131317] border-l border-white/5 w-full max-w-2xl h-full flex flex-col shadow-2xl relative">
        
        {/* Header */}
        <div className="p-5 border-b border-white/5 bg-[#171720]/50 flex items-center justify-between">
          <div>
            <h3 className="text-xs font-black uppercase text-[#b5a642] tracking-widest flex items-center gap-1.5">
              <Lock className="h-4 w-4" /> SECURED UNDERWRITING VAULT
            </h3>
            <p className="text-[10px] text-white/40 mt-0.5">Underwriting audit, version controls, OCR checks &amp; review notes</p>
          </div>
          <button 
            onClick={onClose}
            className="text-white/40 hover:text-white p-2 rounded-lg bg-white/5 hover:bg-white/10 transition-colors"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        {/* Contents Scroll */}
        <div className="flex-grow overflow-y-auto p-5 space-y-6 text-xs font-semibold">
          
          {/* Section 1: Client and Doc ID Banner */}
          <div className="bg-[#181822] border border-white/5 p-4 rounded-xl flex items-center justify-between">
            <div>
              <span className="text-[8px] text-white/30 uppercase font-black tracking-wider block">Requirement Profile</span>
              <h4 className="text-sm font-black text-white mt-0.5">{docLabel}</h4>
              <p className="text-[10px] text-white/40 mt-1">
                Client Folder: <strong className="text-white/70">{client.first} {client.last}</strong> | Category: <strong className="text-[#b5a642]">{docCategory}</strong>
              </p>
            </div>
            <span className={`px-2.5 py-1 text-[9px] font-black uppercase rounded-full border ${STATUS_STYLING[savedDoc.status || 'required']?.color} ${STATUS_STYLING[savedDoc.status || 'required']?.border} ${STATUS_STYLING[savedDoc.status || 'required']?.text}`}>
              {STATUS_STYLING[savedDoc.status || 'required']?.label}
            </span>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-12 gap-5">
            
            {/* LEFT COLUMN: Upload controls and OCR previews (7 cols) */}
            <div className="lg:col-span-7 space-y-5">
              
              {/* DRAG AND DROP FILE ZONE */}
              <div 
                onDragEnter={handleDrag}
                onDragOver={handleDrag}
                onDragLeave={handleDrag}
                onDrop={handleDrop}
                className={`border-2 border-dashed rounded-xl p-6 flex flex-col items-center justify-center text-center transition-all cursor-pointer relative overflow-hidden ${
                  dragActive 
                    ? "border-[#b5a642] bg-[#b5a642]/5 scale-[0.99]" 
                    : "border-white/5 bg-[#171720]/30 hover:bg-[#171720]/60 hover:border-white/15"
                }`}
              >
                {uploadProgress >= 0 ? (
                  /* SIMULATED UPLOADING DIALOG */
                  <div className="w-full space-y-4 py-4 px-2">
                    <RefreshCw className="h-8 w-8 text-[#b5a642] animate-spin mx-auto" />
                    <div className="space-y-1.5">
                      <div className="flex justify-between text-[10px] font-mono text-white/40">
                        <span>{uploadStepMsg}</span>
                        <span>{uploadProgress}%</span>
                      </div>
                      <div className="w-full bg-white/5 h-2 rounded-full overflow-hidden border border-white/5">
                        <div className="bg-[#b5a642] h-full rounded-full transition-all duration-300" style={{ width: `${uploadProgress}%` }} />
                      </div>
                    </div>
                  </div>
                ) : (
                  /* IDLE DROP ZONE */
                  <label className="w-full h-full flex flex-col items-center justify-center cursor-pointer">
                    <UploadCloud className="h-10 w-10 text-white/20 mb-3 group-hover:scale-110 transition-transform" />
                    <span className="text-xs font-black text-white/80 uppercase">Drag &amp; Drop PDF File Here</span>
                    <span className="text-[10px] text-white/30 block mt-1">Or click to select from local storage</span>
                    <input 
                      type="file" 
                      id="hidden-file-input" 
                      accept=".pdf,.png,.jpg,.jpeg,.doc,.docx"
                      onChange={handleManualUploadChange}
                      className="hidden" 
                    />
                  </label>
                )}
              </div>

              {/* MOCK NAME OVERRIDE */}
              <div className="bg-[#171720]/40 border border-white/5 p-3 rounded-xl space-y-2">
                <label className="text-[9px] uppercase text-white/40 font-black block">Custom File Name Override (Optional)</label>
                <div className="flex gap-2">
                  <input 
                    type="text" 
                    placeholder="e.g. Verified_Notice_of_Assessment.pdf"
                    value={fileNameOverride}
                    onChange={(e) => setFileNameOverride(e.target.value)}
                    className="flex-grow bg-[#111114] border border-white/5 text-[11px] rounded-lg p-2 text-white focus:outline-none focus:border-[#b5a642] font-semibold"
                  />
                  <button 
                    onClick={handleTriggerUploadSubmit}
                    disabled={uploadProgress >= 0}
                    className="bg-[#b5a642]/10 border border-[#b5a642]/20 hover:bg-[#b5a642]/25 text-[#b5a642] uppercase text-[9px] font-black tracking-wider px-3 py-2 rounded-lg transition-colors"
                  >
                    Quick Upload
                  </button>
                </div>
              </div>

              {/* OCR ANALYSIS INSIGHTS PANEL */}
              {ocrMockDataReady(mockOCRData, files) && (
                <div className="bg-[#111115] border border-green-500/10 p-4 rounded-xl space-y-2.5 animate-fade-in">
                  <div className="flex items-center gap-1.5 text-green-400">
                    <ShieldCheck className="h-4.5 w-4.5" />
                    <span className="text-[10px] uppercase font-black tracking-wider">GBK Secure AI-OCR Check Result</span>
                  </div>
                  <div className="space-y-1.5 border-t border-white/5 pt-2 text-[10px] font-mono text-white/60">
                    <div className="flex justify-between">
                      <span className="text-white/30">Document Identifier:</span>
                      <span className="font-bold text-white/80">{mockOCRData?.docHash || "SHA-256#849302"}</span>
                    </div>
                    {(mockOCRData?.detectedFields || [
                      { field: "Verification Status", value: "Valid Document Hashed & Encrypted" },
                      { field: "Client Matching", value: "98.4% Match Confirmed" }
                    ]).map((f: any, idx: number) => (
                      <div key={idx} className="flex justify-between">
                        <span className="text-white/30">{f.field}:</span>
                        <span className="font-bold text-green-400/90">{f.value}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* FILE VERSIONS TRACKER */}
              <div className="space-y-3">
                <span className="text-[10px] text-white/30 uppercase font-black tracking-widest block">SECURED FILE VERSIONS ({files.length})</span>
                {files.length === 0 ? (
                  <div className="bg-white/1 border border-dashed border-white/5 p-6 rounded-xl text-center text-white/30 italic">
                    <FileText className="h-6 w-6 mx-auto mb-2 opacity-10" />
                    No files vaulted for this checklist item yet.
                  </div>
                ) : (
                  <div className="space-y-2 max-h-[300px] overflow-y-auto pr-1">
                    {files.map((ver, idx) => (
                      <div key={ver.id} className="bg-[#171720]/80 border border-white/5 p-3 rounded-xl flex items-start justify-between gap-3 hover:bg-[#171720] transition-colors relative">
                        <span className="absolute right-3 bottom-3 px-1.5 py-0.5 bg-white/5 border border-white/5 rounded text-[8px] text-white/40 font-bold uppercase font-mono">
                          v{idx + 1} {idx === files.length - 1 ? 'Active' : 'Superseded'}
                        </span>
                        <div className="min-w-0 space-y-1">
                          <h6 className="text-[11px] font-black text-white/90 truncate pr-16">{ver.fileName}</h6>
                          <div className="flex gap-x-3 gap-y-0.5 text-[9px] text-white/40 font-mono">
                            <span className="text-[#6fa3b8]">{ver.fileSize}</span>
                            <span>{new Date(ver.uploadedAt).toLocaleString("en-CA")}</span>
                          </div>
                          <span className="block text-[8px] text-white/30 font-bold uppercase font-mono">Uploaded By: {ver.uploadedBy}</span>
                          {ver.notes && (
                            <p className="text-[9.5px] italic text-white/50 bg-black/20 p-2 rounded-md border border-white/5 mt-2">
                              "{ver.notes}"
                            </p>
                          )}
                        </div>
                        <div className="flex gap-1.5 z-10">
                          <button 
                            onClick={() => showToast(`Downloading ${ver.fileName} from secure storage node...`, "info", "💾")}
                            className="p-1.5 bg-white/5 hover:bg-white/10 text-white/60 rounded-md"
                            title="Download Version File"
                          >
                            <FileDown className="h-3.5 w-3.5" />
                          </button>
                          <button 
                            onClick={() => handleDeleteVersion(ver.id, ver.fileName)}
                            className="p-1.5 bg-red-500/5 hover:bg-red-500/15 text-red-400/80 rounded-md border border-red-500/10"
                            title="Delete Version File"
                          >
                            <Trash2 className="h-3.5 w-3.5" />
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>

            </div>

            {/* RIGHT COLUMN: Underwriting Decisions, Flags & Expiries (5 cols) */}
            <div className="lg:col-span-5 space-y-5">
              
              {/* STAGE 1: FAST DECISIONS PANEL */}
              <div className="bg-[#171720]/60 border border-[#b5a642]/10 p-4 rounded-xl space-y-3 shadow-md">
                <span className="text-[10px] text-[#b5a642] uppercase font-black tracking-widest block">Fast Underwriting Decisions</span>
                <div className="grid grid-cols-2 gap-2">
                  <button 
                    onClick={() => handleDirectStatusSet("approved")}
                    className="py-2.5 px-3 bg-green-500/10 border border-green-500/20 hover:bg-green-500/20 text-green-400 font-black uppercase text-[9px] tracking-wider rounded-lg transition-colors flex items-center justify-center gap-1.5"
                  >
                    <CheckCircle2 className="h-3.5 w-3.5" /> Approve
                  </button>
                  <button 
                    onClick={() => handleDirectStatusSet("rejected")}
                    className="py-2.5 px-3 bg-red-500/10 border border-red-500/20 hover:bg-red-500/20 text-red-400 font-black uppercase text-[9px] tracking-wider rounded-lg transition-colors flex items-center justify-center gap-1.5"
                  >
                    <X className="h-3.5 w-3.5" /> Reject File
                  </button>
                  <button 
                    onClick={() => handleDirectStatusSet("under_review")}
                    className="py-2.5 px-3 bg-orange-500/10 border border-orange-500/20 hover:bg-orange-500/20 text-orange-400 font-black uppercase text-[9px] tracking-wider rounded-lg transition-colors flex items-center justify-center gap-1.5"
                  >
                    <RefreshCw className="h-3.5 w-3.5" /> Under Review
                  </button>
                  <button 
                    onClick={() => handleDirectStatusSet("follow_up")}
                    className="py-2.5 px-3 bg-indigo-500/10 border border-indigo-500/20 hover:bg-indigo-500/20 text-indigo-400 font-black uppercase text-[9px] tracking-wider rounded-lg transition-colors flex items-center justify-center gap-1.5"
                  >
                    <Info className="h-3.5 w-3.5" /> Follow-Up
                  </button>
                </div>
              </div>

              {/* STAGE 2: ISSUE IDENTIFICATION CHECKBOXES */}
              <div className="bg-[#171720]/40 border border-white/5 p-4 rounded-xl space-y-3">
                <div className="flex items-center gap-1.5 text-orange-400">
                  <ShieldAlert className="h-4.5 w-4.5" />
                  <span className="text-[10px] uppercase font-black tracking-widest">Flag Compliance Defect</span>
                </div>
                <div className="grid grid-cols-1 gap-2 border-t border-white/[0.03] pt-2">
                  {ISSUE_CHECKBOXES.map(issue => (
                    <label 
                      key={issue.id} 
                      className={`flex items-center gap-2 px-2.5 py-1.5 rounded-lg border text-[10.5px] font-semibold cursor-pointer transition-colors ${
                        selectedIssues[issue.id] 
                          ? "bg-red-500/10 border-red-500/20 text-red-400" 
                          : "bg-white/1 border-white/5 text-white/50 hover:bg-white/5"
                      }`}
                    >
                      <input 
                        type="checkbox" 
                        checked={!!selectedIssues[issue.id]} 
                        onChange={() => handleIssueToggle(issue.id, issue.label)}
                        className="rounded border-white/10 bg-black text-[#b5a642] focus:ring-0 cursor-pointer"
                      />
                      {issue.label}
                    </label>
                  ))}
                </div>
              </div>

              {/* STAGE 3: EXPIRY & NOTES */}
              <div className="bg-[#171720]/40 border border-white/5 p-4 rounded-xl space-y-3">
                <span className="text-[10px] text-white/40 uppercase font-black tracking-wider block">Decision Notes &amp; Metadata</span>
                
                <div className="space-y-1">
                  <label className="text-[8px] text-white/30 uppercase font-black block">Lender Expiry Date</label>
                  <input 
                    type="date" 
                    value={expiryDate}
                    onChange={(e) => setExpiryDate(e.target.value)}
                    className="w-full bg-[#111114] border border-white/5 text-xs rounded-lg p-2 text-white focus:outline-none"
                  />
                  <span className="text-[8px] text-white/20 block font-mono">Triggers automatic alerts 30 days prior to expiry</span>
                </div>

                <div className="space-y-1">
                  <label className="text-[8px] text-white/30 uppercase font-black block">Reviewer Notes</label>
                  <textarea 
                    value={reviewNote}
                    onChange={(e) => setReviewNote(e.target.value)}
                    placeholder="Provide detailed explanations or items required from client."
                    className="w-full bg-[#111114] border border-white/5 text-xs rounded-lg p-2.5 text-white placeholder-white/20 h-24 focus:outline-none focus:border-[#b5a642] font-semibold whitespace-pre-line leading-relaxed"
                  />
                </div>

                <button
                  onClick={() => {
                    // Just save comments/dates without closing or changing status
                    const clientDocs = docVault[client.id] || {};
                    const existingDoc = clientDocs[docId] || {};
                    
                    const updatedDocState = {
                      ...existingDoc,
                      notes: reviewNote,
                      expiryDate,
                      reviewedBy: `${currentUser.first} ${currentUser.last}`,
                      reviewedAt: new Date().toISOString()
                    };

                    setDocVault(prev => ({
                      ...prev,
                      [client.id]: {
                        ...clientDocs,
                        [docId]: updatedDocState
                      }
                    }));

                    logDocActivity(
                      client.id,
                      `${client.first} ${client.last}`,
                      docId,
                      docLabel,
                      "reviewed",
                      `Updated review comments: "${reviewNote || 'None'}"`
                    );

                    showToast("Underwriting notes updated", "info", "⚙️");
                  }}
                  className="w-full bg-white/5 border border-white/5 hover:bg-white/10 text-white/70 uppercase text-[9px] font-black tracking-wider py-2 rounded-lg transition-colors"
                >
                  Save Audits Only
                </button>
              </div>

            </div>

          </div>

          {/* HISTORICAL REVIEW AUDIT TIMELINE LOG */}
          {savedDoc.reviewHistory && savedDoc.reviewHistory.length > 0 && (
            <div className="border-t border-white/5 pt-4 space-y-2.5">
              <span className="text-[10px] text-white/30 uppercase font-black tracking-widest block">UNDERWRITING STATUS REVISION HISTORY</span>
              <div className="space-y-2 font-mono text-[9px] max-h-[150px] overflow-y-auto pr-1">
                {savedDoc.reviewHistory.map((rev: any, rIdx: number) => (
                  <div key={rIdx} className="bg-black/20 border border-white/5 rounded-lg p-2.5 flex items-start gap-2">
                    <span className="text-[#b5a642] mt-0.5 font-bold">[{new Date(rev.date).toLocaleDateString()}]</span>
                    <div className="min-w-0">
                      <strong className="text-white/80">{rev.user}</strong>: 
                      <span className="text-white/40 block font-sans text-[10px] font-semibold mt-0.5 leading-relaxed">{rev.notes}</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

        </div>
      </div>
    </div>
  );
};

const ocrMockDataReady = (mockOCRData: any, files: DocVersion[]) => {
  return mockOCRData || (files && files.length > 0);
};
