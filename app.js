
import { lineChart } from './js/chart.js';
import './js/telegram-shim.js';

const BRAND = {
  orange:'#FF8356', magenta:'#D32BBC', purple:'#492296', dark:'#11093A', gray:'#949392'
};

const db = {
  user: null,
  events: [],
  tickets: [],
  reviews: [],
  merchOrders: [],
  cities: ['Москва','Санкт‑Петербург','Берлин'],
  categories: ['Настольные игры','Путешествия','Спорт','Здоровье','Нетворкинг','Обучение'],
  admins: ['andrey']
};

const storeKey = 'vibe_demo_store';
function load(){
  const raw = localStorage.getItem(storeKey);
  if(raw){
    const s = JSON.parse(raw);
    Object.assign(db, s);
  } else {
    seed();
    save();
  }
}
function save(){
  localStorage.setItem(storeKey, JSON.stringify(db));
}
function seed(){
  db.user = {
    id: 1, name:'Андрей', username:'andrey', city:'Берлин', about:'Фаундер The Vibe Events',
    interests:['Нетворкинг','Спорт','Обучение'],
    points: 1200,
    history: [], // {delta, reason, ts}
  };
  const now = new Date();
  db.events = [
    {
      id: uid(), title:'Бизнес‑завтрак: Сделки и партнёрства', city:'Москва',
      datetime: addDays(now,7).toISOString(),
      durationM: 120, price: 5000, capacity: 40, categories:['Нетворкинг','Обучение'],
      address:'Москва‑Сити, Импресса, 21 этаж', lat:55.749, lon:37.539,
      params:{parking:true,dress:'smart casual',format:'завтрак',age:'18+',flight:false,stay:false},
      vip:['Алексей Кузнецов','Ирина Гольдберг'],
      cover:'', rating:4.8, reviews:2, cost: 2200
    },
    {
      id: uid(), title:'Мафия Premium', city:'Санкт‑Петербург',
      datetime: addDays(now,10).toISOString(),
      durationM: 180, price: 3500, capacity: 20, categories:['Настольные игры','Нетворкинг'],
      address:'Наб. реки Фонтанки, 25', lat:59.931, lon:30.360,
      params:{parking:false,dress:'black style',format:'мафия',age:'18+',flight:false,stay:false},
      vip:['Гость‑сюрприз'],
      cover:'', rating:4.9, reviews:5, cost: 900
    },
    {
      id: uid(), title:'Гольф & Дилы', city:'Берлин',
      datetime: addDays(now,15).toISOString(),
      durationM: 240, price: 10000, capacity: 16, categories:['Спорт','Нетворкинг'],
      address:'Golf Club Berlin‑Wannsee', lat:52.44, lon:13.18,
      params:{parking:true,dress:'спорт',format:'гольф',age:'18+',flight:false,stay:false},
      vip:['Маркус Шнайдер'],
      cover:'', rating:4.7, reviews:3, cost: 5000
    }
  ];
  db.reviews = [
    {id:uid(), eventId: db.events[0].id, user:'Анна', stars:5, text:'Крутая энергетика и полезные знакомства!', ts: Date.now()-86400000*3},
    {id:uid(), eventId: db.events[1].id, user:'Михаил', stars:4, text:'Ведущий топ. Хочу ещё!', ts: Date.now()-86400000*8},
  ];
}
function addDays(date, days){
  const d = new Date(date); d.setDate(d.getDate()+days); return d;
}
function uid(){ return Math.random().toString(36).slice(2,10); }

const el = sel => document.querySelector(sel);
const $ = (html) => {
  const d = document.createElement('div'); d.innerHTML = html.trim(); return d.firstChild;
}

let state = {
  view: 'afisha', // onboarding, afisha, event, checkout, tickets, my, reviews, profile, admin
  selectedEvent: null,
  filters: { city:'Все', cats:new Set(), month: new Date().getMonth(), year: new Date().getFullYear() }
};

function setView(v){
  state.view = v;
  render();
}

function init(){
  load();
  renderHeader();
  bindNav();
  render();
}

