/**
 * Route handlers run outside the client language context, so error copy has to
 * be resolved from the request itself. Browsers send `Accept-Language` on every
 * fetch, which needs no client-side plumbing; anything that is not Chinese gets
 * English rather than Chinese a visitor may not read.
 */
export type ApiLang = "zh" | "en";

export function apiLang(request: Request): ApiLang {
  const header = request.headers.get("accept-language")?.trim().toLowerCase();
  if (!header) return "zh";
  return header.startsWith("zh") ? "zh" : "en";
}

const MESSAGES = {
  invalidPhone: { zh: "请输入有效的手机号码", en: "Please enter a valid phone number." },
  notSignedIn: { zh: "未登录", en: "Please sign in first." },
  userNotFound: { zh: "用户不存在", en: "Account not found." },
  noFieldsToUpdate: { zh: "无有效更新字段", en: "Nothing to update." },
  nameAndDateRequired: { zh: "姓名和走失日期为必填项", en: "Name and date missing are required." },
  photoRequired: { zh: "请上传至少一张照片", en: "Please upload at least one photo." },
  caseNotFound: { zh: "案件不存在", en: "Case not found." },
  searchKeywordRequired: { zh: "请输入搜索关键词", en: "Please enter a search term." },
  commentFieldsRequired: { zh: "昵称和内容不能为空", en: "Name and comment cannot be empty." },
  commentTooLong: { zh: "评论内容不能超过500字", en: "Comments are limited to 500 characters." },
  questionRequired: { zh: "疑问内容不能为空", en: "Question cannot be empty." },
  questionTooLong: { zh: "疑问内容不能超过500字", en: "Questions are limited to 500 characters." },
  clueFieldsRequired: { zh: "关联案例和线索内容为必填项", en: "Select a case and describe the lead." },
  clueCaseNotFound: { zh: "关联案例不存在", en: "The linked case does not exist." },
  clueCaseNotPublished: { zh: "只能为已发布的案例提供线索", en: "Leads can only be submitted for published cases." },
  feedbackFieldsRequired: { zh: "标题和反馈内容不能为空", en: "Title and feedback cannot be empty." },
  feedbackTitleTooLong: { zh: "标题不能超过100字", en: "Titles are limited to 100 characters." },
  feedbackTooLong: { zh: "反馈内容不能超过2000字", en: "Feedback is limited to 2000 characters." },
  fileRequired: { zh: "请选择文件", en: "Please choose a file." },
  imageOnly: { zh: "只支持图片格式", en: "Only image files are supported." },
  imageTooLarge: { zh: "图片大小不能超过5MB", en: "Images must be 5MB or smaller." },
} as const;

export type ApiMessage = keyof typeof MESSAGES;

export function apiError(request: Request, key: ApiMessage, status: number) {
  return Response.json({ error: MESSAGES[key][apiLang(request)] }, { status });
}
