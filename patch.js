// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
// © 2025 제이제이컴퍼니 (JJ Company)
// Oil Distribution Management System v3.0
// All rights reserved. Unauthorized use prohibited.
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

// patch.js v2 - son.html / bak.html 패치
// son.html / bak.html 의 </body> 바로 앞에
// <script src="patch.js"></script> 한 줄만 있으면 됩니다.

// ══════════════ 1. 납품 완료 애니메이션 ══════════════

function showDeliverySuccess(storeName){
  document.getElementById('delivery-success-overlay')?.remove();
  const overlay = document.createElement('div');
  overlay.id = 'delivery-success-overlay';
  overlay.style.cssText = 'position:fixed;inset:0;z-index:9999;display:flex;flex-direction:column;align-items:center;justify-content:center;background:rgba(15,17,23,0.92);pointer-events:none;';
  overlay.innerHTML = `
    <style>
      @keyframes popCheck{0%{transform:scale(0) rotate(-15deg);opacity:0}60%{transform:scale(1.15) rotate(3deg);opacity:1}100%{transform:scale(1) rotate(0deg);opacity:1}}
      @keyframes slideUp{from{transform:translateY(16px);opacity:0}to{transform:translateY(0);opacity:1}}
      @keyframes fadeOutOverlay{from{opacity:1}to{opacity:0}}
    </style>
    <div style="animation:popCheck .35s cubic-bezier(.34,1.56,.64,1) both">
      <div style="width:88px;height:88px;border-radius:50%;background:var(--g);display:flex;align-items:center;justify-content:center;box-shadow:0 0 40px rgba(61,220,132,.45)">
        <svg width="44" height="44" viewBox="0 0 44 44" fill="none">
          <path d="M9 22L18 31L35 13" stroke="#0f1117" stroke-width="4.5" stroke-linecap="round" stroke-linejoin="round"/>
        </svg>
      </div>
    </div>
    <div style="margin-top:18px;font-size:20px;font-weight:900;color:var(--t);animation:slideUp .3s .2s both">${storeName}</div>
    <div style="margin-top:6px;font-size:13px;color:var(--g);font-weight:700;letter-spacing:.04em;animation:slideUp .3s .28s both">납품 완료 ✓</div>`;
  document.body.appendChild(overlay);
  if(navigator.vibrate) navigator.vibrate([60, 30, 60]);
  setTimeout(() => {
    overlay.style.animation = 'fadeOutOverlay .3s ease forwards';
    setTimeout(() => overlay.remove(), 300);
  }, 1400);
}

// ══════════════ 2. 루트 프로그레스바 ══════════════

function renderRouteProgress(done, total){
  const prog = document.getElementById('route-progress');
  if(!prog) return;
  const pct = total > 0 ? Math.round((done / total) * 100) : 0;
  const allDone = done === total && total > 0;
  prog.innerHTML = `
    <div style="display:flex;align-items:center;gap:8px">
      <div style="font-size:12px;font-weight:700;color:${allDone?'var(--g)':'var(--t2)'};white-space:nowrap">${allDone?'✅ 완료':`${done}/${total}`}</div>
      <div style="width:72px;height:6px;background:var(--border);border-radius:3px;overflow:hidden">
        <div style="height:100%;width:${pct}%;background:${allDone?'var(--g)':'var(--p)'};border-radius:3px;transition:width .4s ease"></div>
      </div>
      <div style="font-size:10px;color:var(--t3)">${pct}%</div>
    </div>`;
}

// ══════════════ 3. 마지막 방문일 헬퍼 ══════════════

function getLastVisit(storeName){
  const list = (typeof txList !== 'undefined' ? txList : [])
    .filter(x => x.거래처 === storeName && x.날짜)
    .sort((a, b) => b.날짜.localeCompare(a.날짜));
  if(!list.length) return null;
  const diff = Math.floor((new Date(today()) - new Date(list[0].날짜)) / 86400000);
  if(diff === 0) return {label:'오늘', color:'var(--g)'};
  if(diff === 1) return {label:'어제', color:'var(--p)'};
  if(diff <= 7)  return {label:`${diff}일 전`, color:'var(--t2)'};
  if(diff <= 30) return {label:`${diff}일 전`, color:'var(--y)'};
  return {label:`${diff}일 전`, color:'var(--r)'};
}

// ══════════════ renderRoute 오버라이드 (프로그레스바 + 방문일) ══════════════

function renderRoute(){
  const list = getRouteList();
  const el = document.getElementById('route-list');

  if(!list.length){
    el.innerHTML = '<div class="empty"><div class="empty-icon">📍</div><div>루트 없음<br><span style="font-size:10px">출근탭에서 상차를 입력하거나<br>거래처 요일을 등록해주세요</span></div></div>';
    renderRouteProgress(0, 0);
    return;
  }

  updateDailyBar();
  const savedCargos = JSON.parse(localStorage.getItem(`cargo_today_${EMP}`) || '[]');
  const doneCount = completedRoutes.filter(n => list.includes(n)).length;
  renderRouteProgress(doneCount, list.length);

  el.innerHTML = list.map((name, i) => {
    const done = completedRoutes.includes(name);
    const s = stores.find(x => x.이름 === name);
    const cargo = savedCargos.find(c => c.거래처 === name);
    const isMine = !s?.담당 || s?.담당 === EMP;
    const meta = cargo ? `📦 ${cargo.유종} ${cargo.통수}통 상차` : (s?.유종 || '유종미등록');
    const crossLabel = !isMine && s?.담당 ? `<span style="font-size:9px;color:var(--o);margin-left:4px">↔ ${s.담당}</span>` : '';
    const visit = getLastVisit(name);
    const visitBadge = visit ? `<span style="font-size:9px;font-weight:600;color:${visit.color};background:rgba(0,0,0,.25);padding:2px 6px;border-radius:10px;margin-left:5px">${visit.label}</span>` : '';

    return `<div class="route-item ${done?'done':''}" id="ri-${i}" data-name="${name}">
      <div class="route-order" style="background:${done?'var(--g)':'var(--p2)'};flex-shrink:0">${done?'✓':i+1}</div>
      <div class="route-info" onclick="openDelivery('${name}')">
        <div class="route-name">${name}${crossLabel}${visitBadge}</div>
        <div class="route-meta" style="color:${cargo?'var(--o)':'var(--t2)'}">${meta}</div>
      </div>
      ${done
        ?`<button onclick="deleteTxByStore('${name}')" style="padding:6px 10px;background:rgba(255,107,107,.12);border:none;border-radius:8px;color:var(--r);font-size:11px;font-weight:600;cursor:pointer;flex-shrink:0">납품삭제</button>`
        :`<button onclick="removeFromRoute('${name}')" style="padding:6px 10px;background:rgba(122,127,148,.12);border:none;border-radius:8px;color:var(--t2);font-size:11px;font-weight:600;cursor:pointer;flex-shrink:0">✕</button>`
      }
      <div class="drag-handle" draggable="true" ondragstart="dragStart(event,'${name}')" ondragover="dragOver(event)" ondrop="dragDrop(event,'${name}')" ondragend="dragEnd(event)">⠿</div>
    </div>`;
  }).join('');
}

// ══════════════ saveDelivery 오버라이드 (완료 애니메이션 추가) ══════════════

async function saveDelivery(){
  if(!curStore && !document.getElementById('chip-name').textContent){ showToast('거래처를 선택해주세요'); return; }
  if(items.length === 0 && !wasteOn){ showToast('품목 또는 폐유를 입력해주세요'); return; }
  if(!curPay){ showToast('수금방법을 선택해주세요'); return; }

  const t = today();
  const storeName = curStore?.이름 || document.getElementById('chip-name').textContent || '임시거래처';
  const oilTotal = items.reduce((s,i) => isFeeItem(i.type,t)?s:s+i.qty*i.price, 0);
  const oilMargin = items.reduce((s,i) => {
    if(isFeeItem(i.type,t)) return s+i.qty*(getPriceAt(i.type,t)||0);
    return s+i.qty*(i.price-(getPriceAt(i.type,t)||0));
  }, 0);

  let wasteKg=0, wastePriceVal=0, wastePay=0, wasteRev=0;
  if(wasteOn){
    if(wasteModeCalc){
      wasteKg = parseFloat(document.getElementById('w-kg')?.value)||0;
      wastePriceVal = parseFloat(document.getElementById('w-price')?.value)||0;
      wastePay = Math.round(wasteKg*wastePriceVal);
    } else {
      wastePay = parseFloat(document.getElementById('w-direct')?.value)||0;
    }
    const wcp2 = getWastePriceAt(t);
    wasteRev = wasteModeCalc ? Math.round(wasteKg*(wcp2-wastePriceVal)) : 0;
  }

  const charge = oilTotal - wastePay;
  const payAmt = parseFloat(document.getElementById('pay-amount')?.value)||0;

  const tx = {
    id:`${t}_${EMP}_${storeName}_${Date.now()}`, 날짜:t,
    시간:new Date().toLocaleTimeString('ko-KR',{hour:'2-digit',minute:'2-digit'}),
    직원:EMP, 거래처:storeName,
    유종:items.map(i=>i.type).filter(Boolean).join('/'),
    품목상세:JSON.stringify(items.map(i=>({type:i.type,qty:i.qty,price:i.price}))),
    통수:items.reduce((s,i)=>s+i.qty,0),
    판매단가:items.length===1?items[0].price:0,
    출고가:items.length===1?(getPriceAt(items[0].type,t)||0):0,
    폐유kg:wasteKg, 폐유매입단가:wastePriceVal,
    식유금액:oilTotal, 폐유매입금:wastePay, 차감청구:charge,
    식유마진:oilMargin, 폐유수익:wasteRev, 총수익:oilMargin+wasteRev,
    수금방법:curPay, 수금액:payAmt,
    미수:curPay==='미수'||curPay==='반품',
    비고:document.getElementById('d-note')?.value||''
  };

  txList.unshift(tx);
  const cutoff=new Date(); cutoff.setDate(cutoff.getDate()-7);
  localStorage.setItem(`tx_${EMP}_v3`, JSON.stringify(txList.filter(x=>x.날짜>=cutoff.toISOString().slice(0,10)).slice(0,500)));

  const returnItems = items.filter(i=>i.qty<0);
  if(returnItems.length>0){
    const todayCargos=JSON.parse(localStorage.getItem(`cargo_today_${EMP}`)||'[]');
    returnItems.forEach(ri=>{
      const ex=todayCargos.find(c=>c.유종===ri.type&&c.거래처===storeName);
      if(ex) ex.통수=Math.max(0,ex.통수+Math.abs(ri.qty));
      else todayCargos.push({거래처:'',유종:ri.type,통수:Math.abs(ri.qty),반품이월:true});
    });
    localStorage.setItem(`cargo_today_${EMP}`,JSON.stringify(todayCargos));
  }

  if(!completedRoutes.includes(storeName)) completedRoutes.push(storeName);
  localStorage.setItem(`done_${EMP}_${t}`, JSON.stringify(completedRoutes));

  if(curPay==='현금지급'||curPay==='이체지급'||curPay==='미수차감폐유'){
    const payAmt2=wastePay||Math.abs(charge);
    if(payAmt2>0) await savePayment({거래처:storeName,금액:-payAmt2,날짜:t,입금자명:'폐유대금',방법:curPay==='이체지급'?'계좌이체':'현금지급',비고:'폐유수거 대금 지급'});
  }
  if(curPay==='현금'&&payAmt>0) await savePayment({거래처:storeName,금액:payAmt,날짜:t,입금자명:curStore?.입금자||storeName,방법:'현금',비고:'현장 현금수령'});

  await safeFetch({type:'tx',tx}, ()=>{
    if(returnItems.length>0) showToast('↩️ 반품 저장 (차량재고 복귀)');
    else showDeliverySuccess(storeName); // 🎉 완료 애니메이션
    hideDeliveryForm();
    renderRoute();
    renderHistory();
    updateDailyBar();
    showReceiptButton(tx);
  });
}

// ══════════════ 기존 누락 함수들 ══════════════

