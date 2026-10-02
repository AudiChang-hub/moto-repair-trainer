/* 車款專區:SYM / SUZUKI / GOGORO(資料來自官方手冊與官方說明頁,逐項核對過原頁面) */
(function () {
  const { h } = APP;
  const L = (href, t) => h('a', { href, target: '_blank', rel: 'noopener' }, t);
  const table = (head, rows) => h('div', { class: 'table-wrap' }, h('table', null,
    h('thead', null, h('tr', null, head.map((x) => h('th', null, x)))),
    h('tbody', null, rows.map((r) => h('tr', null, r.map((c, i) => h('td', { html: APP.rich(c), style: i === 0 ? { fontWeight: 600, whiteSpace: 'nowrap' } : null })))))));

  const SPEC = [
    ['車型(手冊)', 'JET S / JET SR(FK12 系列,六/七期)', 'Swish 125(UG125DA,2024 年 11 月版手冊)'],
    ['排氣量 / 壓縮比', '124.6 cc / 10.8 : 1', '124 cc / 10.3 : 1(強制氣冷、噴射)'],
    ['怠速', '1,700 ±100 rpm(部分版本 1,750 ±200 rpm)', '1,500 ±100 rpm'],
    ['火星塞', 'CPR7EA-9 · 間隙 **0.8–0.9 mm**', 'NGK CPR7EA-9 · 間隙 **0.8–0.9 mm**'],
    ['火星塞鎖法', '手鎖到底,再用扳手加轉 1/2–3/4 圈', '(圈數/扭力請查該車手冊)'],
    ['機油規格', 'SAE (5-20)W-40 或 (5-20)W-50 · API SJ 以上', 'SAE 10W-40 · API SL(建議正廠噴射專用合成機油)'],
    ['機油容量', '換油 **0.8 L** · 全容量 1.0 L', '換油 **0.65 L** · 引擎分解 0.8 L'],
    ['齒輪油', 'SAE 10W-30 · 換油 **100 cc**(標準 110 cc)', 'SAE 10W/40 API SG 或 SAE 90 · 換油 **50 cc**(分解 60 cc)'],
    ['胎壓(冷胎)', '前 1.8 / 後 2.3 kgf/cm²', '前 1.75 / 後 2.0 kg/cm²(1 名與 2 名乘車相同)'],
    ['輪胎', '前 110/70-12 · 後 120/70-12', '前後 100/90-10'],
    ['電瓶', 'TTZ10S(部分七期版本 YTX7A-BS / GTX7A-BS)', 'YTX7A-BS 免保養 12V-6Ah'],
    ['煞車', '前碟 Ø226 / 後碟 Ø190(有 ABS 版本)', '前油壓碟、後機械鼓式(後桿游隙 15–25 mm)'],
    ['保險絲', '25A / 15A / 10A 多顆(依版本)', '起動繼電器 20A · 副保險絲 10A'],
  ];
  const SCHED = [
    ['空氣濾清器濾心', 'I', 'I,R', 'R', 'I,R', 'R', 'I,R'],
    ['火星塞', 'I', 'I,R', 'R', 'I,R', 'R', 'I,R'],
    ['機油', 'R', 'R', 'R', 'R', 'R', 'R'],
    ['最終傳動齒輪箱油', 'R', 'R', 'R', 'R', 'R', 'R'],
    ['驅動皮帶', 'I', 'I', '**R**', 'I', '**R**', 'I'],
    ['氣門間隙', '—', '—', 'I', '—', 'I', '—'],
    ['煞車(來令片/鼓)', 'I', 'I', 'I', 'I', 'I', 'I'],
    ['輪胎', 'I', 'I', 'I', 'I', 'I', 'I'],
  ];

  APP.views.brands = function (main) {
    main.append(h('h1', null, '🏷️ 車款專區:SYM · SUZUKI · GOGORO'),
      h('p', { class: 'muted' }, '你家主要做這三個牌子。這一頁的重點只有一個:**同樣是 125 速克達,不同牌子、不同車型,規格真的不一樣**。下面的數字是我從官方手冊「原頁面」實際查到的,拿來示範「查手冊」這個動作——這也正是丙級學科會考的「依廠牌、車型查閱修護手冊規格」。'));
    main.append(h('div', { class: 'callout warn' }, h('div', { class: 'ttl' }, '⚠️ 這些是「特定車型、特定年份」的資料'), h('p', null, '表中數字只代表手冊上標明的那一款(例如 JET S/JET SR 的 FK12 系列、Swish 125 的 UG125DA)。你店裡的車請**一律核對那台車的手冊**,尤其年份、期別(六期/七期)、ABS 版本不同,規格可能不同。')));

    main.append(h('h2', null, '① 同樣是 125 速克達,規格差在哪?'),
      table(['項目', 'SYM JET S / JET SR', 'SUZUKI Swish 125'], SPEC),
      h('div', { class: 'callout analogy' }, h('div', { class: 'ttl' }, '💡 看出什麼?'), h('ul', null,
        h('li', { html: APP.rich('**火星塞型號與間隙一樣**(CPR7EA-9、0.8–0.9 mm),但 **機油量差 0.15 L、齒輪油量差整整一倍(100 cc vs 50 cc)、胎壓也不同**。') }),
        h('li', null, '憑印象「125 就是加 0.8 L」會出事:SUZUKI 這款換油若照 0.8 L 加,會比手冊多出約 **150 cc**(0.8 L 是它「引擎分解」時的量)。'),
        h('li', null, '所以保養的第一步永遠是:**確認車型與年份 → 找對手冊 → 查規格**。'))));

    main.append(h('h2', null, '② SUZUKI Swish 125 官方保養週期表'),
      h('p', { class: 'muted small' }, '來源:台灣鈴木官網「Swish 125 使用手冊」(UG125DA,2024 年 11 月版)第 59 頁。**每 4,000 公里為計畫保養週期**;I = 檢查/清潔/調整/更換或潤滑,R = 更換,T = 鎖緊。以下只列重點項目。'),
      table(['保養項目', '1 個月 / 500 km', '6 個月 / 4,000', '12 個月 / 8,000', '18 個月 / 12,000', '24 個月 / 16,000', '30 個月 / 20,000'], SCHED),
      h('ul', { class: 'small' },
        h('li', { html: APP.rich('**煞車油**:檢查;**每 2 年或 16,000 km 更換**。煞車軟管、燃油軟管:**每 4 年更換**。') }),
        h('li', null, '手冊註記:此表是「最低要求」,在嚴苛條件(塞車、短程、多雨)下使用,要比表上更頻繁保養。'),
        h('li', null, '新車第一次齒輪油在 500 公里更換,之後每半年或 4,000 公里換一次(手冊第 53 頁)。')),
      h('div', { class: 'callout' }, h('div', { class: 'ttl' }, '🆚 跟 SYM 比'), h('p', { html: APP.rich('SYM 的 JET S/JET SR 手冊把「定期保養項目」另外放在「保養手冊(保養週期表)」,**要另外找那份**;使用說明書本身則提到儀表的**機油里程提醒(OIL CHECK)約每累計 1,000 公里亮燈**,提醒補充或更換機油,換完要在儀表上重設。') })));

    main.append(h('h2', null, '③ GOGORO:你家車行可以做什麼?'),
      h('div', { class: 'callout key' }, h('div', { class: 'ttl' }, '📌 官方說法(Gogoro 線上支援中心)'), h('ul', null,
        h('li', { html: APP.rich('一般機車行**只要掛有「Gogoro 特約推廣站」旗幟**,就提供 Gogoro 基本維修保養服務。') }),
        h('li', { html: APP.rich('**Gogoro 1、S1 系列**因車款設計,官方仍建議回 **Gogoro 服務中心**維修保養。') }),
        h('li', null, '另有官方資料指出:簡單耗材(例如來令片、輪胎)可在一般車行更換;保養與電系、動力系統的維修,建議回直營或授權服務中心。(說法會更新,實際範圍請直接向 Gogoro 確認。)'))),
      h('p', { html: APP.rich('**特約推廣站是什麼?** 依 2021 年媒體報導,登記為「**機車修理業**」或「機車零售業」的公司都可申請,採「零簽約金、零加盟金、零庫存車」,可做新車展示銷售、電動機車保養維修、配件。報導**沒有說明是否需要受訓或認證**——這點請直接問 Gogoro。授權服務中心的技師則需接受與直營相同的訓練並通過考試才能服務。') }),
      h('div', { class: 'photo-row' }, ['gogoro', 'gogoro-battery'].map((id) => APP.photo(id)).filter(Boolean)),
      h('p', { class: 'muted small' }, '電池規格(媒體整理,非維修手冊):第 1、2 代電池約 43.2 V、1,374 Wh、9.8 kg;第 3 代約 43.56 V、1,740 Wh、10.2 kg。電壓低於 60 V,但**電池短路電流仍很大**,安全規則不變。'),
      h('div', { class: 'callout' }, h('div', { class: 'ttl' }, '🧭 給你們店的建議分工(請向 Gogoro 確認範圍)'), h('ul', null,
        h('li', null, '**可以練、可以接**:輪胎、煞車(來令片、煞車油)、懸吊、燈具、外觀件、12V 低壓周邊 — 這些跟燃油車通用,本系統的「煞車演練」「輪胎」「電表實驗室」都用得上。'),
        h('li', null, '**不要自己碰**:電池包、控制器、馬達內部、高壓線束 — 看到故障碼先記下來,轉交服務中心。'),
        h('li', null, '先把「**斷電安全程序**」(流程演練)與「**電動機車診斷**」那兩章學扎實,再去申請特約推廣站。'))),
      h('p', null, h('a', { class: 'btn', href: '#/learn/ev-safety' }, '電動機車安全作業'), ' ', h('a', { class: 'btn', href: '#/proc/ev-power-down' }, '斷電安全程序演練'), ' ', h('a', { class: 'btn', href: '#/diagnose/sc-ev-sidestand' }, '電動車診斷案例')));

    main.append(h('h2', null, '④ 手冊去哪裡拿?'),
      h('ul', null,
        h('li', null, h('strong', null, 'SYM:'), ' 官網各車款有「使用說明書」PDF,例如 ', L('https://tw.sym-global.com/storage/system/product/125cc-150cc/jets/JETs-manual.pdf', 'JET S'), '、', L('https://tw.sym-global.com/storage/system/product/125cc-150cc/jetsr/1130329-SR-manual.pdf', 'JET SR'), ';另有 ', L('https://tw.sym-global.com/storage/system/servicearea/maintenance/2018-01-maintenance.pdf', '車主保養手冊'), '。部分舊車型的修護手冊曾公開在 SYM 日本站(sym-jp.com),不保證有你的車型;正式維修資料請向總代理、SBC 店或經銷商取得。'),
        h('li', null, h('strong', null, 'SUZUKI:'), ' ', L('https://www.suzukimotor.com.tw/download_manual.html', '台灣鈴木官網「使用手冊下載」'), '有 NEX 125、Swish 125 等車型的使用手冊。維修手冊/零件手冊請洽台鈴代理商。'),
        h('li', null, h('strong', null, 'GOGORO:'), ' ', L('https://support.gogoro.com/tw/faq/collections/4416252308844026/articles/115008275247/', 'Gogoro 線上支援中心:一般機車行可以保養嗎?'), ' · ', L('https://speed.ettoday.net/news/2054174', '特約推廣站計畫報導(2021)'))),
      h('p', { class: 'muted small' }, '提醒:網路上流傳的「分享版」維修手冊來源不明、版本不一定對。查扭力與規格時,請以原廠或代理商提供的為準。'));

    main.append(h('h2', null, '⑤ 查手冊小測驗'), h('p', { class: 'muted' }, '用上面查到的資料出的 6 題,練習「找對車型、找對數字」。'));
    const qbox = h('div', { class: 'card' });
    main.append(qbox, h('div', { class: 'row mb' }, h('a', { class: 'btn', href: '#/cert' }, '🎓 考照練習'), h('a', { class: 'btn', href: '#/proc/oil-change' }, '機油更換流程演練')));
    const Q = [
      { q: 'SUZUKI Swish 125(UG125DA)換機油(不拆引擎)要加多少?', options: ['0.65 L', '0.8 L', '1.0 L', '0.5 L'], a: 0, why: '手冊:機油交換時 650 cc,引擎分解時 800 cc。0.8 L 是 SYM JET S 的換油量,不能混用。' },
      { q: 'SYM JET S / JET SR 的火星塞電極間隙是?', options: ['0.6–0.7 mm', '0.8–0.9 mm', '1.0–1.1 mm', '依經驗調整'], a: 1, why: '手冊(第 23 頁):將電極間隙調整到 0.8–0.9 mm,用厚薄規測定;裝上時手鎖到底再加轉 1/2–3/4 圈。' },
      { q: 'Swish 125 換齒輪油要加多少?', options: ['約 50 cc', '約 100 cc', '約 650 cc', '加到滿出來即可,不用量'], a: 0, why: '手冊:更換容量 50 cc(分解 60 cc),從注油孔加到與孔下緣平。SYM JET S 則是 100 cc,差一倍。' },
      { q: 'SYM JET S 的標準胎壓(冷胎)?', options: ['前 1.75 / 後 2.0', '前 1.8 / 後 2.3 kgf/cm²', '前後都 2.5', '前 2.0 / 後 2.0'], a: 1, why: '規格表:前輪 1.8、後輪 2.3 kgf/cm²。前 1.75 / 後 2.0 是 Swish 125。' },
      { q: 'Swish 125 的「驅動皮帶」依官方保養表,第一次「更換」是在?', options: ['500 km', '4,000 km', '8,000 km(12 個月)', '20,000 km'], a: 2, why: '保養表:驅動皮帶在 500、4,000 km 是檢查(I),8,000 km / 12 個月是更換(R),16,000 km / 24 個月再換。' },
      { q: '一般機車行要提供 Gogoro 基本維修保養,依官方說明需要?', options: ['掛有「Gogoro 特約推廣站」旗幟', '只要會修電動車就可以', '要有汽車修護乙級證照', '不需要任何授權'], a: 0, why: '官方 FAQ:懸掛「Gogoro 特約推廣站」旗幟的一般機車行提供基本維修保養。Gogoro 1、S1 系列仍建議回服務中心。' },
    ];
    APP.ui.quiz(qbox, Q, { src: '車款專區' });
    APP.boldify(main);
  };
})();
