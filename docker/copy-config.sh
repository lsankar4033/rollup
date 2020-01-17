#!/bin/bash

mkdir -p docker-webapp/config-webapp
mkdir -p run-operator/config-operator
mkdir -p docker-cli-pos/config-cli-pos
cp -R docker-deploy/config-deploy/*.json docker-webapp/config-webapp
cp -R docker-deploy/config-deploy/*.json run-operator/config-operator
cp -R docker-deploy/config-deploy/*.json docker-cli-pos/config-cli-pos