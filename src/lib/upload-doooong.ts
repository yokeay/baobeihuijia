const DOOONG_UPLOAD_URL = "https://image.dooo.ng/api/v2/upload";

export async function uploadToDooong(file: File): Promise<string> {
  const formData = new FormData();
  formData.append("file", file);
  formData.append("storage_id", "8");

  const res = await fetch(DOOONG_UPLOAD_URL, {
    method: "POST",
    body: formData,
  });

  if (!res.ok) {
    const text = await res.text();
    throw new Error(`Dooong upload failed: ${res.status} ${text}`);
  }

  const json = await res.json();
  if (!json.status) {
    throw new Error(`Dooong upload error: ${json.message || "unknown"}`);
  }

  return json.data.public_url as string;
}