function renderCarryOver(){
  const cargos=JSON.parse(localStorage.getItem(`cargo_today_${EMP}`)||'[]');
  const sec=document.getElementById('carry-over-section'),el=document.getElementById('carry-over-list');
  if(!sec||!el) return;
  const isCarryOver=localStorage.getItem(`last_date_${EMP}`)!==today();
  if(!isCarryOver||!cargos.length){sec.style.display='none';return;}
  sec.style.display='block';
  const stockMap={};
  cargos.forEach(c=>{if(!c.유종||!c.통수)return;stockMap[c.유종]=(stockMap[c.유종]||0)+c.통수;});
  el.innerHTML=Object.entries(stockMap).map(([type,qty])=>`
    <div style="background:rgba(108,143,255,.06);border:1px solid rgba(108,143,255,.15);border-radius:10px;padding:10px 12px;margin-bottom:6px;display:flex;justify-content:space-between;align-items:center">
      <span style="font-size:13px;font-weight:600;color:var(--t2)">${type}</span>
      <span style="font-family:'JetBrains Mono',monospace;font-size:16px;font-weight:700;color:var(--p)">${qty}통</span>
    </div>`).join('');
}

function updateDailyBar(){
  const savedCargos=JSON.parse(localStorage.getItem(`cargo_today_${EMP}`)||'[]'),t=today();
  const loaded=savedCargos.reduce((s,c)=>s+(c.통수||0),0);
  const doneTx=txList.filter(x=>x.날짜===t&&x.직원===EMP);
  const doneQty=doneTx.reduce((s,x)=>s+Math.max(0,x.통수||0),0);
  const remainQty=Math.max(0,loaded-doneQty);
  const wasteKg=doneTx.reduce((s,x)=>s+(x.폐유kg||0),0);
  const loadedEl=document.getElementById('bar-loaded'),doneRemEl=document.getElementById('bar-done-remain'),wasteEl=document.getElementById('bar-waste-kg');
  if(loadedEl) loadedEl.textContent=loaded||'-';
  if(doneRemEl) doneRemEl.innerHTML=`<span style="color:var(--g)">${doneQty}</span> / <span style="color:var(--t2)">${remainQty}</span>`;
  if(wasteEl) wasteEl.textContent=wasteKg>0?wasteKg.toFixed(1):'-';
}

async function loadStoreInfo(storeName){
  const infoBox=document.getElementById('store-info-box'),loadingEl=document.getElementById('store-misu-loading');
  const misuEl=document.getElementById('store-misu-amt'),recentEl=document.getElementById('store-recent-tx'),accountBox=document.getElementById('store-account-box');
  if(!infoBox) return;
  infoBox.style.display='block';
  if(loadingEl) loadingEl.textContent='조회중...';
  if(misuEl) misuEl.textContent='-';
  const s=stores.find(x=>x.이름===storeName);
  if(s?.계좌&&accountBox){accountBox.style.display='block';const at=document.getElementById('store-account-txt'),pt=document.getElementById('store-payer-txt');if(at)at.textContent=s.계좌;if(pt)pt.textContent=s.입금자||'-';}
  else if(accountBox) accountBox.style.display='none';
  try{
    const now=new Date(),res=await fetch(`${API}?type=misu&store=${encodeURIComponent(storeName)}&year=${now.getFullYear()}&month=${now.getMonth()+1}`);
    const d=await res.json(),misu=d.미수잔액||0;
    window.curStoreMisu=misu;
    if(misuEl){misuEl.textContent=misu>0?misu.toLocaleString()+'원':'없음';misuEl.style.color=misu>0?'var(--r)':'var(--g)';}
    if(loadingEl) loadingEl.textContent='';
  }catch(e){window.curStoreMisu=0;if(loadingEl)loadingEl.textContent='조회실패';}
  if(recentEl){const recent=txList.filter(x=>x.거래처===storeName).slice(0,1)[0];recentEl.textContent=recent?`${recent.날짜} · ${recent.유종||''} ${recent.통수}통 · ${(+recent.차감청구||0).toLocaleString()}원`:'납품 내역 없음';}
  updatePayButtons();
}

function openNewStore(prefill){
  const modal=document.getElementById('new-store-modal'),sub=document.getElementById('ns-sub'),nameEl=document.getElementById('ns-name');
  if(!modal) return;
  if(nameEl) nameEl.value=prefill||'';
  if(sub) sub.textContent=prefill?`"${prefill}" 으로 신규 거래처를 추가합니다`:'새 거래처를 추가하세요';
  buildNsTypeOptions();modal.classList.add('show');setTimeout(()=>nameEl?.focus(),100);
}

function closeModal(id){const el=document.getElementById(id);if(el)el.classList.remove('show');}

async function saveNewStore(){
  const 이름=document.getElementById('ns-name')?.value.trim();
  if(!이름){showToast('거래처명을 입력해주세요');return;}
  if(stores.find(s=>s.이름===이름)){showToast('⚠️ 이미 있는 거래처예요');closeModal('new-store-modal');selectStore(이름);return;}
  const maxCode=stores.reduce((max,s)=>{const n=parseInt((s.코드||'C000').replace('C',''))||0;return Math.max(max,n);},0);
  const 코드=`C${String(maxCode+1).padStart(3,'0')}`;
  const store={코드,이름,담당:EMP,요일:document.getElementById('ns-day')?.value||'',유종:document.getElementById('ns-type')?.value||'',연락처:document.getElementById('ns-phone')?.value.trim()||'',입금자:document.getElementById('ns-payer')?.value.trim()||'',비고:document.getElementById('ns-note')?.value.trim()||''};
  try{const res=await fetch(API,{method:'POST',headers:{'Content-Type':'text/plain'},body:JSON.stringify({type:'store_add',store})});const d=await res.json();if(d.ok===false){showToast('⚠️ '+d.error);return;}}catch(e){showToast('⚠️ 서버 저장 실패 - 로컬에만 추가');}
  stores.push(store);localStorage.setItem('stores_v3',JSON.stringify(stores));
  showToast(`✅ "${이름}" 추가됐어요!`);closeModal('new-store-modal');selectStore(이름);
}

function renderPriceTab(){
  const q=(document.getElementById('price-search')?.value||'').trim().toLowerCase();
  const wpCur=document.getElementById('wp-cur'),wpCurDate=document.getElementById('wp-cur-date'),wpPrev=document.getElementById('wp-prev'),wpPrevDate=document.getElementById('wp-prev-date'),wpDiff=document.getElementById('wp-diff');
  const sorted=[...wastePriceHistory].sort((a,b)=>b.날짜.localeCompare(a.날짜));
  if(sorted.length>0){const cur=sorted[0];if(wpCur)wpCur.textContent=(+cur.단가).toLocaleString()+'원/kg';if(wpCurDate)wpCurDate.textContent=cur.날짜+' 부터';if(sorted.length>1){const prev=sorted[1];if(wpPrev)wpPrev.textContent=(+prev.단가).toLocaleString()+'원/kg';if(wpPrevDate)wpPrevDate.textContent=prev.날짜+' 부터';const diff=+cur.단가-+prev.단가;if(wpDiff)wpDiff.innerHTML=`<span style="font-size:13px;font-weight:700;color:${diff>0?'var(--g)':'var(--r)'}">${diff>0?'▲':'▼'} ${Math.abs(diff).toLocaleString()}원</span>`;}}
  const el=document.getElementById('price-list');if(!el)return;
  const latest={};priceHistory.forEach(p=>{if(!latest[p.품명]||new Date(p.날짜)>=new Date(latest[p.품명].날짜))latest[p.품명]=p;});
  let items=Object.values(latest);if(q)items=items.filter(p=>p.품명.toLowerCase().includes(q));items.sort((a,b)=>a.품명.localeCompare(b.품명,'ko'));
  if(!items.length){el.innerHTML='<div style="text-align:center;padding:30px;color:var(--t3)">단가 정보 없음</div>';return;}
  el.innerHTML=items.map(p=>{const isFee=p.구분==='수수료',tagColor=isFee?'var(--r)':'var(--p)',tagBg=isFee?'rgba(255,107,107,.1)':'rgba(108,143,255,.1)';return `<div style="background:var(--card);border:1px solid var(--border);border-radius:11px;padding:12px 14px;margin-bottom:7px;display:flex;justify-content:space-between;align-items:center"><div><div style="font-size:13px;font-weight:700">${p.품명}${p.구분?`<span style="font-size:9px;font-weight:700;padding:2px 6px;border-radius:5px;background:${tagBg};color:${tagColor};margin-left:4px">${p.구분}</span>`:''}</div><div style="font-size:10px;color:var(--t3);margin-top:2px">${p.날짜} 기준</div></div><div style="font-family:'JetBrains Mono',monospace;font-size:15px;font-weight:700;color:var(--y)">${(+p.출고가).toLocaleString()}원</div></div>`;}).join('');
}

function buildReceipt(tx){
  const storeName=tx.거래처||'',date=tx.날짜||'',misu=window.curStoreMisu||0;
  let lines=[`[${storeName}] 납품 명세서`,`📅 ${date}`,''];
  try{const details=JSON.parse(tx.품목상세||'[]');if(details.length>0)details.forEach(d=>{const isFee=isFeeItem(d.type,date);if(d.qty<0)lines.push(`↩️ 반품 ${d.type} ${Math.abs(d.qty)}통`);else if(isFee)lines.push(`${d.type} ${d.qty}통 (수수료)`);else lines.push(`${d.type} ${d.qty}통 × ${(+d.price).toLocaleString()}원 = ${(d.qty*d.price).toLocaleString()}원`);});else if(tx.통수>0)lines.push(`${tx.유종||''} ${tx.통수}통 × ${(+tx.판매단가||0).toLocaleString()}원`);}catch(e){if(tx.통수>0)lines.push(`${tx.유종||''} ${tx.통수}통`);}
  lines.push('');
  if(+tx.폐유kg>0){lines.push(`♻️ 폐유 수거 ${(+tx.폐유kg).toFixed(1)}kg`);lines.push(`폐유 지급액 -${(+tx.폐유매입금||0).toLocaleString()}원`);}
  lines.push('─────────────────');
  lines.push(`🧾 청구금액: ${(+tx.차감청구||0).toLocaleString()}원`);
  if(tx.수금방법==='현금')lines.push(`💵 현금수령: ${(+tx.수금액||0).toLocaleString()}원`);
  else if(tx.수금방법==='미수'||tx.미수)lines.push(misu>0?`📌 누적 미수: ${misu.toLocaleString()}원`:'📌 미수 처리');
  if(tx.비고)lines.push(`\n📝 ${tx.비고}`);
  return lines.join('\n');
}

function showReceiptButton(tx){
  window._lastTx=tx;document.getElementById('receipt-btn-wrap')?.remove();
  const wrap=document.createElement('div');wrap.id='receipt-btn-wrap';wrap.style.cssText='position:fixed;bottom:90px;left:50%;transform:translateX(-50%);z-index:300;display:flex;gap:8px;';
  wrap.innerHTML=`<button onclick="copyReceipt()" style="padding:12px 20px;background:var(--p2);color:#fff;border:none;border-radius:12px;font-size:13px;font-weight:700;cursor:pointer;font-family:'Noto Sans KR',sans-serif;box-shadow:0 4px 20px rgba(0,0,0,.4)">📋 명세서 복사</button><button onclick="document.getElementById('receipt-btn-wrap')?.remove()" style="padding:12px 16px;background:var(--card);border:1px solid var(--border);color:var(--t2);border-radius:12px;font-size:13px;cursor:pointer;font-family:'Noto Sans KR',sans-serif">✕</button>`;
  document.body.appendChild(wrap);setTimeout(()=>wrap.remove(),10000);
}

async function copyReceipt(){
  const tx=window._lastTx;if(!tx){showToast('명세서 데이터 없음');return;}
  try{const res=await fetch(`${API}?type=misu&store=${encodeURIComponent(tx.거래처)}&year=${new Date().getFullYear()}&month=${new Date().getMonth()+1}`);const d=await res.json();window.curStoreMisu=d.미수잔액||0;}catch(e){}
  const text=buildReceipt(tx);
  try{await navigator.clipboard.writeText(text);}catch(e){const ta=document.createElement('textarea');ta.value=text;document.body.appendChild(ta);ta.select();document.execCommand('copy');document.body.removeChild(ta);}
  markSent(tx.id);showToast('✅ 명세서 복사됐어요! 문자앱에 붙여넣기 하세요');document.getElementById('receipt-btn-wrap')?.remove();
}

