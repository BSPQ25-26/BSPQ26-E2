pipeline {
    agent any

    tools {
        jdk 'jdk-21'
        maven 'maven-3'
    }

    options {
        timestamps()
        disableConcurrentBuilds()
    }

    environment {
        MAVEN_OPTS = '-Dmaven.repo.local=.m2/repository'
    }

    stages {
        stage('Checkout') {
            steps {
                checkout scm
            }
        }

        stage('Build and test') {
            steps {
                script {
                    if (isUnix()) {
                        sh 'mvn -B clean test'
                    } else {
                        bat 'mvn -B clean test'
                    }
                }
            }
        }

        stage('Generate Maven site') {
            steps {
                script {
                    if (isUnix()) {
                        sh 'mvn -B site'
                    } else {
                        bat 'mvn -B site'
                    }
                }
            }
        }

        stage('Generate Doxygen documentation') {
            steps {
                script {
                    if (isUnix()) {
                        sh 'chmod +x scripts/generate-doxygen.sh && ./scripts/generate-doxygen.sh'
                    } else {
                        powershell './scripts/generate-doxygen.ps1'
                    }
                }
            }
        }
    }

    post {
        always {
            junit allowEmptyResults: true, testResults: 'target/surefire-reports/*.xml'
            archiveArtifacts allowEmptyArchive: true, artifacts: 'target/site/**, target/doxygen/**, docs/doxygen/*.pdf, coverage/**'
        }
    }
}
