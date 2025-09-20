const { ethers } = require('ethers');

const wallet = ethers.Wallet.createRandom();

console.log('Адрес:', wallet.address);
console.log('Приватный ключ (без 0x):', wallet.privateKey.slice(2));
