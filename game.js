import * as THREE from 'three';

const $ = (s) => document.querySelector(s);
const canvas = $('#world');
const scene = new THREE.Scene();
scene.background = new THREE.Color(0x9eb8b2);
scene.fog = new THREE.FogExp2(0x9eb8b2, 0.00155);
const camera = new THREE.PerspectiveCamera(58, innerWidth / innerHeight, 0.1, 1500);
const renderer = new THREE.WebGLRenderer({ canvas, antialias: true, powerPreference: 'high-performance' });
renderer.setPixelRatio(Math.min(devicePixelRatio, 1.25));
renderer.setSize(innerWidth, innerHeight);
renderer.outputColorSpace = THREE.SRGBColorSpace;
renderer.toneMapping = THREE.ACESFilmicToneMapping;
renderer.toneMappingExposure = 1.05;
renderer.shadowMap.enabled = false;
renderer.shadowMap.type = THREE.PCFSoftShadowMap;

const clamp = THREE.MathUtils.clamp;
const V = (x=0,y=0,z=0) => new THREE.Vector3(x,y,z);
const mat = (color, roughness=.8, extra={}) => new THREE.MeshStandardMaterial({ color, roughness, ...extra });
const M = {
  terrain: new THREE.MeshStandardMaterial({ vertexColors:true, roughness:.96 }),
  water: new THREE.MeshPhysicalMaterial({color:0x55a9ae,roughness:.23,metalness:.12,transparent:true,opacity:.83,clearcoat:.7,side:THREE.DoubleSide}),
  scale:mat(0x406d64,.62), belly:mat(0xb9a47d), dark:mat(0x26373a), wing:mat(0x75463d,.78,{side:THREE.DoubleSide}),
  horn:mat(0xe4c992,.65), gold:mat(0xe7be68,.3,{emissive:0x58320b,emissiveIntensity:.42}),
  bark:mat(0x604637), leaf:mat(0x3e694a), leaf2:mat(0x658655), roof:mat(0x57433b), stone:mat(0x817c69),
  crystal:mat(0x75edc9,.22,{emissive:0x24af8c,emissiveIntensity:1.7}), ember:mat(0xffb74f,.25,{emissive:0xf06417,emissiveIntensity:2.1})
};
scene.add(new THREE.HemisphereLight(0xdce9e0,0x455b43,2.0));
const sun = new THREE.DirectionalLight(0xffdfab,3.0); sun.position.set(-90,150,100); sun.castShadow=true;
sun.shadow.mapSize.set(1536,1536); sun.shadow.camera.left=-145; sun.shadow.camera.right=145; sun.shadow.camera.top=145; sun.shadow.camera.bottom=-145; scene.add(sun);
const fill = new THREE.DirectionalLight(0x91c8db,1.15); fill.position.set(120,55,-130); scene.add(fill);

function heightAt(x,z){
  const ridges=9*Math.sin(x*.027+Math.sin(z*.019)*1.5)+7*Math.cos(z*.035+x*.012)+4*Math.sin((x+z)*.055);
  const peaks=43*Math.exp(-((x+105)**2+(z+35)**2)/4400)+34*Math.exp(-((x-100)**2+(z-100)**2)/5200)+28*Math.exp(-((x+5)**2+(z-145)**2)/3900);
  return Math.max(-3,5+ridges+peaks+Math.max(0,Math.hypot(x,z)-130)*.31-4*Math.exp(-(x*x+z*z)/2500));
}
function makeTerrain(){
  const geo=new THREE.PlaneGeometry(560,560,144,144); geo.rotateX(-Math.PI/2);
  const p=geo.attributes.position, colors=[]; const low=new THREE.Color(0x667c4d),mid=new THREE.Color(0x8c9560),high=new THREE.Color(0x9d9876),peak=new THREE.Color(0xc0b89f);
  for(let i=0;i<p.count;i++){const x=p.getX(i),z=p.getZ(i),h=heightAt(x,z);p.setY(i,h);let c=h<14?low.clone().lerp(mid,clamp((h+5)/23,0,1)):mid.clone().lerp(high,clamp((h-14)/27,0,1));if(h>40)c.lerp(peak,clamp((h-40)/40,0,.7));c.offsetHSL(0,0,Math.sin(x*.27+z*.13)*Math.sin(z*.2-x*.09)*.04);colors.push(c.r,c.g,c.b);}
  geo.setAttribute('color',new THREE.Float32BufferAttribute(colors,3));geo.computeVertexNormals();const ground=new THREE.Mesh(geo,M.terrain);ground.receiveShadow=true;scene.add(ground);
}
makeTerrain();

