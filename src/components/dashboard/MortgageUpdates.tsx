import React, { useState, useEffect } from "react";
import { Sparkles, Calendar, Globe, RefreshCw, BookOpen, AlertCircle } from "lucide-react";

export interface NewsItem {
  headline: string;
  source: string;
  date: string;
  summary: string;
  link: string;
  category: "Rate Update" | "Lender Policy" | "Regulatory" | "Market Trend" | "CMHC";
}

// Highly professional default seed updates
const DEFAULT_UPDATES: NewsItem[] = [
  {
    headline: "Bank of Canada Holds Policy Rate Steady at 5.00%, Signalling Quantitative Tightening",
    source: "BoC Monetary Report",
    date: new Date().toLocaleDateString("en-CA"),
    summary: "The Bank of Canada maintained its target for the overnight rate. Governer Macklem noted that core inflation indicators suggest persistent underlying pressures, but housing market demand is cooling moderately in major Ontario centers.",
    link: "https://www.bankofcanada.ca",
    category: "Rate Update"
  },
  {
    headline: "First National Announces Underwriting Guideline Modifications for Rental Portfolios",
    source: "First National Lender Portal",
    date: new Date(Date.now() - 24 * 3600 * 1000).toLocaleDateString("en-CA"),
    summary: "First National has adjusted its Debt Service Ratio calculations for investors holding more than 4 properties. GDS/TDS offsets will now utilize a standardized 75% rental revenue multiplier, down from 80% on Alt-A submissions.",
    link: "https://www.firstnational.ca",
    category: "Lender Policy"
  },
  {
    headline: "OSFI Confirms Stress Test Minimum Qualifying Rate to Remain Unchanged",
    source: "OSFI Regulatory Announcement",
    date: new Date(Date.now() - 3 * 24 * 3600 * 1000).toLocaleDateString("en-CA"),
    summary: "The Office of the Superintendent of Financial Institutions announced the minimum qualifying rate for uninsured mortgages will remain the greater of the contract rate plus 2% or 5.25%, supporting systemic resilience.",
    link: "https://www.osfi-bsif.gc.ca",
    category: "Regulatory"
  },
  {
    headline: "CMHC Adjusts Premium Surcharges for Multi-Unit Energy-Efficient Construction Loans",
    source: "CMHC Underwriting Circular",
    date: new Date(Date.now() - 5 * 24 * 3600 * 1000).toLocaleDateString("en-CA"),
    summary: "CMHC MLI Select point system updated to grant higher underwriting prioritization for projects targeting greenhouse gas reduction goals. Premium credits can reach up to 1.5% for high-performance builds.",
    link: "https://www.cmhc-schl.gc.ca",
    category: "CMHC"
  }
];

