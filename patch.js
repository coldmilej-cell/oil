// patch.js - son.html / bak.html 누락 함수 패치
// GitHub Pages에 올리고, son.html/bak.html의 </body> 바로 앞에
// <script src="patch.js"></script> 한 줄 추가하면 됩니다.
//
// 포함된 함수:
// - renderCarryOver()    : 출근탭 이월재고 표시
// - updateDailyBar()     : 납품탭 하단 현황바
// - loadStoreInfo()      : 거래처 미수금 조회
// - openNewStore()       : 신규 거래처 모달 열기
// - closeModal()         : 모달 닫기
// - saveNewStore()       : 신규 거래처 저장
// - renderPriceTab()     : 단가탭 렌더링
// - buildReceipt()       : 명세서 텍스트 생성
// - showReceiptButton()  : 납품 직후 명세서 버튼
// - copyReceipt()        : 명세서 클립보드 복사
// - deletePayment()      : 입금 삭제
// - downloadTemplate()   : 엑셀 양식 다운로드
// - batchCopyReceipts()  : 날짜별 전체 명세서 복사

// ── 이월재고 표시 ──
function renderCarryOver(){
  const cargos = JSON.parse(localStorage.getItem(`cargo_today_${EMP}`) || '[]');
  const sec = document.getElementById('carry-over-section');
  const el = document.getElementById('carry-over-list');
  if(!sec || !el) return;
  // 어제 미납품 물량 = cargo_today 중 납품 완료 안 된 것
  // 사실상 cargo_today 전체가 오늘 상차분이므로 날짜 넘어오면 이월재고
  const lastDate = localStorage.getItem(`last_date_${EMP}`) || today();
  const isCarryOver = lastDate !== today(); // 날짜 다르면 이월
  if(!isCarryOver || !cargos.length) { sec.style.display = 'none'; return; }
  sec.style.display = 'block';
  // 유종별 합산
  const stockMap = {};
  cargos.forEach(c => {
    if(!c.유종 || !c.통수) return;
    stockMap[c.유종] = (stockMap[c.유종] || 0) + c.통수;
  });
  el.innerHTML = Object.entries(stockMap).map(([type, qty]) => `
    <div style="background:rgba(108,143,255,.06);border:1px solid rgba(108,143,255,.15);border-radius:10px;padding:10px 12px;margin-bottom:6px;display:flex;justify-content:space-between;align-items:center">
      <span style="font-size:13px;font-weight:600;color:var(--t2)">${type}</span>
      <span style="font-family:'JetBrains Mono',monospace;font-size:16px;font-weight:700;color:var(--p)">${qty}통</span>
    </div>`).join('');
}

// ── 하단 현황바 업데이트 ──
function updateDailyBar(){
  const savedCargos = JSON.parse(localStorage.getItem(`cargo_today_${EMP}`) || '[]');
  const t = today();
  // 상차 총통수
  const loaded = savedCargos.reduce((s, c) => s + (c.통수 || 0), 0);
  // 오늘 납품 완료 통수
  const doneTx = txList.filter(x => x.날짜 === t && x.직원 === EMP);
  const doneQty = doneTx.reduce((s, x) => s + Math.max(0, x.통수 || 0), 0);
  const remainQty = Math.max(0, loaded - doneQty);
  // 수거 폐유 kg
  const wasteKg = doneTx.reduce((s, x) => s + (x.폐유kg || 0), 0);

  const barEl = document.getElementById('daily-bar');
  if(!barEl) return;

  const loadedEl = document.getElementById('bar-loaded');
  const doneRemEl = document.getElementById('bar-done-remain');
  const wasteEl = document.getElementById('bar-waste-kg');

  if(loadedEl) loadedEl.textContent = loaded || '-';
  if(doneRemEl){
    doneRemEl.innerHTML = `<span style="color:var(--g)">${doneQty}</span> / <span style="color:var(--t2)">${remainQty}</span>`;
  }
  if(wasteEl) wasteEl.textContent = wasteKg > 0 ? wasteKg.toFixed(1) : '-';
}

