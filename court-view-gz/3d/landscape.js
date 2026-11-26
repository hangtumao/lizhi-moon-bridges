import * as T from './three.module.js';
import {landscapePlan} from './landscape-plan.js';

export function makeLandscape(units,variant){
 const group=new T.Group();
 const {patches,parts,trunks,far}=landscapePlan(units.map(u=>({...u.m,x:u.root.position.x,y:u.root.position.z})),variant);
 const mats=new Map(), mat=color=>{
  if(!mats.has(color))mats.set(color,new T.MeshStandardMaterial({color,flatShading:true,roughness:1}));
  return mats.get(color);
 };
 for(const {pts,mat:color,y,stage} of patches){
  const geom=new T.ShapeGeometry(new T.Shape(pts.map(([x,z])=>new T.Vector2(x,-z))));
  const o=new T.Mesh(geom,mat(color));o.rotation.x=-Math.PI/2;o.position.y=y;o.userData.decorLayer=stage;group.add(o);
 }
 for(const {x,z,h,w} of trunks){
  const o=new T.Mesh(new T.BoxGeometry(w,h*.34,w),mat(0x827965));o.position.set(x,h*.17,z);o.userData.decorLayer=3.7;group.add(o);
 }
 function crown({x,y,z,sx,sy,sz,mat:color,kind,rotation=0}){
  const geom=kind==='spire'?new T.ConeGeometry(1,2,7):new T.SphereGeometry(1,9,6);
  const o=new T.Mesh(geom,mat(color));o.position.set(x,y,z);o.scale.set(sx,sy,sz);o.rotation.y=rotation;
  o.userData.silhouette=kind;group.add(o);
 }
 parts.forEach(crown);
 for(let i=0;i<3;i++)for(let j=0;j<3;j++)crown({x:(i-1)*far*.38+(j-1)*5.4,y:16+i*3+(j%2)*1.2,z:-far*.95-(i%2)*8,sx:4.1,sy:1.9,sz:2.3,mat:0xdde6e7,kind:'cloud'});
 return group;
}
