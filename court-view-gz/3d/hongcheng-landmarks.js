import * as T from './three.module.js';
import data from './hongcheng-landmarks-data.js';
import inlays from './hongcheng-axis-inlays.js';

// City silhouettes, not survey geometry. Landmark bases and Flower City Square follow OSM footprints.
// Heights: CTBUH/KPF (530 m and 438.6 m), Visit Guangzhou (600 m); Haixinsha owner + engineering team.
export const hongchengReplacedIds=new Set(['184738716','299687657','584204634','14379652','240896445','10061850','312876745','240896441','240896442','4447355','9957571','240402424']);
export function makeHongchengLandmarks(center){
 const group=new T.Group(), landmarkLabels=[];
 const v=(x,y,z)=>new T.Vector3(x-center[0],y,z-center[1]);
 const m=new Map(), mat=c=>{if(!m.has(c))m.set(c,new T.MeshStandardMaterial({color:c,side:T.DoubleSide,roughness:.85,flatShading:true}));return m.get(c)};
 const block=(x,y,z,layer=.79)=>({center:v(x,y,z),layer});
 const mesh=(geo,c,position,b,layer=.79)=>{
  const o=new T.Mesh(geo,mat(c));o.position.copy(position);o.userData.decorLayer=layer;if(b)o.userData.block=b;group.add(o);return o;
 };
 const box=(x,y,z,w,h,l,c,b)=>mesh(new T.BoxGeometry(w,h,l),c,v(x,y,z),b);
 const trim=ring=>ring.length>2&&ring[0][0]===ring.at(-1)[0]&&ring[0][1]===ring.at(-1)[1]?ring.slice(0,-1):ring;
 const O=id=>trim(data[id][0]);
 const ring=(x,z,w,d)=>[[x-w/2,z-d/2],[x+w/2,z-d/2],[x+w/2,z+d/2],[x-w/2,z+d/2]];
 const plane=(points,y,c,b,layer=.80,holes=[])=>{
  const project=p=>p.map(([x,z])=>new T.Vector2(x-center[0],center[1]-z));
  const shape=new T.Shape(project(points));
  shape.holes=holes.map(h=>new T.Path(project(h)));
  const o=mesh(new T.ShapeGeometry(shape),c,new T.Vector3(0,y,0),b,layer);
  o.rotation.x=-Math.PI/2;return o;
 };
 const quad=(q,c,b)=>{
  const p=q.map(([x,y,z])=>v(x,y,z));const o=new T.BufferGeometry();
  o.setAttribute('position',new T.Float32BufferAttribute(p.flatMap(v=>v.toArray()),3));o.setIndex([0,1,2,0,2,3]);o.computeVertexNormals();
  const shape=mesh(o,c,new T.Vector3(),b);shape.userData.projectionFace=p;return shape;
 };
 const wall=(a,b,lo,hi,c,g)=>{
  const [x,z]=a,[r,s]=b;const w=Math.hypot(r-x,s-z);
  if(w<.05)return;
  const o=mesh(new T.PlaneGeometry(w,hi-lo),c,v((x+r)/2,(lo+hi)/2,(z+s)/2),g);
  o.rotation.y=-Math.atan2(s-z,r-x);
 };
 const shell=(r,lo,hi,top,sides,g,cap=true)=>{
  r.forEach((p,i)=>wall(p,r[(i+1)%r.length],lo,hi,sides[i%sides.length],g));if(cap)plane(r,hi,top,g);
 };
 const beam=(a,b,w,c,g=null)=>{
  const A=v(...a),B=v(...b),d=B.clone().sub(A);
  const o=mesh(new T.BoxGeometry(w,d.length(),w),c,A.addScaledVector(d,.5),g,.82);
  o.quaternion.setFromUnitVectors(new T.Vector3(0,1,0),d.normalize());return o;
 };
 const label=(caption,x,y,z)=>landmarkLabels.push({caption,point:v(x,y,z)});

 // Planted promenade: cadastral-style green silhouette, pale pedestrian spine and garden rooms.
 for(const [color,[outer,...holes]] of inlays)plane(outer,.018,color,null,.46,holes);
 label('花城广场',27513,6,91485);

 // IFC west tower: rounded triangular diagrid with the slight swelling in section.
 const west=O('184738716'), WX=27376,WZ=91279.8, WH=438.6,W=block(WX,WH*.52,WZ);
 const wr=s=>west.map(([x,z])=>[WX+s*(x-WX),WZ+s*(z-WZ)]);
 const westLevels=[[0,1],[74,1.06],[176,1.12],[271,1.10],[353,1],[425,.86],[438.6,.82]];
 for(let i=1;i<westLevels.length;i++){
  const [h0,s0]=westLevels[i-1],[h1,s1]=westLevels[i],lo=wr(s0),hi=wr(s1);
  lo.forEach(([x,z],j)=>{const k=(j+1)%lo.length;
   quad([[x,h0,z],[lo[k][0],h0,lo[k][1]],[hi[k][0],h1,hi[k][1]],[hi[j][0],h1,hi[j][1]]],[0x648990,0x7c9fa2,0x92aeb0,0x6e949b][j%4],W);
  });
 }
 const waist=(y,i,f=.5)=>{
  let j=westLevels.findIndex(([h])=>h>=y);if(j<=0)j=1;
  const [l,a]=westLevels[j-1],[h,b]=westLevels[j],r=wr(a+(b-a)*Math.max(0,(y-l)/(h-l)));
  return [r[i][0]*(1-f)+r[(i+1)%r.length][0]*f,y,r[i][1]*(1-f)+r[(i+1)%r.length][1]*f];
 };
 const outside=([x,y,z])=>[WX+(x-WX)*1.035,y,WZ+(z-WZ)*1.035];
 for(let h=0;h<425;h+=56)
  for(let i=0;i<west.length;i+=2){
   const j=(i+1)%west.length;
   beam(outside(waist(h,i)),outside(waist(Math.min(425,h+56),j)),.76,0xb2c8c7,W);
   beam(outside(waist(h,j)),outside(waist(Math.min(425,h+56),i)),.76,0xb2c8c7,W);
  }
 plane(wr(.82),WH,0xc7d4ce,W);
 label('西塔 · 广州国际金融中心',WX,WH,WZ);

 // CTF east tower: large map footprint is the low four-storey podium, not entire 530 m shaft.
 // Subdivided office/residence/hotel/crown. Setback heights and tower position inside podium are approximated.
 const EX=27664,EZ=91260,EH=530,E=block(EX,262,EZ);
 shell(O('299687657'),-.07,19,0xafc3c0,[0xa6b9b6,0x96aba9],E);
 const eastLevels=[[19,212,65,59,0,0],[212,330,61,54,2,-2],[330,442,57,49,4,-4],[442,508,53,44,5,-6],[508,530,46,39,7,-8]];
 for(const [lo,hi,w,l,dx,dz] of eastLevels){
  const x=EX+dx,z=EZ+dz;
  shell(ring(x,z,w,l),lo,hi,0xbacbc8,[0x8caeae,0x779fa6,0x85acac,0xa1b8b6],E);
  for(let i=-2;i<=2;i++){
   box(x+i*w/6,(hi+lo)/2,z+l/2+.13,.67,hi-lo,.45,0xd0dfdb,E);
   box(x-w/2-.13,(hi+lo)/2,z+i*l/6,.45,hi-lo,.67,0xc1d1cf,E);
  }
 }
 label('东塔 · 广州周大福金融中心',EX+7,EH,EZ-8);

 // Canton Tower: open rotating elliptic lattice, 24 columns finishing at the 450 m body;
 // 150 m mast above. Use tapered profiles rather than a cylinder or filled cone.
 const TX=27523.6,TZ=92525.1, TH=450, TAU=Math.PI*2;
 const ct=(y,i)=>{
  const s=y/TH, theta=TAU*i/24, a=35*(1-s)+22*s, b=24*(1-s)+14*s;
  const p=[Math.cos(theta)*a,Math.sin(theta)*b];
  // Strong narrow waist and gradual re-expansion; tower shape deliberately low-poly.
  const pinch=.40+.60*Math.pow(Math.abs(2*s-1),1.82), rot=-.08+s*Math.PI/4;
  return [TX+(p[0]*Math.cos(rot)-p[1]*Math.sin(rot))*pinch,y,TZ+(p[0]*Math.sin(rot)+p[1]*Math.cos(rot))*pinch];
 };
 shell(O('584204634'),-.04,7.5,0xd7d9d1,[0xb2c2bf,0xc5ccc5],block(TX,4,TZ));
 const levels=[8,51,97,143,191,238,283,328,374,413,450];
 for(let j=0;j<levels.length-1;j++){
  const a=levels[j],b=levels[j+1];
  for(let i=0;i<24;i++){
   beam(ct(a,i),ct(b,i),1.54,0xe6ece5);
   if(i%2===j%2)beam(ct(a,i),ct(b,i+1),.89,0xb1c4c4);
  }
 }
 for(const level of levels)
  for(let i=0;i<24;i+=2)beam(ct(level,i),ct(level,i+2),1.01,0xd7e1dd);
 box(TX,503,TZ,5.3,106,5.3,0xdce7df);
 box(TX,569,TZ,2.6,62,2.6,0xecefe6);
 box(TX,567,TZ,2.9,5.4,2.9,0xb88578);
 label('广州塔',TX,600,TZ);

 // Haixinsha: actual OSM stand and canopy outlines, stepped bowl facing east, tensile roof,
 // a low central stage and a pair of water basins. Masts shown in lowered-screen configuration.
 const HX=27261,HZ=91956,H=block(HX,22,HZ);
 shell(O('14379652'),-.05,6,0xe0ddd0,[0xbabfb7,0xcdd0c5],H);
 const stand=O('240896445');
 const nroof=([x,z])=>[x,43+13*(1-Math.min(1,Math.abs(z-HZ)/91))-(x-27303)*.10,z];
 const roofCenter=nroof([27306,91959]);
 stand.forEach((p,j)=>{const q=stand[(j+1)%stand.length];quad([roofCenter,nroof(p),nroof(q),roofCenter],[0xdce3da,0xd1ddd4,0xc7d4cd][j%3],H);});
 for(let i=0;i<8;i++){
  const s=i/7, x=27264+6.7*i, len=155-32*s;
  box(x,((30-21*s)+6)/2,HZ,6.66,24-21*s,len,[0x91a5a3,0xa4b4af][i%2],H);
 }
 for(const z of [91894,91914,91934,91955,91976,91996,92019]){
  beam([27261,8,z],[27247,51,z],1.65,0xa7bab6);
  beam([27247,51,z],[27335,49,z],.9,0xb7c6be);
 }
 const stage=block(27408,4,HZ);
 shell(ring(27404,91956,114,107),-.04,2.5,0xc7d6d3,[0xa6bebb,0xd1d7c6],stage);
 plane(ring(27411,91956,77,61),2.59,0xa9bcc2,stage);
 for(const id of ['511475341','511475342'])plane(O(id),-.027,0x88b5bf,null,.52);
 for(const z of [91904,91938,91974,92008]){
  const x=27494;
  beam([x,0,z],[x,84,z],1.35,0x9aafa8);
  beam([x,56,z-8],[x,56,z+8],.9,0xabbdb2);
  beam([x,80,z-7],[x,80,z+7],.9,0xcbd6cd);
 }
 label('海心沙亚运主会场',27286,57,HZ);

 // Civic buildings give the axis a recognizable low-rise frame instead of generic skyline blocks.
 const OP=block(27291,17,91547);const opera=O('10061850');
 const peak=[27289,35,91548];opera.forEach(([x,z],i)=>{const [a,b]=opera[(i+1)%opera.length];
  quad([[x,0,z],[a,0,b],peak,peak],[0xa7b6b3,0xbec7be,0xc4cdc1,0x99aeac][i%4],OP);
 });
 const M=block(27742,19,91590);
 shell(O('240896442'),-.04,30,0x827c76,[0x716e68,0x7d7770,0x827873],M);
 for(const i of [-1,0,1])box(27739+i*24,15+i*4,91645,17,2.1,1,0x9c5348,M);
 const LI=block(27661,18,91426);
 shell(O('240896441'),-.04,24,0xd5dccf,[0xa1b9b6,0xbacac3],LI);
 shell(ring(27662,91426,96,49),24,36,0xe2e5d7,[0xc4d1c7,0xa0b9b7],LI);
 shell(O('312876745'),-.03,19,0xd2dccd,[0xa7bcb5,0xb8ccc1],block(27358,13,91412));

 // Northern anchor: Tianhe's historic three-venue complex, with the main stadium bowl opening to sky.
 const SX=27490.7,SZ=89035.5,S=block(SX,14,SZ);
 plane(O('51424326'),-.099,0xc4cdb3,null,.42);
 const out=O('4447355'), inner=p=>p.map(([x,z])=>[SX+(x-SX)*.62,SZ+(z-SZ)*.71]);
 const rim=inner(out);
 out.forEach(([x,z],j)=>{
  const k=(j+1)%out.length,[p,q]=out[k], a=27+4*Math.pow(Math.abs((z-SZ)/124),1.8), b=27+4*Math.pow(Math.abs((q-SZ)/124),1.8);
  const [ix,iz]=rim[j],[jx,jz]=rim[k];
  quad([[x,.01,z],[p,.01,q],[p,b,q],[x,a,z]],[0xb0bcb1,0xc2c8bc][j%2],S);
  quad([[x,a,z],[p,b,q],[jx,12,jz],[ix,12,iz]],[0xd9d8c8,0xc6cbbd][j%2],S);
  quad([[ix,12,iz],[jx,12,jz],[jx,1,jz],[ix,1,iz]],0x91a5a2,S);
 });
 plane(O('3987392'),.16,0xba8f79,S);
 plane(O('299844459'),.23,0x6f9b65,S);
 shell(O('9957571'),.02,16,0xc6d0c3,[0xa8bdb6,0xb9c7bd],block(27254,8,88962));
 shell(O('240402424'),.02,15,0xcfd6cc,[0xa2bdb8,0xb2c5bb],block(27676,8,89348));
 plane(O('313828793'),.17,0x8bad79,null,.54);
 label('天河体育中心',SX,34,SZ);
 const axisFocus=v(27512,160,91829);
 return {group,axisFocus,landmarkLabels};
}
