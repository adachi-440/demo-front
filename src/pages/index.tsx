'use client'

import * as React from "react"
import { ArrowDownCircle, Loader2 } from 'lucide-react'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import Image from "next/image"
import { Toaster } from "@/components/ui/toaster"
import { useToast } from "@/hooks/use-toast"
import { FundButton, getOnrampBuyUrl } from "@coinbase/onchainkit/fund"
import { usePrivy } from "@privy-io/react-auth"

const tokens = [
  { symbol: "ETH", name: "Ethereum", icon: "/base.webp" },
  { symbol: "USDC", name: "USD Coin", icon: "/usdc.png" },
  { symbol: "OP", name: "Optimism", icon: "/op.png" },
]

const chains = [
  {name: "optimismSepolia", icon: "/op.png"},
  {name: "base", icon: "/base.webp"},
  {name: "mainnet", icon: "/unichain.png"},
]

const WalletConnectButton = () => {
  const { login, logout, authenticated, user } = usePrivy();
  
  const connectedStyle = authenticated
    ? "bg-green-600 hover:bg-green-700 hover:shadow-sm hover:shadow-green-600"
    : "bg-gradient-to-r from-red-400 to-yellow-500 hover:from-yellow-500 hover:pink";

  return (
    <button
      onClick={user ? logout : login}
      className={`
        px-2 py-1 rounded-full
        ${connectedStyle}
        text-white text-[7px] font-medium
        transition-all duration-200
        hover:shadow-lg
        flex items-center gap-2
      `}
    >
      <div className={`
        w-[6px] h-[6px] rounded-full
        ${authenticated ? 'bg-green-200' : 'bg-red-200'}
        animate-pulse
      `} />
      {user?.wallet ? user.wallet.address.slice(0, 6) + '...' + user.wallet.address.slice(-4) : 'Connect Wallet'}
    </button>
  );
};

const FoxButton = () => {
  return (
    <button
      onClick={() => console.log('Fox button clicked')}
      className="text-[20px] p-1 rounded-full bg-orange-500 hover:bg-orange-600 transition-colors"
      aria-label="Fox button"
    >
    </button>
  );
};

export default function Component() {
  const { toast } = useToast()
  const [fromAmount, setFromAmount] = React.useState("10000")
  const [toAmount, setToAmount] = React.useState("0.0")
  const [fromChain, setFromChain] = React.useState(chains[0])
  const [toChain, setToChain] = React.useState(chains[1])
  const [fromToken, setFromToken] = React.useState(tokens[0])
  const [toToken, setToToken] = React.useState(tokens[2])
  const [isLoading, setIsLoading] = React.useState(false)
  const [showSuccessModal, setShowSuccessModal] = React.useState(false)
  const [url, setUrl] = React.useState("")

  React.useEffect(() => {
    // Simple calculation for demonstration purposes
    const calculatedAmount = parseFloat(fromAmount) * 0.95 // Assuming 5% fee
    setToAmount(calculatedAmount.toFixed(2))
  }, [fromAmount])

  React.useEffect(() => {
    const projectId = '7a5c4085-9ba6-487b-8db3-e495c6afc1f5';

    const onrampBuyUrl = getOnrampBuyUrl({
      projectId,
      addresses: { ["0x1B9203Eeb68EF5fe62Ad38f0E4d22990687E6585"]: ['base'] },
      assets: ['USDC'],
      presetFiatAmount: 20,
      fiatCurrency: 'USD'
    });
    setUrl(onrampBuyUrl)
  },[])

  const handleSwap = async () => {
    try {
      setIsLoading(true)
      console.log('Sending', fromAmount)
      await executeSwap(fromAmount)
    } catch (error) {
      console.error('Swap failed:', error)
      toast({
        title: "Swap Failed",
        description: "An error occurred during the swap process.",
        variant: "destructive",
      })
    } finally {
      setIsLoading(false)
    }
  }

  async function executeSwap(fromAmount: string) {
    console.log('Executing swap with amount:', fromAmount)
    
    // Simulate a delay for the swap process
    await new Promise(resolve => setTimeout(resolve, 5000))
    
    setShowSuccessModal(true)
  }

  const Ramp = () => {
    return (

        <FundButton fundingUrl={url}/>
    )
  }

  return (
    <div className="min-h-screen bg-black flex items-center justify-center relative">
      {/* Fixed Ramp component and WalletConnect button */}
      <div className="fixed top-4 right-4 z-50 flex items-center gap-2">
        {/* <FoxButton /> */}
        <WalletConnectButton />
        <Ramp />
      </div>

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
                readOnly
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
          disabled={isLoading}
          className="w-[401px] h-[59px] bg-[#FF30B0] hover:bg-[#F615B9] transition-colors rounded-[32px] text-white font-['DotGothic16'] text-base mt-4 mx-auto block border border-[#F615B9] shadow-[0px_4px_22px_0px_rgba(0,0,0,0.07)] disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {isLoading ? (
            <div className="flex items-center justify-center">
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              Swapping...
            </div>
          ) : (
            'Swap'
          )}
        </button>
      </div>
      <Toaster />

      {/* Success Modal */}
      <Dialog open={showSuccessModal} onOpenChange={setShowSuccessModal}>
        <DialogContent className="bg-[#222222] text-white">
          <DialogHeader>
            <DialogTitle>Swap Successful</DialogTitle>
          </DialogHeader>
          <div className="p-4">
            <p>Successfully swapped {fromAmount} {fromToken.symbol} for {toAmount} {toToken.symbol}</p>
          </div>
          <Button onClick={() => setShowSuccessModal(false)} className="bg-[#FF30B0] hover:bg-[#F615B9]">
            Close
          </Button>
        </DialogContent>
      </Dialog>
    </div>
  )
}
