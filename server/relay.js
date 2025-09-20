const { ethers } = require('ethers');
const fs = require('fs');
require('dotenv').config({ path: '../.env' });


const BRIDGE_ABI = [
    "event Transfer(address indexed from, address indexed to, uint256 amount, uint256 nonce, uint256 chainId)",
    "function mint(address to, uint256 amount, uint256 otherChainNonce) external"
];

class BridgeRelay {
    constructor() {
        this.providers = {
            sepolia: new ethers.JsonRpcProvider(process.env.SEPOLIA_RPC),
            bnb: new ethers.JsonRpcProvider(process.env.BNB_RPC)
        };
        
        this.wallets = {
            sepolia: new ethers.Wallet(process.env.PRIVATE_KEY, this.providers.sepolia),
            bnb: new ethers.Wallet(process.env.PRIVATE_KEY, this.providers.bnb)
        };
        
        this.bridges = {};
    }
    
    async init() {
        console.log("Инициализация релеера...\n");
        
        try {
            const sepoliaData = JSON.parse(fs.readFileSync('../deployments/sepolia.json'));
            const bnbData = JSON.parse(fs.readFileSync('../deployments/bnb.json'));
            
            this.bridges.sepolia = new ethers.Contract(
                sepoliaData.bridge,
                BRIDGE_ABI,
                this.wallets.sepolia
            );
            
            this.bridges.bnb = new ethers.Contract(
                bnbData.bridge,
                BRIDGE_ABI,
                this.wallets.bnb
            );
            
            console.log("Контракты загружены:");
            console.log("   Sepolia Bridge:", sepoliaData.bridge);
            console.log("   BNB Bridge:", bnbData.bridge);
            
        } catch (error) {
            console.log("Не найдены deployments, используем тестовые адреса");
        }
        
        await this.checkBalances();
    }
    
    async checkBalances() {
        console.log("\nБалансы релеера:");
        
        const sepoliaBalance = await this.providers.sepolia.getBalance(this.wallets.sepolia.address);
        console.log("   Sepolia:", ethers.formatEther(sepoliaBalance), "ETH");
        
        const bnbBalance = await this.providers.bnb.getBalance(this.wallets.bnb.address);
        console.log("   BNB:", ethers.formatEther(bnbBalance), "BNB");
    }
    
    async start() {
        console.log("\nСлушаем события...\n");
        
        // listen sepolia
        if (this.bridges.sepolia) {
            this.bridges.sepolia.on("Transfer", async (from, to, amount, nonce, chainId, event) => {
                console.log(`📨 [Sepolia] Новый депозит:`);
                console.log(`   От: ${from}`);
                console.log(`   Кому: ${to}`);
                console.log(`   Сумма: ${ethers.formatEther(amount)} токенов`);
                console.log(`   Nonce: ${nonce}`);
                console.log(`   Target Chain: ${chainId}`);
                
                // Если target chain = BNB (97)
                if (chainId.toString() === "97") {
                    await this.mintTokens("bnb", to, amount, nonce);
                }
            });
        }
        
        // listen bnb
        if (this.bridges.bnb) {
            this.bridges.bnb.on("Transfer", async (from, to, amount, nonce, chainId, event) => {
                console.log(`[BNB] Новый депозит:`);
                console.log(`   От: ${from}`);
                console.log(`   Кому: ${to}`);
                console.log(`   Сумма: ${ethers.formatEther(amount)} токенов`);
                console.log(`   Nonce: ${nonce}`);
                console.log(`   Target Chain: ${chainId}`);
                
                if (chainId.toString() === "11155111") {
                    await this.mintTokens("sepolia", to, amount, nonce);
                }
            });
        }
        
        console.log("Релеер запущен! Нажмите Ctrl+C для остановки.\n");
    }
    
    async mintTokens(network, to, amount, nonce) {
        console.log(`\nМинтинг токенов в ${network}...`);
        
        try {
            const tx = await this.bridges[network].mint(to, amount, nonce);
            console.log(`   TX отправлен: ${tx.hash}`);
            
            const receipt = await tx.wait();
            console.log(`Подтверждено в блоке: ${receipt.blockNumber}`);
        } catch (error) {
            console.log(`Ошибка: ${error.message}`);
        }
    }
}

async function main() {
    const relay = new BridgeRelay();
    await relay.init();
    await relay.start();
    
    // Graceful shutdown
    process.on('SIGINT', () => {
        console.log('\nОстанавливаем релеер...');
        process.exit(0);
    });
}

if (require.main === module) {
    main().catch(console.error);
}

module.exports = BridgeRelay;
