'use strict';
(()=>{
const data=window.COURT_DATA, $=id=>document.getElementById(id), map=$('map'), ns='http://www.w3.org/2000/svg';
const byId=new Map(data.features.map(f=>[f.id,f])), names=new Map(data.venues);
const catalog=data.catalogMeta||{}, guide=window.COURT_GUIDE;
const linked=Object.entries(data.known).map(([id,x])=>({id,name:names.get(id),feature:x[0],district:x[1],count:x[2],source:x[3],note:x[4],children:x[5],address:catalog[id]?.address,quality:'已核对资料'}));
for(const [id,x] of Object.entries(catalog))if(x.match?.why.startsWith('名称')&&!data.known[id]){
 const f=byId.get(x.match.id);
 if(f)linked.push({id,name:names.get(id),feature:f.id,district:x.district||f.district,address:x.address,children:[],match:x.match,
 quality:'名称＋位置'});
}
const ways=(...ids)=>ids.map(x=>'way/'+x);
const projectVenues={
 '132':{ways:ways(239829633,239829655),source:'https://www.haizhu.gov.cn/hzdt/ztlm/tzhz/rjhj/lyjd/smgy/content/post_9093584.html',address:'海珠区工业大道中220号'},
 '313':{ways:ways(890068594,890068595),source:'https://www.jnu.edu.cn/2022/0829/c36421a714339/page.htm',address:'番禺区暨南大学番禺校区东区运动场'},
 '254':{ways:ways(493192524),source:'https://www.conghua.gov.cn/zwgk/zdlyxxgk/jghsf/djml/xxml/content/post_9973894.html'},
 '90':{ways:ways(495799318),source:'https://www.liannan.gov.cn/attachment/0/98/98693/1616925.pdf'},

 '66':{ways:ways(838140838),source:'https://www.lnhotels.com/brand_zgdjd/leisure/index/hotel_id/101.html'},
 '288':{ways:ways(296813488),source:'https://huodong.com/venue/detail/nfguvp'},
 '1':{ways:ways(188930228,188930229,188930230,188930231,188930232,188930233,188930234,188930235),source:'https://www.gdatzx.com/APP/Health/ArticleList.aspx?CID=40'},
 '46':{ways:ways(...Array.from({length:12},(_,i)=>1376908683+i)),source:'https://gh.scnu.edu.cn/a/20190617/1931.html'},
 '435':{ways:ways(216644258,216644263,216644265,216644264,216644257,216644266,216644259),source:'https://www.lw.gov.cn/ztzl/rdjyhzxtabl/content/post_10989108.html'},
 '111':{ways:ways(1289066089),source:'https://www.huadu.gov.cn/xxgk/yata/content/post_9917111.html'},
 '15':{ways:ways(331714922),source:'https://www2.scut.edu.cn/spe/cgss/list.htm'}
};
// The single containing polygon or unique near-edge shape is a layout candidate,
// never a statement about which courts can currently be booked.
const extraIds=['77','99','272','300','305'];
for(const id of extraIds)if(catalog[id]?.match?.meters<=5)
 projectVenues[id]={ways:[catalog[id].match.id]};
for(const [id,p] of Object.entries(projectVenues)){
 const [feature,...children]=p.ways.filter(s=>byId.get(s)?.pitch);
 if(feature&&names.has(id))linked.push({id,name:names.get(id),feature,children,district:catalog[id]?.district||byId.get(feature).district,address:p.address||catalog[id]?.address,source:p.source,provisional:true});
}
// Separately sourced additions: always identify the venue and its own footprints.
for(const entry of (window.COURT_PLAN_SUPPLEMENT||[])){
 const id=String(entry.id),base=linked.find(v=>v.id===id);
 if(!names.has(id)||base&&!entry.extend)continue;
 for(const f of entry.features||[])if(!byId.has(f.id)){byId.set(f.id,f);data.features.push(f);}
 const ids=[...new Set([...(base?[base.feature,...base.children]:[]),...(entry.ways||[])])]
   .filter(key=>byId.has(key));
 if(!ids.length)continue;
 const [feature,...children]=ids;
 const old=linked.findIndex(v=>v.id===id);
 const item={...base,id,name:names.get(id),feature,children,provisional:true,source:entry.source||base?.source,
  district:catalog[id]?.district||byId.get(feature).district,address:catalog[id]?.address||base?.address,
  isCampus:entry.isCampus||base?.isCampus,isResidential:entry.isResidential||base?.isResidential,note:entry.note||base?.note,count:entry.count||base?.count,
  quality:entry.quality||'场馆与轮廓匹配'};
 if(old>=0)linked[old]=item;else linked.push(item);
}
const osmMapVenues=(window.COURT_FACILITIES||[]).map(o=>({
 id:'osm:'+o.id,name:o.label+' · 网球场',feature:o.shapes[0],children:o.shapes.slice(1),
 district:o.district,source:'https://www.openstreetmap.org/'+o.id,
 mapFacility:true,isResidential:o.kind==='residential',isCampus:['school','university','college'].includes(o.kind),provisional:true
}));
linked.push(...osmMapVenues);
const contextRoster=window.COURT_CONTEXT_ROSTER||[];
for(const entry of contextRoster){
 const [feature,...children]=entry.features.map(f=>{byId.set(f.id,f);return f.id});
 if(!feature&&!entry.point&&!entry.source)continue;
 names.set(entry.id,entry.name);
 const old=linked.findIndex(v=>v.id===entry.id); const item={...entry,feature,children,provisional:true,contextVenue:!data.venues.some(([k])=>k===entry.id)}; if(old<0)linked.push(item);else linked[old]={...linked[old],...item};
}
for(const [id,item] of Object.entries(window.COURT_PREMIUM_PLANS||{})){
 const v=linked.find(v=>v.id===id);if(!v)continue;
 for(const f of item.features)byId.set(f.id,f);
 const keys=[...item.ways,...item.features.map(f=>f.id)];[v.feature,...v.children]=keys;
}
const contextOnly=v=>v?.id==='1371';
const setKey=v=>[v.feature,...v.children].sort().join('|');
const officialKeys=new Set(linked.filter(v=>!v.mapFacility).map(setKey));
const mapUnique=osmMapVenues.filter(v=>!officialKeys.has(setKey(v)));
const venueEntries=[...data.venues,...contextRoster.filter(v=>!data.venues.some(([id])=>id===v.id)).map(v=>[v.id,v.name]),...mapUnique.map(v=>[v.id,v.name])];
const preferred=[...guide.featured,'7','ctx-xingbai','ctx-zhujiang','ctx-coco','435','111','15','46','288','66','132','313','90','254'];
const priority=new Map(preferred.map((id,n)=>[id,n]));
const aliases={'ctx-xingbai':'星柏 广州大桥底 桥下 二沙','ctx-zhujiang':'空中 珠江街 天台 全民健身','ctx-coco':'星合聚 星河 COCO PARK 天台','1':'奥体 广东奥林匹克','2':'天体 天河网球','20':'二沙 宏城','85':'南沙国际网球中心 钧泰','46':'华师大学城','15':'华工北 华南理工','435':'芳体 芳村网球','111':'花都网球'};
const venueMap=new Map(linked.map(v=>[v.id,v]));
const pinById=new Map([].map(([id])=>[id,venueMap.get(id)?.feature?byId.get(venueMap.get(id).feature)?.c:(venueMap.get(id)?.point||catalog[id]?.point)]).filter(([id,p])=>p));
const groupOwners=new Map();
let typeFilter='';
const venueGuide=v=>guide.venues[v?.id]||{};
function types(v){
 const verified=venueGuide(v).types;if(verified)return verified;
 if(!v)return [];
 if(/室内/.test(v.name))return ['indoor'];
 if(/天台|顶楼|楼顶/.test(v.name))return ['roof'];
 if(/桥下|桥底/.test(v.name))return ['bridge'];
 return [];
}
function typeFor(v,f){return venueGuide(v).featureTypes?.[f?.id]||(types(v).length===1?types(v)[0]:'')}
function typeBadge(parent,type){const b=html('span',guide.labels[type],parent);b.className='court-type';b.dataset.type=type;return b}
for(const [id,label] of [['','全部'],...Object.entries(guide.labels)]){
 const b=html('button',label,$('courtTypes'));b.type='button';b.dataset.type=id;b.setAttribute('aria-pressed',String(!id));
 b.onclick=()=>{typeFilter=id;for(const el of $('courtTypes').children)el.setAttribute('aria-pressed',String(el===b));list()};
}
for(const v of [...mapUnique,...linked.filter(v=>!v.mapFacility)])if(v.feature)for(const id of [v.feature,...v.children])groupOwners.set(id,v);
const defaultBounds=combine(data.districts.map(d=>d.b));
const q=new URLSearchParams(location.search);
let district=data.districts.some(d=>d.n===q.get('district'))?q.get('district'):'', tab='plan', venue=null, selected=null, selectedSlot=null, box=null, camera=null, frame=0;
let cityReturn=null,target=null,layerKey=null, overlay=null, noClick=false, exploreDistrict=district, mapLayer=['shapes','density'].includes(q.get('layer'))?q.get('layer'):'venues';
let is3d=false,viewer3d,viewerPending,viewerFailed=false,landscapeOn=true,planPainter,planCache;
const {layoutFor,dims}=window.COURT_FIT, fitCache=new Map();
const knownGroupCount={'way/146688866':12,'way/334074698':7,'way/347798956':9,'way/1289066089':4,'way/331714922':4};
const aerialLink={
 '20':['查看宏城球场航拍原文','https://www.nfnews.com/content/xovK4PrnyJ.html'],
 '85':['查看南沙球场实拍原文','https://huacheng.gz-cmc.com/pages/2026/10/16/e1443e6a4180455a90b139fd056176c0.html']
};
const gallery={
 '7':[['shamian.jpg','沙面网球场 · 场边实拍 · 2016','PQ77wd','Shameen_Tennis_Ground.jpg','4.0',1280,720]],
 '20':[
  ['ersha.jpg','二沙岛周边实拍','钉钉','Guangzhou_Er_Sha_Island.jpg','4.0',1280,960],
  ['hongcheng-park.jpg','宏城公园入口望广州塔 · 2010','Kxx','Guangzhou_TV_&_Sightseeing_Tower.jpg','3.0',720,960]
 ],
 '1371':[['gba-sports.jpg','大湾区文化体育中心 · 园区航拍','Tim Wu','Aerial_View,_Greater_Bay_Area_Culture_and_Sports_Center_20250608-A.jpg','4.0',960,640]]
};

function layout(f){
 if(!fitCache.has(f.id))fitCache.set(f.id,layoutFor(f,knownGroupCount[f.id]));
 return fitCache.get(f.id);
}
const nearCache=new Map();
function nearbyPlans(v){
 if(!v?.id||!catalog[v.id]?.point||hasPlan(v))return [];
 if(nearCache.has(v.id))return nearCache.get(v.id);
 const [x,y]=catalog[v.id].point;
 const results=data.features.filter(f=>f.pitch&&(!v.district||f.district===v.district)&&!groupOwners.has(f.id))
 .map(f=>[f,Math.hypot(Math.max(f.b[0]-x,x-f.b[0]-f.b[2],0),Math.max(f.b[1]-y,y-f.b[1]-f.b[3],0))])
 .filter(([f,d])=>d<=95&&layout(f).length).sort((a,b)=>a[1]-b[1]).slice(0,5).map(([f])=>f);
 nearCache.set(v.id,results);return results;
}
function nearbyMap(v,fs){
 venue=v;selected=selectedSlot=null;tab='city';mapLayer='shapes';district=v.district||'';
 resetFocus();
 const pin=catalog[v.id]?.point;
 box=combine([...fs.map(f=>f.b),...(pin?[[pin[0]-120,pin[1]-90,240,180]]:[])]);
 render();
}
function allSlots(fs){
 return fs.flatMap(f=>layout(f).map((m,i)=>({f,m,i,type:typeFor(venue,f)})))
   .sort((a,b)=>a.f===b.f?a.i-b.i:a.f.b[1]-b.f.b[1]||a.f.b[0]-b.f.b[0]);
}
function zoomDistrict(n){cityReturn=null;exploreDistrict=district=n;tab='city';venue=selected=selectedSlot=null;resetFocus();render()}

function combine(bs){const xs=bs.map(b=>b[0]), ys=bs.map(b=>b[1]);return [Math.min(...xs),Math.min(...ys),Math.max(...bs.map(b=>b[0]+b[2]))-Math.min(...xs),Math.max(...bs.map(b=>b[1]+b[3]))-Math.min(...ys)]}
function fit(b,pad=1.15,min=45){const w=Math.max(min,b[2]*pad),h=Math.max(min,b[3]*pad),aspect=map.clientWidth/Math.max(1,map.clientHeight)||1; const u=Math.max(w,h*aspect),v=u/aspect;return [b[0]+(b[2]-u)/2,b[1]+(b[3]-v)/2,u,v]}
function el(tag,attrs={},text){const n=document.createElementNS(ns,tag);for(const [k,v] of Object.entries(attrs))n.setAttribute(k,v);if(text!==undefined)n.textContent=text;return n}
function html(tag,text,parent){const n=document.createElement(tag); n.textContent=text;parent.append(n);return n}
function href(parent,text,url){const n=html('a',text,parent);n.href=url;n.target='_blank';n.rel='noopener';return n}
function poly(p){return p.map(pg=>pg.map(r=>r.length?'M'+r.map(x=>x.join(',')).join('L')+'Z':'').join('')).join('')}
function currentDistrict(){return data.districts.find(d=>d.n===district)}
function venueFeatures(v){return v?.feature?[v.feature,...v.children].map(id=>byId.get(id)).filter(Boolean):[]}
function hasPlan(v){return venueFeatures(v).some(f=>layout(f).length>0)}
function currentEntities(){return tab==='plan'?(venue?.feature?venueFeatures(venue):selected?[selected]:[]):data.features.filter(f=>!district||f.district===district)}
function resetFocus(){const items=currentEntities();box=tab==='plan'&&items.length?combine(items.map(f=>f.b)):(currentDistrict()?.b||defaultBounds);camera=null;target=null;layerKey=null}
function remember(){try{const u=new URL(location.href);for(const [k,v] of Object.entries({district,view:is3d&&tab==='plan'?'3d':tab,venue:venue?.id,shape:selected?.id,layer:mapLayer==='venues'?null:mapLayer})){v?u.searchParams.set(k,v):u.searchParams.delete(k)}history.replaceState(null,'',u)}catch{}}
function setActive(id,v){const n=$(id);n.classList.toggle('active',v);n.setAttribute('aria-pressed',String(v))}
function updateTabs(){
 for(const [id,v] of [['venuesLayer',mapLayer==='venues'],['shapesLayer',mapLayer==='shapes'],['densityLayer',mapLayer==='density'],['plan',tab==='plan'&&!is3d],['three',tab==='plan'&&is3d]])setActive(id,v);
 $('exploreDistrict').value=exploreDistrict;$('district').value=district;
 $('cityControls').hidden=tab!=='city';$('densityLegend').hidden=tab!=='city'||mapLayer!=='density';
 $('plan').disabled=Boolean(venue&&!hasPlan(venue));
 $('three').disabled=!(hasPlan(venue)||contextOnly(venue)||selected&&layout(selected).length);
 const sceneOn=is3d&&tab==='plan';$('scene3d').hidden=!sceneOn;map.style.visibility=sceneOn?'hidden':'';document.querySelector('.maptools').hidden=sceneOn;
 $('venueName').textContent=venue?.name||(selected?.n||'');
}
function geometryName(f){return f.n||(f.k==='court'?'网球场':'球场轮廓')}
function selectShape(f,fromMap){
 if(tab==='city'){is3d=false;cityReturn={district,camera:camera&&[...camera]};venue=groupOwners.get(f.id)||null;tab='plan';resetFocus()}
 selected=f;selectedSlot=null;
 render();
}
function venueFromId(id){return venueMap.get(id)||(names.has(id)?{...catalog[id],id,name:names.get(id),children:[]}:null)}
function selectVenue(v){
 if($('explore').open)$('explore').close();
 showVenue(v);window.scrollTo(0,0);
}
function showVenue(v){
 if(hasPlan(v)){openPlan(v);return}
 if(contextOnly(v)){venue=v;is3d=true;tab='plan';selected=selectedSlot=null;resetFocus();render();return}
 venue=v;selected=selectedSlot=null;mapLayer='venues';tab='city';cityReturn=null;district=v.district||'';
 resetFocus();
 const pin=pinById.get(v.id);if(pin)box=[pin[0]-1100,pin[1]-850,2200,1700];
 render();
}
function openPlan(v){
 if(tab==='city')cityReturn={district,camera:camera&&[...camera]};
 venue=v;selected=selectedSlot=null;tab='plan';if(!hasPlan(v))is3d=false;resetFocus();render();
}
function populate(){
 const count=new Map();
 for(const [id] of data.venues) {
  const k=venueFromId(id)?.district;if(k)count.set(k,(count.get(k)||0)+1);
 }
 const ordered=[...data.districts].sort((a,b)=>(count.get(b.n)||0)-(count.get(a.n)||0)||a.n.localeCompare(b.n,'zh-CN'));
 for(const {n} of ordered)for(const sid of ['district','exploreDistrict'])html('option',n,$(sid)).value=n;
}
function schedule(){if(frame)return;frame=requestAnimationFrame(()=>{frame=0;if(target&&camera){
 const diff=Math.max(...target.map((t,i)=>Math.abs(t-camera[i])));camera=diff<Math.max(camera[2]*.0008,.015)?[...target]:camera.map((c,i)=>c+(target[i]-c)*.28);
 if(diff<Math.max(camera[2]*.0008,.015))target=null;
 }drawMap();if(target)schedule()})}
function clickable(g,act){g.onclick=()=>{if(!noClick)act()};g.onkeydown=e=>{if(e.key==='Enter'||e.key===' '){e.preventDefault();act()}}}
function modelCourt(f,m,i,seq){
 const active=f.id===selected?.id&&(selectedSlot===null||selectedSlot===i);
 const kind=typeFor(venue,f), indoor=kind==='indoor', cover=kind==='sheltered'||kind==='bridge', roof=kind==='roof';
 const g=el('g',{transform:'translate('+m.x+','+m.y+') rotate('+m.angle+')','data-slot':i,'data-court-type':kind,role:'button',tabindex:'0','aria-label':'图上 '+seq+' 号'+(kind?' · '+guide.labels[kind]:'')});
 const k=m.lineScale||1,lw=dims.width*k/2,ss=dims.singles*k/2,lh=dims.length*k/2,sv=dims.service*k;
 g.append(el('rect',{x:-m.cw/2+.25,y:-m.cl/2+.25,width:m.cw-.5,height:m.cl-.5,rx:.65,fill:indoor?'#a4b7d1':cover?'#c0b291':roof?'#ba9fb9':active?'#365b48':'#91ac90',stroke:active?'#284e3a':indoor?'#526c98':'#63836e','stroke-width':active?2:1.05,'stroke-dasharray':indoor||cover?'2.8 1.8':'none',class:'outline'}));
 g.append(el('rect',{x:-lw,y:-lh,width:2*lw,height:2*lh,fill:indoor?(active?'#3e5f95':'#5677a8'):cover?'#857653':roof?'#775a77':active?'#2d5946':'#638970',stroke:'#f5fbfa','stroke-width':1.1,class:'outline'}));
 const lines='M'+(-ss)+','+(-lh)+'V'+lh+'M'+ss+','+(-lh)+'V'+lh+'M'+(-ss)+','+(-sv)+'H'+ss+'M'+(-ss)+','+sv+'H'+ss+'M0,'+(-sv)+'V'+sv+'M0,'+(-lh)+'v.42M0,'+lh+'v-.42';
 g.append(el('path',{d:lines,fill:'none',stroke:'#f6fcfa','stroke-width':.85,class:'outline'}));
 g.append(el('path',{d:'M'+(-lw-.8)+',0H'+(lw+.8),stroke:'#153e3d','stroke-width':1.2,class:'outline'}));
 const label=el('text',{x:0,y:1,'font-size':3.15,'text-anchor':'middle',fill:'#fff','font-weight':700,'paint-order':'stroke',stroke:'#2c513e','stroke-width':.7},String(seq));g.append(label);
 clickable(g,()=>{selected=f;selectedSlot=i;render()});
 return g
}
function paintLandscape(slots){
 if(!planPainter||!slots.length)return;
 const signature=slots.map(x=>x.f.id+':'+x.i).join('|');
 if(!planCache||planCache.signature!==signature){
  const xs=slots.map(x=>x.m.x),ys=slots.map(x=>x.m.y);
  const cx=(Math.min(...xs)+Math.max(...xs))/2,cy=(Math.min(...ys)+Math.max(...ys))/2;
  const data=planPainter(slots.map(({m})=>({...m,x:m.x-cx,y:m.y-cy})),signature);
  const group=el('g',{'data-landscape':'true','aria-hidden':'true','pointer-events':'none',transform:'translate('+cx+','+cy+')'});
  const hex=n=>'#'+n.toString(16).padStart(6,'0');
  for(const {pts,mat} of data.patches)group.append(el('polygon',{points:pts.map(p=>p.map(v=>v.toFixed(2)).join(',')).join(' '),fill:hex(mat),'fill-opacity':.66}));
  for(const {x,z,sx,sz,mat,kind} of data.parts){
   group.append(el('ellipse',{cx:x,cy:z,rx:sx,ry:sz,fill:hex(mat),'fill-opacity':.89,stroke:'#f0f5df','stroke-width':.22}));
   if(kind==='spire')group.append(el('ellipse',{cx:x-.13*sx,cy:z-.15*sz,rx:sx*.57,ry:sz*.53,fill:'#d9e4b7','fill-opacity':.23}));
  }
  planCache={signature,group};
 }
 map.append(planCache.group);
}
import('./3d/landscape-plan.js?v=14').then(m=>{planPainter=m.landscapePlan;layerKey=null;schedule()}).catch(()=>{});
// Count directory/geometry pins, not bookings, page views or official totals.
const locations=[],densityCache=new Map();
for(const [id,p] of pinById){
 const v=venueFromId(id);if(v&&v.district&&p.every(Number.isFinite))locations.push({id,p,v});
}
function densityCells(size){
 const cacheKey=size+':'+district;if(densityCache.has(cacheKey))return densityCache.get(cacheKey);
 const cells=new Map(), unique=[];
 for(const it of locations){
  if(district&&it.v.district!==district)continue;
  if(unique.some(o=>Math.hypot(o.p[0]-it.p[0],o.p[1]-it.p[1])<32))continue;
  unique.push(it);
  const [x,y]=it.p;
  const q=(2*x/3)/size,r=(-x/3+y/Math.sqrt(3))/size;let i=Math.round(q),j=Math.round(r),k=Math.round(-q-r);
  const di=Math.abs(q-i),dj=Math.abs(r-j),dk=Math.abs(-q-r-k);
  if(di>dj&&di>dk)i=-j-k;else if(dj>dk)j=-i-k;
  const key=i+':'+j;
  const entry=cells.get(key)||{x:1.5*size*i,y:Math.sqrt(3)*size*(j+i/2),rows:[]};
  entry.rows.push(it);cells.set(key,entry);
 }
 const result=[...cells.values()].sort((a,b)=>a.rows.length-b.rows.length);densityCache.set(cacheKey,result);return result;
}
function drawDensity(w){
 const radius=w<6000?160:w<14000?410:w<31000?980:1750;
 const cells=densityCells(radius),g=el('g',{'data-density':'true','aria-label':'场馆密度'});
 const colors=['#f4cfab','#f4ad78','#e58a58','#cf663e','#ad4c34','#783c42'];
 for(const {x,y,rows} of cells){
  const n=rows.length,clr=colors[n===1?0:n<=2?1:n<=4?2:n<=7?3:n<=10?4:5];
  const ps=Array.from({length:6},(_,i)=>[x+radius*.965*Math.cos(i*Math.PI/3),y+radius*.965*Math.sin(i*Math.PI/3)].join(',')).join(' ');
  const name=rows[0].v.district,btn=el('g',{role:'button',tabindex:0,'aria-label':name+' · '+n+' 处场馆'});
  btn.append(el('polygon',{points:ps,fill:clr,stroke:'#fff','stroke-width':.5,class:'outline'}));
  btn.append(el('title',{},n+' 处 · '+rows.slice(0,4).map(o=>o.v.name).join('、')));
  clickable(btn,()=>{
   if(n===1){showVenue(rows[0].v);return}
   district=name;tab='city';venue=selected=selectedSlot=null;mapLayer='venues';
   box=[x-radius*2,y-radius*1.6,radius*4,radius*3.2];camera=target=null;render();
  });
  g.append(btn);
 }
 map.append(g);
}
function drawMap(){
 if(!box)resetFocus();
 if(!camera){
  const p=tab==='plan'&&landscapeOn&&allSlots(currentEntities()).length?Math.max(13,Math.min(25,Math.max(box[2],box[3])*.22)):0;
  camera=fit([box[0]-p,box[1]-p,box[2]+p*2,box[3]+p*2],tab==='city'?1.05:p?1.04:1.23,60);
 }
 const [x,y,w,h]=camera, scale=w/Math.max(1,map.clientWidth), detailed=tab==='plan'||w<6500,fs=currentEntities();
 map.setAttribute('viewBox',camera.join(' '));
 const key=[tab,mapLayer,district,venue?.id,selected?.id,selectedSlot,detailed,w>31000,w<14000,w<6000,landscapeOn].join(':');
 if(layerKey!==key){
 layerKey=key;map.replaceChildren();
 if(tab==='city'){
  for(const d of data.districts){
   const g=el('g',{'data-district':d.n,role:'button',tabindex:'0','aria-label':'放大'+d.n});
   g.append(el('path',{d:poly(d.p),fill:mapLayer==='density'?(d.n===district?'#eee8dd':'#f7f5f0'):d.n===district?'#cddfcd':'#edf5e8',stroke:'#bbcfbf','stroke-width':1,'class':'outline','fill-rule':'evenodd'}));
   clickable(g,()=>zoomDistrict(d.n));map.append(g);
  }
 }
 if(tab==='plan'&&landscapeOn)paintLandscape(allSlots(fs));
 $('empty').textContent=venue?'暂无球场图':'选择场地';
 $('empty').hidden=!(tab==='plan'&&!fs.length);
 if(tab==='city'&&mapLayer==='density')drawDensity(w);
 else if(tab==='city'&&mapLayer==='venues'){for(const [id,p] of pinById){const v=venueFromId(id);if(!v||district&&v.district!==district)continue;const active=venue?.id===id;const n=el('g',{'data-venue':id,role:'button',tabindex:active||v.feature?'0':'-1','aria-label':v.name});n.append(el('circle',{cx:p[0],cy:p[1],r:2,fill:active?'#e8a838':'#579171','pointer-events':'all',stroke:active?'#e8a838':v.feature?'#22645b':'#579171','stroke-width':active?17:v.feature?12:9,class:'outline'}));n.append(el('title',{},v.name));clickable(n,()=>{showVenue(v)});if(active)n.setAttribute('data-active','true');map.append(n)}}
 else for(const f of [...fs].sort((a,b)=>b.a-a.a)){
  const active=f.id===selected?.id, g=el('g',{'data-id':f.id,role:'button',tabindex:tab==='plan'||f.n?'0':'-1','aria-label':geometryName(f)});
  const outline=f.k!=='court';
  if(detailed)g.append(el('path',{d:poly(f.p),fill:active?'#79a28b':outline?'#dde8d9':'#a7c1a7','fill-opacity':active?'.8':outline?'.37':'.68',stroke:active?'#375848':outline?'#819e88':'#527c67','stroke-width':active?2.1:1.15,'fill-rule':'evenodd',class:'outline'}));
  else g.append(el('circle',{cx:f.c[0],cy:f.c[1],r:2,fill:'#438a7d',stroke:active?'#be772e':outline?'#427367':'#438a7d','stroke-width':outline?10:7,class:'outline'}));
  g.append(el('title',{},geometryName(f)));clickable(g,()=>selectShape(f,true));map.append(g)
 }
 const slots=tab==='plan'?allSlots(fs):[];
 slots.forEach(({f,m,i},j)=>map.append(modelCourt(f,m,i,j+1)));
 if(tab==='city'&&mapLayer==='shapes'&&venue&&catalog[venue.id]?.point){
   const [u,v]=catalog[venue.id].point;
   const dot=el('circle',{cx:u,cy:v,r:2,fill:'#e8a838',stroke:'#e8a838','stroke-width':10,class:'outline','pointer-events':'none'});
   dot.append(el('title',{},venue.name));map.append(dot);
 }
 if(tab==='city'&&w>31000){
  const fontsize=district?1300:2200;
  for(const d of data.districts){const [cx,cy]=d.c,g=el('g',{'data-district-label':d.n,role:'button',tabindex:'0','aria-label':'选择'+d.n});
   g.append(el('rect',{x:cx-fontsize*1.75,y:cy-fontsize*1.2,width:fontsize*3.5,height:fontsize*1.7,rx:fontsize*.4,fill:'#f2f9ef','fill-opacity':.84,stroke:'#b7cdbc','stroke-width':.75,class:'outline'}));
   g.append(el('text',{x:cx,y:cy,'font-size':fontsize,'text-anchor':'middle',fill:'#42615b'},d.n));clickable(g,()=>zoomDistrict(d.n));map.append(g)
  }
 }
 const active=map.querySelector('[data-venue][data-active]');if(active)map.append(active);
 overlay=el('g',{'pointer-events':'none','aria-hidden':'true'});map.append(overlay);
 }
 if(overlay){
 const fsiz=scale*11,l=x+scale*13, top=y+scale*22;overlay.replaceChildren();
 overlay.append(el('text',{x:l,y:top,'font-size':fsiz,fill:'#395e57'},'↑ 北'));
 if(tab==='city'&&mapLayer!=='density'&&venue&&pinById.has(venue.id)){
  const [u,v]=pinById.get(venue.id);
  if(u>x&&u<x+w&&v>y&&v<y+h){
   const label=venue.name.length>17?venue.name.slice(0,16)+'…':venue.name,ww=(label.length+.9)*fsiz;
   const xx=Math.min(x+w-ww-scale*5,Math.max(x+scale*5,u-ww/2)),yy=Math.max(y+scale*5,v-scale*39);
   overlay.append(el('rect',{x:xx,y:yy,width:ww,height:scale*26,rx:scale*5,fill:'#fff'}));
   overlay.append(el('text',{x:xx+fsiz*.45,y:yy+scale*17,'font-size':fsiz,fill:'#22483c',class:'pinlabel'},label));
  }
 }

 if(tab==='plan'&&fs.length){const m=w<160?10:w<500?20:50;overlay.append(el('path',{d:'M'+l+','+(y+h-scale*16)+'h'+m,stroke:'#355b52','stroke-width':2,class:'outline'}));overlay.append(el('text',{x:l,y:y+h-scale*23,'font-size':fsiz,fill:'#395e57'},m+' 米'))}
 }
}
let photoVenue;
function drawPhoto(){
 const id=venue?.id;if(id===photoVenue)return;photoVenue=id;
 const photo=$('photo');photo.replaceChildren();photo.hidden=true;$('photoTab').hidden=true;
 const remote=guide.photos[id]||[],items=gallery[id]||[];
 if(!items.length&&!remote.length)return;
 const top=html('div','',photo);top.className='photo-head';html('h2','实拍',top);
 const grid=html('div','',photo);grid.className='photo-grid';
 for(const [j,url] of remote.entries()){
   const figure=html('figure','',grid),img=document.createElement('img');
   img.alt=venue.name+' · 实拍 '+(j+1);img.loading='lazy';img.decoding='async';img.referrerPolicy='no-referrer';img.src=url;
   img.onerror=()=>{figure.remove();if(!grid.children.length){photo.hidden=true;$('photoTab').hidden=true}};
   const view=href(figure,'',url);view.className='photo-enlarge';view.setAttribute('aria-label',img.alt);view.append(img);
   html('figcaption','来源：网球地图',figure).className='photo-credit';
 }
 for(const [file,label,author,commons,license,w,h] of items){
   const figure=html('figure','',grid),image=document.createElement('img');
   image.src='./photos/'+file;image.alt=label;image.width=w;image.height=h;image.loading='lazy';
   const view=href(figure,'','./photos/'+file);view.className='photo-enlarge';view.setAttribute('aria-label','查看大图：'+label);view.append(image);
   const cap=html('figcaption',label+' · ',figure);
   href(cap,author,'https://commons.wikimedia.org/wiki/File:'+encodeURIComponent(commons));
   html('span',' · ',cap);href(cap,'CC BY-SA '+license,'https://creativecommons.org/licenses/by-sa/'+license+'/');
 }
 photo.hidden=false;$('photoTab').hidden=false;
}
// Only use the booking call to action for listings with a verified booking entry.
const onlineBooking=new Set(['2']);
const contextReading={
 '7':'https://ghzyj.gz.gov.cn/sjb/yw/mcbh/content/post_5680508.html',
 'ctx-zhujiang':'https://ghzyj.gz.gov.cn/ywpd/cxgh/ghxkgsgb/phgbnew/gbt/content/post_10298083.html',
 'ctx-coco':'https://www.chngalaxy.com/news.aspx?en=1&id=1684'
};
function drawDetail(){
 const d=$('detail');d.replaceChildren();d.hidden=!venue&&!selected;drawPhoto();
 if(d.hidden)return;
 const head=document.createElement('div');d.append(head);
 html('h3',venue?.name||geometryName(selected),head);
 const seq=tab==='plan'&&selectedSlot!==null?allSlots(currentEntities()).findIndex(el=>el.f.id===selected?.id&&el.i===selectedSlot)+1:0;
 const g=venueGuide(venue),k=seq&&typeFor(venue,selected);for(const type of k?[k]:types(venue))typeBadge(head,type);
 const details=[selected?.id==='way/1428179587'&&seq?'中心球场':seq?(selected?.id?.startsWith('context/2/')?'室内示意 '+(selectedSlot+Number(selected.id.split('/').at(-1)))+' 号':'图上 '+seq+' 号'):'',venue?.district||selected?.district,venue?.isCampus?'校内场地':venue?.isResidential?'小区场地':'',g.total|| (venue?.id==='262'?'4 片标准场＋1 片练习场':''),g.facts,venue?.address].filter(Boolean);
 if(details.length)html('p',details.join(' · '),head);
 const actions=document.createElement('div');actions.className='actions';d.append(actions);
 const detailURL=venue?.source||catalog[venue?.id]?.source;
 if(detailURL){
  const canBook=onlineBooking.has(venue.id);
  href(actions,canBook?'立即预订':'场馆详情',detailURL).className=canBook?'btn book-primary':'btn';
 }
 const contextInfo=g.source||contextReading[venue?.id]||aerialLink[venue?.id]?.[1]||venue?.source||(venue?.id==='20'?'https://www.nfty.com.cn/index.php?a=index&aid=5783&c=View&m=home':null);
 if(contextInfo&&contextInfo!==detailURL)href(actions,'看看环境',contextInfo).className='btn';
 if(false){
  const places=nearbyPlans(venue);
  if(places.length){
   const b=html('button','看附近球场图',actions);b.className='btn';b.onclick=()=>nearbyMap(venue,places);
  }
 }
}
function row(v,parent=$('results')){const r=html('button','',parent);r.className='row';r.type='button';r.setAttribute('aria-current',String(venue?.id===v.id));const line=html('span','',r);line.className='result-title';html('strong',v.name,line);for(const k of types(v))typeBadge(line,k);if(hasPlan(v)||contextOnly(v))html('span',hasPlan(v)?'球场图':'园区 3D',line).className='has-plan';else if(nearbyPlans(v).length)html('span','附近有图',line).className='near-plan';
 const sub=[v.district,venueGuide(v).total,v.isCampus?'校内场地':v.isResidential?'小区场地':'',v.address].filter(Boolean).join(' · ');if(sub)html('small',sub,r);
 r.onclick=()=>selectVenue(v);
}
const venueGroups=[
 ['sports','公共场馆',16],['campus','校园球场',10],['residential','小区球场',10],['other','其他场地',8],['no-plan','暂无球场图',12]
];
function venueGroup(v){
 if(v.isCampus)return 'campus';
 if(v.isResidential)return 'residential';
 const n=v.name;
 if(/酒店|宾馆|度假村|度假酒店/.test(n))return 'other';
 if(/(?:^|[·（(])(?:华工|暨南大学|华南师范大学|广东邮电职业技术学院|广东实验中学|华南农业大学)|中学|小学|职业技术学院/.test(n)||['410','512'].includes(v.id))return 'campus';
 if(/(?:花园|华府|雅苑|雅筑|山庄|小区|住宅区|家园|名苑|公馆|环市西苑)(?:[-· ]*网球场)?$/.test(n)&&!/俱乐部|体育|公园|学院|培训/.test(n))return 'residential';
 return 'sports';
}
function list(){
 if(!$('explore').open)return;
 const s=$('search').value.trim().toLowerCase();
 const vv=venueEntries.map(([id])=>venueFromId(id)).filter(v=>v&&(!typeFilter||types(v).includes(typeFilter))&&(!exploreDistrict||v.district===exploreDistrict)&&(!s||(v.name+' '+(v.address||'')+' '+(aliases[v.id]||'')).toLowerCase().includes(s)));
 const score=v=>priority.get(v.id)??99;
 vv.sort((a,b)=>Number(hasPlan(b))-Number(hasPlan(a))||Number(!!a.mapFacility)-Number(!!b.mapFacility)||score(a)-score(b)||Number(Boolean(nearbyPlans(b).length))-Number(Boolean(nearbyPlans(a).length)));
 const results=$('results');results.replaceChildren();results.scrollTop=0;
 if(!vv.length){html('p','没有找到匹配场地',results);return}
 if(s||typeFilter){for(const v of vv)row(v);return}
 const picks=vv.filter(v=>(hasPlan(v)||contextOnly(v))&&guide.featured.includes(v.id)).sort((a,b)=>guide.featured.indexOf(a.id)-guide.featured.indexOf(b.id));
 if(picks.length){const block=html('section','',results);block.className='venue-group';html('h3','重点场馆',block).className='result-heading';for(const v of picks)row(v,block);}
 const pickIds=new Set(picks.map(v=>v.id));
 for(const [kind,title,limit] of venueGroups){
  const items=vv.filter(v=>!pickIds.has(v.id)&&(kind==='no-plan'?!hasPlan(v):hasPlan(v)&&venueGroup(v)===kind));if(!items.length)continue;
  const section=html('section','',results);section.className='venue-group';section.setAttribute('aria-label',title);
  html('h3',title,section).className='result-heading';
  for(const v of items.slice(0,limit))row(v,section);
  if(items.length>limit){
   const more=html('details','',section);more.className='venue-more';
   html('summary','展开更多（'+(items.length-limit)+'）',more);
   for(const v of items.slice(limit))row(v,more);
  }
 }
}
function in3d(){
 if(!is3d||tab!=='plan')return;
 const fs=currentEntities(), slots=allSlots(fs),status=$('threeStatus');
 if(!slots.length&&!contextOnly(venue)){status.hidden=false;status.textContent='暂无 3D 场地';return}
 if(viewer3d){status.hidden=true;viewer3d.show(slots,fs,slots.findIndex(x=>x.f.id===selected?.id&&x.i===selectedSlot),venue?.id);return}
 status.hidden=false;status.textContent=viewerFailed?'这台设备暂时无法显示 3D，请切回 2D':'加载 3D…';
 if(viewerPending||viewerFailed)return;
 viewerPending=import('./3d/court-view.js?v=21').then(({makeViewer})=>{
  viewer3d=makeViewer($('scene3d'),j=>{
   const q=allSlots(currentEntities())[j];if(!q)return;
   selected=q.f;selectedSlot=q.i;render();
  });
  in3d();
 }).catch(()=>{viewerFailed=true;in3d()});
}
function render(){layerKey=null;updateTabs();drawMap();in3d();drawDetail();list();remember()}
function scaleAt(c,z,fx,fy,toX=fx,toY=fy){
 const max=fit(defaultBounds,2)[2], w=Math.max(24,Math.min(c[2]*z,max)),h=c[3]*w/c[2];
 return [c[0]+fx*c[2]-toX*w,c[1]+fy*c[3]-toY*h,w,h]
}
function fractions(clientX,clientY){const r=map.getBoundingClientRect();return [(clientX-r.left)/Math.max(1,r.width),(clientY-r.top)/Math.max(1,r.height)]}
function zoom(z,fx=.5,fy=.5){if(!camera)return;target=scaleAt(target||camera,z,fx,fy);schedule()}
const pts=new Map();let gesture=null;
function snapshot(){const v=[...pts.values()],a=v[0],b=v[1];return !a?null:b?{c:[...camera],x:(a.x+b.x)/2,y:(a.y+b.y)/2,d:Math.hypot(a.x-b.x,a.y-b.y)}:{c:[...camera],x:a.x,y:a.y,d:0}}
map.addEventListener('pointerdown',e=>{if(e.button!==0||!camera||pts.size>=2)return;if(!pts.size)noClick=false;target=null;pts.set(e.pointerId,{x:e.clientX,y:e.clientY});gesture=snapshot();if(pts.size===2){noClick=true;for(const id of pts.keys())map.setPointerCapture(id)}});
map.addEventListener('pointermove',e=>{
 if(!pts.has(e.pointerId)||!gesture)return;
 pts.set(e.pointerId,{x:e.clientX,y:e.clientY});const n=snapshot();
 if(!noClick&&Math.hypot(n.x-gesture.x,n.y-gesture.y)<5)return;
 if(!noClick){noClick=true;map.setPointerCapture(e.pointerId)}
 const [fx,fy]=fractions(gesture.x,gesture.y),[nx,ny]=fractions(n.x,n.y);
 camera=scaleAt(gesture.c,gesture.d?gesture.d/Math.max(5,n.d):1,fx,fy,nx,ny);schedule()
});
for(const et of ['pointerup','pointercancel','pointerleave'])map.addEventListener(et,e=>{if(et==='pointerleave'&&map.hasPointerCapture(e.pointerId))return;if(pts.delete(e.pointerId))gesture=snapshot()});
map.addEventListener('wheel',e=>{e.preventDefault();const [x,y]=fractions(e.clientX,e.clientY), dy=e.deltaY*(e.deltaMode===1?16:e.deltaMode===2?300:1);zoom(Math.exp(Math.max(-.40,Math.min(.40,dy*.0025))),x,y)},{passive:false});
$('plus').onclick=()=>zoom(.65);$('minus').onclick=()=>zoom(1.54);$('reset').onclick=()=>{resetFocus();drawMap()};

$('plan').onclick=()=>{is3d=false;if(tab!=='plan')openPlan(venue);else render()};
$('three').onclick=()=>{if($('three').disabled)return;is3d=true;if(tab!=='plan')openPlan(venue);else render()};
for(const b of document.querySelectorAll('[data-camera]'))b.onclick=()=>{
 if(!viewer3d)return;
 if(b.dataset.camera!=='overview'&&b.dataset.camera!=='axis'&&selectedSlot===null){
  const first=allSlots(currentEntities())[0];if(first){selected=first.f;selectedSlot=first.i;drawDetail();remember();}
 }
 for(const k of document.querySelectorAll('[data-camera]'))k.setAttribute('aria-pressed',String(k===b));
 const slots=allSlots(currentEntities());viewer3d.show(slots,currentEntities(),slots.findIndex(x=>x.f.id===selected?.id&&x.i===selectedSlot),venue?.id);viewer3d.setMode(b.dataset.camera);
};
for(const [id,k] of [['venuesLayer','venues'],['shapesLayer','shapes'],['densityLayer','density']])$(id).onclick=()=>{tab='city';mapLayer=k;layerKey=null;render()};
$('district').onchange=()=>zoomDistrict($('district').value);
function openPicker(){
 if($('explore').open)return;
 $('search').value='';$('explore').showModal();list();$('search').focus({preventScroll:true});
}
$('find').onclick=$('exploreTab').onclick=openPicker;
$('closePicker').onclick=()=>$('explore').close();
$('photoTab').onclick=()=>$('photo').scrollIntoView({behavior:'smooth',block:'start'});
$('exploreDistrict').onchange=()=>{exploreDistrict=$('exploreDistrict').value;list()};
$('search').oninput=list;
addEventListener('resize',()=>{camera=null;target=null;schedule()});
const cleanHome=!['view','venue','shape','district'].some(k=>q.has(k));
venue=venueFromId(q.get('venue')||(cleanHome?'20':'7'));
if(q.get('shape'))selected=byId.get(q.get('shape'));
if(!venue||!hasPlan(venue)&&!contextOnly(venue))venue=venueFromId('20');
if((q.get('view')==='3d'||cleanHome||contextOnly(venue))&&tab==='plan')is3d=true;
if(selected&&!q.get('venue'))venue=groupOwners.get(selected.id)||null;
populate();resetFocus();render();
})();
