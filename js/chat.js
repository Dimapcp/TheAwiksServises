function getCurrentUser(){
try{ return JSON.parse(localStorage.getItem('currentUser') || 'null'); }
catch(e){ return null; }
}


function loadChat(){
try{ return JSON.parse(localStorage.getItem('dev_chat') || '[]'); }
catch(e){ return []; }
}


function saveChat(a){ localStorage.setItem('dev_chat', JSON.stringify(a)); }


const messagesEl = document.getElementById('messages');
const input = document.getElementById('chatInput');
const sendBtn = document.getElementById('sendBtn');
const userPanel = document.getElementById('userPanel');


function render(){
const chat = loadChat();
messagesEl.innerHTML='';
chat.forEach(m=>{
const d=document.createElement('div');
d.className='msg';
d.textContent = m.user + ': ' + m.message;
messagesEl.appendChild(d);
});
}


sendBtn.onclick = ()=>{
const txt=input.value.trim();
if(!txt) return;
const u=getCurrentUser();
const name=u?u.name:'Guest';
const chat=loadChat();
chat.push({user:name,message:txt,time:Date.now()});
saveChat(chat);
input.value='';
render();
};


function renderUser(){
const u=getCurrentUser();
userPanel.innerHTML = u ? ('В сети: '+u.name) : 'Не в системе';
}


setInterval(()=>{render();renderUser();},1200);
render();renderUser();
