import { motion } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { 
  Map, 
  Trophy, 
  Users, 
  Search, 
  ArrowRight, 
  Gamepad2, 
  Gift, 
  Building, 
  Tent, 
  Dumbbell, 
  Camera,
  Rocket,
  Wallet,
  Footprints,
  Megaphone,
  Menu
} from 'lucide-react';
import {
  Drawer,
  DrawerContent,
  DrawerHeader,
  DrawerTitle,
  DrawerTrigger,
  DrawerClose,
} from "@/components/ui/drawer"

export const LandingPage = () => {
  const navigate = useNavigate();
  const [drawerOpen, setDrawerOpen] = useState(false);

  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        staggerChildren: 0.2
      }
    }
  };

  const itemVariants = {
    hidden: { y: 20, opacity: 0 },
    visible: {
      y: 0,
      opacity: 1,
      transition: {
        type: "spring" as const,
        stiffness: 100
      }
    }
  };

  const problems = [
    {
      title: "Decline in Real-World Exploration",
      description: "In a digital era, people often miss out on physical-world experiences.",
      icon: <Footprints className="w-8 h-8 mb-2" />,
      color: "bg-chart-1"
    },
    {
      title: "Lack of Engagement in Web3 Adoption",
      description: "Web3 adoption faces barriers due to its technical complexity and lack of relatable, engaging entry points for non-technical users.",
      icon: <Users className="w-8 h-8 mb-2" />,
      color: "bg-chart-2"
    },
    {
      title: "Limited Marketing Tools",
      description: "Brands and blockchain communities struggle to engage users meaningfully and are always on the lookout for new and interactive ways to interact with their users.",
      icon: <Megaphone className="w-8 h-8 mb-2" />,
      color: "bg-chart-3"
    }
  ];

  const useCases = [
    {
      title: "Educational Hunts",
      description: "Imagine learning about a museum or landmarks through Khoj.",
      icon: <Building className="w-8 h-8 mb-2" />,
      color: "bg-chart-1"
    },
    {
      title: "Co-branded Hunts",
      description: "Promote products or services creatively. Imagine UberEats x Khoj where clues are designed to pass through specific cafes.",
      icon: <Gift className="w-8 h-8 mb-2" />,
      color: "bg-chart-2"
    },
    {
      title: "Airdrops",
      description: "Distribute tokens through gamified participation. Token drops taken quite seriously.",
      icon: <Rocket className="w-8 h-8 mb-2" />,
      color: "bg-chart-3"
    },
    {
      title: "Event Engagement",
      description: "Enhance festivals and expos with interactive hunts. What if Halloween turned real fun!",
      icon: <Tent className="w-8 h-8 mb-2" />,
      color: "bg-chart-4"
    },
    {
      title: "Fitness Incentives",
      description: "Gamify physical activity with rewards. Imagine a 5K marathon blended with physical riddle solving.",
      icon: <Dumbbell className="w-8 h-8 mb-2" />,
      color: "bg-chart-5"
    },
    {
      title: "Tourism Promotion",
      description: "Drive interest in cultural and historical sites. Imagine a tour of the city of Venice through Khoj.",
      icon: <Camera className="w-8 h-8 mb-2" />,
      color: "bg-chart-1"
    },
    {
      title: "Team Building",
      description: "Events for corporates and companies to foster team collaboration.",
      icon: <Users className="w-8 h-8 mb-2" />,
      color: "bg-chart-2"
    }
  ];

  const steps = [
    {
      title: "Sign Up",
      description: "Get a new digital identity without worrying about wallets.",
      icon: <Wallet className="w-6 h-6" />
    },
    {
      title: "Explore Hunts",
      description: "Browse available treasure hunts in your city or area.",
      icon: <Search className="w-6 h-6" />
    },
    {
      title: "Form a Team",
      description: "Join forces with friends or compete solo.",
      icon: <Users className="w-6 h-6" />
    },
    {
      title: "Solve & Earn",
      description: "Solve riddles, visit locations, verify coordinates, and earn onchain rewards.",
      icon: <Trophy className="w-6 h-6" />
    }
  ];

  const scrollToSection = (id: string) => {
    // Close drawer first if open
    if (drawerOpen) {
      setDrawerOpen(false);
      // Wait for drawer to close before scrolling
      setTimeout(() => {
        const element = document.getElementById(id);
        if (element) {
          element.scrollIntoView({ behavior: 'smooth' });
        }
      }, 300); // Delay to allow drawer animation to complete
    } else {
      const element = document.getElementById(id);
      if (element) {
        element.scrollIntoView({ behavior: 'smooth' });
      }
    }
  };

  // Navbar Component
  const LandingNavbar = () => (
    <nav className="fixed top-0 w-full bg-white z-50 border-b-2 border-black">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-16">
          {/* Left Side: Links (Desktop) & Hamburger (Mobile) */}
          <div className="flex items-center gap-6">
             <div className="md:hidden">
                <Drawer open={drawerOpen} onOpenChange={setDrawerOpen}>
                  <DrawerTrigger asChild>
                    <Button variant="ghost" size="icon" className="hover:bg-transparent">
                      <Menu className="w-6 h-6" />
                    </Button>
                  </DrawerTrigger>
                  <DrawerContent>
                    <DrawerHeader>
                      <DrawerTitle>Menu</DrawerTitle>
                    </DrawerHeader>
                    <div className="p-4 flex flex-col gap-4">
                      <DrawerClose asChild>
                        <Button variant="ghost" onClick={() => scrollToSection('about')}>About</Button>
                      </DrawerClose>
                      <DrawerClose asChild>
                        <Button variant="ghost" onClick={() => scrollToSection('problems')}>Problems</Button>
                      </DrawerClose>
                      <DrawerClose asChild>
                        <Button variant="ghost" onClick={() => scrollToSection('how-it-works')}>How It Works</Button>
                      </DrawerClose>
                      <DrawerClose asChild>
                        <Button variant="ghost" onClick={() => scrollToSection('use-cases')}>Use Cases</Button>
                      </DrawerClose>
                      <DrawerClose asChild>
                          <Button variant="outline">Close</Button>
                      </DrawerClose>
                    </div>
                  </DrawerContent>
                </Drawer>
             </div>
             
             <div className="hidden md:flex gap-6 items-center">
               <button onClick={() => scrollToSection('about')} className="text-sm font-medium hover:text-main transition-colors uppercase tracking-wide">About</button>
               <button onClick={() => scrollToSection('problems')} className="text-sm font-medium hover:text-main transition-colors uppercase tracking-wide">Problems</button>
               <button onClick={() => scrollToSection('how-it-works')} className="text-sm font-medium hover:text-main transition-colors uppercase tracking-wide">How It Works</button>
               <button onClick={() => scrollToSection('use-cases')} className="text-sm font-medium hover:text-main transition-colors uppercase tracking-wide">Use Cases</button>
             </div>
          </div>

          {/* Right Side: Logo */}
          <div className="shrink-0">
             <img src="/khoj-logo-no-bg.png" alt="Khoj Logo" className="h-12 object-contain" />
          </div>
        </div>
      </div>
    </nav>
  );

  return (
    <div className="min-h-screen bg-background overflow-x-hidden">
      <LandingNavbar />

      {/* Hero Section */}
      <section className="relative pt-32 pb-32 px-4 overflow-hidden border-b-4 border-border bg-yellow/10">
        <motion.div 
          className="max-w-4xl mx-auto text-center space-y-6 relative z-10"
          variants={containerVariants}
          initial="hidden"
          animate="visible"
        >
          <motion.div variants={itemVariants} className="inline-block mb-4">
            <span className="bg-main text-main-foreground px-4 py-2 rounded-base border-2 border-border font-heading text-sm uppercase tracking-wider shadow-shadow">
              Web3 Treasure Hunts
            </span>
          </motion.div>
          
          <motion.h1 variants={itemVariants} className="text-6xl md:text-8xl font-heading text-foreground tracking-tight mt-2">
            KHOJ
          </motion.h1>
          
          <motion.p variants={itemVariants} className="text-xl md:text-3xl font-base text-foreground/80 max-w-2xl mx-auto leading-relaxed">
            Bringing real-world exploration <span className="font-bold text-main-foreground bg-main px-2 rounded-sm">onchain</span>.
          </motion.p>

          <motion.div variants={itemVariants} className="flex flex-col sm:flex-row gap-4 justify-center pt-8">
            <Button size="lg" onClick={() => navigate('/hunts')} className="text-xl px-8 py-6">
              Start Exploring <ArrowRight className="ml-2 w-6 h-6" />
            </Button>
            <Button size="lg" variant="outline" className="text-xl px-8 py-6 bg-white" onClick={() => document.getElementById('how-it-works')?.scrollIntoView({ behavior: 'smooth' })}>
              How it Works
            </Button>
          </motion.div>
        </motion.div>

        {/* Decorative Elements */}
        <motion.div 
          className="absolute top-1/4 left-10 opacity-20 md:opacity-40"
          animate={{ y: [0, 20, 0], rotate: [0, 5, 0] }}
          transition={{ duration: 5, repeat: Infinity }}
        >
          <Map className="w-32 h-32" />
        </motion.div>
        <motion.div 
          className="absolute bottom-10 right-10 opacity-20 md:opacity-40"
          animate={{ y: [0, -20, 0], rotate: [0, -5, 0] }}
          transition={{ duration: 6, repeat: Infinity }}
        >
          <Gamepad2 className="w-32 h-32" />
        </motion.div>
      </section>

      {/* Introduction Section */}
      <section id="about" className="py-20 px-4 bg-white border-b-4 border-border">
        <div className="max-w-6xl mx-auto grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
          <motion.div 
            initial={{ opacity: 0, x: -20 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true }}
            className="space-y-6"
          >
            <h2 className="text-4xl md:text-5xl font-heading">What is Khoj?</h2>
            <p className="text-lg text-gray-700 leading-relaxed">
              <span className="font-bold">Khoj</span> (meaning "search" or "discovery" in Hindi) is a geo-location based treasure hunt platform where the answer to each clue is a physical location.
            </p>
            <p className="text-lg text-gray-700 leading-relaxed">
              Users visit places, verify coordinates and earn onchain rewards, with the most Web2 friendly UX.
            </p>
            <p className="text-lg text-gray-700 leading-relaxed">
              Discover a new way to onboard users to Web3 with a Web2-native experience.
            </p>
          </motion.div>
          
          <motion.div 
            initial={{ opacity: 0, x: 20 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true }}
            className="relative aspect-video rounded-base overflow-hidden border-4 border-border shadow-shadow bg-black"
          >
            <iframe
              className="w-full h-full"
              src="https://www.youtube.com/embed/98OJuvBur6s"
              title="Khoj Demo"
              allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
              allowFullScreen
            ></iframe>
          </motion.div>
        </div>
      </section>

      {/* Problems Section */}
      <section id="problems" className="py-20 px-4 bg-yellow/5 border-b-4 border-border">
        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-4xl md:text-5xl font-heading mb-4">Problems We Solve</h2>
            <p className="text-xl text-gray-600 max-w-2xl mx-auto">Why we built Khoj.</p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {problems.map((problem, index) => (
              <motion.div
                key={index}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: index * 0.1 }}
              >
                <Card className="h-full border-2 border-border shadow-shadow">
                  <CardHeader>
                    <div className={`${problem.color} w-fit p-3 rounded-base border-2 border-border mb-2`}>
                      {problem.icon}
                    </div>
                    <CardTitle className="text-xl leading-tight">{problem.title}</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <p className="text-gray-700">{problem.description}</p>
                  </CardContent>
                </Card>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* How It Works Section */}
      <section id="how-it-works" className="py-20 px-4 bg-white border-b-4 border-border">
        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-4xl md:text-5xl font-heading mb-4">How It Works</h2>
            <p className="text-xl text-gray-600 max-w-2xl mx-auto">Get started with Khoj in four simple steps.</p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
            {steps.map((step, index) => (
              <motion.div
                key={index}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: index * 0.1 }}
              >
                <Card className="h-full hover:translate-x-1 hover:translate-y-1 hover:shadow-none transition-all duration-300">
                  <CardHeader>
                    <div className="w-12 h-12 bg-main rounded-base border-2 border-border flex items-center justify-center mb-4 shadow-shadow">
                      {step.icon}
                    </div>
                    <CardTitle className="text-xl">{step.title}</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <p className="text-gray-600">{step.description}</p>
                  </CardContent>
                </Card>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Use Cases Section */}
      <section id="use-cases" className="py-20 px-4 bg-secondary-background border-b-4 border-border">
        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-4xl md:text-5xl font-heading mb-4">Use Cases</h2>
            <p className="text-xl text-gray-600 max-w-2xl mx-auto">More than just a game. Discover how Khoj can be used.</p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {useCases.map((useCase, index) => (
              <motion.div
                key={index}
                initial={{ opacity: 0, scale: 0.9 }}
                whileInView={{ opacity: 1, scale: 1 }}
                viewport={{ once: true }}
                transition={{ delay: index * 0.1 }}
              >
                <Card className={`h-full border-2 border-border shadow-shadow`}>
                  <CardHeader>
                    <div className={`${useCase.color} w-fit p-3 rounded-base border-2 border-border mb-2`}>
                      {useCase.icon}
                    </div>
                    <CardTitle className="text-2xl">{useCase.title}</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <p className="text-gray-700 text-lg leading-relaxed">{useCase.description}</p>
                  </CardContent>
                </Card>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-foreground text-background py-12 px-4">
        <div className="max-w-6xl mx-auto flex flex-col md:flex-row justify-between items-center gap-8">
          <div className="text-center md:text-left">
            <h2 className="text-3xl font-heading mb-2">Khoj</h2>
            <p className="opacity-80 max-w-xs">Bringing real-world exploration onchain.</p>
          </div>
          
          <div className="flex flex-wrap justify-center gap-6">
            <a href="https://github.com/mittal-parth/Khoj" target="_blank" rel="noopener noreferrer" className="hover:text-main transition-colors font-base">GitHub</a>
            <a href="https://github.com/mittal-parth/Khoj/wiki" target="_blank" rel="noopener noreferrer" className="hover:text-main transition-colors font-base">Wiki</a>
            <a href="https://tinyurl.com/playkhoj" className="hover:text-main transition-colors font-base">Deck</a>
          </div>

          <div className="flex gap-4">
             <Button variant="reverse" size="sm" onClick={() => navigate('/hunts')}>
               Launch App
             </Button>
          </div>
        </div>
        <div className="text-center mt-12 opacity-50 text-sm">
          © {new Date().getFullYear()} Khoj. All rights reserved.
        </div>
      </footer>
    </div>
  );
};
