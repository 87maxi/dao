// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "forge-std/Test.sol";
import "./src/DAOVoting.sol";

contract DebugBalance is Test {
    DAOVoting public dao;
    
    function test_DebugBalance() public {
        dao = new DAOVoting(address(0));
        
        console.log("DAO balance after deployment:", address(dao).balance);
        
        // Fund the DAO
        vm.deal(address(dao), 100 ether);
        console.log("DAO balance after funding:", address(dao).balance);
        
        uint256 requiredDeposit = (address(dao).balance * 10) / 100;
        console.log("Required deposit:", requiredDeposit);
    }
}