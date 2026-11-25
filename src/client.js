import * as THREE from 'three';
import {OrbitControls} from 'three/addons/controls/OrbitControls.js';
import {deinterleaveGeometry} from 'three/addons/utils/BufferGeometryUtils.js';
import {SVGRenderer} from 'three/addons/renderers/SVGRenderer.js';
import {GLTFLoader} from 'three/addons/loaders/GLTFLoader.js';
const LANG=document.documentElement.lang==='en'?'en':'zh';
const $=id=>document.getElementById(id), KEY='goodaction-ocean-v1'+(LANG==='en'?'-en':'');
const items=[{id:'bottle',name:'塑料瓶',emoji:'🧴',bin:'recycle',desc:'一个空的饮料瓶，跟着海浪漂到了小岛。',fact:'塑料垃圾可能被海洋动物误食。干净、可回收的塑料瓶应按当地规则分类回收。',pos:[-3.3,0.35,2.6]},{id:'can',name:'饮料罐',emoji:'🥫',bin:'recycle',desc:'一个被遗落的空饮料罐，还可以成为新的资源。',fact:'清空内容物后，金属饮料罐通常可以回收。分类能让材料再次被利用。',pos:[2.6,0.4,2.4]},{id:'bag',name:'脏污塑料袋',emoji:'🛍️',bin:'other',desc:'这只沾满污物的塑料袋，在海水中看起来有些像水母。',fact:'塑料袋可能被海龟误认成食物。本课堂将难以回收的脏污塑料袋归入其他垃圾。',pos:[-3.1,0.2,-1.8]},{id:'battery',name:'废充电电池',emoji:'🔋',bin:'hazard',desc:'一块废弃充电电池，不应该留在海滩上。',fact:'废充电电池需按当地规定专门回收。现实中若发现破损或不明电池，请告诉成年人，不要徒手触碰。',pos:[3.6,0.3,-0.8]}];
const bins=[{id:'recycle',name:'可回收物',icon:'♻️'},{id:'other',name:'其他垃圾',icon:'🗑️'},{id:'hazard',name:'有害垃圾 / 专门回收',icon:'🔋'},{id:'food',name:'厨余垃圾',icon:'🍎'}];
const defaultPlan={title:'海洋守护行动',objective:'认识海洋垃圾，学会减少一次性用品并按规则分类。',intro:'海浪带来了一些不属于这里的东西，一起找找吧。',quiz:[{question:'为什么要减少一次性塑料制品？',options:['因为它们总能很快消失','因为它们可能进入海洋，影响动物与环境','因为海洋需要更多塑料'],answer:1,explanation:'减少一次性塑料的使用，有助于从源头减少进入环境的塑料垃圾。'},{question:'在海边发现破损电池，应该怎么做？',options:['徒手捡起放进口袋','告诉成年人，按当地要求安全处理','把它推进海里'],answer:1,explanation:'不要让儿童接触破损或不明废弃物。先告诉成年人，由合适的人安全处理。'},{question:'哪一个行动更有利于保护海洋？',options:['把垃圾藏进沙子里','只带走大件垃圾，小件不用管','自带水杯，并把自己产生的垃圾带走分类'],answer:2,explanation:'自带可重复使用的物品、减少垃圾，并把垃圾带走分类，都是可以坚持的小行动。'}],assetPrompt:'A single adorable low-poly cartoon sea turtle, jade green shell with geometric hexagonal scutes, mint green flippers, gentle friendly eyes, neutral swimming pose, isolated, no text, no ocean, no base, child-friendly educational 3D game asset'};
const builtInSource = '内置教学设计';
let state = {
  found: [],
  sorted: [],
  answers: [],
  nickname: '',
  completedAt: null,
  settings: {motion: matchMedia('(prefers-reduced-motion: reduce)').matches, contrast: false},
  plan: defaultPlan,
  planSource: builtInSource
};

