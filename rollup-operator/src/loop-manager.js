const Web3 = require("web3");
const winston = require("winston");
const chalk = require("chalk");
const { timeout, buildInputSm } = require("../src/utils"); 
const { stringifyBigInts } = require("snarkjs");
const { loadHashChain } = require("../../rollup-utils/rollup-utils");

const strState = [
    "Synchronizing",
    "Updating operators",
    "Checking winners",
    "Waiting to forge at block: ",
    "Building batch",
    "Getting proof",
    "Mining transaction"
];

const stateServer = {
    IDLE: 0,
    ERROR: 1,
    PENDING: 2,
    FINISHED: 3,
};

const state = {
    SYNCHRONIZING: 0,
    UPDATE_OPERATORS: 1,
    CHECK_WINNERS: 2,
    WAIT_FORGE: 3,
    BUILD_BATCH: 4,
    GET_PROOF: 5,
    MINING: 6,
};

const TIMEOUT_ERROR = 2000;
let TIMEOUT_NEXT_STATE = 5000;

class LoopManager{
    constructor(rollupSynch, posSynch, poolTx, opManager, cliServerProof, logLevel, nodeUrl) {
        this.nodeUrl = nodeUrl;
        this.web3 = new Web3(new Web3.providers.HttpProvider(this.nodeUrl));
        this.rollupSynch = rollupSynch;
        this.posSynch = posSynch;
        this.poolTx = poolTx;
        this.opManager = opManager;
        this.cliServerProof = cliServerProof;

        this.registerId = [];
        this.flagWaiting = false;
        this.state = state.SYNCHRONIZING;
        // Current hash chain
        this.hashChain = [];
        this.infoCurrentBatch = {};

        this.txHash = undefined;
        this._initLogger(logLevel);
    }

    _initLogger(logLevel) {
        // config winston
        var options = {
            console: {
                level: logLevel,
                format: winston.format.combine(
                    winston.format.colorize(),
                    winston.format.simple(),
                )
            },
        };

        this.logger = winston.createLogger({
            transports: [
                new winston.transports.Console(options.console)
            ]
        });
    }

    async _init(){
        this.slotDeadline = await this.posSynch.getSlotDeadline();
    }

    async startLoop(){
        await this._init();

        // eslint-disable-next-line no-constant-condition
        while(true) {
            let info = `${chalk.yellowBright("OPERATOR STATE: ")}${chalk.white(strState[this.state])}`;
            let currentBlock = 0;
            
            // Fill log information depending on the state
            switch(this.state) {

            case state.UPDATE_OPERATORS: 
                if (this.opManager.wallet.address){
                    info += " | public address: ";
                    info += `${chalk.white.bold(`${this.opManager.wallet.address}`)}`;
                }
                break;

            case state.CHECK_WINNERS: 
                info += " | operator identifiers found: ";
                info += `${chalk.white.bold(`${this.registerId}`)}`;
                break;

            case state.WAIT_FORGE:  
                currentBlock = await this.posSynch.getCurrentBlock();
                info += `${chalk.white.bold(`${this.infoCurrentBatch.fromBlock}`)} | `;
                info += `current block: ${chalk.white.bold(`${currentBlock}`)} | `;
                info += "operator identifier winner: ";
                info += `${chalk.white.bold(`${this.infoCurrentBatch.opId}`)}`;
                break;

            case state.BUILD_BATCH:
                info += " | Attempts to send: ";
                info += chalk.white.bold(this.infoCurrentBatch.retryTimes);
                break;

            case state.MINING:
                info += " | info ==> Transaction hash: ";
                info += chalk.white.bold(this.txHash);
                break;
            }

            this.logger.info(info);

            // Take action depending on the current state
            try {
                switch(this.state) {

                // check all is fully synched
                case state.SYNCHRONIZING:
                    await this._fullySynch();
                    break;

                // update operators
                // if operator has been loaded, check if it is registered
                case state.UPDATE_OPERATORS: 
                    await this._checkRegister();
                    break;
                
                // check if operator is the winner
                case state.CHECK_WINNERS: 
                    await this._checkWinner(currentBlock);
                    break;
                
                // wait until block to forge is achieved
                case state.WAIT_FORGE:  
                    await this._checkWaitForge();
                    break;

                // start build batch
                case state.BUILD_BATCH:   
                    await this._buildBatch();
                    break;

                // send proof
                case state.GET_PROOF:
                    await this._stateProof();
                    break;

                // wait to mining transaction
                case state.MINING:
                    break;
                }

                if (TIMEOUT_NEXT_STATE) await timeout(TIMEOUT_NEXT_STATE);

            } catch (e) {
                this.logger.error(`OPERATOR STATE Message error: ${e.message}`);
                this.logger.debug(`OPERATOR STATE Message error: ${e.stack}`);
                await timeout(TIMEOUT_ERROR);
            }}
    }

