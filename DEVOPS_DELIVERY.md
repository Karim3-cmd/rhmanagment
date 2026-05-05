# HRBrain DevOps delivery — CI/CD, SonarQube, kubeadm, monitoring

## 1. What was implemented

The project now contains a complete DevOps layer for the frontend and backend:

| Requirement | Implementation |
|---|---|
| 2 CI pipelines | `Jenkinsfile.ci.frontend`, `Jenkinsfile.ci.backend` |
| 2 CD pipelines | `Jenkinsfile.cd.frontend`, `Jenkinsfile.cd.backend` |
| CI before CD | CI jobs trigger CD only after success on `main` |
| Front unit tests | Vitest + Testing Library tests for login and accessibility |
| Back unit tests | Jest tests for health and Prometheus metrics endpoints |
| SonarQube | `sonar-project.properties` for front/back + quality gate wait |
| kubeadm deployment | Kubernetes manifests under `devops/kubernetes` |
| Network architecture | `devops/NETWORK_ARCHITECTURE.md` + Ingress + NetworkPolicy |
| Monitoring | Prometheus + Grafana + Blackbox exporter |
| Alerts | Alertmanager email alerting to admin |
| Bonus | Accessibility assistant, HPA, NetworkPolicy, healthchecks, `/metrics` endpoint |

## 2. Pipeline architecture

```txt
Developer push / PR
       |
       v
CI Backend ------------------> CD Backend
Install -> Lint -> Tests -> Sonar -> Docker Build -> Push -> kubeadm rollout

CI Frontend -----------------> CD Frontend
Install -> Tests -> Build -> Sonar -> Docker Build -> Push -> kubeadm rollout
```

The CD pipeline is not launched if CI fails. That is the clean rule: bad code does not reach the cluster.

## 3. Unit tests added

Frontend:

- `FrontOffice/src/app/components/auth/Login.test.tsx`
- `FrontOffice/src/app/components/accessibility/AccessibilityAssistant.test.tsx`

Backend:

- `BackOffice/src/app.controller.spec.ts`
- `BackOffice/test/app.e2e-spec.ts`

## 4. Monitoring and alerting

Prometheus monitors:

- backend `/metrics` endpoint;
- frontend `/health` endpoint through blackbox exporter;
- SonarQube health;
- Jenkins health;
- Prometheus itself.

Alertmanager sends email alerts when:

- backend is down;
- frontend is down;
- SonarQube is unreachable;
- Jenkins is unreachable;
- backend memory is too high.

## 5. Accessibility bonus

The website includes an accessibility assistant for users with disabilities:

- high contrast;
- larger text;
- readable/dyslexia-friendly mode;
- reduced motion;
- stronger keyboard focus;
- reading guide;
- keyboard shortcut `Alt + A`;
- persistent settings in `localStorage`.

This can be defended as the bonus part: it is not just DevOps glitter; it improves real usability.

## 6. Files to show to the teacher

```txt
Jenkinsfile.ci.backend
Jenkinsfile.ci.frontend
Jenkinsfile.cd.backend
Jenkinsfile.cd.frontend
BackOffice/sonar-project.properties
FrontOffice/sonar-project.properties
devops/docker-compose.devops.yml
devops/kubernetes/
devops/prometheus/prometheus.yml
devops/prometheus/alerts.yml
devops/alertmanager/alertmanager.yml
devops/NETWORK_ARCHITECTURE.md
devops/SONARQUBE_CAPTURE_GUIDE.md
FrontOffice/ACCESSIBILITY.md
```
