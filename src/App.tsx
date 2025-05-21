import CampaignApp from './pages/CampaignApp'
import './App.css'
import {
  WalletProvider,
  ConnectionProvider,
} from "@solana/wallet-adapter-react";
import {
  PhantomWalletAdapter,
  SolflareWalletAdapter,
} from "@solana/wallet-adapter-wallets";
import { WalletModalProvider } from "@solana/wallet-adapter-react-ui";
import "@solana/wallet-adapter-react-ui/styles.css";
import { clusterApiUrl } from "@solana/web3.js";
import {
  WalletAdapterNetwork,
} from "@solana/wallet-adapter-base";
export default function App() {
  const wallets = [
    new PhantomWalletAdapter(), 
    new SolflareWalletAdapter()
  ];

  const network = WalletAdapterNetwork.Devnet;

  return (
    <ConnectionProvider endpoint={clusterApiUrl(network)}>
      <WalletProvider wallets={wallets} autoConnect>
        <WalletModalProvider>
          <CampaignApp />
        </WalletModalProvider>
      </WalletProvider>
    </ConnectionProvider>
  );
}
