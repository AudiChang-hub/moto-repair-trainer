/* 工具零件圖鑑:用實物照片認識每一樣東西 */
(function () {
  const { h } = APP;
  const GROUPS = [
    ['🔧 手工具', ['socket-ratchet', 'spanner', 'hex-key', 'screwdriver', 'torque-wrench', 'spark-plug-socket', 'pliers', 'oil-drain-pan']],
    ['📏 量具與儀器', ['multimeter', 'vernier-caliper', 'micrometer', 'feeler-gauge', 'spark-plug-gap-gauge', 'compression-gauge', 'tire-pressure-gauge', 'obd-scanner', 'battery-tester']],
    ['⚙️ 引擎、進排氣與點火', ['scooter', 'scooter-engine', 'piston', 'cylinder-head', 'crankshaft', 'spark-plug', 'ignition-coil', 'throttle-body', 'fuel-injector', 'air-filter', 'muffler', 'oil-filter']],
    ['🛞 傳動與底盤', ['cvt-belt', 'cvt-rollers', 'cvt-variator', 'clutch', 'brake-caliper', 'brake-pads', 'brake-disc', 'drum-brake', 'brake-fluid', 'tire-tread', 'front-fork', 'rear-shock']],
    ['🔌 電系', ['battery-12v', 'fuse', 'relay', 'regulator-rectifier', 'stator', 'starter-motor', 'bulb', 'connector']],
    ['🔋 電動機車與 Gogoro', ['ev-scooter', 'gogoro', 'gogoro-battery', 'li-ion-pack', 'hub-motor', 'ev-controller', 'ev-charger']],
  ];
  APP.views.gallery = function (main) {
    main.append(APP.head('camera', '工具零件圖鑑'), h('p', { class: 'muted', html: APP.rich('不知道某個工具或零件長什麼樣?這裡全是實物照片。**點照片可以放大**。教材、零件地圖、術語閃卡、題庫裡出現的名詞,也都會配上這裡的照片。') }));
    const inp = h('input', { type: 'search', placeholder: '搜尋:例如 火星塞、卡尺、皮帶', style: { width: '100%', padding: '11px 14px', fontSize: '1rem', border: '1.5px solid var(--border)', borderRadius: '10px', background: 'var(--card)', color: 'var(--text)', marginBottom: '8px' } });
    const box = h('div');
    main.append(inp, box);
    function render() {
      box.innerHTML = '';
      const k = inp.value.trim();
      let total = 0;
      GROUPS.forEach(([title, ids]) => {
        const items = ids.filter((id) => APP.hasPhoto(id)).filter((id) => { const p = APP.data.photos[id]; return !k || (p.zh + p.caption).includes(k); });
        if (!items.length) return;
        total += items.length;
        box.append(h('h2', null, title), h('div', { class: 'photo-grid' }, items.map((id) => APP.photo(id))));
      });
      if (!total) box.append(h('p', { class: 'muted' }, Object.keys(APP.data.photos).length ? '沒有符合的照片。' : '照片還沒有放進來。'));
    }
    inp.oninput = render; render();
    main.append(h('p', { class: 'muted small' }, '照片取自 Wikimedia Commons,各自依作者指定的自由授權(公有領域、CC BY、CC BY-SA 等)使用;作者與授權標示在每張照片下方,點授權可前往原始頁面。'));
  };
})();
