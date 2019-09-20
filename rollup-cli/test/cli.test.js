const fs = require('fs');
const process = require('child_process');
const chai = require('chai');

const walletPathDefault = '../src/wallet.json';

const { expect } = chai;

describe("PRINT KEYS", () => {
  it("printkeys command", (done) => {
    const out = process.exec('cd ..; node cli.js printkeys');
    out.stdout.on('data', (data) => {
      expect(data.toString()).to.be.equal('The following keys have been found:\n');
      done();
    });
  });
  it("printkeys command error", (done) => {
    const out = process.exec('cd ..; node cli.js printkeyss');
    out.on('exit', (code) => {
      expect(code).to.not.be.equal(0);
      done();
    });
  });
});

describe("CREATE KEYS RANDOM", () => {
  it("createkeys random", (done) => {
    process.exec('cd ..; node cli.js createkeys --keytype rollup --pass password --path ./src/walletRollup.json', () => {
      var readWallet = undefined;
      readWallet = fs.readFileSync('../src/walletRollup.json', "utf8");
      expect(readWallet).to.not.be.equal(undefined);
      process.exec(`rm ../src/walletRollup.json`);
      done()
    });
  });
  it("createkeys random default path", (done) => {
    process.exec('cd ..; node cli.js createkeys --keytype rollup --pass password', () => {
      var readWallet = undefined;
      readWallet = fs.readFileSync(walletPathDefault, "utf8");
      expect(readWallet).to.not.be.equal(undefined);
      process.exec(`rm ${walletPathDefault}`);
      done()
    });
  });
  it("createkeys error password", (done) => {
    const out = process.exec('cd ..; node cli.js createkeys --keytype rollup --path ./src/walletRollup.json');
    out.on('exit', (code) => {
      expect(code).to.not.be.equal(0);
      done();
    });
  });
  it("createkeys error keytype", (done) => {
    const out = process.exec('cd ..; node cli.js createkeys --pass password --path ./src/walletRollup.json');
    out.on('exit', (code) => {
      expect(code).to.not.be.equal(0);
      done();
    });
  });
});

describe("CREATE KEYS MNEMONIC", () => {
  it("createkeys mnemonic", (done) => {
    process.exec('cd ..; node cli.js createkeys --keytype rollup --mnemonic "obscure property tackle faculty fresh gas clerk order silver answer belt brother" --pass password --path ./src/walletRollupMnemonic.json', () => {
      var readWalletMnemonic = undefined;
      readWalletMnemonic = fs.readFileSync('../src/walletRollupMnemonic.json', "utf8");
      expect(JSON.parse(readWalletMnemonic).ethWallet.address).to.be.equal("ea7863f14d1a38db7a5e937178fdb7dfa9c96ed7");
      process.exec(`rm ../src/walletRollupMnemonic.json`);
      done()
    });
  });
  it("createkeys mnemonic default path", (done) => {
    process.exec('cd ..; node cli.js createkeys --keytype rollup --mnemonic "obscure property tackle faculty fresh gas clerk order silver answer belt brother" --pass password', () => {
      var readWalletMnemonic = undefined;
      readWalletMnemonic = fs.readFileSync(walletPathDefault, "utf8");
      expect(JSON.parse(readWalletMnemonic).ethWallet.address).to.be.equal("ea7863f14d1a38db7a5e937178fdb7dfa9c96ed7");
      process.exec(`rm ${walletPathDefault}`);
      done()
    });
  });
  it("createkeys mnemonic error", (done) => {
    const out = process.exec('cd ..; node cli.js createkeys --keytype rollup --mnemonic obscure property tackle faculty fresh gas clerk order silver answer belt brother --pass password --path ./src/walletRollupMnemonic.json');
    out.on('exit', (code) => {
      expect(code).to.not.be.equal(0);
      done();
    });
  });
  it("createkeys mnemonic error 2", (done) => {
    const out = process.exec('cd ..; node cli.js createkeys --keytype rollup --mnemonic "obscure property tackle faculty fresh gas clerk order silver answer belt" --pass password --path ./src/walletRollupMnemonic.json');
    out.on('exit', (code) => {
      expect(code).to.not.be.equal(0);
      done();
    });
  });
  it("createkeys mnemonic error password", (done) => {
    const out = process.exec('cd ..; node cli.js createkeys --keytype rollup --mnemonic "obscure property tackle faculty fresh gas clerk order silver answer belt brother" --path ./src/walletRollupMnemonic.json');
    out.on('exit', (code) => {
      expect(code).to.not.be.equal(0);
      done();
    });
  });
  it("createkeys mnemonic error keytype", (done) => {
    const out = process.exec('cd ..; node cli.js createkeys --mnemonic "obscure property tackle faculty fresh gas clerk order silver answer belt brother" --pass password --path ./src/walletRollupMnemonic.json');
    out.on('exit', (code) => {
      expect(code).to.not.be.equal(0);
      done();
    });
  });
});

