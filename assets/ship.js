/* Procedural ship deck + photoreal textures.
   Layers: sea/sky (scene.js) behind, deck canvas, lantern canvas with live flame.
   Helm POV: wheel in foreground, low deck, water/moon visible above the bow. */
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

  // Photoreal textures: weathered PotC timber + real ship's wheel
  const TEX=new Image(); TEX.decoding='async';
  const WHL=new Image(); WHL.decoding='async';
  let pending=2;
  const bump=()=>{ if(pending>0 && --pending===0) draw(); };
  function watch(img, src){
    let done=false;
    const once=()=>{ if(done) return; done=true; bump(); };
    img.onload=once; img.onerror=once; img.src=src;
    if(img.complete) once();
  }
  watch(TEX,'assets/deck-weathered.jpg');
  watch(WHL,'assets/ship-wheel.png');

  // Perspective: low deck so water + moon trail stay visible above the bow
  const HZ=.6, EYE=1.75, NEAR=.9, BOW=13.5, MID=6.5, HW=3.4, WALL=.78, PLANK=.17;
  let LX=1.05, LZ=3.4;
  let W=0,H=0,D=1,f=1,cx=0,hy=0,P={};
  let s=7;const rnd=()=>(s=(s*16807)%2147483647)/2147483647;
  const half=z=>z<=MID?HW:HW*Math.sqrt(Math.max(0,1-((z-MID)/(BOW-MID))**2));
  const pr=(x,y,z)=>[cx+f*x/z, hy+f*(EYE-y)/z];
  const mix=(a,b,t)=>a.map((v,i)=>Math.round(v+(b[i]-v)*t));
  const rgb=c=>`rgb(${c[0]},${c[1]},${c[2]})`;
  const fogC=[8,12,22];
  const lit=(x,z)=>{const d=Math.hypot(x-LX,z-LZ);return .95/(1+d*d*.38)};
  function shade(base,x,z){
    const l=lit(x,z), warm=[255,165,70];
    let c=base.map((v,i)=>v*(.38+l*.95)+warm[i]*l*.14);
    return mix(c.map(v=>Math.min(255,v)),fogC,Math.min(.72,Math.max(0,(z-3)/15)));
  }
  function poly(ctx,pts){ctx.beginPath();pts.forEach((p,i)=>i?ctx.lineTo(p[0],p[1]):ctx.moveTo(p[0],p[1]));ctx.closePath()}
  function outline(y){const L=[],R=[];for(let z=NEAR;z<=BOW+1e-6;z+=.1){const h=half(z);L.push(pr(-h,y,z));R.unshift(pr(h,y,z))}return L.concat(R)}

  function draw(){
    const r=deck.getBoundingClientRect();
    D=Math.min(devicePixelRatio||1,2.5);W=Math.round(r.width*D);H=Math.round(r.height*D);
    deck.width=lan.width=W;deck.height=lan.height=H;
    const vh=innerHeight*D, top=(r.top)*D;
    hy=vh*HZ-top; f=Math.max(vh*.62,W*.36); cx=W/2;
    const narrow=W<H; LX=narrow?.55:1.05; LZ=narrow?5.1:3.4;
    s=7;const c=dc;c.clearRect(0,0,W,H);

    // --- deck planks (clipped to hull)
    c.save();poly(c,outline(0));c.clip();
    c.fillStyle='#0a0705';c.fillRect(0,0,W,H);

    if(TEX.complete&&TEX.naturalWidth){
      c.imageSmoothingEnabled=true;c.imageSmoothingQuality='high';
      const tw=TEX.naturalWidth,th=TEX.naturalHeight;
      // Large world tile so knots don't scream "tiled" across the near deck
      const TW=3.8, TL=5.4;
      const yTop=Math.ceil(pr(0,0,BOW)[1]),yBot=Math.min(H,Math.floor(pr(0,0,NEAR)[1])+1);
      for(let y=yTop;y<yBot;y++){
        const z=f*EYE/(y+.5-hy);if(z<NEAR*.98||z>BOW+.2)continue;
        const hw=half(z)+.25;
        // slight z-dependent U offset breaks vertical seam alignment
        const uOff=((Math.sin(z*1.7)*0.31)+(z*0.07))%1;
        const sv=(((z/TL)+uOff)%1)*th;
        const rowH=Math.max(1,th*(f*EYE/(y-hy)-f*EYE/(y+1-hy))/TL);
        const sx0=Math.floor(-hw/TW);
        for(let t=sx0;t*TW<hw;t++){
          const xa=t*TW, xb=xa+TW, A=cx+f*xa/z, B=cx+f*xb/z;
          // flip alternate columns for less obvious repeat
          if((t&1)===0){
            c.drawImage(TEX,0,Math.min(sv,th-rowH),tw,Math.min(rowH,th-1),A,y,B-A+.7,1.05);
          }else{
            c.save();c.translate(B,y);c.scale(-1,1);
            c.drawImage(TEX,0,Math.min(sv,th-rowH),tw,Math.min(rowH,th-1),0,0,B-A+.7,1.05);
            c.restore();
          }
        }
      }

      // Tar / caulking seams along plank runs (perspective lines)
      c.save();
      for(let x=-HW+.08;x<=HW;x+=PLANK){
        c.beginPath();
        for(let z=NEAR;z<=BOW;z+=.15){
          const h=half(z); if(Math.abs(x)>h-.05) continue;
          const p=pr(x,0.002,z);
          z<=NEAR+.01?c.moveTo(p[0],p[1]):c.lineTo(p[0],p[1]);
        }
        c.strokeStyle='rgba(4,2,1,.55)';c.lineWidth=Math.max(1,D*.9);c.stroke();
      }
      c.restore();

      // Night exposure: deep shadow everywhere except lantern pool
      const lp0=pr(LX,0,LZ),rr=f*3.6/LZ;
      c.save();c.translate(lp0[0],lp0[1]);c.scale(1.7,EYE/LZ*1.35);
      const dk=c.createRadialGradient(0,0,0,0,0,rr);
      dk.addColorStop(0,'rgba(12,7,4,.12)');
      dk.addColorStop(.28,'rgba(6,6,10,.48)');
      dk.addColorStop(.65,'rgba(4,6,12,.50)');
      dk.addColorStop(1,'rgba(3,5,10,.58)');
      c.fillStyle=dk;c.fillRect(-W*2,-H*2,W*4,H*4);c.restore();

      // Bow fog into the night sea
      const fz=c.createLinearGradient(0,pr(0,0,BOW)[1],0,pr(0,0,4.2)[1]);
      fz.addColorStop(0,'rgba(8,12,22,.78)');fz.addColorStop(1,'rgba(8,12,22,0)');
      c.fillStyle=fz;c.fillRect(0,0,W,H);
    }

    // Moonlit wet sheen on far boards
    const sh=c.createLinearGradient(0,pr(0,0,BOW)[1],0,pr(0,0,3.8)[1]);
    sh.addColorStop(0,'rgba(160,185,230,.18)');sh.addColorStop(1,'rgba(160,185,230,0)');
    c.fillStyle=sh;c.fillRect(0,0,W,H);

    // Wet reflective pool around the lantern (oiled timber catch light)
    const lp=pr(LX,0,LZ),rad=f*2.9/LZ;
    c.save();c.translate(lp[0],lp[1]);c.scale(1.15,EYE/LZ*0.85);
    let g=c.createRadialGradient(0,0,0,0,0,rad);
    g.addColorStop(0,'rgba(255,190,100,.32)');
    g.addColorStop(.25,'rgba(255,150,60,.14)');
    g.addColorStop(.55,'rgba(40,28,16,.08)');
    g.addColorStop(1,'rgba(255,120,40,0)');
    c.globalCompositeOperation='lighter';c.fillStyle=g;c.fillRect(-rad*1.2,-rad,rad*2.4,rad*2);
    c.restore();

    // Contact shadow under lantern
    c.save();c.translate(lp[0],lp[1]);c.scale(1,EYE/LZ);
    c.fillStyle='rgba(0,0,0,.4)';c.beginPath();c.ellipse(0,0,f*.22/LZ,f*.08/LZ,0,0,7);c.fill();
    c.restore();
    c.restore(); // end hull clip

    // Pattern for bulwarks
    let PAT=null;
    if(TEX.naturalWidth){PAT=dc.createPattern(TEX,'repeat');if(PAT)PAT.setTransform(new DOMMatrix().scale(D*.42).rotate(90))}

    // --- heavy bulwarks / gunwales (PotC thick timber)
    for(const side of[-1,1]){
      for(let z=NEAR;z<BOW-.05;z+=.1){
        const z2=Math.min(z+.1,BOW);const h1=half(z)*side,h2=half(z2)*side;
        poly(dc,[pr(h1,0,z),pr(h2,0,z2),pr(h2,WALL,z2),pr(h1,WALL,z)]);
        if(PAT){dc.fillStyle=PAT;dc.fill()}
        const sc=shade([62,42,28].map(v=>v*.85),h1,z);
        dc.fillStyle=`rgba(${sc[0]},${sc[1]},${sc[2]},${PAT?.68:1})`;dc.fill();
      }
      // Heavy strake lines
      for(const y of[.18,.36,.54]){
        dc.beginPath();
        for(let z=NEAR;z<=BOW;z+=.1){const p=pr(half(z)*side,y,z);z==NEAR?dc.moveTo(p[0],p[1]):dc.lineTo(p[0],p[1])}
        dc.strokeStyle='rgba(6,3,1,.75)';dc.lineWidth=Math.max(1.2,D*1.4);dc.stroke();
      }
      // Thick stanchions
      for(let z=1.5;z<BOW-.4;z+=1.15){
        const h=half(z)*side,w=.12;
        dc.fillStyle=rgb(shade([78,52,32],h,z));
        poly(dc,[pr(h,0,z),pr(h,0,z+w),pr(h,WALL,z+w),pr(h,WALL,z)]);dc.fill();
        dc.fillStyle='rgba(0,0,0,.4)';
        poly(dc,[pr(h-side*.05,0,z+w),pr(h,0,z+w),pr(h,WALL,z+w),pr(h-side*.05,WALL,z+w)]);dc.fill();
        // small iron bolt hint
        const bp=pr(h-side*.02,WALL*.55,z+w*.5);
        dc.fillStyle=rgb(shade([40,36,32],h,z));
        dc.beginPath();dc.arc(bp[0],bp[1],Math.max(1,D*1.1),0,7);dc.fill();
      }
      // Cap rail — thicker top + inner face, lantern-lit edge
      for(let z=NEAR;z<BOW-.05;z+=.1){
        const z2=Math.min(z+.1,BOW);const a=half(z)*side,b=half(z2)*side,t=.18*side;
        dc.fillStyle=rgb(shade([110,76,46],a,z));
        poly(dc,[pr(a-t,WALL,z),pr(b-t,WALL,z2),pr(b+t*.35,WALL,z2),pr(a+t*.35,WALL,z)]);dc.fill();
        dc.fillStyle=rgb(shade([48,32,20],a,z));
        poly(dc,[pr(a-t,WALL,z),pr(b-t,WALL,z2),pr(b-t,WALL-.09,z2),pr(a-t,WALL-.09,z)]);dc.fill();
      }
      dc.beginPath();
      for(let z=NEAR;z<=BOW;z+=.1){const p=pr(half(z)*side-.18*side,WALL,z);z==NEAR?dc.moveTo(p[0],p[1]):dc.lineTo(p[0],p[1])}
      dc.strokeStyle='rgba(255,195,130,.32)';dc.lineWidth=Math.max(1.2,D*1.2);dc.stroke();
    }

    // Stem post
    {const z=BOW-.05,w=.14;dc.fillStyle=rgb(shade([70,48,30],0,z));
     poly(dc,[pr(-w,0,z),pr(w,0,z),pr(w,WALL+.4,z),pr(-w,WALL+.4,z)]);dc.fill()}

    // Coiled rope near port rail
    {const rz=2.55,rx=narrow?-1.0:-2.45,p=pr(rx,0,rz),k=f/rz;
     for(let i=8;i>0;i--){
       dc.beginPath();dc.ellipse(p[0],p[1]-i*k*.013,k*.05*i,k*.05*i*EYE/rz*.55,0,0,7);
       dc.strokeStyle=rgb(shade([145,112,68].map(v=>v*(.65+.04*i)),rx,rz));
       dc.lineWidth=k*.03;dc.stroke();
     }}

    // Bit of rail rope (port + starboard mid)
    for(const side of[-1,1]){
      const z0=4.2, h=half(z0)*side*.92;
      dc.beginPath();
      for(let z=z0;z<z0+2.2;z+=.08){
        const p=pr(half(z)*side*.97, WALL*.92, z);
        z<=z0+.01?dc.moveTo(p[0],p[1]):dc.lineTo(p[0],p[1]);
      }
      dc.strokeStyle=rgb(shade([120,95,60],h,z0));
      dc.lineWidth=Math.max(1.5,D*2.2);dc.stroke();
    }

    // Vignette into night
    const v=dc.createLinearGradient(0,H,0,hy);
    v.addColorStop(0,'rgba(2,3,6,.62)');v.addColorStop(.55,'rgba(2,3,6,0)');
    dc.globalCompositeOperation='source-atop';dc.fillStyle=v;dc.fillRect(0,0,W,H);
    dc.globalCompositeOperation='source-over';

    // --- ship's wheel: photoreal PNG composited at the helm (not flat canvas arcs)
    {
      const R=Math.min(W*.24, H*.26);
      const wx=cx-(narrow?0:W*.05);
      const wy=H-R*.28;

      // Wooden pedestal / binnacle stump under the wheel
      dc.save();
      const pedW=R*.34, pedTop=wy+R*.05;
      const ped=new Path2D();
      ped.moveTo(wx-pedW*.55, pedTop);
      ped.lineTo(wx+pedW*.55, pedTop);
      ped.lineTo(wx+pedW*.7, H+2);
      ped.lineTo(wx-pedW*.7, H+2);
      ped.closePath();
      if(PAT){dc.fillStyle=PAT;dc.fill(ped)}
      dc.fillStyle='rgba(18,10,5,.72)';dc.fill(ped);
      // edge highlight from lantern
      dc.strokeStyle='rgba(255,180,100,.18)';dc.lineWidth=Math.max(1,D);dc.stroke(ped);
      dc.restore();

      // Soft contact shadow behind wheel on deck
      dc.save();
      dc.fillStyle='rgba(0,0,0,.45)';
      dc.beginPath();dc.ellipse(wx, wy+R*.15, R*1.05, R*.22, 0, 0, 7);dc.fill();
      dc.restore();
      // Soft ambient lift behind the wheel so dark timber separates from the deck
      dc.save();
      const lift=dc.createRadialGradient(wx, wy, R*.2, wx, wy, R*1.25);
      lift.addColorStop(0,'rgba(255,190,110,.10)');
      lift.addColorStop(.55,'rgba(40,28,16,.06)');
      lift.addColorStop(1,'rgba(0,0,0,0)');
      dc.globalCompositeOperation='lighter';
      dc.fillStyle=lift;dc.beginPath();dc.ellipse(wx,wy,R*1.2,R*1.05,0,0,7);dc.fill();
      dc.restore();

      if(WHL.complete&&WHL.naturalWidth){
        const size=R*2.45;
        // Grade on an offscreen canvas so transparent wheel pixels don't darken the deck
        const oc=document.createElement('canvas'); oc.width=Math.ceil(size); oc.height=Math.ceil(size);
        const o=oc.getContext('2d');
        o.imageSmoothingEnabled=true;o.imageSmoothingQuality='high';
        o.drawImage(WHL, 0, 0, oc.width, oc.height);
        o.globalCompositeOperation='source-atop';
        const ng=o.createRadialGradient(oc.width*.35,oc.height*.3,0,oc.width/2,oc.height/2,oc.width*.55);
        ng.addColorStop(0,'rgba(255,185,100,.16)');
        ng.addColorStop(.55,'rgba(0,0,0,0)');
        ng.addColorStop(1,'rgba(0,4,12,.16)');
        o.fillStyle=ng;o.fillRect(0,0,oc.width,oc.height);
        const wl=o.createLinearGradient(0,0,oc.width,oc.height*.6);
        wl.addColorStop(0,'rgba(0,0,0,.10)');
        wl.addColorStop(.5,'rgba(255,170,80,.08)');
        wl.addColorStop(1,'rgba(255,200,120,.24)');
        o.fillStyle=wl;o.fillRect(0,0,oc.width,oc.height);
        dc.save();
        dc.imageSmoothingEnabled=true;dc.imageSmoothingQuality='high';
        dc.translate(wx, wy);
        dc.rotate(narrow?0.02:-0.04);
        dc.drawImage(oc, -size/2, -size/2, size, size);
        dc.restore();
      }else{
        // Fallback procedural wheel if PNG fails
        dc.save();
        dc.fillStyle='#3a2818';
        for(let i=0;i<8;i++){
          const a=i/8*Math.PI*2;
          dc.beginPath();dc.ellipse(wx+Math.cos(a)*R*1.1,wy+Math.sin(a)*R*1.1,R*.08,R*.08,0,0,7);dc.fill();
        }
        dc.beginPath();dc.arc(wx,wy,R*.95,0,7);dc.arc(wx,wy,R*.78,0,7,true);dc.fill();
        dc.fillStyle='#c49a4a';dc.beginPath();dc.arc(wx,wy,R*.16,0,7);dc.fill();
        dc.restore();
      }
    }

    P={lp,k:f/LZ};frame(performance.now());
  }

  // --- lantern: brass + glass, crisp each frame with living flame
  function frame(t){
    const c=lc;c.clearRect(0,0,W,H);if(!P.lp)return;
    const [x,y]=P.lp,k=P.k, u=k*.01;
    const fl=on&&!document.hidden?(.85+.15*Math.sin(t*.011)*Math.sin(t*.0047+1)+.06*Math.sin(t*.031)):.95;
    const brass=(a)=>{const g=c.createLinearGradient(x-14*u,0,x+14*u,0);g.addColorStop(0,`rgba(70,48,22,${a})`);g.addColorStop(.35,`rgba(214,160,78,${a})`);g.addColorStop(.6,`rgba(150,100,40,${a})`);g.addColorStop(1,`rgba(48,30,14,${a})`);return g};
    c.fillStyle='rgba(0,0,0,.5)';c.beginPath();c.ellipse(x-4*u,y,20*u,5.5*u,0,0,7);c.fill();
    let g=c.createRadialGradient(x,y-22*u,0,x,y-22*u,78*u*fl);
    g.addColorStop(0,`rgba(255,200,110,${.48*fl})`);g.addColorStop(.3,'rgba(255,150,60,.14)');g.addColorStop(1,'rgba(255,120,40,0)');
    c.globalCompositeOperation='lighter';c.fillStyle=g;c.fillRect(x-90*u,y-110*u,180*u,180*u);c.globalCompositeOperation='source-over';
    c.fillStyle=brass(1);c.beginPath();c.ellipse(x,y-1*u,13*u,3.4*u,0,0,7);c.fill();
    c.fillRect(x-13*u,y-9*u,26*u,8*u);c.beginPath();c.ellipse(x,y-9*u,13*u,3.4*u,0,0,7);c.fillStyle='rgb(120,82,34)';c.fill();
    const gy=y-24*u;g=c.createRadialGradient(x,gy+3*u,0,x,gy,13*u);
    g.addColorStop(0,`rgba(255,236,170,${.95*fl})`);g.addColorStop(.45,`rgba(255,180,80,${.55*fl})`);g.addColorStop(1,'rgba(160,90,30,.35)');
    c.fillStyle=g;c.beginPath();c.ellipse(x,gy,10.5*u,15*u,0,0,7);c.fill();
    const sw=on?Math.sin(t*.006)*.8*u:0;c.beginPath();c.moveTo(x-2.6*u,gy+6*u);c.quadraticCurveTo(x-3*u,gy-2*u,x+sw,gy-(9+3*fl)*u);c.quadraticCurveTo(x+3*u,gy-2*u,x+2.6*u,gy+6*u);c.closePath();
    g=c.createLinearGradient(0,gy+6*u,0,gy-12*u);g.addColorStop(0,'#fff6d0');g.addColorStop(.5,'#ffd060');g.addColorStop(1,'rgba(255,120,30,.2)');c.fillStyle=g;c.fill();
    c.strokeStyle='rgba(255,255,240,.5)';c.lineWidth=Math.max(1,1.2*u);c.beginPath();c.ellipse(x-4*u,gy-2*u,3*u,9*u,.15,2.4,4.2);c.stroke();
    c.strokeStyle=brass(1);c.lineWidth=Math.max(1,1.6*u);
    for(const dx of[-10.5,-4,4,10.5]){c.beginPath();c.moveTo(x+dx*u,y-9*u);c.quadraticCurveTo(x+dx*1.35*u,gy,x+dx*.55*u,y-41*u);c.stroke()}
    c.beginPath();c.ellipse(x,gy,11.5*u,2.6*u,0,0,Math.PI);c.stroke();
    c.fillStyle=brass(1);c.beginPath();c.moveTo(x-9*u,y-40*u);c.lineTo(x+9*u,y-40*u);c.lineTo(x+4.5*u,y-48*u);c.lineTo(x-4.5*u,y-48*u);c.closePath();c.fill();
    c.fillRect(x-3.6*u,y-55*u,7.2*u,7*u);c.fillStyle='rgb(60,40,18)';c.fillRect(x-4.4*u,y-56*u,8.8*u,1.8*u);
    c.strokeStyle=brass(1);c.lineWidth=Math.max(1,1.4*u);c.beginPath();c.ellipse(x,y-48*u,12*u,16*u,0,Math.PI*1.05,Math.PI*1.95);c.stroke();
    c.beginPath();c.arc(x,y-63.5*u,2.4*u,0,7);c.stroke();
  }
  let raf=0,last=0;
  function loop(t){raf=0;if(!on||document.hidden)return;if(t-last>40){last=t;frame(t)}raf=requestAnimationFrame(loop)}
  function kick(){if(!lan)return;frame(performance.now());if(on&&!document.hidden&&!raf)raf=requestAnimationFrame(loop)}
  let rt;addEventListener('resize',()=>{clearTimeout(rt);rt=setTimeout(draw,120)});
  // first paint once images settle; also paint immediately so layout isn't blank
  draw();apply();
})();
