
import * as React from "react"
import { ArrowDownCircle, Contact } from 'lucide-react'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { mainnet, optimismSepolia, unichainSepolia } from 'viem/chains'
import { createPublicClient, createWalletClient, custom, encodePacked, erc20Abi, http } from "viem"
import {ethers, providers} from "ethers"
import Image from "next/image"
import { getOnrampBuyUrl } from "@coinbase/onchainkit/fund"
import { parseAbi } from 'viem'

const bridgeAbi = parseAbi([
  'function bridge(address bridgeTokenAddr, uint256 amount)'
])

const tokens = [
  { symbol: "ETH", name: "Ethereum", icon: "/base.webp" },
  { symbol: "USDC", name: "USD Coin", icon: "/usdc.png" },
  { symbol: "OP", name: "Optimism", icon: "/op.png" },
]

const chains = [
  {name: "optimismSepolia", icon: "/base.webp"},
  {name: "base", icon: "/base.webp"},
  {name: "mainnet", icon: "/unichain.png"},
]

const routerAddress = "0x2938"
const projectId = 'd84050bf-b3b1-4df8-81bd-af7f01110c80';
const opDai = "0x3C2E47b89633738454C499118E4a79cF78C4Ea68"
const uniWEth = "0x27d1C35Dc5672dFa6d6c9CAD35C0B29298377202"
const uniDai = "0x3C2E47b89633738454C499118E4a79cF78C4Ea68"
const poolManager = "0x294FC2d876e80C8c99622613A20a64Bd8e487621"
const hooksContract = "0x2D2486a99184d55dAdf2968A780A85680c798040"
const unlocker = "0x7337c2E8FA0210Db4E9BD70c1b3552911597a85f"

interface SwapParams {
  targetSendId: number,
  to: string,
  amount: number
}

async function executeSwap(fromAmount: string) {
  try {
  if (!fromAmount || isNaN(Number(fromAmount))) {
    console.error('Invalid amount');
    return;
  }

  const client = createWalletClient({
    chain: optimismSepolia,
    transport: custom((window as any).ethereum!)
  })


  await client.switchChain({
    id: optimismSepolia.id
  })

  const sendAmountInFormat = BigInt(String(ethers.utils.parseEther(fromAmount)));

  const publicClient = createPublicClient({
    chain: optimismSepolia,
    transport: http()
  })

  //approve process
  
  const [account] = await client.getAddresses()

  console.log(account, await publicClient.getBlockNumber())

  // send token via layer0
  const { request: sendOFT } = await publicClient.simulateContract({
    address: opDai,
    abi: bridgeAbi,
    functionName: 'bridge',
    args: [account, sendAmountInFormat],
    account
  })

  const hash = await client.writeContract(sendOFT)

  await client.switchChain({
    id: unichainSepolia.id
  })

  const publicClientUni = createPublicClient({
    chain: unichainSepolia,
    transport: http()
  })

  console.log('--------- HELLOWORLD ---------');

  const {request: unLockReq} = await publicClientUni.simulateContract({
    address: unlocker,
    abi: parseAbi(['function unlockCallback(bytes calldata data) external returns (bytes)']),
    functionName: "unlockCallback",
    args: ["" as `0x{string}`],
    account
  })

  await client.writeContract(unLockReq)

    const {request: swapReq} = await publicClientUni.simulateContract({
    address: poolManager,
    abi: getSwapABI(),
    functionName: "swap",
    args: [
      {
        // PoolKey
        currency0: uniDai, // dau
        currency1: uniWEth, // eth
        fee: 3000,         // 0.3%
        tickSpacing: 60,   // tickSpacingの値
        hooks: hooksContract    // hooksコントラクトのアドレス
      },
      {
        zeroForOne: true,  // token0 -> token1の方向の場合true
        amountSpecified: BigInt(String(ethers.utils.parseEther(String(0.0002)))), // スワップ量（整数値にBigInt表記）
        sqrtPriceLimitX96:BigInt(4357548938284538567644917268480)
      },
      encodePacked(['uint256', "address"], [BigInt(publicClientUni.chain.id), account])
    ],
    account
  })

  await client.writeContract(swapReq)

  console.log('Helloworld', hash)
} catch(e) {
  console.log(e);
}

  // // swap unichain
  // const {request: approveReq} = await publicClient.simulateContract({
  //   address: "0x3C2E47b89633738454C499118E4a79cF78C4Ea68",
  //   abi: erc20Abi,
  //   functionName: "approve",
  //   args: ["0x294FC2d876e80C8c99622613A20a64Bd8e487621", sendAmountInFormat],
  //   account
  // })

  // await client.writeContract(approveReq)


}

