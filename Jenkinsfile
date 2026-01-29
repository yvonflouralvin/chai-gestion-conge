pipeline {
    agent {
        docker {
            image 'node:22-alpine'
            // args '''
            //   -v /var/run/docker.sock:/var/run/docker.sock
            //   -v /tmp/.npm:/tmp/.npm
            // '''
        }
    }

    options {
        timestamps()
        disableConcurrentBuilds()
        buildDiscarder(logRotator(numToKeepStr: '10'))
    }

    environment {
        REGISTRY = "docker-registry.saas.cd"
        IMAGE    = "chai-gestion-conge"
        TAG      = "${env.BUILD_NUMBER}"
        NODE_ENV = "production"
    }

    stages {

        stage('Checkout') {
            steps {
                checkout scm
            }
        }

        stage('Install Dependencies') {
            steps {
                sh '''
                  npm ci --cache /tmp/.npm --prefer-offline
                '''
            }
        }

        stage('Lint & Tests') {
            steps {
                sh '''
                  npm run lint || true
                  npm test || true
                '''
            }
        }

        stage('Build Next.js') {
            steps {
                sh '''
                  npm run build
                '''
            }
        }

        stage('Build Docker Image') {
            steps {
                sh '''
                  docker build \
                    --label app=${IMAGE} \
                    --label build=${BUILD_NUMBER} \
                    --label commit=$(git rev-parse --short HEAD) \
                    -t ${REGISTRY}/${IMAGE}:${TAG} \
                    -t ${REGISTRY}/${IMAGE}:latest \
                    .
                '''
            }
        }

        stage('Push to Registry') {
            steps {
                withCredentials([usernamePassword(
                    credentialsId: 'registry-creds',
                    usernameVariable: 'REG_USER',
                    passwordVariable: 'REG_PASS'
                )]) {
                    sh '''
                      echo "$REG_PASS" | docker login ${REGISTRY} \
                        -u "$REG_USER" --password-stdin

                      docker push ${REGISTRY}/${IMAGE}:${TAG}
                      docker push ${REGISTRY}/${IMAGE}:latest

                      docker logout ${REGISTRY}
                    '''
                }
            }
        }
    }

    post {
        always {
            sh 'docker system prune -f || true'
        }
        success {
            echo "✅ Build & push réussis : ${REGISTRY}/${IMAGE}:${TAG}"
        }
        failure {
            echo "❌ Build échoué"
        }
    }
}
