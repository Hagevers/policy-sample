// import {} from "bidi-js";
import pdfParse from "pdf-parse";
import fs from "fs/promises";
import OpenAI from "openai";
import { EmbeddingCache } from "@/services/cacheService";
// import * as pdfjsLib from "pdfjs-dist";

// pdfjsLib.GlobalWorkerOptions.workerSrc = `/pdf.worker.mjs`;

// pdfjsLib.GlobalWorkerOptions.workerSrc =
//   "node_modules/pdfjs-dist/build/pdf.worker.mjs";

// interface SectionNode {
//   heading: string;
//   text: string;
//   children: SectionNode[];
// }

// function parseTextToHierarchy(text: string): SectionNode[] {
//   const lines = text.split("\n");
//   const root: SectionNode[] = [];
//   const currentPath: (SectionNode & { level: number })[] = [];

//   lines.forEach((line) => {
//     const trimmedLine = line.trim();
//     if (!trimmedLine) return; // Skip empty lines

//     // Example: Assume headings are in all caps
//     if (trimmedLine === trimmedLine.toUpperCase()) {
//       const level = determineLevel(trimmedLine);
//       while (
//         currentPath.length > 0 &&
//         currentPath[currentPath.length - 1].level >= level
//       ) {
//         currentPath.pop(); // Backtrack to the correct parent level
//       }
//       const parent =
//         currentPath.length > 0 ? currentPath[currentPath.length - 1] : null;
//       const newNode: SectionNode & { level: number } = {
//         heading: trimmedLine,
//         text: "",
//         children: [],
//         level,
//       };
//       if (parent) {
//         parent.children.push(newNode); // Add as a child of the parent
//       } else {
//         root.push(newNode); // Add to root if no parent
//       }
//       currentPath.push(newNode); // Track the current node
//     } else if (currentPath.length > 0) {
//       const currentNode = currentPath[currentPath.length - 1];
//       currentNode.text += (currentNode.text ? " " : "") + trimmedLine; // Append text to the current section
//     }
//   });

//   return root;
// }
const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

const cache = new EmbeddingCache();

// Initialize cache when module loads
cache.init();

const MAX_CHUNK_LENGTH = 4000; // OpenAI allows larger chunks
const MIN_CHUNK_LENGTH = 100;

export async function extractTextFromPDF(filePath: string): Promise<string> {
  try {
    const buffer = await fs.readFile(filePath);
    const data = await pdfParse(buffer);

    // Get the raw text
    const rawText = data.text || "";

    // Apply cleaning function
    const cleanedText = cleanPDFText(rawText);

    return cleanedText;
  } catch (error) {
    console.error("Error extracting text from PDF:", error);
    throw error;
  }
}

function cleanPDFText(text: string) {
  return (
    text
      // Remove the document reference pattern with Hebrew text
      .replace(
        /4453\.8_P_imHm34453\.8.*?ביטוח בריאות קבוצתי לעובדי ביטוח לאומי פנים חוברת a5OshP4i/g,
        ""
      )

      // Remove the department/division/campaign metadata line
      .replace(
        /שם חטיבהשם אגףמזמינ\.הקמפיין\+ מוצר\+ סקיצהנושאסוג עבודהגודלמעצב\.ת בריאותקולקטיב לריסה פומקטוב/g,
        ""
      )

      // Remove shortened version of the same pattern
      .replace(/שם חטיבהשם אגףמזמינ\.הקמפיין/g, "")

      // Remove standalone page numbers with optional surrounding spaces
      .replace(/\n\s*\d{1,2}\s*\n/g, "\n")

      // Remove page numbers at the end of lines
      .replace(/\s+\d{1,2}\s*$/gm, "")

      // Remove any remaining "department name" fragments
      .replace(/שם חטיבה/g, "")

      // Remove page indicators
      .replace(/פנים חוברת/g, "")

      // Remove repetitive document tracking codes
      .replace(/\d+\.\d+_P_[A-Za-z0-9]+\d+\.\d+/g, "")

      // Clean up any resulting multiple blank lines
      .replace(/\n{3,}/g, "\n\n")

      // Clean up excessive whitespace
      .replace(/\s{2,}/g, " ")

      // Clean up the formatting codes at the end of sections
      .replace(/a5OshP4i/g, "")

      // Remove references to "division name" etc.
      .replace(/שם אגף/g, "")

      // Remove references to campaign request elements
      .replace(/מזמינ\.הקמפיין\+ מוצר\+ סקיצה/g, "")

      // Remove topic/work type fields
      .replace(/נושאסוג עבודה/g, "")

      // Remove size/designer fields
      .replace(/גודלמעצב\.ת/g, "")

      // Remove collective healthcare references
      .replace(/בריאותקולקטיב/g, "")
  );
}

// Function to assist debugging by printing found chapter structure