try {
  const saved = JSON.parse(localStorage.getItem(KEY) || 'null');
  if (saved && Array.isArray(saved.found) && Array.isArray(saved.sorted) && Array.isArray(saved.answers)) {
    state = {...state, ...saved, settings: {...state.settings, ...saved.settings}};
    state.found = [...new Set(saved.found.filter(id => items.some(item => item.id === id)))];
    state.sorted = [...new Set(saved.sorted.filter(id => state.found.includes(id)))];
    state.nickname = typeof saved.nickname === 'string' ? saved.nickname : '';
    if (!validPlan(state.plan)) {
      state.plan = defaultPlan;
      state.planSource = builtInSource;
      state.answers = [];
    }
    state.answers = [...new Set(state.answers.filter(index =>
      Number.isInteger(index) && index >= 0 && index < state.plan.quiz.length
    ))];
    if (stage() !== 3 || typeof state.completedAt !== 'string' || !Number.isFinite(Date.parse(state.completedAt))) {
      state.completedAt = null;
    }
  }
} catch {}
function validPlan(p){return p&&typeof p.title==='string'&&typeof p.objective==='string'&&typeof p.intro==='string'&&Array.isArray(p.quiz)&&p.quiz.length===3&&p.quiz.every(q=>typeof q.question==='string'&&Array.isArray(q.options)&&[3,4].includes(q.options.length)&&q.options.every(o=>typeof o==='string')&&Number.isInteger(q.answer)&&q.answer>=0&&q.answer<q.options.length&&typeof q.explanation==='string');}
function save(){try{localStorage.setItem(KEY,JSON.stringify(state));}catch{toast('本机存储不可用，本次进度仍可继续。');}}
function esc(s){return String(s).replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));}
let toastTimer;function toast(t){$('toast').textContent=t;$('toast').classList.remove('hidden');clearTimeout(toastTimer);toastTimer=setTimeout(()=>$('toast').classList.add('hidden'),4200);}
function open(id){document.querySelectorAll('dialog[open]').forEach(d=>d.close());$(id).showModal();}document.querySelectorAll('[data-close]').forEach(b=>b.onclick=()=>b.closest('dialog').close());document.querySelectorAll('dialog').forEach(d=>d.addEventListener('click',e=>{if(e.target===d){const r=d.getBoundingClientRect();if(e.clientX<r.left||e.clientX>r.right||e.clientY<r.top||e.clientY>r.bottom)d.close();}}));
let models={},turtleRoot,customTurtle,scene,camera,renderer,controls,island,palmGroup,water,raycaster=new THREE.Raycaster(),pointer=new THREE.Vector2(),frame=0;const clock=new THREE.Clock();let ready3d=false,svgMode=false,paused=document.hidden;
const mat=(c,rough=0.85)=>new THREE.MeshStandardMaterial({color:c,roughness:rough});
const mats={sand:mat('#ecd5a1'),rim:mat('#c7aa7d'),grass:mat('#8aaf70'),trunk:mat('#a97d54'),leaf:mat('#41795e'),shell:mat('#508f65'),skin:mat('#9fbf79'),white:mat('#f8f0d8'),dark:mat('#173b36'),coral:mat('#e89177'),rock:mat('#b6bba0')};
function mesh(g,m,x=0,y=0,z=0,parent=scene){const v=new THREE.Mesh(g,m);v.position.set(x,y,z);v.castShadow=true;v.receiveShadow=true;parent.add(v);return v;}
function ellipsoid(m,s,pos,parent){const o=mesh(new THREE.SphereGeometry(1,10,7),m,...pos,parent);o.scale.set(...s);return o;}
function makeTurtle(){const g=new THREE.Group();ellipsoid(mats.shell,[.83,.38,1.05],[0,.3,0],g);ellipsoid(mats.skin,[.6,.17,.84],[0,.07,.03],g);const head=ellipsoid(mats.skin,[.35,.28,.4],[0,.25,1.1],g);for(const x of [-1,1]){ellipsoid(mats.skin,[.57,.08,.25],[x*.7,.08,.5],g).rotation.y=x*-.5;ellipsoid(mats.skin,[.36,.07,.19],[x*.6,.06,-.67],g).rotation.y=x*.5;ellipsoid(mats.dark,[.042,.062,.036],[x*.24,.35,1.36],g);}for(let i=0;i<6;i++){const a=i*Math.PI/3;const patch=mesh(new THREE.CylinderGeometry(.19,.21,.025,6),mat(i%2?'#71a779':'#6c9c6d'),Math.sin(a)*.43,.63-Math.abs(Math.sin(a))*.05,Math.cos(a)*.55,g);patch.rotation.z=-Math.sin(a)*.2;}mesh(new THREE.CylinderGeometry(.26,.27,.03,6),mat('#7ead7d'),0,.68,0,g);g.position.set(.1,.25,3.25);g.rotation.y=.45;g.scale.setScalar(1.08);return g;}
function makePalm(x,z,scale=1,tilt=0){const g=new THREE.Group();g.position.set(x,.7,z);g.scale.setScalar(scale);g.rotation.z=tilt;mesh(new THREE.CylinderGeometry(.12,.2,2.5,7),mats.trunk,0,1.2,0,g);for(let i=0;i<8;i++){const a=i*Math.PI/4;const leaf=ellipsoid(i%2?mats.leaf:mat('#65936b'),[.23,.075,.95],[Math.sin(a)*.67,2.5,Math.cos(a)*.67],g);leaf.rotation.y=a;leaf.rotation.x=.23;}for(let i=0;i<3;i++)ellipsoid(mat('#8d6545'),[.15,.16,.15],[Math.sin(i*2)*.17,2.36,Math.cos(i*2)*.17],g);palmGroup.add(g);}
function makeItem(item){const g=new THREE.Group();if(item.id==='bottle'){const b=mat('#7bbac1');mesh(new THREE.CylinderGeometry(.14,.17,.58,10),b,0,.32,0,g);mesh(new THREE.CylinderGeometry(.065,.12,.15,10),b,0,.68,0,g);mesh(new THREE.CylinderGeometry(.08,.08,.07,10),mat('#f4bc69'),0,.79,0,g);mesh(new THREE.CylinderGeometry(.172,.172,.18,10),mats.white,0,.34,0,g);g.rotation.z=.8;}else if(item.id==='can'){mesh(new THREE.CylinderGeometry(.21,.21,.55,14),mat('#e9946e'),0,.3,0,g);mesh(new THREE.CylinderGeometry(.22,.22,.03,14),mat('#ccd8c8'),0,.59,0,g);mesh(new THREE.CylinderGeometry(.223,.223,.12,14),mats.white,0,.32,0,g);g.rotation.z=-.6;}else if(item.id==='bag'){mesh(new THREE.BoxGeometry(.6,.55,.15),mat('#dfd5b0'),0,.3,0,g);const handle=new THREE.Mesh(new THREE.TorusGeometry(.17,.035,6,18),mats.white);handle.position.set(0,.65,0);g.add(handle);g.rotation.x=.8;g.rotation.z=.3;}else{mesh(new THREE.BoxGeometry(.4,.65,.23),mat('#6d8d79'),0,.35,0,g);mesh(new THREE.BoxGeometry(.4,.18,.24),mat('#e9c78d'),0,.61,0,g);mesh(new THREE.BoxGeometry(.11,.05,.1),mats.dark,.1,.74,0,g);g.rotation.z=1.1;}
const ring=mesh(new THREE.TorusGeometry(.53,.025,6,32),mat('#f8f3d6'),0,.025,0,g);ring.rotation.x=Math.PI/2;ring.userData.isRing=true;g.position.set(...item.pos);g.scale.setScalar(1.15);g.userData.itemId=item.id;g.traverse(c=>{c.userData.itemId=item.id;});return g;}
function makeCoral(x,z,c,s=1){const group=new THREE.Group();group.position.set(x,.02,z);for(let i=0;i<4;i++){const branch=mesh(new THREE.CylinderGeometry(.08,.14,.65+i*.12,5),mat(c),(i-1.5)*.15,.3,Math.sin(i)*.13,group);branch.rotation.z=(i-1.5)*.3;ellipsoid(mat(c),[.14,.2,.12],[(i-1.5)*.2,.65+i*.08,Math.sin(i)*.13],group);}group.scale.setScalar(s);scene.add(group);}
function initScene(){try{scene=new THREE.Scene();scene.background=new THREE.Color('#b7dfdf');scene.fog=new THREE.Fog('#b7dfdf',27,65);camera=new THREE.PerspectiveCamera(36,1,.1,100);camera.position.set(8,7,9);try{renderer=new THREE.WebGLRenderer({antialias:true,alpha:false,powerPreference:'low-power'});renderer.setPixelRatio(Math.min(devicePixelRatio,1.75));renderer.shadowMap.enabled=true;renderer.shadowMap.type=THREE.PCFSoftShadowMap;}catch{renderer=new SVGRenderer();renderer.setQuality('low');renderer.setPrecision(2);svgMode=true;document.querySelector('.scene-badge').textContent='轻量 3D 模式';}renderer.outputColorSpace=THREE.SRGBColorSpace;renderer.setClearColor(new THREE.Color('#b7dfdf'));renderer.domElement.setAttribute('aria-label','海洋课堂 3D 场景。可拖动旋转，探索任务也可通过下方观察站完成。');renderer.domElement.setAttribute('role','img');$('scene').append(renderer.domElement);
const hemi=new THREE.HemisphereLight('#fffbe7','#7aabaf',3);scene.add(hemi);const sun=new THREE.DirectionalLight('#fff4d8',4);sun.position.set(-6,12,7);sun.castShadow=true;sun.shadow.mapSize.set(1024,1024);sun.shadow.camera.left=-10;sun.shadow.camera.right=10;sun.shadow.camera.top=10;sun.shadow.camera.bottom=-10;sun.shadow.normalBias=.03;scene.add(sun);if(svgMode){sun.intensity=.55;scene.add(new THREE.AmbientLight('#ffffff',.4));}
water=mesh(new THREE.CircleGeometry(35,80),new THREE.MeshStandardMaterial({color:'#82c5c8',roughness:.3,metalness:.05}),0,-.12,0);water.rotation.x=-Math.PI/2;water.castShadow=false;if(svgMode)water.visible=false;
for(let i=0;i<4;i++){const ring=mesh(new THREE.RingGeometry(4.2+i*.85,4.25+i*.85,90),new THREE.MeshBasicMaterial({color:'#d0e8df',transparent:true,opacity:.35-i*.06,side:THREE.DoubleSide}),0,-.085+i*.005,0);ring.rotation.x=-Math.PI/2;ring.scale.set(1.05,.8,1);ring.userData.wave=i;}
island=new THREE.Group();scene.add(island);const base=mesh(new THREE.CylinderGeometry(3.4,3.7,.7,14),mats.rim,0,.14,0,island);base.scale.set(1.12,1,.8);const top=mesh(new THREE.CylinderGeometry(3.5,3.4,.33,16),mats.sand,0,.58,0,island);top.scale.set(1.12,1,.8);mesh(new THREE.CylinderGeometry(1.25,1.4,.08,9),mats.grass,.65,.78,-.6,island).scale.set(1.5,1,.8);
palmGroup=new THREE.Group();scene.add(palmGroup);makePalm(.5,-1.25,1.15,-.1);makePalm(1.65,-1.1,.8,.2);makePalm(-1.6,-.5,.8,-.22);
for(const [x,z,s] of [[-2.5,.6,.6],[2.7,.2,.65],[1.7,1.2,.4],[-.8,-2,.5]]){const rock=mesh(new THREE.DodecahedronGeometry(s,0),mats.rock,x,.8,z);rock.scale.set(1,.7,.7);}
makeCoral(-4.1,.1,'#e89982',.75);makeCoral(2.4,-3,'#ddae7d',.9);makeCoral(-1.9,3.4,'#8aaf94',.6);makeCoral(4,.8,'#e99a83',.6);
for(let i=0;i<12;i++){const a=i*2.3,r=4+Math.sin(i)*.8;const pebb=mesh(new THREE.DodecahedronGeometry(.08+(i%3)*.035),mats.white,Math.sin(a)*r,.04,Math.cos(a)*r*.8);pebb.scale.y=.45;}
const sign=new THREE.Group();sign.position.set(-.5,.8,.2);mesh(new THREE.BoxGeometry(.07,.7,.07),mats.trunk,0,.35,0,sign);mesh(new THREE.BoxGeometry(.72,.38,.1),mat('#e7e9ba'),0,.75,0,sign);const signtex=document.createElement('canvas');signtex.width=256;signtex.height=128;const cx=signtex.getContext('2d');cx.fillStyle='#e7e9ba';cx.fillRect(0,0,256,128);cx.fillStyle='#396c55';cx.font='bold 38px sans-serif';cx.textAlign='center';cx.fillText('BLUE',128,57);cx.font='20px sans-serif';cx.fillText('ISLAND',128,96);const texture=new THREE.CanvasTexture(signtex);mesh(new THREE.PlaneGeometry(.68,.34),new THREE.MeshBasicMaterial({map:texture}),0,.75,.056,sign);scene.add(sign);
turtleRoot=makeTurtle();scene.add(turtleRoot);for(const it of items){models[it.id]=makeItem(it);scene.add(models[it.id]);}
controls=new OrbitControls(camera,renderer.domElement);controls.target.set(0,.4,0);controls.enableDamping=true;controls.enablePan=false;controls.minDistance=9;controls.maxDistance=23;controls.minPolarAngle=.35;controls.maxPolarAngle=1.3;controls.autoRotate=false;
let down;renderer.domElement.addEventListener('pointerdown',e=>down=[e.clientX,e.clientY]);renderer.domElement.addEventListener('pointerup',e=>{if(!down||Math.hypot(e.clientX-down[0],e.clientY-down[1])>8)return;const rect=renderer.domElement.getBoundingClientRect();pointer.set(((e.clientX-rect.left)/rect.width)*2-1,-((e.clientY-rect.top)/rect.height)*2+1);raycaster.setFromCamera(pointer,camera);const hits=raycaster.intersectObjects(Object.values(models).filter(m=>m.visible),true);if(hits[0])showItem(hits[0].object.userData.itemId);else{const h=raycaster.intersectObject(customTurtle||turtleRoot,true);if(h.length)toast('你好，我是小蓝！一起把海洋变得更干净吧。');}});
const resize=()=>{const w=$('scene').clientWidth,h=$('scene').clientHeight;renderer.setSize(w,h);camera.aspect=w/h;camera.updateProjectionMatrix();};new ResizeObserver(resize).observe($('scene'));resize();ready3d=true;updateScene();animate();}catch(e){$('scene').innerHTML='<div class="empty3d"><b>当前设备未能启动 3D 画面</b><p>仍可通过下方「海漂观察站」完成全部任务。</p></div>';$('turtleTag').classList.add('hidden');$('itemTag').classList.add('hidden');for (const button of document.querySelectorAll('.view-controls button')) button.disabled = true;console.warn('3D rendering unavailable',e.message);}}
function updateScene(){if(!ready3d)return;for(const it of items)models[it.id].visible=!state.found.includes(it.id);const clean=state.sorted.length/4;scene.background.set(clean===1?'#c5e4dc':'#b7dfdf');water.material.color.set(clean===1?'#72c8c9':'#82c5c8');}
function placeTag(id,pos){const v=pos.clone().project(camera);const r=$('scene').getBoundingClientRect();const tag=$(id);if(v.z>1||Math.abs(v.x)>.95||Math.abs(v.y)>.9){tag.style.visibility='hidden';return;}tag.style.visibility='visible';tag.style.left=((v.x*.5+.5)*r.width)+'px';tag.style.top=((-v.y*.5+.5)*r.height)+'px';}
function animate(){requestAnimationFrame(animate);if(paused||document.hidden||document.querySelector('dialog[open]'))return;frame++;if(frame%(svgMode?8:2))return;const t=clock.getElapsedTime();if(!state.settings.motion){if(turtleRoot){turtleRoot.position.y=.32+Math.sin(t)*.07;turtleRoot.rotation.z=Math.sin(t*.7)*.035;}if(customTurtle)customTurtle.position.y=.55+Math.sin(t)*.07;for(const it of items)if(models[it.id].visible)models[it.id].position.y=it.pos[1]+Math.sin(t*1.3+it.pos[0])*.07;}controls.update();renderer.render(scene,camera);placeTag('turtleTag',(customTurtle?.position||turtleRoot.position).clone().add(new THREE.Vector3(0,1.3,0)));const next=items.find(it=>!state.found.includes(it.id));$('itemTag').classList.toggle('hidden',!next);if(next)placeTag('itemTag',models[next.id].position.clone().add(new THREE.Vector3(0,.95,0)));}
document.addEventListener('visibilitychange',()=>paused=document.hidden);
function stage() {
  if (state.found.length < items.length) return 0;
  if (state.sorted.length < items.length) return 1;
  return state.answers.length < state.plan.quiz.length ? 2 : 3;
}

