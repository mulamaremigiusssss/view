import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { useWebSocket } from '../hooks/useWebSocket';
import { getPoll, submitVote, ApiError } from '../utils/api';

export default function PollView() {
  const { pollId } = useParams();
  const navigate = useNavigate();
  const { results, isConnected } = useWebSocket(pollId);
  
  const [hasVoted, setHasVoted] = useState(false);
  const [userVote, setUserVote] = useState(null);
  const [isVoting, setIsVoting] = useState(false);
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const [shareUrl, setShareUrl] = useState('');
  const [copied, setCopied] = useState(false);
  const [hoveredOption, setHoveredOption] = useState(null);

  useEffect(() => {
    async function loadPoll() {
      try {
        const data = await getPoll(pollId);
        
        setHasVoted(data.hasVoted);
        setUserVote(data.userVote);
        setShareUrl(window.location.href);
        useWebSocket(pollId)
      } catch (err) {
        if (err instanceof ApiError && err.status === 404) {
          setError('Poll not found');
        } else {
          setError('Failed to load poll');
        }
      } finally {
        setIsLoading(false);
      }
    }

    loadPoll();
  }, [pollId]);

  const handleVote = async (optionId) => {
    if (hasVoted || isVoting) return;

    setIsVoting(true);
    setError('');

    try {
      await submitVote(pollId, optionId);
      setHasVoted(true);
      setUserVote(optionId);
    } catch (err) {
      if (err instanceof ApiError) {
        if (err.status === 403) {
          setError(err.message);
          setHasVoted(true);
          if (err.data.votedOption) {
            setUserVote(err.data.votedOption);
          }
        } else if (err.status === 429) {
          setError(err.message);
        } else {
          setError(err.message);
        }
      } else {
        setError('Failed to submit vote. Please try again.');
      }
    } finally {
      setIsVoting(false);
    }
  };

  const handleCopyLink = async () => {
    try {
      await navigator.clipboard.writeText(shareUrl);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (err) {
      console.error('Failed to copy:', err);
    }
  };

  const handleCreateNew = () => {
    navigate('/');
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-linear-to-br from-slate-950 via-slate-900 to-slate-950 flex items-center justify-center">
        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          className="text-center"
        >
          <div className="relative w-16 h-16 mx-auto mb-6">
            <div className="absolute inset-0 border-4 border-amber-500/30 rounded-full"></div>
            <div className="absolute inset-0 border-4 border-amber-500 border-t-transparent rounded-full animate-spin"></div>
          </div>
          <p className="text-slate-300 font-light tracking-wide">Loading poll...</p>
        </motion.div>
      </div>
    );
  }

  if (error && !results) {
    return (
      <div className="min-h-screen bg-linear-to-br from-slate-950 via-slate-900 to-slate-950 flex items-center justify-center p-6">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-center max-w-lg"
        >
          <div className="mb-8">
            <div className="w-24 h-24 mx-auto mb-6 rounded-full bg-rose-500/10 border-2 border-rose-500/30 flex items-center justify-center">
              <svg className="w-12 h-12 text-rose-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
            <h2 className="text-3xl font-light text-slate-100 mb-3">{error}</h2>
            <p className="text-slate-400 font-light text-lg">The poll you're looking for doesn't exist or has been removed</p>
          </div>
          <motion.button
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            onClick={handleCreateNew}
            className="relative group overflow-hidden"
          >
            <div className="absolute inset-0 bg-linear-to-r from-amber-500 to-orange-500"></div>
            <div className="absolute inset-0 bg-linear-to-r from-amber-400 to-orange-400 opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
            <div className="relative px-8 py-4 text-slate-900 font-semibold tracking-wide">
              Create New Poll
            </div>
          </motion.button>
        </motion.div>
      </div>
    );
  }

  if (!results) {
    return (
      <div className="min-h-screen bg-linear-to-br from-slate-950 via-slate-900 to-slate-950 flex items-center justify-center">
        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          className="text-center"
        >
          <div className="relative w-16 h-16 mx-auto mb-6">
            <div className="absolute inset-0 border-4 border-amber-500/30 rounded-full"></div>
            <div className="absolute inset-0 border-4 border-amber-500 border-t-transparent rounded-full animate-spin"></div>
          </div>
          <p className="text-slate-300 font-light tracking-wide">Connecting to real-time updates...</p>
        </motion.div>
      </div>
    );
  }

  const totalVotes = results.totalVotes || 0;

  return (
    <div className="min-h-screen bg-linear-to-br from-slate-950 via-slate-900 to-slate-950 relative overflow-hidden">
      

      <div className="fixed inset-0 opacity-[0.015] pointer-events-none" style={{
        backgroundImage: `url("data:image/svg+xml,%3Csvg viewBox='0 0 400 400' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='noise'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='4' /%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23noise)' /%3E%3C/svg%3E")`,
        backgroundRepeat: 'repeat'
      }}></div>

      <div className="relative z-10 min-h-screen flex items-center justify-center px-6 py-12" style={{padding:12}}>
        <div className="w-full max-w-3xl">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, ease: [0.22, 1, 0.36, 1] }}
          >
            <div className="mb-8 flex items-center justify-between" style={{padding:4}}>
              <motion.button
                whileHover={{ x: -4 }}
                whileTap={{ scale: 0.95 }}
                onClick={() => navigate('/')}
                className="flex items-center gap-2 text-slate-400 hover:text-amber-400 transition-colors duration-300"
                aria-label="Back to home"
              >
                <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M10 19l-7-7m0 0l7-7m-7 7h18" />
                </svg>
                <span className="text-sm font-medium tracking-wide">Back</span>
              </motion.button>

              <div className="flex items-center gap-3" style={{padding:6}}>
                <div className="flex items-center gap-2 px-3 py-1.5 bg-slate-800/50 border border-slate-700/50 backdrop-blur-sm">
                  <motion.div
                    animate={{
                      scale: isConnected ? [1, 1.2, 1] : 1,
                      opacity: isConnected ? [1, 0.5, 1] : 0.3
                    }}
                    transition={{ duration: 2, repeat: Infinity }}
                    className={`w-2 h-2 rounded-full ${isConnected ? 'bg-emerald-400' : 'bg-slate-500'}`}
                  />
                  <span className="text-xs text-slate-400 uppercase tracking-wider font-medium" style={{padding:6}}>
                    {isConnected ? 'Live' : 'Connecting'}
                  </span>
                </div>


                <motion.button
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  onClick={handleCopyLink}
                  className="flex items-center gap-2 px-4 py-1.5 text-sm text-slate-300 hover:text-amber-400 border border-slate-700 hover:border-amber-500/50 transition-all duration-300 backdrop-blur-sm bg-slate-800/30"
                  aria-label="Copy share link"
                >
                  {copied ? (
                    <>
                      <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                      </svg>
                      <span className="font-medium" style={{padding:6}}>Copied!</span>
                    </>
                  ) : (
                    <>
                      <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M8.684 13.342C8.886 12.938 9 12.482 9 12c0-.482-.114-.938-.316-1.342m0 2.684a3 3 0 110-2.684m0 2.684l6.632 3.316m-6.632-6l6.632-3.316m0 0a3 3 0 105.367-2.684 3 3 0 00-5.367 2.684zm0 9.316a3 3 0 105.368 2.684 3 3 0 00-5.368-2.684z" />
                      </svg>
                      <span className="font-medium" style={{padding:6}}>Share</span>
                    </>
                  )}
                </motion.button>

                <motion.button
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  onClick={handleCreateNew}
                  className="relative group overflow-hidden"
                >
                  <div className="absolute inset-0 bg-linear-to-r from-amber-500 to-orange-500"></div>
                  <div className="absolute inset-0 bg-linear-to-r from-amber-400 to-orange-400 opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
                  <div className="relative px-5 py-1.5 text-sm text-slate-900 font-semibold tracking-wide" style={{padding:6}}>
                    New Poll
                  </div>
                </motion.button>
              </div>
            </div>

            <div className="bg-linear-to-br from-slate-900 via-slate-800 to-slate-900 border border-slate-700/50 shadow-2xl shadow-black/60 overflow-hidden">
              <div className="absolute top-0 left-0 w-32 h-32 bg-linear-to-br from-amber-500/20 to-transparent blur-2xl"></div>
              <div className="absolute bottom-0 right-0 w-32 h-32 bg-linear-to-tl from-orange-500/20 to-transparent blur-2xl"></div>
              
              <div className="absolute top-0 left-0 right-0 h-1 bg-linear-to-r from-transparent via-amber-500 to-transparent"></div>

              <div className="relative p-10">
                <div className="mb-10 text-center" style={{padding:6}}>
                  <motion.h1
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.2 }}
                    className="text-4xl font-light text-slate-100 mb-5 leading-tight"
                  >
                    {results.question}
                  </motion.h1>
                  
                  <motion.div
                    initial={{ opacity: 0, scale: 0.9 }}
                    animate={{ opacity: 1, scale: 1 }}
                    transition={{ delay: 0.3 }}
                    className="inline-flex items-center gap-3 px-5 py-2.5 bg-slate-950/60 border border-amber-500/20 shadow-lg shadow-amber-500/5"
                  >
                    <div className="flex items-center justify-center w-9 h-9 rounded-full bg-linear-to-br from-amber-500 to-orange-500">
                      <svg className="w-5 h-5 text-slate-900" fill="currentColor" viewBox="0 0 20 20">
                        <path d="M9 6a3 3 0 11-6 0 3 3 0 016 0zM17 6a3 3 0 11-6 0 3 3 0 016 0zM12.93 17c.046-.327.07-.66.07-1a6.97 6.97 0 00-1.5-4.33A5 5 0 0119 16v1h-6.07zM6 11a5 5 0 015 5v1H1v-1a5 5 0 015-5z" />
                      </svg>
                    </div>
                    <div className="flex flex-col items-start" style={{padding:10,margin:4}}>
                      <span className="text-xs text-slate-400 uppercase tracking-widest font-medium">Total Votes</span>
                      <span className="text-xl text-amber-400 font-semibold">{totalVotes}</span>
                    </div>
                  </motion.div>
                </div>

                <AnimatePresence>
                  {error && (
                    <motion.div
                      initial={{ opacity: 0, height: 0, marginBottom: 0 }}
                      animate={{ opacity: 1, height: 'auto', marginBottom: 32 }}
                      exit={{ opacity: 0, height: 0, marginBottom: 0 }}
                      className="overflow-hidden"
                      style={{padding:6}}
                    >
                      <div className="p-4 bg-rose-500/10 border border-rose-500/30 text-rose-300 text-sm font-light shadow-lg">
                        <div className="flex items-center gap-3">
                          <svg className="w-5 h-5 shrink-0" fill="currentColor" viewBox="0 0 20 20">
                            <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
                          </svg>
                          {error}
                        </div>
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>

                <div className="space-y-4" style={{padding:6}}>
                  {results.options.map((option, index) => {
                    const percentage = totalVotes > 0 ? (option.votes / totalVotes) * 100 : 0;
                    const isSelected = userVote === option.id;
                    const isHovered = hoveredOption === option.id;

                    return (
                      <motion.button
                        key={option.id}
                        initial={{ opacity: 0, x: -30 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ 
                          delay: 0.4 + index * 0.08,
                          duration: 0.5,
                          ease: [0.22, 1, 0.36, 1]
                        }}
                        onClick={() => handleVote(option.id)}
                        disabled={hasVoted || isVoting}
                        onMouseEnter={() => !hasVoted && setHoveredOption(option.id)}
                        onMouseLeave={() => setHoveredOption(null)}
                        className={`w-full relative overflow-hidden transition-all duration-300 group/option ${
                          hasVoted 
                            ? 'cursor-default' 
                            : 'hover:shadow-xl hover:shadow-amber-500/10 cursor-pointer'
                        }`}
                        style={{padding:6,marginBottom:4}}
                      >
                        <div className={`absolute inset-0 transition-all duration-500 ${
                          isSelected 
                            ? 'bg-linear-to-r from-slate-800 to-slate-900 border-2 border-amber-500/50' 
                            : 'bg-slate-900/40 border border-slate-700/50'
                        }`}>
                          <motion.div
                            initial={{ width: 0 }}
                            animate={{ 
                              width: hasVoted ? `${percentage}%` : '0%',
                            }}
                            transition={{ duration: 1, ease: [0.22, 1, 0.36, 1], delay: 0.2 }}
                            className={`absolute inset-y-0 left-0 ${
                              isSelected 
                                ? 'bg-linear-to-r from-amber-500/30 via-orange-500/25 to-amber-500/30' 
                                : 'bg-slate-800/60'
                            }`}
                          />

                          {hasVoted && percentage > 0 && (
                            <motion.div
                              initial={{ x: '-100%' }}
                              animate={{ x: '200%' }}
                              transition={{ duration: 2, repeat: Infinity, repeatDelay: 3 }}
                              className="absolute inset-y-0 w-1/3 bg-linear-to-r from-transparent via-white/10 to-transparent"
                              style={{ width: `${percentage}%` }}
                            />
                          )}
                        </div>

                        {!hasVoted && (
                          <motion.div
                            initial={{ opacity: 0 }}
                            animate={{ opacity: isHovered ? 1 : 0 }}
                            transition={{ duration: 0.3 }}
                            className="absolute inset-0 bg-linear-to-r from-amber-500/10 via-orange-500/5 to-amber-500/10"
                          />
                        )}

                        <div className="relative px-6 py-5 flex items-center justify-between">
                          <div className="flex items-center gap-5 flex-1 min-w-0">
                            <div className="relative shrink-0" style={{padding:6,marginBottom:4}}>
                              <motion.div
                                animate={{
                                  scale: isSelected ? [1, 1.2, 1] : isHovered ? 1.15 : 1,
                                }}
                                transition={{ duration: 0.4 }}
                              >
                                <div className={`w-7 h-7 rounded-full border-2 flex items-center justify-center transition-all duration-500 ${
                                  isSelected 
                                    ? 'border-amber-500 bg-linear-to-br from-amber-500 to-orange-600 shadow-lg shadow-amber-500/50' 
                                    : hasVoted
                                      ? 'border-slate-600 bg-slate-800/50'
                                      : 'border-slate-500 bg-slate-800/30 group-hover/option:border-amber-500/50'
                                }`}>
                                  <AnimatePresence>
                                    {isSelected && (
                                      <motion.svg
                                        initial={{ scale: 0, rotate: -90 }}
                                        animate={{ scale: 1, rotate: 0 }}
                                        exit={{ scale: 0, rotate: 90 }}
                                        transition={{ type: 'spring', stiffness: 200, damping: 15 }}
                                        className="w-4 h-4 text-slate-900"
                                        fill="none"
                                        viewBox="0 0 24 24"
                                        stroke="currentColor"
                                        strokeWidth={3}
                                      >
                                        <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                                      </motion.svg>
                                    )}
                                  </AnimatePresence>
                                </div>

                                {!hasVoted && isHovered && (
                                  <>
                                    <motion.div
                                      initial={{ scale: 1, opacity: 0.6 }}
                                      animate={{ scale: 1.8, opacity: 0 }}
                                      transition={{ duration: 1.5, repeat: Infinity }}
                                      className="absolute inset-0 rounded-full border-2 border-amber-500"
                                    />
                                    <motion.div
                                      initial={{ scale: 1, opacity: 0.6 }}
                                      animate={{ scale: 1.8, opacity: 0 }}
                                      transition={{ duration: 1.5, repeat: Infinity, delay: 0.3 }}
                                      className="absolute inset-0 rounded-full border-2 border-orange-500"
                                    />
                                  </>
                                )}
                              </motion.div>
                            </div>

                            <span className={`text-lg font-light truncate transition-all duration-500 ${
                              isSelected 
                                ? 'text-amber-300 font-medium' 
                                : 'text-slate-200 group-hover/option:text-slate-100'
                            }`}>
                              {option.text}
                            </span>
                          </div>

                          <AnimatePresence>
                            {hasVoted && (
                              <motion.div
                                initial={{ opacity: 0, x: 20, scale: 0.8 }}
                                animate={{ opacity: 1, x: 0, scale: 1 }}
                                transition={{ delay: 0.4, type: 'spring', stiffness: 150 }}
                                className="ml-6 flex items-center gap-4"
                              >
                                <div className="text-right">
                                  <div className={`text-2xl font-semibold transition-colors duration-500 ${
                                    isSelected ? 'text-amber-400' : 'text-slate-400'
                                  }`}>
                                    {percentage.toFixed(1)}%
                                  </div>
                                  <div className="text-xs text-slate-500 uppercase tracking-wider">
                                    {option.votes} {option.votes === 1 ? 'vote' : 'votes'}
                                  </div>
                                </div>
                                {isSelected && (
                                  <motion.div
                                    initial={{ scale: 0, rotate: -180 }}
                                    animate={{ scale: 1, rotate: 0 }}
                                    transition={{ delay: 0.5, type: 'spring', stiffness: 200 }}
                                    className="w-10 h-10 rounded-full bg-linear-to-br from-amber-500 to-orange-600 flex items-center justify-center shadow-lg shadow-amber-500/30"
                                  >
                                    <svg className="w-5 h-5 text-slate-900" fill="currentColor" viewBox="0 0 20 20">
                                      <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                                    </svg>
                                  </motion.div>
                                )}
                              </motion.div>
                            )}
                          </AnimatePresence>
                        </div>
                      </motion.button>
                    );
                  })}
                </div>

                {hasVoted && (
                  <motion.div
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.8 }}
                    className="mt-8 pt-8 border-t border-slate-700/50 text-center"
                  >
                    <p className="text-slate-400 font-light flex items-center justify-center gap-2">
                      <motion.span
                        animate={{ opacity: [1, 0.5, 1] }}
                        transition={{ duration: 2, repeat: Infinity }}
                        className="w-2 h-2 rounded-full bg-emerald-400"
                      />
                      Results update in real-time as others vote
                    </p>
                  </motion.div>
                )}
              </div>
            </div>
          </motion.div>
        </div>
      </div>

      <style jsx>{`
        @import url('https://fonts.googleapis.com/css2?family=Outfit:wght@300;400;500;600;700&display=swap');
        
        * {
          font-family: 'Outfit', -apple-system, BlinkMacSystemFont, sans-serif;
        }
      `}</style>
    </div>
  );
}