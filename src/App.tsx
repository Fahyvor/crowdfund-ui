import Home from './pages/Home';
import '@solana/wallet-adapter-react-ui/styles.css';
import {
  WalletProvider,
} from '@solana/wallet-adapter-react';
import { WalletModalProvider } from '@solana/wallet-adapter-react-ui';
import {
  PhantomWalletAdapter,
  SolflareWalletAdapter,
  TorusWalletAdapter,
} from '@solana/wallet-adapter-wallets';
import {
  ConnectionProvider,
} from '@solana/wallet-adapter-react';

const wallets = [
  new PhantomWalletAdapter(),
  new SolflareWalletAdapter(),
  new TorusWalletAdapter(),
];

const API_KEY = import.meta.env.VITE_API_KEY

const endpoint = `https://devnet.helius-rpc.com/?api-key=${API_KEY}`;

function App() {

  return (
    <>
    <ConnectionProvider endpoint={endpoint}>
        <WalletProvider wallets={wallets} autoConnect>
              <WalletModalProvider>
                <div className="App">
                  <Home />
                </div>
            </WalletModalProvider>
        </WalletProvider>
    </ConnectionProvider>
        
    </>
  )
}

export default App