function renderHeader(){
  const header = el('#header');
  header.innerHTML = `
    <div class="logo">
      <img src="./assets/logo.svg" alt="V">
      <div>
        <div class="title">Vibe Planner</div>
        <div class="small">Твоя среда. Твой ритм. Твой Vibe.</div>
      </div>
      <span class="badge">beta</span>
    </div>
    <div class="top-actions">
      <span class="toggle"><span class="avatar"></span> ${db.user?.name || 'Гость'}</span>
      <button class="btn ghost" id="btnAdmin">${isAdmin() ? 'Админ‑панель' : 'Войти как админ'}</button>
    </div>
  `;
  el('#btnAdmin').onclick = ()=>{
    if(isAdmin()){ setView('admin'); }
    else{
      const u = prompt('Введите username (andrey для доступа в демо):','');
      if(u && db.admins.includes(u)){ setView('admin'); } else alert('Нет доступа');
    }
  }
}

function bindNav(){
  el('#nav').addEventListener('click', (e)=>{
    const t = e.target.closest('.tab'); if(!t) return;
    const v = t.dataset.view;
    if(v) setView(v);
  });
}

function render(){
  // nav active
  document.querySelectorAll('.nav .tab').forEach(t=>{
    t.classList.toggle('active', t.dataset.view === state.view);
  });
  const m = el('#main');
  m.innerHTML = '';
  if(state.view==='onboarding') return renderOnboarding(m);
  if(state.view==='afisha') return renderAfisha(m);
  if(state.view==='event') return renderEvent(m, state.selectedEvent);
  if(state.view==='checkout') return renderCheckout(m, state.selectedEvent);
  if(state.view==='tickets') return renderTickets(m);
  if(state.view==='my') return renderMyMeetings(m);
  if(state.view==='reviews') return renderReviews(m);
  if(state.view==='profile') return renderProfile(m);
  if(state.view==='admin') return renderAdmin(m);
}

function renderOnboarding(m){
  m.appendChild($(`
    <div class="card" style="text-align:center;padding:30px;background:linear-gradient(120deg,#FFE3D6,#F0D5FF)">
      <img src="./assets/logo.svg" style="height:64px"/>
      <h2>Добро пожаловать в Vibe Planner</h2>
      <p>Создайте профиль, выбирайте мероприятия и копите баллы</p>
      <button class="btn" id="createProfile">Создать профиль</button>
    </div>
  `));
  el('#createProfile').onclick = ()=>{
    const name = prompt('Ваше имя:', db.user?.name || '');
    const username = prompt('Username:', db.user?.username || '');
    const city = prompt('Город:', db.user?.city || 'Берлин');
    db.user = {...db.user, name, username, city};
    save(); toast('Профиль создан');
    setView('afisha');
  }
}