function makeWater(){
  const pts=[];for(let i=0;i<=55;i++){const z=-235+i*8.6,x=45+Math.sin(i*.15)*28+Math.sin(i*.047)*44;pts.push(V(x,2.1,z));}
  const curve=new THREE.CatmullRomCurve3(pts), verts=[],idx=[],segments=280;
  for(let i=0;i<=segments;i++){const t=i/segments,p=curve.getPoint(t),tan=curve.getTangent(t),side=V(-tan.z,0,tan.x).normalize(),w=5+2*Math.sin(t*35)**2;verts.push(p.x+side.x*w,p.y,p.z+side.z*w,p.x-side.x*w,p.y,p.z-side.z*w);if(i<segments){const a=i*2;idx.push(a,a+1,a+2,a+1,a+3,a+2);}}
  const g=new THREE.BufferGeometry();g.setAttribute('position',new THREE.Float32BufferAttribute(verts,3));g.setIndex(idx);g.computeVertexNormals();scene.add(new THREE.Mesh(g,M.water));
  for(const [x,z,rx,rz] of [[-66,-20,26,17],[116,34,32,21],[-95,135,18,12]]){const lake=new THREE.Mesh(new THREE.CircleGeometry(1,64),M.water);lake.rotation.x=-Math.PI/2;lake.position.set(x,2.25,z);lake.scale.set(rx,rz,1);scene.add(lake);}
}
makeWater();

const rand=n=>{const x=Math.sin(n*127.1+311.7)*43758.5453;return x-Math.floor(x);};
function addCabin(x,z,s=1){const g=new THREE.Group();g.position.set(x,heightAt(x,z),z);g.scale.setScalar(s);scene.add(g);const body=new THREE.Mesh(new THREE.BoxGeometry(6,4.2,5),mat(0x927453));body.position.y=2.2;body.castShadow=true;g.add(body);const roof=new THREE.Mesh(new THREE.ConeGeometry(4.5,3.3,4),M.roof);roof.rotation.y=Math.PI/4;roof.position.y=5.8;roof.castShadow=true;g.add(roof);const door=new THREE.Mesh(new THREE.BoxGeometry(1.25,2.5,.16),mat(0x3d3128));door.position.set(0,1.35,2.57);g.add(door);}
const treeInstances=[];
function addTree(x,z,seed,s=1){const y=heightAt(x,z);if(y>48)return;treeInstances.push({x,y,z,s});}
for(let i=0;i<230;i++){const x=(rand(i+11)-.5)*470,z=(rand(i+801)-.5)*470;if(Math.hypot(x,z)>43&&Math.hypot(x-25,z+55)>42)addTree(x,z,i,.65+rand(i+22)*.9);}
function buildTreeInstances(){const dummy=new THREE.Object3D(),trunkGeo=new THREE.CylinderGeometry(.24,.48,3.7,7),trunk=new THREE.InstancedMesh(trunkGeo,M.bark,treeInstances.length);trunk.name='Forest trunks';trunk.castShadow=false;trunk.receiveShadow=false;const tops=[];for(let tier=0;tier<3;tier++){const mesh=new THREE.InstancedMesh(new THREE.ConeGeometry(2.2-tier*.32,3.4-tier*.2,7),tier===1?M.leaf2:M.leaf,treeInstances.length);mesh.name=`Forest canopy ${tier+1}`;mesh.castShadow=false;mesh.receiveShadow=false;tops.push(mesh);}treeInstances.forEach((tree,i)=>{dummy.position.set(tree.x,tree.y+1.6*tree.s,tree.z);dummy.scale.setScalar(tree.s);dummy.updateMatrix();trunk.setMatrixAt(i,dummy.matrix);for(let tier=0;tier<3;tier++){dummy.position.set(tree.x,tree.y+(3.5+tier*1.35)*tree.s,tree.z);dummy.updateMatrix();tops[tier].setMatrixAt(i,dummy.matrix);}});trunk.instanceMatrix.needsUpdate=true;scene.add(trunk,...tops);}
buildTreeInstances();
addCabin(18,-58,1.15);addCabin(31,-63,.72);addCabin(12,-68,.74);addCabin(-112,-14,.85);addCabin(138,15,.8);addCabin(-113,143,.8);
for(const [x,z] of [[-126,-60],[150,105],[-25,174]]){const g=new THREE.Group();g.position.set(x,heightAt(x,z),z);scene.add(g);const b=new THREE.Mesh(new THREE.CylinderGeometry(3,4,12,8),M.stone);b.position.y=6;b.castShadow=true;g.add(b);const cap=new THREE.Mesh(new THREE.ConeGeometry(4.5,4,8),M.roof);cap.position.y=14;g.add(cap);}

