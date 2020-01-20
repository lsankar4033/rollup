FROM node:10

RUN git clone https://github.com/iden3/rollup.git
WORKDIR "./rollup"
RUN npm install 
COPY config-operator/* ./
RUN node build-config.js
RUN ./create-config-env.sh
RUN mv pool-config.json ./rollup-operator/src/server/
RUN mv synch-config.json ./rollup-operator/src/server/
RUN mv wallet.json ./rollup-operator/src/server/
RUN mv config.env ./rollup-operator/src/server/

EXPOSE 9000

CMD ["sh","-c","./run-operator.sh"]
