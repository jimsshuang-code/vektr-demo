// app/privacy/page.tsx
// 隱私權政策 v0.2(草案,需律師核定)。內容來源:公司提供之 v0.2 草案,
// 依台灣《個人資料保護法》第 8/3/6/21 條並參酌 GDPR 撰寫。以全站 navy/lime 樣式呈現。
// 重要:[待填] 為公司應填之事實;[待法務確認] 條款須律師核定。定版前不得對真實使用者
// 開放註冊,亦不得部署至正式站。
import type { Metadata } from "next";
import Link from "next/link";

export const metadata: Metadata = {
  title: "隱私權政策",
  description: "VEKTR 隱私權政策(草案 v0.2)— 我們如何蒐集、處理及保護您的個人資料。",
};

const TOC = [
  ["01", "s1", "前言與適用範圍"],
  ["02", "s2", "個資管理者"],
  ["03", "s3", "蒐集之個人資料"],
  ["04", "s4", "蒐集目的與法律依據"],
  ["05", "s5", "LINE 登入資料"],
  ["06", "s6", "約球功能與隱私"],
  ["07", "s7", "特種個人資料"],
  ["08", "s8", "利用方式與範圍"],
  ["09", "s9", "第三方與委外處理"],
  ["10", "s10", "國際傳輸"],
  ["11", "s11", "Cookie 與追蹤技術"],
  ["12", "s12", "資料保存期間"],
  ["13", "s13", "資料安全措施"],
  ["14", "s14", "您的權利"],
  ["15", "s15", "未成年人保護"],
  ["16", "s16", "修訂、主管機關與聯絡"],
] as const;

