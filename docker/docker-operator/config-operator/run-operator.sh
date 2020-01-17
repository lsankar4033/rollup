
#!/bin/bash

node rollup-operator/src/server-proof.js &
sleep 5
node rollup-operator/src/server/operator.js