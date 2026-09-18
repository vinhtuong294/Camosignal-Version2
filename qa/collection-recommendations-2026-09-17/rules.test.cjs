const {readFileSync} = require('node:fs');
const {test} = require('node:test');
const assert = require('node:assert/strict');
const vm = require('node:vm');
const source = readFileSync('sections/collection-recommendations.liquid', 'utf8');
const runtime = source.split('{% javascript %}')[1].split('{% endjavascript %}')[0];
const context = {HTMLElement: class {}, customElements: {get: () => true}, Map, Set};
vm.createContext(context);
vm.runInContext(runtime.replace("  if (!customElements.get", "  globalThis.selectProducts = selectProducts; globalThis.score = score;\n  if (!customElements.get"), context);
const keys = ['hats','beanie-embroidery-hat','game-day-jersey','youth-tees','pocket-tee','curated-sets','uv-hoodies','fleece-hoodie','waterproof-jacket','long-sleeves','hoodies','sweatshirts','t-shirts'];
const classification = Object.fromEntries(keys.map(key => [key,key]));
function product(handle, category, extra={}) {return {handle, available:true, physical:true, tags:[], collections:[category], ...extra};}
function config(groups) {return {current:product('current','long-sleeves'), groups:groups.map(([key,quota])=>({key,quota})),classification,relatedCollections:groups.map(([key])=>key)};}
function pool(category,count=12) {return Array.from({length:count},(_,index)=>product(`${category}-${index}`,category));}
function counts(result) {return result.reduce((o,p)=>(o[p.group]=(o[p.group]||0)+1,o),{});}
const choose=(c,p,e=[])=>context.selectProducts(c,new Map(Object.entries(p)),new Set(e));

