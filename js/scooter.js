/* 藍圖速克達:全站共用的「零件位置圖」元件
   APP.scooter({ mode: 'ice' | 'ev', states: { zone: 'lesson' | 'active' | 'checked' | 'bad' | 'missed' }, labels: true })
   回傳 { el, set(states) }。zone 名稱見下方 Z。 */
(function () {
  const { h } = APP;
  // zone: [標記 x, y, 中文名, 標籤 x, 標籤 y]
  const Z = {
    'front-tire': [96, 316, '前輪胎', 52, 188], 'front-brake': [128, 274, '前碟煞', 70, 342],
    'rear-tire': [430, 318, '後輪胎', 480, 252], 'rear-brake': [398, 274, '後煞車', 470, 342],
    headlight: [174, 122, '大燈/燈組', 104, 62], dash: [204, 92, '儀表/開關', 246, 40],
    battery: [278, 230, '電瓶', 232, 160], fuse: [306, 226, '保險絲', 312, 150], fuel: [372, 212, '油箱/油泵', 384, 110],
    intake: [440, 226, '空濾/節氣門', 462, 176], plug: [352, 250, '火星塞', 298, 72], engine: [404, 254, '引擎', 452, 104],
    cvt: [372, 272, 'CVT 傳動', 332, 342], charging: [336, 272, '發電/整流', 226, 342], exhaust: [452, 302, '排氣管', 468, 298],
    stand: [300, 304, '側柱開關', 196, 300], 'ev-battery': [282, 248, '電池包', 246, 168], controller: [432, 214, '控制器', 468, 170],
    hubmotor: [398, 274, '輪轂馬達', 478, 252], chargeport: [214, 172, '充電孔', 146, 150], dcdc: [342, 214, 'DC-DC', 362, 116],
  };
  APP.scooterZones = Z;

  const wheel = (cx, ev) => `<circle cx="${cx}" cy="274" r="52" fill="none" stroke="var(--text)" stroke-width="9"/><circle cx="${cx}" cy="274" r="36" fill="var(--card)" stroke="var(--text)" stroke-width="2"/>` +
    (ev ? `<circle cx="${cx}" cy="274" r="27" fill="var(--svg-metal)" stroke="var(--text)" stroke-width="2.5"/><circle cx="${cx}" cy="274" r="9" fill="var(--text)"/>` :
      `<path d="M${cx} 244v60M${cx - 30} 274h60M${cx - 21} 253l42 42M${cx + 21} 253l-42 42" stroke="var(--muted)" stroke-width="2" stroke-linecap="round"/><circle cx="${cx}" cy="274" r="9" fill="var(--text)"/>`);

  function base(mode) {
    const ev = mode === 'ev';
    return `<defs><linearGradient id="scpanel" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="var(--card)"/><stop offset="1" stop-color="var(--bg2)"/></linearGradient></defs>
      <path d="M36 328H496" stroke="var(--border2)" stroke-width="2" stroke-dasharray="2 9" fill="none"/>
      <g stroke-linecap="round" stroke-linejoin="round">
        ${wheel(128, false)}${wheel(398, ev)}
        <path d="M128 274 L176 106" stroke="var(--text)" stroke-width="8" fill="none"/>
        <path d="M176 106 L196 86 L240 90" stroke="var(--text)" stroke-width="6" fill="none"/>
        <path d="M430 254 L452 206" stroke="var(--muted)" stroke-width="7" fill="none"/>
        ${ev ? '' : `<path d="M330 246 H420 Q440 246 440 266 V276 Q440 294 420 294 H352 Q330 294 330 272 Z" fill="url(#scpanel)" stroke="var(--text)" stroke-width="2.5"/>
        <circle cx="372" cy="270" r="15" fill="none" stroke="var(--text)" stroke-width="2"/>
        <path d="M344 300 C388 314 434 312 470 294" stroke="var(--muted)" stroke-width="6" fill="none"/>`}
        <path d="M170 104 C190 98 204 108 210 122 C228 162 238 204 242 244 L218 248 C212 204 198 160 176 128 Z" fill="url(#scpanel)" stroke="var(--text)" stroke-width="3"/>
        <path d="M218 240 H336 Q344 240 344 248 Q344 256 336 256 H218 Z" fill="url(#scpanel)" stroke="var(--text)" stroke-width="3"/>
        ${ev ? '<rect x="236" y="256" width="100" height="22" rx="6" fill="var(--accent-soft)" stroke="var(--accent)" stroke-width="2"/>' : ''}
        <path d="M326 252 C318 222 330 196 362 188 L472 180 C494 180 506 200 496 220 C488 238 468 248 440 250 Z" fill="url(#scpanel)" stroke="var(--text)" stroke-width="3"/>
        <path d="M342 188 C352 166 380 156 420 154 H478 C494 154 500 168 490 178 L362 190 Z" fill="var(--text)" stroke="var(--text)" stroke-width="2"/>
        <path d="M494 200 L500 210" stroke="var(--accent-hi)" stroke-width="7" fill="none"/>
        <ellipse cx="174" cy="122" rx="8" ry="13" fill="none" stroke="var(--accent-hi)" stroke-width="4"/>
        <path d="M300 300 L318 322" stroke="var(--muted)" stroke-width="4" fill="none"/>
      </g>`;
  }

  function zonesSVG(states, labels) {
    let marks = '', tags = '';
    for (const [z, st] of Object.entries(states || {})) {
      const d = Z[z]; if (!d) continue;
      const [x, y, name, lx, ly] = d;
      const col = st === 'bad' || st === 'missed' ? 'var(--bad)' : 'var(--accent-hi)';
      if (st === 'missed') marks += `<circle cx="${x}" cy="${y}" r="10" fill="none" stroke="${col}" stroke-width="2.5" stroke-dasharray="3 3"/>`;
      else marks += `<g class="sc-mark ${st}"><circle class="sc-pulse" cx="${x}" cy="${y}" r="10" fill="${col}"/><circle cx="${x}" cy="${y}" r="${st === 'checked' ? 5.5 : 7}" fill="${col}" stroke="var(--card)" stroke-width="2"/></g>`;
      if (labels && (st === 'lesson' || st === 'active' || st === 'missed')) {
        const w = name.length * 15 + 22;
        tags += `<g class="sc-tag"><path d="M${x} ${y} L${lx} ${ly}" stroke="${col}" stroke-width="1.5" stroke-dasharray="3 4" fill="none"/>
          <rect x="${lx - w / 2}" y="${ly - 15}" width="${w}" height="28" rx="9" fill="${st === 'missed' ? 'var(--bad)' : 'var(--text)'}"/>
          <text x="${lx}" y="${ly + 4}" text-anchor="middle" fill="var(--bg)" font-size="14" font-weight="700">${name}</text></g>`;
      }
    }
    return tags + marks;
  }

  APP.scooter = function (opts) {
    opts = opts || {};
    const mode = opts.mode || 'ice';
    const el = h('div', { class: 'scooter' + (opts.compact ? ' compact' : '') });
    const label = opts.aria || '速克達零件位置圖';
    el.innerHTML = `<svg viewBox="0 0 520 360" role="img" aria-label="${label}">${base(mode)}<g class="sc-zones"></g></svg>`;
    const layer = el.querySelector('.sc-zones');
    const api = {
      el,
      set(states) { layer.innerHTML = zonesSVG(states, opts.labels !== false); },
    };
    api.set(opts.states || {});
    return api;
  };

  // 診斷案例:由檢查項目的文字推算車上的位置
  const RULES = [
    [/側柱/, 'stand'], [/充電器|充電孔|插座/, 'chargeport'], [/控制器/, 'controller'], [/霍爾|輪轂馬達|馬達三相|繞組|手轉輪子|馬達線束/, 'hubmotor'],
    [/12V 輔助/, 'battery'], [/BMS|電池包|SOC|電芯|電池與|電池電量|電池狀態/, 'ev-battery'],
    [/保險絲|加裝|接線/, 'fuse'], [/電瓶|壓降|暗電流|啟動繼電器/, 'battery'], [/整流|發電線圈|磁電機/, 'charging'],
    [/火星塞|點火|火花/, 'plug'], [/缸壓|缸頭|引擎側蓋|ECU|腳踏啟動/, 'engine'],
    [/CVT|皮帶|普利|離合器/, 'cvt'], [/節氣門|進氣|空濾|起動噴霧|TPS|怠速/, 'intake'],
    [/後煞車|後輪|輪轂的溫度|兩個輪轂/, 'rear-brake'], [/煞車|來令片|卡鉗|碟盤|主缸|放氣|黃油|DOT5/, 'front-brake'],
    [/油泵|油管|油箱|燃油|噴油|汽油/, 'fuel'], [/排氣|觸媒|煙/, 'exhaust'], [/胎壓|輪胎|軸承/, 'front-tire'],
    [/接頭/, 'hubmotor'], [/油門/, 'dash'],
    [/方向燈|大燈|燈泡|燈座|閃爍器|喇叭|線束/, 'headlight'], [/儀表|電門|開關|試騎|讀碼|診斷儀|App|功率|熄火/, 'dash'],
  ];
  APP.zoneOf = (label) => { const r = RULES.find(([re]) => re.test(label)); return r ? r[1] : null; };
})();