async function deletePayment(id,storeName){
  if(!confirm(`${storeName} 입금을 삭제할까요?`))return;
  const now=new Date();
  try{const res=await fetch(API,{method:'POST',headers:{'Content-Type':'text/plain'},body:JSON.stringify({type:'delete_payment',id,year:now.getFullYear(),month:now.getMonth()+1})});const d=await res.json();if(d.ok===false){showToast('⚠️ '+d.error);return;}}catch(e){}
  todayPayments=todayPayments.filter(p=>String(p.id)!==String(id));
  localStorage.setItem(`pay_${EMP}_today`,JSON.stringify(todayPayments));
  showToast('✅ 삭제됐어요');renderTodayPayments();calcSettlement();
}

function downloadTemplate(){
  const csv='날짜,입금자,금액\n2026-03-27,홍길동,50000\n2026-03-27,김영희,80000';
  const blob=new Blob(['\uFEFF'+csv],{type:'text/csv;charset=utf-8;'});
  const url=URL.createObjectURL(blob);const a=document.createElement('a');a.href=url;a.download='입금내역_양식.csv';
  document.body.appendChild(a);a.click();document.body.removeChild(a);URL.revokeObjectURL(url);
}

async function batchCopyReceipts(){
  const dateEl=document.getElementById('hist-date-sel');
  await batchCopyReceiptsByDate(dateEl?.value||today());
}


// ══════════════ 차량재고 서버 동기화 ══════════════

async function syncCargoToServer(){
  const t = today();
  const cargos = JSON.parse(localStorage.getItem(`cargo_today_${EMP}`) || '[]');
  try{
    await fetch(API, {
      method: 'POST',
      headers: {'Content-Type':'text/plain'},
      body: JSON.stringify({type:'cargo_sync', emp:EMP, date:t, cargos})
    });
  }catch(e){} // 동기화 실패해도 로컬은 정상
}

async function loadCargoFromServer(){
  const t = today();
  try{
    const res = await fetch(`${API}?type=cargo_today&emp=${encodeURIComponent(EMP)}&date=${t}`);
    const d = await res.json();
    if(d.cargos && d.cargos.length > 0){
      // 로컬에 없는 경우만 서버 데이터 사용 (로컬 우선)
      const local = JSON.parse(localStorage.getItem(`cargo_today_${EMP}`) || '[]');
      if(!local.length){
        localStorage.setItem(`cargo_today_${EMP}`, JSON.stringify(d.cargos));
        showToast('📦 서버에서 상차 데이터 복원됐어요');
        renderRoute();
      }
    }
  }catch(e){}
}

// saveCheckin 오버라이드 - 서버 동기화 추가
const _origSaveCheckin = typeof saveCheckin === 'function' ? saveCheckin : null;

async function saveCheckin(){
  const validPallets = pallets.filter(p=>p.총중량>0&&p.캔수>0);
  const validCargos  = cargos.filter(c=>c.통수>0);
  if(!validPallets.length&&!validCargos.length){showToast('폐유납품 또는 상차를 입력해주세요');return;}

  const wcp = getWastePriceAt(today());
  const totalReal = validPallets.reduce((s,p)=>s+p.실중량,0);
  const income = Math.round(totalReal*wcp);
  const t = today();

  try{
    // 폐유납품 저장 (수거처목록 포함)
    if(validPallets.length>0){
      const hasExistPallet=validPallets.some(p=>p.기존있음);
      const existPallet=validPallets.find(p=>p.기존있음);
      const delivery={
        id:Date.now(),날짜:t,직원:EMP,
        파레트수:validPallets.length,총실중량:totalReal,매입단가:wcp,폐유수입:income,
        이전계근여부:hasExistPallet,
        기존중량:existPallet?.기존중량||0,기존캔수:existPallet?.기존캔||0,
        내린캔수:validPallets.reduce((s,p)=>s+(p.내린캔수||p.캔수||0),0),
        파레트목록:validPallets.map(p=>({총중량:p.총중량,캔수:p.캔수,실중량:p.실중량,기존있음:p.기존있음,기존중량:p.기존중량,기존캔:p.기존캔,내린캔수:p.내린캔수})),
        수거처목록:[] // 출근탭에서는 거래처 연결 없음 (납품탭에서 폐유 수거 시 연결)
      };
      try{await fetch(API,{method:'POST',headers:{'Content-Type':'text/plain'},body:JSON.stringify({type:'waste_delivery',delivery})});}catch(e){}
    }

    // 상차 저장
    for(const c of validCargos){
      try{await fetch(API,{method:'POST',headers:{'Content-Type':'text/plain'},
        body:JSON.stringify({type:'cargo',cargo:{id:Date.now()+Math.random(),날짜:t,직원:EMP,거래처:c.거래처||'',유종:c.유종,통수:c.통수}})});}catch(e){}
    }

    // 로컬 저장
    const savedCargos=validCargos.map(c=>({거래처:c.거래처,유종:c.유종,통수:c.통수}));
    const prevCargos=JSON.parse(localStorage.getItem(`cargo_today_${EMP}`)||'[]');
    const mergedCargos=[...prevCargos];
    savedCargos.forEach(nc=>{
      const ex=mergedCargos.find(x=>x.거래처===nc.거래처&&x.유종===nc.유종);
      if(ex)ex.통수+=nc.통수; else mergedCargos.push({...nc});
    });
    localStorage.setItem(`cargo_today_${EMP}`,JSON.stringify(mergedCargos));

    // 출근 로그
    const log=JSON.parse(localStorage.getItem(`checkin_log_${EMP}_${t}`)||'[]');
    log.push({id:Date.now(),폐유:{파레트수:validPallets.length,실중량:totalReal,수입:income},상차:savedCargos});
    localStorage.setItem(`checkin_log_${EMP}_${t}`,JSON.stringify(log));

    // ★ 서버 동기화
    await syncCargoToServer();

    showToast('✅ 저장됐어요!');
    pallets=[];cargos=[];palletId=0;cargoId=0;
    document.getElementById('pallet-list').innerHTML='';
    document.getElementById('cargo-list').innerHTML='';
    document.getElementById('waste-total-box').style.display='none';
    document.getElementById('stock-summary').style.display='none';
    const sb=document.getElementById('checkin-summary-bar');if(sb)sb.style.display='none';
    renderCheckinHistory();
    renderRoute();
  }catch(e){showToast('⚠️ 저장 실패');}
}

// ══════════════ 미수 한도 경고 (납품 저장 전) ══════════════

async function checkMisuBeforeSave(storeName, charge){
  if(!storeName || !charge || charge <= 0) return true; // 체크 불필요

  try{
    const now = new Date();
    const res = await fetch(`${API}?type=misu_check&store=${encodeURIComponent(storeName)}&charge=${charge}&year=${now.getFullYear()}&month=${now.getMonth()+1}`);
    const d = await res.json();

    // 거래처 비활성
    if(d.ok === false && !d.warn){
      showToast('⚠️ ' + d.error);
      return false;
    }

    // 한도 초과 경고 (warn=true면 경고만, 강제차단 아님)
    if(d.warn){
      const proceed = confirm(
        `⚠️ 미수 한도 초과

거래처: ${storeName}
현재 미수: ${(d.현재미수||0).toLocaleString()}원
이번 청구: ${charge.toLocaleString()}원
한도: ${(d.한도||0).toLocaleString()}원

그래도 납품하시겠어요?`
      );
      return proceed;
    }

    return true; // 정상
  }catch(e){
    return true; // 체크 실패해도 납품은 허용
  }
}

// ══════════════ init 오버라이드 - 서버 복원 추가 ══════════════

const _origInitPatch = typeof init === 'function' ? init : null;

async function init(){
  const now=new Date();
  document.getElementById('ci-date').textContent=`${now.getFullYear()}.${String(now.getMonth()+1).padStart(2,'0')}.${String(now.getDate()).padStart(2,'0')} (${['일','월','화','수','목','금','토'][now.getDay()]})`;
  document.getElementById('delivery-day-label').textContent=`${['일','월','화','수','목','금','토'][now.getDay()]}요일 루트`;
  // hist-month-label 안전하게 처리 (HTML에 없는 경우 대비)
  const ym=`${now.getFullYear()}-${String(now.getMonth()+1).padStart(2,'0')}`;
  const hml=document.getElementById('hist-month-label'); if(hml) hml.textContent=ym;

  try{
    const fetchOpts={signal:AbortSignal.timeout?AbortSignal.timeout(8000):undefined};
    const [sr,pr]=await Promise.all([fetch(API+'?type=stores',fetchOpts),fetch(API+'?type=prices',fetchOpts)]);
    const sd=await sr.json(),pd=await pr.json();
    let cd={config:{}};
    try{const cr=await fetch(API+'?type=config',fetchOpts);cd=await cr.json();}catch(e){}

    if(sd.stores?.length){
      // 활성 거래처만 로컬 캐시 (비활성은 직원앱에서 제외)
      stores=sd.stores
        .filter(s=>s.상태!=='비활성') // 비활성 제외
        .map(s=>({코드:s.코드||'',이름:s.이름||'',담당:s.담당||'',요일:s.요일||'',유종:s.유종||'',연락처:s.연락처||'',입금자:s.입금자||'',계좌:s.계좌||'',비고:s.비고||'',미수한도:+s.미수한도||0}));
      localStorage.setItem('stores_v3',JSON.stringify(stores));
    }

    if(pd.prices?.length){
      const normalizeDate=d=>{const s=String(d||'');if(s.includes('T'))return s.slice(0,10);return s.slice(0,10);};
      priceHistory=pd.prices.filter(p=>p.품명&&p.품명!=='폐유매입단가').map(p=>({품명:p.품명,출고가:+p.출고가,날짜:normalizeDate(p.적용일자),구분:p.구분||'범용',비고:p.비고||''}));
      wastePriceHistory=pd.prices.filter(p=>p.품명==='폐유매입단가').map(p=>({단가:+p.출고가,날짜:normalizeDate(p.적용일자)}));
      localStorage.setItem('priceHistory_v3',JSON.stringify(priceHistory));
      localStorage.setItem('wastePriceHistory_v3',JSON.stringify(wastePriceHistory));
    }

    document.getElementById('sync-status').textContent='✅';

    if(cd.config){let i=1;accounts=[];while(cd.config[`account_${i}`]){try{accounts.push(JSON.parse(cd.config[`account_${i}`]));}catch(e){}i++;}}
  }catch(e){
    document.getElementById('sync-status').textContent='📴';
    document.getElementById('sync-status').style.cursor='pointer';
    document.getElementById('sync-status').onclick=()=>init();
  }

  buildNsTypeOptions();buildPayStore();renderCarryOver();renderRoute();renderCheckinHistory();renderTodayPayments();renderHistory();
  updateQueueBadge();

  // 서버 상차 복원 (로컬이 비어있을 때)
  setTimeout(()=>{
    flushQueue();
    loadCargoFromServer(); // 폰 교체/캐시 삭제 후 복원
  }, 3000);
}


// ── renderRoute 오버라이드 (프로그레스바 + 방문일) ──
function getLastVisit(storeName){
  const list = (typeof txList !== 'undefined' ? txList : [])
    .filter(x => x.거래처 === storeName && x.날짜)
    .sort((a, b) => b.날짜.localeCompare(a.날짜));
  if(!list.length) return null;
  const diff = Math.floor((new Date(today()) - new Date(list[0].날짜)) / 86400000);
  if(diff === 0) return {label:'오늘', color:'var(--g)'};
  if(diff === 1) return {label:'어제', color:'var(--p)'};
  if(diff <= 7)  return {label:`${diff}일 전`, color:'var(--t2)'};
  if(diff <= 30) return {label:`${diff}일 전`, color:'var(--y)'};
  return {label:`${diff}일 전`, color:'var(--r)'};
}

function renderRouteProgress(done, total){
  const prog = document.getElementById('route-progress');
  if(!prog) return;
  const pct = total > 0 ? Math.round((done / total) * 100) : 0;
  const allDone = done === total && total > 0;
  prog.innerHTML = `
    <div style="display:flex;align-items:center;gap:8px">
      <div style="font-size:12px;font-weight:700;color:${allDone?'var(--g)':'var(--t2)'};white-space:nowrap">
        ${allDone ? '✅ 완료' : `${done}/${total}`}
      </div>
      <div style="width:72px;height:6px;background:var(--border);border-radius:3px;overflow:hidden">
        <div style="height:100%;width:${pct}%;background:${allDone?'var(--g)':'var(--p)'};border-radius:3px;transition:width .4s ease"></div>
      </div>
      <div style="font-size:10px;color:var(--t3)">${pct}%</div>
    </div>`;
}

