// ==============================================================================
// Jenkinsfile - PaperlessFamily Production CI/CD Pipeline
// ==============================================================================

pipeline {
    agent any

    tools {
        maven 'Maven-3.9'
        jdk 'JDK-17'
    }

    environment {
        DOCKER_HUB = credentials('dockerhub-credentials')
        GEMINI_KEY = credentials('gemini-api-key')
        JWT_SECRET_VAL = credentials('jwt-secret')
        DB_PASSWORD = credentials('database-password')
        DOCKER_USERNAME = "${DOCKER_HUB_USR}"
        BACKEND_IMAGE = "${DOCKER_HUB_USR}/paperlessfamily-backend"
        FRONTEND_IMAGE = "${DOCKER_HUB_USR}/paperlessfamily-frontend"
        BUILD_TAG = "${BUILD_NUMBER}"
    }

    stages {
        stage('Checkout') {
            // Clone the repository from GitHub
            steps {
                checkout scm
            }
        }

        stage('Backend - Maven Build') {
            // Compile the Spring Boot backend using Maven
            steps {
                dir('backend') {
                    sh 'mvn clean compile -q'
                }
            }
        }

        stage('Backend - Unit Tests') {
            // Run JUnit tests and generate test reports
            steps {
                dir('backend') {
                    sh 'mvn test'
                }
            }
            post {
                always {
                    junit 'backend/target/surefire-reports/*.xml'
                }
            }
        }

        stage('Backend - Package') {
            // Package the application as an executable JAR
            steps {
                dir('backend') {
                    sh 'mvn package -DskipTests -q'
                }
            }
        }

        stage('Frontend - Install & Build') {
            // Install npm dependencies and build the React app
            steps {
                dir('frontend') {
                    sh 'npm ci'
                    sh 'npm run build'
                }
            }
        }

        stage('Docker Build') {
            // Build Docker images for backend and frontend in parallel
            parallel {
                stage('Build Backend Image') {
                    steps {
                        sh "docker build -t ${BACKEND_IMAGE}:${BUILD_TAG} -t ${BACKEND_IMAGE}:latest ./backend"
                    }
                }
                stage('Build Frontend Image') {
                    steps {
                        sh "docker build -t ${FRONTEND_IMAGE}:${BUILD_TAG} -t ${FRONTEND_IMAGE}:latest ./frontend"
                    }
                }
            }
        }

        stage('Docker Push') {
            // Authenticate and push images to Docker Hub
            steps {
                sh "echo ${DOCKER_HUB_PSW} | docker login -u ${DOCKER_HUB_USR} --password-stdin"
                sh "docker push ${BACKEND_IMAGE}:${BUILD_TAG}"
                sh "docker push ${BACKEND_IMAGE}:latest"
                sh "docker push ${FRONTEND_IMAGE}:${BUILD_TAG}"
                sh "docker push ${FRONTEND_IMAGE}:latest"
            }
        }

        stage('Kubernetes Deploy') {
            // Deploy manifests to Kubernetes cluster in sequence
            steps {
                sh 'kubectl apply -f k8s/namespace.yaml'
                sh 'kubectl apply -f k8s/configmap.yaml'
                sh 'kubectl apply -f k8s/secret.yaml'
                sh 'kubectl apply -f k8s/postgres-pvc.yaml'
                sh 'kubectl apply -f k8s/postgres-deployment.yaml'
                sh 'kubectl apply -f k8s/postgres-service.yaml'
                sh 'kubectl apply -f k8s/backend-deployment.yaml'
                sh 'kubectl apply -f k8s/backend-service.yaml'
                sh 'kubectl apply -f k8s/frontend-deployment.yaml'
                sh 'kubectl apply -f k8s/frontend-service.yaml'
            }
        }

        stage('Deployment Verification') {
            // Verify all pods are running and deployments are successful
            steps {
                sh 'kubectl get pods -n paperlessfamily'
                sh 'kubectl rollout status deployment/paperlessfamily-backend -n paperlessfamily --timeout=120s'
                sh 'kubectl rollout status deployment/paperlessfamily-frontend -n paperlessfamily --timeout=120s'
                sh 'kubectl get services -n paperlessfamily'
            }
        }
    }

    post {
        success {
            echo 'PaperlessFamily CI/CD Pipeline completed successfully!'
        }
        failure {
            echo 'Pipeline failed. Check logs for details.'
        }
        always {
            cleanWs()
        }
    }
}
