import  { useState, useEffect } from 'react'
import { useWallet } from '@solana/wallet-adapter-react';
import { useMockCampaigns } from '../hook/useMockCampaign';

interface Donation {
  id: string;
  donor: string;
  campaignId: string;
  amount: number; // in lamports
  refunded: boolean;
  timestamp: number;
}

const MyDonations = () => {
    const [donations, setDonations] = useState<Donation[]>([]);
    const [userAddress, setUserAddress] = useState('');
    const {campaigns} = useMockCampaigns();

    const walletContext = useWallet();
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

      const refund = (donationId: string) => {
        const donation = donations.find(d => d.id === donationId);
        if (!donation || donation.refunded) return;

        const campaign = campaigns.find(c => c.id === donation.campaignId);
        if (!campaign || campaign.isActive || campaign.isGoalMet) return;

        const updatedDonations = donations.map(d => 
        d.id === donationId ? { ...d, refunded: true } : d
        );
        setDonations(updatedDonations);
        
        alert(`Refunded ${(donation.amount / 1000000).toFixed(2)} SOL`);
    };

    const formatDate = (timestamp: number) => {
        return new Date(timestamp).toLocaleDateString();
    };

    const formatSOL = (lamports: number) => {
        return (lamports / 1000000).toFixed(2);
    };

  return (
    <div>
        <h2 className="text-2xl font-bold text-gray-900 mb-6">My Donations</h2>
        <div className="space-y-4">
            {donations.filter(d => d.donor === userAddress).map(donation => {
            const campaign = campaigns.find(c => c.id === donation.campaignId);
            return (
                <div key={donation.id} className="bg-white/70 backdrop-blur-sm rounded-xl border border-gray-200 p-6">
                <div className="flex justify-between items-start">
                    <div>
                    <h3 className="font-bold text-lg">{campaign?.title}</h3>
                    <p className="text-gray-600">Donated {formatSOL(donation.amount)} SOL</p>
                    <p className="text-sm text-gray-500">on {formatDate(donation.timestamp)}</p>
                    </div>
                    <div className="flex items-center space-x-3">
                    {donation.refunded && (
                        <span className="bg-yellow-100 text-yellow-800 px-3 py-1 rounded-full text-sm font-medium">
                        Refunded
                        </span>
                    )}
                    {!donation.refunded && campaign && !campaign.isActive && !campaign.isGoalMet && (
                        <button
                        onClick={() => refund(donation.id)}
                        className="bg-red-600 text-white px-4 py-2 rounded-lg hover:bg-red-700 transition-colors text-sm"
                        >
                        Request Refund
                        </button>
                    )}
                    </div>
                </div>
                </div>
            );
            })}
        </div>
        </div>
  )
}

export default MyDonations