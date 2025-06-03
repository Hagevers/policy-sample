import fs from "fs";
import { Chapter, Policy, SubChapter } from "@/types";

class InsurancePolicyParser {
  private pdfText: string;
  private chapters: Chapter[] = [];

  constructor(pdfContent: string) {
    this.pdfText = pdfContent;
  }

  /**
   * Parses policy text into hierarchical JSON structure
   * @param text The raw text to be parsed
   * @returns Hierarchical JSON structure of chapters and subchapters
   */
  public parseInsurancePolicy(text: string): Chapter[] {
    console.log("=================== PARSING DEBUG START ===================");
    console.log("Raw text first 500 characters:");
    console.log(text.substring(0, 500));
    console.log("========================================================");

    // Clean up the text first
    const normalizedText = text
      .replace(/[  ]+/g, " ") // Replace multiple spaces with a single space
      .replace(/\n+/g, "\n") // Replace multiple line breaks with a single one
      .replace(/\r/g, "") // Remove carriage returns
      .trim();

    const lines = normalizedText
      .split("\n")
      .filter((line) => line.trim().length > 0);

    console.log("Total lines after filtering:", lines.length);
    console.log("First 10 lines:");
    lines.slice(0, 10).forEach((line, idx) => {
      console.log(`Line ${idx + 1}: "${line}"`);
    });

    const result: Chapter[] = [];
    let currentChapter: Chapter | null = null;
    let currentSubChapter: SubChapter | null = null;
    let currentContent: string[] = [];

    // Updated regex patterns to be more flexible
    const baseLayerRegex = /רובד\s+(?:בסיס|הרחבה|[א-ת]+)/; // רובד בסיס, רובד הרחבה
    // const introChapterRegex = /פרק\s+מבוא/;
    const chapterRegex = /פרק\s+[א-ת](?:'|׳|־|-)?(?:[\s\-:]|$)/; // More flexible chapter matching
    const sectionRegex = /^(?:\.|\.?)(\d+(?:\.\d+)*(?:\.\s|\s|\.?))/; // More flexible section matching

    for (let i = 0; i < lines.length; i++) {
      const line = lines[i].trim();

      // Check if line matches any of our patterns
      const isBaseLayer =
        baseLayerRegex.test(line) ||
        line === "רובד בסיס" ||
        line === "רובד הרחבה";
      const isChapter = chapterRegex.test(line) || line.includes("פרק מבוא");
      const isSection = sectionRegex.test(line);

      console.log(
        `[${i}] "${line}" => BaseLayer: ${isBaseLayer}, Chapter: ${isChapter}, Section: ${isSection}`
      );

      if (isBaseLayer) {
        console.log(">>> Found base layer:", line);

        // Save previous content if exists
        if (currentSubChapter && currentContent.length > 0) {
          currentSubChapter.content = currentContent.join("\n");
          currentContent = [];
        }

        // Add the previous chapter to the result if it exists
        if (currentChapter) {
          result.push(currentChapter);
        }

        // Create a new chapter
        currentChapter = {
          title: line,
          level: 1,
          subChapters: [],
        };
        currentSubChapter = null;
      } else if (isChapter) {
        console.log(">>> Found chapter:", line);

        // Save previous content if exists
        if (currentSubChapter && currentContent.length > 0) {
          currentSubChapter.content = currentContent.join("\n");
          currentContent = [];
        }

        // Create new subchapter
        if (currentChapter) {
          let fullChapterTitle = line;
          if (
            line.endsWith("-") ||
            line.endsWith("־") ||
            line.endsWith("'") ||
            line.endsWith("׳")
          ) {
            if (
              i + 1 < lines.length &&
              !chapterRegex.test(lines[i + 1]) &&
              !baseLayerRegex.test(lines[i + 1])
            ) {
              fullChapterTitle = line + " " + lines[i + 1].trim();
              i++; // Skip the next line since we've included it in the title
              console.log(">>> Merged with next line:", fullChapterTitle);
            }
          }

          currentSubChapter = {
            title: fullChapterTitle,
            level: 2,
            content: "",
          };
          currentChapter.subChapters?.push(currentSubChapter);
        } else {
          // If we find a chapter without a layer, create a top-level chapter
          currentChapter = {
            title: line,
            level: 1,
            subChapters: [],
          };
          currentSubChapter = null;
        }
      } else if (isSection) {
        console.log(">>> Found section:", line);

        if (currentContent.length > 0 && currentSubChapter) {
          const existingContent = currentSubChapter.content || "";
          currentSubChapter.content =
            existingContent +
            (existingContent ? "\n" : "") +
            currentContent.join("\n");
          currentContent = [];
        }

        currentContent.push(line);
      } else if (currentSubChapter || currentChapter) {
        currentContent.push(line);
      }
    }

    // Add the last content if exists
    if (currentSubChapter && currentContent.length > 0) {
      const existingContent = currentSubChapter.content || "";
      currentSubChapter.content =
        existingContent +
        (existingContent ? "\n" : "") +
        currentContent.join("\n");
    } else if (
      currentChapter &&
      !currentSubChapter &&
      currentContent.length > 0
    ) {
      currentChapter.content = currentContent.join("\n");
    }

    // Add the last chapter
    if (currentChapter) {
      result.push(currentChapter);
    }

    console.log("=================== PARSING RESULT ===================");
    console.log("Total chapters found:", result.length);
    result.forEach((chapter, idx) => {
      console.log(
        `Chapter ${idx + 1}: "${chapter.title}" with ${
          chapter.subChapters?.length || 0
        } subchapters`
      );
      chapter.subChapters?.forEach((sub, subIdx) => {
        console.log(`  Subchapter ${subIdx + 1}: "${sub.title}"`);
      });
    });
    console.log("====================================================");

    // Only fall back to "כללי" if no structure was found at all
    if (result.length === 0) {
      console.warn("No structure found, falling back to כללי chapter");
      result.push({
        title: "כללי",
        level: 1,
        subChapters: [
          {
            title: "כללי",
            level: 2,
            content: lines.join("\n"),
          },
        ],
      });
    }

    return result;
  }
}

function calculateStringSimilarity(str1: string, str2: string): number {
  // Remove whitespace and convert to lowercase for consistent comparison
  const cleanStr1 = str1.replace(/\s/g, "").toLowerCase();
  const cleanStr2 = str2.replace(/\s/g, "").toLowerCase();

  // Find the length of the shorter string
  const minLength = Math.min(cleanStr1.length, cleanStr2.length);

  // Count matching characters
  let matchingChars = 0;
  for (let i = 0; i < minLength; i++) {
    if (cleanStr1[i] === cleanStr2[i]) {
      matchingChars++;
    }
  }

  // Calculate similarity as a ratio of matching characters to the length of the shorter string
  return matchingChars / minLength;
}

function mergeChapters(chapters: Chapter[]): Chapter[] {
  // Deep clone to avoid modifying original array
  const workingChapters: Chapter[] = JSON.parse(JSON.stringify(chapters));

  // Similarity threshold - adjust as needed
  const SIMILARITY_THRESHOLD = 0.7;

  const mergedChapters: Chapter[] = [];

  while (workingChapters.length > 0) {
    const currentChapter = workingChapters.shift()!;

    // Find chapters with similar titles
    const similarChapters = workingChapters.filter(
      (chapter) =>
        calculateStringSimilarity(currentChapter.title, chapter.title) >=
        SIMILARITY_THRESHOLD
    );

    // Remove similar chapters from the working array
    similarChapters.forEach((similarChapter) => {
      const index = workingChapters.findIndex((ch) => ch === similarChapter);
      if (index !== -1) workingChapters.splice(index, 1);
    });

    // Include the current chapter in comparison
    const chaptersToCompare = [currentChapter, ...similarChapters];

    // Find the chapter with the largest total content length in subChapters
    const mergedChapter = chaptersToCompare.reduce((max, current) => {
      const maxTotalContentLength = max.subChapters
        ? max.subChapters.reduce(
            (sum, subChapter) => sum + subChapter.content.length,
            0
          )
        : 0;

      const currentTotalContentLength = current.subChapters
        ? current.subChapters.reduce(
            (sum, subChapter) => sum + subChapter.content.length,
            0
          )
        : 0;

      return currentTotalContentLength > maxTotalContentLength ? current : max;
    });

    mergedChapters.push(mergedChapter);
  }

  return mergedChapters;
}

export interface InsuranceSection {
  sectionNumber: string;
  title: string;
  content: string;
  subSections?: InsuranceSection[];
}

export function parseInsuranceContent(content: string): InsuranceSection[] {
  const sections: InsuranceSection[] = [];
  const lines = content.split("\n");

  let currentSection: InsuranceSection | null = null;
  let currentSubSection: InsuranceSection | null = null;

  lines.forEach((line) => {
    // Trim the line and remove any leading numbers
    const trimmedLine = line.trim().replace(/^(\d+\.?\s*)/, "");

    // Check for main section headers
    if (/^[א-ת]':/.test(line)) {
      // New main section
      currentSection = {
        sectionNumber: line.match(/^(\d+)\./)?.[1] || "",
        title: trimmedLine,
        content: "",
        subSections: [],
      };
      sections.push(currentSection);
      currentSubSection = null;
    }
    // Check for subsection headers
    else if (/^\d+\.\d+\./.test(line)) {
      // New subsection
      if (currentSection) {
        currentSubSection = {
          sectionNumber: line.match(/^(\d+\.\d+)\./)?.[1] || "",
          title: trimmedLine,
          content: "",
        };
        currentSection.subSections?.push(currentSubSection);
      }
    }
    // Accumulate content
    else {
      if (currentSubSection) {
        currentSubSection.content += line + "\n";
      } else if (currentSection) {
        currentSection.content += line + "\n";
      }
    }
  });

  // Clean up content (trim whitespace)
  sections.forEach((section) => {
    section.content = section.content.trim();
    section.subSections?.forEach((subSection) => {
      subSection.content = subSection.content.trim();
    });
  });
  console.log(sections);

  return sections;
}

export function parseSubChapterContent(content: string): SubChapter[] {
  const lines = content
    .split("\n")
    .map((line) => line.trim())
    .filter((line) => line);

  const subChapters: SubChapter[] = [];
  const stack: { level: number; subChapter: SubChapter }[] = [];

  const titleRegex = /^(\d+(\.\d+)*)\s*(.*)$/;

  for (const line of lines) {
    const match = line.match(titleRegex);

    if (match) {
      const numberParts = match[1]?.split(".") || [];
      const level = numberParts.length;
      const title = match[3]?.trim() || "";

      const subChapter: SubChapter = {
        title,
        level,
        content: "",
        subChapters: [],
      };

      while (stack.length > 0 && stack[stack.length - 1]?.level >= level) {
        stack.pop();
      }

      if (stack.length > 0) {
        const parent = stack[stack.length - 1]?.subChapter;
        if (parent) {
          parent.subChapters = parent.subChapters || [];
          parent.subChapters.push(subChapter);
        }
      } else {
        subChapters.push(subChapter);
      }

      stack.push({ level, subChapter });
    } else {
      if (stack.length > 0) {
        const currentSubChapter = stack[stack.length - 1]?.subChapter;
        if (currentSubChapter) {
          currentSubChapter.content +=
            (currentSubChapter.content ? " " : "") + line;
        }
      }
    }
  }

  return subChapters;
}

// Helper function to process subchapters recursively
function processSubChaptersRecursively(
  subChapters: SubChapter[]
): SubChapter[] {
  if (!subChapters || subChapters.length === 0) return [];

  return subChapters.map((subChapter) => {
    // Parse the content of this subchapter to find nested subchapters
    const parsedSubChapters = parseSubChapterContent(subChapter.content);

    // If we found nested subchapters from the content, use them
    if (parsedSubChapters.length > 0) {
      return {
        ...subChapter,
        subChapters: parsedSubChapters,
      };
    }

    // If this subchapter already has subchapters, process them recursively
    if (subChapter.subChapters && subChapter.subChapters.length > 0) {
      return {
        ...subChapter,
        subChapters: processSubChaptersRecursively(subChapter.subChapters),
      };
    }

    // Otherwise, just return the subchapter as is
    return subChapter;
  });
}

/**
 * Removes redundant content from chapters when it's already structured in subChapters
 * @param chapters The array of chapters to clean
 * @returns The cleaned chapters array with content removed where appropriate
 */
/**
 * Removes redundant content from chapters and subchapters
 * @param items The array of chapters or subchapters to clean
 * @returns The cleaned items with content removed where appropriate
 */
export function removeRedundantContent(chapters: Chapter[]): Chapter[] {
  return chapters.map((chapter) => {
    const cleanedChapter = { ...chapter };

    if (cleanedChapter.subChapters && cleanedChapter.subChapters.length > 0) {
      cleanedChapter.content = "";

      // Use type assertion to handle the recursive call
      cleanedChapter.subChapters = removeRedundantContent(
        cleanedChapter.subChapters as unknown as Chapter[]
      ) as unknown as SubChapter[];
    }

    return cleanedChapter;
  });
}

export function parseChaptersContent(chapters: Chapter[]): Chapter[] {
  return chapters.map((chapter) => {
    // First, parse the chapter's own content
    const parsedFromChapterContent = parseSubChapterContent(
      chapter.content || ""
    );

    // Then, if the chapter already has subchapters, process them recursively
    const processedExistingSubChapters = processSubChaptersRecursively(
      chapter.subChapters || []
    );

    // Combine the results - first add subchapters parsed from content, then the processed existing ones
    return {
      ...chapter,
      subChapters: [
        ...parsedFromChapterContent,
        ...processedExistingSubChapters,
      ],
    };
  });
}

function identifyPolicyType(pdfContent: string): "standard" | "no-layers" {
  // בדיקה ראשונית למבנה
  const hasLayers = /רובד\s+(בסיס|הרחבה)/i.test(pdfContent);

  // בדיקה מדויקת יותר לפרקים בסגנון "פרק א'"
  const hasHebrewChapters =
    /פרק\s+[א-ת]'[\s\-\.:]/i.test(pdfContent) ||
    /פרק\s+[א-ת][\s\-\.:]/i.test(pdfContent);

  // בדיקה למבנה סעיפים מסוג ".1" או ".1.1"
  const hasSections = /\.\d+\s+[א-ת]/i.test(pdfContent);

  if (hasLayers) {
    return "standard";
  }

  if (hasHebrewChapters || hasSections) {
    return "no-layers";
  }

  return "standard"; // ברירת מחדל
}

function parseInsurancePolicyImproved(pdfContent: string): Chapter[] {
  // מערך התוצאות
  const chapters: Chapter[] = [];

  // חלוקה לשורות וסינון שורות ריקות
  const lines = pdfContent
    .replace(/(\d+\.\d+\.|\d+\.)/g, "\n$1") // Add newlines before section/subsection numbers
    .replace(/(פרק\s*[א-ת]{1,3}'?)\s*[\-\.:]?\s*/g, "\n$1 - ") // Add newlines before chapter headers
    .split("\n")
    .filter((line) => line.trim().length > 0);

  // ביטויים רגולריים משופרים
  // זהה פרק לפי "פרק X" וגם לפי הכותרת המלאה
  // Only match legitimate chapter headers with Hebrew letter enumeration
  const chapterRegex =
    /^פרק\s+(א|ב|ג|ד|ה|ו|ז|ח|ט|י|יא|יב|יג|יד|טו|טז|יז|יח|יט|כ|כא|כב|כג|כד|כה|כו|כז|כח|כט|ל|לא|לב|לג|לד|לה|לו)('?)(?:\s*[\-\.:]\s*|\s+)(.+)$/;

  // For just chapter number without title
  const justChapterRegex =
    /^פרק\s+(א|ב|ג|ד|ה|ו|ז|ח|ט|י|יא|יב|יג|יד|טו|טז|יז|יח|יט|כ|כא|כב|כג|כד|כה|כו|כז|כח|כט|ל|לא|לב|לג|לד|לה|לו)('?)$/;

  // זהה סעיפים ראשיים (.1, .2, וכו')
  const mainSectionRegex = /^(\d+)\.\s*(.*)$/;

  // זהה תתי-סעיפים (.1.1, .1.2, וכו')
  const subSectionRegex = /^(\d+)\.(\d+)\.\s*(.*)$/;

  let currentChapter: Chapter | null = null;
  let currentMainSection: SubChapter | null = null;
  let inChapterTitle = false; // דגל שמציין אם אנחנו בתוך כותרת של פרק

  // לולאה על כל השורות
  for (let i = 0; i < lines.length; i++) {
    const line = lines[i].trim();

    // זיהוי פרק חדש - בדיקת תבנית מלאה של "פרק X - כותרת"
    const chapterMatch = line.match(chapterRegex);

    // זיהוי של "פרק X" בלבד (כותרת תבוא בשורה הבאה)
    const justChapterMatch = !chapterMatch
      ? line.match(justChapterRegex)
      : null;

    if (chapterMatch || justChapterMatch) {
      inChapterTitle = justChapterMatch !== null; // אם זה רק פרק, הכותרת תבוא אחר כך

      // נוצר פרק חדש
      currentChapter = {
        title: chapterMatch
          ? line
          : justChapterMatch
          ? justChapterMatch[0]
          : line,
        level: 1,
        content: "",
        subChapters: [],
      };

      chapters.push(currentChapter);
      currentMainSection = null;
      continue;
    }

    // השלמת כותרת פרק אם הכותרת נמצאת בשורה נפרדת
    if (inChapterTitle && currentChapter) {
      currentChapter.title += " - " + line;
      inChapterTitle = false;
      continue;
    }

    // זיהוי סעיף ראשי (.1, .2, וכו')
    const mainSectionMatch = line.match(mainSectionRegex);
    if (mainSectionMatch && currentChapter) {
      const [, number, title] = mainSectionMatch;

      currentMainSection = {
        title: `.${number} ${title}`,
        level: 2,
        content: "",
        subChapters: [],
      };

      if (currentChapter.subChapters)
        currentChapter.subChapters.push(currentMainSection);
      continue;
    }

    // זיהוי תת-סעיף (.1.1, .1.2, וכו')
    const subSectionMatch = line.match(subSectionRegex);
    if (subSectionMatch && currentMainSection) {
      const [, mainNumber, subNumber, title] = subSectionMatch;

      const subSection: SubChapter = {
        title: `.${mainNumber}.${subNumber} ${title}`,
        level: 3,
        content: "",
      };

      currentMainSection.subChapters = currentMainSection.subChapters || [];
      currentMainSection.subChapters.push(subSection);
      continue;
    }

    // שורות שאינן כותרות נוספות לתוכן
    if (currentMainSection) {
      // הוספה לתוכן של סעיף ראשי אם אין תתי-סעיפים,
      // או לתוכן של תת-הסעיף האחרון אם יש
      if (
        currentMainSection.subChapters &&
        currentMainSection.subChapters.length > 0
      ) {
        const lastSubSection =
          currentMainSection.subChapters[
            currentMainSection.subChapters.length - 1
          ];
        lastSubSection.content += (lastSubSection.content ? "\n" : "") + line;
      } else {
        currentMainSection.content +=
          (currentMainSection.content ? "\n" : "") + line;
      }
    } else if (currentChapter) {
      // אם אין סעיף ראשי פעיל, הוסף לתוכן של הפרק
      currentChapter.content += (currentChapter.content ? "\n" : "") + line;
    }
  }

  return chapters;
}
function cleanPolicyText(text: string): string {
  // החלפת מספר רווחים או טאבים ברווח אחד
  let cleaned = text.replace(/\s+/g, " ");

  // וידוא שיש רווח אחרי סימני ניקוד כמו נקודה, פסיק, וכו'
  cleaned = cleaned.replace(/([.,:;])([\u0590-\u05FF\w])/g, "$1 $2");

  // ניקוי שורות ריקות מיותרות
  cleaned = cleaned.replace(/\n{3,}/g, "\n\n");

  // תיקון מצבים שבהם נקודות סעיפים נראות לא נכון (כמו " .1" או ".1 .")
  cleaned = cleaned.replace(/\s+\./g, ".");
  cleaned = cleaned.replace(/\.\s+(\d)/g, ".$1");

  return cleaned;
}
// שימוש במחלקה
export function analyzePolicyDocument(pdfContent: string): Chapter[] {
  // זיהוי סוג הפוליסה
  const policyType = identifyPolicyType(pdfContent);

  if (policyType === "no-layers") {
    // שימוש בפרסר המיוחד לפוליסות ללא רבדים
    const cleanedContent = cleanPolicyText(pdfContent);
    const chapters = parseInsurancePolicyImproved(cleanedContent);
    console.log("got here");

    fs.writeFileSync("chapter.json", JSON.stringify(chapters, null, 2));
    return chapters;
  } else {
    // שימוש בפרסר המקורי ללא שינויים
    const parser = new InsurancePolicyParser(pdfContent);
    const chapters = parser.parseInsurancePolicy(pdfContent);
    console.log("Parsed chapters:", chapters);

    const parsed = mergeChapters(chapters);

    console.log("Parsed chapters after merging:", parsed);

    const formatted = parseChaptersContent(parsed);

    console.log("Formatted chapters:", formatted);

    const cleaned = removeRedundantContent(formatted);

    console.log("Cleaned chapters:", cleaned);

    fs.writeFileSync("chapters.json", JSON.stringify(cleaned, null, 2));
    return cleaned;
  }
}

// פונקציה לזיהוי פרקים עיקריים בפוליסה
// פונקציה מעודכנת לזיהוי פרקים עיקריים בפוליסה - תומכת בשני מבנים אפשריים
export function extractMainChapters(
  policy: Policy
): { id: string; title: string; path: string[] }[] {
  const mainChapters: { id: string; title: string; path: string[] }[] = [];

  // בדיקה אם הפרקים הם ישירות ברמה 1 (ללא רובד)
  const hasPrimaryChapters = policy.chapters.some(
    (chapter) => chapter.title.match(/פרק\s+[א-ת]'?/i) && chapter.level === 1
  );

  if (hasPrimaryChapters) {
    // מקרה 1: פרקים ברמה 1 ישירות
    policy.chapters.forEach((chapter, index) => {
      if (chapter.title.match(/פרק\s+[א-ת]'?/i) && chapter.level === 1) {
        mainChapters.push({
          id: `chapter-${index}`,
          title: chapter.title,
          path: [index.toString()],
        });
      }
    });
  } else {
    // מקרה 2: פרקים תחת רבדים
    policy.chapters.forEach((layer, layerIndex) => {
      if (layer.subChapters) {
        layer.subChapters.forEach((chapter, chapterIndex) => {
          if (chapter.title.match(/פרק\s+[א-ת]'?/i) || chapter.level === 2) {
            mainChapters.push({
              id: `${layerIndex}-${chapterIndex}`,
              title: chapter.title,
              path: [layerIndex.toString(), chapterIndex.toString()],
            });
          }
        });
      }
    });
  }

  // מקרה קצה: אם לא נמצאו פרקים, קח את הפרקים העליונים
  if (mainChapters.length === 0) {
    policy.chapters.forEach((chapter, index) => {
      mainChapters.push({
        id: `chapter-${index}`,
        title: chapter.title,
        path: [index.toString()],
      });
    });
  }

  return mainChapters;
}

// פונקציה למציאת התאמות בין פרקים משתי פוליסות
// function matchPolicyChapters(
//   policy1: Policy,
//   policy2: Policy
// ): {
//   policy1Chapter: { id: string; title: string; path: string[] } | null;
//   policy2Chapter: { id: string; title: string; path: string[] } | null;
// }[] {
//   const policy1Chapters = extractMainChapters(policy1);
//   const policy2Chapters = extractMainChapters(policy2);
//   const matches: {
//     policy1Chapter: { id: string; title: string; path: string[] } | null;
//     policy2Chapter: { id: string; title: string; path: string[] } | null;
//   }[] = [];

//   // מציאת התאמות על בסיס טקסט הכותרת
//   policy1Chapters.forEach((chapter1) => {
//     // ניקוי הכותרת מפונקטואציה ומספרים
//     const normalizedTitle1 = chapter1.title
//       .replace(/פרק\s+[א-ת]'?[:\s-]+/g, "") // להסיר "פרק א': "
//       .trim();

//     // מציאת התאמה הטובה ביותר
//     let bestMatch: { id: string; title: string; path: string[] } | null = null;
//     let bestScore = 0;

//     policy2Chapters.forEach((chapter2) => {
//       const normalizedTitle2 = chapter2.title
//         .replace(/פרק\s+[א-ת]'?[:\s-]+/g, "")
//         .trim();

//       // חישוב מידת הדמיון בין הכותרות (פשוט)
//       const similarity = calculateSimilarity(
//         normalizedTitle1,
//         normalizedTitle2
//       );

//       if (similarity > 0.5 && similarity > bestScore) {
//         // סף של 50% התאמה
//         bestScore = similarity;
//         bestMatch = chapter2;
//       }
//     });

//     matches.push({
//       policy1Chapter: chapter1,
//       policy2Chapter: bestMatch,
//     });
//   });

//   // בדיקת פרקים בפוליסה 2 שלא הותאמו
//   policy2Chapters.forEach((chapter2) => {
//     const isAlreadyMatched = matches.some(
//       (match) => match.policy2Chapter && match.policy2Chapter.id === chapter2.id
//     );

//     if (!isAlreadyMatched) {
//       matches.push({
//         policy1Chapter: null,
//         policy2Chapter: chapter2,
//       });
//     }
//   });

//   return matches;
// }

// פונקציית עזר פשוטה למציאת מידת דמיון בין שני טקסטים

export type ConsolidatedPolicy = {
  title: string;
  [policyName: string]: string | PolicyContent;
};

type PolicyContent = {
  content?: string;
  subChapters?: SubChapter[];
  [layerCategory: string]: LayerContent | string | SubChapter[] | undefined;
};

type LayerContent = {
  content: string;
  subChapters: SubChapter[];
};

// פונקציית עזר משופרת למציאת מידת דמיון בין שני טקסטים
export function consolidatePolicies(policies: Policy[]): ConsolidatedPolicy[] {
  const result = [];
  const chapterGroups = [];

  // Extract all chapters (including those nested under "רובד")
  for (const policy of policies) {
    const extractedChapters = [];

    for (const chapter of policy.chapters) {
      if (isLayerCategory(chapter)) {
        // If it's a "רובד" category, process its subchapters
        if (chapter.subChapters) {
          for (const subChapter of chapter.subChapters) {
            if (isActualChapter(subChapter)) {
              extractedChapters.push({
                chapter: subChapter,
                layerCategory: chapter.title,
              });
            }
          }
        }
      } else if (isActualChapter(chapter)) {
        // Regular chapter
        extractedChapters.push({
          chapter: chapter,
          layerCategory: null,
        });
      }
    }

    // Now add each extracted chapter to the groups
    for (const { chapter, layerCategory } of extractedChapters) {
      let found = false;

      // Try to find a matching chapter group
      for (const group of chapterGroups) {
        if (areChaptersSimilar(group.title, chapter.title)) {
          group.items.push({ policy, chapter, layerCategory });
          found = true;
          break;
        }
      }

      if (!found) {
        // Create a new group for this unique chapter
        chapterGroups.push({
          title: chapter.title,
          items: [{ policy, chapter, layerCategory }],
        });
      }
    }
  }

  // Create the consolidated output
  for (const group of chapterGroups) {
    const consolidatedChapter: ConsolidatedPolicy = {
      title: group.title,
    };

    // Add structured content for each policy
    for (const item of group.items) {
      const { policy, chapter, layerCategory } = item;

      if (layerCategory) {
        // Chapter is under a layer category
        if (!consolidatedChapter[policy.name]) {
          consolidatedChapter[policy.name] = {};
        }
        // Update your code with type assertions
        if (!consolidatedChapter[policy.name]) {
          consolidatedChapter[policy.name] = {} as PolicyContent;
        }

        if (
          !(consolidatedChapter[policy.name] as PolicyContent)[layerCategory]
        ) {
          (consolidatedChapter[policy.name] as PolicyContent)[layerCategory] = {
            content: "",
            subChapters: [],
          };
        }

        (
          (consolidatedChapter[policy.name] as PolicyContent)[
            layerCategory
          ] as LayerContent
        ).subChapters.push({
          title: chapter.title,
          level: chapter.level,
          content: chapter.content || "",
          subChapters: chapter.subChapters || [],
        });
      } else {
        // Regular chapter, add directly to policy
        consolidatedChapter[policy.name] = {
          content: chapter.content || "",
          subChapters: chapter.subChapters || [],
        };
      }
    }

    result.push(consolidatedChapter);
  }

  console.log("Consolidated policies:", result);

  return result;
}

// Helper to check if a chapter is a layer category (רובד)
function isLayerCategory(chapter: Chapter) {
  return chapter.level === 1 && chapter.title && chapter.title.includes("רובד");
}

function isPureLayerCategory(chapter: Chapter) {
  // A pure layer category has "רובד" and doesn't have "פרק"
  return (
    chapter.level === 1 &&
    chapter.title &&
    chapter.title.includes("רובד") &&
    !chapter.title.includes("פרק")
  );
}

function isActualChapter(chapter: Chapter) {
  return !isPureLayerCategory(chapter);
}

// Helper to check if two chapter titles are similar
function areChaptersSimilar(title1: string, title2: string) {
  // Normalize titles
  const normalize = (str: string) => {
    if (!str) return "";
    return str
      .replace(/[.,:;'"\-]/g, "")
      .replace(/\s+/g, " ")
      .trim();
  };

  const norm1 = normalize(title1);
  const norm2 = normalize(title2);

  // Define important content categories with their key terms
  const contentCategories = {
    "השתלות וטיפולים בחול": [
      "השתלות",
      "טיפולים מיוחדים",
      "מחוץ לישראל",
      "בחול",
    ],
    "ניתוחים בחול": ["ניתוחים", "מחוץ לישראל", "בחול"],
    "ניתוחים בישראל משלים שבן": ["ניתוחים", "בישראל", "משלים שבן"],
    "ניתוחים בישראל מהשקל הראשון": ["ניתוחים", "בישראל", "מהשקל הראשון"],
    "ניתוחים בישראל": ["ניתוחים", "מחליפי ניתוח", "בישראל"],
    אמבולטורי: ["אמבולטוריים", "שירותים רפואיים", "בדיקות"],
    "תרופות רגילות": ["תרופות", "מרשם", "לסל"],
    "תרופות בהתאמה אישית": ["תרופות", "בהתאמה אישית"],
    "ביטוח סיעודי": ["סיעודי", "סיעוד"],
    "שירותים נוספים": ["כתב שירות", "שירותים"],
  };

  // Check which category each title belongs to
  function getCategoryForTitle(title: string) {
    let bestCategory = null;
    let highestMatches = 0;

    for (const [category, terms] of Object.entries(contentCategories)) {
      let matches = 0;
      for (const term of terms) {
        if (title.includes(term)) {
          matches++;
        }
      }

      // Require at least 1 term to match for a category
      if (matches > highestMatches && matches >= 1) {
        highestMatches = matches;
        bestCategory = category;
      }
    }

    return { category: bestCategory, matchStrength: highestMatches };
  }

  const cat1 = getCategoryForTitle(norm1);
  const cat2 = getCategoryForTitle(norm2);

  // If both titles belong to the same category
  if (cat1.category && cat2.category && cat1.category === cat2.category) {
    return true;
  }

  // For titles that don't clearly match with categories,
  // fall back to general keyword matching but with a higher threshold
  const keywords = [
    "השתלות",
    "טיפולים",
    "מיוחדים",
    "בחול",
    "מחוץ לישראל",
    "ניתוחים",
    "מחליפי ניתוח",
    "בישראל",
    "אמבולטוריים",
    "שירותים",
    "תרופות",
    "סיעודי",
    "בדיקות",
    "בהתאמה אישית",
    "משלים שבן",
    "השתתפות עצמית",
    "מהשקל הראשון",
  ];

  let matches = 0;
  for (const keyword of keywords) {
    if (norm1.includes(keyword) && norm2.includes(keyword)) {
      matches++;
    }
  }

  // Need at least 3 matching keywords to consider similar without a category match
  return matches >= 3;
}

// Example usage:
// const result = consolidatePolicies([policy1, policy2]);
// console.log(result);

// בדיקת הפונקציה
// export function testChapterMatching(policies: Policy[]) {
//   console.log("מתחיל בדיקת התאמת פרקים...");

//   const matches = matchPolicyChapters(policies[0], policies[1]);

//   console.log("תוצאות התאמת פרקים:");
//   matches.forEach((match) => {
//     if (match.policy1Chapter && match.policy2Chapter) {
//       console.log(
//         `התאמה: "${match.policy1Chapter.title}" <==> "${match.policy2Chapter.title}"`
//       );
//     } else if (match.policy1Chapter) {
//       console.log(`ללא התאמה בפוליסה 2: "${match.policy1Chapter.title}"`);
//     } else if (match.policy2Chapter) {
//       console.log(`ללא התאמה בפוליסה 1: "${match.policy2Chapter.title}"`);
//     }
//   });

//   return matches;
// }
