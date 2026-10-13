# PaperlessFamily

> *"Your Family. Your Documents. One Secure Home."*

![Java](https://img.shields.io/badge/Java-17-ED8B00?style=for-the-badge&logo=openjdk&logoColor=white)
![Spring Boot](https://img.shields.io/badge/Spring_Boot-3.2-6DB33F?style=for-the-badge&logo=spring-boot&logoColor=white)
![React](https://img.shields.io/badge/React-18-61DAFB?style=for-the-badge&logo=react&logoColor=black)
![TypeScript](https://img.shields.io/badge/TypeScript-5.0-3178C6?style=for-the-badge&logo=typescript&logoColor=white)
![PostgreSQL](https://img.shields.io/badge/PostgreSQL-16-4169E1?style=for-the-badge&logo=postgresql&logoColor=white)
![Docker](https://img.shields.io/badge/Docker-Enabled-2496ED?style=for-the-badge&logo=docker&logoColor=white)
![Kubernetes](https://img.shields.io/badge/Kubernetes-Ready-326CE5?style=for-the-badge&logo=kubernetes&logoColor=white)
![License](https://img.shields.io/badge/License-MIT-green?style=for-the-badge)

---

## Overview

**PaperlessFamily** is an enterprise-grade digital family document management platform engineered to provide a single, encrypted, and intelligently organized digital hub for households. From health records and property deeds to passports, tax filings, and insurance policies, PaperlessFamily guarantees zero lost files, automated expiration tracking, role-based family access, and contextual AI assistance.

---

## Features

-  **Family Space Management**: Organize documents by individual family members or unified household spaces.
- **Digital Document Management (15+ categories)**: Pre-classified categories including Identity, Medical, Insurance, Property, Taxes, Education, Automobile, and Finance.
-  **AI-Powered Document Assistant (FamilyAI)**: Context-aware query answering powered by Google Gemini API for policy limits, expiry analysis, and summary generation.
-  **Document Expiry Tracking & Alerts**: Automated triggers and dashboard counters for impending expirations (30, 60, and 90 days out).
-  **Smart Search & Filtering**: Multi-dimensional filtering across tags, document owners, upload dates, expiration status, and full text.
-  **Secure JWT Authentication**: Role-based access control, cryptographic token generation, and BCrypt password encryption.
-  **Responsive Design**: Designed with modern mobile-first principles using Tailwind CSS and Framer Motion transitions.
-  **Real-time Notifications**: Immediate alerts for upload events, member additions, and urgent expiration thresholds.

---

##  Architecture

```
                                      +-------------------------+
                                      |   Client Web Browser    |
                                      +------------+------------+
                                                   |
                                            HTTP / HTTPS (Port 80/443)
                                                   |
                                                   v
+---------------------------------------------------------------------------------------------------+
| Kubernetes Cluster / Docker Network: paperlessfamily-network                                      |
|                                                                                                   |
|    +-----------------------------+           Reverse Proxy / API           +--------------------+ |
|    |      Frontend Service       | --------------------------------------> |   Backend Service  | |
|    |      (Nginx + React SPA)    |                                         |   (Spring Boot)    | |
|    +-----------------------------+                                         +---------+----------+ |
|                                                                                      |            |
|                                                                   JPA / Hibernate    |            |
|                                                                                      v            |
|                                                                            +--------------------+ |
|                                                                            |  PostgreSQL 16 DB  | |
|                                                                            |  (Stateful Storage)| |
|                                                                            +--------------------+ |
+--------------------------------------------------------------------------------------|------------+
                                                                                       |
                                                                                HTTPS  | REST API
                                                                                       v
                                                                             +--------------------+
                                                                             | Google Gemini API  |
                                                                             | (FamilyAI Engine)  |
                                                                             +--------------------+
```

---

##  Tech Stack

### Frontend
- **Framework**: React 18 with TypeScript
- **Bundler & Tooling**: Vite 5
- **Styling**: Tailwind CSS
- **Component Utilities**: Lucide React Icons
- **Animations**: Framer Motion
- **HTTP Client**: Axios

### Backend
- **Platform**: Java 17 (Eclipse Temurin)
- **Framework**: Spring Boot 3.2
- **Security**: Spring Security 6 with stateless JWT authentication
- **Persistence**: Spring Data JPA / Hibernate
- **PDF Processing**: Apache PDFBox
- **Build System**: Apache Maven 3.9

### Database
- **Engine**: PostgreSQL 16
- **Driver**: PostgreSQL JDBC

### AI Integration
- **Engine**: Google Gemini AI REST API / SDK

### DevOps & Infrastructure
- **Containerization**: Docker (Multi-stage build pipelines)
- **Orchestration**: Kubernetes manifests (Namespace, Deployment, Service, PVC, ConfigMap, Secret)
- **Continuous Integration/Continuous Deployment**: Jenkins Declarative Pipeline
- **Reverse Proxy & Web Server**: Nginx Alpine

---

##  Project Structure

```
PaperlessFamily/
├── .env.example                          # Environment variables template
├── .gitignore                            # Standard git ignores for Java, Node, Docker
├── docker-compose.yml                    # Multi-container local orchestration
├── Jenkinsfile                           # 9-stage Jenkins declarative CI/CD pipeline
├── README.md                             # Comprehensive project documentation
├── backend/                              # Spring Boot 3.2 Java application
│   ├── Dockerfile                        # Multi-stage Maven build & JRE 17 runtime
│   ├── pom.xml                           # Maven project dependencies
│   └── src/
│       ├── main/
│       │   ├── java/com/paperlessfamily/
│       │   └── resources/
│       │       └── application.yml
│       └── test/
├── frontend/                             # React 18 + Vite TypeScript application
│   ├── Dockerfile                        # Multi-stage Node.js build & Nginx runtime
│   ├── nginx.conf                        # Custom SPA reverse proxy & security headers
│   ├── package.json                      # NPM dependencies & scripts
│   ├── vite.config.ts                    # Vite build configuration
│   └── src/
└── k8s/                                  # Kubernetes production manifests
    ├── namespace.yaml                    # Dedicated 'paperlessfamily' namespace
    ├── configmap.yaml                    # Non-sensitive runtime application configurations
    ├── secret.yaml                       # Secrets (DB passwords, JWT keys, Gemini API)
    ├── postgres-pvc.yaml                 # 5Gi PersistentVolumeClaim for PostgreSQL
    ├── postgres-deployment.yaml          # PostgreSQL 16 Deployment with health probes
    ├── postgres-service.yaml             # ClusterIP service for PostgreSQL
    ├── backend-deployment.yaml           # Replicated backend pods with probes & volumes
    ├── backend-service.yaml              # ClusterIP service for backend (port 8080)
    ├── frontend-deployment.yaml          # Replicated Nginx frontend pods
    └── frontend-service.yaml             # NodePort service exposing the application
```

---

##  Getting Started

### Prerequisites
- **Java**: OpenJDK / Eclipse Temurin 17 or higher
- **Node.js**: v18.0.0+ and npm 9+
- **PostgreSQL**: PostgreSQL 16 instance
- **Maven**: Version 3.9+
- **Docker & Docker Compose**: Optional for containerized deployment
- **Minikube / Kubectl**: Optional for Kubernetes cluster deployment

### Database Setup
Start your local PostgreSQL service and create the database:

```bash
psql -U postgres
CREATE DATABASE paperlessfamily;
\q
```

### Backend Setup
Configure your database credentials in backend properties or environment variables, then run:

```bash
cd backend
mvn clean install
mvn spring-boot:run
```
The backend API initializes and runs at `http://localhost:8080`.

### Frontend Setup
Install frontend dependencies and start Vite dev server:

```bash
cd frontend
npm install
npm run dev
```
The frontend UI will be available at `http://localhost:5173`.

### Environment Variables
Copy `.env.example` to `.env` in the root and customize:

| Variable | Description | Example / Default |
| :--- | :--- | :--- |
| `DATABASE_URL` | PostgreSQL JDBC connection URL | `jdbc:postgresql://localhost:5432/paperlessfamily` |
| `DATABASE_USERNAME` | Database username | `postgres` |
| `DATABASE_PASSWORD` | Database user password | `postgres` |
| `JWT_SECRET` | Secret key used to sign and verify JWTs | *256-bit cryptographic random string* |
| `GEMINI_API_KEY` | Google Gemini API key for FamilyAI | `AIzaSy...` |
| `DOCKER_USERNAME` | Registry username for image tagging | `paperlessdev` |
| `VITE_API_URL` | API prefix for frontend requests | `http://localhost:8080/api` |
| `UPLOAD_DIR` | Local disk mount point for document storage | `./uploads` |

---

##  Docker Setup

Run the full stack (PostgreSQL, Spring Boot backend, and React frontend) in a single command using Docker Compose:

```bash
docker-compose up --build
```

Access the services:
- **Frontend SPA**: [http://localhost:3000](http://localhost:3000)
- **Backend API**: [http://localhost:8080](http://localhost:8080)
- **PostgreSQL Database**: `localhost:5432`

To shut down and persist storage:
```bash
docker-compose down
```

---

##  Jenkins CI/CD Pipeline

The Jenkinsfile contains an end-to-end declarative pipeline running automated builds, tests, containerization, image publishing, and rolling Kubernetes deployments:

```
+------------+     +-------------------+     +------------------+     +------------------+
|  Checkout  | --> | Backend Compile   | --> | JUnit Unit Tests | --> | Backend Package  |
+------------+     +-------------------+     +------------------+     +------------------+
                                                                               |
+---------------------+     +-----------------------+     +--------------------+
| Frontend Build (npm)| <-- | Parallel Docker Build | <-- | Docker Hub Push    |
+---------------------+     +-----------------------+     +--------------------+
                                       |
                                       v
                            +-----------------------+     +-----------------------+
                            |   Kubernetes Deploy   | --> | Rollout Verification  |
                            +-----------------------+     +-----------------------+
```

### Required Jenkins Credentials:
Configure these in **Jenkins > Manage Jenkins > Credentials**:
- `dockerhub-credentials`: Username and Password for Docker Hub
- `gemini-api-key`: Secret text containing Google Gemini API key
- `jwt-secret`: Secret text for signing production tokens
- `database-password`: Secret text for database root password

### Pipeline Stages:
1. **Checkout**: Pulls latest repository commit via SCM.
2. **Backend - Maven Build**: Validates compilation with `mvn clean compile`.
3. **Backend - Unit Tests**: Executes unit test suite and archives Surefire test reports.
4. **Backend - Package**: Bundles the application JAR.
5. **Frontend - Install & Build**: Performs clean npm install and outputs Vite production build.
6. **Docker Build**: Builds both backend and frontend images in parallel using Git build tag.
7. **Docker Push**: Authenticates and publishes images to Docker Hub registry.
8. **Kubernetes Deploy**: Applies manifests to `paperlessfamily` namespace.
9. **Deployment Verification**: Asserts rollout status and pod readiness with timeouts.

---

##  Kubernetes Deployment

Deploy the system to a local Minikube cluster or managed cloud Kubernetes (EKS, GKE, AKS):

```bash
# Start Minikube (if running locally)
minikube start

# Create namespace, configs, secrets, volumes, and workloads
kubectl apply -f k8s/

# Verify running pods
kubectl get pods -n paperlessfamily

# Verify services
kubectl get services -n paperlessfamily

# Access frontend via Minikube NodePort
minikube service paperlessfamily-frontend -n paperlessfamily
```

---

##  Testing

Execute backend test suites including JPA repository tests, controller integrations, and security filter tests:

```bash
cd backend
mvn clean test
```

Surefire XML reports are output to `backend/target/surefire-reports/`.

---

##  Security Architecture

- **Stateless JWT Tokens**: Cryptographically signed HMAC-SHA256 tokens with configurable expiration.
- **BCrypt Password Hashing**: Passwords salted and hashed with computational work factor 10.
- **CORS Protection**: Explicit cross-origin policy restricted to trusted frontend origins.
- **Role & Family Isolation**: Tenant isolation ensuring family documents cannot be queried across unauthorized households.
- **Strict File Type Validation**: Content validation supporting approved document formats (`application/pdf`, `image/jpeg`, `image/png`).
- **Least-Privilege Execution**: Non-root system users (`appuser`) configured in production container runtimes.

---

##  API Endpoints

| Method | Endpoint | Description | Auth Required |
| :--- | :--- | :--- | :--- |
| `POST` | `/api/auth/register` | Register new user and family space | No |
| `POST` | `/api/auth/login` | Authenticate user and receive JWT | No |
| `GET` | `/api/auth/me` | Fetch currently authenticated user context | Yes |
| `GET` | `/api/health` | Container orchestration health check | No |
| `GET` | `/api/family` | Get family space metadata and member roster | Yes |
| `POST` | `/api/family/members` | Invite or register new family member | Yes |
| `GET` | `/api/documents` | List family documents with optional filters | Yes |
| `POST` | `/api/documents/upload` | Multipart file upload with metadata & tagging | Yes |
| `GET` | `/api/documents/{id}` | Retrieve document details and preview URL | Yes |
| `GET` | `/api/documents/{id}/download` | Stream encrypted document file | Yes |
| `DELETE`| `/api/documents/{id}` | Soft/hard delete family document | Yes |
| `GET` | `/api/documents/expiring` | Query documents expiring in next 30/60/90 days | Yes |
| `POST` | `/api/ai/chat` | Send conversational query to FamilyAI assistant | Yes |

---

##  Demo Account

The pre-seeded database contains a ready-to-test demonstration family account:

- **Email**: `demo@paperlessfamily.com`
- **Password**: `Demo@123`
- **Family Space**: Sharma Family (4 members: Rahul, Priya, Aarav, Ananya)
- **Pre-loaded Data**: 12 documents across Medical, Insurance, Passport, Property, and Tax categories with active expiry warnings.

---

##  AI Assistant Examples (FamilyAI)

**Prompt**:
> *"When does Aarav's passport expire, and what are the renewal requirements?"*

**Response**:
> *"Aarav's passport (No: Z1234567) expires on November 14, 2026 (in 32 days). You should submit Form DS-11 along with his original birth certificate and previous passport for minor renewal."*

---

**Prompt**:
> *"Summarize our family health insurance policy coverage and co-pay limits."*

**Response**:
> *"Under the Star Health Family Health Optima policy (Document ID: #DOC-1092), the total family floater sum insured is $50,000 with a $25 emergency room co-pay and 100% in-network hospitalization coverage."*

---

##  Screenshots

*(Visual demonstration of Dashboard, Document Vault, AI Assistant, and Expiry Tracker)*

```
+-------------------------------------------------------------------------------+
|   PaperlessFamily                     [Search Documents...]   [Profile] |
+-------------------------------------------------------------------------------+
|  [Summary]                  [Recent Documents]          [Expiry Alerts]       |
|  Total Documents: 42        • Health_Insurance.pdf       Car_Insurance.pdf  |
|  Family Members: 4          • Tax_Return_2025.pdf          (Expires in 12 days|
|  Expiring Soon: 3           • House_Deed_Scan.pdf        Visa_Rahul.pdf     |
+-------------------------------------------------------------------------------+
|  FamilyAI: "How can I help you find or understand your family documents?"     |
+-------------------------------------------------------------------------------+
```

---

##  Future Enhancements

-  **Cloud Object Store**: Native adapters for AWS S3, Google Cloud Storage, and Azure Blob.
-  **Automated OCR Scanning**: Tesseract / Google Cloud Vision OCR for instant text extraction from scanned receipts.
-  **Secure Document Sharing Links**: Expiring, password-protected download URLs for third parties (banks, accountants).
-  **Mobile Native Client**: React Native application with document camera scanner.
-  **Omnichannel Alerts**: Email and WhatsApp webhook notifications for expiry deadlines.
-  **Multi-Factor Authentication (MFA)**: TOTP / Authenticator app support.
-  **Version History & Audit Log**: Audit trail recording which family member viewed or updated files.
-  **Family Budget & Expense Tracker**: Auto-categorization of utility bills and expenses.

---

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.
