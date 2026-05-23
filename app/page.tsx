import Link from "next/link";

const stats = [
  { value: "6", label: "功能模組", labelEn: "MODULES" },
  { value: "4", label: "使用者角色", labelEn: "ROLES" },
  { value: "25+", label: "服務頁面", labelEn: "PAGES" },
  { value: "∞", label: "成長潛力", labelEn: "POTENTIAL" },
];

const modules = [
  {
    code: "M01",
    name: "電商商城",
    nameEn: "Shop",
    desc: "球拍、球袋、球及配件展示，含試打預約與教練分潤機制",
    href: "/shop",
  },
  {
    code: "M02",
    name: "球場地圖",
    nameEn: "Courts",
    desc: "LBS 全台球場地圖，含場地照片、評分、收費時段與打卡簽到",
    href: "/courts",
  },
  {
    code: "M03",
    name: "教練媒合",
    nameEn: "Coaching",
    desc: "教練個人頁、線上預約、團體課揪團與課後雙向評價",
    href: "/coaches",
  },
  {
    code: "M04",
    name: "約球配對",
    nameEn: "Match",
    desc: "DUPR 分級、開房揪團、自動配對、單雙打報名與球友互評",
    href: "/match",
  },
  {
    code: "M05",
    name: "知識中心",
    nameEn: "Learn",
    desc: "規則教學、技術影片、選拍指南、賽事資訊與品牌專欄",
    href: "/learn",
  },
  {
    code: "M06",
    name: "會員中心",
    nameEn: "Member",
    desc: "個人訂單、DUPR 等級、球友清單與教練紀錄整合管理",
    href: "/member",
  },
];

const roles = [
  {
    letter: "N",
    name: "新手玩家",
    nameEn: "Beginner",
    needs: "想學球、想買第一支拍、需要規則教學、想找入門球場",
  },
  {
    letter: "A",
    name: "進階玩家",
    nameEn: "Advanced",
    needs: "找同程度球友、找好球場、升級裝備、參加賽事",
  },
  {
    letter: "C",
    name: "認證教練",
    nameEn: "Coach",
    needs: "接學生、開課、建立個人品牌、銷售推薦裝備分潤",
  },
  {
    letter: "B",
    name: "品牌方",
    nameEn: "Brand",
    needs: "商品上架、KOL 合作、數據洞察、會員經營",
  },
];

const flywheel = [
  {
    num: "01",
    title: "使用者上門",
    desc: "透過知識內容、球場地圖、約球功能引流，降低獲客成本",
  },
  {
    num: "02",
    title: "行為累積",
    desc: "打球記錄、教練評價、約球頻率產出個人化資料",
  },
  {
    num: "03",
    title: "智慧推薦",
    desc: "依等級、打法、教練建議推薦合適球拍與裝備",
  },
  {
    num: "04",
    title: "轉換 + 回饋",
    desc: "商品銷售、球友推薦分潤、UGC 內容回到平台",
  },
];

