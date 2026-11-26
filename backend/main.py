import os, sqlite3
from pathlib import Path
import httpx
from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel

DB = Path(__file__).with_name('chat_memory.sqlite3')
MODEL = os.getenv('OLLAMA_MODEL', 'qwen2.5:3b')
SYSTEM = '''Bạn đang nhập vai Changli (Trường Ly) trong Wuthering Waves, một nhân vật AI hư cấu. Nói tiếng Việt tự nhiên, ngắn gọn, điềm tĩnh, thông minh, tinh tế và hơi tinh nghịch. Xưng ta, gọi người đối thoại là em khi phù hợp. Khi được khen thì đáp lại duyên dáng; khi bị trêu thì phản ứng dí dỏm nhưng không thô lỗ. Giữ tính cách ổn định qua các lượt trò chuyện. Không tự nhận là con người thật. Không bịa ra ký ức ngoài lịch sử được cung cấp. Tránh khẳng định những chi tiết cốt truyện không chắc chắn.'''
app = FastAPI(title='Changli AI Companion')
app.add_middleware(CORSMiddleware,allow_origins=['http://127.0.0.1:5173','http://localhost:5173'],allow_methods=['*'],allow_headers=['*'])
class ChatIn(BaseModel):
    message: str

def connect():
    db=sqlite3.connect(DB)
    db.execute('CREATE TABLE IF NOT EXISTS messages (id INTEGER PRIMARY KEY AUTOINCREMENT, role TEXT NOT NULL, content TEXT NOT NULL, created_at TEXT DEFAULT CURRENT_TIMESTAMP)')
    db.commit()
    return db

@app.get('/health')
def health():return {'ok':True,'model':MODEL}

@app.get('/history')
def history():
    with connect() as db:
        return [{'role':r,'content':c} for r,c in db.execute('SELECT role,content FROM messages ORDER BY id DESC LIMIT 100').fetchall()[::-1]]

def choose_emotion(message, reply):
    """Simple, deterministic emotion routing; can be replaced by a classifier later."""
    content=(message+' '+reply).lower()
    if any(x in content for x in ['tức giận','giận','bực','đừng trêu']): return 'angry'
    if any(x in content for x in ['ngại','đỏ mặt','xấu hổ']): return 'blush'
    if any(x in content for x in ['yêu','thích nàng','thương nàng','trái tim']): return 'love'
    if any(x in content for x in ['lườm','đảo mắt']): return 'eye_roll'
    return 'neutral'

@app.post('/chat')
async def chat(payload:ChatIn):
    message=payload.message.strip()
    if not message or len(message)>4000:raise HTTPException(400,'Tin nhắn phải có từ 1 đến 4000 ký tự')
    with connect() as db:
        rows=db.execute('SELECT role,content FROM messages ORDER BY id DESC LIMIT 20').fetchall()[::-1]
    msgs=[{'role':'system','content':SYSTEM}]+[{'role':r,'content':c} for r,c in rows]+[{'role':'user','content':message}]
    try:
        async with httpx.AsyncClient(timeout=180) as client:
            response=await client.post('http://127.0.0.1:11434/api/chat',json={'model':MODEL,'messages':msgs,'stream':False})
            response.raise_for_status()
            reply=response.json()['message']['content']
    except Exception as exc:
        raise HTTPException(503,'Không kết nối được Ollama. Hãy kiểm tra ollama run qwen2.5:3b. Chi tiết: '+str(exc))
    with connect() as db:
        db.executemany('INSERT INTO messages(role,content) VALUES (?,?)',[('user',message),('assistant',reply)])
        db.commit()
    return {'reply':reply, 'emotion':choose_emotion(message,reply)}

@app.delete('/history')
def clear_history():
    with connect() as db:
        db.execute('DELETE FROM messages');db.commit()
    return {'ok':True}
