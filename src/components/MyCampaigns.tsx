import { useState, useEffect } from 'react'
import { ToastContainer, toast } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import { useWallet } from '@solana/wallet-adapter-react';
import { useMockCampaigns } from '../hook/useMockCampaign';

const MyCampaigns = () => {
    const {campaigns} = useMockCampaigns();
    const [userAddress, setUserAddress] = useState('');

      const walletContext = useWallet();
        console.log("Wallet Context", walletContext);
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
      

      const withdraw = (campaignId: string) => {
          const campaign = campaigns.find((c) => c.id === campaignId);
          if (
            !campaign ||
            campaign.isActive ||
            !campaign.isGoalMet ||
            campaign.owner !== userAddress
          ) {
            toast.error('Cannot withdraw from this campaign');
            return;
          }
      
          toast(
            `Withdrew ${(campaign.raisedAmount / 1_000_000).toFixed(2)} SOL from campaign: ${campaign.title}`
          );
        };

        const formatSOL = (lamports: number) => {
            return (lamports / 1000000).toFixed(2);
        };
  return (
    <div>
        <ToastContainer />
        <h2 className="text-2xl font-bold text-gray-900 mb-6">My Campaigns</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
            {campaigns.filter(c => c.owner === userAddress).map(campaign => (
            <div key={campaign.id} className="bg-white/70 backdrop-blur-sm rounded-xl border border-gray-200 p-6">
                <h3 className="text-xl font-bold text-gray-900 mb-2">{campaign.title}</h3>
                <div className="space-y-3">
                <div className="flex justify-between">
                    <span className="text-gray-600">Raised:</span>
                    <span className="font-bold">{formatSOL(campaign.raisedAmount)} SOL</span>
                </div>
                <div className="flex justify-between">
                    <span className="text-gray-600">Goal:</span>
                    <span className="font-bold">{formatSOL(campaign.goal)} SOL</span>
                </div>
                <div className="flex justify-between">
                    <span className="text-gray-600">Status:</span>
                    <span className={`font-medium ${
                    campaign.isActive ? 'text-green-600' : campaign.isGoalMet ? 'text-blue-600' : 'text-red-600'
                    }`}>
                    {campaign.isActive ? 'Active' : campaign.isGoalMet ? 'Goal Met' : 'Ended'}
                    </span>
                </div>
                {!campaign.isActive && campaign.isGoalMet && (
                    <button
                    onClick={() => withdraw(campaign.id)}
                    className="w-full bg-green-600 text-white py-2 px-4 rounded-lg hover:bg-green-700 transition-colors"
                    >
                    Withdraw Funds
                    </button>
                )}
                </div>
            </div>
            ))}
        </div>
        </div>
  )
}

export default MyCampaigns