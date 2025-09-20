const { expect } = require("chai");
const { ethers } = require("hardhat");

describe("Bridge Test", function () {
    let token, bridgeA, bridgeB;
    let owner, user;

    beforeEach(async function () {
        [owner, user] = await ethers.getSigners();
        
        // Deploy token
        const Token = await ethers.getContractFactory("Token");
        token = await Token.deploy();
        
        // Deploy bridges
        const Bridge = await ethers.getContractFactory("Bridge");
        bridgeA = await Bridge.deploy(await token.getAddress());
        bridgeB = await Bridge.deploy(await token.getAddress());
        
        // Setup permissions
        await token.addBridge(await bridgeA.getAddress());
        await token.addBridge(await bridgeB.getAddress());
        
        // Give user some tokens
        await token.transfer(user.address, ethers.parseEther("1000"));
    });

    it("Should transfer tokens through bridge", async function () {
        const amount = ethers.parseEther("100");
        
        // Approve and deposit
        await token.connect(user).approve(await bridgeA.getAddress(), amount);
        await bridgeA.connect(user).deposit(amount, user.address, 97);
        
        // Check balance decreased
        expect(await token.balanceOf(user.address)).to.equal(ethers.parseEther("900"));
        
        // Mint on other side
        await bridgeB.mint(user.address, amount, 1);
        
        // Check balance restored
        expect(await token.balanceOf(user.address)).to.equal(ethers.parseEther("1000"));
    });

    it("Should not allow double mint", async function () {
        const amount = ethers.parseEther("100");
        
        await bridgeB.mint(user.address, amount, 1);
        
        // Try to mint again with same nonce - should fail
        try {
            await bridgeB.mint(user.address, amount, 1);
            expect.fail("Should have reverted");
        } catch (error) {
            expect(error.message).to.include("Already processed");
        }
    });
});
