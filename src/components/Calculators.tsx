import React from "react";
import { Calculator, Copy, Award, ShieldAlert } from "lucide-react";
import { Client } from "../types";

interface CalculatorsProps {
  clients: Client[];
  calcClientId: string;
  setCalcClientId: (id: string) => void;
  stIncome: string;
  setStIncome: (val: string) => void;
  stCoIncome: string;
  setStCoIncome: (val: string) => void;
  stDebts: string;
  setStDebts: (val: string) => void;
  stCondo: string;
  setStCondo: (val: string) => void;
  stTax: string;
  setStTax: (val: string) => void;
  stHeat: string;
  setStHeat: (val: string) => void;
  stRate: string;
  setStRate: (val: string) => void;
  stAmortization: string;
  setStAmortization: (val: string) => void;
  pcAmount: string;
  setPcAmount: (val: string) => void;
  pcRate: string;
  setPcRate: (val: string) => void;
  pcAm: string;
  setPcAm: (val: string) => void;
  pcFreq: string;
  setPcFreq: (val: string) => void;
  gcIncome: string;
  setGcIncome: (val: string) => void;
  gcPmt: string;
  setGcPmt: (val: string) => void;
  gcTax: string;
  setGcTax: (val: string) => void;
  gcHeat: string;
  setGcHeat: (val: string) => void;
  gcCondo: string;
  setGcCondo: (val: string) => void;
  gcDebts: string;
  setGcDebts: (val: string) => void;
  hrRate: string;
  setHrRate: (val: string) => void;
  hrHrs: string;
  setHrHrs: (val: string) => void;
  seY1: string;
  setSeY1: (val: string) => void;
  seY2: string;
  setSeY2: (val: string) => void;
  onLoadClientToCalc: (id: string) => void;
  onClearCalcClient: () => void;
  cPmt: (P: number, rPct: number, yrs: number) => number;
  pToAmt: (pmt: number, rPct: number, yrs: number) => number;
  fd: (n: number) => string;
  showToast: (msg: string, type?: any) => void;
}

