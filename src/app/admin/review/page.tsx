"use client";

import { useState, useEffect, useCallback } from "react";
import { useAdmin } from "../context";
import { showToast, ToastContainer } from "@/components/ui/Toast";
import Drawer from "@/components/ui/Drawer";
import {
  Badge,
  DetailField,
  DrawerSection,
  EmptyState,
  IconButton,
  MetaFooter,
  PageHeader,
  Pagination,
  Panel,
  PhotoStrip,
  SearchField,
  Segmented,
  StatCard,
  Table,
  TableSkeleton,
  Td,
  Th,
  Tr,
} from "@/components/ui/admin/kit";
import { RefreshIcon, CheckIcon, CloseIcon, EyeIcon } from "@/components/ui/Icon";

interface CaseItem {
  id: string;
  name: string;
  gender: string | null;
  lostDate: string | null;
  lostProvince: string | null;
  lostCity: string | null;
  lostDistrict: string | null;
  status: string;
  source: string;
  createdAt: string;
  photoUrls: string;
  submitterName: string | null;
  submitterContact: string | null;
  lostAddress: string | null;
  feature: string | null;
  birthDate: string | null;
  height: number | null;
}

interface ClueItem {
  id: string;
  caseId: string;
  caseName: string;
  content: string;
  photoUrls: string;
  submitterName: string | null;
  submitterContact: string | null;
  status: string;
  createdAt: string;
}

function safeParsePhotos(photoUrls: string | null | undefined): string[] {
  if (!photoUrls) return [];
  try {
    const arr = JSON.parse(photoUrls);
    if (Array.isArray(arr)) return arr.filter((u: unknown) => typeof u === "string" && u.length > 0);
  } catch {
    /* ignore */
  }
  return [];
}

