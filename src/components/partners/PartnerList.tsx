import React from "react";
import { 
  Star, Phone, Mail, Globe, MapPin, User, ArrowRight, Award, Trash2, Edit3 
} from "lucide-react";
import { ExtendedPartner } from "./constants";

interface PartnerListProps {
  partners: ExtendedPartner[];
  selectedPartnerId: string | null;
  onSelectPartner: (id: string) => void;
  onTogglePreferred: (id: string, e: React.MouseEvent) => void;
  onDeletePartner: (id: string, e: React.MouseEvent) => void;
  onEditPartner: (partner: ExtendedPartner, e: React.MouseEvent) => void;
  onQuickEmail: (email: string, e: React.MouseEvent) => void;
}

export const PartnerList: React.FC<PartnerListProps> = ({
  partners,
  selectedPartnerId,
  onSelectPartner,
  onTogglePreferred,
  onDeletePartner,
  onEditPartner,
  onQuickEmail
}) => {
  if (partners.length === 0) {
    return (
      <div className="bg-[#121216] border border-white/5 rounded-xl p-12 text-center" id="empty-partner-results">
        <MapPin className="h-10 w-10 text-white/10 mx-auto mb-3 stroke-1" />
        <h3 className="text-sm font-bold text-white uppercase tracking-wider">No Partners Located</h3>
        <p className="text-xs text-white/40 mt-1 max-w-sm mx-auto">
          No external professional partners match the current search filters or region constraints. Refine or expand parameters.
        </p>
      </div>
    );
  }

  return (
    <div className="bg-[#121216] border border-white/5 rounded-xl overflow-hidden shadow-lg" id="partner-results-directory">
      
      {/* Desktop Tabular Directory View */}
      <div className="overflow-x-auto">
        <table className="w-full border-collapse text-left text-xs">
          <thead>
            <tr className="bg-[#181820]/80 border-b border-white/5 select-none text-[10px] uppercase font-black tracking-widest text-white/40">
              <th className="py-3 px-4 w-10 text-center">Pref</th>
              <th className="py-3 px-4">Partner Name</th>
              <th className="py-3 px-4">Company</th>
              <th className="py-3 px-4">Category</th>
              <th className="py-3 px-4">Location</th>
              <th className="py-3 px-4">Phone / Contact</th>
              <th className="py-3 px-4">Email</th>
              <th className="py-3 px-4 text-center">Status</th>
              <th className="py-3 px-4">Relationship Owner</th>
              <th className="py-3 px-4 text-right w-24">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-white/[0.03]">
            {partners.map((partner) => {
              const isSelected = selectedPartnerId === partner.id;
              
              // Map status badge colors
              let statusColorClass = "bg-white/5 text-white/60";
              if (partner.status === "Preferred") {
                statusColorClass = "bg-amber-500/10 text-amber-400 border border-amber-500/20";
              } else if (partner.status === "Active") {
                statusColorClass = "bg-emerald-500/10 text-emerald-400 border border-emerald-500/20";
              } else if (partner.status === "Occasional") {
                statusColorClass = "bg-sky-500/10 text-sky-400 border border-sky-500/20";
              } else if (partner.status === "Inactive") {
                statusColorClass = "bg-rose-500/10 text-rose-400 border border-rose-500/20";
              }

              return (
                <tr
                  key={partner.id}
                  onClick={() => onSelectPartner(partner.id)}
                  className={`group cursor-pointer transition-all hover:bg-white/[0.01] ${
                    isSelected ? "bg-[#1b1b24] border-l-2 border-[#b5a642]" : ""
                  }`}
                >
                  {/* Preferred Status Star Toggle */}
                  <td className="py-3 px-4 text-center">
                    <button
                      onClick={(e) => onTogglePreferred(partner.id, e)}
                      className={`transition-colors duration-200 focus:outline-none ${
                        partner.isPreferred || partner.status === "Preferred"
                          ? "text-[#b5a642] hover:text-[#9a8c38]"
                          : "text-white/10 hover:text-[#b5a642]/50"
                      }`}
                      title={partner.isPreferred ? "Preferred Partner" : "Mark as Preferred"}
                    >
                      <Star className={`w-4.5 h-4.5 ${partner.isPreferred || partner.status === "Preferred" ? "fill-current" : ""}`} />
                    </button>
                  </td>

                  {/* Partner Name with initial avatar */}
                  <td className="py-3 px-4">
                    <div className="flex items-center gap-2.5">
                      <div className="w-7 h-7 rounded bg-[#1d1d26] border border-white/5 text-[10px] font-black text-[#b5a642] flex items-center justify-center uppercase shrink-0">
                        {partner.first[0]}{partner.last[0]}
                      </div>
                      <div className="font-semibold text-white group-hover:text-[#b5a642] transition-colors">
                        {partner.first} {partner.last}
                        {partner.role && (
                          <span className="block text-[9px] text-white/30 font-medium">
                            {partner.role}
                          </span>
                        )}
                      </div>
                    </div>
                  </td>

                  {/* Company */}
                  <td className="py-3 px-4 text-white/70 font-medium max-w-[150px] truncate">
                    {partner.company || <span className="text-white/20 italic">Independent</span>}
                  </td>

                  {/* Category Badge */}
                  <td className="py-3 px-4">
                    <span className="bg-[#1b1b24] text-[#6fa3b8] text-[9px] font-bold uppercase px-2 py-0.5 rounded border border-[#6fa3b8]/15">
                      {partner.type}
                    </span>
                  </td>

                  {/* Location (City / Service Area) */}
                  <td className="py-3 px-4 text-white/60">
                    <div className="flex items-center gap-1">
                      <MapPin className="w-3.5 h-3.5 text-white/30" />
                      <span>{partner.city || "Ontario"}</span>
                    </div>
                  </td>

                  {/* Phone */}
                  <td className="py-3 px-4 text-white/70 font-mono">
                    {partner.phone || <span className="text-white/20 italic">--</span>}
                  </td>

                  {/* Email */}
                  <td className="py-3 px-4">
                    {partner.email ? (
                      <button
                        onClick={(e) => onQuickEmail(partner.email!, e)}
                        className="text-[#6fa3b8] hover:text-[#b5a642] hover:underline font-medium block truncate max-w-[140px]"
                        title="Send outreach email"
                      >
                        {partner.email}
                      </button>
                    ) : (
                      <span className="text-white/20 italic">No Email</span>
                    )}
                  </td>

                  {/* Status Tag */}
                  <td className="py-3 px-4 text-center">
                    <span className={`text-[9px] font-bold uppercase px-2 py-0.5 rounded ${statusColorClass}`}>
                      {partner.status || "Active"}
                    </span>
                  </td>

                  {/* Relationship Owner */}
                  <td className="py-3 px-4 text-emerald-400 font-semibold flex items-center gap-1.5 pt-4">
                    <User className="w-3.5 h-3.5 text-white/20" />
                    <span>{partner.assignedOwner || "Unassigned"}</span>
                  </td>

                  {/* Action buttons inside the row */}
                  <td className="py-3 px-4 text-right">
                    <div className="flex items-center justify-end gap-1 opacity-40 group-hover:opacity-100 transition-opacity">
                      <button
                        onClick={(e) => onEditPartner(partner, e)}
                        className="p-1 hover:bg-[#1b1b24] border border-transparent hover:border-white/5 rounded text-white/50 hover:text-white transition-all"
                        title="Edit Partner Profile"
                      >
                        <Edit3 className="w-3.5 h-3.5" />
                      </button>
                      <button
                        onClick={(e) => onDeletePartner(partner.id, e)}
                        className="p-1 hover:bg-red-500/10 border border-transparent hover:border-red-500/20 rounded text-white/30 hover:text-red-400 transition-all"
                        title="Delete Relationship Record"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                      <div className="p-1 text-white/20">
                        <ArrowRight className="w-3.5 h-3.5" />
                      </div>
                    </div>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

    </div>
  );
};
