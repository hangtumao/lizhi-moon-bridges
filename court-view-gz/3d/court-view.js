import * as T from './three.module.js';
import {OrbitControls} from './OrbitControls.js';
import {makeLandscape} from './landscape.js';
import {venueContext,makeVenueContext} from './venue-context.js?v=21';

// CPU projection maintains the same model, camera and selection when WebGL is unavailable.
function canvasRenderer() {
 const domElement=document.createElement('canvas'), ctx=domElement.getContext('2d');
 const toCamera=new T.Matrix4(), p=new T.Vector3(), bg=new T.Color();
 const faces=[[[0,2,3,1],.86],[[4,5,7,6],.92],[[0,1,5,4],.83],[[2,6,7,3],1.04],[[0,4,6,2],.89],[[1,3,7,5],.95]];
 let w=1,h=1,dpr=1;
 function setPixelRatio(r){dpr=Math.min(1.5,r)}
 function setSize(x,y){w=x;h=y;domElement.width=Math.round(w*dpr);domElement.height=Math.round(h*dpr);ctx.setTransform(dpr,0,0,dpr,0,0)}
 function render(scene,camera){
  scene.updateMatrixWorld(true);camera.updateMatrixWorld(true);
  const records=[], crowns=[], near=camera.near, focal=h/(2*Math.tan(T.MathUtils.degToRad(camera.fov/2)));
  let block=null;const blockDepth=new Map();
  function polygon(ps,mat,shade,layer,holes=[]){
   function clip(ps){
   const clipped=[];
   for(let i=0;i<ps.length;i++){
    const a=ps[i],b=ps[(i+1)%ps.length], ai=a[2]<=-near,bi=b[2]<=-near;
    if(ai)clipped.push(a);
    if(ai!==bi){const t=(-near-a[2])/(b[2]-a[2]);clipped.push([a[0]+(b[0]-a[0])*t,a[1]+(b[1]-a[1])*t,-near])}
   }
   return clipped.map(([x,y,z])=>[w/2-x*focal/z,h/2+y*focal/z]);
   }
   const outer=clip(ps);if(outer.length<3)return;
   const depth=ps.reduce((v,q)=>v+q[2],0)/ps.length;
   if(block&&!blockDepth.has(block))blockDepth.set(block,block.center.clone().applyMatrix4(camera.matrixWorldInverse).z);
   records.push({ps:outer,holes:holes.map(clip).filter(p=>p.length>=3),depth,block,order:blockDepth.get(block)??depth,mat,shade,layer:block?.layer??layer,roofWeight:block?layer-block.layer:0});
  }
  scene.traverseVisible(o=>{
   if(!o.isMesh)return;
   block=o.userData.block||null;
   const g=o.geometry;toCamera.multiplyMatrices(camera.matrixWorldInverse,o.matrixWorld);
   const transform=(x,y,z)=>p.set(x,y,z).applyMatrix4(toCamera).toArray();
   if(o.userData.projectionFace){
    polygon(o.userData.projectionFace.map(({x,y,z})=>transform(x,y,z)),o.material,1,o.userData.decorLayer??.79);return;
   }
   if(o.userData.silhouette){
    const [x,y,z]=transform(0,0,0);if(z>=-near)return;
    const cx=w/2-x*focal/z,cy=h/2+y*focal/z,rx=-o.scale.x*focal/z,ry=-o.scale.y*focal/z;
    if(cx+rx<0||cx-rx>w||cy+ry<0||cy-ry>h)return;
    crowns.push({cx,cy,rx,ry,z,kind:o.userData.silhouette,mat:o.material});return;
   }
   if(g.type==='BoxGeometry'){
    const {width,height,depth}=g.parameters;
    const a=[];
    for(const x of [-width/2,width/2])for(const y of [-height/2,height/2])for(const z of [-depth/2,depth/2])a.push(transform(x,y,z));
    const layer=o.userData.decorLayer??(o.material===scene.userData.ground?0:height<.02?3:height<.04&&depth>1?2:o.position.y>.2||height>.5?4:1);
    if(layer===2||layer===3){polygon(faces[3][0].map(i=>a[i]),o.material,1,layer)}
    else for(const [ids,shade] of faces)polygon(ids.map(i=>a[i]),o.material,shade,layer);
   } else if(g.type==='PlaneGeometry'){
    const {width,height}=g.parameters;
    polygon([transform(-width/2,-height/2,0),transform(width/2,-height/2,0),transform(width/2,height/2,0),transform(-width/2,height/2,0)],o.material,1,o.userData.decorLayer??4);
   } else if(g.type==='ShapeGeometry'){
    const shape=g.parameters.shapes,path=r=>r.getPoints().map(q=>transform(q.x,q.y,0));
    polygon(path(shape),o.material,1,o.userData.decorLayer??.5,shape.holes.map(path));
   }
  });
  const diagram=scene.userData.diagram;
  const sky=ctx.createLinearGradient(0,0,0,h);sky.addColorStop(0,'#c4dce6');sky.addColorStop(1,'#ecf2e7');ctx.fillStyle=diagram?'#f4f6f3':sky;ctx.fillRect(0,0,w,h);
  function paintCrown({cx,cy,rx,ry,kind,mat}){
   const fill=ctx.createLinearGradient(cx-rx,cy-ry,cx+rx,cy+ry);fill.addColorStop(0,bg.copy(mat.color).multiplyScalar(kind==='peanut'?1.13:1.11).getStyle());fill.addColorStop(1,bg.copy(mat.color).multiplyScalar(kind==='peanut'?.92:.76).getStyle());
   ctx.fillStyle=diagram?mat.color.getStyle():fill;ctx.beginPath();
   if(kind==='spire'){ctx.moveTo(cx,cy-ry);ctx.quadraticCurveTo(cx+rx*.52,cy-ry*.04,cx+rx*.91,cy+ry*.68);ctx.quadraticCurveTo(cx,cy+ry,cx-rx*.91,cy+ry*.68);ctx.quadraticCurveTo(cx-rx*.53,cy-ry*.04,cx,cy-ry);}
   else if(kind==='peanut'){
    ctx.moveTo(cx-rx,cy);ctx.bezierCurveTo(cx-rx,cy-ry,cx-rx*.60,cy-ry*1.22,cx-rx*.32,cy-ry*.76);
    ctx.bezierCurveTo(cx-rx*.02,cy-ry*.29,cx+rx*.07,cy-ry*.48,cx+rx*.28,cy-ry*.81);
    ctx.bezierCurveTo(cx+rx*.71,cy-ry*1.35,cx+rx,cy-ry*.63,cx+rx,cy);
    ctx.bezierCurveTo(cx+rx,cy+ry*.85,cx+rx*.56,cy+ry*1.22,cx+rx*.26,cy+ry*.75);
    ctx.bezierCurveTo(cx+rx*.03,cy+ry*.39,cx-rx*.01,cy+ry*.35,cx-rx*.29,cy+ry*.77);
    ctx.bezierCurveTo(cx-rx*.65,cy+ry*1.25,cx-rx,cy+ry*.69,cx-rx,cy);
   }else ctx.ellipse(cx,cy,rx,ry,kind==='cloud'?-.1:.12,0,Math.PI*2);
   ctx.closePath();ctx.fill();
  }
  records.sort((a,b)=>a.layer-b.layer||a.order-b.order||a.roofWeight-b.roofWeight||a.depth-b.depth);
  crowns.sort((a,b)=>a.z-b.z);
  let paintedClouds=false;
  for(const {ps,holes,mat,shade,layer} of records){
   if(!paintedClouds&&layer>.7){ctx.globalAlpha=1;crowns.filter(c=>c.kind==='peanut').forEach(paintCrown);paintedClouds=true;}
   ctx.beginPath();
   for(const parts of [ps,...holes]){ctx.moveTo(...parts[0]);for(let i=1;i<parts.length;i++)ctx.lineTo(...parts[i]);ctx.closePath();}
   ctx.globalAlpha=mat.opacity;ctx.fillStyle=bg.copy(mat.color).multiplyScalar(shade).getStyle();ctx.fill('evenodd');
   if(diagram&&layer>=.72&&layer<=.92){ctx.lineWidth=.38;ctx.strokeStyle='#727e7638';ctx.stroke()}
  }
  ctx.globalAlpha=1;
  crowns.filter(c=>c.kind!=='peanut'||!paintedClouds).forEach(paintCrown);
 }
 return {domElement,setPixelRatio,setSize,render};
}