const _origRenderRoute = typeof renderRoute === 'function' ? renderRoute : null;

function renderRoute(){
  const list = getRouteList();
  const el = document.getElementById('route-list');
  const prog = document.getElementById('route-progress');
  if(!list.length){
    el.innerHTML = '<div class="empty"><div class="empty-icon">📍</div><div>루트 없음<br><span style="font-size:10px">출근탭에서 상차를 입력하거나<br>거래처 요일을 등록해주세요</span></div></div>';
    if(prog) prog.innerHTML = '';
    return;
  }
  updateDailyBar();
  const savedCargos = JSON.parse(localStorage.getItem(`cargo_today_${EMP}`) || '[]');
  const doneCount = completedRoutes.filter(n => list.includes(n)).length;
  renderRouteProgress(doneCount, list.length);
  el.innerHTML = list.map((name, i) => {
    const done = completedRoutes.includes(name);
    const s = stores.find(x => x.이름 === name);
    const cargo = savedCargos.find(c => c.거래처 === name);
    const isMine = !s?.담당 || s?.담당 === EMP;
    const meta = cargo ? `📦 ${cargo.유종} ${cargo.통수}통 상차` : (s?.유종 || '유종미등록');
    const crossLabel = !isMine && s?.담당 ? `<span style="font-size:9px;color:var(--o);margin-left:4px">↔ ${s.담당}</span>` : '';
    const visit = getLastVisit(name);
    const visitBadge = visit
      ? `<span style="font-size:9px;font-weight:600;color:${visit.color};background:rgba(0,0,0,.2);padding:2px 6px;border-radius:10px;margin-left:4px">${visit.label}</span>`
      : '';
    return `<div class="route-item ${done ? 'done' : ''}" id="ri-${i}" data-name="${name}">
      <div class="route-order" style="background:${done ? 'var(--g)' : 'var(--p2)'};flex-shrink:0">${done ? '✓' : i+1}</div>
      <div class="route-info" onclick="openDelivery('${name}')">
        <div class="route-name">${name}${crossLabel}${visitBadge}</div>
        <div class="route-meta" style="color:${cargo ? 'var(--o)' : 'var(--t2)'}">${meta}</div>
      </div>
      ${done
        ? `<button onclick="deleteTxByStore('${name}')" style="padding:6px 10px;background:rgba(255,107,107,.12);border:none;border-radius:8px;color:var(--r);font-size:11px;font-weight:600;cursor:pointer;flex-shrink:0">납품삭제</button>`
        : `<button onclick="removeFromRoute('${name}')" style="padding:6px 10px;background:rgba(122,127,148,.12);border:none;border-radius:8px;color:var(--t2);font-size:11px;font-weight:600;cursor:pointer;flex-shrink:0">✕</button>`
      }
      <div class="drag-handle" draggable="true"
        ondragstart="dragStart(event,'${name}')"
        ondragover="dragOver(event)"
        ondrop="dragDrop(event,'${name}')"
        ondragend="dragEnd(event)">⠿</div>
    </div>`;
  }).join('');
}

// ── saveDelivery 오버라이드 (완료 애니메이션) ──
const _origSaveDelivery = typeof saveDelivery === 'function' ? saveDelivery : null;

async function saveDelivery(){
  if(!curStore && !document.getElementById('chip-name').textContent){ showToast('거래처를 선택해주세요'); return; }
  if(items.length === 0 && !wasteOn){ showToast('품목 또는 폐유를 입력해주세요'); return; }
  if(!curPay){ showToast('수금방법을 선택해주세요'); return; }

  const t = today();
  const storeName = curStore?.이름 || document.getElementById('chip-name').textContent || '임시거래처';
  const oilTotal = items.reduce((s, i) => isFeeItem(i.type, t) ? s : s + i.qty * i.price, 0);
  const oilMargin = items.reduce((s, i) => {
    if(isFeeItem(i.type, t)) return s + i.qty * (getPriceAt(i.type, t) || 0);
    return s + i.qty * (i.price - (getPriceAt(i.type, t) || 0));
  }, 0);

  let wasteKg = 0, wastePriceVal = 0, wastePay = 0, wasteRev = 0;
  if(wasteOn){
    if(wasteModeCalc){
      wasteKg = parseFloat(document.getElementById('w-kg')?.value) || 0;
      wastePriceVal = parseFloat(document.getElementById('w-price')?.value) || 0;
      wastePay = Math.round(wasteKg * wastePriceVal);
    } else {
      wastePay = parseFloat(document.getElementById('w-direct')?.value) || 0;
    }
    const wcp2 = getWastePriceAt(t);
    wasteRev = wasteModeCalc ? Math.round(wasteKg * (wcp2 - wastePriceVal)) : 0;
  }

  const charge = oilTotal - wastePay;
  const payAmt = parseFloat(document.getElementById('pay-amount')?.value) || 0;

  const tx = {
    id: `${t}_${EMP}_${storeName}_${Date.now()}`,
    날짜: t,
    시간: new Date().toLocaleTimeString('ko-KR', {hour:'2-digit', minute:'2-digit'}),
    직원: EMP, 거래처: storeName,
    유종: items.map(i => i.type).filter(Boolean).join('/'),
    품목상세: JSON.stringify(items.map(i => ({type:i.type, qty:i.qty, price:i.price}))),
    통수: items.reduce((s, i) => s + i.qty, 0),
    판매단가: items.length === 1 ? items[0].price : 0,
    출고가: items.length === 1 ? (getPriceAt(items[0].type, t) || 0) : 0,
    폐유kg: wasteKg, 폐유매입단가: wastePriceVal,
    식유금액: oilTotal, 폐유매입금: wastePay, 차감청구: charge,
    식유마진: oilMargin, 폐유수익: wasteRev, 총수익: oilMargin + wasteRev,
    수금방법: curPay, 수금액: payAmt,
    미수: curPay === '미수' || curPay === '반품',
    비고: document.getElementById('d-note')?.value || ''
  };

  // 로컬 먼저 저장
  txList.unshift(tx);
  const cutoff = new Date(); cutoff.setDate(cutoff.getDate() - 7);
  localStorage.setItem(`tx_${EMP}_v3`, JSON.stringify(txList.filter(x => x.날짜 >= cutoff.toISOString().slice(0,10)).slice(0, 500)));

  // 반품 시 차량재고 복귀
  const returnItems = items.filter(i => i.qty < 0);
  if(returnItems.length > 0){
    const todayCargos = JSON.parse(localStorage.getItem(`cargo_today_${EMP}`) || '[]');
    returnItems.forEach(ri => {
      const ex = todayCargos.find(c => c.유종 === ri.type && c.거래처 === storeName);
      if(ex) ex.통수 = Math.max(0, ex.통수 + Math.abs(ri.qty));
      else todayCargos.push({거래처:'', 유종:ri.type, 통수:Math.abs(ri.qty), 반품이월:true});
    });
    localStorage.setItem(`cargo_today_${EMP}`, JSON.stringify(todayCargos));
  }

  if(!completedRoutes.includes(storeName)) completedRoutes.push(storeName);
  localStorage.setItem(`done_${EMP}_${t}`, JSON.stringify(completedRoutes));

  // 현금/폐유 자동 입금 기록
  if(curPay === '현금지급' || curPay === '이체지급' || curPay === '미수차감폐유'){
    const payAmt2 = wastePay || Math.abs(charge);
    if(payAmt2 > 0){
      await savePayment({거래처:storeName, 금액:-payAmt2, 날짜:t, 입금자명:'폐유대금', 방법:curPay==='이체지급'?'계좌이체':'현금지급', 비고:'폐유수거 대금 지급'});
    }
  }
  if(curPay === '현금' && payAmt > 0){
    await savePayment({거래처:storeName, 금액:payAmt, 날짜:t, 입금자명:curStore?.입금자||storeName, 방법:'현금', 비고:'현장 현금수령'});
  }

  // 서버 전송
  await safeFetch({type:'tx', tx}, () => {
    const isReturn = returnItems.length > 0;
    if(!isReturn) showDeliverySuccess(storeName);
    else showToast('↩️ 반품 저장 (차량재고 복구)');
    hideDeliveryForm();
    renderRoute();
    renderHistory();
    updateDailyBar();
    showReceiptButton(tx);
  });
}

// ══════════════ DOM 보완 - son/bak.html HTML에 없는 엘리먼트 동적 생성 ══════════════
(function fixEmpDOMIssues(){
  const fix = () => {
    // hist-month-label이 없으면 내역탭 헤더에 동적 추가
    if(!document.getElementById('hist-month-label')){
      const hdr = document.querySelector('#page-history .page-hdr > div');
      if(hdr){
        const lbl = document.createElement('div');
        lbl.id = 'hist-month-label';
        lbl.style.cssText = 'font-size:11px;color:var(--t3)';
        hdr.appendChild(lbl);
        // 값 채우기
        const now = new Date();
        lbl.textContent = `${now.getFullYear()}-${String(now.getMonth()+1).padStart(2,'0')}`;
      }
    }
    // price-search input 숨기기
    const priceSearch = document.getElementById('price-search');
    if(priceSearch){
      const wrap = priceSearch.closest('.inp-wrap');
      if(wrap) wrap.style.display = 'none';
    }
  };
  if(document.readyState === 'complete' || document.readyState === 'interactive'){
    setTimeout(fix, 50);
  } else {
    document.addEventListener('DOMContentLoaded', () => setTimeout(fix, 50));
  }
})();

// ══════════════ 단가 보안 + 품목 렌더링 ══════════════

// addItem 오버라이드 - 수수료/음수 출고가 자동처리
const _origAddItem = typeof addItem === 'function' ? addItem : null;

function addItem(typeVal, qtyVal, priceVal){
  if(_origAddItem){
    _origAddItem(typeVal, qtyVal, priceVal);
  }
  // 추가된 품목 카드에서 단가 필드 보안 적용
  setTimeout(() => applyItemSecurity(), 50);
}

function applyItemSecurity(){
  const t = today();
  document.querySelectorAll('.item-card').forEach(card => {
    const typeInput = card.querySelector('[id^="item-type-"], [id^="it-type-"], .type-search-input');
    const priceInput = card.querySelector('[id^="item-price-"], [id^="it-price-"]');
    if(!typeInput || !priceInput) return;

    const typeName = typeInput.value || '';
    if(!typeName) return;

    const costPrice = getPriceAt(typeName, t) || 0;
    const isFee = isFeeItem(typeName, t);
    const isNegCost = costPrice < 0;

    // 수수료 또는 음수 출고가 → 단가 필드 숨기고 배지 표시
    if(isFee || isNegCost){
      priceInput.closest('.inp-wrap')?.style && (priceInput.closest('.inp-wrap').style.display = 'none');
      // 이미 배지 있으면 스킵
      if(!card.querySelector('.fee-badge')){
        const badge = document.createElement('div');
        badge.className = 'fee-badge';
        badge.style.cssText = 'font-size:11px;color:var(--o);background:rgba(255,159,67,.1);padding:4px 10px;border-radius:6px;margin-top:4px;';
        badge.textContent = isNegCost ? `수수료 수입 ${Math.abs(costPrice).toLocaleString()}원/통` : '수수료 품목 (차감청구 없음)';
        priceInput.closest('.inp-wrap')?.insertAdjacentElement('afterend', badge)
          || card.appendChild(badge);
      }
    } else {
      priceInput.closest('.inp-wrap')?.style && (priceInput.closest('.inp-wrap').style.display = '');
      // 판매단가 음수 입력 차단
      priceInput.addEventListener('input', function(){
        const val = parseFloat(this.value);
        if(val < 0){ this.value = 0; showToast('⚠️ 판매단가는 0 이상이어야 해요'); }
      }, {once: false});
      // 마진 음수 경고
      const price = parseFloat(priceInput.value) || 0;
      if(price > 0 && price < costPrice){
        let warn = card.querySelector('.margin-warn');
        if(!warn){
          warn = document.createElement('div');
          warn.className = 'margin-warn';
          warn.style.cssText = 'font-size:10px;color:var(--r);margin-top:3px;';
          priceInput.insertAdjacentElement('afterend', warn);
        }
        warn.textContent = `⚠️ 출고가(${costPrice.toLocaleString()}원)보다 낮음 — 마진 손실`;
      } else {
        card.querySelector('.margin-warn')?.remove();
      }
    }
  });
}

