import { getPlatform } from "@/lib/db";
import { v4 as uuidv4 } from "uuid";
import fs from "fs";
import path from "path";

export async function uploadImage(file: File): Promise<string> {
  const platform = getPlatform();

  if (platform === "docker") {
    return uploadLocal(file);
  }
  // For Vercel and Cloudflare, we'd use their blob storage
  // For now, fallback to local; in production, use Vercel Blob / R2
  return uploadLocal(file);
}

async function uploadLocal(file: File): Promise<string> {
  const uploadDir = path.join(process.cwd(), "public", "uploads");
  if (!fs.existsSync(uploadDir)) {
    fs.mkdirSync(uploadDir, { recursive: true });
  }

  const ext = file.name.split(".").pop() || "jpg";
  const filename = `${uuidv4()}.${ext}`;
  const filepath = path.join(uploadDir, filename);

  const buffer = Buffer.from(await file.arrayBuffer());
  fs.writeFileSync(filepath, buffer);

  return `/uploads/${filename}`;
}

export async function uploadImages(files: File[]): Promise<string[]> {
  const urls = await Promise.all(files.map(uploadImage));
  return urls;
}
