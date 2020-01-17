FROM node:10

RUN git clone https://github.com/iden3/rollup.git
RUN mkdir config-deploy
WORKDIR "./rollup"
RUN npm install
RUN npm install -g truffle
COPY ./config-deploy/* ./

CMD ["sh", "-c", "./create-config-env.sh && truffle compile && node config-deploy.js && cp synch-config.json ../config-deploy/ && cp pool-config.json ../config-deploy/ && cp wallet.json ../config-deploy/  "]