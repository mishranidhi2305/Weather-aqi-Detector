# 🌦️ Weather & AQI Dashboard

A 3-tier microservices application that displays real-time weather and Air Quality Index (AQI) data — built primarily as a showcase for end-to-end DevOps and cloud infrastructure engineering, covering containerization, Kubernetes orchestration, secure CI/CD, and production-style AWS networking.

> **Note:** This README focuses on the deployment architecture and DevOps pipeline, not application-level code.

---

## 🏗️ Architecture Overview

```
                         Internet
                             │
                             ▼
              ┌──────────────────────────┐
              │   AWS Network Load       │
              │   Balancer (Internet-    │   ← Public Subnet
              │   facing, Layer 4)       │
              └────────────┬─────────────┘
                            │
                            ▼
              ┌──────────────────────────┐
              │   NodePort Service       │
              │   (kube-proxy routing)   │
              └────────────┬─────────────┘
                            │
                            ▼
              ┌──────────────────────────┐
              │  NGINX Ingress Controller│
              │  (Layer 7 — host/path    │
              │   based routing)         │
              └────────────┬─────────────┘
                            │
              ┌─────────────┼─────────────┐
              ▼             ▼             ▼
        ┌──────────┐  ┌──────────┐  ┌──────────┐
        │ Frontend │  │ Weather  │  │   AQI    │
        │  Service │  │ Service  │  │ Service  │
        └──────────┘  └──────────┘  └──────────┘
                                          │
                    EKS Worker Nodes (Private Subnet)
```

**Network design:** worker nodes and pods run in private subnets with no direct internet exposure. Only the NLB sits in the public subnet, acting as the sole internet-facing entry point — a standard AWS security pattern that minimizes attack surface.

---

## 🔧 Tech Stack

| Layer | Technology |
|---|---|
| Frontend | React |
| Backend | Weather Service, AQI Service (independent microservices) |
| Containerization | Docker |
| Image Registry | Docker Hub |
| Orchestration | Kubernetes (Amazon EKS) |
| Cluster provisioning | `eksctl` |
| Package Management | Helm |
| Ingress / L7 Routing | NGINX Ingress Controller |
| Load Balancing | AWS Network Load Balancer (in-tree AWS Cloud Controller Manager) |
| CI/CD | GitHub Actions |
| Cloud Auth | OpenID Connect (OIDC) — no static AWS credentials |
| Cluster Auth | IAM ↔ Kubernetes RBAC (`aws-auth` ConfigMap) |

---

## ☸️ Kubernetes & Networking Details

### Load Balancer Provisioning

The NLB is provisioned automatically the moment the NGINX Ingress Controller is installed, via the in-tree AWS Cloud Controller Manager reading standard Kubernetes Service annotations:

```yaml
service.beta.kubernetes.io/aws-load-balancer-type: "nlb"
service.beta.kubernetes.io/aws-load-balancer-backend-protocol: "tcp"
service.beta.kubernetes.io/aws-load-balancer-cross-zone-load-balancing-enabled: "true"
```

The NLB is configured as internet-facing, sitting at Layer 4 and forwarding TCP traffic directly to a NodePort Service exposed on each worker node.

### Traffic Path

```
NLB (L4, internet-facing) → NodePort Service → kube-proxy → NGINX Ingress Controller Pod → Backend Service → Pod
```

The NGINX Ingress Controller handles all Layer 7 concerns — host-based and path-based routing across the frontend, weather service, and AQI service — decoupling routing logic from the load balancer itself.

### Subnet Isolation

- **Public subnets:** NLB only
- **Private subnets:** EKS worker nodes, all application pods

This ensures compute workloads are never directly reachable from the internet — all traffic must pass through the load balancer and ingress layer.

### Cluster Provisioning

The cluster (`weather-cluster`) itself is provisioned with `eksctl`, which bootstraps the VPC, subnets, managed node group, and node IAM role in a single step, rather than assembling each piece by hand.

---

## 🚀 CI/CD Pipeline

Fully automated build-push-deploy pipeline triggered on every push to `main`:

