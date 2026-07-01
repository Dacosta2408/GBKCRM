import { useState } from "react";
import { Client } from "../types";
import { pn, cPmt } from "../lib/formatters";

export interface UseCalculatorsProps {
  clients: Client[];
}

export function useCalculators({ clients }: UseCalculatorsProps) {
  // Calculator linked client state
  const [calcClientId, setCalcClientId] = useState<string>("");
  const [stIncome, setStIncome] = useState<string>("");
  const [stCoIncome, setStCoIncome] = useState<string>("");
  const [stDebts, setStDebts] = useState<string>("");
  const [stCondo, setStCondo] = useState<string>("");
  const [stTax, setStTax] = useState<string>("4800");
  const [stHeat, setStHeat] = useState<string>("150");
  const [stRate, setStRate] = useState<string>("4.79");
  const [stAmortization, setStAmortization] = useState<string>("25");

  // Payment Calculator state
  const [pcAmount, setPcAmount] = useState<string>("500000");
  const [pcRate, setPcRate] = useState<string>("4.79");
  const [pcAm, setPcAm] = useState<string>("25");
  const [pcFreq, setPcFreq] = useState<string>("monthly");

  // GDS / TDS state
  const [gcIncome, setGcIncome] = useState<string>("120000");
  const [gcPmt, setGcPmt] = useState<string>("2000");
  const [gcTax, setGcTax] = useState<string>("400");
  const [gcHeat, setGcHeat] = useState<string>("150");
  const [gcCondo, setGcCondo] = useState<string>("0");
  const [gcDebts, setGcDebts] = useState<string>("500");

  // Hourly / SE state
  const [hrRate, setHrRate] = useState<string>("25.00");
  const [hrHrs, setHrHrs] = useState<string>("40");
  const [seY1, setSeY1] = useState<string>("80000");
  const [seY2, setSeY2] = useState<string>("95000");

  // Load client parameters into the GDS stress tools
  function handleLoadClientToCalc(id: string) {
    const c = clients.find(x => x.id === id);
    if (!c) return;
    setStIncome(String(c.income || ""));
    setStCoIncome(String(c.coIncome || ""));
    setStDebts(String(c.debts || ""));
    setStCondo(String(c.condo || ""));
    setStTax(c.tax ? String(pn(c.tax)) : "4800");
    setStHeat(c.heat ? String(c.heat) : "150");
    setGcIncome(String(pn(c.income) + pn(c.coIncome)));
    
    const mtg = pn(c.mtgamt);
    if (mtg > 0) {
      setGcPmt(String(Math.round(cPmt(mtg, 4.79, 25))));
      setPcAmount(String(mtg));
    }
    setGcTax(c.tax ? String(Math.round(pn(c.tax) / 12)) : "400");
    setGcHeat(c.heat ? String(c.heat) : "150");
    setGcCondo(c.condo ? String(c.condo) : "0");
    setGcDebts(c.debts ? String(c.debts) : "500");
  }

  function handleClearCalcClient() {
    setCalcClientId("");
    setStIncome("");
    setStCoIncome("");
    setStDebts("");
    setStCondo("");
    setStTax("4800");
    setStHeat("150");
    setGcIncome("120000");
    setGcPmt("2000");
    setGcTax("400");
    setGcHeat("150");
    setGcCondo("0");
    setGcDebts("500");
    setPcAmount("500000");
  }

  return {
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
    handleLoadClientToCalc,
    handleClearCalcClient
  };
}
