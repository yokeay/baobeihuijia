import glob
import os
from playwright.sync_api import sync_playwright

# The installed browser build number often does not match what this playwright
# release expects (it looks for chromium_headless_shell-1223 while 1234 is what
# is on disk), so resolve the real binary and hand it over explicitly rather
# than letting playwright guess — `playwright install` is not needed.
CACHE = os.path.expanduser("~/.cache/ms-playwright")
PATTERNS = [
    CACHE + "/chromium-*/chrome-linux64/chrome",
    CACHE + "/chromium-*/chrome-linux/chrome",
    CACHE + "/chromium_headless_shell-*/chrome-headless-shell-linux64/chrome-headless-shell",
]
exe = None
for pat in PATTERNS:
    found = sorted(glob.glob(pat))
    if found:
        exe = found[-1]
        break
if not exe:
    raise SystemExit("no chromium binary found under " + CACHE)
print("chromium:", exe)

BASE = os.environ.get("SHOT_BASE", "http://localhost:3000")
OUT_DIR = "docs/screenshots"

# name, width, height, is_mobile, scroll_to_feed
SHOTS = [
    ("hero-desktop.png", 1440, 900, False, False),
    ("feed-desktop.png", 1440, 900, False, True),
    ("feed-mobile.png", 414, 896, True, True),
]

# Case photos are hot-linked from upstream sources and lazy-loaded, so the page
# is "networkidle" long before they arrive — drive the lazy loader by scrolling,
# then block until the images actually decode.
#
# so.baobeihuijia.com answers 429 to the default HeadlessChrome User-Agent while
# serving 200 to a normal Chrome UA, so the context must present a real one.
# (Real visitors are unaffected; this only bites automation.)
REAL_UA = (
    "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 "
    "(KHTML, like Gecko) Chrome/131.0.0.0 Safari/537.36"
)

SETTLE_JS = """
() => Array.from(document.querySelectorAll('img'))
  .filter(i => i.getBoundingClientRect().top < window.innerHeight * 2)
  .every(i => i.complete && i.naturalWidth > 0)
"""


def capture(browser, name, w, h, mobile, scroll_to_feed):
    ctx = browser.new_context(
        viewport={"width": w, "height": h},
        device_scale_factor=2,
        is_mobile=mobile,
        has_touch=mobile,
        locale="zh-CN",
        reduced_motion="reduce",
        user_agent=REAL_UA,
    )
    page = ctx.new_page()
    page.goto(BASE + "/", wait_until="load", timeout=90000)

    if scroll_to_feed:
        for _ in range(6):
            page.mouse.wheel(0, h // 3)
            page.wait_for_timeout(800)
        try:
            page.wait_for_function(SETTLE_JS, timeout=90000)
        except Exception as exc:  # a few upstream photos may simply be dead
            print("  warn: images did not all settle:", type(exc).__name__)
        loaded = page.evaluate(
            "() => Array.from(document.querySelectorAll('img'))"
            ".filter(i => i.complete && i.naturalWidth > 0).length"
        )
        total = page.evaluate("() => document.querySelectorAll('img').length")
        print(f"  images loaded: {loaded}/{total}")
        page.wait_for_timeout(1200)
    else:
        page.wait_for_timeout(1500)

    out = os.path.join(OUT_DIR, name)
    page.screenshot(path=out)
    print("saved", out, os.path.getsize(out), "bytes")
    ctx.close()


os.makedirs(OUT_DIR, exist_ok=True)
with sync_playwright() as p:
    browser = p.chromium.launch(executable_path=exe, args=["--no-sandbox"])
    for shot in SHOTS:
        capture(browser, *shot)
    browser.close()
