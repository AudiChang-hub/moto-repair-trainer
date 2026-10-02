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
    while (w.nextNode()) { const n = w.currentNode; if (n.nodeValue.includes('**') && /\*\*[^*]+\*\*/.test(n.nodeValue) && !(n.parentElement && n.parentElement.closest('textarea,script,style,svg'))) hit.push(n); }
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
    if (p.author === '本站繪製') return h('div', { class: 'credit' }, '✏️ 本站繪製示意圖(非實物照片)');
    return h('div', { class: 'credit' }, '📷 ', p.author || '作者不詳', ' · ', h('a', { href: p.page, target: '_blank', rel: 'noopener' }, p.license || '授權'), ' · Wikimedia Commons');
  };
  // 「看更多實物照片」:連到圖片搜尋與購物網站(只放連結,不複製別人的照片)
  APP.moreLink = function (p) {
    const q = encodeURIComponent(p.q || p.zh.split(/[((—]/)[0].trim());
    const a = (href, t) => h('a', { href, target: '_blank', rel: 'noopener' }, t);
    return h('div', { class: 'credit' }, '🔍 看更多實物照片:', a('https://www.google.com/search?tbm=isch&q=' + q, 'Google 圖片'), ' · ', a('https://shopee.tw/search?keyword=' + q, '蝦皮'), ' · ', a('https://www.ruten.com.tw/find/?q=' + q, '露天'));
  };
  APP.lightbox = function (id) {
    const p = APP.data.photos[id]; if (!p) return;
    const close = () => { ov.remove(); document.removeEventListener('keydown', esc); };
    const esc = (e) => { if (e.key === 'Escape') close(); };
    const ov = h('div', { class: 'lightbox', onclick: (e) => { if (e.target === ov) close(); } },
      h('div', { class: 'lb-box' }, h('button', { class: 'lb-x', 'aria-label': '關閉', onclick: close }, '✕'),
        h('img', { src: APP.photoUrl(id), alt: p.zh }),
        h('div', { class: 'lb-cap' }, h('strong', null, p.zh), h('div', null, p.caption), APP.credit(p), APP.moreLink(p))));
    document.body.append(ov); document.addEventListener('keydown', esc);
  };
  // 完整圖片卡(圖 + 中文名 + 圖說 + 授權)
  APP.photo = function (id, o) {
    o = o || {};
    if (!APP.hasPhoto(id)) return null;
    const p = APP.data.photos[id];
    const img = h('img', { src: APP.photoUrl(id), alt: p.zh, loading: 'lazy', onclick: () => APP.lightbox(id), title: '點一下放大' });
    return h('figure', { class: 'photo' }, img, h('figcaption', null, h('strong', null, p.zh), o.nocaption ? null : h('div', { class: 'muted small' }, p.caption), APP.credit(p), APP.moreLink(p)));
  };
  // 小縮圖(表格、標籤用)
  APP.thumb = function (id) {
    if (!APP.hasPhoto(id)) return null;
    const p = APP.data.photos[id];
    return h('img', { class: 'thumb', src: APP.photoUrl(id), alt: p.zh, loading: 'lazy', title: p.zh + '(點一下放大)', onclick: (e) => { e.stopPropagation(); APP.lightbox(id); } });
  };

  // 難度格(1~3)
  APP.diff = (n) => h('span', { class: 'diff', role: 'img', 'aria-label': `難度 ${n} / 3` }, [1, 2, 3].map((k) => h('i', { class: k <= n ? 'on' : '' })));
  // 頁面標題:線條圖示 + 標題
  APP.head = (ico, title) => h('h1', { class: 'page-title' }, h('span', { class: 'pt-ico', 'aria-hidden': 'true' }, APP.icon(ico, 24)), title);


  /* ---------- emoji → 線條圖示(全站風格統一) ---------- */
  const EMO = {
    '⚠️': 'triangle-alert', '⚠': 'triangle-alert', '💡': 'lightbulb', '📌': 'target', '✅': 'circle-check', '❌': 'circle-x', '✔': 'check',
    '🧭': 'route', '📋': 'clipboard-list', '🛵': 'bike', '🗣️': 'info', '📖': 'book-open', '🔎': 'search', '🔍': 'search', '🧪': 'clipboard-list',
    '🖨️': 'printer', '🧰': 'wrench', '🎯': 'target', '📝': 'clipboard-list', '📕': 'notebook-pen', '⭐': 'star', '🖼️': 'image',
    '🔧': 'wrench', '📏': 'ruler', '⚙️': 'cog', '🛞': 'disc-3', '🔌': 'cable', '🔋': 'battery-charging', '📷': 'camera', '✏️': 'notebook-pen',
    '🩺': 'clipboard-list', '📊': 'gauge', '🏆': 'trophy', '👍': 'circle-check', '💪': 'flame', '🎉': 'sparkles', '👆': 'info', '😵': 'circle-x',
    '🤔': 'info', '😎': 'circle-check', '💥': 'zap', '⛔': 'circle-x', '📦': 'archive', '🗺️': 'map', '🛠️': 'hammer', '📅': 'calendar-days',
    '🔗': 'route', '🆚': 'list-checks', '⬇': 'download', '↻': 'rotate-ccw', '🏷️': 'tag', '🎓': 'graduation-cap', '⚡': 'zap', '🎞️': 'film',
    '🏍️': 'bike', '🃏': 'layers', '🌉': 'route', '🔄': 'rotate-ccw', '📈': 'gauge', '🚀': 'arrow-right',
  };
  // \u9019\u4E9B emoji \u90FD\u4E0D\u542B\u6B63\u5247\u7279\u6B8A\u5B57\u5143,\u76F4\u63A5\u4E32\u8D77\u4F86\u5373\u53EF;\u5F8C\u9762\u53EF\u5E36 U+FE0F \u8207\u4E00\u500B\u7A7A\u767D
  const EMO_RE = new RegExp('(' + Object.keys(EMO).sort((a, b) => b.length - a.length).join('|') + ')\\uFE0F?\\s?', 'gu');
  const EMO_TEST = new RegExp(EMO_RE.source, 'u');
  APP.iconify = function (root) {
    if (!root || root.closest && root.closest('svg,.lcd,textarea,input')) return;
    const w = document.createTreeWalker(root, NodeFilter.SHOW_TEXT, { acceptNode: (n) => (n.parentElement && n.parentElement.closest('svg,.lcd,textarea,script,style,option') ? NodeFilter.FILTER_REJECT : EMO_TEST.test(n.nodeValue) ? NodeFilter.FILTER_ACCEPT : NodeFilter.FILTER_SKIP) });
    const hits = []; while (w.nextNode()) hits.push(w.currentNode);
    hits.forEach((n) => {
      EMO_RE.lastIndex = 0;
      const frag = document.createDocumentFragment(); let last = 0, m;
      const txt = n.nodeValue;
      while ((m = EMO_RE.exec(txt))) {
        if (m.index > last) frag.append(txt.slice(last, m.index));
        const ic = APP.icon(EMO[m[1]], 18); ic.classList.add('emo');
        frag.append(ic, m[0].endsWith(' ') ? ' ' : '');
        last = m.index + m[0].length;
      }
      if (last < txt.length) frag.append(txt.slice(last));
      n.replaceWith(frag);
    });
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
        (() => { const el = h('div', { class: 'score-ring', 'aria-label': `答對 ${score} / ${questions.length}` }, `0 / ${questions.length}`); let k = 0; const step = () => { el.textContent = `${k} / ${questions.length}`; if (k++ < score) setTimeout(step, 90); }; setTimeout(step, 150); return el; })(),
        h('p', null, pct >= 80 ? '🎉 很穩!這一章可以往下走了。' : pct >= 60 ? '👍 過關,但錯的題目建議回頭看一下。' : '📖 建議回去重讀教材,再測一次。'),
        h('p', { class: 'muted small' }, '答錯的題目都在「錯題本」裡,可以隨時重做。')));
      if (opts.onDone) opts.onDone(score, questions.length);
    }
    show();
  };

  /* ---------- 導覽與路由 ---------- */
  // [id, 圖示, 名稱, 分組]
  const NAV = [
    ['home', 'house', '今日任務', '開始'],
    ['learn', 'map', '學習地圖', '學習'],
    ['visual', 'film', '動畫圖解', '學習'],
    ['gallery', 'camera', '工具零件圖鑑', '學習'],
    ['parts', 'bike', '零件地圖', '學習'],
    ['cards', 'layers', '術語閃卡', '學習'],
    ['cert', 'graduation-cap', '考照練習', '練習'],
    ['diagnose', 'search', '診斷實戰', '練習'],
    ['proc', 'wrench', '流程演練', '練習'],
    ['lab', 'zap', '電表實驗室', '練習'],
    ['brands', 'tag', '車款專區', '店務'],
    ['mistakes', 'notebook-pen', '錯題本', '店務'],
    ['bridge', 'route', '走向實車', '店務'],
  ];
  const ALIAS = { sop: 'proc', plan: 'home' };
  APP.NAV = NAV;

  // 深淺色:system / light / dark
  APP.setTheme = function (t) {
    S.theme = t; APP.save();
    if (t === 'system') delete document.documentElement.dataset.theme; else document.documentElement.dataset.theme = t;
    document.querySelectorAll('.theme-switch button').forEach((b) => b.setAttribute('aria-pressed', String(b.dataset.t === t)));
  };

  function buildNav() {
    const nav = document.getElementById('nav');
    nav.innerHTML = '';
    nav.append(h('a', { class: 'brand', href: '#/home', 'aria-label': '機車維修訓練場 首頁' }, h('img', { src: 'assets/icon-192.png', alt: '', width: 40, height: 40 }), h('div', null, h('b', null, '機車維修訓練場'), h('small', null, 'MOTO REPAIR TRAINER'))));
    let group = '';
    NAV.forEach(([id, ico, label, g]) => {
      if (g !== group) { group = g; nav.append(h('div', { class: 'nav-group' }, g)); }
      nav.append(h('a', { class: 'nav-item', href: '#/' + id, 'data-id': id }, APP.icon(ico, 19), label));
    });
    const sw = h('div', { class: 'theme-switch', role: 'group', 'aria-label': '顯示模式' },
      [['system', 'monitor', '跟隨系統'], ['light', 'sun', '淺色'], ['dark', 'moon', '深色']].map(([t, ic, lb]) =>
        h('button', { type: 'button', 'data-t': t, 'aria-pressed': String((S.theme || 'system') === t), 'aria-label': lb, title: lb, onclick: () => APP.setTheme(t) }, APP.icon(ic, 16))));
    nav.append(h('div', { class: 'nav-foot' }, sw,
      h('div', null, '進度存在這台裝置的瀏覽器裡'), h('div', null, '版本 ' + (APP.version || '本機')),
      h('div', { class: 'row', style: { gap: '12px', marginTop: '6px' } }, h('a', { href: '#/backup' }, '備份 / 換裝置'), h('a', { href: '#', onclick: (e) => { e.preventDefault(); APP.resetAll(); } }, '清除進度'))));

    // 手機底部導覽:4 個常用 + 更多
    const tab = document.getElementById('tabbar');
    tab.innerHTML = '';
    [['home', 'house', '首頁'], ['learn', 'map', '學習'], ['cert', 'graduation-cap', '考照'], ['diagnose', 'search', '診斷']].forEach(([id, ic, lb]) =>
      tab.append(h('a', { href: '#/' + id, 'data-id': id }, APP.icon(ic, 22), lb)));
    tab.append(h('button', { type: 'button', 'aria-haspopup': 'dialog', onclick: openMore }, APP.icon('menu', 22), '更多'));
  }

  function openMore() {
    const close = () => { sheet.remove(); document.removeEventListener('keydown', esc); };
    const esc = (e) => { if (e.key === 'Escape') close(); };
    const sheet = h('div', { class: 'sheet', role: 'dialog', 'aria-modal': 'true', 'aria-label': '所有功能', onclick: (e) => { if (e.target === sheet) close(); } },
      h('div', { class: 'sheet-box' }, h('div', { class: 'grab' }),
        h('div', { class: 'sheet-grid' }, [...NAV.map(([id, ic, lb]) => [id, ic, lb]), ['backup', 'archive', '備份/換裝置']].map(([id, ic, lb]) =>
          h('a', { href: '#/' + id, onclick: close }, APP.icon(ic, 24), lb))),
        h('div', { class: 'theme-switch', style: { marginTop: '16px' } }, [['system', 'monitor', '跟隨系統'], ['light', 'sun', '淺色'], ['dark', 'moon', '深色']].map(([t, ic, lb]) =>
          h('button', { type: 'button', 'data-t': t, 'aria-pressed': String((S.theme || 'system') === t), onclick: () => APP.setTheme(t) }, APP.icon(ic, 16), ' ', lb)))));
    document.body.append(sheet); document.addEventListener('keydown', esc);
    const first = sheet.querySelector('a'); if (first) first.focus();
  }

  let firstRoute = true;
  function route() {
    APP.cleanups.forEach((fn) => { try { fn(); } catch (e) { /* ignore */ } });
    APP.cleanups = [];
    const hash = location.hash.replace(/^#\/?/, '') || 'home';
    const [name, ...params] = hash.split('/');
    const main = document.getElementById('main');
    main.innerHTML = '';
    main.classList.remove('enter'); void main.offsetWidth; main.classList.add('enter');
    window.scrollTo(0, 0);
    const view = APP.views[name] || APP.views.home;
    const cur = APP.views[name] ? (ALIAS[name] || name) : 'home';
    document.querySelectorAll('#nav a.nav-item, #tabbar a').forEach((a) => {
      const on = a.dataset.id === cur;
      a.classList.toggle('active', on);
      if (on) a.setAttribute('aria-current', 'page'); else a.removeAttribute('aria-current');
    });
    const item = NAV.find((n) => n[0] === cur);
    document.title = (item && cur !== 'home' ? item[2] + ' · ' : '') + '機車維修訓練場';
    try {
      view(main, params.map(decodeURIComponent));
    } catch (e) {
      console.error(e);
      main.append(h('div', { class: 'callout warn' }, '這個頁面載入時發生錯誤:' + e.message));
    }
    // 換頁後把焦點移到內容(螢幕閱讀器與鍵盤使用者),第一次載入不搶焦點
    if (!firstRoute) main.focus({ preventScroll: true });
    firstRoute = false;
  }

  APP.start = function () {
    buildNav();
    // 任何新渲染的內容都自動把 emoji 換成線條圖示
    new MutationObserver((ms) => ms.forEach((m) => m.addedNodes.forEach((n) => { const el = n.nodeType === 1 ? n : n.parentElement; if (!el || !el.isConnected) return; APP.boldify(el); APP.iconify(el); }))).observe(document.body, { childList: true, subtree: true });
    window.addEventListener('hashchange', route);
    route();
    if ('serviceWorker' in navigator && /^https?:$/.test(location.protocol)) {
      const hadController = !!navigator.serviceWorker.controller;
      let reloaded = false;
      // 新版接手後自動重新整理一次(第一次安裝不用)
      navigator.serviceWorker.addEventListener('controllerchange', () => { if (hadController && !reloaded) { reloaded = true; location.reload(); } });
      navigator.serviceWorker.register('sw.js', { updateViaCache: 'none' }).then((reg) => reg.update()).catch(() => {});
    }
  };
})();
