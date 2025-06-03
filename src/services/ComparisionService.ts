// services/ComparisonService.ts
import {
  Policy,
  CoverageDetail,
  ChapterComparison,
  CoverageComparison,
  ComparisonResult,
  SignificantDifference,
} from "../types";
import { Anthropic } from "@anthropic-ai/sdk";
import { ExtractionService } from "./ExtractionService";

export class ComparisonService {
  private anthropic: Anthropic;
  private extractionService: ExtractionService;

  constructor(apiKey: string) {
    this.anthropic = new Anthropic({
      apiKey,
    });
    this.extractionService = new ExtractionService(apiKey);
  }

  /**
   * Compare two policies by extracting and comparing coverage details
   * @param policyA First policy to compare
   * @param policyB Second policy to compare
   * @returns Comprehensive comparison result
   */
  async comparePolicies(
    policyA: Policy,
    policyB: Policy
  ): Promise<ComparisonResult> {
    console.log(`Comparing policies: ${policyA.id} vs ${policyB.id}`);

    // Extract coverage details from both policies
    const coverageA = await this.extractionService.extractPolicyCoverage(
      policyA
    );
    const coverageB = await this.extractionService.extractPolicyCoverage(
      policyB
    );

    // Initialize comparison result
    const comparison: ComparisonResult = {
      policyAId: policyA.id,
      policyBId: policyB.id,
      policyAName: policyA.name,
      policyBName: policyB.name,
      chapterComparisons: {},
      significantDifferences: [],
      comparisonDate: new Date().toISOString(),
    };

    // Get all unique chapter titles
    const allChapters = new Set([
      ...Object.keys(coverageA),
      ...Object.keys(coverageB),
    ]);

    // Compare each chapter
    for (const chapterTitle of allChapters) {
      const chapterA = coverageA[chapterTitle] || {};
      const chapterB = coverageB[chapterTitle] || {};

      // Initialize chapter comparison
      comparison.chapterComparisons[chapterTitle] = {
        title: chapterTitle,
        coverageComparisons: {},
        missingInA: [],
        missingInB: [],
      };

      // Get all unique question IDs
      const allQuestionIds = new Set([
        ...Object.keys(chapterA),
        ...Object.keys(chapterB),
      ]);

      // Compare answers to each question
      for (const questionId of allQuestionIds) {
        const detailA = chapterA[questionId];
        const detailB = chapterB[questionId];

        // Handle missing coverage in policy A
        if (!detailA) {
          comparison.chapterComparisons[chapterTitle].missingInA.push(
            questionId
          );
          continue;
        }

        // Handle missing coverage in policy B
        if (!detailB) {
          comparison.chapterComparisons[chapterTitle].missingInB.push(
            questionId
          );
          continue;
        }

        // Compare the specific coverage details
        const coverageComparison = await this.compareSpecificCoverage(
          detailA,
          detailB
        );

        comparison.chapterComparisons[chapterTitle].coverageComparisons[
          questionId
        ] = coverageComparison;
      }
    }

    // Generate chapter summaries
    for (const chapterTitle of Object.keys(comparison.chapterComparisons)) {
      comparison.chapterComparisons[chapterTitle].summary =
        await this.generateChapterSummary(
          comparison.chapterComparisons[chapterTitle]
        );
    }

    // Identify significant differences
    comparison.significantDifferences =
      await this.identifySignificantDifferences(comparison);

    // Generate overall summary
    comparison.summary = await this.generateOverallSummary(comparison);

    return comparison;
  }

