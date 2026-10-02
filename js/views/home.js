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
      case 'lesson': return { icon: '📖', label: '讀:' + lessonMap()[task.id].title, href: '#/learn/' + task.id, done: APP.done.lesson(task.id) };
      case 'sc': return { icon: '🔍', label: '診斷:' + scMap()[task.id].title, href: '#/diagnose/' + task.id, done: APP.done.scenario(task.id) };
      case 'proc': return { icon: '🔧', label: '演練:' + procMap()[task.id].title, href: '#/proc/' + task.id, done: APP.done.proc(task.id) };
      case 'lab': return { icon: '⚡', label: '電表:' + labMap()[task.id].title, href: '#/lab/' + task.id, done: APP.done.lab(task.id) };
      case 'visual': return { icon: '🎞️', label: '看動畫:' + visualTitles[task.id], href: '#/visual/' + task.id, done: !!(S.visualSeen && S.visualSeen[task.id]) };
      case 'cards': return { icon: '🃏', label: '術語閃卡 10 張', href: '#/cards', done: cardsToday() >= 10 };
      case 'mistakes': return { icon: '📕', label: '複習錯題本', href: '#/mistakes', done: unresolved() === 0 };
      case 'parts': return { icon: '🏍️', label: '逛一遍零件地圖(至少點 6 個零件)', href: '#/parts', done: (S.partsSeen || []).length >= 6 };
      case 'exam': return { icon: '📝', label: '綜合測驗(10 題)', href: '#/learn/exam', done: !!(S.exam && S.exam.best != null) };
      case 'real': return { icon: '🛠️', label: '實作:' + task.label, href: null, done: !!S.plan[planKey(day, i)], manual: planKey(day, i) };
      default: return { icon: '•', label: '?', href: null, done: false };
    }
  };

  function taskRow(task, day, i, onToggle) {
    const t = APP.taskInfo(task, day, i);
    const row = h('div', { class: 'lesson-item' + (t.done ? ' done' : ''), style: { cursor: t.href ? 'pointer' : 'default' } },
      h('div', { class: 'tick' }, t.done ? '✓' : ''),
      h('div', { style: { flex: 1 } }, t.icon + ' ' + t.label));
    if (t.href) row.onclick = () => (location.hash = t.href);
    else if (t.manual) {
      row.onclick = () => { S.plan[t.manual] = !S.plan[t.manual]; APP.save(); onToggle(); };
      row.append(h('span', { class: 'pill gray' }, '點一下勾選'));
    }
    return row;
  }

  function currentDay() {
    if (!S.planStart) return null;
    const diff = Math.floor((new Date(APP.today()) - new Date(S.planStart)) / 86400000);
    return Math.min(14, Math.max(1, diff + 1));
  }

  function pct(done, total) { return total ? Math.round((done / total) * 100) : 0; }

  APP.views.home = function (main) {
    const lDone = D.lessons.filter((l) => APP.done.lesson(l.id)).length;
    const sDone = D.scenarios.filter((s) => APP.done.scenario(s.id)).length;
    const pDone = D.procedures.filter((p) => APP.done.proc(p.id)).length;
    const bDone = D.labs.filter((l) => APP.done.lab(l.id)).length;

    main.append(h('div', { class: 'hero' },
      h('h1', null, '🛵 機車維修訓練場'),
      h('p', { class: 'muted' }, '給零基礎的人。不用先懂理論,從「做」開始:看圖解 → 練流程 → 量電表 → 診斷真實案例。燃油機車與電動機車都有。'),
      h('div', { class: 'row mt' },
        h('a', { class: 'btn primary', href: '#/learn' }, '從學習地圖開始'),
        h('a', { class: 'btn', href: '#/diagnose' }, '直接挑戰診斷案例'),
        h('a', { class: 'btn ghost', href: '#/bridge' }, '怎麼走向實車?'))));

    // 進度
    main.append(h('div', { class: 'grid c2 mt' },
      ...[['📖 教材', lDone, D.lessons.length], ['🔍 診斷案例', sDone, D.scenarios.length], ['🔧 流程演練', pDone, D.procedures.length], ['⚡ 電表實驗', bDone, D.labs.length]].map(([t, d, n]) =>
        h('div', { class: 'card', style: { margin: 0 } },
          h('div', { class: 'row spread' }, h('strong', null, t), h('span', { class: 'muted' }, `${d} / ${n}`)),
          h('div', { class: 'bar mt' }, h('i', { style: { width: pct(d, n) + '%' } }))))));

    // 今日任務
    const todayBox = h('div');
    main.append(h('h2', null, '📅 14 天上手計畫'), todayBox);
    function renderToday() {
      todayBox.innerHTML = '';
      const day = currentDay();
      if (!day) {
        todayBox.append(h('div', { class: 'card' },
          h('p', null, '我幫你排好了 14 天的課表,每天約 2–3 小時,從安全與工具一路到電動機車診斷。按下開始,我會依日期顯示「今天該做什麼」。'),
          h('p', { class: 'muted small' }, '時間不夠沒關係:進度是按完成度算的,你可以把 14 天拉長成 4 週。'),
          h('div', { class: 'row' }, h('button', { class: 'btn primary', onclick: () => { S.planStart = APP.today(); APP.save(); renderToday(); } }, '從今天開始 Day 1'),
            h('a', { class: 'btn', href: '#/plan' }, '先看完整課表'))));
        return;
      }
      const p = D.plan[day - 1];
      const doneN = p.tasks.filter((t, i) => APP.taskInfo(t, day, i).done).length;
      todayBox.append(h('div', { class: 'card' },
        h('div', { class: 'row spread' }, h('h3', { style: { margin: 0 } }, `Day ${day}:${p.title}`), h('span', { class: 'pill' }, `${doneN} / ${p.tasks.length} 完成`)),
        h('div', { class: 'mt' }, p.tasks.map((t, i) => taskRow(t, day, i, renderToday))),
        h('div', { class: 'row mt' },
          h('a', { class: 'btn small', href: '#/plan' }, '看完整 14 天課表'),
          h('button', { class: 'btn small ghost', onclick: () => { if (confirm('要重新從今天開始 Day 1 嗎?(學習進度不會消失)')) { S.planStart = APP.today(); APP.save(); renderToday(); } } }, '重設起始日'))));
    }
    renderToday();

    const un = unresolved();
    if (un > 0) main.append(h('div', { class: 'callout' }, h('div', { class: 'ttl' }, `📕 你有 ${un} 個尚未搞懂的題目`), h('p', null, '錯題是進步最快的地方。'), h('a', { class: 'btn small', href: '#/mistakes' }, '去複習')));
    main.append(h('div', { class: 'callout warn' }, h('div', { class: 'ttl' }, '⚠️ 老實說'), h('p', null, '模擬能幫你建立「知識地圖」與「判斷流程」,但**手上的力道、聲音的細微差別、卡住的螺絲**,只有實車能教你。請把本系統當作「上場前的訓練」,並在師傅指導下做第一次實車練習。')));
  };

  APP.views.plan = function (main) {
    main.append(h('h1', null, '📅 14 天課表'), h('p', { class: 'muted' }, '每天約 2–3 小時。灰色圓圈 = 尚未完成,綠色勾 = 已完成(系統會自動偵測)。'));
    const cur = currentDay();
    D.plan.forEach((p) => {
      const card = h('div', { class: 'card' });
      const render = () => {
        card.innerHTML = '';
        const dn = p.tasks.filter((t, i) => APP.taskInfo(t, p.day, i).done).length;
        card.append(h('div', { class: 'row spread' }, h('h3', { style: { margin: 0 } }, `Day ${p.day}:${p.title}${cur === p.day ? '  👈 今天' : ''}`), h('span', { class: 'pill' + (dn === p.tasks.length ? ' ok' : '') }, `${dn} / ${p.tasks.length}`)),
          h('div', { class: 'mt' }, p.tasks.map((t, i) => taskRow(t, p.day, i, render))));
      };
      render();
      main.append(card);
    });
  };
})();
