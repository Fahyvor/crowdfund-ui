import { useEffect, useState } from 'react';

export interface Campaign {
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

export const useMockCampaigns = () => {
  const [campaigns, setCampaigns] = useState<Campaign[]>([]);

  useEffect(() => {
    const mockCampaigns: Campaign[] = [
      {
        id: '1',
        owner: 'owner1',
        title: 'Solar Energy for Rural Schools',
        description: 'Help bring clean solar energy to rural schools in developing regions...',
        goal: 50_000 * 1_000_000,
        deadline: Date.now() + 30 * 24 * 60 * 60 * 1000,
        raisedAmount: 32_000 * 1_000_000,
        isActive: true,
        isGoalMet: false,
      },
      {
        id: '2',
        owner: 'owner2',
        title: 'Community Garden Initiative',
        description: 'Create a sustainable community garden...',
        goal: 15_000 * 1_000_000,
        deadline: Date.now() + 45 * 24 * 60 * 60 * 1000,
        raisedAmount: 8_500 * 1_000_000,
        isActive: true,
        isGoalMet: false,
      },
      {
        id: '3',
        owner: 'owner3',
        title: 'Emergency Water Wells',
        description: 'Drill emergency water wells...',
        goal: 75_000 * 1_000_000,
        deadline: Date.now() - 5 * 24 * 60 * 60 * 1000,
        raisedAmount: 68_000 * 1_000_000,
        isActive: false,
        isGoalMet: false,
      },
    ];

    setCampaigns(mockCampaigns);
  }, []);

  return { campaigns, setCampaigns }; 
};
