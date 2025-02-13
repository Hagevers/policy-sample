import { type NextRequest, NextResponse } from "next/server";
import fs from "fs";
import path from "path";

const uploadsDir = path.join(process.cwd(), "uploads");

export async function GET() {
  try {
    if (!fs.existsSync(uploadsDir)) {
      return NextResponse.json([]);
    }

    const files = fs.readdirSync(uploadsDir).map((file) => ({
      name: file,
      path: `/uploads/${file}`,
    }));

    return NextResponse.json(files);
  } catch (error) {
    console.error("Error reading files:", error);
    return NextResponse.json({ error: "Error reading files" }, { status: 500 });
  }
}

export async function DELETE(req: NextRequest) {
  const { filePath } = await req.json();
  const fullPath = path.join(process.cwd(), filePath);

  try {
    if (fs.existsSync(fullPath)) {
      fs.unlinkSync(fullPath);
      return NextResponse.json({ message: "File deleted successfully" });
    } else {
      return NextResponse.json({ error: "File not found" }, { status: 404 });
    }
  } catch (error) {
    console.error("Error deleting file:", error);
    return NextResponse.json({ error: "Error deleting file" }, { status: 500 });
  }
}