const clouds=[];const cloudMat=new THREE.MeshBasicMaterial({color:0xf2eee0,transparent:true,opacity:.35,depthWrite:false});
for(let i=0;i<12;i++){const g=new THREE.Group();g.position.set((rand(i+412)-.5)*430,68+rand(i+30)*38,(rand(i+204)-.5)*430);g.userData.drift=.4+rand(i+60)*.7;for(let j=0;j<5;j++){const p=new THREE.Mesh(new THREE.SphereGeometry(1,10,8),cloudMat);p.scale.set(8+rand(i*7+j)*8,2+rand(i+j*3)*3,5+rand(i*2+j)*6);p.position.set((j-2)*7,rand(i+j)*2,rand(i+j*2)*4);g.add(p);}scene.add(g);clouds.push(g);}
const sunBall=new THREE.Mesh(new THREE.SphereGeometry(8,16,12),new THREE.MeshBasicMaterial({color:0xffe6b5}));sunBall.position.set(-250,185,-310);scene.add(sunBall);

function cylinderBetween(parent,a,b,r1,r2,material,segments=8){const av=V(...a),bv=V(...b),dir=bv.clone().sub(av);const m=new THREE.Mesh(new THREE.CylinderGeometry(r2,r1,dir.length(),segments),material);m.position.copy(av.add(bv).multiplyScalar(.5));m.quaternion.setFromUnitVectors(V(0,1,0),dir.normalize());m.castShadow=true;parent.add(m);return m;}
function sphere(parent,material,pos,scale,detail=12){const m=new THREE.Mesh(new THREE.SphereGeometry(1,detail,Math.max(8,detail-3)),material);m.position.set(...pos);m.scale.set(...scale);m.castShadow=true;m.receiveShadow=true;parent.add(m);return m;}
function createDragon(){
 const root=new THREE.Group(),body=new THREE.Group();scene.add(root);root.add(body);body.rotation.order='YXZ';
 sphere(body,M.scale,[0,0,0],[1.35,.8,2.25],18);sphere(body,M.belly,[0,-.38,-.1],[1.12,.43,1.8],14);
 cylinderBetween(body,[0,.25,-1.45],[0,.65,-2.85],.48,.31,M.scale,12);sphere(body,M.scale,[0,.66,-2.92],[.48,.46,.64],14);sphere(body,M.dark,[0,.53,-3.39],[.37,.25,.5],12);
 for(const s of [-1,1]){sphere(body,M.gold,[s*.34,.84,-3.02],[.105,.12,.1],10);sphere(body,mat(0x171e1c,.3),[s*.36,.84,-3.105],[.038,.075,.035],8);cylinderBetween(body,[s*.25,1.02,-2.72],[s*.38,1.72,-2.9],.19,.015,M.horn,8);}
 for(let i=0;i<9;i++){const z=-1.85+i*.48,size=.19*(1-Math.abs(i-4)/8);cylinderBetween(body,[0,.68,z],[0,.68+size,z+.08],size*.52,.012,M.horn,5);}
 for(const s of [-1,1])for(const z of [-1.12,1.15]){const hip=[s*.83,-.2,z],knee=[s*1.1,-.82,z+.12],foot=[s*1.1,-1.02,z-.12];cylinderBetween(body,hip,knee,.28,.18,M.scale);cylinderBetween(body,knee,foot,.18,.13,M.scale);for(let t=0;t<3;t++)cylinderBetween(body,[foot[0]+s*(t-1)*.1,foot[1]-.02,foot[2]-.1],[foot[0]+s*(t-1)*.16,foot[1]-.04,foot[2]-.34],.075,.008,M.horn,5);}
 let prev=[0,0,1.65];for(let i=1;i<=8;i++){const t=i/8,next=[Math.sin(t*1.8)*.16,-.05+Math.sin(t*2)*.08,1.65+t*2.35];cylinderBetween(body,prev,next,.37*(1-(i-1)/9),.37*(1-i/9),i%2?M.scale:M.dark,8);prev=next;}
 const wings=[];
 for(const s of [-1,1]){const pivot=new THREE.Group();pivot.position.set(s*1.05,.46,-.25);body.add(pivot);if(s<0)pivot.scale.x=-1;const shape=new THREE.Shape();shape.moveTo(0,0);shape.lineTo(1.05,.43);shape.lineTo(2.35,1.75);shape.lineTo(2.22,.28);shape.lineTo(4.65,-.55);shape.lineTo(2.4,-.17);shape.lineTo(2.05,-1.12);shape.lineTo(1.45,-.35);shape.lineTo(.1,-.62);shape.closePath();const wing=new THREE.Mesh(new THREE.ShapeGeometry(shape,2),M.wing);wing.castShadow=true;pivot.add(wing);cylinderBetween(pivot,[0,0,.03],[2.35,1.75,.03],.09,.04,M.scale,7);cylinderBetween(pivot,[0,0,.04],[4.65,-.55,.04],.1,.035,M.scale,7);cylinderBetween(pivot,[.05,-.05,.05],[2.22,.28,.05],.07,.035,M.scale,7);cylinderBetween(pivot,[.08,-.05,.05],[2.05,-1.12,.05],.07,.03,M.scale,7);cylinderBetween(pivot,[2.22,.28,.05],[4.65,-.55,.05],.05,.02,M.horn,6);wings.push({pivot,sign:s});}
 return {root,body,wings};
}
const dragon=createDragon();dragon.root.position.set(0,18,12);

