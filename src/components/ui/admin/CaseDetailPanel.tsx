"use client";

import { DrawerSection, DetailField, MetaFooter, PhotoStrip } from "@/components/ui/admin/kit";

/**
 * 关联案例详情（抽屉内容）
 *
 * 线索 / 评论 / 疑问 / 用户日志四个页面共用同一份展示，
 * 以前这段 JSX 在四个页面里各复制了一份，改样式要改四处。
 */
export interface CaseDetailData {
  id?: string;
  name?: string | null;
  gender?: string | null;
  birthDate?: string | null;
  lostDate?: string | null;
  height?: number | string | null;
  lostProvince?: string | null;
  lostCity?: string | null;
  lostDistrict?: string | null;
  lostAddress?: string | null;
  feature?: string | null;
  photoUrls?: string | null;
}

export function parsePhotos(photoUrls?: string | null): string[] {
  if (!photoUrls) return [];
  try {
    const arr = JSON.parse(photoUrls);
    if (Array.isArray(arr)) return arr.filter((u: unknown) => typeof u === "string" && u.length > 0);
  } catch {
    /* 非 JSON，按单张图片处理 */
  }
  return photoUrls.length > 0 ? [photoUrls] : [];
}

export default function CaseDetailPanel({ data }: { data: CaseDetailData }) {
  const photos = parsePhotos(data.photoUrls);
  const region = [data.lostProvince, data.lostCity, data.lostDistrict].filter(Boolean).join(" ");

  return (
    <div className="space-y-6">
      {photos.length > 0 ? (
        <DrawerSection title="照片">
          <PhotoStrip photos={photos} />
        </DrawerSection>
      ) : null}

      <DrawerSection title="基本信息">
        <div className="grid grid-cols-2 gap-x-4 gap-y-3.5">
          <DetailField label="姓名" value={data.name} />
          <DetailField label="性别" value={data.gender} />
          <DetailField label="出生日期" value={data.birthDate} />
          <DetailField label="失踪日期" value={data.lostDate} />
          <DetailField label="身高" value={data.height ? `${data.height}cm` : null} />
          <DetailField label="地区" value={region} />
        </div>
      </DrawerSection>

      {data.lostAddress ? (
        <DrawerSection title="失踪地址">
          <p className="text-[13px] leading-6 text-[#344054] dark:text-[#d0d5dd]">{data.lostAddress}</p>
        </DrawerSection>
      ) : null}

      {data.feature ? (
        <DrawerSection title="体貌特征">
          <p className="text-[13px] leading-6 whitespace-pre-wrap text-[#344054] dark:text-[#d0d5dd]">
            {data.feature}
          </p>
        </DrawerSection>
      ) : null}

      {data.id ? (
        <MetaFooter>
          <p>ID · {data.id}</p>
        </MetaFooter>
      ) : null}
    </div>
  );
}
