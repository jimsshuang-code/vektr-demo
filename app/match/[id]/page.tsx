"use client";
import { useEffect, useState, useCallback } from "react";
import { useParams, useRouter } from "next/navigation";
import ReportButton from "@/app/match/_components/ReportButton";

const C = { navy:"#1e3a8a", ink:"#0f172a", lime:"#65a30d", limeBg:"#f7fee7", txt:"#1e293b", txt2:"#64748b", line:"#e2e8f0", bg:"#f8fafc" };
const gameLabel:Record<string,string> = { singles:"單打", doubles:"雙打", mixed:"混雙" };
const fmt=(iso:string)=>{const d=new Date(iso);return `${d.getFullYear()}/${d.getMonth()+1}/${d.getDate()} (${"日一二三四五六"[d.getDay()]}) ${String(d.getHours()).padStart(2,"0")}:${String(d.getMinutes()).padStart(2,"0")}`;};

export default function MatchDetailPage() {
  const { id } = useParams<{id:string}>(); const router=useRouter();
  const [data,setData]=useState<any>(null); const [busy,setBusy]=useState(false); const [msg,setMsg]=useState("");

  const load=useCallback(async()=>{ const r=await fetch(`/api/v1/matches/${id}`);
    if(r.status===404){setData("notfound");return;} setData(await r.json()); },[id]);
  useEffect(()=>{load();},[load]);
  useEffect(()=>{ const ref=new URLSearchParams(window.location.search).get("ref");
    if(ref)document.cookie=`vektr_ref=${ref};path=/;max-age=2592000`; },[]);

  async function act(path:string,body?:any){ setBusy(true); setMsg("");
    const r=await fetch(`/api/v1/matches/${id}/${path}`,{method:"POST",headers:{"Content-Type":"application/json"},body:body?JSON.stringify(body):undefined});
    const j=await r.json(); if(!r.ok)setMsg(j.error??"操作失敗"); setBusy(false); await load();
  }
  function inviteText(){ const ref=data?.viewer?.referralCode; const mm=data?.match;
    const url=`${window.location.origin}/match/${id}${ref?`?ref=${ref}`:""}`;
    const title=mm?.title||"匹克球球局";
    const need=mm?Math.max(0,(mm.max_players??0)-(mm.current_players??0)):0;
    const when=mm?.scheduled_at?fmt(mm.scheduled_at):"";
    const where=mm?.court_name||"自訂地點";
    const lead=need>0?`「${title}」還缺 ${need} 人!`:`「${title}」`;
    return {url,text:`${lead}${when} 在 ${where},一起來打球! ${url}`};
  }
  function share(){ const {url,text}=inviteText();
    if(navigator.share)navigator.share({title:"VEKTR 約球",text,url}).catch(()=>{});
    else {navigator.clipboard?.writeText(url);setMsg("已複製分享連結");}
  }
  function shareLine(){ const {text}=inviteText();
    window.open(`https://line.me/R/msg/text/?${encodeURIComponent(text)}`,"_blank","noopener");
  }

  if(!data) return <P>載入中…</P>;
  if(data==="notfound") return <P>找不到這場球局,或你沒有檢視權限。</P>;
  const m=data.match, v=data.viewer, ps=data.participants??[]; const full=m.current_players>=m.max_players;

  return (
    <div style={{background:C.bg,minHeight:"100vh",fontFamily:"-apple-system,'Noto Sans TC',sans-serif"}}>
      <div style={{maxWidth:560,margin:"0 auto",padding:"20px 16px 100px"}}>
        <button onClick={()=>router.push("/match")} style={{background:"none",border:"none",color:C.txt2,fontSize:14,padding:0,marginBottom:10,cursor:"pointer"}}>← 所有球局</button>
        {m.status==="cancelled" && <div style={{background:"#fef2f2",color:"#dc2626",padding:"10px 14px",borderRadius:10,fontWeight:700,fontSize:14,marginBottom:12,textAlign:"center"}}>此球局已取消</div>}
        <div style={{background:"#fff",border:`1px solid ${C.line}`,borderRadius:16,padding:20}}>
          <div style={{display:"flex",justifyContent:"space-between",gap:10}}>
            <h1 style={{fontSize:20,fontWeight:800,color:C.ink,margin:0}}>{m.title||`${gameLabel[m.game_type]??m.game_type}球局`}</h1>
            <span style={{fontSize:13,fontWeight:800,padding:"4px 10px",borderRadius:14,whiteSpace:"nowrap",background:full?"#fef2f2":C.limeBg,color:full?"#dc2626":C.lime}}>{m.current_players}/{m.max_players} 人{full?" 滿":""}</span>
          </div>
          <div style={{color:C.txt2,fontSize:14.5,marginTop:10,lineHeight:2}}>
            🕐 {fmt(m.scheduled_at)} · {m.duration_min} 分鐘<br/>
            📍 {m.court_name||"自訂地點"}{m.address?`,${m.address}`:""}<br/>
            🏓 {gameLabel[m.game_type]??m.game_type}{(m.dupr_min||m.dupr_max)?` · DUPR ${m.dupr_min??"?"}–${m.dupr_max??"?"}`:""}
          </div>
          {m.description && <p style={{marginTop:12,padding:12,background:C.bg,borderRadius:10,fontSize:14,color:C.txt}}>{m.description}</p>}
        </div>

        <h2 style={{fontSize:15,fontWeight:800,color:C.ink,margin:"22px 0 10px"}}>球友名單</h2>
        <div style={{display:"grid",gap:8}}>
          {ps.map((p:any)=>(
            <div key={p.user_id} style={{display:"flex",alignItems:"center",gap:10,background:"#fff",border:`1px solid ${C.line}`,borderRadius:12,padding:"10px 14px"}}>
              <div style={{width:36,height:36,borderRadius:"50%",background:C.navy,color:"#fff",display:"flex",alignItems:"center",justifyContent:"center",fontWeight:700,overflow:"hidden"}}>
                {p.avatar_url?<img src={p.avatar_url} alt="" style={{width:"100%",height:"100%",objectFit:"cover"}}/>:(p.name?.[0]??"?")}</div>
              <div style={{flex:1}}>
                <span style={{fontWeight:700,color:C.ink,fontSize:14.5}}>{p.name||"球友"}</span>
                {p.host && <span style={{marginLeft:8,fontSize:11,fontWeight:800,color:C.lime,background:C.limeBg,padding:"2px 7px",borderRadius:10}}>房主</span>}
                {p.dupr_rating && <span style={{marginLeft:8,fontSize:12,color:C.txt2}}>DUPR {p.dupr_rating}</span>}
              </div>
              {v.authenticated && v.userId != null && Number(p.user_id) !== Number(v.userId) && (
                <ReportButton reportedUserId={Number(p.user_id)} reportedName={p.name||"球友"} matchId={Number(m.id)} />
              )}
            </div>))}
        </div>

        {msg && <p style={{color:C.txt2,fontSize:14,marginTop:14,textAlign:"center"}}>{msg}</p>}
        <div style={{display:"grid",gap:10,marginTop:22}}>
          {v.canJoin && <Btn onClick={()=>act("join")} disabled={busy} primary>加入球局</Btn>}
          {full && !v.isParticipant && <Btn disabled>已額滿</Btn>}
          {v.canRate && <RateRow busy={busy} onRate={(n:number)=>act("rate",{rating:n})}/>}
          {v.canLeave && !v.isHost && <Btn onClick={()=>act("leave")} disabled={busy}>退出球局</Btn>}
          {v.isHost && m.status!=="cancelled" && <Btn onClick={()=>{if(confirm("確定取消整場球局?"))act("leave");}} disabled={busy} danger>取消球局(房主)</Btn>}
          <button onClick={shareLine} style={{width:"100%",background:"#06C755",color:"#fff",border:"none",padding:"13px",borderRadius:12,fontSize:15.5,fontWeight:800,cursor:"pointer"}}>📲 用 LINE 揪人{(()=>{const mm=data?.match;const n=mm?Math.max(0,(mm.max_players??0)-(mm.current_players??0)):0;return n>0?`(還缺 ${n} 人)`:"";})()}</button>
          <Btn onClick={share}>📤 其他分享方式</Btn>
          {!v.authenticated && <p style={{color:C.txt2,fontSize:13,textAlign:"center"}}>球友登入接上後即可加入(目前 demo 階段)</p>}
        </div>
      </div>
    </div>
  );
}
function P({children}:any){return <div style={{minHeight:"100vh",display:"flex",alignItems:"center",justifyContent:"center",color:C.txt2,fontFamily:"-apple-system,'Noto Sans TC',sans-serif"}}>{children}</div>;}
function Btn({children,onClick,disabled,primary,danger}:any){
  const bg=danger?"#fff":primary?C.navy:"#fff"; const color=danger?"#dc2626":primary?"#fff":C.navy;
  const border=primary?"none":`1.5px solid ${danger?"#fecaca":C.navy}`;
  return <button onClick={onClick} disabled={disabled} style={{width:"100%",background:disabled?"#e2e8f0":bg,color:disabled?"#94a3b8":color,border:disabled?"none":border,padding:"13px",borderRadius:12,fontSize:15.5,fontWeight:800,cursor:disabled?"default":"pointer"}}>{children}</button>;
}
function RateRow({onRate,busy}:any){ const [n,setN]=useState(0);
  return (<div style={{background:C.limeBg,borderRadius:12,padding:14,textAlign:"center"}}>
    <div style={{fontSize:14,fontWeight:700,color:C.ink,marginBottom:8}}>這場球打得如何?</div>
    <div style={{fontSize:26,letterSpacing:6}}>{[1,2,3,4,5].map(i=>(
      <span key={i} onClick={()=>!busy&&(setN(i),onRate(i))} style={{cursor:"pointer",color:i<=n?"#f59e0b":"#d1d5db"}}>★</span>))}</div>
  </div>);
}