$('objects').innerHTML = items.map(item => (
  '<button class="object-button" data-item="' + item.id + '">' +
  '<span aria-hidden="true">' + item.emoji + '</span>' +
  '<span><strong>' + item.name + '</strong><small></small></span></button>'
)).join('');
const objectButtons = [...$('objects').querySelectorAll('[data-item]')];
objectButtons.forEach(button => button.onclick = () => showItem(button.dataset.item));

function update() {
  const step = stage();
  const progressText = step + ' / 3 完成';
  if ($('progressText').textContent !== progressText) $('progressText').textContent = progressText;
  $('lessonProgress').value = step;

  for (let i = 0; i < 3; i++) {
    const element = $('step' + i);
    element.classList.toggle('current', step === i);
    element.classList.toggle('done', step > i);
    element.querySelector('.step-no').textContent = step > i ? '✓' : i + 1;
    if (step === i) element.setAttribute('aria-current', 'step');
    else element.removeAttribute('aria-current');
  }

  $('collectProgress').textContent = '已发现 ' + state.found.length + ' / 4 件海漂';
  $('sortProgress').textContent = '已正确归类 ' + state.sorted.length + ' / 4 件';
  $('quizProgress').textContent = '已探索 ' + state.answers.length + ' / 3 个知识点';
  $('mainAction').textContent = ['开始守护', '给海漂分类', '开始知识挑战', '领取守护证书'][step];
  if (step === 0 && state.found.length) $('mainAction').textContent = '继续寻找海漂';
  $('sceneTitle').textContent = state.plan.title;

  $('companionTitle').textContent = [
    '你好，我是小蓝。', '谢谢你！海漂都找到了。', '小岛变干净了！', '你是海洋守护者啦！'
  ][step];
  $('companionText').textContent = [
    state.plan.intro || defaultPlan.intro,
    '让我们把它们放进合适的垃圾桶。',
    '再认识三个知识点，把善意带回生活。',
    '谢谢你的每一个选择。愿善意继续发生。'
  ][step];

  for (const button of objectButtons) {
    const found = state.found.includes(button.dataset.item);
    const sorted = state.sorted.includes(button.dataset.item);
    button.classList.toggle('found', found);
    button.classList.toggle('sorted', sorted);
    button.querySelector('small').textContent =
      sorted ? '✓ 已正确归类' : found ? '已收集 · 点击分类' : '点击观察与收集';
  }
  $('restoreLesson').hidden = state.planSource === builtInSource;
  $('resetProgress').disabled = !state.found.length;
  applySettings();
  updateScene();
  save();
}

