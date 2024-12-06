import { useParams, useNavigate } from 'react-router-dom';
import { Button } from './ui/button';
import { BsArrowLeft, BsTrophy } from 'react-icons/bs';
import { FaCoins } from 'react-icons/fa';
import { Confetti } from './ui/confetti';

export function HuntEnd() {
  const { huntId } = useParams();
  const navigate = useNavigate();

  // Mock data - replace with API call
  const huntData = {
    title: "Ethereum Treasure Quest",
    totalReward: "0.45 ETH",
    description: "You've successfully completed all the challenges and found the treasure!"
  };

  const handleClaim = async () => {
    // Add claim logic here
    console.log('Claiming reward...');
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-green/10 to-white pt-20 px-4">
      <div className="max-w-4xl mx-auto">
        <div className="bg-white rounded-xl shadow-lg overflow-hidden border-2 border-green/20">
          {/* Header */}
          <div className="bg-gradient-to-r from-green to-light-green p-6 text-white">
            <div className="flex items-center justify-between mb-4">
              <Button
                onClick={() => navigate('/')}
                variant="ghost"
                className="text-white hover:bg-white/20"
              >
                <BsArrowLeft className="mr-2" />
                Back to Hunts
              </Button>
            </div>
            <h1 className="text-4xl font-bold mb-2">{huntData.title}</h1>
          </div>

          {/* Success Content */}
          <div className="p-12 flex flex-col items-center">
            {/* Trophy Icon with Glow Effect */}
            <div className="mb-8 relative">
              <div className="absolute inset-0 bg-yellow/30 blur-xl rounded-full"></div>
              <BsTrophy className="w-32 h-32 text-yellow relative animate-bounce-slow" />
            </div>

            {/* Confetti Effect */}
            <Confetti
              style={{
                position: 'fixed',
                width: '100%',
                height: '100%',
                top: 0,
                left: 0,
                zIndex: 0,
                pointerEvents: 'none'
              }}
              options={{
                particleCount: 100,
                spread: 70,
                origin: { y: 0.6 }
              }}
            />

            {/* Success Message */}
            <h2 className="text-4xl font-bold text-gray-900 mb-4 text-center">
              Treasure Found!
            </h2>
            <p className="text-xl text-gray-600 mb-8 text-center max-w-2xl">
              {huntData.description}
            </p>

            {/* Reward Display */}
            <div className="bg-gray-50 rounded-xl p-6 mb-8 flex items-center gap-4">
              <FaCoins className="w-8 h-8 text-yellow" />
              <div>
                <p className="text-sm text-gray-600">Your Reward</p>
                <p className="text-2xl font-bold text-green">{huntData.totalReward}</p>
              </div>
            </div>

            {/* Claim Button */}
            <Button
              onClick={handleClaim}
              size="lg"
              className="bg-green hover:bg-light-green text-white px-12 py-6 text-xl shadow-lg shadow-green/20 transition-all hover:scale-105"
            >
              <FaCoins className="mr-2" />
              Claim Your Treasure
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}
