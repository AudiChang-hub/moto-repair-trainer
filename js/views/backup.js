/* 備份 / 換裝置:學習進度只存在各裝置的瀏覽器,這裡提供匯出與匯入 */
(function () {
  const { h, S } = APP;
  const b64 = (str) => btoa(unescape(encodeURIComponent(str)));
  const unb64 = (b) => decodeURIComponent(escape(atob(b)));

  // 合併:數字取大、布林取 OR、字串取較大(日期)、陣列(錯題本)依 id 聯集、物件遞迴
  function merge(a, b) {
    if (Array.isArray(a) && Array.isArray(b)) {
      const m = new Map(a.map((x) => [x && x.id != null ? x.id : JSON.stringify(x), x]));
      b.forEach((x) => { const k = x && x.id != null ? x.id : JSON.stringify(x); const o = m.get(k); m.set(k, o && typeof o === 'object' ? merge(o, x) : x); });
      return [...m.values()];
    }
    if (a && b && typeof a === 'object' && typeof b === 'object') {
      const out = Object.assign({}, a);
      for (const k of Object.keys(b)) out[k] = k in a ? merge(a[k], b[k]) : b[k];
      return out;
    }
    if (typeof a === 'number' && typeof b === 'number') return Math.max(a, b);
    if (typeof a === 'boolean' && typeof b === 'boolean') return a || b;
    if (typeof a === 'string' && typeof b === 'string') return a > b ? a : b;
    return b != null ? b : a;
  }
  function apply(data, mode) {
    const next = mode === 'merge' ? merge(JSON.parse(JSON.stringify(S)), data) : data;
    for (const k of Object.keys(S)) delete S[k];
    Object.assign(S, next);
    APP.save();
  }

  APP.views.backup = function (main) {
    main.append(h('h1', null, '📦 備份 / 換裝置'),
      h('p', { class: 'muted' }, '你的學習進度(已讀章節、題庫作答紀錄、錯題本…)只存在「這個瀏覽器」。換手機、換平板、換電腦,進度不會自動跟過去。用下面的方法搬過去即可,不需要任何帳號或網路服務。'));
    const box = h('textarea', { rows: 3, style: { width: '100%', marginTop: '10px', display: 'none' } });
    const stats = `${Object.keys(S.lessons).length} 章教材 · ${Object.keys(S.bank || {}).length} 題考照作答紀錄 · ${S.mistakes.length} 筆錯題`;
    main.append(h('div', { class: 'card' }, h('h2', { style: { marginTop: 0 } }, '① 匯出(從舊裝置)'), h('p', { class: 'muted small' }, '目前進度:' + stats),
      h('div', { class: 'row' },
        h('button', { class: 'btn primary', onclick: () => {
          const blob = new Blob([JSON.stringify({ app: 'moto-trainer', v: 1, at: new Date().toISOString(), data: S })], { type: 'application/json' });
          const a = h('a', { href: URL.createObjectURL(blob), download: `維修訓練場進度-${APP.today()}.json` }); document.body.append(a); a.click(); a.remove();
        } }, '⬇ 下載進度檔'),
        h('button', { class: 'btn', onclick: async () => {
          const code = 'MT1:' + b64(JSON.stringify(S));
          try { await navigator.clipboard.writeText(code); APP.toast('已複製進度代碼,可貼到 LINE / 備忘錄傳給自己'); } catch (e) { box.style.display = 'block'; box.value = code; box.select(); APP.toast('請手動複製下方文字'); }
        } }, '📋 複製進度代碼')),
      box));

    const imp = h('textarea', { rows: 4, placeholder: '把「進度代碼」貼在這裡(以 MT1: 開頭)', style: { width: '100%', padding: '10px', border: '1.5px solid var(--border)', borderRadius: '10px', background: 'var(--card)', color: 'var(--text)' } });
    const file = h('input', { type: 'file', accept: '.json,application/json' });
    const modeSel = h('select', { style: { padding: '8px', borderRadius: '8px', background: 'var(--card)', color: 'var(--text)', border: '1.5px solid var(--border)' } },
      h('option', { value: 'merge' }, '合併(保留兩邊較多的進度,推薦)'), h('option', { value: 'replace' }, '覆蓋(以匯入的為準)'));
    const done = (data) => { apply(data, modeSel.value); APP.toast('✅ 匯入完成'); setTimeout(() => location.reload(), 600); };
    main.append(h('div', { class: 'card' }, h('h2', { style: { marginTop: 0 } }, '② 匯入(在新裝置)'),
      h('p', { class: 'muted small' }, '貼上進度代碼,或選擇剛下載的進度檔。'),
      h('div', { class: 'row mb' }, h('span', null, '匯入方式:'), modeSel),
      imp, h('div', { class: 'row mt' }, h('button', { class: 'btn primary', onclick: () => {
        const t = imp.value.trim(); if (!t.startsWith('MT1:')) return APP.toast('代碼格式不對(要以 MT1: 開頭)');
        try { done(JSON.parse(unb64(t.slice(4)))); } catch (e) { APP.toast('代碼無法讀取,請確認有完整複製'); } } }, '匯入代碼')),
      h('hr', { style: { border: 0, borderTop: '1px dashed var(--border)', margin: '16px 0' } }), file));
    file.onchange = () => { const f = file.files[0]; if (!f) return; const r = new FileReader(); r.onload = () => { try { const o = JSON.parse(r.result); if (o.app !== 'moto-trainer') throw 0; done(o.data); } catch (e) { APP.toast('這不是有效的進度檔'); } }; r.readAsText(f); };
    main.append(h('div', { class: 'callout' }, h('div', { class: 'ttl' }, '小提醒'), h('p', null, '清除瀏覽器資料、或用「無痕視窗」,進度會消失。建議每週匯出一次當備份。')));
  };
})();
