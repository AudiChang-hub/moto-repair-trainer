/* 核心:儲存、工具函式、路由、共用元件 */
(function () {
  'use strict';
  const APP = (window.APP = { data: {}, views: {}, widgets: {}, ui: {}, cleanups: [] });

  /* ---------- 儲存(localStorage 失敗時退回記憶體) ---------- */
  const KEY = 'moto-sim-v1';
  let S = { lessons: {}, scenarios: {}, procs: {}, labs: {}, cards: {}, mistakes: [], plan: {}, planStart: null };
  try {
    const raw = localStorage.getItem(KEY);
    if (raw) S = Object.assign(S, JSON.parse(raw));
  } catch (e) { /* 無痕模式等情況:只在本次有效 */ }
  APP.S = S;
  APP.save = function () {
    try { localStorage.setItem(KEY, JSON.stringify(S)); } catch (e) { /* ignore */ }
  };
  APP.resetAll = function () {
    if (!confirm('確定要清除所有學習進度與錯題本嗎?此動作無法復原。')) return;
    try { localStorage.removeItem(KEY); } catch (e) { /* ignore */ }
    location.reload();
  };

  /* ---------- 小工具 ---------- */
  const esc = (s) => String(s).replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
  APP.esc = esc;
  APP.rich = (s) => esc(s).replace(/\*\*(.+?)\*\*/g, '<strong>$1</strong>').replace(/`(.+?)`/g, '<code>$1</code>').replace(/\n/g, '<br>');

  // 把節點內文字裡的 **粗體** 轉成 <strong>(給直接用文字節點寫的內容)
  APP.boldify = function (root) {
    const w = document.createTreeWalker(root, NodeFilter.SHOW_TEXT, null);
    const hit = [];
    while (w.nextNode()) if (w.currentNode.nodeValue.includes('**')) hit.push(w.currentNode);
    hit.forEach((n) => {
      const frag = document.createDocumentFragment();
      n.nodeValue.split('**').forEach((part, i) => { if (!part) return; if (i % 2) { const b = document.createElement('strong'); b.textContent = part; frag.append(b); } else frag.append(part); });
      n.replaceWith(frag);
    });
  };

  APP.h = function (tag, attrs, ...kids) {
    const el = document.createElement(tag);
    if (attrs) {
      for (const [k, v] of Object.entries(attrs)) {
        if (v == null || v === false) continue;
        if (k === 'class') el.className = v;
        else if (k === 'html') el.innerHTML = v;
        else if (k.startsWith('on') && typeof v === 'function') el.addEventListener(k.slice(2).toLowerCase(), v);
        else if (k === 'style' && typeof v === 'object') Object.assign(el.style, v);
        else el.setAttribute(k, v === true ? '' : v);
      }
    }
    for (const kid of kids.flat(Infinity)) {
      if (kid == null || kid === false) continue;
      el.append(kid.nodeType ? kid : document.createTextNode(kid));
    }
    return el;
  };
  const h = APP.h;

  APP.shuffle = function (arr) {
    const a = arr.slice();
    for (let i = a.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [a[i], a[j]] = [a[j], a[i]];
    }
    return a;
  };
  APP.pick = (arr) => arr[Math.floor(Math.random() * arr.length)];
  APP.today = () => new Date().toISOString().slice(0, 10);
  APP.onLeave = (fn) => APP.cleanups.push(fn);

  let toastTimer;
  APP.toast = function (msg) {
    const t = document.getElementById('toast');
    t.textContent = msg;
    t.classList.add('show');
    clearTimeout(toastTimer);
    toastTimer = setTimeout(() => t.classList.remove('show'), 2200);
  };


  /* ---------- 照片:縮圖/圖說/授權/燈箱 ---------- */
  APP.hasPhoto = (id) => !!(APP.data.photos && APP.data.photos[id]);
  APP.photoUrl = (id) => 'assets/photos/' + APP.data.photos[id].file;
  APP.credit = function (p) {
    return h('div', { class: 'credit' }, '📷 ', p.author || '作者不詳', ' · ', h('a', { href: p.page, target: '_blank', rel: 'noopener' }, p.license || '授權'), ' · Wikimedia Commons');
  };
  APP.lightbox = function (id) {
    const p = APP.data.photos[id]; if (!p) return;
    const close = () => { ov.remove(); document.removeEventListener('keydown', esc); };
    const esc = (e) => { if (e.key === 'Escape') close(); };
    const ov = h('div', { class: 'lightbox', onclick: (e) => { if (e.target === ov) close(); } },
      h('div', { class: 'lb-box' }, h('button', { class: 'lb-x', 'aria-label': '關閉', onclick: close }, '✕'),
        h('img', { src: APP.photoUrl(id), alt: p.zh }),
        h('div', { class: 'lb-cap' }, h('strong', null, p.zh), h('div', null, p.caption), APP.credit(p))));
    document.body.append(ov); document.addEventListener('keydown', esc);
  };
  // 完整圖片卡(圖 + 中文名 + 圖說 + 授權)
  APP.photo = function (id, o) {
    o = o || {};
    if (!APP.hasPhoto(id)) return null;
    const p = APP.data.photos[id];
    const img = h('img', { src: APP.photoUrl(id), alt: p.zh, loading: 'lazy', onclick: () => APP.lightbox(id), title: '點一下放大' });
    return h('figure', { class: 'photo' }, img, h('figcaption', null, h('strong', null, p.zh), o.nocaption ? null : h('div', { class: 'muted small' }, p.caption), APP.credit(p)));
  };
  // 小縮圖(表格、標籤用)
  APP.thumb = function (id) {
    if (!APP.hasPhoto(id)) return null;
    const p = APP.data.photos[id];
    return h('img', { class: 'thumb', src: APP.photoUrl(id), alt: p.zh, loading: 'lazy', title: p.zh + '(點一下放大)', onclick: (e) => { e.stopPropagation(); APP.lightbox(id); } });
  };

  /* ---------- 進度查詢 ---------- */
  APP.done = {
    lesson: (id) => !!(S.lessons[id] && S.lessons[id].done),
    scenario: (id) => !!(S.scenarios[id] && S.scenarios[id].best != null),
    proc: (id) => !!(S.procs[id] && S.procs[id].best != null),
    lab: (id) => !!(S.labs[id] && S.labs[id].done),
  };

  /* ---------- 錯題本 ---------- */
  APP.logMistake = function (m) {
    // m: {kind:'quiz'|'diag'|'proc', src, title, detail, q, options, a, why}
    const id = m.kind + '|' + (m.q || m.title);
    const ex = S.mistakes.find((x) => x.id === id);
    if (ex) { ex.count++; ex.ts = Date.now(); ex.resolved = false; }
    else S.mistakes.push(Object.assign({ id, count: 1, ts: Date.now(), resolved: false }, m));
    APP.save();
  };
  APP.resolveMistake = function (kind, q) {
    const ex = S.mistakes.find((x) => x.id === kind + '|' + q);
    if (ex && !ex.resolved) { ex.resolved = true; APP.save(); }
  };

  /* ---------- 共用:單題測驗元件 ---------- */
  // questions: [{q, options[], a:index, why}]
  // opts: {src, onDone(score,total), retry:boolean}
  APP.ui.quiz = function (container, questions, opts) {
    opts = opts || {};
    let i = 0, score = 0;
    const wrongs = [];
    function show() {
      container.innerHTML = '';
      const q = questions[i];
      const order = APP.shuffle(q.options.map((t, idx) => ({ t, idx })));
      const box = h('div', null,
        h('div', { class: 'row spread' }, h('span', { class: 'pill info' }, `第 ${i + 1} / ${questions.length} 題`), h('span', { class: 'muted small' }, `目前答對 ${score}`)),
        h('h3', { style: { marginTop: '10px' }, html: APP.rich(q.q) })
      );
      const fb = h('div');
      const btns = order.map((o) => {
        const b = h('button', {
          class: 'opt', html: APP.rich(o.t),
          onclick: () => {
            btns.forEach((x) => (x.disabled = true));
            const ok = o.idx === q.a;
            b.classList.add(ok ? 'right' : 'wrong');
            if (!ok) btns[order.findIndex((z) => z.idx === q.a)].classList.add('right');
            if (ok) { score++; if (opts.retry) APP.resolveMistake('quiz', q.q); }
            else {
              wrongs.push(q);
              APP.logMistake({ kind: 'quiz', src: opts.src || '', title: q.q, q: q.q, options: q.options, a: q.a, why: q.why });
            }
            fb.append(h('div', { class: 'explain ' + (ok ? 'good' : 'badx'), html: (ok ? '✅ 答對了。' : '❌ 答錯了,已加入錯題本。') + '<br>' + APP.rich(q.why || '') }));
            fb.append(h('div', { class: 'mt' }, h('button', { class: 'btn primary', onclick: next }, i + 1 < questions.length ? '下一題 →' : '看結果')));
          },
        });
        return b;
      });
      btns.forEach((b) => box.append(b));
      box.append(fb);
      container.append(box);
    }
    function next() {
      i++;
      if (i < questions.length) return show();
      container.innerHTML = '';
      const pct = Math.round((score / questions.length) * 100);
      container.append(h('div', { class: 'center' },
        h('div', { class: 'score-ring' }, `${score} / ${questions.length}`),
        h('p', null, pct >= 80 ? '🎉 很穩!這一章可以往下走了。' : pct >= 60 ? '👍 過關,但錯的題目建議回頭看一下。' : '📖 建議回去重讀教材,再測一次。'),
        h('p', { class: 'muted small' }, '答錯的題目都在「錯題本」裡,可以隨時重做。')));
      if (opts.onDone) opts.onDone(score, questions.length);
    }
    show();
  };

  /* ---------- 導覽與路由 ---------- */
  const NAV = [
    ['home', '🏠', '今日任務'],
    ['learn', '🗺️', '學習地圖'],
    ['cert', '🎓', '考照練習'],
    ['brands', '🏷️', '車款專區'],
    ['diagnose', '🔍', '診斷實戰'],
    ['proc', '🔧', '流程演練'],
    ['lab', '⚡', '電表實驗室'],
    ['visual', '🎞️', '動畫圖解'],
    ['gallery', '📷', '工具零件圖鑑'],
    ['parts', '🏍️', '零件地圖'],
    ['cards', '🃏', '術語閃卡'],
    ['mistakes', '📕', '錯題本'],
    ['bridge', '🌉', '走向實車'],
  ];
  function buildNav() {
    const nav = document.getElementById('nav');
    nav.innerHTML = '';
    nav.append(h('div', { class: 'brand' }, h('img', { src: 'assets/icon.png', alt: '', style: { width: '34px', height: '34px', borderRadius: '9px' } }), '機車維修訓練場'));
    NAV.forEach(([id, ico, label]) => nav.append(h('a', { class: 'nav-item', href: '#/' + id, 'data-id': id }, h('span', { class: 'nav-ico' }, ico), label)));
    nav.append(h('div', { class: 'nav-foot' }, '進度存在這台電腦的瀏覽器裡。', h('br'), h('a', { href: '#/backup' }, '📦 備份 / 換裝置'), h('br'), h('a', { href: '#', onclick: (e) => { e.preventDefault(); APP.resetAll(); } }, '清除全部進度')));
  }

  function route() {
    APP.cleanups.forEach((fn) => { try { fn(); } catch (e) { /* ignore */ } });
    APP.cleanups = [];
    const hash = location.hash.replace(/^#\/?/, '') || 'home';
    const [name, ...params] = hash.split('/');
    const main = document.getElementById('main');
    main.innerHTML = '';
    window.scrollTo(0, 0);
    const view = APP.views[name] || APP.views.home;
    document.querySelectorAll('#nav a.nav-item').forEach((a) => a.classList.toggle('active', a.dataset.id === (APP.views[name] ? name : 'home')));
    try {
      view(main, params.map(decodeURIComponent));
    } catch (e) {
      console.error(e);
      main.append(h('div', { class: 'callout warn' }, '這個頁面載入時發生錯誤:' + e.message));
    }
  }

  APP.start = function () {
    buildNav();
    window.addEventListener('hashchange', route);
    route();
    if ('serviceWorker' in navigator && /^https?:$/.test(location.protocol)) navigator.serviceWorker.register('sw.js').catch(() => {});
  };
})();
