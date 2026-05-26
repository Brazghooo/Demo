import express from "express";
import path from "path";
import { createServer as createViteServer } from "vite";
import { GoogleGenAI } from "@google/genai";
import dotenv from "dotenv";

dotenv.config();

async function startServer() {
  const app = express();
  const PORT = 3000;

  // Crucial middlewear for json parsing
  app.use(express.json({ limit: "15mb" }));

  // Initialize the Gemini SDK safely (loaded lazily)
  let aiClient: GoogleGenAI | null = null;
  function getAiClient() {
    if (!aiClient) {
      const apiKey = process.env.GEMINI_API_KEY;
      if (!apiKey) {
        console.warn("GEMINI_API_KEY is not defined in the environment. AI Analysis requests will fallback to local calculations.");
        return null;
      }
      aiClient = new GoogleGenAI({
        apiKey,
        httpOptions: {
          headers: {
            "User-Agent": "aistudio-build",
          },
        },
      });
    }
    return aiClient;
  }

  // API router to run real-time AI analysis
  app.get("/api/proxy-sheet", async (req, res) => {
    try {
      const { url } = req.query;
      if (!url || typeof url !== "string") {
        return res.status(400).json({ error: "Missing Google Sheet export URL parameter." });
      }

      const response = await fetch(url, {
        headers: {
          "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
        }
      });

      if (!response.ok) {
        return res.status(response.status).json({ error: `Google Sheets returned HTTP Status ${response.status}` });
      }

      const csvText = await response.text();
      res.json({ success: true, csvText });
    } catch (err: any) {
      console.error("Proxy fetch error: ", err);
      res.status(500).json({ error: "Failed to download spreadsheet content. Ensure the sheet is Shared as 'Anyone with the link can view'. Details: " + err.message });
    }
  });

  app.post("/api/analyze", async (req, res) => {
    try {
      const { records, branches, totalSummary, cashSummaries } = req.body;

      if (!records || !Array.isArray(records)) {
        return res.status(400).json({ error: "No financial records provided for analysis." });
      }

      // Check if we have active AI integration
      const ai = getAiClient();
      if (!ai) {
        // Fallback standard response in case API key is empty or disabled in local preview
        const isOverallGood = (totalSummary.repayments >= totalSummary.disbursed * 0.85) && (totalSummary.defaultRate < 0.10);
        
        return res.json({
          fallback: true,
          analysis: `### ${isOverallGood ? '🟢 COMPANY PERFORMANCE VERDICT: PACIFIC FINANCE IS DOING GOOD' : '🔴 COMPANY PERFORMANCE VERDICT: SYSTEM ACTION REQUIRED (DOING BAD IN SPECIFIC METRICS)'}\n\n` +
            `Based on the combined auditing of your **Daily Collections & Disbursements Report** and **Daily Cash Summary Ledger**, we have parsed the following status and diagnostics:\n\n` +
            `#### 📊 Core Financial Insights Found:\n` +
            `- **Liquid Buffer Security**: Total Collections represent **MWK ${totalSummary.repayments.toLocaleString()}** against **MWK ${totalSummary.disbursed.toLocaleString()}** Disbursed. Inflows stand at **${totalSummary.disbursed > 0 ? ((totalSummary.repayments / totalSummary.disbursed) * 100).toFixed(1) : 0}%** of capital outflows.\n` +
            `- **Operational Recovery Yield**: Cumulative debt collection recovers **${((totalSummary.repayments / (totalSummary.expected || 1)) * 100).toFixed(1)}%** of expected repayments. Outstanding uncollected arrears: **MWK ${(totalSummary.expected - totalSummary.repayments).toLocaleString()}**.\n` +
            `- **Branch Risk Audit**: Portfolio defaults are at **${(totalSummary.defaultRate * 100).toFixed(1)}%**, compared to the statutory microcredit allowance threshold of **10.0%**.\n\n` +
            `#### 💡 Immediate Recommendations for Improvement:\n` +
            `1. **Disbursement Limit Rule**: ${isOverallGood ? 'Gradually expand the loan release index by 15% in high-performing zones such as Lilongwe Central.' : 'Cap daily loan disbursements strictly to 50% of your morning Opening Cash carry log until collections ratios improve.'}\n` +
            `2. **Mobilize Collection Operations**: Deploy local physical recovery agents directly to default-clustered regions (e.g., Blantyre district circles) to retrieve arrears.\n` +
            `3. **Liquid Sweep Reserves**: Implement a daily mandate that banks exactly **75% of collections** before 15:30 CAT, leaving 25% to support small emergency client payouts.\n` +
            `4. **Elevate Guarantor Standards**: Protect liquidity reserves by mandating fully certified business co-signers and phone-verified local references on all sub-loans exceeding MWK 500,000.`
        });
      }

      const prompt = `
        You are an advanced microfinance auditor and credit risk specialist auditing Pacific Finance Limited (MWK / Malawi Kwacha).
        We have two core financial reports that work hand-in-hand:
        
        1. DAILY COLLECTIONS & DISBURSEMENT REPORT:
           - Shows physical liquidity inflow (actual collected repayment amount) versus outflow (disbursed loan amount) on each operational day.
           - Collections side vs. Disbursement side.
           
        2. DAILY CASH SUMMARY REPORT:
           - Tracks day-to-day cash flow sequence: Date, Opening Cash carry, Collected Amount, Disbursed Amount, Banked Amount (safe deposits), and Closing Cash.
           - Closing Cash carries forward dynamically as the subsequent day's Opening Cash.
        
        Aggregate Data Provided for Analysis:
        - Number of branches: ${branches?.length || 0}
        - Branches List: ${JSON.stringify(branches || [])}
        - Total Disbursed: MWK ${totalSummary.disbursed.toLocaleString()}
        - Expected Repayment Amount: MWK ${totalSummary.expected.toLocaleString()}
        - Actual Repayment Amount Received: MWK ${totalSummary.repayments.toLocaleString()}
        - Operating Capital Expenses: MWK ${totalSummary.expenses.toLocaleString()}
        - Active Portfolio Default Rate: ${(totalSummary.defaultRate * 100).toFixed(1)}%
        - Cumulative Interest Margin Yield: MWK ${totalSummary.interestEarned.toLocaleString()}
        
        Complete Sequential Cash Summaries (Movement Ledger):
        ${JSON.stringify(cashSummaries || [])}

        Detailed Sample Transaction Records:
        ${JSON.stringify((records || []).slice(0, 15))}

        Critically analyze these combined reports and generate a highly professional microcredit audit review structured exactly as follows:
        
        1. ### COMPANY PERFORMANCE VERDICT (SYSTEM HEALTH AT THE VERY TOP)
           State explicitly and clearly whether Pacific Finance Limited is "DOING GOOD" (healthy, positive margin, manageable defaults, stable cash sequence) or "DOING BAD" (experiencing severe default rates, negative cash reserves, or collections failing to fund credit releases). Use a high-impact heading like "### 🟢 PACIFIC FINANCE IS DOING GOOD" or "### 🔴 PACIFIC FINANCE REQUIRES STRATEGIC BALANCING (DOING BAD IN SPECIFIC BRANCHES)" followed by 2-3 logical sentences explaining why.

        2. ### RELATIONSHIP BETWEEN COLLECTIONS AND DISBURSEMENTS
           Deconstruct how collections (cash inflows) and disbursements (cash outflows) correlate day-to-day. Do collections adequately self-fund the disbursement buffers? Highlight specific numbers.

        3. ### SEQUENTIAL CASH SUMMARY INSIGHTS
           Surgically review the sequential cash summaries. Highlight days where the closing carry balances dropped significantly, operational expenses caused drag, or banked amounts left safe cash flow vulnerability.

        4. ### SPECIALIZED IMPROVEMENT ADVICE (4-5 ACTIONABLE STEPS)
           Provide exactly 4 to 5 hyper-specific, actionable microfinance guidelines (e.g., credit policy tightening, district agent collection sweeps, liquid banking rules, daily release ceiling limits) to stabilize Pacific Finance Limited's operations in Malawi.

        Maintain an expert, objective, strict microcredit banking tone. Output clean Markdown with structured bullet points and bold financial values. Speak with numbers, omitting generic fluff.
      `;

      const response = await ai.models.generateContent({
        model: "gemini-3.5-flash",
        contents: prompt,
        config: {
          systemInstruction: "You are the lead AI auditor specializing in micro credit risk modeling, interest yields, and branch operational audits. Format your response cleanly using Markdown format with beautiful structural layouts. Avoid using buzzwords or marketing fluff. Speak directly with numbers and insights.",
        },
      });

      const text = response.text || "No insights could be generated by the model.";
      res.json({
        success: true,
        analysis: text
      });
    } catch (err: any) {
      console.error("Gemini API server analysis error: ", err);
      res.status(500).json({ error: "Failed to connect to the Gemini API layer. Direct: " + err.message });
    }
  });

  // Serve static assets in production, hook up Vite in development
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
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
    console.log(`Express custom server running on port ${PORT}`);
  });
}

startServer();