function showItem(id) {
  const item = items.find(candidate => candidate.id === id);
  if (!item) return;

  const found = state.found.includes(id);
  const sorted = state.sorted.includes(id);
  const sorting = found && !sorted;
  const observation = '<div class="object-hero" aria-hidden="true">' + item.emoji +
    '</div><p>' + esc(item.desc) + '</p>';
  const fact = '<div class="fact">' + esc(item.fact) + '</div>';
  $('itemHeading').textContent = item.name;
  const body = $('itemBody');

  if (sorted) {
    const bin = bins.find(candidate => candidate.id === item.bin);
    body.innerHTML = observation + '<div class="feedback" id="itemFeedback" tabindex="-1">' +
      '✓ 已正确分类：' + bin.name + '</div>' + fact +
      '<button class="primary full" id="continueMission">继续守护任务</button>';
    $('continueMission').onclick = mainAction;
  } else if (sorting) {
    body.innerHTML = observation + '<p>它应该去哪里？</p><div class="bins">' + bins.map(bin => (
      '<button class="bin" data-bin="' + bin.id + '"><i aria-hidden="true">' + bin.icon + '</i>' + bin.name + '</button>'
    )).join('') + '</div><div id="sortFeedback" role="status"></div>';
    body.querySelectorAll('[data-bin]').forEach(button => button.onclick = () => {
      if (button.dataset.bin !== item.bin) {
        $('sortFeedback').className = 'feedback';
        $('sortFeedback').textContent = '再想一想：' + item.fact;
        return;
      }
      state.sorted.push(id);
      update();
      showItem(id);
    });
  } else {
    body.innerHTML = observation + fact + '<button class="primary full" id="collectItem">把海漂带离海洋</button>';
    $('collectItem').onclick = () => {
      state.found.push(id);
      update();
      $('itemModal').close();
      toast(state.found.length === items.length ?
        '四件海漂都找到了！现在把它们送回合适的地方。' : '已收集 ' + item.name + '，小岛更干净了一点。');
    };
  }

  if (!$('itemModal').open) open('itemModal');
  if (sorted) $('itemFeedback').focus();
  else if (sorting) body.querySelector('[data-bin]').focus();
  else $('collectItem').focus();
}

