// app/privacy/page.tsx
// 隱私政策(草案)。內容依台灣《個人資料保護法》起草,所有條文均為草案,
// 正式上線前須經律師核閱。Footer「隱私政策」連結指向本頁。
import type { Metadata } from "next";
import Link from "next/link";

export const metadata: Metadata = {
  title: "隱私政策",
  description: "VEKTR 隱私政策(草案)— 關於我們如何蒐集、處理及利用您的個人資料。",
};

const UPDATED = "2026-06-09";

export default function PrivacyPolicyPage() {
  return (
    <div className="bg-[var(--color-bg)]">
      <div className="max-w-3xl mx-auto px-6 lg:px-8 py-16">
        {/* 草案警示 */}
        <div className="mb-10 rounded-lg border border-amber-300 bg-amber-50 px-5 py-4 text-sm text-amber-900">
          <strong className="font-bold">草案版本,需專業確認。</strong>{" "}
          本頁內容為內部草擬,尚未經律師核閱,不構成最終法律文件,正式生效前可能修改。
        </div>

        <h1 className="text-3xl font-black tracking-tight text-[var(--color-text)]">
          隱私政策
        </h1>
        <p className="mt-2 text-sm text-[var(--color-text-muted)]">
          最後更新:{UPDATED}(草案)
        </p>

        <div className="mt-10 space-y-10 text-[var(--color-text)] leading-relaxed">
          <Section title="1. 前言與適用範圍">
            <p>
              關於時間科技股份有限公司(以下簡稱「本公司」)經營 VEKTR
              匹克球生態系平台(以下簡稱「本平台」),整合球場、教練、約球、商城與學習資源等服務。本公司重視您的隱私,並依據中華民國《個人資料保護法》(以下簡稱「個資法」)及相關法令,蒐集、處理及利用您的個人資料。
            </p>
            <p>
              當您註冊、登入或使用本平台任何服務時,即表示您已閱讀、瞭解並同意本政策之內容。若您不同意,請停止使用本平台。
            </p>
          </Section>

          <Section title="2. 我們蒐集的個人資料(個資盤點)">
            <p className="mb-4">
              本平台依您使用的功能,蒐集下列類別之個人資料:
            </p>
            <div className="overflow-x-auto">
              <table className="w-full text-sm border-collapse">
                <thead>
                  <tr className="border-b-2 border-[var(--color-primary)] text-left">
                    <th className="py-2 pr-4 font-bold">資料類別</th>
                    <th className="py-2 pr-4 font-bold">蒐集項目</th>
                    <th className="py-2 font-bold">來源 / 時機</th>
                  </tr>
                </thead>
                <tbody className="align-top">
                  <DataRow
                    cat="身分與帳號"
                    items="LINE 使用者識別碼、暱稱、頭像、電子郵件"
                    src="您以 LINE 登入時,經您授權自 LINE 取得"
                  />
                  <DataRow
                    cat="聯絡資訊"
                    items="電話、電子郵件"
                    src="您主動於會員資料或訂單填寫"
                  />
                  <DataRow
                    cat="球技與社群"
                    items="DUPR 等級、球友關係、約球參與紀錄、賽後評分"
                    src="您使用約球、球友、等級功能時產生"
                  />
                  <DataRow
                    cat="交易"
                    items="商城訂單、購買品項、金流相關必要資訊"
                    src="您於商城下單時(金流由第三方支付處理)"
                  />
                  <DataRow
                    cat="教練服務"
                    items="教練預約與上課紀錄"
                    src="您使用教練功能時"
                  />
                  <DataRow
                    cat="檢舉與安全"
                    items="您提交或被提交的檢舉內容、停權紀錄"
                    src="使用檢舉功能,或經本平台管理機制處理時"
                  />
                  <DataRow
                    cat="技術與使用"
                    items="登入時間、IP 位址、裝置與瀏覽器資訊、操作紀錄"
                    src="您使用本平台時自動產生"
                  />
                </tbody>
              </table>
            </div>
            <p className="mt-4 text-sm text-[var(--color-text-muted)]">
              註:實際蒐集項目以本平台當前功能為準,本盤點將隨功能異動更新。
            </p>
          </Section>

          <Section title="3. 蒐集目的與利用方式">
            <p>本公司蒐集您的個人資料,係為下列目的:</p>
            <ul className="mt-3 list-disc pl-6 space-y-1">
              <li>提供帳號註冊、登入與身分驗證</li>
              <li>媒合約球、計算球技等級與配對</li>
              <li>處理商城訂單、教練預約與相關客戶服務</li>
              <li>維護平台安全,包括檢舉處理、停權與防止濫用</li>
              <li>在您同意範圍內,寄送服務通知與行銷資訊</li>
              <li>依法令要求或主管機關、司法機關之要求配合</li>
            </ul>
            <p className="mt-3">
              本公司不會在逾越上述目的之必要範圍外利用您的個人資料,亦不會將您的個人資料出售予第三人。
            </p>
          </Section>

          <Section title="4. 個人資料之利用期間、地區、對象">
            <p>
              利用期間:自您同意之日起至您終止使用、刪除帳號,或本公司停止提供服務之日止,並於法令要求之保存期間內留存。
            </p>
            <p>
              利用地區:本平台主要於中華民國境內提供服務。部分技術服務(如雲端代管、第三方登入、支付、地圖)之伺服器可能位於境外,於該等必要範圍內您的資料可能傳輸至境外。
            </p>
            <p>
              利用對象:本公司、本公司之關係企業,以及為提供服務所必要之委外廠商(例如雲端代管、第三方支付、登入服務、地圖服務等)。委外廠商僅得於本公司指示與必要範圍內處理您的資料。
            </p>
          </Section>

          <Section title="5. 第三方服務">
            <p>
              本平台整合下列類型之第三方服務,各該服務對您資料之處理另受其自身隱私政策規範:第三方登入(LINE)、第三方支付、地圖與定位服務、雲端代管與分析工具。建議您一併參閱各該服務之隱私政策。
            </p>
          </Section>

          <Section title="6. Cookie 與類似技術">
            <p>
              本平台使用 Cookie 及類似技術以維持登入狀態、記住偏好設定並改善服務。您可透過瀏覽器設定停用 Cookie,但可能影響部分功能正常運作。
            </p>
          </Section>

          <Section title="7. 您的權利(個資法第 3 條)">
            <p>就本公司保有之您的個人資料,您得行使下列權利:</p>
            <ul className="mt-3 list-disc pl-6 space-y-1">
              <li>查詢或請求閱覽</li>
              <li>請求製給複製本</li>
              <li>請求補充或更正</li>
              <li>請求停止蒐集、處理或利用</li>
              <li>請求刪除</li>
            </ul>
            <p className="mt-3">
              您可透過本政策末段之聯絡方式行使前述權利。為保護您的權益,本公司於受理時可能須先驗證您的身分。您得自由選擇是否提供個人資料,但若拒絕提供本平台運作所必要之資料,可能無法使用全部或部分服務。
            </p>
          </Section>

          <Section title="8. 資料安全">
            <p>
              本公司採取合理之技術與管理措施(例如連線加密、權限控管、資料庫存取控制)以保護您的個人資料,避免被竊取、竄改、毀損、滅失或洩漏。惟網際網路傳輸無法保證絕對安全,本公司將於發生重大資安事件時依法令通知。
            </p>
          </Section>

          <Section title="9. 未成年人">
            <p>
              若您未滿十八歲,應於法定代理人閱讀、瞭解並同意本政策後,始得使用本平台。法定代理人得就未成年人之個人資料行使本政策所載權利。
            </p>
          </Section>

          <Section title="10. 政策修改">
            <p>
              本公司得不時修訂本政策。修訂後將於本平台公告,並更新上方「最後更新」日期。重大變更將以適當方式通知。於變更後繼續使用本平台,視為您接受修訂後之內容。
            </p>
          </Section>

          <Section title="11. 聯絡我們">
            <p>
              如對本政策或您的個人資料有任何疑問或欲行使權利,請聯絡:
            </p>
            <p className="mt-2">
              關於時間科技股份有限公司
              <br />
              電子郵件:
              <a
                className="text-[var(--color-primary)] underline"
                href="mailto:jim@abouttime.com.tw"
              >
                jim@abouttime.com.tw
              </a>
            </p>
          </Section>
        </div>

        <div className="mt-12 pt-8 border-t border-slate-200 text-sm">
          <Link href="/terms" className="text-[var(--color-primary)] underline">
            服務條款
          </Link>
        </div>
      </div>
    </div>
  );
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section>
      <h2 className="text-xl font-bold text-[var(--color-text)]">{title}</h2>
      <div className="mt-3 space-y-3 text-[var(--color-text-muted)]">{children}</div>
    </section>
  );
}

function DataRow({ cat, items, src }: { cat: string; items: string; src: string }) {
  return (
    <tr className="border-b border-slate-200">
      <td className="py-3 pr-4 font-medium text-[var(--color-text)] whitespace-nowrap">
        {cat}
      </td>
      <td className="py-3 pr-4 text-[var(--color-text-muted)]">{items}</td>
      <td className="py-3 text-[var(--color-text-muted)]">{src}</td>
    </tr>
  );
}
