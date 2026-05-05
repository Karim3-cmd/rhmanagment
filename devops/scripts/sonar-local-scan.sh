#!/usr/bin/env bash
set -euo pipefail

: "${SONAR_TOKEN:?Set SONAR_TOKEN before running this script}"
SONAR_HOST_URL="${SONAR_HOST_URL:-http://localhost:9000}"
ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/../.." && pwd)"

(cd "$ROOT_DIR/BackOffice" && npm ci && npm run test:cov -- --coverageReporters=lcov --coverageReporters=text && npx sonar-scanner -Dsonar.host.url="$SONAR_HOST_URL" -Dsonar.token="$SONAR_TOKEN")
(cd "$ROOT_DIR/FrontOffice" && npm ci && npm run test:coverage && npm run build && npx sonar-scanner -Dsonar.host.url="$SONAR_HOST_URL" -Dsonar.token="$SONAR_TOKEN")