let currentQuiz = 0;
function showQuiz() {
  currentQuiz = state.plan.quiz.findIndex((_question, index) => !state.answers.includes(index));
  if (currentQuiz < 0) {
    showCertificate();
    return;
  }
  renderQuiz();
  open('quizModal');
  $('quizQuestion').focus();
}

function renderQuiz() {
  const question = state.plan.quiz[currentQuiz];
  $('quizHeading').textContent = '海洋知识小挑战 · ' + (currentQuiz + 1) + ' / ' + state.plan.quiz.length;
  $('quizBody').innerHTML = '<h3 id="quizQuestion" tabindex="-1">' + esc(question.question) + '</h3>' +
    question.options.map((option, index) => (
      '<button class="answer" data-answer="' + index + '">' + String.fromCharCode(65 + index) + '. ' + esc(option) + '</button>'
    )).join('') + '<div id="quizFeedback" role="status" tabindex="-1"></div>' +
    '<button class="primary full hidden" id="nextQuiz">下一题</button>';

  const answers = [...$('quizBody').querySelectorAll('[data-answer]')];
  const feedback = $('quizFeedback');
  const next = $('nextQuiz');
  answers.forEach(button => button.onclick = () => {
    feedback.className = 'feedback';
    if (Number(button.dataset.answer) !== question.answer) {
      button.classList.add('wrong');
      feedback.textContent = '可以再选一次。请再读一遍题目，想想每个选项会带来什么结果。';
      return;
    }

    state.answers.push(currentQuiz);
    button.classList.add('correct');
    feedback.textContent = '✓ ' + question.explanation;
    next.classList.remove('hidden');
    if (stage() === 3) {
      state.completedAt = new Date().toISOString();
      next.textContent = '领取守护证书';
    }
    feedback.focus();
    answers.forEach(answer => answer.disabled = true);
    update();
  });

  next.onclick = () => {
    if (stage() === 3) {
      showCertificate();
    } else {
      currentQuiz = state.plan.quiz.findIndex((_question, index) => !state.answers.includes(index));
      renderQuiz();
      $('quizQuestion').focus();
    }
  };
}

