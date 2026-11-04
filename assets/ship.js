(()=>{const K='pf-rock',rm=matchMedia('(prefers-reduced-motion: reduce)').matches;
let on=(()=>{try{const v=localStorage.getItem(K);return v===null?!rm:v==='1'}catch{return!rm}})();
const sc=document.querySelector('.scene'),top=document.getElementById('scene-top'),ship=document.getElementById('ship'),glow=document.getElementById('lglow'),cb=document.getElementById('set-rock');
cb.checked=on;cb.onchange=()=>{on=cb.checked;try{localStorage.setItem(K,on?'1':'0')}catch{};if(!on){reset()}else loop()};
const W=1280,H=720,FX=.853,FY=.39;
function fit(){const w=innerWidth,h=innerHeight,s=Math.max(w/W,h/H,(w<700?1.15*h/H:0))*1.06,iw=W*s,ih=H*s,x=(w-iw)*(w<700?.78:.5),y=h-ih+ih*.02;
ship.style.cssText=`width:${iw}px;height:${ih}px;left:${x}px;top:${y}px`;glow.style.left=FX*iw+'px';glow.style.top=FY*ih+'px';glow.style.setProperty('--r',Math.max(160,iw*.16)+'px')}
fit();addEventListener('resize',fit);
function reset(){sc.style.transform=top.style.transform=ship.style.transform='';glow.style.opacity=.9}
let raf=0;function loop(){cancelAnimationFrame(raf);const f=t=>{if(!on)return;t/=1000;
const roll=1.6*Math.sin(t*2*Math.PI/9.5),pitch=10*Math.sin(t*2*Math.PI/8.2+1.1),heave=4*Math.sin(t*2*Math.PI/6.3);
const T=`translateY(${pitch+heave}px) rotate(${roll}deg) scale(1.08)`;sc.style.transform=T;top.style.transform=T;
ship.style.transform=`translateY(${-heave*.25}px) rotate(${-roll*.12}deg)`;
glow.style.opacity=(.82+.1*Math.sin(t*11.3)+.06*Math.sin(t*23.7+1)+.04*Math.sin(t*41)).toFixed(3);
raf=requestAnimationFrame(f)};raf=requestAnimationFrame(f)}
on?loop():reset();document.addEventListener('visibilitychange',()=>{document.hidden?cancelAnimationFrame(raf):on&&loop()})})();
