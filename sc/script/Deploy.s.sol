// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "forge-std/Script.sol";
import "../src/MinimalForwarder.sol";
import "../src/DAOVoting.sol";

contract DeployScript is Script {
    function run() external {
        uint256 deployerPrivateKey = vm.envUint("PRIVATE_KEY");
        vm.startBroadcast(deployerPrivateKey);

        // Deploy MinimalForwarder first
        MinimalForwarder forwarder = new MinimalForwarder();
        console.log("MinimalForwarder deployed at:", address(forwarder));

        // Deploy DAOVoting with the forwarder address
        DAOVoting daoVoting = new DAOVoting(address(forwarder));
        console.log("DAOVoting deployed at:", address(daoVoting));

        vm.stopBroadcast();
    }
}