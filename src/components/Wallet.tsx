import { WalletMultiButton } from '@solana/wallet-adapter-react-ui';
import {
  WalletProvider,
} from '@solana/wallet-adapter-react';
import { WalletModalProvider } from '@solana/wallet-adapter-react-ui';
import {
  PhantomWalletAdapter,
  SolflareWalletAdapter,
  AlphaWalletAdapter,
} from '@solana/wallet-adapter-wallets';
import {
  ConnectionProvider,
} from '@solana/wallet-adapter-react';

const wallets = [
  new PhantomWalletAdapter(),
  new SolflareWalletAdapter(),
  new AlphaWalletAdapter(),
];

const API_KEY = import.meta.env.VITE_API_KEY

const endpoint = `https://devnet.helius-rpc.com/?api-key=${API_KEY}`;

const Wallet = () => {
  return (
    <div>
      <ConnectionProvider endpoint={endpoint}>
        <WalletProvider wallets={wallets} autoConnect>
              <WalletModalProvider>
                  <WalletMultiButton />
              </WalletModalProvider>
        </WalletProvider>
    </ConnectionProvider>

    </div>
  )
}

export default Wallet