#!/usr/bin/env bash
#
# Starts llama-server (embeddings + chat) in background and docker-compose in foreground.
# On Ctrl+C: kills llama-servers and runs `docker-compose down`.
#
# Tail logs in another terminal:
#   tail -f logs/llama-embed.log
#   tail -f logs/llama-chat.log
#
set -euo pipefail

cd "$(dirname "$0")"

LOG_DIR="logs"
mkdir -p "$LOG_DIR"

EMBED_LOG="$LOG_DIR/llama-embed.log"
CHAT_LOG="$LOG_DIR/llama-chat.log"

cleanup() {
  echo
  echo "Stopping services..."
  if [[ -n "${EMBED_PID:-}" ]] && kill -0 "$EMBED_PID" 2>/dev/null; then
    kill "$EMBED_PID" 2>/dev/null || true
  fi
  if [[ -n "${CHAT_PID:-}" ]] && kill -0 "$CHAT_PID" 2>/dev/null; then
    kill "$CHAT_PID" 2>/dev/null || true
  fi
  docker-compose down
}
trap cleanup EXIT INT TERM

echo "Starting embedding server (port 11435) -> $EMBED_LOG"
llama-server -m "$HOME/models/nomic-embed-text-v1.5-Q8_0.gguf" \
  --port 11435 \
  --embeddings \
  --pooling mean \
  -ngl 99 \
  -c 2048 \
  > "$EMBED_LOG" 2>&1 &
EMBED_PID=$!

echo "Starting chat server (port 11434) -> $CHAT_LOG"
llama-server -m "$HOME/models/Qwen3.5-9B-Q5_K_M.gguf" \
  --port 11434 \
  --host 0.0.0.0 \
  -ngl 99 \
  -fa on \
  -c 8192 \
  --reasoning off \
  --jinja \
  > "$CHAT_LOG" 2>&1 &
CHAT_PID=$!

echo "Starting docker-compose..."
docker-compose up