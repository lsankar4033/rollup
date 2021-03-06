const path = require('path');
const fs = require('fs');
const fse = require('fs-extra');
const { Wallet } = require('../../src/wallet');

const resources = path.join(__dirname, '../resources');
const configTestPath = path.join(__dirname, '../resources/config-test.json');
const configPath = path.join(__dirname, '../../config.json');
const abiPath = path.join(__dirname, '../resources/rollupabi.json');
const walletPathDefault = path.join(__dirname, '../../wallet.json');
const walletPath = path.join(__dirname, '../resources/wallet-test.json');
const walletEthPath = path.join(__dirname, '../resources/ethWallet.json');
const walletBabyjubPath = path.join(__dirname, '../resources/babyjubWallet.json');

async function createWallet() {
    if (!fs.existsSync(resources)) {
        await fs.mkdirSync(resources);
    }
    const wallet = await Wallet.createRandom();
    const encWallet = await wallet.toEncryptedJson('foo');
    await fs.writeFileSync(walletPath, JSON.stringify(encWallet, null, 1), 'utf-8');
    await fs.writeFileSync(walletPathDefault, JSON.stringify(encWallet, null, 1), 'utf-8');
    await fs.writeFileSync(walletEthPath, JSON.stringify(encWallet.ethWallet, null, 1), 'utf-8');
    await fs.writeFileSync(walletBabyjubPath, JSON.stringify(encWallet.babyjubWallet, null, 1), 'utf-8');
}

async function createConfig(address) {
    if (!fs.existsSync(resources)) {
        await fs.mkdirSync(resources);
    }
    let actualConfig = {
        wallet: './test/resources/wallet-test.json',
        operator: 'http://127.0.0.1:9000',
        address: '',
        nodeEth: 'http://localhost:8545',
        abi: './test/resources/rollupabi.json',
        id: '1',
    };

    if (fs.existsSync(configPath)) {
        actualConfig = JSON.parse(fs.readFileSync(configPath, 'utf8'));
    }
    actualConfig.address = address;
    await fs.writeFileSync(configTestPath, JSON.stringify(actualConfig, null, 1), 'utf-8');
    await fs.writeFileSync(configPath, JSON.stringify(actualConfig, null, 1), 'utf-8');
}

async function createRollupAbi(abi) {
    if (!fs.existsSync(resources)) {
        await fs.mkdirSync(resources);
    }
    await fs.writeFileSync(abiPath, JSON.stringify(abi, null, 1), 'utf-8');
}

async function deleteResources() {
    if (fs.existsSync(resources)) {
        await fse.remove(resources);
    }
    if (fs.existsSync(walletPathDefault)) {
        await fs.unlinkSync(walletPathDefault);
    }
    if (fs.existsSync(configPath)) {
        await fs.unlinkSync(configPath);
    }
}

module.exports = {
    createWallet,
    createConfig,
    createRollupAbi,
    deleteResources,
};