  /**
   * Compare two specific coverage details
   * @param detailA Coverage detail from policy A
   * @param detailB Coverage detail from policy B
   * @returns Comparison between the two details
   */
  private async compareSpecificCoverage(
    detailA: CoverageDetail,
    detailB: CoverageDetail
  ): Promise<CoverageComparison> {
    // If both are "no information found", return a simple comparison
    if (
      detailA.answer.includes("לא נמצא מידע") &&
      detailB.answer.includes("לא נמצא מידע")
    ) {
      return {
        policyA: detailA.answer,
        policyB: detailB.answer,
        difference: "אין מידע מספיק להשוואה",
        betterPolicy: "unknown",
        analysis: "לא ניתן לקבוע הבדל לאור העדר מידע בשתי הפוליסות",
      };
    }

    // Create a targeted comparison prompt
    const prompt = `
  <השוואה>
  שאלה: ${detailA.question}
  
  פוליסה A: ${detailA.answer}
  
  פוליסה B: ${detailB.answer}
  </השוואה>
  
  השווה בין שני פרטי הפוליסה באופן ישיר.
  1. חשב הבדלים מספריים (מוחלטים ובאחוזים)
  2. קבע איזו פוליסה מספקת כיסוי טוב יותר עבור היבט זה
  3. ציין מגבלות או תנאים חשובים בכל פוליסה
  
  החזר את הניתוח בפורמט JSON הבא:
  {
    "policyA": "סיכום כיסוי פוליסה A",
    "policyB": "סיכום כיסוי פוליסה B",
    "difference": "הפרש כמותי בין הפוליסות",
    "percentageDifference": "הפרש באחוזים אם רלוונטי",
    "betterPolicy": "A", "B", "equal", או "unknown",
    "analysis": "ניתוח קצר של ההבדל"
  }`;

    try {
      // Get comparison from Claude
      const response = await this.anthropic.messages.create({
        model: "claude-3-7-sonnet-20250219",
        max_tokens: 400,
        messages: [{ role: "user", content: prompt }],
      });

      const responseText = response.content[0].text.trim();

      // Parse JSON response
      try {
        // Try to extract JSON if it's wrapped in backticks
        const jsonMatch =
          responseText.match(/```json\n([\s\S]*?)\n```/) ||
          responseText.match(/```\n([\s\S]*?)\n```/) ||
          responseText.match(/{[\s\S]*}/);

        const jsonText = jsonMatch
          ? jsonMatch[1]
            ? jsonMatch[1]
            : jsonMatch[0]
          : responseText;

        const result = JSON.parse(jsonText);

        // Calculate financial impact if possible
        const financialImpact = this.extractFinancialImpact(result.difference);

        return {
          ...result,
          financialImpact,
        };
      } catch (e) {
        console.error("Failed to parse comparison response:", e, responseText);

        // Return a simple comparison with the raw text
        return {
          policyA: detailA.answer,
          policyB: detailB.answer,
          difference: "שגיאה בעיבוד ההשוואה",
          betterPolicy: "unknown",
          analysis: "לא ניתן לנתח את ההבדלים בצורה אוטומטית",
        };
      }
    } catch (error) {
      console.error("Error comparing coverage details:", error);

      // Return a fallback comparison
      return {
        policyA: detailA.answer,
        policyB: detailB.answer,
        difference: "שגיאה בהשוואה",
        betterPolicy: "unknown",
        analysis: "אירעה שגיאה בעת ביצוע ההשוואה",
      };
    }
  }

  /**
   * Extract a numerical financial impact from a difference string
   * @param differenceText The text describing the difference
   * @returns The financial impact as a number, or undefined if not found
   */
  private extractFinancialImpact(differenceText: string): number | undefined {
    if (!differenceText) return undefined;

    // Look for amount patterns like "500,000 ₪" or "₪ 500,000"
    const amountMatch = differenceText.match(/(\d[\d,]*(\.\d+)?)\s*₪/);
    if (amountMatch) {
      const amount = parseFloat(amountMatch[1].replace(/,/g, ""));
      if (!isNaN(amount)) {
        return amount;
      }
    }

    return undefined;
  }

  /**
   * Generate a summary for a chapter comparison
   * @param chapterComparison The chapter comparison to summarize
   * @returns A summary of the key differences in the chapter
   */
  private async generateChapterSummary(
    chapterComparison: ChapterComparison
  ): Promise<string> {
    // Create a summary of all the comparisons in this chapter
    const comparisonSummaries = Object.entries(
      chapterComparison.coverageComparisons
    )
      .map(([questionId, comparison]) => {
        return `- ${comparison.policyA} (פוליסה A) לעומת ${comparison.policyB} (פוליסה B): ${comparison.difference}`;
      })
      .join("\n");

    // Add info about missing details
    const missingDetails = [
      ...chapterComparison.missingInA.map((q) => `- פרט חסר בפוליסה A: ${q}`),
      ...chapterComparison.missingInB.map((q) => `- פרט חסר בפוליסה B: ${q}`),
    ].join("\n");

    // Create a prompt to generate a summary
    const prompt = `
  <פרטי_השוואת_פרק>
  פרק: ${chapterComparison.title}
  
  השוואות:
  ${comparisonSummaries}
  
  פרטים חסרים:
  ${missingDetails}
  </פרטי_השוואת_פרק>
  
  סכם את ההבדלים העיקריים בין שתי הפוליסות בפרק זה. התמקד בהבדלים המשמעותיים ביותר מבחינה כספית ומעשית למבוטח. הסיכום צריך להיות תמציתי (עד 3 משפטים).
  `;

    try {
      // Get summary from Claude
      const response = await this.anthropic.messages.create({
        model: "claude-3-7-sonnet-20250219",
        max_tokens: 200,
        messages: [{ role: "user", content: prompt }],
      });

      return response.content[0].text.trim();
    } catch (error) {
      console.error("Error generating chapter summary:", error);
      return "לא ניתן לייצר סיכום אוטומטי לפרק זה";
    }
  }