const shrines=[];
function makeShrine(x,z,index){const y=heightAt(x,z)+.5,g=new THREE.Group();g.position.set(x,y,z);scene.add(g);const dais=new THREE.Mesh(new THREE.CylinderGeometry(3.2,3.8,1.2,8),M.stone);dais.position.y=.6;dais.castShadow=true;g.add(dais);for(let j=0;j<4;j++){const p=new THREE.Mesh(new THREE.BoxGeometry(.4,2.4,.4),M.stone),a=j*Math.PI/2+Math.PI/4;p.position.set(Math.cos(a)*2.2,1.65,Math.sin(a)*2.2);p.castShadow=true;g.add(p);}const crystal=new THREE.Mesh(new THREE.OctahedronGeometry(1.05),M.crystal);crystal.position.y=2.8;g.add(crystal);const light=new THREE.PointLight(0x57f0cf,3.5,30);light.position.y=3;g.add(light);const ring=new THREE.Mesh(new THREE.TorusGeometry(2.3,.035,6,48),M.gold);ring.rotation.x=Math.PI/2;ring.position.y=1.5;g.add(ring);shrines.push({x,z,y,group:g,crystal,light,ring,name:['Mosslight Hollow','Whispering Tarn','Cinderwatch Rise'][index],collected:false});}
makeShrine(-67,-20,0);makeShrine(116,34,1);makeShrine(-104,132,2);

const wisps=[];
function makeWisp(x,z,seed){const g=new THREE.Group();g.position.set(x,heightAt(x,z)+12,z);scene.add(g);const core=new THREE.Mesh(new THREE.IcosahedronGeometry(.72,1),new THREE.MeshBasicMaterial({color:0xff9b58}));g.add(core);const glow=new THREE.PointLight(0xff6b43,2.3,18);g.add(glow);for(let i=0;i<3;i++){const o=new THREE.Mesh(new THREE.SphereGeometry(.12,8,6),M.ember);o.position.set(Math.cos(i*2.1)*1.1,Math.sin(i*2.1)*.8,Math.sin(i*2.1)*.9);g.add(o);}wisps.push({group:g,core,glow,seed,health:2,alive:true,home:V(x,heightAt(x,z)+12,z)});}
makeWisp(-28,-89,1);makeWisp(90,-74,2);makeWisp(145,90,3);makeWisp(-144,64,4);makeWisp(7,128,5);

