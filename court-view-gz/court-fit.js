'use strict';
(()=>{
const dims={length:23.77,width:10.97,singles:8.23,service:6.40};
function orientation(ring){
 let best;const base=ring[0];
 for(let i=1;i<ring.length;i++){
  const dx=ring[i][0]-ring[i-1][0],dy=ring[i][1]-ring[i-1][1];if(Math.hypot(dx,dy)<0.5)continue;
  const a=Math.atan2(dy,dx), cos=Math.cos(a), sin=Math.sin(a);
  let X=Infinity,x=-Infinity,Y=Infinity,y=-Infinity;
  for(const [u,v] of ring){const px=(u-base[0])*cos+(v-base[1])*sin,py=-(u-base[0])*sin+(v-base[1])*cos;X=Math.min(X,px);x=Math.max(x,px);Y=Math.min(Y,py);y=Math.max(y,py)}
  const w=x-X,h=y-Y,area=w*h;
  if(!best||best.area>area)best={w,h,area,a,cos,sin,X,Y,base};
 }
 return best;
}
function inside(p,r){let on=false;for(let i=0,j=r.length-1;i<r.length;j=i++){const a=r[i],b=r[j];if((a[1]>p[1])!==(b[1]>p[1])&&p[0]<(b[0]-a[0])*(p[1]-a[1])/(b[1]-a[1])+a[0])on=!on}return on}
function estimate(f,knownCount=null){
 if(!f.pitch||f.p.length!==1||f.p[0].length!==1)return {models:[],options:[]};
 const r=f.p[0][0], rect=orientation(r);
 if(!rect||f.a/rect.area<.83)return {models:[],options:[]};
 const {w,h,a,cos,sin,X,Y,base}=rect; const candidates=[];
 // The Nansha centre court's mapped playing deck includes broad side runoffs.
 // The official tournament uses one centre court, not two narrow inferred courts.
 const broadDeck=/^way\/(106141638[023456789]|188930234|1428179587)$/.test(f.id);
 const maxSingleWidth=broadDeck?26:22, maxSingleLength=broadDeck?47:42;
 if(broadDeck)knownCount=1;
 if(f.id==='way/1428179587')knownCount=1;
 const single=Math.min(w,h)>=10.9&&Math.min(w,h)<=maxSingleWidth&&Math.max(w,h)>=23.7&&Math.max(w,h)<=maxSingleLength;
 for(const flip of [false,true]){
  const width=flip?h:w,len=flip?w:h;
  if(single&&width<=maxSingleWidth&&len>=23.7&&len<=maxSingleLength){
   if(!knownCount||knownCount===1)candidates.push({count:1,cols:1,rows:1,flip,score:0});
   continue
  }
  for(let cols=1;cols<=12;cols++)for(let rows=1;rows<=5;rows++){
   const count=cols*rows, ww=width/cols,ll=len/rows;
   if(count<2||(knownCount&&knownCount!==count)||ww<13.3||ww>21.6||ll<28.5||ll>42)continue;
   candidates.push({count,cols,rows,flip,score:Math.abs(ww-17.1)/4+Math.abs(ll-35.2)/8+rows*.03});
  }
 }
 const admissible=[];
 for(const e of candidates){
  const {cols,rows,flip}=e, models=[], cw=(flip?h:w)/cols, cl=(flip?w:h)/rows;
  const world=(x,y)=>{const px=(flip?y:x)+X,py=(flip?x:y)+Y;return [base[0]+px*cos-py*sin,base[1]+px*sin+py*cos]};
  const angle=(a+(flip?-Math.PI/2:0))*180/Math.PI;
  const halfw=dims.width/2, halfl=dims.length/2;
  for(let j=0;j<rows;j++)for(let i=0;i<cols;i++){
   const cx=(i+.5)*cw,cy=(j+.5)*cl;
   if([[-halfw,-halfl],[halfw,-halfl],[-halfw,halfl],[halfw,halfl]].every(([x,y])=>inside(world(cx+x,cy+y),r))){
    const [x,y]=world(cx,cy);models.push({x,y,angle,cw,cl,estimated:e.count>1});
   }
  }
  if(models.length===e.count)admissible.push({...e,models});
 }
 const options=[...new Set(admissible.map(k=>k.count))].sort((a,b)=>a-b), best=admissible.sort((x,y)=>x.score-y.score)[0];
 return {models:best?.models||[],options};
}
// Irregular groups: fit court-sized cells against the mapped polygon.
function bands(f,knownCount=null){
 if(!f.pitch||f.p.length!==1||f.p[0].length!==1)return [];
 const ring=f.p[0][0],b=orientation(ring); if(!b||f.a>43000)return [];
 const {w,h,a,cos,sin,X,Y,base}=b;
 function template(rows,flip=false){
  const world=(x,y)=>{const px=(flip?y:x)+X,py=(flip?x:y)+Y;return [base[0]+px*cos-py*sin,base[1]+px*sin+py*cos]};
  const angle=(a-(flip?Math.PI/2:0))*180/Math.PI;
  return rows.map(([u,v,cw,cl])=>{const [x,y]=world(u,v);return {x,y,cw,cl,angle,estimated:true}});
 }
 // 9 in the published inventory. The aerial confirms the row directions and
 // the front pair; the tree-obscured row is schematic, not a measured survey.
 if(f.id==='way/347798956'){
  // This way runs around the polygon clockwise, so use the long northeast edge as the datum.
  const start=ring[1],end=ring[2],angle=Math.atan2(end[1]-start[1],end[0]-start[0]);
  const xy=(u,v)=>({x:start[0]+u*Math.cos(angle)-v*Math.sin(angle),y:start[1]+u*Math.sin(angle)+v*Math.cos(angle),cw:16.8,cl:30.3,angle:angle*180/Math.PI,estimated:true});
  return [...Array.from({length:7},(_,i)=>xy(12+i*16.8,16.2)),xy(81,51.8),xy(98.2,51.8)];
 }
 let best=null;
 for(const flip of [false,true]){
  const width=flip?h:w,length=flip?w:h;
  if(width<13||length<26)continue;
  const world=(x,y)=>{const px=(flip?y:x)+X,py=(flip?x:y)+Y;return [base[0]+px*cos-py*sin,base[1]+px*sin+py*cos]};
  for(const cw of [17,15.5,18.5,14])for(const cl of [33,30,35.5,28])for(const dx of [0,.25,.5,.75])for(const dy of [0,.25,.5,.75]){
   const cells=[];
   for(let v=cl/2+dy*cl;v<=length-cl/2+.15;v+=cl)for(let u=cw/2+dx*cw;u<=width-cw/2+.15;u+=cw){
    // Test corners and edge midpoints, not just the center of an L shape.
    const c=cw/2-.09,l=cl/2-.09;
    if([[-c,-l],[0,-l],[c,-l],[-c,0],[c,0],[-c,l],[0,l],[c,l]].every(([x,y])=>inside(world(u+x,v+y),ring)))
      cells.push([u,v,cw,cl]);
   }
   if(cells.length<2||knownCount&&cells.length!==knownCount)continue;
   const score=cells.length*5-Math.abs(cw-17)*.9-Math.abs(cl-33)*.45;
   if(!best||score>best.score)best={cells,flip,score};
  }
 }
 return best?template(best.cells,best.flip):[];
}
function paintedCourt(f){
 if(!f.pitch||f.p.length!==1||f.p[0].length!==1)return [];
 const r=f.p[0][0],q=orientation(r);
 if(!q||f.a/q.area<.91)return [];
 const cw=Math.min(q.w,q.h),cl=Math.max(q.w,q.h);
 if(cw<8.15||cw>12.5||cl<22||cl>25.6||cl/cw<1.8)return [];
 const [x,y]=[q.base[0]+(q.X+q.w/2)*q.cos-(q.Y+q.h/2)*q.sin,q.base[1]+(q.X+q.w/2)*q.sin+(q.Y+q.h/2)*q.cos];
 return [{x,y,cw,cl,angle:(q.a-(q.w>q.h?Math.PI/2:0))*180/Math.PI,estimated:false,lineScale:Math.min((cw-.3)/dims.width,(cl-.3)/dims.length,1)}];
}
function layoutFor(f,knownCount){
 const exact=estimate(f,knownCount).models;
 if(exact.length)return exact;
 const painted=(!knownCount||knownCount===1)?paintedCourt(f):[];
 return painted.length?painted:bands(f,knownCount);
}
if(typeof module!=='undefined')module.exports={estimate,layoutFor,dims};else window.COURT_FIT={estimate,layoutFor,dims};
})();
