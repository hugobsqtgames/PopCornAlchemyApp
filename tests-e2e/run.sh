#!/usr/bin/env bash
# End-to-end checks on the web build: every screen and mode (qa.mjs), then attempts to break
# the app (chaos.mjs), then ads and purchases with the money switch on (money.mjs), then
# beta-tester flows in every language, size and theme (beta.mjs).
# Needs Playwright with Chromium. Usage: bash tests-e2e/run.sh
set -euo pipefail
here="$(cd "$(dirname "$0")" && pwd)"
cd "$here/../mobile"
node -e "
const src=require('fs').readFileSync('src/game/levels.ts','utf8');
const re=/id: (\d+), cat: '(\w+)', d: (\d), sol: (\[.*?\]), name: (\{.*?\}) \}/g;let m,a=[];
while((m=re.exec(src)))a.push({id:+m[1],cat:m[2],d:+m[3],sol:JSON.parse(m[4]),name:JSON.parse(m[5])});
require('fs').writeFileSync('$here/levels.json',JSON.stringify(a));"
rm -rf "$here/web" "$here/web-money"
CI=1 npx expo export --platform web --output-dir "$here/web" --clear > /dev/null
# Same app with the ads and purchases switch on (MONEY_READY), for money.mjs.
EXPO_PUBLIC_TEST_MONEY=1 CI=1 npx expo export --platform web --output-dir "$here/web-money" --clear > /dev/null
node "$here/serve.mjs" & server=$!
WEB=web-money PORT=8767 node "$here/serve.mjs" & server2=$!
trap 'kill $server $server2' EXIT
sleep 1
node "$here/qa.mjs"
node "$here/chaos.mjs"
node "$here/money.mjs"
node "$here/beta.mjs"
