import React from "react";
import { 
  AlertCircle, AlertTriangle, CheckCircle2, ShieldAlert, UploadCloud, 
  Trash2, HelpCircle, Eye, CornerDownRight, ShieldCheck, RefreshCw, Sparkles 
} from "lucide-react";
import { Client } from "../../types";
import { EnhancedDocState } from "./types";
import { STATUS_STYLING } from "./constants";

interface DocChecklistCardProps {
  client: Client;
  doc: EnhancedDocState;
  onStatusChange: (clientId: string, docId: string, status: any) => void;
  onOpenUploadDrawer: (client: Client, docId: string, label: string, category: string) => void;
  onDeleteDocument: (clientId: string, docId: string, label: string) => void;
  isOwnerOrManager: boolean;
  currentUser: any;
}

export const DocChecklistCard: React.FC<DocChecklistCardProps> = ({
  client,
  doc,
  onStatusChange,
  onOpenUploadDrawer,
  onDeleteDocument,
  isOwnerOrManager,
  currentUser
}) => {
  const style = STATUS_STYLING[doc.status] || STATUS_STYLING.required;
  const lastFile = doc.files && doc.files.length > 0 ? doc.files[doc.files.length - 1] : null;

  // Render warning banners
  const renderWarning = () => {
    if (doc.warningTag === "expired" || doc.status === "expired") {
      return (
        <span className="inline-flex items-center gap-1 bg-red-500/10 text-red-400 border border-red-500/25 text-[8px] font-black uppercase px-2 py-0.5 rounded-md animate-pulse">
          <AlertCircle className="h-2.5 w-2.5" /> Expired Document
        </span>
      );
    }
    if (doc.warningTag === "expires_soon") {
      return (
        <span className="inline-flex items-center gap-1 bg-yellow-500/10 text-yellow-500 border border-yellow-500/20 text-[8px] font-black uppercase px-2 py-0.5 rounded-md">
          <AlertTriangle className="h-2.5 w-2.5" /> Expires Soon
        </span>
      );
    }
    if (doc.warningTag === "stale" || doc.warningTag === "needs_refresh") {
      return (
        <span className="inline-flex items-center gap-1 bg-orange-500/10 text-orange-400 border border-orange-500/20 text-[8px] font-black uppercase px-2 py-0.5 rounded-md" title="Documents must be under 45/60 days old for lender submissions">
          <RefreshCw className="h-2.5 w-2.5 animate-spin-slow" /> Stale (Needs Refresh)
        </span>
      );
    }
    return null;
  };

  return (
    <div 
      className={`p-4 rounded-xl border transition-all duration-300 flex flex-col md:flex-row md:items-center justify-between gap-4 ${
        doc.status === "approved" 
          ? "bg-[#18181f]/40 border-green-500/15" 
          : doc.status === "rejected" || doc.status === "missing_pages"
          ? "bg-[#1b1517]/50 border-red-500/15"
          : doc.status === "waived"
          ? "bg-white/[0.01] border-white/5 opacity-70"
          : "bg-[#16161c]/90 border-white/5 hover:border-white/10"
      }`}
    >
      {/* 1. Details & Metas */}
      <div className="flex-grow min-w-0 space-y-1.5">
        <div className="flex flex-wrap items-center gap-2">
          <h5 className="text-xs font-black text-white/95 tracking-wide truncate">
            {doc.label}
          </h5>
          
          {doc.isCustom && (
            <span className="bg-[#b5a642]/10 text-[#b5a642] border border-[#b5a642]/20 text-[8px] font-black uppercase px-1.5 py-0.5 rounded flex items-center gap-0.5">
              <Sparkles className="h-2 w-2" /> Custom Lender Clause
            </span>
          )}

          {renderWarning()}

          {doc.files && doc.files.length > 0 && (
            <span className="bg-blue-500/10 text-blue-400 border border-blue-500/20 text-[8px] font-black uppercase px-1.5 py-0.5 rounded">
              v{doc.files.length} Secure Vaulted
            </span>
          )}
        </div>

        <p className="text-[10px] text-white/40 leading-relaxed max-w-2xl">
          {doc.description}
        </p>

        {/* Notes & Audit Trails if present */}
        {doc.notes && (
          <div className="bg-[#111115] border border-white/5 px-2.5 py-2 rounded-lg text-[10px] text-white/60 flex items-start gap-1.5 mt-2">
            <CornerDownRight className="h-3 w-3 text-[#b5a642] shrink-0 mt-0.5" />
            <div className="min-w-0">
              <span className="text-[#b5a642]/80 uppercase font-black text-[8px] tracking-wider block">Underwriter Audit Comments:</span>
              <p className="italic text-white/80 mt-0.5 whitespace-pre-line">{doc.notes}</p>
              {doc.reviewedBy && (
                <span className="block text-[8px] text-white/30 mt-1 font-mono">
                  By {doc.reviewedBy} on {doc.reviewedAt ? new Date(doc.reviewedAt).toLocaleDateString() : ""}
                </span>
              )}
            </div>
          </div>
        )}

        {/* Dynamic Expiry & Dates */}
        <div className="flex flex-wrap gap-x-4 gap-y-1 text-[9px] text-white/30 font-mono mt-1 pt-1 border-t border-white/[0.02]">
          {doc.expiryDate && (
            <span className="text-[#b5a642]">📅 Expiry Date: <strong className="text-white/70">{doc.expiryDate}</strong></span>
          )}
          {lastFile && (
            <span>Last Active File: <strong className="text-white/50">{lastFile.fileName}</strong> ({lastFile.fileSize})</span>
          )}
          {doc.dueDate && doc.status === "requested" && (
            <span className="text-orange-400">📩 Requested: Due <strong className="text-white/60">{doc.dueDate}</strong></span>
          )}
        </div>
      </div>

      {/* 2. Interactive Control Center */}
      <div className="flex flex-wrap items-center gap-2 shrink-0 self-start md:self-center">
        
        {/* Status Dropdown Picker */}
        <div className="flex flex-col gap-0.5">
          <label className="text-[7.5px] uppercase font-black text-white/30 tracking-wider">Compliance Status</label>
          <select 
            value={doc.status}
            onChange={(e) => onStatusChange(client.id, doc.id, e.target.value)}
            className="bg-[#111115] border border-white/5 hover:border-white/15 text-[10px] font-bold uppercase rounded p-1.5 text-white/80 focus:outline-none cursor-pointer transition-colors"
          >
            {Object.keys(STATUS_STYLING).map(k => (
              <option key={k} value={k}>{STATUS_STYLING[k].label}</option>
            ))}
          </select>
        </div>

        {/* Quick Action: Fast-Track Approve */}
        {doc.status !== "approved" && doc.files.length > 0 && (
          <button
            onClick={() => onStatusChange(client.id, doc.id, "approved")}
            className="h-[33px] px-2.5 bg-green-500/10 border border-green-500/20 hover:bg-green-500/20 text-green-400 text-[9px] font-black uppercase rounded-lg flex items-center gap-1 self-end transition-colors"
            title="Fast approve document and clear conditions"
          >
            <CheckCircle2 className="h-3 w-3" /> Approve
          </button>
        )}

        {/* Quick Action: Waive Document */}
        {doc.status !== "waived" && (
          <button
            onClick={() => onStatusChange(client.id, doc.id, "waived")}
            className="h-[33px] px-2 bg-emerald-500/5 hover:bg-emerald-500/10 border border-emerald-500/15 text-emerald-400/80 text-[9px] font-black uppercase rounded-lg flex items-center gap-1 self-end transition-colors"
            title="Waive requirement for this client"
          >
            <ShieldCheck className="h-3 w-3" /> Waive
          </button>
        )}

        {/* View / Upload Secure Drawer */}
        <button 
          onClick={() => onOpenUploadDrawer(client, doc.id, doc.label || doc.id, doc.category || "Other")}
          className="h-[33px] px-3 bg-[#b5a642]/10 border border-[#b5a642]/20 hover:bg-[#b5a642]/25 text-[#b5a642] text-[10px] font-black uppercase rounded-lg flex items-center gap-1.5 self-end transition-all shadow-sm"
          title="Manage Uploads, Add Versions and Comments"
        >
          <UploadCloud className="h-3.5 w-3.5" /> Secure Vault
        </button>

        {/* Wipe Item (Admin Only / If Custom) */}
        {isOwnerOrManager && (
          <button 
            onClick={() => onDeleteDocument(client.id, doc.id, doc.label || doc.id)}
            className="h-[33px] px-2.5 bg-red-500/5 hover:bg-red-500/15 border border-red-500/10 text-red-400 rounded-lg self-end transition-colors"
            title="Wipe files & reset state to required"
          >
            <Trash2 className="h-3.5 w-3.5" />
          </button>
        )}

      </div>
    </div>
  );
};
