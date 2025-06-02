import { useState, useEffect } from 'react'
import { ToastContainer, toast } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import { useWallet } from '@solana/wallet-adapter-react'
import { PublicKey, Connection } from '@solana/web3.js';
import idl from '../../crowdfunding.json' assert { type: "json"};
import type { Idl } from '@project-serum/anchor';
import { AnchorProvider, Program } from '@project-serum/anchor';
import type { Wallet } from '@project-serum/anchor';
import { Crowdfunding } from '../../crowdfunding';
import * as anchor from '@coral-xyz/anchor';
import { useMockCampaigns } from '../hook/useMockCampaign';

interface Campaign {
  id: string;
  owner: string;
  title: string;
  description: string;
  goal: number; // in lamports
  deadline: number; // timestamp in ms
  raisedAmount: number; // in lamports
  isActive: boolean;
  isGoalMet: boolean;
}

const CreateCampaign = () => {
      const [newCampaign, setNewCampaign] = useState({
        title: '',
        description: '',
        goal: '',
        deadline: '',
      });
    const [isLoading, setIsLoading] = useState(false);
    const [userAddress, setUserAddress] = useState('');
    const { campaigns, setCampaigns } = useMockCampaigns();
    const walletContext = useWallet();
    const wallet = walletContext?.publicKey && walletContext.signTransaction && walletContext.signAllTransactions
  ? {
      publicKey: new PublicKey(walletContext.publicKey.toBase58()), // Force correct type
      signTransaction: walletContext.signTransaction,
      signAllTransactions: walletContext.signAllTransactions,
    } as Wallet
  : null;



    useEffect(() => {
          if (walletContext.connected && walletContext.publicKey) {
              const publicKeyString = walletContext.publicKey.toBase58();
              setUserAddress(publicKeyString);
              console.log('Connected wallet public key:', publicKeyString);
              console.log('Wallet adapter:', walletContext.wallet?.adapter);
          } else {
              console.log('Wallet not connected yet');
              setUserAddress('');
          }
      }, [walletContext.connected, walletContext.publicKey, walletContext.wallet?.adapter]);

    function convertToIdl(crowdfunding: typeof Crowdfunding) {
        return {
        version: crowdfunding.metadata.version,
        name: crowdfunding.metadata.name,
        instructions: crowdfunding.instructions.map((ix) => ({
            ...ix,
            accounts: ix.accounts.map((acc) => {
            const { writable, signer, ...rest } = acc;
            return {
                ...rest,
                isMut: writable ?? false,
                isSigner: signer ?? false,
            };
            }),
        })),
        accounts: crowdfunding.accounts.map((acc) => ({
            name: acc.name,
            type: {
            kind: 'struct',
            fields: [], // TODO: fill if needed
            },
        })),
        errors: crowdfunding.errors,
        types: crowdfunding.types,
        } as Idl;
    }
    
    const crowdfundingIdl = convertToIdl(Crowdfunding)
    const { address, metadata, ...cleanIdl } = idl;
    // const { address, ...cleanIdl } = mockIdl;
    console.log('Program address:', address);
    console.log('Program metadata:', metadata);

    const connection = new Connection('https://api.devnet.solana.com');

      const PROGRAM_ID = new PublicKey(address);
        const provider = wallet
          ? new AnchorProvider(connection, wallet, { commitment: 'processed' })
          : null;
      
        // const program = provider
        //   ? new Program(crowdfundingIdl as Idl, PROGRAM_ID, provider)
        //   : null;

        console.log(cleanIdl)

      const program = provider ? new Program(crowdfundingIdl as Idl, PROGRAM_ID, provider) : undefined;
      console.log("Program", program)

    const createCampaign = async () => {
        if (!userAddress || !program) {
          toast.error('Please connect your wallet first');
          return;
        }
    
        if (
          !newCampaign.title ||
          !newCampaign.description ||
          !newCampaign.goal ||
          !newCampaign.deadline
        ) {
          toast.error('Please fill in all fields');
          return;
        }
    
        setIsLoading(true);
    
        try {
          // const campaignKeypair = anchor.web3.Keypair.generate();
          if (!wallet) throw new Error("Wallet not connected");
    
          const [campaignPDA] = PublicKey.findProgramAddressSync(
            [Buffer.from(newCampaign.title), wallet.publicKey.toBuffer()],
            PROGRAM_ID
          );
    
    
          await program.methods
            .initialize(
              newCampaign.title,
              newCampaign.description,
              new anchor.BN(parseFloat(newCampaign.goal) * 1_000_000),
              new anchor.BN(Math.floor(new Date(newCampaign.deadline).getTime() / 1000))
            )
            .accounts({
              campaign: campaignPDA,
              owner: wallet.publicKey,
              systemProgram: anchor.web3.SystemProgram.programId,
            })
            // .signers([campaignKeypair])
            .rpc();
    
          const campaign: Campaign = {
            id: campaignPDA.toBase58(),
            owner: userAddress,
            title: newCampaign.title,
            description: newCampaign.description,
            goal: parseFloat(newCampaign.goal) * 1_000_000,
            deadline: new Date(newCampaign.deadline).getTime(),
            raisedAmount: 0,
            isActive: true,
            isGoalMet: false,
          };
    
          setCampaigns([...campaigns, campaign]);
          setNewCampaign({ title: '', description: '', goal: '', deadline: '' });
        //   setActiveTab('browse');
        } catch (error) {
          toast.error('Something went wrong');
          console.error(error);
        } finally {
          setIsLoading(false);
        }
    };

  return (
    <div className="max-w-2xl mx-auto">
        <ToastContainer />
        <div className="bg-white/70 backdrop-blur-sm rounded-xl border border-gray-200 p-8">
            <h2 className="text-2xl font-bold text-gray-900 mb-6">Create New Campaign</h2>
            
            <div className="space-y-6">
            <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Campaign Title</label>
                <input
                type="text"
                value={newCampaign.title}
                onChange={(e) => setNewCampaign({...newCampaign, title: e.target.value})}
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent outline-none"
                placeholder="Enter campaign title..."
                />
            </div>
            
            <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Description</label>
                <textarea
                value={newCampaign.description}
                onChange={(e) => setNewCampaign({...newCampaign, description: e.target.value})}
                rows={4}
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent outline-none"
                placeholder="Describe your campaign..."
                />
            </div>
            
            <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Funding Goal (SOL)</label>
                <input
                type="number"
                value={newCampaign.goal}
                onChange={(e) => setNewCampaign({...newCampaign, goal: e.target.value})}
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent outline-none"
                placeholder="0.00"
                min="0"
                step="0.01"
                />
            </div>
            
            <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Campaign Deadline</label>
                <input
                type="date"
                value={newCampaign.deadline}
                onChange={(e) => setNewCampaign({...newCampaign, deadline: e.target.value})}
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent outine-none"
                min={new Date().toISOString().split('T')[0]}
                />
            </div>
            
            <button
                onClick={createCampaign}
                disabled={!isLoading}
                className="w-full bg-gradient-to-r from-purple-600 to-blue-600 text-white py-3 px-6 rounded-lg hover:from-purple-700 hover:to-blue-700 transition-all duration-200 font-medium disabled:opacity-50 disabled:cursor-not-allowed"
            >
                {wallet ? 'Create Campaign' : 'Connect Wallet First'}
            </button>
            </div>
        </div>
        </div>
  )
}

export default CreateCampaign