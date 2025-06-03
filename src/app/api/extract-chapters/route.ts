// pages/api/extract-chapters.ts
import { NextApiRequest, NextApiResponse } from "next";
import formidable from "formidable";
import fs from "fs";
import path from "path";
import { promises as fsPromises } from "fs";
import os from "os";
import { Worker } from "worker_threads";
import { Chapter, Policy } from "@/types";

// Configure API to handle file uploads
export const config = {
  api: {
    bodyParser: false,
  },
};

/**
 * Rule-based chapter extraction from policy text
 */
function extractChapters(policyText: string): Record<string, Chapter> {
  const chapters: Record<string, Chapter> = {};

  // Hebrew chapter patterns to match different formatting styles
  const patterns = [
    // Pattern 1: Standard chapter format with numbering
    /פרק\s+([א-ת"]{1,3})\s*[:.-]\s*(.*?)(?=\n)/g,

    // Pattern 2: Chapter titles centered with underlines
    /^([א-ת\s]{2,50})\n-{3,}$/gm,

    // Pattern 3: Numbered sections (1., 2., etc.)
    /^(\d+\.)\s+(.*?)$/gm,

    // Pattern 4: Common insurance sections
    /^(השתלות|ניתוחים|תרופות|אמבולטורי|שירותים|כיסויים).*?$/gm,
  ];

  // Find all potential chapter headings
  const matches: Array<{ index: number; title: string }> = [];

  patterns.forEach((pattern) => {
    let match;
    while ((match = pattern.exec(policyText)) !== null) {
      const title = match[1].includes(":")
        ? match[2].trim()
        : match[match.length - 1].trim();
      matches.push({
        index: match.index,
        title: title,
      });
    }
  });

  // Sort by position in document
  matches.sort((a, b) => a.index - b.index);

  // Add specific insurance section keywords to look for if no matches found
  if (matches.length < 3) {
    const commonSections = [
      'השתלות וטיפולים מיוחדים בחו"ל',
      "תרופות מחוץ לסל הבריאות",
      'ניתוחים וטיפולים בחו"ל',
      "ניתוחים וטיפולים בארץ",
      "שירותים אמבולטוריים",
    ];

    commonSections.forEach((section) => {
      const index = policyText.indexOf(section);
      if (index !== -1) {
        matches.push({
          index,
          title: section,
        });
      }
    });

    // Sort again after adding common sections
    matches.sort((a, b) => a.index - b.index);
  }

  // Extract chapter content
  for (let i = 0; i < matches.length; i++) {
    const { index, title } = matches[i];
    const endIndex =
      i < matches.length - 1 ? matches[i + 1].index : policyText.length;

    // Only add if chapter content is substantial (more than 100 chars)
    const content = policyText.substring(index, endIndex).trim();
    if (content.length > 100) {
      chapters[title] = {
        title,
        content,
        position: index,
      };
    }
  }

  // If still no chapters found, try fallback to page-based splitting
  if (Object.keys(chapters).length === 0) {
    const pages = policyText.split(/--- Page \d+ ---/);
    if (pages.length > 1) {
      // Group every 3-5 pages as a "chapter"
      const pagesPerChapter = Math.max(3, Math.ceil(pages.length / 7));

      for (let i = 0; i < pages.length; i += pagesPerChapter) {
        const chapterPages = pages.slice(i, i + pagesPerChapter);
        const chapterContent = chapterPages.join("\n\n");

        if (chapterContent.trim().length > 100) {
          const chapterNum = Math.floor(i / pagesPerChapter) + 1;
          chapters[`פרק ${chapterNum}`] = {
            title: `פרק ${chapterNum}`,
            content: chapterContent,
            position: i,
          };
        }
      }
    }
  }

  return chapters;
}

/**
 * Function to parse PDF files and extract text
 */
async function extractTextFromPdf(filePath: string): Promise<string> {
  // Create a temporary worker script file

  await fsPromises.writeFile(workerScriptPath, workerScript);

  return new Promise((resolve, reject) => {
    const worker = new Worker(workerScriptPath, {
      workerData: { filePath },
    });

    worker.on("message", (message) => {
      if (message.success) {
        resolve(message.text);
      } else {
        reject(new Error(message.error));
      }

      // Clean up the temporary worker script
      fs.unlink(workerScriptPath, () => {});
    });

    worker.on("error", (error) => {
      reject(error);
      fs.unlink(workerScriptPath, () => {});
    });

    worker.on("exit", (code) => {
      if (code !== 0) {
        reject(new Error(`Worker stopped with exit code ${code}`));
      }
      fs.unlink(workerScriptPath, () => {});
    });
  });
}

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  // Create a temporary directory to store uploaded files
  const tempDir = path.join(os.tmpdir(), "policy-uploads");
  try {
    await fsPromises.mkdir(tempDir, { recursive: true });
  } catch (err) {
    console.error("Error creating temp directory:", err);
  }

  const form = new formidable.IncomingForm({
    uploadDir: tempDir,
    keepExtensions: true,
    maxFileSize: 20 * 1024 * 1024, // 20MB limit
  });

  return new Promise<void>((resolve) => {
    form.parse(req, async (err, fields, files) => {
      if (err) {
        res.status(500).json({ error: "Error parsing form data" });
        return resolve();
      }

      try {
        // Get policy ID and file
        const policyId = fields.policyId
          ? String(fields.policyId)
          : `policy-${Date.now()}`;
        const policyName = fields.policyName
          ? String(fields.policyName)
          : `פוליסה - ${policyId}`;
        const policyIssuer = fields.policyIssuer
          ? String(fields.policyIssuer)
          : undefined;

        // Check if we have a file
        const policyFile = files.policyFile;
        if (!policyFile || Array.isArray(policyFile)) {
          res.status(400).json({ error: "No policy file uploaded" });
          return resolve();
        }

        const filePath = policyFile.filepath;

        // Extract text from PDF
        const policyText = await extractTextFromPdf(filePath);

        // Extract chapters using rule-based approach
        const chapters = extractChapters(policyText);

        // Check if we found any chapters
        if (Object.keys(chapters).length === 0) {
          res.status(422).json({
            error: "Could not identify any chapters in the policy",
            policyText: policyText.substring(0, 1000) + "...", // Return start of text for debugging
          });
          return resolve();
        }

        // Create policy object
        const policy: Policy = {
          id: policyId,
          name: policyName,
          issuer: policyIssuer,
          chapters,
          metadata: {
            fileName: policyFile.originalFilename || `${policyId}.pdf`,
            fileSize: policyFile.size,
            uploadDate: new Date().toISOString(),
            pageCount: (policyText.match(/--- Page \d+ ---/g) || []).length,
            language: "he",
            processingStatus: "completed",
          },
        };

        // Return the policy with chapters
        res.status(200).json({ policy });

        // Clean up the uploaded file
        try {
          await fsPromises.unlink(filePath);
        } catch (err) {
          console.error("Error cleaning up file:", err);
        }

        return resolve();
      } catch (error) {
        console.error("Error processing policy:", error);
        res.status(500).json({
          error: `Error processing policy: ${
            error instanceof Error ? error.message : String(error)
          }`,
        });
        return resolve();
      }
    });
  });
}
