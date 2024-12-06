import { Navbar } from './components/Navbar';
import './App.css'
import '@coinbase/onchainkit/styles.css';

function App() {
  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      <Navbar />
      <main className="pt-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex flex-col items-center justify-center min-h-[calc(100vh-4rem)] p-4">
            <h2 className="text-3xl font-bold mb-8">Welcome to ETH Hunt</h2>
            <p className="text-sm text-gray-600 dark:text-gray-400 text-center">
              Hunt for ETH
            </p>
          </div>
        </div>
      </main>
    </div>
  )
}

export default App