export const Calculators: React.FC<CalculatorsProps> = ({
  clients,
  calcClientId,
  setCalcClientId,
  stIncome,
  setStIncome,
  stCoIncome,
  setStCoIncome,
  stDebts,
  setStDebts,
  stCondo,
  setStCondo,
  stTax,
  setStTax,
  stHeat,
  setStHeat,
  stRate,
  setStRate,
  stAmortization,
  setStAmortization,
  pcAmount,
  setPcAmount,
  pcRate,
  setPcRate,
  pcAm,
  setPcAm,
  pcFreq,
  setPcFreq,
  gcIncome,
  setGcIncome,
  gcPmt,
  setGcPmt,
  gcTax,
  setGcTax,
  gcHeat,
  setGcHeat,
  gcCondo,
  setGcCondo,
  gcDebts,
  setGcDebts,
  hrRate,
  setHrRate,
  hrHrs,
  setHrHrs,
  seY1,
  setSeY1,
  seY2,
  setSeY2,
  onLoadClientToCalc,
  onClearCalcClient,
  cPmt,
  pToAmt,
  fd,
  showToast
}) => {
  const pn = (s: any) => parseFloat(String(s).replace(/[$,\s]/g, "")) || 0;

  // Real-time Calculators evaluation
  // 1. Stress test
  const calculateStressTest = () => {
    const inc = pn(stIncome) + pn(stCoIncome);
    const debts = pn(stDebts);
    const condo = pn(stCondo);
    const tax = pn(stTax) || 4800;
    const heat = pn(stHeat) || 150;
    const rate = parseFloat(stRate) || 4.79;
    const am = parseInt(stAmortization) || 25;

    const stressRate = Math.max(rate + 2, 5.25);
    if (inc <= 0) return null;

    const mi = inc / 12;
    // GDS: 39% of gross income limit
    const maxGdsPmt = (mi * 0.39) - (tax / 12) - condo - heat;
    // TDS: 44% of gross income limit
    const maxTdsPmt = (mi * 0.44) - (tax / 12) - condo - heat - debts;

    const maxQualifiedPmt = Math.min(maxGdsPmt, maxTdsPmt);
    const maxQualifiedMortgage = maxQualifiedPmt > 0 ? pToAmt(maxQualifiedPmt, stressRate, am) : 0;
    const isQualifying = maxQualifiedMortgage > 0;

    return {
      stressRate,
      maxQualifiedMortgage,
      isQualifying,
      estPaymentAtContract: cPmt(maxQualifiedMortgage, rate, am),
      inc
    };
  };

  const stressRes = calculateStressTest();

  // 2. Payment Calculator
  const calculatePayment = () => {
    const amt = pn(pcAmount);
    const rate = parseFloat(pcRate) || 4.79;
    const am = parseInt(pcAm) || 25;

    if (amt <= 0 || rate <= 0) return null;

    const mo = cPmt(amt, rate, am);
    const bw = (mo * 12) / 26;
    const wk = (mo * 12) / 52;
    const abw = mo / 2; // Accelerated biweekly is half monthly

    return {
      monthly: mo,
      biweekly: bw,
      weekly: wk,
      accelBiweekly: abw,
      totalInterest: (mo * am * 12) - amt
    };
  };

  const payRes = calculatePayment();

  // 3. GDS / TDS Analysis
  const calculateGdsTds = () => {
    const inc = pn(gcIncome);
    const pmt = pn(gcPmt);
    const tax = pn(gcTax);
    const heat = pn(gcHeat) || 150;
    const condo = pn(gcCondo);
    const debts = pn(gcDebts);

    if (inc <= 0 || pmt <= 0) return null;

    const mi = inc / 12;
    const gds = ((pmt + tax + heat + condo) / mi) * 100;
    const tds = ((pmt + tax + heat + condo + debts) / mi) * 100;

    const gcColor = gds <= 32 ? "bg-green-500" : gds <= 39 ? "bg-yellow-500" : "bg-red-500";
    const tcColor = tds <= 40 ? "bg-green-500" : tds <= 44 ? "bg-yellow-500" : "bg-red-500";
    
    return {
      gds,
      tds,
      gdsPct: Math.min((gds / 50) * 100, 100),
      tdsPct: Math.min((tds / 55) * 100, 100),
      mi,
      passed: gds <= 39 && tds <= 44,
      gcColor,
      tcColor
    };
  };

  const ratioRes = calculateGdsTds();

  // 4. SE & Hourly
  const hrResult = pn(hrRate) * pn(hrHrs) * 52;
  const seAvg = (pn(seY1) + pn(seY2)) / 2;

  const handleCopyRatios = () => {
    if (!ratioRes) return;
    const text = `GDS: ${ratioRes.gds.toFixed(1)}% | TDS: ${ratioRes.tds.toFixed(1)}% | Income: ${fd(pn(gcIncome))}/yr | Housing Pmt: ${fd(pn(gcPmt))}/mo`;
    navigator.clipboard.writeText(text).then(() => {
      showToast("GDS/TDS summary copied to clipboard!", "success", "📋");
    });
  };

  return (
    <div className="flex flex-col gap-5 h-full overflow-y-auto pr-1">
      {/* Client Quick Link Bar */}
      <div className="bg-[#141418] border border-white/5 rounded-xl p-4 flex flex-col sm:flex-row sm:items-center gap-3 shrink-0">
        <label className="text-xs font-semibold text-white/70">Analyze existing client file:</label>
        <select 
          value={calcClientId}
          onChange={(e) => {
            setCalcClientId(e.target.value);
            if (e.target.value) onLoadClientToCalc(e.target.value);
          }}
          className="flex-1 bg-[#1b1b20] border border-white/5 rounded-lg px-3 py-1.5 text-xs text-[#eeeef2] focus:outline-none"
        >
          <option value="">— Manual Calculator Mode —</option>
          {clients.map(c => (
            <option key={c.id} value={c.id}>{c.first} {c.last} {c.type ? `(${c.type})` : ""}</option>
          ))}
        </select>
        <button 
          onClick={onClearCalcClient}
          className="px-4 py-1.5 bg-[#1b1b20] hover:bg-white/5 text-white/50 text-xs font-semibold rounded-lg transition-all"
        >
          Reset values
        </button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
        
        {/* Stress Test */}
        <div className="bg-[#141418] border border-white/5 rounded-xl overflow-hidden shadow-sm">
          <div className="p-4 border-b border-white/5 bg-[#1b1b20]/30 mr-1 flex items-center justify-between">
            <h3 className="text-xs font-bold uppercase tracking-wider">🏦 OSFI stress qualifying test</h3>
            <span className="text-[10px] text-[#8e95a3]">Stress Rate Rate: +2% contract or 5.25%</span>
          </div>

          <div className="p-5 flex flex-col gap-4">
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-[10px] text-white/40 uppercase tracking-wider font-semibold mb-1">Applicant Income/yr</label>
                <input 
                  type="text" 
                  value={stIncome}
                  onChange={(e) => setStIncome(e.target.value.replace(/[^\d.]/g, ""))}
                  placeholder="$100,000"
                  className="w-full bg-[#1b1b20] border border-white/5 rounded-lg px-3 py-2 text-xs text-[#eeeef2] focus:outline-none focus:border-[#b5a642]/40"
                />
              </div>
              <div>
                <label className="block text-[10px] text-white/40 uppercase tracking-wider font-semibold mb-1">Co-Applicant Income/yr</label>
                <input 
                  type="text" 
                  value={stCoIncome}
                  onChange={(e) => setStCoIncome(e.target.value.replace(/[^\d.]/g, ""))}
                  placeholder="$0"
                  className="w-full bg-[#1b1b20] border border-white/5 rounded-lg px-3 py-2 text-xs text-[#eeeef2] focus:outline-none focus:border-[#b5a642]/40"
                />
              </div>
            </div>

            <div className="grid grid-cols-3 gap-3">
              <div>
                <label className="block text-[10px] text-white/40 uppercase tracking-wider font-semibold mb-1">Monthly Debts</label>
                <input 
                  type="text" 
                  value={stDebts}
                  onChange={(e) => setStDebts(e.target.value.replace(/[^\d.]/g, ""))}
                  placeholder="$0"
                  className="w-full bg-[#1b1b20] border border-white/5 rounded-lg px-2.5 py-2 text-xs text-[#eeeef2] focus:outline-none focus:border-[#b5a642]/40"
                />
              </div>
              <div>
                <label className="block text-[10px] text-white/40 uppercase tracking-wider font-semibold mb-1">Condo Fees / mo</label>
                <input 
                  type="text" 
                  value={stCondo}
                  onChange={(e) => setStCondo(e.target.value.replace(/[^\d.]/g, ""))}
                  placeholder="$0"
                  className="w-full bg-[#1b1b20] border border-white/5 rounded-lg px-2.5 py-2 text-xs text-[#eeeef2] focus:outline-none focus:border-[#b5a642]/40"
                />
              </div>
              <div>
                <label className="block text-[10px] text-white/40 uppercase tracking-wider font-semibold mb-1">Prop Taxes/yr</label>
                <input 
                  type="text" 
                  value={stTax}
                  onChange={(e) => setStTax(e.target.value.replace(/[^\d.]/g, ""))}
                  placeholder="$4,800"
                  className="w-full bg-[#1b1b20] border border-white/5 rounded-lg px-2.5 py-2 text-xs text-[#eeeef2] focus:outline-none focus:border-[#b5a642]/40"
                />
              </div>
            </div>

            <div className="grid grid-cols-3 gap-3">
              <div>
                <label className="block text-[10px] text-white/40 uppercase tracking-wider font-semibold mb-1">Heat cost/mo</label>
                <input 
                  type="text" 
                  value={stHeat}
                  onChange={(e) => setStHeat(e.target.value.replace(/[^\d.]/g, ""))}
                  placeholder="$150"
                  className="w-full bg-[#1b1b20] border border-white/5 rounded-lg px-2.5 py-2 text-xs text-[#eeeef2] focus:outline-none focus:border-[#b5a642]/40"
                />
              </div>
              <div>
                <label className="block text-[10px] text-white/40 uppercase tracking-wider font-semibold mb-1">Contract %</label>
                <input 
                  type="number" 
                  step="0.01"
                  value={stRate}
                  onChange={(e) => setStRate(e.target.value)}
                  placeholder="4.79"
                  className="w-full bg-[#1b1b20] border border-white/5 rounded-lg px-2.5 py-2 text-xs text-[#eeeef2] focus:outline-none focus:border-[#b5a642]/40"
                />
              </div>
              <div>
                <label className="block text-[10px] text-white/40 uppercase tracking-wider font-semibold mb-1">Amortization</label>
                <select 
                  value={stAmortization}
                  onChange={(e) => setStAmortization(e.target.value)}
                  className="w-full bg-[#1b1b20] border border-white/5 rounded-lg px-2.5 py-2 text-xs text-[#eeeef2] focus:outline-none focus:border-[#b5a642]/40"
                >
                  <option value="25">25 years</option>
                  <option value="30">30 years</option>
                </select>
              </div>
            </div>

            {/* Results card */}
            {stressRes ? (
              <div className="p-4 bg-[#1b1b20] rounded-xl border border-white/5 mt-2">
                <span className={`text-[10px] font-bold uppercase tracking-wider px-2.5 py-0.5 rounded ${stressRes.isQualifying ? "bg-green-500/10 text-green-400" : "bg-red-500/10 text-red-300"}`}>
                  {stressRes.isQualifying ? "✓ Qualifies (Stress Test Clear)" : "✗ Over-leveraged Limits"}
                </span>
                <div className="text-3xl font-bold font-sans mt-2 text-[#b5a642]">{fd(stressRes.maxQualifiedMortgage)}</div>
                <div className="text-[10px] uppercase text-[#8e95a3] tracking-wide mt-0.5">Maximum estimated qualifying mortgage</div>
                
                <div className="border-t border-white/5 pt-3 mt-3 flex flex-col gap-1.5 text-xs text-[#8e95a3]">
                  <div className="flex justify-between"><span>Qualifying Stress Rate</span><span className="font-semibold text-[#eeeef2]">{stressRes.stressRate.toFixed(2)}%</span></div>
                  <div className="flex justify-between"><span>Combined Gross income</span><span className="font-semibold text-[#eeeef2]">{fd(stressRes.inc)}/yr</span></div>
                  <div className="flex justify-between"><span>Est. Contract Payment</span><span className="font-semibold text-green-400">{fd(stressRes.estPaymentAtContract)}/month</span></div>
                </div>
              </div>
            ) : (
              <div className="p-6 bg-white/2 bg-[#1b1b20] rounded-xl text-center text-xs text-[#8e95a3]/50 italic">
                Enter income data above to estimate underwriting limit.
              </div>
            )}
          </div>
        </div>

        {/* GDS / TDS Progress Bars */}
        <div className="bg-[#141418] border border-white/5 rounded-xl overflow-hidden shadow-sm">
          <div className="p-4 border-b border-white/5 bg-[#1b1b20]/30 mr-1 flex items-center justify-between">
            <h3 className="text-xs font-bold uppercase tracking-wider">📊 GDS / TDS Live Ratios</h3>
            <span className="text-[10px] text-[#8e95a3]">Standard threshold: GDS &lt; 39% | TDS &lt; 44%</span>
          </div>

          <div className="p-5 flex flex-col gap-3">
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-[10px] text-white/40 uppercase tracking-wider font-semibold mb-1">Gross Annual Income</label>
                <input 
                  type="text" 
                  value={gcIncome}
                  onChange={(e) => setGcIncome(e.target.value.replace(/[^\d.]/g, ""))}
                  placeholder="$120,000"
                  className="w-full bg-[#1b1b20] border border-white/5 rounded-lg px-3 py-2 text-xs text-[#eeeef2] focus:outline-none"
                />
              </div>
              <div>
                <label className="block text-[10px] text-white/40 uppercase tracking-wider font-semibold mb-1">Monthly housing Pmt</label>
                <input 
                  type="text" 
                  value={gcPmt}
                  onChange={(e) => setGcPmt(e.target.value.replace(/[^\d.]/g, ""))}
                  placeholder="$2,000"
                  className="w-full bg-[#1b1b20] border border-white/5 rounded-lg px-3 py-2 text-xs text-[#eeeef2] focus:outline-none"
                />
              </div>
            </div>

            <div className="grid grid-cols-4 gap-2">
              <div>
                <label className="block text-[8px] text-white/40 uppercase tracking-wider font-semibold mb-1">Prop Tax/mo</label>
                <input 
                  type="text" 
                  value={gcTax}
                  onChange={(e) => setGcTax(e.target.value.replace(/[^\d.]/g, ""))}
                  placeholder="$400"
                  className="w-full bg-[#1b1b20] border border-white/5 rounded-lg px-2 py-2 text-xs text-[#eeeef2]"
                />
              </div>
              <div>
                <label className="block text-[8px] text-white/40 uppercase tracking-wider font-semibold mb-1">Heating/mo</label>
                <input 
                  type="text" 
                  value={gcHeat}
                  onChange={(e) => setGcHeat(e.target.value.replace(/[^\d.]/g, ""))}
                  placeholder="$150"
                  className="w-full bg-[#1b1b20] border border-[#eeeef2]/5 rounded-lg px-2 py-2 text-xs text-[#eeeef2]"
                />
              </div>
              <div>
                <label className="block text-[8px] text-white/40 uppercase tracking-wider font-semibold mb-1">Condo/mo</label>
                <input 
                  type="text" 
                  value={gcCondo}
                  onChange={(e) => setGcCondo(e.target.value.replace(/[^\d.]/g, ""))}
                  placeholder="$0"
                  className="w-full bg-[#1b1b20] border border-[#eeeef2]/5 rounded-lg px-2 py-2 text-xs text-[#eeeef2]"
                />
              </div>
              <div>
                <label className="block text-[8px] text-white/40 uppercase tracking-wider font-semibold mb-1">Debts/mo</label>
                <input 
                  type="text" 
                  value={gcDebts}
                  onChange={(e) => setGcDebts(e.target.value.replace(/[^\d.]/g, ""))}
                  placeholder="$500"
                  className="w-full bg-[#1b1b20] border border-[#eeeef2]/5 rounded-lg px-2 py-2 text-xs text-[#eeeef2]"
                />
              </div>
            </div>

            {ratioRes ? (
              <div className="mt-2 flex flex-col gap-3">
                {/* GDS bar */}
                <div className="flex flex-col gap-1">
                  <div className="flex justify-between text-xs">
                    <span className="font-semibold text-white/80">Gross Debt Service (GDS)</span>
                    <span className={`font-mono font-bold ${ratioRes.gds > 39 ? "text-red-400" : "text-green-400"}`}>{ratioRes.gds.toFixed(1)}%</span>
                  </div>
                  <div className="h-2.5 w-full bg-[#1b1b20] rounded-full overflow-hidden relative border border-white/5">
                    <div className={`h-full ${ratioRes.gcColor} rounded-full`} style={{ width: `${ratioRes.gdsPct}%` }}></div>
                    <div className="absolute top-0 bottom-0 w-0.5 bg-white/40" style={{ left: "78%" }} title="39% A-Lender Limit"></div>
                  </div>
                </div>

                {/* TDS bar */}
                <div className="flex flex-col gap-1">
                  <div className="flex justify-between text-xs">
                    <span className="font-semibold text-white/80">Total Debt Service (TDS)</span>
                    <span className={`font-mono font-bold ${ratioRes.tds > 44 ? "text-red-400" : "text-green-400"}`}>{ratioRes.tds.toFixed(1)}%</span>
                  </div>
                  <div className="h-2.5 w-full bg-[#1b1b20] rounded-full overflow-hidden relative border border-white/5">
                    <div className={`h-full ${ratioRes.tcColor} rounded-full`} style={{ width: `${ratioRes.tdsPct}%` }}></div>
                    <div className="absolute top-0 bottom-0 w-0.5 bg-white/40" style={{ left: "80%" }} title="44% A-Lender Limit"></div>
                  </div>
                </div>

                {/* Status summary */}
                <div className="p-3.5 bg-[#1b1b20] rounded-lg border border-white/5 text-xs flex items-center justify-between">
                  <span>Qualifies for prime A-Lender files?</span>
                  <span className={`font-bold ${ratioRes.passed ? "text-green-400" : "text-red-400"}`}>{ratioRes.passed ? "✓ YES" : "✗ NO (Alt-A Only)"}</span>
                </div>

                <div className="flex gap-2">
                  <button 
                    onClick={handleCopyRatios}
                    className="flex-1 shrink-0 py-2 border border-[#eeeef2]/10 hover:bg-white/5 text-white/60 text-xs font-semibold rounded-lg flex items-center justify-center gap-1.5 transition-all"
                  >
                    <Copy className="w-3.5 h-3.5" /> Copy calculated ratios
                  </button>
                </div>
              </div>
            ) : (
              <div className="p-6 bg-white/2 bg-[#1b1b20] rounded-xl text-center text-xs text-[#8e95a3]/50 italic">
                Enter gross income & payment to plot ratios.
              </div>
            )}
          </div>
        </div>

        {/* Mortgage Payments frequency breakdown */}
        <div className="bg-[#141418] border border-white/5 rounded-xl overflow-hidden shadow-sm">
          <div className="p-4 border-b border-white/5 bg-[#1b1b20]/30 mr-1 flex items-center justify-between">
            <h3 className="text-xs font-bold uppercase tracking-wider">💵 Amortized Payment breakdown</h3>
            <span className="text-[10px] text-[#8e95a3]">Standard payment schedule calculator</span>
          </div>

          <div className="p-5 flex flex-col gap-3">
            <div className="fg"><label className="block text-[10px] text-white/40 uppercase tracking-wider font-semibold mb-1">Requested Loan amount</label>
              <input 
                type="text" 
                value={pcAmount}
                onChange={(e) => setPcAmount(e.target.value.replace(/[^\d.]/g, ""))}
                placeholder="$500,000"
                className="w-full bg-[#1b1b20] border border-white/5 rounded-lg px-3 py-2 text-xs text-[#eeeef2]"
              />
            </div>

            <div className="grid grid-cols-3 gap-2">
              <div>
                <label className="block text-[8px] text-white/40 uppercase tracking-wider font-semibold mb-1">Rate %</label>
                <input 
                  type="number" 
                  step="0.01"
                  value={pcRate}
                  onChange={(e) => setPcRate(e.target.value)}
                  placeholder="4.79"
                  className="w-full bg-[#1b1b20] border border-[#eeeef2]/5 rounded-lg px-2.5 py-2 text-xs text-[#eeeef2]"
                />
              </div>
              <div>
                <label className="block text-[8px] text-white/40 uppercase tracking-wider font-semibold mb-1">Amortization</label>
                <select 
                  value={pcAm}
                  onChange={(e) => setPcAm(e.target.value)}
                  className="w-full bg-[#1b1b20] border border-[#eeeef2]/5 rounded-lg px-2 py-2 text-xs text-[#eeeef2]"
                >
                  <option value="25">25 yr</option>
                  <option value="30">30 yr</option>
                  <option value="20">20 yr</option>
                </select>
              </div>
              <div>
                <label className="block text-[8px] text-white/40 uppercase tracking-wider font-semibold mb-1">Frequency</label>
                <select 
                  value={pcFreq}
                  onChange={(e) => setPcFreq(e.target.value)}
                  className="w-full bg-[#1b1b20] border border-[#eeeef2]/5 rounded-lg px-2 py-2 text-xs text-[#eeeef2]"
                >
                  <option value="monthly">Monthly</option>
                  <option value="biweekly">Bi-Weekly</option>
                  <option value="accel">Accel Bi-Wk</option>
                </select>
              </div>
            </div>

            {payRes ? (
              <div className="p-4 bg-[#1b1b20] rounded-xl border border-white/5">
                <div className="text-2xl font-bold text-[#b5a642]">{fd(payRes[pcFreq as "monthly" | "biweekly" | "weekly" | "accelBiweekly"])}</div>
                <div className="text-[9px] uppercase text-[#8e95a3] tracking-wide mt-0.5">Calculated {pcFreq} Mortgage Payment</div>
                
                <div className="border-t border-white/5 pt-3 mt-3 flex flex-col gap-1.5 text-xs text-[#8e95a3]">
                  <div className="flex justify-between"><span>Standard Monthly Payment</span><span className="font-semibold text-white">{fd(payRes.monthly)}</span></div>
                  <div className="flex justify-between"><span>Rapid Accelerated Bi-Weekly</span><span className="font-semibold text-white">{fd(payRes.accelBiweekly)}</span></div>
                  <div className="flex justify-between"><span>Paid Interest Over Amortization</span><span className="font-semibold text-orange-400">{fd(payRes.totalInterest)}</span></div>
                </div>
              </div>
            ) : null}
          </div>
        </div>

        {/* Self employed SE & Hourly income calculators */}
        <div className="bg-[#141418] border border-white/5 rounded-xl overflow-hidden shadow-sm">
          <div className="p-4 border-b border-white/5 bg-[#1b1b20]/30 mr-1 flex items-center justify-between">
            <h3 className="text-xs font-bold uppercase tracking-wider">💰 Secondary Income Annualizer</h3>
            <span className="text-[10px] text-[#8e95a3]">Wage and Business qualifying utilities</span>
          </div>

          <div className="p-5 flex flex-col gap-4">
            <div className="border-b border-white/5 pb-3">
              <h4 className="text-[10px] font-bold text-[#b5a642] uppercase tracking-wider mb-2">Hourly To Annual</h4>
              <div className="grid grid-cols-2 gap-3 mb-2.5">
                <div>
                  <label className="block text-[8px] text-[#8e95a3] uppercase font-semibold mb-1">Hourly rate $</label>
                  <input type="number" value={hrRate} onChange={(e) => setHrRate(e.target.value)} className="w-full bg-[#1b1b20] border border-white/5 rounded px-2.5 py-1 text-xs text-[#eeeef2]" />
                </div>
                <div>
                  <label className="block text-[8px] text-[#8e95a3] uppercase font-semibold mb-1">Hours / week</label>
                  <input type="number" value={hrHrs} onChange={(e) => setHrHrs(e.target.value)} className="w-full bg-[#1b1b20] border border-white/5 rounded px-2.5 py-1 text-xs text-[#eeeef2]" />
                </div>
              </div>
              <div className="text-xs">Extrapolated Salary: <strong className="text-green-400 font-mono">{fd(hrResult)}/yr</strong></div>
            </div>

            <div>
              <h4 className="text-[10px] font-bold text-[#b5a642] uppercase tracking-wider mb-2">Self Employed 2yr Net Average</h4>
              <div className="grid grid-cols-2 gap-3 mb-2.5">
                <div>
                  <label className="block text-[8px] text-[#8e95a3] uppercase font-semibold mb-1">Year 1 Net Income</label>
                  <input type="number" value={seY1} onChange={(e) => setSeY1(e.target.value)} className="w-full bg-[#1b1b20] border border-white/5 rounded px-3 py-1 text-xs" />
                </div>
                <div>
                  <label className="block text-[8px] text-[#8e95a3] uppercase font-semibold mb-1">Year 2 Net Income</label>
                  <input type="number" value={seY2} onChange={(e) => setSeY2(e.target.value)} className="w-full bg-[#1b1b20] border border-white/5 rounded px-3 py-1 text-xs" />
                </div>
              </div>
              <div className="text-xs">Underwriting Qualifying Average: <strong className="text-[#b5a642] font-mono">{fd(seAvg)}/yr</strong></div>
            </div>
          </div>
        </div>

      </div>

    </div>
  );
};
