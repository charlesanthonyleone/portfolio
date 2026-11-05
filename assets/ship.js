/* Coherent photoreal helm plate over scene.js sky/ocean + flame flicker. */
(()=>{
  const K='pf-rock', rm=matchMedia('(prefers-reduced-motion: reduce)').matches;
  let on=(()=>{try{const v=localStorage.getItem(K);return v===null?!rm:v==='1'}catch{return!rm}})();
  window.pfMotion=()=>on;
  document.documentElement.classList.toggle('calm',!on);

  const $=id=>document.getElementById(id);
  const sc=document.querySelector('.scene');
  const topEl=$('scene-top'), dawn=$('dawn'), ship=$('ship'), deck=$('deck');
  const lan=$('lantern'), fc=$('flame'), glow=$('lglow'), pool=$('lpool'), cb=$('set-rock');
  if(!ship||!deck||!lan||!fc) return;

  // WebGL flame
  let gl=null, pr=null, uT, uI, uS, uR;
  try{
    gl=fc.getContext('webgl',{premultipliedAlpha:true,alpha:true});
    if(gl){
      const sh=(ty,src)=>{const o=gl.createShader(ty);gl.shaderSource(o,src);gl.compileShader(o);return o};
      pr=gl.createProgram();
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
float a=f*(.85+.15*I);vec3 col=c*a*(.85+.3*I);
float halo=exp(-length(vec2(u.x,(y-.25)*.7))*7.)*.22*I;col+=vec3(1.,.55,.2)*halo;
gl_FragColor=vec4(col,max(a,halo));}`));
      gl.linkProgram(pr); gl.useProgram(pr);
      const b=gl.createBuffer(); gl.bindBuffer(gl.ARRAY_BUFFER,b);
      gl.bufferData(gl.ARRAY_BUFFER,new Float32Array([-1,-1,1,-1,-1,1,1,1]),gl.STATIC_DRAW);
      const loc=gl.getAttribLocation(pr,'p'); gl.enableVertexAttribArray(loc); gl.vertexAttribPointer(loc,2,gl.FLOAT,false,0,0);
      uT=gl.getUniformLocation(pr,'t'); uI=gl.getUniformLocation(pr,'I'); uS=gl.getUniformLocation(pr,'S'); uR=gl.getUniformLocation(pr,'R');
      gl.enable(gl.BLEND); gl.blendFunc(gl.ONE, gl.ONE_MINUS_SRC_ALPHA);
    }
  }catch(e){ gl=null; }

  if(cb){
    cb.checked=on;
    cb.addEventListener('change',()=>{
      on=cb.checked; try{localStorage.setItem(K,on?'1':'0')}catch{}
      document.documentElement.classList.toggle('calm',!on);
      dispatchEvent(new Event('pfmotion'));
      on?loop():still();
    });
  }

  const CFG={
    d:{src:'assets/sky/deck.webp',W:2560,H:1800,hx:.742,hy:.548,lh:.09,px:.72,py:.70,ax:.5,dy:.16},
    m:{src:'assets/sky/deck-m.webp',W:1328,H:1440,hx:.80,hy:.538,lh:.09,px:.76,py:.76,ax:.5,dy:.22}
  };
  let c,iw,ih,lw,lhh,DPR=Math.min(devicePixelRatio||1,2);

  function fit(){
    const w=innerWidth, h=innerHeight;
    c = w<760 ? CFG.m : CFG.d;
    const want = c.src;
    // Always set via attribute so empty-src → documentURL doesn't confuse us
    if(deck.getAttribute('src')!==want) deck.setAttribute('src', want);
    const s=Math.max(w/c.W, h/(c.H*0.70))*1.10;
    iw=c.W*s; ih=c.H*s;
    const x=(w-iw)*c.ax, y=h-ih+ih*c.dy;
    ship.style.cssText = `position:fixed;z-index:2;pointer-events:none;transform-origin:50% 100%;width:${iw}px;height:${ih}px;left:${x}px;top:${y}px;`;
    deck.style.cssText = 'position:absolute;left:0;top:0;width:100%;height:100%;display:block;object-fit:fill;';
    lhh=ih*c.lh; lw=lhh*0.55;
    lan.style.cssText = `position:absolute;width:${lw}px;height:${lhh}px;left:${c.hx*iw-lw/2}px;top:${c.hy*ih}px;transform-origin:50% 0;pointer-events:none;`;
    fc.width=Math.max(2,Math.round(lw*DPR)); fc.height=Math.max(2,Math.round(lhh*DPR));
    fc.style.cssText = `position:absolute;left:0;top:0;width:${lw}px;height:${lhh}px;mix-blend-mode:screen;display:block;`;
    const R=Math.max(160, iw*0.18);
    if(glow){ glow.style.setProperty('--r',R+'px'); glow.style.left=(c.hx*iw)+'px'; glow.style.top=(c.hy*ih+lhh*0.55)+'px'; }
    if(pool){ pool.style.left=(c.px*iw)+'px'; pool.style.top=(c.py*ih)+'px'; pool.style.setProperty('--r',(iw*0.20)+'px'); }
  }

  let I=1, seed=Math.random()*99;
  const n=(t,k)=>Math.sin(t*k+seed)*.5+Math.sin(t*k*2.31+seed*1.7)*.3+Math.sin(t*k*5.17+seed*.3)*.2;

  function flame(t,dt){
    const W=fc.width, H=fc.height;
    if(on) I+=((1+.14*n(t,7)+.08*n(t,19))-I)*Math.min(1,dt*18); else I=1;
    if(gl&&pr){
      gl.viewport(0,0,W,H); gl.clearColor(0,0,0,0); gl.clear(gl.COLOR_BUFFER_BIT);
      gl.uniform1f(uT,on?t:3.7); gl.uniform1f(uI,Math.max(.35,I)); gl.uniform1f(uS,on?n(t,2.3)*.07:0); gl.uniform2f(uR,W,H);
      gl.drawArrays(gl.TRIANGLE_STRIP,0,4);
    }else{
      const ctx=fc.getContext('2d'); if(!ctx) return;
      ctx.clearRect(0,0,W,H);
      const g=ctx.createRadialGradient(W/2,H*.7,0,W/2,H*.4,H*.45);
      g.addColorStop(0,`rgba(255,240,180,${.95*I})`); g.addColorStop(.5,`rgba(255,140,40,${.55*I})`); g.addColorStop(1,'rgba(255,60,0,0)');
      ctx.fillStyle=g; ctx.beginPath(); ctx.ellipse(W/2,H*.48,W*.28,H*.4,0,0,7); ctx.fill();
    }
    const L=Math.max(.25,I);
    if(glow) glow.style.opacity=(.45+.4*L).toFixed(3);
    if(pool) pool.style.opacity=(.28+.5*L).toFixed(3);
  }

  let raf=0, last=performance.now();
  function frame(now){
    const t=now/1000, dt=Math.min(.05,(now-last)/1000); last=now;
    const roll=1.35*Math.sin(t*2*Math.PI/10.5);
    const pitch=7*Math.sin(t*2*Math.PI/9.2+1.1);
    const heave=3*Math.sin(t*2*Math.PI/7.1);
    const T=`translateY(${pitch+heave}px) rotate(${roll}deg)`;
    if(sc) sc.style.transform=T;
    if(topEl) topEl.style.transform=T;
    if(dawn) dawn.style.transform=T;
    ship.style.transform=`translateY(${-heave*.2}px) rotate(${-roll*.1}deg)`;
    lan.style.transform=`rotate(${-roll*1.1+Math.sin(t*2*Math.PI/10.5-.9)*.7}deg)`;
    flame(t,dt);
    if(on) raf=requestAnimationFrame(frame);
  }
  function still(){
    cancelAnimationFrame(raf); raf=0;
    if(sc) sc.style.transform='';
    if(topEl) topEl.style.transform='';
    if(dawn) dawn.style.transform='';
    ship.style.transform=''; lan.style.transform='';
    flame(0,0);
  }
  function loop(){ cancelAnimationFrame(raf); last=performance.now(); raf=requestAnimationFrame(frame); }

  addEventListener('resize', fit);
  deck.addEventListener('load', fit);
  fit();
  on?loop():still();
  document.addEventListener('visibilitychange',()=>{
    document.documentElement.classList.toggle('scene-paused', document.hidden);
    if(document.hidden) cancelAnimationFrame(raf); else if(on) loop();
  });
})();
