// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "forge-std/Script.sol";
import "../src/DAOVoting.sol";
import "../src/MinimalForwarder.sol";

// Importamos el MockERC20 del test
contract MockERC20 {
    function mint(address, uint256) public {}
}

contract DeployScript is Script {
    function run() external {
        uint256 deployerPrivateKey = vm.envUint("PRIVATE_KEY");
        if (deployerPrivateKey == 0) {
            deployerPrivateKey = 0xac0974bec39a17e36ba4a6b4d238ff944bacb478cbed5efcae784d7bf4f2ff80;
        }
        
        vm.startBroadcast(deployerPrivateKey);

        console.log("Deployer address:", vm.addr(deployerPrivateKey));

        // 1. Deploy MinimalForwarder
        MinimalForwarder forwarder = new MinimalForwarder();
        console.log("MinimalForwarder deployed at:", address(forwarder));

        // 2. Deploy MockERC20 (usando create2 para dirección predecible)
        bytes32 salt = keccak256("DAOToken");
        MockERC20 token = new MockERC20{salt: salt}();
        console.log("MockERC20 deployed at:", address(token));

        // 3. Deploy DAOVoting
        DAOVoting dao = new DAOVoting(address(token), address(forwarder));
        console.log("DAOVoting deployed at:", address(dao));

        vm.stopBroadcast();
    }
}