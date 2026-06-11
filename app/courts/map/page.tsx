// app/courts/map/page.tsx
// /courts 本身已是完整的 Google Maps 互動地圖,/courts/map 導向過去,避免重複維護兩份地圖。
import { redirect } from "next/navigation";

export default function CourtsMapPage() {
  redirect("/courts");
}
