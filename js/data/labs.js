/* 電表實驗室。每個實驗室隨機抽一個「隱藏故障」,學員用虛擬電表量測後做診斷。
   dc(state,cond,slider) → {點:電壓(相對車架)}      ac(...) → [[a,b,V],…]
   res(state,a,b) → 歐姆(Infinity = 斷路) ;cond.power=true 時不可量電阻 */
(function () {
  const P = (id, x, y, label, lx, ly) =>
    `<g class="pt" data-pt="${id}" transform="translate(${x},${y})"><circle r="9"/><text x="${lx == null ? 14 : lx}" y="${ly == null ? 4 : ly}">${label}</text></g>`;
  const jitter = (v, k) => Math.round((v + (((k * 7919) % 13) - 6) / 100) * 100) / 100;
  // 串聯鏈:chain=[點...], seg=[相鄰電阻...]
  const chainRes = (chain, seg, a, b) => {
    const i = chain.indexOf(a), j = chain.indexOf(b);
    if (i < 0 || j < 0) return Infinity;
    if (i === j) return 0;
    const [lo, hi] = i < j ? [i, j] : [j, i];
    let sum = 0;
    for (let k = lo; k < hi; k++) sum += seg[k];
    return sum;
  };

  APP.data.labs = [
    /* ============ 實驗 1:電瓶與啟動電壓 ============ */
    {
      id: 'battery', title: '電瓶健康檢查(含壓降測試)', level: 1,
      intro: '客戶說:「早上有時發不動,有時又可以。」請在三種情況(熄火、按啟動鈕、引擎運轉)下量電壓,判斷問題在哪裡。提示:除了量「電瓶端子」,也可以量「電瓶端子到線頭」之間的壓降。',
      conds: [
        { id: 'off', label: '熄火(靜置)' },
        { id: 'crank', label: '按住啟動鈕(啟動馬達運轉中)' },
        { id: 'run', label: '引擎運轉(約 3,000 rpm)' },
        { id: 'dead', label: '斷電(拆下負極,用來量電阻/通斷)', power: false },
      ],
      defaultCond: 'off',
      points: { BATp: '電瓶正極柱(+)', BATn: '電瓶負極柱(−)', CBL: '正極線頭', FRM: '車架(接地)' },
      svg: `<svg class="sch" viewBox="0 0 640 300" role="img" aria-label="電瓶電路圖">
        <rect class="part" x="60" y="130" width="170" height="90" rx="8"/>
        <text x="145" y="182" text-anchor="middle" font-weight="700">12V 電瓶</text>
        <rect class="part" x="86" y="86" width="28" height="22" rx="3"/>
        <path class="wire" d="M100 62 V30 H400 V50"/><path class="wire" d="M100 62 V86"/>
        <rect class="part" x="400" y="50" width="130" height="46" rx="6"/><text x="465" y="78" text-anchor="middle">啟動繼電器</text>
        <path class="wire" d="M465 96 V150"/><rect class="part" x="400" y="150" width="130" height="56" rx="6"/><text x="465" y="183" text-anchor="middle">啟動馬達</text>
        <path class="wire" d="M465 206 V252"/>
        <path class="wire" d="M180 108 V78 H300 V252"/>
        <rect class="part" x="260" y="252" width="320" height="12" rx="3"/><text x="420" y="285" text-anchor="middle">車架(接地)</text>
        ${P('BATp', 100, 120, '電瓶正極柱 (+)', 14, 4)}
        ${P('CBL', 100, 62, '正極線頭', 14, 4)}
        ${P('BATn', 180, 120, '電瓶負極柱 (−)', 14, 4)}
        ${P('FRM', 300, 252, '車架', 14, -10)}
      </svg>`,
      states: [
        { id: 'good', label: '電瓶與充電都正常', symptom: '偶爾啟動比較慢。', why: '靜置約 12.7 V、啟動時掉到約 10 V(仍高於 9.6)、運轉約 14 V,線頭壓降很小:這台車的電系是健康的。' },
        { id: 'weak', label: '電瓶老化(容量衰退)', symptom: '偶爾啟動比較慢,冷天更明顯。', why: '靜置電壓偏低(11.5 V),啟動時急速掉到約 7 V 以下;但運轉充電正常。典型的電瓶老化,充電系統沒問題。' },
        { id: 'nocharge', label: '充電系統不良(沒有在充電)', symptom: '電瓶一直沒電。', why: '運轉時電壓沒有上升到 13.5 V 以上(只有約 12.2 V),代表發電機/整流器沒有把電送進電瓶。電瓶是被「餓」壞的。' },
        { id: 'overcharge', label: '穩壓失效(過度充電)', symptom: '電瓶常常鼓起、很燙、壽命很短。', why: '運轉時電壓超過 16 V(正常上限約 14.8 V)。穩壓器失效,長期會把電瓶煮壞,並可能損壞其他電子零件。' },
        { id: 'loose', label: '正極線頭鬆動/氧化(接觸不良)', symptom: '有時發不動,有時又可以,晃動車子偶爾變好。', why: '電瓶柱電壓正常(約 10 V),但按啟動鈕時「線頭」只有約 3 V:中間有近 7 V 的壓降,電力在接觸不良處被吃掉。這就是壓降測試的威力。' },
      ],
      dc(s, c) {
        const T = { good: { off: [12.7, 12.7], crank: [10.4, 10.3], run: [14.1, 14.1] }, weak: { off: [11.5, 11.5], crank: [7.2, 7.1], run: [14.0, 14.0] },
          nocharge: { off: [12.1, 12.1], crank: [9.9, 9.8], run: [12.2, 12.2] }, overcharge: { off: [12.6, 12.6], crank: [10.2, 10.1], run: [16.2, 16.2] },
          loose: { off: [12.7, 12.7], crank: [10.4, 3.1], run: [14.1, 13.9] } };
        if (c.id === 'dead') return { BATp: 12.6, BATn: 0, CBL: 0, FRM: 0 };
        const v = T[s][c.id];
        return { BATp: v[0], BATn: 0, CBL: v[1], FRM: 0 };
      },
      ac: () => [],
      res: (s, a, b) => {
        const R = { 'BATn|FRM': 0.2, 'BATp|CBL': s === 'loose' ? 4.5 : 0.1 };
        return R[a + '|' + b] ?? R[b + '|' + a] ?? (a === b ? 0 : Infinity);
      },
    },

    /* ============ 實驗 2:大燈不亮(保險絲/開關/燈泡/接地) ============ */
    {
      id: 'fuse', title: '大燈不亮:一步步縮小範圍', level: 1,
      intro: '客戶說:「大燈突然不亮了。」電路是:電瓶 → 保險絲 → 開關 → 燈泡 → 車架。請用「通電量電壓」找出「電在哪裡消失」,或用「斷電量通斷」找出哪一段斷了。',
      conds: [
        { id: 'live', label: '通電(接上電瓶,開關 ON)→ 用來量電壓' },
        { id: 'dead', label: '斷電(拆下電瓶,開關 ON)→ 用來量通斷/電阻', power: false },
      ],
      defaultCond: 'live',
      points: { Fin: '保險絲前端', Fout: '保險絲後端', SWout: '開關後端', Bp: '燈泡正端', Bn: '燈泡負端', FRM: '車架' },
      svg: `<svg class="sch" viewBox="0 0 640 260" role="img" aria-label="大燈電路圖">
        <rect class="part" x="20" y="90" width="60" height="60" rx="6"/><text x="50" y="125" text-anchor="middle" font-weight="700">電瓶</text>
        <path class="wire" d="M80 110 H125"/>
        <path class="wire" d="M125 110 H150"/><rect class="part" x="150" y="94" width="56" height="32" rx="4"/><text x="178" y="115" text-anchor="middle">保險絲</text>
        <path class="wire" d="M206 110 H235"/><path class="wire" d="M235 110 H262"/>
        <path class="wire" d="M262 110 L300 90"/><circle cx="262" cy="110" r="4" fill="currentColor"/><circle cx="318" cy="110" r="4" fill="currentColor"/><text x="290" y="145" text-anchor="middle">開關</text>
        <path class="wire" d="M318 110 H345"/><path class="wire" d="M345 110 H400"/>
        <circle class="part" cx="440" cy="110" r="26"/><path class="wire" d="M424 94 L456 126 M456 94 L424 126"/><text x="440" y="158" text-anchor="middle">大燈燈泡</text>
        <path class="wire" d="M466 110 H505"/><path class="wire" d="M505 110 H540 V200"/>
        <rect class="part" x="40" y="200" width="540" height="12" rx="3"/><text x="310" y="238" text-anchor="middle">車架(接地)</text>
        <path class="wire" d="M50 150 V200" stroke-dasharray="6 5"/>
        ${P('Fin', 125, 110, '保險絲前端', -48, -16)}
        ${P('Fout', 235, 110, '保險絲後端', -30, -16)}
        ${P('SWout', 345, 110, '開關後端', -26, -16)}
        ${P('Bp', 400, 110, '燈泡正端', -26, -16)}
        ${P('Bn', 505, 110, '燈泡負端', -20, -16)}
        ${P('FRM', 540, 200, '車架', 14, -2)}
      </svg>`,
      states: [
        { id: 'fuse', label: '保險絲熔斷', symptom: '大燈完全不亮,一點反應都沒有。', why: '通電時「保險絲前端 12.6 V、後端 0 V」,保險絲兩端有 12.6 V 壓差 = 保險絲斷了(因為整個電壓都落在這個斷點上)。斷電時用通斷檔量不導通。換同規格保險絲後,要追問為什麼會燒。' },
        { id: 'switch', label: '開關接點損壞', symptom: '大燈完全不亮,保險絲看起來沒事。', why: '電送到「保險絲後端」,但「開關後端」沒電:電在開關這裡被擋住。斷電通斷檔量開關兩端,不導通。' },
        { id: 'bulb', label: '燈泡燈絲燒斷', symptom: '大燈不亮,但開關一撥其他功能正常。', why: '燈泡兩端接線處都有電(正端 12.6 V,負端 0 V),但燈泡不亮 = 燈絲斷了。斷電時量燈泡兩端電阻為 OL(斷路)。' },
        { id: 'ground', label: '燈泡接地不良', symptom: '大燈不亮,燈泡看起來完好。', why: '燈泡正端有 12.6 V,但負端到車架竟然也有約 12.5 V:代表負端沒有接到車架,電流無法回家。斷電時量燈泡負端到車架不導通。' },
      ],
      dc(s, c) {
        if (c.id === 'dead') return { Fin: 0, Fout: 0, SWout: 0, Bp: 0, Bn: 0, FRM: 0 };
        return ({
          fuse: { Fin: 12.6, Fout: 0, SWout: 0, Bp: 0, Bn: 0, FRM: 0 },
          switch: { Fin: 12.6, Fout: 12.6, SWout: 0, Bp: 0, Bn: 0, FRM: 0 },
          bulb: { Fin: 12.6, Fout: 12.6, SWout: 12.6, Bp: 12.6, Bn: 0, FRM: 0 },
          ground: { Fin: 12.6, Fout: 12.6, SWout: 12.6, Bp: 12.6, Bn: 12.5, FRM: 0 },
        })[s];
      },
      ac: () => [],
      res(s, a, b) {
        const chain = ['Fin', 'Fout', 'SWout', 'Bp', 'Bn', 'FRM'];
        const seg = [s === 'fuse' ? Infinity : 0.1, s === 'switch' ? Infinity : 0.2, 0.1, s === 'bulb' ? Infinity : 0.9, s === 'ground' ? Infinity : 0.1];
        return chainRes(chain, seg, a, b);
      },
    },

    /* ============ 實驗 3:充電系統 ============ */
    {
      id: 'charging', title: '充電系統:發電機、整流器、電瓶', level: 2,
      intro: '客戶說:「電瓶一直沒電。」充電系統由「發電線圈(三條黃線,輸出交流電)→ 整流穩壓器 → 電瓶」組成。請在不同轉速下量電瓶直流電壓,並量發電線圈三條線之間的「交流電壓」,判斷哪一段有問題。',
      conds: [
        { id: 'off', label: '熄火' },
        { id: 'idle', label: '怠速(約 1,500 rpm)' },
        { id: 'run', label: '運轉(約 3,000 rpm)' },
        { id: 'dead', label: '斷電(拆下發電線圈插頭,量線圈電阻)', power: false },
      ],
      defaultCond: 'run',
      points: { Y1: '黃線 1', Y2: '黃線 2', Y3: '黃線 3', BATp: '電瓶正極', FRM: '車架(電瓶負極)' },
      svg: `<svg class="sch" viewBox="0 0 640 290" role="img" aria-label="充電系統電路圖">
        <circle class="part" cx="90" cy="145" r="56"/><text x="90" y="150" text-anchor="middle" font-weight="700">發電線圈</text><text x="90" y="170" text-anchor="middle" font-size="11">(三相交流)</text>
        <path class="wire" d="M144 118 H330"/><path class="wire" d="M146 145 H330"/><path class="wire" d="M144 172 H330"/>
        <rect class="part" x="330" y="96" width="120" height="100" rx="8"/><text x="390" y="140" text-anchor="middle" font-weight="700">整流</text><text x="390" y="160" text-anchor="middle" font-weight="700">穩壓器</text>
        <path class="wire" d="M450 130 H500 V108"/>
        <rect class="part" x="480" y="124" width="120" height="70" rx="6"/><text x="540" y="164" text-anchor="middle" font-weight="700">電瓶</text>
        <rect class="part" x="494" y="108" width="22" height="16" rx="2"/>
        <path class="wire" d="M390 196 V250"/><path class="wire" d="M580 194 V250"/>
        <rect class="part" x="150" y="250" width="460" height="12" rx="3"/><text x="380" y="282" text-anchor="middle">車架(接地)</text>
        ${P('Y1', 230, 118, '黃線 1', -22, -14)}
        ${P('Y2', 230, 145, '黃線 2', -22, -14)}
        ${P('Y3', 230, 172, '黃線 3', -22, 24)}
        ${P('BATp', 505, 108, '電瓶正極 (+)', 14, -6)}
        ${P('FRM', 300, 250, '車架 / 電瓶負極', -50, -12)}
      </svg>`,
      states: [
        { id: 'good', label: '充電系統正常', symptom: '客戶其實是電瓶放太久(沒問題的車)。', why: '運轉時電瓶電壓約 14 V、發電線圈三相交流接近且隨轉速上升、線圈電阻三組接近。三段都正常。' },
        { id: 'reg', label: '穩壓整流器故障(不整流)', symptom: '電瓶一直沒電。', why: '發電線圈的交流電壓正常(三相接近,隨轉速上升),但電瓶運轉時電壓還是只有 12 V 多、沒有升上去。發電有、送不進電瓶 → 中間的整流穩壓器壞了。' },
        { id: 'stator', label: '發電線圈斷路(其中一相)', symptom: '電瓶一直沒電,引擎加速時燈忽明忽暗。', why: '黃線 3 與其他兩條之間幾乎沒有交流電壓,斷電時量到的電阻也是 OL(斷路),三相不均衡。問題在發電線圈或它的接頭。' },
        { id: 'over', label: '穩壓失效(電壓過高)', symptom: '大燈常燒、電瓶很燙。', why: '發電線圈正常,但運轉時電瓶電壓超過 16 V。穩壓部分失效,必須更換整流穩壓器。' },
      ],
      dc(s, c) {
        const T = { good: { off: 12.7, idle: 13.7, run: 14.2 }, reg: { off: 12.0, idle: 12.0, run: 12.1 }, stator: { off: 12.1, idle: 12.3, run: 12.4 }, over: { off: 12.6, idle: 15.2, run: 16.4 } };
        if (c.id === 'dead') return { Y1: 0, Y2: 0, Y3: 0, BATp: 12.1, FRM: 0 };
        return { Y1: 0.02, Y2: 0.01, Y3: 0.02, BATp: T[s][c.id], FRM: 0 };
      },
      ac(s, c) {
        if (c.id === 'off' || c.id === 'dead') return [];
        const k = c.id === 'idle' ? 0.46 : 1;
        const base = { '12': 31.2, '23': 30.8, '13': 31.5 };
        const open3 = s === 'stator';
        return [
          ['Y1', 'Y2', jitter(base['12'] * k, 1)],
          ['Y2', 'Y3', open3 ? 0.4 : jitter(base['23'] * k, 2)],
          ['Y1', 'Y3', open3 ? 0.5 : jitter(base['13'] * k, 3)],
        ];
      },
      res(s, a, b) {
        const R = { 'Y1|Y2': 0.6, 'Y2|Y3': s === 'stator' ? Infinity : 0.6, 'Y1|Y3': s === 'stator' ? Infinity : 0.6, 'FRM|BATp': Infinity };
        return R[a + '|' + b] ?? R[b + '|' + a] ?? (a === b ? 0 : Infinity);
      },
    },

    /* ============ 實驗 4:感知器 5V 與訊號 ============ */
    {
      id: 'sensor', title: '感知器:5V、訊號與接地(TPS/油門霍爾)', level: 3,
      intro: '診斷儀說「節氣門位置感知器訊號異常」。感知器有三條線:5V 參考電壓、訊號線、接地線。請量三個點,並拉動「油門開度」滑桿,觀察訊號電壓是否平順。正常時訊號約從 0.5 V 平順上升到 4.3 V。',
      conds: [{ id: 'on', label: '電門 ON、接頭插著(背探量測)' }],
      defaultCond: 'on',
      slider: { label: '油門開度', min: 0, max: 100, unit: '%', def: 0 },
      points: { REF: '5V 參考線', SIG: '訊號線', GND: '感知器接地線', FRM: '車架' },
      svg: `<svg class="sch" viewBox="0 0 640 280" role="img" aria-label="感知器電路圖">
        <rect class="part" x="40" y="70" width="130" height="130" rx="8"/><text x="105" y="140" text-anchor="middle" font-weight="700">ECU</text><text x="105" y="160" text-anchor="middle" font-size="11">(行車電腦)</text>
        <path class="wire" d="M170 95 H460" stroke="#c92a2a"/><path class="wire" d="M170 135 H460" stroke="#d9a400"/><path class="wire" d="M170 175 H460"/>
        <rect class="part" x="460" y="70" width="130" height="130" rx="8"/><text x="525" y="132" text-anchor="middle" font-weight="700">節氣門位置</text><text x="525" y="152" text-anchor="middle" font-weight="700">感知器</text>
        <rect class="part" x="40" y="236" width="550" height="12" rx="3"/><text x="315" y="272" text-anchor="middle">車架(接地)</text>
        ${P('REF', 330, 95, '5V 參考線', -26, -14)}
        ${P('SIG', 330, 135, '訊號線', -20, -14)}
        ${P('GND', 330, 175, '接地線', -20, 24)}
        ${P('FRM', 240, 236, '車架', 14, -10)}
      </svg>`,
      states: [
        { id: 'good', label: '感知器電路正常', symptom: '客戶只是例行檢查(沒有問題)。', why: '5V 參考約 5.0 V、接地約 0 V、訊號從 0.5 V 平順上升到約 4.3 V。三條線與感知器都正常。' },
        { id: 'ref', label: '5V 參考線斷路', symptom: '怠速忽高忽低,加速無力,儀表亮故障燈。', why: '5V 參考線量到 0 V,感知器根本沒有拿到電,所以訊號也是 0。問題在 5V 參考線或接頭,不在感知器本身。' },
        { id: 'gnd', label: '感知器接地線斷路', symptom: '怠速不穩,訊號亂跳。', why: '「接地線」對車架量到近 5 V(本來應該是 0 V),而 5V 參考與接地之間幾乎沒有壓差,感知器沒有完整迴路。問題在接地線或接頭。' },
        { id: 'sig', label: '訊號線斷路', symptom: '油門怎麼轉都沒反應,ECU 以為油門一直關著。', why: '5V 與接地都正常,但訊號線不論油門開多大都固定在 0 V。訊號線斷了(或接頭脫出)。' },
        { id: 'deadspot', label: '感知器內部有「死點」', symptom: '加到某個開度會頓一下、抖動。', why: '5V 與接地都正常、訊號大部分平順,但油門約 30–40% 之間訊號突然掉到 0.1 V 左右。這是感知器內部碳膜磨損的「死點」,需更換感知器。' },
      ],
      dc(s, c, sl) {
        const f = sl / 100;
        let sig = 0.5 + 3.8 * f;
        if (s === 'ref') return { REF: 0.0, SIG: 0.0, GND: 0.0, FRM: 0 };
        if (s === 'gnd') return { REF: 5.0, SIG: 4.9, GND: 4.9, FRM: 0 };
        if (s === 'sig') sig = 0.0;
        if (s === 'deadspot' && f >= 0.3 && f <= 0.4) sig = 0.1;
        return { REF: 5.0, SIG: Math.round(sig * 100) / 100, GND: 0.0, FRM: 0 };
      },
      ac: () => [],
      res: (s, a, b) => (a === b ? 0 : Infinity),
    },
  ];
})();