export default function PrivacyPolicyPage() {
  return (
    <div className="bg-[var(--color-bg)]">
      <div className="max-w-3xl mx-auto px-6 lg:px-8 py-16">
        {/* Masthead */}
        <p className="font-mono text-xs tracking-[0.2em] uppercase text-[var(--color-text-muted)]">
          Taiwan&apos;s pickleball platform · 台灣 pickleball(匹克球)平台
        </p>
        <h1 className="mt-6 text-4xl font-black tracking-tight text-[var(--color-text)]">
          隱私權政策
        </h1>
        <p className="mt-1 font-mono text-sm tracking-widest uppercase text-[var(--color-text-muted)]">
          Privacy Policy
        </p>
        <div className="mt-5 flex flex-wrap gap-2 text-xs font-mono">
          <span className="border border-slate-300 px-2.5 py-1 text-[var(--color-text-muted)]">
            VERSION v0.2
          </span>
          <span className="border border-amber-300 bg-amber-50 px-2.5 py-1 text-amber-700">
            DRAFT · 待律師核定
          </span>
          <span className="border border-slate-300 px-2.5 py-1 text-[var(--color-text-muted)]">
            生效日:<Fill>[待填]</Fill>
          </span>
        </div>

        {/* Warning banner */}
        <div className="mt-8 border-l-4 border-amber-400 bg-amber-50 px-5 py-4 text-sm text-amber-900 leading-relaxed">
          <strong className="font-bold text-amber-700">本文件為草案 v0.2。</strong>{" "}
          標示「待法務確認」之條款尚未經律師核定,
          <strong className="font-bold">定版前不得對真實使用者開放註冊</strong>
          ,亦不得部署至正式站。標示 <Fill>[待填]</Fill>{" "}
          之項目為公司應填寫之事實資料。本草案依台灣《個人資料保護法》第 8 條告知事項、第 3
          條當事人權利、第 6 條特種個資、第 21 條國際傳輸要件,並參酌 GDPR
          法律依據與自動化處理揭露原則撰寫。
        </div>

        {/* TOC */}
        <nav
          aria-label="目錄"
          className="mt-10 border border-slate-200 px-6 py-5"
        >
          <h2 className="font-mono text-xs tracking-[0.2em] uppercase text-[var(--color-text-muted)]">
            目錄 · Contents
          </h2>
          <ol className="mt-3 grid grid-cols-1 sm:grid-cols-2 gap-x-7 gap-y-1.5">
            {TOC.map(([n, id, label]) => (
              <li key={id} className="flex gap-2.5 items-baseline text-sm">
                <span className="font-mono text-xs text-[var(--color-primary)]">{n}</span>
                <a
                  href={`#${id}`}
                  className="text-[var(--color-text)] hover:underline"
                >
                  {label}
                </a>
              </li>
            ))}
          </ol>
        </nav>

        {/* Sections */}
        <div className="mt-4">
          <Section n="01" id="s1" title="前言與適用範圍" en="Introduction & Scope">
            <p>
              VEKTR(以下稱「本平台」)是一個整合商品(SHOP)、場地(COURT)、教練(COACH)、約球(MATCH)、學習(LEARN)五大模組的
              pickleball
              雙邊平台,由下述個資管理者營運。本政策說明本平台如何蒐集、處理、利用及保護您的個人資料。
            </p>
            <p>
              本政策適用於您透過本平台網站、行動介面及相關服務與我們互動所產生之個人資料。當您註冊、登入或使用本平台任一功能,即表示您已閱讀並瞭解本政策內容。
            </p>
            <p>
              本平台之第三方服務(如 LINE
              登入)另有其各自之隱私政策,該等政策非由本平台管控,建議您一併參閱。
            </p>
          </Section>

          <Section n="02" id="s2" title="個資管理者" en="Data Controller">
            <p>本平台之個人資料管理者(Data Controller)為:</p>
            <KV
              rows={[
                ["公司名稱", <>關於時間科技股份有限公司(VEKTR 為其經營之品牌)</>],
                [
                  "統一編號",
                  <>
                    24718812{" "}
                    <span className="ml-1 inline-block border-l-2 border-amber-300 bg-amber-50 px-2 py-0.5 text-xs text-amber-800">
                      公司請核對
                    </span>
                  </>,
                ],
                ["登記地址", <Fill>[待填]</Fill>],
                ["正式網域", <Fill>[待填,目前為 demo 網址]</Fill>],
                ["個資保護窗口", <Fill>[待填:姓名／部門]</Fill>],
                [
                  "聯絡信箱",
                  <>
                    service@abouttime-tech.com
                    <Fill>(建議另設 privacy@正式網域)</Fill>
                  </>,
                ],
              ]}
            />
            <Note>
              公司英文名稱於不同文件曾有不一致情形,定版前須統一;聯絡信箱須確認可正常收信。
            </Note>
          </Section>

          <Section n="03" id="s3" title="我們蒐集的個人資料" en="Personal Data We Collect">
            <p>視您使用之功能,本平台可能蒐集下列類別之個人資料:</p>
            <H3>(1) 帳號與身分識別資料</H3>
            <ul className="list-disc pl-5 space-y-2">
              <li>
                透過 LINE 登入取得之識別碼(user ID /
                sub)、顯示名稱、大頭貼網址、電子郵件(若您於 LINE 授權提供)。
              </li>
              <li>您於平台填寫之暱稱、聯絡方式。</li>
            </ul>
            <H3>(2) 運動與社群資料</H3>
            <ul className="list-disc pl-5 space-y-2">
              <li>球技等級(如 DUPR)、所在地區、約球紀錄、參與球局、評分與檢舉紀錄。</li>
            </ul>
            <H3>(3) 裝置與使用紀錄</H3>
            <ul className="list-disc pl-5 space-y-2">
              <li>
                IP 位址、瀏覽器與裝置資訊、存取時間、操作日誌、Cookie 與類似技術所生之資料。
              </li>
            </ul>
            <H3>(4) 交易資料(金流啟用後)</H3>
            <ul className="list-disc pl-5 space-y-2">
              <li>
                訂單、付款狀態與相關必要資料。<Fill>目前金流尚未啟用。</Fill>
              </li>
            </ul>
            <Note tag="待法務確認">
              金流啟用前,須補充揭露付款相關個人資料之處理方式與第三方支付服務商之資料流。
            </Note>
          </Section>

          <Section n="04" id="s4" title="蒐集目的與法律依據" en="Purposes & Legal Basis">
            <p>
              我們基於下列目的蒐集、處理及利用您的個人資料:提供帳號登入與身分驗證、媒合約球與社群互動、維護平台安全與秩序(含檢舉與停權機制)、客服與通知、統計分析與服務改善,以及法令要求之保存義務。
            </p>
            <p>
              就 GDPR
              而言,本平台處理個資之法律依據包含:履行契約所必要、您的同意、本平台之正當利益,以及法律義務之遵循。
            </p>
            <Note tag="待法務確認">
              本草案建議之台灣 PDPA 法定特定目的代號為:069、090、148、135、136、152、157、040,須由法務最終核定後填入。
            </Note>
          </Section>

          <Section n="05" id="s5" title="LINE 登入資料處理" en="LINE Login Data Handling">
            <p>
              本平台採用 LINE 登入(LINE Login / OpenID
              Connect)作為身分驗證方式。當您選擇以 LINE
              登入時,LINE 將依您之授權,向本平台提供您的識別碼、顯示名稱、大頭貼,以及(若您同意)電子郵件。
            </p>
            <p>
              本平台僅就上述資料用於建立與維護您的帳號、識別您的身分及提供平台功能,不會自您的
              LINE 帳號取得授權範圍以外之資料。您可隨時於 LINE
              設定中撤回對本平台之授權。
            </p>
            <p>LINE 對其所蒐集之資料另有其隱私政策,該處理行為非由本平台管控。</p>
          </Section>

          <Section n="06" id="s6" title="約球功能與隱私揭露" en="Match Feature & Privacy Disclosure">
            <p>
              約球(MATCH)功能涉及與其他使用者媒合並可能於線下實體碰面。當您建立或加入球局時,您的部分資料(如暱稱、球技等級、所在地區、參與之球局)將於相應範圍內對其他使用者顯示,以利媒合。
            </p>
            <p>
              為維護社群安全,本平台提供檢舉與停權機制;相關檢舉紀錄將用於調查與處理違規行為。
            </p>
            <Note tag="待法務確認">
              約球資訊之隱私揭露預設值(哪些欄位對誰可見、可否關閉)須由法務確認後定版;涉及線下碰面之安全免責與禁止行為條款,另於服務條款規範。
            </Note>
          </Section>

          <Section n="07" id="s7" title="特種個人資料" en="Special Category Data">
            <p>
              本平台原則上不主動蒐集《個人資料保護法》第 6
              條所定之特種個人資料(如病歷、醫療、健康檢查、基因、性生活、犯罪前科等)。
            </p>
            <p>
              若未來特定功能確有蒐集必要,本平台將另行取得您的書面或明示同意,並遵循該條規範。請勿於約球留言、暱稱或自由填寫欄位中提供非必要之高度敏感個人資料。
            </p>
          </Section>

          <Section n="08" id="s8" title="個資利用方式與範圍" en="Use of Personal Data">
            <p>
              本平台於蒐集目的之必要範圍內利用您的個人資料,利用地區包含本平台服務所及之地區(含下述國際傳輸所涉地區)。
            </p>
            <p>
              本平台可能製作去識別化或匿名化之統計資料,供投資人、合作夥伴參考或用於服務改善;該等統計資料不會揭露可識別特定個人之資訊。
            </p>
            <p>本平台不會將您的個人資料出售予第三方。</p>
          </Section>

          <Section n="09" id="s9" title="第三方服務與委外處理" en="Third Parties & Processors">
            <p>
              為提供服務,本平台委由下列類別之第三方服務商處理部分個人資料,並要求其於受託範圍內依法保護您的資料:
            </p>
            <ul className="list-disc pl-5 space-y-2">
              <li>身分驗證:LINE</li>
              <li>資料庫與後端代管:Supabase(基礎設施位於日本東京區)</li>
              <li>應用程式代管:Vercel</li>
              <li>電子郵件寄送:Resend</li>
            </ul>
            <Note tag="待法務確認">
              與上述委外機構(含 Resend、LINE
              等)之個人資料保護約定 / 資料處理協議(DPA)須完成簽署與檢視;最終服務商清單與其資料處理範圍須由法務核定。
            </Note>
          </Section>

          <Section n="10" id="s10" title="國際傳輸" en="International Transfer">
            <p>
              因本平台採用之雲端服務,您的個人資料可能被傳輸至我國境外進行儲存或處理,所涉地區包含日本(資料庫 /
              雲端基礎設施)及美國(應用程式代管、郵件及相關服務)等。
            </p>
            <p>本平台將依《個人資料保護法》第 21 條及相關規範,採取適當之保護措施。</p>
            <Note tag="待法務確認">
              各境外傳輸所對應之保護機制(如標準契約條款
              SCC、契約保護條款之具體寫法、各服務商資料落地地區清單)須由法務確認後完整列明。
            </Note>
          </Section>

          <Section n="11" id="s11" title="Cookie 與追蹤技術" en="Cookies & Tracking">
            <p>
              本平台使用 Cookie
              及類似技術以維持登入狀態、記錄偏好設定及進行統計分析。您可透過瀏覽器設定管理或停用
              Cookie,惟停用部分 Cookie 可能影響服務功能。
            </p>
            <Note tag="待法務確認">
              完整 Cookie
              清單(區分必要、功能、分析三類)及同意工具,須依實際導入之工具補完;如導入分析或行銷類
              Cookie,須搭配 Cookie 同意橫幅與後端同意紀錄。
            </Note>
          </Section>

          <Section n="12" id="s12" title="資料保存期間" en="Data Retention">
            <p>
              本平台於蒐集目的之存續期間內保存您的個人資料。當您刪除帳號或目的消失時,本平台將於合理期間內刪除或匿名化您的個人資料,但法令另有規定(如交易、會計憑證之法定保存年限)者,依其規定保存。
            </p>
            <Note tag="待法務確認">
              交易 / 會計法定保存年限、刪除帳號後之具體刪除或匿名化期間,須由法務 /
              會計師核定後填入明確期間。
            </Note>
          </Section>

          <Section n="13" id="s13" title="資料安全措施" en="Data Security">
            <p>
              本平台採取合理之技術與管理措施保護您的個人資料,包含傳輸加密、存取權限控管(含資料列級安全
              Row Level Security)、機敏資訊不進入版本控制等。
            </p>
            <p>
              惟網際網路傳輸無法保證絕對安全;若發生個人資料外洩事故,本平台將依《個人資料保護法》2025
              年修法後之規範,於法定期限內通報主管機關並通知受影響之當事人。
            </p>
            <Note tag="待法務確認">
              個資事故通報之具體流程與法定期限,須以最新生效之子法為準(修法已三讀,施行日 /
              子法尚待公布)。
            </Note>
          </Section>

          <Section n="14" id="s14" title="您的權利" en="Your Rights">
            <p>
              依《個人資料保護法》第 3
              條,您就本平台保有之個人資料得行使下列權利:查詢或請求閱覽、請求製給複製本、請求補充或更正、請求停止蒐集處理或利用、請求刪除。
            </p>
            <p>
              若您位於適用 GDPR
              之地區,您另可能享有資料可攜權、反對權及就自動化決策之相關權利。
            </p>
            <p>
              您得透過本政策第 16
              節所載聯絡方式行使上述權利。為保護您的權益,本平台於處理請求前可能需要驗證您的身分。
            </p>
          </Section>

          <Section n="15" id="s15" title="未成年人保護" en="Protection of Minors">
            <p>
              本平台之服務對象為年滿 <Fill>[待填:建議 18]</Fill>{" "}
              歲之使用者。若您未達該年齡,請勿註冊或提供個人資料。
            </p>
            <p>
              若本平台得知已蒐集未達年齡門檻者之個人資料而未取得法定代理人同意,將於查證後刪除相關資料。
            </p>
          </Section>

          <Section
            n="16"
            id="s16"
            title="政策修訂、主管機關與聯絡方式"
            en="Changes, Supervisory Authority & Contact"
          >
            <H3>政策修訂</H3>
            <p>
              本平台得不時修訂本政策。修訂時將於平台公告,重大變更將以適當方式通知您。修訂後之政策自公告或通知所載生效日起適用。
            </p>
            <H3>申訴與主管機關</H3>
            <p>若您對本平台之個資處理有疑義或申訴,得先透過下方聯絡方式與我們聯繫。</p>
            <Note tag="待法務確認">
              本服務之目的事業主管機關,以及對應之申訴管道,須由法務確認(個人資料保護委員會尚未正式運作,過渡期由目的事業主管機關監督,須確認
              VEKTR 服務歸屬之主管機關)。
            </Note>
            <H3>聯絡我們</H3>
            <KV
              rows={[
                ["個資保護窗口", <Fill>[待填:姓名／部門]</Fill>],
                [
                  "電子郵件",
                  <>
                    service@abouttime-tech.com
                    <Fill>(建議改用 privacy@正式網域)</Fill>
                  </>,
                ],
                ["公司", <>關於時間科技股份有限公司</>],
              ]}
            />
          </Section>
        </div>

        {/* Footer line */}
        <div className="mt-12 pt-6 border-t-2 border-[var(--color-text)] font-mono text-xs tracking-wider uppercase text-[var(--color-text-muted)] leading-loose">
          <div>
            VEKTR · PRIVACY POLICY v0.2 · DRAFT 待律師核定 · CONFIDENTIAL · 2026
          </div>
          <div className="mt-1 normal-case tracking-normal">
            本草案非法律意見。所有「待法務確認」項目須經律師核定後,本政策方得定版上線。
          </div>
        </div>

        <div className="mt-8 text-sm">
          <Link href="/terms" className="text-[var(--color-primary)] underline">
            服務條款
          </Link>
        </div>
      </div>
    </div>
  );
}

