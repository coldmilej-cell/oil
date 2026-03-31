// ══════════════ boss_patch.js v2 - 사장앱 추가 기능 ══════════════
// boss.html의 </body> 바로 앞에 <script src="boss_patch.js"></script>

// ── 이름 이스케이프 헬퍼 (따옴표 오류 방지) ──────────────────────
function escQ(str){ return (str||'').replace(/\\/g,'\\\\').replace(/'/g,"\\'"); }

// ══════════════ 미수 연령 분석 (Aging Report) ══════════════

async function loadMisuAging(){
  const month = document.getElementById('dash-month')?.value || '';
  if(!month) return;
  const [y,m] = month.split('-');
  const section = document.getElementById('misu-aging-section');
  if(section) section.innerHTML = '<div style="text-align:center;padding:20px;color:var(--t3)">⏳ 분석 중...</div>';
  try{
    const res = await fetch(`${API}?type=misu_aging&year=${y}&month=${m}`);
    const d = await res.json();
    if(!d.ok){
      if(section) section.innerHTML = `<div style="color:var(--r);padding:10px">분석 실패: ${d.error||''}</div>`;
      return;
    }
    renderMisuAging(d.aging, d.기준일);
  }catch(e){
    if(section) section.innerHTML = '<div style="color:var(--r);padding:10px">네트워크 오류</div>';
  }
}

function renderMisuAging(aging, 기준일){
  const el = document.getElementById('misu-aging-section');
  if(!el) return;

  if(!aging || !aging.length){
    el.innerHTML = '<div class="empty"><div class="empty-icon">🎉</div><div style="font-size:13px">연체 미수 없음</div></div>';
    return;
  }

  const total    = aging.reduce((s,r)=>s+r.총미수,0);
  const total30  = aging.reduce((s,r)=>s+r.d30,0);
  const total60  = aging.reduce((s,r)=>s+r.d60,0);
  const total90  = aging.reduce((s,r)=>s+r.d90,0);
  const total90p = aging.reduce((s,r)=>s+r.d90plus,0);

  const summaryHtml = `
    <div style="background:var(--card2);border-radius:12px;padding:13px;margin-bottom:12px">
      <div style="font-size:10px;color:var(--t3);font-weight:700;letter-spacing:.1em;margin-bottom:10px">
        📊 미수 연령 요약 (기준일: ${기준일||'-'})
      </div>
      <div style="display:grid;grid-template-columns:1fr 1fr;gap:8px">
        <div style="background:rgba(63,185,80,.08);border:1px solid rgba(63,185,80,.2);border-radius:10px;padding:10px;text-align:center">
          <div style="font-size:9px;color:var(--g);font-weight:700;margin-bottom:4px">30일 이내</div>
          <div style="font-family:'JetBrains Mono',monospace;font-size:14px;font-weight:700;color:var(--g)">${total30.toLocaleString()}원</div>
        </div>
        <div style="background:rgba(88,166,255,.08);border:1px solid rgba(88,166,255,.2);border-radius:10px;padding:10px;text-align:center">
          <div style="font-size:9px;color:#58a6ff;font-weight:700;margin-bottom:4px">31~60일</div>
          <div style="font-family:'JetBrains Mono',monospace;font-size:14px;font-weight:700;color:#58a6ff">${total60.toLocaleString()}원</div>
        </div>
        <div style="background:rgba(240,165,0,.08);border:1px solid rgba(240,165,0,.2);border-radius:10px;padding:10px;text-align:center">
          <div style="font-size:9px;color:var(--y);font-weight:700;margin-bottom:4px">61~90일</div>
          <div style="font-family:'JetBrains Mono',monospace;font-size:14px;font-weight:700;color:var(--y)">${total90.toLocaleString()}원</div>
        </div>
        <div style="background:rgba(248,81,73,.08);border:1px solid rgba(248,81,73,.2);border-radius:10px;padding:10px;text-align:center">
          <div style="font-size:9px;color:var(--r);font-weight:700;margin-bottom:4px">90일 초과 ⚠️</div>
          <div style="font-family:'JetBrains Mono',monospace;font-size:14px;font-weight:700;color:var(--r)">${total90p.toLocaleString()}원</div>
        </div>
      </div>
      <div style="margin-top:10px;display:flex;justify-content:space-between;align-items:center;padding:8px 0;border-top:1px solid var(--border)">
        <span style="font-size:12px;font-weight:700">총 미수잔액</span>
        <span style="font-family:'JetBrains Mono',monospace;font-size:16px;font-weight:700;color:var(--r)">${total.toLocaleString()}원</span>
      </div>
    </div>`;

  const rowsHtml = aging.map(r => {
    const risk      = r.d90plus>0?'var(--r)':r.d90>0?'var(--y)':r.d60>0?'#58a6ff':'var(--g)';
    const riskLabel = r.d90plus>0?'⚠️ 90일↑':r.d90>0?'61-90일':r.d60>0?'31-60일':'30일↓';

    // 연령 바 (0으로 나누기 방지)
    const barTotal = r.총미수 || 1;
    const b30  = Math.round(r.d30/barTotal*100);
    const b60  = Math.round(r.d60/barTotal*100);
    const b90  = Math.round(r.d90/barTotal*100);
    const b90p = Math.max(0, 100-b30-b60-b90);

    // ✅ Bug fix: onclick과 style을 같은 div에 중복 선언하지 않음
    return `
    <div style="background:var(--card);border:1px solid var(--border);border-radius:12px;padding:13px;margin-bottom:8px;cursor:pointer"
      onclick="openMisuDetail('${escQ(r.거래처)}')">
      <div style="display:flex;justify-content:space-between;align-items:flex-start;margin-bottom:8px">
        <div>
          <div style="font-size:14px;font-weight:700">${r.거래처}</div>
          <div style="font-size:10px;color:var(--t3);margin-top:2px">최초 미수일: ${r.최초미수일||'-'}</div>
        </div>
        <div style="text-align:right">
          <div style="font-family:'JetBrains Mono',monospace;font-size:14px;font-weight:700;color:var(--r)">${r.총미수.toLocaleString()}원</div>
          <div style="font-size:10px;font-weight:600;color:${risk};margin-top:2px">${riskLabel}</div>
        </div>
      </div>
      <div style="height:6px;border-radius:3px;overflow:hidden;display:flex;gap:1px;margin-bottom:8px">
        ${b30>0  ?`<div style="width:${b30}%;background:var(--g);border-radius:3px"></div>`:''}
        ${b60>0  ?`<div style="width:${b60}%;background:#58a6ff;border-radius:3px"></div>`:''}
        ${b90>0  ?`<div style="width:${b90}%;background:var(--y);border-radius:3px"></div>`:''}
        ${b90p>0 ?`<div style="width:${b90p}%;background:var(--r);border-radius:3px"></div>`:''}
      </div>
      <div style="display:grid;grid-template-columns:1fr 1fr 1fr 1fr;gap:4px;font-size:10px;text-align:center">
        ${r.d30>0    ?`<div style="color:var(--g)">~30일<br><b>${r.d30.toLocaleString()}</b></div>`:'<div style="color:var(--t3)">~30일<br>-</div>'}
        ${r.d60>0    ?`<div style="color:#58a6ff">~60일<br><b>${r.d60.toLocaleString()}</b></div>`:'<div style="color:var(--t3)">~60일<br>-</div>'}
        ${r.d90>0    ?`<div style="color:var(--y)">~90일<br><b>${r.d90.toLocaleString()}</b></div>`:'<div style="color:var(--t3)">~90일<br>-</div>'}
        ${r.d90plus>0?`<div style="color:var(--r)">90일↑<br><b>${r.d90plus.toLocaleString()}</b></div>`:'<div style="color:var(--t3)">90일↑<br>-</div>'}
      </div>
    </div>`;
  }).join('');

  el.innerHTML = summaryHtml + rowsHtml;
}

// ══════════════ 거래처 비활성화/활성화 ══════════════

async function toggleStoreStatus(code, name, currentStatus){
  const isActive = currentStatus !== '비활성';
  const action = isActive ? '비활성화' : '활성화';
  const warn = isActive ? '\n\n⚠️ 비활성화하면 직원앱 루트에서 제외됩니다.\n납품/입금 내역은 유지됩니다.' : '';
  if(!confirm(`"${name}"을 ${action}할까요?${warn}`)) return;
  const type = isActive ? 'store_deactivate' : 'store_activate';
  try{
    const res = await fetch(API, {method:'POST', headers:{'Content-Type':'text/plain'},
      body: JSON.stringify({type, 코드: code})});
    const d = await res.json();
    if(d.ok === false){ showToast('⚠️ ' + d.error); return; }
    showToast(`✅ ${name} ${action} 완료`);
    await loadStores();
  }catch(e){ showToast('⚠️ 처리 실패'); }
}

// ══════════════ 미수 한도 설정 ══════════════

function openMisuLimitModal(code, name, currentLimit){
  document.getElementById('misu-limit-modal')?.remove();
  const modal = document.createElement('div');
  modal.id = 'misu-limit-modal';
  modal.style.cssText = 'position:fixed;inset:0;background:rgba(0,0,0,.85);z-index:500;display:flex;align-items:flex-end;justify-content:center';
  modal.innerHTML = `
    <div style="background:var(--card);border-radius:20px 20px 0 0;padding:22px 18px 44px;width:100%;max-width:440px">
      <div style="font-size:17px;font-weight:900;margin-bottom:6px">미수 한도 설정</div>
      <div style="font-size:12px;color:var(--t2);margin-bottom:16px">${name} · 0원 = 무제한</div>
      <div style="display:flex;flex-direction:column;gap:4px;margin-bottom:12px">
        <label style="font-size:11px;color:var(--t2)">한도 금액 (원) · 0 = 무제한</label>
        <input id="misu-limit-input" type="number" inputmode="numeric" value="${currentLimit||0}"
          style="background:var(--card2);border:1.5px solid var(--border);border-radius:10px;padding:12px 13px;color:var(--t);font-size:16px;font-family:'JetBrains Mono',monospace;outline:none;width:100%">
      </div>
      <div style="display:flex;gap:6px;flex-wrap:wrap;margin-bottom:16px">
        ${[0,500000,1000000,2000000,3000000,5000000].map(v=>
          `<button onclick="document.getElementById('misu-limit-input').value='${v}'"
            style="padding:7px 12px;background:var(--card2);border:1px solid var(--border);border-radius:8px;color:var(--t2);font-size:12px;cursor:pointer;font-family:'Noto Sans KR',sans-serif">
            ${v===0?'무제한':(v/10000)+'만'}
          </button>`).join('')}
      </div>
      <div style="display:flex;gap:8px">
        <button onclick="document.getElementById('misu-limit-modal').remove()"
          style="flex:1;padding:13px;background:var(--card2);border:1.5px solid var(--border);border-radius:11px;color:var(--t2);font-size:14px;font-weight:600;cursor:pointer;font-family:'Noto Sans KR',sans-serif">취소</button>
        <button onclick="saveMisuLimit('${escQ(code)}','${escQ(name)}')"
          style="flex:2;padding:13px;background:var(--y2);border:none;border-radius:11px;color:#000;font-size:14px;font-weight:700;cursor:pointer;font-family:'Noto Sans KR',sans-serif">저장</button>
      </div>
    </div>`;
  document.body.appendChild(modal);
  setTimeout(()=>document.getElementById('misu-limit-input')?.focus(),100);
}

async function saveMisuLimit(code, name){
  const limit = parseFloat(document.getElementById('misu-limit-input')?.value)||0;
  const s = allStores.find(x=>x.코드===code);
  if(!s){ showToast('거래처 없음'); return; }
  const updated = {...s, 미수한도: limit};
  try{
    const res = await fetch(API,{method:'POST',headers:{'Content-Type':'text/plain'},
      body:JSON.stringify({type:'store_update',store:updated})});
    const d = await res.json();
    if(d.ok===false){ showToast('⚠️ '+d.error); return; }
  }catch(e){ showToast('⚠️ 저장 실패'); return; }
  document.getElementById('misu-limit-modal')?.remove();
  showToast(`✅ ${name} 한도 ${limit===0?'무제한':limit.toLocaleString()+'원'} 설정`);
  await loadStores();
}

// ══════════════ renderStores 오버라이드 ══════════════

function renderStores(){
  const q=(document.getElementById('store-search')?.value||'').trim();
  let list=[...allStores];
  if(q) list=list.filter(s=>matchQ(s.이름,q)||matchQ(s.담당,q));

  if(storeFilter==='손호영')      list=list.filter(s=>s.담당==='손호영');
  else if(storeFilter==='박기빈') list=list.filter(s=>s.담당==='박기빈');
  else if(storeFilter==='공유')   list=list.filter(s=>s.담당==='공유');
  else if(storeFilter==='미배정') list=list.filter(s=>!s.담당||s.담당==='');
  else if(storeFilter==='미수')   list=list.filter(s=>(misuMap[s.이름]||0)>0);
  else if(storeFilter==='비활성') list=list.filter(s=>s.상태==='비활성');

  list.sort((a,b)=>{
    const am=misuMap[a.이름]||0,bm=misuMap[b.이름]||0;
    if(am>0&&bm===0)return -1;if(am===0&&bm>0)return 1;
    return (a.이름||'').localeCompare(b.이름||'','ko');
  });

  document.getElementById('store-count').textContent=`총 ${list.length}개 거래처`;
  const el=document.getElementById('store-list');
  if(!list.length){el.innerHTML='<div class="empty"><div class="empty-icon">🔍</div><div style="font-size:13px">거래처 없음</div></div>';return;}

  el.innerHTML=list.map(s=>{
    const misu=misuMap[s.이름]||0;
    const isInactive=s.상태==='비활성';
    const 한도=+s.미수한도||0;
    const 한도초과=한도>0&&misu>한도;
    const empCls=s.담당==='손호영'?'son':s.담당==='박기빈'?'bak':s.담당==='공유'?'share':'none';
    // ✅ Bug fix: escQ로 따옴표 이스케이프
    const safeName=escQ(s.이름||'');
    const safeCode=escQ(s.코드||'');
    const safeStatus=escQ(s.상태||'활성');

    return `<div class="store-card" style="${isInactive?'opacity:.55':''}">
      <div style="display:flex;justify-content:space-between;align-items:flex-start">
        <div style="flex:1">
          <div class="store-name">${s.이름||''}
            ${isInactive?'<span style="font-size:9px;background:rgba(248,81,73,.15);color:var(--r);padding:2px 6px;border-radius:4px;margin-left:6px">비활성</span>':''}
          </div>
          <div class="store-meta">${s.연락처||''} ${s.입금자?'· '+s.입금자:''}</div>
          <div class="store-badges">
            <span class="store-badge ${empCls}">${s.담당||'미배정'}</span>
            ${s.요일?`<span class="store-badge day">${s.요일}</span>`:''}
            ${s.유종?`<span class="store-badge" style="background:var(--card2);color:var(--t2)">${s.유종}</span>`:''}
            ${misu>0?`<span class="store-badge misu" style="${한도초과?'background:rgba(248,81,73,.2);color:var(--r);font-weight:700':''}">${한도초과?'⚠️ 한도초과 ':''}미수 ${misu.toLocaleString()}원</span>`:''}
            ${한도>0?`<span class="store-badge" style="background:rgba(240,165,0,.08);color:var(--y)">한도 ${(한도/10000).toFixed(0)}만</span>`:''}
          </div>
          ${s.비고?`<div style="font-size:11px;color:var(--t3);margin-top:5px">📌 ${s.비고}</div>`:''}
        </div>
        <div style="display:flex;flex-direction:column;gap:4px;margin-left:8px">
          <div style="display:flex;gap:4px">
            <button class="btn-edit" onclick="openStoreEdit('${safeCode}')">수정</button>
            <button onclick="openMisuLimitModal('${safeCode}','${safeName}',${한도})"
              style="padding:7px 10px;background:rgba(240,165,0,.1);border:none;border-radius:7px;color:var(--y);font-size:11px;font-weight:600;cursor:pointer;font-family:'Noto Sans KR',sans-serif">한도</button>
          </div>
          <button onclick="toggleStoreStatus('${safeCode}','${safeName}','${safeStatus}')"
            style="padding:5px 8px;background:${isInactive?'rgba(63,185,80,.1)':'rgba(248,81,73,.08)'};border:none;border-radius:7px;color:${isInactive?'var(--g)':'var(--r)'};font-size:10px;font-weight:600;cursor:pointer;font-family:'Noto Sans KR',sans-serif">
            ${isInactive?'활성화':'비활성화'}
          </button>
        </div>
      </div>
    </div>`;
  }).join('');
}

// ══════════════ goTab 오버라이드 ══════════════
// ✅ Bug fix: loadAccounts, loadClosingHistory 누락 추가

function goTab(t){
  const TAB_IDS=['dashboard','history','stores','prices'];
  document.querySelectorAll('.tab').forEach((el,i)=>el.classList.toggle('on',TAB_IDS[i]===t));
  document.querySelectorAll('.page').forEach((el,i)=>el.classList.toggle('on',`page-${TAB_IDS[i]}`===`page-${t}`));

  if(t==='dashboard'){
    silentRefresh();
    loadClosingHistory();
    loadAccounts();
  }
  if(t==='history'){
    const hm=document.getElementById('hist-month');
    const dm=document.getElementById('dash-month')?.value||'';
    if(hm&&!hm.value) hm.value=dm;
    loadHistoryAll();
  }
  if(t==='stores'){
    // 비활성 필터 버튼 추가 (없으면)
    const filterRow=document.querySelector('.filter-row');
    if(filterRow&&!document.querySelector('[data-filter="비활성"]')){
      const btn=document.createElement('button');
      btn.className='filter-btn';
      btn.setAttribute('data-filter','비활성');
      btn.textContent='비활성';
      btn.onclick=()=>setStoreFilter('비활성');
      filterRow.appendChild(btn);
    }
    loadStores();
  }
  if(t==='prices'){
    loadPrices().then(()=>renderPrices());
  }
  if(t==='history'){
    injectHistoryUI();
    const hm = document.getElementById('hist-month');
    const dm = document.getElementById('dash-month')?.value || '';
    if(hm && !hm.value) hm.value = dm;
    loadHistoryUnified(hm?.value || dm);
  }
}

// ══════════════ 통합 내역탭 ══════════════
let _histMonth='', _histEmp='', _histOpen=new Set(), _histData={tx:[],pay:[],waste:[]}, _availMonths=[];

function injectHistoryUI(){
  const page=document.getElementById('page-history');
  if(!page||page.dataset.injected) return;
  page.dataset.injected='1';
  page.innerHTML=`
    <div style="padding:12px 0 4px;font-size:18px;font-weight:900">📋 전체 내역</div>
    <div id="hist-month-slider" style="display:flex;align-items:center;gap:6px;margin-bottom:12px;overflow-x:auto;padding-bottom:4px;scrollbar-width:none"></div>
    <div style="display:flex;gap:6px;margin-bottom:12px">
      ${['전체','손호영','박기빈'].map(e=>`<button onclick="setHistEmp('${e}')" id="hist-emp-btn-${e}"
        style="padding:7px 14px;border-radius:20px;font-size:12px;font-weight:600;cursor:pointer;border:1.5px solid var(--border);background:var(--card);color:var(--t3);font-family:'Noto Sans KR',sans-serif">${e}</button>`).join('')}
      <div id="hist-loading" style="margin-left:auto;font-size:11px;color:var(--t3);align-self:center;display:none">⏳</div>
    </div>
    <div id="hist-month-summary" style="display:none;background:var(--card2);border-radius:12px;padding:12px 14px;margin-bottom:12px">
      <div style="display:grid;grid-template-columns:1fr 1fr 1fr;gap:8px;text-align:center">
        <div><div style="font-size:9px;color:var(--t3);margin-bottom:3px">납품 청구</div><div style="font-family:'JetBrains Mono',monospace;font-size:13px;font-weight:700;color:var(--y)" id="hist-sum-charge">-</div></div>
        <div><div style="font-size:9px;color:var(--t3);margin-bottom:3px">입금</div><div style="font-family:'JetBrains Mono',monospace;font-size:13px;font-weight:700;color:var(--g)" id="hist-sum-pay">-</div></div>
        <div><div style="font-size:9px;color:var(--t3);margin-bottom:3px">미수잔액</div><div style="font-family:'JetBrains Mono',monospace;font-size:13px;font-weight:700;color:var(--r)" id="hist-sum-misu">-</div></div>
      </div>
    </div>
    <div id="hist-day-list"></div>`;
  loadAvailMonths();
}

async function loadAvailMonths(){
  try{
    const res=await fetch(`${API}?type=months`);
    const d=await res.json();
    _availMonths=d.months||[];
  }catch(e){
    const now=new Date();
    _availMonths=[`${now.getFullYear()}-${String(now.getMonth()+1).padStart(2,'0')}`];
  }
  renderMonthSlider();
}

function renderMonthSlider(){
  const el=document.getElementById('hist-month-slider');
  if(!el) return;
  const months=_availMonths.length?_availMonths:[_histMonth].filter(Boolean);
  const current=_histMonth||months[0]||'';
  el.innerHTML=months.map(m=>{
    const isOn=m===current;
    const [y,mo]=m.split('-');
    return `<button onclick="setHistMonth('${m}')"
      style="padding:8px 14px;border-radius:20px;font-size:12px;font-weight:700;cursor:pointer;white-space:nowrap;font-family:'Noto Sans KR',sans-serif;border:1.5px solid ${isOn?'var(--y)':'var(--border)'};background:${isOn?'rgba(240,165,0,.12)':'var(--card)'};color:${isOn?'var(--y)':'var(--t3)'}">
      ${y.slice(2)}년 ${parseInt(mo)}월</button>`;
  }).join('');
  setTimeout(()=>{
    const btns=el.querySelectorAll('button');
    const idx=months.indexOf(current);
    if(btns[idx]) btns[idx].scrollIntoView({inline:'center',behavior:'smooth'});
  },100);
}

function setHistMonth(m){
  _histMonth=m; _histOpen.clear();
  renderMonthSlider(); loadHistoryUnified(m);
}

function setHistEmp(e){
  _histEmp=e==='전체'?'':e;
  ['전체','손호영','박기빈'].forEach(name=>{
    const btn=document.getElementById(`hist-emp-btn-${name}`); if(!btn) return;
    const isOn=(name==='전체'&&!_histEmp)||name===_histEmp;
    btn.style.borderColor=isOn?'var(--y)':'var(--border)';
    btn.style.background=isOn?'rgba(240,165,0,.12)':'var(--card)';
    btn.style.color=isOn?'var(--y)':'var(--t3)';
  });
  renderHistoryDays();
}

async function loadHistoryUnified(month){
  if(!month) return;
  _histMonth=month;
  setHistEmp(_histEmp||'');
  const loadingEl=document.getElementById('hist-loading');
  if(loadingEl) loadingEl.style.display='inline';
  const [y,m]=month.split('-');
  try{
    const [tr,pr,wr]=await Promise.all([
      fetch(`${API}?type=tx&year=${y}&month=${m}&limit=500`).then(r=>r.json()),
      fetch(`${API}?type=payments&year=${y}&month=${m}`).then(r=>r.json()),
      fetch(`${API}?type=waste_deliveries&year=${y}&month=${m}`).then(r=>r.json()),
    ]);
    _histData.tx=(tr.rows||[]).map(r=>({...r,_type:'tx'}));
    _histData.pay=(pr.rows||[]).map(r=>({...r,_type:'pay'}));
    _histData.waste=(wr.rows||[]).map(r=>({...r,_type:'waste'}));
  }catch(e){ _histData={tx:[],pay:[],waste:[]}; }
  if(loadingEl) loadingEl.style.display='none';
  renderHistoryDays();
}

function renderHistoryDays(){
  const el=document.getElementById('hist-day-list');
  const sumEl=document.getElementById('hist-month-summary');
  if(!el) return;
  const tx=_histEmp?_histData.tx.filter(r=>r.직원===_histEmp):_histData.tx;
  const pay=_histEmp?_histData.pay.filter(r=>r.직원===_histEmp):_histData.pay;
  const waste=_histEmp?_histData.waste.filter(r=>r.직원===_histEmp):_histData.waste;
  const totalCharge=tx.reduce((s,r)=>s+(+r.차감청구||0),0);
  const totalPay=pay.reduce((s,r)=>s+(+r.금액||0),0);
  const totalMisu=Math.max(0,totalCharge-totalPay);
  if(sumEl){
    sumEl.style.display='block';
    const sc=document.getElementById('hist-sum-charge'); if(sc) sc.textContent=totalCharge.toLocaleString()+'원';
    const sp=document.getElementById('hist-sum-pay');    if(sp) sp.textContent=totalPay.toLocaleString()+'원';
    const sm=document.getElementById('hist-sum-misu');   if(sm) sm.textContent=totalMisu.toLocaleString()+'원';
  }
  const byDate={};
  const add=(date,item)=>{ if(!byDate[date])byDate[date]=[]; byDate[date].push(item); };
  tx.forEach(r=>add(String(r.날짜||'').slice(0,10),r));
  pay.forEach(r=>add(String(r.날짜||'').slice(0,10),r));
  waste.forEach(r=>add(String(r.날짜||'').slice(0,10),r));
  const DAYS=['일','월','화','수','목','금','토'];
  const dates=Object.keys(byDate).filter(Boolean).sort().reverse();
  if(!dates.length){ el.innerHTML='<div class="empty"><div class="empty-icon">📝</div><div style="font-size:13px">내역 없음</div></div>'; return; }
  el.innerHTML=dates.map(date=>{
    const items=byDate[date];
    const txI=items.filter(r=>r._type==='tx');
    const payI=items.filter(r=>r._type==='pay');
    const wasteI=items.filter(r=>r._type==='waste');
    const dayCharge=txI.reduce((s,r)=>s+(+r.차감청구||0),0);
    const dayPay=payI.reduce((s,r)=>s+(+r.금액||0),0);
    const dt=new Date(date); const dayName=DAYS[dt.getDay()];
    const isOpen=_histOpen.has(date);
    const badges=[
      txI.length?`<span style="font-size:10px;color:var(--y)">📦 ${txI.length}건</span>`:'',
      payI.length?`<span style="font-size:10px;color:var(--g)">💳 ${payI.length}건</span>`:'',
      wasteI.length?`<span style="font-size:10px;color:var(--o)">♻️ ${wasteI.length}건</span>`:'',
    ].filter(Boolean).join(' ');
    const detailHtml=isOpen?`
      <div style="border-top:1px solid var(--border);margin-top:10px;padding-top:10px">
        ${txI.map(r=>{
          const isMisu=r.미수==='TRUE'||r.미수===true;
          const mc=isMisu?'var(--r)':r.수금방법==='현금'?'var(--g)':'var(--t2)';
          return `<div style="display:flex;justify-content:space-between;padding:7px 0;border-bottom:1px solid var(--border)">
            <div><div style="font-size:12px;font-weight:700">📦 ${r.거래처||''}</div>
            <div style="font-size:10px;color:var(--t2);margin-top:2px">${r.직원||''} · ${r.유종||''} ${r.통수||0}통 · <span style="color:${mc}">${r.수금방법||''}</span></div></div>
            <div style="text-align:right">
              <div style="font-family:'JetBrains Mono',monospace;font-size:12px;font-weight:700;color:var(--y)">${(+r.차감청구||0).toLocaleString()}원</div>
              ${+r.폐유kg>0?`<div style="font-size:10px;color:var(--o)">♻️ ${r.폐유kg}kg</div>`:''}
            </div></div>`;
        }).join('')}
        ${wasteI.map(r=>`
          <div style="display:flex;justify-content:space-between;padding:7px 0;border-bottom:1px solid var(--border)">
            <div><div style="font-size:12px;font-weight:700">♻️ 폐유납품</div>
            <div style="font-size:10px;color:var(--t2);margin-top:2px">${r.직원||''} · ${+r.총실중량||0}kg · ${r.파레트수||0}파레트</div></div>
            <div style="font-family:'JetBrains Mono',monospace;font-size:12px;font-weight:700;color:var(--g)">${(+r.폐유수입||0).toLocaleString()}원</div>
          </div>`).join('')}
        ${payI.map(r=>`
          <div style="display:flex;justify-content:space-between;padding:7px 0;border-bottom:1px solid var(--border)">
            <div><div style="font-size:12px;font-weight:700">💳 ${r.거래처||''}</div>
            <div style="font-size:10px;color:var(--t2);margin-top:2px">${r.직원||''} · ${r.입금자명||''} · ${r.방법||''}</div></div>
            <div style="font-family:'JetBrains Mono',monospace;font-size:12px;font-weight:700;color:var(--g)">${(+r.금액||0).toLocaleString()}원</div>
          </div>`).join('')}
      </div>`:'';
    return `<div style="background:var(--card);border:1px solid var(--border);border-radius:12px;padding:13px;margin-bottom:8px">
      <div style="display:flex;justify-content:space-between;align-items:center;cursor:pointer" onclick="toggleHistDay('${date}')">
        <div style="display:flex;align-items:center;gap:8px">
          <div style="font-family:'JetBrains Mono',monospace;font-size:14px;font-weight:700">${date.slice(5)}</div>
          <div style="font-size:11px;color:var(--t3)">(${dayName})</div>
          <div style="display:flex;gap:6px">${badges}</div>
        </div>
        <div style="display:flex;align-items:center;gap:8px">
          ${dayCharge>0?`<div style="font-family:'JetBrains Mono',monospace;font-size:13px;font-weight:700;color:var(--y)">${dayCharge.toLocaleString()}원</div>`:''}
          ${dayPay>0&&!dayCharge?`<div style="font-family:'JetBrains Mono',monospace;font-size:13px;font-weight:700;color:var(--g)">${dayPay.toLocaleString()}원</div>`:''}
          <div style="color:var(--t3);font-size:12px">${isOpen?'▲':'▼'}</div>
        </div>
      </div>
      ${detailHtml}
    </div>`;
  }).join('');
}

function toggleHistDay(date){
  if(_histOpen.has(date)) _histOpen.delete(date); else _histOpen.add(date);
  renderHistoryDays();
}

// ══════════════ aging 섹션 동적 삽입 ══════════════

function insertAgingSection(){
  if(document.getElementById('misu-aging-section')) return;
  const misuList=document.getElementById('misu-list');
  if(!misuList) return;

  const wrapper=document.createElement('div');
  wrapper.innerHTML=`
    <div class="divider"></div>
    <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:10px">
      <div class="sec-label" style="margin:0">📅 미수 연령 분석 <span style="color:var(--t3);font-weight:400">30/60/90일</span></div>
      <button onclick="loadMisuAging()"
        style="padding:6px 12px;background:var(--card);border:1px solid var(--border);border-radius:8px;color:var(--t2);font-size:11px;cursor:pointer;font-family:'Noto Sans KR',sans-serif">
        🔄 새로고침
      </button>
    </div>
    <div id="misu-aging-section">
      <div style="text-align:center;padding:20px;color:var(--t3);font-size:12px">위 버튼을 눌러 분석하세요</div>
    </div>`;
  misuList.parentNode.insertBefore(wrapper, misuList.nextSibling);
}

// ══════════════ init 오버라이드 ══════════════
// ✅ Bug fix: loadClosingHistory, loadAccounts, setInterval 복원

async function init(){
  const now=new Date();
  const ym=`${now.getFullYear()}-${String(now.getMonth()+1).padStart(2,'0')}`;
  const todayStr=now.toISOString().slice(0,10);

  // 날짜 초기화
  const closeMonthEl=document.getElementById('close-month');
  if(closeMonthEl) closeMonthEl.value=ym;
  const dashMonth=document.getElementById('dash-month');
  if(dashMonth) dashMonth.value=ym;
  const histMonth=document.getElementById('hist-month');
  if(histMonth) histMonth.value=ym;
  ['nw-date','np-date'].forEach(id=>{
    const el=document.getElementById(id);
    if(el){el.value=todayStr;el.min=todayStr;}
  });

  // 데이터 로드
  await loadAll();
  loadClosingHistory();
  loadAccounts();

  // aging 섹션 삽입
  setTimeout(insertAgingSection, 600);

  // 30초 자동 갱신 (현황 탭 열려있을 때만)
  setInterval(()=>{
    if(document.getElementById('page-dashboard')?.classList.contains('on')){
      silentRefresh();
      loadClosingHistory();
      loadAccounts();
    }
  }, 30000);
}

// ══════════════ 단가 날짜 정규화 (ISO 형식 → YYYY-MM-DD) ══════════════

function normalizeDate(d){
  const s = String(d||'').trim();
  if(!s) return '-';
  // ISO 형식: 2026-03-25T15:00:00.000Z → 2026-03-25
  if(s.includes('T')) return s.slice(0,10);
  // 이미 YYYY-MM-DD 형식
  if(/^\d{4}-\d{2}-\d{2}$/.test(s)) return s;
  // Date 객체로 파싱 시도
  const dt = new Date(s);
  if(!isNaN(dt.getTime())) return dt.toISOString().slice(0,10);
  return s.slice(0,10);
}

// renderPrices 오버라이드 - 날짜 NaN 수정
function renderPrices(){
  // 날짜 정규화 적용한 allPrices 복사
  const prices = (typeof allPrices !== 'undefined' ? allPrices : []).map(p => ({
    ...p,
    적용일자: normalizeDate(p.적용일자)
  }));

  // 폐유 단가
  const wastePrices = prices
    .filter(p => p.품명 === '폐유매입단가')
    .sort((a,b) => b.적용일자.localeCompare(a.적용일자));

  const curEl    = document.getElementById('waste-cur');
  const curDate  = document.getElementById('waste-cur-date');
  const prevEl   = document.getElementById('waste-prev');
  const prevDate = document.getElementById('waste-prev-date');
  const prevRow  = document.getElementById('waste-prev-row');

  if(wastePrices.length > 0){
    const cur = wastePrices[0];
    const val = parseFloat(cur.출고가);
    if(curEl)   curEl.textContent   = isNaN(val) ? '-' : val.toLocaleString() + '원/kg';
    if(curDate) curDate.textContent = cur.적용일자 + ' 부터';

    if(wastePrices.length > 1){
      const prev = wastePrices[1];
      const prevVal = parseFloat(prev.출고가);
      if(prevRow)  prevRow.style.display = 'flex';
      if(prevEl)   prevEl.textContent   = isNaN(prevVal) ? '-' : prevVal.toLocaleString() + '원/kg';
      if(prevDate) prevDate.textContent = prev.적용일자 + ' 부터';
    } else {
      if(prevRow) prevRow.style.display = 'none';
    }
  } else {
    if(curEl)   curEl.textContent   = '-';
    if(curDate) curDate.textContent = '-';
    if(prevRow) prevRow.style.display = 'none';
  }

  // 식용유 단가 목록
  const el = document.getElementById('price-list');
  if(!el) return;

  // 품목별 최신 단가 (폐유 제외)
  const latest = {};
  prices.filter(p => p.품명 && p.품명 !== '폐유매입단가').forEach(p => {
    if(!latest[p.품명] || p.적용일자 > latest[p.품명].적용일자){
      latest[p.품명] = p;
    }
  });

  const items = Object.values(latest).sort((a,b) => a.품명.localeCompare(b.품명,'ko'));

  if(!items.length){
    el.innerHTML = '<div class="empty"><div class="empty-icon">💰</div><div style="font-size:13px">단가 없음</div></div>';
    return;
  }

  el.innerHTML = items.map(p => {
    const val = parseFloat(p.출고가);
    const displayVal = isNaN(val) ? '-' : val.toLocaleString() + '원';
    const cat = p.구분 || '';
    const tagMap = { '수수료':'price-tag 수수료', '범용':'price-tag 범용', '전용':'price-tag 전용', '식자재':'price-tag 식자재' };
    const tagCls = tagMap[cat] || 'price-tag 범용';
    return `
    <div class="price-item">
      <div>
        <div class="price-name">${p.품명}
          ${cat ? `<span class="${tagCls}">${cat}</span>` : ''}
        </div>
        <div class="price-meta">${p.적용일자} 기준</div>
      </div>
      <div class="price-val">${displayVal}</div>
    </div>`;
  }).join('');
}

// ══════════════ 타이밍 문제 해결: 로드 직후 강제 재실행 ══════════════
// boss.html의 init()이 boss_patch.js보다 먼저 실행되므로
// 패치 로드 완료 후 거래처 목록 & aging 섹션을 강제로 다시 그림
(function applyPatchAfterLoad(){
  // DOM 완전 로드 후 실행
  const apply = () => {
    // 1. 거래처 탭이 열려있으면 renderStores 재실행
    if(typeof renderStores === 'function' && typeof allStores !== 'undefined'){
      renderStores();
    }

    // 2. 비활성 필터 버튼 추가
    const filterRow = document.querySelector('.filter-row');
    if(filterRow && !document.querySelector('[data-filter="비활성"]')){
      const btn = document.createElement('button');
      btn.className = 'filter-btn';
      btn.setAttribute('data-filter', '비활성');
      btn.textContent = '비활성';
      btn.onclick = () => setStoreFilter('비활성');
      filterRow.appendChild(btn);
    }

    // 3. aging 섹션 삽입 (현황 탭)
    insertAgingSection();

    // 4. 단가탭 현재 열려있으면 재렌더
    if(document.getElementById('page-prices')?.classList.contains('on')){
      renderPrices();
    }
  };

  // DOMContentLoaded 이미 지났을 수 있으므로 즉시 + setTimeout 둘 다
  if(document.readyState === 'complete' || document.readyState === 'interactive'){
    setTimeout(apply, 100);
  } else {
    document.addEventListener('DOMContentLoaded', () => setTimeout(apply, 100));
  }
})();

// ══════════════ 단가 저장 후 renderPrices 연동 ══════════════

async function addWastePrice(){
  const 단가val = document.getElementById('nw-price')?.value;
  const 날짜 = document.getElementById('nw-date')?.value;
  if(!단가val || !날짜){ showToast('단가와 날짜를 입력해주세요'); return; }
  const today = new Date().toISOString().slice(0,10);
  if(날짜 < today){ showToast('⚠️ 오늘 이전 날짜는 불가 (오늘부터 등록 가능)'); return; }

  const wastePrices = (allPrices||[])
    .filter(p=>p.품명==='폐유매입단가')
    .sort((a,b)=>String(b.적용일자).localeCompare(String(a.적용일자)));
  const curPrice = wastePrices.length > 0
    ? (+wastePrices[0].출고가).toLocaleString()+'원/kg' : '없음';

  if(!confirm(`폐유 단가 변경\n\n현재: ${curPrice}\n변경: ${(+단가val).toLocaleString()}원/kg\n적용일: ${날짜}부터\n\n정말 저장할까요?`)) return;

  try{
    const res = await fetch(API, {
      method:'POST', headers:{'Content-Type':'text/plain'},
      body: JSON.stringify({type:'waste_price', 단가:+단가val, 날짜})
    });
    const d = await res.json();
    if(d.ok === false){ showToast('⚠️ '+d.error); return; }
  }catch(e){ showToast('⚠️ 저장 실패: '+e.message); return; }

  showToast('✅ 폐유 단가 변경!');
  document.getElementById('nw-price').value = '';
  await loadPrices();
  renderPrices(); // ← patch 버전 renderPrices 명시 호출
}

async function addPrice(){
  let 품명 = document.getElementById('np-name')?.value;
  if(품명 === '_custom') 품명 = document.getElementById('np-custom')?.value.trim();
  const 구분 = document.getElementById('np-cat')?.value;
  const 출고가val = document.getElementById('np-val')?.value;
  const 날짜 = document.getElementById('np-date')?.value;
  if(!품명 || !출고가val || !날짜){ showToast('필수 항목을 입력해주세요'); return; }
  const today = new Date().toISOString().slice(0,10);
  if(날짜 < today){ showToast('⚠️ 과거 날짜는 등록 불가'); return; }

  const latest = (allPrices||[])
    .filter(p=>p.품명===품명&&p.품명!=='폐유매입단가')
    .sort((a,b)=>String(b.적용일자).localeCompare(String(a.적용일자)));
  const curPrice = latest.length > 0 ? (+latest[0].출고가).toLocaleString()+'원' : '없음';

  if(!confirm(`단가 변경\n\n품목: ${품명}\n현재: ${curPrice}\n변경: ${(+출고가val).toLocaleString()}원\n적용일: ${날짜}부터\n\n정말 저장할까요?`)) return;

  try{
    const res = await fetch(API, {
      method:'POST', headers:{'Content-Type':'text/plain'},
      body: JSON.stringify({type:'price', price:{품명, 구분, 출고가:+출고가val, 날짜, 비고:''}})
    });
    const d = await res.json();
    if(d.ok === false){ showToast('⚠️ '+d.error); return; }
  }catch(e){}

  showToast(`✅ ${품명} 단가 추가!`);
  document.getElementById('np-val').value = '';
  await loadPrices();
  renderPrices(); // ← patch 버전 renderPrices 명시 호출
}

// ══════════════ loadPrices 오버라이드 - 항상 renderPrices 까지 실행 ══════════════
// boss.html 원본 loadPrices()가 Promise 반환 안 할 수 있어서 직접 오버라이드

async function loadPrices(){
  try{
    const res = await fetch(API+'?type=prices');
    const d = await res.json();
    if(typeof allPrices !== 'undefined'){
      allPrices = d.prices || [];
    }
  }catch(e){
    console.error('loadPrices 실패:', e);
  }
  // 항상 renderPrices 실행 (데이터 없어도 빈 화면 보여줌)
  renderPrices();
}
