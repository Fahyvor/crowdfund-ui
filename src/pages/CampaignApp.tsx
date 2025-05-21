import { useState } from "react";
import * as anchor from "@project-serum/anchor";
import { Connection, PublicKey, clusterApiUrl } from "@solana/web3.js";
import { Program, AnchorProvider, web3 } from "@project-serum/anchor";
import {
  WalletAdapterNetwork,
  WalletNotConnectedError,
} from "@solana/wallet-adapter-base";
import {
  useWallet,
} from "@solana/wallet-adapter-react";
import { WalletMultiButton } from "@solana/wallet-adapter-react-ui";
import "@solana/wallet-adapter-react-ui/styles.css";

// Import the IDL directly
const idl = {
  "address": "Cz9stDhq8rCN97Bza1zMCrKoD9xTLsYPhS6KM95ePHxY",
  "metadata": {
    "name": "crowdfunding",
    "version": "0.1.0",
    "spec": "0.1.0",
    "description": "Created with Anchor"
  },
  "instructions": [
    {
      "name": "donate",
      "discriminator": [121, 186, 218, 211, 73, 70, 196, 180],
      "accounts": [
        { "name": "donor", "writable": true, "signer": true },
        { "name": "campaign", "writable": true },
        {
          "name": "donation",
          "writable": true,
          "pda": {
            "seeds": [
              { "kind": "const", "value": [100, 111, 110, 97, 116, 105, 111, 110] },
              { "kind": "account", "path": "donor" },
              { "kind": "account", "path": "campaign" }
            ]
          }
        },
        { "name": "clock", "address": "SysvarC1ock11111111111111111111111111111111" },
        { "name": "system_program", "address": "11111111111111111111111111111111" }
      ],
      "args": [{ "name": "amount", "type": "u64" }]
    },
    {
      "name": "initialize",
      "discriminator": [175, 175, 109, 31, 13, 152, 155, 237],
      "accounts": [
        { "name": "campaign", "writable": true, "signer": true },
        { "name": "owner", "writable": true, "signer": true },
        { "name": "system_program", "address": "11111111111111111111111111111111" }
      ],
      "args": [
        { "name": "title", "type": "string" },
        { "name": "description", "type": "string" },
        { "name": "goal", "type": "u64" },
        { "name": "deadline", "type": "i64" }
      ]
    },
    {
      "name": "refund",
      "discriminator": [2, 96, 183, 251, 63, 208, 46, 46],
      "accounts": [
        { "name": "donor", "writable": true, "signer": true },
        { "name": "campaign", "writable": true },
        {
          "name": "donation",
          "writable": true,
          "pda": {
            "seeds": [
              { "kind": "const", "value": [100, 111, 110, 97, 116, 105, 111, 110] },
              { "kind": "account", "path": "donor" },
              { "kind": "account", "path": "campaign" }
            ]
          }
        }
      ],
      "args": []
    },
    {
      "name": "withdraw",
      "discriminator": [183, 18, 70, 156, 148, 109, 161, 34],
      "accounts": [
        { "name": "campaign", "writable": true },
        { "name": "owner", "writable": true, "signer": true, "relations": ["campaign"] },
        { "name": "clock", "address": "SysvarC1ock11111111111111111111111111111111" }
      ],
      "args": [{ "name": "amount", "type": "u64" }]
    }
  ],
  "accounts": [
    { "name": "Campaign", "discriminator": [50, 40, 49, 11, 157, 220, 229, 192] },
    { "name": "Donation", "discriminator": [189, 210, 54, 77, 216, 85, 7, 68] }
  ],
  "errors": [
    { "code": 6000, "name": "Unauthorized", "msg": "You are not authorized to perform this action." },
    { "code": 6001, "name": "CampaignEnded", "msg": "The campaign has already ended" },
    { "code": 6002, "name": "CampaignStillRunning", "msg": "The campaign is still active" },
    { "code": 6003, "name": "GoalMet", "msg": "The campaign goal has been met" },
    { "code": 6004, "name": "GoalNotMet", "msg": "The campaign goal has not been met" },
    { "code": 6005, "name": "AlreadyRefunded", "msg": "Donation already refunded" }
  ],
  "types": [
    {
      "name": "Campaign",
      "type": {
        "kind": "struct",
        "fields": [
          { "name": "owner", "type": "pubkey" },
          { "name": "title", "type": "string" },
          { "name": "description", "type": "string" },
          { "name": "goal", "type": "u64" },
          { "name": "deadline", "type": "i64" },
          { "name": "raised_amount", "type": "u64" },
          { "name": "bump", "type": "u8" }
        ]
      }
    },
    {
      "name": "Donation",
      "type": {
        "kind": "struct",
        "fields": [
          { "name": "donor", "type": "pubkey" },
          { "name": "campaign", "type": "pubkey" },
          { "name": "amount", "type": "u64" },
          { "name": "refunded", "type": "bool" }
        ]
      }
    }
  ]
};

