/* Procedural ship deck: drawn in true perspective at device resolution (never a soft photo).
   Layers: sea + sky (scene.js) behind, deck canvas, lantern canvas with live flame on the deck. */
(()=>{
  const key='pf-rock', media=matchMedia('(prefers-reduced-motion: reduce)');
  let saved=null;try{saved=localStorage.getItem(key)}catch{}
  let on=saved===null?!media.matches:saved==='1';
  const checkbox=document.getElementById('set-rock');
  window.pfMotion=()=>on;
  function apply(){document.documentElement.classList.toggle('calm',!on);if(checkbox)checkbox.checked=on;dispatchEvent(new Event('pfmotion'));kick()}
  if(checkbox)checkbox.addEventListener('change',()=>{on=checkbox.checked;try{localStorage.setItem(key,on?'1':'0')}catch{}apply()});
  media.addEventListener('change',e=>{if(saved===null){on=!e.matches;apply()}});
  document.addEventListener('visibilitychange',()=>{document.documentElement.classList.toggle('scene-paused',document.hidden);kick()});

  const deck=document.getElementById('deck'), lan=document.getElementById('lantern');
  if(!deck||!lan){apply();return}
  const dc=deck.getContext('2d'), lc=lan.getContext('2d');
  const TEX=new Image();TEX.decoding='async';TEX.src='assets/deck-teak.jpg';TEX.onload=()=>draw();let PAT=null;
  const HZ=.6, EYE=1.75, NEAR=.9, BOW=13.5, MID=6.5, HW=3.4, WALL=.62, PLANK=.17;
  let LX=1.05, LZ=3.4; // lantern position on the deck (metres)
  let W=0,H=0,D=1,f=1,cx=0,hy=0,P={};
  // seeded random so the deck is identical on every visit
  let s=7;const rnd=()=>(s=(s*16807)%2147483647)/2147483647;
  const half=z=>z<=MID?HW:HW*Math.sqrt(Math.max(0,1-((z-MID)/(BOW-MID))**2));
  const pr=(x,y,z)=>[cx+f*x/z, hy+f*(EYE-y)/z];
  const mix=(a,b,t)=>a.map((v,i)=>Math.round(v+(b[i]-v)*t));
  const rgb=c=>`rgb(${c[0]},${c[1]},${c[2]})`;
  const fogC=[10,16,28];
  const lit=(x,z)=>{const d=Math.hypot(x-LX,z-LZ);return .85/(1+d*d*.45)};
  function shade(base,x,z){ // lantern light + distance fade toward the night sea
    const l=lit(x,z), warm=[255,170,80];
    let c=base.map((v,i)=>v*(.5+l*.75)+warm[i]*l*.09);
    return mix(c.map(v=>Math.min(255,v)),fogC,Math.min(.7,Math.max(0,(z-3)/16)));
  }
  function poly(ctx,pts){ctx.beginPath();pts.forEach((p,i)=>i?ctx.lineTo(p[0],p[1]):ctx.moveTo(p[0],p[1]));ctx.closePath()}
  function outline(y){const L=[],R=[];for(let z=NEAR;z<=BOW+1e-6;z+=.1){const h=half(z);L.push(pr(-h,y,z));R.unshift(pr(h,y,z))}return L.concat(R)}

  function draw(){
    const r=deck.getBoundingClientRect();
    D=Math.min(devicePixelRatio||1,2.5);W=Math.round(r.width*D);H=Math.round(r.height*D);
    deck.width=lan.width=W;deck.height=lan.height=H;
    // horizon matches the sea shader; focal length keeps the bow well below it so the water shows
    const vh=innerHeight*D, top=(r.top)*D;
    hy=vh*HZ-top; f=Math.max(vh*.62,W*.36); cx=W/2;
    const narrow=W<H; LX=narrow?.42:1.05; LZ=narrow?3.9:3.4;
    s=7;const c=dc;c.clearRect(0,0,W,H);
    // --- deck planks (clipped to the hull)
    c.save();poly(c,outline(0));c.clip();
    c.fillStyle='#120c08';c.fillRect(0,0,W,H);
    // photographic teak, mapped row by row in true perspective (mode-7 style) so grain stays sharp
    if(TEX.complete&&TEX.naturalWidth){
      c.imageSmoothingEnabled=true;c.imageSmoothingQuality='high';
      const tw=TEX.naturalWidth,th=TEX.naturalHeight,TW=1.36,TL=2.6; // metres covered by one tile
      const yTop=Math.ceil(pr(0,0,BOW)[1]),yBot=Math.min(H,Math.floor(pr(0,0,NEAR)[1])+1);
      for(let y=yTop;y<yBot;y++){
        const z=f*EYE/(y+.5-hy);if(z<NEAR*.98||z>BOW+.2)continue;
        const hw=half(z)+.2,sv=((z/TL)%1)*th, rowH=Math.max(1,th*(f*EYE/(y-hy)-f*EYE/(y+1-hy))/TL);
        const sx0=Math.floor(-hw/TW);
        for(let t=sx0;t*TW<hw;t++){const xa=t*TW,xb=xa+TW,A=cx+f*xa/z,B=cx+f*xb/z;
          c.drawImage(TEX,0,Math.min(sv,th-rowH),tw,Math.min(rowH,th-1),A,y,B-A+.6,1.02)}
      }
      // night exposure: dark everywhere except the lantern's pool, deeper toward the bow
      const lp0=pr(LX,0,LZ),rr=f*3.2/LZ;c.save();c.translate(lp0[0],lp0[1]);c.scale(1.6,EYE/LZ*1.3);
      const dk=c.createRadialGradient(0,0,0,0,0,rr);dk.addColorStop(0,'rgba(10,6,4,.18)');dk.addColorStop(.35,'rgba(8,8,12,.5)');dk.addColorStop(1,'rgba(6,9,16,.74)');
      c.fillStyle=dk;c.fillRect(-W*2,-H*2,W*4,H*4);c.restore();
      const fz=c.createLinearGradient(0,pr(0,0,BOW)[1],0,pr(0,0,4.5)[1]);fz.addColorStop(0,'rgba(10,16,28,.7)');fz.addColorStop(1,'rgba(10,16,28,0)');c.fillStyle=fz;c.fillRect(0,0,W,H);
    }
    // wet sheen of moonlight on the far boards
    const sh=c.createLinearGradient(0,pr(0,0,BOW)[1],0,pr(0,0,4)[1]);sh.addColorStop(0,'rgba(150,175,220,.16)');sh.addColorStop(1,'rgba(150,175,220,0)');c.fillStyle=sh;c.fillRect(0,0,W,H);
    // lantern pool of light + contact shadow
    const lp=pr(LX,0,LZ),rad=f*2.6/LZ;
    c.save();c.translate(lp[0],lp[1]);c.scale(1,EYE/LZ*1.0);
    let g=c.createRadialGradient(0,0,0,0,0,rad);g.addColorStop(0,'rgba(255,160,70,.22)');g.addColorStop(.35,'rgba(255,130,50,.08)');g.addColorStop(1,'rgba(255,120,40,0)');
    c.globalCompositeOperation='lighter';c.fillStyle=g;c.fillRect(-rad,-rad,rad*2,rad*2);c.restore();
    c.restore();
    PAT=TEX.naturalWidth?dc.createPattern(TEX,'repeat'):null;if(PAT)PAT.setTransform(new DOMMatrix().scale(D*.5).rotate(90));
    // --- bulwarks: inner planking up to a cap rail, both sides, following the hull's curve
    for(const side of[-1,1]){
      for(let z=NEAR;z<BOW-.05;z+=.12){const z2=Math.min(z+.12,BOW);const h1=half(z)*side,h2=half(z2)*side;
        const base=[70,48,32];
        poly(dc,[pr(h1,0,z),pr(h2,0,z2),pr(h2,WALL,z2),pr(h1,WALL,z)]);if(PAT){dc.fillStyle=PAT;dc.fill()}const sc=shade(base.map(v=>v*.75),h1,z);dc.fillStyle=`rgba(${sc[0]},${sc[1]},${sc[2]},${PAT?.72:1})`;dc.fill()}
      // strake lines on the bulwark
      for(const y of[.16,.32,.47]){dc.beginPath();for(let z=NEAR;z<=BOW;z+=.1){const p=pr(half(z)*side,y,z);z==NEAR?dc.moveTo(p[0],p[1]):dc.lineTo(p[0],p[1])}dc.strokeStyle='rgba(10,5,2,.7)';dc.lineWidth=Math.max(1,D*1.2);dc.stroke()}
      // stanchions
      for(let z=1.6;z<BOW-.4;z+=1.25){const h=half(z)*side,w=.09;
        dc.fillStyle=rgb(shade([88,60,38],h,z));poly(dc,[pr(h,0,z),pr(h,0,z+w),pr(h,WALL,z+w),pr(h,WALL,z)]);dc.fill();
        dc.fillStyle='rgba(0,0,0,.35)';poly(dc,[pr(h-side*.04,0,z+w),pr(h,0,z+w),pr(h,WALL,z+w),pr(h-side*.04,WALL,z+w)]);dc.fill()}
      // cap rail (top surface + inner face) with lit edge
      for(let z=NEAR;z<BOW-.05;z+=.12){const z2=Math.min(z+.12,BOW);const a=half(z)*side,b=half(z2)*side,t=.13*side;
        dc.fillStyle=rgb(shade([120,84,52],a,z));poly(dc,[pr(a-t,WALL,z),pr(b-t,WALL,z2),pr(b+t*.3,WALL,z2),pr(a+t*.3,WALL,z)]);dc.fill();
        dc.fillStyle=rgb(shade([58,38,24],a,z));poly(dc,[pr(a-t,WALL,z),pr(b-t,WALL,z2),pr(b-t,WALL-.07,z2),pr(a-t,WALL-.07,z)]);dc.fill()}
      dc.beginPath();for(let z=NEAR;z<=BOW;z+=.1){const p=pr(half(z)*side-.13*side,WALL,z);z==NEAR?dc.moveTo(p[0],p[1]):dc.lineTo(p[0],p[1])}
      dc.strokeStyle='rgba(255,200,140,.28)';dc.lineWidth=Math.max(1,D);dc.stroke();
    }
    // stem post at the bow (short, sits below the horizon)
    {const z=BOW-.05,w=.12;dc.fillStyle=rgb(shade([80,55,35],0,z));poly(dc,[pr(-w,0,z),pr(w,0,z),pr(w,WALL+.35,z),pr(-w,WALL+.35,z)]);dc.fill()}
    // coiled rope near the port rail
    {const rz=2.6,rx=W<H?-.9:-2.4,p=pr(rx,0,rz),k=f/rz;for(let i=7;i>0;i--){dc.beginPath();dc.ellipse(p[0],p[1]-i*k*.012,k*.045*i,k*.045*i*EYE/rz*.55,0,0,7);dc.strokeStyle=rgb(shade([150,118,72].map(v=>v*(.7+.04*i)),rx,rz));dc.lineWidth=k*.028;dc.stroke()}}
    // vignette to seat it in the night
    const v=dc.createLinearGradient(0,H,0,hy);v.addColorStop(0,'rgba(2,4,8,.55)');v.addColorStop(.5,'rgba(2,4,8,0)');dc.globalCompositeOperation='source-atop';dc.fillStyle=v;dc.fillRect(0,0,W,H);dc.globalCompositeOperation='source-over';
    // --- ship's wheel in the foreground: we stand at the helm looking out over the deck
    if(PAT){const R=Math.min(W*.2,H*.2),wx=cx-(W<H?0:W*.05),wy=H-R*.3;dc.save();
      const wp=dc.createPattern(TEX,'repeat');wp.setTransform(new DOMMatrix().scale(D*.7));
      const wood=(path,dark)=>{dc.fillStyle=wp;dc.fill(path);dc.fillStyle=`rgba(14,8,4,${dark})`;dc.fill(path)};
      // pedestal
      let pa=new Path2D();pa.rect(wx-R*.16,wy,R*.32,H-wy+2);wood(pa,.6);
      // spokes with turned handles
      for(let i=0;i<10;i++){const a=i/10*Math.PI*2+.16,ca=Math.cos(a),sa=Math.sin(a);
        const sp=new Path2D();const w=R*.05;
        sp.moveTo(wx-sa*w,wy+ca*w);sp.lineTo(wx+ca*R*1.22-sa*w*.8,wy+sa*R*1.22+ca*w*.8);sp.lineTo(wx+ca*R*1.22+sa*w*.8,wy+sa*R*1.22-ca*w*.8);sp.lineTo(wx+sa*w,wy-ca*w);sp.closePath();wood(sp,.42);
        const hx=wx+ca*R*1.16,hy2=wy+sa*R*1.16,hd=new Path2D();hd.ellipse(hx,hy2,R*.07,R*.07,0,0,7);wood(hd,.35);
        dc.strokeStyle='rgba(255,190,120,.22)';dc.lineWidth=Math.max(1,D);dc.beginPath();dc.moveTo(wx+ca*R*.2,wy+sa*R*.2-w*.6);dc.lineTo(wx+ca*R*1.2,wy+sa*R*1.2-w*.6);dc.stroke()}
      // rim: thick ring with bevel light from the lantern side
      const rim=new Path2D();rim.arc(wx,wy,R*.97,0,Math.PI*2);rim.arc(wx,wy,R*.8,0,Math.PI*2,true);wood(rim,.38);
      const rl=dc.createLinearGradient(wx-R,wy-R,wx+R,wy);rl.addColorStop(0,'rgba(0,0,0,.35)');rl.addColorStop(.7,'rgba(255,170,90,.10)');rl.addColorStop(1,'rgba(255,190,110,.22)');dc.fillStyle=rl;dc.fill(rim);
      dc.strokeStyle='rgba(6,3,1,.8)';dc.lineWidth=Math.max(1,D*1.4);dc.stroke(rim);
      // brass hub
      const hb=dc.createRadialGradient(wx-R*.05,wy-R*.05,0,wx,wy,R*.17);hb.addColorStop(0,'rgb(222,170,90)');hb.addColorStop(.6,'rgb(130,86,36)');hb.addColorStop(1,'rgb(40,26,12)');
      dc.fillStyle=hb;dc.beginPath();dc.arc(wx,wy,R*.17,0,7);dc.fill();dc.restore()}
    P={lp,k:f/LZ};frame(performance.now());
  }

  // --- lantern: brass + glass, drawn crisp each frame with a living flame
  function frame(t){
    const c=lc;c.clearRect(0,0,W,H);if(!P.lp)return;
    const [x,y]=P.lp,k=P.k, u=k*.01; // u = 1cm at the lantern's distance
    const fl=on&&!document.hidden?(.85+.15*Math.sin(t*.011)*Math.sin(t*.0047+1)+.06*Math.sin(t*.031)):.95;
    const brass=(a)=>{const g=c.createLinearGradient(x-14*u,0,x+14*u,0);g.addColorStop(0,`rgba(70,48,22,${a})`);g.addColorStop(.35,`rgba(214,160,78,${a})`);g.addColorStop(.6,`rgba(150,100,40,${a})`);g.addColorStop(1,`rgba(48,30,14,${a})`);return g};
    // shadow on deck
    c.fillStyle='rgba(0,0,0,.45)';c.beginPath();c.ellipse(x-4*u,y,18*u,5*u,0,0,7);c.fill();
    // glow halo
    let g=c.createRadialGradient(x,y-22*u,0,x,y-22*u,70*u*fl);g.addColorStop(0,`rgba(255,200,110,${.42*fl})`);g.addColorStop(.3,'rgba(255,150,60,.12)');g.addColorStop(1,'rgba(255,120,40,0)');
    c.globalCompositeOperation='lighter';c.fillStyle=g;c.fillRect(x-80*u,y-100*u,160*u,160*u);c.globalCompositeOperation='source-over';
    // base
    c.fillStyle=brass(1);c.beginPath();c.ellipse(x,y-1*u,13*u,3.4*u,0,0,7);c.fill();
    c.fillRect(x-13*u,y-9*u,26*u,8*u);c.beginPath();c.ellipse(x,y-9*u,13*u,3.4*u,0,0,7);c.fillStyle='rgb(120,82,34)';c.fill();
    // glass globe
    const gy=y-24*u;g=c.createRadialGradient(x,gy+3*u,0,x,gy,13*u);g.addColorStop(0,`rgba(255,236,170,${.95*fl})`);g.addColorStop(.45,`rgba(255,180,80,${.55*fl})`);g.addColorStop(1,'rgba(160,90,30,.35)');
    c.fillStyle=g;c.beginPath();c.ellipse(x,gy,10.5*u,15*u,0,0,7);c.fill();
    // flame
    const sw=on?Math.sin(t*.006)*.8*u:0;c.beginPath();c.moveTo(x-2.6*u,gy+6*u);c.quadraticCurveTo(x-3*u,gy-2*u,x+sw,gy-(9+3*fl)*u);c.quadraticCurveTo(x+3*u,gy-2*u,x+2.6*u,gy+6*u);c.closePath();
    g=c.createLinearGradient(0,gy+6*u,0,gy-12*u);g.addColorStop(0,'#fff6d0');g.addColorStop(.5,'#ffd060');g.addColorStop(1,'rgba(255,120,30,.2)');c.fillStyle=g;c.fill();
    // glass highlight
    c.strokeStyle='rgba(255,255,240,.5)';c.lineWidth=Math.max(1,1.2*u);c.beginPath();c.ellipse(x-4*u,gy-2*u,3*u,9*u,.15,2.4,4.2);c.stroke();
    // wire guards
    c.strokeStyle=brass(1);c.lineWidth=Math.max(1,1.6*u);
    for(const dx of[-10.5,-4,4,10.5]){c.beginPath();c.moveTo(x+dx*u,y-9*u);c.quadraticCurveTo(x+dx*1.35*u,gy,x+dx*.55*u,y-41*u);c.stroke()}
    c.beginPath();c.ellipse(x,gy,11.5*u,2.6*u,0,0,Math.PI);c.stroke();
    // cap, chimney, bail
    c.fillStyle=brass(1);c.beginPath();c.moveTo(x-9*u,y-40*u);c.lineTo(x+9*u,y-40*u);c.lineTo(x+4.5*u,y-48*u);c.lineTo(x-4.5*u,y-48*u);c.closePath();c.fill();
    c.fillRect(x-3.6*u,y-55*u,7.2*u,7*u);c.fillStyle='rgb(60,40,18)';c.fillRect(x-4.4*u,y-56*u,8.8*u,1.8*u);
    c.strokeStyle=brass(1);c.lineWidth=Math.max(1,1.4*u);c.beginPath();c.ellipse(x,y-48*u,12*u,16*u,0,Math.PI*1.05,Math.PI*1.95);c.stroke();
    c.beginPath();c.arc(x,y-63.5*u,2.4*u,0,7);c.stroke();
  }
  let raf=0,last=0;
  function loop(t){raf=0;if(!on||document.hidden)return;if(t-last>40){last=t;frame(t)}raf=requestAnimationFrame(loop)}
  function kick(){if(!lan)return;frame(performance.now());if(on&&!document.hidden&&!raf)raf=requestAnimationFrame(loop)}
  let rt;addEventListener('resize',()=>{clearTimeout(rt);rt=setTimeout(draw,120)});
  draw();apply();
})();
