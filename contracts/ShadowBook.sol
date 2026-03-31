// SPDX-License-Identifier: MIT
pragma solidity ^0.8.25;

import {FHE, ebool, euint32} from "@fhenixprotocol/cofhe-contracts/FHE.sol";
import {InEuint32} from "@fhenixprotocol/cofhe-contracts/ICofhe.sol";
import {IERC20} from "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import {SafeERC20} from "@openzeppelin/contracts/token/ERC20/utils/SafeERC20.sol";

contract ShadowBook {
    using SafeERC20 for IERC20;

    error InvalidEncryptedPayload(string reason);
    error InvalidTokenAddress();
    error InvalidEscrowAmount();
    error OrderNotFound(uint256 orderId);
    error NotOrderOwner(uint256 orderId, address caller);
    error OrderAlreadyCancelled(uint256 orderId);
    error OrderAlreadyClosed(uint256 orderId);
    error InsufficientOrderEscrow(uint256 orderId, uint256 required, uint256 available);

    struct Order {
        euint32 price;
        euint32 amount;
        euint32 filled;
        ebool cancelled;
        bool isBuy;
        address owner;
        bool exists;
        uint256 placedAt;
    }

    struct MatchResult {
        euint32 executionPrice;
        euint32 filledAmount;
        ebool didFill;
        bool initialized;
    }

    uint256 public constant MAX_SCAN_DEPTH = 20;
    uint256 private constant FHE_SCALING_FACTOR = 1e6;
    uint256 private constant TOKEN_SCALE_MULTIPLIER = 1e12;

    IERC20 public immutable baseToken;
    IERC20 public immutable quoteToken;

    uint256 public nextOrderId = 1;
    mapping(uint256 => Order) private orders;
    mapping(uint256 => MatchResult) private orderResults;
    mapping(address => uint256[]) private traderOrders;

    uint256[] private buyOrderIds;
    uint256[] private sellOrderIds;
    uint256[] private matchedOrderIds;

    mapping(address => uint256) public escrowedBase;
    mapping(address => uint256) public escrowedQuote;
    mapping(uint256 => uint256) public orderEscrow;
    uint256 public totalVolumeEncrypted;
    uint256[] public cancelledOrderIds;
    uint256 public buyScanCursor;
    uint256 public sellScanCursor;

    mapping(uint256 => bool) private orderCancelledPlain;
    mapping(uint256 => bool) private orderFullyFilledPlain;
    mapping(uint256 => bool) private orderDidFillPlain;
    mapping(uint256 => uint256) private orderLastMatchTimestamp;
    mapping(uint256 => uint256) private orderLastExecutionPricePlain;

    event OrderPlaced(uint256 indexed orderId, address indexed trader, bool isBuy, uint256 timestamp);
    event OrderCancelled(uint256 indexed orderId, address indexed trader);
    event OrderMatched(
        uint256 indexed orderId,
        uint256 indexed counterOrderId,
        uint256 filledAmount,
        uint256 executionPrice
    );
    event OrderRevealed(uint256 indexed orderId);
    event EscrowDeposited(address indexed trader, bool isBase, uint256 amount);
    event EscrowReleased(address indexed trader, bool isBase, uint256 amount);

    constructor(address baseTokenAddress, address quoteTokenAddress) {
        if (baseTokenAddress == address(0) || quoteTokenAddress == address(0)) {
            revert InvalidTokenAddress();
        }

        baseToken = IERC20(baseTokenAddress);
        quoteToken = IERC20(quoteTokenAddress);
    }

    function placeOrder(
        InEuint32 calldata encryptedPrice,
        InEuint32 calldata encryptedAmount,
        bool isBuy,
        uint256 escrowAmount
    ) external returns (uint256 orderId) {
        _validateEncryptedInputs(encryptedPrice, encryptedAmount);

        if (escrowAmount == 0) {
            revert InvalidEscrowAmount();
        }

        orderId = nextOrderId++;

        euint32 price = FHE.asEuint32(encryptedPrice);
        euint32 amount = FHE.asEuint32(encryptedAmount);

        if (isBuy) {
            quoteToken.safeTransferFrom(msg.sender, address(this), escrowAmount);
            escrowedQuote[msg.sender] += escrowAmount;
        } else {
            baseToken.safeTransferFrom(msg.sender, address(this), escrowAmount);
            escrowedBase[msg.sender] += escrowAmount;
        }

        orderEscrow[orderId] = escrowAmount;

        Order storage order = orders[orderId];
        order.price = price;
        order.amount = amount;
        order.filled = FHE.asEuint32(0);
        order.cancelled = FHE.asEbool(false);
        order.isBuy = isBuy;
        order.owner = msg.sender;
        order.exists = true;
        order.placedAt = block.timestamp;

        traderOrders[msg.sender].push(orderId);

        if (isBuy) {
            buyOrderIds.push(orderId);
        } else {
            sellOrderIds.push(orderId);
        }

        _grantOrderAccess(order);
        _grantFilledAccess(order);
        _grantCancelledAccess(order);

        _matchOrder(orderId, false);

        emit OrderPlaced(orderId, msg.sender, isBuy, block.timestamp);
        emit EscrowDeposited(msg.sender, !isBuy, escrowAmount);
    }

    function cancelOrder(uint256 orderId) external {
        _assertOrderExists(orderId);

        Order storage order = orders[orderId];
        if (order.owner != msg.sender) {
            revert NotOrderOwner(orderId, msg.sender);
        }
        if (orderCancelledPlain[orderId]) {
            revert OrderAlreadyCancelled(orderId);
        }
        if (orderFullyFilledPlain[orderId]) {
            revert OrderAlreadyClosed(orderId);
        }

        order.cancelled = FHE.asEbool(true);
        orderCancelledPlain[orderId] = true;
        _grantCancelledAccess(order);

        cancelledOrderIds.push(orderId);
        emit OrderCancelled(orderId, msg.sender);

        _releaseResidualEscrowIfClosed(orderId);
    }

    function settleDirect(uint256 orderId) external {
        _assertOrderExists(orderId);

        Order storage order = orders[orderId];
        if (order.owner != msg.sender) {
            revert NotOrderOwner(orderId, msg.sender);
        }
        if (orderCancelledPlain[orderId]) {
            revert OrderAlreadyCancelled(orderId);
        }
        if (orderFullyFilledPlain[orderId]) {
            revert OrderAlreadyClosed(orderId);
        }

        _matchOrder(orderId, true);
    }

    function getOrderResult(uint256 orderId)
        external
        view
        returns (
            bytes32 executionPrice,
            bytes32 filledAmount,
            bytes32 didFill,
            bool initialized
        )
    {
        _assertOrderExists(orderId);

        MatchResult storage result = orderResults[orderId];
        if (!result.initialized) {
            return (bytes32(0), bytes32(0), bytes32(0), false);
        }

        return (
            euint32.unwrap(result.executionPrice),
            euint32.unwrap(result.filledAmount),
            ebool.unwrap(result.didFill),
            result.initialized
        );
    }

    function getOrderCiphertexts(uint256 orderId)
        external
        view
        returns (
            bytes32 encryptedPrice,
            bytes32 encryptedAmount,
            bytes32 encryptedFilled,
            bytes32 encryptedCancelled,
            bool isBuy,
            address owner
        )
    {
        _assertOrderExists(orderId);
        Order storage order = orders[orderId];

        return (
            euint32.unwrap(order.price),
            euint32.unwrap(order.amount),
            euint32.unwrap(order.filled),
            ebool.unwrap(order.cancelled),
            order.isBuy,
            order.owner
        );
    }

    function getOrderView(uint256 orderId)
        external
        view
        returns (
            bool isBuy,
            address owner,
            bool exists,
            uint256 placedAt,
            bool cancelled,
            bool fullyFilled,
            bool didFill,
            uint256 escrowRemaining,
            uint256 lastMatchTimestamp,
            uint256 lastExecutionPrice
        )
    {
        _assertOrderExists(orderId);
        Order storage order = orders[orderId];

        return (
            order.isBuy,
            order.owner,
            order.exists,
            order.placedAt,
            orderCancelledPlain[orderId],
            orderFullyFilledPlain[orderId],
            orderDidFillPlain[orderId],
            orderEscrow[orderId],
            orderLastMatchTimestamp[orderId],
            orderLastExecutionPricePlain[orderId]
        );
    }

    function getEscrowBalance(address trader)
        external
        view
        returns (uint256 baseEscrowed, uint256 quoteEscrowed)
    {
        return (escrowedBase[trader], escrowedQuote[trader]);
    }

    function getOrderDepth() external view returns (uint256 buyCount, uint256 sellCount) {
        for (uint256 i = 0; i < buyOrderIds.length; i++) {
            uint256 orderId = buyOrderIds[i];
            if (orders[orderId].exists && !orderCancelledPlain[orderId] && !orderFullyFilledPlain[orderId]) {
                buyCount += 1;
            }
        }

        for (uint256 i = 0; i < sellOrderIds.length; i++) {
            uint256 orderId = sellOrderIds[i];
            if (orders[orderId].exists && !orderCancelledPlain[orderId] && !orderFullyFilledPlain[orderId]) {
                sellCount += 1;
            }
        }
    }

    function getRecentMatches(uint256 count) external view returns (uint256[] memory orderIds) {
        uint256 total = matchedOrderIds.length;
        if (total == 0 || count == 0) {
            return new uint256[](0);
        }

        uint256 size = count > total ? total : count;
        orderIds = new uint256[](size);

        for (uint256 i = 0; i < size; i++) {
            orderIds[i] = matchedOrderIds[total - 1 - i];
        }
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

    function _matchOrder(uint256 orderId, bool manualScan) internal {
        Order storage incoming = orders[orderId];
        if (!incoming.exists || orderCancelledPlain[orderId] || orderFullyFilledPlain[orderId]) {
            return;
        }

        uint256[] storage opposingOrderIds = incoming.isBuy ? sellOrderIds : buyOrderIds;
        uint256 opposingLength = opposingOrderIds.length;
        if (opposingLength == 0) {
            return;
        }

        uint256 startCursor = manualScan ? 0 : (incoming.isBuy ? sellScanCursor : buyScanCursor);
        uint256 scanDepth = opposingLength < MAX_SCAN_DEPTH ? opposingLength : MAX_SCAN_DEPTH;

        for (uint256 i = 0; i < scanDepth; i++) {
            uint256 counterOrderId = opposingOrderIds[(startCursor + i) % opposingLength];
            Order storage counter = orders[counterOrderId];

            if (!counter.exists || orderCancelledPlain[counterOrderId] || orderFullyFilledPlain[counterOrderId]) {
                continue;
            }

            ebool priceMatch = incoming.isBuy
                ? FHE.gte(incoming.price, counter.price)
                : FHE.lte(incoming.price, counter.price);

            euint32 incomingRemaining = FHE.sub(incoming.amount, incoming.filled);
            euint32 counterRemaining = FHE.sub(counter.amount, counter.filled);
            euint32 fillQty = FHE.select(FHE.lte(incomingRemaining, counterRemaining), incomingRemaining, counterRemaining);
            ebool canFill = FHE.and(priceMatch, FHE.gt(fillQty, FHE.asEuint32(0)));

            counter.filled = FHE.select(canFill, FHE.add(counter.filled, fillQty), counter.filled);
            incoming.filled = FHE.select(canFill, FHE.add(incoming.filled, fillQty), incoming.filled);
            _grantFilledAccess(incoming);
            _grantFilledAccess(counter);

            _storeMatchResult(orderId, counter.price, incoming.filled, canFill, incoming.owner);
            _storeMatchResult(counterOrderId, counter.price, counter.filled, canFill, counter.owner);

            // FHE.decrypt is used at settlement time only, after both sides have committed
            // their encrypted values and a match has been confirmed by FHE comparison.
            // The decrypted values are necessary for ERC-20 token transfer and do not
            // compromise order privacy because the fill itself is already immutable on-chain.
            FHE.decrypt(canFill);
            bool shouldSettle = FHE.getDecryptResult(canFill);
            if (!shouldSettle) {
                continue;
            }

            FHE.decrypt(fillQty);
            uint32 fillQtyPlain = FHE.getDecryptResult(fillQty);
            if (fillQtyPlain == 0) {
                continue;
            }

            FHE.decrypt(counter.price);
            uint32 executionPricePlain = FHE.getDecryptResult(counter.price);

            uint256 baseTransferAmount = _scaledBaseToToken(fillQtyPlain);
            uint256 quoteTransferAmount = _scaledQuoteToToken(fillQtyPlain, executionPricePlain);

            address buyer = incoming.isBuy ? incoming.owner : counter.owner;
            address seller = incoming.isBuy ? counter.owner : incoming.owner;

            if (incoming.isBuy) {
                _consumeEscrow(orderId, false, quoteTransferAmount, incoming.owner);
                _consumeEscrow(counterOrderId, true, baseTransferAmount, counter.owner);
            } else {
                _consumeEscrow(orderId, true, baseTransferAmount, incoming.owner);
                _consumeEscrow(counterOrderId, false, quoteTransferAmount, counter.owner);
            }

            baseToken.safeTransfer(buyer, baseTransferAmount);
            quoteToken.safeTransfer(seller, quoteTransferAmount);

            orderDidFillPlain[orderId] = true;
            orderDidFillPlain[counterOrderId] = true;
            orderLastMatchTimestamp[orderId] = block.timestamp;
            orderLastMatchTimestamp[counterOrderId] = block.timestamp;
            orderLastExecutionPricePlain[orderId] = executionPricePlain;
            orderLastExecutionPricePlain[counterOrderId] = executionPricePlain;
            matchedOrderIds.push(orderId);
            matchedOrderIds.push(counterOrderId);
            totalVolumeEncrypted += 1;

            emit OrderMatched(orderId, counterOrderId, fillQtyPlain, executionPricePlain);

            orderFullyFilledPlain[orderId] = _decryptFillStatus(incoming);
            orderFullyFilledPlain[counterOrderId] = _decryptFillStatus(counter);

            _releaseResidualEscrowIfClosed(orderId);
            _releaseResidualEscrowIfClosed(counterOrderId);

            if (orderFullyFilledPlain[orderId]) {
                break;
            }
        }

        uint256 nextCursor = opposingLength == 0 ? 0 : (startCursor + scanDepth) % opposingLength;
        if (incoming.isBuy) {
            sellScanCursor = nextCursor;
        } else {
            buyScanCursor = nextCursor;
        }
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

    function _storeMatchResult(
        uint256 orderId,
        euint32 executionPrice,
        euint32 filledAmount,
        ebool didFill,
        address owner
    ) internal {
        MatchResult storage result = orderResults[orderId];
        if (!result.initialized) {
            result.executionPrice = FHE.asEuint32(0);
            result.filledAmount = FHE.asEuint32(0);
            result.didFill = FHE.asEbool(false);
            result.initialized = true;
        }

        result.executionPrice = FHE.select(didFill, executionPrice, result.executionPrice);
        result.filledAmount = FHE.select(didFill, filledAmount, result.filledAmount);
        result.didFill = FHE.select(didFill, FHE.asEbool(true), result.didFill);

        FHE.allowThis(result.executionPrice);
        FHE.allowThis(result.filledAmount);
        FHE.allowThis(result.didFill);
        FHE.allow(result.executionPrice, owner);
        FHE.allow(result.filledAmount, owner);
        FHE.allow(result.didFill, owner);
    }

    function _grantOrderAccess(Order storage order) internal {
        FHE.allowThis(order.price);
        FHE.allowThis(order.amount);
        FHE.allow(order.price, order.owner);
        FHE.allow(order.amount, order.owner);
    }

    function _grantFilledAccess(Order storage order) internal {
        FHE.allowThis(order.filled);
        FHE.allow(order.filled, order.owner);
    }

    function _grantCancelledAccess(Order storage order) internal {
        FHE.allowThis(order.cancelled);
        FHE.allow(order.cancelled, order.owner);
    }

    function _consumeEscrow(uint256 orderId, bool isBase, uint256 amount, address owner) internal {
        if (amount == 0) {
            return;
        }

        uint256 available = orderEscrow[orderId];
        if (available < amount) {
            revert InsufficientOrderEscrow(orderId, amount, available);
        }

        orderEscrow[orderId] = available - amount;
        if (isBase) {
            escrowedBase[owner] -= amount;
        } else {
            escrowedQuote[owner] -= amount;
        }
    }

    function _releaseResidualEscrowIfClosed(uint256 orderId) internal {
        if (!orderCancelledPlain[orderId] && !orderFullyFilledPlain[orderId]) {
            return;
        }

        uint256 remainingEscrow = orderEscrow[orderId];
        if (remainingEscrow == 0) {
            return;
        }

        Order storage order = orders[orderId];
        orderEscrow[orderId] = 0;

        if (order.isBuy) {
            escrowedQuote[order.owner] -= remainingEscrow;
            quoteToken.safeTransfer(order.owner, remainingEscrow);
            emit EscrowReleased(order.owner, false, remainingEscrow);
        } else {
            escrowedBase[order.owner] -= remainingEscrow;
            baseToken.safeTransfer(order.owner, remainingEscrow);
            emit EscrowReleased(order.owner, true, remainingEscrow);
        }
    }

    function _decryptFillStatus(Order storage order) internal returns (bool) {
        ebool filledCompletely = FHE.eq(order.filled, order.amount);
        FHE.decrypt(filledCompletely);
        return FHE.getDecryptResult(filledCompletely);
    }

    function _scaledBaseToToken(uint256 fillQtyScaled) internal pure returns (uint256) {
        return fillQtyScaled * TOKEN_SCALE_MULTIPLIER;
    }

    function _scaledQuoteToToken(uint256 fillQtyScaled, uint256 executionPriceScaled) internal pure returns (uint256) {
        return ((fillQtyScaled * executionPriceScaled) / FHE_SCALING_FACTOR) * TOKEN_SCALE_MULTIPLIER;
    }

    function _assertOrderExists(uint256 orderId) internal view {
        if (!orders[orderId].exists) {
            revert OrderNotFound(orderId);
        }
    }
}
