export function cn(...classes: (string | boolean | undefined | null)[]): string {
  return classes.filter(Boolean).join(" ");
}

export function formatDate(dateStr: string | null | undefined): string {
  if (!dateStr) return "未知";
  try {
    const date = new Date(dateStr);
    if (isNaN(date.getTime())) return dateStr;
    return date.toLocaleDateString("zh-CN", {
      year: "numeric",
      month: "long",
      day: "numeric",
    });
  } catch {
    return dateStr;
  }
}

export function parseJsonArray(str: string): string[] {
  try {
    const parsed = JSON.parse(str);
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [str];
  }
}

export function getAgeFromBirthDate(birthDate: string | null, lostDate: string | null): string {
  if (!birthDate) return "未知";
  try {
    const birth = new Date(birthDate);
    const ref = lostDate ? new Date(lostDate) : new Date();
    if (isNaN(birth.getTime())) return "未知";
    let age = ref.getFullYear() - birth.getFullYear();
    const monthDiff = ref.getMonth() - birth.getMonth();
    if (monthDiff < 0 || (monthDiff === 0 && ref.getDate() < birth.getDate())) {
      age--;
    }
    if (age < 1) {
      const months =
        (ref.getFullYear() - birth.getFullYear()) * 12 + monthDiff;
      return `${Math.max(0, months)}个月`;
    }
    return `${age}岁`;
  } catch {
    return "未知";
  }
}
