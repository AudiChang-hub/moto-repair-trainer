/* 14 天上手計畫。task.k: lesson / sc / proc / lab / visual / cards / mistakes / parts / exam / real(手動勾選) */
(function () {
  const L = (id) => ({ k: 'lesson', id });
  const S = (id) => ({ k: 'sc', id });
  const Pr = (id) => ({ k: 'proc', id });
  const Lb = (id) => ({ k: 'lab', id });
  const V = (id) => ({ k: 'visual', id });
  const R = (label) => ({ k: 'real', label });
  APP.data.plan = [
    { day: 1, title: '安全與工具', tasks: [L('safety-basics'), L('tools-units'), { k: 'cards' }, R('整理手邊工具並拍照,認識套筒、扳手、扭力扳手各自長什麼樣')] },
    { day: 2, title: '看懂機車全貌', tasks: [L('big-picture'), L('four-stroke'), V('fourstroke'), { k: 'parts' }] },
    { day: 3, title: '噴射系統與機油', tasks: [L('fuel-injection'), Pr('oil-change'), { k: 'cards' }] },
    { day: 4, title: '傳動與火星塞', tasks: [L('cvt'), V('cvt'), Pr('spark-plug')] },
    { day: 5, title: '底盤與保養地圖', tasks: [L('brakes-tires'), L('maintenance-map'), Pr('brake-pads')] },
    { day: 6, title: '診斷入門', tasks: [L('diagnosis-method'), L('no-start'), S('sc-weak-battery'), S('sc-turn-signal')] },
    { day: 7, title: '複習日', tasks: [{ k: 'mistakes' }, { k: 'cards' }, L('symptoms'), S('sc-fuel-pump-fuse'), R('到車行(或找師傅)觀摩一次完整保養,對照本系統的「作業檢查表」')] },
    { day: 8, title: '電系基礎與電表', tasks: [L('electrical-basics'), L('multimeter-basics'), Lb('battery')] },
    { day: 9, title: '充電與線路', tasks: [L('charging-system'), L('wiring-faults'), Lb('fuse'), Lb('charging'), Pr('battery-swap')] },
    { day: 10, title: '傳動與進氣診斷', tasks: [S('sc-cvt-rollers'), S('sc-throttle-carbon'), Pr('cvt-service'), Lb('sensor')] },
    { day: 11, title: '煞車與充電診斷', tasks: [S('sc-brake-spongy'), S('sc-charging-regulator'), { k: 'mistakes' }] },
    { day: 12, title: '電動機車入門', tasks: [L('ev-architecture'), V('evflow'), L('ev-safety'), Pr('ev-power-down')] },
    { day: 13, title: '電動機車診斷', tasks: [L('ev-diagnosis'), S('sc-ev-sidestand'), S('sc-ev-range')] },
    { day: 14, title: '總驗收', tasks: [S('sc-ev-no-charge'), S('sc-ev-hall'), { k: 'exam' }, R('完成「走向實車」頁面的檢查清單,規劃你的第一次實車練習')] },
  ];
})();