// ── 거래처 미수금 / 최근납품 조회 ──
async function loadStoreInfo(storeName){
  const infoBox = document.getElementById('store-info-box');
  const loadingEl = document.getElementById('store-misu-loading');
  const misuEl = document.getElementById('store-misu-amt');
  const recentEl = document.getElementById('store-recent-tx');
  const accountBox = document.getElementById('store-account-box');

  if(!infoBox) return;
  infoBox.style.display = 'block';
  if(loadingEl) loadingEl.textContent = '조회중...';
  if(misuEl) misuEl.textContent = '-';

  // 거래처 계좌 표시
  const s = stores.find(x => x.이름 === storeName);
  if(s?.계좌 && accountBox){
    accountBox.style.display = 'block';
    const accountTxt = document.getElementById('store-account-txt');
    const payerTxt = document.getElementById('store-payer-txt');
    if(accountTxt) accountTxt.textContent = s.계좌;
    if(payerTxt) payerTxt.textContent = s.입금자 || '-';
  } else if(accountBox){
    accountBox.style.display = 'none';
  }

  try{
    const now = new Date();
    const res = await fetch(`${API}?type=misu&store=${encodeURIComponent(storeName)}&year=${now.getFullYear()}&month=${now.getMonth()+1}`);
    const d = await res.json();
    const misu = d.미수잔액 || 0;
    window.curStoreMisu = misu;
    if(misuEl){
      misuEl.textContent = misu > 0 ? misu.toLocaleString() + '원' : '없음';
      misuEl.style.color = misu > 0 ? 'var(--r)' : 'var(--g)';
    }
    if(loadingEl) loadingEl.textContent = '';
  } catch(e){
    window.curStoreMisu = 0;
    if(loadingEl) loadingEl.textContent = '조회실패';
  }

  // 최근 납품 (로컬에서)
  if(recentEl){
    const recent = txList.filter(x => x.거래처 === storeName).slice(0, 1)[0];
    if(recent){
      recentEl.textContent = `${recent.날짜} · ${recent.유종 || ''} ${recent.통수}통 · ${(+recent.차감청구||0).toLocaleString()}원`;
    } else {
      recentEl.textContent = '납품 내역 없음';
    }
  }

  updatePayButtons();
}

// ── 신규 거래처 모달 열기 ──
function openNewStore(prefill){
  const modal = document.getElementById('new-store-modal');
  const sub = document.getElementById('ns-sub');
  const nameEl = document.getElementById('ns-name');
  if(!modal) return;
  if(nameEl) nameEl.value = prefill || '';
  if(sub) sub.textContent = prefill ? `"${prefill}" 으로 신규 거래처를 추가합니다` : '새 거래처를 추가하세요';
  buildNsTypeOptions();
  modal.classList.add('show');
  setTimeout(() => nameEl?.focus(), 100);
}

function closeModal(id){
  const el = document.getElementById(id);
  if(el) el.classList.remove('show');
}

// ── 신규 거래처 저장 ──
async function saveNewStore(){
  const 이름 = document.getElementById('ns-name')?.value.trim();
  const 요일 = document.getElementById('ns-day')?.value || '';
  const 유종 = document.getElementById('ns-type')?.value || '';
  const 연락처 = document.getElementById('ns-phone')?.value.trim() || '';
  const 입금자 = document.getElementById('ns-payer')?.value.trim() || '';
  const 계좌 = document.getElementById('ns-account')?.value.trim() || '';
  const 비고 = document.getElementById('ns-note')?.value.trim() || '';

  if(!이름){ showToast('거래처명을 입력해주세요'); return; }

  // 중복 체크
  if(stores.find(s => s.이름 === 이름)){
    showToast('⚠️ 이미 있는 거래처예요');
    // 기존 거래처로 바로 선택
    closeModal('new-store-modal');
    selectStore(이름);
    return;
  }

  // 코드 자동생성
  const maxCode = stores.reduce((max, s) => {
    const n = parseInt((s.코드 || 'C000').replace('C', '')) || 0;
    return Math.max(max, n);
  }, 0);
  const 코드 = `C${String(maxCode + 1).padStart(3, '0')}`;

  const store = { 코드, 이름, 담당: EMP, 요일, 유종, 연락처, 입금자, 비고 };

  try{
    const res = await fetch(API, {
      method: 'POST',
      headers: { 'Content-Type': 'text/plain' },
      body: JSON.stringify({ type: 'store_add', store })
    });
    const d = await res.json();
    if(d.ok === false){ showToast('⚠️ ' + d.error); return; }
  } catch(e){
    showToast('⚠️ 서버 저장 실패 - 로컬에만 추가');
  }

  // 로컬에 즉시 추가
  stores.push(store);
  localStorage.setItem('stores_v3', JSON.stringify(stores));

  showToast(`✅ "${이름}" 추가됐어요!`);
  closeModal('new-store-modal');

  // 납품폼에서 바로 선택
  selectStore(이름);
}