export function createChunks(text: string): string[] {
  if (!text || typeof text !== "string") {
    console.warn("Invalid input text for chunking");
    return [];
  }

  try {
    // ניקוי ראשוני
    const cleanedText = text.replace(/\r\n/g, "\n").trim();

    // נסיון לזהות סעיפים ופרקים
    const sections: string[] = [];
    let currentSection = "";
    let inSection = false;

    // פיצול לפי שורות ועיבוד
    const lines = cleanedText.split("\n");

    for (let i = 0; i < lines.length; i++) {
      const line = lines[i].trim();

      // דילוג על שורות ריקות
      if (!line) continue;

      // בדיקה האם זו כותרת של סעיף או פרק
      const isSectionHeader =
        /^(פרק|סעיף|חלק|סימן)\s+[\u0590-\u05FF\d]/.test(line) || // כותרות פרק/סעיף
        /^[\u0590-\u05FF\s]{2,30}:$/.test(line) || // כותרות קצרות עם נקודותיים
        /^\d+(\.\d+){0,2}\s+[\u0590-\u05FF]/.test(line); // סעיפים ממוספרים

      if (isSectionHeader) {
        // שמירת הסעיף הקודם אם קיים ולא ריק
        if (currentSection.trim().length >= MIN_CHUNK_LENGTH) {
          sections.push(currentSection.trim());
        }

        // התחלת סעיף חדש
        currentSection = line;
        inSection = true;
      } else if (inSection) {
        // המשך של סעיף קיים
        currentSection += "\n" + line;

        // בדיקה אם הגענו לאורך מקסימלי והסעיף לא נפתח זה עתה
        if (currentSection.length > MAX_CHUNK_LENGTH && !isSectionHeader) {
          sections.push(currentSection.trim());
          currentSection = "";
          inSection = false;
        }
      } else {
        // טקסט שלא מתחיל בכותרת סעיף
        if ((currentSection + "\n" + line).length <= MAX_CHUNK_LENGTH) {
          currentSection += (currentSection ? "\n" : "") + line;
        } else {
          if (currentSection.length >= MIN_CHUNK_LENGTH) {
            sections.push(currentSection.trim());
          }
          currentSection = line;
        }
      }
    }

    // הוספת הסעיף האחרון אם קיים
    if (currentSection.trim().length >= MIN_CHUNK_LENGTH) {
      sections.push(currentSection.trim());
    }

    // פיצול סעיפים ארוכים מדי
    const finalChunks: string[] = [];
    for (const section of sections) {
      if (section.length <= MAX_CHUNK_LENGTH) {
        finalChunks.push(section);
      } else {
        // פיצול לפי משפטים כמו בגרסה המקורית
        const sentences = section
          .split(/(?<=[.!?])\s+/)
          .map((s) => s.trim())
          .filter((s) => s.length > 0);

        let chunk = "";
        for (const sentence of sentences) {
          if ((chunk + " " + sentence).length <= MAX_CHUNK_LENGTH) {
            chunk += (chunk ? " " : "") + sentence;
          } else {
            if (chunk.length >= MIN_CHUNK_LENGTH) {
              finalChunks.push(chunk);
            }
            chunk = sentence;
          }
        }

        if (chunk && chunk.length >= MIN_CHUNK_LENGTH) {
          finalChunks.push(chunk);
        }
      }
    }

    return finalChunks;
  } catch (error) {
    console.error("Error creating chunks:", error);
    return [];
  }
}

/**
 * Original function to get embeddings for an array of text chunks
 * @param chunks Array of text chunks to get embeddings for
 * @returns Array of embedding vectors corresponding to each chunk
 */
export async function getEmbeddings(chunks: string[]): Promise<number[][]> {
  if (!Array.isArray(chunks)) {
    console.error("Invalid chunks input: not an array");
    return [];
  }

  const embeddings: number[][] = [];

  for (const chunk of chunks) {
    try {
      if (!chunk || typeof chunk !== "string" || !chunk.trim()) {
        console.log("Skipping invalid chunk");
        embeddings.push([]);
        continue;
      }

      const cacheKey = cache.generateKey(chunk);
      const cachedEmbedding = await cache.get(cacheKey);

      if (cachedEmbedding) {
        console.log("Using cached embedding");
        embeddings.push(cachedEmbedding);
        continue;
      }

      const cleanedChunk = chunk.trim();

      const response = await openai.embeddings.create({
        model: "text-embedding-3-small",
        input: cleanedChunk,
        encoding_format: "float",
      });

      if (response.data[0].embedding) {
        await cache.set(cacheKey, response.data[0].embedding);
        embeddings.push(response.data[0].embedding);
      } else {
        console.error("Invalid embedding response format");
        embeddings.push([]);
      }
    } catch (error) {
      console.error("Failed to get embedding:", error);
      embeddings.push([]);
    }
  }

  return embeddings;
}

