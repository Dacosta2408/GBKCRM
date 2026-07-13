import express from "express";
import path from "path";
import { fileURLToPath } from "url";
import { createServer as createViteServer } from "vite";
import { GoogleGenAI } from "@google/genai";
import dotenv from "dotenv";

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

async function startServer() {
  const app = express();
  const PORT = 3000;

  app.use(express.json({ limit: "10mb" }));

  // Helper to get GoogleGenAI client or throw friendly error
  function getGeminiClient() {
    const key = process.env.GEMINI_API_KEY;
    if (!key || key === "MY_GEMINI_API_KEY" || key.trim() === "") {
       throw new Error("GEMINI_API_KEY environment variable is not configured. Please add your Gemini API Key in the Secrets/Settings panel.");
    }
    return new GoogleGenAI({ apiKey: key });
  }

  // Robust helper to perform generateContent calls with retries for transient/503/429 errors
  async function generateContentWithRetry(ai: ReturnType<typeof getGeminiClient>, params: any, retries = 3, delayMs = 1500) {
    for (let i = 0; i < retries; i++) {
      try {
        return await ai.models.generateContent(params);
      } catch (err: any) {
        const isTransient = 
          err.status === 503 || 
          err.status === 429 ||
          err.statusCode === 503 ||
          err.statusCode === 429 ||
          (err.message && (
            err.message.includes("503") || 
            err.message.includes("429") || 
            err.message.includes("UNAVAILABLE") || 
            err.message.includes("high demand") || 
            err.message.includes("temporary")
          ));
        
        if (isTransient && i < retries - 1) {
          console.warn(`Transient Gemini API error (attempt ${i + 1}/${retries}). Retrying in ${delayMs}ms... Error:`, err.message || err);
          await new Promise((resolve) => setTimeout(resolve, delayMs));
          delayMs *= 2; // Exponential backoff
          continue;
        }
        throw err;
      }
    }
    throw new Error("Failed to generate content after retries.");
  }

  // 1. General AI assistant chat proxy
  app.post("/api/ai/chat", async (req, res) => {
    try {
      const { message, history = [], clientContext = "" } = req.body;
      if (!message) {
        return res.status(400).json({ error: "Message is required." });
      }

      const ai = getGeminiClient();

      const systemInstruction = `You are the GBK Financial AI Mortgage Assistant — an expert Canadian mortgage advisor helping brokers at GBK Financial in Barrie, Ontario.
You have deep knowledge of OSFI stress test guidelines, CMHC rules, Ontario mortgage regulations, lender underwriting criteria, and best practices.

Be concise, practical, and highly professional. Use Canadian terminology (e.g., GDS/TDS, amortization, high-ratio, conventional, stress test, Monoline lenders).
Always suggest adjustments if qualification GDS/TDS ratios are borderline.

${clientContext ? `Here is the current client's profile for context:\n${clientContext}` : "No specific client is currently selected. Answer general mortgage questions."}`;

      // Format history into contents structure expected by @google/genai
      const contents = history.map((h: any) => ({
        role: h.role === "assistant" ? "model" : "user",
        parts: [{ text: h.content }]
      }));
      contents.push({ role: "user", parts: [{ text: message }] });

      const response = await generateContentWithRetry(ai, {
        model: "gemini-3.5-flash",
        contents: contents,
        config: {
          systemInstruction: systemInstruction,
          temperature: 0.7,
        }
      });

      const reply = response.text || "No response generated.";
      res.json({ reply });
    } catch (err: any) {
      console.error("AI Chat Error:", err);
      res.status(500).json({ error: err.message || "An error occurred with the AI assistant." });
    }
  });

  // 2. Application Intake Text Extractor (forces structured JSON output)
  app.post("/api/ai/intake", async (req, res) => {
    try {
      const { text } = req.body;
      if (!text) {
        return res.status(400).json({ error: "Direct application text or notes are required." });
      }

      const ai = getGeminiClient();

      const prompt = `Analyze this raw mortgage application text or notes and extract all available parameters to populate a structured JSON document. 
If a value is not mentioned or cannot be inferred, assign null or leave it empty. Return ONLY a valid JSON object matching the schema below. Do not include markdown wraps or backticks in the response.

JSON Schema:
{
  "app_first": "applicant's first name",
  "app_last": "applicant's last name",
  "app_email": "applicant's email",
  "app_cell": "applicant's cell phone",
  "app_dob": "YYYY-MM-DD or empty",
  "app_sin": "last 4 digits only",
  "app_marital": "Married, Single, Divorced, Separated, Common-Law, or Widowed",
  "app_dependents": "number",
  "co_first": "co-applicant's first name",
  "co_last": "co-applicant's last name",
  "co_email": "co-applicant's email",
  "co_cell": "co-applicant's cell phone",
  "co_sin": "last 4 digits only",
  "co_marital": "Married, Single, Divorced, Separated, Common-Law, or Widowed",
  "app_addr": "current street address",
  "app_unit": "current unit count/apt",
  "app_city": "current city",
  "app_prov": "province (two letters like ON, AB, BC)",
  "app_post": "current postal code",
  "app_res_yrs": "years at current residency",
  "app_res_mos": "months at current residency",
  "app_housing": "Own, Rent, or Live with Relatives",
  "app_emp1_name": "current primary employer name",
  "app_emp1_title": "primary job title",
  "app_emp1_income": "annual income as integer",
  "app_emp1_status": "Full Time, Part Time, Contract, or Seasonal",
  "app_emp1_type": "Salary, Hourly, or Commission",
  "app_emp1_yrs": "years at primary job",
  "app_emp1_mos": "months at primary job",
  "co_emp1_name": "co-applicant's employer name",
  "co_emp1_title": "co-applicant's job title",
  "co_emp1_income": "co-applicant's annual income as integer",
  "co_emp1_status": "Full Time, Part Time, Contract, or Seasonal",
  "app_self_income": "annual self-employed net income, if applicable",
  "app_self_name": "business name, if self-employed",
  "app_other_type": "Pension, Child Support, Rental Income, or Other",
  "app_other_amount": "monthly or annual other income as number",
  "app_other_freq": "Monthly or Annually",
  "co_self_income": "co-applicant's self-employed income",
  "co_other_amount": "co-applicant's other income",
  "prop_addr": "target property street address",
  "prop_city": "target property city",
  "prop_prov": "target property province",
  "prop_post": "target property postal code",
  "prop_type": "Detached, Semi-Detached, Townhouse, Condo, Multi-Unit, or Other",
  "prop_tenure": "Freehold, Leasehold, or Condo",
  "prop_style": "Bungalow, 2-Storey, Multi-Level, etc.",
  "prop_age": "approximate year built, e.g., 2015",
  "prop_value": "estimated purchase price or value as integer",
  "prop_tax": "estimated annual property tax",
  "prop_condo_fees": "monthly condo fees if applicable",
  "prop_heat": "monthly heating cost (defaults to 150)",
  "prop_water": "Municipal or Well",
  "prop_sewage": "Municipal or Septic",
  "mtg_purpose": "Purchase, Refinance, Renewal, HELOC, Pre-Approval, or Second Mortgage",
  "mtg_requested": "amount of financing requested",
  "mtg1_holder": "current lender name, if refinancing/renewing",
  "mtg1_balance": "current outstanding balance",
  "mtg1_rate": "current mortgage interest rate",
  "mtg1_payment": "current monthly payment",
  "mtg1_maturity": "current maturity date YYYY-MM-DD",
  "mtg1_rate_type": "Fixed or Variable",
  "mtg1_loan_type": "Conventional, Insured, or Insurable",
  "mtg1_freq": "Monthly, Bi-Weekly, Weekly, or Accelerated Bi-Weekly",
  "beacon": "primary applicant beacon credit score (300 to 900)",
  "debts": "estimated total other monthly debt payments (credit cards, leases, loans)"
}

Source Application Text:
${text}`;

      const response = await generateContentWithRetry(ai, {
        model: "gemini-3.5-flash",
        contents: prompt,
        config: {
          responseMimeType: "application/json",
          temperature: 0.1,
        }
      });

      const replyText = response.text || "{}";
      const resultJson = JSON.parse(replyText);
      res.json(resultJson);
    } catch (err: any) {
      console.error("AI Intake Extraction Error:", err);
      res.status(500).json({ error: err.message || "Failed to extract application details." });
    }
  });

  // 3. Automated File Underwriting Summary & Risk Analysis
  app.post("/api/ai/underwrite", async (req, res) => {
    try {
      const { clientData } = req.body;
      if (!clientData) {
        return res.status(400).json({ error: "Client data is required." });
      }

      const ai = getGeminiClient();

      const prompt = `Perform a comprehensive, professional mortgage underwriting analysis and risk assessment as a Senior Underwriter at GBK Financial (Ontario, Canada) for the following file:

Client: ${clientData.first} ${clientData.last} ${clientData.co ? `& Co-Applicant: ${clientData.co}` : ""}
File Purpose: ${clientData.type || "Purchase"}
Employment Details: ${clientData.emptype || "Not fully specified"}
Annual Income: $${(Number(clientData.income || 0) + Number(clientData.coIncome || 0)).toLocaleString()}/yr (Combined)
Credit Score (Beacon): ${clientData.beacon || "Not provided"}
Property Location: ${clientData.addr || "Not specified"}
Property Value: $${(Number(clientData.propval || 0)).toLocaleString()}
Mortgage Amount: $${(Number(clientData.mtgamt || 0)).toLocaleString()}
Other Debts: $${(Number(clientData.debts || 0)).toLocaleString()}/month
Property Tax: $${(Number(clientData.tax || 0)).toLocaleString()}/year
Condo Fees: $${(Number(clientData.condo || 0)).toLocaleString()}/month
Heating: $${(Number(clientData.heat || 150)).toLocaleString()}/month

Please calculate GDS, TDS, and LTV. Evaluate lender categories (A-Lender, Alt-A/B-Lender, Private) suitable for this client based on credit, income stability, and ratios.

Return a high-quality analysis broken down into these precise headers:
1. UNDERWRITING REPORT OVERVIEW: An elegant summary of GDS/TDS/LTV ratios and general qualifying status.
2. STRENGTHS OF THE FILE: Core positive points.
3. WEAKNESSES & RISKS: Borderline ratios, beacon concerns, or tenure risks.
4. RECOMMENDED LENDER WORKFLOW: Which tier of lender and why (mention Monoline, TD/Scotiabank, Equitable, or Privates).
5. PRACTICAL ACTIONABLE NEXT STEPS: What specific documents are critical matching the risk profile, or what ratios must adjust.

Keep the tone expert, authoritative, and direct to brokers. Ensure you do not use any asterisks (*) or formatting tags. Write in clear paragraphs under each header.`;

      const response = await generateContentWithRetry(ai, {
        model: "gemini-3.5-flash",
        contents: prompt,
        config: {
          temperature: 0.3,
        }
      });

      const reply = response.text || "Underwriting report failed to generate.";
      res.json({ reply });
    } catch (err: any) {
      console.error("AI Underwrite Error:", err);
      res.status(500).json({ error: err.message || "Failed to generate underwriting assessment." });
    }
  });

  // 4. Daily AI Market News Generator
  app.post("/api/ai/market-news", async (req, res) => {
    try {
      const ai = getGeminiClient();

      const prompt = `Generate exactly 4 highly realistic, timely, and professional mortgage & lending industry news updates for Canadian mortgage brokers, specifically focusing on the Ontario and Canadian market. Focus on recent rate developments, Bank of Canada policy rate discussions, CMHC premium updates, OSFI stress test parameters, or monoline lender guidelines (e.g. MCAP, First National, Merix).
      
      The response must be a valid JSON array of objects. Return ONLY the raw JSON. Do not wrap the JSON output in markdown code blocks, backticks, or any other formatting.

      JSON Schema of each item:
      {
        "headline": "string",
        "source": "string (e.g. Bank of Canada, CMHC, First National, MCAP, Equitable Bank, OSFI)",
        "date": "string (YYYY-MM-DD format, representing today or yesterday)",
        "summary": "string (a concise, highly professional 2-3 sentence overview of the policy tweak, rate decision, or regulatory change)",
        "link": "string (a realistic official URL related to the source, e.g. their homepage)",
        "category": "string, must be exactly one of: 'Rate Update', 'Lender Policy', 'Regulatory', 'Market Trend', 'CMHC'"
      }`;

      const response = await generateContentWithRetry(ai, {
        model: "gemini-3.5-flash",
        contents: prompt,
        config: {
          responseMimeType: "application/json",
          temperature: 0.7,
        }
      });

      const replyText = response.text || "[]";
      const resultJson = JSON.parse(replyText.trim());
      res.json(resultJson);
    } catch (err: any) {
      console.error("AI Market News Error:", err);
      res.status(500).json({ error: err.message || "Failed to generate market intelligence news." });
    }
  });

  // Vite development integration
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true, host: "0.0.0.0" },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), "dist");
    app.use(express.static(distPath));
    app.get("*", (req, res) => {
      res.sendFile(path.join(distPath, "index.html"));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`GBK Financial CRM Server running on port ${PORT}`);
  });
}

startServer();
