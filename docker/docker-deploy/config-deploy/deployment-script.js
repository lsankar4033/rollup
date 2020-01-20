const poseidonUnit = require("./node_modules/circomlib/src/poseidon_gencontract.js");
const verifier = require("./build/contracts/VerifierHelper.json");
const rollup = require("./build/contracts/Rollup.json");
const rollupPoS = require("./build/contracts/RollupPoS.json");

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

async function createConfig(){
    
    const pathEnvironmentFile = path.join(__dirname, "config.env");
    if (fs.existsSync(pathEnvironmentFile)) {
        require("dotenv").config({ path: pathEnvironmentFile });
    } 

    const web3 = new Web3(process.env.URL);
    const etherWallet = ethers.Wallet.fromMnemonic(process.env.MNEMONIC, `m/44'/60'/0'/0/${process.env.INDEX_ACCOUNT}`);
    const encWallet = await etherWallet.encrypt(process.env.PASSWORD);
    const addressFee = ethers.Wallet.fromMnemonic(process.env.MNEMONIC, `m/44'/60'/0'/0/${process.env.INDEX_ACCOUNT_TOKEN_FEES}`).address;
    const web3Wallet = web3.eth.accounts.privateKeyToAccount(etherWallet.privateKey);

    const rollupContract =  new web3.eth.Contract(rollup.abi);
    const rollupPoSContract =  new web3.eth.Contract(rollupPoS.abi);

    const PoseidonTx = {
        data: poseidonUnit.createCode(),
        from: web3Wallet.address,
        gasLimit: 2500000,
    };
    const signedPoseidon = await web3Wallet.signTransaction(PoseidonTx);
    const resPoseidon = await web3.eth.sendSignedTransaction(signedPoseidon.rawTransaction);

    const VerifierTx = {
        data: verifier.bytecode,
        from: web3Wallet.address,
        gasLimit: 2500000,
    };
    const signedVerifier = await web3Wallet.signTransaction(VerifierTx);
    const resVerifier = await web3.eth.sendSignedTransaction(signedVerifier.rawTransaction);

    const RollupTx = {
        data: rollupContract.deploy({
            data: rollup.bytecode,
            arguments: [resVerifier.contractAddress, resPoseidon.contractAddress, maxTx, maxOnChainTx, addressFee]
        }).encodeABI(),
        from: web3Wallet.address,
        gasLimit: 5000000,
    };
    const signedRollup = await web3Wallet.signTransaction(RollupTx);
    const resRollup = await web3.eth.sendSignedTransaction(signedRollup.rawTransaction);

    const RollupPoSTx = {
        data: rollupPoSContract.deploy({
            data: rollupPoS.bytecode,
            arguments: [resRollup.contractAddress, maxTx]
        }).encodeABI(),
        from: web3Wallet.address,
        gasLimit: 5000000,
    };
    const signedRollupPoS = await web3Wallet.signTransaction(RollupPoSTx);
    const resRollupPoS = await web3.eth.sendSignedTransaction(signedRollupPoS.rawTransaction);


    const addPoSTx = {
        from: web3Wallet.address,
        to: resRollup.contractAddress,
        gasLimit: 5000000,
        data: rollupContract.methods.loadForgeBatchMechanism(resRollupPoS.contractAddress).encodeABI(),
    };
    const signedAddPoSTx = await web3Wallet.signTransaction(addPoSTx);
    await web3.eth.sendSignedTransaction(signedAddPoSTx.rawTransaction);


    const addTokenTx = {
        from: web3Wallet.address,
        to: resRollup.contractAddress,
        gasLimit: 5000000,
        data: rollupContract.methods.addToken("0xaFF4481D10270F50f203E0763e2597776068CBc5").encodeABI(),
        value: web3.utils.toWei("0.02", "ether")
    };
    const signedAddTokenTx = await web3Wallet.signTransaction(addTokenTx);
    await web3.eth.sendSignedTransaction(signedAddTokenTx.rawTransaction);

    const configSynch = {
        rollup: {
            synchDb: pathRollupSynch,
            treeDb: pathRollupTree,
            address: resRollup.contractAddress,
            abi: rollup.abi,
            creationHash: resRollup.transactionHash,
        },
        rollupPoS: {
            synchDb: pathRollupPoSSynch,
            address: resRollupPoS.contractAddress,
            abi: rollupPoS.abi,
            creationHash: resRollupPoS.transactionHash,
        },
        ethNodeUrl: process.env.URL,
        ethAddress: etherWallet.address,
    };

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