const input={forward:0,turn:0,climb:0,dash:false};
const keys=new Set();
let joyForward=0,joyTurn=0,touchClimb=0,touchDash=false;
const state={started:false,paused:false,won:false,health:100,embers:0,speed:0,fireCooldown:0,damageCooldown:0,toastTimer:0,time:0};
const projectiles=[],particles=[];
const ui={start:$('#startScreen'),pause:$('#pauseScreen'),win:$('#winScreen'),questCount:$('#questCount'),missionText:$('#missionText'),objective:$('#objective'),distance:$('#distance'),progress:$('#questProgress'),healthText:$('#healthText'),healthBar:$('#healthBar'),shards:$('#shardCount'),hint:$('#interactHint'),toast:$('#toast'),altitudeBar:$('#altitudeBar'),altitudeText:$('#altitudeText'),speed:$('#speedText'),flash:$('#damageFlash')};
let toastTimer;
function toast(text){ui.toast.textContent=text;ui.toast.classList.add('show');clearTimeout(toastTimer);toastTimer=setTimeout(()=>ui.toast.classList.remove('show'),2300);}
function showScreen(which){for(const node of [ui.start,ui.pause,ui.win])node.classList.toggle('visible',node===which);}
function startGame(){state.started=true;state.paused=false;state.won=false;showScreen(null);toast('The valley is yours. Seek the first ember.');}
function togglePause(){if(!state.started||state.won)return;state.paused=!state.paused;showScreen(state.paused?ui.pause:null);}
function resetGame(){state.health=100;state.embers=0;state.speed=0;state.fireCooldown=0;state.damageCooldown=0;state.time=0;state.won=false;state.started=true;state.paused=false;keys.clear();input.dash=false;touchDash=false;touchClimb=0;resetJoy();dragon.root.position.set(0,18,12);dragon.root.rotation.set(0,0,0);dragon.body.rotation.set(0,0,0);wisps.forEach(w=>{w.alive=true;w.health=2;w.group.visible=true;w.group.position.copy(w.home);});shrines.forEach(s=>{s.collected=false;s.crystal.visible=true;s.light.color.set(0x57f0cf);s.group.scale.setScalar(1);});for(const p of projectiles)scene.remove(p.mesh);projectiles.length=0;for(const p of particles)scene.remove(p.mesh);particles.length=0;showScreen(null);updateHud();toast('A new flight begins.');}
$('#startBtn').addEventListener('click',startGame);$('#resumeBtn').addEventListener('click',togglePause);$('#pauseBtn').addEventListener('click',togglePause);$('#replayBtn').addEventListener('click',resetGame);
window.addEventListener('keydown',e=>{if(['Space','ArrowUp','ArrowDown','ArrowLeft','ArrowRight'].includes(e.code))e.preventDefault();keys.add(e.code);if(e.repeat)return;if(e.code==='Escape')togglePause();if(e.code==='KeyE')attune();if(e.code==='KeyQ')breatheFire();});
window.addEventListener('keyup',e=>keys.delete(e.code));
$('#mapToggle').addEventListener('click',()=>$('#miniPanel').classList.toggle('show'));
$('#soundToggle').addEventListener('click',e=>{const btn=e.currentTarget;btn.classList.toggle('muted');btn.textContent=btn.classList.contains('muted')?'♫':'♫';toast(btn.classList.contains('muted')?'Sound muted':'Sound on');});
function bindHold(id,fn){const el=$(id);el.addEventListener('pointerdown',e=>{e.preventDefault();el.setPointerCapture(e.pointerId);fn(true);});for(const ev of ['pointerup','pointercancel','lostpointercapture'])el.addEventListener(ev,()=>fn(false));}
bindHold('#touchFire',v=>{if(v)breatheFire();});bindHold('#touchClimb',v=>touchClimb=v?1:0);bindHold('#touchDash',v=>touchDash=v);
const joy=$('#joystick'),knob=$('#joyKnob');let joyPointer=null;
joy.addEventListener('pointerdown',e=>{e.preventDefault();joyPointer=e.pointerId;joy.setPointerCapture(e.pointerId);moveJoy(e);});
joy.addEventListener('pointermove',e=>{if(e.pointerId===joyPointer)moveJoy(e);});
function moveJoy(e){const r=joy.getBoundingClientRect(),dx=e.clientX-(r.left+r.width/2),dy=e.clientY-(r.top+r.height/2),max=39,len=Math.max(1,Math.hypot(dx,dy)),x=dx/len*Math.min(len,max),y=dy/len*Math.min(len,max);knob.style.transform=`translate(${x}px,${y}px)`;joyTurn=x/max;joyForward=-y/max;}
function resetJoy(){joyPointer=null;joyTurn=0;joyForward=0;knob.style.transform='translate(0,0)';}
joy.addEventListener('pointerup',resetJoy);joy.addEventListener('pointercancel',resetJoy);joy.addEventListener('lostpointercapture',resetJoy);

