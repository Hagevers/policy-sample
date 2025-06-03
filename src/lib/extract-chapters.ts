import { Chapter } from "@/types";

/**
 * Extract chapters from policy text with intelligent deduplication
 * @param policyText The full text of the policy document
 * @returns Record of chapter title to chapter content
 */
export function extractChapters(policyText: string): Record<string, Chapter> {
  // Define patterns to match chapter headers
  const chapterPattern = /פרק\s+([א-ת]'?)[:'"\s]\s*([^\n\.]+)/g;

  // Track all potential chapters with their identifiers
  type PotentialChapter = {
    id: string; // Hebrew letter identifier (א, ב, ג, etc.)
    fullTitle: string; // Complete chapter title
    position: number; // Position in document
    content: string; // Chapter content with preserved formatting
    contentScore: number; // Quality score
  };

  const potentialChapters: PotentialChapter[] = [];
  let match;

  // Reset regex pattern
  chapterPattern.lastIndex = 0;

  // Find all potential chapters
  while ((match = chapterPattern.exec(policyText)) !== null) {
    const hebrewLetter = match[1].trim();
    const chapterTitle = match[2].trim();
    const fullTitle = `פרק ${hebrewLetter}: ${chapterTitle}`;
    const position = match.index;

    // Look at next 500 chars to evaluate quality
    const nextText = policyText.substring(
      position,
      Math.min(position + 500, policyText.length)
    );

    // Calculate initial quality score based on content indicators
    let contentScore = 0;

    // Check for indicators of detailed content
    if (/\n\s*\d+\s*\./.test(nextText)) {
      contentScore += 5; // Has numbered sections
    }

    // Check for common headers of detailed content section
    if (
      nextText.includes("הגדרות") ||
      nextText.includes("מקרה הביטוח") ||
      nextText.includes("הכיסוי הביטוחי") ||
      nextText.includes("התחייבות החברה") ||
      nextText.includes("תגמולי ביטוח")
    ) {
      contentScore += 10;
    }

    // Add the potential chapter for later processing
    potentialChapters.push({
      id: hebrewLetter,
      fullTitle,
      position,
      content: "", // Will be populated later with preserved formatting
      contentScore,
    });
  }

  console.log(`Found ${potentialChapters.length} potential chapter headers`);

  // Extract content for each potential chapter
  for (let i = 0; i < potentialChapters.length; i++) {
    const current = potentialChapters[i];

    // Find the next chapter position
    const nextPosition =
      i < potentialChapters.length - 1
        ? potentialChapters[i + 1].position
        : policyText.length;

    // Extract content between this header and the next, preserving original formatting
    const content = policyText.substring(current.position, nextPosition);
    // Only trim leading/trailing whitespace if needed, preserving internal newlines
    current.content = content.trim(); // You can remove .trim() if you want all spacing preserved

    // // Log a snippet to verify formatting
    // console.log(
    //   `Chapter "${current.fullTitle}" content snippet:`,
    //   content.substring(0, 200)
    // );

    // Adjust content score based on actual content
    const contentLines = content.split("\n").length;
    const contentLength = content.length;

    // Substantial content scores higher
    if (contentLength > 5000) {
      current.contentScore += 20;
    } else if (contentLength > 2500) {
      current.contentScore += 10;
    } else if (contentLength > 1000) {
      current.contentScore += 5;
    }

    // More lines indicates better structure
    if (contentLines > 50) {
      current.contentScore += 10;
    } else if (contentLines > 25) {
      current.contentScore += 5;
    }

    // Presence of structured formatting is good
    const hasStructuredContent =
      /\d+\.\d+\.\d+|\d+\.\d+/.test(content) || // Numbered sections
      content.includes("סעיף") || // Sections
      content.includes("חריגים") || // Exclusions
      content.includes("תקופת"); // Period terms

    if (hasStructuredContent) {
      current.contentScore += 10;
    }

    // Penalize very short content or table of contents entries
    if (contentLength < 1000 || content.includes("תוכן עניינים")) {
      current.contentScore -= 15;
    }
  }

  // Group chapters by their ID (א, ב, ג, etc.)
  const groupedByID: Record<string, PotentialChapter[]> = {};

  for (const chapter of potentialChapters) {
    if (!groupedByID[chapter.id]) {
      groupedByID[chapter.id] = [];
    }
    groupedByID[chapter.id].push(chapter);
  }

  console.log(
    `Found ${Object.keys(groupedByID).length} unique chapter identifiers`
  );

  // Select the best version of each chapter
  const bestChapters: PotentialChapter[] = [];

  for (const id in groupedByID) {
    const versions = groupedByID[id];

    // Sort by content score (highest first)
    versions.sort((a, b) => b.contentScore - a.contentScore);

    // Log for debugging
    console.log(
      `Chapter ${id} has ${versions.length} versions. Best score: ${versions[0].contentScore}`
    );

    // Add the best version of this chapter
    bestChapters.push(versions[0]);
  }

  // Sort by position to maintain document order
  bestChapters.sort((a, b) => a.position - b.position);

  // Convert to the expected Chapter format
  const chapters: Record<string, Chapter> = {};

  for (const chapter of bestChapters) {
    // Only include chapters with substantial content (minimum 200 chars)
    if (chapter.content.length >= 200) {
      chapters[chapter.fullTitle] = {
        title: chapter.fullTitle,
        content: chapter.content, // Content with preserved newlines
        position: chapter.position,
      };

      // console.log(
      //   `Selected chapter: "${chapter.fullTitle}" with ${chapter.content.length} chars`
      // );
    }
  }

  return chapters;
}

/**
 * Enhanced function to extract chapters from policy text with page tracking
 * @param policyText The full text of the policy document
 * @param pageBreaks Array of positions where new pages begin in the text
 * @returns Record of chapter title to chapter content
 */
export function extractChaptersWithPages(
  policyText: string,
  pageBreaks: number[]
): Record<string, Chapter> {
  const basicChapters = extractChapters(policyText);
  const chaptersWithPages: Record<string, Chapter> = {};

  // Add page numbers to each chapter
  for (const [title, chapter] of Object.entries(basicChapters)) {
    const startPage = findPageNumber(chapter.position, pageBreaks);

    // Find the end position of this chapter (start of next chapter or end of document)
    let endPosition = policyText.length;
    let endPage = findPageNumber(endPosition, pageBreaks);

    // Calculate end position based on the next chapter
    const allPositions = Object.values(basicChapters)
      .map((ch) => ch.position)
      .sort((a, b) => a - b);

    const nextPosition = allPositions.find((pos) => pos > chapter.position);
    if (nextPosition) {
      endPosition = nextPosition;
      endPage = findPageNumber(endPosition, pageBreaks);
    }

    chaptersWithPages[title] = {
      ...chapter,
      pageNumbers: [startPage, endPage],
    };
  }

  return chaptersWithPages;
}

/**
 * Helper function to find the page number for a given position in text
 */
function findPageNumber(position: number, pageBreaks: number[]): number {
  let pageNum = 1;
  for (const breakPos of pageBreaks) {
    if (position < breakPos) {
      break;
    }
    pageNum++;
  }
  return pageNum;
}
/**
 * Represents a subsection in the structured format
 */
interface SubSection {
  subsection_id: string;
  content: string;
}

/**
 * Represents a section in the structured format
 */
interface Section {
  section_id: string;
  title: string;
  content: string;
  subsections?: SubSection[];
}

/**
 * Represents a chapter in the structured format
 */
interface StructuredChapter {
  chapter_id: string;
  title: string;
  sections: Section[];
}

/**
 * Represents the complete formatted policy document
 */
interface FormattedPolicy {
  title: string;
  chapters: StructuredChapter[];
}
/**
 * Formats a chapter's content into a structured format with sections and subsections
 * This version is specifically designed to handle PDF-extracted text with limited formatting
 *
 * @param chapterId The ID of the chapter
 * @param chapterTitle The title of the chapter
 * @param chapterContent The raw content of the chapter
 * @returns A structured chapter object with sections and subsections
 */
export function formatChapter(
  chapterId: string,
  chapterTitle: string,
  chapterContent: string
): StructuredChapter {
  // Extract the clean chapter ID from the title
  const chapterIdMatch = chapterTitle.match(/פרק\s+([א-ת]'?)[:\-]/);
  const hebrewChapterId = chapterIdMatch ? chapterIdMatch[1] : "";
  const numericChapterId = convertHebrewChapterToNumber(hebrewChapterId);

  // Extract clean title (remove chapter prefix and any trailing numbers)
  const titleMatch = chapterTitle.match(
    /פרק\s+[א-ת]'?[:\-]\s*(.*?)(?:\s+\d+)?$/
  );
  const cleanTitle = titleMatch ? titleMatch[1].trim() : chapterTitle;

  // Initialize the structured chapter
  const structuredChapter: StructuredChapter = {
    chapter_id: numericChapterId || chapterId,
    title: cleanTitle,
    sections: [],
  };

  // Since the text is in a single line with no proper line breaks,
  // we need to use regex to identify section and subsection patterns

  // First, try to split the content at section boundaries
  // Look for patterns like "1. ", "1.1. ", "2. " etc.
  const sectionRegex = /(\d+(?:\.\d+)?)\s*\.\s*/g;

  let match;
  // const lastIndex = 0;
  const sections: { id: string; content: string }[] = [];

  // Find all section markers in the text
  const matches: { index: number; id: string }[] = [];
  while ((match = sectionRegex.exec(chapterContent)) !== null) {
    matches.push({
      index: match.index,
      id: match[1].trim(),
    });
  }

  // Use the section markers to split the content
  for (let i = 0; i < matches.length; i++) {
    const currentMatch = matches[i];
    const nextMatch = i < matches.length - 1 ? matches[i + 1] : null;

    const startIndex = currentMatch.index;
    const endIndex = nextMatch ? nextMatch.index : chapterContent.length;

    // Extract section content
    const sectionContent = chapterContent
      .substring(startIndex, endIndex)
      .trim();

    sections.push({
      id: currentMatch.id,
      content: sectionContent,
    });
  }

  // If no sections were found, add the whole content as a single section
  if (sections.length === 0 && chapterContent.trim()) {
    sections.push({
      id: "1",
      content: chapterContent,
    });
  }

  // Now process each section to extract title, content, and subsections
  for (const section of sections) {
    // Try to extract title and content from section
    // Remove the section number prefix from the content
    const cleanContent = section.content.replace(
      new RegExp(`^${section.id}\\s*\\.\\s*`),
      ""
    );

    // Try to identify if there's a title
    let sectionTitle = "";
    let sectionContent = cleanContent;

    // Look for quoted text that might be a title
    const quotedTitleMatch = cleanContent.match(/^[״"]([^״"]+)[״"]/);
    if (quotedTitleMatch) {
      sectionTitle = quotedTitleMatch[1].trim();
      sectionContent = cleanContent
        .substring(quotedTitleMatch[0].length)
        .trim();
    }
    // Look for text followed by a dash or colon that might be a title
    else {
      const titleContentMatch = cleanContent.match(/^([^-:]+)(?:[-:])(.*)/);
      if (titleContentMatch) {
        sectionTitle = titleContentMatch[1].trim();
        sectionContent = titleContentMatch[2].trim();
      }
    }

    // If still no title, try looking for natural breaks like periods
    if (!sectionTitle && sectionContent.includes(".")) {
      const firstSentence = sectionContent.split(".")[0];
      // If the first sentence is reasonably short, it might be a title
      if (firstSentence.length < 60) {
        sectionTitle = firstSentence.trim();
        sectionContent = sectionContent
          .substring(firstSentence.length + 1)
          .trim();
      }
    }

    // Create a new section object
    const newSection: Section = {
      section_id: section.id,
      title: sectionTitle || `סעיף ${section.id}`,
      content: sectionContent,
      subsections: [],
    };

    // Find subsections in the content
    // Look for patterns like "1.1.1 ", "1.2.3 " etc.
    const subsectionRegex = new RegExp(
      `${section.id}\\.(\\d+)\\s*\\.\\s*([^\\d\\.]+)`,
      "g"
    );
    let subsectionMatch;

    while ((subsectionMatch = subsectionRegex.exec(sectionContent)) !== null) {
      const subsectionId = `${section.id}.${subsectionMatch[1]}`;
      const subsectionContent = subsectionMatch[2].trim();

      newSection.subsections?.push({
        subsection_id: subsectionId,
        content: subsectionContent,
      });
    }

    // Add the section to the chapter
    structuredChapter.sections.push(newSection);
  }

  return structuredChapter;
}

/**
 * Converts Hebrew chapter identifiers (א, ב, ג, etc.) to numbers
 */
function convertHebrewChapterToNumber(hebrewChapter: string): string {
  if (!hebrewChapter) return "";

  const hebrewLetters = "אבגדהוזחטיכלמנסעפצקרשת";
  const hebrewLetter = hebrewChapter.trim().replace("'", "");

  const index = hebrewLetters.indexOf(hebrewLetter) + 1;
  return index > 0 ? index.toString() : hebrewChapter;
}

/**
 * Formats multiple chapters into a complete structured policy document
 *
 * @param policyTitle The title of the policy
 * @param chapters The chapters from your Policy object
 * @returns A formatted policy object with structured chapters
 */
export function formatPolicy(
  policyTitle: string,
  chapters: Record<string, Chapter>
): FormattedPolicy {
  // Try to extract a policy title from the first chapter
  let cleanPolicyTitle = policyTitle;

  const firstChapter = Object.values(chapters)[0];
  if (firstChapter) {
    const titleMatch = firstChapter.title.match(
      /פרק\s+[א-ת]'?[:\-]\s*(.*?)(?:\s+\d+)?$/
    );
    if (titleMatch) {
      cleanPolicyTitle = titleMatch[1].trim();
    }
  }

  const formattedPolicy: FormattedPolicy = {
    title: cleanPolicyTitle,
    chapters: [],
  };

  // Sort chapters by position if available
  const chapterEntries = Object.entries(chapters).sort(
    ([, a], [, b]) => (a.position || 0) - (b.position || 0)
  );

  // Format each chapter
  for (const [chapterId, chapter] of chapterEntries) {
    // Skip extremely short content (likely just chapter titles without content)
    if (chapter.content.length < 50) continue;

    const formattedChapter = formatChapter(
      chapterId,
      chapter.title,
      chapter.content
    );

    // Only add chapters that have sections
    if (formattedChapter.sections.length > 0) {
      formattedPolicy.chapters.push(formattedChapter);
    }
  }

  return formattedPolicy;
}

/**
 * Preprocessing step to improve text quality from PDF extraction
 * Applies heuristics to fix common issues in PDF-extracted text
 *
 * @param text The raw text from PDF extraction
 * @returns Cleaned and normalized text
 */
export function preprocessPdfText(text: string): string {
  // Add space after period-number patterns (e.g., "1.1" → "1.1 ")
  let processed = text.replace(/(\d+\.\d+)(?=\S)/g, "$1 ");

  // Add space after section identifiers (e.g., "1." → "1. ")
  processed = processed.replace(/(\d+\.)(?=\S)/g, "$1 ");

  // Add line breaks before new sections
  processed = processed.replace(/(?<=[^\d])(\d+\.\s)/g, "\n$1");

  // Add line breaks before new subsections
  processed = processed.replace(/(?<=[^\d])(\d+\.\d+\.\s)/g, "\n$1");

  // Fix missing spaces between Hebrew words
  processed = processed.replace(/([א-ת])([א-ת])/g, "$1 $2");

  return processed;
}