1. **Build** — Docker images built for all 3 services (`frontend`, `weather-service`, `aqi-service`)
2. **Push** — Images tagged with commit SHA + `latest`, pushed to Docker Hub
3. **Authenticate** — GitHub Actions obtains temporary AWS credentials via OIDC federation (no long-lived access keys stored anywhere)
4. **Deploy** — `helm upgrade --install` applies the release to the EKS cluster
5. **Verify** — `kubectl rollout status` gates the pipeline on the new pods actually coming up healthy, rather than trusting a successful `helm upgrade` alone

### Secure, Credential-less AWS Access

Instead of storing static `AWS_ACCESS_KEY_ID` / `AWS_SECRET_ACCESS_KEY` secrets, the pipeline uses GitHub's OIDC identity provider:

```yaml
permissions:
  id-token: write   # allows GitHub to generate a short-lived OIDC token
  contents: read

- name: Configure AWS credentials via OIDC
  uses: aws-actions/configure-aws-credentials@v4
  with:
    role-to-assume: ${{ secrets.AWS_ROLE_ARN }}
    aws-region: ${{ secrets.AWS_REGION }}
```

AWS verifies the token against a trust policy scoped to this exact repo and branch, then issues temporary credentials that expire automatically after the job completes.

### Two-Layer Authorization Model

| Layer | Mechanism | Answers |
|---|---|---|
| AWS IAM | OIDC → `AssumeRoleWithWebIdentity` | "Is this caller allowed to use AWS APIs?" |
| Kubernetes RBAC | `aws-auth` ConfigMap mapping | "Is this caller allowed to manage cluster resources?" |

Both layers are kept in sync — an IAM role being valid in AWS does not automatically grant Kubernetes API access; it must be explicitly mapped in `aws-auth` under the exact same role ARN.

---

## 📦 Deployment

Deployment is managed entirely through Helm, with environment-specific values layered on top of a shared chart:

```bash
helm upgrade --install weather-dashboard ./helm/weather-aqi-dashboard \
  --namespace default \
  --create-namespace \
  -f ./helm/weather-aqi-dashboard/deployment.values.yaml \
  -f ./helm/weather-aqi-dashboard/env.values.yaml \
  --set frontend.image.tag=<commit-sha> \
  --set weatherService.image.tag=<commit-sha> \
  --set aqiService.image.tag=<commit-sha>
```

---

## 📁 Project Structure

```
.
├── frontend/                    # React frontend service
├── services/
│   ├── weather-service/          # Weather data microservice
│   └── aqi-service/               # AQI data microservice
├── helm/
│   └── weather-aqi-dashboard/    # Helm chart for EKS deployment
│       ├── Chart.yaml
│       ├── deployment.values.yaml
│       ├── env.values.yaml
│       └── templates/
└── .github/workflows/            # CI/CD pipeline (build, push, deploy)
```

---

## 🎯 Key Engineering Highlights

- ✅ Zero long-lived cloud credentials anywhere in the pipeline (OIDC-based auth)
- ✅ Clear separation of L4 (NLB) and L7 (NGINX Ingress) routing responsibilities
- ✅ Public/private subnet isolation for defense-in-depth network security
- ✅ Explicit dual-layer authorization (IAM + Kubernetes RBAC)
- ✅ Fully templated, versioned deployments via Helm — no manual `kubectl apply`
- ✅ Immutable, commit-SHA-tagged Docker images for traceable rollbacks
- ✅ Cluster infrastructure reproducible via a single `eksctl` command

---

## 🔮 Possible Future Improvements

- Migrate image registry from Docker Hub to **Amazon ECR** — native IAM integration, private by default, no public rate limits, same account/region as the cluster
- Migrate from the in-tree Cloud Controller Manager to the **AWS Load Balancer Controller**, for IP-mode target groups and ALB support
- Add **IRSA** (IAM Roles for Service Accounts) for pod-level AWS access, if services need direct AWS API calls
- Introduce **ArgoCD** for GitOps-based continuous delivery instead of the current push-based deploy
- Add **HPA** (Horizontal Pod Autoscaler) and Cluster Autoscaler / Karpenter for traffic-based scaling
- Provision infrastructure via **Terraform** instead of a manually run `eksctl` command
- Add **cert-manager** for automatic TLS at the Ingress layer
- Scope the GitHub Actions role's Kubernetes RBAC binding down from `system:masters` to a least-privilege custom role

---

## 📄 License

This project is open source and available for reference/educational purposes.
