#!/usr/bin/env bash
set -euo pipefail

API_URL="${SMOKE_API_URL:-https://api.tuweb.com}"
SIGNAL_URL="${SMOKE_SIGNAL_URL:-https://signal.tuweb.com}"
TURN_HOST="${SMOKE_TURN_HOST:-turn.tuweb.com}"
TURN_USER="${TURN_USER:-rtc}"
TURN_PASS="${TURN_PASS:-changeme}"

curl --fail --silent --show-error "$API_URL/health" | jq .status
curl --fail --silent --show-error "$SIGNAL_URL/healthz" | jq .status

echo "Checking TURN reachability via openssl (UDP not supported in CI, fallback to TCP 3478)"
if command -v nc >/dev/null; then
  nc -z -w5 "$TURN_HOST" 3478 || {
    echo "TURN TCP check failed" >&2
    exit 1
  }
fi

echo "Running WebSocket sanity"
node <<'NODE'
const { WebSocket } = globalThis;
if (typeof WebSocket === 'undefined') {
  console.warn('WebSocket API not available in this Node runtime, skipping signal check.');
  process.exit(0);
}

const signalUrl = process.env.SIGNAL_WS ?? 'wss://signal.tuweb.com';
const token = process.env.SMOKE_JWT ?? '';

const ws = new WebSocket(signalUrl, {
  headers: token ? { Authorization: `Bearer ${token}` } : {}
});

let steps = 0;

ws.on('open', () => {
  ws.send(JSON.stringify({ type: 'HELLO', payload: { clientVersion: 'smoke', intents: ['MATCH'] } }));
});

ws.on('message', (raw) => {
  const message = JSON.parse(raw.toString());
  if (message.type === 'WELCOME') {
    steps += 1;
    ws.send(JSON.stringify({ type: 'TICKET_CREATE', payload: { mode: 'classic', consents: ['soft'] } }));
    setTimeout(() => {
      ws.send(JSON.stringify({ type: 'LEAVE' }));
      ws.close();
    }, 500);
  }
});

ws.on('close', () => {
  if (steps === 0) {
    console.error('Signal did not respond with WELCOME');
    process.exit(1);
  }
  process.exit(0);
});
NODE
