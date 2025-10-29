# Cardiac Diagnosis System - Railway-ready

This is a Railway-ready full-stack microservices demo:
- Kafka (Bitnami) + Zookeeper
- MongoDB
- Node.js microservices (Express)
- React frontend (Material UI)
- Docker Compose setup (Railway auto-detects)

## Deploy on Railway
1. Push this repo to GitHub.
2. On Railway: New Project → Deploy from GitHub → select this repo.
3. Railway will detect docker-compose.yml and build services.
4. Expose frontend and gateway ports in Railway service settings if needed.

## Run locally
```bash
docker compose build
docker compose up
```
