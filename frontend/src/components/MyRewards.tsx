import { ArrowLeft, Percent } from 'lucide-react'

interface RewardCard {
  code: string
  description: string
  isExpired: boolean
  expiryDate?: string 
  type: "discount" | "boba"
  isActive?: boolean
}

const rewardCards: RewardCard[] = [
  {
    code: "BINGE150",
    description: "Get 10% OFF upto ₹150 on your next dining bill",
    isExpired: false,
    type: "discount",
    isActive: true
  },
  {
    code: "BINGE100",
    description: "Get Flat ₹100 OFF on your next dining bill",
    isExpired: true,
    expiryDate: "17 Nov",
    type: "discount"
  },
  {
    code: "BINGE150",
    description: "Get 10% OFF upto ₹150 on your next dining bill",
    isExpired: true,
    expiryDate: "9 Nov",
    type: "discount"
  },
  {
    code: "",
    description: "",
    isExpired: true,
    expiryDate: "1 Nov",
    type: "discount"
  },
  {
    code: "FREE Boba tea",
    description: "Get a free Boba Tea at Chai Point",
    isExpired: true,
    expiryDate: "16 Sep",
    type: "boba"
  },
  {
    code: "FREE Boba tea",
    description: "Get a free Boba Tea at Chai Point",
    isExpired: true,
    expiryDate: "8 Aug",
    type: "boba"
  }
]

export default function MyRewards() {
  return (
    <div className="min-h-screen bg-[#121212] text-white p-4">
      {/* Header */}
      <div className="flex items-center gap-4 mb-8">
        <button className="p-2">
          <ArrowLeft className="w-6 h-6" />
        </button>
        <h1 className="text-2xl font-semibold">Your Dining Rewards</h1>
      </div>

      {/* Scratch Cards Section */}
      <div className="mb-6">
        <h2 className="text-3xl font-bold mb-6">Your scratch cards</h2>
        <div className="grid grid-cols-2 gap-3">
          {rewardCards.map((card, index) => (
            <div
              key={index}
              className={`rounded-2xl p-4 flex flex-col gap-2 ${
                card.isExpired ? "bg-[#1E1E1E]" : "bg-[#1E1E1E]"
              }`}
            >
              {/* Icon */}
              {card.type === "discount" ? (
                <div
                  className={`w-10 h-10 rounded-full flex items-center justify-center ${
                    card.isActive ? "bg-blue-600" : "bg-gray-700"
                  }`}
                >
                  <Percent className="w-5 h-5" />
                </div>
              ) : (
                <div className="w-10 h-10">
                </div>
              )}

              {/* Content */}
              <div className="space-y-0.5">
                <h3
                  className={`text-lg font-bold ${
                    card.isExpired ? "text-gray-500" : "text-white"
                  }`}
                >
                  {card.code}
                </h3>
                <p
                  className={`text-xs ${
                    card.isExpired ? "text-gray-600" : "text-gray-400"
                  }`}
                >
                  {card.description}
                </p>
              </div>

              {/* Divider */}
              <div className="border-t border-dashed border-gray-800 my-2"></div>

              {/* Footer */}
              {card.isExpired ? (
                <p className="text-gray-500 text-xs">Expired on {card.expiryDate}</p>
              ) : (
                <button className="text-red-400 text-xs font-medium">View details</button>
              )}
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}

