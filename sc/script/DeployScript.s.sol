// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import {Script, console} from "forge-std/Script.sol";
import {DAOVoting} from "../src/DAOVoting.sol";
import {MinimalForwarder} from "../src/MinimalForwarder.sol";

contract DeployScript is Script {
    function run() external {
        // Obtener la private key del deployer desde las variables de entorno
        uint256 deployerPrivateKey = vm.envUint("PRIVATE_KEY");
        address deployer = vm.addr(deployerPrivateKey);
        
        // Obtener addresses de anvil para testing
        address tokenAddress = 0x5FbDB2315678afecb367f032d93F642f64180aa3; // Mock token en anvil
        
        console.log("Deployer address:", deployer);
        console.log("Token address:", tokenAddress);
        
        vm.startBroadcast(deployerPrivateKey);

        // 1. Deploy MinimalForwarder
        MinimalForwarder forwarder = new MinimalForwarder();
        console.log("MinimalForwarder deployed at:", address(forwarder));

        // 2. Deploy DAOVoting con el forwarder
        DAOVoting dao = new DAOVoting(tokenAddress, address(forwarder));
        console.log("DAOVoting deployed at:", address(dao));

        vm.stopBroadcast();

        // Escribir addresses en un formato que se pueda copiar fácilmente
        console.log("==========================================");
        console.log("DEPLOY COMPLETADO");
        console.log("==========================================");
        console.log("MinimalForwarder: %s", address(forwarder));
        console.log("DAOVoting: %s", address(dao));
        console.log("Deployer: %s", deployer);
        console.log("Token: %s", tokenAddress);
        console.log("==========================================");
    }
}