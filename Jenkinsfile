pipeline {
    agent any

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

        // stage('Deploy via Dokploy') {
        //     steps {
        //         sshagent(['dokploy-ssh']) {
        //             sh """
        //             ssh deploy@dokploy-server "
        //               docker pull $REGISTRY/$IMAGE:latest &&
        //               docker stop nextjs-project || true &&
        //               docker rm nextjs-project || true &&
        //               docker run -d --name nextjs-project -p 3000:3000 $REGISTRY/$IMAGE:latest
        //             "
        //             """
        //         }
        //     }
        // }
    }

    // post {
    //     always {
    //         sh 'docker logout $REGISTRY'
    //     }
    // }
}
