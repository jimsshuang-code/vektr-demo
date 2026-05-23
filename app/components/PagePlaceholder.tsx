import Link from "next/link";

interface PagePlaceholderProps {
  title: string;
  titleEn: string;
  description: string;
  parentPath?: string;
  parentLabel?: string;
}

export default function PagePlaceholder({
  title,
  titleEn,
  description,
  parentPath,
  parentLabel,
}: PagePlaceholderProps) {
  return (
    <main className="min-h-[calc(100vh-200px)] bg-[#f8fafc] flex items-center justify-center px-6 py-20">
      <div className="max-w-2xl w-full text-center">
        {/* Coming Soon 標籤 */}
        <div className="inline-block mb-6">
          <span className="inline-block px-4 py-1.5 bg-[#bef264] text-[#0f172a] text-sm font-semibold rounded-full tracking-wide">
            Coming Soon
          </span>
        </div>

        {/* 中文標題 */}
        <h1 className="text-4xl md:text-5xl font-bold text-[#0f172a] mb-2 tracking-tight">
          {title}
        </h1>

        {/* 英文小字 */}
        <p className="text-base md:text-lg text-[#475569] mb-8 font-medium tracking-wide">
          {titleEn}
        </p>

        {/* 描述 */}
        <p className="text-base md:text-lg text-[#475569] leading-relaxed mb-12 max-w-xl mx-auto">
          {description}
        </p>

        {/* 分隔線 */}
        <div className="w-16 h-0.5 bg-[#1e3a8a] mx-auto mb-12"></div>

        {/* 按鈕區 */}
        <div className="flex flex-col sm:flex-row gap-4 justify-center items-center">
          {parentPath && parentLabel && (
            <Link
              href={parentPath}
              className="inline-flex items-center justify-center px-6 py-3 border-2 border-[#1e3a8a] text-[#1e3a8a] font-semibold rounded-lg hover:bg-[#1e3a8a] hover:text-white transition-colors w-full sm:w-auto"
            >
              ← 返回 {parentLabel}
            </Link>
          )}
          <Link
            href="/"
            className="inline-flex items-center justify-center px-6 py-3 bg-[#1e3a8a] text-white font-semibold rounded-lg hover:bg-[#0f172a] transition-colors w-full sm:w-auto"
          >
            回首頁
          </Link>
        </div>
      </div>
    </main>
  );
}