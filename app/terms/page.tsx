// app/terms/page.tsx
// 服務條款(草案)。涵蓋約球、商城、教練等功能之使用規範、停權與責任限制。
// 所有條文均為草案,正式上線前須經律師核閱。Footer「服務條款」連結指向本頁。
import type { Metadata } from "next";
import Link from "next/link";

export const metadata: Metadata = {
  title: "服務條款",
  description: "VEKTR 服務條款(草案)— 使用本平台之權利義務與規範。",
};

const UPDATED = "2026-06-09";

export default function TermsPage() {
  return (
    <div className="bg-[var(--color-bg)]">
      <div className="max-w-3xl mx-auto px-6 lg:px-8 py-16">
        {/* 草案警示 */}
        <div className="mb-10 rounded-lg border border-amber-300 bg-amber-50 px-5 py-4 text-sm text-amber-900">
          <strong className="font-bold">草案版本,需專業確認。</strong>{" "}
          本頁內容為內部草擬,尚未經律師核閱,不構成最終法律文件,正式生效前可能修改。
        </div>

        <h1 className="text-3xl font-black tracking-tight text-[var(--color-text)]">
          服務條款
        </h1>
        <p className="mt-2 text-sm text-[var(--color-text-muted)]">
          最後更新:{UPDATED}(草案)
        </p>

        <div className="mt-10 space-y-10 text-[var(--color-text)] leading-relaxed">
          <Section title="1. 條款之接受">
            <p>
              本服務條款(以下簡稱「本條款」)為您與關於時間科技股份有限公司(以下簡稱「本公司」)就使用 VEKTR
              匹克球生態系平台(以下簡稱「本平台」)所訂立之契約。當您註冊、登入或使用本平台任何服務時,即表示您已閱讀、瞭解並同意受本條款及{" "}
              <Link href="/privacy" className="text-[var(--color-primary)] underline">
                隱私政策
              </Link>{" "}
              之拘束。若您不同意,請勿使用本平台。
            </p>
          </Section>

          <Section title="2. 服務內容">
            <p>
              本平台提供球場資訊、教練媒合、約球媒合、商城購物與學習資源等服務。本公司得隨時新增、修改或終止全部或部分服務,並儘可能於合理期間前公告。
            </p>
          </Section>

          <Section title="3. 帳號與登入">
            <p>
              球友會員以 LINE 帳號登入。您應確保所提供之資料正確且即時更新,並妥善保管登入憑證。您須對以您帳號所為之一切行為負責。如發現帳號遭未經授權使用,應立即通知本公司。
            </p>
          </Section>

          <Section title="4. 使用者行為規範">
            <p>使用本平台時,您同意不從事下列行為:</p>
            <ul className="mt-3 list-disc pl-6 space-y-1">
              <li>提供不實資料,或冒用他人身分</li>
              <li>騷擾、威脅、霸凌或歧視其他使用者</li>
              <li>於約球活動中無故未到(no-show)或從事不安全行為</li>
              <li>張貼違法、不實、侵害他人權利或妨害公序良俗之內容</li>
              <li>以自動化程式、爬蟲或其他方式干擾或破壞平台運作</li>
              <li>從事任何違反中華民國法令之行為</li>
            </ul>
          </Section>

          <Section title="5. 約球媒合">
            <p>
              本平台之約球功能僅提供使用者間之媒合與資訊交流。實際球局之安排、場地費用、人身安全及參與者間之互動,均由使用者自行負責。本公司非球局之主辦人,不對球局之進行、場地狀況或參與者間之爭議負責。請您於參與前自行評估風險並注意自身安全。
            </p>
          </Section>

          <Section title="6. 商城購物條款">
            <p>
              VEKTR 商城(/shop)由本公司自營銷售匹克球相關商品。您於商城下單即構成與本公司之買賣契約,並同意本章條款;本章未約定者,適用本條款其他章節及《消費者保護法》等相關法令。
            </p>
            <p>
              <strong>商品與價格:</strong>商品圖片、規格、顏色因螢幕顯示而有差異,以實際商品為準;價格以結帳當下頁面顯示之金額(新台幣含稅)為準,訂單明細為下單當下之快照,事後調價不影響已成立訂單。
            </p>
            <p>
              <strong>訂單成立:</strong>您完成結帳並經金流機構確認付款(信用卡即時授權成功,或超商代碼/ATM 完成繳費)後,訂單始為成立。本公司保留因標價明顯錯誤、存貨不足或疑似異常下單等情形,於通知後取消訂單並全額退款之權利。
            </p>
            <p>
              <strong>付款與配送:</strong>本商城透過綠界科技(ECPay)金流收款,提供信用卡、ATM 虛擬帳號、超商代碼;ATM 與超商代碼為非即時付款,取號後須於 3 日內完成繳費,逾期訂單自動取消並回補庫存。配送提供超商取貨與宅配,出貨後提供寄貨編號/物流單號供查詢。本公司不儲存您完整之金流帳戶資訊。
            </p>
            <p>
              <strong>七日猶豫期(非試用期):</strong>依《消費者保護法》第 19 條,您透過本商城購買商品,得自收受商品之次日起 7 日內,以退回商品或書面通知方式,無須說明理由解除契約,且無須負擔費用或對價。為保留全額退款權利,請保持商品本體、配件、贈品、包裝及吊牌完整;商品經拆封使用、人為毀損或已非可再販售狀態者,本公司得就減損價值請求補償或拒絕退貨。
            </p>
            <p>
              <strong>不適用七日猶豫期之商品:</strong>依《通訊交易解除權合理例外情事適用準則》,下列商品經您於購買頁面同意後不適用七日猶豫期(商品本身瑕疵不在此限),且購買頁將明確標示並請您勾選確認:
            </p>
            <ul className="mt-3 list-disc pl-6 space-y-1">
              <li>易腐敗或保存期限較短之商品</li>
              <li>依您要求所為之客製化給付(如客製印字/刻字球拍)</li>
              <li>經您拆封之個人衛生用品(如貼身護具、襪類)</li>
              <li>一經提供即完成之數位內容或線上服務</li>
            </ul>
            <p>
              <strong>退換貨與退款:</strong>猶豫期內請來信 service@abouttime-tech.com,提供訂單編號、品項與原因(瑕疵請附照片);本公司確認商品狀態後安排退回,並於收到退回商品驗收無誤後辦理退款。信用卡採原卡退刷,款項依發卡銀行作業約 7–30 日退回;ATM/超商代碼請提供退款帳戶。瑕疵或寄錯之退回運費由本公司負擔。
            </p>
            <p>
              <strong>發票:</strong>本公司依法就每筆成立訂單開立電子發票,以您結帳所留電子信箱/載具寄送;退貨或取消時依規定作廢或開立折讓單。消費爭議得依《消費者保護法》向地方政府消費者保護單位申訴,或撥消費者服務專線 1950。
            </p>
          </Section>

          <Section title="7. 教練服務">
            <p>
              教練服務之內容、費用與時間,由您與教練於本平台約定。本公司提供媒合與紀錄功能,惟教練服務之品質與履行由提供服務之教練負責。
            </p>
          </Section>

          <Section title="8. 檢舉與停權">
            <p>
              為維護社群安全,本平台提供檢舉機制。當使用者違反本條款或相關法令時,本公司得視情節暫時或永久停權其帳號、移除相關內容,或採取其他必要措施。停權期間您將無法使用須登入之功能。本公司就停權之認定保有合理裁量權,並儘可能告知事由。
            </p>
          </Section>

          <Section title="9. 智慧財產權">
            <p>
              本平台之商標、介面、文字、圖像、程式及其他內容,其智慧財產權均屬本公司或其權利人所有。非經事前書面同意,您不得重製、散布、改作或為其他侵害權利之利用。您就自行張貼之內容,授予本公司於營運必要範圍內使用之非專屬授權。
            </p>
          </Section>

          <Section title="10. 免責與責任限制">
            <p>
              本平台依「現狀」提供服務。於法律允許之最大範圍內,本公司不保證服務絕無中斷、錯誤或完全符合您的特定需求。對於因使用或無法使用本平台所生之間接、附隨或衍生性損害,本公司不負賠償責任。本條款不排除或限制依法不得排除或限制之責任。
            </p>
          </Section>

          <Section title="11. 條款修改">
            <p>
              本公司得不時修訂本條款,修訂後將於本平台公告並更新上方日期。於變更後繼續使用本平台,視為您接受修訂後之內容。
            </p>
          </Section>

          <Section title="12. 準據法與管轄">
            <p>
              本條款之解釋與適用,以中華民國法律為準據法。因本條款或本平台所生之爭議,雙方同意以臺灣臺北地方法院為第一審管轄法院,但不排除消費者保護法等法令對消費者管轄之保護規定。
            </p>
          </Section>

          <Section title="13. 聯絡我們">
            <p>
              如對本條款有任何疑問,請聯絡:關於時間科技股份有限公司,電子郵件{" "}
              <a
                className="text-[var(--color-primary)] underline"
                href="mailto:jim@abouttime.com.tw"
              >
                jim@abouttime.com.tw
              </a>
              。
            </p>
          </Section>
        </div>

        <div className="mt-12 pt-8 border-t border-slate-200 text-sm">
          <Link href="/privacy" className="text-[var(--color-primary)] underline">
            隱私政策
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
