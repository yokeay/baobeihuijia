import type { Metadata } from "next";
import { LegalPage } from "@/components/layout/LegalPage";

const UPDATED = "2026-09-05";

export const metadata: Metadata = {
  title: "用户协议",
  description:
    "我好想你（IMU）公益寻人平台用户协议：平台性质、数据来源、用户提交与线索规则、免责声明与争议解决。",
  alternates: { canonical: "https://wohaoxiangni.com/terms" },
};

const zh = (
  <>
    <h2>一、关于本平台</h2>
    <p>
      「我好想你」（IMU，域名 wohaoxiangni.com，下称「本平台」）是一个
      <strong>纯公益、非营利</strong>的全球失踪人口信息聚合平台。本平台不收取任何费用，
      不提供有偿寻人服务，也不接受任何形式的商业委托。
    </p>
    <p>
      本平台<strong>不是执法机构，也不替代报警</strong>。如您需要报案或提供正式线索，
      请直接联系当地公安机关或相应国家/地区的执法部门。
    </p>

    <h2>二、信息来源与准确性</h2>
    <p>本平台展示的失踪人口信息来自两类渠道：</p>
    <ul>
      <li>各国、各地区公开发布的官方或公益数据源（例如香港警务处失踪人士公告、美国 NamUs 数据库等）；</li>
      <li>用户主动提交并经本平台审核发布的信息。</li>
    </ul>
    <p>
      本平台尽力保持信息与来源同步，但<strong>不对任何信息的准确性、时效性或完整性作出保证</strong>。
      部分案例可能已经找到、已经结案或信息已过期。请以原始来源与官方渠道为准。
    </p>

    <h2>三、用户提交内容</h2>
    <p>当您提交失踪信息、线索、评论或疑问时，您承诺：</p>
    <ul>
      <li>所提交内容真实，不存在编造、恶意误导或虚假求助；</li>
      <li>您对所上传照片拥有合法使用权，或已取得权利人/监护人同意；</li>
      <li>不提交与寻人无关的广告、募捐、政治宣传或违法内容；</li>
      <li>不利用本平台从事骚扰、人身攻击、敲诈、诈骗或人口贩运等任何违法行为。</li>
    </ul>
    <p>
      所有用户提交内容均需<strong>经人工审核后才会公开展示</strong>。本平台有权在不另行通知的情况下，
      拒绝、修改或下架任何不符合上述要求的内容。
    </p>

    <h2>四、不支持私下联系</h2>
    <p>
      为降低诈骗与二次伤害风险，本平台<strong>不公开任何提交者的联系方式</strong>，
      也不提供用户之间的私信功能。您在提交时填写的联系方式仅用于审核沟通，不会对外展示。
      若您掌握重要线索，请通过本平台的线索提交入口提交，或直接联系当地执法机关。
    </p>

    <h2>五、知识产权</h2>
    <p>
      本平台的界面设计、标识（IMU）与自有代码归平台运营者所有。
      来自第三方公开数据源的内容，其权利归原始来源所有，本平台仅作聚合与转载展示，
      并尽力标注来源与原始链接。如您认为某项内容侵犯了您的权益，请通过下方方式联系我们，
      我们会在核实后及时处理。
    </p>

    <h2>六、免责声明</h2>
    <p>
      本平台以「现状」提供服务，不对服务的不中断、无错误作出承诺。
      在法律允许的最大范围内，本平台不对因使用或无法使用本平台、
      或因依赖平台上任何信息而产生的直接或间接损失承担责任。
    </p>

    <h2>七、协议变更</h2>
    <p>
      本协议可能随平台功能调整而更新，更新后将在本页面公布并变更「最后更新」日期。
      您继续使用本平台即视为接受更新后的协议。
    </p>

    <h2>八、联系我们</h2>
    <p>
      如对本协议有疑问，或需要更正、下架某项信息，请通过本平台
      <a href="/submit">提交页面</a>联系我们。本协议以中文版本为准，
      其他语言版本仅供参考。
    </p>
  </>
);

const en = (
  <>
    <h2>1. About this platform</h2>
    <p>
      IMU (&quot;I Miss You&quot;, wohaoxiangni.com, the &quot;Platform&quot;) is a{" "}
      <strong>strictly non-profit</strong> aggregator of publicly available missing-person
      information. It charges no fees, sells no search services, and accepts no commercial
      commissions.
    </p>
    <p>
      The Platform is <strong>not a law enforcement body and is not a substitute for
      contacting the police</strong>. To file a report or submit a formal tip, contact your
      local police or the relevant authority in the country concerned.
    </p>

    <h2>2. Sources and accuracy</h2>
    <p>Records shown here come from two kinds of source:</p>
    <ul>
      <li>Official or public-interest datasets published by governments and organisations (e.g. the Hong Kong Police Force missing-persons notices, the US NamUs database);</li>
      <li>Submissions from users, published only after review.</li>
    </ul>
    <p>
      We make a good-faith effort to stay in sync with those sources, but{" "}
      <strong>make no warranty as to the accuracy, timeliness or completeness</strong> of any
      record. Some cases may already be resolved or closed. Always defer to the original
      source and official channels.
    </p>

    <h2>3. User submissions</h2>
    <p>By submitting a case, tip, comment or question you confirm that:</p>
    <ul>
      <li>the content is truthful and not fabricated or deliberately misleading;</li>
      <li>you have the right to use any photo you upload, or have the consent of the rights holder or guardian;</li>
      <li>you will not submit advertising, fundraising appeals, political material or unlawful content;</li>
      <li>you will not use the Platform for harassment, defamation, extortion, fraud or human trafficking.</li>
    </ul>
    <p>
      All submissions are <strong>reviewed by a human before publication</strong>. We may
      refuse, edit or remove any content that does not meet the above, without prior notice.
    </p>

    <h2>4. No private contact</h2>
    <p>
      To reduce the risk of fraud and re-victimisation, the Platform{" "}
      <strong>never publishes a submitter&apos;s contact details</strong> and offers no direct
      messaging between users. Contact details you provide are used solely for review
      correspondence. If you have a substantive lead, submit it through the Platform or go
      directly to local law enforcement.
    </p>

    <h2>5. Intellectual property</h2>
    <p>
      The Platform&apos;s interface, the IMU mark and our own code belong to the Platform
      operator. Content originating from third-party public datasets remains the property of
      those sources; we aggregate and display it with attribution and a link to the original
      wherever possible. If you believe content here infringes your rights, contact us and we
      will act once verified.
    </p>

    <h2>6. Disclaimer</h2>
    <p>
      The Platform is provided &quot;as is&quot;, without any promise of uninterrupted or
      error-free operation. To the fullest extent permitted by law, we are not liable for any
      direct or indirect loss arising from use of, inability to use, or reliance on anything
      published on the Platform.
    </p>

    <h2>7. Changes</h2>
    <p>
      These terms may change as the Platform evolves. Changes are published on this page and
      reflected in the &quot;Last updated&quot; date. Continued use constitutes acceptance.
    </p>

    <h2>8. Contact</h2>
    <p>
      For questions, corrections or takedown requests, reach us via the{" "}
      <a href="/submit">submission page</a>. The Chinese version of these terms prevails;
      other languages are provided for convenience only.
    </p>
  </>
);

export default function TermsPage() {
  return (
    <LegalPage
      titleZh="用户协议"
      titleEn="Terms of Service"
      updated={UPDATED}
      zh={zh}
      en={en}
    />
  );
}
