pipeline {
    agent {
        docker {
            image 'node:22-alpine' 
        }
    }

    stages {

        stage('Install Dependencies') {
            steps {
                sh '''
                  echo ""Installing dependencies..."" 
                '''
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