export function makeViewer(host,choose) {
 let renderer;
 try{renderer=new T.WebGLRenderer({antialias:true,alpha:false,powerPreference:'low-power'})}catch{renderer=canvasRenderer()}
 renderer.setPixelRatio(Math.min(devicePixelRatio||1,1.65));
 const canvas=renderer.domElement;
 canvas.setAttribute('aria-label','可拖动旋转的球场模型');
 host.prepend(canvas);
 const scene=new T.Scene(); scene.background=new T.Color('#d4e6ec');
 const camera=new T.PerspectiveCamera(46,1,.12,2400);
 const controls=new OrbitControls(camera,canvas);
 controls.minPolarAngle=.05; controls.maxPolarAngle=Math.PI*.493;
 controls.minDistance=1.4; controls.maxDistance=850;
 controls.enableDamping=false;
 const light=new T.HemisphereLight(0xffffff,0x779181,2.08);scene.add(light);
 const sun=new T.DirectionalLight(0xffffff,1.75);sun.position.set(-40,80,45);scene.add(sun);
 const stage=new T.Group();scene.add(stage);
 const rx=new T.Raycaster();let units=[],center=[0,0],extent=60,signature='',canvasW=0,canvasH=0,current=0,mode='overview',decor=null,decorOn=true,fitPoints=[],bridgeRoof=null,cutawayGroups=[],ground=null,axisFocus=null,axisFrame=null,landmarkLabels=[];
 const mat=(color,opts={})=>new T.MeshStandardMaterial({color,roughness:.92,...opts});
 const neutral={grass:mat(0xdbe7c7),deck:mat(0xadc5ae),deckFocus:mat(0x84ac92),surface:mat(0x40857d),focus:mat(0x286b5d),line:new T.MeshBasicMaterial({color:0xf2f8ed}),dark:mat(0x30564e),net:mat(0x294d49,{transparent:true,opacity:.54,side:T.DoubleSide}),site:mat(0xc3d4b7)};
 const style={...neutral,grass:mat(0xe9ede4),deck:mat(0xe7b188),deckFocus:mat(0xf4bd90),surface:mat(0xad543c),focus:mat(0xc95231),dark:mat(0x674339),line:new T.MeshBasicMaterial({color:0xfff9ef})};
 const indoor={deck:mat(0x9eadd0),deckFocus:mat(0xa0b6dc),floor:mat(0x617aa6),focus:mat(0x375d9e)};
 const cover={deck:mat(0xcebd94),deckFocus:mat(0xdac087),floor:mat(0x918059),focus:mat(0x7b653f)};
 let materials=neutral;
 scene.userData.ground=materials.grass;
 function unitMat(kind){return kind==='indoor'?indoor:kind==='sheltered'||kind==='bridge'?cover:{deck:materials.deck,deckFocus:materials.deckFocus,floor:materials.surface,focus:materials.focus}}
 function box(root,w,h,l,x,y,z,m){const o=new T.Mesh(new T.BoxGeometry(w,h,l),m);o.position.set(x,y,z);root.add(o);return o;}
 function stripe(root,x1,z1,x2,z2){const x=x2-x1,z=z2-z1;const b=box(root,.055,.013,Math.hypot(x,z),(x1+x2)/2,.164,(z1+z2)/2,materials.line);b.rotation.y=Math.atan2(x,z);}
 function addCourt(q,seq){
  const m=q.m,k=m.lineScale||1, w=10.97*k,l=23.77*k,s=8.23*k,v=6.4*k;
  const root=new T.Group();root.position.set(m.x-center[0],0,m.y-center[1]);root.rotation.y=-m.angle*Math.PI/180;stage.add(root);
  const skin=unitMat(q.type);
  const deck=box(root,m.cw-.12,.28,m.cl-.12,0,0,0,skin.deck);
  const floor=box(root,w+.12,.035,l+.12,0,.144,0,skin.floor);
  deck.userData.idx=seq;floor.userData.idx=seq;
  for(const sign of [-1,1]){
   stripe(root,-w/2,sign*l/2,w/2,sign*l/2);
   stripe(root,sign*w/2,-l/2,sign*w/2,l/2);
   stripe(root,sign*s/2,-l/2,sign*s/2,l/2);
   stripe(root,-s/2,sign*v,s/2,sign*v);
   box(root,.08,1.08,.08,sign*(w/2+.68),.68,0,materials.dark);
  }
  stripe(root,0,-v,0,v);
  const net=new T.Mesh(new T.PlaneGeometry(w+1.36,.92),materials.net);net.position.set(0,.66,0);root.add(net);
  box(root,w+1.36,.045,.035,0,1.13,0,materials.line);
  const label=document.createElement('span');label.className='court-marker';label.textContent=seq+1;label.dataset.type=q.type||'';label.setAttribute('aria-hidden','true');host.append(label);
  units.push({root,deck,floor,label,m,skin,type:q.type});
 }
 function draw(){
  if(host.hidden||!host.clientWidth||!host.clientHeight)return;
  const w=host.clientWidth,h=host.clientHeight;
  if(canvasW!==w||canvasH!==h){canvasW=w;canvasH=h;
   camera.aspect=w/h;camera.updateProjectionMatrix();renderer.setSize(w,h,false);
  }
  if(mode==='axis'){
   const near=Math.min(55,Math.max(1.25,camera.position.distanceTo(controls.target)*.017));
   if(Math.abs(camera.near-near)>.05){camera.near=near;camera.updateProjectionMatrix();}
  }
  renderer.render(scene,camera);
  for(const {node,point} of landmarkLabels){
   const p=point.clone().project(camera);
   node.hidden=mode!=='axis'||!decorOn||p.z>1||Math.abs(p.x)>.94||Math.abs(p.y)>.90;
   node.style.left=`${(p.x+1)*50}%`;node.style.top=`${(1-p.y)*50}%`;
  }
  for(const u of units){
   const p=u.root.position.clone().add(new T.Vector3(0,mode==='overview'?.7:.19,0)).project(camera);
   u.label.hidden=mode!=='overview'||p.z>1||Math.abs(p.x)>1||Math.abs(p.y)>1;
   u.label.style.left=`${(p.x+1)*50}%`;u.label.style.top=`${(1-p.y)*50}%`;
  }
 }
 function setMode(next){
  const u=units[current]||units[0];if(!u&&next!=='overview')return;
  mode=next;camera.near=mode==='axis'?24:mode==='overview'?1.25:.22;camera.updateProjectionMatrix();host.dataset.cameraMode=mode;if(bridgeRoof)bridgeRoof.visible=mode!=='overview';
  for(const x of cutawayGroups)x.visible=mode!=='overview'&&u?.type==='indoor';
  camera.fov=scene.userData.diagram?(mode==='overview'?25:mode==='axis'?37:46):46;
  camera.far=mode==='axis'?6800:2400;camera.updateProjectionMatrix();
  if(mode==='axis'&&axisFocus){
   const {x,y,z}=axisFocus;
   const aspect=(host.clientWidth||500)/(host.clientHeight||500);
   const k=aspect<1.1?1.36:1.03;
   const [dx,dy,dz]=axisFrame||[-690,670,1220];
   controls.target.set(x,y,z);camera.position.set(x+dx*k,y+dy*k,z+dz*k);
   controls.maxDistance=5200;
  }else if(mode==='overview'){
   const aspect=(host.clientWidth||500)/(host.clientHeight||500);
   camera.aspect=aspect;camera.updateProjectionMatrix();
   const direction=new T.Vector3(-.77,scene.userData.diagram?1.53:1.17,.94).normalize(), tangent=Math.tan(T.MathUtils.degToRad(camera.fov/2));
   const right=new T.Vector3(0,1,0).cross(direction).normalize(), up=direction.clone().cross(right).normalize();
   const padX=aspect<.9?.80:.73, padY=.67;
   const dist=fitPoints.reduce((d,p)=>Math.max(d,p.dot(direction)+Math.max(Math.abs(p.dot(right))/(tangent*aspect*padX),Math.abs(p.dot(up))/(tangent*padY))),28)*1.04;
   controls.target.set(0,0,0);camera.position.copy(direction.multiplyScalar(dist));
   controls.maxDistance=Math.max(850,dist*1.8);
  }else{
   const sd=mode==='baselineB'?-1:1;
   const angle=u.root.rotation.y;
   const point=(x,y,z)=>new T.Vector3(x,y,z).applyAxisAngle(new T.Vector3(0,1,0),angle).add(u.root.position);
   camera.position.copy(point(mode==='side'?-u.m.cw/2-.7:0,1.7,mode==='side'?u.m.cl*.12:sd*(u.m.cl/2-.7)));
   controls.target.copy(point(0,1.18,mode==='side'?0:-sd*8));
  }
  controls.update();draw();
 }
 function highlight(i){
  current=Math.max(0,i);
  units.forEach((u,j)=>{u.deck.material=j===i?u.skin.deckFocus:u.skin.deck;u.floor.material=j===i?u.skin.focus:u.skin.floor;u.label.classList.toggle('current',j===i)});
  if(mode!=='overview'&&mode!=='axis')setMode(mode);else draw();
 }
 function show(slots,features,active,venueId){
  const cfg=venueContext(venueId);
  if(!slots.length&&!cfg?.overviewOnly)return;
  const next=slots.map(x=>x.f.id+':'+x.i).join('|');
  const key=String(venueId||'')+'@'+next;
  if(key===signature){highlight(active);return}
  signature=key;
  stage.traverse(o=>o.geometry?.dispose());
  if(decor){const materialSet=new Set();decor.traverse(o=>{if(o.material)materialSet.add(o.material)});materialSet.forEach(x=>x.dispose())}
  decor=null;fitPoints=[];bridgeRoof=null;cutawayGroups=[];ground=null;axisFocus=null;landmarkLabels.forEach(x=>x.node.remove());landmarkLabels=[];
  stage.clear();for(const u of units)u.label.remove();units=[];
  const xs=slots.map(x=>x.m.x),zs=slots.map(x=>x.m.y);
  scene.userData.diagram=venueId==='20';host.dataset.presentation=scene.userData.diagram?'landscape-diagram':'standard';
  materials=scene.userData.diagram?style:neutral;scene.userData.ground=materials.grass;
  scene.background.set(scene.userData.diagram?0xf4f6f3:0xd4e6ec);
  light.groundColor.set(scene.userData.diagram?0xbec7bc:0x779181);
  center=slots.length?[(Math.min(...xs)+Math.max(...xs))/2,(Math.min(...zs)+Math.max(...zs))/2]:cfg.focus;
  extent=slots.length?Math.max(Math.max(...xs)-Math.min(...xs),Math.max(...zs)-Math.min(...zs))+35:600;
  slots.forEach(addCourt);
  const context=cfg?makeVenueContext(cfg,units,center):null;
  const raise=Math.max(0,Number(context?.raise)||0);
  bridgeRoof=context?.bridgeRoof||null;cutawayGroups=context?.cutawayGroups||[];
  for(const b of host.querySelectorAll('[data-camera]'))if(!['axis','overview'].includes(b.dataset.camera))b.hidden=!units.length;
  axisFocus=context?.axisFocus||null;axisFrame=context?.axisFrame||null;
  host.querySelector('[data-camera="axis"]').hidden=!axisFocus||!decorOn;
  for(const {caption,point} of context?.landmarkLabels||[]){
   const node=document.createElement('span');node.className='axis-marker';node.textContent=caption;node.hidden=true;
   host.append(node);landmarkLabels.push({node,point});
  }
  const span=Math.max(extent*3.1,Number(context?.groundSpan)||0);
  ground=box(stage,span,.2,span,0,-.31-(decorOn?raise:0),0,materials.grass);
  if(!context)for(const f of features)for(const pg of f.p){
   const p=new T.Shape(pg[0].map(([x,z])=>new T.Vector2(x-center[0],center[1]-z)));
   const mesh=new T.Mesh(new T.ShapeGeometry(p),materials.site);mesh.rotation.x=-Math.PI/2;mesh.position.y=-.04;stage.add(mesh);
  }
  for(const u of units)for(const i of [-1,1])for(const j of [-1,1])
   fitPoints.push(new T.Vector3(i*(u.m.cw*.5+4),0,j*(u.m.cl*.5+4)).applyAxisAngle(new T.Vector3(0,1,0),u.root.rotation.y).add(u.root.position));
  if(context?.nearFitPoints)for(const p of context.nearFitPoints) {
   const pt=p?.isVector3?p:Array.isArray(p)&&p.length===3?new T.Vector3(...p):null;
   if(pt&&[pt.x,pt.y,pt.z].every(Number.isFinite))fitPoints.push(pt);
  }
  decor=context?.group||makeLandscape(units,next);
  decor.visible=decorOn;stage.add(decor);
  host.dataset.context=context?'venue':'illustration';
  host.dataset.contextRaise=String(raise);
  mode='overview';highlight(active);setMode(mode);
  for(const c of host.querySelectorAll('[data-camera]'))c.setAttribute('aria-pressed',String(c.dataset.camera===mode));
 }
 controls.addEventListener('change',draw);
 new ResizeObserver(()=>{
  if(host.hidden||!host.clientWidth)return;
  if(mode==='overview'||mode==='axis')setMode(mode);else draw();
 }).observe(host);
 let down=null;
 canvas.addEventListener('pointerdown',e=>{down=[e.clientX,e.clientY]});
 canvas.addEventListener('pointerup',e=>{
  if(mode==='axis'||!down||Math.hypot(e.clientX-down[0],e.clientY-down[1])>6)return;
  const r=canvas.getBoundingClientRect();
  rx.setFromCamera(new T.Vector2((e.clientX-r.left)/r.width*2-1,1-(e.clientY-r.top)/r.height*2),camera);
  const hit=rx.intersectObjects(units.flatMap(u=>[u.deck,u.floor]),false)[0];
  if(hit)choose(hit.object.userData.idx);
 });
 return {show,setMode,draw};
}
