'use client';

import { useCallback, useEffect, useRef, useState } from 'react';

type Court = {
  id: string;
  name: string;
  address: string;
  city: string | null;
  district: string | null;
  lat: string | null;
  lng: string | null;
  type: string | null;
  num_courts: number | null;
  hourly_rate: number | null;
  rating: string | null;
  rating_count: number;
  is_verified: boolean;
  distance_m: number | null;
};

declare global {
  interface Window {
    google?: any;
    __initVektrMap?: () => void;
  }
}

const DEFAULT_CENTER = { lat: 25.033, lng: 121.5654 }; // 台北

export default function CourtsPage() {
  const mapDiv = useRef<HTMLDivElement>(null);
  const mapObj = useRef<any>(null);
  const infoWin = useRef<any>(null);
  const markers = useRef<any[]>([]);
  const center = useRef(DEFAULT_CENTER);

  const [ready, setReady] = useState(false);
  const [status, setStatus] = useState('載入地圖中…');
  const [radius, setRadius] = useState('');
  const [type, setType] = useState('');
  const [maxRate, setMaxRate] = useState('');
  const [tick, setTick] = useState(0);

  const renderMarkers = useCallback((courts: Court[]) => {
    markers.current.forEach((m) => m.setMap(null));
    markers.current = [];
    const g = window.google;
    if (!g) return;
    courts.forEach((c) => {
      if (c.lat == null || c.lng == null) return;
      const marker = new g.maps.Marker({
        position: { lat: Number(c.lat), lng: Number(c.lng) },
        map: mapObj.current,
        title: c.name,
      });
      marker.addListener('click', () => {
        const dist = c.distance_m != null ? `${(c.distance_m / 1000).toFixed(1)} km · ` : '';
        const rate = c.hourly_rate != null ? `NT$${c.hourly_rate}/hr` : '收費未定';
        const rating = c.rating != null ? `★ ${c.rating} (${c.rating_count})` : '尚無評分';
        const verified = c.is_verified ? '✓ 已認領' : '未認領';
        infoWin.current.setContent(
          `<div style="color:#111;font-size:13px;line-height:1.5;min-width:180px">
             <b style="font-size:14px">${c.name}</b><br>
             <span style="color:#555">${dist}${c.city || ''}${c.district || ''}</span><br>
             ${rating} · ${rate}<br>
             <span style="color:#555">${c.type || '類型未定'} · ${verified}</span>
           </div>`
        );
        infoWin.current.open(mapObj.current, marker);
      });
      markers.current.push(marker);
    });
  }, []);

  const fetchCourts = useCallback(async () => {
    const p = new URLSearchParams({
      lat: String(center.current.lat),
      lng: String(center.current.lng),
    });
    if (radius) p.set('radius', radius);
    if (type) p.set('type', type);
    if (maxRate) p.set('max_rate', maxRate);

    setStatus('搜尋中…');
    try {
      const res = await fetch(`/api/v1/courts?${p}`);
      const data = await res.json();
      renderMarkers(data.courts || []);
      setStatus(`找到 ${data.count} 個球場`);
    } catch {
      setStatus('呼叫 API 失敗');
    }
  }, [radius, type, maxRate, renderMarkers]);

  useEffect(() => {
    const KEY = process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY;

    function init() {
      const g = window.google;
      mapObj.current = new g.maps.Map(mapDiv.current, { center: DEFAULT_CENTER, zoom: 8 });
      infoWin.current = new g.maps.InfoWindow();

      // 容器高度穩定後強制重繪 tile,避免初始化時 div 高度為 0 導致底圖空白
      setTimeout(() => {
        g.maps.event.trigger(mapObj.current, 'resize');
        mapObj.current.setCenter(center.current);
      }, 300);

      if (navigator.geolocation) {
        navigator.geolocation.getCurrentPosition(
          (pos) => {
            center.current = { lat: pos.coords.latitude, lng: pos.coords.longitude };
            mapObj.current.setCenter(center.current);
            setReady(true);
          },
          () => setReady(true),
          { timeout: 4000 }
        );
      } else {
        setReady(true);
      }
    }

    if (window.google?.maps) { init(); return; }
    window.__initVektrMap = init;
    const s = document.createElement('script');
    s.src = `https://maps.googleapis.com/maps/api/js?key=${KEY}&callback=__initVektrMap&language=zh-TW&region=TW`;
    s.async = true;
    document.head.appendChild(s);
  }, []);

  useEffect(() => {
    if (ready) fetchCourts();
  }, [ready, tick, fetchCourts]);

  const sel = 'rounded-lg border border-[#2c3644] bg-[#1e2530] px-2.5 py-1.5 text-sm text-[#e6edf3]';

  return (
    <div className="flex flex-col">
      <div className="flex flex-wrap items-center gap-3 bg-[#141a24] px-4 py-3 text-[#e6edf3]">
        <label className="text-sm opacity-80">
          半徑{' '}
          <select value={radius} onChange={(e) => setRadius(e.target.value)} className={sel}>
            <option value="3000">3 km</option>
            <option value="8000">8 km</option>
            <option value="20000">20 km</option>
            <option value="">不限</option>
          </select>
        </label>
        <label className="text-sm opacity-80">
          類型{' '}
          <select value={type} onChange={(e) => setType(e.target.value)} className={sel}>
            <option value="">全部</option>
            <option value="indoor">室內</option>
            <option value="outdoor">室外</option>
            <option value="mixed">混合</option>
          </select>
        </label>
        <label className="text-sm opacity-80">
          收費上限{' '}
          <select value={maxRate} onChange={(e) => setMaxRate(e.target.value)} className={sel}>
            <option value="">不限</option>
            <option value="250">≤ 250</option>
            <option value="350">≤ 350</option>
            <option value="500">≤ 500</option>
          </select>
        </label>
        <button
          onClick={() => {
            if (mapObj.current) {
              const c = mapObj.current.getCenter();
              center.current = { lat: c.lat(), lng: c.lng() };
            }
            setTick((t) => t + 1);
          }}
          className="rounded-lg bg-[#00FFAA] px-3 py-1.5 text-sm font-semibold text-[#001b12]"
        >
          在這附近搜尋
        </button>
        <span className="ml-auto text-sm opacity-70">{status}</span>
      </div>
      <div ref={mapDiv} className="h-[78vh] min-h-[420px] w-full" />
    </div>
  );
}
