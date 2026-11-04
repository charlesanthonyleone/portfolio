/* Ship deck, swinging lantern with live flame, gentle rocking. Toggle: gear "Ship rocking & lantern" (key pf-rock). */
(()=>{const K='pf-rock',rm=matchMedia('(prefers-reduced-motion: reduce)').matches;
let on=(()=>{try{const v=localStorage.getItem(K);return v===null?!rm:v==='1'}catch{return!rm}})();
window.pfMotion=()=>on;document.documentElement.classList.toggle('calm',!on);
const $=id=>document.getElementById(id),sc=document.querySelector('.scene'),top=$('scene-top'),ship=$('ship'),deck=$('deck'),lan=$('lantern'),fc=$('flame'),glow=$('lglow'),pool=$('lpool'),dawn=$('dawn'),cb=$('set-rock');
const fx=fc.getContext('2d');
cb.checked=on;cb.onchange=()=>{on=cb.checked;try{localStorage.setItem(K,on?'1':'0')}catch{};document.documentElement.classList.toggle('calm',!on);dispatchEvent(new Event('pfmotion'));on?loop():still()};
const CFG={d:{src:'assets/sky/deck.webp',W:2560,H:1440,hx:.898,hy:.475,lh:.40,px:.80,py:.86,ax:.5},m:{src:'assets/sky/deck-m.webp',W:1328,H:1152,hx:.843,hy:.475,lh:.40,px:.72,py:.86,ax:.82}};
let c,iw,ih,lw,lhh,DPR=Math.min(devicePixelRatio||1,2);
function fit(){const w=innerWidth,h=innerHeight;c=w<760?CFG.m:CFG.d;if(!deck.src.endsWith(c.src))deck.src=c.src;
const s=Math.max(w/c.W,h/c.H*(w<760?.92:1),h*.62/(c.H*.55))*1.04;iw=c.W*s;ih=c.H*s;const x=(w-iw)*c.ax,y=h-ih;
ship.style.width=iw+'px';ship.style.height=ih+'px';ship.style.left=x+'px';ship.style.top=y+'px';
lhh=ih*c.lh;lw=lhh*427/1050;Object.assign(lan.style,{width:lw+'px',height:lhh+'px',left:(c.hx*iw-lw/2)+'px',top:(c.hy*ih)+'px'});
fc.width=Math.round(lw*.5*DPR);fc.height=Math.round(lhh*.32*DPR);fc.style.width=lw*.5+'px';fc.style.height=lhh*.32+'px';
const R=Math.max(180,iw*.2);glow.style.setProperty('--r',R+'px');glow.style.left=c.hx*iw+'px';glow.style.top=(c.hy*ih+lhh*.47)+'px';
pool.style.left=c.px*iw+'px';pool.style.top=c.py*ih+'px';pool.style.setProperty('--r',iw*.22+'px')}
addEventListener('resize',fit);fit();
/* flame model */
let I=1,sp=0,spT=0,pops=0,sparks=[],seed=Math.random()*99;
const n=(t,k)=>Math.sin(t*k+seed)*.5+Math.sin(t*k*2.31+seed*1.7)*.3+Math.sin(t*k*5.17+seed*.3)*.2;
function flame(t,dt){const W=fc.width,H=fc.height;fx.clearRect(0,0,W,H);
if(on){if(t>spT){const r=Math.random();sp=r<.55?-(0.35+Math.random()*.4):r<.8?.35+Math.random()*.3:-(0.15);spT=t+.6+Math.random()*(r<.55?2.8:4);pops=.12+Math.random()*.22;if(sp>0)for(let i=0;i<4+Math.random()*6;i++)sparks.push({x:0,y:0,vx:(Math.random()-.5)*30,vy:-(40+Math.random()*70),l:.5+Math.random()*.8,a:0})}
pops=Math.max(0,pops-dt);const ev=pops>0?sp*Math.sin(Math.min(1,pops/.12)*Math.PI*.5):0;
I+=((1+.16*n(t,7)+.09*n(t,19)+ev)-I)*Math.min(1,dt*22)}else I=1;
const cx=W/2,base=H*.92,h=H*.78*Math.max(.25,I),sw=on?(n(t,3.1)*.12+n(t,9)*.05)*W:0,wd=W*.16*(.8+.25*I);
fx.globalCompositeOperation='lighter';
const halo=fx.createRadialGradient(cx,base-h*.45,0,cx,base-h*.45,W*.5);halo.addColorStop(0,`rgba(255,170,70,${.35*I})`);halo.addColorStop(1,'rgba(255,120,30,0)');fx.fillStyle=halo;fx.fillRect(0,0,W,H);
const shape=(k,col)=>{const hh=h*k,ww=wd*k;fx.beginPath();fx.moveTo(cx-ww,base);fx.bezierCurveTo(cx-ww*1.25,base-hh*.45,cx+sw*.4-ww*.3,base-hh*.8,cx+sw,base-hh);fx.bezierCurveTo(cx+sw*.4+ww*.3,base-hh*.8,cx+ww*1.25,base-hh*.45,cx+ww,base);fx.closePath();fx.fillStyle=col;fx.fill()};
let g=fx.createLinearGradient(0,base,0,base-h);g.addColorStop(0,'rgba(255,120,30,.0)');g.addColorStop(.15,'rgba(255,130,35,.85)');g.addColorStop(.7,'rgba(255,90,20,.5)');g.addColorStop(1,'rgba(200,50,10,0)');shape(1,g);
g=fx.createLinearGradient(0,base,0,base-h*.75);g.addColorStop(0,'rgba(120,150,255,.5)');g.addColorStop(.18,'rgba(255,230,150,.95)');g.addColorStop(1,'rgba(255,190,80,0)');shape(.62,g);
g=fx.createLinearGradient(0,base,0,base-h*.45);g.addColorStop(0,'rgba(255,255,240,.0)');g.addColorStop(.25,'rgba(255,255,235,1)');g.addColorStop(1,'rgba(255,240,200,0)');shape(.32,g);
for(let i=sparks.length-1;i>=0;i--){const s=sparks[i];s.a+=dt;if(s.a>s.l){sparks.splice(i,1);continue}s.x+=s.vx*dt*DPR;s.y+=s.vy*dt*DPR;s.vy+=20*dt;const a=1-s.a/s.l;fx.fillStyle=`rgba(255,${180+60*a|0},90,${a})`;fx.beginPath();fx.arc(cx+sw+s.x,base-h+s.y,1.3*DPR*a+.4,0,7);fx.fill()}
fx.globalCompositeOperation='source-over';
const L=Math.max(.2,I);glow.style.opacity=(.55+.45*L).toFixed(3);pool.style.opacity=(.35+.55*L).toFixed(3)}
/* rocking */
let raf=0,last=performance.now();
function frame(now){const t=now/1000,dt=Math.min(.05,(now-last)/1000);last=now;
const roll=1.6*Math.sin(t*2*Math.PI/9.5),pitch=10*Math.sin(t*2*Math.PI/8.2+1.1),heave=4*Math.sin(t*2*Math.PI/6.3);
const T=`translateY(${pitch+heave}px) rotate(${roll}deg) scale(1.08)`;sc.style.transform=T;top.style.transform=T;if(dawn)dawn.style.transform=T;
ship.style.transform=`translateY(${-heave*.25}px) rotate(${-roll*.12}deg)`;
lan.style.transform=`rotate(${-roll*1.6+Math.sin(t*2*Math.PI/9.5-0.9)*1.2}deg)`;
flame(t,dt);if(on)raf=requestAnimationFrame(frame)}
function still(){cancelAnimationFrame(raf);sc.style.transform=top.style.transform=ship.style.transform=lan.style.transform='';if(dawn)dawn.style.transform='';flame(0,0)}
function loop(){cancelAnimationFrame(raf);last=performance.now();raf=requestAnimationFrame(frame)}
deck.onload=()=>{};on?loop():still();
document.addEventListener('visibilitychange',()=>{document.hidden?cancelAnimationFrame(raf):on&&loop()})})();
