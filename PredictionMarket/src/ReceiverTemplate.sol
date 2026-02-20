// SPDX-License-Identifier: MIT
pragma solidity ^0.8.19;

abstract contract ReceiverTemplate {
    // FIX 1: Use SCREAMING_SNAKE_CASE for immutables
    address public immutable FORWARDER;

    error NotForwarder();

    // FIX 2: Wrap modifier logic in an internal function to save gas
    modifier onlyForwarder() {
        _checkForwarder();
        _;
    }

    function _checkForwarder() internal view {
        if (msg.sender != FORWARDER) {
            revert NotForwarder();
        }
    }

    constructor(address _forwarder) {
        FORWARDER = _forwarder;
    }

    function onReport(bytes calldata report) external onlyForwarder {
        _processReport(report);
    }

    function _processReport(bytes calldata report) internal virtual;
}