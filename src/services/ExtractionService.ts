import { getQuestionsForChapter } from "@/data/chapter-questions";
import { ChapterQuestion, Policy } from "../types";
import { Anthropic } from "@anthropic-ai/sdk";
export class ExtractionService {
  private anthropic: Anthropic;
  private extractionQueue: Array<() => Promise<void>> = [];
  private processingQueue = false;

  constructor(apiKey: string) {
    this.anthropic = new Anthropic({ apiKey });
  }

  /**
   * Main method to extract coverage from entire policy
   */
  async extractPolicyCoverage(
    policy: Policy
  ): Promise<Record<string, Record<string, string>>> {
    const coverageByChapter: Record<string, Record<string, string>> = {};

    // Process each chapter
    for (const [chapterTitle, chapter] of Object.entries(policy.chapters)) {
      console.log(`Extracting coverage for chapter: ${chapterTitle}`);

      // Get questions for this chapter
      const questions = getQuestionsForChapter(chapterTitle);

      if (questions.length === 0) {
        console.log(`No questions found for chapter: ${chapterTitle}`);
        continue;
      }

      console.log(
        `Found ${questions.length} questions for chapter: ${chapterTitle}`
      );

      // Use the new batched method
      const chapterCoverage = await this.extractChapterCoverageInBatches(
        chapter.content,
        questions,
        2 // Process 2 questions at a time to avoid rate limits
      );

      coverageByChapter[chapterTitle] = chapterCoverage;
    }

    return coverageByChapter;
  }

  /**
   * Extract specific detail from chapter content with rate limit handling
   */
  async extractSpecificDetail(
    chapterContent: string,
    question: ChapterQuestion
  ): Promise<string> {
    // console.log(`Extracting specific detail for: ${question.question}`);
    // console.log("content:", chapterContent);

    return new Promise((resolve, reject) => {
      // Add to queue instead of executing immediately
      this.extractionQueue.push(async () => {
        try {
          // Only send relevant sections of the chapter content
          const relevantContent = this.extractRelevantSection(
            chapterContent,
            question.keywords
          );

          //   console.log(`Extracting for: ${question.question}`);
          console.log("Relevant content:", relevantContent);

          const prompt = `
            אנא חלץ מידע ספציפי מפוליסת ביטוח בריאות.
            
            שאלה: ${question.question}
            
            תוכן הפרק:
            ${relevantContent}
            
            אנא תן תשובה קצרה וברורה לשאלה. אם המידע אינו מופיע בתוכן, ציין "לא מפורט".
            `;

          // Get answer from Claude with reduced max_tokens
          const response = await this.anthropic.messages.create({
            model: "claude-3-7-sonnet-20250219",
            max_tokens: 150,
            messages: [{ role: "user", content: prompt }],
          });

          resolve(response.content[0].text);
        } catch (error: any) {
          if (error?.status === 429) {
            // Handle rate limit by re-adding to queue with backoff
            console.log("Rate limit hit, will retry after delay");
            // Add back to queue but wait longer
            setTimeout(() => {
              this.extractionQueue.push(async () => {
                try {
                  // Try again with a simpler/shorter prompt
                  const simplePrompt = `
                    חלץ מידע: "${question.question}"
                    מתוך: "${this.getVeryBriefExcerpt(
                      chapterContent,
                      question.keywords
                    )}"
                    `;

                  const response = await this.anthropic.messages.create({
                    model: "claude-3-7-sonnet-20250219",
                    max_tokens: 50,
                    messages: [{ role: "user", content: simplePrompt }],
                  });

                  resolve(response.content[0].text);
                } catch (retryError) {
                  reject(retryError);
                }
              });
              // Start processing queue if needed
              if (!this.processingQueue) {
                this.processQueue();
              }
            }, 5000); // Wait 5 seconds before adding back to queue
          } else {
            reject(error);
          }
        }
      });

      // Start processing queue if not already running
      if (!this.processingQueue) {
        this.processQueue();
      }
    });
  }

  /**
   * Process queue with rate limiting
   */
  private async processQueue() {
    this.processingQueue = true;

    while (this.extractionQueue.length > 0) {
      const task = this.extractionQueue.shift();
      if (task) {
        await task();
        // Add delay between requests to avoid rate limits
        await sleep(2000); // 2 second delay between requests
      }
    }

    this.processingQueue = false;
  }

