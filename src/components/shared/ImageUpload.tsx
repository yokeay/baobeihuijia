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
          <div key={i} className="relative w-20 h-20 rounded-xl overflow-hidden bg-black/5 dark:bg-white/5">
            <img src={url} alt="" className="w-full h-full object-cover" />
            <button
              type="button"
              onClick={() => removePhoto(i)}
              className="absolute top-1 right-1 w-5 h-5 bg-black/40 hover:bg-black/60 dark:bg-white/20 dark:hover:bg-white/30 text-white text-[11px] flex items-center justify-center rounded-full backdrop-blur-sm transition-colors"
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
            className="w-20 h-20 rounded-xl border-2 border-dashed border-black/10 dark:border-white/10 flex items-center justify-center text-[#1c1c1e]/20 dark:text-white/15 hover:border-[#c5705a]/40 hover:text-[#c5705a] transition-all duration-200 text-2xl"
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
      <p className="text-[12px] text-[#1c1c1e]/25 dark:text-white/15">支持jpg/png，最多{max}张</p>
    </div>
  );
}
