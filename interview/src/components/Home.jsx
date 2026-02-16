import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import CreatePollModal from './CreatePollModal';
import PollCard from './PollCard';
import { useWebSocket } from '../hooks/useWebSocket';

export default function Home() {
  const navigate = useNavigate();
  const { refresh, setRefresh } = useWebSocket("refresh");
  const [polls, setPolls] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    const timeout = setTimeout(() => {
      loadPolls(refresh);
    }, 4000);

    return () => clearTimeout(timeout);
  }, [refresh]);


  useEffect(() => {
    loadPolls();

  }, []);


  async function loadPolls(background = false) {
    try {
      if (background) {
        setIsLoading(false);
      } else {
        setIsLoading(true);
      }

      const response = await fetch(
        'https://view-ezh5.onrender.com/api/poll/all'
      );

      if (!response.ok) {
        throw new Error('Failed to fetch polls');
      }

      const data = await response.json();
      setPolls(data.polls || []);
    } catch (err) {
      console.error(err);
      setError('Failed to load polls');
    } finally {
      if (background) {
        setRefresh(false);
      } else {
        setIsLoading(false);
      }
    }
  }


  const handlePollCreated = (pollId) => {
    setIsModalOpen(false);
    setRefresh(true);
    navigate(`/poll/${pollId}`);
  };

  const handleViewPoll = (pollId) => {
    navigate(`/poll/${pollId}`);
  };

  return (
    <div className="min-h-screen bg-linear-to-br from-slate-950 via-slate-900 to-slate-950 relative overflow-hidden">
      <div className="fixed inset-0 opacity-20">
        <div className="absolute top-0 left-1/4 w-96 h-96 bg-amber-500/20 rounded-full blur-[120px] animate-pulse"></div>
        <div className="absolute bottom-0 right-1/4 w-96 h-96 bg-orange-500/20 rounded-full blur-[120px] animate-pulse" style={{ animationDelay: '1s' }}></div>
      </div>

      <div className="fixed inset-0 opacity-[0.015] pointer-events-none" style={{
        backgroundImage: `url("data:image/svg+xml,%3Csvg viewBox='0 0 400 400' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='noise'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='4' /%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23noise)' /%3E%3C/svg%3E")`,
        backgroundRepeat: 'repeat'
      }}></div>

      <header className="relative z-20 bg-slate-900/50 backdrop-blur-xl border-b border-slate-800/50">
        <div className="max-w-7xl mx-auto px-6 lg:px-8">
          <div className="flex items-center justify-between h-20">
            <motion.div
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.5 }}
              className="flex items-center gap-4"
            >
              <div className="relative group">
                <div className="absolute -inset-1 bg-linear-to-r from-amber-500 to-orange-500 rounded-lg blur opacity-25 group-hover:opacity-75 transition duration-500"></div>
                <div className="relative w-12 h-12 bg-linear-to-br from-amber-500 to-orange-500 flex items-center justify-center shadow-lg shadow-amber-500/30">
                  <svg className="w-7 h-7 text-slate-900" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-3 7h3m-3 4h3m-6-4h.01M9 16h.01" />
                  </svg>
                </div>
              </div>
              <div>
                <h1 className="text-2xl font-light text-slate-100 tracking-tight">PollHub</h1>
                <p className="text-xs text-slate-400 uppercase tracking-widest">Real-Time Voting</p>
              </div>
            </motion.div>

            <motion.button
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.5 }}
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={() => setIsModalOpen(true)}
              className="relative group overflow-hidden"
            >
              <div className="absolute inset-0 bg-linear-to-r from-amber-500 to-orange-500 transition-transform duration-500 group-hover:scale-105"></div>
              <div className="absolute inset-0 bg-linear-to-r from-amber-400 to-orange-400 opacity-0 group-hover:opacity-100 transition-opacity duration-500"></div>
              <div className="relative flex items-center gap-2 px-12 py-4 text-slate-900 font-semibold tracking-wide">
                <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M12 4v16m8-8H4" />
                </svg>
                <p className='px-2'> Create Poll</p>

              </div>
            </motion.button>
          </div>
        </div>
      </header>

      <main className="relative z-10 max-w-7xl mx-auto px-6 lg:px-8 py-16">
        <div className="text-center mb-20">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, ease: [0.22, 1, 0.36, 1] }}
          >
            <div className="inline-block mb-6">
              <motion.h2
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ delay: 0.2, duration: 0.6 }}
                className="text-6xl md:text-7xl lg:text-8xl font-light tracking-tighter bg-linear-to-br from-white via-amber-200 to-orange-300 bg-clip-text text-transparent leading-tight mb-4"
              >
                Real-Time Polling
              </motion.h2>
            </div>
            <motion.p
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.4, duration: 0.6 }}
              className="text-xl text-slate-300 mx-auto font-light leading-relaxed mb-4"
            >
              Create polls instantly, share with your audience, and watch results update live as votes pour in
            </motion.p>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.6, duration: 0.6 }}
            className="flex items-center justify-center gap-8 mt-12"
          >
            <div className="flex items-center gap-3 px-8 py-3 bg-slate-800/30 border border-slate-700/50 backdrop-blur-sm rounded-lg mx-3">
              <div className="w-3 h-3 rounded-full bg-emerald-400 animate-pulse"></div>
              <span className="text-sm text-slate-300 font-medium px-2.5">Live Updates</span>
            </div>
            <div className="flex items-center gap-3 px-5 py-3 bg-slate-800/30 border border-slate-700/50 backdrop-blur-sm rounded-lg">
              <svg className="w-5 h-5 text-amber-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M13 10V3L4 14h7v7l9-11h-7z" />
              </svg>
              <span className="text-sm text-slate-300 font-medium">Instant Results</span>
            </div>
          </motion.div>
        </div>

        {isLoading ? (
          <div className="flex items-center justify-center py-32">
            <motion.div
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              className="text-center"
            >
              <div className="relative w-14 h-14 mx-auto mb-6">
                <div className="absolute inset-0 border-4 border-amber-500/30 rounded-full"></div>
                <div className="absolute inset-0 border-4 border-amber-500 border-t-transparent rounded-full animate-spin"></div>
              </div>
              <p className="text-slate-300 font-light tracking-wide">Loading polls...</p>
            </motion.div>
          </div>
        ) : error ? (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="text-center py-32 mb-6"
          >
            <div className="mb-8">
              <div className="w-24 h-24 mx-auto mb-6 rounded-full bg-rose-500/10 border-2 border-rose-500/30 flex items-center justify-center">
                <svg className="w-12 h-12 text-rose-400 animate-spin" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
              <h3 className="text-2xl font-light text-slate-100 mb-3">{error}</h3>
              <p className="text-slate-400 mb-8">Something went wrong while loading the polls</p>
              <motion.button
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                onClick={loadPolls}
                className="inline-flex items-center gap-2 px-6 py-3 border border-slate-700 text-slate-300 hover:border-amber-500/50 hover:text-amber-400 font-medium transition-all duration-300"
              >
                <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                </svg>
                Try Again
              </motion.button>
            </div>
          </motion.div>
        ) : polls.length === 0 ? (
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.6 }}
            className="text-center py-32"
          >
            <div className="mb-8">
              <div className="w-32 h-32 mx-auto mb-6 ">

              </div>
              <h3 className="text-3xl font-light text-slate-100 mb-4">No polls yet</h3>
              <p className="text-slate-400   mx-auto font-light text-lg mb-10">
                Be the first to create a poll and start collecting votes from your audience
              </p>
              <div className='p-10 w-5 h-5' />
              <motion.button
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                onClick={() => setIsModalOpen(true)}
                className="relative group overflow-hidden"
              >
                <div className="absolute inset-0 bg-linear-to-r from-amber-500 to-orange-500 transition-transform duration-500 group-hover:scale-105"></div>
                <div className="absolute inset-0 bg-linear-to-r from-amber-400 to-orange-400 opacity-0 group-hover:opacity-100 transition-opacity duration-500"></div>
                <div className="relative inline-flex items-center gap-2 px-8 py-4 text-slate-900 font-semibold tracking-wide">
                  <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M12 4v16m8-8H4" />
                  </svg>
                  Create Your First Poll
                </div>
              </motion.button>
              <div className='p-10 w-5 h-5' />
            </div>
          </motion.div>
        ) : (
          <div>
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2 }}
              className="flex flex-col md:flex-row md:items-center md:justify-between gap-6 mb-12 px-4 md:px-10"
            >
              <div>
                <h3 className="text-3xl font-semibold tracking-tight text-slate-100">
                  Active Polls
                </h3>

                <div className="flex items-center gap-3 mt-2">
                  <span className="text-slate-400 font-light">
                    {polls.length} {polls.length === 1 ? "poll" : "polls"} available
                  </span>

                  <span className="px-3 py-1 text-xs font-medium rounded-full bg-amber-500/10 text-amber-400 border border-amber-500/30">
                    Live
                  </span>
                </div>
              </div>

              <motion.button
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                onClick={loadPolls}
                className="group inline-flex items-center gap-2 px-5 py-2.5 rounded-lg 
               bg-slate-800/60 backdrop-blur-md 
               border border-slate-700 
               text-slate-300 
               hover:border-amber-500/50 
               hover:text-amber-400 
               hover:shadow-lg hover:shadow-amber-500/10
               transition-all duration-300"
                aria-label="Refresh polls"
              >
                <svg
                  className="w-5 h-5 transition-transform duration-500 group-hover:rotate-180"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                  strokeWidth={2}
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"
                  />
                </svg>

                <span className="text-sm font-medium tracking-wide">
                  Refresh
                </span>
              </motion.button>
            </motion.div>

            <div className='p-10 m-5 h-5' />
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {polls.map((poll, index) => (
                <PollCard
                  key={poll.id}
                  poll={poll}
                  index={index}
                  onViewPoll={handleViewPoll}

                />
              ))}
            </div>
          </div>
        )}
      </main>



      <CreatePollModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        onPollCreated={handlePollCreated}
      />
    </div>
  );
}