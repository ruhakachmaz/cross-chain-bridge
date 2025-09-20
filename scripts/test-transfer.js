const hre = require("hardhat");
const fs = require("fs");

async function main() {
    const [owner, user] = await hre.ethers.getSigners();
    const network = hre.network.name;
    
    const data = JSON.parse(fs.readFileSync(`deployments/${network}.json`));
    
    const token = await hre.ethers.getContractAt("Token", data.token);
    const bridge = await hre.ethers.getContractAt("Bridge", data.bridge);
    
    console.log("Выполняем тестовый перевод...");
    
    await token.transfer(user.address, hre.ethers.parseEther("100"));
    console.log("Переведено 100 токенов пользователю");
    
    await token.connect(user).approve(data.bridge, hre.ethers.parseEther("10"));
    
    const tx = await bridge.connect(user).deposit(
        hre.ethers.parseEther("10"),
        user.address,
        97
    );
    
    console.log("Депозит выполнен:", tx.hash);
}

main().catch(console.error);