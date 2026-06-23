"use client";

import { useRef, useState } from "react";
import { showToast } from "@/components/ui/Toast";

interface ImageUploadProps {
  photos: string[];
  onPhotosChange: (photos: string[]) => void;
  max?: number;
}

export function ImageUpload({ photos, onPhotosChange, max = 9 }: ImageUploadProps) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [uploading, setUploading] = useState(false);

  async function handleFiles(e: React.ChangeEvent<HTMLInputElement>) {
    const files = Array.from(e.target.files || []);
    if (photos.length + files.length > max) {
      showToast(`最多上传${max}张图片`, "error");
      return;
    }

    setUploading(true);
    try {
      for (const file of files) {
        const formData = new FormData();
        formData.append("file", file);
        const res = await fetch("/api/upload", { method: "POST", body: formData });
        const data = await res.json();
        if (data.url) {
          onPhotosChange([...photos, data.url]);
        }
      }
    } catch {
      showToast("上传失败，请重试", "error");
    } finally {
      setUploading(false);
      if (inputRef.current) inputRef.current.value = "";
    }
  }

  function removePhoto(index: number) {
    onPhotosChange(photos.filter((_, i) => i !== index));
  }

  return (
    <div>
      <div className="flex flex-wrap gap-2 mb-2">
        {photos.map((url, i) => (
          <div key={i} className="relative w-20 h-20 rounded-lg overflow-hidden bg-gray-100">
            <img src={url} alt="" className="w-full h-full object-cover" />
            <button
              type="button"
              onClick={() => removePhoto(i)}
              className="absolute top-0 right-0 w-5 h-5 bg-black/50 text-white text-xs flex items-center justify-center"
            >
              ✕
            </button>
          </div>
        ))}
        {photos.length < max && (
          <button
            type="button"
            onClick={() => inputRef.current?.click()}
            disabled={uploading}
            className="w-20 h-20 rounded-lg border-2 border-dashed border-gray-300 flex items-center justify-center text-gray-400 hover:border-primary hover:text-primary transition-colors text-2xl"
          >
            {uploading ? "..." : "+"}
          </button>
        )}
      </div>
      <input
        ref={inputRef}
        type="file"
        accept="image/*"
        multiple
        onChange={handleFiles}
        className="hidden"
      />
      <p className="text-xs text-gray-400">支持jpg/png，最多{max}张</p>
    </div>
  );
}
