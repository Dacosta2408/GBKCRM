import React, { useState } from "react";
import { Shield, Trash2, FileDown, Lock, Check, FileText } from "lucide-react";

interface ComplianceFile {
  id: string;
  name: string;
  type: string;
  date: string;
}

interface DocPersonalLockerProps {
  personalFiles: ComplianceFile[];
  onUploadPersonalFile: (type: string, fileInput: HTMLInputElement | null) => void;
  onDeletePersonalFile: (id: string, name: string) => void;
  showToast: (msg: string, type?: "success" | "error" | "info", icon?: string) => void;
}

export const DocPersonalLocker: React.FC<DocPersonalLockerProps> = ({
  personalFiles,
  onUploadPersonalFile,
  onDeletePersonalFile,
  showToast
}) => {
  const [docType, setDocType] = useState("FSRA Broker License");

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const fileInput = document.getElementById("personal-doc-file-input") as HTMLInputElement;
    onUploadPersonalFile(docType, fileInput);
    
    // reset input
    if (fileInput) fileInput.value = "";
  };

  return (
    <div className="flex flex-col h-full overflow-y-auto p-5 space-y-6">
      
      <div className="border-b border-white/5 pb-4">
        <h3 className="text-xs font-black uppercase text-white tracking-wider flex items-center gap-1.5">
          <Shield className="h-4.5 w-4.5 text-[#b5a642]" /> Personal Compliance &amp; Credentials Locker
        </h3>
        <p className="text-[10px] text-white/40 mt-0.5">Upload and vault your licensing records and errors and omissions policy binders for internal audits</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 items-start">
        
        {/* Left Side: Upload Form */}
        <form onSubmit={handleSubmit} className="bg-[#16161c] border border-white/5 p-5 rounded-xl space-y-4">
          <span className="text-[10px] text-[#b5a642] uppercase font-black tracking-wider block border-b border-white/5 pb-1.5">
            Vault New Credentials Record
          </span>
          
          <div className="space-y-1.5">
            <label className="block text-[9px] text-white/40 font-bold uppercase tracking-wider">Credential Category</label>
            <select 
              value={docType}
              onChange={(e) => setDocType(e.target.value)}
              className="w-full bg-[#111114] border border-white/5 text-xs rounded-lg p-2.5 font-bold text-white/80 focus:outline-none"
            >
              <option value="FSRA Broker License">FSRA Broker License (M19XXXXXX)</option>
              <option value="E&amp;O Insurance Policy">Errors &amp; Omissions Insurance Policy Binder</option>
              <option value="Signed Brokerage Agreement">Signed Principal Brokerage Agreement</option>
              <option value="Compliance AML Training">AML Compliance Certification (CAMS/FSRA)</option>
              <option value="Driver's License / Passport">Personal Govt Photo ID Verification</option>
            </select>
          </div>

          <div className="space-y-1.5">
            <label className="block text-[9px] text-white/40 font-bold uppercase tracking-wider">Upload Credentials (PDF/JPG)</label>
            <input 
              type="file" 
              id="personal-doc-file-input"
              accept=".pdf,.png,.jpg,.jpeg"
              className="w-full bg-[#111114] border border-white/5 text-xs rounded-lg p-2 text-white/50 file:mr-3 file:py-1 file:px-2.5 file:rounded file:border-0 file:text-[10px] file:font-black file:uppercase file:bg-[#b5a642]/10 file:text-[#b5a642] hover:file:bg-[#b5a642]/20 transition-colors"
              required
            />
          </div>

          <button 
            type="submit"
            className="w-full bg-[#b5a642]/10 border border-[#b5a642]/20 text-[#b5a642] hover:bg-[#b5a642]/20 font-black uppercase text-xs py-2.5 rounded-lg transition-all flex items-center justify-center gap-1.5"
          >
            <Check className="h-4 w-4" /> Vault Personal Credential File
          </button>
        </form>

        {/* Right Side: Vaulted List */}
        <div className="space-y-3">
          <span className="text-[10px] text-white/30 uppercase font-black tracking-widest block">
            VAULTED CREDENTIALS ({personalFiles.length})
          </span>
          
          {personalFiles.length === 0 ? (
            <div className="border border-dashed border-white/5 p-8 rounded-xl text-center text-white/30 italic">
              <Lock className="h-8 w-8 mx-auto mb-2 opacity-10" />
              No credentials vaulted under your profile.
            </div>
          ) : (
            <div className="space-y-2.5">
              {personalFiles.map(file => (
                <div key={file.id} className="bg-[#16161c] border border-white/5 p-4 rounded-xl flex items-center justify-between gap-4 hover:border-white/10 transition-colors">
                  <div className="min-w-0 space-y-1">
                    <div className="text-xs font-black text-white/90">{file.type}</div>
                    <div className="text-[10px] text-white/40 truncate max-w-[280px] font-mono">{file.name}</div>
                    <div className="text-[8px] text-[#b5a642] font-black uppercase tracking-wider font-mono">
                      Vault Status: Verified | Received {file.date}
                    </div>
                  </div>

                  <div className="flex gap-1.5 shrink-0">
                    <button 
                      onClick={() => showToast(`Downloading compliance credential: ${file.name}`, "info", "💾")}
                      className="p-2 bg-white/5 hover:bg-white/10 text-white/60 rounded-md transition-colors"
                      title="Download Credential Document"
                    >
                      <FileDown className="h-3.5 w-3.5" />
                    </button>
                    <button 
                      onClick={() => onDeletePersonalFile(file.id, file.name)}
                      className="p-2 bg-red-500/5 hover:bg-red-500/15 text-red-400 rounded-md border border-red-500/10 transition-colors"
                      title="Delete Credential Document"
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

    </div>
  );
};