function showCertificate() {
  $('certName').textContent = state.nickname || '小小行动家';
  $('nameInput').value = state.nickname;
  const date = $('certDate');
  date.hidden = !state.completedAt;
  date.textContent = state.completedAt ?
    new Intl.DateTimeFormat(LANG === 'en' ? 'en-GB' : 'zh-CN', {dateStyle: 'long'}).format(new Date(state.completedAt)) : '';
  open('certificateModal');
}

$('nameInput').oninput = () => {
  state.nickname = $('nameInput').value.trim();
  $('certName').textContent = state.nickname || '小小行动家';
  save();
};
$('printCert').onclick = () => window.print();

function download(name, data, type = 'application/json') {
  const blob = new Blob([data], {type});
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = name;
  link.click();
  setTimeout(() => URL.revokeObjectURL(url), 5000);
}

$('exportRecord').onclick = () => download('蓝海课堂-学习记录.json', JSON.stringify({
  course: state.plan.title,
  nickname: state.nickname || '小小行动家',
  completedAt: state.completedAt,
  found: state.found,
  sorted: state.sorted,
  knowledgeCompleted: state.answers.length,
  planSource: state.planSource
}, null, 2));

function mainAction() {
  const step = stage();
  if (step === 0) showItem(items.find(item => !state.found.includes(item.id)).id);
  else if (step === 1) showItem(items.find(item => !state.sorted.includes(item.id)).id);
  else if (step === 2) showQuiz();
  else showCertificate();
}
$('mainAction').onclick = mainAction;

function clearProgress() {
  state.found = [];
  state.sorted = [];
  state.answers = [];
  state.completedAt = null;
  update();
}
$('resetProgress').onclick = () => {
  if (!state.found.length || !confirm('重新体验会清除本机的收集、分类和答题进度，课程和素材会保留。')) return;
  clearProgress();
  $('mainAction').focus();
  toast('新的守护行动，开始啦。');
};

$('zoomIn').onclick = () => {
  if (controls) {
    camera.position.sub(controls.target).multiplyScalar(.88).add(controls.target);
    controls.update();
  }
};
$('zoomOut').onclick = () => {
  if (controls) {
    camera.position.sub(controls.target).multiplyScalar(1.12).add(controls.target);
    controls.update();
  }
};
$('resetView').onclick = () => {
  if (camera) {
    camera.position.set(8, 7, 9);
    controls.target.set(0, .4, 0);
    controls.update();
  }
};

function focusClassroom() {
  document.querySelectorAll('dialog[open]').forEach(dialog => dialog.close());
  $('mainAction').focus();
}
function openCreator() {
  open('creatorModal');
  refreshStatus();
}
$('exploreNav').onclick = focusClassroom;
$('teacherNav').onclick = () => open('teacherModal');
$('teacherStart').onclick = focusClassroom;
$('teacherCreate').onclick = openCreator;
$('creatorNav').onclick = openCreator;
$('serviceBtn').onclick = openCreator;
$('aboutNav').onclick = () => open('aboutModal');
$('accessibilityBtn').onclick = () => open('settingsModal');
function applySettings(){document.body.classList.toggle('reduce-motion',state.settings.motion);document.body.classList.toggle('high-contrast',state.settings.contrast);$('motionToggle').checked=state.settings.motion;$('contrastToggle').checked=state.settings.contrast;}$('motionToggle').onchange=()=>{state.settings.motion=$('motionToggle').checked;applySettings();save();};$('contrastToggle').onchange=()=>{state.settings.contrast=$('contrastToggle').checked;applySettings();save();};
const verifiedServices=new Map();let serviceStatus={};async function api(path,body){const res=await fetch(path+(path.includes('?')?'&':'?')+'lang='+LANG,body?{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({...body,lang:LANG})}:undefined);const data=await res.json();if(!res.ok)throw new Error(data.error||'服务暂时不可用');return data;}
async function refreshStatus(){try{serviceStatus=await api('/api/status');for(const k of ['astron','spark','aholo']){const el=$(k+'State');el.textContent=serviceStatus[k]?(verifiedServices.has(k)?'调用成功 · '+verifiedServices.get(k):'已配置 · 待调用验证'):k==='aholo'&&assetMeta?.verifiedAholo?'素材已接入 · API待连接':'待连接';el.className='state'+(serviceStatus[k]||(k==='aholo'&&assetMeta?.verifiedAholo)?' on':'');}}catch{for(const k of ['astron','spark','aholo'])$(k+'State').textContent='状态暂不可用';}}
document.querySelectorAll('[data-prompt]').forEach(b=>b.onclick=()=>$('lessonPrompt').value=b.dataset.prompt);
const planResult = $('planResult');
const generationNote = $('generationNote');

