// SPDX-License-Identifier: MIT
pragma solidity ^0.8.25;

import {FHE, ebool, euint32} from "@fhenixprotocol/cofhe-contracts/FHE.sol";
import {InEuint32} from "@fhenixprotocol/cofhe-contracts/ICofhe.sol";

contract ShadowBook {
    error InvalidEncryptedPayload(string reason);
    error OrderNotFound(uint256 orderId);

    struct Order {
        euint32 price;
        euint32 amount;
        ebool filled;
        bool isBuy;
        address owner;
        bool exists;
    }

    struct MatchResult {
        euint32 executionPrice;
        ebool fillStatus;
        bool initialized;
    }

    uint256 public nextOrderId = 1;

    mapping(uint256 => Order) private orders;
    mapping(uint256 => MatchResult) private orderResults;
    mapping(address => uint256[]) private traderOrders;

    uint256[] private buyOrderIds;
    uint256[] private sellOrderIds;

    event OrderPlaced(
        uint256 indexed orderId,
        address indexed owner,
        bool isBuy,
        bytes32 encryptedPrice,
        bytes32 encryptedAmount
    );

    event OrderMatched(
        uint256 indexed orderId,
        bytes32 encryptedExecutionPrice,
        bytes32 encryptedFillStatus,
        uint256 timestamp
    );

    function placeOrder(
        InEuint32 calldata encryptedPrice,
        InEuint32 calldata encryptedAmount,
        bool isBuy
    ) external returns (uint256 orderId) {
        _validateEncryptedInputs(encryptedPrice, encryptedAmount);

        orderId = nextOrderId++;

        euint32 price = FHE.asEuint32(encryptedPrice);
        euint32 amount = FHE.asEuint32(encryptedAmount);

        Order storage incoming = orders[orderId];
        incoming.price = price;
        incoming.amount = amount;
        incoming.filled = FHE.asEbool(false);
        incoming.isBuy = isBuy;
        incoming.owner = msg.sender;
        incoming.exists = true;

        traderOrders[msg.sender].push(orderId);

        if (isBuy) {
            buyOrderIds.push(orderId);
        } else {
            sellOrderIds.push(orderId);
        }

        _allowOrderCiphertexts(incoming);

        (euint32 executionPrice, ebool fillStatus) = _matchOrder(orderId);

        MatchResult storage result = orderResults[orderId];
        result.executionPrice = executionPrice;
        result.fillStatus = fillStatus;
        result.initialized = true;

        FHE.allowThis(result.executionPrice);
        FHE.allowThis(result.fillStatus);
        FHE.allow(result.executionPrice, msg.sender);
        FHE.allow(result.fillStatus, msg.sender);

        emit OrderPlaced(
            orderId,
            msg.sender,
            isBuy,
            euint32.unwrap(price),
            euint32.unwrap(amount)
        );

        emit OrderMatched(
            orderId,
            euint32.unwrap(result.executionPrice),
            ebool.unwrap(result.fillStatus),
            block.timestamp
        );
    }

    function _validateEncryptedInputs(
        InEuint32 calldata encryptedPrice,
        InEuint32 calldata encryptedAmount
    ) internal pure {
        if (encryptedPrice.signature.length == 0 || encryptedAmount.signature.length == 0) {
            revert InvalidEncryptedPayload("EMPTY_SIGNATURE");
        }

        if (encryptedPrice.securityZone != encryptedAmount.securityZone) {
            revert InvalidEncryptedPayload("SECURITY_ZONE_MISMATCH");
        }

        if (encryptedPrice.utype != encryptedAmount.utype) {
            revert InvalidEncryptedPayload("UTYPE_MISMATCH");
        }
    }

    function _matchOrder(uint256 incomingOrderId)
        internal
        returns (euint32 executionPrice, ebool didFill)
    {
        Order storage incoming = orders[incomingOrderId];
        uint256[] storage opposingOrderIds;

        if (incoming.isBuy) {
            opposingOrderIds = sellOrderIds;
        } else {
            opposingOrderIds = buyOrderIds;
        }

        executionPrice = FHE.asEuint32(0);
        didFill = FHE.asEbool(false);

        for (uint256 i = 0; i < opposingOrderIds.length; i++) {
            uint256 counterOrderId = opposingOrderIds[i];

            if (counterOrderId == incomingOrderId) {
                continue;
            }

            Order storage counter = orders[counterOrderId];

            if (!counter.exists) {
                continue;
            }

            ebool priceAbove = FHE.gt(incoming.price, counter.price);
            ebool priceBelow = FHE.lt(incoming.price, counter.price);
            ebool priceEqual = FHE.eq(incoming.price, counter.price);
            ebool priceCrossed = incoming.isBuy
                ? FHE.or(priceAbove, priceEqual)
                : FHE.or(priceBelow, priceEqual);

            ebool amountMatched = FHE.eq(incoming.amount, counter.amount);

            ebool incomingOpen = FHE.not(incoming.filled);
            ebool counterOpen = FHE.not(counter.filled);

            ebool availabilityCheck = FHE.and(incomingOpen, counterOpen);
            ebool canMatch = FHE.and(FHE.and(priceCrossed, amountMatched), availabilityCheck);

            incoming.filled = FHE.or(incoming.filled, canMatch);
            counter.filled = FHE.or(counter.filled, canMatch);

            executionPrice = FHE.select(canMatch, counter.price, executionPrice);
            didFill = FHE.or(didFill, canMatch);

            _allowFilledCiphertext(incoming);
            _allowFilledCiphertext(counter);
        }
    }

    function _allowOrderCiphertexts(Order storage order) internal {
        FHE.allowThis(order.price);
        FHE.allowThis(order.amount);
        FHE.allowThis(order.filled);

        FHE.allow(order.price, order.owner);
        FHE.allow(order.amount, order.owner);
        FHE.allow(order.filled, order.owner);
    }

    function _allowFilledCiphertext(Order storage order) internal {
        FHE.allowThis(order.filled);
        FHE.allow(order.filled, order.owner);
    }

    function getOrderResult(uint256 orderId)
        external
        view
        returns (bytes32 encryptedExecutionPrice, bytes32 encryptedFillStatus)
    {
        _assertOrderExists(orderId);
        MatchResult storage result = orderResults[orderId];

        if (!result.initialized) {
            return (bytes32(0), bytes32(0));
        }

        return (euint32.unwrap(result.executionPrice), ebool.unwrap(result.fillStatus));
    }

    function getOrderCiphertexts(uint256 orderId)
        external
        view
        returns (
            bytes32 encryptedPrice,
            bytes32 encryptedAmount,
            bytes32 encryptedFilled,
            bool isBuy,
            address owner
        )
    {
        Order storage order = orders[orderId];
        _assertOrderExists(orderId);

        return (
            euint32.unwrap(order.price),
            euint32.unwrap(order.amount),
            ebool.unwrap(order.filled),
            order.isBuy,
            order.owner
        );
    }

    function getLatestOrderIdForTrader(address trader) external view returns (uint256) {
        uint256 count = traderOrders[trader].length;
        if (count == 0) {
            return 0;
        }

        return traderOrders[trader][count - 1];
    }

    function getOrdersByTrader(address trader) external view returns (uint256[] memory) {
        return traderOrders[trader];
    }

    function getOrderCount() external view returns (uint256) {
        return nextOrderId - 1;
    }

    function _assertOrderExists(uint256 orderId) internal view {
        if (!orders[orderId].exists) {
            revert OrderNotFound(orderId);
        }
    }
}