export default function Component() {
  const [fromAmount, setFromAmount] = React.useState("10000")
  const [toAmount, setToAmount] = React.useState("0.0")
  const [fromChain, setFromChain] = React.useState(chains[0])
  const [toChain, setToChain] = React.useState(chains[1])
  const [fromToken, setFromToken] = React.useState(tokens[0])
  const [toToken, setToToken] = React.useState(tokens[2])
  const [txHash, setTxHash] =  React.useState("")
  const [onrampUrl, setOnramp] = React.useState("")

  React.useEffect(() => {
    (async() => {
      console.log("HELLOWORLC")
      const client = createWalletClient({
        chain: optimismSepolia,
        transport: custom((window as any).ethereum!)
      })
    
      const publicClient = createPublicClient({
        chain: optimismSepolia,
        transport: http()
      })

      const [account] = await client.getAddresses()
      const onrampBuyUrl = getOnrampBuyUrl({
        projectId,
        addresses: { [account]: ['base'] },
        assets: ['USDC'],
        presetFiatAmount: 20,
        fiatCurrency: 'USD'
      });
  
      console.log(onrampBuyUrl);
      setOnramp(onrampBuyUrl)
    })()
  },[])

  const handleSwap = async () => {
    try {
      console.log('SeND', fromAmount)
      await executeSwap(fromAmount);
    } catch (error) {
      console.error('Swap failed:', error);
    }
  };

  return (
    <div className="min-h-screen bg-black flex items-center justify-center">
      <div className="w-[477px] h-[403px] bg-[#222222] rounded-[36px] p-4 relative shadow-[0px_14px_22px_0px_rgba(255,0,200,0.03)]">
        <div className="space-y-0 relative">
          {/* From Chain Box */}
          <div className="w-[445px] h-[139px] bg-[#323232] rounded-[36px] p-4 shadow-[0px_4px_22px_0px_rgba(0,0,0,0.07)] mb-2">
            <div className="flex items-center gap-2 mb-4">
              <span className="text-gray-400">from</span>
              <Select
                value={fromChain.name}
                onValueChange={(value) => setFromChain(chains.find(c => c.name === value) || chains[0])}
              >
                <SelectTrigger className="w-[120px] bg-transparent text-white">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent className="bg-[#444444] border-none">
                  {chains.map((chain) => (
                    <SelectItem key={chain.name} value={chain.name} className="text-white hover:bg-[#555555]">
                      <div className="flex items-center gap-2">
                        <Image src={chain.icon} alt={chain.name} width={20} height={20} />
                        <span>{chain.name}</span>
                      </div>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="flex items-center justify-between">
              <input
                type="text"
                value={fromAmount}
                onChange={(e) => setFromAmount(e.target.value)}
                className="bg-transparent text-4xl text-white outline-none w-full"
              />
              <Select
                value={fromToken.symbol}
                onValueChange={(value) => setFromToken(tokens.find(t => t.symbol === value) || tokens[0])}
              >
                <SelectTrigger className="w-[80px] bg-transparent border border-gray-600 text-white px-2 py-1 rounded-full">
                  <div className="flex items-center gap-1">
                    <Image src={fromToken.icon} alt={fromToken.name} width={20} height={20} />
                    <span className="text-sm">{fromToken.symbol.toLowerCase()}</span>
                  </div>
                </SelectTrigger>
                <SelectContent className="bg-[#444444] border-none">
                  {tokens.map((token) => (
                    <SelectItem key={token.symbol} value={token.symbol} className="text-white hover:bg-[#555555]">
                      <div className="flex items-center gap-2">
                        <Image src={token.icon} alt={token.name} width={20} height={20} />
                        <span>{token.symbol}</span>
                      </div>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          {/* Swap Button */}
          <div className="absolute left-1/2 top-1/2 transform -translate-x-1/2 -translate-y-1/2 z-10">
            <button className="w-[57px] h-[57px] rounded-full bg-[#FF30B0] flex items-center justify-center hover:bg-[#F615B9] transition-colors">
              <ArrowDownCircle className="w-6 h-6 text-white" />
            </button>
          </div>

          {/* To Token Box */}
          <div className="w-[445px] h-[139px] bg-[#323232] rounded-[36px] p-4 shadow-[0px_4px_22px_0px_rgba(0,0,0,0.07)] mt-2">
            <div className="flex items-center gap-2 mb-4">
              <span className="text-gray-400">to</span>
              <Select
                value={toChain.name}
                onValueChange={(value) => setToChain(chains.find(c => c.name === value) || chains[1])}
              >
                <SelectTrigger className="w-[120px] bg-transparent border border-gray-600 text-white">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent className="bg-[#444444] border-none">
                  {chains.map((chain) => (
                    <SelectItem key={chain.name} value={chain.name} className="text-white hover:bg-[#555555]">
                      <div className="flex items-center gap-2">
                        <Image src={chain.icon} alt={chain.name} width={20} height={20} />
                        <span>{chain.name}</span>
                      </div>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="flex items-center justify-between">
              <input
                type="text"
                value={toAmount}
                onChange={(e) => setToAmount(e.target.value)}
                className="bg-transparent text-4xl text-white outline-none w-full"
              />
              <Select
                value={toToken.symbol}
                onValueChange={(value) => setToToken(tokens.find(t => t.symbol === value) || tokens[2])}
              >
                <SelectTrigger className="w-[80px] bg-transparent border border-gray-600 text-white px-2 py-1 rounded-full">
                  <div className="flex items-center gap-1">
                    <Image src={toToken.icon} alt={toToken.name} width={20} height={20} />
                    <span className="text-sm">{toToken.symbol.toLowerCase()}</span>
                  </div>
                </SelectTrigger>
                <SelectContent className="bg-[#444444] border-none">
                  {tokens.map((token) => (
                    <SelectItem key={token.symbol} value={token.symbol} className="text-white hover:bg-[#555555]">
                      <div className="flex items-center gap-2">
                        <Image src={token.icon} alt={token.name} width={20} height={20} />
                        <span>{token.symbol}</span>
                      </div>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
        </div>

        {/* Swap Action Button */}
        <button 
          onClick={handleSwap} 
          className="w-[401px] h-[59px] bg-[#FF30B0] hover:bg-[#F615B9] transition-colors rounded-[32px] text-white font-['DotGothic16'] text-base mt-4 mx-auto block border border-[#F615B9] shadow-[0px_4px_22px_0px_rgba(0,0,0,0.07)]"
        >
          swap
        </button>
      </div>
    </div>
  )
}

function getSwapABI ()  {
  const poolManagerABI = [
    {
      "name": "swap",
      "type": "function",
      "inputs": [
        {
          "name": "key",
          "type": "tuple",
          "components": [
            { "name": "currency0", "type": "address" },
            { "name": "currency1", "type": "address" },
            { "name": "fee", "type": "uint24" },
            { "name": "tickSpacing", "type": "int24" },
            { "name": "hooks", "type": "address" }
          ]
        },
        {
          "name": "params",
          "type": "tuple",
          "components": [
            { "name": "zeroForOne", "type": "bool" },
            { "name": "amountSpecified", "type": "int256" },
            { "name": "sqrtPriceLimitX96", "type": "uint160" }
          ]
        },
        {
          "name": "hookData",
          "type": "bytes"
        }
      ],
      "outputs": [],
      "stateMutability": "nonpayable"
    },
    {
      "type": "error",
      "name": "AlreadyUnlocked",
      "inputs": []
    },
    {
      "type": "error",
      "name": "CurrenciesOutOfOrderOrEqual",
      "inputs": [
        {
          "name": "currency0",
          "type": "address",
          "internalType": "address"
        },
        {
          "name": "currency1",
          "type": "address",
          "internalType": "address"
        }
      ]
    },
    {
      "type": "error",
      "name": "CurrencyNotSettled",
      "inputs": []
    },
    {
      "type": "error",
      "name": "DelegateCallNotAllowed",
      "inputs": []
    },
    {
      "type": "error",
      "name": "InvalidCaller",
      "inputs": []
    },
    {
      "type": "error",
      "name": "ManagerLocked",
      "inputs": []
    },
    {
      "type": "error",
      "name": "MustClearExactPositiveDelta",
      "inputs": []
    },
    {
      "type": "error",
      "name": "NonzeroNativeValue",
      "inputs": []
    },
    {
      "type": "error",
      "name": "PoolNotInitialized",
      "inputs": []
    },
    {
      "type": "error",
      "name": "ProtocolFeeCurrencySynced",
      "inputs": []
    },
    {
      "type": "error",
      "name": "ProtocolFeeTooLarge",
      "inputs": [
        {
          "name": "fee",
          "type": "uint24",
          "internalType": "uint24"
        }
      ]
    },
    {
      "type": "error",
      "name": "SwapAmountCannotBeZero",
      "inputs": []
    },
    {
      "type": "error",
      "name": "TickSpacingTooLarge",
      "inputs": [
        {
          "name": "tickSpacing",
          "type": "int24",
          "internalType": "int24"
        }
      ]
    },
    {
      "type": "error",
      "name": "TickSpacingTooSmall",
      "inputs": [
        {
          "name": "tickSpacing",
          "type": "int24",
          "internalType": "int24"
        }
      ]
    },
    {
      "type": "error",
      "name": "UnauthorizedDynamicLPFeeUpdate",
      "inputs": []
    }
  ] as const;
  return poolManagerABI;  
}


function getHooksABI () {
  return (
    [
      {
        "inputs": [
          {
            "internalType": "address",
            "name": "sender",
            "type": "address"
          },
          {
            "internalType": "uint256",
            "name": "amount0",
            "type": "uint256"
          },
          {
            "internalType": "uint256",
            "name": "amount1",
            "type": "uint256"
          }
        ],
        "name": "afterAddLiquidity",
        "outputs": [
          {
            "internalType": "bytes4",
            "name": "",
            "type": "bytes4"
          }
        ],
        "stateMutability": "nonpayable",
        "type": "function"
      },
      {
        "inputs": [
          {
            "internalType": "address",
            "name": "sender",
            "type": "address"
          },
          {
            "internalType": "uint160",
            "name": "sqrtPriceX96",
            "type": "uint160"
          }
        ],
        "name": "afterInitialize",
        "outputs": [
          {
            "internalType": "bytes4",
            "name": "",
            "type": "bytes4"
          }
        ],
        "stateMutability": "nonpayable",
        "type": "function"
      },
      {
        "inputs": [
          {
            "internalType": "address",
            "name": "sender",
            "type": "address"
          },
          {
            "internalType": "uint256",
            "name": "amount0",
            "type": "uint256"
          },
          {
            "internalType": "uint256",
            "name": "amount1",
            "type": "uint256"
          }
        ],
        "name": "afterRemoveLiquidity",
        "outputs": [
          {
            "internalType": "bytes4",
            "name": "",
            "type": "bytes4"
          }
        ],
        "stateMutability": "nonpayable",
        "type": "function"
      },
      {
        "inputs": [
          {
            "internalType": "address",
            "name": "sender",
            "type": "address"
          },
          {
            "internalType": "address",
            "name": "recipient",
            "type": "address"
          },
          {
            "internalType": "bool",
            "name": "zeroForOne",
            "type": "bool"
          },
          {
            "internalType": "uint256",
            "name": "amountSpecified",
            "type": "uint256"
          },
          {
            "internalType": "uint160",
            "name": "sqrtPriceLimitX96",
            "type": "uint160"
          }
        ],
        "name": "afterSwap",
        "outputs": [
          {
            "internalType": "bytes4",
            "name": "",
            "type": "bytes4"
          }
        ],
        "stateMutability": "nonpayable",
        "type": "function"
      },
      {
        "inputs": [
          {
            "internalType": "address",
            "name": "sender",
            "type": "address"
          },
          {
            "internalType": "uint256",
            "name": "amount0",
            "type": "uint256"
          },
          {
            "internalType": "uint256",
            "name": "amount1",
            "type": "uint256"
          }
        ],
        "name": "beforeAddLiquidity",
        "outputs": [
          {
            "internalType": "bytes4",
            "name": "",
            "type": "bytes4"
          }
        ],
        "stateMutability": "nonpayable",
        "type": "function"
      },
      {
        "inputs": [
          {
            "internalType": "address",
            "name": "sender",
            "type": "address"
          },
          {
            "internalType": "uint160",
            "name": "sqrtPriceX96",
            "type": "uint160"
          }
        ],
        "name": "beforeInitialize",
        "outputs": [
          {
            "internalType": "bytes4",
            "name": "",
            "type": "bytes4"
          }
        ],
        "stateMutability": "nonpayable",
        "type": "function"
      },
      {
        "inputs": [
          {
            "internalType": "address",
            "name": "sender",
            "type": "address"
          },
          {
            "internalType": "uint256",
            "name": "amount0",
            "type": "uint256"
          },
          {
            "internalType": "uint256",
            "name": "amount1",
            "type": "uint256"
          }
        ],
        "name": "beforeRemoveLiquidity",
        "outputs": [
          {
            "internalType": "bytes4",
            "name": "",
            "type": "bytes4"
          }
        ],
        "stateMutability": "nonpayable",
        "type": "function"
      },
      {
        "inputs": [
          {
            "internalType": "address",
            "name": "sender",
            "type": "address"
          },
          {
            "internalType": "address",
            "name": "recipient",
            "type": "address"
          },
          {
            "internalType": "bool",
            "name": "zeroForOne",
            "type": "bool"
          },
          {
            "internalType": "uint256",
            "name": "amountSpecified",
            "type": "uint256"
          },
          {
            "internalType": "uint160",
            "name": "sqrtPriceLimitX96",
            "type": "uint160"
          }
        ],
        "name": "beforeSwap",
        "outputs": [
          {
            "internalType": "bytes4",
            "name": "",
            "type": "bytes4"
          }
        ],
        "stateMutability": "nonpayable",
        "type": "function"
      }
    ]
  )
}
