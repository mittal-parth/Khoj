import { VscSnake } from "react-icons/vsc";
import { TbChessKnight } from "react-icons/tb";
import { TbLadder } from "react-icons/tb";
import { BsFillCalendarDateFill } from "react-icons/bs";
import { Link, useNavigate } from "react-router-dom";
import { useClaudeRiddles } from "@/hooks/useClaudeRiddles";

export function Hunts() {
  
  const navigate = useNavigate();
  const { fetchRiddles, isLoading } = useClaudeRiddles();

  const handleHuntClick = async (huntId: number) => {
    await fetchRiddles(huntId.toString());
    navigate(`/hunt/${huntId}/clue/1`);
  };

  const hunts = [
    {
      id: 1,
      title: "Ethereum Treasure",
      description:
        "Follow the clues across the Ethereum blockchain to find hidden treasures and win rewards!",
      startDate: "2024-02-01",
      isRegistrationOpen: true,
      icon: <VscSnake className="w-10 h-10 text-white" />,
      bgColor: "bg-green",
      firstClueId: 1,
    },
    {
      id: 2,
      title: "NFT Explorer Challenge",
      description:
        "Discover rare NFTs and solve puzzles in this exciting blockchain adventure.",
      startDate: "2024-02-15",
      isRegistrationOpen: true,
      icon: <TbChessKnight className="w-10 h-10 text-white" />,
      bgColor: "bg-orange",
      firstClueId: 2,
    },
    {
      id: 3,
      title: "DeFi Detective Hunt",
      description:
        "Navigate through DeFi protocols solving mysteries and earning tokens.",
      startDate: "2024-03-01",
      isRegistrationOpen: false,
      icon: <TbLadder className="w-10 h-10 text-white" />,
      bgColor: "bg-pink",
      firstClueId: 3,
    },
    {
      id: 4,
      title: "NFT Explorer Challenge",
      description:
        "Discover rare NFTs and solve puzzles in this exciting blockchain adventure.",
      startDate: "2024-02-15",
      isRegistrationOpen: true,
      icon: <TbChessKnight className="w-10 h-10 text-white" />,
      bgColor: "bg-orange",
    },
    {
      id: 5,
      title: "Ethereum Treasure Quest",
      description:
        "Follow the clues across the Ethereum blockchain to find hidden treasures and win rewards!",
      startDate: "2024-02-01",
      isRegistrationOpen: true,
      icon: <VscSnake className="w-10 h-10 text-white" />,
      bgColor: "bg-green",
    },
    {
      id: 6,
      title: "DeFi Detective Hunt",
      description:
        "Navigate through DeFi protocols solving mysteries and earning tokens.",
      startDate: "2024-03-01",
      isRegistrationOpen: false,
      icon: <TbLadder className="w-10 h-10 text-white" />,
      bgColor: "bg-pink",
    },
    {
      id: 7,
      title: "NFT Explorer Challenge",
      description:
        "Discover rare NFTs and solve puzzles in this exciting blockchain adventure.",
      startDate: "2024-02-15",
      isRegistrationOpen: true,
      icon: <TbChessKnight className="w-10 h-10 text-white" />,
      bgColor: "bg-orange",
    },
    {
      id: 8,
      title: "DeFi Detective Hunt",
      description:
        "Navigate through DeFi protocols solving mysteries and earning tokens.",
      startDate: "2024-03-01",
      isRegistrationOpen: false,
      icon: <TbLadder className="w-10 h-10 text-white" />,
      bgColor: "bg-pink",
    },
    {
      id: 9,
      title: "Ethereum Treasure",
      description:
        "Follow the clues across the Ethereum blockchain to find hidden treasures and win rewards!",
      startDate: "2024-02-01",
      isRegistrationOpen: true,
      icon: <VscSnake className="w-10 h-10 text-white" />,
      bgColor: "bg-green",
    },
  ];

  return (
    <div className="pt-16 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto mb-8">
      <h1 className="text-3xl font-bold my-8 text-green drop-shadow-xl">Hunts</h1>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
        {hunts.map((hunt, index) => (
          <div
            key={index}
            className="flex 
         bg-white rounded-lg h-48
          border-2 border-black 
          relative  
          before:absolute 
          before:inset-0 
          before:rounded-lg
          before:border-[16px]
          before:border-black
          before:-translate-x-2
          before:translate-y-2
          before:-z-10
          border-[3px]"
          >
            <div
              className={`w-1/4 flex items-center justify-center ${hunt.bgColor}`}
            >
              {hunt.icon}
            </div>

            <div className="w-3/4 p-5 flex flex-col justify-between">
              <div>
                <h2 className="text-xl font-semibold text-gray-800 mb-2">
                  {hunt.title}
                </h2>
                <p className="text-[0.85rem] text-gray-600 line-clamp-2">
                  {hunt.description}
                </p>
              </div>

              <div className="mt-auto">
                <div className="flex items-center gap-1 text-gray-500 text-sm mb-3">
                  <BsFillCalendarDateFill className="w-4 h-4" />
                  <span>
                    {new Date(hunt.startDate).toLocaleDateString("en-GB", {
                      day: "numeric",
                      month: "short",
                      year: "numeric",
                    })}
                  </span>
                </div>

                <button
                  className={`w-full py-1.5 text-sm font-medium text-white rounded-md ${
                    hunt.isRegistrationOpen
                      ? "bg-black hover:bg-gray-800"
                      : "bg-gray-300 cursor-not-allowed"
                  } transition-colors duration-300`}
                  disabled={!hunt.isRegistrationOpen || isLoading}
                  onClick={() => handleHuntClick(hunt.id)}
                >
                  <Link to={`/hunt/${hunt.id}/clue/1`}>
                    {hunt.isRegistrationOpen ? "Register" : "Coming Soon"}
                  </Link>
                </button>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
