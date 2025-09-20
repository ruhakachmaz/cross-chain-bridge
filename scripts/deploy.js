const hre = require("hardhat");
const fs = require("fs");

async function main() {
    const network = hre.network.name;
    console.log(`Deploying to ${network}...`);
    
    const [deployer] = await hre.ethers.getSigners();
    console.log("Deployer:", deployer.address);
    
    const Token = await hre.ethers.getContractFactory("Token");
    const token = await Token.deploy();
    await token.waitForDeployment();
    const tokenAddress = await token.getAddress();
    console.log("Token deployed to:", tokenAddress);
    
    const Bridge = await hre.ethers.getContractFactory("Bridge");
    const bridge = await Bridge.deploy(tokenAddress);
    await bridge.waitForDeployment();
    const bridgeAddress = await bridge.getAddress();
    console.log("Bridge deployed to:", bridgeAddress);
    
    await token.addBridge(bridgeAddress);
    console.log("Bridge added as minter");
    
    const data = {
        network: network,
        token: tokenAddress,
        bridge: bridgeAddress,
        deployer: deployer.address
    };
    
    fs.writeFileSync(
        `deployments/${network}.json`,
        JSON.stringify(data, null, 2)
    );
    
    console.log(`Saved to deployments/${network}.json`);
}

main().catch((error) => {
    console.error(error);
    process.exit(1);
});