function renderAfisha(m){
  const allCities = ['Все', ...Array.from(new Set(db.events.map(e=>e.city)))];
  const months = ['Янв','Фев','Мар','Апр','Май','Июн','Июл','Авг','Сен','Окт','Ноя','Дек'];
  const f = $(`
    <div class="filters">
      <div style="flex:1;min-width:180px">
        <div class="label">Город</div>
        <select id="fCity">${allCities.map(c=>`<option ${c===state.filters.city?'selected':''}>${c}</option>`).join('')}</select>
      </div>
      <div style="flex:2">
        <div class="label">Категории</div>
        <div id="fCats" class="row">${db.categories.map(c=>`<span class="cat" data-cat="${c}" style="cursor:pointer;opacity:${state.filters.cats.has(c)?1:.5}">${c}</span>`).join('')}</div>
      </div>
      <div>
        <div class="label">Месяц</div>
        <div class="row center">
          <button class="btn outline" id="prevM">◀</button>
          <div style="min-width:80px;text-align:center"><strong>${months[state.filters.month]}</strong></div>
          <button class="btn outline" id="nextM">▶</button>
        </div>
      </div>
      <div>
        <div class="label">Год</div>
        <select id="fYear">${[2024,2025,2026].map(y=>`<option ${y===state.filters.year?'selected':''}>${y}</option>`).join('')}</select>
      </div>
    </div>
  `);
  m.appendChild(f);
  f.querySelector('#fCity').onchange = (e)=>{ state.filters.city = e.target.value; render(); }
  f.querySelector('#fYear').onchange = (e)=>{ state.filters.year = +e.target.value; render(); }
  f.querySelector('#prevM').onclick = ()=>{ state.filters.month=(state.filters.month+11)%12; render(); }
  f.querySelector('#nextM').onclick = ()=>{ state.filters.month=(state.filters.month+1)%12; render(); }
  f.querySelectorAll('#fCats .cat').forEach(c=> c.onclick = ()=>{
    const name = c.dataset.cat;
    if(state.filters.cats.has(name)) state.filters.cats.delete(name); else state.filters.cats.add(name);
    render();
  });

  const grid = $('<div class="grid"></div>');
  m.appendChild(grid);

  const items = db.events.filter(e=>{
    const d = new Date(e.datetime);
    if(state.filters.city!=='Все' && e.city!==state.filters.city) return false;
    if(d.getMonth()!==state.filters.month || d.getFullYear()!==state.filters.year) return false;
    if(state.filters.cats.size){
      const set = new Set(e.categories);
      let ok = false; state.filters.cats.forEach(c=>{ if(set.has(c)) ok=true; });
      if(!ok) return false;
    }
    return true;
  });
  if(!items.length){
    grid.appendChild($('<div class="small">Нет событий по выбранным фильтрам</div>'));
  }
  items.forEach(e=>{
    const card = $(`
      <div class="card">
        <div class="event-img">
          <div class="share">↗︎ поделиться</div>
          <div style="font-weight:900;font-size:24px;color:#492296">${emojiFor(e)} ${e.categories[0]}</div>
        </div>
        <h3>${e.title}</h3>
        <div class="small">${new Date(e.datetime).toLocaleString('ru-RU', {dateStyle:'medium', timeStyle:'short'})} • ${e.city}</div>
        <div class="row"><span class="price-chip">${e.price.toLocaleString('ru-RU')} ₽</span> ${e.categories.map(c=>`<span class="cat">${c}</span>`).join('')}</div>
        <div class="row" style="justify-content:flex-end;margin-top:8px">
          <button class="btn" data-id="${e.id}">Открыть</button>
        </div>
      </div>
    `);
    card.querySelector('button').onclick = ()=>{ state.selectedEvent = e; setView('event'); };
    grid.appendChild(card);
  });
}

function emojiFor(e){
  const map = { 'Нетворкинг':'🤝','Настольные игры':'🎲','Путешествия':'✈️','Спорт':'⛳','Здоровье':'🧖','Обучение':'🎓' };
  return map[e.categories[0]] || '✨';
}

