import { uploadImage } from "@/lib/upload";
import { apiError } from "@/lib/i18n/api-messages";

export async function POST(request: Request) {
  const formData = await request.formData();
  const file = formData.get("file") as File | null;

  if (!file) {
    return apiError(request, "fileRequired", 400);
  }

  if (!file.type.startsWith("image/")) {
    return apiError(request, "imageOnly", 400);
  }

  if (file.size > 5 * 1024 * 1024) {
    return apiError(request, "imageTooLarge", 400);
  }

  const url = await uploadImage(file);
  return Response.json({ url });
}
