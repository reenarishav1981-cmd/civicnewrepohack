import { NextResponse } from "next/server";

export async function POST(request: Request) {
  try {
    const formData = await request.formData();
    const file = formData.get("file") as File | null;

    if (!file) {
      return NextResponse.json({ success: false, error: "No file provided" }, { status: 400 });
    }

    if (!file.type.startsWith("image/")) {
      return NextResponse.json({ success: false, error: "Only image uploads are permitted" }, { status: 400 });
    }

    // Limit to 5MB
    if (file.size > 5 * 1024 * 1024) {
      return NextResponse.json({ success: false, error: "File exceeds 5MB limit" }, { status: 413 });
    }

    const bytes = await file.arrayBuffer();
    const buffer = Buffer.from(bytes);
    const base64Data = buffer.toString("base64");
    const dataUrl = `data:${file.type};base64,${base64Data}`;

    return NextResponse.json({
      success: true,
      data: {
        url: dataUrl,
        filename: file.name,
        size: file.size,
        mimeType: file.type
      }
    });
  } catch (error: any) {
    console.error("Upload error:", error);
    return NextResponse.json({ success: false, error: "Internal server error during upload" }, { status: 500 });
  }
}
