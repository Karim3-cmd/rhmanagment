# SonarQube capture guide

Use this when the teacher asks for a screenshot of the SonarQube report.

## 1. Start local DevOps tools

```bash
cd devops
docker compose -f docker-compose.devops.yml up -d sonarqube sonarqube-db
```

Open SonarQube: `http://localhost:9000`.
Default login for a fresh SonarQube container is usually `admin / admin`; change the password on first login.

## 2. Create token

In SonarQube:

```txt
My Account -> Security -> Generate Token
```

Then run:

```bash
export SONAR_TOKEN="PASTE_TOKEN_HERE"
export SONAR_HOST_URL="http://localhost:9000"
./devops/scripts/sonar-local-scan.sh
```

## 3. Screenshots required

Take these screenshots:

1. `hrbrain-backend` project dashboard.
2. `hrbrain-frontend` project dashboard.
3. Quality Gate result.
4. Coverage percentage.
5. Bugs / Vulnerabilities / Code Smells.
6. Before/after comparison if refactoring is required.

## 4. What to explain in the report

SonarQube validates the code quality gate after the unit tests generate LCOV coverage. The CI pipeline stops if the quality gate fails, so the CD pipeline is not triggered. This proves that deployment is chained after quality validation, not before it.
