import { MdOutlineLocalMall } from "react-icons/md";
import { CiCoffeeCup } from "react-icons/ci";
import { FaEthereum } from "react-icons/fa";
import { AiOutlineShoppingCart } from "react-icons/ai";
import { Label, Pie, PieChart } from "recharts";
import { useMemo } from "react";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { RewardCard } from "../types";
import {
  ChartConfig,
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
} from "@/components/ui/chart";

const chartData = [
  {
    segment: "Trust Score",
    value: Number(localStorage.getItem("trust_score")) || 0,
    fill: "#2d763f",
  },
  {
    segment: "Remaining",
    value: ((score) => 10 - score)(
      Number(localStorage.getItem("trust_score")) || 0
    ),
    fill: "#FFE8B3", // Soft amber/cream that complements yellow background
  },
];

const chartConfig = {
  value: {
    label: "Trust Score",
  },
  "Trust Score": {
    label: "Current Score",
    color: "bg-green",
  },
  Remaining: {
    label: "Remaining",
    color: "bg-gray",
  },
} satisfies ChartConfig;


const rewardCards: RewardCard[] = [
  {
    code: "FREE Coffee",
    description: "Get a free Coffee at Starbucks",
    isExpired: true,
    expiryDate: "8 Aug",
    icon: <CiCoffeeCup className="w-5 h-5 text-white" />,
  },
  {
    code: "BINGE150",
    description: "Get 10% OFF upto ₹150 on your next dining bill",
    isExpired: false,
    icon: <CiCoffeeCup className="w-5 h-5 text-white" />,
  },
  {
    code: "WEB3START",
    description: "Earn 0.01 ETH cashback on your first crypto transaction",
    isExpired: false,
    icon: <FaEthereum className="w-5 h-5 text-white" />,
  },
  {
    code: "WEB3START",
    description: "Earn 0.01 ETH cashback on your first crypto transaction",
    isExpired: true,
    icon: <FaEthereum className="w-5 h-5 text-white" />,
  },
  {
    code: "NFTLOOT",
    description: "Get a free NFT on purchases above ₹5000",
    isExpired: false,
    icon: <FaEthereum className="w-5 h-5 text-white" />,
  },
  {
    code: "SHOP200",
    description: "Get ₹200 OFF on your next shopping bill",
    isExpired: false,
    icon: <AiOutlineShoppingCart className="w-5 h-5 text-white" />,
  },
  {
    code: "CART100",
    description: "Flat ₹100 OFF on your cart value above ₹1000",
    isExpired: true,
    expiryDate: "3 Dec",
    icon: <MdOutlineLocalMall className="w-5 h-5 text-white" />,
  },
];