function renderEvent(m, e){
  if(!e) return;
  const dur = e.durationM;
  const end = new Date(new Date(e.datetime).getTime()+dur*60000);
  const card = $(`
    <div class="card">
      <div class="event-img"><div class="share">↗︎ поделиться</div><div style="font-weight:900;font-size:28px;color:#492296">${emojiFor(e)} ${e.title}</div></div>
      <div class="row">
        <div class="avatar"></div>
        <div><strong>Организатор:</strong> The Vibe Events</div>
        <div class="badge small" style="margin-left:auto">Рейтинг ${e.rating} (${e.reviews})</div>
        <span class="link" id="allReviews">Все отзывы</span>
      </div>
      <hr class="sep"/>
      <div class="section">
        <div class="kv"><strong>Время:</strong> ${fmtDT(e.datetime)} — ${end.toLocaleTimeString('ru-RU',{timeStyle:'short'})} (${dur} мин)</div>
        <div class="kv"><strong>Место:</strong> ${e.address}, ${e.city} <span class="link" id="showMap">Показать на карте</span> • <a class="link" href="https://yandex.com/maps/?text=${encodeURIComponent(e.address)}" target="_blank">Открыть в Я.Картах</a></div>
      </div>
      <div class="section">
        <div class="row">
          ${paramIcon('Парковка', e.params.parking?'есть':'нет')}
          ${paramIcon('Дресс‑код', e.params.dress)}
          ${paramIcon('Формат', e.params.format)}
          ${paramIcon('Возраст', e.params.age)}
          ${paramIcon('Перелёт', e.params.flight?'да':'нет')}
          ${paramIcon('Проживание', e.params.stay?'да':'нет')}
        </div>
      </div>
      <div class="section">
        <strong>VIP‑гости:</strong> ${e.vip.map(v=>`<span class="badge" style="margin-right:6px">${v}</span>`).join('')}
      </div>
      <div class="section">
        <strong>Участники:</strong> <span class="avatar"></span> <span class="avatar"></span> <span class="avatar"></span> …
      </div>
      <div id="mapWrap" class="section" style="display:none">
        <div class="card"><div class="small">Карта (демо) — iframe Яндекс.Карт в реальной версии</div>
          <div style="height:220px;border:1px dashed #ddd;border-radius:12px;background:#fafafa;display:flex;align-items:center;justify-content:center">🗺️ карта</div>
        </div>
      </div>
      <div class="sticky-buy">
        <button class="btn" id="buyBtn">Купить билет — ${e.price.toLocaleString('ru-RU')} ₽</button>
      </div>
    </div>
  `);
  m.appendChild(card);
  card.querySelector('#allReviews').onclick = ()=>{ setView('reviews'); }
  card.querySelector('#showMap').onclick = ()=>{ el('#mapWrap').style.display='block'; }
  card.querySelector('#buyBtn').onclick = ()=>{ setView('checkout'); }
}

function paramIcon(label, value){
  return `<div class="card" style="padding:8px 12px"><div class="small">${label}</div><div><strong>${value}</strong></div></div>`;
}

function fmtDT(iso){
  const d = new Date(iso);
  return d.toLocaleString('ru-RU',{dateStyle:'medium', timeStyle:'short'});
}

function renderCheckout(m, e){
  const card = $(`
    <div class="card">
      <h3>Оплата</h3>
      <div class="row">
        <div style="flex:1">
          <div class="label">Количество билетов</div>
          <input type="number" id="qty" class="input" min="1" value="1"/>
        </div>
        <div style="flex:1">
          <div class="label">Промокод</div>
          <input id="promo" class="input" placeholder="например, VIBE10"/>
        </div>
      </div>
      <div class="row" style="margin-top:8px">
        <div style="flex:1">
          <div class="label">Списать баллы (до 30%)</div>
          <input type="number" id="usePoints" class="input" min="0" value="0"/>
          <div class="hint">У вас ${db.user.points} баллов • минимум к оплате 1 000 ₽</div>
        </div>
      </div>
      <hr class="sep"/>
      <div id="summary" class="row" style="justify-content:space-between"><div>Итого:</div><div><strong>— ₽</strong></div></div>
      <div class="row" style="justify-content:flex-end;margin-top:10px">
        <button class="btn" id="payBtn">Оплатить — 0 ₽</button>
      </div>
      <div class="small">Начисление баллов: 5/6/7/8% по уровню (макс. 500)</div>
    </div>
  `);
  m.appendChild(card);

  function recalc(){
    const qty = +el('#qty').value || 1;
    const promo = el('#promo').value.trim();
    const useP = Math.max(0, Math.min(+el('#usePoints').value||0, db.user.points));
    const base = e.price * qty;
    const promoDisc = (promo==='VIBE10') ? Math.round(base*0.10) : 0;
    const maxPoints = Math.round( base * 0.30 );
    const pointsAllowed = Math.min(maxPoints, useP);
    let total = base - promoDisc - pointsAllowed;
    if(total < 1000){ // enforce min payment
      const diff = 1000 - total;
      total = 1000;
      // reduce points first
      const reduceFromPoints = Math.min(pointsAllowed, diff);
      const finalPoints = pointsAllowed - reduceFromPoints;
      // promo used stays as is; reflect
      card.dataset.finalPoints = finalPoints;
    } else {
      card.dataset.finalPoints = pointsAllowed;
    }
    card.dataset.qty = qty;
    card.dataset.total = total;
    card.dataset.promoDisc = promoDisc;
    el('#summary').innerHTML = `<div>Итого (после скидок):</div><div><strong>${total.toLocaleString('ru-RU')} ₽</strong></div>`;
    el('#payBtn').textContent = `Оплатить — ${total.toLocaleString('ru-RU')} ₽`;
  }
  ['qty','promo','usePoints'].forEach(id=> el('#'+id).addEventListener('input', recalc));
  recalc();

  el('#payBtn').onclick = ()=>{
    const qty = +card.dataset.qty;
    const total = +card.dataset.total;
    const pointsSpent = +card.dataset.finalPoints || 0;
    const accrualRate = tierRate(userTier(db.user.points));
    const accrual = Math.min(500, Math.round( (total) * accrualRate ));
    db.user.points = db.user.points - pointsSpent + accrual;
    db.user.history.push({delta:-pointsSpent, reason:'Списание на покупку', ts:Date.now()});
    db.user.history.push({delta:+accrual, reason:'Начисление за покупку', ts:Date.now()});
    for(let i=0;i<qty;i++){
      const ticket = {
        id: uid(),
        code: uid().toUpperCase(),
        eventId: e.id,
        title: e.title,
        city: e.city,
        dt: e.datetime,
        price: e.price,
        spent: i===0 ? pointsSpent : 0, // всю скидку на первый билет
        gained: i===0 ? accrual : 0
      };
      db.tickets.push(ticket);
    }
    save(); toast(`Оплата успешно! Баллы: -${pointsSpent}, +${accrual}`);
    setView('tickets');
  };
}

