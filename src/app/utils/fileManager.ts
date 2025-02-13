import fs from "fs/promises";
import path from "path";

const UPLOADS_DIR = path.join(process.cwd(), "uploads");

export async function getUploadedFiles(): Promise<string[]> {
  try {
    const files = await fs.readdir(UPLOADS_DIR, { withFileTypes: true });
    return files
      .filter(
        (file) => file.isFile() && file.name.toLowerCase().endsWith(".pdf")
      )
      .map((file) => file.name);
  } catch (error) {
    console.error("Error reading uploads directory:", error);
    return [];
  }
}

export async function addUploadedFile(fileName: string): Promise<void> {
  console.log(`Adding file ${fileName} to the list of uploaded files`);

  return;

  // This function is now a no-op since we're directly writing to the public/uploads directory
  // We keep it for potential future use (e.g., if we need to perform additional operations when a file is uploaded)
}
