pragma solidity ^0.8.24;

import {Script} from "forge-std/Script.sol";
import  {console2} from "forge-std/console2.sol";
import {DAOVoting} from "../src/DAOVoting.sol";
import {MinimalForwarder} from "../src/MinimalForwarder.sol";

contract DeployScript is Script {
    function setUp() public {}

    function run() public {
        uint256 deployerPrivateKey = vm.envUint("PRIVATE_KEY");
        vm.startBroadcast(deployerPrivateKey);
        
        // Deploy MinimalForwarder first
        MinimalForwarder forwarder = new MinimalForwarder();
        
        // Deploy DAOVoting with the forwarder address
        DAOVoting dao = new DAOVoting(address(forwarder));
        
        vm.stopBroadcast();
        
        // Print deployment addresses
        console2.log("MinimalForwarder deployed to:", address(forwarder));
        console2.log("DAOVoting deployed to:", address(dao));
    }
}