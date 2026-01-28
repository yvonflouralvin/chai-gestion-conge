pipeline {
    agent {
        docker {
            image 'node:22-alpine' // image contenant Node.js et npm
            args '-v /var/run/docker.sock:/var/run/docker.sock' // nécessaire pour build docker à l’intérieur
        }
    }

    environment {
        REGISTRY = "docker-registry.saas.cd"
        IMAGE = "chai-gestion-conge"
        TAG   = "${env.BUILD_NUMBER}"
    }

    stages {
        stage('Checkout') {
            steps {
                checkout scm
            }
        }

        stage('Install Dependencies') {
            steps {
                sh 'npm install'
            }
        }

        stage('Build Next.js') {
            steps {
                sh 'npm run build'
            }
        }

        stage('Build Docker Image') {
            steps {
                sh """
                docker build -t $REGISTRY/$IMAGE:$TAG .
                docker tag $REGISTRY/$IMAGE:$TAG $REGISTRY/$IMAGE:latest
                """
            }
        }

        stage('Push to Registry') {
            steps {
                withCredentials([usernamePassword(
                    credentialsId: 'registry-creds',
                    usernameVariable: 'REG_USER',
                    passwordVariable: 'REG_PASS'
                )]) {
                    sh """
                    echo $REG_PASS | docker login $REGISTRY -u $REG_USER --password-stdin
                    docker push $REGISTRY/$IMAGE:$TAG
                    docker push $REGISTRY/$IMAGE:latest
                    """
                }
            }
        }
    }
}