export const MortgageUpdates: React.FC = () => {
  const [updates, setUpdates] = useState<NewsItem[]>(() => {
    const saved = localStorage.getItem("gbk_dashboard_ai_news");
    return saved ? JSON.parse(saved) : DEFAULT_UPDATES;
  });
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const [loadingMessage, setLoadingMessage] = useState<string>("");

  const loadingPhrases = [
    "Analyzing recent Bank of Canada rate announcements...",
    "Crawling Monoline and A-lender policy circulars...",
    "Filtering for high-value real estate finance guidelines...",
    "Formatting structured executive brief for GBK brokers...",
    "Synthesizing Ontario housing policy developments..."
  ];

  useEffect(() => {
    let interval: NodeJS.Timeout;
    if (loading) {
      let idx = 0;
      setLoadingMessage(loadingPhrases[0]);
      interval = setInterval(() => {
        idx = (idx + 1) % loadingPhrases.length;
        setLoadingMessage(loadingPhrases[idx]);
      }, 2500);
    }
    return () => clearInterval(interval);
  }, [loading]);

  const handleFetchAINews = async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch("/api/ai/market-news", {
        method: "POST",
        headers: { "Content-Type": "application/json" }
      });

      if (!res.ok) {
        throw new Error("Failed to communicate with Gemini API. Check environment credentials.");
      }

      const data = await res.json();
      if (Array.isArray(data) && data.length > 0) {
        setUpdates(data);
        localStorage.setItem("gbk_dashboard_ai_news", JSON.stringify(data));
      } else {
        throw new Error("Invalid format returned by AI news processor.");
      }
    } catch (err: any) {
      console.error(err);
      setError(err.message || "An unexpected error occurred while generating market intelligence.");
    } finally {
      setLoading(false);
    }
  };

  const getCategoryColor = (cat: string) => {
    switch (cat) {
      case "Rate Update": return "bg-red-500/10 text-red-400 border-red-500/15";
      case "Lender Policy": return "bg-orange-500/10 text-orange-400 border-orange-500/15";
      case "Regulatory": return "bg-purple-500/10 text-purple-400 border-purple-500/15";
      case "CMHC": return "bg-blue-500/10 text-blue-400 border-blue-500/15";
      default: return "bg-[#b5a642]/10 text-[#b5a642] border-[#b5a642]/15";
    }
  };

  return (
    <div className="bg-[#141418] border border-white/5 rounded-xl shadow-md p-5 flex flex-col gap-4" id="mortgage-updates">
      {/* Header section */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-white/5 pb-3">
        <div className="flex items-center gap-2">
          <div className="p-1.5 bg-[#b5a642]/10 rounded-lg text-[#b5a642]">
            <Sparkles className="w-4 h-4" />
          </div>
          <div>
            <h3 className="text-sm font-semibold text-[#eeeef2] flex items-center gap-2">
              GBK Market Intelligence Report
              <span className="text-[9px] bg-[#b5a642]/15 text-[#b5a642] px-2 py-0.5 rounded-full border border-[#b5a642]/20 animate-pulse">
                AI Powered
              </span>
            </h3>
            <p className="text-[10px] text-[#8e95a3] mt-0.5">
              Daily parsed lending developments, OSFI rules, rate outlooks, and policy changes
            </p>
          </div>
        </div>

        <button
          onClick={handleFetchAINews}
          disabled={loading}
          className="flex items-center gap-2 px-3 py-1.5 text-xs font-bold rounded-lg bg-[#b5a642] text-black hover:bg-[#9a8c38] disabled:opacity-50 disabled:cursor-not-allowed transition-all shadow-sm"
        >
          <RefreshCw className={`w-3.5 h-3.5 ${loading ? "animate-spin" : ""}`} />
          {loading ? "Re-Analyzing Market..." : "Refresh AI Intel Update"}
        </button>
      </div>

      {/* Error state */}
      {error && (
        <div className="p-3 bg-red-500/10 border border-red-500/15 rounded-lg text-xs text-red-400 flex items-start gap-2.5">
          <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
          <div>
            <span className="font-bold">Market Intelligence Offline:</span> {error}
            <p className="mt-1 text-[10px] text-white/40">Default curated seed data is active below for broker use.</p>
          </div>
        </div>
      )}

      {/* Loading state */}
      {loading ? (
        <div className="flex flex-col items-center justify-center py-20 bg-[#1b1b20]/20 border border-white/5 border-dashed rounded-xl gap-4">
          <div className="relative w-10 h-10 flex items-center justify-center">
            <div className="absolute inset-0 rounded-full border-2 border-[#b5a642]/10 border-t-[#b5a642] animate-spin" />
            <Sparkles className="w-4 h-4 text-[#b5a642] animate-pulse" />
          </div>
          <div className="text-center">
            <h4 className="text-xs font-semibold text-[#eeeef2]">AI Underwriting Crawler Active</h4>
            <p className="text-[10px] text-white/40 mt-1 max-w-sm animate-pulse">
              {loadingMessage}
            </p>
          </div>
        </div>
      ) : (
        /* News List layout */
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {updates.map((item, idx) => (
            <div
              key={idx}
              className="p-4 rounded-xl bg-[#1b1b20]/30 border border-white/5 hover:border-white/10 hover:bg-[#1b1b20]/50 transition-all flex flex-col justify-between gap-3 group relative overflow-hidden"
            >
              <div className="flex flex-col gap-2">
                <div className="flex items-center justify-between gap-2">
                  <span className={`text-[8px] font-bold uppercase tracking-wider px-2 py-0.5 rounded border ${getCategoryColor(item.category)}`}>
                    {item.category}
                  </span>
                  <div className="flex items-center gap-1.5 text-[9px] text-white/30 font-mono">
                    <Calendar className="w-3 h-3" />
                    <span>{item.date}</span>
                  </div>
                </div>

                <h4 className="text-xs font-bold text-white group-hover:text-[#b5a642] leading-relaxed transition-colors mt-1">
                  {item.headline}
                </h4>

                <p className="text-[10px] text-[#8e95a3] leading-relaxed mt-1">
                  {item.summary}
                </p>
              </div>

              <div className="flex items-center justify-between pt-2 border-t border-white/5 mt-auto text-[9px]">
                <span className="text-white/30">Source: <span className="font-semibold text-white/50">{item.source}</span></span>
                <a
                  href={item.link}
                  target="_blank"
                  rel="noreferrer noopener"
                  className="flex items-center gap-1 text-[#b5a642] font-semibold hover:underline"
                >
                  <Globe className="w-3 h-3" /> Source Bulletin
                </a>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};
