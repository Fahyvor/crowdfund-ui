import { useState } from "react";
import * as anchor from "@project-serum/anchor";
import { Connection, PublicKey, clusterApiUrl } from "@solana/web3.js";
import { Program, Provider, web3 } from "@project-serum/anchor";

import {
  WalletAdapterNetwork,
  WalletNotConnectedError,
} from "@solana/wallet-adapter-base";
import {
  useWallet,
  WalletProvider,
  ConnectionProvider,
} from "@solana/wallet-adapter-react";
import {
  getPhantomWallet,
  getSolflareWallet,
} from "@solana/wallet-adapter-wallets";

import { WalletModalProvider, WalletMultiButton } from "@solana/wallet-adapter-react-ui";

import idl from "./idl.json"; // Your Anchor program IDL JSON file

// Program ID (from your Rust declare_id)
const programID = new PublicKey("Cz9stDhq8rCN97Bza1zMCrKoD9xTLsYPhS6KM95ePHxY");

const network = WalletAdapterNetwork.Devnet; // Use "Devnet" for devnet

const opts = {
  preflightCommitment: "processed",
};

function getProvider(wallet) {
  const connection = new Connection(clusterApiUrl(network), opts.preflightCommitment);
  const provider = new Provider(connection, wallet, opts.preflightCommitment);
  return provider;
}

const CampaignApp = () => {
  const wallet = useWallet();
  const [campaignAccount, setCampaignAccount] = useState(null);
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [goal, setGoal] = useState(0);
  const [deadline, setDeadline] = useState(0);
  const [amount, setAmount] = useState(0);
  const [message, setMessage] = useState("");

  // Derive PDA for campaign
  const getCampaignPDA = async () => {
    return await PublicKey.findProgramAddress(
      [Buffer.from("campaign"), wallet.publicKey.toBuffer()],
      programID
    );
  };

  const initializeCampaign = async () => {
    if (!wallet.connected) throw new WalletNotConnectedError();

    try {
      setMessage("Initializing campaign...");
      const provider = getProvider(wallet);
      const program = new Program(idl, programID, provider);

      const [campaignPDA, bump] = await PublicKey.findProgramAddress(
        [Buffer.from("campaign"), wallet.publicKey.toBuffer()],
        programID
      );

      const unixDeadline = Math.floor(new Date(deadline).getTime() / 1000);

      await program.rpc.initialize(title, description, new anchor.BN(goal), new anchor.BN(unixDeadline), {
        accounts: {
          campaign: campaignPDA,
          owner: wallet.publicKey,
          systemProgram: web3.SystemProgram.programId,
        },
        signers: [],
      });

      setCampaignAccount(campaignPDA);
      setMessage("Campaign initialized: " + campaignPDA.toBase58());
    } catch (err) {
      console.error(err);
      setMessage("Error initializing campaign: " + err.message);
    }
  };

  const donateToCampaign = async () => {
    if (!wallet.connected) throw new WalletNotConnectedError();

    try {
      setMessage("Donating...");
      const provider = getProvider(wallet);
      const program = new Program(idl, programID, provider);

      if (!campaignAccount) throw new Error("Campaign account not found");

      const donationSeed = [
        Buffer.from("donation"),
        wallet.publicKey.toBuffer(),
        campaignAccount.toBuffer(),
      ];
      const [donationPDA, donationBump] = await PublicKey.findProgramAddress(donationSeed, programID);

      await program.rpc.donate(new anchor.BN(amount), {
        accounts: {
          donor: wallet.publicKey,
          campaign: campaignAccount,
          donation: donationPDA,
          clock: anchor.web3.SYSVAR_CLOCK_PUBKEY,
          systemProgram: web3.SystemProgram.programId,
        },
      });

      setMessage("Donation successful!");
    } catch (err) {
      console.error(err);
      setMessage("Donation failed: " + err.message);
    }
  };

  const withdrawFunds = async () => {
    if (!wallet.connected) throw new WalletNotConnectedError();

    try {
      setMessage("Withdrawing funds...");
      const provider = getProvider(wallet);
      const program = new Program(idl, programID, provider);

      if (!campaignAccount) throw new Error("Campaign account not found");

      await program.rpc.withdraw(new anchor.BN(amount), {
        accounts: {
          campaign: campaignAccount,
          owner: wallet.publicKey,
          clock: anchor.web3.SYSVAR_CLOCK_PUBKEY,
        },
      });

      setMessage("Withdraw successful!");
    } catch (err) {
      console.error(err);
      setMessage("Withdraw failed: " + err.message);
    }
  };

  const refundDonation = async () => {
    if (!wallet.connected) throw new WalletNotConnectedError();

    try {
      setMessage("Refunding donation...");
      const provider = getProvider(wallet);
      const program = new Program(idl, programID, provider);

      if (!campaignAccount) throw new Error("Campaign account not found");

      const donationSeed = [
        Buffer.from("donation"),
        wallet.publicKey.toBuffer(),
        campaignAccount.toBuffer(),
      ];
      const [donationPDA, donationBump] = await PublicKey.findProgramAddress(donationSeed, programID);

      await program.rpc.refund({
        accounts: {
          donor: wallet.publicKey,
          campaign: campaignAccount,
          donation: donationPDA,
        },
      });

      setMessage("Refund successful!");
    } catch (err) {
      console.error(err);
      setMessage("Refund failed: " + err.message);
    }
  };

  return (
    <div style={{ maxWidth: "600px", margin: "auto", padding: "20px" }}>
      <h2>Solana Crowdfunding DApp</h2>

      <WalletMultiButton />

      <hr />

      <h3>Initialize Campaign</h3>
      <input placeholder="Title" onChange={(e) => setTitle(e.target.value)} />
      <input placeholder="Description" onChange={(e) => setDescription(e.target.value)} />
      <input
        type="number"
        placeholder="Goal (lamports)"
        onChange={(e) => setGoal(parseInt(e.target.value))}
      />
      <input
        type="datetime-local"
        placeholder="Deadline"
        onChange={(e) => setDeadline(e.target.value)}
      />
      <button onClick={initializeCampaign}>Initialize Campaign</button>

      <hr />

      <h3>Donate</h3>
      <input
        type="number"
        placeholder="Amount (lamports)"
        onChange={(e) => setAmount(parseInt(e.target.value))}
      />
      <button onClick={donateToCampaign}>Donate</button>

      <hr />

      <h3>Withdraw</h3>
      <input
        type="number"
        placeholder="Amount (lamports)"
        onChange={(e) => setAmount(parseInt(e.target.value))}
      />
      <button onClick={withdrawFunds}>Withdraw</button>

      <hr />

      <h3>Refund</h3>
      <button onClick={refundDonation}>Refund</button>

      <p>{message}</p>
    </div>
  );
};

export default function App() {
  const wallets = [getPhantomWallet(), getSolflareWallet()];

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