function applyLesson(plan, source) {
  if (state.found.length && !confirm('更换课程会清除本机的收集、分类和答题进度。确定继续吗？')) return false;
  state.plan = plan;
  state.planSource = source;
  clearProgress();
  focusClassroom();
  return true;
}

function previewLesson({plan, provider}) {
  const questions = plan.quiz.map(question =>
    '<li><strong>' + esc(question.question) + '</strong><ul>' +
    question.options.map(option => '<li>' + esc(option) + '</li>').join('') + '</ul>' +
    '<p class="answer-key"><strong>正确答案</strong> · ' + esc(question.options[question.answer]) + '</p>' +
    '<p class="review-explanation">' + esc(question.explanation) + '</p></li>'
  ).join('');

  planResult.innerHTML = '<section class="info-card" aria-labelledby="reviewHeading">' +
    '<h3 id="reviewHeading" tabindex="-1">审阅课程草稿</h3>' +
    '<p><strong>' + esc(plan.title) + '</strong></p><p>' + esc(plan.objective) + '</p>' +
    '<p>' + esc(plan.intro) + '</p>' +
    '<p class="note">请核对题目、答案与解析。3D 场景与分类任务使用海洋课堂模板。</p>' +
    '<ol class="review-questions">' + questions + '</ol>' +
    '<button class="primary full" id="applyPlan">应用到课堂</button></section>';
  planResult.classList.remove('hidden');
  $('applyPlan').onclick = () => {
    if (applyLesson(plan, provider)) toast('已应用新的课程内容。');
  };
  if ($('creatorModal').open) $('reviewHeading').focus();
}

$('generatePlan').onclick = async () => {
  const prompt = $('lessonPrompt').value.trim();
  if (!prompt) {
    generationNote.textContent = '先写下你的教学想法。';
    $('lessonPrompt').focus();
    return;
  }

  const provider = $('planProvider').value;
  const button = $('generatePlan');
  button.disabled = true;
  button.textContent = '正在规划课程…';
  planResult.classList.add('hidden');
  generationNote.textContent = provider === 'astron' ?
    '正在通过 Astron 生成课程，可能需要约 2 分钟，请保持页面打开。' :
    '正在向所选服务提交教学需求，请稍候。';

  try {
    const result = await api('/api/plan', {prompt, provider});
    if (!validPlan(result.plan)) throw new Error('课程格式暂不适用，请调整需求后重试。');
    const time = new Date(result.generatedAt).toLocaleTimeString(LANG === 'en' ? 'en-GB' : 'zh-CN');
    verifiedServices.set(provider, time);
    refreshStatus();
    generationNote.textContent = '生成完成，可以审阅课程草稿。';
    previewLesson(result);
  } catch (error) {
    generationNote.textContent = error.message;
  } finally {
    button.disabled = false;
    button.textContent = '生成课程方案';
  }
};

