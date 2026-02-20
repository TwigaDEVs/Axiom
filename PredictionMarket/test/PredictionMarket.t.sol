// SPDX-License-Identifier: MIT
pragma solidity ^0.8.13;

import {Test} from "forge-std/Test.sol";
import {PredictionMarket, Outcome} from "../src/PredictionMarket.sol";

contract PredictionMarketTest is Test {
    PredictionMarket public marketContract;
    
    // We create a fake address to represent the Chainlink Forwarder
    address constant FORWARDER = address(0xF834); 

    string id = "market-123";
    string question = "Will ETH hit $10k?";
    string criteria = "Price >= 10000";
    uint256 deadline = block.timestamp + 365 days;
    string metadata = "ipfs://metadata";

    function setUp() public {
        // Pass the fake forwarder to the constructor
        marketContract = new PredictionMarket(FORWARDER);
    }

    function test_CreateMarket() public {
        marketContract.createMarket(id, question, criteria, deadline, metadata);
        
        // Note: markets() mapping returns 6 values now (question, criteria, deadline, metadata, resolved, result)
        (string memory q, , , , bool res, ) = marketContract.markets(id);
        
        assertEq(q, question);
        assertEq(res, false);
    }

    function test_ResolveMarketViaForwarder() public {
        marketContract.createMarket(id, question, criteria, deadline, metadata);
        
        // 1. Manually encode the data exactly like your TS workflow will
        bytes memory report = abi.encode(id, uint8(Outcome.Yes));
        
        // 2. Pretend to be the Forwarder (the only address allowed to call onReport)
        vm.prank(FORWARDER);
        marketContract.onReport(report);
        
        // 3. Verify resolution
        (, , , , bool resolved, Outcome result) = marketContract.markets(id);
        assertTrue(resolved);
        assertEq(uint8(result), uint8(Outcome.Yes));
    }

    function test_FailResolveByNonForwarder() public {
        marketContract.createMarket(id, question, criteria, deadline, metadata);
        
        bytes memory report = abi.encode(id, uint8(Outcome.Yes));

        // Try calling from a random address (not the forwarder)
        address hacker = address(0xBAD);
        vm.prank(hacker);
        
        // This should trigger the NotForwarder() error from ReceiverTemplate
        vm.expectRevert(); 
        marketContract.onReport(report);
    }
}