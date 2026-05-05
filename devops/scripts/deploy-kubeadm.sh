#!/usr/bin/env bash
set -euo pipefail

BACKEND_IMAGE="${BACKEND_IMAGE:-your-dockerhub/hrbrain-backend:latest}"
FRONTEND_IMAGE="${FRONTEND_IMAGE:-your-dockerhub/hrbrain-frontend:latest}"
ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/../.." && pwd)"
K8S_DIR="$ROOT_DIR/devops/kubernetes"
TMP_DIR="$(mktemp -d)"
trap 'rm -rf "$TMP_DIR"' EXIT

kubectl apply -f "$K8S_DIR/namespace.yaml"
kubectl apply -f "$K8S_DIR/apps/mongodb.yaml"
kubectl apply -f "$K8S_DIR/apps/backend-service.yaml"
kubectl apply -f "$K8S_DIR/apps/frontend-service.yaml"
sed "s#__BACKEND_IMAGE__#${BACKEND_IMAGE}#g" "$K8S_DIR/apps/backend-deployment.yaml" > "$TMP_DIR/backend-deployment.yaml"
sed "s#__FRONTEND_IMAGE__#${FRONTEND_IMAGE}#g" "$K8S_DIR/apps/frontend-deployment.yaml" > "$TMP_DIR/frontend-deployment.yaml"
kubectl apply -f "$TMP_DIR/backend-deployment.yaml"
kubectl apply -f "$TMP_DIR/frontend-deployment.yaml"
kubectl apply -f "$K8S_DIR/network/ingress.yaml"
kubectl apply -f "$K8S_DIR/network/network-policies.yaml"
kubectl -n hrbrain rollout status deployment/hrbrain-backend --timeout=180s
kubectl -n hrbrain rollout status deployment/hrbrain-frontend --timeout=180s
