import { motion } from "framer-motion";
import { BsLightbulb, BsShield, BsCoin } from "react-icons/bs";
import { FaEthereum } from "react-icons/fa";

export function About() {
  const features = [
    {
      icon: <BsLightbulb />,
      title: "Educational Hunts",
      description:
        "Learn about blockchain and Web3 through interactive treasure hunts",
    },
    {
      icon: <BsShield />,
      title: "Trust Network",
      description:
        "Build your reputation and earn trust scores as you complete challenges",
    },
    {
      icon: <BsCoin />,
      title: "Real Rewards",
      description:
        "Earn cryptocurrency rewards for successfully completing hunts",
    },
  ];

  return (
    <div className="min-h-screen bg-linear-to-b from-green/10 to-white pt-16 sm:pt-20 px-2 sm:px-4">
      <div className="max-w-4xl mx-auto">
        <motion.div
          initial={{ scale: 0.9, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          transition={{ duration: 0.8 }}
          className="bg-white rounded-xl shadow-lg overflow-hidden border-2 border-green/20 hover:shadow-2xl transition-all duration-300"
        >
          {/* Header */}
          <div className="bg-linear-to-r from-green to-light-green p-6 sm:p-12 text-white text-center relative overflow-hidden">
            {/* Added animated background particles */}
            <motion.div
              animate={{
                rotate: 360,
                scale: [1, 1.2, 1],
              }}
              transition={{
                duration: 20,
                repeat: Infinity,
                ease: "linear",
              }}
              className="absolute inset-0 opacity-10"
              style={{
                background:
                  "radial-gradient(circle at center, rgba(255,255,255,0.8) 0%, transparent 70%)",
              }}
            />

            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6 }}
              className="flex items-center justify-center"
            >
              <motion.h1
                className="text-4xl sm:text-6xl font-bold"
                animate={{ scale: [1, 1.02, 1] }}
                transition={{ duration: 2, repeat: Infinity }}
              >
                Khoj
              </motion.h1>
            </motion.div>
            <motion.p
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.2 }}
              className="text-xl md:text-3xl font-base text-white/80 max-w-2xl mx-auto leading-relaxed mt-4"
            >
              A geo-location treasure hunt app that turns Web3 onboarding into an <span className="font-bold text-white bg-white/20 px-2 rounded-sm">adventure</span>.
            </motion.p>
          </div>

          {/* Main Content */}
          <div className="p-6 sm:p-12">
            {/* Introduction Section */}
            <motion.div
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.8 }}
              className="text-center mb-8 sm:mb-12"
            >
              <p className="text-lg text-gray-700 leading-relaxed mb-4">
                Users visit places, verify coordinates and earn onchain rewards, with the most Web2 friendly UX. Discover a new way to onboard users to Web3.
              </p>
              <p className="text-lg text-gray-700 leading-relaxed">
                ETHIndia'24 Finalist, supported by Polkadot Fast Grants.
              </p>
            </motion.div>

            {/* Mission Statement */}
            <motion.div
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.8 }}
              className="text-center mb-8 sm:mb-16"
            >
              <h2 className="text-2xl sm:text-3xl font-bold text-gray-900 mb-4">
                Our Mission
              </h2>
              <p className="text-lg sm:text-xl text-gray-600 max-w-2xl mx-auto">
                We're making blockchain education fun and rewarding through
                gamified learning experiences and real cryptocurrency rewards.
              </p>
            </motion.div>

            {/* Features Grid */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 sm:gap-8 mb-8 sm:mb-16">
              {features.map((feature, index) => (
                <motion.div
                  key={feature.title}
                  initial={{ opacity: 0, y: 20 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ delay: 0.2 * (index + 1) }}
                  whileHover={{
                    scale: 1.05,
                    rotate: [0, 1, -1, 0],
                    transition: { duration: 0.3 },
                  }}
                  className="bg-gray-50 rounded-xl p-6 text-center hover:shadow-lg transition-all cursor-pointer"
                >
                  <motion.div
                    className="text-4xl text-green mb-4 flex justify-center"
                    whileHover={{ rotate: 360 }}
                    transition={{ duration: 0.6 }}
                  >
                    {feature.icon}
                  </motion.div>
                  <h3 className="text-xl font-bold text-gray-900 mb-2">
                    {feature.title}
                  </h3>
                  <p className="text-gray-600">{feature.description}</p>
                </motion.div>
              ))}
            </div>

            {/* Stats Section */}
            <motion.div
              initial={{ opacity: 0 }}
              whileInView={{ opacity: 1 }}
              viewport={{ once: true }}
              transition={{ delay: 0.4 }}
              whileHover={{ scale: 1.02 }}
              className="bg-gray-50 rounded-xl p-6 sm:p-8 flex flex-col sm:flex-row justify-around items-center gap-6 sm:gap-0"
            >
              <motion.div
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                transition={{ type: "spring", stiffness: 100 }}
                className="text-center"
              >
                <div className="text-4xl font-bold text-green mb-2">1000+</div>
                <div className="text-gray-600">Active Hunters</div>
              </motion.div>
              <motion.div
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                transition={{ type: "spring", stiffness: 100 }}
                className="text-center"
              >
                <div className="text-4xl font-bold text-green mb-2">50+</div>
                <div className="text-gray-600">Treasure Hunts</div>
              </motion.div>
              <motion.div
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                transition={{ type: "spring", stiffness: 100 }}
                className="text-center"
              >
                <div className="flex items-center justify-center text-4xl font-bold text-green mb-2">
                  <FaEthereum className="mr-1" />
                  <span>100+</span>
                </div>
                <div className="text-gray-600">ETH Rewarded</div>
              </motion.div>
            </motion.div>
          </div>
        </motion.div>
      </div>
    </div>
  );
}
