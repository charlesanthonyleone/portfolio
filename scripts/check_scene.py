"""Confirm the published pages are encrypted and prose is not left in the clear.

Run from the repository root: python3 scripts/check_scene.py
"""
from pathlib import Path
import re
import sys

root = Path(__file__).resolve().parents[1]
pages = ("index.html", "projects.html", "story.html")
# Structural markers from the unlocked pages. These are not the essay itself.
# Built by joining so this file does not itself contain the published markup.
leaks = (
    '<div class="' + 'prose"',
    'id="' + 'grok-rec"',
    'id="' + 'the-prompt"',
    'class="' + 'hero-quote"',
    'data-' + 'cat=',
    'assets/' + 'shots/',
    'class="' + 'lede"',
    'class="' + 'proj"',
)
skip_dirs = {".git", "node_modules", "plain", "decrypted", "encrypted"}
text_suffixes = {".html", ".js", ".css", ".py", ".mjs", ".json", ".md", ".txt", ".svg"}


def iter_text_files():
    for path in root.rglob("*"):
        if not path.is_file():
            continue
        if any(part in skip_dirs for part in path.relative_to(root).parts):
            continue
        if path.suffix.lower() in text_suffixes:
            yield path


def main():
    gitignore = (root / ".gitignore").read_text(encoding="utf-8")
    for line in ("plain/", "decrypted/", "node_modules/", ".env"):
        if line not in gitignore:
            sys.exit(f"gitignore is missing {line}")

    for name in pages:
        text = (root / name).read_text(encoding="utf-8")
        if "staticryptEncryptedMsgUniqueVariableName" not in text:
            sys.exit(f"{name} is not encrypted")
        if "This night is locked" not in text:
            sys.exit(f"{name} is missing the passkey gate")
        for leak in leaks:
            if leak in text:
                sys.exit(f"{name} still contains plaintext marker {leak}")

    src = root / "src"
    if src.exists() and any(src.rglob("*.html")):
        sys.exit("src/ still contains HTML")

    for path in iter_text_files():
        body = path.read_text(encoding="utf-8", errors="strict")
        for leak in leaks:
            if leak in body:
                sys.exit(f"plaintext marker {leak} in {path.relative_to(root)}")

    for asset in (
        "assets/site.css",
        "assets/balloon.js",
        "assets/skyfx.js",
        "assets/pages.js",
        "assets/sky/balloon.webp",
        "assets/sky/balloon-m.webp",
        "scripts/gate.html",
        "scripts/reencrypt.mjs",
        ".staticrypt.json",
    ):
        if not (root / asset).is_file():
            sys.exit(f"missing {asset}")

    helper = (root / "scripts/reencrypt.mjs").read_text(encoding="utf-8")
    if "PORTFOLIO_PASSKEY" not in helper or "STATICRYPT_PASSWORD" not in helper:
        sys.exit("re-encrypt helper does not read the passkey from the environment")
    if re.search(r"\b[a-z]{3,12}-[a-z]{3,12}-[a-z]{3,12}-\d{4}\b", helper):
        sys.exit("re-encrypt helper contains a passkey-shaped literal")

    print("PASS: pages encrypted, gate present, no plaintext prose markers")


if __name__ == "__main__":
    main()
