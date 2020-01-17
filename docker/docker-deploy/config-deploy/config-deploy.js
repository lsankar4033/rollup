const poseidonUnit = require("./node_modules/circomlib/src/poseidon_gencontract.js");
const verifier = require("./build/contracts/VerifierHelper.json");
const rollup = require("./build/contracts/Rollup.json");
const rollupPos = require("./build/contracts/RollupPoS.json");

const ethers = require("ethers");
const Web3 = require("web3");

const fs = require("fs");
const path = require("path");
const configSynchPath = path.join(__dirname, "./synch-config.json");
const configPoolPath = path.join(__dirname, "./pool-config.json");
const walletPath = path.join(__dirname, "./wallet.json");

const pathRollupSynch = path.join(__dirname, "./rollup-operator/src/server/tmp-0");
const pathRollupTree = path.join(__dirname, "./rollup-operator/src/server/tmp-1");
const pathRollupPoSSynch = path.join(__dirname, "./rollup-operator/src/server/tmp-2");

const maxTx = 10;
const maxOnChainTx = 5;
let insPoseidonUnit;
let insVerifier;
let insRollup;
let insRollupPos;
let creationHashRollup;
let creationHashRollupPos;

async function createConfig(){
    const pathEnvironmentFile = path.join(__dirname, "../config.env");
    require("dotenv").config({ path: pathEnvironmentFile });
    
    const web3 = new Web3(process.env.URL);
    const account = ethers.Wallet.fromMnemonic(process.env.MNEMONIC, `m/44'/60'/0'/0/${process.env.INDEX_ACCOUNT}`);
    const encWallet = await account.encrypt(process.env.PASSWORD);
    const accountTokens = ethers.Wallet.fromMnemonic(process.env.MNEMONIC, `m/44'/60'/0'/0/${process.env.INDEX_ACCOUNT_TOKEN_FEES}`).address;
    const poseidonUnitContract = new web3.eth.Contract(poseidonUnit.abi);
    const verifierContract = new web3.eth.Contract(verifier.abi);
    const rollupContract = new web3.eth.Contract(rollup.abi);
    const rollupPosContract = new web3.eth.Contract(rollupPos.abi);

    insPoseidonUnit = await poseidonUnitContract.deploy({data: poseidonUnit.createCode()})
        .send({ gas: 2500000, from: account.address});
    insVerifier = await verifierContract.deploy({ data: verifier.bytecode })
        .send({ gas: 2500000, from: account.address});
    insRollup = await rollupContract.deploy({data: rollup.bytecode, arguments: [insVerifier._address, insPoseidonUnit._address, maxTx, maxOnChainTx, accountTokens] })
        .send({ gas: 4500000, from: account.address})
        .on("transactionHash", function(transactionHash){
            creationHashRollup = transactionHash;
            console.log(transactionHash)
        });
    insRollupPos = await rollupPosContract.deploy({data: rollupPos.bytecode, arguments: [insRollup._address, maxTx]})
        .send({ gas: 4500000, from: account.address})
        .on("transactionHash", function(transactionHash){
            creationHashRollupPos = transactionHash;
            console.log(transactionHash)
        });
    await rollupContract.methods.loadForgeBatchMechanism(insRollupPos._address);

    const configSynch = {
        rollup: {
            synchDb: pathRollupSynch,
            treeDb: pathRollupTree,
            address: insRollup._address,
            abi: rollup.abi,
            creationHash: creationHashRollup,
        },
        rollupPoS: {
            synchDb: pathRollupPoSSynch,
            address: insRollupPos._address,
            abi: rollupPos.abi,
            creationHash: creationHashRollupPos,
        },
        ethNodeUrl: process.env.URL,
        ethAddressCaller: account,
    }

    const configPool = {
        "maxSlots": 10,               
        "executableSlots": 1,      
        "nonExecutableSlots": 1,      
        "timeout": 1000            
    };

    fs.writeFileSync(configSynchPath, JSON.stringify(configSynch));
    fs.writeFileSync(configPoolPath, JSON.stringify(configPool));
    fs.writeFileSync(walletPath, JSON.stringify(JSON.parse(encWallet)));
}

createConfig();
