const process = require("child_process");
const chai = require("chai");
const { error } = require("../list-errors");

const { expect } = chai;

const walletTest = "wallet-test.json";
const pass = "foo";

describe("REGISTER", async function () {
    this.timeout(10000);

    it("Register OK", (done) => {
        const outBalance = process.exec(`cd ..; node cli-pos.js balance -w ${walletTest} -p ${pass}`);
        outBalance.stdout.on("data", (balance) => {
            const out = process.exec(`cd ..; node cli-pos.js register -w ${walletTest} -p ${pass} -s 2 -u localhost`);
            out.stdout.on("data", (data) => {
                expect(data[0]).to.be.equal("0");
                expect(data[1]).to.be.equal("x");
                const outBalance2 = process.exec(`cd ..; node cli-pos.js balance -w ${walletTest} -p ${pass}`);
                outBalance2.stdout.on("data", (balance2) => {
                    expect(parseInt(balance)).to.be.equal(parseInt(balance2)+2);
                });
                done();
            }); 
        }); 
    });
    it("Register 2 OK", (done) => {
        const outBalance = process.exec(`cd ..; node cli-pos.js balance -w ${walletTest} -p ${pass}`);
        outBalance.stdout.on("data", (balance) => {
            const out = process.exec(`cd ..; node cli-pos.js register -w ${walletTest} -p ${pass} -s 2 -u localhost`);
            out.stdout.on("data", (data) => {
                expect(data[0]).to.be.equal("0");
                expect(data[1]).to.be.equal("x");
                const outBalance2 = process.exec(`cd ..; node cli-pos.js balance -w ${walletTest} -p ${pass}`);
                outBalance2.stdout.on("data", (balance2) => {
                    expect(parseInt(balance)).to.be.equal(parseInt(balance2)+2);
                });
                done();
            }); 
        }); 
    });
    it("Register invalid command", (done) => {
        const out = process.exec(`cd ..; node cli-pos.js registe -w ${walletTest} -p ${pass} -s 2 -u localhost`);
        out.on("exit", (code) => {
            expect(code).to.be.equal(error.INVALID_COMMAND);
            done();
        });
    });
    it("Register invalid path", (done) => {
        const out = process.exec(`cd ..; node cli-pos.js register -w wallet-no.json -p ${pass} -s 2 -u localhost`);
        out.on("exit", (code) => {
            expect(code).to.be.equal(error.INVALID_PATH);
            done();
        });
    });
    it("Register invalid param", (done) => {
        const out = process.exec(`cd ..; node cli-pos.js register -w ${walletTest} -p ${pass} -u localhost`);
        out.on("exit", (code) => {
            expect(code).to.be.equal(error.NO_PARAM);
            done();
        });
    });
    it("Register invalid wallet or password", (done) => {
        const out = process.exec(`cd ..; node cli-pos.js register -w ${walletTest} -p fii -s 2 -u localhost`);
        out.on("exit", (code) => {
            expect(code).to.be.equal(error.INVALID_WALLET);
            done();
        });
    });
    it("Register no config file", (done) => {
        const out = process.exec(`cd ..; mv config.json config-test.json; node cli-pos.js register -w ${walletTest} -p ${pass} -s 2 -u localhost`);
        out.on("exit", (code) => {
            expect(code).to.be.equal(error.NO_CONFIG_FILE);
            process.exec("cd ..; mv config-test.json config.json");
            done();
        });
    });
});