function breatheFire(){if(!state.started||state.paused||state.won||state.fireCooldown>0)return;state.fireCooldown=.42;const forward=V(0,0,-1).applyQuaternion(dragon.root.quaternion),origin=dragon.root.position.clone().add(forward.clone().multiplyScalar(3.8)).add(V(0,.35,0));const mesh=new THREE.Mesh(new THREE.SphereGeometry(.48,12,10),new THREE.MeshBasicMaterial({color:0xff9b54}));mesh.position.copy(origin);const light=new THREE.PointLight(0xff713b,2.2,12);mesh.add(light);scene.add(mesh);projectiles.push({mesh,velocity:forward.multiplyScalar(58),life:2.2});}
function burst(position,color=0xffa45d,count=9){for(let i=0;i<count;i++){const mesh=new THREE.Mesh(new THREE.SphereGeometry(.11+Math.random()*.13,7,6),new THREE.MeshBasicMaterial({color,transparent:true}));mesh.position.copy(position);scene.add(mesh);particles.push({mesh,velocity:V((Math.random()-.5)*8,Math.random()*8,(Math.random()-.5)*8),life:.55+Math.random()*.55});}}
function attune(){if(!state.started||state.paused||state.won)return;let nearest=null,dist=Infinity;for(const shrine of shrines)if(!shrine.collected){const d=dragon.root.position.distanceTo(V(shrine.x,shrine.y+1,shrine.z));if(d<dist){dist=d;nearest=shrine;}}if(nearest&&dist<10){nearest.collected=true;nearest.crystal.visible=false;nearest.light.color.set(0xffc36a);nearest.ring.material=M.gold;state.embers++;state.health=Math.min(100,state.health+15);burst(V(nearest.x,nearest.y+3,nearest.z),0x6cf0c4,24);toast(`${nearest.name} awakened · Ember ${state.embers} of 3`);updateHud();if(state.embers===3){state.won=true;state.started=false;$('#finalStats').textContent='3 EMBERS RECOVERED · '+Math.round(state.time)+'s IN FLIGHT';showScreen(ui.win);}}
 else toast(nearest?`Come closer to ${nearest.name}.`:'All embers are restored.');}
function updateHud(){ui.questCount.textContent=`${state.embers} / 3`;ui.shards.textContent=state.embers;ui.progress.style.width=`${state.embers/3*100}%`;ui.healthText.textContent=`${Math.round(state.health)}%`;ui.healthBar.style.width=`${state.health}%`;ui.healthBar.style.background=state.health<35?'#d96c4b':'';ui.speed.textContent=String(Math.round(Math.abs(state.speed)*3.6));const altitude=Math.round(dragon.root.position.y);ui.altitudeText.textContent=`${altitude} m`;ui.altitudeBar.style.height=`${clamp((altitude/105)*100,0,100)}%`;let target=shrines.find(s=>!s.collected);if(!target){ui.missionText.textContent='The valley is safe. Fly free.';ui.objective.querySelector('span:nth-child(2)').textContent='All embers restored';ui.distance.textContent='DONE';return;}ui.missionText.textContent=state.embers===0?'Find the three ancient embers scattered across the valley.':`${3-state.embers} ember${state.embers===2?'':'s'} remain. Attune at each shrine.`;ui.objective.querySelector('span:nth-child(2)').textContent=target.name;const d=dragon.root.position.distanceTo(V(target.x,target.y,target.z));ui.distance.textContent=`${Math.round(d)} m`;ui.hint.classList.toggle('show',d<12);}

