import "@/styles/globals.css";
import type { AppProps } from "next/app";
import { useState } from "react";
import { PrivyProvider, User } from '@privy-io/react-auth';
import { usePrivy, useLogin } from '@privy-io/react-auth';

export default function App({ Component, pageProps }: AppProps) {
  return (
    <PrivyProvider
      appId="cm36rtegp04ktrsjkq7ibccxo"
      config={{
        appearance: {
          theme: 'light',
          accentColor: '#676FFF',
          logo: '',
        },
        embeddedWallets: {
          createOnLogin: 'users-without-wallets',
        },
      }}
    >
      <AppContent Component={Component} pageProps={pageProps}/>
    </PrivyProvider>
  );
}

function AppContent({ Component, pageProps }: AppProps) {
  const [isExpanded, setIsExpanded] = useState(false);
  const { user } = usePrivy();
  
  const { login } = useLogin({
    onComplete: (userData, isNewUser) => {
      if (isNewUser) {
        console.log("サインアップを検知しました。");
      } else {
        console.log('ログインを検知しました！');
      }
    }
  });

  return (
    <div>
      <div>
        <Component {...pageProps} setIsExpanded={setIsExpanded} />
      </div>
    </div>
  );
}

const WalletConnectButton = () => {
  const { login, logout, authenticated, user } = usePrivy();
  
  const connectedStyle = authenticated
    ? "bg-green-600 hover:bg-green-700 hover:shadow-sm hover:shadow-green-600"
    : "bg-gradient-to-r from-red-400 to-red-500 hover:from-red-500 hover:to-red-600";

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