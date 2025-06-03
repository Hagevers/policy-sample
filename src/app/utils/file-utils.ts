import mammoth from "mammoth";
import fs from "fs";
import path from "path";
import { promisify } from "util";
import { extractTextFromPDF } from "./pdfUtils";

const readdir = promisify(fs.readdir);
const UPLOADS_DIR = path.resolve(process.cwd(), "uploads");

/**
 * Ensure the uploads directory exists
 */
export async function ensureUploadsDir(): Promise<void> {
  if (!fs.existsSync(UPLOADS_DIR)) {
    fs.mkdirSync(UPLOADS_DIR, { recursive: true });
  }
}

/**
 * Get list of uploaded PDF files
 */
export async function getUploadedFiles(): Promise<string[]> {
  await ensureUploadsDir();

  const files = await readdir(UPLOADS_DIR);
  return files.filter((file) => {
    const ext = path.extname(file).toLowerCase();
    return ext === ".pdf" || ext === ".docx";
  });
}

/**
 * Get absolute path to a file in the uploads directory
 */
export function getUploadPath(filename: string): string {
  return path.join(UPLOADS_DIR, filename);
}

export async function extractTextFromDOCX(filePath: string): Promise<string> {
  try {
    const result = await mammoth.extractRawText({ path: filePath });
    const rawText = result.value || "";

    // You might need to create a separate cleaning function for DOCX
    // or modify the existing one to handle DOCX-specific artifacts
    return cleanDOCXText(rawText);
  } catch (error) {
    console.error("Error extracting text from DOCX:", error);
    throw error;
  }
}

function cleanDOCXText(text: string) {
  // Apply DOCX-specific cleaning logic
  // You might need to adjust this based on your DOCX files' content patterns
  return (
    text
      // Clean up any resulting multiple blank lines
      .replace(/\n{3,}/g, "\n\n")
      // Clean up excessive whitespace
      .replace(/\s{2,}/g, " ")
      .trim()
  );
}

export async function extractTextFromDocument(
  filePath: string
): Promise<string> {
  const ext = path.extname(filePath).toLowerCase();

  if (ext === ".pdf") {
    return extractTextFromPDF(filePath);
  } else if (ext === ".docx") {
    return extractTextFromDOCX(filePath);
  } else {
    throw new Error(`Unsupported file format: ${ext}`);
  }
}
