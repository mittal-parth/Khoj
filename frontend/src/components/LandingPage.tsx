import { TbLadder, TbChessKnight, TbMapPin, TbTrophy, TbUsers, TbShield } from "react-icons/tb";
import { FaChess, FaDice, FaRocket, FaGem } from "react-icons/fa";
import { useNavigate } from "react-router-dom";
import { Button } from "./ui/button.tsx";

export function LandingPage() {
  const navigate = useNavigate();

  // Array of background colors and icons to rotate through (same as Hunts.tsx)
  const bgColors = ["bg-green", "bg-orange", "bg-yellow", "bg-pink", "bg-red"];
  const icons = [
    <TbLadder className="w-10 h-10 text-white" />,
    <TbChessKnight className="w-10 h-10 text-white" />,
    <FaChess className="w-10 h-10 text-white" />,
    <FaDice className="w-10 h-10 text-white" />,
  ];

  const features = [
    {
      icon: <TbMapPin className="w-8 h-8 text-green" />,
      title: "Location-Based Hunts",
      description: "Solve riddles and visit real-world locations to complete your treasure hunt adventure."
    },
    {
      icon: <TbTrophy className="w-8 h-8 text-yellow" />,
      title: "Earn Rewards",
      description: "Complete hunts to earn crypto rewards, NFTs, and build your reputation score."
    },
    {
      icon: <TbUsers className="w-8 h-8 text-pink" />,
      title: "Team Collaboration",
      description: "Work together with other hunters using built-in video chat and real-time coordination."
    },
    {
      icon: <TbShield className="w-8 h-8 text-orange" />,
      title: "Web3 Security",
      description: "Secure location verification and blockchain attestations powered by True Network."
    }
  ];

  const stats = [
    { number: "10+", label: "Active Hunters" },
    { number: "2+", label: "Treasure Hunts" },
    { number: "2", label: "Blockchain Networks" }
  ];

  return (
    <div className="min-h-screen bg-yellow/10">
      {/* Hero Section */}
      <div className="pt-16 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto">
        <div className="text-center py-16">
          <div className="flex justify-center mb-8">
            <div className="relative">
              <div className="w-32 h-32 bg-green rounded-full flex items-center justify-center shadow-2xl">
                <FaGem className="w-16 h-16 text-white" />
              </div>
              <div className="absolute -top-2 -right-2 w-8 h-8 bg-yellow rounded-full flex items-center justify-center">
                <TbTrophy className="w-5 h-5 text-white" />
              </div>
            </div>
          </div>
          
          <h1 className="text-6xl md:text-8xl font-bold text-green drop-shadow-xl mb-6">
            KHOJ
          </h1>
          <p className="text-2xl md:text-3xl text-gray-700 mb-4 font-semibold">
            Web3 Treasure Hunt Platform
          </p>
          <p className="text-lg md:text-xl text-gray-600 mb-12 max-w-3xl mx-auto">
            Embark on location-based treasure hunts, solve AI-powered riddles, and earn crypto rewards. 
            The future of gamified exploration is here!
          </p>
          
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Button
              onClick={() => navigate('/hunts')}
              className="bg-green/70 border border-green text-white font-semibold hover:bg-green hover:border-green shadow-md hover:shadow-lg transform hover:scale-[1.02] px-8 py-6 text-lg rounded-lg"
            >
              <FaRocket className="w-8 h-8 mr-2" />
              Start Hunting
            </Button>
            {/* <Button
              onClick={() => navigate('/about')}
              className="bg-yellow/70 border border-black text-white font-semibold hover:bg-yellow-600 hover:border-yellow-700 shadow-md hover:shadow-lg transform hover:scale-[1.02] px-8 py-4 text-lg rounded-lg"
            >
              Learn More
            </Button> */}
          </div>
        </div>

        {/* Stats Section */}
        <div className="grid grid-cols-2 md:grid-cols-3 gap-8 mb-20">
          {stats.map((stat, index) => (
            <div key={index} className="text-center">
              <div className={`w-16 h-16 mx-auto mb-4 rounded-full flex items-center justify-center ${bgColors[index % bgColors.length]}`}>
                {icons[index % icons.length]}
              </div>
              <div className="text-3xl font-bold text-gray-800 mb-2">{stat.number}</div>
              <div className="text-gray-600">{stat.label}</div>
            </div>
          ))}
        </div>

        {/* Features Section */}
        <div className="mb-20">
          <h2 className="text-4xl font-bold text-center text-gray-800 mb-16">
            Why Choose Khoj?
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
            {features.map((feature, index) => (
              <div
                key={index}
                className="bg-white rounded-lg p-6 shadow-lg border-2 border-gray-200 hover:border-green transition-all duration-300 hover:shadow-xl transform hover:scale-105"
              >
                <div className="mb-4">{feature.icon}</div>
                <h3 className="text-xl font-semibold text-gray-800 mb-3">{feature.title}</h3>
                <p className="text-gray-600">{feature.description}</p>
              </div>
            ))}
          </div>
        </div>

        {/* How It Works Section */}
        <div className="mb-20">
          <h2 className="text-4xl font-bold text-center text-gray-800 mb-16">
            How It Works
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <div className="text-center">
              <div className="w-20 h-20 bg-green rounded-full flex items-center justify-center mx-auto mb-6">
                <span className="text-3xl font-bold text-white">1</span>
              </div>
              <h3 className="text-xl font-semibold text-gray-800 mb-3">Register & Connect</h3>
              <p className="text-gray-600">Create your account and connect your Web3 wallet to get started</p>
            </div>
            <div className="text-center">
              <div className="w-20 h-20 bg-yellow rounded-full flex items-center justify-center mx-auto mb-6">
                <span className="text-3xl font-bold text-white">2</span>
              </div>
              <h3 className="text-xl font-semibold text-gray-800 mb-3">Solve Riddles</h3>
              <p className="text-gray-600">Use AI-powered clues to discover real-world locations and solve puzzles</p>
            </div>
            <div className="text-center">
              <div className="w-20 h-20 bg-pink rounded-full flex items-center justify-center mx-auto mb-6">
                <span className="text-3xl font-bold text-white">3</span>
              </div>
              <h3 className="text-xl font-semibold text-gray-800 mb-3">Earn Rewards</h3>
              <p className="text-gray-600">Complete hunts to earn crypto rewards, NFTs, and build your reputation</p>
            </div>
          </div>
        </div>

        {/* CTA Section */}
        <div className="text-center py-16 bg-gradient-to-r from-green/10 to-yellow/10 rounded-2xl mb-20">
          <h2 className="text-4xl font-bold text-gray-800 mb-6">
            Ready to Start Your Adventure?
          </h2>
          <p className="text-xl text-gray-600 mb-8 max-w-2xl mx-auto">
            Join thousands of hunters exploring the world one riddle at a time. 
            Your next treasure awaits!
          </p>
          <Button
            onClick={() => navigate('/hunts')}
            className="bg-green/70 border border-green text-white font-semibold hover:bg-green hover:border-green shadow-md hover:shadow-lg transform hover:scale-[1.02] px-12 py-4 text-xl rounded-lg"
          >
            <TbLadder className="w-6 h-6 mr-3" />
            Explore Hunts Now
          </Button>
        </div>

        {/* Footer Info */}
        <div className="text-center text-gray-500 pb-4">
          {/* <div className="flex justify-center items-center gap-2 mb-4">
            <BsGlobe className="w-5 h-5" />
            <span>Powered by Web3 Technology</span>
          </div> */}
          <p className="text-sm">
            Built with ❤️ during ETHIndia Hackathon 2024
          </p>
        </div>
      </div>
    </div>
  );
}
