import { type NextRequest, NextResponse } from "next/server";
import fs from "fs";
import path from "path";

const uploadsDir = path.join(process.cwd(), "uploads");

export async function POST(req: NextRequest) {
  const formData = await req.formData();
  const file = formData.get("file") as File;

  if (!file) {
    return NextResponse.json({ error: "No file uploaded" }, { status: 400 });
  }

  const buffer = Buffer.from(await file.arrayBuffer());
  const filename = file.name.replace(/\s/g, "-");

  try {
    if (!fs.existsSync(uploadsDir)) {
      fs.mkdirSync(uploadsDir, { recursive: true });
    }

    fs.writeFileSync(path.join(uploadsDir, filename), buffer);
    console.log("File saved:", filename);

    return NextResponse.json({ message: "File uploaded successfully" });
  } catch (error) {
    console.error("Error saving file:", error);
    return NextResponse.json({ error: "Error saving file" }, { status: 500 });
  }
}