const expected = {
 't-shirts':'long-sleeves:4,hoodies:4',
 'pocket-tee':'long-sleeves:4,hoodies:4',
 'game-day-jersey':'long-sleeves:4,hoodies:4',
 'long-sleeves':'hoodies:4,t-shirts:2,pocket-tee:2',
 'hoodies':'long-sleeves:4,t-shirts:2,pocket-tee:2',
 'sweatshirts':'hoodies:4,long-sleeves:4',
 'youth-tees':'hoodies:4,t-shirts:2,pocket-tee:2',
 'fleece-hoodie':'curated-sets:4,uv-hoodies:4',
 'curated-sets':'uv-hoodies:4,waterproof-jacket:4',
 'uv-hoodies':'curated-sets:4,waterproof-jacket:4',
 'waterproof-jacket':'curated-sets:4,fleece-hoodie:4',
 'hats':'curated-sets:4,fleece-hoodie:4',
 'beanie-embroidery-hat':'curated-sets:4,fleece-hoodie:4'
};
test('All approved source rules select exactly eight with the agreed quotas',()=>{
 const actual={};
 for(const match of source.matchAll(/when ([^\n]+)\s+assign allocation = '([^']+)'/g)) {
   for(const key of match[1].matchAll(/'([^']+)'/g)) actual[key[1]]=match[2];
 }
 assert.deepEqual(actual,expected);
 for(const allocation of Object.values(actual)) {
   const groups=allocation.split(',').map(v=>{const [key,q]=v.split(':');return [key,Number(q)];});
   const result=choose(config(groups),Object.fromEntries(groups.map(([key])=>[key,pool(key)])));
   assert.equal(result.length,8);assert.deepEqual(counts(result),Object.fromEntries(groups));
 }
});
test('Regular T-shirts exclude overlapping Pocket, Jersey, Youth; product type is ignored',()=>{
 const c=config([['hoodies',4],['t-shirts',2],['pocket-tee',2]]);
 const pocket=product('pocket','pocket-tee',{collections:['t-shirts','pocket-tee'],type:'Hoodie'});
 const result=choose(c,{'hoodies':pool('hoodies'),'t-shirts':[pocket,product('jersey','game-day-jersey',{collections:['t-shirts','game-day-jersey']}),product('youth','youth-tees',{collections:['t-shirts','youth-tees']}),...pool('t-shirts')],'pocket-tee':[pocket,...pool('pocket-tee')]});
 assert.deepEqual(counts(result),{'hoodies':4,'t-shirts':2,'pocket-tee':2});
 assert.equal(result.find(p=>p.handle==='pocket').group,'pocket-tee');
 assert.ok(!result.some(p=>['jersey','youth'].includes(p.handle)));
});
test('Design wins over theme, theme wins over default collection order',()=>{
 const c=config([['hoodies',4],['t-shirts',4]]);
 c.current.tags=['design:One-Breath-Away'];c.current.collections.push('deer-camo');
 const plain=pool('hoodies');
 plain.push(product('theme','hoodies',{collections:['hoodies','deer-camo']}));
 plain.push(product('design','hoodies',{tags:['design:one-breath-away']}));
 const selected=choose(c,{hoodies:plain,'t-shirts':pool('t-shirts')}).filter(p=>p.group==='hoodies');
 assert.equal(selected[0].handle,'design');assert.equal(selected[1].handle,'theme');
});
test('Exclude current, sold out, nonphysical, previous recommendations and duplicates',()=>{
 const c=config([['hoodies',4],['t-shirts',4]]);
 const entries=[product('current','hoodies'),product('sold','hoodies',{available:false}),product('digital','hoodies',{physical:false}),product('existing','hoodies'),...pool('hoodies')];
 const result=choose(c,{'hoodies':entries.concat(entries),'t-shirts':pool('t-shirts')},['existing']);
 assert.equal(result.length,8);assert.equal(new Set(result.map(p=>p.handle)).size,8);
 assert.ok(!result.some(p=>['current','sold','digital','existing'].includes(p.handle)));
});
test('Shortages fill only within permitted collections; never invent missing products',()=>{
 const c=config([['hoodies',4],['t-shirts',2],['pocket-tee',2]]);
 assert.deepEqual(counts(choose(c,{'hoodies':pool('hoodies'),'t-shirts':pool('t-shirts'),'pocket-tee':[]})),{'hoodies':6,'t-shirts':2});
 const limited=choose(c,{'hoodies':pool('hoodies',1),'t-shirts':pool('t-shirts',1),'pocket-tee':[]});
 assert.equal(limited.length,2);assert.equal(choose(c,{}).length,0);
});
test('Configured collection handles are honored',()=>{
 const c=config([['hoodies',4],['t-shirts',4]]);
 c.classification={...classification,hoodies:'custom-hoodies'};
 c.relatedCollections=['custom-hoodies','t-shirts'];
 const result=choose(c,{'hoodies':pool('custom-hoodies'),'t-shirts':pool('t-shirts')});
 assert.equal(result.filter(p=>p.group==='hoodies').length,4);
});
test('Collection intersection is mandatory, even for a matching design, and excludes all upper cards',()=>{
 const c=config([['hoodies',4],['t-shirts',2],['pocket-tee',2]]);
 c.relatedCollections=['deer','hunting'];
 c.current.tags=['design:one-breath-away'];
 const eligible=(category,theme)=>pool(category,12).map(p=>({...p,collections:[category,theme]}));
 const pools={hoodies:[product('same-design-wrong-collection','hoodies',{tags:['design:one-breath-away']}),...eligible('hoodies','deer')], 't-shirts':eligible('t-shirts','hunting'),'pocket-tee':eligible('pocket-tee','deer')};
 const above=Array.from({length:8},(_,i)=>`hoodies-${i}`);
 const result=choose(c,pools,above);
 assert.equal(result.length,8);
 assert.deepEqual(counts(result),{hoodies:4,'t-shirts':2,'pocket-tee':2});
 assert.ok(result.every(p=>p.collections.some(h=>c.relatedCollections.includes(h))));
 assert.ok(result.every(p=>!above.includes(p.handle)));
 assert.ok(!result.some(p=>p.handle==='same-design-wrong-collection'));
});
test('Collection shortages never fall back to unrelated products; no selected collection yields no cards',()=>{
 const c=config([['hoodies',4],['t-shirts',4]]);
 c.relatedCollections=['deer','hunting'];
 const pools={hoodies:[product('eligible','hoodies',{collections:['hoodies','deer']}),...pool('hoodies')],'t-shirts':pool('t-shirts')};
 assert.deepEqual(Array.from(choose(c,pools),p=>p.handle),['eligible']);
 c.relatedCollections=[];
 assert.equal(choose(c,pools).length,0);
 delete c.relatedCollections;
 assert.equal(choose(c,pools).length,0);
});
test('New section immediately follows existing recommendations on both product templates',()=>{
 for(const filename of ['product.json','product.pre-order.json']) {
   const raw=readFileSync(`templates/${filename}`,'utf8');const template=JSON.parse(raw.slice(raw.indexOf('{')));
   assert.equal(template.order.indexOf('collection-recommendations'),template.order.indexOf('product-recommendations')+1);
 }
});