describe("CREATE KEYS IMPORT", () => {
  it("createkeys import", (done) => {
    process.exec('cd ..; node cli.js createkeys --keytype rollup --import ./src/wallet-test.json --pass password --path ./src/walletRollupImport.json', () => {
      var readWalletImport = undefined;
      readWalletImport = fs.readFileSync('../src/walletRollupImport.json', "utf8");
      expect(JSON.parse(readWalletImport).ethWallet.address).to.be.equal("8c7da02a293238b03d6b84963a243b61fe02ae78");
      process.exec(`rm ../src/walletRollupImport.json`);
      done()
    });
  });
  it("createkeys import default path", (done) => {
    process.exec('cd ..; node cli.js createkeys --keytype rollup --import ./src/wallet-test.json --pass password', () => {
      var readWalletImport = undefined;
      readWalletImport = fs.readFileSync(walletPathDefault, "utf8");
      expect(JSON.parse(readWalletImport).ethWallet.address).to.be.equal("8c7da02a293238b03d6b84963a243b61fe02ae78");
      process.exec(`rm ${walletPathDefault}`);
      done()
    });
  });
  it("createkeys import error", (done) => {
    const out = process.exec('cd ..; node cli.js createkeys --keytype rollup --import ./src/wallet-testttt.json --pass password --path ./src/walletRollupImport.json');
    out.on('exit', (code) => {
      expect(code).to.not.be.equal(0);
      done();
    });
  });
  it("createkeys import error password", (done) => {
    const out = process.exec('cd ..; node cli.js createkeys --keytype rollup --import ./src/wallet-test.json --path ./src/walletRollupImport.json');
    out.on('exit', (code) => {
      expect(code).to.not.be.equal(0);
      done();
    });
  });
  it("createkeys import error keytype", (done) => {
    const out = process.exec('cd ..; node cli.js createkeys --import ./src/wallet-test.json --pass password --path ./src/walletRollupImport.json');
    out.on('exit', (code) => {
      expect(code).to.not.be.equal(0);
      done();
    });
  });
});

describe("ONCHAINTX", () => {
  it("onchaintx deposit", (done) => {
    const out = process.exec('cd ..; node cli.js onchaintx --type deposit --pass password --amount 3 --tokenid 1234 --paramsTx ./src/config-example.json');
    out.stdout.on('data', (data) => {
      expect("deposit\n").to.be.equal(data);
      done();
    });
  });
  it("onchaintx deposit default config.json", (done) => {
    const out = process.exec('cd ..; node cli.js onchaintx --type deposit --pass password --amount 3 --tokenid 1234');
    out.stdout.on('data', (data) => {
      expect("deposit\n").to.be.equal(data);
      done();
    });
  });
  it("onchaintx deposit error pass", (done) => {
    const out = process.exec('cd ..; node cli.js onchaintx --type deposit --amount 3 --tokenid 1234 --paramsTx ./src/config-example.json');
    out.on('exit', (code) => {
      expect(code).to.not.be.equal(0);
      done();
    });
  });
  it("onchaintx deposit error amount", (done) => {
    const out = process.exec('cd ..; node cli.js onchaintx --type deposit --pass password --tokenid 1234 --paramsTx ./src/config-example.json');
    out.on('exit', (code) => {
      expect(code).to.not.be.equal(0);
      done();
    });
  });
  it("onchaintx deposit error token id", (done) => {
    const out = process.exec('cd ..; node cli.js onchaintx --type deposit --pass password --amount 3 --paramsTx ./src/config-example.json');
    out.on('exit', (code) => {
      expect(code).to.not.be.equal(0);
      done();
    });
  });
  it("onchaintx deposit error config file", (done) => {
    const out = process.exec('cd ..; node cli.js onchaintx --type deposit --pass password --amount 3 --paramsTx ./src/config-examplee.json');
    out.on('exit', (code) => {
      expect(code).to.not.be.equal(0);
      done();
    });
  });
});

describe("OFFCHAINTX", () => {
  it("offchaintx send", (done) => {
    const out = process.exec('cd ..; node cli.js offchaintx --type send --pass password --amount 3 --to 1111 --paramsTx ./src/config-example.json');
    out.stdout.on('data', (data) => {
      expect("send\n").to.be.equal(data);
      done();
    });
  });
  it("offchaintx send default config.json", (done) => {
    const out = process.exec('cd ..; node cli.js offchaintx --type send --pass password --amount 3 --to 1111');
    out.stdout.on('data', (data) => {
      expect("send\n").to.be.equal(data);
      done();
    });
  });
  it("offchaintx send error pass", (done) => {
    const out = process.exec('cd ..; node cli.js offchaintx --type send --amount 3 --to 1111 --paramsTx ./src/config-example.json');
    out.on('exit', (code) => {
      expect(code).to.not.be.equal(0);
      done();
    });
  });
  it("offchaintx send error amount", (done) => {
    const out = process.exec('cd ..; node cli.js offchaintx --type send --pass password --to 1111 --paramsTx ./src/config-example.json');
    out.on('exit', (code) => {
      expect(code).to.not.be.equal(0);
      done();
    });
  });
  it("offchaintx send error recipient", (done) => {
    const out = process.exec('cd ..; node cli.js offchaintx --type send --pass password --amount 3 --paramsTx ./src/config-example.json');
    out.on('exit', (code) => {
      expect(code).to.not.be.equal(0);
      done();
    });
  });
  it("offchaintx send error config file", (done) => {
    const out = process.exec('cd ..; node cli.js offchaintx --type send --pass password --amount 3 --to 1111 --paramsTx ./src/config-examplee.json');
    out.on('exit', (code) => {
      expect(code).to.not.be.equal(0);
      done();
    });
  });
});