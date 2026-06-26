export const SITE_NAME = "我好想你";
export const SITE_DESCRIPTION = "全球失踪儿童信息聚合公益平台 - 助力每一个家庭团圆";
export const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL || "http://localhost:3000";

export const API_SOURCE_NAME = "小维API - 我好想你";
export const API_SOURCE_URL = "https://openapi.52vmy.cn/docs/wl/baby.html";
export const API_ENDPOINT = "http://openapi.52vmy.cn/api/wl/baby";

export const EXTERNAL_API_TOKEN = process.env.EXTERNAL_API_TOKEN || "";

export const CASE_SOURCES = [
  { value: "api", label: "API同步" },
  { value: "user_submit", label: "用户提交" },
  { value: "crawl", label: "爬取" },
] as const;

export const CASE_STATUSES = [
  { value: "pending", label: "待审核", color: "bg-yellow-100 text-yellow-800" },
  { value: "approved", label: "已通过", color: "bg-green-100 text-green-800" },
  { value: "rejected", label: "已拒绝", color: "bg-red-100 text-red-800" },
] as const;

export const PROVINCES = [
  "北京", "天津", "上海", "重庆", "河北", "山西", "辽宁", "吉林", "黑龙江",
  "江苏", "浙江", "安徽", "福建", "江西", "山东", "河南", "湖北", "湖南",
  "广东", "海南", "四川", "贵州", "云南", "陕西", "甘肃", "青海", "台湾",
  "内蒙古", "广西", "西藏", "宁夏", "新疆", "香港", "澳门",
] as const;

export const GENDERS = [
  { value: "", label: "全部" },
  { value: "男", label: "男" },
  { value: "女", label: "女" },
] as const;
