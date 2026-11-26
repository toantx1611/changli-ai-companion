import React, {useEffect,useRef,useState} from 'react';
import Live2D from './Live2D.jsx';
const API = 'http://127.0.0.1:8000';
const reaction = {
  head: {emotion:'love', text:'Changli khẽ nghiêng đầu, mỉm cười khi em chạm vào tóc.'},
  cheek: {emotion:'blush', text:'Changli đỏ mặt: “Em lại nghịch ngợm rồi.”'},
  shoulder: {emotion:'eye_roll', text:'Changli quay sang nhìn em: “Có chuyện gì sao?”'},
  repeat: {emotion:'angry', text:'Changli hơi cau mày: “Em định trêu ta đến bao giờ?”'}
};
export default function App(){
  const [messages,setMessages]=useState([]), [input,setInput]=useState(''), [busy,setBusy]=useState(false);
  const [show,setShow]=useState(true), [status,setStatus]=useState('Đang kết nối backend…');
  const [emotion,setEmotion]=useState('neutral');
  const end=useRef(null), lastTap=useRef(0), tapCount=useRef(0), resetTimer=useRef(null);
  const showEmotion=(name,ms=3600)=>{
    setEmotion(name);
    clearTimeout(resetTimer.current);
    resetTimer.current=setTimeout(()=>setEmotion('neutral'),ms);
  };
  useEffect(()=>{
    fetch(API+'/health').then(r=>r.json()).then(()=>setStatus('Backend sẵn sàng')).catch(()=>setStatus('Chưa chạy backend Python'));
    fetch(API+'/history').then(r=>r.ok?r.json():[]).then(setMessages).catch(()=>{});
    return ()=>clearTimeout(resetTimer.current);
  },[]);
  useEffect(()=>{end.current?.scrollIntoView({behavior:'smooth'});},[messages,show]);
  function touch(zone){
    const now=Date.now();
    tapCount.current=now-lastTap.current<1800?tapCount.current+1:1;
    lastTap.current=now;
    const r=tapCount.current>=3?reaction.repeat:reaction[zone];
    showEmotion(r.emotion);
    // Touch changes the Live2D expression only; chat history is unaffected.
  }
  async function send(e){
    e.preventDefault(); const msg=input.trim(); if(!msg||busy)return;
    setInput('');setMessages(p=>[...p,{role:'user',content:msg}]);setBusy(true);
    try{
      const response=await fetch(API+'/chat',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({message:msg})});
      const data=await response.json();if(!response.ok)throw Error(data.detail||'Lỗi kết nối');
      setMessages(p=>[...p,{role:'assistant',content:data.reply}]);
      showEmotion(data.emotion||'neutral',5000);
    }catch(err){setMessages(p=>[...p,{role:'assistant',content:'⚠ '+err.message}]);}
    finally{setBusy(false);}
  }
  return <div className="window">
    <div className="topbar"><span>✦ Changli AI</span><div className="actions">
      <button onClick={()=>setShow(v=>!v)}>{show?'Ẩn chat':'Mở chat'}</button>
      <button onClick={()=>window.desktop?.minimize()}>−</button><button onClick={()=>window.desktop?.close()}>×</button>
    </div></div>
    <Live2D emotion={emotion} onInteract={touch}/>
    {show&&<section className="chat"><div className="status">{status} · Qwen 2.5 3B</div>
      <div className="messages">{messages.length===0&&<div className="hint">Nhắn tin để trò chuyện cùng Changli.</div>}
        {messages.map((m,i)=><div key={i} className={'bubble '+m.role}>{m.content}</div>)}
        {busy&&<div className="hint">Changli đang suy nghĩ…</div>}<div ref={end}/>
      </div><form onSubmit={send}><input value={input} onChange={e=>setInput(e.target.value)} placeholder="Nhắn cho Changli…"/><button disabled={busy}>Gửi</button></form>
    </section>}
  </div>;
}
