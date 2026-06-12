import Link from 'next/link';
import ReserveForm from './ReserveForm';
import CommunityMedia from './CommunityMedia';

interface Props {
  params: Promise<{ id: string }>;
}

const DAYS = ['週日', '週一', '週二', '週三', '週四', '週五', '週六'];

async function getCourt(id: string) {
  const base = process.env.NEXT_PUBLIC_SITE_URL || '';
  try {
    const res = await fetch(`${base}/api/v1/courts/${id}`, { cache: 'no-store' });
    if (!res.ok) return null;
    return res.json();
  } catch {
    return null;
  }
}

export default async function CourtDetailPage({ params }: Props) {
  const { id } = await params;
  const data = await getCourt(id);

  if (!data?.court) {
    return (
      <div style={{ maxWidth: 720, margin: '0 auto', padding: '40px 20px' }}>
        <Link href="/courts" style={{ color: '#0a7' }}>← 球場總覽</Link>
        <h1 style={{ marginTop: 16 }}>找不到這個球場</h1>
      </div>
    );
  }

  const c = data.court;
  const hours: { day_of_week: number; open_time: string; close_time: string }[] = data.hours || [];
  const typeLabel = c.type === 'indoor' ? '室內' : c.type === 'outdoor' ? '室外' : c.type === 'mixed' ? '室內外' : '類型未定';
  const rate = c.hourly_rate != null ? `NT$${c.hourly_rate}/小時` : '收費未定';
  const rating = c.rating != null ? `★ ${c.rating}（${c.rating_count} 則評價）` : '尚無評分';

  const photos: string[] = Array.isArray(c.photos) ? c.photos.filter(Boolean) : [];
  const cover: string | null = c.cover_image_url || photos[0] || null;
  const embed = videoEmbed(c.video_url);

  return (
    <div style={{ maxWidth: 720, margin: '0 auto', padding: '32px 20px' }}>
      <Link href="/courts" style={{ color: '#0a7', fontSize: 14 }}>← 球場總覽</Link>

      {cover && (
        <div style={{ marginTop: 12, borderRadius: 14, overflow: 'hidden', aspectRatio: '16 / 9', background: '#e2e8f0' }}>
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={cover} alt={c.name} style={{ width: '100%', height: '100%', objectFit: 'cover', display: 'block' }} />
        </div>
      )}

      <h1 style={{ fontSize: 28, margin: '14px 0 4px' }}>{c.name}</h1>
      <p style={{ color: '#666', margin: '0 0 20px' }}>
        {c.is_verified ? '✓ 已認領' : '未認領'} · {c.city || ''}{c.district || ''}
      </p>

      <div style={{ display: 'grid', gap: 12, background: '#f7f8fa', borderRadius: 12, padding: 20 }}>
        <Row label="地址" value={c.address} />
        <Row label="電話" value={c.phone || '—'} />
        <Row label="類型" value={typeLabel} />
        <Row label="球場面數" value={c.num_courts != null ? `${c.num_courts} 面` : '—'} />
        <Row label="收費" value={rate} />
        <Row label="評分" value={rating} />
      </div>

      {hours.length > 0 && (
        <div style={{ marginTop: 24 }}>
          <h2 style={{ fontSize: 18 }}>營業時間</h2>
          <ul style={{ listStyle: 'none', padding: 0 }}>
            {hours.map((h, i) => (
              <li key={i} style={{ padding: '4px 0', borderBottom: '1px solid #eee' }}>
                {DAYS[h.day_of_week]} {h.open_time?.slice(0, 5)} – {h.close_time?.slice(0, 5)}
              </li>
            ))}
          </ul>
        </div>
      )}

      {/* 相簿 */}
      {photos.length > 0 && (
        <div style={{ marginTop: 24 }}>
          <h2 style={{ fontSize: 18 }}>場館照片</h2>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(140px, 1fr))', gap: 8 }}>
            {photos.map((p, i) => (
              <div key={i} style={{ aspectRatio: '1 / 1', borderRadius: 10, overflow: 'hidden', background: '#e2e8f0' }}>
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={p} alt={`${c.name} 照片 ${i + 1}`} style={{ width: '100%', height: '100%', objectFit: 'cover', display: 'block' }} />
              </div>
            ))}
          </div>
        </div>
      )}

      {/* 影片 */}
      {embed && (
        <div style={{ marginTop: 24 }}>
          <h2 style={{ fontSize: 18 }}>場館影片</h2>
          {embed.type === 'youtube' ? (
            <div style={{ aspectRatio: '16 / 9', borderRadius: 12, overflow: 'hidden', background: '#000' }}>
              <iframe
                src={embed.src}
                title={`${c.name} 影片`}
                style={{ width: '100%', height: '100%', border: 0 }}
                allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                allowFullScreen
              />
            </div>
          ) : (
            <video src={embed.src} controls style={{ width: '100%', borderRadius: 12, background: '#000' }} />
          )}
        </div>
      )}

      {/* 球友分享(社群上傳:照片/影片) */}
      <CommunityMedia courtId={Number(c.id)} />

      {/* 線上預約 */}
      <div style={{ marginTop: 28, background: '#fff', border: '1px solid #e2e8f0', borderRadius: 12, padding: 20 }}>
        <h2 style={{ fontSize: 18, margin: '0 0 4px' }}>線上預約</h2>
        <p style={{ fontSize: 13, color: '#64748b', margin: '0 0 14px' }}>
          填寫日期與時段送出,球場確認後預約成立。費用現場支付。
        </p>
        <ReserveForm courtId={Number(c.id)} courtName={c.name} />
      </div>

      <p style={{ marginTop: 24, fontSize: 13, color: '#999' }}>
        資料持續整理中,部分欄位待場主認領後補齊,僅供參考。
      </p>
    </div>
  );
}

// 把影片網址轉成可嵌入來源:YouTube → embed iframe;.mp4/.webm → 原生 video;其餘忽略。
function videoEmbed(url: unknown): { type: 'youtube' | 'file'; src: string } | null {
  if (!url || typeof url !== 'string') return null;
  const u = url.trim();
  const yt = u.match(/(?:youtube\.com\/(?:watch\?v=|embed\/|shorts\/)|youtu\.be\/)([A-Za-z0-9_-]{6,})/);
  if (yt) return { type: 'youtube', src: `https://www.youtube.com/embed/${yt[1]}` };
  if (/^https?:\/\/.+\.(mp4|webm)(\?.*)?$/i.test(u)) return { type: 'file', src: u };
  return null;
}

function Row({ label, value }: { label: string; value: string }) {
  return (
    <div style={{ display: 'flex', gap: 12 }}>
      <span style={{ width: 72, color: '#888', flexShrink: 0 }}>{label}</span>
      <span>{value}</span>
    </div>
  );
}
