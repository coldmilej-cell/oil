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
