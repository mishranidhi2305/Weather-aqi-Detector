🌦️ Weather & AQI Detector
A 3-tier microservices application that displays real-time weather and Air Quality Index (AQI) data — built primarily as a showcase for end-to-end DevOps and cloud infrastructure engineering, covering containerization, Kubernetes orchestration, secure CI/CD, and production-style AWS networking.
> **Note:** This README focuses on the deployment architecture and DevOps pipeline. See inline code comments for application-level logic.
---
🏗️ Architecture Overview
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
        │ Frontend │  │   API    │  │   AQI    │
        │  Service │  │ Gateway  │  │ Service  │
        └──────────┘  └──────────┘  └──────────┘
                                          │
                    EKS Worker Nodes (Private Subnet)
```
Network design: Worker nodes and pods run in private subnets with no direct internet exposure. Only the NLB sits in the public subnet, acting as the sole internet-facing entry point — a standard AWS security pattern that minimizes attack surface.
---
🔧 Tech Stack
Layer	Technology
Frontend	React
Backend	Node.js (API Gateway + AQI Service, microservices)
Containerization	Docker
Image Registry	Docker Hub
Orchestration	Kubernetes (Amazon EKS)
Package Management	Helm
Ingress / L7 Routing	NGINX Ingress Controller
Load Balancing	AWS Network Load Balancer (in-tree AWS Cloud Controller Manager)
CI/CD	GitHub Actions
Cloud Auth	OpenID Connect (OIDC) — no static AWS credentials
Cluster Auth	IAM ↔ Kubernetes RBAC (`aws-auth` ConfigMap)
---
☸️ Kubernetes & Networking Details
Load Balancer Provisioning
The NLB is provisioned using the in-tree AWS Cloud Controller Manager via standard Kubernetes Service annotations:
```yaml
service.beta.kubernetes.io/aws-load-balancer-type: "nlb"
service.beta.kubernetes.io/aws-load-balancer-backend-protocol: "tcp"
service.beta.kubernetes.io/aws-load-balancer-cross-zone-load-balancing-enabled: "true"
```
The NLB is configured as internet-facing, sitting at Layer 4 and forwarding TCP traffic directly to a NodePort Service exposed on each worker node.
Traffic Path
```
NLB (L4, internet-facing) → NodePort Service → kube-proxy → NGINX Ingress Controller Pod → Backend Service → Pod
```
The NGINX Ingress Controller handles all Layer 7 concerns — host-based and path-based routing across the frontend, API gateway, and AQI service — decoupling routing logic from the load balancer itself.
Subnet Isolation
Public subnets: NLB only
Private subnets: EKS worker nodes, all application pods
This ensures compute workloads are never directly reachable from the internet — all traffic must pass through the load balancer and ingress layer.
---
🚀 CI/CD Pipeline
Fully automated build-push-deploy pipeline triggered on every push to `main`:
Build — Docker images built for all 3 services (`frontend`, `api-gateway`, `aqi-service`)
Push — Images tagged with commit SHA + `latest`, pushed to Docker Hub
Authenticate — GitHub Actions obtains temporary AWS credentials via OIDC federation (no long-lived access keys stored anywhere)
Deploy — `helm upgrade --install` applies the release to the EKS cluster
Secure, Credential-less AWS Access
Instead of storing static `AWS_ACCESS_KEY_ID` / `AWS_SECRET_ACCESS_KEY` secrets, the pipeline uses GitHub's OIDC identity provider:
```yaml
permissions:
  id-token: write   # allows GitHub to generate a short-lived OIDC token
  contents: read

- name: Configure AWS credentials via OIDC
  uses: aws-actions/configure-aws-credentials@v4
  with:
    role-to-assume: arn:aws:iam::<account-id>:role/github-actions-eks-deploy-role
    aws-region: ${{ secrets.AWS_REGION }}
```
AWS verifies the token against a trust policy scoped to this exact repo and branch, then issues temporary credentials that expire automatically after the job completes.
Two-Layer Authorization Model
Layer	Mechanism	Answers
AWS IAM	OIDC → `AssumeRoleWithWebIdentity`	"Is this caller allowed to use AWS APIs?"
Kubernetes RBAC	`aws-auth` ConfigMap mapping	"Is this caller allowed to manage cluster resources?"
Both layers are kept in sync — an IAM role being valid in AWS does not automatically grant Kubernetes API access; it must be explicitly mapped in `aws-auth`.
---
📦 Deployment
Deployment is managed entirely through Helm, with environment-specific values layered on top of a shared base:
```bash
helm upgrade --install aqi-app ./helm-aqi \
  --namespace <namespace> \
  --create-namespace \
  -f ./helm-aqi/values-deployment.yaml \
  -f ./helm-aqi/values-env.yaml \
  --set services.frontend.image.tag=<commit-sha> \
  --set services.apiGateway.image.tag=<commit-sha> \
  --set services.aqiService.image.tag=<commit-sha>
```
---
📁 Project Structure
```
.
├── frontend/                    # React frontend service
├── services/
│   ├── api-gateway/              # API Gateway microservice
│   └── aqi-service/               # AQI data microservice
├── helm-aqi/                    # Helm chart for EKS deployment
│   ├── values-deployment.yaml
│   └── values-env.yaml
└── .github/workflows/           # CI/CD pipeline (build, push, deploy)
```
---
🎯 Key Engineering Highlights
✅ Zero long-lived cloud credentials anywhere in the pipeline (OIDC-based auth)
✅ Clear separation of L4 (NLB) and L7 (NGINX Ingress) routing responsibilities
✅ Public/private subnet isolation for defense-in-depth network security
✅ Explicit dual-layer authorization (IAM + Kubernetes RBAC)
✅ Fully templated, versioned deployments via Helm — no manual `kubectl apply`
✅ Immutable, commit-SHA-tagged Docker images for traceable rollbacks
---
🔮 Possible Future Improvements
Migrate from in-tree Cloud Controller Manager to AWS Load Balancer Controller for IP-mode target groups and ALB support
Add IRSA for pod-level AWS access (if services need direct AWS API calls)
Introduce ArgoCD for GitOps-based continuous delivery
Add HPA (Horizontal Pod Autoscaler) for traffic-based scaling
---
📄 License
This project is open source and available for reference/educational purposes.
