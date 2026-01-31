pipeline {
    agent {
        docker {
            image 'node:22-bullseye' 
            args '-v /var/run/docker.sock:/var/run/docker.sock'
        }
    }

    environment {
        REGISTRY = "docker-registry.saas.cd"
        IMAGE    = "chai-request"
        TAG      = "1.0.0"
    }

    stages {

        // stage('Install Docker CLI') {
        //     steps {
        //         sh '''
        //           apt-get update
        //           apt-get install -y docker.io
        //         '''
        //     }
        // }

        // stage('Install Dependencies') {
        //     steps {
        //         sh '''
        //           npm install 
        //         '''
        //     }
        // }

        // stage('Build Next.js') {
        //     steps {
        //         sh 'npm run build'
        //     }
        // }

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
                withCredentials([usernamePassword(
                    credentialsId: 'registry_user',
                    usernameVariable: 'REG_USER',
                    passwordVariable: 'REG_PASS'
                )]) {
                    sh """
                    echo "$REG_PASS" | docker login $REGISTRY -u "$REG_USER" --password-stdin
                    docker push $REGISTRY/$IMAGE:$TAG
                    docker push $REGISTRY/$IMAGE:latest
                    docker logout $REGISTRY
                    """
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
