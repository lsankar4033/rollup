/* global artifacts */
/* global contract */
/* global web3 */

const chai = require("chai");

const { expect } = chai;
const RollupPoS = artifacts.require("../contracts/RollupPoS");
const MemDb = require("../../rollup-utils/mem-db");
const SynchPoS = require("../src/synch-pos");
const timeTravel = require("../../test/contracts/helpers/timeTravel");
const { timeout } = require("../src/utils");

contract("Synchronizer PoS", async (accounts) => {

    const {
        0: synchAddress,
    } = accounts;

    const slotPerEra = 20;
    const blocksPerSlot = 100;
    const blockPerEra = slotPerEra * blocksPerSlot;
    const rndHash = "0x0000000000000000000000000000000000000000000000000000000000000000";
    const operators = [];
    const addressRollupTest = "0x0000000000000000000000000000000000000001";

    let insRollupPoS;
    let synchDb;
    let synchPoS;
    let genesisBlock;

    let configSynchPoS = {
        synchDb: undefined,
        ethNodeUrl: "http://localhost:8545",
        contractAddress: undefined,
        creationHash: undefined,
        ethAddress: synchAddress,
        abi: RollupPoS.abi,
    };

    before(async () => {
        // Deploy token test
        insRollupPoS = await RollupPoS.new(addressRollupTest);
        genesisBlock = Number(await insRollupPoS.genesisBlock());
        // Init synch db
        synchDb = new MemDb();

        // load config synch PoS
        configSynchPoS.contractAddress = insRollupPoS.address;
        configSynchPoS.creationHash = insRollupPoS.transactionHash;
        configSynchPoS.synchDb = synchDb;

        // fill 10 addresses for operators
        const numOp = 10;
        for (let i = 0; i < numOp; i++) {
            operators.push({address: accounts[i+1], idOp: i});
        }
    });

    it("Should initialize synchronizer PoS", async () => {
        synchPoS = new SynchPoS(configSynchPoS.synchDb, configSynchPoS.ethNodeUrl, configSynchPoS.contractAddress,
            configSynchPoS.abi, configSynchPoS.creationHash, configSynchPoS.ethAddress);
        synchPoS.synchLoop();
    });

    it("Should Add operator and synch", async () => {
        // Add operator
        await insRollupPoS.addOperator(rndHash,
            { from: operators[0].address, value: web3.utils.toWei("2", "ether") });
        // move forward block number to allow the operator to forge a batch
        let currentBlock = await web3.eth.getBlockNumber();
        await timeTravel.addBlocks(genesisBlock - currentBlock + 1); // era 0
        currentBlock = await web3.eth.getBlockNumber();
        await timeout(11000);
        let winners = await synchPoS.getRaffleWinners();
        expect(winners.length).to.be.equal(40);
        // expect no winners for era 0 and era 1
        for(const winner of winners) expect(winner).to.be.equal(-1);
        await timeTravel.addBlocks(blockPerEra); // era 1
        await timeout(11000);
        winners = await synchPoS.getRaffleWinners();
        // expect no winners for era 1 and operator winner for era 2
        for(let i = 0; i < winners.length; i++) {
            if (i < winners.length/2) expect(winners[i]).to.be.equal(-1);
            else expect(winners[i]).to.be.equal(operators[0].idOp);
        }
    });

    it("Should get operators list", async () => {
        let listOperators = await synchPoS.getOperators();
        expect(listOperators.length).to.be.equal(0);
        await timeTravel.addBlocks(blockPerEra); // era 2
        await timeout(11000);
        listOperators = await synchPoS.getOperators();
        expect(listOperators.length).to.be.equal(1);
        expect(listOperators[0].operatorId.toString()).to.be.equal(operators[0].idOp.toString());
        expect(listOperators[0].controllerAddress).to.be.equal(operators[0].address.toString());
    });

    it("Should remove operator and synch", async () => {
        await insRollupPoS.removeOperator(operators[0].idOp, { from: operators[0].address });
        await timeTravel.addBlocks(blockPerEra); // era 3
        await timeout(11000);
        let winners = await synchPoS.getRaffleWinners();
        // expect winner for era 3 and no winner for era 4
        for(let i = 0; i < winners.length; i++) {
            if (i < winners.length/2) expect(winners[i]).to.be.equal(operators[0].idOp);
            else expect(winners[i]).to.be.equal(-1);
        }
        await timeTravel.addBlocks(blockPerEra); // era 4
        await timeout(11000);
        winners = await synchPoS.getRaffleWinners();
        // expect no winners for era 4 and era 5
        for(const winner of winners) expect(winner).to.be.equal(-1);
        await timeTravel.addBlocks(blockPerEra); // era 5
        await timeout(11000);
        const listOperators = await synchPoS.getOperators();
        expect(listOperators.length).to.be.equal(0);
    });

    it("Should add several operators and synch", async () => {
        // Add operators
        const numOp2Add = 5;
        for (let i = 0; i < numOp2Add; i++) {
            await insRollupPoS.addOperator(rndHash,
                { from: operators[i+1].address, value: web3.utils.toWei("2", "ether") });
        }
        await timeTravel.addBlocks(blockPerEra); // era 6
        await timeout(11000);
        let winners = await synchPoS.getRaffleWinners();
        // expect no winner for era 5 and winner for era 6
        for(let i = 0; i < winners.length; i++) {
            if (i < winners.length/2) expect(winners[i]).to.be.equal(-1);
            else expect(winners[i]).to.be.within(1, numOp2Add);
        }
        await timeTravel.addBlocks(blockPerEra); // era 7
        await timeout(11000);
        winners = await synchPoS.getRaffleWinners();
        // expect winner for era 6 and winner for era 7
        for(const winner of winners) expect(winner).to.be.within(1, numOp2Add);
        await timeTravel.addBlocks(blockPerEra); // era 8
        await timeout(11000);
        const listOperators = await synchPoS.getOperators();
        for (const opInfo of listOperators) {
            const opId = Number(opInfo.operatorId);
            expect(operators[opId].address.toString()).to.be.equal(opInfo.controllerAddress);
        }
    });
});