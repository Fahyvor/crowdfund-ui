import { useState, useEffect } from 'react';
import { Calendar, Target, Users, Clock, Plus, TrendingUp } from 'lucide-react';
import { ToastContainer, toast } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import { useWallet } from '@solana/wallet-adapter-react';
import type { WalletContextState } from '@solana/wallet-adapter-react';
import { Wallet } from '@project-serum/anchor';
import MyCampaigns from '../components/MyCampaigns';
import MyDonations from '../components/MyDonations';
import CreateCampaign from '../components/CreateCampaign';
import { useMockCampaigns } from '../hook/useMockCampaign';

interface Donation {
  id: string;
  donor: string;
  campaignId: string;
  amount: number; // in lamports
  refunded: boolean;
  timestamp: number;
}

export default function CrowdfundingUI() {
  const {campaigns, setCampaigns } = useMockCampaigns();
  const [donations, setDonations] = useState<Donation[]>([]);
  const [activeTab, setActiveTab] = useState<
    'browse' | 'create' | 'my-campaigns' | 'my-donations'
  >('browse');
  const [userAddress, setUserAddress] = useState('');


  function getWalletAdapterWallet(walletContext: WalletContextState): Wallet {
    if (
      !wallet ||
      // !wallet.connected ||
      !wallet.publicKey ||
      !wallet.signTransaction ||
      !wallet.signAllTransactions ||
      !walletContext.publicKey ||
      !walletContext.signTransaction ||
      !walletContext.signAllTransactions
    ) {
      throw new Error('Wallet is not fully connected or missing signing methods.');
    }

    return {
      publicKey: walletContext.publicKey,
      signTransaction: walletContext.signTransaction,
      signAllTransactions: walletContext.signAllTransactions,
      //  payer: walletContext.payer,
    };
  } 

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

  // Defensive check to only get wallet if connected
  let wallet: Wallet | null = null;
  try {
    wallet = getWalletAdapterWallet(walletContext);
  } catch (err) {
    wallet = null;
    console.log(err)
  }

  const donate = (campaignId: string, amount: number) => {
    const campaign = campaigns.find((c) => c.id === campaignId);
    if (!campaign || !campaign.isActive) {
      toast.error('Cannot donate to this campaign');
      return;
    }

    const donation: Donation = {
      id: Date.now().toString(),
      donor: userAddress,
      campaignId,
      amount: amount * 1_000_000,
      refunded: false,
      timestamp: Date.now(),
    };

    setDonations([...donations, donation]);

    const updatedCampaigns = campaigns.map((c) => {
      if (c.id === campaignId) {
        const newRaisedAmount = c.raisedAmount + amount * 1_000_000;
        return {
          ...c,
          raisedAmount: newRaisedAmount,
          isGoalMet: newRaisedAmount >= c.goal,
        };
      }
      return c;
    });

    setCampaigns(updatedCampaigns);
    toast.success(`Donated ${amount.toFixed(2)} SOL`);
  };

  // Filter campaigns by tab
  // const filteredCampaigns = campaigns.filter((campaign) => {
  //   switch (activeTab) {
  //     case 'browse':
  //       return campaign.isActive;
  //     case 'my-campaigns':
  //       return campaign.owner === userAddress;
  //     case 'my-donations':
  //       return donations.some((d) => d.campaignId === campaign.id && d.donor === userAddress);
  //     default:
  //       return true;
  //   }
  // });

   const formatDate = (timestamp: number) => {
    return new Date(timestamp).toLocaleDateString();
  };

  const formatSOL = (lamports: number) => {
    return (lamports / 1000000).toFixed(2);
  };

  const getProgressPercentage = (raised: number, goal: number) => {
    return Math.min((raised / goal) * 100, 100);
  };

  const getDaysRemaining = (deadline: number) => {
    const now = Date.now();
    const diff = deadline - now;
    if (diff <= 0) return 0;
    return Math.ceil(diff / (24 * 60 * 60 * 1000));
  };


  // JSX render
  return (
     <div className="min-h-screen font-montserrat bg-gradient-to-br from-purple-50 via-blue-50 to-indigo-100">
      <ToastContainer />
      {/* Navigation */}
      <nav className="max-w-7xl mx-auto px-4 py-6">
        <div className="flex space-x-1 bg-white/60 backdrop-blur-sm p-1 rounded-xl border border-gray-200">
          {[
            { id: 'browse', label: 'Browse Campaigns', icon: TrendingUp },
            { id: 'create', label: 'Create Campaign', icon: Plus },
            { id: 'my-campaigns', label: 'My Campaigns', icon: Target },
            { id: 'my-donations', label: 'My Donations', icon: Users }
          ].map(tab => {
            const Icon = tab.icon;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id as never)}
                className={`flex items-center space-x-2 px-4 py-2 rounded-lg transition-all duration-200 ${
                  activeTab === tab.id
                    ? 'bg-white text-purple-600 shadow-md'
                    : 'text-gray-600 hover:text-gray-900 hover:bg-white/50'
                }`}
              >
                <Icon className="w-4 h-4" />
                <span className="font-medium">{tab.label}</span>
              </button>
            );
          })}
        </div>
      </nav>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 pb-12">
        {activeTab === 'browse' && (
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
            {campaigns.map(campaign => (
              <div key={campaign.id} className="bg-white/70 backdrop-blur-sm rounded-xl border border-gray-200 p-6 hover:shadow-xl transition-all duration-200">
                <div className="flex items-start justify-between mb-4">
                  <h3 className="text-xl font-bold text-gray-900 line-clamp-2">{campaign.title}</h3>
                  <div className={`px-3 py-1 rounded-full text-xs font-medium ${
                    campaign.isActive 
                      ? 'bg-green-100 text-green-700' 
                      : campaign.isGoalMet 
                        ? 'bg-blue-100 text-blue-700'
                        : 'bg-red-100 text-red-700'
                  }`}>
                    {campaign.isActive ? 'Active' : campaign.isGoalMet ? 'Funded' : 'Ended'}
                  </div>
                </div>
                
                <p className="text-gray-600 mb-4 line-clamp-3">{campaign.description}</p>
                
                <div className="space-y-4">
                  <div>
                    <div className="flex justify-between text-sm text-gray-600 mb-1">
                      <span>Progress</span>
                      <span>{getProgressPercentage(campaign.raisedAmount, campaign.goal).toFixed(1)}%</span>
                    </div>
                    <div className="w-full bg-gray-200 rounded-full h-2">
                      <div 
                        className="bg-gradient-to-r from-purple-500 to-blue-500 h-2 rounded-full transition-all duration-300"
                        style={{ width: `${getProgressPercentage(campaign.raisedAmount, campaign.goal)}%` }}
                      ></div>
                    </div>
                  </div>
                  
                  <div className="grid grid-cols-2 gap-4 text-sm">
                    <div>
                      <div className="text-gray-500">Raised</div>
                      <div className="font-bold text-lg">{formatSOL(campaign.raisedAmount)} SOL</div>
                    </div>
                    <div>
                      <div className="text-gray-500">Goal</div>
                      <div className="font-bold text-lg">{formatSOL(campaign.goal)} SOL</div>
                    </div>
                  </div>
                  
                  <div className="flex items-center justify-between text-sm text-gray-600">
                    <div className="flex items-center space-x-1">
                      <Calendar className="w-4 h-4" />
                      <span>{getDaysRemaining(campaign.deadline)} days left</span>
                    </div>
                    <div className="flex items-center space-x-1">
                      <Clock className="w-4 h-4" />
                      <span>Ends {formatDate(campaign.deadline)}</span>
                    </div>
                  </div>
                  
                  {wallet && campaign.isActive && (
                    <div className="flex space-x-2">
                      <button
                        onClick={() => donate(campaign.id, 1)}
                        className="flex-1 bg-gradient-to-r from-purple-600 to-blue-600 text-white py-2 px-4 rounded-lg hover:from-purple-700 hover:to-blue-700 transition-all duration-200 text-sm font-medium"
                      >
                        Donate 1 SOL
                      </button>
                      <button
                        onClick={() => donate(campaign.id, 5)}
                        className="flex-1 bg-gradient-to-r from-blue-600 to-indigo-600 text-white py-2 px-4 rounded-lg hover:from-blue-700 hover:to-indigo-700 transition-all duration-200 text-sm font-medium"
                      >
                        Donate 5 SOL
                      </button>
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}

        {activeTab === 'create' && (
          <CreateCampaign />
        )}

        {activeTab === 'my-campaigns' && (
          <MyCampaigns />
        )}

        {activeTab === 'my-donations' && (
          <MyDonations />
        )}
      </main>
    </div>
  );
}

interface DonateButtonProps {
  campaignId: string;
  onDonate: (campaignId: string, amount: number) => void;
}

function DonateButton({ campaignId, onDonate }: DonateButtonProps) {
  const [amount, setAmount] = useState('');
  const [loading, setLoading] = useState(false);

  const handleDonate = () => {
    const num = parseFloat(amount);
    if (isNaN(num) || num <= 0) {
      toast.error('Please enter a valid donation amount');
      return;
    }

    setLoading(true);
    onDonate(campaignId, num);
    setAmount('');
    setLoading(false);
  };

  return (
    <div className="flex space-x-2">
      <input
        type="number"
        min="0.01"
        step="0.01"
        className="input input-bordered flex-grow"
        placeholder="Amount (SOL)"
        value={amount}
        onChange={(e) => setAmount(e.target.value)}
      />
      <button
        className="btn btn-primary"
        onClick={handleDonate}
        disabled={loading}
      >
        {loading ? 'Donating...' : 'Donate'}
      </button>
    </div>
  );
}
