'use strict';
(()=>{
const $=id=>document.getElementById(id);
const venues={
'20':[23.1131,113.3126],'7':[23.1084,113.2411],'2':[23.1391,113.3225],'1':[23.1453,113.4029],'85':[22.7838,113.5081],'23':[23.1709,113.4418],'435':[23.0732,113.2094],'1371':[22.5839,113.6507],'ctx-zhujiang':[22.705,113.540],'ctx-coco':[22.807,113.5255],'ctx-xingbai':[23.1116,113.3102],'111':[23.38847,113.21571],'316':[23.29358,113.84103]};
const stations={'珠江新城':[23.119,113.321],'客村':[23.096,113.316],'体育西路':[23.132,113.321],'员村':[23.117,113.365],'猎德':[23.119,113.339],'广州塔':[23.106,113.323],'东山口':[23.127,113.294],'公园前':[23.125,113.264],'黄沙':[23.111,113.237],'坑口':[23.084,113.227],'昌岗':[23.091,113.271],'琶洲':[23.098,113.371],'大学城南':[23.042,113.403],'汉溪长隆':[22.995,113.330],'市桥':[22.946,113.359],'万胜围':[23.098,113.385],'车陂南':[23.116,113.388],'大沙东':[23.107,113.452],'萝岗':[23.172,113.474],'嘉禾望岗':[23.237,113.289],'白云公园':[23.175,113.268],'蕉门':[22.800,113.528],'万顷沙':[22.715,113.550],'塘坑':[22.790,113.553],'花果山公园':[23.388,113.215],'增城广场':[23.28472,113.81278]};
const axes=[['打法',['S','单打'],['D','双打']],['目的',['P','多球练习'],['M','打比分']],['强度',['E','轻松出汗'],['I','拉满强度']],['档期',['W','工作日晚间'],['H','周末']]];
const types=window.COURT_GUIDE.venues, names=new Map(window.COURT_DATA.venues);
const configs=[{label:'我'},{label:'搭子'}];
const params=new URLSearchParams(location.hash.slice(1));
const css=document.createElement('style');css.textContent=`.buddy{max-width:560px}.buddy .dialog-body{display:grid;gap:10px;max-height:73dvh;overflow:auto}.buddy h3{font-size:15px;margin:2px 0 8px}.duo{display:grid;grid-template-columns:1fr 1fr;gap:8px}.buddyPanel{border-radius:13px;background:white;border:1px solid #d9e3da;padding:9px;min-width:0}.buddy .muted{font-size:12px}.buddy select{width:100%;font-size:14px;margin:0}.buddy label{display:grid;gap:3px;margin:5px 0;color:#456455;font-size:12px}.buddy .btn{font-size:13px}.buddy .primary{background:#315b4b}.buddyActions{display:flex;gap:6px;flex-wrap:wrap}.buddyEntry{display:flex;justify-content:space-between;gap:8px;align-items:center;padding:8px 0;border-bottom:1px solid #e3ebe3}.buddyEntry a{font-size:12px}.buddyEntry div{display:grid;gap:2px}.buddyEntry strong{font-size:14px}.heatRow{display:grid;grid-template-columns:4em 1fr 3.4em;align-items:center;gap:8px;font-size:13px}.heatRow i{display:block;height:12px;border-radius:4px}.buddyCode{font-weight:bold;color:#315b4b}.buddyLinkOut{width:100%;padding:8px;border:1px solid #cbdacd;border-radius:8px}`;document.head.append(css);
function dialog(id,title,html){const d=document.createElement('dialog');d.id=id;d.className='buddy';d.innerHTML='<header class="dialog-head"><h2>'+title+'</h2><button type="button" aria-label="关闭">×</button></header><div class="dialog-body">'+html+'</div>';d.querySelector('button').onclick=()=>d.close();document.body.append(d);return d;}
const dlg=dialog('buddyDlg','搭子选场',`<p class="muted">找两个人都好到的球场，再看看打法合不合。定位和偏好在此页本地计算。点击高德路线时，只会带你选的公开地铁站与球场，不会发送本站定位。</p><div class="duo" id="duo"></div><div class="buddyActions"><button class="btn primary" id="buddyRun">找双方都近的球场</button><button class="btn" id="buddyShare">邀请搭子填</button><button class="btn" id="buddyReturn" hidden>把结果发回去</button></div><p class="muted">分享链接只带你选择的地标或约 2 公里网格，以及主动填写的球风。不包含定位原坐标。</p><p class="muted" id="buddyNote" role="status"></p><input id="buddyCopy" class="buddyLinkOut" aria-label="复制链接" readonly hidden><div id="buddyMatch"></div><div id="buddyResult"></div>`);
function el(tag,txt,parent){const e=document.createElement(tag);e.textContent=txt||'';parent.append(e);return e;}
function select(p,desc,opts){const l=el('label',desc,p),s=el('select','',l);for(const [v,n] of opts){const o=el('option',n,s);o.value=v}return s;}
const local=[null,null],decode=(v)=>{if(!v)return null;const [a,b]=v.split(',').map(Number);return v.split(',').length===2&&Number.isFinite(a)&&Number.isFinite(b)&&a>=22.35&&a<=23.95&&b>=112.8&&b<=114.2?[a,b]:null;};
const snap=x=>x.map(n=>(Math.round(n/.02)*.02).toFixed(2)).join(',');
function saved(i){const a=params.get('a'+i);const from=configs[i];if(stations[a])from.station.value=a;else if(decode(a)){local[i]=decode(a);from.geo.textContent='已载入对方的大致出发区';}const k=params.get('p'+i)||'';[...k].forEach((c,j)=>{if(from.axes[j]&&axes[j].slice(1).some(a=>a[0]===c))from.axes[j].value=c});if(['1','2','3','4'].includes(params.get('l'+i)))from.level.value=params.get('l'+i);}
const invite=params.has('a0')||params.has('p0');const reply=params.has('a1')||params.has('p1');
for(let i=0;i<2;i++){const item=configs[i];const card=el('section','',$('duo'));card.className='buddyPanel';el('h3',invite&&!reply?(i?'我':'邀请我的球友'):item.label,card);
item.station=select(card,'出发地标',[['','选地铁站'],...Object.keys(stations).map(x=>[x,x])]);item.station.onchange=()=>{local[i]=null;item.geo.textContent='使用定位';};
item.geo=el('button','使用定位',card);item.geo.className='btn';item.geo.onclick=()=>{const note=$('buddyNote');if(!navigator.geolocation||!isSecureContext){note.textContent='当前浏览器不支持定位，选地铁站也能算。';return}item.geo.disabled=true;note.textContent='等待定位授权…';navigator.geolocation.getCurrentPosition(({coords})=>{item.geo.disabled=false;local[i]=decode(coords.latitude+','+coords.longitude);if(!local[i]){note.textContent='当前位置不在广州附近，请选地铁站。';return}item.station.value='';item.geo.textContent='已使用当前位置';note.textContent='定位在本地使用。分享时只会带约 2 公里网格。';},()=>{item.geo.disabled=false;note.textContent='没拿到定位，可以选地铁站继续。';},{timeout:7000,maximumAge:0});};
item.axes=axes.map(x=>select(card,x[0],[['','都可以'],...x.slice(1)]));
item.level=select(card,'自评水平',[['','不填'],['1','刚入门'],['2','能稳定对拉'],['3','会打比赛'],['4','常参加比赛']]);saved(i);}
function read(i){const x=configs[i];return {loc:local[i]||stations[x.station.value],station:x.station.value,p:x.axes.map(y=>y.value||'_').join(''),l:x.level.value}};
function dist(a,b){const r=Math.PI/180, d1=(a[0]-b[0])*r,d2=(a[1]-b[1])*r,z=Math.sin(d1/2)**2+Math.cos(a[0]*r)*Math.cos(b[0]*r)*Math.sin(d2/2)**2;return 12742*Math.asin(Math.min(1,Math.sqrt(z)));}
const external={'316':{name:'增城体育馆网球场',source:'https://www.zc.gov.cn/hd/12345zffwrx/qb/content/post_10037065.html'}};
function qname(id){return names.get(id)||external[id]?.name||id;}
// Convert approximate public station and venue WGS84 points to the map provider's coordinates.
function amapPoint([lat,lon],name){
 const x=lon-105,y=lat-35,pi=Math.PI,base=2/3;
 const common=(20*Math.sin(6*x*pi)+20*Math.sin(2*x*pi))*base;
 let dLat=-100+2*x+3*y+.2*y*y+.1*x*y+.2*Math.sqrt(Math.abs(x))+common
  +(20*Math.sin(y*pi)+40*Math.sin(y*pi/3))*base+(160*Math.sin(y*pi/12)+320*Math.sin(y*pi/30))*base;
 let dLon=300+x+2*y+.1*x*x+.1*x*y+.1*Math.sqrt(Math.abs(x))+common
  +(20*Math.sin(x*pi)+40*Math.sin(x*pi/3))*base+(150*Math.sin(x*pi/12)+300*Math.sin(x*pi/30))*base;
 const rad=lat*pi/180,s=Math.sin(rad),m=1-.006693421622965943*s*s,t=Math.sqrt(m);
 dLat=dLat*180/(6335552.717000426/(m*t)*pi);dLon=dLon*180/(6378245/t*Math.cos(rad)*pi);
 return (lon+dLon).toFixed(6)+','+(lat+dLat).toFixed(6)+','+name;
}
function transit(id,station){
 const u=new URL('https://uri.amap.com/navigation');
 if(station)u.searchParams.set('from',amapPoint(stations[station],station+'地铁站'));
 u.searchParams.set('to',id==='111'?'113.220711,23.385822,花都体育中心网球场':amapPoint(venues[id],qname(id)));
 u.searchParams.set('mode','bus');u.searchParams.set('src','hangtumao');u.searchParams.set('callnative','0');
 return u.href;
}
function place(id){const u=new URL('.',location.href);u.searchParams.set('venue',id);u.searchParams.set('view','3d');return u.href;}
function result(){const a=read(0),b=read(1),box=$('buddyMatch'),r=$('buddyResult');box.replaceChildren();r.replaceChildren();
 if(!/^_+$/.test(a.p)||!/^_+$/.test(b.p)){el('strong','TBTI  '+a.p.replaceAll('_','·')+'  ×  '+b.p.replaceAll('_','·'),box).className='buddyCode';let good=[],diff=[];axes.forEach((x,i)=>{if(a.p[i]==='_'||b.p[i]==='_')return;if(a.p[i]===b.p[i])good.push(x.find(v=>v[0]===a.p[i])[1]);else diff.push(x[0]);});el('p',[good.length?'共同偏好：'+good.join('、'):'暂无明确共同偏好',diff.length?'先商量：'+diff.join('、'):'',a.l&&b.l&&Math.abs(Number(a.l)-Number(b.l))>=2?'自评水平差距较大':''].filter(Boolean).join(' ｜ '),box).className='muted';}
 if(!a.loc||!b.loc){$('buddyNote').textContent='各选一个出发地，再算球场。TBTI 可以单独看。';return}
 $('buddyNote').textContent='按两人里较远的一程排序。只比直线距离，不是实际车程、交通费用或余位。';
 const ranked=Object.entries(venues).filter(([k])=>names.has(k)||external[k]).map(([k,v])=>[k,dist(a.loc,v),dist(b.loc,v)]).sort((x,y)=>Math.max(x[1],x[2])-Math.max(y[1],y[2])||x[1]+x[2]-y[1]-y[2]);
 const close=ranked.filter(x=>Math.max(x[1],x[2])<=12).slice(0,3);
 const out=(parent,label,href)=>{const link=el('a',label,parent);link.href=href;link.target='_blank';link.rel='noopener noreferrer';return link;};
 function rows(list){for(const [id,d1,d2] of list){
   const row=el('div','',r);row.className='buddyEntry';
   const info=el('div','',row),links=el('div','',row);el('strong',qname(id),info);
   el('span','A '+d1.toFixed(1)+' km · B '+d2.toFixed(1)+' km（直线）',info).className='muted';
   if(external[id])out(links,'场馆与订场说明 ↗',external[id].source);else el('a','看球场',links).href=place(id);
   if(a.station)out(links,'A 公交／地铁 ↗',transit(id,a.station));
   if(b.station)out(links,'B 公交／地铁 ↗',transit(id,b.station));
   if(!a.station||!b.station)out(links,'高德查公交 ↗',transit(id,''));
 }}
 rows(close);
 if(close.length<3){
   const caption=close.length?'附近收录的场地较少，以下备选至少有一人超过 12 公里。':'目前收录的场地中，没有两人都在 12 公里内的；不代表附近没有球场。';
   el('p',caption,r).className='muted';out(r,'查更多场地 ↗','https://tennismap.cn/courts/map').className='muted';
   const more=el('button','仍看较远的备选',r);more.className='btn';more.onclick=()=>{more.remove();rows(ranked.filter(x=>!close.includes(x)).slice(0,3-close.length));};
 }
}
function share(withReply){const own=invite&&!reply?1:0,a=read(own);if(!a.loc&&/^_+$/.test(a.p)){$('buddyNote').textContent='先选一个出发地或填写 TBTI。';return;}
const u=new URL('.',location.href),h=new URLSearchParams();
function add(readout,i){if(readout.station)h.set('a'+i,readout.station);else if(readout.loc)h.set('a'+i,snap(readout.loc));if(!/^_+$/.test(readout.p))h.set('p'+i,readout.p);if(readout.l)h.set('l'+i,readout.l);}
if(withReply&&invite){add(read(0),0);add(read(1),1);}else add(a,0);
u.hash=h.toString();const input=$('buddyCopy');input.value=u.href;input.hidden=false;input.select();const note=$('buddyNote');note.textContent='复制链接发给球友，微信内也可以贴链接。';if(navigator.clipboard)navigator.clipboard.writeText(u.href).then(()=>note.textContent='链接已复制，发给球友就行。').catch(()=>{});}
$('buddyOpen').onclick=()=>{dlg.showModal();};$('buddyRun').onclick=result;$('buddyShare').onclick=()=>share(false);$('buddyReturn').onclick=()=>share(true);$('buddyReturn').hidden=!invite||reply;$('courtPick').onclick=()=>{if($('plan').disabled)$('find').click();else{$('plan').click();$('stage').scrollIntoView({block:'nearest',behavior:'smooth'});}}; if(invite){dlg.showModal();if(reply)result()}
const coverage=dialog('coverageDlg','全市球场分布','<p class="muted">已识别到的网球场面数，颜色越深数量越多，不等于订场热度。</p><div id="coverageRows" style="display:grid;gap:10px"></div><p class="muted"><a href="https://guangdong.tianditu.gov.cn/guangzhou/StandardMap/index.html" target="_blank" rel="noopener">广州标准地图 ↗</a> · <a href="https://tennismap.cn/courts/map" target="_blank" rel="noopener">外部订场地图 ↗</a></p>');
const cnt={'番禺区':167,'天河区':94,'南沙区':44,'黄埔区':32,'增城区':30,'海珠区':28,'白云区':22,'越秀区':19,'荔湾区':12,'从化区':5,'花都区':4};
for(const [k,v] of Object.entries(cnt)){const y=el('div','',$('coverageRows'));y.className='heatRow';el('span',k,y);const z=el('span','',y),b=el('i','',z);b.style.width=(10+Math.sqrt(v/167)*90)+'%';b.style.backgroundColor='hsl('+Math.round(35-24*Math.sqrt(v/167))+' 65% '+Math.round(83-38*Math.sqrt(v/167))+'%)';el('span',v+' 面',y);}
$('coverageOpen').onclick=()=>{$('explore').close();coverage.showModal();};
})();
