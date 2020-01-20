FROM node:10

RUN git clone https://github.com/iden3/rollup.git
RUN mkdir config-deploy
WORKDIR "./rollup"
RUN git checkout feature/dockers
RUN npm install
RUN npm install -g truffle
COPY ./config-deploy/* ./

CMD ["sh", "-c", "truffle compile && node deployment-script.js && cp synch-config.json ../config-deploy/ && cp pool-config.json ../config-deploy/ && cp wallet.json ../config-deploy/  "]