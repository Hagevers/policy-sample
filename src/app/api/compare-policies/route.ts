// pages/api/compare-policies.ts
import { ComparisonService } from "@/services/ComparisionService";
import { ReportService } from "@/services/ReportService";
import { Policy, ReportOptions } from "@/types";
import { NextApiRequest, NextApiResponse } from "next";
import { NextResponse } from "next/server";

export async function POST(req: NextApiRequest, res: NextApiResponse) {
  try {
    const {
      policyA,
      policyB,
      chapters,
      reportOptions = { format: "markdown" },
    } = req.body as {
      policyA: Policy;
      policyB: Policy;
      chapters?: string[];
      reportOptions?: ReportOptions;
    };

    // Validate policies
    if (!policyA || !policyB) {
      return res.status(400).json({ error: "Both policies are required" });
    }

    if (
      Object.keys(policyA.chapters).length === 0 ||
      Object.keys(policyB.chapters).length === 0
    ) {
      return res
        .status(400)
        .json({ error: "Both policies must have at least one chapter" });
    }

    // Get API key
    const apiKey = process.env.ANTHROPIC_API_KEY;
    if (!apiKey) {
      return res.status(500).json({ error: "API key not configured" });
    }

    // Track token usage and costs
    const tokenUsage = {
      input: 0,
      output: 0,
      estimatedCost: 0,
    };

    // Create services
    const comparisonService = new ComparisonService(apiKey);
    const reportService = new ReportService();

    // Filter chapters if specified
    if (chapters && chapters.length > 0) {
      policyA.chapters = Object.fromEntries(
        Object.entries(policyA.chapters).filter(([title]) =>
          chapters.includes(title)
        )
      );

      policyB.chapters = Object.fromEntries(
        Object.entries(policyB.chapters).filter(([title]) =>
          chapters.includes(title)
        )
      );
    }

    // Performance tracking
    const startTime = Date.now();

    // Compare policies
    const comparison = await comparisonService.comparePolicies(
      policyA,
      policyB
    );

    // Generate report
    const report = reportService.generateReport(
      comparison,
      policyA,
      policyB,
      reportOptions
    );

    // Calculate performance metrics
    const endTime = Date.now();
    const processingTime = endTime - startTime;

    // Simple token usage estimation
    // This is a rough estimate - actual token count would require proper tokenization
    const totalChars =
      Object.values(policyA.chapters).reduce(
        (sum, ch) => sum + ch.content.length,
        0
      ) +
      Object.values(policyB.chapters).reduce(
        (sum, ch) => sum + ch.content.length,
        0
      );

    // Rough estimation: 4 characters per token for Hebrew text
    const estimatedTokens = Math.ceil(totalChars / 4);

    // Rough cost estimation (based on targeted questioning approach)
    // Approximately 25% of tokens are used for API calls
    const apiTokens = Math.ceil(estimatedTokens * 0.25);

    // Claude 3.7 Sonnet pricing (as of the time of writing)
    const inputPrice = 15 / 1000000; // $15 per million tokens
    const outputPrice = 75 / 1000000; // $75 per million tokens

    // Assume 75% input, 25% output tokens for API calls
    const inputTokens = Math.ceil(apiTokens * 0.75);
    const outputTokens = Math.ceil(apiTokens * 0.25);

    const estimatedCost = inputTokens * inputPrice + outputTokens * outputPrice;

    tokenUsage.input = inputTokens;
    tokenUsage.output = outputTokens;
    tokenUsage.estimatedCost = estimatedCost;

    return NextResponse.json({
      comparison,
      report,
      meta: {
        processingTime,
        tokenUsage,
        policyAChapters: Object.keys(policyA.chapters).length,
        policyBChapters: Object.keys(policyB.chapters).length,
        reportFormat: reportOptions.format,
      },
    });
  } catch (error) {
    console.error("Error comparing policies:", error);
    return NextResponse.json(
      {
        error: `Error comparing policies: ${
          error instanceof Error ? error.message : String(error)
        }`,
      },
      { status: 500 }
    );
  }
}
