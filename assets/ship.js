/* Grounded lantern is part of the deck photo. Motion never separates the two. */
(()=>{
  const key='pf-rock', media=matchMedia('(prefers-reduced-motion: reduce)');
  let saved=null;try{saved=localStorage.getItem(key)}catch{}
  let on=saved===null?!media.matches:saved==='1';
  const checkbox=document.getElementById('set-rock');
  window.pfMotion=()=>on;
  function apply(){document.documentElement.classList.toggle('calm',!on);if(checkbox)checkbox.checked=on;dispatchEvent(new Event('pfmotion'))}
  if(checkbox)checkbox.addEventListener('change',()=>{on=checkbox.checked;try{localStorage.setItem(key,on?'1':'0')}catch{}apply()});
  media.addEventListener('change',e=>{if(saved===null){on=!e.matches;apply()}});
  document.addEventListener('visibilitychange',()=>document.documentElement.classList.toggle('scene-paused',document.hidden));
  apply();
})();
