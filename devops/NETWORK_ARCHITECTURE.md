# HRBrain — Architecture réseau kubeadm

```txt
Internet / LAN
    |
    | DNS/hosts:
    | - hrbrain.local      -> Ingress Controller IP
    | - api.hrbrain.local  -> Ingress Controller IP
    v
[NGINX Ingress Controller]
    |------------------------------|
    |                              |
    v                              v
[Service hrbrain-frontend:80]   [Service hrbrain-backend:3000]
    |                              |
    v                              v
[2x Frontend pods / Nginx]       [2x Backend pods / NestJS]
                                   |
                                   v
                            [Service mongodb:27017]
                                   |
                                   v
                              [MongoDB pod + PVC]

Monitoring namespace:
[Prometheus] ---> scrape backend /metrics
[Prometheus] ---> blackbox frontend /health
[Prometheus] ---> send alerts to [Alertmanager]
[Grafana]    ---> reads Prometheus datasource
[Alertmanager] ---> email to admin on critical errors
```

## Network isolation

The Kubernetes manifests include NetworkPolicy resources:

- default deny ingress/egress in `hrbrain` namespace;
- allow external ingress to frontend/backend through the ingress controller;
- allow backend to reach MongoDB on TCP `27017`;
- allow DNS and HTTP/HTTPS egress for required external APIs.

## Ports

| Component | Namespace | Service | Port | Purpose |
|---|---:|---|---:|---|
| Frontend | `hrbrain` | `hrbrain-frontend` | 80 | React static app served by Nginx |
| Backend | `hrbrain` | `hrbrain-backend` | 3000 | NestJS API, `/health`, `/metrics` |
| MongoDB | `hrbrain` | `mongodb` | 27017 | Application database |
| Prometheus | `monitoring` | `prometheus` | 9090 | Metrics and alert rules |
| Alertmanager | `monitoring` | `alertmanager` | 9093 | Email alert routing |
| Grafana | `monitoring` | `grafana` | 3000 | Dashboards |
| Blackbox exporter | `monitoring` | `blackbox-exporter` | 9115 | HTTP health probes |
