/**
 * Server-side templates for the per-case <title>/description. Only the
 * languages that actually have rows are covered (CN + US = every row in the
 * database today); anything else renders in Chinese rather than inventing
 * copy nobody can review.
 */
export interface CaseMetaTemplates {
  genderMale: string;
  genderFemale: string;
  height: string;
  born: string;
  whoWrap: string;
  bitsJoin: string;
  lostOn: string;
  lostAt: string;
  head: string;
  featureTail: string;
  genericTail: string;
  caseNotFound: string;
  missingSince: string;
  missingPerson: string;
  sentence: string;
}

const zh: CaseMetaTemplates = {
  genderMale: "男",
  genderFemale: "女",
  height: "身高 {n}cm",
  born: "{d} 出生",
  whoWrap: "（{bits}）",
  bitsJoin: "、",
  lostOn: "于 {d}",
  lostAt: "在{p}",
  head: "{name}{who} {when}{where}走失",
  featureTail: "体貌特征：{f}",
  genericTail: "若您见过他/她，请联系当地公安机关。",
  caseNotFound: "案件不存在",
  missingSince: "{d}走失",
  missingPerson: "寻人",
  sentence: "{head}。{tail}",
};

const en: CaseMetaTemplates = {
  genderMale: "Male",
  genderFemale: "Female",
  height: "height {n} cm",
  born: "born {d}",
  whoWrap: " ({bits})",
  bitsJoin: ", ",
  lostOn: "on {d}",
  lostAt: "in {p}",
  head: "{name}{who} went missing {when} {where}",
  featureTail: "Distinguishing features: {f}",
  genericTail: "If you have seen this person, please contact local law enforcement.",
  caseNotFound: "Case not found",
  missingSince: "Missing since {d}",
  missingPerson: "Missing person",
  sentence: "{head}. {tail}",
};

export function caseMetaTemplates(countryCode: string | null | undefined): CaseMetaTemplates {
  return countryCode === "US" ? en : zh;
}