  /**
   * Identify the most significant differences between policies
   * @param comparison The full comparison result
   * @returns Array of significant differences
   */
  private async identifySignificantDifferences(
    comparison: ComparisonResult
  ): Promise<SignificantDifference[]> {
    // Create a structured summary of all the differences
    const differenceSummary = Object.entries(comparison.chapterComparisons)
      .map(([chapterTitle, chapterComparison]) => {
        return (
          `## ${chapterTitle}\n` +
          Object.entries(chapterComparison.coverageComparisons)
            .map(
              ([questionId, comp]) =>
                `- ${comp.policyA} (פוליסה A) לעומת ${comp.policyB} (פוליסה B)\n  - הבדל: ${comp.difference}\n  - ניתוח: ${comp.analysis}`
            )
            .join("\n\n")
        );
      })
      .join("\n\n");

    // Create a prompt to identify the most significant differences
    const prompt = `
  <סיכום_הבדלים>
  ${differenceSummary}
  </סיכום_הבדלים>
  
  בהתבסס על הסיכום לעיל של כל ההבדלים בין שתי פוליסות הביטוח, זהה את 3 ההבדלים המשמעותיים ביותר מבחינת ההשפעה הכספית והחשיבות המעשית למבוטח.
  
  עבור כל הבדל משמעותי:
  1. כמת את ההשפעה הכספית המדויקת
  2. הסבר את ההשלכות המעשיות
  3. ציין איזו פוליסה עדיפה בהיבט זה ובכמה
  
  החזר את הניתוח כמערך JSON עם 3 אובייקטים, כל אחד מכיל:
  [
    {
      "aspect": "היבט הכיסוי",
      "chapter": "שם הפרק",
      "financialImpact": "השפעה כספית מכומתת",
      "practicalImplication": "השלכה מעשית למבוטח",
      "betterPolicy": "A", "B", או "equal"
    },
    ...
  ]
  `;

    try {
      // Get analysis from Claude
      const response = await this.anthropic.messages.create({
        model: "claude-3-7-sonnet-20250219",
        max_tokens: 1000,
        messages: [{ role: "user", content: prompt }],
      });

      const responseText = response.content[0].text.trim();

      // Parse JSON response
      try {
        // Try to extract JSON if it's wrapped in backticks
        const jsonMatch =
          responseText.match(/```json\n([\s\S]*?)\n```/) ||
          responseText.match(/```\n([\s\S]*?)\n```/) ||
          responseText.match(/\[\s*\{[\s\S]*\}\s*\]/);

        const jsonText = jsonMatch
          ? jsonMatch[1]
            ? jsonMatch[1]
            : jsonMatch[0]
          : responseText;

        return JSON.parse(jsonText);
      } catch (e) {
        console.error(
          "Failed to parse significant differences response:",
          e,
          responseText
        );
        return [];
      }
    } catch (error) {
      console.error("Error identifying significant differences:", error);
      return [];
    }
  }

  /**
   * Generate an overall summary of the comparison
   * @param comparison The full comparison result
   * @returns A summary of the key differences between policies
   */
  private async generateOverallSummary(
    comparison: ComparisonResult
  ): Promise<string> {
    // Use significant differences to create a summary
    const sigDiffText = comparison.significantDifferences
      .map((diff, index) => {
        return `${index + 1}. ${diff.aspect} (${diff.chapter}): ${
          diff.financialImpact
        }. ${diff.practicalImplication}`;
      })
      .join("\n\n");

    // Create a prompt to generate a summary
    const prompt = `
  <השוואת_פוליסות>
  פוליסה A: ${comparison.policyAName || comparison.policyAId}
  פוליסה B: ${comparison.policyBName || comparison.policyBId}
  
  הבדלים משמעותיים:
  ${sigDiffText}
  </השוואת_פוליסות>
  
  כתוב סיכום קצר וממוקד (עד 5 משפטים) של ההבדלים העיקריים בין שתי פוליסות הביטוח. התמקד בהשלכות הכספיות והמעשיות למבוטח. אם אחת הפוליסות עדיפה באופן כללי, ציין זאת באופן ברור ומנומק.
  `;

    try {
      // Get summary from Claude
      const response = await this.anthropic.messages.create({
        model: "claude-3-7-sonnet-20250219",
        max_tokens: 300,
        messages: [{ role: "user", content: prompt }],
      });

      return response.content[0].text.trim();
    } catch (error) {
      console.error("Error generating overall summary:", error);
      return "לא ניתן לייצר סיכום השוואה אוטומטי";
    }
  }
}
