"use client";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";

type Court = { id:number; name:string; city:string|null };
const C = { navy:"#1e3a8a", ink:"#0f172a", txt:"#1e293b", txt2:"#64748b", line:"#e2e8f0", bg:"#f8fafc" };
const label:React.CSSProperties = { display:"block",fontSize:13,fontWeight:700,color:C.txt,margin:"14px 0 6px" };
const input:React.CSSProperties = { width:"100%",padding:"10px 12px",border:`1px solid ${C.line}`,borderRadius:10,fontSize:15,boxSizing:"border-box" };

export default function MatchCreatePage() {
  const router=useRouter();
  const [courts,setCourts]=useState<Court[]>([]); const [submitting,setSubmitting]=useState(false); const [err,setErr]=useState("");
  const [f,setF]=useState({court_id:"",title:"",scheduled_at:"",duration_min:90,max_players:4,game_type:"doubles",level:"",dupr_min:"",dupr_max:"",description:""});
  const set=(k:string,v:any)=>setF(s=>({...s,[k]:v}));

  useEffect(()=>{ fetch("/api/v1/courts?limit=1000").then(r=>r.json())
    .then(j=>setCourts((j.courts??[]).map((c:any)=>({id:c.id,name:c.name,city:c.city})))).catch(()=>{}); },[]);

  async function submit(){
    setErr(""); if(!f.scheduled_at){setErr("請選擇時間");return;}
    setSubmitting(true);
    const r=await fetch("/api/v1/matches",{method:"POST",headers:{"Content-Type":"application/json"},
      body:JSON.stringify({...f,court_id:f.court_id?Number(f.court_id):null,
        scheduled_at:new Date(f.scheduled_at).toISOString(),
        duration_min:f.duration_min?Number(f.duration_min):null,max_players:f.max_players?Number(f.max_players):null,
        dupr_min:f.dupr_min?Number(f.dupr_min):null,dupr_max:f.dupr_max?Number(f.dupr_max):null})});
    if(r.status===401){setErr("請先以 LINE 登入後再開團。");setSubmitting(false);return;}
    if(r.status===403){setErr("您的帳號目前已被停權,無法開團。");setSubmitting(false);return;}
    if(!r.ok){setErr((await r.json()).error??"開房失敗");setSubmitting(false);return;}
    const j=await r.json(); router.push(`/match/${j.match.id}`);
  }

  return (
    <div style={{background:C.bg,minHeight:"100vh",fontFamily:"-apple-system,'Noto Sans TC',sans-serif"}}>
      <div style={{maxWidth:560,margin:"0 auto",padding:"20px 16px 80px"}}>
        <button onClick={()=>router.back()} style={{background:"none",border:"none",color:C.txt2,fontSize:14,padding:0,marginBottom:8,cursor:"pointer"}}>← 返回</button>
        <h1 style={{fontSize:22,fontWeight:800,color:C.ink,margin:"0 0 4px"}}>開一場球局</h1>
        <p style={{color:C.txt2,fontSize:14,marginTop:0}}>填好後可一鍵分享揪人。</p>

        <label style={label}>標題</label>
        <input style={input} value={f.title} onChange={e=>set("title",e.target.value)} placeholder="例:週六晨間雙打揪人"/>
        <label style={label}>球場</label>
        <select style={input} value={f.court_id} onChange={e=>set("court_id",e.target.value)}>
          <option value="">自訂地點 / 待定</option>
          {courts.map(c=><option key={c.id} value={c.id}>{c.name}{c.city?` · ${c.city}`:""}</option>)}
        </select>
        <label style={label}>時間 *</label>
        <input style={input} type="datetime-local" value={f.scheduled_at} onChange={e=>set("scheduled_at",e.target.value)}/>
        <label style={label}>時長(分鐘)</label>
        <input style={input} type="number" value={f.duration_min} onChange={e=>set("duration_min",e.target.value)}/>
        <label style={label}>人數上限(含你自己,由你決定)</label>
        <div style={{display:"flex",gap:8,flexWrap:"wrap",marginBottom:8}}>
          {[{n:2,t:"2 人 單打"},{n:4,t:"4 人 雙打"},{n:6,t:"6 人"},{n:8,t:"8 人"}].map(o=>{
            const on=Number(f.max_players)===o.n;
            return <button key={o.n} type="button" onClick={()=>set("max_players",o.n)}
              style={{padding:"8px 14px",borderRadius:999,fontSize:14,fontWeight:700,cursor:"pointer",
                border:`1.5px solid ${on?C.navy:C.line}`,background:on?C.navy:"#fff",color:on?"#fff":C.txt}}>{o.t}</button>;
          })}
        </div>
        <input style={input} type="number" min={2} max={64} value={f.max_players}
          onChange={e=>set("max_players",e.target.value)} placeholder="或自訂人數(最少 2 人)"/>
        <p style={{color:C.txt2,fontSize:12.5,margin:"6px 0 0"}}>不限定 4 人:單打填 2、雙打填 4、多人輪打可設更多。</p>
        <label style={label}>賽制</label>
        <select style={input} value={f.game_type} onChange={e=>set("game_type",e.target.value)}>
          <option value="doubles">雙打</option><option value="singles">單打</option><option value="mixed">混雙</option>
        </select>
        <div style={{display:"flex",gap:12}}>
          <div style={{flex:1}}><label style={label}>DUPR 下限</label>
            <input style={input} type="number" step="0.1" value={f.dupr_min} onChange={e=>set("dupr_min",e.target.value)} placeholder="不限"/></div>
          <div style={{flex:1}}><label style={label}>DUPR 上限</label>
            <input style={input} type="number" step="0.1" value={f.dupr_max} onChange={e=>set("dupr_max",e.target.value)} placeholder="不限"/></div>
        </div>
        <label style={label}>備註</label>
        <textarea style={{...input,minHeight:70,resize:"vertical"}} value={f.description} onChange={e=>set("description",e.target.value)} placeholder="集合方式、費用分攤、自備球拍…"/>
        {err && <p style={{color:"#dc2626",fontSize:14,marginTop:14}}>{err}</p>}
        <button onClick={submit} disabled={submitting}
          style={{width:"100%",marginTop:22,background:submitting?"#94a3b8":C.navy,color:"#fff",border:"none",padding:"14px",borderRadius:12,fontSize:16,fontWeight:800,cursor:"pointer"}}>
          {submitting?"建立中…":"開房並揪人"}</button>
      </div>
    </div>
  );
}