function tierRate(t){
  return t==='Diamond'?0.08: t==='Elite'?0.07: t==='Pro'?0.06: 0.05;
}
function userTier(points){
  if(points>=10000) return 'Diamond';
  if(points>=5000) return 'Elite';
  if(points>=1000) return 'Pro';
  return 'Starter';
}

function renderTickets(m){
  m.appendChild($(`<h3>Билеты</h3>`));
  if(!db.tickets.length) m.appendChild($('<div class="small">У вас пока нет билетов</div>'));
  db.tickets.slice().reverse().forEach(t=>{
    const card = $(`
      <div class="card">
        <div class="row" style="justify-content:space-between">
          <div><strong>${t.title}</strong><div class="small">${fmtDT(t.dt)} • ${t.city}</div></div>
          <div class="price-chip">${(t.price).toLocaleString('ru-RU')} ₽</div>
        </div>
        <hr class="sep"/>
        <div class="row" style="align-items:flex-start">
          <div>
            <div class="small">QR (демо)</div>
            <canvas id="qr_${t.id}" width="120" height="120" style="border-radius:8px;border:1px solid #eee"></canvas>
          </div>
          <div>
            <div class="kv"><strong>Код:</strong> ${t.code}</div>
            <div class="kv"><strong>Списано баллов:</strong> ${t.spent}</div>
            <div class="kv"><strong>Начислено баллов:</strong> ${t.gained}</div>
            <div class="row" style="margin-top:8px">
              <button class="btn outline" onclick="addToCalendar('${t.id}')">В календарь</button>
              <button class="btn">Чат</button>
            </div>
          </div>
        </div>
      </div>
    `);
    m.appendChild(card);
    drawFakeQR(el(`#qr_${t.id}`), t.code);
  });
  window.addToCalendar = (id)=>{
    const t = db.tickets.find(x=>x.id===id);
    const url = `https://calendar.google.com/calendar/render?action=TEMPLATE&text=${encodeURIComponent(t.title)}&dates=${icsDate(t.dt)}/${icsDate(t.dt)}&location=${encodeURIComponent(t.city)}`;
    window.open(url, '_blank');
  }
}

function drawFakeQR(canvas, text){
  const ctx = canvas.getContext('2d');
  ctx.fillStyle = '#fff'; ctx.fillRect(0,0,canvas.width,canvas.height);
  ctx.fillStyle = '#000';
  const seed = [...text].reduce((a,c)=>a+c.charCodeAt(0),0);
  let rng = mulberry32(seed);
  const n=21, cell = Math.floor(canvas.width/n);
  for(let y=0;y<n;y++){
    for(let x=0;x<n;x++){
      if(rng()>0.5) ctx.fillRect(x*cell,y*cell,cell-1,cell-1);
    }
  }
  function mulberry32(a){ return function(){ var t = a += 0x6D2B79F5; t = Math.imul(t ^ t >>> 15, t | 1); t ^= t + Math.imul(t ^ t >>> 7, t | 61); return ((t ^ t >>> 14) >>> 0) / 4294967296; } }
}