    // seed encoded as an string
    async loadSeedHashChain(seed){
        this.hashChain = loadHashChain(seed);
    }

    async register(stake, url) {
        const res = await this.opManager.register(this.hashChain[this.hashChain.length - 1], stake, url);
        return res.status;
    }
    
    async _getIndexHashChain(opId){
        const lastHash = await this.posSynch.getLastCommitedHash(opId);
        const index = this.hashChain.findIndex(hash => hash === lastHash);
        return index;
    }

    async _fullySynch() {
        TIMEOUT_NEXT_STATE = 5000;
        // check rollup is fully synched
        const rollupSynched = await this.rollupSynch.isSynched();
        // check PoS is fully synched
        const posSynched = await this.posSynch.isSynched();
        if (rollupSynched & posSynched) { // Both 100% synched
            TIMEOUT_NEXT_STATE = 1000;
            if (this.flagWaiting) this.state = state.BUILD_BATCH;
            else this.state = state.UPDATE_OPERATORS;
        }
    }

    async _checkRegister() {
        const listOpRegistered = await this.posSynch.getOperators();
        await this._purgeRegisterOperators(listOpRegistered);

        if (this.opManager.wallet != undefined) {
            const opAddress = this.opManager.wallet.address;
            for (const opInfo of Object.values(listOpRegistered)) {
                if (opInfo.controllerAddress == opAddress.toString()) {
                    const opId = Number(opInfo.operatorId);
                    if (!this.registerId.includes(opId))
                        this.registerId.push(Number(opInfo.operatorId));
                }
            }
        }
        if (this.registerId.length) {
            TIMEOUT_NEXT_STATE = 1000;
            this.state = state.CHECK_WINNERS;
        } else {
            TIMEOUT_NEXT_STATE = 5000;
            this.state = state.SYNCHRONIZING;
        }
    }

    async _purgeRegisterOperators(listOpRegistered) {
        // Delete active operators that are no longer registered
        for (const index in this.registerId) {
            const opId = this.registerId[index];
            if(!(opId.toString() in listOpRegistered))
                this.registerId.splice(index, 1);
        }
    }

    async _checkWinner(currentBlock) {
        const winners = await this.posSynch.getRaffleWinners();
        const slots = await this.posSynch.getSlotWinners();
        let foundSlotWinner = false;

        for (const index in winners){
            const opWinner = winners[index];
            const slotWinner = slots[index];
            const blockWinner = await this.posSynch.getBlockBySlot(slotWinner);

            if (this.registerId.includes(opWinner) && (blockWinner > currentBlock)){
                const block = await this.posSynch.getBlockBySlot(slots[index]);
                const nextBlock = await this.posSynch.getBlockBySlot(slots[index] + 1);
                foundSlotWinner = true;
                this._setInfoBatch(block - this.slotDeadline, nextBlock - this.slotDeadline, opWinner);
            }
            if (foundSlotWinner) break;
        }
        if (this.infoCurrentBatch.fromBlock) {
            TIMEOUT_NEXT_STATE = 0;
            this.flagWaiting = true;
            this.state = state.WAIT_FORGE;
        } else {
            TIMEOUT_NEXT_STATE = 5000;
            this.state = state.SYNCHRONIZING;
        }
    }

    async _checkWaitForge() {
        const currentBlock = await this.posSynch.getCurrentBlock();
        TIMEOUT_NEXT_STATE = 5000;
        if (currentBlock > this.infoCurrentBatch.fromBlock) {
            TIMEOUT_NEXT_STATE = 0;
            this.state = state.SYNCHRONIZING;
            this.flagWaiting = true;
        } 
    }