// 단가 입력 시 실시간 보안 적용
document.addEventListener('input', function(e){
  if(e.target.matches('[id^="item-type-"], [id^="it-type-"], .type-search-input')){
    setTimeout(() => applyItemSecurity(), 100);
  }
  if(e.target.matches('[id^="item-price-"], [id^="it-price-"]')){
    applyItemSecurity();
  }
}, true);

// ══════════════ 2단계: 거래처 카드 인라인 폼 ══════════════

const _origOpenDelivery = typeof openDelivery === 'function' ? openDelivery : null;

function openDelivery(name){
  if(completedRoutes.includes(name)) return;
  const list = getRouteList();
  const idx = list.indexOf(name);
  if(idx < 0) return;
  const card = document.getElementById(`ri-${idx}`);
  if(!card) return;

  // 이미 열려있으면 닫기
  if(card.querySelector('.inline-delivery-form')){
    closeInlineForm(idx); return;
  }
  // 다른 폼 닫기
  document.querySelectorAll('.inline-delivery-form').forEach(f => {
    const c = f.closest('.route-item');
    if(c) c.style.borderColor = '';
    f.remove();
  });

  card.style.borderColor = 'var(--p)';

  const s = stores.find(x => x.이름 === name);
  const savedCargos = JSON.parse(localStorage.getItem(`cargo_today_${EMP}`) || '[]');
  const cargo = savedCargos.find(c => c.거래처 === name);
  const t = today();
  const wcp = getWastePriceAt(t);

  // 미수 로컬 계산
  const misuAmt = txList
    .filter(x => x.거래처 === name)
    .reduce((a, x) => {
      if(x.미수 === true || x.미수 === 'TRUE') return a + (+x.차감청구||0);
      if(x.수금방법 === '현금' || x.수금방법 === '이체') return a - (+x.수금액||0);
      return a;
    }, 0);

  const defaultType = cargo?.유종 || s?.유종?.split('/')[0]?.trim() || '';
  const defaultQty  = cargo?.통수 || 0;
  const costPrice   = defaultType ? (getPriceAt(defaultType, t) || 0) : 0;
  const isFee       = defaultType ? isFeeItem(defaultType, t) : false;
  const isNegCost   = costPrice < 0;
  const hidePrice   = isFee || isNegCost;
  const defaultPrice = hidePrice ? 0 : costPrice;

  const formHtml = `
  <div class="inline-delivery-form" style="border-top:1px solid var(--border);padding:14px 13px;background:var(--card2);">

    <!-- 거래처명 크게 -->
    <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:12px;">
      <div>
        <div style="font-size:18px;font-weight:900;color:var(--t);">${name}</div>
        <div style="font-size:11px;color:var(--t2);margin-top:2px;">${s?.요일||''}요일 · ${s?.유종||''}</div>
      </div>
      <button onclick="closeInlineForm(${idx})" style="padding:6px 10px;background:rgba(255,107,107,.1);border:none;border-radius:7px;color:var(--r);font-size:11px;cursor:pointer;">✕</button>
    </div>

    <!-- 미수 표시 -->
    ${misuAmt > 0 ? `
    <div style="background:rgba(255,107,107,.08);border:1px solid rgba(255,107,107,.2);border-radius:8px;padding:8px 12px;margin-bottom:10px;display:flex;justify-content:space-between;align-items:center;">
      <span style="font-size:12px;color:var(--t2);">현재 미수잔액</span>
      <span style="font-family:'JetBrains Mono',monospace;font-size:14px;font-weight:700;color:var(--r);">${misuAmt.toLocaleString()}원</span>
    </div>` : ''}

    <!-- 품목 -->
    <div style="font-size:10px;font-weight:700;letter-spacing:.1em;color:var(--t3);margin-bottom:6px;">ITEMS</div>
    <div id="inline-items-${idx}">
      <div class="inline-item" id="inline-item-0-${idx}" style="background:var(--card);border:1px solid var(--border);border-radius:9px;padding:10px 11px;margin-bottom:6px;">
        <div style="display:flex;gap:6px;align-items:center;margin-bottom:6px;">
          <div style="flex:1;position:relative;">
            <input class="inp type-search-input" id="itype-0-${idx}" value="${defaultType}" placeholder="유종 검색..."
              style="font-size:13px;padding:9px 11px;"
              oninput="onInlineTypeSearch(0,${idx})" onfocus="onInlineTypeSearch(0,${idx})"
              onblur="setTimeout(()=>hideInlineDd(0,${idx}),150)" autocomplete="off">
            <div class="type-dropdown" id="itdd-0-${idx}"></div>
          </div>
          <input class="inp" id="iqty-0-${idx}" type="number" value="${defaultQty||''}" placeholder="통수"
            inputmode="numeric" style="width:68px;font-size:14px;padding:9px 10px;font-family:'JetBrains Mono',monospace;"
            oninput="numOnlyNeg(this);calcInline(${idx});updateInlinePayBtns(${idx})">
        </div>
        ${hidePrice ? `
        <div style="font-size:11px;color:var(--o);background:rgba(255,159,67,.08);border:1px solid rgba(255,159,67,.2);padding:5px 10px;border-radius:6px;">
          ${isNegCost ? `수수료 수입 ${Math.abs(costPrice).toLocaleString()}원/통` : '수수료 품목 — 차감청구 없음'}
        </div>` : `
        <div style="display:flex;align-items:center;gap:6px;">
          <span style="font-size:10px;color:var(--t2);white-space:nowrap;">판매단가</span>
          <input class="inp" id="iprice-0-${idx}" type="number" value="${defaultPrice||''}" placeholder="${defaultPrice}"
            inputmode="numeric" style="flex:1;font-size:13px;padding:9px 10px;font-family:'JetBrains Mono',monospace;"
            oninput="numOnly(this);calcInline(${idx});updateInlinePayBtns(${idx})">
          <span style="font-size:10px;color:var(--t3);">원</span>
        </div>
        <div id="imargin-0-${idx}" style="font-size:10px;margin-top:3px;"></div>`}
      </div>
    </div>
    <button onclick="addInlineItem(${idx})" style="width:100%;padding:8px;background:transparent;border:1px dashed var(--border);border-radius:8px;color:var(--t3);font-size:11px;cursor:pointer;margin-bottom:12px;">+ 품목 추가</button>

    <!-- 폐유 수거 -->
    <div style="border-top:1px solid var(--border);padding-top:10px;margin-bottom:10px;">
      <div style="display:flex;justify-content:space-between;align-items:center;cursor:pointer;" onclick="toggleInlineWaste(${idx})">
        <span style="font-size:13px;color:var(--o);">♻️ 폐유 수거</span>
        <div class="toggle-sw" id="inline-waste-sw-${idx}"></div>
      </div>
      <div id="inline-waste-fields-${idx}" style="display:none;margin-top:10px;">
        <div style="display:flex;gap:5px;margin-bottom:8px;">
          <div onclick="setInlineWasteMode(${idx},'calc')" id="iwm-calc-${idx}"
            style="flex:1;padding:7px;text-align:center;border-radius:7px;font-size:11px;cursor:pointer;border:1px solid var(--p);background:rgba(108,143,255,.1);color:var(--p);">kg × 단가</div>
          <div onclick="setInlineWasteMode(${idx},'direct')" id="iwm-direct-${idx}"
            style="flex:1;padding:7px;text-align:center;border-radius:7px;font-size:11px;cursor:pointer;border:1px solid var(--border);background:transparent;color:var(--t3);">직접입력</div>
        </div>
        <div id="iwaste-calc-${idx}">
          <div style="display:grid;grid-template-columns:1fr 1fr;gap:6px;">
            <div style="display:flex;flex-direction:column;gap:3px;">
              <label style="font-size:10px;color:var(--t2);">실중량(kg)</label>
              <input class="inp" id="iwkg-${idx}" type="number" placeholder="0.0" step="0.1" inputmode="decimal"
                style="font-size:13px;padding:9px 10px;" oninput="numOnly(this,true);calcInline(${idx});updateInlinePayBtns(${idx})">
            </div>
            <div style="display:flex;flex-direction:column;gap:3px;">
              <label style="font-size:10px;color:var(--t2);">매입단가</label>
              <input class="inp" id="iwprice-${idx}" type="number" value="${wcp}" inputmode="numeric"
                style="font-size:13px;padding:9px 10px;font-family:'JetBrains Mono',monospace;" oninput="numOnly(this);calcInline(${idx});updateInlinePayBtns(${idx})">
            </div>
          </div>
        </div>
        <div id="iwaste-direct-${idx}" style="display:none;">
          <div style="display:flex;flex-direction:column;gap:3px;">
            <label style="font-size:10px;color:var(--t2);">폐유 지급액(원)</label>
            <input class="inp" id="iwdirect-${idx}" type="number" placeholder="0" inputmode="numeric"
              style="font-size:13px;padding:9px 10px;" oninput="numOnly(this);calcInline(${idx});updateInlinePayBtns(${idx})">
          </div>
        </div>
      </div>
    </div>

    <!-- 미수 차감 토글 (미수 있을 때만) -->
    ${misuAmt > 0 ? `
    <div id="inline-misu-section-${idx}" style="border-top:1px solid var(--border);padding-top:10px;margin-bottom:10px;">
      <div style="display:flex;justify-content:space-between;align-items:center;cursor:pointer;" onclick="toggleInlineMisu(${idx})">
        <span style="font-size:13px;color:var(--r);">미수 차감</span>
        <div class="toggle-sw" id="inline-misu-sw-${idx}"></div>
      </div>
      <div id="inline-misu-fields-${idx}" style="display:none;margin-top:8px;">
        <div style="display:flex;flex-direction:column;gap:3px;">
          <label style="font-size:10px;color:var(--t2);">차감 금액 (0 = 전액 ${misuAmt.toLocaleString()}원)</label>
          <input class="inp" id="imisuamt-${idx}" type="number" placeholder="0" inputmode="numeric"
            style="font-size:13px;padding:9px 10px;" oninput="numOnly(this);calcInline(${idx});updateInlinePayBtns(${idx})">
        </div>
      </div>
    </div>` : ''}

    <!-- 수금 버튼 -->
    <div style="border-top:1px solid var(--border);padding-top:10px;margin-bottom:10px;">
      <div style="font-size:10px;font-weight:700;letter-spacing:.1em;color:var(--t3);margin-bottom:8px;">수금</div>
      <div style="display:grid;grid-template-columns:1fr 1fr 1fr;gap:5px;margin-bottom:8px;" id="inline-pay-btns-${idx}">
        <div class="pay-btn" id="ipay-현금-${idx}" onclick="setInlinePay(${idx},'현금')" style="font-size:12px;padding:10px 4px;">현금</div>
        <div class="pay-btn danger" id="ipay-미수-${idx}" onclick="setInlinePay(${idx},'미수')" style="font-size:12px;padding:10px 4px;">미수</div>
        <div class="pay-btn" id="ipay-이체-${idx}" onclick="setInlinePay(${idx},'이체')" style="font-size:12px;padding:10px 4px;">이체</div>
        <div class="pay-btn" id="ipay-현금지급-${idx}" onclick="setInlinePay(${idx},'현금지급')" style="font-size:12px;padding:10px 4px;">현금지급</div>
        <div class="pay-btn" id="ipay-이체지급-${idx}" onclick="setInlinePay(${idx},'이체지급')" style="font-size:12px;padding:10px 4px;">이체지급</div>
        <div class="pay-btn" id="ipay-반품-${idx}" onclick="setInlinePay(${idx},'반품')" style="font-size:12px;padding:10px 4px;">반품</div>
      </div>
      <div id="inline-payamt-wrap-${idx}" style="display:none;">
        <input class="inp" id="ipayamt-${idx}" type="number" placeholder="수금액(원)" inputmode="numeric"
          style="font-size:14px;padding:10px 12px;" oninput="numOnly(this)">
      </div>
    </div>

    <!-- 결과 -->
    <div id="inline-result-${idx}" style="background:var(--card);border:1px solid var(--border);border-radius:9px;padding:10px 12px;margin-bottom:10px;display:none;"></div>

    <!-- 비고 -->
    <div style="display:flex;flex-direction:column;gap:3px;margin-bottom:12px;">
      <label style="font-size:10px;color:var(--t2);">비고</label>
      <input class="inp" id="inote-${idx}" type="text" placeholder="특이사항" style="font-size:13px;padding:9px 12px;">
    </div>

    <button onclick="saveInlineDelivery('${name.replace(/'/g,"\'")}',${idx})"
      style="width:100%;padding:14px;background:var(--p2);border:none;border-radius:10px;color:#fff;font-size:15px;font-weight:700;cursor:pointer;font-family:'Noto Sans KR',sans-serif;">
      저장
    </button>
  </div>`;

  card.insertAdjacentHTML('beforeend', formHtml);
  updateInlinePayBtns(idx);
  calcInline(idx);
  setTimeout(() => card.scrollIntoView({behavior:'smooth', block:'nearest'}), 100);
}

