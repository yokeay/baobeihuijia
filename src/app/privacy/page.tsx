import type { Metadata } from "next";
import { LegalPage } from "@/components/layout/LegalPage";

const UPDATED = "2026-09-05";

export const metadata: Metadata = {
  title: "隐私政策",
  description:
    "我好想你（IMU）公益寻人平台隐私政策：我们收集哪些信息、如何使用、如何存储、第三方处理者、您的权利与注销方式。",
  alternates: { canonical: "https://wohaoxiangni.com/privacy" },
};

const zh = (
  <>
    <h2>一、总则</h2>
    <p>
      「我好想你」（IMU，下称「本平台」）是纯公益寻人信息聚合平台。
      我们<strong>不出售、不出租、不以任何形式交易用户个人信息</strong>，
      也不将其用于广告投放或用户画像。本政策说明我们实际收集哪些数据、为什么收集、以及您能如何控制它们。
    </p>

    <h2>二、我们收集的信息</h2>
    <p><strong>1. 您主动提供的信息</strong></p>
    <ul>
      <li><strong>登录信息</strong>：手机号。用于账号识别与登录，不对外展示。</li>
      <li><strong>账号资料</strong>：系统随机生成的用户名与头像标识。您可自愿补充微信、QQ、抖音、B站、X、Instagram、Facebook、邮箱等联系方式。</li>
      <li><strong>提交内容</strong>：失踪人员信息、照片、线索、评论、疑问，以及您填写的联系方式。</li>
    </ul>
    <p><strong>2. 自动产生的信息</strong></p>
    <ul>
      <li><strong>浏览量统计</strong>：为避免重复计数，我们会记录一个不可逆的浏览指纹，不用于跨站跟踪。</li>
      <li><strong>地区判断</strong>：为决定默认展示哪个地区的数据与界面语言，我们会将您的 IP 提交给第三方地理位置服务查询国家代码。我们<strong>不存储</strong>您的 IP，也不会自动切换地区——切换需要您点击确认。</li>
      <li><strong>操作日志</strong>：登录、关注、提交等行为会记录用于安全审计与滥用防范。</li>
    </ul>
    <p>
      我们<strong>不使用第三方广告或分析类 Cookie</strong>。
    </p>

    <h2>三、我们如何使用这些信息</h2>
    <ul>
      <li>展示与传播失踪人员信息，这是本平台的核心目的；</li>
      <li>人工审核用户提交内容，必要时通过您留下的联系方式与您核实；</li>
      <li>统计浏览量与关注数，帮助更多人看到长期未被关注的案例；</li>
      <li>防范虚假信息、骚扰与滥用。</li>
    </ul>
    <p>
      <strong>您填写的联系方式不会公开展示</strong>，仅用于审核沟通。本平台不提供用户间私信功能。
    </p>

    <h2>四、儿童与未成年人信息</h2>
    <p>
      失踪人口信息中不可避免会包含未成年人的姓名与照片。
      这些信息来自公开的官方寻人公告或由其监护人/近亲提交，目的仅限于协助寻找。
      如您是未成年当事人的监护人，希望更正或撤下相关信息，请联系我们，我们会优先处理。
    </p>

    <h2>五、第三方</h2>
    <p>本平台向以下第三方传递必要的最小数据：</p>
    <ul>
      <li><strong>地理位置服务</strong>：接收您的 IP 以返回国家代码，用于决定默认地区。</li>
      <li><strong>Cloudflare</strong>：作为网站前置的 CDN 与安全防护，会按其自身政策处理访问请求。</li>
      <li><strong>公开数据源</strong>：我们从其抓取数据，不向其回传任何用户信息。</li>
    </ul>

    <h2>六、数据存储与安全</h2>
    <p>
      数据存储在本平台自有服务器的数据库中。密码类凭据经过哈希处理后存储，绝不以明文保存。
      我们采取合理的技术与管理措施保护数据，但请理解<strong>没有任何互联网传输或存储方式是绝对安全的</strong>。
    </p>

    <h2>七、您的权利</h2>
    <ul>
      <li><strong>查阅与更正</strong>：您可在个人资料页查看并修改账号信息与联系方式。</li>
      <li><strong>删除与注销</strong>：您可要求删除您提交的内容或注销账号。注销后账号信息将被删除，
      但已发布的失踪人员案例可能因公共利益与来源方要求而保留——这类记录多来自公开官方数据源，
      并非您的个人信息。</li>
      <li><strong>撤回同意</strong>：您可随时删除自愿填写的联系方式。</li>
    </ul>
    <p>
      行使以上权利请通过<a href="/submit">提交页面</a>联系我们。
    </p>

    <h2>八、政策更新</h2>
    <p>
      本政策更新后会在本页面公布并变更「最后更新」日期。涉及重大变更时，我们会在站内显著位置提示。
    </p>

    <h2>九、联系我们</h2>
    <p>
      隐私相关问题请通过<a href="/submit">提交页面</a>联系我们。
      本政策以中文版本为准，其他语言版本仅供参考。
    </p>
  </>
);

