const path = require("path");
const fs = require("fs");
const configSynchPath = path.join(__dirname, "./synch-config.json");

const pathRollupSynch = path.join(__dirname, "./rollup-operator/src/server/tmp-0");
const pathRollupTree = path.join(__dirname, "./rollup-operator/src/server/tmp-1");
const pathRollupPoSSynch = path.join(__dirname, "./rollup-operator/src/server/tmp-2");

const configSynch = JSON.parse(fs.readFileSync(configSynchPath, "utf-8"));

configSynch.rollup.synchDb = pathRollupSynch;
configSynch.rollup.treeDb = pathRollupTree;
configSynch.rollupPoS.synchDb = pathRollupPoSSynch;

fs.writeFileSync(configSynchPath, JSON.stringify(configSynch));