// Program ID (from your Rust declare_id)
const programID = new PublicKey("Cz9stDhq8rCN97Bza1zMCrKoD9xTLsYPhS6KM95ePHxY");

const network = WalletAdapterNetwork.Devnet;

const opts = {
  preflightCommitment: "processed" as web3.Commitment,
  commitment: "processed" as web3.Commitment,
};

const CampaignApp = () => {
  const wallet = useWallet();
  const [campaignAccount, setCampaignAccount] = useState<PublicKey | null>(null);
  const [campaignAddress, setCampaignAddress] = useState("");
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [goal, setGoal] = useState(0);
  const [deadline, setDeadline] = useState(0);
  const [amount, setAmount] = useState(0);
  const [message, setMessage] = useState("");
  const [loading, setLoading] = useState(false);

  // Function to get provider
  const getProvider = () => {
    if (!wallet.publicKey) throw new WalletNotConnectedError();
    
    const connection = new Connection(clusterApiUrl(network), opts.commitment);
    const provider = new AnchorProvider(
      connection, 
      {
        publicKey: wallet.publicKey,
        signTransaction: wallet.signTransaction,
        signAllTransactions: wallet.signAllTransactions,
      } as anchor.Wallet,
      opts
    );
    return provider;
  };

  // Find existing campaign by address
  const findCampaign = async () => {
    if (!campaignAddress) {
      setMessage("Please enter a campaign address");
      return;
    }

    try {
      setLoading(true);
      const pubkey = new PublicKey(campaignAddress);
      setCampaignAccount(pubkey);
      setMessage("Campaign found: " + pubkey.toBase58());
      
      // Fetch campaign details
      await fetchCampaignDetails(pubkey);
    } catch (err) {
      console.error(err);
      setMessage("Invalid campaign address");
    } finally {
      setLoading(false);
    }
  };

  // Fetch campaign details
  const fetchCampaignDetails = async (campaignPubkey: PublicKey) => {
    try {
      const provider = getProvider();
      const program = new Program(idl as unknown as anchor.Idl, programID, provider);
      
      const campaignData = await program.account.campaign.fetch(campaignPubkey);
      console.log("Campaign details:", campaignData);
      
      // Update UI with campaign details
      setMessage(`Campaign: ${campaignData.title}
        Description: ${campaignData.description}
        Goal: ${campaignData.goal.toString()} lamports
        Raised: ${campaignData.raisedAmount.toString()} lamports
        Deadline: ${new Date(campaignData.deadline * 1000).toLocaleString()}`);
    } catch (err) {
      console.error("Error fetching campaign details:", err);
      setMessage("Error fetching campaign details");
    }
  };

  const initializeCampaign = async () => {
    if (!wallet.connected) throw new WalletNotConnectedError();

    try {
      setLoading(true);
      setMessage("Initializing campaign...");
      
      const provider = getProvider();
      const program = new Program(idl as unknown as anchor.Idl, programID, provider);

      // Generate a new keypair for the campaign account
      const campaignKeypair = web3.Keypair.generate();

      const unixDeadline = Math.floor(new Date(deadline).getTime() / 1000);

      await program.methods
        .initialize(title, description, new anchor.BN(goal), new anchor.BN(unixDeadline))
        .accounts({
          campaign: campaignKeypair.publicKey,
          owner: wallet.publicKey ?? (() => { throw new Error("Wallet not connected"); })(),
          systemProgram: web3.SystemProgram.programId,
        })
        .signers([campaignKeypair])
        .rpc();

      setCampaignAccount(campaignKeypair.publicKey);
      setMessage("Campaign initialized: " + campaignKeypair.publicKey.toBase58());
    } catch (err) {
      console.error(err);
      setMessage("Error initializing campaign: " + (err instanceof Error ? err.message : "Unknown error"));
    } finally {
      setLoading(false);
    }
  };

  const donateToCampaign = async () => {
    if (!wallet.connected) throw new WalletNotConnectedError();
    if (!campaignAccount) {
      setMessage("Please find or create a campaign first");
      return;
    }

    try {
      setLoading(true);
      setMessage("Donating...");
      
      const provider = getProvider();
      const program = new Program(idl as unknown as anchor.Idl, programID, provider);

      const donationSeed = [
        Buffer.from("donation"),
        wallet.publicKey ? wallet.publicKey.toBuffer() : Buffer.alloc(32),
        campaignAccount.toBuffer(),
      ];
      const [donationPDA] = await PublicKey.findProgramAddress(donationSeed, programID);

      await program.methods
        .donate(new anchor.BN(amount))
        .accounts({
          donor: wallet.publicKey ?? (() => { throw new Error("Wallet not connected"); })(),
          campaign: campaignAccount,
          donation: donationPDA,
          clock: anchor.web3.SYSVAR_CLOCK_PUBKEY,
          systemProgram: web3.SystemProgram.programId,
        })
        .rpc();

      setMessage("Donation successful!");
      
      // Refresh campaign details
      await fetchCampaignDetails(campaignAccount);
    } catch (err) {
      console.error(err);
      setMessage("Donation failed: " + (err instanceof Error ? err.message : "Unknown error"));
    } finally {
      setLoading(false);
    }
  };

  const withdrawFunds = async () => {
    if (!wallet.connected) throw new WalletNotConnectedError();
    if (!campaignAccount) {
      setMessage("Please find or create a campaign first");
      return;
    }

    try {
      setLoading(true);
      setMessage("Withdrawing funds...");
      
      const provider = getProvider();
      const program = new Program(idl as unknown as anchor.Idl, programID, provider);

      await program.methods
        .withdraw(new anchor.BN(amount))
        .accounts({
          campaign: campaignAccount,
          owner: wallet.publicKey ?? (() => { throw new Error("Wallet not connected"); })(),
          clock: anchor.web3.SYSVAR_CLOCK_PUBKEY,
        })
        .rpc();

      setMessage("Withdraw successful!");
      
      // Refresh campaign details
      await fetchCampaignDetails(campaignAccount);
    } catch (err) {
      console.error(err);
      setMessage("Withdraw failed: " + (err instanceof Error ? err.message : "Unknown error"));
    } finally {
      setLoading(false);
    }
  };

  const refundDonation = async () => {
    if (!wallet.connected) throw new WalletNotConnectedError();
    if (!campaignAccount) {
      setMessage("Please find or create a campaign first");
      return;
    }

    try {
      setLoading(true);
      setMessage("Refunding donation...");
      
      const provider = getProvider();
      const program = new Program(idl as unknown as anchor.Idl, programID, provider);

      const donationSeed = [
        Buffer.from("donation"),
        wallet.publicKey ? wallet.publicKey.toBuffer() : Buffer.alloc(32),
        campaignAccount.toBuffer(),
      ];
      const [donationPDA] = await PublicKey.findProgramAddress(donationSeed, programID);

      await program.methods
        .refund()
        .accounts({
          donor: wallet.publicKey ?? (() => { throw new Error("Wallet not connected"); })(),
          campaign: campaignAccount,
          donation: donationPDA,
        })
        .rpc();

      setMessage("Refund successful!");
    } catch (err) {
      console.error(err);
      setMessage("Refund failed: " + (err instanceof Error ? err.message : "Unknown error"));
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="p-6 max-w-lg mx-auto">
      <h1 className="text-2xl font-bold mb-6 text-center">Solana Crowdfunding DApp</h1>

      <div className="mb-4 flex justify-center">
        <WalletMultiButton />
      </div>

      {wallet.connected && (
        <div className="text-sm text-center mb-6">
          Connected: {wallet.publicKey?.toBase58().slice(0, 6)}...{wallet.publicKey?.toBase58().slice(-4)}
        </div>
      )}

      <div className="bg-gray-100 p-4 rounded-lg mb-6">
        <h2 className="text-xl font-semibold mb-3">Find Campaign</h2>
        <div className="flex gap-2 mb-2">
          <input
            className="flex-grow p-2 border rounded"
            placeholder="Campaign Address"
            value={campaignAddress}
            onChange={(e) => setCampaignAddress(e.target.value)}
          />
          <button 
            className="bg-blue-500 text-white px-4 py-2 rounded hover:bg-blue-600" 
            onClick={findCampaign}
            disabled={loading}
          >
            Find
          </button>
        </div>
      </div>

      <div className="bg-gray-100 p-4 rounded-lg mb-6">
        <h2 className="text-xl font-semibold mb-3">Initialize Campaign</h2>
        <div className="grid gap-3">
          <input
            className="p-2 border rounded"
            placeholder="Title"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
          />
          <textarea
            className="p-2 border rounded"
            placeholder="Description"
            value={description}
            onChange={(e) => setDescription(e.target.value)}
          />
          <input
            className="p-2 border rounded"
            type="number"
            placeholder="Goal (lamports)"
            value={goal || ""}
            onChange={(e) => setGoal(parseInt(e.target.value))}
          />
          <input
            className="p-2 border rounded"
            type="datetime-local"
            onChange={(e) => setDeadline(Date.parse(e.target.value))}
          />
          <button 
            className="bg-green-500 text-white p-2 rounded hover:bg-green-600" 
            onClick={initializeCampaign}
            disabled={loading}
          >
            Initialize Campaign
          </button>
        </div>
      </div>

      <div className="bg-gray-100 p-4 rounded-lg mb-6">
        <h2 className="text-xl font-semibold mb-3">Campaign Actions</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <h3 className="font-medium mb-2">Donate</h3>
            <div className="flex gap-2">
              <input
                className="flex-grow p-2 border rounded"
                type="number"
                placeholder="Amount (lamports)"
                value={amount || ""}
                onChange={(e) => setAmount(parseInt(e.target.value))}
              />
              <button 
                className="bg-purple-500 text-white px-3 py-2 rounded hover:bg-purple-600" 
                onClick={donateToCampaign}
                disabled={loading}
              >
                Donate
              </button>
            </div>
          </div>
          
          <div>
            <h3 className="font-medium mb-2">Withdraw</h3>
            <div className="flex gap-2">
              <input
                className="flex-grow p-2 border rounded"
                type="number"
                placeholder="Amount (lamports)"
                value={amount || ""}
                onChange={(e) => setAmount(parseInt(e.target.value))}
              />
              <button 
                className="bg-yellow-500 text-white px-3 py-2 rounded hover:bg-yellow-600" 
                onClick={withdrawFunds}
                disabled={loading}
              >
                Withdraw
              </button>
            </div>
          </div>
        </div>
        
        <div className="mt-4">
          <h3 className="font-medium mb-2">Refund</h3>
          <button 
            className="bg-red-500 text-white p-2 rounded hover:bg-red-600 w-full" 
            onClick={refundDonation}
            disabled={loading}
          >
            Request Refund
          </button>
        </div>
      </div>

      {loading && (
        <div className="my-4 text-center font-medium">Processing...</div>
      )}

      {message && (
        <div className="bg-gray-100 p-4 rounded-lg mt-4 whitespace-pre-line">
          <h3 className="font-medium mb-2">Status</h3>
          <div>{message}</div>
        </div>
      )}
    </div>
  );
};

export default CampaignApp;

// import { useState } from "react";
// import * as anchor from "@project-serum/anchor";
// import { Connection, PublicKey, clusterApiUrl } from "@solana/web3.js";
// import { Program, AnchorProvider, web3 } from "@project-serum/anchor";
// import type { Idl } from "@project-serum/anchor";

// import {
//   WalletAdapterNetwork,
//   WalletNotConnectedError,
// } from "@solana/wallet-adapter-base";
// import {
//   useWallet,
//   WalletProvider,
//   ConnectionProvider,
// } from "@solana/wallet-adapter-react";
// import {
//   PhantomWalletAdapter,
//   SolflareWalletAdapter,
// } from "@solana/wallet-adapter-wallets";

// import { WalletModalProvider, WalletMultiButton } from "@solana/wallet-adapter-react-ui";

// import crowdfundingRaw from "../idl/crowdfunding.json";

// // Remove non-IDL fields
// const { address, metadata, ...crowdfundingIdl } = crowdfundingRaw as unknown as Idl;
// console.log(metadata)
// console.log(address)

// // Program ID (from your Rust declare_id)
// const programID = new PublicKey("Cz9stDhq8rCN97Bza1zMCrKoD9xTLsYPhS6KM95ePHxY");

// const network = WalletAdapterNetwork.Devnet; // Use "Devnet" for devnet

// const opts = {
//   preflightCommitment: "processed" as web3.Commitment,
//   commitment: "processed" as web3.Commitment,
// };

// interface Wallet {
//   publicKey: PublicKey;
//   connected: boolean;
// }

// function getProvider(wallet: Wallet): AnchorProvider {
//   const connection = new Connection(
//     clusterApiUrl(network),
//     opts.preflightCommitment as web3.Commitment
//   );
//   const provider = new AnchorProvider(connection, {
//     publicKey: wallet.publicKey,
//     // signTransaction: wallet.signTransaction,
//     // signAllTransactions: wallet.signAllTransactions,
//   } as anchor.Wallet, opts);
//   return provider;
// }

// const CampaignApp = () => {
//   const wallet = useWallet();
//   const [campaignAccount, setCampaignAccount] = useState<PublicKey | null>(null);
//   const [title, setTitle] = useState("");
//   const [description, setDescription] = useState("");
//   const [goal, setGoal] = useState(0);
//   const [deadline, setDeadline] = useState(0);
//   const [amount, setAmount] = useState(0);
//   const [message, setMessage] = useState("");

//   // Derive PDA for campaign
//   // const getCampaignPDA = async () => {
//   //   return await PublicKey.findProgramAddress(
//   //     [Buffer.from("campaign"), wallet.publicKey?.toBuffer() || Buffer.alloc(32)],
//   //     programID
//   //   );
//   // };

//   const initializeCampaign = async () => {
//     if (!wallet.connected) throw new WalletNotConnectedError();

//     try {
//       setMessage("Initializing campaign...");
//       if (!wallet.publicKey) {
//         throw new Error("Wallet is not connected or publicKey is null");
//       }
//       const provider = getProvider({ publicKey: wallet.publicKey, connected: wallet.connected });
//       const program = new Program(crowdfundingIdl, programID, provider);

//       const [campaignPDA] = await PublicKey.findProgramAddress(
//         [Buffer.from("campaign"), wallet.publicKey.toBuffer()],
//         programID
//       );

//       const unixDeadline = Math.floor(new Date(deadline).getTime() / 1000);

//       await program.rpc.initialize(title, description, new anchor.BN(goal), new anchor.BN(unixDeadline), {
//         accounts: {
//           campaign: campaignPDA,
//           owner: wallet.publicKey,
//           systemProgram: web3.SystemProgram.programId,
//         },
//         signers: [],
//       });

//       setCampaignAccount(campaignPDA);
//       setMessage("Campaign initialized: " + campaignPDA.toBase58());
//     } catch (err) {
//       console.error(err);
//       setMessage("Error initializing campaign: " + (err instanceof Error ? err.message : "Unknown error"));
//     }
//   };

//   const donateToCampaign = async () => {
//     if (!wallet.connected) throw new WalletNotConnectedError();

//     try {
//       setMessage("Donating...");
//       if (!wallet.publicKey) {
//         throw new Error("Wallet is not connected or publicKey is null");
//       }
//       const provider = getProvider({ publicKey: wallet.publicKey, connected: wallet.connected });
//       const program = new Program(idl, programID, provider);

//       if (!campaignAccount) throw new Error("Campaign account not found");

//       const donationSeed = [
//         Buffer.from("donation"),
//         wallet.publicKey.toBuffer(),
//         campaignAccount.toBuffer(),
//       ];
//       const [donationPDA] = await PublicKey.findProgramAddress(donationSeed, programID);

//       await program.rpc.donate(new anchor.BN(amount), {
//         accounts: {
//           donor: wallet.publicKey,
//           campaign: campaignAccount,
//           donation: donationPDA,
//           clock: anchor.web3.SYSVAR_CLOCK_PUBKEY,
//           systemProgram: web3.SystemProgram.programId,
//         },
//       });

//       setMessage("Donation successful!");
//     } catch (err) {
//       console.error(err);
//       setMessage("Donation failed: " + (err instanceof Error ? err.message : "Unknown error"));
//     }
//   };

//   const withdrawFunds = async () => {
//     if (!wallet.connected) throw new WalletNotConnectedError();

//     try {
//       setMessage("Withdrawing funds...");
//       if (!wallet.publicKey) {
//         throw new Error("Wallet is not connected or publicKey is null");
//       }
//       const provider = getProvider({ publicKey: wallet.publicKey, connected: wallet.connected });
//       const program = new Program(idl, programID, provider);

//       if (!campaignAccount) throw new Error("Campaign account not found");

//       await program.rpc.withdraw(new anchor.BN(amount), {
//         accounts: {
//           campaign: campaignAccount,
//           owner: wallet.publicKey,
//           clock: anchor.web3.SYSVAR_CLOCK_PUBKEY,
//         },
//       });

//       setMessage("Withdraw successful!");
//     } catch (err) {
//       console.error(err);
//       setMessage("Withdraw failed: " + (err instanceof Error ? err.message : "Unknown error"));
//     }
//   };

//   const refundDonation = async () => {
//     if (!wallet.connected) throw new WalletNotConnectedError();

//     try {
//       setMessage("Refunding donation...");
//       if (!wallet.publicKey) {
//         throw new Error("Wallet is not connected or publicKey is null");
//       }
//       const provider = getProvider({ publicKey: wallet.publicKey, connected: wallet.connected });
//       const program = new Program(idl, programID, provider);

//       if (!campaignAccount) throw new Error("Campaign account not found");

//       const donationSeed = [
//         Buffer.from("donation"),
//         wallet.publicKey.toBuffer(),
//         campaignAccount.toBuffer(),
//       ];
//       const [donationPDA] = await PublicKey.findProgramAddress(donationSeed, programID);

//       await program.rpc.refund({
//         accounts: {
//           donor: wallet.publicKey,
//           campaign: campaignAccount,
//           donation: donationPDA,
//         },
//       });

//       setMessage("Refund successful!");
//     } catch (err) {
//       console.error(err);
//       setMessage("Refund failed: " + (err instanceof Error ? err.message : "Unknown error"));
//     }
//   };

//   return (
//     <div style={{ maxWidth: "600px", margin: "auto", padding: "20px" }}>
//       <h2>Solana Crowdfunding DApp</h2>

//       <WalletMultiButton />

//       <hr />

//       <h3>Initialize Campaign</h3>
//       <input placeholder="Title" onChange={(e) => setTitle(e.target.value)} />
//       <input placeholder="Description" onChange={(e) => setDescription(e.target.value)} />
//       <input
//         type="number"
//         placeholder="Goal (lamports)"
//         onChange={(e) => setGoal(parseInt(e.target.value))}
//       />
//       <input
//         type="datetime-local"
//         placeholder="Deadline"
//         onChange={(e) => setDeadline(Date.parse(e.target.value))}
//       />
//       <button onClick={initializeCampaign}>Initialize Campaign</button>

//       <hr />

//       <h3>Donate</h3>
//       <input
//         type="number"
//         placeholder="Amount (lamports)"
//         onChange={(e) => setAmount(parseInt(e.target.value))}
//       />
//       <button onClick={donateToCampaign}>Donate</button>

//       <hr />

//       <h3>Withdraw</h3>
//       <input
//         type="number"
//         placeholder="Amount (lamports)"
//         onChange={(e) => setAmount(parseInt(e.target.value))}
//       />
//       <button onClick={withdrawFunds}>Withdraw</button>

//       <hr />

//       <h3>Refund</h3>
//       <button onClick={refundDonation}>Refund</button>

//       <p>{message}</p>
//     </div>
//   );
// };

// export default function App() {
//   const wallets = [new PhantomWalletAdapter(), new SolflareWalletAdapter()];

//   return (
//     <ConnectionProvider endpoint={clusterApiUrl(network)}>
//       <WalletProvider wallets={wallets} autoConnect>
//         <WalletModalProvider>
//           <CampaignApp />
//         </WalletModalProvider>
//       </WalletProvider>
//     </ConnectionProvider>
//   );
// }