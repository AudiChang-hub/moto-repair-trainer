/* 互動圖解:四行程、CVT、電動車能量流、發不動診斷樹、機車側視圖 */
(function () {
  const { h } = APP;
  const W = (APP.widgets = APP.widgets || {});
  const rad = (d) => (d * Math.PI) / 180;
  const set = (el, attrs) => { for (const k in attrs) el.setAttribute(k, attrs[k]); };

  /* ================= 四行程 ================= */
  W.fourstroke = function (host) {
    const cx = 260, cy = 300, R = 50, L = 130;
    host.append(h('div', { class: 'card flat', html: `
      <svg class="wsvg" viewBox="0 0 520 400" role="img" aria-label="四行程引擎動畫">
        <path class="body" d="M70 52 H200 V88 H70 Z"/><text x="76" y="48">進氣 →</text>
        <path class="body" d="M320 52 H450 V88 H320 Z"/><text x="396" y="48">→ 排氣</text>
        <rect id="gas" x="200" y="70" width="120" height="30" fill="#64aaff" opacity=".3"/>
        <path class="ln" d="M200 70 V252 M320 70 V252"/>
        <rect class="body" x="190" y="28" width="140" height="42" rx="6"/>
        <g id="vin"><rect class="metal" x="230" y="44" width="5" height="26"/><rect class="metal" x="220" y="66" width="25" height="5" rx="2"/></g>
        <g id="vex"><rect class="metal" x="285" y="44" width="5" height="26"/><rect class="metal" x="275" y="66" width="25" height="5" rx="2"/></g>
        <rect class="metal" x="257" y="14" width="6" height="22"/>
        <g id="spark" visibility="hidden"><polygon points="260,62 267,50 261,50 268,38 254,54 260,54" fill="#ffc400" stroke="#d9480f" stroke-width="1.5"/></g>
        <line id="rod" class="ln" stroke-width="8"/>
        <g id="pis"><rect class="metal" x="202" y="0" width="116" height="34" rx="4"/><path class="ln" d="M202 8 H318 M202 15 H318"/><circle cx="260" cy="22" r="5" fill="var(--svg-line)"/></g>
        <circle class="body" cx="${cx}" cy="${cy}" r="${R + 20}"/>
        <circle id="pin" cx="${cx}" cy="${cy - R}" r="8" class="metal"/>
        <circle cx="${cx}" cy="${cy}" r="6" fill="var(--svg-line)"/>
        <text x="${cx}" y="${cy + R + 40}" text-anchor="middle" font-size="12">曲軸</text>
        <text x="340" y="190" font-size="12" fill="currentColor">活塞</text>
        <text x="204" y="124" font-size="12" id="lblgas"></text>
      </svg>
      <div class="row spread mt"><div><strong id="strokeName" style="font-size:1.15rem"></strong><div class="muted small" id="angleTxt"></div></div>
        <div class="row"><button class="btn small" id="play">⏸ 暫停</button>
          <button class="btn small ghost" data-sp="0.5">慢</button><button class="btn small ghost" data-sp="1">中</button><button class="btn small ghost" data-sp="2">快</button></div></div>
      <input type="range" id="ang" min="0" max="719" value="0" aria-label="曲軸角度">
      <div class="callout key" id="strokeDesc" style="margin-bottom:0"></div>` }));

    const q = (s) => host.querySelector(s);
    const gas = q('#gas'), pis = q('#pis'), rod = q('#rod'), pin = q('#pin'), vin = q('#vin'), vex = q('#vex'), spark = q('#spark');
    const info = [
      ['① 吸氣行程', '活塞下降,進氣門打開,空氣與汽油被吸進汽缸。(噴射車由噴油嘴噴油)'],
      ['② 壓縮行程', '進排氣門都關上,活塞上升,把油氣壓到約原來體積的 1/10。壓得越緊,爆炸越有力。'],
      ['③ 爆炸(作功)行程', '火星塞在接近上死點時點火,燃燒的氣體推動活塞下降。**這是唯一產生動力的行程。**'],
      ['④ 排氣行程', '排氣門打開,活塞上升把廢氣推出去,然後回到①,循環繼續。'],
    ];
    let angle = 0, speed = 1, playing = true, last = 0, raf = 0, lastStroke = -1;
    function draw() {
      const a = ((angle % 720) + 720) % 720;
      const th = rad(a);
      const px = cx + R * Math.sin(th), py = cy - R * Math.cos(th);
      const pPinY = py - Math.sqrt(L * L - (px - cx) * (px - cx));
      set(pis, { transform: `translate(0,${pPinY - 22})` });
      set(rod, { x1: cx, y1: pPinY, x2: px, y2: py });
      set(pin, { cx: px, cy: py });
      const top = pPinY - 22;
      set(gas, { height: Math.max(0, top - 70) });
      const stroke = Math.floor(a / 180), prog = (a % 180) / 180;
      let fill = '#64aaff', op = 0.3;
      if (stroke === 0) { fill = '#64aaff'; op = 0.2 + 0.25 * prog; }
      else if (stroke === 1) { fill = '#3b82f6'; op = 0.45 + 0.4 * prog; }
      else if (stroke === 2) { fill = '#ff8c1e'; op = 0.9 - 0.5 * prog; }
      else { fill = '#8a8f98'; op = 0.5 - 0.3 * prog; }
      set(gas, { fill, opacity: op });
      set(vin, { transform: `translate(0,${stroke === 0 ? 9 : 0})` });
      set(vex, { transform: `translate(0,${stroke === 3 ? 9 : 0})` });
      spark.setAttribute('visibility', a >= 350 && a <= 372 ? 'visible' : 'hidden');
      q('#angleTxt').textContent = `曲軸角度 ${Math.round(a)}°(轉兩圈 = 720° 完成一個循環)`;
      q('#ang').value = Math.round(a);
      if (stroke !== lastStroke) {
        lastStroke = stroke;
        q('#strokeName').textContent = info[stroke][0];
        q('#strokeDesc').innerHTML = APP.rich(info[stroke][1]);
      }
    }
    function loop(ts) {
      if (last) { const dt = (ts - last) / 1000; if (playing) angle += dt * 90 * speed; }
      last = ts;
      draw();
      raf = requestAnimationFrame(loop);
    }
    q('#play').onclick = () => { playing = !playing; q('#play').textContent = playing ? '⏸ 暫停' : '▶ 播放'; };
    host.querySelectorAll('[data-sp]').forEach((b) => (b.onclick = () => (speed = +b.dataset.sp)));
    q('#ang').oninput = (e) => { angle = +e.target.value; playing = false; q('#play').textContent = '▶ 播放'; };
    raf = requestAnimationFrame(loop);
    APP.onLeave(() => cancelAnimationFrame(raf));
  };

  /* ================= CVT ================= */
  W.cvt = function (host) {
    const x1 = 140, x2 = 440, y = 150, d = x2 - x1;
    host.append(h('div', { class: 'card flat', html: `
      <svg class="wsvg" viewBox="0 0 580 300" role="img" aria-label="CVT 示意圖">
        <circle cx="${x1}" cy="${y}" r="92" fill="none" stroke="var(--svg-soft)" stroke-width="3" stroke-dasharray="5 6"/>
        <circle cx="${x2}" cy="${y}" r="92" fill="none" stroke="var(--svg-soft)" stroke-width="3" stroke-dasharray="5 6"/>
        <path id="belt" fill="var(--svg-soft)" fill-opacity=".35" stroke="var(--svg-line)" stroke-width="7" stroke-linejoin="round"/>
        <circle cx="${x1}" cy="${y}" r="24" class="metal"/><circle cx="${x2}" cy="${y}" r="24" class="metal"/>
        <g id="rollers"></g>
        <text x="${x1}" y="270" text-anchor="middle" font-weight="700">前普利盤(接引擎)</text>
        <text x="${x2}" y="270" text-anchor="middle" font-weight="700">後普利盤(接離合器)</text>
        <text x="${x1}" y="28" text-anchor="middle" font-size="12">普利珠(橘色)被甩出去</text>
        <text x="${x2}" y="28" text-anchor="middle" font-size="12">壓縮彈簧把皮帶壓回外圈</text>
      </svg>
      <div class="row spread mt"><strong>引擎轉速 / 車速</strong><span class="muted small">低 → 高</span></div>
      <input type="range" id="sp" min="0" max="100" value="0">
      <label class="row small" style="margin:6px 0"><input type="checkbox" id="worn"> 模擬「普利珠磨損變扁」</label>
      <div class="grid c3">
        <div class="card flat" style="margin:0"><div class="muted small">前盤皮帶半徑</div><strong id="r1"></strong></div>
        <div class="card flat" style="margin:0"><div class="muted small">後盤皮帶半徑</div><strong id="r2"></strong></div>
        <div class="card flat" style="margin:0"><div class="muted small">傳動比(引擎轉幾圈 : 後輪 1 圈)</div><strong id="ratio"></strong></div>
      </div>
      <div class="callout" id="cvtnote" style="margin-bottom:0"></div>` }));
    const q = (s) => host.querySelector(s);
    function draw() {
      const s = +q('#sp').value / 100, worn = q('#worn').checked;
      const r1 = 28 + (worn ? 34 : 52) * s, r2 = 108 - r1;
      const nx = (r1 - r2) / d, ny = Math.sqrt(1 - nx * nx);
      const pu = (cx, r) => [cx + r * nx, y - r * ny], pl = (cx, r) => [cx + r * nx, y + r * ny];
      const [a1, b1] = pu(x1, r1), [a2, b2] = pu(x2, r2), [c2, d2] = pl(x2, r2), [c1, e1] = pl(x1, r1);
      const wrapR = 2 * Math.acos(nx), large2 = wrapR > Math.PI ? 1 : 0, large1 = 2 * Math.PI - wrapR > Math.PI ? 1 : 0;
      q('#belt').setAttribute('d', `M${a1} ${b1} L${a2} ${b2} A${r2} ${r2} 0 ${large2} 1 ${c2} ${d2} L${c1} ${e1} A${r1} ${r1} 0 ${large1} 1 ${a1} ${b1} Z`);
      const rr = q('#rollers'); rr.innerHTML = '';
      const rd = 12 + (worn ? 14 : 24) * s;
      for (let i = 0; i < 3; i++) {
        const ang = rad(i * 120 + 30);
        const c = document.createElementNS('http://www.w3.org/2000/svg', 'circle');
        set(c, { cx: x1 + rd * Math.cos(ang), cy: y + rd * Math.sin(ang), r: worn ? 5 : 7, fill: '#ff8c1e', stroke: '#7a3a00', 'stroke-width': 1.5 });
        rr.append(c);
      }
      q('#r1').textContent = Math.round(r1) + ' (示意)';
      q('#r2').textContent = Math.round(r2) + ' (示意)';
      const ratio = r2 / r1;
      q('#ratio').textContent = ratio.toFixed(2) + ' : 1';
      q('#cvtnote').innerHTML = APP.rich(
        s < 0.15 ? '**起步/低速**:前盤皮帶圈小、後盤大 → 傳動比大,像腳踏車的「小檔位」,力量大、速度慢。'
          : s > 0.85 ? (worn ? '**磨損的普利珠推不動前盤**,皮帶推不到最外圈 → 傳動比降不下來 → **轉速偏高、車速上不去**。這就是為什麼普利珠磨損時「加速悶、轉速高」。' : '**高速**:前盤皮帶圈大、後盤小 → 傳動比小,像「大檔位」,引擎轉速不用太高就能跑得快。')
            : '**加速中**:轉速上升,普利珠被甩出,前盤合攏,皮帶被推向外圈,傳動比連續變小(沒有檔位,是無段的)。');
    }
    q('#sp').oninput = draw; q('#worn').onchange = draw;
    draw();
  };

  /* ================= 電動車能量流 ================= */
  W.evflow = function (host) {
    const box = (x, y, w, t, sub, id) => `<g id="${id}"><rect class="body" x="${x}" y="${y}" width="${w}" height="54" rx="9"/><text x="${x + w / 2}" y="${y + 24}" text-anchor="middle" font-weight="700">${t}</text><text x="${x + w / 2}" y="${y + 42}" text-anchor="middle" font-size="11">${sub}</text></g>`;
    host.append(h('div', { class: 'card flat', html: `
      <svg class="wsvg" viewBox="0 0 720 320" role="img" aria-label="電動機車能量流">
        ${box(20, 30, 120, '充電器', '市電 → 直流', 'b-chg')}
        ${box(200, 30, 150, '電池包 + BMS', '高壓、隨時帶電', 'b-bat')}
        ${box(410, 30, 140, '控制器', '直流 ⇄ 三相交流', 'b-ctl')}
        ${box(590, 30, 110, '油門 + 連動', '側柱/煞車', 'b-thr')}
        ${box(20, 200, 120, '12V 系統', '燈/儀表/控制', 'b-12')}
        ${box(200, 200, 150, 'DC-DC', '高壓 → 12V', 'b-dc')}
        ${box(410, 200, 140, '輪轂馬達', '含霍爾感知器', 'b-mot')}
        ${box(590, 200, 110, '後輪', '', 'b-whl')}
        <path id="l1" class="ln flow" d="M140 57 H200" visibility="hidden"/>
        <path id="l2" class="ln flow" d="M350 57 H410" visibility="hidden"/>
        <path id="l3" class="ln flow" d="M480 84 V200" visibility="hidden"/>
        <path id="l4" class="ln flow" d="M550 227 H590" visibility="hidden"/>
        <path id="l5" class="ln flow" d="M590 57 H550" visibility="hidden"/>
        <path id="l6" class="ln flow" d="M275 84 V200" visibility="hidden"/>
        <path id="l7" class="ln flow" d="M200 227 H140" visibility="hidden"/>
        <text x="360" y="300" text-anchor="middle" font-size="12">虛線流動方向 = 能量方向</text>
      </svg>
      <div class="row mt" id="modes"></div>
      <div class="callout key" id="evnote" style="margin-bottom:0"></div>` }));
    const q = (s) => host.querySelector(s);
    const modes = {
      standby: { t: '待機(Ready,沒轉油門)', lines: ['l6', 'l7'], rev: [], note: '電池經 **DC-DC** 降壓,供 12V 系統(儀表、燈、控制電路)使用。馬達沒有輸出。很多故障其實出在 **12V 側**。' },
      drive: { t: '加速行駛', lines: ['l2', 'l3', 'l4', 'l5', 'l6', 'l7'], rev: [], note: '油門訊號(須通過**側柱、煞車安全連動**)進入控制器,控制器把電池的直流電轉成三相交流電驅動馬達。' },
      regen: { t: '煞車回充', lines: ['l2', 'l3', 'l4', 'l6', 'l7'], rev: ['l2', 'l3', 'l4'], note: '減速時,後輪帶著馬達轉,**馬達變成發電機**,控制器把電送回電池。這就是「回充」,也是電動車煞車片比較耐用的原因。' },
      charge: { t: '充電中', lines: ['l1'], rev: [], note: '充電器把市電轉成直流給電池,**BMS** 控制充電電流並監控電芯。充電異常:先換插座、交叉測試充電器。' },
    };
    const mbox = q('#modes');
    function setMode(k) {
      ['l1', 'l2', 'l3', 'l4', 'l5', 'l6', 'l7'].forEach((id) => { const p = q('#' + id); p.setAttribute('visibility', 'hidden'); p.classList.remove('rev'); });
      modes[k].lines.forEach((id) => { const p = q('#' + id); p.setAttribute('visibility', 'visible'); if (modes[k].rev.includes(id)) p.classList.add('rev'); });
      q('#evnote').innerHTML = APP.rich(modes[k].note);
      mbox.querySelectorAll('button').forEach((b) => b.classList.toggle('primary', b.dataset.k === k));
    }
    Object.entries(modes).forEach(([k, m]) => mbox.append(h('button', { class: 'btn small', 'data-k': k, onclick: () => setMode(k) }, m.t)));
    setMode('standby');
  };

  /* ================= 發不動診斷樹 ================= */
  W.nostart = function (host) {
    const li = (head, ...kids) => h('li', null, h('div', { html: head }), kids.length ? h('ul', { class: 'tree' }, kids) : null);
    host.append(h('div', { class: 'card flat' },
      h('strong', null, '按下啟動鈕(或轉動電門),觀察:'),
      h('ul', { class: 'tree' },
        li('**A. 儀表完全不亮** → 電瓶端子、主保險絲、電門',
          li('量電瓶電壓:低於約 11 V → 電瓶虧電或老化;正常 → 查端子與保險絲、電門')),
        li('**B. 儀表亮,但按啟動鈕沒反應,或只有「喀」一聲** → 電源不夠或啟動電路',
          li('燈光變暗、電壓大跌 → 電瓶老化/虧電(試腳踏啟動)'),
          li('電壓正常 → 煞車開關/側柱開關、啟動繼電器、啟動馬達')),
        li('**C. 啟動馬達轉得有力,但不著火** → 看「油、氣、火」',
          li('開電門有沒有油泵預壓聲?**沒有** → 油泵保險絲、繼電器、油泵'),
          li('拔火星塞:**乾燥** → 沒油(油泵/噴油嘴/油路)'),
          li('拔火星塞:**濕且有汽油味** → 看有沒有火花;可能淹缸,擦乾/吹乾再試'),
          li('**沒有火花** → 火星塞、高壓帽、點火線圈、曲軸位置感知器、熄火開關'),
          li('油與火都有 → 再考慮壓縮、正時(進階)')),
        li('**D. 能發動,但一放油門就熄火** → 怠速與進氣',
          li('節氣門積碳、怠速控制、進氣漏氣、燃油壓力')))));
  };
})();
