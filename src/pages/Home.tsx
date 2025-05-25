import Wallet from "../components/Wallet"
import React from 'react';
import CrowdfundingUI from "./CrowdundUI";
import { Target } from 'lucide-react';


const Home:React.FC = () => {
  
  return (
    <div className="font-montserrat">
       <header className="bg-white/80 backdrop-blur-md border-b border-gray-200 sticky top-0 z-50">
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
                <Wallet />
            </div>
          </div>
        </div>
      </header>
        <div className="wallet_nav flex justify-end shadow-md py-5 px-6">
        </div>

        <div className="crowdfunding_body">
          <CrowdfundingUI />
        </div>
    </div>
  )
}

export default Home