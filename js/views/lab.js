/* 電表實驗室:虛擬三用電表 */
(function () {
  const { h, S } = APP, D = APP.data;
  const stars = (n) => APP.diff(n);
  const MODES = [
    ['off', 'OFF', 'OFF'], ['dc', 'V⎓', '直流電壓'], ['ac', 'V∼', '交流電壓'],
    ['ohm', 'Ω', '電阻'], ['cont', '🔔', '通斷'], ['amp', 'A', '電流'],
  ];

  function beep() {
    try {
      const ac = new (window.AudioContext || window.webkitAudioContext)();
      const o = ac.createOscillator(), g = ac.createGain();
      o.frequency.value = 880; g.gain.value = 0.08; o.connect(g); g.connect(ac.destination);
      o.start(); setTimeout(() => { o.stop(); ac.close(); }, 140);
    } catch (e) { /* 沒聲音也無妨 */ }
  }

  function list(main) {
    main.append(APP.head('zap', '電表實驗室'), h('p', { class: 'muted' }, '這裡有一支虛擬三用電表。**選檔位 → 點電路圖上的兩個測試點(先紅棒、再黑棒)→ 讀數字。** 每次進入實驗室,系統都會偷偷藏一個故障,你要用電表找出來。'));
    main.append(h('div', { class: 'callout warn' }, h('div', { class: 'ttl' }, '真實的後果'), h('p', null, '檔位選錯會有後果:在通電時量電阻讀數無意義、在電瓶兩端用「電流檔」= 短路燒保險絲。這裡讓你**安全地犯錯**。')));
    main.append(h('div', { class: 'grid auto' }, D.labs.map((l) => h('a', { class: 'card', href: '#/lab/' + l.id, style: { margin: 0, textDecoration: 'none', color: 'inherit' } },
      h('div', { class: 'row spread' }, h('span', { class: 'pill' }, '實驗'), h('span', { class: 'muted small' }, '難度 ', stars(l.level))),
      h('h3', { style: { marginTop: '10px' } }, l.title), h('div', { class: 'muted small' }, l.intro.slice(0, 60) + '…'),
      h('div', { class: 'mt' }, APP.done.lab(l.id) ? h('span', { class: 'pill ok' }, '已完成') : h('span', { class: 'pill gray' }, '尚未完成'))))));
  }

  function play(main, lab) {
    let stateId, cond, mode = 'off', red = null, black = null, slider = lab.slider ? lab.slider.def : 0, blown = false, log = [], attempts = 0;
    const root = h('div');
    main.append(h('p', null, h('a', { href: '#/lab' }, '← 實驗列表')), root);
    const newCase = () => { stateId = APP.pick(lab.states).id; cond = lab.conds.find((c) => c.id === lab.defaultCond); red = black = null; log = []; blown = false; mode = 'off'; attempts = 0; };
    newCase();
    const isDead = () => cond.power === false;

    function measure() {
      if (mode === 'off') return { disp: '', note: '電表是關閉的。請選擇檔位。' };
      if (!red || !black) return { disp: '- - - -', note: '請在電路圖上點兩個測試點:先放紅棒,再放黑棒。' };
      const pot = lab.dc(stateId, cond, slider);
      const dv = (pot[red] ?? 0) - (pot[black] ?? 0);
      if (mode === 'dc') return { disp: (dv >= 0 ? '' : '-') + Math.abs(dv).toFixed(2), unit: 'V⎓', note: '直流電壓 = 紅棒點的電位 − 黑棒點的電位。', val: dv };
      if (mode === 'ac') {
        const pair = lab.ac(stateId, cond, slider).find((p) => (p[0] === red && p[1] === black) || (p[0] === black && p[1] === red));
        const v = pair ? pair[2] : 0;
        return { disp: v.toFixed(2), unit: 'V∼', note: '交流電壓只有「發電線圈」這類交流來源才會有讀數。', val: v };
      }
      if (mode === 'ohm' || mode === 'cont') {
        if (!isDead()) return { disp: 'ERR', note: '⚠️ 電路帶電時不可量電阻/通斷!讀數無意義,還可能損壞電表。請把條件改成「斷電」。', warn: true };
        const r = lab.res(stateId, red, black);
        const txt = r === Infinity ? 'OL' : r < 1000 ? r.toFixed(1) : (r / 1000).toFixed(2);
        const unit = r === Infinity ? '' : r < 1000 ? 'Ω' : 'kΩ';
        const cont = r < 40;
        return { disp: txt, unit: mode === 'cont' ? (cont ? '🔔' : '') : unit, note: r === Infinity ? 'OL = 斷路(不導通)。' : `阻值 ${r.toFixed(1)} Ω` + (mode === 'cont' && cont ? ',導通 → 電表會「嗶」。' : '。'), beep: mode === 'cont' && cont, val: r };
      }
      if (mode === 'amp') {
        if (blown) return { disp: 'OL', note: '💥 電表內的保險絲已燒斷,電流檔失效。(按「重置電表」換新保險絲)', warn: true };
        if (!isDead() && Math.abs(dv) > 0.5) { blown = true; return { disp: 'FUSE', note: `💥 電流檔要「串聯」!你把它並聯在 ${Math.abs(dv).toFixed(1)} V 的電位差上 = 短路,電表保險絲燒斷了。`, warn: true, blownNow: true }; }
        return { disp: '0.00', unit: 'A', note: '電流檔必須串聯進電路。本實驗室不模擬串聯量電流,重點是記住「別並聯」。' };
      }
      return { disp: '' };
    }

    function render() {
      root.innerHTML = '';
      const st = lab.states.find((s) => s.id === stateId);
      const m = measure();
      root.append(h('h1', null, lab.title), h('p', { class: 'muted', html: APP.rich(lab.intro) }));
      if (st.symptom) root.append(h('div', { class: 'scene', html: '🗣️ 客戶說:' + APP.rich(st.symptom) }));

      // 條件
      const condRow = h('div', { class: 'row mb' }, lab.conds.length > 1 ? h('strong', null, '條件:') : null,
        lab.conds.length > 1 ? lab.conds.map((c) => h('button', { class: 'btn small' + (c.id === cond.id ? ' primary' : ''), onclick: () => { cond = c; render(); } }, c.label)) : h('span', { class: 'pill info' }, lab.conds[0].label));
      // 滑桿
      const sl = lab.slider ? h('div', { class: 'card flat', style: { margin: '0 0 10px' } }, h('div', { class: 'row spread' }, h('strong', null, lab.slider.label), h('span', null, slider + lab.slider.unit)),
        h('input', { type: 'range', min: lab.slider.min, max: lab.slider.max, value: slider, oninput: (e) => { slider = +e.target.value; const mm = measure(); updateMeter(mm); } })) : null;

      // 電路圖
      const svgBox = h('div', { html: lab.svg });
      svgBox.querySelectorAll('.pt').forEach((g) => {
        const id = g.dataset.pt;
        g.classList.toggle('red', id === red); g.classList.toggle('black', id === black);
        g.onclick = () => {
          if (!red) red = id; else if (!black) { if (id === red) return; black = id; }
          else { red = id; black = null; }
          const mm = measure();
          if (red && black && mode !== 'off') { const label = MODES.find((x) => x[0] === mode)[2]; log.unshift(`${label}:紅 ${lab.points[red]} → 黑 ${lab.points[black]} = ${mm.disp} ${mm.unit || ''}${mm.warn ? ' ⚠️' : ''}`); log = log.slice(0, 12); }
          if (mm.beep) beep();
          if (mm.blownNow) APP.toast('💥 電表保險絲燒斷了!');
          render();
        };
      });

      // 電表
      const meter = h('div', { class: 'meter' }, h('div', { class: 'lcd', id: 'lcd' }), h('div', { class: 'modes' }, MODES.map(([k, sym, name]) => h('button', { class: k === mode ? 'on' : '', title: name, onclick: () => { mode = k; render(); } }, h('div', null, sym), h('div', { style: { fontSize: '.7rem', opacity: .85 } }, name)))),
        h('div', { class: 'probes' }, h('span', { class: 'r' }, '紅棒:' + (red ? lab.points[red] : '—')), h('span', { class: 'b' }, '黑棒:' + (black ? lab.points[black] : '—'))),
        h('div', { class: 'row', style: { marginTop: '8px' } }, h('button', { class: 'btn small', onclick: () => { red = black = null; render(); } }, '收回探棒'), blown ? h('button', { class: 'btn small', onclick: () => { blown = false; render(); } }, '重置電表') : null));
      const noteBox = h('div', { class: 'explain' + (m.warn ? ' badx' : ''), id: 'mnote', style: { marginTop: '10px' } });

      function updateMeter(mm) {
        const lcd = meter.querySelector('#lcd');
        lcd.innerHTML = '';
        lcd.append(mm.disp || '', mm.unit ? h('small', null, mm.unit) : '');
        noteBox.className = 'explain' + (mm.warn ? ' badx' : ''); noteBox.textContent = mm.note || '';
      }
      updateMeter(m);

      const left = h('div', { class: 'lab-left' }, condRow, sl, svgBox,
        h('div', { class: 'card flat' }, h('strong', null, '📝 量測紀錄'), log.length ? h('ul', { style: { margin: '6px 0 0', paddingLeft: '1.2em' } }, log.map((l) => h('li', { class: 'small' }, l))) : h('p', { class: 'muted small', style: { margin: '6px 0 0' } }, '還沒有量測。')));
      const right = h('div', { class: 'lab-right' }, meter, noteBox);
      root.append(h('div', { class: 'lab' }, left, right));

      // 診斷
      const dBox = h('div', { class: 'card' }, h('h2', { style: { marginTop: 0 } }, '🩺 你的診斷'), h('p', { class: 'muted' }, '量得差不多了嗎?選出你認為的故障:'));
      const opts = APP.shuffle(lab.states);
      const fb = h('div');
      opts.forEach((o) => dBox.append(h('button', { class: 'opt', onclick: function () {
        attempts++;
        const ok = o.id === stateId;
        if (ok) {
          S.labs[lab.id] = Object.assign(S.labs[lab.id] || {}, { done: true, n: ((S.labs[lab.id] || {}).n || 0) + 1 }); APP.save();
          dBox.querySelectorAll('.opt').forEach((b) => (b.disabled = true)); this.classList.add('right');
          fb.innerHTML = '';
          fb.append(h('div', { class: 'explain good', html: '✅ 答對!' + (attempts === 1 ? '一次就中。' : '') + '<br>' + APP.rich(st.why) }),
            h('div', { class: 'row mt' }, h('button', { class: 'btn primary', onclick: () => { newCase(); render(); window.scrollTo(0, 0); } }, '換一題(新的隱藏故障)'), h('a', { class: 'btn', href: '#/lab' }, '回實驗列表')));
        } else {
          this.classList.add('wrong'); this.disabled = true;
          APP.logMistake({ kind: 'lab', src: lab.id, title: `電表實驗:${lab.title}`, detail: `你判斷「${o.label}」,但實際是「${st.label}」。` });
          fb.innerHTML = ''; fb.append(h('div', { class: 'explain badx', html: '❌ 還不對,再量幾個點看看。可以換條件(轉速/斷電)再量。' }));
        }
      } }, o.label)));
      dBox.append(fb, h('div', { class: 'row mt' }, h('button', { class: 'btn small ghost', onclick: () => { if (confirm('放棄這一題,看答案?')) { dBox.querySelectorAll('.opt').forEach((b) => (b.disabled = true)); fb.innerHTML = ''; fb.append(h('div', { class: 'explain', html: '答案:**' + APP.esc(st.label) + '**<br>' + APP.rich(st.why) }), h('div', { class: 'mt' }, h('button', { class: 'btn primary', onclick: () => { newCase(); render(); } }, '換一題'))); } } }, '看答案')));
      root.append(dBox);
    }
    render();
  }

  APP.views.lab = function (main, params) {
    if (!params.length) return list(main);
    const lab = D.labs.find((l) => l.id === params[0]);
    if (!lab) return list(main);
    play(main, lab);
  };
})();
