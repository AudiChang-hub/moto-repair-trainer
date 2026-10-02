/* 首頁:今日任務、整體進度、14 天計畫 */
(function () {
  const { h, S } = APP, D = APP.data;
  const lessonMap = () => Object.fromEntries(D.lessons.map((l) => [l.id, l]));
  const scMap = () => Object.fromEntries(D.scenarios.map((s) => [s.id, s]));
  const procMap = () => Object.fromEntries(D.procedures.map((p) => [p.id, p]));
  const labMap = () => Object.fromEntries(D.labs.map((l) => [l.id, l]));
  const visualTitles = { fourstroke: '四行程引擎動畫', cvt: 'CVT 動畫', evflow: '電動車能量流', nostart: '發不動診斷樹' };

  const planKey = (day, i) => 'd' + day + '-' + i;
  const cardsToday = () => (S.cardLog && S.cardLog[APP.today()]) || 0;
  const unresolved = () => S.mistakes.filter((m) => !m.resolved).length;

  // 把計畫任務轉成 {label, href, done, icon}
  APP.taskInfo = function (task, day, i) {
    switch (task.k) {
      case 'lesson': return { icon: 'book-open', label: '讀:' + lessonMap()[task.id].title, href: '#/learn/' + task.id, done: APP.done.lesson(task.id) };
      case 'sc': return { icon: 'search', label: '診斷:' + scMap()[task.id].title, href: '#/diagnose/' + task.id, done: APP.done.scenario(task.id) };
      case 'proc': return { icon: 'wrench', label: '演練:' + procMap()[task.id].title, href: '#/proc/' + task.id, done: APP.done.proc(task.id) };
      case 'lab': return { icon: 'zap', label: '電表:' + labMap()[task.id].title, href: '#/lab/' + task.id, done: APP.done.lab(task.id) };
      case 'visual': return { icon: 'film', label: '看動畫:' + visualTitles[task.id], href: '#/visual/' + task.id, done: !!(S.visualSeen && S.visualSeen[task.id]) };
      case 'cards': return { icon: 'layers', label: '術語閃卡 10 張', href: '#/cards', done: cardsToday() >= 10 };
      case 'mistakes': return { icon: 'notebook-pen', label: '複習錯題本', href: '#/mistakes', done: unresolved() === 0 };
      case 'parts': return { icon: 'bike', label: '逛一遍零件地圖(至少點 6 個零件)', href: '#/parts', done: (S.partsSeen || []).length >= 6 };
      case 'exam': return { icon: 'clipboard-list', label: '綜合測驗(10 題)', href: '#/learn/exam', done: !!(S.exam && S.exam.best != null) };
      case 'real': return { icon: 'hammer', label: '實作:' + task.label, href: null, done: !!S.plan[planKey(day, i)], manual: planKey(day, i) };
      default: return { icon: 'info', label: '?', href: null, done: false };
    }
  };

  function taskRow(task, day, i, onToggle) {
    const t = APP.taskInfo(task, day, i);
    const body = [h('div', { class: 'tick', 'aria-hidden': 'true' }, t.done ? APP.icon('check', 15) : ''), APP.icon(t.icon, 18), h('div', { style: { flex: 1 } }, t.label)];
    if (t.href) return h('a', { class: 'lesson-item' + (t.done ? ' done' : ''), href: t.href }, body, h('span', { class: 'sr-only' }, t.done ? '(已完成)' : '(未完成)'), APP.icon('chevron-right', 18));
    return h('button', { type: 'button', class: 'lesson-item' + (t.done ? ' done' : ''), 'aria-pressed': String(t.done), onclick: () => { S.plan[t.manual] = !S.plan[t.manual]; APP.save(); onToggle(); } },
      body, h('span', { class: 'pill gray' }, t.done ? '已完成' : '完成後點我'));
  }

  function currentDay() {
    if (!S.planStart) return null;
    const diff = Math.floor((new Date(APP.today()) - new Date(S.planStart)) / 86400000);
    return Math.min(14, Math.max(1, diff + 1));
  }

  function pct(done, total) { return total ? Math.round((done / total) * 100) : 0; }

  // 主視覺插畫:藍圖風格的速克達,線條會「畫」出來,面板再淡入
  function heroArt() {
    const pop = (x, y, lx, ly, label, d) => `<g class="pop" style="animation-delay:${d}s"><path d="M${x} ${y} L${lx} ${ly + 10}" stroke="var(--accent-hi)" stroke-width="1.5" stroke-dasharray="3 4" fill="none"/><circle cx="${x}" cy="${y}" r="5.5" fill="var(--accent-hi)"/><circle cx="${x}" cy="${y}" r="11" fill="none" stroke="var(--accent-hi)" stroke-opacity=".35" stroke-width="2"/><rect x="${lx - label.length * 8 - 10}" y="${ly - 16}" width="${label.length * 16 + 20}" height="28" rx="9" fill="var(--text)"/><text x="${lx}" y="${ly + 3}" text-anchor="middle" fill="var(--bg)" font-size="14" font-weight="700">${label}</text></g>`;
    const wheel = (cx) => `<circle class="draw" cx="${cx}" cy="274" r="52" fill="none" stroke="var(--text)" stroke-width="9"/><circle class="draw" cx="${cx}" cy="274" r="36" fill="var(--card)" stroke="var(--text)" stroke-width="2"/><g class="spin"><path d="M${cx} 244v60M${cx - 30} 274h60M${cx - 21} 253l42 42M${cx + 21} 253l-42 42" stroke="var(--muted)" stroke-width="2" stroke-linecap="round"/></g><circle cx="${cx}" cy="274" r="9" fill="var(--text)"/>`;
    return `<svg class="hero-art" viewBox="0 0 520 360" role="img" aria-label="速克達線稿插圖,標示碟煞、火星塞與 CVT 的位置">
      <defs><linearGradient id="hpanel" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="var(--card)"/><stop offset="1" stop-color="var(--bg2)"/></linearGradient></defs>
      <path d="M36 328H496" stroke="var(--border2)" stroke-width="2" stroke-dasharray="2 9" fill="none"/>
      <g stroke-linecap="round" stroke-linejoin="round">
        ${wheel(128)}${wheel(398)}
        <path class="draw" d="M128 274 L176 106" stroke="var(--text)" stroke-width="8" fill="none"/>
        <path class="draw" d="M176 106 L196 86 L240 90" stroke="var(--text)" stroke-width="6" fill="none"/>
        <path class="draw" d="M430 254 L452 206" stroke="var(--muted)" stroke-width="7" fill="none"/>
        <path class="draw fillin" d="M330 246 H420 Q440 246 440 266 V276 Q440 294 420 294 H352 Q330 294 330 272 Z" fill="url(#hpanel)" stroke="var(--text)" stroke-width="2.5"/>
        <circle class="draw" cx="372" cy="270" r="15" fill="none" stroke="var(--text)" stroke-width="2"/>
        <path class="draw" d="M344 300 C388 314 434 312 470 294" stroke="var(--muted)" stroke-width="6" fill="none"/>
        <path class="draw fillin" d="M170 104 C190 98 204 108 210 122 C228 162 238 204 242 244 L218 248 C212 204 198 160 176 128 Z" fill="url(#hpanel)" stroke="var(--text)" stroke-width="3"/>
        <path class="draw fillin" d="M218 240 H336 Q344 240 344 248 Q344 256 336 256 H218 Z" fill="url(#hpanel)" stroke="var(--text)" stroke-width="3"/>
        <path class="draw fillin" d="M326 252 C318 222 330 196 362 188 L472 180 C494 180 506 200 496 220 C488 238 468 248 440 250 Z" fill="url(#hpanel)" stroke="var(--text)" stroke-width="3"/>
        <path class="draw fillin" d="M342 188 C352 166 380 156 420 154 H478 C494 154 500 168 490 178 L362 190 Z" fill="var(--text)" stroke="var(--text)" stroke-width="2"/>
        <path class="draw" d="M494 200 L500 210" stroke="var(--accent-hi)" stroke-width="7" fill="none"/>
        <ellipse class="draw" cx="174" cy="122" rx="8" ry="13" fill="none" stroke="var(--accent-hi)" stroke-width="4"/>
        <path d="M76 350 H180 M76 344 V356 M180 344 V356" stroke="var(--muted)" stroke-width="1.2" fill="none"/>
      </g>
      <text x="128" y="349" text-anchor="middle" font-size="11" fill="var(--muted)" font-family="ui-monospace,monospace">Ø 12″</text>
      ${pop(128, 274, 44, 186, '碟煞', 1.5)}${pop(352, 250, 268, 52, '火星塞', 1.8)}${pop(372, 270, 470, 110, 'CVT', 2.1)}
    </svg>`;
  }

  // 儀表盤(240° 弧)
  function gauge(icon, label, done, total, href) {
    const r = 52, cx = 75, cy = 74, a0 = 150, sweep = 240;
    const pt = (deg) => [cx + r * Math.cos((deg * Math.PI) / 180), cy + r * Math.sin((deg * Math.PI) / 180)];
    const [x0, y0] = pt(a0), [x1, y1] = pt(a0 + sweep);
    const len = (Math.PI * 2 * r * sweep) / 360, f = total ? done / total : 0;
    const ticks = Array.from({ length: 9 }, (_, k) => { const d = a0 + (sweep * k) / 8, [ax, ay] = pt(d); const bx = cx + (r - 9) * Math.cos((d * Math.PI) / 180), by = cy + (r - 9) * Math.sin((d * Math.PI) / 180); return `<line class="g-tick" x1="${ax}" y1="${ay}" x2="${bx}" y2="${by}" stroke-width="2"/>`; }).join('');
    const svg = `<svg viewBox="0 0 150 128" aria-hidden="true"><path class="g-track" d="M${x0} ${y0} A${r} ${r} 0 1 1 ${x1} ${y1}" fill="none" stroke-width="12" stroke-linecap="round"/>
      <path class="g-val" d="M${x0} ${y0} A${r} ${r} 0 1 1 ${x1} ${y1}" fill="none" stroke-width="12" stroke-linecap="round" stroke-dasharray="${len}" stroke-dashoffset="${len}" data-off="${len * (1 - f)}"/>${ticks}
      <text class="g-num" x="75" y="84" text-anchor="middle">${done}</text><text class="g-sub" x="75" y="104" text-anchor="middle">/ ${total}</text></svg>`;
    const el = h('a', { class: 'gauge', href, 'aria-label': `${label}:完成 ${done} / ${total}` }, h('div', { html: svg }), h('b', null, APP.icon(icon, 17), label));
    requestAnimationFrame(() => requestAnimationFrame(() => { const v = el.querySelector('.g-val'); if (v) v.style.strokeDashoffset = v.dataset.off; }));
    return el;
  }

  APP.views.home = function (main) {
    const lDone = D.lessons.filter((l) => APP.done.lesson(l.id)).length;
    const sDone = D.scenarios.filter((s) => APP.done.scenario(s.id)).length;
    const pDone = D.procedures.filter((p) => APP.done.proc(p.id)).length;
    const mastered = Object.values(S.bank || {}).filter((r) => (r.box || 0) >= 3).length;
    const next = D.lessons.find((l) => !APP.done.lesson(l.id));

    main.append(h('section', { class: 'hero', 'aria-labelledby': 'hero-title' }, h('div', { class: 'hero-grid' },
      h('div', null,
        h('span', { class: 'eyebrow' }, '零基礎 · 燃油 + 電動機車'),
        h('h1', { class: 'display', id: 'hero-title', html: '把機車<em>修好</em>,<br>從看懂開始。' }),
        h('p', { class: 'lead' }, '看動畫懂原理、用虛擬三用電表量測、在模擬案例裡找故障,再用官方題庫準備丙級與乙級。每一步都有白話說明和實物照片。'),
        h('div', { class: 'row', style: { marginTop: '22px', gap: '12px' } },
          next ? h('a', { class: 'btn primary lg', href: '#/learn/' + next.id }, APP.icon(lDone ? 'play' : 'arrow-right', 20), lDone ? '繼續:' + next.title : '開始第一課')
            : h('a', { class: 'btn primary lg', href: '#/cert' }, APP.icon('graduation-cap', 20), '教材完成!去考照練習'),
          h('a', { class: 'btn lg', href: '#/cert' }, APP.icon('graduation-cap', 20), '丙/乙級考照')),
        h('p', { class: 'muted small', style: { marginTop: '18px' } }, '18 堂課 · 1,315 題官方學科題庫 · 11 個診斷案例 · 55 張實物照片 · 可離線使用')),
      h('div', { html: heroArt() }))));

    main.append(h('div', { class: 'section-head' }, h('h2', null, '你的進度'), h('a', { href: '#/plan', class: 'small' }, '看 14 天課表 →')));
    main.append(h('div', { class: 'gauges' },
      gauge('book-open', '教材', lDone, D.lessons.length, '#/learn'),
      gauge('graduation-cap', '題庫熟練', mastered, 1315, '#/cert'),
      gauge('search', '診斷案例', sDone, D.scenarios.length, '#/diagnose'),
      gauge('wrench', '流程演練', pDone, D.procedures.length, '#/proc')));

    const todayBox = h('div');
    main.append(h('div', { class: 'section-head' }, h('h2', null, '今天要做的事'), null), todayBox);
    function renderToday() {
      todayBox.innerHTML = '';
      const day = currentDay();
      if (!day) {
        todayBox.append(h('div', { class: 'card' },
          h('div', { class: 'row', style: { gap: '16px', alignItems: 'flex-start' } }, h('div', { class: 'tile', style: { padding: 0, border: 0, boxShadow: 'none', background: 'none' } }, h('div', { class: 'ti' }, APP.icon('calendar-days', 22))),
            h('div', { style: { flex: 1, minWidth: '240px' } }, h('h3', { style: { marginTop: 0 } }, '14 天上手計畫'),
              h('p', { class: 'muted', style: { marginTop: 0 } }, '每天約 2–3 小時,從安全與工具一路到電動機車診斷。按下開始,首頁就會依日期列出今天的任務;時間不夠也沒關係,進度是照完成度算的。'),
              h('div', { class: 'row' }, h('button', { class: 'btn primary', type: 'button', onclick: () => { S.planStart = APP.today(); APP.save(); renderToday(); } }, APP.icon('play', 18), '從今天開始 Day 1'),
                h('a', { class: 'btn', href: '#/plan' }, '先看完整課表'))))));
        return;
      }
      const p = D.plan[day - 1];
      const doneN = p.tasks.filter((t, i) => APP.taskInfo(t, day, i).done).length;
      todayBox.append(h('div', { class: 'card' },
        h('div', { class: 'row spread' }, h('h3', { style: { margin: 0 } }, `Day ${day} · ${p.title}`), h('span', { class: 'pill' + (doneN === p.tasks.length ? ' ok' : '') }, `${doneN} / ${p.tasks.length} 完成`)),
        h('div', { class: 'bar', style: { margin: '12px 0 14px' } }, h('i', { style: { width: pct(doneN, p.tasks.length) + '%' } })),
        h('div', null, p.tasks.map((t, i) => taskRow(t, day, i, renderToday))),
        h('div', { class: 'row mt' }, h('a', { class: 'btn small', href: '#/plan' }, '完整 14 天課表'),
          h('button', { class: 'btn small ghost', type: 'button', onclick: () => { if (confirm('要重新從今天開始 Day 1 嗎?(學習進度不會消失)')) { S.planStart = APP.today(); APP.save(); renderToday(); } } }, APP.icon('rotate-ccw', 16), '重設起始日'))));
    }
    renderToday();

    const tile = (href, icon, title, desc) => h('a', { class: 'tile', href }, h('div', { class: 'ti' }, APP.icon(icon, 22)), h('div', null, h('b', null, title), h('span', null, desc)));
    main.append(h('div', { class: 'section-head' }, h('h2', null, '所有練習')), h('div', { class: 'tiles' },
      tile('#/learn', 'map', '學習地圖', '6 階段 18 堂課,每章附小測驗'),
      tile('#/cert', 'graduation-cap', '考照練習', '丙級 599 題、乙級 716 題,白話解析'),
      tile('#/diagnose', 'search', '診斷實戰', '自己選檢查項目,找出真正的故障'),
      tile('#/lab', 'zap', '電表實驗室', '虛擬三用電表,選錯檔位有後果'),
      tile('#/proc', 'wrench', '流程演練', '備料到完工,產出作業檢查表'),
      tile('#/gallery', 'camera', '工具零件圖鑑', '55 張實物照片,點開放大'),
      tile('#/visual', 'film', '動畫圖解', '四行程、CVT、電動車能量流'),
      tile('#/brands', 'tag', '車款專區', 'SYM · SUZUKI · GOGORO 規格對照')));

    const un = unresolved();
    if (un > 0) main.append(h('div', { class: 'callout' }, h('div', { class: 'ttl' }, APP.icon('notebook-pen', 18), `你有 ${un} 個還沒搞懂的題目`), h('p', null, '錯題是進步最快的地方。'), h('a', { class: 'btn small', href: '#/mistakes' }, '去複習')));
    main.append(h('div', { class: 'callout warn', style: { marginTop: '28px' } }, h('div', { class: 'ttl' }, APP.icon('triangle-alert', 18), '老實說'),
      h('p', { html: APP.rich('模擬能幫你建立「知識地圖」與「判斷流程」,但**手上的力道、聲音的細微差別、卡住的螺絲**,只有實車能教你。請把本系統當作上場前的訓練,並在師傅指導下做第一次實車練習。') })));
  };

  APP.views.plan = function (main) {
    main.append(h('h1', null, '14 天課表'), h('p', { class: 'muted' }, '每天約 2–3 小時。灰色圓圈 = 尚未完成,綠色勾 = 已完成(系統會自動偵測)。'));
    const cur = currentDay();
    D.plan.forEach((p) => {
      const card = h('div', { class: 'card' });
      const render = () => {
        card.innerHTML = '';
        const dn = p.tasks.filter((t, i) => APP.taskInfo(t, p.day, i).done).length;
        card.append(h('div', { class: 'row spread' }, h('h3', { style: { margin: 0 } }, `Day ${p.day} · ${p.title}${cur === p.day ? '(今天)' : ''}`), h('span', { class: 'pill' + (dn === p.tasks.length ? ' ok' : '') }, `${dn} / ${p.tasks.length}`)),
          h('div', { class: 'mt' }, p.tasks.map((t, i) => taskRow(t, p.day, i, render))));
      };
      render();
      main.append(card);
    });
  };
})();
