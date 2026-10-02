const fs=require('fs'),path=require('path');
const root=require('path').join(__dirname,'js','data')+'/';
global.window=global; global.APP={data:{}};
for(const f of ['lessons','scenarios','procedures','labs','glossary','parts','plan']) eval(fs.readFileSync(root+f+'.js','utf8'));
const D=APP.data; let errs=[];
const err=m=>errs.push(m);
// lessons
const widgets=['fourstroke','cvt','evflow','nostart'];
const lessonIds=new Set(D.lessons.map(l=>l.id));
D.lessons.forEach(l=>{
  if(!D.stages[l.stage]) err('lesson stage '+l.id);
  l.quiz.forEach((q,i)=>{ if(q.a<0||q.a>=q.options.length) err(`quiz ${l.id}#${i} a out of range`); if(new Set(q.options).size!==q.options.length) err(`quiz dup options ${l.id}#${i}`);});
  l.blocks.forEach(b=>{ if(b.t==='widget'&&!widgets.includes(b.id)) err('widget '+b.id); if(b.t==='link'){ const m=b.to.match(/#\/(\w+)\/?(.*)/); if(m&&m[2]){ if(m[1]==='proc'&&!D.procedures.find(p=>p.id===m[2])) err('link proc '+m[2]); if(m[1]==='lab'&&!D.labs.find(p=>p.id===m[2])) err('link lab '+m[2]); } } });
});
// scenarios
const sids=new Set();
D.scenarios.forEach(s=>{
  if(sids.has(s.id)) err('dup sc '+s.id); sids.add(s.id);
  const ids=s.tests.map(t=>t.id); if(new Set(ids).size!==ids.length) err('dup test id in '+s.id);
  if(!s.causes.find(c=>c.id===s.answer)) err('answer missing '+s.id);
  if(s.fixes.filter(f=>f.ok).length!==1) err('fix ok count '+s.id);
  s.fixes.filter(f=>!f.ok).forEach(f=>{ if(!f.why) err('fix why missing '+s.id+' '+f.id)});
  const keys=s.tests.filter(t=>t.v==='key').length; if(keys<3) err('few keys '+s.id);
  s.tests.forEach(t=>{ if(!['key','ok','waste','bad'].includes(t.v)) err('bad v '+s.id+' '+t.id); if(!['問診','觀察','基本檢查','量測','進階檢查'].includes(t.g)) err('bad group '+s.id+' '+t.id+' '+t.g);});
  if(s.hints.length<2) err('hints '+s.id);
  console.log(s.id.padEnd(24), 'tests',s.tests.length,'key',keys,'expertMin',s.tests.filter(t=>t.v==='key').reduce((a,t)=>a+t.t,0),'bad',s.tests.filter(t=>t.v==='bad').length);
});
// procs
D.procedures.forEach(p=>{
  p.steps.forEach((s,i)=>{ const n=s.options.filter(o=>o.ok).length; if(n!==1) err(`proc ${p.id} step ${i} ok=${n}`); if(!s.sop) err(`sop ${p.id} ${i}`); s.options.forEach(o=>{ if(!o.why) err(`why ${p.id} ${i}`)}); });
  if(!p.prep.tools.some(t=>t.need)||!p.prep.tools.some(t=>!t.need)) err('prep mix '+p.id);
});
// labs: simulate every state/cond to detect exceptions & show readings
D.labs.forEach(l=>{
  l.states.forEach(s=>{ l.conds.forEach(c=>{ const pot=l.dc(s.id,c,50); Object.keys(l.points).forEach(pt=>{ if(!(pt in pot)) err(`lab ${l.id} ${s.id} ${c.id} missing pot ${pt}`)}); l.ac(s.id,c,50); Object.keys(l.points).forEach(a=>Object.keys(l.points).forEach(b=>l.res(s.id,a,b))); });});
  const svgPts=[...l.svg.matchAll(/data-pt="(\w+)"/g)].map(m=>m[1]); Object.keys(l.points).forEach(p=>{ if(!svgPts.includes(p)) err(`lab ${l.id} point ${p} not in svg`)});
});
// plan
D.plan.forEach(d=>d.tasks.forEach(t=>{ if(t.k==='lesson'&&!lessonIds.has(t.id)) err('plan lesson '+t.id); if(t.k==='sc'&&!sids.has(t.id)) err('plan sc '+t.id); if(t.k==='proc'&&!D.procedures.find(p=>p.id===t.id)) err('plan proc '+t.id); if(t.k==='lab'&&!D.labs.find(p=>p.id===t.id)) err('plan lab '+t.id); if(t.k==='visual'&&!widgets.includes(t.id)) err('plan visual '+t.id);}));
console.log('lessons',D.lessons.length,'quiz Qs',D.lessons.reduce((a,l)=>a+l.quiz.length,0),'scenarios',D.scenarios.length,'procs',D.procedures.length,'labs',D.labs.length,'glossary',D.glossary.length,'parts',D.parts.length);
// 考照題庫
const fsx=require('fs');
for (const lv of ['c','b']) {
  const f=path.join(__dirname,'js','data','bank-'+lv+'.js');
  if(!fsx.existsSync(f)) { err('missing bank-'+lv); continue; }
  delete global.window; global.window=global; eval(fsx.readFileSync(f,'utf8'));
  const B=global['BANK_'+lv.toUpperCase()]; const ids=new Set();
  B.q.forEach(q=>{ if(ids.has(q.id)) err('dup '+q.id); ids.add(q.id);
    if(!/^[1-4]{1,4}$/.test(String(q.ans))) err('ans '+q.id);
    if(!(q.opts.length===4||q.optsInFig)) err('opts '+q.id);
    if(!q.stem||!q.exp) err('text '+q.id);
    (q.imgs||[]).forEach(i=>{ if(!fsx.existsSync(path.join(__dirname,'assets','bank',lv,i))) err('img '+q.id+' '+i); }); });
  B.sections.forEach(s=>{ if(!B.q.some(q=>q.sec===s.sec)) err('empty section '+lv+s.sec); });
  console.log('bank',lv,B.q.length,'題, 章',B.sections.length,', 複選',B.q.filter(q=>String(q.ans).length>1).length,', 圖題',B.q.filter(q=>q.imgs).length,', 解析待確認',B.q.filter(q=>q.u).length);
}
console.log(errs.length?('ERRORS:\n'+errs.join('\n')):'ALL CHECKS PASSED');
