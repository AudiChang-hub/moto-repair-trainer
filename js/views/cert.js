/* 考照練習:丙級 / 乙級 機器腳踏車修護 學科題庫(勞動部技能檢定中心公開題庫) */
(function () {
  const { h, S } = APP, D = APP.data;
  S.bank = S.bank || {};      // 每題紀錄 {r,w,box,due,flag,last}
  S.certDaily = S.certDaily || {};
  const INTERVALS = [0, 1, 2, 4, 8, 16];
  const LVNAME = { c: '丙級', b: '乙級' };
  const CIRC = ['①', '②', '③', '④'];
  const ansOf = (q) => String(q.ans).split('').map(Number);          // 官方答案(可能多個)
  const isMulti = (q) => ansOf(q).length > 1;
  const ansText = (q) => ansOf(q).map((n) => CIRC[n - 1]).join('');
  const sameSet = (picked, q) => picked.slice().sort().join('') === ansOf(q).slice().sort().join('');
  const daysFromNow = (n) => new Date(Date.now() + n * 86400000).toISOString().slice(0, 10);

  /* ---------- 題庫載入(用到才載入,首頁不會變慢) ---------- */
  const cache = {};
  APP.loadBank = function (lv) {
    const key = 'BANK_' + lv.toUpperCase();
    if (window[key]) return Promise.resolve(window[key]);
    if (cache[lv]) return cache[lv];
    cache[lv] = new Promise((res) => {
      const s = document.createElement('script');
      s.src = 'js/data/bank-' + lv + '.js';
      s.onload = () => res(window[key] || null);
      s.onerror = () => res(null);
      document.head.append(s);
    });
    return cache[lv];
  };

  /* ---------- 作答紀錄 ---------- */
  function record(q, ok) {
    const r = S.bank[q.id] || { r: 0, w: 0, box: 0 };
    if (ok) { r.r++; r.box = Math.min(5, (r.box || 0) + 1); r.due = daysFromNow(INTERVALS[r.box]); }
    else { r.w++; r.box = 1; r.due = APP.today(); }
    r.last = Date.now();
    S.bank[q.id] = r;
    const t = APP.today();
    S.certDaily[t] = (S.certDaily[t] || 0) + 1;
    APP.save();
  }
  const toggleFlag = (q) => { const r = S.bank[q.id] || { r: 0, w: 0, box: 0 }; r.flag = !r.flag; S.bank[q.id] = r; APP.save(); return r.flag; };
  const stat = (bank) => {
    let seen = 0, right = 0, tot = 0, mastered = 0, weak = 0, flag = 0;
    bank.q.forEach((q) => {
      const r = S.bank[q.id]; if (!r) return;
      if (r.r + r.w > 0) { seen++; right += r.r; tot += r.r + r.w; }
      if ((r.box || 0) >= 3) mastered++;
      if (r.w > 0 && (r.box || 0) < 3) weak++;
      if (r.flag) flag++;
    });
    return { seen, acc: tot ? Math.round((right / tot) * 100) : 0, mastered, weak, flag, total: bank.q.length };
  };

  /* ---------- 名詞小幫手:從題目抓出術語 ---------- */
  const terms = D.glossary.map((g) => ({ g, key: g.term.split(/[((]/)[0].trim() })).filter((x) => x.key.length >= 2);
  function helpers(q) {
    const text = q.stem + ' ' + (q.opts || []).join(' ');
    return terms.filter((t) => text.includes(t.key)).slice(0, 4).map((t) => t.g);
  }

  /* ---------- 單題畫面 ---------- */
  function questionCard(bank, lv, q, opts) {
    // opts: {reveal, picked, onPick(ok, fb)}
    const box = h('div');
    const sec = bank.sections.find((s) => s.sec === q.sec);
    const multi = isMulti(q), A = ansOf(q);
    box.append(h('div', { class: 'row' }, h('span', { class: 'pill' }, `${LVNAME[lv]} · 第 ${q.sec} 章`), multi ? h('span', { class: 'pill warn' }, '複選題(可能不只一個答案)') : null, q.u ? h('span', { class: 'pill gray', title: '這題的白話解析我不太有把握,以官方答案為準' }, '解析待確認') : null,
      h('span', { class: 'muted small' }, (sec ? sec.title : '') + ` · 第 ${q.no} 題`)));
    box.append(h('h3', { style: { fontSize: '1.2rem', marginTop: '10px' }, html: APP.rich(q.stem) }));
    (q.imgs || []).forEach((im) => box.append(h('img', { src: `assets/bank/${lv}/${im}`, alt: '題目附圖', style: { maxWidth: '100%', borderRadius: '8px', border: '1px solid var(--border)', background: '#fff', margin: '6px 0' } })));
    const hasOpts = q.opts && q.opts.length === 4;
    const label = (i) => `<strong>${CIRC[i]}</strong> ${hasOpts ? APP.rich(q.opts[i]) : '圖中的第 ' + CIRC[i] + ' 個'}`;
    const chosen = new Set();
    const btns = [0, 1, 2, 3].map((i) => h('button', { class: 'opt', html: label(i), onclick: () => (multi ? toggle(i) : finish([i + 1])) }));
    btns.forEach((b) => box.append(b));
    const fb = h('div'); const okBtn = multi ? h('button', { class: 'btn primary mt', onclick: () => { if (!chosen.size) return APP.toast('請先勾選答案(可以選多個)'); finish([...chosen].map((i) => i + 1)); } }, '確認答案') : null;
    if (okBtn && !opts.reveal) box.append(okBtn);
    box.append(fb);
    function toggle(i) { if (opts.picked != null) return; if (chosen.has(i)) { chosen.delete(i); btns[i].classList.remove('sel'); btns[i].style.cssText = ''; } else { chosen.add(i); btns[i].classList.add('sel'); btns[i].style.borderColor = 'var(--accent)'; btns[i].style.background = 'var(--accent-soft)'; } }
    function expBlock(ok) {
      const el = h('div');
      el.append(h('div', { class: 'explain ' + (ok == null ? '' : ok ? 'good' : 'badx') },
        h('div', null, ok == null ? `📖 正確答案:${ansText(q)}` : ok ? '✅ 答對了!' : `❌ 答錯了,正確答案是 ${ansText(q)}`),
        h('div', { style: { marginTop: '6px' }, html: '💡 <strong>白話解析</strong><br>' + APP.rich(q.exp || '(這題尚無解析,請記住官方答案)') })));
      const hp = helpers(q);
      if (hp.length) el.append(h('details', { class: 'card flat', style: { margin: '10px 0 0', padding: '10px 14px' } }, h('summary', { style: { cursor: 'pointer', fontWeight: 600 } }, '📖 名詞小幫手(題目裡的專有名詞)'),
        h('ul', { style: { margin: '8px 0 0', paddingLeft: '1.2em' } }, hp.map((g) => h('li', { style: { margin: '8px 0', overflow: 'hidden' } }, (D.glossPhoto && D.glossPhoto[g.id] && APP.hasPhoto(D.glossPhoto[g.id])) ? h('div', { style: { float: 'right', marginLeft: '10px' } }, APP.thumb(D.glossPhoto[g.id])) : null, h('span', { html: `<strong>${APP.esc(g.term)}</strong>:${APP.rich(g.plain)}` }))))));
      const star = h('button', { class: 'btn small', onclick: () => { const f = toggleFlag(q); star.textContent = f ? '⭐ 已標記(再按取消)' : '☆ 標記為不熟'; } }, S.bank[q.id] && S.bank[q.id].flag ? '⭐ 已標記(再按取消)' : '☆ 標記為不熟');
      el.append(h('div', { class: 'row mt' }, star));
      return el;
    }
    function lock(picks) { btns.forEach((b, k) => { b.disabled = true; b.style.cssText = ''; b.classList.remove('sel'); if (A.includes(k + 1)) b.classList.add('right'); else if (picks && picks.includes(k + 1)) b.classList.add('wrong'); }); if (okBtn) okBtn.remove(); }
    function finish(picks) {
      if (opts.picked != null) return;
      opts.picked = picks;
      const ok = sameSet(picks, q);
      lock(picks);
      fb.append(expBlock(ok));
      if (opts.onPick) opts.onPick(ok, fb);
    }
    if (opts.reveal) { lock(null); fb.append(expBlock(null)); if (opts.onReveal) opts.onReveal(fb); }
    return box;
  }

  /* ---------- 練習流程 ---------- */
  function runPractice(main, bank, lv, title, qs, o) {
    o = o || {};
    let i = 0, right = 0; const wrong = [];
    function show() {
      main.innerHTML = '';
      if (i >= qs.length) return done();
      const q = qs[i];
      main.append(h('div', { class: 'row spread' }, h('a', { href: '#/cert', onclick: (e) => { e.preventDefault(); APP.views.cert(main, [], true); } }, '← 考照練習'), h('span', { class: 'muted small' }, title + (o.reveal ? '(背題模式)' : ''))),
        h('div', { class: 'bar', style: { margin: '8px 0 14px' } }, h('i', { style: { width: (i / qs.length) * 100 + '%' } })),
        h('div', { class: 'row spread' }, h('span', { class: 'pill info' }, `第 ${i + 1} / ${qs.length} 題`), o.reveal ? null : h('span', { class: 'muted small' }, `答對 ${right}`)));
      const nextBtn = h('button', { class: 'btn primary', onclick: () => { i++; show(); } }, i + 1 < qs.length ? '下一題 →' : '看結果');
      const card = h('div', { class: 'card' });
      card.append(questionCard(bank, lv, q, {
        reveal: !!o.reveal,
        onPick: (ok, fb) => { record(q, ok); if (ok) right++; else wrong.push(q); fb.append(h('div', { class: 'mt' }, nextBtn)); },
        onReveal: (fb) => { fb.append(h('div', { class: 'mt' }, nextBtn)); },
      }));
      main.append(card);
    }
    function done() {
      main.append(h('div', { class: 'card center' }, h('div', { class: 'muted' }, title),
        h('div', { class: 'score-ring' }, o.reveal ? '完成' : `${right} / ${qs.length}`),
        o.reveal ? h('p', null, '背完了!接著用「練習模式」測測看吸收多少。') : h('p', null, Math.round((right / qs.length) * 100) >= 80 ? '🎉 這一批很穩。' : '做錯的題目已自動排進「錯題複習」,會愈來愈常出現直到你記住。'),
        h('div', { class: 'row', style: { justifyContent: 'center' } }, h('button', { class: 'btn primary', onclick: () => APP.views.cert(main, [], true) }, '回考照練習'))));
      if (wrong.length) main.append(h('div', { class: 'card' }, h('h3', { style: { marginTop: 0 } }, `📕 這一輪答錯的 ${wrong.length} 題`),
        wrong.map((q) => h('div', { class: 'card flat', style: { margin: '8px 0' } }, questionCard(bank, lv, q, { reveal: true })))));
    }
    show();
  }

  /* ---------- 模擬考 ---------- */
  function runMock(main, bank, lv, total, minutes) {
    const qs = APP.shuffle(bank.q).slice(0, total);
    const ans = new Array(qs.length).fill(null);
    let cur = 0, left = minutes * 60, timer = null, finished = false;
    APP.onLeave(() => clearInterval(timer));
    const fmt = (s) => String(Math.floor(s / 60)).padStart(2, '0') + ':' + String(s % 60).padStart(2, '0');
    function paint() {
      main.innerHTML = '';
      const q = qs[cur];
      const clock = h('span', { class: 'clock' }, fmt(left));
      main.append(h('div', { class: 'row spread' }, h('div', null, h('strong', null, `${LVNAME[lv]} 模擬學科測試`), h('span', { class: 'muted small' }, ` 共 ${total} 題 · 及格 60 分`)), h('div', null, '剩餘 ', clock)));
      const grid = h('div', { class: 'row', style: { gap: '5px', margin: '10px 0' } }, qs.map((_, k) => h('button', { class: 'btn small' + (k === cur ? ' primary' : ''), style: { minWidth: '38px', padding: '3px 6px', opacity: (ans[k] == null || !ans[k].length) ? 1 : .55 }, onclick: () => { cur = k; paint(); } }, k + 1)));
      main.append(grid);
      const card = h('div', { class: 'card' });
      // 模擬考不即時給答案:自訂選項
      card.append(mockQuestion(bank, lv, q, ans[cur], (i) => { ans[cur] = i; paint(); }));
      main.append(card, h('div', { class: 'row' },
        h('button', { class: 'btn', disabled: cur === 0, onclick: () => { cur--; paint(); } }, '← 上一題'),
        h('button', { class: 'btn', disabled: cur === qs.length - 1, onclick: () => { cur++; paint(); } }, '下一題 →'),
        h('button', { class: 'btn primary', onclick: () => { const un = ans.filter((x) => x == null || !x.length).length; if (!un || confirm(`還有 ${un} 題沒作答,確定要交卷嗎?`)) finish(); } }, '交卷')));
      main._clock = clock;
    }
    function finish() {
      if (finished) return; finished = true; clearInterval(timer);
      let ok = 0; const bySec = {}; const wrong = [];
      qs.forEach((q, k) => {
        const good = ans[k] != null && ans[k].length > 0 && sameSet(ans[k], q);
        if (good) ok++; else wrong.push(q);
        if (ans[k] != null || true) record(q, good);
        bySec[q.sec] = bySec[q.sec] || { n: 0, ok: 0 }; bySec[q.sec].n++; if (good) bySec[q.sec].ok++;
      });
      const score = Math.round((ok / qs.length) * 1000) / 10;
      const pass = score >= 60;
      S.certMock = S.certMock || {}; S.certMock[lv] = Math.max(S.certMock[lv] || 0, score); APP.save();
      main.innerHTML = '';
      main.append(h('div', { class: 'card center' }, h('div', { class: 'muted' }, `${LVNAME[lv]} 模擬學科測試`), h('div', { class: 'score-ring' }, score + ' 分'),
        h('h2', { style: { margin: 0 } }, pass ? '🎉 及格(60 分以上)' : '📖 還差一點,60 分及格'), h('p', { class: 'muted' }, `答對 ${ok} / ${qs.length} 題`)));
      main.append(h('div', { class: 'card' }, h('h3', { style: { marginTop: 0 } }, '各章表現(找弱點)'),
        h('table', null, h('tbody', null, Object.keys(bySec).sort((a, b) => a - b).map((s) => { const sec = bank.sections.find((x) => x.sec === +s); const v = bySec[s]; const p = Math.round((v.ok / v.n) * 100);
          return h('tr', null, h('td', null, `第 ${s} 章 ${sec ? sec.title : ''}`), h('td', { style: { width: '90px' } }, `${v.ok} / ${v.n}`), h('td', { style: { width: '35%' } }, h('div', { class: 'bar' }, h('i', { style: { width: p + '%', background: p >= 60 ? 'var(--ok)' : 'var(--bad)' } })))); })))));
      main.append(h('div', { class: 'row mb' }, h('button', { class: 'btn primary', onclick: () => APP.views.cert(main, [], true) }, '回考照練習'), h('button', { class: 'btn', onclick: () => runMock(main, bank, lv, total, minutes) }, '↻ 再考一次')));
      if (wrong.length) main.append(h('div', { class: 'card' }, h('h3', { style: { marginTop: 0 } }, `📕 答錯的 ${wrong.length} 題(含解析)`), wrong.map((q) => h('div', { class: 'card flat', style: { margin: '8px 0' } }, questionCard(bank, lv, q, { reveal: true })))));
    }
    timer = setInterval(() => { left--; if (main._clock) main._clock.textContent = fmt(Math.max(0, left)); if (left <= 0) finish(); }, 1000);
    paint();
  }
  function mockQuestion(bank, lv, q, picked, onPick) {
    // picked: 已選的數字陣列(例如 [1,3]) 或 null
    const box = h('div'); const multi = isMulti(q); const cur = picked || [];
    const sec = bank.sections.find((s) => s.sec === q.sec);
    box.append(h('div', { class: 'row' }, h('span', { class: 'muted small' }, `第 ${q.sec} 章 ${sec ? sec.title : ''}`), multi ? h('span', { class: 'pill warn' }, '複選題') : null));
    box.append(h('h3', { style: { fontSize: '1.2rem', marginTop: '8px' }, html: APP.rich(q.stem) }));
    (q.imgs || []).forEach((im) => box.append(h('img', { src: `assets/bank/${lv}/${im}`, alt: '題目附圖', style: { maxWidth: '100%', borderRadius: '8px', border: '1px solid var(--border)', background: '#fff', margin: '6px 0' } })));
    const hasOpts = q.opts && q.opts.length === 4;
    for (let i = 0; i < 4; i++) {
      const on = cur.includes(i + 1);
      box.append(h('button', { class: 'opt', style: on ? { borderColor: 'var(--accent)', background: 'var(--accent-soft)' } : null, html: `<strong>${CIRC[i]}</strong> ${hasOpts ? APP.rich(q.opts[i]) : '圖中的第 ' + CIRC[i] + ' 個'}`,
        onclick: () => onPick(multi ? (on ? cur.filter((x) => x !== i + 1) : [...cur, i + 1]) : [i + 1]) }));
    }
    return box;
  }

  /* ---------- 題庫首頁 ---------- */
  function hub(main, lv, bank) {
    const st = stat(bank);
    const today = APP.today();
    const due = bank.q.filter((q) => S.bank[q.id] && S.bank[q.id].due <= today && S.bank[q.id].w > 0 && (S.bank[q.id].box || 0) < 5);
    const weak = bank.q.filter((q) => S.bank[q.id] && S.bank[q.id].w > 0 && (S.bank[q.id].box || 0) < 3);
    const flagged = bank.q.filter((q) => S.bank[q.id] && S.bank[q.id].flag);
    const figs = bank.q.filter((q) => q.imgs && q.imgs.length);
    const mockN = 80, mockMin = 100;

    main.append(h('div', { class: 'row mb' }, ['c', 'b'].map((k) => h('button', { class: 'btn' + (k === lv ? ' primary' : ''), onclick: () => { S.certLevel = k; APP.save(); APP.views.cert(main, [], true); } }, LVNAME[k] + '學科'))));
    main.append(h('div', { class: 'card' },
      h('div', { class: 'row spread' }, h('strong', null, `${LVNAME[lv]}機器腳踏車修護 學科題庫`), h('span', { class: 'pill gray' }, `官方版次 ${bank.version}`)),
      h('p', { class: 'muted small', style: { margin: '6px 0' } }, `共 ${st.total} 題 · 來源:勞動部勞動力發展署技能檢定中心公開之學科測試參考資料(${bank.file})。題目與答案為官方原文;「白話解析」是本系統加的輔助說明。`),
      h('div', { class: 'grid c3' },
        h('div', null, h('div', { class: 'muted small' }, '已練習'), h('strong', { style: { fontSize: '1.4rem' } }, `${st.seen} / ${st.total}`)),
        h('div', null, h('div', { class: 'muted small' }, '累計正確率'), h('strong', { style: { fontSize: '1.4rem' } }, st.seen ? st.acc + '%' : '—')),
        h('div', null, h('div', { class: 'muted small' }, '已熟練(連對多次)'), h('strong', { style: { fontSize: '1.4rem' } }, st.mastered))),
      h('div', { class: 'bar mt' }, h('i', { style: { width: Math.round((st.mastered / st.total) * 100) + '%' } })),
      h('p', { class: 'muted small', style: { margin: '6px 0 0' } }, `今天已練 ${S.certDaily[today] || 0} 題` + (S.certMock && S.certMock[lv] ? ` · 模擬考最佳 ${S.certMock[lv]} 分` : ''))));

    const mode = (ico, t, d, fn, dis) => h('button', { class: 'card', disabled: dis, style: { margin: 0, textAlign: 'left', cursor: dis ? 'not-allowed' : 'pointer', opacity: dis ? .5 : 1 }, onclick: fn },
      h('div', { style: { fontSize: '1.6rem' } }, ico), h('strong', null, t), h('div', { class: 'muted small' }, d));
    const daily = () => {
      const dueQ = APP.shuffle(due).slice(0, 10);
      const ids = new Set(dueQ.map((q) => q.id));
      const fresh = APP.shuffle(bank.q.filter((q) => !S.bank[q.id] && !ids.has(q.id)));
      let pickQ = [...dueQ, ...fresh].slice(0, 20);
      if (pickQ.length < 20) pickQ = [...pickQ, ...APP.shuffle(bank.q.filter((q) => !pickQ.includes(q))).slice(0, 20 - pickQ.length)];
      runPractice(main, bank, lv, '每日 20 題', pickQ);
    };
    main.append(h('h2', null, '開始練習'), h('div', { class: 'grid auto' },
      mode('🎯', '每日 20 題', `先複習到期的錯題(${due.length} 題),再補新題。每天做這個最有效。`, daily),
      mode('📝', `模擬考(${mockN} 題 / ${mockMin} 分鐘)`, '計時、不給答案、交卷才評分。60 分及格。', () => { if (confirm(`開始模擬考?\n${mockN} 題、${mockMin} 分鐘,交卷前看不到答案。`)) runMock(main, bank, lv, mockN, mockMin); }),
      mode('📕', '錯題複習', `你還沒搞懂的題目:${weak.length} 題。答對幾次後會自動畢業。`, () => runPractice(main, bank, lv, '錯題複習', APP.shuffle(weak).slice(0, 30)), !weak.length),
      mode('⭐', '標記不熟的題', `你標記的題目:${flagged.length} 題。`, () => runPractice(main, bank, lv, '標記題', APP.shuffle(flagged).slice(0, 30)), !flagged.length),
      mode('🖼️', '圖題專區', `量具讀數、電路圖等「看圖」的題目:${figs.length} 題。`, () => runPractice(main, bank, lv, '圖題專區', APP.shuffle(figs).slice(0, 20)), !figs.length),
      mode('🔎', '搜尋題目', '輸入關鍵字(例如「火星塞」),直接看題目、答案與解析。', () => search(main, bank, lv))));

    main.append(h('h2', null, '依工作項目練習'), h('p', { class: 'muted small' }, '官方題庫依「工作項目」分章。第一次接觸建議先用「背題模式」看答案與解析,再切到「練習模式」。'));
    const links = [['使用器具', ['tools-units', 'multimeter-basics']], ['服務態度', ['maintenance-map', 'diagnosis-method']], ['引擎', ['four-stroke', 'fuel-injection']], ['電系', ['electrical-basics', 'charging-system', 'wiring-faults']], ['煞車', ['brakes-tires']], ['底盤', ['brakes-tires']], ['傳動', ['cvt']], ['車體', ['big-picture']]];
    bank.sections.forEach((s) => {
      const qs = bank.q.filter((q) => q.sec === s.sec);
      const done = qs.filter((q) => S.bank[q.id] && (S.bank[q.id].r + S.bank[q.id].w) > 0).length;
      const good = qs.filter((q) => S.bank[q.id] && (S.bank[q.id].box || 0) >= 3).length;
      const rel = new Set(); links.forEach(([kw, ls]) => { if (s.title.includes(kw)) ls.forEach((l) => rel.add(l)); });
      main.append(h('div', { class: 'card' },
        h('div', { class: 'row spread' }, h('div', null, h('strong', null, `第 ${s.sec} 章 ${s.title}`), h('div', { class: 'muted small' }, `${qs.length} 題 · 已練 ${done} · 熟練 ${good}`)),
          h('div', { class: 'row' },
            h('button', { class: 'btn small', onclick: () => runPractice(main, bank, lv, `第 ${s.sec} 章`, qs, { reveal: true }) }, '📖 背題模式'),
            h('button', { class: 'btn small primary', onclick: () => runPractice(main, bank, lv, `第 ${s.sec} 章`, APP.shuffle(qs).slice(0, 30)) }, '✏️ 練習 30 題'))),
        h('div', { class: 'bar mt' }, h('i', { style: { width: Math.round((good / qs.length) * 100) + '%' } })),
        rel.size ? h('div', { class: 'row mt small' }, h('span', { class: 'muted' }, '先看教材:'), [...rel].map((id) => { const l = D.lessons.find((x) => x.id === id); return l ? h('a', { class: 'pill info', href: '#/learn/' + id, style: { textDecoration: 'none' } }, l.title) : null; })) : null));
    });
    main.append(infoCard(lv));
  }

  /* ---------- 考試資訊(依官方文件整理) ---------- */
  function infoCard(lv) {
    const L = (href, t) => h('a', { href, target: '_blank', rel: 'noopener' }, t);
    const ul = (items) => h('ul', null, items.map((i) => h('li', { html: APP.rich(i) })));
    const base = 'https://owinform.wdasec.gov.tw/owInform/DLowFile/';
    return h('details', { class: 'card', style: { marginTop: '18px' }, open: false },
      h('summary', { style: { cursor: 'pointer', fontWeight: 700, fontSize: '1.1rem' } }, '📋 考試資訊與術科(依官方文件整理,點開看)'),
      h('p', { class: 'muted small' }, '整理自勞動部勞動力發展署技能檢定中心的「技能檢定規範 14500 機器腳踏車修護」(105 年 8 月修正)與公開的學科/術科測試參考資料。報名日期、報檢資格、題數配分若有異動,一律以最新簡章為準。'),
      h('h3', null, '共同規則'), ul(['依專業範圍分**乙、丙二級**;**學科與術科分別檢定,各自都要達到標準**(規範原文)。', '**丙級**:定期保養及相關構件的檢查、拆裝、清潔、潤滑、更換、量測、調整等基本修護;特別著重**行車安全、排氣污染、噪音管制**等法令。', '**乙級**:除了丙級的基本功,還要能**拆裝、更換、校正、測試等故障排除**,並具分析能力;工作範圍含專業保養、維修、服務與經營管理。']),
      h('h3', null, '學科'), ul(['**丙級**:單選題 80 題、每題 1.25 分、100 分鐘、60 分及格(依公開題庫網站整理)。', '**乙級**:題庫含**單選題與複選題**(複選題答案是多個選項,必須全對才算對);題數與配分請看簡章。', '本系統「模擬考」是依丙級格式(80 題/100 分鐘)出題,乙級也採同樣格式練習,實際題型以簡章為準。']),
      h('h3', null, '術科(實作)'),
      ul(['**丙級**:分站實作、抽籤配題;**總分 60 分及格,但任一站得 0 分(含棄權)或缺考,即使總分夠也不及格**。官方資料中可見的題目例如「更換 V 型(皮帶式)無段自動變速機構構件」、「更換離合器磨擦片與調整自由間隙」。',
        '**乙級共 4 站**:① 檢修汽油引擎(準備 5 分鐘 + 操作 30 分鐘,**每題設 2 個故障點**,依抽到的題目檢修電路、燃油或構件系統)② 檢修電系(充電與燈光;或起動與信號:喇叭、方向燈、煞車燈)③ 檢修車體相關裝備 ④ 全車綜合檢修(每題 1 個故障點)。',
        '評分:各單項採「二分法」(滿分或 0 分);四站總分 60 分及格,**任一站 0 分或缺考即不及格**。測試時要遵守工廠安全規定,違規會扣分甚至取消資格。']),
      h('div', { class: 'callout analogy' }, h('div', { class: 'ttl' }, '🔗 跟本系統怎麼對應?'), h('p', { html: '乙級術科的核心就是「**依症狀找出故障點、用儀器驗證、修到符合規範**」——這正是 **<a href="#/diagnose">診斷實戰</a>** 與 **<a href="#/lab">電表實驗室</a>** 在練的事;丙級術科的更換構件類題目,對應 **<a href="#/proc">流程演練</a>**(CVT 保養、煞車、火星塞…)。術科必須在合格的檢定場地用實車實作,模擬只能幫你把流程與判斷練熟。' })),
      h('h3', null, '官方資料(建議都下載存著)'),
      h('ul', null,
        h('li', null, L('https://www.wdasec.gov.tw/', '勞動部勞動力發展署技能檢定中心(報名、簡章、公告)')),
        h('li', null, L('https://owinform.wdasec.gov.tw/ExamNet/owInform/PastQuestions.aspx', '官方「歷屆試題」頁面')),
        h('li', null, L(base + '145003A13.pdf', '丙級學科測試參考資料(本題庫來源)'), ' · ', L(base + '145002A12.pdf', '乙級學科測試參考資料(本題庫來源)')),
        h('li', null, L(base + '145003B21.pdf', '丙級術科資料(修正對照表)'), ' · ', L(base + '145002B20.pdf', '乙級術科資料(修正對照表)'))),
      h('div', { class: 'callout warn' }, h('div', { class: 'ttl' }, '⚠️ 關於「白話解析」'), h('p', null, '題目與答案是官方原文;白話解析是本系統用 AI 輔助撰寫,**可能有錯**。標著「解析待確認」的題目,代表原因我沒有把握、只寫了確定的部分。一切以官方答案與修護手冊為準,遇到不合理的題目,請以官方答案為準先記住。')));
  }

  function search(main, bank, lv) {
    main.innerHTML = '';
    const out = h('div');
    const inp = h('input', { type: 'search', placeholder: '輸入關鍵字,例如:火星塞、煞車油、游標卡尺', style: { width: '100%', padding: '12px 14px', fontSize: '1rem', border: '1.5px solid var(--border)', borderRadius: '10px', background: 'var(--card)', color: 'var(--text)' } });
    const run = () => {
      const k = inp.value.trim(); out.innerHTML = '';
      if (k.length < 1) return;
      const res = bank.q.filter((q) => (q.stem + (q.opts || []).join(' ') + (q.exp || '')).includes(k));
      out.append(h('p', { class: 'muted' }, `找到 ${res.length} 題` + (res.length > 20 ? '(只顯示前 20 題,請縮小關鍵字)' : '')));
      res.slice(0, 20).forEach((q) => out.append(h('div', { class: 'card' }, questionCard(bank, lv, q, { reveal: true }))));
    };
    inp.oninput = run;
    main.append(h('p', null, h('a', { href: '#/cert', onclick: (e) => { e.preventDefault(); APP.views.cert(main, [], true); } }, '← 考照練習')), APP.head('search', '搜尋題目'), inp, out);
    inp.focus();
  }

  /* ---------- 路由入口 ---------- */
  APP.views.cert = function (main, params, rerender) {
    if (rerender) { main.innerHTML = ''; window.scrollTo(0, 0); }
    const lv = S.certLevel || 'c';
    main.append(APP.head('graduation-cap', '考照練習'), h('p', { class: 'muted' }, '機器腳踏車修護 丙級 / 乙級 技術士學科。官方公開題庫,搭配白話解析,從零開始也能刷。'));
    const loading = h('p', { class: 'muted' }, '載入題庫中…');
    main.append(loading);
    APP.loadBank(lv).then((bank) => {
      loading.remove();
      if (!bank) { main.append(h('div', { class: 'callout warn' }, '題庫檔案尚未載入。請確認 js/data/bank-' + lv + '.js 存在。')); return; }
      hub(main, lv, bank);
    });
  };
})();
