import * as T from './three.module.js';
import data from './venue-context-data.js?v=21';
import {makeHongchengLandmarks,hongchengReplacedIds} from './hongcheng-landmarks.js?v=20';

const notes={
 '1':{groundSpan:1650,focus:[36030,88316], landmarks:['21411859','21411860','524549510']},
 '2':{groundSpan:1400,focus:[27767,89080],coverIds:['319831719'],landmarks:['319831719','4447355']},
 '23':{groundSpan:1250,focus:[39980,85254],landmarks:['1383234580','1061416392']},
 '435':{groundSpan:970,focus:[16410,96646],landmarks:['216644255']},
 '1371':{groundSpan:2100,focus:[62545,150123],overviewOnly:true,landmarks:['19481744','1423616818','1423507928','1423463953']},

 '7':{
  label:'沙面街区',note:'水岸、街路与楼体轮廓来自 OSM；未公布楼高仅作体量示意，树冠不代表现状逐树测量。',source:'https://ghzyj.gz.gov.cn/sjb/yw/mcbh/content/post_5680508.html',groundSpan:920,
 },
 '20':{
  label:'二沙岛与珠江新城',note:'二沙岛岸线和城市轮廓据 OSM，中轴线及地标按公开资料重建。树木为配景。',source:'https://www.nfnews.com/content/xovK4PrnyJ.html',groundSpan:2450,
 },
 '85':{
  label:'南沙网球中心与蕉门水道',note:'按地图绘制周边水道、道路和场馆，场地图只覆盖已匹配的部分。桥的视线未核，不加未确认远景。',source:'https://static.nfnews.com/content/202510/05/c11792539.html',groundSpan:1250,
 },
 'ctx-zhujiang':{
  label:'5 楼天台 · 珠江街全民健身活动中心',note:'地上五层及两片露天场有公开资料；楼体外轮廓、屋顶标高和落场位置暂为估算。',source:'https://ghzyj.gz.gov.cn/ywpd/cxgh/ghxkgsgb/phgbnew/gbt/content/post_10298083.html',groundSpan:830,raise:21.5,
 },
 'ctx-coco':{
  label:'L4 天台 · 南沙星河 COCO Park',note:'按商场 OSM 外轮廓和开发商的多层退台资料建模。L4 的具体标高和球场落点是估算。',source:'https://www.chngalaxy.com/news.aspx?en=1&id=1684',groundSpan:1175,raise:20,
 },
 'ctx-xingbai':{
  label:'广州大桥桥底南段',note:'桥轴线、水岸按 OSM，结合桥底现场照片建模；净高、桥墩和球场中心位置是示意。全景剖开桥面，切场边或底线可看梁底。',source:'https://static.nfnews.com/content/202512/08/c11977183.html',groundSpan:1060,
 },
};
export function venueContext(id){
 const key=String(id??'');return notes[key]&&data[key]?{id:key,data:data[key],...notes[key]}:null;
}
export function makeVenueContext(cfg,units,center){
 if(!cfg||!units.length&&!cfg.overviewOnly)return null;
 const raise=cfg.raise||0, ground=-raise, group=new T.Group(), nearFitPoints=[];
 const diagram=cfg.id==='20',cutawayGroups=[];
 const bridgeRoof=cfg.id==='ctx-xingbai'?new T.Group():null;if(bridgeRoof) group.add(bridgeRoof);
 const mats=new Map();
 const mat=(color)=>{if(!mats.has(color))mats.set(color,new T.MeshStandardMaterial({color,roughness:.92,flatShading:true}));return mats.get(color)};
 const box=(dest,c,w,h,l,x,y,z,layer=.83,rot=0)=>{
  const o=new T.Mesh(new T.BoxGeometry(Math.max(.01,w),Math.max(.01,h),Math.max(.01,l)),mat(c));
  o.position.set(x,y,z);o.rotation.y=rot;o.userData.decorLayer=layer;dest.add(o);return o;
 };
 const plane=(ring,y,c,layer,holes=[],target=group)=>{
  const path=p=>p.map(([x,z])=>new T.Vector2(x,-z));
  const shape=new T.Shape(path(ring));
  shape.holes=holes.map(h=>new T.Path(path(h)));
  const mesh=new T.Mesh(new T.ShapeGeometry(shape),mat(c));mesh.rotation.x=-Math.PI/2;mesh.position.y=y;
  mesh.userData.decorLayer=layer;target.add(mesh);return mesh;
 };
 const local=(p)=>p.map(([a,b])=>[a-center[0],b-center[1]]);
 const segment=(a,b,w,thick,y,c,layer,dest=group)=>{
  const len=Math.hypot(a[0]-b[0],a[1]-b[1]);if(len<.2)return;
  const mid=[(a[0]+b[0])*.5,(a[1]+b[1])*.5],rot=Math.atan2(b[0]-a[0],b[1]-a[1]);
  return box(dest,c,w,thick,len,mid[0],y,mid[1],layer,rot);
 };
 const shell=(ring,bottom,top,roof,wall,layer=.84,holes=[],target=group)=>{
  const center=ring.reduce((sum,[x,z])=>[sum[0]+x/ring.length,sum[1]+z/ring.length],[0,0]);
  const block={center:new T.Vector3(center[0],(bottom+top)/2,center[1]),layer};
  plane(ring,top,roof,layer+.015,holes,target).userData.block=block;
  for(const r of [ring,...holes]){
  const closed=r[0][0]===r.at(-1)[0]&&r[0][1]===r.at(-1)[1];
  for(let i=0;i<r.length-(closed?1:0);i++){
   const a=r[i],b=r[(i+1)%r.length],dx=b[0]-a[0],dz=b[1]-a[1],len=Math.hypot(dx,dz);
   if(len<.02)continue;
   const facade=new T.Mesh(new T.PlaneGeometry(len,top-bottom),mat(wall));
   facade.material.side=T.DoubleSide;facade.position.set((a[0]+b[0])/2,(bottom+top)/2,(a[1]+b[1])/2);facade.rotation.y=-Math.atan2(dz,dx);
   facade.userData.decorLayer=layer;facade.userData.block=block;target.add(facade);
  }}
 };
 const polyRect=(x,z,w,l,angle)=>{
  const c=Math.cos(angle),s=Math.sin(angle);
  return [[-w/2,-l/2],[w/2,-l/2],[w/2,l/2],[-w/2,l/2],[-w/2,-l/2]].map(([u,v])=>[x+u*c+v*s,z-u*s+v*c]);
 };
 const levels={park:[-.185,diagram?0xb3cb9b:0xbac9a9,.35],water:[-.135,diagram?0xabcddc:0x91b6bd,.40],road:[-.067,diagram?0xf6f3eb:0xe2ded0,.53],rail:[5.43,0xa2b0b1,.8]};
 for(const [kind,[height,color,layer]] of Object.entries(levels))
  for(const [outer,...holes] of cfg.data.surfaces[kind])plane(local(outer),ground+height,color,layer,holes.map(local));
 for(const [p,h,name,id,quality,holes=[]] of cfg.data.buildings){
  if(cfg.id==='20'&&hongchengReplacedIds.has(String(id)))continue;
  const q=local(p);
  const landmark=quality==='published';
  const isHistoric=cfg.id==='7', modern=name.includes('楼')||name.includes('栋')||h>40;
  const wall=diagram?0xdedfd9:landmark?0xa4b9c4:isHistoric?(Number(id)%3===0?0xe0cbb7:0xe8dfcc):modern?0xcbd1cd:0xdcdacf;
  const roof=diagram?0xf5f5f0:landmark?0xb5c6cd:isHistoric?(Number(id)%3===0?0xb88976:0xcbb4a0):0xe4e3d7;
  if(cfg.landmarks?.includes(String(id))){
   const minX=Math.min(...q.map(a=>a[0])),maxX=Math.max(...q.map(a=>a[0])),minZ=Math.min(...q.map(a=>a[1])),maxZ=Math.max(...q.map(a=>a[1]));
   nearFitPoints.push(new T.Vector3(minX,0,minZ),new T.Vector3(maxX,h,maxZ));
  }
  let target=group;
  if(cfg.coverIds?.includes(String(id))){target=new T.Group();group.add(target);cutawayGroups.push(target)}
  shell(q,ground-.17,ground+h,roof,wall,.76,holes.map(local),target);
  if(target!==group){
   // Low perimeter walls remain as a cutaway in overview. The full shell appears from court level.
   for(const r of [q,...holes.map(local)])for(let k=0;k<r.length-1;k++)segment(r[k],r[k+1],.48,.72,.24,0xd0d9e4,.75);
  }
 }
 if(raise){
  const widths=units.map(u=>[u.root.position.x,u.root.position.z]); 
  const lx=Math.min(...widths.map(p=>p[0])), hx=Math.max(...widths.map(p=>p[0]));
  const lz=Math.min(...widths.map(p=>p[1])), hz=Math.max(...widths.map(p=>p[1]));
  const cx=(lx+hx)/2, cz=(lz+hz)/2;
  const first=units[0], ang=first.root.rotation.y, cos=Math.cos(ang),sin=Math.sin(ang);
  const offsets=widths.map(([x,z])=>[(x-cx)*cos-(z-cz)*sin,(x-cx)*sin+(z-cz)*cos]);
  const tw=Math.max(...offsets.map(([x])=>Math.abs(x)))*2+first.m.cw+5, tl=Math.max(...offsets.map(([,z])=>Math.abs(z)))*2+first.m.cl+6;
  const upper=polyRect(cx,cz,tw+8,tl+8,ang);
  // Host shell sits immediately below court datum without changing calibrated court/camera heights.
  if(cfg.id==='ctx-zhujiang'){
   const p=polyRect(cx,cz,tw+13,tl+14,ang);
   shell(p,ground-.19,-.9,0xd9dcd4,0xc6cfc8);
   const stripMaterials=[0xaabdbb,0xd8ded3,0xbdcbc4,0xdce3d7,0xc3d0c9];
   for(let i=0;i<5;i++){
    const y=ground+(i+.55)*(raise-1)/5;
    box(group,stripMaterials[i],tw+13.2,.57,tl+14.2,cx,y,cz,.861,ang);
   }
   shell(upper,-.9,-.19,0xd4decd,0x91a99d,.87);
  } else {
   const p=cfg.data.host?local(cfg.data.host):polyRect(cx,cz,tw+76,tl+37,ang);
   shell(p,ground-.19,ground+raise*.50,0xddded2,0xc5ccbf);
   const middle=polyRect(cx-11,cz+6,tw+43,tl+32,ang);
   shell(middle,ground+raise*.50,-5.1,0xe2dfcc,0xd7daca,.86);
   shell(upper,-5.1,-.18,0xd9dfca,0xc5d0c2,.88);
  }
  for(const [x,z] of upper.slice(0,4))nearFitPoints.push(new T.Vector3(x,0,z),new T.Vector3(x,ground,z));
 }
 const lines=cfg.data.bridges.map(local);
 if(bridgeRoof){
  // OSM samples one carriageway axis; draw both adjacent beams across the court strip.
  const court=new T.Vector2(units[0].root.position.x,units[0].root.position.z);
  let nearest=null,distance=Infinity;
  for(const p of lines)for(let i=1;i<p.length;i++){
   const a=new T.Vector2(...p[i-1]), b=new T.Vector2(...p[i]);
   const d=b.clone().sub(a);if(d.lengthSq()<1)continue;
   const along=Math.max(0,Math.min(1,court.clone().sub(a).dot(d)/d.lengthSq()));
   const q=a.clone().addScaledVector(d,along);
   if(q.distanceTo(court)<distance){distance=q.distanceTo(court);nearest=[q,d.normalize()]}
  }
  if(nearest){
   const [axis,d]=nearest,n=new T.Vector2(d.y,-d.x);
   if(court.clone().sub(axis).dot(n)<0)n.negate();
   const mid=axis.clone().addScaledVector(n,11.4);
   const span=112, soffit=8.9, segmentBy=(o,off,t0,t1,w,h,y,clr,layer)=>{
    const A=mid.clone().addScaledVector(n,off).addScaledVector(d,t0).toArray();
    const B=mid.clone().addScaledVector(n,off).addScaledVector(d,t1).toArray();
    segment(A,B,w,h,y,clr,layer,o);
   };
   for(const off of [-11.9,11.9]){
    segmentBy(bridgeRoof,off,-span/2,span/2,22.1,2.1,soffit+1.05,0x9caeac,4.45);
    for(const lx of [-8,-3,3,8])segmentBy(bridgeRoof,off+lx,-span/2,span/2,1.2,.5,soffit-.20,0x849b9a,4.44);
    for(const t of [-42,-21,24,45]){
     const p=mid.clone().addScaledVector(n,off).addScaledVector(d,t);
     const width=4.6, length=4.1;
     if(Math.hypot(p.x-court.x,p.y-court.y)<12)continue;
     box(group,0xa0afaa,width,soffit,length,p.x,soffit/2-.13,p.y,1.1,Math.atan2(d.x,d.y));
     box(group,0xbdc7bc,7,.75,5.5,p.x,soffit-.52,p.y,1.12,Math.atan2(d.x,d.y));
    }
   }
  }
 }else{
  for(const p of lines)for(let i=1;i<p.length;i++)segment(p[i-1],p[i],7.5,.85,ground+5.2,0xa3afac,.81);
 }
 // Illustrative planting uses mapped park footprints and excludes visible paving, water,
 // buildings and play areas. Keep it non-surveyed and stable between camera moves.
 const veg=new T.Group();group.add(veg);
 const masks=Object.fromEntries(Object.entries(cfg.data.surfaces).map(([k,v])=>[k,v.map(poly=>poly.map(local))]));
 masks.buildings=cfg.data.buildings.map(([p,,,,,holes=[]])=>[local(p),...holes.map(local)]);
 if(cfg.data.host)masks.buildings.push([local(cfg.data.host)]);
 const inRing=(x,z,ring)=>{
  let inside=false;
  for(let i=0,j=ring.length-1;i<ring.length;j=i++){
   const [a,b]=ring[i],[c,d]=ring[j];if((b>z)!==(d>z)&&x<(c-a)*(z-b)/(d-b)+a)inside=!inside;
  }
  return inside;
 };
 const tagged=(x,z,className)=>masks[className].some(([outer,...holes])=>inRing(x,z,outer)&&!holes.some(h=>inRing(x,z,h)));
 let seed=0x8ad1;for(const s of cfg.id)seed=Math.imul(seed,31)+s.charCodeAt(0);
 const rand=()=>((seed=(Math.imul(seed,1664525)+1013904223)>>>0)/4294967296);
 const trees=[],colors=[0x426d5e,0x618b66,0x67957d,0x8eab70,0xb0bd7b,0x86a496];
 const range=cfg.id==='7'?125:cfg.id==='20'?145:110;
 const body=units.map(u=>({x:u.root.position.x,z:u.root.position.z,a:u.root.rotation.y,w:u.m.cw,l:u.m.cl}));
 const meters=Math.max(...body.map(q=>Math.hypot(q.x,q.z)),15);
 const free=(x,z,clearance=2.1)=>{
  if(raise&&Math.hypot(x,z)<(cfg.id==='ctx-coco'?38:45))return false;
  if(cfg.id==='ctx-xingbai'&&Math.hypot(x,z)<32)return false;
  if(body.some(c=>{
   const dx=x-c.x,dz=z-c.z,k=Math.cos(c.a),l=Math.sin(c.a);
   return Math.abs(dx*k-dz*l)<c.w/2+clearance+1&&Math.abs(dx*l+dz*k)<c.l/2+clearance+1;
  }))return false;
  return [[0,0],[clearance,0],[-clearance,0],[0,clearance],[0,-clearance]]
   .every(([dx,dz])=>!['water','road','rail','buildings'].some(k=>tagged(x+dx,z+dz,k)));
 };
 const candidate=(x,z)=>free(x,z)&&!trees.some(([a,b])=>Math.hypot(x-a,z-b)<3.6);
 const addTree=(x,z)=>{
  const isDark=rand()<.32,size=rand()*2.2+2.6,round=rand()>.19;
  const h=round?size*.98:size*1.38,w=round?size*.41:size*.27;
  trees.push([x,z]);
  box(veg,0x8d826a,.21,h*.52,.21,x,ground+h*.26,z,3.7);
  const form=round?new T.SphereGeometry(1,9,6):new T.ConeGeometry(1,2,7);
  const crown=new T.Mesh(form,mat(colors[Math.floor(rand()*colors.length)]));
  crown.position.set(x,ground+h*.70,z);crown.scale.set(w,h*.41,w*(isDark?.87:1.04));
  crown.userData.silhouette=round?'round':'spire';veg.add(crown);
  if(round&&rand()>.60){
   const lobe=new T.Mesh(new T.SphereGeometry(1,8,5),mat(colors[Math.floor(rand()*colors.length)]));
   lobe.position.set(x-w*.54,ground+h*.68,z+w*.27);lobe.scale.set(w*.67,h*.32,w*.62);lobe.userData.silhouette='round';veg.add(lobe);
  }
 };
 // Vary organic planting islands independently of the mapped park fill; each island owns
 // its surface and is checked against roads, water, buildings, sports areas and other islands.
 const groves=[], banks=[0xb2c8a0,0xaac4a2,0xc1d3a5,0xc8d7a9,0xa3bfa5];
 for(let i=0;i<220&&body.length&&groves.length<20;i++){
  const c=body[Math.floor(rand()*body.length)], heading=rand()*Math.PI*2;
  const r=23+rand()*(raise?54:36),x=c.x+Math.cos(heading)*r,z=c.z+Math.sin(heading)*r;
  const radius=3.8+rand()*4.9,rz=radius*(.66+rand()*.27),spin=rand()*Math.PI;
  if(!free(x,z,radius*.7)||groves.some(g=>Math.hypot(x-g.x,z-g.z)<radius+g.radius+1.2))continue;
  const ring=[];
  for(let j=0;j<22;j++){
   const a=j/22*Math.PI*2,f=1+.103*Math.sin(a*3+heading)+.05*Math.cos(a*5+spin);
   const u=Math.cos(a)*radius*f,v=Math.sin(a)*rz*f;
   ring.push([x+u*Math.cos(spin)-v*Math.sin(spin),z+u*Math.sin(spin)+v*Math.cos(spin)]);
  }
  if(!ring.every(([u,v])=>free(u,v,.33)))continue;
  groves.push({x,z,radius});
  plane(ring,ground-.109,banks[Math.floor(rand()*banks.length)],.48);
  for(let j=0;j<10&&trees.length<72;j++){
   const a=rand()*Math.PI*2,p=rand()*.62*radius,u=x+Math.cos(a)*p,v=z+Math.sin(a)*p*.78;
   if(inRing(u,v,ring)&&candidate(u,v))addTree(u,v);
  }
 }
 for(let i=0;i<350&&trees.length<64;i++){
  const a=rand()*Math.PI*2,r=(meters+range)*Math.sqrt(rand()),x=Math.cos(a)*r,z=Math.sin(a)*r;
  if(tagged(x,z,'park')&&candidate(x,z))addTree(x,z);
 }

 // A continuous peanut silhouette: one softly pinched cloud body, no overlapping shells.
 // Repeat in different world directions so the low baseline views retain a little atmosphere.
 for(let i=0;i<7;i++){
  const heading=(-.82+i/7)*Math.PI*2, r=meters+99+rand()*60;
  const w=8+rand()*7, h=2.2+rand()*1.5, geom=new T.SphereGeometry(1,24,14);
  const p=geom.attributes.position;
  for(let j=0;j<p.count;j++){
   const x=p.getX(j),scale=.65+.52*Math.exp(-Math.pow((Math.abs(x)-.55)/.27,2));
   p.setY(j,p.getY(j)*scale);p.setZ(j,p.getZ(j)*scale);
  }
  p.needsUpdate=true;geom.computeVertexNormals();
  const o=new T.Mesh(geom,mat(i%3===1?0xe0ebeb:0xebf1ee));
  o.position.set(Math.cos(heading)*r,13+rand()*13,Math.sin(heading)*r);
  o.rotation.y=1.1+rand()*.55;o.scale.set(w,h,h*1.23);
  o.userData.silhouette='peanut';veg.add(o);
 }
 if(diagram){
  // Read the waterfront as a landscape system: discreet path/planting rows,
  // with mapped parks, streets and river as the underlying quiet color fields.
  const perimeter=[[-72,33,74,33],[-72,-33,56,-33],[-78,-24,-78,26]];
  for(const [ax,az,bx,bz] of perimeter){
   const L=Math.hypot(bx-ax,bz-az);
   for(let t=0;t<=L;t+=9){
    const x=ax+(bx-ax)*t/L,z=az+(bz-az)*t/L;
    if(candidate(x,z))addTree(x,z);
   }
  }
 }
 const axis=diagram?makeHongchengLandmarks(center):null;
 if(axis)group.add(axis.group);
 if(diagram){
  group.traverse(o=>{
   if(!o.material?.color)return;
   const c=o.material.color, rgb=c.getHex();
   if(o.userData.silhouette==='peanut'){o.visible=false;return}
   if(o.userData.block&&(!o.parent||o.parent!==veg))c.lerp(new T.Color(0xe5e5df),.72);
   if(!o.userData.silhouette&&o.userData.decorLayer>=.70&&o.userData.decorLayer<=.86&&rgb!==0xffffff&&!o.userData.block)c.lerp(new T.Color(0xe1e3dc),.43);
  });
 }
 return {group,raise,nearFitPoints,bridgeRoof,cutawayGroups,groundSpan:axis?Math.max(6200,cfg.groundSpan):cfg.groundSpan,
  axisFocus:axis?.axisFocus,axisFrame:axis?.axisFrame,landmarkLabels:axis?.landmarkLabels};
}
