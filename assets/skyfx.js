/* Sky FX over the balloon plate: twinkling drifting stars, meteors/comets, ocean hits with tiny ripples, moon glimmer.
   Techniques ported from the old scene.js 2D layer; no WebGL, no second moon. */
(()=>{
const $=id=>document.getElementById(id),cv=$('skyfx'),top=$('skytop'),plate=$('balloon');if(!cv||!top||!plate)return;
const d=cv.getContext('2d'),w=top.getContext('2d'),fx=()=>window.pfFx?window.pfFx():{stars:true,moon:true};
// Feature positions as fractions of each plate image
const G={d:{iw:16,ih:9,moon:[.723,.174,.025],sky:.38,rope:[.16,.26,.78,.88],hit:[.30,.84,.50,.67]},
         m:{iw:9,ih:16,moon:[.811,.174,.043],sky:.38,rope:[.06,.16,.86,.95],hit:[.32,.74,.47,.64]}};
const COL=["175,200,255","205,220,255","240,244,255","255,244,222","255,214,170"];
const spr=COL.map(c=>{const f=document.createElement('canvas');f.width=f.height=64;const m=f.getContext('2d'),h=m.createRadialGradient(32,32,0,32,32,32);
 h.addColorStop(0,'rgba(255,255,255,1)');h.addColorStop(.1,`rgba(${c},.85)`);h.addColorStop(.28,`rgba(${c},.22)`);h.addColorStop(.55,`rgba(${c},.05)`);h.addColorStop(1,`rgba(${c},0)`);m.fillStyle=h;m.beginPath();m.arc(32,32,32,0,7);m.fill();return f});
const flare=(()=>{const l=document.createElement('canvas');l.width=l.height=128;const f=l.getContext('2d');for(const v of[0,1]){const h=v?f.createLinearGradient(64,0,64,128):f.createLinearGradient(0,64,128,64);
 h.addColorStop(0,'rgba(0,0,0,0)');h.addColorStop(.5,'rgba(220,228,255,.75)');h.addColorStop(1,'rgba(0,0,0,0)');f.fillStyle=h;f.beginPath();v?f.ellipse(64,64,.9,64,0,0,7):f.ellipse(64,64,64,.9,0,0,7);f.fill()}return l})();
const rnd=s=>()=>{s|=0;s=s+1831565813|0;let f=Math.imul(s^s>>>15,1|s);f=f+Math.imul(f^f>>>7,61|f)^f;return((f^f>>>14)>>>0)/4294967296};
let W=0,H=0,dpr=1,g=G.d,S=1,ox=0,oy=0,stars=[];
const P=(fx_,fy)=>[ox+fx_*g.iw*S,oy+fy*g.ih*S]; // image fraction -> plate px
const lay=()=>{W=plate.offsetWidth;H=plate.offsetHeight;dpr=Math.min(devicePixelRatio||1,2);g=innerWidth/innerHeight<=.75?G.m:G.d;
 S=Math.max(W/g.iw,H/g.ih);ox=(W-g.iw*S)/2;oy=H-g.ih*S;
 cv.width=innerWidth*dpr;cv.height=innerHeight*dpr;top.width=innerWidth*dpr;top.height=innerHeight*dpr;w.setTransform(dpr,0,0,dpr,0,0);
 const r=rnd(7),R=Math.hypot(W,H)*1.4,n=Math.round(Math.min(1400,W*H/900));
 stars=Array.from({length:n},()=>{const m=Math.pow(r(),6.5),s=r();return{r:Math.sqrt(r())*R,a:r()*6.283,m,c:s<.15?0:s<.4?1:s<.8?2:s<.93?3:4,f1:1.5+r()*3.5,f2:4+r()*6,p:r()*6.283}})};
lay();for(const e of['resize','orientationchange','pageshow'])addEventListener(e,lay);if(window.visualViewport)visualViewport.addEventListener('resize',lay);requestAnimationFrame(()=>requestAnimationFrame(lay));setTimeout(lay,300);setTimeout(lay,1200);addEventListener('load',lay);
const sm=(a,b,x)=>{const t=Math.min(1,Math.max(0,(x-a)/(b-a)));return t*t*(3-2*t)};
const skyA=(x,y)=>{const fx_=(x-ox)/(g.iw*S),fy=(y-oy)/(g.ih*S),[a,b,c,e]=g.rope;
 return sm(g.sky,g.sky-.1,fy)*sm(a,b,fx_)*sm(e,c,fx_)*sm(.02,.08,fy)};
// stars
const drawStars=t=>{const [cx,cy]=P(.78,-.55),rot=t*.0045;d.globalCompositeOperation='lighter';
 for(let i=0;i<stars.length;i++){const s=stars[i],an=s.a+rot,x=cx+Math.cos(an)*s.r,y=cy+Math.sin(an)*s.r;if(x<0||x>W||y<0||y>H)continue;
  const k=skyA(x,y);if(k<=.01)continue;
  const T=Math.max(0,.62+.38*Math.sin(t*s.f1+s.p)*Math.sin(t*s.f2+s.p*1.7)+.18*Math.sin(t*(9+i%7)+s.p*3)*s.m),Rr=(1+s.m*7)*(.75+.45*T);
  d.globalAlpha=Math.min(1,(.28+.8*s.m)*T*k);d.drawImage(spr[s.c],x-Rr,y-Rr,Rr*2,Rr*2);
  if(s.m>.45){const q=(7+26*s.m)*(.5+.6*T);d.globalAlpha=.45*T*k*s.m;d.drawImage(flare,x-q,y-q,q*2,q*2)}}
 d.globalAlpha=1};
// moon glimmer (pinned to baked disc; no new disc drawn)
const drawMoon=t=>{const [mx,my]=P(g.moon[0],g.moon[1]),r=g.moon[2]*g.iw*S;d.globalCompositeOperation='lighter';
 const pulse=.5+.5*Math.sin(t*2*Math.PI/6),h=d.createRadialGradient(mx,my,r*.8,mx,my,r*3.2);h.addColorStop(0,`rgba(220,230,250,${.10+.08*pulse})`);h.addColorStop(1,'rgba(200,215,245,0)');
 d.fillStyle=h;d.fillRect(mx-r*3.2,my-r*3.2,r*6.4,r*6.4);
 d.save();d.beginPath();d.arc(mx,my,r*.97,0,7);d.clip();const ph=t*2*Math.PI/11,sx=mx+Math.cos(ph)*r*.55,sy=my-r*.25+Math.sin(ph*.7)*r*.3,sp=d.createRadialGradient(sx,sy,0,sx,sy,r*.9);
 sp.addColorStop(0,`rgba(255,255,255,${.12+.08*pulse})`);sp.addColorStop(1,'rgba(255,255,255,0)');d.fillStyle=sp;d.fillRect(mx-r,my-r,r*2,r*2);d.restore();d.globalCompositeOperation='source-over'};
// meteors
const V=[],RP=[];let nS=0,nC=25,nL=5;
const spawn=t=>{const sb=P(0,g.sky)[1];
 if(t>nS){const i=Math.random()<.5?-1:1,o=550+Math.random()*450,a=.22+Math.random()*.4;V.push({x:W*(.15+Math.random()*.7),y:sb*(.08+Math.random()*.5),vx:Math.cos(a)*o*i,vy:Math.sin(a)*o,life:.45+Math.random()*.5,age:0,len:90+Math.random()*120});nS=t+2.5+Math.random()*5}
 if(t>nC){const i=Math.random()<.5?-1:1;V.push({x:i>0?-80:W+80,y:sb*(.15+Math.random()*.35),vx:i*(22+Math.random()*16),vy:2+Math.random()*4,life:(W+160)/26,age:0,len:160+Math.random()*90,comet:1});nC=t+55+Math.random()*40}
 if(t>nL){const [a,b,c,e]=g.hit,[tx,ty]=P(a+Math.random()*(b-a),c+Math.random()*(e-c)),dur=1.3+Math.random()*.6,sx=tx+(Math.random()<.5?-1:1)*W*(.18+Math.random()*.15),sy=H*.04;
  V.push({x:sx,y:sy,vx:(tx-sx)/dur,vy:(ty-sy)/dur,life:dur,age:0,len:200,lands:1,tx,ty});nL=t+14+Math.random()*14}};
const streak=(e,s)=>{const sp=Math.hypot(s.vx,s.vy);if(!(sp>0))return;const ux=s.vx/sp,uy=s.vy/sp,u=s.age/s.life,a=s.comet?Math.min(1,s.age/3,(s.life-s.age)/3):s.lands?Math.min(1,s.age*4):Math.sin(Math.min(1,u)*Math.PI);
 e.lineCap='round';if(s.comet){const T=s.x-ux*s.len,R=s.y-uy*s.len-18,x=e.createLinearGradient(s.x,s.y,T,R);x.addColorStop(0,`rgba(205,228,255,${.5*a})`);x.addColorStop(1,'rgba(205,228,255,0)');e.strokeStyle=x;
  for(const[lw,o]of[[8,0],[3,7],[2,-6]]){e.lineWidth=lw;e.globalAlpha=.3;e.beginPath();e.moveTo(s.x,s.y);e.quadraticCurveTo((s.x+T)/2,(s.y+R)/2+o,T,R+o*2);e.stroke()}e.globalAlpha=1}
 const L=Math.min(s.len,sp*s.age),y=e.createLinearGradient(s.x,s.y,s.x-ux*L,s.y-uy*L);y.addColorStop(0,`rgba(255,255,255,${a})`);y.addColorStop(.2,`rgba(190,215,255,${.55*a})`);y.addColorStop(1,'rgba(160,190,255,0)');
 e.strokeStyle=y;e.lineWidth=s.lands?2.2:1.4;e.beginPath();e.moveTo(s.x,s.y);e.lineTo(s.x-ux*L,s.y-uy*L);e.stroke();
 const c=s.lands?5+u*4:4,b=e.createRadialGradient(s.x,s.y,0,s.x,s.y,c);b.addColorStop(0,`rgba(255,255,255,${a})`);b.addColorStop(.35,`rgba(215,230,255,${.5*a})`);b.addColorStop(1,'rgba(170,200,255,0)');e.fillStyle=b;e.beginPath();e.arc(s.x,s.y,c,0,7);e.fill()};
const drawRipples=dt=>{d.globalCompositeOperation='lighter';for(let i=RP.length-1;i>=0;i--){const r=RP[i];r.age+=dt;if(r.age>1.8){RP.splice(i,1);continue}
 const k=r.age/1.8;if(r.age<.25){const fl=d.createRadialGradient(r.x,r.y,0,r.x,r.y,8);fl.addColorStop(0,`rgba(240,246,255,${.6*(1-r.age/.25)})`);fl.addColorStop(1,'rgba(240,246,255,0)');d.fillStyle=fl;d.beginPath();d.ellipse(r.x,r.y,8,3,0,0,7);d.fill()}
 for(let j=0;j<3;j++){const kk=k-j*.18;if(kk<=0)continue;const rad=6+10*kk;d.strokeStyle=`rgba(225,235,255,${.32*(1-kk)})`;d.lineWidth=.8;d.beginPath();d.ellipse(r.x,r.y,rad,rad*.3,0,0,7);d.stroke()}}
 d.globalCompositeOperation='source-over'};
let T=40,last=performance.now(),raf=0;
const frame=now=>{const dt=Math.min(.05,(now-last)/1e3);last=now;const F=fx();if(!W||!H)lay();const pr=plate.getBoundingClientRect();d.setTransform(1,0,0,1,0,0);d.clearRect(0,0,cv.width,cv.height);d.setTransform(dpr,0,0,dpr,pr.left*dpr,pr.top*dpr);w.clearRect(0,0,innerWidth,innerHeight);
 if(F.stars){T+=dt;drawStars(T);spawn(T);for(const s of V){s.age+=dt;s.x+=s.vx*dt;s.y+=s.vy*dt}
  for(let i=V.length-1;i>=0;i--){const s=V[i];if(s.age>=s.life){if(s.lands)RP.push({x:s.tx,y:s.ty,age:0});V.splice(i,1)}}
  const sb=P(0,g.sky)[1];d.save();d.beginPath();d.rect(0,0,W,sb);d.clip();d.globalCompositeOperation='lighter';for(const s of V)if(!s.lands)streak(d,s);d.restore();
  w.save();w.translate(pr.left,pr.top);w.globalCompositeOperation='lighter';for(const s of V)if(s.lands)streak(w,s);w.restore();drawRipples(dt)}
 else{V.length=0;RP.length=0}
 if(F.moon)drawMoon(now/1e3);
 raf=(F.stars||F.moon)&&!document.hidden?requestAnimationFrame(frame):0};
const go=()=>{if(!raf){last=performance.now();raf=requestAnimationFrame(frame)}};
addEventListener('pffx',()=>{const F=fx();if(!F.stars&&!F.moon){cancelAnimationFrame(raf);raf=0;d.setTransform(1,0,0,1,0,0);d.clearRect(0,0,cv.width,cv.height);w.clearRect(0,0,innerWidth,innerHeight)}else go()});
document.addEventListener('visibilitychange',()=>{if(!document.hidden)go()});
go();
})();
