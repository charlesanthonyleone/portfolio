(()=>{const mot=()=>window.pfMotion?window.pfMotion():true,b=document.body;
const io=(sel,cls,opt)=>{const els=[...document.querySelectorAll(sel)];if(!('IntersectionObserver' in window)||!mot()){els.forEach(e=>e.classList.add(cls));return}
const o=new IntersectionObserver(es=>es.forEach(e=>{if(e.isIntersecting){e.target.classList.add(cls);o.unobserve(e.target)}}),opt||{rootMargin:'0px 0px -12% 0px',threshold:.08});els.forEach(e=>o.observe(e))};
addEventListener('pfmotion',()=>{if(!mot())document.querySelectorAll('.ink,.proj').forEach(e=>e.classList.add('in','lit'))});
if(b.classList.contains('p-story')){io('.prose p','in');const d=document.getElementById('dawn');
const up=()=>{const h=document.documentElement,p=Math.min(1,Math.max(0,scrollY/(h.scrollHeight-innerHeight)));d.style.setProperty('--p',p.toFixed(3));document.getElementById('logbar').style.transform=`scaleX(${p})`};addEventListener('scroll',up,{passive:true});up()}
if(b.classList.contains('p-projects')){io('.proj','lit',{rootMargin:'0px 0px -8% 0px',threshold:.15});
const c=document.getElementById('beacons'),x=c.getContext('2d');let W,H,D=Math.min(devicePixelRatio||1,2);
const L=[{x:.18,s:.7},{x:.42,s:.5},{x:.63,s:1.4,main:1},{x:.83,s:.6}];
const rs=()=>{W=c.width=innerWidth*D;H=c.height=innerHeight*D};addEventListener('resize',rs);rs();
const draw=t=>{x.clearRect(0,0,W,H);const h=document.documentElement,p=Math.min(1,scrollY/Math.max(1,h.scrollHeight-innerHeight)),hz=H*.6;
for(const l of L){const k=(.6+p*1.6)*l.s*D,px=W*(.5+(l.x-.5)*(1+p*.6)),tw=3*k,th=26*k,by=hz+1*k;
x.fillStyle='rgba(6,10,18,.95)';x.beginPath();x.moveTo(px-tw,by);x.lineTo(px-tw*.6,by-th);x.lineTo(px+tw*.6,by-th);x.lineTo(px+tw,by);x.fill();
const ly=by-th-2*k,ang=mot()?t/1000*(l.main?.9:.6)+l.x*9:1.2,a=.5+.5*Math.cos(ang);
x.globalCompositeOperation='lighter';const R=(l.main?60:30)*k*(.6+.4*a);const g=x.createRadialGradient(px,ly,0,px,ly,R);g.addColorStop(0,`rgba(255,236,190,${l.main?1:.8})`);g.addColorStop(.12,`rgba(255,200,120,${.5*a+.2})`);g.addColorStop(1,'rgba(255,180,90,0)');x.fillStyle=g;x.fillRect(px-R,ly-R,R*2,R*2);
const len=(l.main?520:260)*k*.6,sx=Math.sin(ang),bg=x.createLinearGradient(px,ly,px+sx*len,ly);bg.addColorStop(0,`rgba(255,225,170,${.28*Math.abs(sx)})`);bg.addColorStop(1,'rgba(255,225,170,0)');x.fillStyle=bg;x.beginPath();x.moveTo(px,ly);x.lineTo(px+sx*len,ly-len*.05);x.lineTo(px+sx*len,ly+len*.05);x.fill();x.globalCompositeOperation='source-over'}
if(mot())requestAnimationFrame(draw)};requestAnimationFrame(draw);addEventListener('pfmotion',()=>requestAnimationFrame(draw));addEventListener('scroll',()=>{if(!mot())requestAnimationFrame(draw)},{passive:true})}
})();
