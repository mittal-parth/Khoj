import { TbLadder, TbChessKnight } from "react-icons/tb";
import { FaChess, FaDice } from "react-icons/fa";
import { BsFillCalendarDateFill } from "react-icons/bs";
import { useNavigate } from "react-router-dom";
import { useAccount, useReadContract } from "wagmi";
import { huntABI } from "../assets/hunt_abi.ts"
import { useClaudeRiddles } from "@/hooks/useClaudeRiddles";
import {
  Transaction,
  TransactionButton,
} from '@coinbase/onchainkit/transaction';

export function Hunts() {

  const { address } = useAccount();

  const navigate = useNavigate();
  const { fetchRiddles, isLoading } = useClaudeRiddles();

  const handleHuntClick = async (huntId: number) => {
    console.log("Hunt ID:", huntId);
   
    await fetchRiddles(huntId.toString());
    navigate(`/hunt/${huntId}/clue/1`);
  };

  const { data: hunts } = useReadContract({
    address: '0x6a96140C2C61BEd3A1aad40663dfC58eB500f5db',
    abi: huntABI,
    functionName: "getAllHunts",
    args: [],
  })

  console.log(hunts);

  function formatDate(date: number) {
    const dateObj = new Date(date);
    const year = dateObj.getFullYear();
    const month = String(dateObj.getMonth() + 1).padStart(2, '0');
    const day = String(dateObj.getDate()).padStart(2, '0');

    return Number(`${year}${month}${day}`);
  }
  
  let today = formatDate(Date.now()); 
  
  console.log("today", today);

  console.log(hunts && hunts[5] ? (new Date(Number(BigInt(hunts[5].startTime))).getTime()) : null)

  // Array of background colors and icons to rotate through
  const bgColors = ['bg-green', 'bg-orange', 'bg-yellow', 'bg-pink', 'bg-red'];
  const icons = [
    <TbLadder className="w-10 h-10 text-white" />,
    <TbChessKnight className="w-10 h-10 text-white" />,
    <FaChess className="w-10 h-10 text-white" />,
    <FaDice className="w-10 h-10 text-white" />
  ];

  return (
    <div className="pt-16 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto mb-[90px]">
      <h1 className="text-3xl font-bold my-8 text-green drop-shadow-xl">Hunts</h1>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
        {hunts?.slice(1).map((hunt, index) => (
          <div
            key={index}
            className="flex 
         bg-white rounded-lg h-48
        border-black 
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
              className={`w-1/4 flex items-center justify-center ${bgColors[index % bgColors.length]}`}
            >
              {icons[index % icons.length]}
            </div>

            <div className="w-3/4 p-5 flex flex-col justify-between">
              <div>
                <h2 className="text-xl font-semibold text-gray-800 mb-2 h-[32px] overflow-hidden">
                  {hunt.name}
                </h2>
                <p className="text-[0.85rem] text-gray-600 line-clamp-2">
                  {hunt.description}
                </p>
              </div>

              <div className="mt-auto">
                <div className="flex items-center gap-1 text-gray-500 text-sm mb-3">
                  <BsFillCalendarDateFill className="w-4 h-4" />
                  <span>
                    {new Date(Number(hunt.startTime.toString().substring(0, 4)), Number(hunt.startTime.toString().substring(4, 6)) - 1, Number(hunt.startTime.toString().substring(6, 8))).toLocaleDateString("en-GB", {
                      day: "numeric",
                      month: "short",
                      year: "numeric",
                    })}
                  </span>
                </div>
                <Transaction
                  calls={
                    [
                      {
                        address: '0x6a96140C2C61BEd3A1aad40663dfC58eB500f5db',
                        abi: huntABI,
                        functionName: 'registerForHunt',
                        args: [index, address, 'https://ethunt.vercel.app/metadata.json'],
                      },
                    ]
                  }
                  className=""
                  chainId={84532}
                  onError={(error) => console.log(error)}
                  onSuccess={() => handleHuntClick(index)}
                >
                  <TransactionButton

                    text={(new Date(Number(BigInt(hunt.startTime))).getTime()) > today ? "Coming Soon" : "Register"}
                    className={`w-full py-1.5 text-sm font-medium rounded-md ${(new Date(Number(hunt.startTime)).getTime()) <= today
                        ? "bg-yellow/40 border border-black text-black hover:bg-orange/90 "
                        : "bg-gray-300 cursor-not-allowed text-gray-500"
                      } transition-colors duration-300`}
                    disabled={isLoading || (new Date(Number(BigInt(hunt.startTime))).getTime()) > today}

                  />
                </Transaction>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