// ── 단가탭 렌더링 ──
function renderPriceTab(){
  const q = (document.getElementById('price-search')?.value || '').trim().toLowerCase();
  const t = today();

  // 폐유 단가 카드
  const wpCur = document.getElementById('wp-cur');
  const wpCurDate = document.getElementById('wp-cur-date');
  const wpPrev = document.getElementById('wp-prev');
  const wpPrevDate = document.getElementById('wp-prev-date');
  const wpDiff = document.getElementById('wp-diff');

  const sorted = [...wastePriceHistory].sort((a, b) => b.날짜.localeCompare(a.날짜));
  if(sorted.length > 0){
    const cur = sorted[0];
    if(wpCur) wpCur.textContent = (+cur.단가).toLocaleString() + '원/kg';
    if(wpCurDate) wpCurDate.textContent = cur.날짜 + ' 부터';
    if(sorted.length > 1){
      const prev = sorted[1];
      if(wpPrev) wpPrev.textContent = (+prev.단가).toLocaleString() + '원/kg';
      if(wpPrevDate) wpPrevDate.textContent = prev.날짜 + ' 부터';
      const diff = +cur.단가 - +prev.단가;
      if(wpDiff) wpDiff.innerHTML = `<span style="font-size:13px;font-weight:700;color:${diff > 0 ? 'var(--g)' : 'var(--r)'}">${diff > 0 ? '▲' : '▼'} ${Math.abs(diff).toLocaleString()}원</span>`;
    }
  }

  // 식용유 단가 목록
  const el = document.getElementById('price-list');
  if(!el) return;

  // 품목별 최신 단가
  const latest = {};
  priceHistory.forEach(p => {
    if(!latest[p.품명] || new Date(p.날짜) >= new Date(latest[p.품명].날짜)){
      latest[p.품명] = p;
    }
  });

  let items = Object.values(latest);
  if(q) items = items.filter(p => p.품명.toLowerCase().includes(q));
  items.sort((a, b) => a.품명.localeCompare(b.품명, 'ko'));

  if(!items.length){
    el.innerHTML = '<div style="text-align:center;padding:30px;color:var(--t3)">단가 정보 없음</div>';
    return;
  }

  el.innerHTML = items.map(p => {
    const isFee = p.구분 === '수수료';
    const tagColor = isFee ? 'var(--r)' : 'var(--p)';
    const tagBg = isFee ? 'rgba(255,107,107,.1)' : 'rgba(108,143,255,.1)';
    return `
    <div style="background:var(--card);border:1px solid var(--border);border-radius:11px;padding:12px 14px;margin-bottom:7px;display:flex;justify-content:space-between;align-items:center">
      <div>
        <div style="font-size:13px;font-weight:700">${p.품명}
          ${p.구분 ? `<span style="font-size:9px;font-weight:700;padding:2px 6px;border-radius:5px;background:${tagBg};color:${tagColor};margin-left:4px">${p.구분}</span>` : ''}
        </div>
        <div style="font-size:10px;color:var(--t3);margin-top:2px">${p.날짜} 기준</div>
      </div>
      <div style="font-family:'JetBrains Mono',monospace;font-size:15px;font-weight:700;color:var(--y)">${(+p.출고가).toLocaleString()}원</div>
    </div>`;
  }).join('');
}

// ── 명세서 생성 ──
function buildReceipt(tx){
  const storeName = tx.거래처 || '';
  const date = tx.날짜 || '';
  const misu = window.curStoreMisu || 0;

  let lines = [];
  lines.push(`[${storeName}] 납품 명세서`);
  lines.push(`📅 ${date}`);
  lines.push('');

  // 품목 상세
  try{
    const details = JSON.parse(tx.품목상세 || '[]');
    if(details.length > 0){
      details.forEach(d => {
        const cost = getPriceAt(d.type, date) || 0;
        const isFee = isFeeItem(d.type, date);
        if(d.qty < 0){
          lines.push(`↩️ 반품 ${d.type} ${Math.abs(d.qty)}통`);
        } else if(isFee){
          lines.push(`${d.type} ${d.qty}통 (수수료)`);
        } else {
          lines.push(`${d.type} ${d.qty}통 × ${(+d.price).toLocaleString()}원 = ${(d.qty * d.price).toLocaleString()}원`);
        }
      });
    } else {
      if(tx.통수 > 0) lines.push(`${tx.유종 || ''} ${tx.통수}통 × ${(+tx.판매단가||0).toLocaleString()}원`);
    }
  } catch(e){
    if(tx.통수 > 0) lines.push(`${tx.유종 || ''} ${tx.통수}통`);
  }

  lines.push('');

  // 폐유
  if(+tx.폐유kg > 0){
    lines.push(`♻️ 폐유 수거 ${(+tx.폐유kg).toFixed(1)}kg`);
    lines.push(`폐유 지급액 -${(+tx.폐유매입금||0).toLocaleString()}원`);
  }

  lines.push('─────────────────');
  lines.push(`🧾 청구금액: ${(+tx.차감청구||0).toLocaleString()}원`);

  if(tx.수금방법 === '현금'){
    lines.push(`💵 현금수령: ${(+tx.수금액||0).toLocaleString()}원`);
  } else if(tx.수금방법 === '미수' || tx.미수){
    if(misu > 0){
      lines.push(`📌 누적 미수: ${misu.toLocaleString()}원`);
    } else {
      lines.push(`📌 미수 처리`);
    }
  }

  if(tx.비고) lines.push(`\n📝 ${tx.비고}`);

  return lines.join('\n');
}