export function Rewards() {
  const trustScore = useMemo(() => {
    return Number(localStorage.getItem("trust_score")) || 0;
  }, []);

  // Background colors for reward cards (excluding yellow/chart-1 which is for Trust Score)
  const cardBackgroundColors = [
    "bg-chart-2",        // Purple
    "bg-chart-3",        // Red
    "bg-chart-4",        // Green/Teal
  ];
  
  // Separate active and expired rewards
  const activeRewards = rewardCards.filter(card => !card.isExpired);
  const expiredRewards = rewardCards.filter(card => card.isExpired);

  return (
    <div className="pt-16 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto mb-[90px]">
      <h2 className="text-3xl font-bold mt-12 mb-6 mx-2 text-green drop-shadow-xl">Analytics</h2>
      <div className="mb-6">

        <div className="flex flex-col md:flex-row gap-4 justify-center">
          <Card className="mt-4 w-full md:w-[400px] h-fit rounded-2xl p-4 flex flex-col gap-2 bg-chart-1 relative before:absolute before:inset-0 before:rounded-2xl before:border-8 before:border-chart-1 before:-translate-x-2 before:translate-y-2 before:-z-10 border-[3px] border-black transition-all">
            <CardHeader className="items-center pb-0">
              <CardTitle className="text-foreground">Trust Score</CardTitle>
              <CardDescription className="text-foreground/70">Your current standing</CardDescription>
            </CardHeader>
            <CardContent className="flex-1 pb-0">
              <ChartContainer
                config={chartConfig}
                className="mx-auto aspect-square max-h-[250px]"
              >
                <PieChart>
                  <ChartTooltip
                    cursor={false}
                    content={<ChartTooltipContent hideLabel />}
                  />
                  <Pie
                    data={chartData}
                    dataKey="value"
                    nameKey="segment"
                    innerRadius={60}
                    strokeWidth={5}
                  >
                    <Label
                      content={({ viewBox }) => {
                        if (viewBox && "cx" in viewBox && "cy" in viewBox) {
                          return (
                            <text
                              x={viewBox.cx}
                              y={viewBox.cy}
                              textAnchor="middle"
                              dominantBaseline="middle"
                              className="fill-foreground"
                            >
                              <tspan
                                x={viewBox.cx}
                                y={viewBox.cy}
                                className="fill-foreground text-3xl font-bold"
                              >
                                {trustScore}/10
                              </tspan>
                              <tspan
                                x={viewBox.cx}
                                y={(viewBox.cy || 0) + 24}
                                className="fill-foreground"
                              >
                                Trust Score
                              </tspan>
                            </text>
                          );
                        }
                      }}
                    />
                  </Pie>
                </PieChart>
              </ChartContainer>
            </CardContent>
            <CardFooter className="flex-col gap-2 text-sm">
              <div className="leading-none text-foreground/70">
                Higher trust, more rewards!
              </div>
            </CardFooter>
          </Card>
        </div>
        <h2 className="text-3xl font-bold mt-12 mb-6 mx-2 text-green drop-shadow-xl">Your Rewards</h2>
        <div className="grid grid-cols-2 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-8 mx-2">
          {activeRewards.map((card, index) => {
            // Get colors based on index rotation (only 3 colors now)
            const colorIndex = index % cardBackgroundColors.length;
            const borderIndex = (index + 1) % cardBackgroundColors.length;
            
            // Build full className strings for each color combination
            const getCardClasses = () => {
              // Map color combinations to full class strings (purple, red, green/teal - no yellow)
              const colorCombinations = [
                { bg: 0, border: 1, classes: "rounded-2xl p-4 flex flex-col gap-2 bg-chart-2 relative before:absolute before:inset-0 before:rounded-2xl before:border-8 before:border-chart-3 before:-translate-x-2 before:translate-y-2 before:-z-10 border-[3px] border-black transition-all" },
                { bg: 1, border: 2, classes: "rounded-2xl p-4 flex flex-col gap-2 bg-chart-3 relative before:absolute before:inset-0 before:rounded-2xl before:border-8 before:border-chart-4 before:-translate-x-2 before:translate-y-2 before:-z-10 border-[3px] border-black transition-all" },
                { bg: 2, border: 0, classes: "rounded-2xl p-4 flex flex-col gap-2 bg-chart-4 relative before:absolute before:inset-0 before:rounded-2xl before:border-8 before:border-chart-2 before:-translate-x-2 before:translate-y-2 before:-z-10 border-[3px] border-black transition-all" },
              ];
              
              const combo = colorCombinations.find(c => c.bg === colorIndex && c.border === borderIndex);
              return combo?.classes || colorCombinations[0].classes;
            };
            
            return (
              <div
                key={index}
                className={getCardClasses()}
              >
                <div className="w-10 h-10 rounded-full flex items-center justify-center bg-white/20">
                  {card.icon}
                </div>
                <div className="space-y-0.5">
                  <h3 className="text-lg font-bold text-white">
                    {card.code}
                  </h3>
                  <p className="text-xs text-white/80">
                    {card.description}
                  </p>
                </div>
                <div className="border-t border-dashed border-white/30 my-2"></div>
                <button className="text-white text-xs font-medium hover:text-white/80 transition-colors underline">
                  View details
                </button>
              </div>
            );
          })}
        </div>

        {/* Expired Rewards Section */}
        {expiredRewards.length > 0 && (
          <>
            <h2 className="text-3xl font-bold mt-12 mb-6 mx-2 text-gray-500 drop-shadow-xl">Expired Rewards</h2>
            <div className="grid grid-cols-2 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-8 mx-2">
              {expiredRewards.map((card, index) => (
                <div
                  key={index}
                  className="rounded-2xl p-4 flex flex-col gap-2 bg-gray-300 relative before:absolute before:inset-0 before:rounded-2xl before:border-8 before:border-gray-400 before:-translate-x-2 before:translate-y-2 before:-z-10 border-[3px] border-black transition-all"
                >
                  <div className="w-10 h-10 rounded-full flex items-center justify-center bg-gray-600">
                    {card.icon}
                  </div>
                  <div className="space-y-0.5">
                    <h3 className="text-lg font-bold text-gray-600">
                      {card.code}
                    </h3>
                    <p className="text-xs text-gray-500">
                      {card.description}
                    </p>
                  </div>
                  <div className="border-t border-dashed border-gray-400 my-2"></div>
                  <p className="text-gray-600 text-xs">
                    Expired on {card.expiryDate}
                  </p>
                </div>
              ))}
            </div>
          </>
        )}
      </div>
    </div>
  );
}