export default function AdminReviewPage() {
  const { t } = useAdmin();
  const [tab, setTab] = useState<"cases" | "clues">("cases");
  const [cases, setCases] = useState<CaseItem[]>([]);
  const [clues, setClues] = useState<ClueItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [casePage, setCasePage] = useState(1);
  const [cluePage, setCluePage] = useState(1);
  const [caseTotal, setCaseTotal] = useState(0);
  const [clueTotal, setClueTotal] = useState(0);
  const [caseTotalPages, setCaseTotalPages] = useState(0);
  const [clueTotalPages, setClueTotalPages] = useState(0);
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [drawerItem, setDrawerItem] = useState<CaseItem | ClueItem | null>(null);
  const limit = 20;

  const fetchCases = useCallback(async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams({ status: "pending", limit: String(limit), page: String(casePage) });
      if (search.trim()) params.set("search", search.trim());
      const res = await fetch(`/api/admin/cases?${params}`);
      if (res.ok) {
        const data = await res.json();
        setCases(data.items);
        setCaseTotal(data.total);
        setCaseTotalPages(data.totalPages);
      }
    } catch {
      showToast(t.review.loadFailed, "error");
    } finally {
      setLoading(false);
    }
  }, [casePage, search, t.review.loadFailed]);

  const fetchClues = useCallback(async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams({ status: "pending", limit: String(limit), page: String(cluePage) });
      if (search.trim()) params.set("search", search.trim());
      const res = await fetch(`/api/admin/clues?${params}`);
      if (res.ok) {
        const data = await res.json();
        setClues(data.items);
        setClueTotal(data.total);
        setClueTotalPages(data.totalPages);
      }
    } catch {
      showToast(t.review.loadFailed, "error");
    } finally {
      setLoading(false);
    }
  }, [cluePage, search, t.review.loadFailed]);

  useEffect(() => {
    if (tab === "cases") fetchCases();
    else fetchClues();
  }, [tab, fetchCases, fetchClues]);

  // Reset pagination when tab or search changes
  useEffect(() => {
    setCasePage(1);
    setCluePage(1);
  }, [tab, search]);

  async function handleClueReview(id: string, status: "approved" | "rejected") {
    try {
      const res = await fetch("/api/admin/clues/review", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id, status }),
      });
      if (res.ok) {
        showToast(status === "approved" ? t.review.approvedToast : t.review.rejectedToast, "success");
        fetchClues();
      } else {
        const err = await res.json().catch(() => ({}));
        showToast(err.error || t.review.operationFailed, "error");
      }
    } catch {
      showToast(t.review.operationFailed, "error");
    }
  }

  async function handleReview(id: string, status: "approved" | "rejected") {
    try {
      const res = await fetch("/api/admin/review", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id, status }),
      });
      if (res.ok) {
        showToast(status === "approved" ? t.review.approvedToast : t.review.rejectedToast, "success");
        fetchCases();
      } else {
        const err = await res.json().catch(() => ({}));
        showToast(err.error || t.review.operationFailed, "error");
      }
    } catch {
      showToast(t.review.operationFailed, "error");
    }
  }

  function openDrawer(item: CaseItem | ClueItem) {
    setDrawerItem(item);
    setDrawerOpen(true);
  }

  const isCaseItem = (item: CaseItem | ClueItem): item is CaseItem => {
    return "lostProvince" in item;
  };

  return (
    <div>
      <PageHeader
        title={t.review.title}
        description="待审核的寻亲帖与线索，通过后将展示在前台"
        actions={
          <IconButton label="刷新" onClick={() => (tab === "cases" ? fetchCases() : fetchClues())}>
            <RefreshIcon size={16} />
          </IconButton>
        }
      />

      {/* 待审总量 + 切换 */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3.5 mb-5">
        <StatCard
          label={t.review.caseTab}
          value={caseTotal.toLocaleString()}
          hint="待审核寻亲帖"
          tone={tab === "cases" ? "brand" : "neutral"}
        />
        <StatCard
          label={t.review.cluesTab}
          value={clueTotal.toLocaleString()}
          hint="待审核线索"
          tone={tab === "clues" ? "brand" : "neutral"}
        />
      </div>

      <div className="flex flex-wrap items-center justify-between gap-3 mb-4">
        <Segmented
          value={tab}
          onChange={setTab}
          options={[
            { value: "cases", label: t.review.caseTab },
            { value: "clues", label: t.review.cluesTab },
          ]}
        />
        <SearchField
          value={search}
          onChange={setSearch}
          placeholder={t.review.searchPlaceholder}
          className="w-full sm:w-80"
        />
      </div>

      <Panel>
        {loading ? (
          <TableSkeleton rows={6} cols={tab === "cases" ? 8 : 6} />
        ) : tab === "cases" ? (
          cases.length === 0 ? (
            <EmptyState title={t.review.empty} hint={t.review.emptyHint} icon={<CheckIcon size={20} />} />
          ) : (
            <>
              <Table>
                <thead>
                  <tr>
                    <Th>{t.dashboard.name}</Th>
                    <Th>{t.review.gender}</Th>
                    <Th>{t.review.height}</Th>
                    <Th>{t.dashboard.lostLocation}</Th>
                    <Th>{t.review.lostDate}</Th>
                    <Th>{t.dashboard.source}</Th>
                    <Th>{t.dashboard.submitter}</Th>
                    <Th align="center">{t.dashboard.actions}</Th>
                  </tr>
                </thead>
                <tbody>
                  {cases.map((item) => (
                    <Tr key={item.id}>
                      <Td className="font-medium whitespace-nowrap">{item.name}</Td>
                      <Td muted>{item.gender || "-"}</Td>
                      <Td muted className="tabular-nums">{item.height ? `${item.height}cm` : "-"}</Td>
                      <Td muted className="max-w-[180px] truncate">
                        {[item.lostProvince, item.lostCity, item.lostDistrict].filter(Boolean).join(" ") || "-"}
                      </Td>
                      <Td muted className="whitespace-nowrap">{item.lostDate || "-"}</Td>
                      <Td>
                        <Badge tone="neutral">
                          {item.source === "user_submit" ? t.cases.sourceUser : item.source}
                        </Badge>
                      </Td>
                      <Td muted>{item.submitterName || "-"}</Td>
                      <Td align="center">
                        <div className="flex gap-1.5 justify-center items-center">
                          <IconButton label={t.review.detail} onClick={() => openDrawer(item)}>
                            <EyeIcon size={15} />
                          </IconButton>
                          <button
                            type="button"
                            onClick={() => handleReview(item.id, "approved")}
                            className="inline-flex items-center gap-1 h-8 px-3 rounded-lg cursor-pointer bg-[#e60012] text-white text-[12px] font-medium shadow-[0_1px_2px_rgba(230,0,18,0.28)] hover:bg-[#c1000f] active:scale-[0.97] transition-all duration-200"
                          >
                            <CheckIcon size={14} />
                            {t.review.approve}
                          </button>
                          <button
                            type="button"
                            onClick={() => handleReview(item.id, "rejected")}
                            className="inline-flex items-center gap-1 h-8 px-3 rounded-lg cursor-pointer bg-white dark:bg-transparent border border-black/[0.08] dark:border-white/[0.10] text-[#475467] dark:text-[#98a2b3] text-[12px] font-medium hover:text-[#b42318] hover:border-[#f04438]/30 hover:bg-[#fef3f2] dark:hover:bg-[#f04438]/[0.10] active:scale-[0.97] transition-all duration-200"
                          >
                            <CloseIcon size={14} />
                            {t.review.reject}
                          </button>
                        </div>
                      </Td>
                    </Tr>
                  ))}
                </tbody>
              </Table>
              <Pagination
                page={casePage}
                totalPages={caseTotalPages}
                total={caseTotal}
                onChange={setCasePage}
                totalLabel={t.review.count.replace("{count}", String(caseTotal))}
              />
            </>
          )
        ) : clues.length === 0 ? (
          <EmptyState title={t.review.clueNoPending} icon={<CheckIcon size={20} />} />
        ) : (
          <>
            <Table>
              <thead>
                <tr>
                  <Th>{t.review.clueAssociateCase}</Th>
                  <Th>{t.review.clueContent}</Th>
                  <Th>{t.dashboard.submitter}</Th>
                  <Th>{t.review.contact}</Th>
                  <Th>{t.auditLog.time}</Th>
                  <Th align="center">{t.dashboard.actions}</Th>
                </tr>
              </thead>
              <tbody>
                {clues.map((clue) => (
                  <Tr key={clue.id}>
                    <Td className="font-medium whitespace-nowrap">{clue.caseName || "-"}</Td>
                    <Td muted className="max-w-[240px] truncate">{clue.content}</Td>
                    <Td muted className="whitespace-nowrap">{clue.submitterName || "-"}</Td>
                    <Td muted className="whitespace-nowrap">{clue.submitterContact || "-"}</Td>
                    <Td muted className="whitespace-nowrap tabular-nums">
                      {new Date(clue.createdAt).toLocaleDateString("zh-CN")}
                    </Td>
                    <Td align="center">
                      <div className="flex gap-1.5 justify-center items-center">
                        <IconButton label={t.review.detail} onClick={() => openDrawer(clue)}>
                          <EyeIcon size={15} />
                        </IconButton>
                        <button
                          type="button"
                          onClick={() => handleClueReview(clue.id, "approved")}
                          className="inline-flex items-center gap-1 h-8 px-3 rounded-lg cursor-pointer bg-[#e60012] text-white text-[12px] font-medium shadow-[0_1px_2px_rgba(230,0,18,0.28)] hover:bg-[#c1000f] active:scale-[0.97] transition-all duration-200"
                        >
                          <CheckIcon size={14} />
                          {t.review.approve}
                        </button>
                        <button
                          type="button"
                          onClick={() => handleClueReview(clue.id, "rejected")}
                          className="inline-flex items-center gap-1 h-8 px-3 rounded-lg cursor-pointer bg-white dark:bg-transparent border border-black/[0.08] dark:border-white/[0.10] text-[#475467] dark:text-[#98a2b3] text-[12px] font-medium hover:text-[#b42318] hover:border-[#f04438]/30 hover:bg-[#fef3f2] dark:hover:bg-[#f04438]/[0.10] active:scale-[0.97] transition-all duration-200"
                        >
                          <CloseIcon size={14} />
                          {t.review.reject}
                        </button>
                      </div>
                    </Td>
                  </Tr>
                ))}
              </tbody>
            </Table>
            <Pagination
              page={cluePage}
              totalPages={clueTotalPages}
              total={clueTotal}
              onChange={setCluePage}
              totalLabel={t.review.count.replace("{count}", String(clueTotal))}
            />
          </>
        )}
      </Panel>

      {/* Detail Drawer */}
      <Drawer
        open={drawerOpen}
        onClose={() => setDrawerOpen(false)}
        title={drawerItem && isCaseItem(drawerItem) ? t.review.detailDrawerTitle : t.review.detailDrawerClueTitle}
      >
        {drawerItem && (
          isCaseItem(drawerItem) ? (
            <CaseDrawerContent item={drawerItem} t={t} />
          ) : (
            <ClueDrawerContent item={drawerItem} t={t} />
          )
        )}
      </Drawer>

      <ToastContainer />
    </div>
  );
}