function icsDate(iso){ const d=new Date(iso); return d.toISOString().replace(/[-:]/g,'').replace(/\.\d+Z/,'Z'); }

function renderMyMeetings(m){
  const upcoming = db.tickets.map(t=> ({...t, dt:new Date(t.dt)})).filter(t=> t.dt>new Date());
  const past = db.tickets.map(t=> ({...t, dt:new Date(t.dt)})).filter(t=> t.dt<=new Date());
  m.appendChild($(`<div class="row"><h3>Мои встречи</h3><span class="badge" style="margin-left:8px">Предстоящие: ${upcoming.length}</span><span class="badge" style="margin-left:8px;background:#eafff3;color:#197b4d">Завершённые: ${past.length}</span></div>`));
  function list(items, kind){
    const wrap = $(`<div class="section"><h4>${kind}</h4></div>`);
    if(!items.length) wrap.appendChild($('<div class="small">Пусто</div>'));
    items.forEach(t=>{
      const card = $(`
        <div class="card">
          <div class="row" style="justify-content:space-between">
            <div><strong>${t.title}</strong><div class="small">${fmtDT(t.dt)} • ${t.city}</div></div>
            <div class="row">
              ${kind==='Завершённые'?'<button class="btn outline" data-id="'+t.id+'">Оставить отзыв (+100)</button>':''}
            </div>
          </div>
        </div>
      `);
      if(kind==='Завершённые'){
        card.querySelector('button').onclick = ()=>{
          const stars = +prompt('Оценка (1-5):','5')||5;
          const text = prompt('Отзыв:','Было полезно!');
          db.reviews.push({id:uid(), eventId: t.eventId, user: db.user.name, stars, text, ts:Date.now()});
          db.user.points += 100;
          db.user.history.push({delta:+100, reason:'Отзыв', ts:Date.now()});
          save(); toast('Спасибо за отзыв! +100 баллов'); render();
        };
      }
      wrap.appendChild(card);
    });
    m.appendChild(wrap);
  }
  list(upcoming, 'Предстоящие');
  list(past, 'Завершённые');
}

function renderReviews(m){
  const header = $(`<div class="row"><h3>Все отзывы</h3><div style="margin-left:auto"><select id="starFilter"><option value="0">Все</option><option>5</option><option>4</option><option>3</option><option>2</option><option>1</option></select></div></div>`);
  m.appendChild(header);
  const list = $('<div></div>'); m.appendChild(list);
  function draw(){
    list.innerHTML='';
    const star = +el('#starFilter').value || 0;
    db.reviews.filter(r=> !star || r.stars===star).slice().reverse().forEach(r=>{
      list.appendChild($(`
        <div class="card">
          <div class="row"><strong>${'★'.repeat(r.stars)}${'☆'.repeat(5-r.stars)}</strong><div class="small" style="margin-left:8px">${new Date(r.ts).toLocaleDateString('ru-RU')}</div></div>
          <div class="small">${r.user}</div>
          <div>${r.text}</div>
        </div>
      `));
    });
  }
  el('#starFilter').onchange = draw;
  draw();
}

