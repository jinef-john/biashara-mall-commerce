#!/usr/bin/env bash
# bun runs every test file in one process and mock.module patches the module
# registry globally, so a module mocked in one file leaks into the next. Bun
# has no per-file isolation flag, so each file gets its own process.
set -uo pipefail
cd "$(dirname "$0")"

status=0
for file in *.test.ts; do
  bun test "$file" || status=1
done
exit $status
