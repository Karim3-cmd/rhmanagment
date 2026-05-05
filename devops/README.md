# HRBrain DevOps package

This folder covers the DevOps requirements from the note:

- 2 CI pipelines: backend + frontend.
- 2 CD pipelines: backend + frontend.
- CI triggers CD only after successful validation on `main`.
- Unit tests for backend and frontend.
- SonarQube quality analysis and coverage.
- kubeadm deployment manifests.
- Network architecture between resources.
- Monitoring of frontend, backend, SonarQube, Jenkins, Prometheus, Alertmanager.
- Email alerts to admin through Alertmanager.
- Bonus: accessibility module + monitoring/alerting + HPA + NetworkPolicy.

## Quick local DevOps stack

```bash
cd devops
docker compose -f docker-compose.devops.yml up -d
```

Ports:

| Tool | URL |
|---|---|
| Frontend | `http://localhost:8080` |
| Backend | `http://localhost:3000/health` |
| SonarQube | `http://localhost:9000` |
| Jenkins | `http://localhost:8081` |
| Prometheus | `http://localhost:9090` |
| Alertmanager | `http://localhost:9093` |
| Grafana | `http://localhost:3001` |

Grafana default credentials in this local stack: `admin / admin`.

## kubeadm deployment

Requirements on the machine that runs deployment:

```bash
kubectl version --client
kubectl get nodes
```

Deploy application:

```bash
export BACKEND_IMAGE="your-dockerhub/hrbrain-backend:latest"
export FRONTEND_IMAGE="your-dockerhub/hrbrain-frontend:latest"
./devops/scripts/deploy-kubeadm.sh
```

Deploy monitoring:

```bash
./devops/scripts/deploy-monitoring.sh
```

## Jenkins credentials needed

Create these credentials in Jenkins:

| Credential ID | Type | Purpose |
|---|---|---|
| `SONAR_TOKEN` | Secret text | Authenticates SonarQube scanner |
| `DOCKER_REGISTRY_CREDENTIALS` | Username/password | Docker Hub or registry push |
| `KUBECONFIG_PROD` | Secret file | kubeadm cluster kubeconfig |

## Jenkins jobs

Create four Pipeline jobs and point each one to the matching Jenkinsfile:

| Job name | Jenkinsfile |
|---|---|
| `ci-backend` | `Jenkinsfile.ci.backend` |
| `ci-frontend` | `Jenkinsfile.ci.frontend` |
| `cd-backend` | `Jenkinsfile.cd.backend` |
| `cd-frontend` | `Jenkinsfile.cd.frontend` |

The CI jobs trigger the CD jobs after success on `main`.
