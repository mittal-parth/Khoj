import { Wallet } from "ethers";

// Script to generate a new random wallet for sign or lit protocol
const wallet = Wallet.createRandom();
console.log("Address:", wallet.address);
console.log("Private Key:", wallet.privateKey);