export default function Home() {
  return (
    <>
      {/* ========== HERO ========== */}
      <section className="relative bg-[var(--color-bg-dark)] text-white overflow-hidden">
        {/* Background decoration */}
        <div className="absolute inset-0 opacity-10">
          <div className="absolute top-1/4 -left-20 w-96 h-96 bg-[var(--color-accent)] rounded-full blur-3xl" />
          <div className="absolute bottom-1/4 -right-20 w-96 h-96 bg-[var(--color-primary)] rounded-full blur-3xl" />
        </div>

        <div className="relative max-w-7xl mx-auto px-6 lg:px-8 py-24 md:py-32">
          <div className="max-w-4xl">
            <div className="inline-block px-3 py-1 mb-6 text-xs font-bold tracking-widest text-[var(--color-accent)] border border-[var(--color-accent)] rounded">
              PICKLEBALL PLATFORM · v1.0
            </div>
            <h1 className="text-5xl md:text-7xl font-black leading-tight mb-6 tracking-tight">
              台灣首個
              <br />
              <span className="text-[var(--color-accent)]">PICKLEBALL</span>
              <br />
              生態系平台
            </h1>
            <p className="text-lg md:text-xl text-slate-300 leading-relaxed mb-10 max-w-2xl font-serif-tc">
              電商 × 社群 × 教學三位一體。連結球場、教練、球友與品牌，讓 pickleball 不只是運動，而是一整個生活圈。
            </p>
            <div className="flex flex-col sm:flex-row gap-4">
              <Link
                href="/match/find"
                className="inline-flex items-center justify-center px-8 py-4 bg-[var(--color-accent)] hover:bg-[var(--color-accent-dark)] text-[var(--color-text)] font-bold rounded-md transition-colors"
              >
                開始約球
              </Link>
              <Link
                href="/learn"
                className="inline-flex items-center justify-center px-8 py-4 bg-transparent border-2 border-white/30 hover:border-white/60 text-white font-bold rounded-md transition-colors"
              >
                了解平台
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* ========== STATS ========== */}
      <section className="bg-[var(--color-primary)] text-white">
        <div className="max-w-7xl mx-auto px-6 lg:px-8 py-16">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-8">
            {stats.map((stat) => (
              <div key={stat.labelEn} className="text-center">
                <div className="text-5xl md:text-6xl font-black mb-2 text-[var(--color-accent)]">
                  {stat.value}
                </div>
                <div className="text-sm font-bold tracking-widest opacity-80">
                  {stat.labelEn}
                </div>
                <div className="text-sm font-serif-tc mt-1 opacity-70">
                  {stat.label}
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ========== MODULES ========== */}
      <section className="bg-white py-20 md:py-28">
        <div className="max-w-7xl mx-auto px-6 lg:px-8">
          <div className="mb-16">
            <div className="text-xs font-bold tracking-widest text-[var(--color-primary)] mb-3">
              MODULES · 六大功能模組
            </div>
            <h2 className="text-4xl md:text-5xl font-black tracking-tight mb-4">
              一站式 pickleball 體驗
            </h2>
            <p className="text-lg text-[var(--color-text-muted)] font-serif-tc max-w-2xl">
              從找球場、約球友、找教練、買裝備到學技巧，所有 pickleball 需求一個平台搞定。
            </p>
          </div>

          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {modules.map((module) => (
              <Link
                key={module.code}
                href={module.href}
                className="group relative p-8 bg-[var(--color-bg-muted)] hover:bg-white border border-[var(--color-border)] hover:border-[var(--color-primary)] rounded-lg transition-all hover:shadow-lg"
              >
                <div className="text-xs font-bold tracking-widest text-[var(--color-primary)] mb-4">
                  {module.code}
                </div>
                <h3 className="text-2xl font-bold mb-1">{module.name}</h3>
                <div className="text-sm font-bold tracking-wider text-[var(--color-text-muted)] mb-4">
                  {module.nameEn.toUpperCase()}
                </div>
                <p className="text-sm text-[var(--color-text-muted)] font-serif-tc leading-relaxed">
                  {module.desc}
                </p>
                <div className="mt-6 text-sm font-bold text-[var(--color-primary)] opacity-0 group-hover:opacity-100 transition-opacity">
                  進入 →
                </div>
              </Link>
            ))}
          </div>
        </div>
      </section>

      {/* ========== ROLES ========== */}
      <section className="bg-[var(--color-bg-muted)] py-20 md:py-28">
        <div className="max-w-7xl mx-auto px-6 lg:px-8">
          <div className="mb-16">
            <div className="text-xs font-bold tracking-widest text-[var(--color-primary)] mb-3">
              USERS · 四種角色
            </div>
            <h2 className="text-4xl md:text-5xl font-black tracking-tight mb-4">
              為每一位 pickleball 參與者設計
            </h2>
          </div>

          <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {roles.map((role) => (
              <div
                key={role.letter}
                className="bg-white p-8 border border-[var(--color-border)] rounded-lg hover:border-[var(--color-primary)] transition-colors"
              >
                <div className="text-6xl font-black text-[var(--color-primary)] mb-4 leading-none">
                  {role.letter}
                </div>
                <h3 className="text-xl font-bold mb-1">{role.name}</h3>
                <div className="text-xs font-bold tracking-widest text-[var(--color-text-muted)] mb-4">
                  {role.nameEn.toUpperCase()}
                </div>
                <p className="text-sm text-[var(--color-text-muted)] font-serif-tc leading-relaxed">
                  {role.needs}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ========== FLYWHEEL ========== */}
      <section className="bg-white py-20 md:py-28">
        <div className="max-w-7xl mx-auto px-6 lg:px-8">
          <div className="mb-16">
            <div className="text-xs font-bold tracking-widest text-[var(--color-primary)] mb-3">
              FLYWHEEL · 品牌價值飛輪
            </div>
            <h2 className="text-4xl md:text-5xl font-black tracking-tight mb-4">
              使用者、內容、商品的正向循環
            </h2>
          </div>

          <div className="grid md:grid-cols-4 gap-6">
            {flywheel.map((step, idx) => (
              <div
                key={step.num}
                className="relative p-6 border-l-4 border-[var(--color-accent)] bg-[var(--color-bg-muted)]"
              >
                <div className="text-3xl font-black text-[var(--color-primary)] mb-2">
                  {step.num}
                </div>
                <h3 className="text-lg font-bold mb-2">{step.title}</h3>
                <p className="text-sm text-[var(--color-text-muted)] font-serif-tc leading-relaxed">
                  {step.desc}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ========== CTA ========== */}
      <section className="bg-[var(--color-bg-dark)] text-white py-20 md:py-24">
        <div className="max-w-4xl mx-auto px-6 lg:px-8 text-center">
          <h2 className="text-4xl md:text-5xl font-black mb-6 tracking-tight">
            準備好開始你的
            <br />
            <span className="text-[var(--color-accent)]">PICKLEBALL</span> 旅程？
          </h2>
          <p className="text-lg text-slate-300 mb-10 font-serif-tc">
            加入 VEKTR，找到屬於你的球場、球友與成長軌跡。
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link
              href="/match/find"
              className="inline-flex items-center justify-center px-8 py-4 bg-[var(--color-accent)] hover:bg-[var(--color-accent-dark)] text-[var(--color-text)] font-bold rounded-md transition-colors"
            >
              開始約球
            </Link>
            <Link
              href="/courts"
              className="inline-flex items-center justify-center px-8 py-4 bg-transparent border-2 border-white/30 hover:border-white/60 text-white font-bold rounded-md transition-colors"
            >
              探索球場
            </Link>
          </div>
        </div>
      </section>
    </>
  );
}