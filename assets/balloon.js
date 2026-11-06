/* Balloon-over-ocean plate: gear panel + gentle sway toggle (honors prefers-reduced-motion). */
(()=>{
  const K='pf-rock',rm=matchMedia('(prefers-reduced-motion: reduce)').matches,$=id=>document.getElementById(id);
  let on=(()=>{try{const v=localStorage.getItem(K);return v===null?!rm:v==='1'}catch{return!rm}})();
  const apply=()=>{document.documentElement.classList.toggle('calm',!on);document.documentElement.classList.toggle('sway',on)};
  window.pfMotion=()=>on;apply();
  const cb=$('set-rock'),g=$('gear'),pn=$('scene-panel');
  if(cb){cb.checked=on;cb.addEventListener('change',()=>{on=cb.checked;try{localStorage.setItem(K,on?'1':'0')}catch{}apply();dispatchEvent(new Event('pfmotion'))})}
  if(g&&pn){g.addEventListener('click',()=>{const h=pn.hidden;pn.hidden=!h;g.setAttribute('aria-expanded',String(h))});
    document.addEventListener('keydown',e=>{if(e.key==='Escape'&&!pn.hidden){pn.hidden=true;g.setAttribute('aria-expanded','false');g.focus()}})}
})();
