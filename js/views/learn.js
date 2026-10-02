/* 學習地圖與教材頁、綜合測驗 */
(function () {
  const { h, S } = APP, D = APP.data;

  function renderBlock(b) {
    switch (b.t) {
      case 'p': return h('p', { html: APP.rich(b.text) });
      case 'h': return h('h2', null, b.text);
      case 'list': return h('ul', null, b.items.map((i) => h('li', { html: APP.rich(i) })));
      case 'ol': return h('ol', null, b.items.map((i) => h('li', { html: APP.rich(i) })));
      case 'analogy': return h('div', { class: 'callout analogy' }, h('div', { class: 'ttl' }, '💡 ' + (b.title || '類比')), h('p', { html: APP.rich(b.text) }));
      case 'tip': return h('div', { class: 'callout' }, h('div', { class: 'ttl' }, '✅ ' + (b.title || '小提醒')), h('p', { html: APP.rich(b.text) }));
      case 'warn': return h('div', { class: 'callout warn' }, h('div', { class: 'ttl' }, '⚠️ ' + (b.title || '注意')), h('p', { html: APP.rich(b.text) }));
      case 'key': return h('div', { class: 'callout key' }, h('div', { class: 'ttl' }, '📌 重點整理'), h('ul', null, b.items.map((i) => h('li', { html: APP.rich(i) }))));
      case 'photos': { const els = b.ids.map((id) => APP.photo(id)).filter(Boolean); return els.length ? h('div', { class: 'photo-row' }, els) : h('div'); }
      case 'table': {
        // 欄位內容寫成 @photo:id 代表照片;若整欄照片都不存在就隱藏該欄
        const isPh = (c) => typeof c === 'string' && c.startsWith('@photo:');
        const showCol = b.head.map((_, ci) => !b.rows.some((r) => isPh(r[ci])) || b.rows.some((r) => isPh(r[ci]) && APP.hasPhoto(r[ci].slice(7))));
        return h('div', { class: 'table-wrap' }, h('table', null,
          h('thead', null, h('tr', null, b.head.map((x, ci) => (showCol[ci] ? h('th', null, x) : null)))),
          h('tbody', null, b.rows.map((r) => h('tr', null, r.map((c, ci) => (!showCol[ci] ? null : isPh(c) ? h('td', null, APP.thumb(c.slice(7)) || '') : h('td', { html: APP.rich(c) }))))))));
      }
      case 'widget': { const box = h('div'); APP.widgets[b.id](box); if (b.id !== 'nostart') markVisual(b.id); return box; }
      case 'link': return h('p', null, h('a', { class: 'btn', href: b.to }, b.label));
      default: return h('div');
    }
  }
  function markVisual(id) { S.visualSeen = S.visualSeen || {}; if (!S.visualSeen[id]) { S.visualSeen[id] = true; APP.save(); } }
  APP.markVisual = markVisual;

  function list(main) {
    main.append(h('h1', null, '🗺️ 學習地圖'), h('p', { class: 'muted' }, '按階段由淺入深。每章約 10–15 分鐘,最後有小測驗。你也可以跳著看,但建議第 0、1 階段先走完。'));
    const total = D.lessons.length, done = D.lessons.filter((l) => APP.done.lesson(l.id)).length;
    main.append(h('div', { class: 'card' }, h('div', { class: 'row spread' }, h('strong', null, '整體進度'), h('span', { class: 'muted' }, `${done} / ${total} 章`)),
      h('div', { class: 'bar mt' }, h('i', { style: { width: Math.round((done / total) * 100) + '%' } }))));
    D.stages.forEach((st) => {
      main.append(h('div', { class: 'stage-title' }, h('div', { class: 'num' }, st.n), h('div', null, h('strong', null, st.title), h('div', { class: 'muted small' }, st.desc))));
      D.lessons.filter((l) => l.stage === st.n).forEach((l) => {
        const d = APP.done.lesson(l.id);
        main.append(h('a', { class: 'lesson-item' + (d ? ' done' : ''), href: '#/learn/' + l.id },
          h('div', { class: 'tick' }, d ? '✓' : ''),
          h('div', { style: { flex: 1 } }, h('div', null, h('strong', null, l.title)), h('div', { class: 'muted small' }, l.summary)),
          h('span', { class: 'pill gray' }, l.min + ' 分')));
      });
    });
    main.append(h('div', { class: 'card mt' }, h('div', { class: 'row spread' }, h('div', null, h('strong', null, '📝 綜合測驗'), h('div', { class: 'muted small' }, '從所有章節隨機抽 10 題,檢驗整體吸收程度。' + (S.exam ? `(最佳:${S.exam.best} / 10)` : ''))), h('a', { class: 'btn primary', href: '#/learn/exam' }, '開始'))));
  }

  function exam(main) {
    main.append(h('p', null, h('a', { href: '#/learn' }, '← 學習地圖')), h('h1', null, '📝 綜合測驗'));
    const pool = D.lessons.flatMap((l) => l.quiz.map((q) => Object.assign({ src: l.title }, q)));
    const qs = APP.shuffle(pool).slice(0, 10);
    const box = h('div', { class: 'card' });
    main.append(box);
    APP.ui.quiz(box, qs, {
      src: '綜合測驗',
      onDone: (score) => { S.exam = S.exam || {}; S.exam.best = Math.max(S.exam.best || 0, score); S.exam.last = score; APP.save(); },
    });
  }

  function lesson(main, id) {
    const idx = D.lessons.findIndex((l) => l.id === id);
    if (idx < 0) return list(main);
    const l = D.lessons[idx];
    main.append(h('p', null, h('a', { href: '#/learn' }, '← 學習地圖')));
    main.append(h('div', { class: 'row' }, h('span', { class: 'pill' }, `第 ${l.stage} 階段:${D.stages[l.stage].title}`), h('span', { class: 'pill gray' }, `約 ${l.min} 分鐘`)));
    main.append(h('h1', { style: { marginTop: '8px' } }, l.title), h('p', { class: 'muted' }, l.summary));
    const body = h('div', { class: 'lesson-body' }, l.blocks.map(renderBlock));
    main.append(body);

    const quizBox = h('div', { class: 'card' });
    const startBtn = h('button', { class: 'btn primary', onclick: () => {
      quizBox.innerHTML = '';
      APP.ui.quiz(quizBox, l.quiz, { src: l.title, onDone: (score, total) => {
        const prev = S.lessons[l.id] || {};
        S.lessons[l.id] = { done: true, best: Math.max(prev.best || 0, score), total };
        APP.save();
        const next = D.lessons[idx + 1];
        quizBox.append(h('div', { class: 'row center', style: { justifyContent: 'center' } },
          next ? h('a', { class: 'btn primary', href: '#/learn/' + next.id }, '下一章:' + next.title + ' →') : h('a', { class: 'btn primary', href: '#/diagnose' }, '去做診斷實戰 →'),
          h('a', { class: 'btn', href: '#/learn' }, '回學習地圖')));
        APP.toast('✅ 本章完成');
      } });
    } }, APP.done.lesson(l.id) ? '再測一次' : '開始小測驗(' + l.quiz.length + ' 題)');
    quizBox.append(h('h2', { style: { marginTop: 0 } }, '🧪 小測驗'), h('p', { class: 'muted' }, '答對答錯都沒關係,錯的會進錯題本。完成測驗即算完成本章。'), startBtn);
    main.append(quizBox);
  }

  APP.views.learn = function (main, params) {
    if (!params.length) return list(main);
    if (params[0] === 'exam') return exam(main);
    return lesson(main, params[0]);
  };
})();
