/* 各處「名詞 → 照片 id」對照。照片實際存在才會顯示(沒找到合格照片的項目會自動略過)。 */
(function () {
  const D = APP.data;
  // 零件地圖 part.id → photo id
  D.partPhoto = {
    headlight: 'bulb', fork: 'front-fork', fbrake: 'brake-caliper', ftire: 'tire-tread', rtire: 'tire-tread', rshock: 'rear-shock',
    fusebox: 'fuse', aux12: 'battery-12v', engine: 'scooter-engine', plug: 'spark-plug', throttle: 'throttle-body', airfilter: 'air-filter',
    cvt: 'cvt-variator', exhaust: 'muffler', regulator: 'regulator-rectifier', hvpack: 'li-ion-pack', controller: 'ev-controller',
    hubmotor: 'hub-motor', chargeport: 'ev-charger',
  };
  // 術語 glossary.id → photo id
  D.glossPhoto = {
    piston: 'piston', plug: 'spark-plug', coil: 'ignition-coil', throttle: 'throttle-body', injector: 'fuel-injector', airfilter: 'air-filter',
    crank: 'crankshaft', valve: 'cylinder-head', cylinder: 'cylinder-head', roller: 'cvt-rollers', pulley: 'cvt-variator', cvt: 'cvt-variator',
    clutch: 'clutch', belt: 'cvt-belt', pad: 'brake-pads', disc: 'brake-disc', caliper: 'brake-caliper', brakefluid: 'brake-fluid',
    fork: 'front-fork', tirepress: 'tire-pressure-gauge', twi: 'tire-tread', fuse: 'fuse', relay: 'relay', multimeter: 'multimeter',
    regulator: 'regulator-rectifier', stator: 'stator', compression: 'compression-gauge', feeler: 'feeler-gauge', torque: 'torque-wrench',
    hubmotor: 'hub-motor', inverter: 'ev-controller', bms: 'li-ion-pack', oil: 'oil-filter',
  };
  // 流程備料的工具名稱關鍵字 → photo id(越前面越優先)
  D.toolPhoto = [
    ['火星塞專用套筒', 'spark-plug-socket'], ['扭力扳手', 'torque-wrench'], ['接油盤', 'oil-drain-pan'], ['厚薄規', 'feeler-gauge'],
    ['游標卡尺', 'vernier-caliper'], ['三用電表', 'multimeter'], ['六角扳手', 'hex-key'], ['套筒', 'socket-ratchet'], ['梅花', 'spanner'],
    ['起子', 'screwdriver'], ['缸壓', 'compression-gauge'], ['胎壓', 'tire-pressure-gauge'], ['來令片', 'brake-pads'], ['煞車油', 'brake-fluid'],
    ['電瓶', 'battery-12v'], ['新火星塞', 'spark-plug'], ['保險絲', 'fuse'],
  ];
  D.toolPhotoId = (name) => { const m = D.toolPhoto.find(([k]) => name.includes(k)); return m && APP.hasPhoto(m[1]) ? m[1] : null; };
})();