// ── 수금 버튼 활성/비활성 로직 ──
function updateInlinePayBtns(idx){
  const t = today();
  const items = getInlineItems(idx);
  const wasteOn = inlineWasteOn[idx] || false;
  const wasteMode = inlineWasteMode[idx] || 'calc';
  const misuOn = inlineMisuOn[idx] || false;

  // 청구 계산
  let oilTotal = 0;
  let hasReturn = false;
  items.forEach(item => {
    if(!item.isFee && item.costPrice >= 0) oilTotal += item.price * item.qty;
    if(item.qty < 0) hasReturn = true;
  });
  const hasFeOrNeg = items.some(i => i.isFee || i.costPrice < 0);

  let wastePay = 0;
  if(wasteOn){
    if(wasteMode === 'calc'){
      const wkg = parseFloat(document.getElementById(`iwkg-${idx}`)?.value)||0;
      const wp  = parseFloat(document.getElementById(`iwprice-${idx}`)?.value)||getWastePriceAt(t);
      wastePay = Math.round(wkg * wp);
    } else {
      wastePay = parseFloat(document.getElementById(`iwdirect-${idx}`)?.value)||0;
    }
  }

  const charge = oilTotal - wastePay;
  const onlyWaste = wasteOn && oilTotal === 0 && !hasFeOrNeg;
  const weReceive = charge > 0 || hasFeOrNeg; // 우리가 돈 받는 상황
  const wePay = charge < 0 || onlyWaste;      // 우리가 돈 주는 상황

  // 버튼 정의: [id, 활성조건]
  const btnRules = {
    '현금':    weReceive && !hasReturn,
    '미수':    weReceive && !hasReturn,
    '이체':    weReceive && !hasReturn,
    '현금지급': wePay,
    '이체지급': wePay,
    '반품':    hasReturn,
  };

  Object.entries(btnRules).forEach(([pay, enabled]) => {
    const btn = document.getElementById(`ipay-${pay}-${idx}`);
    if(!btn) return;
    btn.style.opacity = enabled ? '1' : '0.3';
    btn.style.pointerEvents = enabled ? 'auto' : 'none';
    btn.style.cursor = enabled ? 'pointer' : 'default';
    // 비활성화된 버튼이 선택돼있으면 해제
    if(!enabled && inlinePay[idx] === pay){
      inlinePay[idx] = '';
      btn.classList.remove('on');
      const amtWrap = document.getElementById(`inline-payamt-wrap-${idx}`);
      if(amtWrap) amtWrap.style.display = 'none';
    }
  });
}

// ── 헬퍼 함수들 ──
let inlineWasteOn = {};
let inlineWasteMode = {};
let inlinePay = {};
let inlineMisuOn = {};
let inlineItemCount = {};

function closeInlineForm(idx){
  const card = document.getElementById(`ri-${idx}`);
  if(card){
    card.style.borderColor = '';
    card.querySelector('.inline-delivery-form')?.remove();
  }
  delete inlineWasteOn[idx];
  delete inlineWasteMode[idx];
  delete inlinePay[idx];
  delete inlineMisuOn[idx];
  delete inlineItemCount[idx];
}

function onInlineTypeSearch(itemIdx, formIdx){
  const q = (document.getElementById(`itype-${itemIdx}-${formIdx}`)?.value||'').trim().toLowerCase();
  const dd = document.getElementById(`itdd-${itemIdx}-${formIdx}`);
  if(!dd) return;
  const opts = q ? getTypeOptions().filter(t=>t.toLowerCase().includes(q)) : getTypeOptions().slice(0,12);
  dd.innerHTML = opts.map(t=>`<div class="type-opt" onmousedown="selectInlineType(${itemIdx},${formIdx},'${t}')">${t}</div>`).join('');
  dd.classList.add('show');
}

function hideInlineDd(itemIdx, formIdx){
  document.getElementById(`itdd-${itemIdx}-${formIdx}`)?.classList.remove('show');
}

function selectInlineType(itemIdx, formIdx, type){
  const el = document.getElementById(`itype-${itemIdx}-${formIdx}`);
  if(el) el.value = type;
  hideInlineDd(itemIdx, formIdx);
  const t = today();
  const costPrice = getPriceAt(type, t) || 0;
  const isFee = isFeeItem(type, t);
  const isNeg = costPrice < 0;
  const priceEl = document.getElementById(`iprice-${itemIdx}-${formIdx}`);
  if(priceEl && !isFee && !isNeg && costPrice > 0) priceEl.value = costPrice;
  // 수수료/음수면 단가 행 숨기기
  const itemCard = document.getElementById(`inline-item-${itemIdx}-${formIdx}`);
  if(itemCard){
    const priceRow = itemCard.querySelector('.price-row');
    if(priceRow) priceRow.style.display = (isFee || isNeg) ? 'none' : 'flex';
    let badge = itemCard.querySelector('.fee-badge');
    if(isFee || isNeg){
      if(!badge){
        badge = document.createElement('div');
        badge.className = 'fee-badge';
        badge.style.cssText = 'font-size:11px;color:var(--o);background:rgba(255,159,67,.08);border:1px solid rgba(255,159,67,.2);padding:5px 10px;border-radius:6px;margin-top:6px;';
        itemCard.appendChild(badge);
      }
      badge.textContent = isNeg ? `수수료 수입 ${Math.abs(costPrice).toLocaleString()}원/통` : '수수료 품목 — 차감청구 없음';
    } else {
      badge?.remove();
    }
  }
  calcInline(formIdx);
  updateInlinePayBtns(formIdx);
}

function addInlineItem(formIdx){
  const count = (inlineItemCount[formIdx] || 0) + 1;
  inlineItemCount[formIdx] = count;
  const container = document.getElementById(`inline-items-${formIdx}`);
  if(!container) return;
  container.insertAdjacentHTML('beforeend', `
  <div class="inline-item" id="inline-item-${count}-${formIdx}" style="background:var(--card);border:1px solid var(--border);border-radius:9px;padding:10px 11px;margin-bottom:6px;">
    <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:6px;">
      <span style="font-size:10px;color:var(--p);">품목 ${count+1}</span>
      <button onclick="removeInlineItem(${count},${formIdx})" style="padding:3px 8px;background:rgba(255,107,107,.1);border:none;border-radius:5px;color:var(--r);font-size:10px;cursor:pointer;">✕</button>
    </div>
    <div style="display:flex;gap:6px;align-items:center;margin-bottom:6px;">
      <div style="flex:1;position:relative;">
        <input class="inp type-search-input" id="itype-${count}-${formIdx}" value="" placeholder="유종 검색..."
          style="font-size:13px;padding:9px 11px;"
          oninput="onInlineTypeSearch(${count},${formIdx})" onfocus="onInlineTypeSearch(${count},${formIdx})"
          onblur="setTimeout(()=>hideInlineDd(${count},${formIdx}),150)" autocomplete="off">
        <div class="type-dropdown" id="itdd-${count}-${formIdx}"></div>
      </div>
      <input class="inp" id="iqty-${count}-${formIdx}" type="number" placeholder="통수"
        inputmode="numeric" style="width:68px;font-size:14px;padding:9px 10px;font-family:'JetBrains Mono',monospace;"
        oninput="numOnlyNeg(this);calcInline(${formIdx});updateInlinePayBtns(${formIdx})">
    </div>
    <div class="price-row" style="display:flex;align-items:center;gap:6px;">
      <span style="font-size:10px;color:var(--t2);white-space:nowrap;">판매단가</span>
      <input class="inp" id="iprice-${count}-${formIdx}" type="number" placeholder="0"
        inputmode="numeric" style="flex:1;font-size:13px;padding:9px 10px;font-family:'JetBrains Mono',monospace;"
        oninput="numOnly(this);calcInline(${formIdx});updateInlinePayBtns(${formIdx})">
      <span style="font-size:10px;color:var(--t3);">원</span>
    </div>
    <div id="imargin-${count}-${formIdx}" style="font-size:10px;margin-top:3px;"></div>
  </div>`);
}

function removeInlineItem(itemIdx, formIdx){
  document.getElementById(`inline-item-${itemIdx}-${formIdx}`)?.remove();
  calcInline(formIdx);
  updateInlinePayBtns(formIdx);
}

function toggleInlineWaste(idx){
  inlineWasteOn[idx] = !inlineWasteOn[idx];
  document.getElementById(`inline-waste-sw-${idx}`)?.classList.toggle('on', inlineWasteOn[idx]);
  const fields = document.getElementById(`inline-waste-fields-${idx}`);
  if(fields) fields.style.display = inlineWasteOn[idx] ? 'block' : 'none';
  calcInline(idx);
  updateInlinePayBtns(idx);
}

function setInlineWasteMode(idx, mode){
  inlineWasteMode[idx] = mode;
  ['calc','direct'].forEach(m => {
    const btn = document.getElementById(`iwm-${m}-${idx}`);
    const fields = document.getElementById(`iwaste-${m}-${idx}`);
    if(btn){
      const on = m === mode;
      btn.style.borderColor = on ? 'var(--p)' : 'var(--border)';
      btn.style.background = on ? 'rgba(108,143,255,.1)' : 'transparent';
      btn.style.color = on ? 'var(--p)' : 'var(--t3)';
    }
    if(fields) fields.style.display = m === mode ? 'block' : 'none';
  });
  calcInline(idx);
  updateInlinePayBtns(idx);
}

function toggleInlineMisu(idx){
  inlineMisuOn[idx] = !inlineMisuOn[idx];
  document.getElementById(`inline-misu-sw-${idx}`)?.classList.toggle('on', inlineMisuOn[idx]);
  const fields = document.getElementById(`inline-misu-fields-${idx}`);
  if(fields) fields.style.display = inlineMisuOn[idx] ? 'block' : 'none';
  calcInline(idx);
}

function setInlinePay(idx, type){
  inlinePay[idx] = type;
  document.querySelectorAll(`#inline-pay-btns-${idx} .pay-btn`).forEach(b => b.classList.remove('on'));
  document.getElementById(`ipay-${type}-${idx}`)?.classList.add('on');
  const amtWrap = document.getElementById(`inline-payamt-wrap-${idx}`);
  if(amtWrap) amtWrap.style.display = (type==='현금'||type==='이체') ? 'block' : 'none';
}

function getInlineItems(idx){
  const items = [];
  const t = today();
  const process = (itemIdx) => {
    const type  = document.getElementById(`itype-${itemIdx}-${idx}`)?.value||'';
    const qty   = parseFloat(document.getElementById(`iqty-${itemIdx}-${idx}`)?.value)||0;
    const priceEl = document.getElementById(`iprice-${itemIdx}-${idx}`);
    const costP = getPriceAt(type, t) || 0;
    const fee   = type ? isFeeItem(type, t) : false;
    const price = (fee || costP < 0) ? 0 : (parseFloat(priceEl?.value) || costP);
    if(type && qty !== 0) items.push({type, qty, price, isFee:fee, costPrice:costP});
  };
  process(0);
  const count = inlineItemCount[idx] || 0;
  for(let i = 1; i <= count; i++){
    if(document.getElementById(`inline-item-${i}-${idx}`)) process(i);
  }
  return items;
}

