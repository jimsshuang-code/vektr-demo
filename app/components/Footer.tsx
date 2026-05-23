import Link from "next/link";

const footerSections = [
  {
    title: "平台 PLATFORM",
    links: [
      { label: "商城 SHOP", href: "/shop" },
      { label: "球場 COURTS", href: "/courts" },
      { label: "教練 COACH", href: "/coaches" },
      { label: "約球 MATCH", href: "/match" },
      { label: "學習 LEARN", href: "/learn" },
    ],
  },
  {
    title: "會員 MEMBER",
    links: [
      { label: "我的訂單", href: "/member/orders" },
      { label: "我的等級 DUPR", href: "/member/level" },
      { label: "我的球友", href: "/member/friends" },
      { label: "教練紀錄", href: "/member/coaching" },
    ],
  },
  {
    title: "合作 PARTNERS",
    links: [
      { label: "成為教練", href: "/coaches/apply" },
      { label: "商品上架", href: "/admin" },
      { label: "場地合作", href: "/courts" },
    ],
  },
  {
    title: "關於 ABOUT",
    links: [
      { label: "品牌故事", href: "/" },
      { label: "聯絡我們", href: "/" },
      { label: "服務條款", href: "/" },
      { label: "隱私政策", href: "/" },
    ],
  },
];

export default function Footer() {
  return (
    <footer className="bg-[var(--color-bg-dark)] text-[var(--color-text-inverse)] mt-auto">
      <div className="max-w-7xl mx-auto px-6 lg:px-8 py-16">
        {/* Top section */}
        <div className="grid grid-cols-2 md:grid-cols-5 gap-8 mb-12">
          {/* Brand column */}
          <div className="col-span-2 md:col-span-1">
            <div className="text-3xl font-black tracking-widest text-[var(--color-accent)] mb-4">
              VEKTR
            </div>
            <p className="text-sm text-slate-400 leading-relaxed">
              台灣首個整合球場、教練、約球、商城與學習資源的 pickleball 生態系平台。
            </p>
          </div>

          {/* Link columns */}
          {footerSections.map((section) => (
            <div key={section.title}>
              <div className="text-xs font-bold tracking-widest text-[var(--color-accent)] mb-4">
                {section.title}
              </div>
              <ul className="space-y-2">
                {section.links.map((link) => (
                  <li key={link.label}>
                    <Link
                      href={link.href}
                      className="text-sm text-slate-300 hover:text-white transition-colors"
                    >
                      {link.label}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>

        {/* Bottom section */}
        <div className="pt-8 border-t border-slate-700 flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
          <div className="text-xs text-slate-500">
            © 2026 VEKTR. 關於時間科技股份有限公司. All rights reserved.
          </div>
          <div className="flex items-center gap-4 text-xs text-slate-500">
            <span>Made in Taiwan</span>
            <span>·</span>
            <span>v1.0 Demo</span>
          </div>
        </div>
      </div>
    </footer>
  );
}