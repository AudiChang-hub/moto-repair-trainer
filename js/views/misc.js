/* 動畫圖解、零件地圖、術語閃卡、錯題本、走向實車 */
(function () {
  const { h, S } = APP, D = APP.data;

  /* ================= 動畫圖解 ================= */
  const VISUALS = [
    ['fourstroke', '四行程引擎', '吸、壓、爆、排。拖動曲軸角度,看活塞、氣門與火花的時機。', '🔄'],
    ['cvt', 'CVT 無段變速', '拉動轉速滑桿,看皮帶如何在兩個盤上變換位置;勾選「普利珠磨損」看症狀怎麼來。', '⚙️'],
    ['evflow', '電動車能量流', '待機、加速、煞車回充、充電,能量往哪個方向流?', '🔋'],
    ['nostart', '發不動診斷樹', '最常見客訴「發不動」的判斷流程,一頁看完。', '🌳'],
  ];
  APP.views.visual = function (main, params) {
    if (params.length && APP.widgets[params[0]]) {
      const v = VISUALS.find((x) => x[0] === params[0]);
      main.append(h('p', null, h('a', { href: '#/visual' }, '← 動畫圖解')), h('h1', null, v[3] + ' ' + v[1]), h('p', { class: 'muted' }, v[2]));
      APP.widgets[params[0]](main);
      if (APP.markVisual) APP.markVisual(params[0]);
      return;
    }
    main.append(h('h1', null, '🎞️ 動畫圖解'), h('p', { class: 'muted' }, '文字看不懂的地方,動手拉一拉就懂了。'));
    main.append(h('div', { class: 'grid auto' }, VISUALS.map((v) => h('a', { class: 'card', href: '#/visual/' + v[0], style: { margin: 0, textDecoration: 'none', color: 'inherit' } },
      h('div', { style: { fontSize: '2rem' } }, v[3]), h('h3', { style: { marginTop: '6px' } }, v[1]), h('div', { class: 'muted small' }, v[2])))));
  };

  /* ================= 零件地圖 ================= */
  APP.views.parts = function (main) {
    let mode = 'ice', sel = null;
    main.append(h('h1', null, '🏍️ 零件地圖'), h('p', { class: 'muted' }, '點圖上的編號圓點,看這個零件「做什麼、壞了會怎樣、怎麼保養、新手能不能碰」。'));
    const box = h('div');
    main.append(box);
    function render() {
      box.innerHTML = '';
      const parts = D.parts.filter((p) => p.mode === 'both' || p.mode === mode);
      box.append(h('div', { class: 'row mb' }, [['ice', '燃油機車'], ['ev', '電動機車']].map(([k, t]) => h('button', { class: 'btn small' + (mode === k ? ' primary' : ''), onclick: () => { mode = k; sel = null; render(); } }, t))));
      const svgBox = h('div', { html: APP.widgets.scooterSVG(mode, sel && sel.id) });
      svgBox.querySelectorAll('.hot').forEach((g) => (g.onclick = () => pick(parts.find((p) => p.id === g.dataset.id))));
      const info = h('div', { class: 'card' });
      function fill() {
        info.innerHTML = '';
        if (!sel) { info.append(h('p', { class: 'muted' }, '👆 請點圖上的圓點,或從下方清單選擇零件。')); return; }
        info.append(h('div', { class: 'row spread' }, h('h2', { style: { margin: 0 } }, sel.name), h('div', { class: 'row' }, h('span', { class: 'pill info' }, sel.sys), h('span', { class: 'pill ' + (sel.diy === 1 ? 'ok' : sel.diy === 2 ? 'warn' : 'bad') }, D.diyLabel[sel.diy]))),
          h('p', null, h('strong', null, '它做什麼:'), sel.what), h('p', null, h('strong', null, '壞了會怎樣:'), sel.fail), h('p', null, h('strong', null, '保養/處理:'), sel.service));
      }
      function pick(p) {
        sel = p;
        S.partsSeen = S.partsSeen || [];
        if (!S.partsSeen.includes(p.id)) { S.partsSeen.push(p.id); APP.save(); }
        svgBox.querySelectorAll('.hot').forEach((g) => g.classList.toggle('sel', g.dataset.id === p.id));
        fill();
        list.querySelectorAll('.lesson-item').forEach((el) => el.classList.toggle('done', el.dataset.id === p.id));
      }
      const list = h('div', { class: 'grid auto', style: { marginTop: '12px' } }, parts.map((p, i) => h('div', { class: 'lesson-item', 'data-id': p.id, style: { margin: 0, cursor: 'pointer' }, onclick: () => pick(p) },
        h('div', { class: 'tick' }, i + 1), h('div', { style: { flex: 1 } }, h('div', null, h('strong', null, p.name)), h('div', { class: 'muted small' }, p.sys + ' · ' + D.diyLabel[p.diy])))));
      fill();
      box.append(svgBox, info, list);
    }
    render();
  };

  /* ================= 術語閃卡 ================= */
  APP.views.cards = function (main) {
    S.cardLog = S.cardLog || {};
    const INTERVALS = [0, 1, 2, 4, 8, 16];
    const today = APP.today();
    const daysFromNow = (n) => new Date(Date.now() + n * 86400000).toISOString().slice(0, 10);
    let cat = '全部';
    const cats = ['全部', ...new Set(D.glossary.map((g) => g.cat))];
    const box = h('div');
    main.append(h('h1', null, '🃏 術語閃卡'), h('p', { class: 'muted' }, '看到名詞先想「這是什麼?」,再翻面。記得的會隔幾天再出現,忘記的會馬上重來(間隔重複)。'), box);
    const total = () => D.glossary.length;
    const known = () => D.glossary.filter((g) => S.cards[g.id] && S.cards[g.id].box >= 3).length;

    function menu() {
      box.innerHTML = '';
      const due = D.glossary.filter((g) => S.cards[g.id] && S.cards[g.id].due <= today);
      box.append(h('div', { class: 'card' }, h('div', { class: 'row spread' }, h('strong', null, '熟悉的詞'), h('span', { class: 'muted' }, `${known()} / ${total()}`)), h('div', { class: 'bar mt' }, h('i', { style: { width: Math.round((known() / total()) * 100) + '%' } })),
        h('p', { class: 'muted small' }, `今天已練 ${S.cardLog[today] || 0} 張 · 待複習 ${due.length} 張`),
        h('div', { class: 'row' }, cats.map((c) => h('button', { class: 'btn small' + (cat === c ? ' primary' : ''), onclick: () => { cat = c; menu(); } }, c))),
        h('div', { class: 'mt' }, h('button', { class: 'btn primary', onclick: session }, '開始練習(最多 12 張)'))));
    }

    function session() {
      const pool = D.glossary.filter((g) => cat === '全部' || g.cat === cat);
      const dueCards = pool.filter((g) => S.cards[g.id] && S.cards[g.id].due <= today);
      const fresh = APP.shuffle(pool.filter((g) => !S.cards[g.id]));
      const queue = [...APP.shuffle(dueCards), ...fresh].slice(0, 12);
      if (!queue.length) { box.innerHTML = ''; box.append(h('div', { class: 'card center' }, h('p', null, '🎉 這個分類今天沒有要複習的了。'), h('button', { class: 'btn', onclick: menu }, '返回'))); return; }
      let i = 0, flipped = false, again = 0;
      function show() {
        box.innerHTML = '';
        if (i >= queue.length) {
          box.append(h('div', { class: 'card center' }, h('div', { class: 'score-ring' }, '完成'), h('p', null, `這一輪 ${queue.length} 張。${again ? `其中 ${again} 張忘記了,明天會再出現。` : '全部記得!'}`), h('button', { class: 'btn primary', onclick: menu }, '返回'), ' ', h('button', { class: 'btn', onclick: session }, '再來一輪')));
          return;
        }
        const g = queue[i];
        const card = h('div', { class: 'card flash' },
          h('span', { class: 'pill' }, g.cat),
          h('div', { class: 'term' }, g.term),
          h('div', { class: 'muted' }, g.en),
          flipped ? h('div', { style: { marginTop: '16px', maxWidth: '520px' } }, h('p', { style: { fontSize: '1.15rem', fontWeight: 600 }, html: APP.rich(g.plain) }), h('p', { class: 'muted', html: APP.rich(g.detail) })) : h('p', { class: 'muted small', style: { marginTop: '16px' } }, '(點一下翻面)'));
        card.onclick = () => { if (!flipped) { flipped = true; show(); } };
        box.append(h('div', { class: 'muted small mb' }, `${i + 1} / ${queue.length}`), card);
        if (flipped) {
          const rate = (r) => {
            const rec = S.cards[g.id] || { box: 0 };
            if (r === 'no') { rec.box = 1; rec.due = today; again++; queue.push(g); }
            else if (r === 'meh') { rec.box = Math.max(1, rec.box); rec.due = daysFromNow(1); }
            else { rec.box = Math.min(5, rec.box + 1); rec.due = daysFromNow(INTERVALS[rec.box]); }
            if (r === 'no') rec.due = daysFromNow(0);
            S.cards[g.id] = rec; S.cardLog[today] = (S.cardLog[today] || 0) + 1; APP.save();
            i++; flipped = false; show();
          };
          box.append(h('div', { class: 'row', style: { justifyContent: 'center' } },
            h('button', { class: 'btn', onclick: () => rate('no') }, '😵 忘了'), h('button', { class: 'btn', onclick: () => rate('meh') }, '🤔 有點模糊'), h('button', { class: 'btn primary', onclick: () => rate('yes') }, '😎 記得')));
        }
      }
      show();
    }
    menu();
  };

  /* ================= 錯題本 ================= */
  APP.views.mistakes = function (main) {
    main.append(h('h1', null, '📕 錯題本'), h('p', { class: 'muted' }, '你答錯的測驗題、診斷失誤、流程選錯,都在這裡。**重做答對了就會標記為已解決。**'));
    const box = h('div');
    main.append(box);
    const labelOf = { quiz: '測驗題', diag: '診斷', proc: '流程', lab: '電表' };
    const hrefOf = (m) => (m.kind === 'diag' ? '#/diagnose/' + m.src : m.kind === 'proc' ? '#/proc/' + m.src : m.kind === 'lab' ? '#/lab/' + m.src : null);
    function render() {
      box.innerHTML = '';
      const open = S.mistakes.filter((m) => !m.resolved).sort((a, b) => b.ts - a.ts);
      const solved = S.mistakes.filter((m) => m.resolved);
      if (!S.mistakes.length) { box.append(h('div', { class: 'card center' }, h('p', null, '目前還沒有錯題。去做幾個測驗或診斷案例吧!'), h('a', { class: 'btn primary', href: '#/learn' }, '去學習'))); return; }
      const quizOpen = open.filter((m) => m.kind === 'quiz');
      box.append(h('div', { class: 'row mb' }, h('span', { class: 'pill bad' }, `未解決 ${open.length}`), h('span', { class: 'pill ok' }, `已解決 ${solved.length}`),
        quizOpen.length ? h('button', { class: 'btn primary small', onclick: () => redo(quizOpen) }, `重做 ${quizOpen.length} 道測驗題`) : null));
      if (!open.length) box.append(h('div', { class: 'callout key' }, '🎉 所有錯題都已解決!'));
      open.forEach((m) => box.append(h('div', { class: 'card' },
        h('div', { class: 'row spread' }, h('span', { class: 'pill ' + (m.kind === 'quiz' ? 'info' : 'warn') }, labelOf[m.kind] || m.kind), h('span', { class: 'muted small' }, `錯 ${m.count} 次` + (m.src && m.kind === 'quiz' ? ' · ' + m.src : ''))),
        h('div', { style: { marginTop: '6px', fontWeight: 600 }, html: APP.rich(m.title) }),
        m.kind === 'quiz' ? h('div', { class: 'explain good', style: { marginTop: '8px' }, html: '✅ 正確答案:' + APP.rich(m.options[m.a]) + '<br>' + APP.rich(m.why || '') }) : h('div', { class: 'muted small', style: { marginTop: '6px' }, html: APP.rich(m.detail || '') }),
        hrefOf(m) ? h('a', { class: 'btn small mt', href: hrefOf(m) }, '去重練') : null)));
      if (solved.length) box.append(h('details', { class: 'card flat' }, h('summary', null, `已解決的 ${solved.length} 題`), solved.map((m) => h('div', { class: 'small muted', style: { padding: '4px 0' }, html: APP.rich(m.title) }))));
    }
    function redo(items) {
      box.innerHTML = '';
      const qbox = h('div', { class: 'card' });
      box.append(h('p', null, h('a', { href: '#/mistakes', onclick: (e) => { e.preventDefault(); render(); } }, '← 回錯題本')), qbox);
      const qs = items.map((m) => ({ q: m.q, options: m.options, a: m.a, why: m.why }));
      APP.ui.quiz(qbox, APP.shuffle(qs), { src: '錯題重做', retry: true });
    }
    render();
  };

  /* ================= 走向實車 ================= */
  APP.views.bridge = function (main) {
    const sec = (title, ...kids) => h('div', { class: 'card' }, h('h2', { style: { marginTop: 0 } }, title), ...kids);
    const ul = (items) => h('ul', null, items.map((i) => h('li', { html: APP.rich(i) })));
    const check = (key, text) => {
      S.bridge = S.bridge || {};
      const cb = h('input', { type: 'checkbox', style: { marginRight: '8px' } });
      cb.checked = !!S.bridge[key];
      cb.onchange = () => { S.bridge[key] = cb.checked; APP.save(); };
      return h('li', { style: { listStyle: 'none', margin: '6px 0' } }, h('label', null, cb, text));
    };
    main.append(h('h1', null, '🌉 走向實車'), h('p', { class: 'muted' }, '模擬系統不能取代手感。這一頁告訴你:怎麼用最低成本、最安全的方式,把腦中的地圖接到雙手上。'));
    main.append(sec('1. 這套系統能教你什麼、不能教你什麼',
      h('div', { class: 'grid c2' },
        h('div', null, h('strong', null, '✅ 能教你'), ul(['整體架構與名詞(不會再「一頭霧水」)', '診斷的思考順序與取捨', '標準作業流程與常見錯誤', '電表的檔位、接法、讀數意義', '哪些事該停手、該交給原廠'])),
        h('div', null, h('strong', null, '❌ 不能教你'), ul(['螺絲「鎖到剛好」的手感', '卡住的螺絲、鏽蝕、滑牙的處理', '聲音、氣味、震動的細微差別', '每個車型的實際位置與細節', '客戶溝通與現場節奏'])))));
    main.append(sec('2. 低成本的實車練習路線',
      ul([
        '**找一台「練習車」**:二手低價的 125cc 速克達(甚至不能發動的),專門拿來拆裝與練習,**不要在客人的車上第一次練新技能**。',
        '**找一顆「練習引擎/傳動」**:廢料行或二手零件商常有便宜的舊引擎、CVT 總成,可以在桌上反覆拆裝。',
        '**跟著師傅做,而不是看師傅做**:前兩週就跟著做 20 台以上保養,每次完成一個步驟就請師傅檢查。',
        '**用手機記錄**:拆前拍照、螺絲分袋、關鍵步驟錄影,事後對照本系統的作業檢查表。',
        '**先修「低風險、高頻率」的**:機油、火星塞、空濾、電瓶、輪胎氣壓,做熟再往煞車、CVT、電系進階。',
      ])));
    main.append(sec('3. 第一次實車作業前的檢查清單', h('ul', { style: { padding: 0 } },
      check('c1', '我找到「這個車型、這個年份」的維修手冊了'),
      check('c2', '我知道這個作業的規格(油量、扭力、間隙)'),
      check('c3', '我有該用的工具(含扭力扳手),不打算用替代品湊合'),
      check('c4', '我有一位師傅在旁或可隨時請教'),
      check('c5', '我已在本系統完成對應的「流程演練」'),
      check('c6', '我拍照記錄了拆之前的狀態'),
      check('c7', '作業完成後,我有一份可以驗證的測試項目(試車、量電壓、檢查漏油)')),
      h('a', { class: 'btn mt', href: '#/sop' }, '🖨️ 開啟所有作業檢查表')));
    main.append(sec('4. 學習資源怎麼找(搜尋關鍵字)',
      ul(['**維修手冊**:「車型 + 年份 + Service Manual / 維修手冊 / 服務手冊」。原廠經銷商與官方教育訓練是最可靠的來源。', '**影片教學**:「機車 CVT 保養」「機車 三用電表 電系」「速克達 煞車 放空氣」,搭配本系統的流程檢查表,**一邊看一邊對照「哪一步少了」**。', '**電動機車**:優先以原廠的教育訓練與技師認證為主,網路影片只適合補充概念,**高壓作業不可只靠影片**。', '看任何教學時問自己三個問題:**它有沒有說規格?有沒有說扭力?有沒有提到安全?** 沒有的,請再找一個來源核對。'])));
    main.append(sec('5. 這些事,請不要自己做(需要師傅或原廠)',
      h('div', { class: 'callout warn', style: { margin: 0 } }, ul(['電池包拆解、高壓線束修復、控制器內部', '引擎內部大修(缸頭、曲軸、活塞)而沒有人帶領', '第一次煞車作業,卻沒有人複查就讓客人上路', '刷寫、修改 ECU 或解除安全保護(例如短接側柱開關)', '處理已經鼓包、冒煙、泡水或嚴重事故的電動車電池']))));
    main.append(sec('6. 給家族事業的建議',
      ul(['**先做出「可複製的 SOP」**:保養流程標準化,新人才能快速上手,客戶也知道你做了什麼。', '**把診斷記錄下來**:每次案例記下症狀、檢查、原因、修法,半年後就是你店裡的知識庫。', '**學會說「這要回原廠」**:判斷準確、不硬修,是專業,也是口碑。', '**電動機車是機會**:機械簡單、診斷偏資料與電系,學得會的人還不多;**但安全與認證要先到位**。'])));
  };
})();