    async _buildBatch() {
        // Check if batch has been built
        if (this.flagWaiting) this.flagWaiting = false;

        if(!this.infoCurrentBatch.builded) { // If batch has been already built
            const bb = await this.rollupSynch.getBatchBuilder();
            await this.poolTx.fillBatch(bb);
            this.infoCurrentBatch.batchData = bb;
            this.infoCurrentBatch.builded = true;
        }

        // Check server proof is available
        const resServer = await this.cliServerProof.getStatus();
        if (resServer.data.state != stateServer.IDLE){
            // time to reset server proof
            await this.cliServerProof.cancel();
            await timeout(2000);
        }
        const res = await this.cliServerProof.setInput(stringifyBigInts(this.infoCurrentBatch.batchData.getInput()));
        // retry build or send inputs to server-proof
        if (res.status == 200) {
            TIMEOUT_NEXT_STATE = 0;
            this.state = state.GET_PROOF;
        } else {
            TIMEOUT_NEXT_STATE = 5000;
            this.infoCurrentBatch.retryTimes += 1;
        }
    }

    async _stateProof() {
        const res = await this.cliServerProof.getStatus();
        const statusServer = res.data.state;
        if (statusServer == stateServer.FINISHED) {
            // get proof, commit data and forge block
            const proof = res.data.proof;
            const commitData = `0x${this.infoCurrentBatch.batchData.getDataAvailable().toString("hex")}`;
            const publicInputs = buildInputSm(this.infoCurrentBatch.batchData);

            // Check I am still the winner, otherwise abort sending proof
            const currentBlock = await this.posSynch.getCurrentBlock();

            if (currentBlock > this.infoCurrentBatch.toBlock){
                TIMEOUT_NEXT_STATE = 5000;
                this.state = state.SYNCHRONIZING;
                this._resetInfoBatch();
                return;
            }

            const indexHash = await this._getIndexHashChain(this.infoCurrentBatch.opId);

            const txSign = await this.opManager.getTxCommitAndForge(this.hashChain[indexHash - 1],
                commitData, proof.proofA, proof.proofB, proof.proofC, publicInputs);

            this.state = state.MINING;
            TIMEOUT_NEXT_STATE = 1000;
            const self = this;
            this.web3.eth.sendSignedTransaction(txSign.rawTransaction)
                .once("transactionHash", txHash => {
                    self.txHash = txHash;
                })
                .then( receipt => {
                    if (receipt.status == true){
                        self._logTxOK();
                        TIMEOUT_NEXT_STATE = 5000;
                        self.state = state.SYNCHRONIZING;
                        self._resetInfoBatch();
                    } else self._errorTx(self);
                })
                .catch( () => {
                    self._errorTx(self);
                });
        } else if (statusServer == stateServer.ERROR) {
            TIMEOUT_NEXT_STATE = 5000;
            // reset server-proof and re-send input
            await this.cliServerProof.cancel();
            await timeout(2000); // time to reset the server-proof 
            this.state = state.BUILD_BATCH;
            this.infoCurrentBatch.retryTimes += 1;
        } else if (statusServer == stateServer.IDLE) {
            TIMEOUT_NEXT_STATE = 5000;
            // re-send input to server-proof
            this.state = state.BUILD_BATCH;
            this.infoCurrentBatch.retryTimes += 1;
        } else TIMEOUT_NEXT_STATE = 5000; // Server in pending state
    }

    _setInfoBatch(fromBlock, toBlock, opId){
        this.infoCurrentBatch.fromBlock = fromBlock;
        this.infoCurrentBatch.toBlock = toBlock;
        this.infoCurrentBatch.opId = opId;
        this.infoCurrentBatch.builded = false;
        this.infoCurrentBatch.batchData = undefined;
        if (this.infoCurrentBatch.retryTimes !== undefined) this.infoCurrentBatch.retryTimes += 1;
        else this.infoCurrentBatch.retryTimes = 0;
    }

    _resetInfoBatch(){
        this.infoCurrentBatch = {};
    }

    _logTxOK(){
        let info = `${chalk.yellowBright("OPERATOR STATE: ")}${chalk.white(strState[this.state])}`;
        info += " | info ==> ";
        info += `${chalk.white.bold("Transaction mined succesfully")}`;
        this.logger.info(info);
    }

    _logTxKO(){
        let info = `${chalk.yellowBright("OPERATOR STATE: ")}${chalk.white(strState[this.state])}`;
        info += " | info ==> ";
        info += `${chalk.white.bold("Error at transaction, try to forge batch again")}`;
        this.logger.info(info);
    }

    _errorTx(self) {
        self._logTxKO();
        TIMEOUT_NEXT_STATE = 0;
        self.state = state.SYNCHRONIZING;
        self.infoCurrentBatch.fromBlock = undefined;
    }
}

module.exports = LoopManager;