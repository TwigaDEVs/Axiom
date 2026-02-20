// SPDX-License-Identifier: MIT
pragma solidity ^0.8.19;

import {ReceiverTemplate} from "./ReceiverTemplate.sol";

enum Outcome { Unresolved, Yes, No, Invalid }

contract PredictionMarket is ReceiverTemplate {
    
    struct Market {
        string question;
        string resolutionCriteria;
        uint256 deadline;
        string metadataURI;
        bool resolved;
        Outcome result;
    }

    // Mapping for our MarketInput data
    mapping(string => Market) public markets;
    mapping(string => bool) public marketExists;

    event MarketCreated(string indexed marketId, string question);
    event MarketResolved(string indexed marketId, Outcome result);

    // Pass the Forwarder address to the parent ReceiverTemplate
    constructor(address _forwarder) ReceiverTemplate(_forwarder) {}

    /**
     * @notice Standard function for users to create markets
     */
    function createMarket(
        string calldata _marketId,
        string calldata _question,
        string calldata _criteria,
        uint256 _deadline,
        string calldata _metadataUri
    ) external {
        require(!marketExists[_marketId], "Market ID exists");
        require(_deadline > block.timestamp, "Deadline must be future");

        markets[_marketId] = Market({
            question: _question,
            resolutionCriteria: _criteria,
            deadline: _deadline,
            metadataURI: _metadataUri,
            resolved: false,
            result: Outcome.Unresolved
        });

        marketExists[_marketId] = true;
        emit MarketCreated(_marketId, _question);
    }

    /**
     * @notice Internal function called by the Chainlink Forwarder
     * @dev Decodes the report sent by your TS workflow
     */
    function _processReport(bytes calldata report) internal override {
        // Decode the report matching your TS encodeAbiParameters
        (string memory _marketId, uint8 _outcomeIndex) = abi.decode(report, (string, uint8));

        require(marketExists[_marketId], "Market does not exist");
        Market storage market = markets[_marketId];
        
        require(!market.resolved, "Already resolved");
        require(_outcomeIndex > 0 && _outcomeIndex <= 3, "Invalid outcome index");

        // Update the market state
        market.resolved = true;
        market.result = Outcome(_outcomeIndex);

        emit MarketResolved(_marketId, market.result);
    }

    /**
     * @notice Helper to check market status off-chain (view function)
     */
    function getMarket(string calldata _marketId) external view returns (Market memory) {
        return markets[_marketId];
    }
}