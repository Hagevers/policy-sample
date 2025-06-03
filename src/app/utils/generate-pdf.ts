// app/actions/generate-pdf.js
"use server";

import PDFDocument from "pdfkit";
import { writeFile } from "fs/promises";
import { join } from "path";
import { randomUUID } from "crypto";

export async function generatePDF(data: string) {
  // Create a document with RTL support
  const doc = new PDFDocument({
    autoFirstPage: true,
    lang: "he",
  });

  // Create a unique filename
  const filename = `document-${randomUUID()}.pdf`;
  const filePath = join(process.cwd(), "public", "temp", filename);

  // Create a buffer stream to capture PDF content
  const chunks = [];
  let result;

  doc.on("data", (chunk) => {
    chunks.push(chunk);
  });

  doc.on("end", async () => {
    result = Buffer.concat(chunks);
    await writeFile(filePath, result);
  });

  // Load a font with Hebrew support
  // Make sure this font is in your project
  doc.font(join(process.cwd(), "fonts", "VarelaRound-Regular.ttf"));

  // Add Hebrew text to the document
  doc.fontSize(16).text("שלום עולם", {
    align: "right",
  });

  // Finalize the PDF
  doc.end();

  // Wait for the PDF to be fully generated
  await new Promise((resolve) => setTimeout(resolve, 1000));

  // Return the path where the PDF can be accessed
  return `/temp/${filename}`;
}
