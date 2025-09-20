const hre = require("hardhat");
const fs = require("fs");

async function main() {
    console.log("=== ЛОКАЛЬНОЕ ТЕСТИРОВАНИЕ МОСТА ===\n");
    
    const [owner, user] = await hre.ethers.getSigners();
    console.log("Owner:", owner.address);
    console.log("User:", user.address);
    
    console.log("\n1. Деплоим токен...");
    const Token = await hre.ethers.getContractFactory("Token");
    const token = await Token.deploy();
    await token.waitForDeployment();
    const tokenAddress = await token.getAddress();
    console.log("Token deployed to:", tokenAddress);
    
    console.log("\n2. Деплоим мосты...");
    const Bridge = await hre.ethers.getContractFactory("Bridge");
    
    const bridgeA = await Bridge.deploy(tokenAddress);
    await bridgeA.waitForDeployment();
    const bridgeAAddress = await bridgeA.getAddress();
    console.log("Bridge A (Sepolia) deployed to:", bridgeAAddress);
    
    const bridgeB = await Bridge.deploy(tokenAddress);
    await bridgeB.waitForDeployment();
    const bridgeBAddress = await bridgeB.getAddress();
    console.log("Bridge B (BNB) deployed to:", bridgeBAddress);
    
    console.log("\n3. Настраиваем права...");
    await token.addBridge(bridgeAAddress);
    await token.addBridge(bridgeBAddress);
    console.log("Мосты добавлены как минтеры");
    
    console.log("\n4. Начальные балансы:");
    let ownerBalance = await token.balanceOf(owner.address);
    console.log("Owner balance:", hre.ethers.formatEther(ownerBalance), "BTK");
    
    console.log("\n5. Переводим 1000 токенов пользователю...");
    await token.transfer(user.address, hre.ethers.parseEther("1000"));
    let userBalance = await token.balanceOf(user.address);
    console.log("User balance:", hre.ethers.formatEther(userBalance), "BTK");
    
    console.log("\n6. ТЕСТИРУЕМ МОСТ:");
    console.log("User отправляет 100 токенов через Bridge A в сеть B...");
    
    await token.connect(user).approve(bridgeAAddress, hre.ethers.parseEther("100"));
    
    const depositTx = await bridgeA.connect(user).deposit(
        hre.ethers.parseEther("100"),
        user.address,
        97 // chain ID bnb
    );
    
    const receipt = await depositTx.wait();
    console.log("Deposit transaction:", receipt.hash);
    
    const event = receipt.logs.find(log => {
        try {
            const parsed = bridgeA.interface.parseLog(log);
            return parsed.name === 'Transfer';
        } catch (e) {
            return false;
        }
    });
    
    if (event) {
        const parsed = bridgeA.interface.parseLog(event);
        console.log("\nСобытие Transfer:");
        console.log("- From:", parsed.args.from);
        console.log("- To:", parsed.args.to);
        console.log("- Amount:", hre.ethers.formatEther(parsed.args.amount), "BTK");
        console.log("- Nonce:", parsed.args.nonce.toString());
        console.log("- Target Chain:", parsed.args.chainId.toString());
    }
    
    userBalance = await token.balanceOf(user.address);
    console.log("\nUser balance после депозита:", hre.ethers.formatEther(userBalance), "BTK");
    
    console.log("\n7. Релеер обрабатывает транзакцию...");
    console.log("Минтим токены в Bridge B для user...");
    
    await bridgeB.mint(
        user.address,
        hre.ethers.parseEther("100"),
        1 // nonce
    );
    
    userBalance = await token.balanceOf(user.address);
    console.log("\nИтоговый баланс user:", hre.ethers.formatEther(userBalance), "BTK");
    
    console.log("\nТЕСТ УСПЕШНО ЗАВЕРШЕН!");
    console.log("Токены были:");
    console.log("1. Сожжены в Bridge A (имитация Sepolia)");
    console.log("2. Созданы в Bridge B (имитация BNB)");
}

main()
    .then(() => process.exit(0))
    .catch((error) => {
        console.error(error);
        process.exit(1);
    });