test('Progresses through third and fourth collections, keeping quotas and earlier matches',()=>{
 const c=config([['hoodies',4],['t-shirts',2],['pocket-tee',2]]);
 c.relatedCollections=['smallest','second','third','fourth','largest'];
 c.current.tags=['design:matching'];
 const candidate=(handle,category,collection,extra={})=>product(handle,category,{collections:[category,collection],...extra});
 const hoodies=[candidate('later-design','hoodies','largest',{tags:['design:matching']}),candidate('upper','hoodies','smallest'),candidate('h1','hoodies','smallest'),candidate('h2','hoodies','second'),candidate('h3','hoodies','third'),candidate('h4','hoodies','fourth')];
 const result=choose(c,{hoodies:hoodies.concat(hoodies),'t-shirts':[candidate('t1','t-shirts','third'),candidate('t2','t-shirts','fourth')],'pocket-tee':[candidate('p1','pocket-tee','fourth'),candidate('p2','pocket-tee','fourth')]},['upper']);
 assert.deepEqual(counts(result),{hoodies:4,'t-shirts':2,'pocket-tee':2});
 assert.deepEqual(Array.from(result.filter(p=>p.group==='hoodies'),p=>p.handle),['h1','h2','h3','h4']);
 assert.equal(new Set(result.map(p=>p.handle)).size,8);
 assert.ok(!result.some(p=>['upper','later-design'].includes(p.handle)));
});
test('Stops selecting from broader collections when the smallest can fill all quotas',()=>{
 const c=config([['hoodies',4],['t-shirts',4]]);
 c.relatedCollections=['smallest','broader'];
 c.current.tags=['design:matching'];
 const candidates=category=>[product(`${category}-broad`,category,{collections:[category,'broader'],tags:['design:matching']}),...pool(category,4).map(p=>({...p,collections:[category,'smallest']}))];
 const result=choose(c,{hoodies:candidates('hoodies'),'t-shirts':candidates('t-shirts')});
 assert.equal(result.length,8);
 assert.ok(result.every(p=>p.collections.includes('smallest')));
});
test('Quota shortage searches broader collections before borrowing; final borrowing favors smaller collections',()=>{
 const c=config([['hoodies',4],['t-shirts',2],['pocket-tee',2]]);
 c.relatedCollections=['smallest','broader'];
 const candidates=(category,collection,count)=>pool(category,count).map(p=>({...p,collections:[category,collection]}));
 const pools={hoodies:candidates('hoodies','broader',8),'t-shirts':candidates('t-shirts','smallest',6),'pocket-tee':candidates('pocket-tee','broader',2)};
 assert.deepEqual(counts(choose(c,pools)),{hoodies:4,'t-shirts':2,'pocket-tee':2});
 pools['pocket-tee']=[];
 assert.deepEqual(counts(choose(c,pools)),{hoodies:4,'t-shirts':4});
});
