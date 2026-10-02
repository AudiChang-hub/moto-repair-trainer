// 產生 sw.js(離線快取清單)。新增/修改檔案後執行:  node tools/gen-sw.js
const fs = require('fs'), path = require('path');
const root = path.join(__dirname, '..');
const skip = new Set(['.git', 'tools', 'node_modules', '.claude']);
const files = [];
(function walk(dir) {
  for (const f of fs.readdirSync(dir, { withFileTypes: true })) {
    if (skip.has(f.name)) continue;
    const p = path.join(dir, f.name);
    if (f.isDirectory()) walk(p);
    else if (!/^(sw\.js|README\.md|check\.js|\.gitignore|icon\.ico)$/.test(f.name)) files.push(path.relative(root, p).split(path.sep).join('/'));
  }
})(root);
files.sort();
const ver = new Date().toISOString().slice(0, 16).replace(/[-:T]/g, '');
// 版本號給畫面顯示用(左下角),方便確認手機/電腦拿到的是不是最新版
const tw = new Date(Date.now() + 8 * 3600e3).toISOString().slice(0, 16).replace('T', ' ');
fs.writeFileSync(path.join(root, 'js', 'version.js'), `APP.version = '${tw}';
`);
const out = `/* 自動產生:node tools/gen-sw.js ——請勿手改 */
const CACHE = 'moto-trainer-${ver}';
const FILES = ${JSON.stringify(['./'].concat(files), null, 1)};
self.addEventListener('install', (e) => {
  // cache:'reload' = 一定向伺服器拿新檔,不用瀏覽器暫存的舊檔
  e.waitUntil(caches.open(CACHE).then((c) => c.addAll(FILES.map((f) => new Request(f, { cache: 'reload' })))).then(() => self.skipWaiting()));
});
self.addEventListener('activate', (e) => {
  e.waitUntil(caches.keys().then((ks) => Promise.all(ks.filter((k) => k !== CACHE).map((k) => caches.delete(k)))).then(() => self.clients.claim()));
});
// 網路優先:上網時每次都向伺服器確認(no-cache),離線時才用快取
self.addEventListener('fetch', (e) => {
  if (e.request.method !== 'GET' || new URL(e.request.url).origin !== location.origin) return;
  e.respondWith(fetch(e.request, { cache: 'no-cache' }).then((r) => { const cp = r.clone(); caches.open(CACHE).then((c) => c.put(e.request, cp)); return r; }).catch(() => caches.match(e.request, { ignoreSearch: true })));
});
`;
fs.writeFileSync(path.join(root, 'sw.js'), out);
console.log('sw.js 已產生,共', files.length + 1, '個檔案,版本', ver);