function calcInline(idx){
  const t = today();
  const items = getInlineItems(idx);
  const wasteOn   = inlineWasteOn[idx] || false;
  const wasteMode = inlineWasteMode[idx] || 'calc';
  const misuOn    = inlineMisuOn[idx] || false;

  // 마진 표시
  items.forEach((item, i) => {
    const realIdx = i === 0 ? 0 : i;
    const marginEl = document.getElementById(`imargin-${realIdx}-${idx}`);
    if(!marginEl || item.isFee || item.costPrice < 0) return;
    if(item.costPrice > 0){
      const margin = (item.price - item.costPrice) * Math.abs(item.qty);
      marginEl.textContent = item.qty < 0
        ? `↩️ 반품 ${Math.abs(item.qty)}통`
        : margin >= 0
          ? `마진 ${margin.toLocaleString()}원 (+${(item.price-item.costPrice).toLocaleString()}원/통)`
          : `⚠️ 손실 ${Math.abs(margin).toLocaleString()}원`;
      marginEl.style.color = item.qty < 0 ? 'var(--o)' : margin >= 0 ? 'var(--g)' : 'var(--r)';
    }
  });

  let oilTotal = 0, oilMargin = 0;
  items.forEach(item => {
    if(item.isFee || item.costPrice < 0){
      oilMargin += Math.abs(item.costPrice) * Math.abs(item.qty);
    } else {
      oilTotal += item.price * item.qty;
      oilMargin += (item.price - item.costPrice) * item.qty;
    }
  });

  let wastePay = 0, wasteRev = 0, wasteKg = 0;
  if(wasteOn){
    if(wasteMode === 'calc'){
      wasteKg = parseFloat(document.getElementById(`iwkg-${idx}`)?.value)||0;
      const wp = parseFloat(document.getElementById(`iwprice-${idx}`)?.value)||getWastePriceAt(t);
      wastePay = Math.round(wasteKg * wp);
      wasteRev = Math.round(wasteKg * (getWastePriceAt(t) - wp));
    } else {
      wastePay = parseFloat(document.getElementById(`iwdirect-${idx}`)?.value)||0;
    }
  }

  // 미수 차감
  const misuDeduct = misuOn
    ? (parseFloat(document.getElementById(`imisuamt-${idx}`)?.value) || 0) || (oilTotal - wastePay)
    : 0;

  const charge = oilTotal - wastePay - misuDeduct;
  const totalProfit = oilMargin + wasteRev;

  // 결과 표시
  const resultEl = document.getElementById(`inline-result-${idx}`);
  if(!resultEl) return;
  if(items.length === 0 && !wasteOn){ resultEl.style.display='none'; return; }
  resultEl.style.display = 'block';
  resultEl.innerHTML = `
    ${oilTotal>0?`<div style="display:flex;justify-content:space-between;padding:3px 0;"><span style="font-size:11px;color:var(--t2);">식유금액</span><span style="font-family:'JetBrains Mono',monospace;font-size:12px;">${oilTotal.toLocaleString()}원</span></div>`:''}
    ${wastePay>0?`<div style="display:flex;justify-content:space-between;padding:3px 0;"><span style="font-size:11px;color:var(--t2);">폐유지급</span><span style="font-family:'JetBrains Mono',monospace;font-size:12px;color:var(--o);">-${wastePay.toLocaleString()}원</span></div>`:''}
    ${misuDeduct>0?`<div style="display:flex;justify-content:space-between;padding:3px 0;"><span style="font-size:11px;color:var(--t2);">미수차감</span><span style="font-family:'JetBrains Mono',monospace;font-size:12px;color:var(--r);">-${misuDeduct.toLocaleString()}원</span></div>`:''}
    <div style="display:flex;justify-content:space-between;padding:6px 0;border-top:1px solid var(--border);margin-top:3px;">
      <span style="font-size:13px;font-weight:700;">청구</span>
      <span style="font-family:'JetBrains Mono',monospace;font-size:16px;font-weight:700;color:${charge>=0?'var(--y)':'var(--r)'};">${charge.toLocaleString()}원</span>
    </div>
    <div style="display:flex;justify-content:space-between;padding:3px 0;">
      <span style="font-size:11px;color:var(--t2);">수익</span>
      <span style="font-family:'JetBrains Mono',monospace;font-size:12px;color:var(--g);">${totalProfit.toLocaleString()}원</span>
    </div>`;
}

async function saveInlineDelivery(name, idx){
  const t = today();
  const items = getInlineItems(idx);
  const wasteOn   = inlineWasteOn[idx] || false;
  const wasteMode = inlineWasteMode[idx] || 'calc';
  const pay       = inlinePay[idx] || '';
  const misuOn    = inlineMisuOn[idx] || false;

  if(items.length === 0 && !wasteOn){ showToast('품목 또는 폐유를 입력해주세요'); return; }
  if(!pay){ showToast('수금 방법을 선택해주세요'); return; }

  let oilTotal = 0, oilMargin = 0;
  items.forEach(item => {
    if(item.isFee || item.costPrice < 0) oilMargin += Math.abs(item.costPrice) * Math.abs(item.qty);
    else { oilTotal += item.price * item.qty; oilMargin += (item.price - item.costPrice) * item.qty; }
  });

  let wastePay = 0, wasteRev = 0, wasteKg = 0, wastePriceVal = 0;
  if(wasteOn){
    if(wasteMode === 'calc'){
      wasteKg = parseFloat(document.getElementById(`iwkg-${idx}`)?.value)||0;
      wastePriceVal = parseFloat(document.getElementById(`iwprice-${idx}`)?.value)||getWastePriceAt(t);
      wastePay = Math.round(wasteKg * wastePriceVal);
      wasteRev = Math.round(wasteKg * (getWastePriceAt(t) - wastePriceVal));
    } else {
      wastePay = parseFloat(document.getElementById(`iwdirect-${idx}`)?.value)||0;
    }
  }

  const misuDeduct = misuOn
    ? (parseFloat(document.getElementById(`imisuamt-${idx}`)?.value)||0) || (oilTotal - wastePay)
    : 0;

  const charge = oilTotal - wastePay - misuDeduct;
  const payAmt = parseFloat(document.getElementById(`ipayamt-${idx}`)?.value)||0;
  const note   = document.getElementById(`inote-${idx}`)?.value||'';

  // tx 구조 — 기존과 완전히 동일
  const tx = {
    id: `${t}_${EMP}_${name}_${Date.now()}`,
    날짜: t,
    시간: new Date().toLocaleTimeString('ko-KR', {hour:'2-digit', minute:'2-digit'}),
    직원: EMP, 거래처: name,
    유종: items.map(i => i.type).filter(Boolean).join('/'),
    품목상세: JSON.stringify(items.map(i => ({type:i.type, qty:i.qty, price:i.price}))),
    통수: items.reduce((s,i) => s + i.qty, 0),
    판매단가: items.length===1 ? items[0].price : 0,
    출고가: items.length===1 ? (items[0].costPrice||0) : 0,
    폐유kg: wasteKg, 폐유매입단가: wastePriceVal,
    식유금액: oilTotal, 폐유매입금: wastePay, 차감청구: charge,
    식유마진: oilMargin, 폐유수익: wasteRev, 총수익: oilMargin + wasteRev,
    수금방법: pay, 수금액: payAmt,
    미수: pay==='미수' || pay==='반품',
    비고: note
  };

  // 로컬 먼저
  txList.unshift(tx);
  const cutoff = new Date(); cutoff.setDate(cutoff.getDate()-7);
  localStorage.setItem(`tx_${EMP}_v3`, JSON.stringify(
    txList.filter(x=>x.날짜>=cutoff.toISOString().slice(0,10)).slice(0,500)
  ));

  // 반품 → 차량재고 복귀
  items.filter(i=>i.qty<0).forEach(ri => {
    const todayCargos = JSON.parse(localStorage.getItem(`cargo_today_${EMP}`)||'[]');
    const ex = todayCargos.find(c=>c.유종===ri.type&&c.거래처===name);
    if(ex) ex.통수 = Math.max(0, ex.통수 + Math.abs(ri.qty));
    else todayCargos.push({거래처:'', 유종:ri.type, 통수:Math.abs(ri.qty), 반품이월:true});
    localStorage.setItem(`cargo_today_${EMP}`, JSON.stringify(todayCargos));
  });

  if(!completedRoutes.includes(name)) completedRoutes.push(name);
  localStorage.setItem(`done_${EMP}_${t}`, JSON.stringify(completedRoutes));

  // 현금/폐유 자동 입금
  const s = stores.find(x=>x.이름===name);
  if(pay==='현금'&&payAmt>0)
    await savePayment({거래처:name,금액:payAmt,날짜:t,입금자명:s?.입금자||name,방법:'현금',비고:'현장현금수령'});
  if((pay==='현금지급'||pay==='이체지급')&&wastePay>0)
    await savePayment({거래처:name,금액:-wastePay,날짜:t,입금자명:'폐유대금',방법:pay==='이체지급'?'계좌이체':'현금지급',비고:'폐유대금지급'});

  await safeFetch({type:'tx', tx}, () => {
    closeInlineForm(idx);
    showDeliverySuccess(name);
    renderRoute();
    updateDailyBar();
    showReceiptButton(tx);
  });
}

// ══════════════ DOM 보완 - son/bak.html HTML에 없는 엘리먼트 동적 생성 ══════════════
(function fixEmpDOMIssues(){
  const fix = () => {
    // hist-month-label이 없으면 내역탭 헤더에 동적 추가
    if(!document.getElementById('hist-month-label')){
      const hdr = document.querySelector('#page-history .page-hdr > div');
      if(hdr){
        const lbl = document.createElement('div');
        lbl.id = 'hist-month-label';
        lbl.style.cssText = 'font-size:11px;color:var(--t3)';
        hdr.appendChild(lbl);
        // 값 채우기
        const now = new Date();
        lbl.textContent = `${now.getFullYear()}-${String(now.getMonth()+1).padStart(2,'0')}`;
      }
    }
    // price-search input 숨기기
    const priceSearch = document.getElementById('price-search');
    if(priceSearch){
      const wrap = priceSearch.closest('.inp-wrap');
      if(wrap) wrap.style.display = 'none';
    }
  };
  if(document.readyState === 'complete' || document.readyState === 'interactive'){
    setTimeout(fix, 50);
  } else {
    document.addEventListener('DOMContentLoaded', () => setTimeout(fix, 50));
  }
})();

// ══════════════ 3단계: 계근/상차 여러 번 가능 ══════════════
const _origSaveCheckin2 = typeof saveCheckin === 'function' ? saveCheckin : null;

async function saveCheckin(){
  if(_origSaveCheckin2) await _origSaveCheckin2();
  setTimeout(() => renderCheckinAddBtn(), 200);
}

function renderCheckinAddBtn(){
  if(document.getElementById('checkin-add-btn')) return;
  const history = document.getElementById('checkin-history');
  if(!history) return;
  const btn = document.createElement('button');
  btn.id = 'checkin-add-btn';
  btn.className = 'btn-add';
  btn.style.marginTop = '10px';
  btn.textContent = '+ 오후 계근 / 상차 추가';
  btn.onclick = () => {
    if(typeof pallets !== 'undefined') pallets.length = 0;
    if(typeof cargos !== 'undefined') cargos.length = 0;
    if(typeof palletId !== 'undefined') window.palletId = 0;
    if(typeof cargoId !== 'undefined') window.cargoId = 0;
    const palletList = document.getElementById('pallet-list');
    const cargoList = document.getElementById('cargo-list');
    const wasteBox = document.getElementById('waste-total-box');
    const stockSummary = document.getElementById('stock-summary');
    const summaryBar = document.getElementById('checkin-summary-bar');
    if(palletList) palletList.innerHTML = '';
    if(cargoList) cargoList.innerHTML = '';
    if(wasteBox) wasteBox.style.display = 'none';
    if(stockSummary) stockSummary.style.display = 'none';
    if(summaryBar) summaryBar.style.display = 'none';
    btn.remove();
    document.getElementById('page-checkin')?.scrollTo({top:0, behavior:'smooth'});
    if(typeof showToast === 'function') showToast('📦 추가 계근/상차 입력 가능합니다');
  };
  history.insertAdjacentElement('afterend', btn);
}

