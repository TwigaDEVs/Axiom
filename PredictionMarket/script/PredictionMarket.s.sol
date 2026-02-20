// SPDX-License-Identifier: MIT
pragma solidity ^0.8.13;

import {Script} from "forge-std/Script.sol";
import {PredictionMarket} from "../src/PredictionMarket.sol";

contract PredictionMarketScript is Script {
    PredictionMarket public marketContract;

    function setUp() public {}

    function run() public {
        uint256 deployerPrivateKey = vm.envUint("PRIVATE_KEY");

        // The specific Chainlink CRE Forwarder address you provided
        address forwarder = 0xF8344CFd5c43616a4366C34E3EEE75af79a74482;

        vm.startBroadcast(deployerPrivateKey);

        // FIX: Pass the forwarder address into the constructor
        marketContract = new PredictionMarket(forwarder);

        // This stays the same
        marketContract.createMarket(
            "genesis-001",
            "Will this contract deploy successfully?",
            "Transaction must be confirmed on-chain.",
            block.timestamp + 1 days,
            "ipfs://initial-metadata-hash"
        );

        vm.stopBroadcast();
    }
}