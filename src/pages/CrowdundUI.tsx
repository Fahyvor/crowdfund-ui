import { useState, useEffect } from 'react';
import { Calendar, Target, Users, Clock, Plus, TrendingUp } from 'lucide-react';

interface Campaign {
  id: string;
  owner: string;
  title: string;
  description: string;
  goal: number;
  deadline: number;
  raisedAmount: number;
  isActive: boolean;
  isGoalMet: boolean;
}

interface Donation {
  id: string;
  donor: string;
  campaignId: string;
  amount: number;
  refunded: boolean;
  timestamp: number;
}

export default function CrowdfundingUI() {
  const [campaigns, setCampaigns] = useState<Campaign[]>([]);
  const [donations, setDonations] = useState<Donation[]>([]);
  const [activeTab, setActiveTab] = useState<'browse' | 'create' | 'my-campaigns' | 'my-donations'>('browse');
  const [walletConnected] = useState(false);
  const [userAddress] = useState('');
  // const [loading, setLoading] = useState(false);

  // Mock data for demonstration
  useEffect(() => {
    const mockCampaigns: Campaign[] = [
      {
        id: '1',
        owner: 'owner1',
        title: 'Solar Energy for Rural Schools',
        description: 'Help bring clean solar energy to rural schools in developing regions. This project will install solar panels and provide sustainable electricity to 5 schools.',
        goal: 50000,
        deadline: Date.now() + 30 * 24 * 60 * 60 * 1000, // 30 days from now
        raisedAmount: 32000,
        isActive: true,
        isGoalMet: false
      },
      {
        id: '2',
        owner: 'owner2',
        title: 'Community Garden Initiative',
        description: 'Create a sustainable community garden that will provide fresh produce for local families and teach children about sustainable farming.',
        goal: 15000,
        deadline: Date.now() + 45 * 24 * 60 * 60 * 1000, // 45 days from now
        raisedAmount: 8500,
        isActive: true,
        isGoalMet: false
      },
      {
        id: '3',
        owner: 'owner3',
        title: 'Emergency Water Wells',
        description: 'Drill emergency water wells in drought-affected areas to provide clean drinking water access to communities in need.',
        goal: 75000,
        deadline: Date.now() - 5 * 24 * 60 * 60 * 1000, // 5 days ago (ended)
        raisedAmount: 68000,
        isActive: false,
        isGoalMet: false
      }
    ];
    setCampaigns(mockCampaigns);
  }, []);

  const [newCampaign, setNewCampaign] = useState({
    title: '',
    description: '',
    goal: '',
    deadline: ''
  });

  // const connectWallet = () => {
  //   setWalletConnected(true);
  //   setUserAddress('7x9WiQxQxG...');
  // };

  const createCampaign = () => {
    if (!newCampaign.title || !newCampaign.description || !newCampaign.goal || !newCampaign.deadline) {
      alert('Please fill in all fields');
      return;
    }

    const campaign: Campaign = {
      id: Date.now().toString(),
      owner: userAddress,
      title: newCampaign.title,
      description: newCampaign.description,
      goal: parseFloat(newCampaign.goal) * 1000000, // Convert to lamports
      deadline: new Date(newCampaign.deadline).getTime(),
      raisedAmount: 0,
      isActive: true,
      isGoalMet: false
    };

    setCampaigns([...campaigns, campaign]);
    setNewCampaign({ title: '', description: '', goal: '', deadline: '' });
    setActiveTab('browse');
  };

  const donate = (campaignId: string, amount: number) => {
    const campaign = campaigns.find(c => c.id === campaignId);
    if (!campaign || !campaign.isActive) return;

    const donation: Donation = {
      id: Date.now().toString(),
      donor: userAddress,
      campaignId,
      amount: amount * 1000000, // Convert to lamports
      refunded: false,
      timestamp: Date.now()
    };

    setDonations([...donations, donation]);
    
    const updatedCampaigns = campaigns.map(c => {
      if (c.id === campaignId) {
        const newRaisedAmount = c.raisedAmount + (amount * 1000000);
        return {
          ...c,
          raisedAmount: newRaisedAmount,
          isGoalMet: newRaisedAmount >= c.goal
        };
      }
      return c;
    });
    setCampaigns(updatedCampaigns);
  };

  const withdraw = (campaignId: string) => {
    const campaign = campaigns.find(c => c.id === campaignId);
    if (!campaign || campaign.isActive || !campaign.isGoalMet || campaign.owner !== userAddress) return;
    
    alert(`Withdrew ${(campaign.raisedAmount / 1000000).toFixed(2)} SOL from ${campaign.title}`);
  };

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

  const getProgressPercentage = (raised: number, goal: number) => {
    return Math.min((raised / goal) * 100, 100);
  };

  const getDaysRemaining = (deadline: number) => {
    const now = Date.now();
    const diff = deadline - now;
    if (diff <= 0) return 0;
    return Math.ceil(diff / (24 * 60 * 60 * 1000));
  };

  return (
    <div className="min-h-screen font-montserrat bg-gradient-to-br from-purple-50 via-blue-50 to-indigo-100">
      {/* Header */}
      {/* <header className="bg-white/80 backdrop-blur-md border-b border-gray-200 sticky top-0 z-50">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <div className="w-10 h-10 bg-gradient-to-r from-purple-600 to-blue-600 rounded-xl flex items-center justify-center">
                <Target className="w-6 h-6 text-white" />
              </div>
              <h1 className="text-2xl font-bold bg-gradient-to-r from-purple-600 to-blue-600 bg-clip-text text-transparent">
                CrowdFund
              </h1>
            </div>
            
            <div className="flex items-center space-x-4">
              {walletConnected ? (
                <div className="flex items-center space-x-3 bg-green-50 border border-green-200 rounded-lg px-4 py-2">
                  <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                  <span className="text-sm font-medium text-green-700">{userAddress}</span>
                </div>
              ) : (
                <button
                  onClick={connectWallet}
                  className="flex items-center space-x-2 bg-gradient-to-r from-purple-600 to-blue-600 text-white px-6 py-2 rounded-lg hover:from-purple-700 hover:to-blue-700 transition-all duration-200 shadow-lg"
                >
                  <Wallet className="w-4 h-4" />
                  <span>Connect Wallet</span>
                </button>
              )}
            </div>
          </div>
        </div>
      </header> */}

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
                  
                  {walletConnected && campaign.isActive && (
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
          <div className="max-w-2xl mx-auto">
            <div className="bg-white/70 backdrop-blur-sm rounded-xl border border-gray-200 p-8">
              <h2 className="text-2xl font-bold text-gray-900 mb-6">Create New Campaign</h2>
              
              <div className="space-y-6">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Campaign Title</label>
                  <input
                    type="text"
                    value={newCampaign.title}
                    onChange={(e) => setNewCampaign({...newCampaign, title: e.target.value})}
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                    placeholder="Enter campaign title..."
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Description</label>
                  <textarea
                    value={newCampaign.description}
                    onChange={(e) => setNewCampaign({...newCampaign, description: e.target.value})}
                    rows={4}
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                    placeholder="Describe your campaign..."
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Funding Goal (SOL)</label>
                  <input
                    type="number"
                    value={newCampaign.goal}
                    onChange={(e) => setNewCampaign({...newCampaign, goal: e.target.value})}
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
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
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                    min={new Date().toISOString().split('T')[0]}
                  />
                </div>
                
                <button
                  onClick={createCampaign}
                  disabled={!walletConnected}
                  className="w-full bg-gradient-to-r from-purple-600 to-blue-600 text-white py-3 px-6 rounded-lg hover:from-purple-700 hover:to-blue-700 transition-all duration-200 font-medium disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {walletConnected ? 'Create Campaign' : 'Connect Wallet First'}
                </button>
              </div>
            </div>
          </div>
        )}

        {activeTab === 'my-campaigns' && (
          <div>
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
        )}

        {activeTab === 'my-donations' && (
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
        )}
      </main>
    </div>
  );
}