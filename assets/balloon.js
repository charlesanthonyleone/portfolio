/* Balloon plate: gear panel + sway / clouds / water toggles (honor prefers-reduced-motion). */
(()=>{
  const rm=matchMedia('(prefers-reduced-motion: reduce)').matches,$=id=>document.getElementById(id),H=document.documentElement;
  const get=k=>{try{const v=localStorage.getItem(k);return v===null?!rm:v==='1'}catch{return!rm}};
  const S={rock:['pf-rock','sway'],clouds:['pf-clouds','m-clouds'],water:['pf-water','m-water'],stars:['pf-stars','m-stars'],moon:['pf-moon','m-moon']},st={};
  const apply=()=>{for(const k in S)H.classList.toggle(S[k][1],st[k]);H.classList.toggle('calm',!st.rock)};
  for(const k in S)st[k]=get(S[k][0]);
  window.pfMotion=()=>st.rock;window.pfFx=()=>st;apply();
  for(const k in S){const cb=$('set-'+k);if(!cb)continue;cb.checked=st[k];cb.addEventListener('change',()=>{st[k]=cb.checked;try{localStorage.setItem(S[k][0],st[k]?'1':'0')}catch{}apply();if(k==='rock')dispatchEvent(new Event('pfmotion'));dispatchEvent(new Event('pffx'))})}
  const g=$('gear'),pn=$('scene-panel');
  if(g&&pn){g.addEventListener('click',()=>{const h=pn.hidden;pn.hidden=!h;g.setAttribute('aria-expanded',String(h))});
    document.addEventListener('keydown',e=>{if(e.key==='Escape'&&!pn.hidden){pn.hidden=true;g.setAttribute('aria-expanded','false');g.focus()}})}
})();
