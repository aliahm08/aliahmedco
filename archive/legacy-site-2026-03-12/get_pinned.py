import urllib.request
import re

url = "https://github.com/aliahm08"
req = urllib.request.Request(url, headers={'User-Agent': 'Mozilla/5.0'})
try:
    html = urllib.request.urlopen(req).read().decode('utf-8')
    # Pinned repos are inside <ol class="d-flex flex-wrap list-style-none gutter-condensed mb-4 js-pinned-items-reorder-list"> 
    # Or just search for <span class="repo" title="RepoName">
    matches = re.findall(r'<span class="repo" title="([^"]+)">', html)
    print("Pinned Repos:", matches)
except Exception as e:
    print(e)
