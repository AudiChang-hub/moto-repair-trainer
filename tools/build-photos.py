"""把挑好的照片與授權資料整理進專案。
用法: python tools/build-photos.py <放照片與 meta_*.json 的資料夾>
- 只收授權白名單內的照片(公有領域 / CC0 / CC BY / CC BY-SA)
- 照片縮成寬 640px 以內的 JPEG,存到 assets/photos/
- 產生 js/data/photos.js(APP.data.photos)
"""
import glob, json, os, re, shutil, sys
from PIL import Image

src = sys.argv[1]
root = os.path.join(os.path.dirname(os.path.abspath(__file__)), '..')
out_dir = os.path.join(root, 'assets', 'photos')
os.makedirs(out_dir, exist_ok=True)

OK = re.compile(r'^(public domain|pd\b|cc0|cc[- ]by(-sa)?\b|no restrictions)', re.I)
BAD = re.compile(r'(-nc|-nd|\bnc\b|\bnd\b|gfdl|fair use)', re.I)

photos, rejected = {}, []
for f in sorted(glob.glob(os.path.join(src, 'meta_*.json'))):
    for m in json.load(open(f, encoding='utf-8')):
        lic = (m.get('license') or '').strip()
        img = os.path.join(src, m['file'])
        if not os.path.exists(img):
            rejected.append((m['id'], '檔案不存在')); continue
        if not OK.match(lic) or BAD.search(lic):
            rejected.append((m['id'], '授權不在白名單: ' + lic)); continue
        im = Image.open(img).convert('RGB')
        if im.width > 640:
            im = im.resize((640, int(im.height * 640 / im.width)), Image.LANCZOS)
        im.save(os.path.join(out_dir, m['id'] + '.jpg'), quality=82, optimize=True)
        photos[m['id']] = dict(
            zh=m['zh'], file=m['id'] + '.jpg', caption=m.get('caption', ''), author=(m.get('author') or '作者不詳').strip(),
            license=lic, license_url=m.get('license_url', ''), page=m['page'], title=m.get('title', ''))

# 本站自製圖(例如找不到自由授權照片時的示意圖),檔案已放在 assets/photos/
extra = os.path.join(root, 'tools', 'photo-extra.json')
if os.path.exists(extra):
    for m in json.load(open(extra, encoding='utf-8')):
        if m['id'] not in photos and os.path.exists(os.path.join(out_dir, m['file'])):
            photos[m['id']] = {k: m.get(k, '') for k in ('zh', 'file', 'caption', 'author', 'license', 'license_url', 'page', 'q')}

with open(os.path.join(root, 'js', 'data', 'photos.js'), 'w', encoding='utf-8') as fh:
    fh.write('/* 照片資料(由 tools/build-photos.py 產生,請勿手改)。圖片取自 Wikimedia Commons,授權資訊逐張記錄。 */\n')
    fh.write('APP.data.photos = ' + json.dumps(photos, ensure_ascii=False, indent=1) + ';\n')
print('收錄', len(photos), '張;拒收', len(rejected))
for r in rejected:
    print('  拒收', r)