function renderProfile(m){
  const tier = userTier(db.user.points);
  const card = $(`
    <div class="card">
      <div class="row">
        <div class="avatar" style="width:48px;height:48px"></div>
        <div>
          <div><strong>${db.user.name}</strong> @${db.user.username}</div>
          <div class="small">${db.user.city}</div>
        </div>
        <div style="margin-left:auto;text-align:right">
          <div><strong>${db.user.points}</strong> баллов</div>
          <div class="badge">${tier}</div>
        </div>
      </div>
      <hr class="sep"/>
      <div>
        <button class="btn outline" id="edit">Редактировать профиль</button>
        <button class="btn outline" id="tiers">Про уровни</button>
      </div>
      <div class="section">
        <h4>Мерч за баллы</h4>
        <div class="store-item"><div><strong>Футболка Vibe</strong><div class="small">1 500 баллов</div></div><button class="btn" data-cost="1500">Получить</button></div>
        <div class="store-item"><div><strong>Худи Vibe</strong><div class="small">3 500 баллов</div></div><button class="btn" data-cost="3500">Получить</button></div>
        <div class="store-item"><div><strong>Гольф‑кэп Vibe</strong><div class="small">900 баллов</div></div><button class="btn" data-cost="900">Получить</button></div>
      </div>
      <div class="section">
        <h4>История баллов</h4>
        <table class="table"><tr><th>Дата</th><th>Изменение</th><th>Причина</th></tr>
          ${db.user.history.slice().reverse().map(h=>`<tr><td>${new Date(h.ts).toLocaleString('ru-RU')}</td><td>${h.delta>0?'+':''}${h.delta}</td><td>${h.reason}</td></tr>`).join('')}
        </table>
      </div>
    </div>
  `);
  m.appendChild(card);
  card.querySelectorAll('.store-item .btn').forEach(b=> b.onclick = ()=>{
    const cost = +b.dataset.cost;
    if(db.user.points<cost){ alert('Недостаточно баллов'); return; }
    db.user.points -= cost;
    const order = { id:uid(), item:b.parentElement.querySelector('strong').textContent, cost, ts:Date.now() };
    db.merchOrders.push(order);
    db.user.history.push({delta:-cost, reason:'Мерч', ts:Date.now()});
    save(); toast('Заказ оформлен! QR‑квитанция добавлена');
  });
  el('#edit').onclick = ()=>{
    const name = prompt('Имя:', db.user.name);
    const city = prompt('Город:', db.user.city);
    db.user.name = name; db.user.city = city; save(); render();
  };
  el('#tiers').onclick = ()=>{
    alert('Уровни: Starter 0–999 (5%), Pro 1000–4999 (6%), Elite 5000–9999 (7%), Diamond 10000+ (8%). Баллы живут 180 дней.');
  }
}

function renderAdmin(m){
  const wrap = $(`
    <div class="card">
      <div class="row"><h3>Админ‑панель</h3><span class="badge">менеджмент</span></div>
      <div class="kpi">
        <div class="item"><div class="small">Выручка</div><div class="num">${revenue().toLocaleString('ru-RU')} ₽</div></div>
        <div class="item"><div class="small">Чистая прибыль</div><div class="num">${(revenue()-costs()).toLocaleString('ru-RU')} ₽</div></div>
        <div class="item"><div class="small">Средний чек</div><div class="num">${avgCheck().toLocaleString('ru-RU')} ₽</div></div>
        <div class="item"><div class="small">Маржинальность</div><div class="num">${margin()}%</div></div>
      </div>
      <div class="section">
        <canvas class="chart" id="chartRev"></canvas>
      </div>
      <div class="section">
        <h4>События</h4>
        <button class="btn outline" id="addEvent">Добавить</button>
        <table class="table">
          <tr><th>Дата</th><th>Название</th><th>Город</th><th>Цена</th><th></th></tr>
          ${db.events.map(e=>`<tr>
            <td>${new Date(e.datetime).toLocaleDateString('ru-RU')}</td>
            <td>${e.title}</td>
            <td>${e.city}</td>
            <td>${e.price.toLocaleString('ru-RU')} ₽</td>
            <td><span class="link" data-act="open" data-id="${e.id}">Открыть</span> / <span class="link" data-act="edit" data-id="${e.id}">Редактировать</span></td>
          </tr>`).join('')}
        </table>
      </div>
    </div>
  `);
  m.appendChild(wrap);
  // chart data
  const months = ['Янв','Фев','Мар','Апр','Май','Июн','Июл','Авг','Сен','Окт','Ноя','Дек'];
  const revByMonth = Array(12).fill(0);
  db.tickets.forEach(t=>{ const d=new Date(t.dt); revByMonth[d.getMonth()]+=t.price; });
  const convDyn = Array(12).fill(0).map(()=>Math.round(40+Math.random()*40));
  lineChart(el('#chartRev'), [
    {name:'Выручка', data: revByMonth.map((y,i)=>({x:i,y}))},
    {name:'Конверсия', data: convDyn.map((y,i)=>({x:i,y}))},
  ], { labels: months });

  wrap.querySelector('#addEvent').onclick = ()=> editEvent();
  wrap.querySelectorAll('.link').forEach(a=> a.onclick = ()=>{
    const id = a.dataset.id;
    const act = a.dataset.act;
    const ev = db.events.find(e=>e.id===id);
    if(act==='open'){ state.selectedEvent = ev; setView('event'); }
    if(act==='edit'){ editEvent(ev); }
  });
}

