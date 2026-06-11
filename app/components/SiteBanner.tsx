// app/components/SiteBanner.tsx — 站台頂部公告(server fetch + client 可關閉)
import { getActiveAnnouncement } from "@/app/lib/marketingDb";
import BannerBar from "./BannerBar";

export default async function SiteBanner() {
  const a = await getActiveAnnouncement();
  if (!a) return null;
  return <BannerBar id={a.id} title={a.title} linkUrl={a.link_url} linkLabel={a.link_label} />;
}
