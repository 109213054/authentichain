const { expect } = require("chai");
const { ethers } = require("hardhat");

describe("HelloWorld", function () {
  let helloWorld;

  beforeEach(async function () {
    // 部署合約
    const HelloWorld = await ethers.getContractFactory("HelloWorld");
    helloWorld = await HelloWorld.deploy(); // 不需要調用 .deployed()
  });

  describe("Deployment", function () {
    it("Should return the correct greeting message", async function () {
      // 檢查 greet 的初始值
      expect(await helloWorld.greet()).to.equal("Hello, Polygon Amoy!");
    });
  });
});
