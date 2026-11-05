/* Ship deck, swinging lantern with live flame, gentle rocking. Toggle: gear "Ship rocking & lantern" (key pf-rock). */
(()=>{const K='pf-rock',rm=matchMedia('(prefers-reduced-motion: reduce)').matches;
let on=(()=>{try{const v=localStorage.getItem(K);return v===null?!rm:v==='1'}catch{return!rm}})();
window.pfMotion=()=>on;document.documentElement.classList.toggle('calm',!on);
const $=id=>document.getElementById(id),sc=document.querySelector('.scene'),top=$('scene-top'),ship=$('ship'),deck=$('deck'),lan=$('lantern'),fc=$('flame'),glow=$('lglow'),pool=$('lpool'),dawn=$('dawn'),cb=$('set-rock');
const gl=fc.getContext('webgl',{premultipliedAlpha:true,alpha:true});let pr,uT,uI,uS,uR;
if(gl){const sh=(ty,src)=>{const o=gl.createShader(ty);gl.shaderSource(o,src);gl.compileShader(o);return o};pr=gl.createProgram();
gl.attachShader(pr,sh(gl.VERTEX_SHADER,'attribute vec2 p;varying vec2 v;void main(){v=p*.5+.5;gl_Position=vec4(p,0,1);}'));
gl.attachShader(pr,sh(gl.FRAGMENT_SHADER,`precision highp float;varying vec2 v;uniform float t,I,S;uniform vec2 R;
float h(vec2 p){return fract(sin(dot(p,vec2(127.1,311.7)))*43758.5453);}
float n(vec2 p){vec2 i=floor(p),f=fract(p);f=f*f*(3.-2.*f);return mix(mix(h(i),h(i+vec2(1,0)),f.x),mix(h(i+vec2(0,1)),h(i+1.),f.x),f.y);}
float fbm(vec2 p){float a=.5,s=0.;for(int i=0;i<5;i++){s+=a*n(p);p=p*2.03+vec2(1.7,9.2);a*=.5;}return s;}
void main(){vec2 u=v;u.x=(u.x-.5)*R.x/R.y;float y=(u.y-.06)/.9;
float q=fbm(vec2(u.x*3.,y*2.-t*2.6))*.9+fbm(vec2(u.x*7.+3.,y*4.-t*4.3))*.35;
float bend=S*y*y;float x=u.x-bend+(q-.6)*.3*y;
float w=.19*(1.-y)*sqrt(max(y,0.))*2.1*(.75+.35*I);
float d=abs(x)/max(w,.001);float hh=.62+.3*I;
float f=(1.-smoothstep(.2,1.,d))*smoothstep(0.,.05,y)*(1.-smoothstep(hh*.55,hh,y+(q-.55)*.9));
f=clamp(f*(.75+q*.6),0.,1.);
float core=(1.-smoothstep(0.,.55,d))*(1.-smoothstep(.0,.38*hh,y));
vec3 c=mix(vec3(.55,.06,.01),vec3(1.,.38,.05),smoothstep(.05,.45,f));c=mix(c,vec3(1.,.78,.32),smoothstep(.45,.8,f));c=mix(c,vec3(1.,.98,.88),core*smoothstep(.3,.9,f));
vec3 blue=vec3(.25,.4,1.)*(1.-smoothstep(0.,.06,y))*(1.-smoothstep(0.,.7,d))*.6;
float a=f*(.85+.15*I);vec3 col=c*a*(.85+.3*I)+blue;
float halo=exp(-length(vec2(u.x,(y-.25)*.7))*7.)*.22*I;col+=vec3(1.,.55,.2)*halo;
gl_FragColor=vec4(col,max(a,halo));}`));
gl.linkProgram(pr);gl.useProgram(pr);const b=gl.createBuffer();gl.bindBuffer(gl.ARRAY_BUFFER,b);gl.bufferData(gl.ARRAY_BUFFER,new Float32Array([-1,-1,1,-1,-1,1,1,1]),gl.STATIC_DRAW);
const l=gl.getAttribLocation(pr,'p');gl.enableVertexAttribArray(l);gl.vertexAttribPointer(l,2,gl.FLOAT,false,0,0);uT=gl.getUniformLocation(pr,'t');uI=gl.getUniformLocation(pr,'I');uS=gl.getUniformLocation(pr,'S');uR=gl.getUniformLocation(pr,'R')}
cb.checked=on;cb.onchange=()=>{on=cb.checked;try{localStorage.setItem(K,on?'1':'0')}catch{};document.documentElement.classList.toggle('calm',!on);dispatchEvent(new Event('pfmotion'));on?loop():still()};
const CFG={d:{src:'assets/sky/deck.webp',W:2560,H:1800,hx:.898,hy:.58,lh:.32,px:.80,py:.888,ax:.5,dy:.128},m:{src:'assets/sky/deck-m.webp',W:1328,H:1440,hx:.84,hy:.26,lh:.118,px:.72,py:.888,ax:.82,dy:.03,}};
let c,iw,ih,lw,lhh,DPR=Math.min(devicePixelRatio||1,2.5);
function fit(){const w=innerWidth,h=innerHeight;c=w<760?CFG.m:CFG.d;if(!deck.src.endsWith(c.src))deck.src=c.src;
const s=Math.max(w/c.W,h/(c.H*.8))*1.04;iw=c.W*s;ih=c.H*s;const x=(w-iw)*c.ax,y=h-ih+ih*c.dy;
ship.style.width=iw+'px';ship.style.height=ih+'px';ship.style.left=x+'px';ship.style.top=y+'px';
lhh=ih*c.lh;lw=lhh*488/1200;Object.assign(lan.style,{width:lw+'px',height:lhh+'px',left:(c.hx*iw-lw/2)+'px',top:(c.hy*ih)+'px'});
fc.width=Math.round(lw*.5*DPR);fc.height=Math.round(lhh*.32*DPR);fc.style.width=lw*.5+'px';fc.style.height=lhh*.32+'px';
const R=Math.max(180,iw*.2);glow.style.setProperty('--r',R+'px');glow.style.left=c.hx*iw+'px';glow.style.top=(c.hy*ih+lhh*.47)+'px';
pool.style.left=c.px*iw+'px';pool.style.top=c.py*ih+'px';pool.style.setProperty('--r',iw*.22+'px')}
addEventListener('resize',fit);fit();
/* flame model */
let I=1,sp=0,spT=0,pops=0,sparks=[],seed=Math.random()*99;
const n=(t,k)=>Math.sin(t*k+seed)*.5+Math.sin(t*k*2.31+seed*1.7)*.3+Math.sin(t*k*5.17+seed*.3)*.2;
function flame(t,dt){const W=fc.width,H=fc.height;
if(on){if(t>spT){const r=Math.random();sp=r<.55?-(0.35+Math.random()*.4):r<.8?.35+Math.random()*.3:-(0.15);spT=t+.6+Math.random()*(r<.55?2.8:4);pops=.12+Math.random()*.22;if(sp>0)for(let i=0;i<4+Math.random()*6;i++)sparks.push({x:0,y:0,vx:(Math.random()-.5)*30,vy:-(40+Math.random()*70),l:.5+Math.random()*.8,a:0})}
pops=Math.max(0,pops-dt);const ev=pops>0?sp*Math.sin(Math.min(1,pops/.12)*Math.PI*.5):0;
I+=((1+.16*n(t,7)+.09*n(t,19)+ev)-I)*Math.min(1,dt*22)}else I=1;
if(gl){gl.viewport(0,0,W,H);gl.clearColor(0,0,0,0);gl.clear(gl.COLOR_BUFFER_BIT);gl.uniform1f(uT,on?t:3.7);gl.uniform1f(uI,Math.max(.3,I));gl.uniform1f(uS,on?n(t,2.3)*.08:0);gl.uniform2f(uR,W,H);gl.drawArrays(gl.TRIANGLE_STRIP,0,4);
gl.enable(gl.BLEND);gl.blendFunc(gl.ONE,gl.ONE_MINUS_SRC_ALPHA)}
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