$('restoreLesson').onclick = () => {
  if (applyLesson(defaultPlan, builtInSource)) toast('已恢复内置海洋课堂。');
};
$('exportPlan').onclick=()=>download('蓝海课堂-课程与素材记录.json',JSON.stringify({format:'goodaction.lesson.v1',plan:state.plan,source:state.planSource,language:LANG,asset:assetMeta||{source:'程序化内置素材',verifiedAholo:false},exportedAt:new Date().toISOString()},null,2));
let assetMeta=null,assetBlob=null;
function assetDB(){return new Promise((resolve,reject)=>{const r=indexedDB.open('goodaction-assets',1);r.onupgradeneeded=()=>r.result.createObjectStore('assets');r.onsuccess=()=>resolve(r.result);r.onerror=()=>reject(r.error);});}
async function storeAsset(blob,meta){try{const db=await assetDB();await new Promise((resolve,reject)=>{const tx=db.transaction('assets','readwrite');tx.objectStore('assets').put({blob,meta},'turtle');tx.oncomplete=resolve;tx.onerror=()=>reject(tx.error);});db.close();}catch{toast('素材已加载，但本机未能保存，刷新后需要重新导入。');}}
async function loadAsset(blob,meta,persist=true){if(blob.size>25*1024*1024)throw new Error('模型超过 25 MB，请先精简模型。');const bytes=await blob.arrayBuffer();if(bytes.byteLength<12||new DataView(bytes).getUint32(0,true)!==0x46546c67)throw new Error('请选择有效的 GLB 二进制模型。');if(!ready3d)throw new Error('当前设备无法显示 3D 模型，请在支持 WebGL 的浏览器中重试。');const gltf=await new GLTFLoader().parseAsync(bytes,'');const root=gltf.scene;const box=new THREE.Box3().setFromObject(root);const size=box.getSize(new THREE.Vector3());const max=Math.max(size.x,size.y,size.z);if(!Number.isFinite(max)||max<=0)throw new Error('模型中没有可显示的内容。');root.position.sub(box.getCenter(new THREE.Vector3()));const wrapper=new THREE.Group();wrapper.add(root);wrapper.scale.setScalar(2.4/max);wrapper.position.set(.1,.55,3.25);wrapper.rotation.y=.45;root.traverse(o=>{o.castShadow=true;o.receiveShadow=true;if(svgMode&&o.geometry)deinterleaveGeometry(o.geometry);});if(customTurtle){scene.remove(customTurtle);disposeObject(customTurtle);}customTurtle=wrapper;scene.add(wrapper);turtleRoot.visible=false;assetMeta=meta;assetBlob=blob;$('assetStatus').textContent=(meta.verifiedAholo?'已加载 Aholo Lux3D 生成素材':'已加载导入素材（来源由导入者填写）')+'。'+(meta.source||'')+(meta.taskId?' · 任务 '+meta.taskId:'');if(meta.verifiedAholo){document.querySelector('.scene-badge').textContent=(svgMode?'轻量 3D · ':'3D 世界 · ')+'Aholo 海龟';renderer.domElement.setAttribute('aria-label','海洋课堂 3D 场景。已加载 Aholo Lux3D 生成的低模海龟，可旋转与探索。');if(!serviceStatus.aholo){$('aholoState').textContent='素材已接入 · API待连接';$('aholoState').className='state on';}}if(persist)await storeAsset(blob,meta);}
function disposeObject(root){root.traverse(o=>{o.geometry?.dispose();if(o.material){for(const m of Array.isArray(o.material)?o.material:[o.material]){for(const v of Object.values(m))if(v?.isTexture)v.dispose();m.dispose();}}});}
$('assetFile').onchange=async()=>{const file=$('assetFile').files[0];if(!file)return;try{await loadAsset(file,{source:$('assetSource').value.trim()||file.name,verifiedAholo:false,importedAt:new Date().toISOString()});toast('小蓝的新形象已加载，并保存在本机。');}catch(e){toast(e.message);}finally{$('assetFile').value='';}};
async function loadPublishedAsset(){
 const meta=await api('/api/bundled-asset');const response=await fetch(svgMode?'/assets/aholo-turtle-light.glb?v=2':'/assets/aholo-turtle.glb?v=2');if(!response.ok)throw new Error('发布海龟加载失败，暂用备用形象。');await loadAsset(await response.blob(),{...meta,published:true},false);
}
$('removeAsset').onclick=async()=>{try{const db=await assetDB();await new Promise((resolve,reject)=>{const tx=db.transaction('assets','readwrite');tx.objectStore('assets').delete('turtle');tx.oncomplete=resolve;tx.onerror=reject;});db.close();await loadPublishedAsset();toast('已恢复 Aholo 发布版海龟。');}catch(e){toast(e.message);}};
$('generateAsset').onclick=async()=>{const b=$('generateAsset');b.disabled=true;b.textContent='正在创建生成任务…';let lastTask=null;try{const created=await api('/api/asset/create',{});lastTask=created.taskId;let done=false;for(let n=0;n<100;n++){b.textContent='Lux3D 正在生成 · '+Math.min(98,n+1)+' 次查询';await new Promise(resolve=>setTimeout(resolve,5000));const result=await api('/api/asset/task?id='+encodeURIComponent(lastTask));if(result.status===3){b.textContent='正在加载真实生成素材…';const res=await fetch('/api/asset/file?id='+encodeURIComponent(lastTask));if(!res.ok)throw new Error('模型下载失败，可稍后用任务编号重新查询。');const blob=await res.blob();await loadAsset(blob,{source:'Aholo Lux3D API · G1-Turbo',verifiedAholo:true,taskId:lastTask,prompt:defaultPlan.assetPrompt,generatedAt:new Date().toISOString()});done=true;toast('Aholo 生成的海龟已经来到小岛。');break;}if(result.status===4||result.status===6)throw new Error('Lux3D 任务失败或已取消。');}if(!done)throw new Error('生成尚未完成，请在 Aholo 控制台查看任务。');}catch(e){$('assetStatus').textContent=e.message+(lastTask?' 任务编号：'+lastTask:'');}finally{b.disabled=false;b.textContent='用 Lux3D 生成海龟';}};
initScene();update();(async()=>{
 let saved;try{const db=await assetDB();saved=await new Promise((resolve,reject)=>{const req=db.transaction('assets','readonly').objectStore('assets').get('turtle');req.onsuccess=()=>resolve(req.result);req.onerror=()=>reject(req.error);});db.close();}catch{}
 if(saved)try{await loadAsset(saved.blob,saved.meta,false);return;}catch{toast('上次导入素材未能加载，正在恢复发布版海龟。');}
 try{await loadPublishedAsset();}catch(e){$('assetStatus').textContent=e.message;toast('海龟素材暂未加载，已保留可继续学习的备用场景。');}
})();
