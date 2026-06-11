// app/components/HomeStats.tsx — 首頁真實成長數據(server component)
import { getPlatformStats } from "@/app/lib/stats";

function fmt(n: number) {
  // 達一定規模才加「+」,小數量據實顯示(誠實成長數據)
  if (n >= 100) return `${Math.floor(n / 10) * 10}+`;
  return String(n);
}

export default async function HomeStats() {
  const s = await getPlatformStats();
  const items = [
    { value: fmt(s.courts), label: "認證球場", labelEn: "COURTS" },
    { value: fmt(s.cities), label: "覆蓋城市", labelEn: "CITIES" },
    { value: fmt(s.users), label: "註冊球友", labelEn: "PLAYERS" },
    { value: fmt(s.matches), label: "揪球場次", labelEn: "SESSIONS" },
  ];

  return (
    <section className="bg-[var(--color-primary)] text-white">
      <div className="max-w-7xl mx-auto px-6 lg:px-8 py-16">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-8">
          {items.map((stat) => (
            <div key={stat.labelEn} className="text-center">
              <div className="text-5xl md:text-6xl font-black mb-2 text-[var(--color-accent)]">
                {stat.value}
              </div>
              <div className="text-sm font-bold tracking-widest opacity-80">{stat.labelEn}</div>
              <div className="text-sm font-serif-tc mt-1 opacity-70">{stat.label}</div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
