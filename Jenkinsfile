pipeline {
    agent {
        docker {
            image 'node:22-alpine' 
        }
    }

    environment {
        REGISTRY = "docker-registry.saas.cd"
        IMAGE    = "chai-gestion-conge"
        TAG      = "1.0.0"
    }

    stages {

        stage('Install Dependencies') {
            steps {
                sh '''
                  npm install 
                '''
            }
        }

        stage('Build Next.js') {
            steps {
                sh 'npm run build'
            }
        }

    }

    post {
        always {
            echo "docker system prune -f || true"
        }
        success {
            echo "✅ Build & push réussis : ${REGISTRY}/${IMAGE}:${TAG}"
        }
        failure {
            echo "❌ Build échoué"
        }
    }
}
