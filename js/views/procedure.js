/* 流程演練 + SOP 檢查表 */
(function () {
  const { h, S } = APP, D = APP.data;
  const stars = (n) => '★'.repeat(n) + '☆'.repeat(3 - n);
  const typeLabel = { ice: '燃油機車', ev: '電動機車' };

  function list(main) {
    main.append(h('h1', null, '🔧 流程演練'), h('p', { class: 'muted' }, '把一項保養拆成「備料 → 逐步操作」。每一步都有真實新手會犯的錯,選錯會告訴你**為什麼錯、後果是什麼**。完成後可以得到一張**可列印的作業檢查表**,帶去現場用。'));
    main.append(h('div', { class: 'row mb' }, h('a', { class: 'btn', href: '#/sop' }, '🖨️ 全部作業檢查表(可列印)')));
    main.append(h('div', { class: 'grid auto' }, D.procedures.map((p) => {
      const rec = S.procs[p.id];
      return h('a', { class: 'card', href: '#/proc/' + p.id, style: { margin: 0, textDecoration: 'none', color: 'inherit' } },
        h('div', { class: 'row spread' }, h('span', { class: 'pill' + (p.type === 'ev' ? ' info' : '') }, typeLabel[p.type]), h('span', { class: 'muted small' }, '難度 ' + stars(p.level))),
        h('h3', { style: { marginTop: '10px' } }, p.title), h('div', { class: 'muted small' }, p.intro),
        h('div', { class: 'mt row' }, h('span', { class: 'pill gray' }, '⏱ ' + p.time), h('span', { class: 'pill gray' }, p.steps.length + ' 步'), rec && rec.best != null ? h('span', { class: 'pill ok' }, '最佳 ' + rec.best + '%') : null));
    })));
  }

  function play(main, p) {
    const root = h('div');
    main.append(h('p', null, h('a', { href: '#/proc' }, '← 流程演練')), root);
    let firstTryOk = 0, prepScore = 0;

    function intro() {
      root.innerHTML = '';
      root.append(h('h1', null, p.title), h('div', { class: 'row' }, h('span', { class: 'pill' + (p.type === 'ev' ? ' info' : '') }, typeLabel[p.type]), h('span', { class: 'pill gray' }, '⏱ ' + p.time), h('span', { class: 'pill gray' }, p.steps.length + ' 步')),
        h('p', { class: 'muted' }, p.intro),
        p.type === 'ev' ? h('div', { class: 'callout warn' }, h('div', { class: 'ttl' }, '⚠️ 高壓安全'), h('p', null, '這是「外部安全程序」的練習,不是教你拆電池包。請先讀過「電動機車安全作業」那一章。')) : null,
        h('button', { class: 'btn primary', onclick: prep }, '開始 →'));
    }

    function prep() {
      root.innerHTML = '';
      const chosen = new Set();
      const chips = APP.shuffle(p.prep.tools).map((tool) => {
        const c = h('span', { class: 'tool-chip' }, tool.n);
        c.onclick = () => { if (c.dataset.locked) return; if (chosen.has(tool)) { chosen.delete(tool); c.classList.remove('sel'); } else { chosen.add(tool); c.classList.add('sel'); } };
        c._tool = tool;
        return c;
      });
      const fb = h('div');
      const confirmBtn = h('button', { class: 'btn primary', onclick: () => {
        let right = 0; fb.innerHTML = '';
        const notes = [];
        chips.forEach((c) => {
          c.dataset.locked = '1';
          const picked = chosen.has(c._tool), need = c._tool.need;
          const ok = picked === need;
          c.classList.remove('sel'); c.classList.add(ok ? 'right' : 'wrong');
          if (ok) right++;
          else notes.push(`**${c._tool.n}**:${need ? '需要但你沒選' : '不需要卻選了'}。${c._tool.why}`);
        });
        prepScore = Math.round((right / chips.length) * 100);
        if (notes.length) { APP.logMistake({ kind: 'proc', src: p.id, title: p.title + ':備料', detail: notes.join(' / ').replace(/\*\*/g, '') }); }
        fb.append(h('div', { class: 'explain ' + (notes.length ? 'badx' : 'good') }, h('strong', null, `備料正確率 ${prepScore}%`),
          notes.length ? h('ul', null, notes.map((n) => h('li', { html: APP.rich(n) }))) : h('p', null, '完美!工具與材料都選對了。')));
        fb.append(h('div', { class: 'mt' }, h('button', { class: 'btn primary', onclick: () => step(0) }, '進入作業步驟 →')));
        confirmBtn.disabled = true;
      } }, '確認備料');
      root.append(h('h2', { style: { marginTop: 0 } }, '🧰 第 0 步:備料'), h('p', null, p.prep.prompt), h('div', null, chips), h('div', { class: 'mt' }, confirmBtn), fb);
    }

    function step(i) {
      root.innerHTML = '';
      const s = p.steps[i];
      let tried = false, solved = false;
      const fb = h('div');
      root.append(h('div', { class: 'row spread' }, h('span', { class: 'step-no' }, `步驟 ${i + 1} / ${p.steps.length}`), h('span', { class: 'muted small' }, `首次答對 ${firstTryOk} 步`)),
        h('div', { class: 'bar', style: { margin: '8px 0 14px' } }, h('i', { style: { width: (i / p.steps.length) * 100 + '%' } })),
        h('h2', { style: { marginTop: 0 } }, s.title), h('div', { class: 'scene', html: '🔎 ' + APP.rich(s.scene) }), h('h3', { html: APP.rich(s.q) }));
      const btns = APP.shuffle(s.options).map((o) => h('button', { class: 'opt', html: APP.rich(o.t), onclick: function () {
        if (solved) return;
        if (o.ok) {
          solved = true; this.classList.add('right');
          if (!tried) firstTryOk++;
          btns.forEach((b) => (b.disabled = true));
          fb.append(h('div', { class: 'explain good', html: '✅ ' + APP.rich(o.why) }), h('div', { class: 'mt' }, h('button', { class: 'btn primary', onclick: () => (i + 1 < p.steps.length ? step(i + 1) : summary()) }, i + 1 < p.steps.length ? '下一步 →' : '完成,看結果')));
        } else {
          this.classList.add('wrong'); this.disabled = true;
          if (!tried) APP.logMistake({ kind: 'proc', src: p.id, title: `${p.title}:${s.title}`, detail: `你選了「${o.t}」。${o.why}` });
          tried = true;
          fb.append(h('div', { class: 'explain badx', html: '❌ ' + APP.rich(o.why) + '<br><span class="muted small">再想想,選另一個。</span>' }));
        }
      } }));
      root.append(...btns, fb);
    }

    function summary() {
      const total = p.steps.length;
      const pct = Math.round((firstTryOk / total) * 100);
      const rec = S.procs[p.id] || { attempts: 0 };
      rec.attempts++; rec.best = Math.max(rec.best == null ? 0 : rec.best, pct); S.procs[p.id] = rec; APP.save();
      root.innerHTML = '';
      root.append(h('div', { class: 'card center' }, h('div', { class: 'muted' }, p.title), h('div', { class: 'score-ring' }, firstTryOk + ' / ' + total),
        h('p', null, `首次答對 ${pct}%,備料正確率 ${prepScore}%。` + (pct >= 80 ? ' 這個流程你已經很有概念了。' : ' 建議再練一次,錯的地方會進錯題本。'))));
      root.append(sopCard(p));
      if (p.notes) root.append(h('div', { class: 'callout key' }, h('div', { class: 'ttl' }, '📌 補充'), h('ul', null, p.notes.map((n) => h('li', { html: APP.rich(n) })))));
      root.append(h('div', { class: 'row noprint' }, h('button', { class: 'btn primary', onclick: () => { firstTryOk = 0; intro(); window.scrollTo(0, 0); } }, '↻ 再練一次'), h('button', { class: 'btn', onclick: () => window.print() }, '🖨️ 列印檢查表'), h('a', { class: 'btn ghost', href: '#/proc' }, '回流程列表')));
    }

    intro();
  }

  function sopCard(p) {
    return h('div', { class: 'card' }, h('h3', { style: { marginTop: 0 } }, '📋 作業檢查表:' + p.title),
      h('p', { class: 'muted small' }, '實車作業時照著做,每完成一步就打勾。扭力與規格以車型手冊為準。'),
      h('div', null, h('strong', null, '備料:'), ' ' + p.prep.tools.filter((t) => t.need).map((t) => t.n).join('、')),
      h('ol', { style: { paddingLeft: '1.3em' } }, p.steps.map((s) => h('li', { style: { margin: '6px 0' } }, h('label', null, h('input', { type: 'checkbox', style: { marginRight: '8px' } }), h('strong', null, s.title + ':'), s.sop)))));
  }

  APP.views.proc = function (main, params) {
    if (!params.length) return list(main);
    const p = D.procedures.find((x) => x.id === params[0]);
    if (!p) return list(main);
    play(main, p);
  };

  APP.views.sop = function (main) {
    main.append(h('h1', null, '🖨️ 作業檢查表'), h('p', { class: 'muted noprint' }, '所有流程的標準作業步驟。可以直接列印,貼在工作檯旁。'), h('div', { class: 'noprint mb' }, h('button', { class: 'btn primary', onclick: () => window.print() }, '列印 / 存成 PDF')));
    D.procedures.forEach((p) => main.append(sopCard(p)));
  };
})();