// ── renderCheckinHistory 추가 기능 (무한루프 없이) ──
(function safeRCHPatch(){
  let _done = false;
  function _patch(){
    if(_done || typeof renderCheckinHistory !== 'function') return;
    _done = true;
    const _orig = renderCheckinHistory;
    window.renderCheckinHistory = function(){
      _orig.call(this);
      try{
        const _t = typeof today==='function' ? today() : new Date().toISOString().slice(0,10);
        const _emp = typeof EMP!=='undefined' ? EMP : '';
        const _logs = JSON.parse(localStorage.getItem('checkin_log_'+_emp+'_'+_t)||'[]');
        if(_logs.length>0) setTimeout(renderCheckinAddBtn, 100);
        if(typeof renderCheckinDaySummary==='function') renderCheckinDaySummary(_logs);
      }catch(e){}
    };
  }
  setTimeout(_patch, 300);
  document.addEventListener('DOMContentLoaded', ()=>setTimeout(_patch,100));
})();

function renderCheckinDaySummary(logs){
  if(!logs || !logs.length) return;
  let summaryEl = document.getElementById('checkin-day-summary');
  if(!summaryEl){
    summaryEl = document.createElement('div');
    summaryEl.id = 'checkin-day-summary';
    summaryEl.style.cssText = 'background:var(--card2);border:1px solid var(--border);border-radius:12px;padding:11px 13px;margin-bottom:10px;';
    const pageHdr = document.querySelector('#page-checkin .page-hdr');
    if(pageHdr) pageHdr.insertAdjacentElement('afterend', summaryEl);
  }
  let totalKg=0, totalIncome=0, totalPallets=0;
  const stockMap={};
  logs.forEach(log => {
    totalKg += log.폐유?.실중량 || 0;
    totalIncome += log.폐유?.수입 || 0;
    totalPallets += log.폐유?.파레트수 || 0;
    (log.상차||[]).forEach(c => { if(c.유종&&c.통수) stockMap[c.유종]=(stockMap[c.유종]||0)+c.통수; });
  });
  const stockText = Object.entries(stockMap).map(([t,q])=>`${t} ${q}통`).join(' · ')||'없음';
  summaryEl.innerHTML = `
    <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:8px;">
      <div style="font-size:10px;font-weight:700;color:var(--t3);letter-spacing:.1em;">오늘 누적 (${logs.length}회 저장)</div>
    </div>
    <div style="display:grid;grid-template-columns:1fr 1fr;gap:8px;">
      <div style="background:rgba(255,159,67,.06);border:1px solid rgba(255,159,67,.15);border-radius:9px;padding:9px 11px;">
        <div style="font-size:10px;color:var(--t2);margin-bottom:3px;">♻️ 폐유 누적</div>
        <div style="font-family:'JetBrains Mono',monospace;font-size:15px;font-weight:700;color:var(--o);">${totalKg.toFixed(1)}kg</div>
        <div style="font-size:10px;color:var(--g);margin-top:2px;">${totalIncome.toLocaleString()}원</div>
      </div>
      <div style="background:rgba(108,143,255,.06);border:1px solid rgba(108,143,255,.15);border-radius:9px;padding:9px 11px;">
        <div style="font-size:10px;color:var(--t2);margin-bottom:3px;">🚛 상차 누적</div>
        <div style="font-size:12px;font-weight:700;color:var(--p);line-height:1.4;">${stockText}</div>
      </div>
    </div>`;
}

(function initCheckinAddBtn2(){
  const fix = () => {
    const t = typeof today === 'function' ? today() : new Date().toISOString().slice(0,10);
    const empName = typeof EMP !== 'undefined' ? EMP : '';
    const logs = JSON.parse(localStorage.getItem(`checkin_log_${empName}_${t}`) || '[]');
    if(logs.length > 0) setTimeout(renderCheckinAddBtn, 500);
  };
  if(document.readyState === 'complete') fix();
  else document.addEventListener('DOMContentLoaded', fix);
})();

// ══════════════ 긴급배정 감지 ══════════════
let _lastUrgentCheck = '';

function checkUrgentAssignments(){
  if(typeof stores === 'undefined') return;
  const t = typeof today === 'function' ? today() : new Date().toISOString().slice(0,10);
  const empName = typeof EMP !== 'undefined' ? EMP : '';
  const urgent = stores.filter(s =>
    s.배정상태 === '긴급배정' &&
    s.배정날짜 === t &&
    (s.배정직원 === empName || s.담당 === empName) &&
    s.상태 !== '비활성' &&
    (typeof completedRoutes === 'undefined' || !completedRoutes.includes(s.이름))
  );
  if(!urgent.length) return;
  const urgentKey = urgent.map(s=>s.이름).sort().join(',');
  if(urgentKey === _lastUrgentCheck) return;
  _lastUrgentCheck = urgentKey;
  if(typeof renderRoute === 'function') renderRoute();
  if(typeof showToast === 'function') showToast(`🚨 긴급 배정 ${urgent.length}건 — ${urgent.map(s=>s.이름).join(', ')}`);
}

(function startUrgentCheck2(){
  setTimeout(checkUrgentAssignments, 2000);
  setInterval(checkUrgentAssignments, 30000);
})();

// ══════════════ getRouteList 오버라이드 — 미배정=공유, 대리납품 ══════════════
(function patchGetRouteList(){
  function _patch(){
    if(typeof getRouteList !== 'function') return;
    const _orig = getRouteList;
    window.getRouteList = function(){
      try{
        const _cargos = JSON.parse(localStorage.getItem('cargo_today_'+EMP)||'[]');
        const _t = typeof today==='function' ? today() : new Date().toISOString().slice(0,10);
        const _day = ['일','월','화','수','목','금','토'][new Date().getDay()];
        const _skip = JSON.parse(localStorage.getItem('skip_'+EMP+'_'+_t)||'[]');
        const _st = typeof stores!=='undefined' ? stores : [];

        const dispatched = _st.filter(s=>
          s.배정상태==='긴급배정' && s.배정날짜===_t &&
          (s.배정직원===EMP||s.담당===EMP) && s.상태!=='비활성'
        ).map(s=>s.이름);

        const mine = _st.filter(s=>
          s.상태!=='비활성' && s.담당===EMP && (!s.요일||s.요일===_day)
        ).map(s=>s.이름);

        const shared = _st.filter(s=>
          s.상태!=='비활성' &&
          (!s.담당||s.담당===''||s.담당==='공유') &&
          (!s.요일||s.요일===_day)
        ).map(s=>s.이름);

        const others = _st.filter(s=>
          s.상태!=='비활성' && s.담당 &&
          s.담당!==EMP && s.담당!=='공유' && s.요일===_day
        ).map(s=>s.이름);

        const cargoNames = _cargos.filter(c=>c.거래처).map(c=>c.거래처);

        const all = [...new Set([...dispatched,...cargoNames,...mine,...shared,...others])]
          .filter(n=>!_skip.includes(n));

        const ordered = [];
        if(typeof routeOrder!=='undefined'){
          routeOrder.forEach(n=>{ if(all.includes(n)) ordered.push(n); });
        }
        all.forEach(n=>{ if(!ordered.includes(n)) ordered.push(n); });
        return ordered;
      }catch(e){
        return _orig();
      }
    };
  }
  setTimeout(_patch, 400);
  document.addEventListener('DOMContentLoaded', ()=>setTimeout(_patch,200));
})();

// ══════════════ 앱 시작 스플래시 + 동기화 UI ══════════════
(function initAppSplash(){
  if(document.getElementById('app-splash')) return;

  const splash = document.createElement('div');
  splash.id = 'app-splash';
  splash.style.cssText = 'position:fixed;inset:0;z-index:99999;background:#0f1117;display:flex;flex-direction:column;align-items:center;justify-content:center;font-family:"Noto Sans KR",sans-serif;transition:opacity .4s ease;';
  
  const empName = typeof EMP !== 'undefined' ? EMP : '직원';
  
  splash.innerHTML = `
    <div style="margin-bottom:32px;text-align:center;">
      <div style="font-size:24px;font-weight:900;color:#e8eaf0;letter-spacing:-.5px;">제이제이컴퍼니</div>
      <div style="font-size:12px;color:#7a7f94;margin-top:8px;">${empName}</div>
    </div>
    <div id="spl-icon" style="width:48px;height:48px;border:3px solid #2a2f3d;border-top-color:#6c8fff;border-radius:50%;animation:splspin .8s linear infinite;margin-bottom:18px;"></div>
    <div id="spl-msg" style="font-size:14px;color:#7a7f94;font-weight:500;">서버 연결 중...</div>
    <div id="spl-sub" style="font-size:11px;color:#3a3f52;margin-top:6px;min-height:16px;"></div>
    <button id="spl-btn" onclick="window._dismissSplash()"
      style="display:none;margin-top:24px;padding:12px 32px;background:transparent;border:1.5px solid #3a3f52;border-radius:10px;color:#7a7f94;font-size:13px;cursor:pointer;font-family:'Noto Sans KR',sans-serif;">
      오프라인으로 시작
    </button>
    <style>
      @keyframes splspin{to{transform:rotate(360deg);}}
      @keyframes splcheck{0%{transform:scale(.4);opacity:0}60%{transform:scale(1.15)}100%{transform:scale(1);opacity:1}}
    </style>`;
  
  document.body.appendChild(splash);

  window._dismissSplash = function(){
    const el = document.getElementById('app-splash');
    if(!el) return;
    el.style.opacity = '0';
    setTimeout(()=>{ el.remove(); }, 400);
  };

  window._setSplash = function(status, msg, sub){
    const icon = document.getElementById('spl-icon');
    const msgEl = document.getElementById('spl-msg');
    const subEl = document.getElementById('spl-sub');
    const btn   = document.getElementById('spl-btn');
    if(msgEl) msgEl.textContent = msg || '';
    if(subEl) subEl.textContent = sub || '';
    if(status === 'success'){
      if(icon){ icon.style.cssText='width:48px;height:48px;'; icon.innerHTML='<svg viewBox="0 0 48 48" width="48" height="48"><circle cx="24" cy="24" r="21" fill="none" stroke="#3ddc84" stroke-width="3"/><path d="M14 24l7 7 13-13" fill="none" stroke="#3ddc84" stroke-width="3" stroke-linecap="round" stroke-linejoin="round"/></svg>'; icon.style.animation='splcheck .35s ease'; }
      if(msgEl){ msgEl.style.color='#3ddc84'; }
      if(btn) btn.style.display='none';
      setTimeout(window._dismissSplash, 900);
    } else if(status === 'offline'){
      if(icon){ icon.style.cssText='width:48px;height:48px;font-size:36px;text-align:center;line-height:48px;'; icon.textContent='📴'; }
      if(msgEl){ msgEl.textContent='오프라인 모드'; msgEl.style.color='#ff9f43'; }
      if(subEl) subEl.textContent = sub || '저장된 데이터로 시작합니다';
      if(btn) btn.style.display='block';
    } else if(status === 'error'){
      if(icon){ icon.style.cssText='width:48px;height:48px;font-size:36px;text-align:center;line-height:48px;'; icon.textContent='⚠️'; }
      if(msgEl){ msgEl.style.color='#ff6b6b'; }
      if(btn) btn.style.display='block';
    }
  };

  // 10초 후 자동으로 오프라인 버튼 표시
  setTimeout(()=>{
    const btn = document.getElementById('spl-btn');
    if(btn && btn.style.display==='none'){
      btn.style.display='block';
      const sub = document.getElementById('spl-sub');
      if(sub) sub.textContent='연결이 오래 걸리고 있어요';
    }
  }, 10000);
})();

// ── init 오버라이드 — 스플래시 연동 ──
const _origInitSplash = typeof init === 'function' ? init : null;

async function init(){
  if(typeof window._setSplash === 'function') window._setSplash('loading', '서버 연결 중...');
  try{
    if(_origInitSplash) await _origInitSplash();
    if(typeof window._setSplash === 'function') window._setSplash('success', '동기화 완료');
  }catch(e){
    const offline = !navigator.onLine || (e.message||'').includes('timed out') || (e.message||'').includes('fetch');
    if(typeof window._setSplash === 'function'){
      window._setSplash(offline ? 'offline' : 'error', offline ? '오프라인 모드' : '연결 실패', (e.message||'').slice(0,50));
    }
    // 에러여도 로컬 데이터로 계속 실행
    try{ if(typeof renderRoute==='function') renderRoute(); }catch(e2){}
    try{ if(typeof renderPriceTab==='function') renderPriceTab(); }catch(e2){}
  }
}
