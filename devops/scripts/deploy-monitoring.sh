#!/usr/bin/env bash
set -euo pipefail
ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/../.." && pwd)"
kubectl apply -k "$ROOT_DIR/devops/kubernetes/monitoring"
kubectl -n monitoring rollout status deployment/prometheus --timeout=180s
kubectl -n monitoring rollout status deployment/alertmanager --timeout=180s
kubectl -n monitoring rollout status deployment/grafana --timeout=180s