  /**
   * Extract only relevant sections based on keywords to reduce prompt size
   */
  private extractRelevantSection(content: string, keywords: string[]): string {
    if (!content || keywords.length === 0) {
      return content?.substring(0, 1500) || "";
    }

    console.log("content:", content);
    const normalizedKeywords = keywords.map((k) => this.normalizeText(k));
    console.log("normalizedKeywords:", normalizedKeywords);

    // Split into sections without relying on newlines
    const sections = content
      .split(/(פרק\s+[א-ת]'|\d+\.\s+|\d+\.\d+\.\s+|\d+\.\d+\.\d+\.\s+)/i)
      .filter(Boolean)
      .reduce((acc, curr, i, arr) => {
        if (i % 2 === 0 && arr[i + 1]) {
          const section = curr + arr[i + 1];
          acc.push(section.substring(0, 1000)); // Limit size for context
        }
        return acc;
      }, [] as string[]);

    console.log(
      "sections:",
      sections.map((s) => s.substring(0, 100) + "...")
    );

    const scoredSections = sections.map((section) => {
      const normalizedSection = this.normalizeText(section);

      let score = 0;
      let matchCount = 0;
      const keywordsFound: string[] = [];

      // Keyword matching
      for (const keyword of normalizedKeywords) {
        if (normalizedSection.includes(keyword)) {
          score += 15;
          matchCount++;
          keywordsFound.push(keyword);
        }
      }

      // Boost for monetary amounts
      const moneyMatches = normalizedSection.match(/[₪$]\s*[\d,]+/g) || [];
      if (moneyMatches.length > 0) {
        score += 20;
        const maxAmount = Math.max(
          ...moneyMatches.map((m) => parseInt(m.replace(/[^0-9]/g, ""), 10))
        );
        if (maxAmount >= 1000000) score += 60; // Huge boost for millions
        else if (maxAmount >= 100000) score += 30; // Medium boost
      }

      // Boost for "maximum" or top-level sections
      if (normalizedSection.includes("מרבי") || section.match(/^\d+\.\s+/)) {
        score += 30;
      }

      // Boost for multiple keywords or keyword + large amount
      if (matchCount >= 2 || (matchCount >= 1 && moneyMatches.length > 0)) {
        score += 25;
      }

      return { section, score, matchCount, keywordsFound };
    });

    // Log all scored sections for debugging
    console.log(
      "scoredSections:",
      scoredSections.map((s) => ({
        section: s.section.substring(0, 100) + "...",
        score: s.score,
        matchCount: s.matchCount,
        keywordsFound: s.keywordsFound,
      }))
    );

    // Sort and filter sections
    const topSections = scoredSections
      .filter((item) => item.score >= 50) // Higher threshold to focus on key sections
      .sort((a, b) => b.score - a.score)
      .slice(0, 2);

    if (topSections.length > 0) {
      console.log(
        "Matched Sections:",
        topSections.map((s) => ({
          section: s.section.substring(0, 100) + "...",
          score: s.score,
          matchCount: s.matchCount,
          keywordsFound: s.keywordsFound,
        }))
      );
      return topSections
        .map((item) => item.section)
        .join("\n\n")
        .substring(0, 2000);
    }

    // Fallback: Split by sentences
    const paragraphs = content.split(/[.!?]\s+|\s{2,}/);
    const relevantParagraphs = paragraphs.filter((paragraph) =>
      normalizedKeywords.some((keyword) =>
        this.normalizeText(paragraph).includes(keyword)
      )
    );

    if (relevantParagraphs.length > 0) {
      return relevantParagraphs.slice(0, 3).join("\n\n").substring(0, 2000);
    }

    return content.substring(0, 1500);
  }

  private normalizeText(text: string): string {
    return text
      .toLowerCase()
      .replace(/['".,()–—:;]/g, " ")
      .replace(/\s+/g, " ")
      .trim();
  }

  /**
   * Get very brief excerpt for retry attempts
   */
  private getVeryBriefExcerpt(content: string, keywords: string[]): string {
    // Get sentences containing keywords
    const sentences = content.split(/(?<=[.!?])\s+/);
    const relevantSentences = sentences.filter((sentence) =>
      keywords.some((keyword) => sentence.includes(keyword))
    );

    // Take up to 3 relevant sentences or first 300 chars (reduced sizes)
    const excerpt = relevantSentences.slice(0, 3).join(" ");
    return excerpt.length > 0 ? excerpt : content.substring(0, 300);
  }

  /**
   * Process questions in batches to manage rate limits
   */
  async extractChapterCoverageInBatches(
    chapterContent: string,
    questions: ChapterQuestion[],
    batchSize: number = 2
  ): Promise<Record<string, string>> {
    const results: Record<string, string> = {};

    // Process in small batches
    for (let i = 0; i < questions.length; i += batchSize) {
      const batch = questions.slice(i, i + batchSize);
      console.log(
        `Processing batch ${Math.floor(i / batchSize) + 1} of ${Math.ceil(
          questions.length / batchSize
        )}`
      );

      console.log(batch);

      // Process questions in this batch sequentially to avoid rate limits
      for (const question of batch) {
        try {
          console.log(`Extracting: ${question.question}`);
          const answer = await this.extractSpecificDetail(
            chapterContent,
            question
          );
          results[question.id] = answer;
          console.log(`Extracted answer for ${question.id}`);
        } catch (error) {
          console.error(`Error extracting for ${question.id}:`, error);
          results[question.id] = "שגיאה בעת חילוץ המידע";
        }

        // Wait between questions in the same batch
        await sleep(1000);
      }

      // Wait longer between batches
      if (i + batchSize < questions.length) {
        console.log(`Waiting between batches to avoid rate limits...`);
        await sleep(5000); // 5 seconds between batches
      }
    }

    return results;
  }
}

const sleep = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));
