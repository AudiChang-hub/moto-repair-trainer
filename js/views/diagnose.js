/* 診斷實戰 */
(function () {
  const { h, S } = APP, D = APP.data;
  const GROUPS = ['問診', '觀察', '基本檢查', '量測', '進階檢查'];
  const stars = (n) => '★'.repeat(n) + '☆'.repeat(3 - n);
  const typeLabel = { ice: '燃油機車', ev: '電動機車' };
  const vLabel = { key: ['關鍵檢查', 'ok'], ok: ['合理檢查', 'info'], waste: ['浪費時間', 'warn'], bad: ['危險/錯誤操作', 'bad'] };

  function list(main) {
    main.append(h('h1', null, '🔍 診斷實戰'), h('p', { class: 'muted' }, '客戶開著車進來,你是師傅。你決定要做哪些檢查、花多少時間,最後下診斷。**跟真實一樣:每個檢查都花時間,有些會浪費,有些很危險。**'));
    main.append(h('div', { class: 'callout' }, h('div', { class: 'ttl' }, '怎麼評分?'),
      h('ul', null, h('li', null, '找對原因、選對修法'), h('li', null, '有做到「關鍵檢查」(不是憑運氣猜對)'), h('li', null, '少做浪費的檢查、不要做危險操作、少用提示'))));
    let filter = 'all';
    const box = h('div');
    const tabs = h('div', { class: 'row mb' });
    const render = () => {
      tabs.innerHTML = '';
      [['all', '全部'], ['ice', '燃油機車'], ['ev', '電動機車']].forEach(([k, t]) => tabs.append(h('button', { class: 'btn small' + (filter === k ? ' primary' : ''), onclick: () => { filter = k; render(); } }, t)));
      box.innerHTML = '';
      const items = D.scenarios.filter((s) => filter === 'all' || s.type === filter);
      box.append(h('div', { class: 'grid auto' }, items.map((s) => {
        const rec = S.scenarios[s.id];
        return h('a', { class: 'card', href: '#/diagnose/' + s.id, style: { margin: 0, textDecoration: 'none', color: 'inherit' } },
          h('div', { class: 'row spread' }, h('span', { class: 'pill' + (s.type === 'ev' ? ' info' : '') }, typeLabel[s.type]), h('span', { class: 'muted small' }, '難度 ' + stars(s.level))),
          h('h3', { style: { marginTop: '10px' } }, s.title),
          h('div', { class: 'muted small' }, s.bike),
          h('div', { class: 'mt' }, rec && rec.best != null ? h('span', { class: 'pill ok' }, `最佳 ${rec.best} 分 · 練習 ${rec.attempts} 次`) : h('span', { class: 'pill gray' }, '尚未挑戰')));
      })));
    };
    main.append(tabs, box);
    render();
  }

  function play(main, sc) {
    const ran = []; // {t, order}
    let time = 0, hintsUsed = 0;
    const root = h('div');
    main.append(h('p', null, h('a', { href: '#/diagnose' }, '← 案例列表')), root);

    const minutesOf = (arr) => arr.reduce((a, t) => a + t.t, 0);

    function investigate() {
      root.innerHTML = '';
      const side = h('div', { class: 'diag-side' });
      const mainCol = h('div');
      side.append(h('div', { class: 'card', style: { marginTop: 0 } },
        h('div', { class: 'row' }, h('span', { class: 'pill' + (sc.type === 'ev' ? ' info' : '') }, typeLabel[sc.type]), h('span', { class: 'muted small' }, '難度 ' + stars(sc.level))),
        h('h2', { style: { marginTop: '10px' } }, sc.title),
        h('div', { class: 'muted small' }, '🛵 ' + sc.bike),
        h('div', { class: 'scene', html: '🗣️ ' + APP.rich(sc.customer) }),
        h('div', { class: 'row spread' }, h('div', null, h('div', { class: 'muted small' }, '已花時間'), h('div', { class: 'clock' }, time + ' 分')), h('div', null, h('div', { class: 'muted small' }, '已做檢查'), h('div', { class: 'clock' }, ran.length))),
        h('div', { class: 'row mt' },
          h('button', { class: 'btn primary', onclick: diagnose }, '我要下診斷 →'),
          h('button', { class: 'btn small ghost', onclick: () => {
            if (hintsUsed >= sc.hints.length) return APP.toast('提示都用完了');
            hintsUsed++; hintBox.append(h('div', { class: 'callout', style: { margin: '8px 0 0' }, html: '💡 ' + APP.rich(sc.hints[hintsUsed - 1]) }));
            APP.toast('用了 1 次提示(扣 6 分)');
          } }, '💡 提示(扣分)')),
        (hintBox = h('div'))));
      // 已用提示保留
      for (let i = 0; i < hintsUsed; i++) hintBox.append(h('div', { class: 'callout', style: { margin: '8px 0 0' }, html: '💡 ' + APP.rich(sc.hints[i]) }));

      GROUPS.forEach((g) => {
        const tests = sc.tests.filter((t) => t.g === g);
        if (!tests.length) return;
        const grp = h('div', { class: 'test-group' }, h('h3', null, g));
        tests.forEach((t) => {
          const done = ran.includes(t);
          const card = h('div', { class: 'test' + (done ? ' done' : '') + (done && t.v === 'bad' ? ' danger' : '') });
          const btn = h('button', { disabled: !!done, onclick: () => { const y = window.scrollY; ran.push(t); time = minutesOf(ran); investigate(); window.scrollTo({ top: y }); } },
            h('span', null, (done ? '✔ ' : '') + t.label), h('span', { class: 'pill gray' }, t.t + ' 分'));
          card.append(btn);
          if (done) card.append(h('div', { class: 'res', html: (t.v === 'bad' ? '⛔ ' : '📋 ') + APP.rich(t.r) }));
          grp.append(card);
        });
        mainCol.append(grp);
      });
      root.append(h('div', { class: 'diag' }, side, mainCol));
    }
    let hintBox;

    function diagnose() {
      root.innerHTML = '';
      let cause = null, fix = null;
      const causes = APP.shuffle(sc.causes), fixes = APP.shuffle(sc.fixes);
      const submit = h('button', { class: 'btn primary', disabled: true, onclick: report }, '送出診斷');
      const sync = () => { submit.disabled = !(cause && fix); };
      const radios = (arr, name, getLabel, onPick) => arr.map((o) => {
        const row = h('label', { class: 'choice' }, h('input', { type: 'radio', name }), h('span', { html: APP.rich(getLabel(o)) }));
        row.querySelector('input').onchange = () => { row.parentElement.querySelectorAll('.choice').forEach((c) => c.classList.remove('sel')); row.classList.add('sel'); onPick(o); sync(); };
        return row;
      });
      root.append(h('h1', null, '🩺 下診斷'),
        h('div', { class: 'card' }, h('strong', null, '你的檢查紀錄(' + ran.length + ' 項,共 ' + time + ' 分)'),
          ran.length ? h('ul', { class: 'tl' }, ran.map((t) => h('li', null, h('span', { class: 'pill gray' }, t.g), h('div', null, h('div', null, t.label), h('div', { class: 'muted small', html: APP.rich(t.r) }))))) : h('p', { class: 'muted' }, '你還沒有做任何檢查,等於憑感覺下診斷。')),
        h('div', { class: 'card' }, h('h3', { style: { marginTop: 0 } }, '① 根本原因是?'), radios(causes, 'cause', (o) => o.label, (o) => (cause = o))),
        h('div', { class: 'card' }, h('h3', { style: { marginTop: 0 } }, '② 你要怎麼修?'), radios(fixes, 'fix', (o) => o.label, (o) => (fix = o))),
        h('div', { class: 'row' }, h('button', { class: 'btn', onclick: investigate }, '← 回去再檢查'), submit));
      function report() { result(cause, fix); }
    }

    function result(cause, fix) {
      const keys = sc.tests.filter((t) => t.v === 'key');
      const missing = keys.filter((k) => !ran.includes(k));
      const bads = ran.filter((t) => t.v === 'bad'), wastes = ran.filter((t) => t.v === 'waste');
      const causeOk = cause.id === sc.answer, fixOk = !!fix.ok;
      const lines = [['基本分', 100]];
      if (!causeOk) lines.push(['原因判斷錯誤', -40]); else if (!fixOk) lines.push(['修法選錯(原因對了)', -20]);
      if (bads.length) lines.push([`危險/錯誤操作 × ${bads.length}`, -25 * bads.length]);
      if (wastes.length) lines.push([`浪費的檢查 × ${wastes.length}`, -5 * wastes.length]);
      if (missing.length) lines.push([`漏做關鍵檢查 × ${missing.length}(沒有證據就下結論)`, -Math.min(30, 6 * missing.length)]);
      if (hintsUsed) lines.push([`使用提示 × ${hintsUsed}`, -6 * hintsUsed]);
      const expert = minutesOf(keys);
      if (time > expert * 2 + 20) lines.push(['總時間過長', -5]);
      const score = Math.max(0, lines.reduce((a, l) => a + l[1], 0));
      const grade = score >= 85 ? ['🏆 優秀', '你已經能獨立處理這類案例。'] : score >= 70 ? ['👍 良好', '方向對了,看看下面「可以更好」的地方。'] : score >= 50 ? ['📖 及格', '建議看一下專家路徑,再練一次。'] : ['💪 再練一次', '別氣餒,失誤是學習最快的時候。'];

      const rec = S.scenarios[sc.id] || { attempts: 0 };
      rec.attempts++; rec.best = Math.max(rec.best == null ? 0 : rec.best, score); rec.last = score;
      S.scenarios[sc.id] = rec; APP.save();
      if (!causeOk) APP.logMistake({ kind: 'diag', src: sc.id, title: '診斷案例:' + sc.title, detail: `你判斷:「${cause.label}」;實際原因:「${sc.causes.find((c) => c.id === sc.answer).label}」。` });
      else if (!fixOk) APP.logMistake({ kind: 'diag', src: sc.id, title: '診斷案例(修法):' + sc.title, detail: `你選:「${fix.label}」。${fix.why}` });
      bads.forEach((t) => APP.logMistake({ kind: 'diag', src: sc.id, title: '危險/錯誤操作:' + t.label, detail: t.r }));

      root.innerHTML = '';
      root.append(h('div', { class: 'card center' }, h('div', { class: 'muted' }, sc.title),
        h('div', { class: 'score-ring' }, score + ' 分'), h('h2', { style: { margin: 0 } }, grade[0]), h('p', { class: 'muted' }, grade[1])));
      root.append(h('div', { class: 'card' },
        h('h3', { style: { marginTop: 0 } }, causeOk ? '✅ 原因判斷正確' : '❌ 原因判斷有誤'),
        h('p', { html: '你的判斷:**' + APP.esc(cause.label) + '**' }),
        !causeOk ? h('p', { html: '正確答案:**' + APP.esc(sc.causes.find((c) => c.id === sc.answer).label) + '**' }) : null,
        h('h3', null, fixOk ? '✅ 修法正確' : '❌ 修法有誤'),
        h('p', { html: '你的選擇:**' + APP.esc(fix.label) + '**' }),
        !fixOk ? h('p', { class: 'explain badx', html: APP.rich(fix.why || '') }) : null,
        !fixOk ? h('p', { html: '建議做法:**' + APP.esc(sc.fixes.find((f) => f.ok).label) + '**' }) : null));
      root.append(h('div', { class: 'card' }, h('h3', { style: { marginTop: 0 } }, '📊 分數明細'),
        h('table', null, h('tbody', null, lines.map((l) => h('tr', null, h('td', null, l[0]), h('td', { style: { textAlign: 'right', color: l[1] < 0 ? 'var(--bad)' : 'inherit', fontWeight: 600 } }, (l[1] > 0 && l[0] !== '基本分' ? '+' : '') + l[1])))))));
      root.append(h('div', { class: 'card' }, h('h3', { style: { marginTop: 0 } }, '🧭 專家路徑(關鍵檢查)'),
        h('p', { class: 'muted small' }, `專家只需要約 ${expert} 分鐘、${keys.length} 項關鍵檢查;你花了 ${time} 分鐘、做了 ${ran.length} 項。`),
        h('ul', { class: 'tl' }, keys.map((k) => h('li', null, h('span', { class: 'pill ' + (ran.includes(k) ? 'ok' : 'bad') }, ran.includes(k) ? '有做' : '漏了'), h('div', null, h('div', null, k.label), h('div', { class: 'muted small', html: APP.rich(k.r) })))))));
      if (bads.length || wastes.length) {
        root.append(h('div', { class: 'card' }, h('h3', { style: { marginTop: 0 } }, '🔎 可以更好的地方'),
          h('ul', { class: 'tl' }, [...bads, ...wastes].map((t) => h('li', null, h('span', { class: 'pill ' + vLabel[t.v][1] }, vLabel[t.v][0]), h('div', null, h('div', null, t.label), h('div', { class: 'muted small', html: APP.rich(t.r) })))))));
      }
      root.append(h('div', { class: 'callout key' }, h('div', { class: 'ttl' }, '📌 這一案學到的'), h('p', { html: APP.rich(sc.recap) })));
      const idx = D.scenarios.findIndex((s) => s.id === sc.id), next = D.scenarios[idx + 1];
      root.append(h('div', { class: 'row' },
        h('button', { class: 'btn primary', onclick: () => { main.innerHTML = ''; window.scrollTo(0, 0); play(main, sc); } }, '↻ 再練一次'),
        next ? h('a', { class: 'btn', href: '#/diagnose/' + next.id }, '下一案:' + next.title) : null,
        h('a', { class: 'btn ghost', href: '#/diagnose' }, '回案例列表')));
    }

    investigate();
  }

  APP.views.diagnose = function (main, params) {
    if (!params.length) return list(main);
    const sc = D.scenarios.find((s) => s.id === params[0]);
    if (!sc) return list(main);
    play(main, sc);
  };
})();