function CaseDrawerContent({ item, t }: { item: CaseItem; t: any }) {
  const photos = safeParsePhotos(item.photoUrls);

  return (
    <div className="space-y-6">
      {photos.length > 0 ? (
        <DrawerSection title="照片">
          <PhotoStrip photos={photos} />
        </DrawerSection>
      ) : null}

      <DrawerSection title="基本信息">
        <div className="grid grid-cols-2 gap-x-4 gap-y-3.5">
          <DetailField label={t.review.submitter_label} value={item.submitterName} />
          <DetailField label={t.review.contact} value={item.submitterContact} />
          <DetailField label={t.review.birthDate} value={item.birthDate} />
          <DetailField label={t.review.lostDate} value={item.lostDate} />
          <DetailField label={t.review.gender} value={item.gender} />
          <DetailField label={t.review.height} value={item.height ? `${item.height}cm` : null} />
          <DetailField label={t.review.province} value={item.lostProvince} />
          <DetailField label={t.review.city} value={item.lostCity} />
        </div>
      </DrawerSection>

      {item.lostAddress ? (
        <DrawerSection title={t.review.lostAddress}>
          <p className="text-[13px] leading-6 text-[#344054] dark:text-[#d0d5dd]">{item.lostAddress}</p>
        </DrawerSection>
      ) : null}

      {item.feature ? (
        <DrawerSection title={t.review.feature}>
          <p className="text-[13px] leading-6 whitespace-pre-wrap text-[#344054] dark:text-[#d0d5dd]">{item.feature}</p>
        </DrawerSection>
      ) : null}

      <MetaFooter>
        <p>ID · {item.id}</p>
        <p>{new Date(item.createdAt).toLocaleString("zh-CN")}</p>
      </MetaFooter>
    </div>
  );
}

function ClueDrawerContent({ item, t }: { item: ClueItem; t: any }) {
  const photos = safeParsePhotos(item.photoUrls);

  return (
    <div className="space-y-6">
      <DrawerSection title={t.review.clueAssociateCase}>
        <p className="text-[14px] font-medium text-[#101828] dark:text-white">{item.caseName || "-"}</p>
      </DrawerSection>

      <DrawerSection title={t.review.clueContent}>
        <p className="text-[13px] leading-6 whitespace-pre-wrap text-[#344054] dark:text-[#d0d5dd]">{item.content}</p>
      </DrawerSection>

      {photos.length > 0 ? (
        <DrawerSection title={t.review.cluePhotos}>
          <PhotoStrip photos={photos} />
        </DrawerSection>
      ) : null}

      <DrawerSection title="提交信息">
        <div className="grid grid-cols-2 gap-x-4 gap-y-3.5">
          <DetailField label={t.review.submitter_label} value={item.submitterName} />
          <DetailField label={t.review.contact} value={item.submitterContact} />
        </div>
      </DrawerSection>

      <MetaFooter>
        <p>ID · {item.id}</p>
        <p>{new Date(item.createdAt).toLocaleString("zh-CN")}</p>
      </MetaFooter>
    </div>
  );
}
