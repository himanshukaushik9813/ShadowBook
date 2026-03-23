export const shadowBookAbi = [
  {
    type: 'function',
    name: 'placeOrder',
    stateMutability: 'nonpayable',
    inputs: [
      {
        name: 'encryptedPrice',
        type: 'tuple',
        internalType: 'struct InEuint32',
        components: [
          { name: 'ctHash', type: 'uint256', internalType: 'uint256' },
          { name: 'securityZone', type: 'uint8', internalType: 'uint8' },
          { name: 'utype', type: 'uint8', internalType: 'uint8' },
          { name: 'signature', type: 'bytes', internalType: 'bytes' }
        ]
      },
      {
        name: 'encryptedAmount',
        type: 'tuple',
        internalType: 'struct InEuint32',
        components: [
          { name: 'ctHash', type: 'uint256', internalType: 'uint256' },
          { name: 'securityZone', type: 'uint8', internalType: 'uint8' },
          { name: 'utype', type: 'uint8', internalType: 'uint8' },
          { name: 'signature', type: 'bytes', internalType: 'bytes' }
        ]
      },
      { name: 'isBuy', type: 'bool', internalType: 'bool' }
    ],
    outputs: [{ name: 'orderId', type: 'uint256', internalType: 'uint256' }]
  },
  {
    type: 'function',
    name: 'getOrderResult',
    stateMutability: 'view',
    inputs: [{ name: 'orderId', type: 'uint256', internalType: 'uint256' }],
    outputs: [
      {
        name: 'encryptedExecutionPrice',
        type: 'bytes32',
        internalType: 'bytes32'
      },
      {
        name: 'encryptedFillStatus',
        type: 'bytes32',
        internalType: 'bytes32'
      }
    ]
  },
  {
    type: 'function',
    name: 'getLatestOrderIdForTrader',
    stateMutability: 'view',
    inputs: [{ name: 'trader', type: 'address', internalType: 'address' }],
    outputs: [{ name: '', type: 'uint256', internalType: 'uint256' }]
  },
  {
    type: 'function',
    name: 'getOrderCount',
    stateMutability: 'view',
    inputs: [],
    outputs: [{ name: '', type: 'uint256', internalType: 'uint256' }]
  },
  {
    type: 'event',
    name: 'OrderPlaced',
    anonymous: false,
    inputs: [
      {
        name: 'orderId',
        type: 'uint256',
        indexed: true,
        internalType: 'uint256'
      },
      {
        name: 'owner',
        type: 'address',
        indexed: true,
        internalType: 'address'
      },
      {
        name: 'isBuy',
        type: 'bool',
        indexed: false,
        internalType: 'bool'
      },
      {
        name: 'encryptedPrice',
        type: 'bytes32',
        indexed: false,
        internalType: 'bytes32'
      },
      {
        name: 'encryptedAmount',
        type: 'bytes32',
        indexed: false,
        internalType: 'bytes32'
      }
    ]
  },
  {
    type: 'event',
    name: 'OrderMatched',
    anonymous: false,
    inputs: [
      {
        name: 'orderId',
        type: 'uint256',
        indexed: true,
        internalType: 'uint256'
      },
      {
        name: 'encryptedExecutionPrice',
        type: 'bytes32',
        indexed: false,
        internalType: 'bytes32'
      },
      {
        name: 'encryptedFillStatus',
        type: 'bytes32',
        indexed: false,
        internalType: 'bytes32'
      },
      {
        name: 'timestamp',
        type: 'uint256',
        indexed: false,
        internalType: 'uint256'
      }
    ]
  }
];