function Section({
  n,
  id,
  title,
  en,
  children,
}: {
  n: string;
  id: string;
  title: string;
  en: string;
  children: React.ReactNode;
}) {
  return (
    <section id={id} className="scroll-mt-24 py-9 border-t border-slate-200">
      <div className="flex gap-4 items-baseline">
        <span className="font-mono text-sm font-bold text-[var(--color-primary)] min-w-[2rem]">
          {n}
        </span>
        <h2 className="text-xl font-black text-[var(--color-text)]">{title}</h2>
      </div>
      <div className="ml-0 sm:ml-12 mt-0.5 font-mono text-xs tracking-widest uppercase text-[var(--color-text-muted)]">
        {en}
      </div>
      <div className="ml-0 sm:ml-12 mt-4 space-y-3.5 text-[var(--color-text-muted)] leading-relaxed">
        {children}
      </div>
    </section>
  );
}

function H3({ children }: { children: React.ReactNode }) {
  return (
    <h3 className="text-[15px] font-bold text-[var(--color-text)] mt-5 mb-2">
      {children}
    </h3>
  );
}

function Fill({ children }: { children: React.ReactNode }) {
  return (
    <span className="font-mono text-[13px] text-blue-600 bg-blue-50 border-b border-dashed border-blue-300 px-1">
      {children}
    </span>
  );
}

function Note({ children, tag = "需專業確認" }: { children: React.ReactNode; tag?: string }) {
  return (
    <div className="border-l-4 border-amber-300 bg-amber-50 px-4 py-3 my-3.5 text-sm text-amber-900">
      <span className="block mb-1 font-mono text-[10px] tracking-widest uppercase font-bold text-amber-700">
        {tag}
      </span>
      {children}
    </div>
  );
}

function KV({ rows }: { rows: [string, React.ReactNode][] }) {
  return (
    <div className="border border-slate-200 my-4">
      {rows.map(([k, v], i) => (
        <div
          key={i}
          className="grid grid-cols-1 sm:grid-cols-[160px_1fr] border-t border-slate-200 first:border-t-0"
        >
          <div className="px-3.5 py-2.5 bg-slate-50 text-[13px] font-bold text-[var(--color-text)]">
            {k}
          </div>
          <div className="px-3.5 py-2.5 text-sm text-[var(--color-text-muted)]">{v}</div>
        </div>
      ))}
    </div>
  );
}
