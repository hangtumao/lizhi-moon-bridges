// Shared, deterministic world-space plan for the illustrated (not surveyed) landscape.
export const greens=[0x567d6b,0x67987c,0x91aa70,0xabc17e,0x426e62,0x719c90,0xb9c887];
export const grassBanks=[0xb5c9a2,0xc6d5ac,0xafc8ac];
export const grassShadow=0xa3b99b;
export function landscapePlan(models,variant){
 if(!models.length)return {patches:[],parts:[],trunks:[],far:70};
 const patches=[],parts=[],trunks=[];
 const a=models[0].angle*Math.PI/180,c=Math.cos(a),s=Math.sin(a);
 const local=(x,z)=>[c*x+s*z,-s*x+c*z];
 const world=(x,z)=>[c*x-s*z,s*x+c*z];
 const bounds=models.map(u=>{
  const [x,z]=local(u.x,u.y),delta=u.angle*Math.PI/180-a;
  const wd=(Math.abs(Math.cos(delta))*u.cw+Math.abs(Math.sin(delta))*u.cl)/2;
  const ln=(Math.abs(Math.cos(delta))*u.cl+Math.abs(Math.sin(delta))*u.cw)/2;
  return [x-wd,z-ln,x+wd,z+ln];
 });
 const x0=Math.min(...bounds.map(b=>b[0])),z0=Math.min(...bounds.map(b=>b[1]));
 const x1=Math.max(...bounds.map(b=>b[2])),z1=Math.max(...bounds.map(b=>b[3]));
 const match=(x,z,r)=>bounds.some(([l,t,h,b])=>x+r>l&&x-r<h&&z+r>t&&z-r<b);
 let seed=variant.split('').reduce((n,k)=>Math.imul(n^k.charCodeAt(0),16777619),2166136261)>>>0;
 const r=()=>((seed=(Math.imul(seed,1664525)+1013904223)>>>0)/4294967296);
 const objects=[];
 function patch(x,z,rx,rz,mat,y,stage){
  const pts=[];
  for(let i=0;i<22;i++){
   const q=i/22*Math.PI*2,f=1+.09*Math.sin(q*3+x)+.05*Math.cos(q*5-z);
   const [px,pz]=world(x+rx*f*Math.cos(q),z+rz*f*Math.sin(q));pts.push([px,pz]);
  }
  patches.push({pts,mat,y,stage});
 }
 function crown(x,y,z,sx,sy,sz,mat,kind){
  parts.push({x,y,z,sx,sy,sz,mat,kind,rotation:r()*Math.PI});
 }
 function tree(x,z,k){
  const t=1+r()*2.65,h=2.5+t*1.5, w=k===0?t*.58:t*.79;
  if(match(x,z,w+4)||objects.some(([X,Z,W])=>Math.hypot(X-x,Z-z)<(W+w)*.7))return;
  const [X,Z]=world(x,z);objects.push([x,z,w]);
  patch(x+w*.45,z+w*.3,w*1.21,w*.65,grassShadow,-.164,.68);
  trunks.push({x:X,z:Z,h,w:.11+t*.078});
  const c=greens[Math.floor(r()*greens.length)];
  crown(X,h*.56,Z,w,h*.38,w*.88,c,k===0?'spire':'round');
  if(k===2){
   crown(X-w*.57,h*.53,Z+w*.13,w*.56,h*.24,w*.58,greens[(Math.floor(r()*5)+1)],'round');
   crown(X+w*.48,h*.64,Z-w*.12,w*.57,h*.22,w*.58,c,'round');
  }
 }
 // Staggered groves grow out of the gaps left by the visible court footprints.
 const along=[x1-x0,z1-z0], main=along[0]>along[1]?0:1;
 for(let side=0;side<4;side++){
  const row=side<2,i=side%2, len=row?along[0]:along[1];
  const count=Math.max(2,Math.min(8,Math.round(len/19)+1));
  for(let j=0;j<count;j++){
   if(side===main&&j===Math.floor(count/2))continue;
   const at=(j+.28+r()*.45)/count,off=9+r()*8;
   const x=row?x0+len*at:(i===0?x0-off:x1+off);
   const z=row?(i===0?z0-off:z1+off):z0+len*at;
   patch(x,z,4+r()*6,4+r()*6,grassBanks[(side+j)%grassBanks.length],-.197+(side+j)*.0006,.59+(side+j)*.001);
   for(let n=0;n<5;n++)tree(x+(r()-.5)*15,z+(r()-.5)*14,Math.floor(r()*3));
  }
 }
 return {patches,parts,trunks,far:Math.max(along[0],along[1],70)};
}
