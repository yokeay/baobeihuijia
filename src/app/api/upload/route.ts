import { uploadImage } from "@/lib/upload";

export async function POST(request: Request) {
  const formData = await request.formData();
  const file = formData.get("file") as File | null;

  if (!file) {
    return Response.json({ error: "请选择文件" }, { status: 400 });
  }

  if (!file.type.startsWith("image/")) {
    return Response.json({ error: "只支持图片格式" }, { status: 400 });
  }

  if (file.size > 5 * 1024 * 1024) {
    return Response.json({ error: "图片大小不能超过5MB" }, { status: 400 });
  }

  const url = await uploadImage(file);
  return Response.json({ url });
}
