"""Run from the repository root: python3 scripts/check_scene.py."""
from pathlib import Path
from html.parser import HTMLParser
import re

class Assets(HTMLParser):
    def handle_starttag(self, tag, attrs):
        attrs=dict(attrs)
        for key in ('src', 'href'):
            value=attrs.get(key, '')
            if value.startswith('assets/'):
                assert Path(value).is_file(), value
        for candidate in attrs.get('srcset', '').split(','):
            if candidate.strip():
                assert Path(candidate.split()[0]).is_file(), candidate

for page in ('index.html','story.html','projects.html'):
    text=Path(page).read_text()
    Assets().feed(text)
    assert text.count('id="ship"')==1
    assert '<canvas id="deck"></canvas><canvas id="lantern"></canvas>' in text
    assert '.webp' not in text.split('id="ship"')[1].split('</div>')[0], 'deck must be procedural, not a photo plate'

source=Path('src/story.html').read_text()
rendered=Path('story.html').read_text()
for id in ('the-prompt','grok-rec'):
    original=re.search(r'<section id="'+id+r'".*?</section>',source,re.S).group()
    assert original in rendered, id+' changed'
prose=re.search(r'<div class="prose">.*?</div>',source,re.S).group()
assert prose in rendered, 'Personal essay changed'
assert rendered.index('id="the-prompt"') < rendered.index('class="story-columns"')
assert rendered.index('class="story-columns"') < rendered.index('id="story"') < rendered.index('id="grok-rec"')
for page in ('index.html','projects.html'):
    text=Path(page).read_text()
    for url in ('https://inteloasis.com','https://scavengia.com'):
        assert url in text
css=Path('assets/site.css').read_text()
assert '.ship{position:fixed;z-index:2;' in css
assert '.scene-top{z-index:1;' in css
assert 'z-index:9999' not in css
assert 'html.calm .ship{animation:none' in css
print('PASS: assets, responsive sources, layer order, reduced motion, verbatim texts, story layout and flagship links')
