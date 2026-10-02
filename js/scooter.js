/* 藍圖速克達:全站共用的「零件位置圖」元件
   APP.scooter({ mode: 'ice' | 'ev', states: { zone: 'lesson' | 'active' | 'checked' | 'bad' | 'missed' }, labels: true })
   回傳 { el, set(states) }。zone 名稱見下方 Z。 */
(function () {
  const { h } = APP;
  // zone: [標記 x, y, 中文名, 標籤 x, 標籤 y]
  // 位置依「常見 125cc 速克達」配置:引擎汽缸在腳踏板後下方往前橫躺、火星塞在汽缸頭上、
  // CVT 長殼從引擎延伸到後輪軸、空濾箱在 CVT 上方、排氣管從汽缸頭下方繞到後輪右側。實際位置依車型不同。
  const Z = {
    'front-tire': [92, 318, '前輪胎', 52, 190], 'front-brake': [128, 274, '前碟煞', 80, 344],
    'rear-tire': [442, 320, '後輪胎', 486, 300], 'rear-brake': [398, 274, '後煞車', 474, 206],
    headlight: [152, 130, '大燈/燈組', 96, 70], dash: [214, 82, '儀表/開關', 262, 38],
    battery: [262, 257, '電瓶', 232, 168], fuse: [290, 257, '保險絲', 304, 140], fuel: [356, 212, '油箱/油泵', 382, 108],
    intake: [402, 242, '空濾/節氣門', 452, 150], plug: [302, 264, '火星塞', 300, 72], engine: [318, 284, '引擎', 146, 344],
    cvt: [376, 278, 'CVT 傳動', 430, 344], charging: [342, 288, '發電/整流', 318, 344], exhaust: [476, 298, '排氣管', 482, 252],
    stand: [304, 310, '側柱開關', 222, 344], 'ev-battery': [284, 258, '電池包', 304, 140], controller: [420, 238, '控制器', 470, 150],
    hubmotor: [398, 274, '輪轂馬達', 470, 252], chargeport: [222, 178, '充電孔', 140, 186], dcdc: [360, 226, 'DC-DC', 382, 108],
  };
  APP.scooterZones = Z;
  APP.scooterBase = (mode) => base(mode);

  // 每張圖的漸層要有自己的 id(同頁可能有好幾台車)
  let uid = 0;
  const st = (c) => `style="stop-color:${c}"`;

  // 車輪:輪胎 + 五爪鋁圈(前輪多一片碟盤);電動車後輪是輪轂馬達
  function wheel(cx, kind, cls, u) {
    const c = 274;
    let s = `<circle cx="${cx}" cy="${c}" r="50" fill="url(#sct${u})" stroke="var(--sc-line)" stroke-width="1.8"/>
      <circle cx="${cx}" cy="${c}" r="44" fill="none" stroke="var(--sc-tread)" stroke-width="2.5"/>
      <circle cx="${cx}" cy="${c}" r="36" fill="var(--sc-wheel)" stroke="var(--sc-rim)" stroke-width="4"/>`;
    s += `<g class="sc-spk ${cls}" style="transform-origin:${cx}px ${c}px">`;
    if (kind === 'motor') {
      s += `<circle cx="${cx}" cy="${c}" r="31" fill="url(#scm${u})" stroke="var(--sc-line)" stroke-width="1.5"/>
        <circle cx="${cx}" cy="${c}" r="19" fill="none" stroke="var(--sc-line)" stroke-width="1.5" opacity=".6"/>`;
      for (let k = 0; k < 6; k++) { const a = (k * Math.PI) / 3; s += `<circle cx="${(cx + 25 * Math.cos(a)).toFixed(1)}" cy="${(c + 25 * Math.sin(a)).toFixed(1)}" r="2.2" fill="var(--sc-line)"/>`; }
      s += `<circle cx="${cx}" cy="${c}" r="8" fill="var(--sc-trim)" stroke="var(--sc-rim)" stroke-width="2"/>`;
    } else {
      let d = '';
      for (let k = 0; k < 5; k++) { const a = (k * 2 * Math.PI) / 5 - Math.PI / 2; d += `M${(cx + 9 * Math.cos(a)).toFixed(1)} ${(c + 9 * Math.sin(a)).toFixed(1)}L${(cx + 33 * Math.cos(a)).toFixed(1)} ${(c + 33 * Math.sin(a)).toFixed(1)}`; }
      s += `<path d="${d}" stroke="var(--sc-rim)" stroke-width="7" stroke-linecap="round"/>`;
      if (kind === 'front') s += `<circle cx="${cx}" cy="${c}" r="25" fill="none" stroke="var(--sc-disc)" stroke-width="8" opacity=".92"/>
        <circle cx="${cx}" cy="${c}" r="25" fill="none" stroke="var(--sc-line)" stroke-width="2" stroke-dasharray="2 7" opacity=".55"/>`;
      s += `<circle cx="${cx}" cy="${c}" r="10" fill="var(--sc-rim)" stroke="var(--sc-line)" stroke-width="1.5"/><circle cx="${cx}" cy="${c}" r="3.5" fill="var(--sc-line)"/>`;
    }
    return s + '</g>';
  }

  // 一台常見 125cc 速克達的左側視圖(車頭朝左)
  function base(mode) {
    const ev = mode === 'ev', u = ++uid;
    const L = 'stroke="var(--sc-line)" stroke-width="1.8"';
    return `<defs>
        <linearGradient id="scb${u}" x1="0" y1="0" x2="0" y2="1"><stop offset="0" ${st('var(--sc-body)')}/><stop offset="1" ${st('var(--sc-body2)')}/></linearGradient>
        <linearGradient id="scf${u}" x1="0" y1="0" x2="1" y2="0"><stop offset="0" ${st('var(--sc-body2)')}/><stop offset=".55" ${st('var(--sc-body)')}/><stop offset="1" ${st('var(--sc-body2)')}/></linearGradient>
        <linearGradient id="scm${u}" x1="0" y1="0" x2="0" y2="1"><stop offset="0" ${st('var(--sc-metal-hi)')}/><stop offset="1" ${st('var(--sc-metal)')}/></linearGradient>
        <linearGradient id="scs${u}" x1="0" y1="0" x2="0" y2="1"><stop offset="0" ${st('var(--sc-seat-hi)')}/><stop offset="1" ${st('var(--sc-seat)')}/></linearGradient>
        <radialGradient id="sct${u}"><stop offset=".7" ${st('var(--sc-tire)')}/><stop offset="1" ${st('var(--sc-tire2)')}/></radialGradient>
      </defs>
      <ellipse cx="262" cy="326" rx="232" ry="7" fill="var(--sc-shadow)"/>
      <g stroke-linecap="round" stroke-linejoin="round">
        ${ev ? '' : `<path d="M298 294 C306 314 360 318 410 304" stroke="url(#scm${u})" stroke-width="8" fill="none"/>
        <path d="M404 282 H474 C488 282 496 290 496 296 C496 304 488 310 474 310 H404 Z" fill="url(#scm${u})" ${L}/>
        <path d="M486 290 H496 M486 302 H496" stroke="var(--sc-line)" stroke-width="1.5" opacity=".5"/>`}
        ${wheel(398, ev ? 'motor' : 'rear', 'sc-r', u)}
        ${wheel(128, 'front', 'sc-f', u)}
        <path d="M128 274 L141 240" stroke="var(--sc-trim)" stroke-width="12" fill="none"/>
        <path d="M140 242 L156 200" stroke="url(#scm${u})" stroke-width="8" fill="none"/>
        <path d="M141 243 Q147 239 152 244 L156 262 Q157 268 151 269 L146 268 Q143 256 141 243 Z" transform="rotate(-20 148 256)" fill="var(--sc-trim)" stroke="var(--sc-metal)" stroke-width="1.5"/>
        <path d="M70 252 A60 60 0 0 1 176 238 L170 244 A53 53 0 0 0 78 256 Z" fill="var(--sc-trim)" ${L}/>
        ${ev ? `<path d="M316 262 C350 260 380 262 398 264 A11 11 0 0 1 398 286 C380 286 350 284 316 280 Q310 271 316 262 Z" fill="url(#scm${u})" ${L}/>`
             : `<path d="M368 244 C342 244 318 252 304 266" stroke="var(--sc-trim)" stroke-width="7" fill="none"/>
        <path d="M296 268 H334 V300 H296 Q288 300 288 292 V276 Q288 268 296 268 Z" fill="url(#scm${u})" ${L}/>
        <path d="M304 270 V298 M311 270 V298 M318 270 V298 M325 270 V298" stroke="var(--sc-line)" stroke-width="1.3" opacity=".6"/>
        <rect x="298" y="258" width="8" height="12" rx="2" fill="var(--sc-trim)" stroke="var(--sc-line)" stroke-width="1"/>
        <path d="M338 250 H398 A27 27 0 0 1 398 304 H350 Q332 304 332 288 V262 Q332 250 338 250 Z" fill="url(#scf${u})" ${L}/>
        <path d="M346 265 L376 261 M346 287 L376 291" stroke="var(--sc-line)" stroke-width="1.4" opacity=".45"/>
        <g class="sc-pul" style="transform-origin:346px 276px"><circle cx="346" cy="276" r="9" fill="none" stroke="var(--sc-line)" stroke-width="1.6" opacity=".7"/><path d="M346 269v14M339 276h14" stroke="var(--sc-line)" stroke-width="1.3" opacity=".7"/></g>
        <g class="sc-pul" style="transform-origin:376px 276px"><circle cx="376" cy="276" r="13" fill="none" stroke="var(--sc-line)" stroke-width="1.6" opacity=".7"/><path d="M376 266v20M366 276h20" stroke="var(--sc-line)" stroke-width="1.3" opacity=".7"/></g>
        <circle cx="398" cy="277" r="6" fill="var(--sc-metal)" stroke="var(--sc-line)" stroke-width="1.2"/>
        <path d="M366 236 H428 Q436 236 436 244 V252 H366 Z" fill="var(--sc-trim)" ${L}/>`}
        <path d="M424 266 L444 216" stroke="url(#scm${u})" stroke-width="8" fill="none"/>
        <path d="M427 256 l13 -3 M431 246 l13 -3 M435 236 l13 -3" stroke="#d64535" stroke-width="2.5" fill="none"/>
        <path d="M470 220 C488 228 500 240 506 256 L497 259 C490 244 480 234 466 228 Z" fill="var(--sc-trim)" ${L}/>
        <rect x="494" y="250" width="22" height="14" rx="2" fill="#f4f4f2" ${L}/><path d="M499 257 h12" stroke="#666" stroke-width="2"/>
        <path d="M330 254 C334 230 346 210 368 202 L474 186 C494 183 510 190 510 200 C510 212 500 220 486 222 L460 224 C440 214 416 212 398 218 C378 226 362 240 354 254 Z" fill="url(#scb${u})" ${L}/>
        <path d="M352 212 C380 204 430 197 486 190" stroke="var(--sc-gloss)" stroke-width="2.5" fill="none"/>
        <path d="M398 218 C416 212 440 214 460 224 L486 222" stroke="var(--sc-trim)" stroke-width="3" fill="none" opacity=".7"/>
        <path d="M498 192 C506 192 511 196 511 202 C511 208 506 212 498 212 L494 206 Z" fill="#d93a32" stroke="var(--sc-line)" stroke-width="1.5"/>
        <path d="M346 204 C350 188 366 178 392 176 L436 172 C450 162 468 160 488 164 C502 167 506 178 498 186 L368 202 Z" fill="url(#scs${u})" ${L}/>
        <path d="M440 174 L488 168" stroke="var(--sc-gloss)" stroke-width="1.5" opacity=".5" fill="none"/>
        <path d="M456 184 L500 179 L506 186" stroke="url(#scm${u})" stroke-width="5" fill="none"/>
        <path d="M222 248 H338 L342 264 Q342 268 336 268 H232 Q224 268 222 260 Z" fill="var(--sc-trim)" ${L}/>
        <path d="M226 248 H336" stroke="var(--sc-body)" stroke-width="5"/>
        <path d="M228 245 H334" stroke="var(--sc-line)" stroke-width="1.5"/>
        ${ev ? '<rect x="238" y="251" width="94" height="13" rx="4" fill="var(--accent-soft)" stroke="var(--accent)" stroke-width="2" stroke-dasharray="4 3"/>' : ''}
        <path d="M91 222 A64 64 0 0 1 183 242 C196 246 210 248 224 250 L232 250 C222 220 212 170 208 114 L198 102 C184 98 170 100 162 104 C146 128 126 162 112 192 C104 206 96 214 91 222 Z" fill="url(#scb${u})" ${L}/>
        <path d="M200 116 C204 166 214 214 226 248 L232 250 C222 220 212 170 208 114 Z" fill="var(--sc-trim)" opacity=".85"/>
        <path d="M160 110 C146 132 128 164 114 194" stroke="var(--sc-gloss)" stroke-width="3" fill="none"/>
        <path d="M150 116 C156 108 166 106 170 110 L166 132 C162 140 152 142 146 136 Z" fill="var(--sc-lamp)" stroke="var(--sc-line)" stroke-width="1.5"/>
        <path d="M152 120 C156 115 162 114 165 116" stroke="#fff" stroke-width="2" fill="none" opacity=".8"/>
        <path d="M118 176 L128 170 L130 180 L120 186 Z" fill="#f0a020" stroke="var(--sc-line)" stroke-width="1.2"/>
        <path d="M160 102 C168 86 186 78 210 76 L240 78 C248 80 248 88 240 90 L214 96 C194 100 176 104 160 102 Z" fill="url(#scb${u})" ${L}/>
        <path d="M196 86 C204 82 214 81 224 82" stroke="var(--sc-trim)" stroke-width="5" fill="none"/>
        <path d="M236 84 L268 88" stroke="var(--sc-trim)" stroke-width="8" fill="none"/>
        <path d="M240 92 L270 98" stroke="var(--sc-metal)" stroke-width="2.5" fill="none"/>
        <path d="M204 78 L194 52" stroke="var(--sc-metal)" stroke-width="2.5" fill="none"/><ellipse cx="192" cy="46" rx="11" ry="7" fill="var(--sc-trim)" ${L}/>
        <path d="M312 298 L298 322" stroke="url(#scm${u})" stroke-width="4.5" fill="none"/>
        <path d="M344 304 L338 326 M330 326 H348" stroke="url(#scm${u})" stroke-width="4.5" fill="none"/>
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
    el.innerHTML = `<svg viewBox="0 0 520 360" role="img" aria-label="${label}">${base(mode)}<g class="sc-zones"></g></svg>` + (opts.note === false ? '' : '<p class="sc-note">以常見 125cc 速克達為例,實際位置依車型不同</p>');
    const layer = el.querySelector('.sc-zones');
    const api = {
      el,
      set(states) { layer.innerHTML = zonesSVG(states, opts.labels !== false); },
    };
    api.set(opts.states || {});
    return api;
  };

  /* ================= 原理動畫:在同一張速克達上,一步一步看能量怎麼流 ================= */
  const TOURS = {
    drive: { mode: 'ice', title: '機車怎麼跑起來', steps: [
      { z: ['fuel'], t: '送油', d: '打開電門,油箱裡的油泵把汽油加壓,沿油管送到噴油嘴。', flow: ['M356 212 C362 226 366 236 366 242'] },
      { z: ['intake'], t: '吸氣、噴油', d: '空氣經過空濾、節氣門被吸進來,噴油嘴把汽油噴成霧,混成「油氣」進入汽缸。', flow: ['M426 242 H366 C340 242 318 250 304 266'] },
      { z: ['plug', 'engine'], t: '點火爆發', d: '火星塞在對的時間跳火,點燃油氣;爆發的力量推動活塞、轉動曲軸。這就是「吸、壓、爆、排」的「爆」。', fx: ['spark'] },
      { z: ['cvt', 'rear-tire'], t: 'CVT 把動力傳到後輪', d: '曲軸帶動前普利盤,皮帶把力量傳到後盤和離合器,再經齒輪箱轉動後輪。轉速越高,皮帶越往外,車越跑越快。', flow: ['M334 266 H378', 'M378 286 H334'], fx: ['pul', 'spin-r'] },
      { z: ['exhaust'], t: '排出廢氣', d: '燒完的廢氣從汽缸頭下方排出,經過觸媒與消音器,從尾端排掉。', flow: ['M302 292 C312 314 372 316 412 302 H490'], fx: ['puff', 'spin-r', 'pul'] },
      { z: ['charging', 'battery'], t: '一邊跑一邊充電', d: '引擎同時轉動發電線圈,整流器把交流電整成直流電,替電瓶充電、供應燈光和儀表。', flow: ['M342 288 C320 300 280 280 262 258'], fx: ['spin-r', 'pul'] },
    ] },
    brake: { mode: 'ice', title: '按下煞車時發生什麼事', steps: [
      { z: ['dash'], t: '握住煞車把手', d: '把手推動主缸裡的活塞,把煞車油加壓。煞車油不能被壓縮,所以力量會整個傳下去。', fx: ['spin-f', 'spin-r'] },
      { z: ['front-brake'], t: '油壓傳到卡鉗', d: '油壓沿著煞車油管往下傳,卡鉗裡的活塞把來令片往碟盤推。', flow: ['M248 84 C222 112 168 172 140 262'], fx: ['spin-f', 'spin-r'] },
      { z: ['front-brake', 'front-tire'], t: '夾住碟盤,輪子停下', d: '來令片夾住碟盤,摩擦把「動能」變成「熱」。所以來令片會越磨越薄、碟盤會發燙,要定期檢查厚度。', fx: ['clamp', 'stop'] },
    ] },
    ev: { mode: 'ev', title: '電動機車的能量怎麼流', steps: [
      { z: ['ev-battery'], t: '電池包是動力來源', d: '高壓電池包放在腳踏板下方,BMS(電池管理系統)隨時監控每顆電芯的電壓與溫度。' },
      { z: ['dash', 'controller'], t: '轉油門只送「訊號」', d: '油門本身不走大電流,它只告訴控制器「你要多大的力」。', flow: ['M248 84 C300 120 380 190 420 238'] },
      { z: ['ev-battery', 'controller'], t: '控制器調配電力', d: '控制器把電池的直流電,轉成馬達要的三相交流電,大小依油門決定。', flow: ['M290 256 C330 250 380 244 420 238'] },
      { z: ['hubmotor', 'rear-tire'], t: '輪轂馬達轉動', d: '三相電讓後輪裡的馬達轉起來,直接推車往前,中間沒有皮帶和齒輪箱。', flow: ['M420 238 C420 252 406 262 398 274'], fx: ['spin-r'] },
      { z: ['hubmotor', 'ev-battery'], t: '放油門、煞車時回充', d: '減速時馬達反過來當發電機,把動能變回電,充回電池(動能回收)。', flow: ['M398 274 C370 268 330 262 290 256'], back: true, fx: ['spin-r'] },
      { z: ['chargeport', 'ev-battery'], t: '充電', d: '插上充電器(或直接換電池),電從充電孔流進電池包。', flow: ['M222 178 C240 210 262 240 286 256'] },
    ] },
  };
  APP.scooterTours = TOURS;
  APP.widgets = APP.widgets || {};
  Object.keys(TOURS).forEach((k) => { APP.widgets['tour-' + k] = (box) => box.append(APP.scooterTour({ tour: k, autoplay: true }).el); });
  const reduce = () => !!(window.matchMedia && matchMedia('(prefers-reduced-motion: reduce)').matches);

  function fxSVG(step) {
    const col = step.back ? 'var(--ok)' : 'var(--accent-hi)';
    let out = '';
    (step.flow || []).forEach((d) => {
      out += `<path class="sc-flow" d="${d}" stroke="${col}"/>`;
      if (!reduce()) for (let k = 0; k < 3; k++) out += `<circle r="4.5" fill="${col}" stroke="var(--card)" stroke-width="1.5"><animateMotion dur="1.5s" begin="${-k * 0.5}s" repeatCount="indefinite" path="${d}"/></circle>`;
    });
    const fx = step.fx || [];
    if (fx.includes('spark')) out += `<g class="sc-spark"><path d="M302 254v-14M302 254l9 -9M302 254l-9 -9M302 254h13M302 254h-13" stroke="#ffc53d" stroke-width="3" stroke-linecap="round"/><circle cx="302" cy="254" r="5" fill="#fff3c4"/></g>`;
    if (fx.includes('puff')) out += [0, 1, 2].map((k) => `<circle class="sc-puff" style="animation-delay:${k * 0.5}s" cx="496" cy="296" r="7" fill="var(--muted)"/>`).join('');
    if (fx.includes('clamp')) out += `<rect class="sc-clamp" x="136" y="250" width="16" height="22" rx="5" fill="var(--bad)" stroke="var(--card)" stroke-width="2"/>`;
    return out;
  }

  // APP.scooterTour({ tour: 'drive' | 'brake' | 'ev', start, autoplay, loop })
  APP.scooterTour = function (opts) {
    const T = TOURS[opts.tour];
    const sc = APP.scooter({ mode: T.mode, note: false, aria: T.title + '(原理動畫)' });
    const svg = sc.el.querySelector('svg');
    svg.insertAdjacentHTML('beforeend', '<g class="sc-fx"></g>');
    const fxLayer = svg.querySelector('.sc-fx');
    let i = Math.min(opts.start || 0, T.steps.length - 1), timer = null, playing = false, visible = true;
    const cap = h('div', { class: 'tour-cap', 'aria-live': 'polite' });
    const dots = h('div', { class: 'tour-dots' }, T.steps.map((st, k) => h('button', { type: 'button', 'aria-label': `第 ${k + 1} 步:${st.t}`, onclick: () => { stop(); go(k); } })));
    const playBtn = h('button', { class: 'btn small', type: 'button', onclick: () => (playing ? stop() : play()) });
    const el = h('figure', { class: 'tour' },
      h('figcaption', { class: 'tour-head' }, h('span', { class: 'eyebrow' }, '原理動畫'), h('strong', null, T.title)),
      sc.el, cap,
      h('div', { class: 'tour-ctrl' },
        h('button', { class: 'btn small', type: 'button', 'aria-label': '上一步', onclick: () => { stop(); go(i - 1); } }, APP.icon('chevron-left', 18)),
        playBtn, dots,
        h('button', { class: 'btn small', type: 'button', 'aria-label': '下一步', onclick: () => { stop(); go(i + 1); } }, APP.icon('chevron-right', 18))),
      h('p', { class: 'sc-note' }, '以常見 125cc 速克達為例,實際位置依車型不同'));

    function go(k) {
      i = (k + T.steps.length) % T.steps.length;
      const st = T.steps[i], fx = st.fx || [];
      sc.set(Object.fromEntries(st.z.map((z) => [z, 'active'])));
      fxLayer.innerHTML = fxSVG(st);
      sc.el.classList.toggle('spin-r', fx.includes('spin-r'));
      sc.el.classList.toggle('spin-f', fx.includes('spin-f'));
      sc.el.classList.toggle('spin-pul', fx.includes('pul'));
      sc.el.classList.remove('spin-stop'); void sc.el.offsetWidth; sc.el.classList.toggle('spin-stop', fx.includes('stop'));
      cap.innerHTML = '';
      cap.append(h('span', { class: 'tour-num' }, `${i + 1}/${T.steps.length}`), h('div', null, h('strong', null, st.t), h('p', null, st.d)));
      [...dots.children].forEach((b, n) => { b.classList.toggle('on', n === i); if (n === i) b.setAttribute('aria-current', 'step'); else b.removeAttribute('aria-current'); });
    }
    function tick() {
      if (!el.isConnected) { stop(); return; }
      if (!visible) return;
      if (i === T.steps.length - 1 && !opts.loop) { stop(); return; }
      go(i + 1);
    }
    function setBtn() { playBtn.innerHTML = ''; playBtn.setAttribute('aria-label', playing ? '暫停' : '播放'); playBtn.append(APP.icon(playing ? 'pause' : 'play', 16), h('span', { class: 'tour-lbl' }, playing ? '暫停' : '播放')); }
    function play() { if (i === T.steps.length - 1 && !opts.loop) go(0); playing = true; clearInterval(timer); timer = setInterval(tick, 5200); setBtn(); }
    function stop() { playing = false; clearInterval(timer); setBtn(); }
    if ('IntersectionObserver' in window) new IntersectionObserver((es) => { visible = es[0].isIntersecting; }).observe(el);
    go(i);
    if (opts.autoplay && !reduce()) play(); else setBtn();
    return { el, go, play, stop };
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