function updateInput(dt){const keyForward=(keys.has('KeyW')||keys.has('ArrowUp')?1:0)-(keys.has('KeyS')||keys.has('ArrowDown')?1:0);const keyTurn=(keys.has('KeyD')||keys.has('ArrowRight')?1:0)-(keys.has('KeyA')||keys.has('ArrowLeft')?1:0);input.forward=keyForward||joyForward;input.turn=keyTurn||joyTurn;input.climb=(keys.has('Space')?1:0)-(keys.has('ControlLeft')||keys.has('ControlRight')?1:0)+touchClimb;input.dash=touchDash||keys.has('ShiftLeft')||keys.has('ShiftRight');const turn=clamp(input.turn,-1,1);dragon.root.rotation.y-=turn*1.35*dt;
 const forward=V(0,0,-1).applyQuaternion(dragon.root.quaternion),right=V(1,0,0).applyQuaternion(dragon.root.quaternion);let desired=clamp(input.forward,-1,1)*(input.dash?60:34);state.speed=THREE.MathUtils.damp(state.speed,desired,1.8,dt);dragon.root.position.addScaledVector(forward,state.speed*dt);dragon.root.position.x+=right.x*turn*4*dt;dragon.root.position.z+=right.z*turn*4*dt;dragon.root.position.y+=input.climb*(input.dash?25:16)*dt;dragon.root.position.y-=Math.max(0,dragon.root.position.y-(heightAt(dragon.root.position.x,dragon.root.position.z)+7))*1.4*dt;dragon.root.position.y=clamp(dragon.root.position.y,heightAt(dragon.root.position.x,dragon.root.position.z)+5,105);dragon.root.position.x=clamp(dragon.root.position.x,-265,265);dragon.root.position.z=clamp(dragon.root.position.z,-265,265);
 dragon.body.rotation.z=THREE.MathUtils.damp(dragon.body.rotation.z,-turn*.28,5,dt);dragon.body.rotation.x=THREE.MathUtils.damp(dragon.body.rotation.x,-input.climb*.16,4,dt);const flap=Math.sin(state.time*11)*.35;dragon.wings.forEach(w=>{w.pivot.rotation.z=w.sign*(.08+flap);w.pivot.rotation.x=.1+Math.sin(state.time*11+w.sign)*.12;});dragon.body.position.y=Math.sin(state.time*7)*.09;
}
function updateWorld(dt){state.time+=dt;state.fireCooldown=Math.max(0,state.fireCooldown-dt);state.damageCooldown=Math.max(0,state.damageCooldown-dt);clouds.forEach(c=>{c.position.x+=c.userData.drift*dt;if(c.position.x>260)c.position.x=-260;});
 shrines.forEach((s,i)=>{s.crystal.rotation.y+=dt*.7;s.crystal.position.y=2.8+Math.sin(state.time*2+i)*.22;s.ring.rotation.z+=dt*.26;s.light.intensity=s.collected?1.5:3.1+Math.sin(state.time*3+i)*.6;});
 wisps.forEach(w=>{if(!w.alive)return;w.group.position.set(w.home.x+Math.sin(state.time*.8+w.seed)*6,w.home.y+Math.sin(state.time*2+w.seed)*2.1,w.home.z+Math.cos(state.time*.7+w.seed)*6);w.core.rotation.y+=dt*1.4;w.core.rotation.x+=dt*.7;w.glow.intensity=2+Math.sin(state.time*5+w.seed)*.6;const d=w.group.position.distanceTo(dragon.root.position);if(d<5&&state.damageCooldown<=0){state.health=Math.max(0,state.health-12);state.damageCooldown=1.1;ui.flash.classList.add('show');setTimeout(()=>ui.flash.classList.remove('show'),180);burst(dragon.root.position.clone(),0xff7654,8);if(state.health===0){state.health=65;dragon.root.position.set(0,Math.max(18,heightAt(0,12)+12),12);state.speed=0;toast('The wind carries you back to the valley.');}updateHud();} });
 for(let i=projectiles.length-1;i>=0;i--){const p=projectiles[i],previous=p.mesh.position.clone();p.life-=dt;p.mesh.position.addScaledVector(p.velocity,dt);let hit=false;for(const w of wisps){if(!w.alive)continue;const segment=p.mesh.position.clone().sub(previous),lengthSq=segment.lengthSq(),t=lengthSq?clamp(w.group.position.clone().sub(previous).dot(segment)/lengthSq,0,1):0,closest=previous.clone().addScaledVector(segment,t);if(closest.distanceTo(w.group.position)<2.1){w.health--;burst(w.group.position,0xffa45d,12);hit=true;if(w.health<=0){w.alive=false;w.group.visible=false;state.health=Math.min(100,state.health+8);toast('Ember wisp scattered · vitality restored');updateHud();}break;}}if(hit||p.life<=0){scene.remove(p.mesh);projectiles.splice(i,1);}}
 for(let i=particles.length-1;i>=0;i--){const p=particles[i];p.life-=dt;p.mesh.position.addScaledVector(p.velocity,dt);p.velocity.y-=9*dt;p.mesh.scale.multiplyScalar(Math.max(.01,1-dt*1.5));if(p.life<=0){scene.remove(p.mesh);particles.splice(i,1);}}
 updateHud();}