/**
 * Convert chapter structure to an array of text chunks for embedding
 * @param chapters Record of chapter titles to Chapter objects
 * @returns Array of chapter contents as text chunks and a mapping to their original titles
 */

/**
 * Get embeddings for all chapters in a policy document
 * @param chapters Record of chapter titles to Chapter objects
 * @returns Record of chapter titles to their embedding vectors
 */

/**
 * Interface for a section extracted from a chapter
 */
export interface Section {
  id: string;
  title: string;
  content: string;
  chapterTitle: string;
}

/**
 * Extract sections from a chapter's content
 * Handles Hebrew numbered sections, which typically follow patterns like "1.", "1.1", etc.
 * @param chapter Chapter object containing content to parse
 * @returns Array of Section objects
 */

/**
 * Extract sections from all chapters in a policy
 * @param chapters Record of chapter titles to Chapter objects
 * @returns Array of Section objects from all chapters
 */

/**
 * Get embeddings for all sections in all chapters
 * @param chapters Record of chapter titles to Chapter objects
 * @returns Record mapping section IDs to their embedding vectors
 */

/**
 * Calculate cosine similarity between two embedding vectors
 * @param vec1 First embedding vector
 * @param vec2 Second embedding vector
 * @returns Similarity score between 0 and 1
 */
export function cosineSimilarity(vec1: number[], vec2: number[]): number {
  if (vec1.length === 0 || vec2.length === 0) {
    return 0;
  }

  const length = Math.min(vec1.length, vec2.length);
  let dotProduct = 0;
  let magnitude1 = 0;
  let magnitude2 = 0;

  for (let i = 0; i < length; i++) {
    dotProduct += vec1[i] * vec2[i];
    magnitude1 += vec1[i] * vec1[i];
    magnitude2 += vec2[i] * vec2[i];
  }

  magnitude1 = Math.sqrt(magnitude1);
  magnitude2 = Math.sqrt(magnitude2);

  if (magnitude1 === 0 || magnitude2 === 0) {
    return 0;
  }

  return dotProduct / (magnitude1 * magnitude2);
}

/**
 * Compare two chapters using cosine similarity of their embeddings
 * @param embedding1 Embedding vector for first chapter
 * @param embedding2 Embedding vector for second chapter
 * @returns Similarity score between 0 and 1
 */
export function compareChapters(
  embedding1: number[],
  embedding2: number[]
): number {
  return cosineSimilarity(embedding1, embedding2);
}

/**
 * Find the most semantically similar sections to a given query
 * @param query Text query to find relevant sections for
 * @param sectionEmbeddings Record of section IDs to their embeddings and section metadata
 * @param topK Number of top results to return (default: 3)
 * @returns Array of relevant sections with similarity scores
 */
export async function findRelevantSections(
  query: string,
  sectionEmbeddings: Record<string, { embedding: number[]; section: Section }>,
  topK: number = 3
): Promise<Array<{ section: Section; similarity: number }>> {
  // Get embedding for the query
  const queryEmbeddingsResult = await getEmbeddings([query]);
  const queryEmbedding = queryEmbeddingsResult[0];

  if (!queryEmbedding || queryEmbedding.length === 0) {
    console.error("Failed to get embedding for query");
    return [];
  }

  // Compare query embedding with all section embeddings
  const similarities: Array<{ section: Section; similarity: number }> = [];

  for (const sectionKey in sectionEmbeddings) {
    const { embedding, section } = sectionEmbeddings[sectionKey];

    if (embedding && embedding.length > 0) {
      const similarity = cosineSimilarity(queryEmbedding, embedding);

      similarities.push({
        section,
        similarity,
      });
    }
  }

  // Sort by similarity (highest first) and take top K results
  return similarities
    .sort((a, b) => b.similarity - a.similarity)
    .slice(0, topK);
}

/**
 * Compare two policies by comparing their chapters
 * @param policy1Embeddings Embeddings for chapters in first policy
 * @param policy2Embeddings Embeddings for chapters in second policy
 * @returns Record mapping chapters from policy1 to most similar chapters in policy2
 */
export function comparePolicies(
  policy1Embeddings: Record<string, number[]>,
  policy2Embeddings: Record<string, number[]>
): Record<string, { similarity: number; matchingChapter: string }> {
  const comparison: Record<
    string,
    { similarity: number; matchingChapter: string }
  > = {};

  // For each chapter in policy1, find the most similar chapter in policy2
  for (const chapter1Key in policy1Embeddings) {
    let bestMatch = { similarity: 0, matchingChapter: "" };

    for (const chapter2Key in policy2Embeddings) {
      const similarity = compareChapters(
        policy1Embeddings[chapter1Key],
        policy2Embeddings[chapter2Key]
      );

      if (similarity > bestMatch.similarity) {
        bestMatch = { similarity, matchingChapter: chapter2Key };
      }
    }

    comparison[chapter1Key] = bestMatch;
  }

  return comparison;
}