// ── 납품 직후 명세서 버튼 표시 ──
function showReceiptButton(tx){
  window._lastTx = tx;
  // 기존 버튼 제거
  document.getElementById('receipt-btn-wrap')?.remove();
  const wrap = document.createElement('div');
  wrap.id = 'receipt-btn-wrap';
  wrap.style.cssText = 'position:fixed;bottom:90px;left:50%;transform:translateX(-50%);z-index:300;display:flex;gap:8px;';
  wrap.innerHTML = `
    <button onclick="copyReceipt()" style="padding:12px 20px;background:var(--p2);color:#fff;border:none;border-radius:12px;font-size:13px;font-weight:700;cursor:pointer;font-family:'Noto Sans KR',sans-serif;box-shadow:0 4px 20px rgba(0,0,0,.4)">
      📋 명세서 복사
    </button>
    <button onclick="document.getElementById('receipt-btn-wrap')?.remove()" style="padding:12px 16px;background:var(--card);border:1px solid var(--border);color:var(--t2);border-radius:12px;font-size:13px;cursor:pointer;font-family:'Noto Sans KR',sans-serif">
      ✕
    </button>`;
  document.body.appendChild(wrap);
  // 10초 후 자동 제거
  setTimeout(() => wrap.remove(), 10000);
}

// ── 명세서 복사 ──
async function copyReceipt(){
  const tx = window._lastTx;
  if(!tx){ showToast('명세서 데이터 없음'); return; }
  // 미수잔액 최신 조회
  try{
    const res = await fetch(`${API}?type=misu&store=${encodeURIComponent(tx.거래처)}&year=${new Date().getFullYear()}&month=${new Date().getMonth()+1}`);
    const d = await res.json();
    window.curStoreMisu = d.미수잔액 || 0;
  } catch(e){}
  const text = buildReceipt(tx);
  try{ await navigator.clipboard.writeText(text); }
  catch(e){
    const ta = document.createElement('textarea');
    ta.value = text; document.body.appendChild(ta);
    ta.select(); document.execCommand('copy');
    document.body.removeChild(ta);
  }
  markSent(tx.id);
  showToast('✅ 명세서 복사됐어요! 문자앱에 붙여넣기 하세요');
  document.getElementById('receipt-btn-wrap')?.remove();
}

// ── 입금 삭제 ──
async function deletePayment(id, storeName){
  if(!confirm(`${storeName} 입금을 삭제할까요?`)) return;
  const now = new Date();
  try{
    const res = await fetch(API, {
      method: 'POST',
      headers: { 'Content-Type': 'text/plain' },
      body: JSON.stringify({ type: 'delete_payment', id, year: now.getFullYear(), month: now.getMonth() + 1 })
    });
    const d = await res.json();
    if(d.ok === false){ showToast('⚠️ ' + d.error); return; }
  } catch(e){}
  todayPayments = todayPayments.filter(p => String(p.id) !== String(id));
  localStorage.setItem(`pay_${EMP}_today`, JSON.stringify(todayPayments));
  showToast('✅ 삭제됐어요');
  renderTodayPayments();
  calcSettlement();
}

// ── 엑셀 템플릿 다운로드 ──
function downloadTemplate(){
  // 간단한 CSV 양식
  const csv = '날짜,입금자,금액\n2026-03-27,홍길동,50000\n2026-03-27,김영희,80000';
  const blob = new Blob(['\uFEFF' + csv], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url; a.download = '입금내역_양식.csv';
  document.body.appendChild(a); a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}

// ── batchCopyReceipts (날짜 선택 없을 때 오늘 기준) ──
async function batchCopyReceipts(){
  const dateEl = document.getElementById('hist-date-sel');
  const date = dateEl?.value || today();
  await batchCopyReceiptsByDate(date);
}