function editEvent(e=null){
  const data = e || {id:uid(), title:'', city:db.cities[0], datetime:new Date().toISOString(), durationM:120, price:3000, capacity:20, categories:['Нетворкинг'], address:'', params:{parking:false,dress:'',format:'',age:'18+',flight:false,stay:false}, vip:[], rating:0, reviews:0, cost:0};
  const html = `
    <div class="card">
      <h3>${e?'Редактирование':'Новое событие'}</h3>
      <div class="row">
        <div style="flex:1"><div class="label">Название</div><input id="evTitle" class="input" value="${data.title}"/></div>
        <div style="flex:1"><div class="label">Город</div><select id="evCity">${db.cities.map(c=>`<option ${c===data.city?'selected':''}>${c}</option>`)}</select></div>
      </div>
      <div class="row">
        <div style="flex:1"><div class="label">Дата и время</div><input id="evDT" class="input" value="${data.datetime}"/></div>
        <div style="flex:1"><div class="label">Длительность, мин</div><input id="evDur" class="input" type="number" value="${data.durationM}"/></div>
      </div>
      <div class="row">
        <div style="flex:1"><div class="label">Цена</div><input id="evPrice" class="input" type="number" value="${data.price}"/></div>
        <div style="flex:1"><div class="label">Себестоимость</div><input id="evCost" class="input" type="number" value="${data.cost}"/></div>
      </div>
      <div class="row">
        <div style="flex:2"><div class="label">Адрес</div><input id="evAddr" class="input" value="${data.address}"/></div>
        <div style="flex:1"><div class="label">Категории</div><input id="evCat" class="input" value="${data.categories.join(', ')}"/></div>
      </div>
      <div class="row" style="justify-content:flex-end;margin-top:10px">
        <button class="btn" id="saveEv">Сохранить</button>
      </div>
    </div>
  `;
  el('#main').innerHTML = html;
  el('#saveEv').onclick = ()=>{
    const updated = {
      ...data,
      title: el('#evTitle').value.trim(),
      city: el('#evCity').value,
      datetime: el('#evDT').value,
      durationM: +el('#evDur').value,
      price: +el('#evPrice').value,
      cost: +el('#evCost').value,
      address: el('#evAddr').value,
      categories: el('#evCat').value.split(',').map(s=>s.trim()).filter(Boolean)
    };
    if(e){
      const idx = db.events.findIndex(x=>x.id===e.id); db.events[idx]=updated;
    } else {
      db.events.push(updated);
    }
    save(); toast('Событие сохранено'); setView('admin');
  };
}

function revenue(){
  return db.tickets.reduce((s,t)=>s+t.price,0);
}
function costs(){
  return db.tickets.reduce((s,t)=>{
    const e = db.events.find(ev=>ev.id===t.eventId);
    return s + (e?.cost||0);
  },0);
}
function avgCheck(){
  if(!db.tickets.length) return 0;
  return Math.round(revenue()/db.tickets.length);
}
function margin(){
  const rev = revenue(), c = costs();
  if(!rev) return 0;
  return Math.round((rev-c)/rev*100);
}

function toast(msg){
  const t = el('#toast'); t.textContent = msg; t.style.display='block'; setTimeout(()=> t.style.display='none', 2200);
}

// Initial load
document.addEventListener('DOMContentLoaded', init);
