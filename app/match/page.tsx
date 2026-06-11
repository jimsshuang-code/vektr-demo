"use client";
import { useEffect, useState, useCallback } from "react";
import { signOut, useSession } from "next-auth/react";
import Link from "next/link";

type Match = {
  id: number; title: string | null; scheduled_at: string; duration_min: number;
  max_players: number; current_players: number; dupr_min: number | null; dupr_max: number | null;
  game_type: string; level: string | null; court_name: string | null; city: string | null;
};
const C = { navy:"#1e3a8a", ink:"#0f172a", lime:"#65a30d", limeBg:"#f7fee7", txt2:"#64748b", line:"#e2e8f0", bg:"#f8fafc" };
const fmt = (iso:string) => { const d=new Date(iso); return `${d.getMonth()+1}/${d.getDate()} (${"日一二三四五六"[d.getDay()]}) ${String(d.getHours()).padStart(2,"0")}:${String(d.getMinutes()).padStart(2,"0")}`; };
const gameLabel:Record<string,string> = { singles:"單打", doubles:"雙打", mixed:"混雙" };

export default function MatchPage() {
  const { data:session } = useSession();
  const [list,setList]=useState<Match[]>([]); const [loading,setLoading]=useState(true);
  const [city,setCity]=useState(""); const [coords,setCoords]=useState<{lat:number;lng:number}|null>(null);

  const load=useCallback(async()=>{ setLoading(true);
    const qs=new URLSearchParams(); if(city)qs.set("city",city);
    if(coords){qs.set("lat",String(coords.lat));qs.set("lng",String(coords.lng));qs.set("radius","15000");}
    const r=await fetch(`/api/v1/matches?${qs}`); const j=await r.json();
    setList(j.matches??[]); setLoading(false);
  },[city,coords]);
  useEffect(()=>{load();},[load]);
  useEffect(()=>{ navigator.geolocation?.getCurrentPosition(
    p=>setCoords({lat:p.coords.latitude,lng:p.coords.longitude}),()=>{},{timeout:5000}); },[]);
  // 推薦碼歸因:列表頁也接住 ?ref=,讓通用邀請連結(/match?ref=CODE)能歸因(與 /match/[id] 一致)
  useEffect(()=>{ const ref=new URLSearchParams(window.location.search).get("ref");
    if(ref)document.cookie=`vektr_ref=${ref};path=/;max-age=2592000`; },[]);

  return (
    <div style={{background:C.bg,minHeight:"100vh",fontFamily:"-apple-system,'Noto Sans TC',sans-serif"}}>
      <div style={{maxWidth:640,margin:"0 auto",padding:"20px 16px 80px"}}>
        <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:16}}>
          <h1 style={{fontSize:22,fontWeight:800,color:C.ink,margin:0}}>約球</h1>
          <div style={{display:"flex",gap:8,alignItems:"center"}}>
            {session?.user ? (
              <>
                <span style={{fontSize:14,fontWeight:700,color:C.ink}}>👤 {session.user.name}</span>
                <button onClick={()=>signOut({callbackUrl:"/match"})}
                  style={{background:"transparent",color:C.txt2,padding:"7px 11px",borderRadius:8,fontWeight:700,fontSize:13,border:`1px solid ${C.line}`,cursor:"pointer"}}>
                  登出</button>
              </>
            ) : (
              <Link href="/login?callbackUrl=/match"
                style={{background:"#00C300",color:"#fff",padding:"9px 14px",borderRadius:10,fontWeight:700,fontSize:14,border:"none",cursor:"pointer",textDecoration:"none"}}>
                使用 LINE 登入</Link>
            )}
            <Link href="/match/create" style={{background:C.navy,color:"#fff",padding:"9px 16px",borderRadius:10,fontWeight:700,fontSize:14,textDecoration:"none"}}>+ 開房</Link>
          </div>
        </div>
        <div style={{display:"flex",gap:8,marginBottom:16}}>
          <input value={city} onChange={e=>setCity(e.target.value)} placeholder="城市(如 台北市)"
            style={{flex:1,padding:"10px 12px",border:`1px solid ${C.line}`,borderRadius:10,fontSize:14}}/>
          {coords && <span style={{fontSize:12,color:C.lime,alignSelf:"center",fontWeight:700}}>📍 已定位附近</span>}
        </div>
        {loading ? <p style={{color:C.txt2,textAlign:"center",padding:40}}>載入中…</p>
         : list.length===0 ? (
          <div style={{textAlign:"center",padding:"48px 20px",color:C.txt2}}>
            <p style={{marginBottom:12}}>附近暫時沒有球局</p>
            <Link href="/match/create" style={{color:C.navy,fontWeight:700}}>成為第一個開房的人 →</Link>
          </div>
         ) : (
          <div style={{display:"grid",gap:12}}>
            {list.map(m=>{ const full=m.current_players>=m.max_players; return (
              <Link key={m.id} href={`/match/${m.id}`} style={{textDecoration:"none",color:"inherit"}}>
                <div style={{background:"#fff",border:`1px solid ${C.line}`,borderRadius:14,padding:16}}>
                  <div style={{display:"flex",justifyContent:"space-between",gap:10}}>
                    <div style={{fontWeight:800,color:C.ink,fontSize:16}}>{m.title||`${gameLabel[m.game_type]??m.game_type}球局`}</div>
                    <span style={{fontSize:12,fontWeight:800,padding:"3px 9px",borderRadius:14,whiteSpace:"nowrap",
                      background:full?"#fef2f2":C.limeBg,color:full?"#dc2626":C.lime}}>
                      {full?"已額滿":`${m.current_players}/${m.max_players} 人`}</span>
                  </div>
                  <div style={{color:C.txt2,fontSize:13.5,marginTop:6,lineHeight:1.7}}>
                    🕐 {fmt(m.scheduled_at)}<br/>
                    📍 {m.court_name||"自訂地點"}{m.city?` · ${m.city}`:""}<br/>
                    🏓 {gameLabel[m.game_type]??m.game_type}{(m.dupr_min||m.dupr_max)?` · DUPR ${m.dupr_min??"?"}–${m.dupr_max??"?"}`:""}
                  </div>
                </div>
              </Link>); })}
          </div>
        )}
      </div>
    </div>
  );
}