function updateCamera(dt){const forward=V(0,0,-1).applyQuaternion(dragon.root.quaternion),desired=dragon.root.position.clone().addScaledVector(forward,-13).add(V(0,5.6,0));camera.position.lerp(desired,1-Math.exp(-3.4*dt));const look=dragon.root.position.clone().addScaledVector(forward,5).add(V(0,.7,0));camera.lookAt(look);}
function drawMap(){const canvas=$('#minimap'),ctx=canvas.getContext('2d'),w=canvas.width,h=canvas.height;ctx.clearRect(0,0,w,h);ctx.fillStyle='#192a26';ctx.fillRect(0,0,w,h);ctx.strokeStyle='rgba(185,196,157,.19)';ctx.lineWidth=1;for(let i=1;i<4;i++){ctx.beginPath();ctx.moveTo(i*w/4,0);ctx.lineTo(i*w/4,h);ctx.moveTo(0,i*h/4);ctx.lineTo(w,i*h/4);ctx.stroke();}ctx.strokeStyle='#5eaaa3';ctx.lineWidth=4;ctx.beginPath();for(let i=0;i<55;i++){const z=-235+i*8.6,x=45+Math.sin(i*.15)*28+Math.sin(i*.047)*44,px=w/2+x/560*w,py=h/2+z/560*h;i?ctx.lineTo(px,py):ctx.moveTo(px,py);}ctx.stroke();for(const s of shrines){if(s.collected)continue;const x=w/2+s.x/560*w,y=h/2+s.z/560*h;ctx.fillStyle='#e7c56e';ctx.beginPath();ctx.arc(x,y,3.8,0,Math.PI*2);ctx.fill();}const px=w/2+dragon.root.position.x/560*w,py=h/2+dragon.root.position.z/560*h;ctx.save();ctx.translate(px,py);ctx.rotate(-dragon.root.rotation.y);ctx.fillStyle='#f8eed3';ctx.beginPath();ctx.moveTo(0,-6);ctx.lineTo(4,5);ctx.lineTo(-4,5);ctx.closePath();ctx.fill();ctx.restore();}
let last=performance.now(),mapTick=0;
function animate(now){requestAnimationFrame(animate);const dt=Math.min(.15,(now-last)/1000||0);last=now;if(state.started&&!state.paused&&!state.won){updateInput(dt);updateWorld(dt);updateCamera(dt);if(keys.has('KeyQ'))breatheFire();}else updateCamera(dt);renderer.render(scene,camera);if(now-mapTick>160){drawMap();mapTick=now;}}
updateHud();updateCamera(1);drawMap();requestAnimationFrame(animate);
addEventListener('resize',()=>{camera.aspect=innerWidth/innerHeight;camera.updateProjectionMatrix();renderer.setSize(innerWidth,innerHeight);renderer.setPixelRatio(Math.min(devicePixelRatio,1.6));});
