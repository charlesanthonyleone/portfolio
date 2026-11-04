(()=>{const mot=()=>window.pfMotion?window.pfMotion():true,b=document.body;
const io=(sel,cls,opt)=>{const els=[...document.querySelectorAll(sel)];if(!('IntersectionObserver' in window)||!mot()){els.forEach(e=>e.classList.add(cls));return}
const o=new IntersectionObserver(es=>es.forEach(e=>{if(e.isIntersecting){e.target.classList.add(cls);o.unobserve(e.target)}}),opt||{rootMargin:'0px 0px -12% 0px',threshold:.08});els.forEach(e=>o.observe(e))};
addEventListener('pfmotion',()=>{if(!mot())document.querySelectorAll('.ink,.proj').forEach(e=>e.classList.add('in','lit'))});
if(b.classList.contains('p-story')){io('.prose p','in');const d=document.getElementById('dawn');
const up=()=>{const h=document.documentElement,p=Math.min(1,Math.max(0,scrollY/(h.scrollHeight-innerHeight)));d.style.setProperty('--p',p.toFixed(3));document.getElementById('logbar').style.transform=`scaleX(${p})`};addEventListener('scroll',up,{passive:true});up()}
if(b.classList.contains('p-projects')){io('.proj','lit',{rootMargin:'0px 0px -8% 0px',threshold:.15});
}
})();