const en = (
  <>
    <h2>1. Overview</h2>
    <p>
      IMU (&quot;I Miss You&quot;, the &quot;Platform&quot;) is a strictly non-profit
      aggregator of missing-person information. We{" "}
      <strong>do not sell, rent or trade personal data</strong> and do not use it for
      advertising or profiling. This policy explains what we actually collect, why, and how you
      can control it.
    </p>

    <h2>2. What we collect</h2>
    <p><strong>Information you provide</strong></p>
    <ul>
      <li><strong>Sign-in</strong>: your phone number, used to identify your account. Never displayed publicly.</li>
      <li><strong>Profile</strong>: a randomly generated username and avatar seed. You may optionally add WeChat, QQ, Douyin, Bilibili, X, Instagram, Facebook or email.</li>
      <li><strong>Submissions</strong>: missing-person details, photos, tips, comments, questions and the contact details you enter.</li>
    </ul>
    <p><strong>Information generated automatically</strong></p>
    <ul>
      <li><strong>View counts</strong>: an irreversible fingerprint is stored to avoid double counting. It is not used for cross-site tracking.</li>
      <li><strong>Region detection</strong>: to choose which country&apos;s data and which UI language to show first, your IP is sent to a third-party geolocation service to obtain a country code. We <strong>do not store your IP</strong>, and we never switch region automatically — that needs your click.</li>
      <li><strong>Activity log</strong>: sign-ins, follows and submissions are logged for security and abuse prevention.</li>
    </ul>
    <p>
      We use <strong>no third-party advertising or analytics cookies</strong>.
    </p>

    <h2>3. How we use it</h2>
    <ul>
      <li>To publish and spread missing-person information — the Platform&apos;s core purpose;</li>
      <li>To review submissions, contacting you if something needs verifying;</li>
      <li>To count views and follows so long-neglected cases can be surfaced;</li>
      <li>To detect false information, harassment and abuse.</li>
    </ul>
    <p>
      <strong>Contact details you provide are never published</strong> — they are used only for
      review correspondence. There is no direct messaging between users.
    </p>

    <h2>4. Information about minors</h2>
    <p>
      Missing-person records unavoidably include the names and photographs of minors. Such
      information comes from public official appeals or from a guardian or close relative, and
      is used solely to help find them. If you are the guardian of a minor and want a record
      corrected or removed, contact us — we prioritise these requests.
    </p>

    <h2>5. Third parties</h2>
    <ul>
      <li><strong>Geolocation service</strong>: receives your IP and returns a country code.</li>
      <li><strong>Cloudflare</strong>: fronts the site as CDN and protection, handling requests under its own policy.</li>
      <li><strong>Public datasets</strong>: we read from them; no user data is ever sent back.</li>
    </ul>

    <h2>6. Storage and security</h2>
    <p>
      Data is stored in a database on the Platform&apos;s own servers. Credentials are hashed,
      never stored in plain text. We apply reasonable technical and organisational safeguards,
      but please understand that <strong>no method of internet transmission or storage is
      completely secure</strong>.
    </p>

    <h2>7. Your rights</h2>
    <ul>
      <li><strong>Access and correction</strong>: view and edit your account details on your profile page.</li>
      <li><strong>Deletion</strong>: you may ask us to delete your submissions or close your account. Account data is then removed, though published missing-person records may be retained in the public interest or at the source&apos;s requirement — such records mostly originate from official public datasets and are not your personal data.</li>
      <li><strong>Withdraw consent</strong>: optional contact details can be removed at any time.</li>
    </ul>
    <p>
      To exercise these rights, reach us via the <a href="/submit">submission page</a>.
    </p>

    <h2>8. Changes</h2>
    <p>
      Updates are published here with a new &quot;Last updated&quot; date. Material changes
      will also be flagged prominently on the site.
    </p>

    <h2>9. Contact</h2>
    <p>
      For privacy questions use the <a href="/submit">submission page</a>. The Chinese version
      of this policy prevails; other languages are for convenience only.
    </p>
  </>
);

export default function PrivacyPage() {
  return (
    <LegalPage
      titleZh="隐私政策"
      titleEn="Privacy Policy"
      updated={UPDATED}
      zh={zh}
      en={en}
    />
  );
}
