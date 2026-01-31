pipeline {
    agent any

    environment {
        REGISTRY = "saasdrc.azurecr.io"
        IMAGE    = "chai-request"
        TAG      = "prod"
    }

    stages {

        stage('Build Docker Image') {
            steps {
                sh """
                docker build -t $REGISTRY/$IMAGE:$TAG .
                docker tag $REGISTRY/$IMAGE:$TAG $REGISTRY/$IMAGE:latest
                """
            }
        }

        stage('Push Docker Image') {
            steps {
                    sh """ 
                    docker push $REGISTRY/$IMAGE:$TAG
                    """
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
