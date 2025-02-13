"use server";

import { anthropic } from "@ai-sdk/anthropic";
import { generateText } from "ai";
import {
  extractTextFromPDF,
  createChunks,
  getEmbeddings,
  semanticSearch,
} from "../utils/pdfUtils";
import { getUploadedFiles } from "../utils/fileManager";
import path from "path";

const UPLOADS_DIR = path.join(process.cwd(), "uploads");

export async function askQuestion(question: string): Promise<string> {
  const pdfFiles = await getUploadedFiles();
  const documentsByFile: {
    [filename: string]: { text: string; embedding: number[] }[];
  } = {};

  for (const file of pdfFiles) {
    const filePath = path.join(UPLOADS_DIR, file);
    const text = await extractTextFromPDF(filePath);
    const chunks = createChunks(text);
    const embeddings = await getEmbeddings(chunks);

    documentsByFile[file] = chunks
      .map((chunk, index) => ({
        text: chunk,
        embedding: embeddings[index] || [],
      }))
      .filter((doc) => doc.embedding.length > 0);
  }

  const relevantChunksByFile: { [filename: string]: string[] } = {};
  for (const [filename, documents] of Object.entries(documentsByFile)) {
    const relevantChunks = await semanticSearch(question, documents);
    relevantChunksByFile[filename] = relevantChunks;
  }

  const context = Object.entries(relevantChunksByFile)
    .map(([filename, chunks]) => {
      const chunkWithSources = chunks
        .map((chunk) => `מקור: ${chunk}`)
        .join("\n\n");
      return `מסמך פוליסה: ${filename}\n${chunkWithSources}`;
    })
    .join("\n\n==========\n\n");

  const prompt = `You are analyzing Hebrew health insurance policies. Format your response as structured tables and sections using the exact format below. All text should be in Hebrew.

Context from policy documents:

${context}

First, identify the policies by their names/issuers. Then format your response in these exact sections, separated by ###:

### זיהוי הפוליסות
פוליסה 1: [שם/מנפיק הפוליסה הראשונה]
פוליסה 2: [שם/מנפיק הפוליסה השנייה]

### טבלת כיסויים רפואיים - השוואה בין [שם פוליסה 1] ל-[שם פוליסה 2]
כיסוי | [שם פוליסה 1] | [שם פוליסה 2]
[List all medical coverages, with exact amounts and conditions in separate rows for each policy]

### טבלת דמי ביטוח - השוואה בין [שם פוליסה 1] ל-[שם פוליסה 2]
קבוצת גיל | [שם פוליסה 1] | [שם פוליסה 2]
[List premium amounts by age group for BOTH policies]

### מימון מעסיק
[שם פוליסה 1]:
[Specify employer funding details]

[שם פוליסה 2]:
[Specify employer funding details]

### הבדלים מהותיים
[List key differences between policies with clear identification of which policy offers what]

### המלצות
[Brief recommendations based on comparison]

Instructions:
1. ALWAYS identify which policy is which in every section
2. Use exact numbers and amounts as written in policies
3. Include pricing information for BOTH policies
4. For missing information, write "לא צוין" in the relevant cell
5. Clearly specify employer funding for each policy separately
6. Keep perfect accuracy in policy details
7. Use clear separators and formatting
8. Quote exact policy language when relevant
9. IMPORTANT: Analyze and compare ALL chapters that exist in the policies using the same detailed format shown above, regardless of whether they were explicitly mentioned in the examples. Each chapter should be broken down into its specific coverages and terms.

Answer in Hebrew using the specified format:`;

  const response = await generateText({
    model: anthropic("claude-3-5-sonnet-latest"),
    prompt,
    temperature: 0.1,
  });

  return response.text;
}
