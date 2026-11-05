import re,os
R=lambda f:open(os.path.join('src',f)).read()
hero,inv,story,proj,foot,gear=[R(f+'.html') for f in 'hero invite story projects foot gear'.split()]
hero=hero.replace('href="#story"','href="story.html"').replace('href="#projects"','href="projects.html"')
inv=inv.replace('href="#projects"','href="projects.html"')
arts=re.findall(r'<article.*?</article>',proj,re.S)
foot=foot.replace('Ship deck &amp; lantern: original image generated for this site','Ship deck &amp; lantern: drawn in code for this site')
def page(fn,title,cls,body,extra=''):
  nav=''.join(f'<a href="{h}"{" aria-current=page" if h==fn else ""}>{t}</a>' for h,t in [('story.html','My Story'),('projects.html','Projects'),('https://github.com/charlesanthonyleone','GitHub')])
  open(fn,'w').write(f'''<!doctype html><html lang="en"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1,viewport-fit=cover">
<title>{title}</title><meta name="description" content="Charles Leone — self-taught builder of tools for humanity.">
<meta name="theme-color" content="#02050b"><link rel="icon" href="data:image/svg+xml,<svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 100 100'><text y='.9em' font-size='90'>🌙</text></svg>">
<link rel="preload" href="assets/sky/moon.webp" as="image"><link rel="stylesheet" href="assets/site.css"></head><body class="{cls}">
<div class="scene" aria-hidden="true"><div id="scene-fb" class="scene-fallback"></div><canvas id="scene-gl" class="scene-gl"></canvas><canvas id="scene-2d" class="scene-2d"></canvas></div>
<div id="dawn" class="dawn" aria-hidden="true"></div>{extra}
<canvas id="scene-top" class="scene-top" aria-hidden="true"></canvas>
<div class="ship" id="ship" aria-hidden="true"><canvas id="deck"></canvas><canvas id="lantern"></canvas></div>
<nav class="nav glass"><a href="index.html" class="brand">Charles Leone</a><span>{nav}</span></nav>
<main class="wrap">{body}{foot}</main>
{gear}
<script src="assets/scene.js" defer></script><script src="assets/ship.js" defer></script><script src="assets/pages.js" defer></script>
</body></html>''')
feat='<section class="featured"><div class="sec-h"><h2 class="sh">Flagship</h2><a class="hint" href="projects.html">All 14 projects →</a></div><div class="grid">'+''.join(arts[:3])+'</div></section>'
links='<section class="doors"><a class="door glass" href="story.html"><span class="eyebrow">The log</span><b>My Story</b><span>In my own words — 12 min read</span></a><a class="door glass" href="projects.html"><span class="eyebrow">The work</span><b>Projects</b><span>14 things built and live</span></a></section>'
page('index.html','Charles Leone · Portfolio','p-home',hero+inv+links+feat)
st=story.replace('<section id="story" class="essay glass">','<section id="story" class="essay log glass">').replace('<p class="eyebrow">My Story</p>','<p class="eyebrow">Ship’s log · My Story</p>')
# Layout only: preserve the three source sections byte-for-byte.
sections=re.findall(r'<section\b.*?</section>',st,re.S)
assert len(sections)==3
st=sections[1]+'<div class="story-columns">'+sections[0]+sections[2]+'</div>'
page('story.html','My Story · Charles Leone','p-story','<div id="logbar" class="logbar"></div>'+st)
page('projects.html','Projects · Charles Leone','p-projects',proj,'')
