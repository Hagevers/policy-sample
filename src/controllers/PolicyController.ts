// controllers/PolicyController.ts
import {
  Policy,
  ComparisonResult,
  ReportOptions,
  PolicyAnalytics,
} from "../types";
import { ExtractionService } from "../services/ExtractionService";
import { ReportService } from "../services/ReportService";
import { ComparisonService } from "@/services/ComparisionService";

/**
 * Controller to manage the policy comparison workflow
 */
export class PolicyController {
  private extractionService: ExtractionService;
  private comparisonService: ComparisonService;
  private reportService: ReportService;

  constructor(apiKey: string) {
    this.extractionService = new ExtractionService(apiKey);
    this.comparisonService = new ComparisonService(apiKey);
    this.reportService = new ReportService();
  }

  /**
   * Compare two policies end-to-end
   * @param policyA First policy
   * @param policyB Second policy
   * @param reportOptions Options for report generation
   * @returns Comparison results and report
   */
  async comparePolices(
    policyA: Policy,
    policyB: Policy,
    reportOptions: ReportOptions = { format: "markdown" }
  ): Promise<{
    comparison: ComparisonResult;
    report: string;
    analytics: {
      policyA: PolicyAnalytics;
      policyB: PolicyAnalytics;
      total: PolicyAnalytics;
    };
  }> {
    const startTime = Date.now();

    // Compare policies
    const comparison = await this.comparisonService.comparePolicies(
      policyA,
      policyB
    );

    // Generate report
    const report = this.reportService.generateReport(
      comparison,
      policyA,
      policyB,
      reportOptions
    );

    // Calculate analytics
    const endTime = Date.now();
    const processingTime = endTime - startTime;

    // Calculate token usage for each policy
    const policyATokens = this.estimateTokenUsage(policyA);
    const policyBTokens = this.estimateTokenUsage(policyB);

    // Calculate costs
    const inputPrice = 15 / 1000000; // $15 per million tokens
    const outputPrice = 75 / 1000000; // $75 per million tokens

    // Assume 75% input, 25% output for API calls
    const policyAInput = Math.ceil(policyATokens * 0.75 * 0.25); // Only 25% of tokens are sent to API
    const policyAOutput = Math.ceil(policyATokens * 0.25 * 0.25);
    const policyACost = policyAInput * inputPrice + policyAOutput * outputPrice;

    const policyBInput = Math.ceil(policyBTokens * 0.75 * 0.25);
    const policyBOutput = Math.ceil(policyBTokens * 0.25 * 0.25);
    const policyBCost = policyBInput * inputPrice + policyBOutput * outputPrice;

    // Create analytics objects
    const policyAAnalytics: PolicyAnalytics = {
      policyId: policyA.id,
      tokenCount: policyATokens,
      processingTime: processingTime / 2, // Approximate
      chapterCount: Object.keys(policyA.chapters).length,
      extractedCoverageCount: this.countExtractedCoverage(
        comparison,
        policyA.id
      ),
      confidenceAverage: this.calculateConfidenceAverage(
        comparison,
        policyA.id
      ),
      cost: policyACost,
    };

    const policyBAnalytics: PolicyAnalytics = {
      policyId: policyB.id,
      tokenCount: policyBTokens,
      processingTime: processingTime / 2, // Approximate
      chapterCount: Object.keys(policyB.chapters).length,
      extractedCoverageCount: this.countExtractedCoverage(
        comparison,
        policyB.id
      ),
      confidenceAverage: this.calculateConfidenceAverage(
        comparison,
        policyB.id
      ),
      cost: policyBCost,
    };

    const totalAnalytics: PolicyAnalytics = {
      policyId: "total",
      tokenCount: policyATokens + policyBTokens,
      processingTime,
      chapterCount:
        Object.keys(policyA.chapters).length +
        Object.keys(policyB.chapters).length,
      extractedCoverageCount:
        policyAAnalytics.extractedCoverageCount +
        policyBAnalytics.extractedCoverageCount,
      confidenceAverage:
        (policyAAnalytics.confidenceAverage +
          policyBAnalytics.confidenceAverage) /
        2,
      cost: policyACost + policyBCost,
    };

    return {
      comparison,
      report,
      analytics: {
        policyA: policyAAnalytics,
        policyB: policyBAnalytics,
        total: totalAnalytics,
      },
    };
  }

  /**
   * Estimate token usage for a policy
   * @param policy The policy to estimate tokens for
   * @returns Estimated token count
   */
  private estimateTokenUsage(policy: Policy): number {
    // Rough estimation: 4 characters per token for Hebrew text
    const totalChars = Object.values(policy.chapters).reduce(
      (sum, chapter) => sum + chapter.content.length,
      0
    );

    return Math.ceil(totalChars / 4);
  }

  /**
   * Count the number of extracted coverage details for a policy
   * @param comparison The comparison result
   * @param policyId The policy ID to count for
   * @returns Count of extracted coverage details
   */
  private countExtractedCoverage(
    comparison: ComparisonResult,
    policyId: string
  ): number {
    let count = 0;

    Object.values(comparison.chapterComparisons).forEach(
      (chapterComparison) => {
        // Count coverage comparisons
        count += Object.keys(chapterComparison.coverageComparisons).length;

        // Count missing items
        if (policyId === comparison.policyAId) {
          count += chapterComparison.missingInB.length;
        } else {
          count += chapterComparison.missingInA.length;
        }
      }
    );

    return count;
  }

  /**
   * Calculate the average confidence for a policy's extracted data
   * This is a placeholder - in a real implementation, we would track confidence scores
   * @returns An average confidence score (0-1)
   */
  private calculateConfidenceAverage(
    comparison: ComparisonResult,
    policyId: string
  ): number {
    // This would normally calculate the average confidence of all extractions
    // We're setting a default value since we don't have real confidence scores in this example
    return 0.85;
  }
}
