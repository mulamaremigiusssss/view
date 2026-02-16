import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { submitVote, getPoll, ApiError } from '../utils/api';

export default function PollCard({ poll, index, onViewPoll, onVoteUpdate }) {
  const [pollData, setPollData] = useState(poll);
  const [hasVoted, setHasVoted] = useState(false);
  const [userVote, setUserVote] = useState(null);
  const [isVoting, setIsVoting] = useState(false);
  const [error, setError] = useState('');
  const [showError, setShowError] = useState(false);
  const [hoveredOption, setHoveredOption] = useState(null);
  const [shareUrl, setShareUrl] = useState('');
  const [copied, setCopied] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  useEffect(() => {
    async function loadPoll() {
      try {
        setShareUrl(`${window.location.origin}/poll/${poll.id}`);
      } catch (err) {
        setError('Poll not found');

      } finally {
        setIsLoading(false);
      }
    }


    loadPoll();
  }, [poll.id]);


  const handleCopyLink = async () => {
    try {
      await navigator.clipboard.writeText(shareUrl);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (err) {
      console.error('Failed to copy:', err);
    }
  };

  useEffect(() => {
    checkVoteStatus();
  }, [poll.id]);

  async function checkVoteStatus() {
    try {
      const data = await getPoll(poll.id);
      setHasVoted(data.hasVoted);
      setUserVote(data.userVote);
      setPollData(data.poll);
    } catch (err) {
      console.error('Failed to check vote status:', err);
    }
  }

  async function handleVote(optionId) {
    if (hasVoted || isVoting) return;

    setIsVoting(true);
    setError('');
    setShowError(false);

    try {
      await submitVote(poll.id, optionId);
      setHasVoted(true);
      setUserVote(optionId);

      const data = await getPoll(poll.id);
      setPollData(data.poll);
      onVoteUpdate();
    } catch (err) {
      if (err instanceof ApiError) {
        setError(err.message);
        setShowError(true);
        setTimeout(() => setShowError(false), 3000);

        if (err.status === 403) {
          setHasVoted(true);
          if (err.data.votedOption) {
            setUserVote(err.data.votedOption);
          }
        }
      }
    } finally {
      setIsVoting(false);
    }
  }

  const totalVotes = pollData.totalVotes || 0;

  return (
    <motion.div
      initial={{ opacity: 0, y: 30, scale: 0.96 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      transition={{
        duration: 0.6,
        delay: index * 0.1,
        ease: [0.22, 1, 0.36, 1]
      }}
      whileHover={{ y: -6, transition: { duration: 0.3, ease: [0.22, 1, 0.36, 1] } }}
      className="px-6 py-2"
    >

      <div className="bg-linear-to-br from-slate-900 via-slate-800 to-slate-900 border border-slate-700/50 shadow-2xl shadow-black/60 overflow-hidden px-4">


        <div className="p-8" style={{ padding: 10 }}>
          <div className='p-10 m-10' style={{ padding: 2, marginBottom: 4, }}>
            <div>
              <motion.h3
                className="text-2xl font-light text-slate-100 mb-4 leading-relaxed line-clamp-2  transition-colors duration-500 ml-4"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: index * 0.1 + 0.2 }}
              >

                {pollData.question}
              </motion.h3>
              <div className="inline-flex items-center gap-3 px-4 py-2 bg-slate-950/60 border border-amber-500/20 shadow-lg shadow-amber-500/5" style={{ padding: 4 }}>
                <div className="flex items-center justify-center w-8 h-8 rounded-full bg-linear-to-br from-amber-500 to-orange-500">
                  <svg className="w-4 h-4 text-slate-900" fill="currentColor" viewBox="0 0 20 20">
                    <path d="M9 6a3 3 0 11-6 0 3 3 0 016 0zM17 6a3 3 0 11-6 0 3 3 0 016 0zM12.93 17c.046-.327.07-.66.07-1a6.97 6.97 0 00-1.5-4.33A5 5 0 0119 16v1h-6.07zM6 11a5 5 0 015 5v1H1v-1a5 5 0 015-5z" />
                  </svg>
                </div>
                <div className="flex flex-col">
                  <span className="text-xs text-slate-400 uppercase tracking-wider font-medium">Total Votes</span>
                  <span className="text-lg text-amber-400 font-semibold">{totalVotes}</span>
                </div>
              </div>
            </div>
          </div>

          <AnimatePresence>
            {showError && (
              <motion.div
                initial={{ opacity: 0, height: 0, marginBottom: 0 }}
                animate={{ opacity: 1, height: 'auto', marginBottom: 24 }}
                exit={{ opacity: 0, height: 0, marginBottom: 0 }}
                className="overflow-hidden"
              >
                <div className="p-4 bg-rose-500/10 border border-rose-500/30 text-rose-300 text-sm font-light shadow-lg">
                  <div className="flex items-center gap-2">
                    <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
                    </svg>
                    {error}
                  </div>
                </div>
              </motion.div>
            )}
          </AnimatePresence>

          <div className='h-2' />

          <div className="space-y-4 mb-8" style={{ padding: 2 }}>
            {pollData.options.map((option, optIndex) => {
              const percentage = totalVotes > 0 ? (option.votes / totalVotes) * 100 : 0;
              const isSelected = userVote === option.id;
              const isHovered = hoveredOption === option.id;

              return (
                <motion.button
                  key={option.id}
                  initial={{ opacity: 0, x: -30 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{
                    delay: index * 0.1 + optIndex * 0.06,
                    duration: 0.5,
                    ease: [0.22, 1, 0.36, 1]
                  }}
                  onClick={() => handleVote(option.id)}
                  disabled={hasVoted || isVoting}
                  onMouseEnter={() => !hasVoted && setHoveredOption(option.id)}
                  onMouseLeave={() => setHoveredOption(null)}
                  className={`w-full relative overflow-hidden transition-all duration-300 group/option ${hasVoted
                    ? 'cursor-default'
                    : 'hover:shadow-xl hover:shadow-amber-500/10 cursor-pointer'
                    }`}
                    style={{padding:6}}
                >
                  <div className={`absolute inset-0 transition-all duration-500 ${isSelected
                    ? 'bg-linear-to-r from-slate-800 to-slate-900 border-2 border-amber-500/50'
                    : 'bg-slate-900/40 border border-slate-700/50'
                    }`}>
                    <motion.div
                      initial={{ width: 0 }}
                      animate={{
                        width: hasVoted ? `${percentage}%` : '0%',
                      }}
                      transition={{ duration: 1, ease: [0.22, 1, 0.36, 1], delay: 0.2 }}
                      className={`absolute inset-y-0 left-0 ${isSelected
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
                      <div className="relative shrink-0">
                        <motion.div
                          animate={{
                            scale: isSelected ? [1, 1.2, 1] : isHovered ? 1.15 : 1,
                          }}
                          transition={{ duration: 0.4 }}
                          className="relative"
                        >
                          <div className={`w-7 h-7 rounded-full border-2 flex items-center justify-center transition-all duration-500 ${isSelected
                            ? 'border-amber-500 bg-linear-to-br from-amber-500 to-orange-600 shadow-lg shadow-amber-500/50'
                            : hasVoted
                              ? 'border-slate-600 bg-slate-800/50'
                              : 'border-slate-500 bg-slate-800/30 group-hover/option:border-amber-500/50 group-hover/option:bg-slate-800/50'
                            }`}>
                            <AnimatePresence>
                              {isSelected && (
                                <motion.svg
                                  initial={{ scale: 0, rotate: -90 }}
                                  animate={{ scale: 1, rotate: 0 }}
                                  exit={{ scale: 0, rotate: 90 }}
                                  transition={{
                                    type: 'spring',
                                    stiffness: 200,
                                    damping: 15
                                  }}
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

                      <span className={`text-lg font-light truncate transition-all duration-500 ${isSelected
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
                          className="ml-6 flex items-center gap-3"
                        >
                          <div className="text-right">
                            <div className={`text-2xl font-semibold transition-colors duration-500 ${isSelected
                              ? 'text-amber-400'
                              : 'text-slate-400'
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
          <div className='h-2' />
          <div
            style={{
              display: "flex",
              justifyContent: "space-between",
              alignItems: "stretch",  
              gap: "16px",
              width: "100%"
            }}
          >
            <motion.button
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              onClick={() => onViewPoll(poll.id)}
              className="relative group/btn overflow-hidden"
              style={{
                flex: 1,
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                height: "100%"   
              }}
            >
              <div className="absolute inset-0 bg-linear-to-r from-slate-800 to-slate-900 transition-all duration-300"></div>

              <div className="absolute inset-0 border border-slate-700 group-hover/btn:border-amber-500/50 transition-colors duration-300"></div>

              <div
                style={{
                  padding: "14px 24px",
                  display: "flex",
                  alignItems: "center",
                  gap: "12px",
                  position: "relative",
                  color: "#cbd5e1",
                  fontWeight: 500
                }}
              >
                <span>View Full Results</span>

                <motion.svg
                  width="20"
                  height="20"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                  strokeWidth={2}
                  animate={{ x: [0, 4, 0] }}
                  transition={{ duration: 1.5, repeat: Infinity }}
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    d="M13 7l5 5m0 0l-5 5m5-5H6"
                  />
                </motion.svg>
              </div>
            </motion.button>

            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={handleCopyLink}
              style={{
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                padding: "14px 24px",
                border: "1px solid #334155",
                background: "rgba(30,41,59,0.5)",
                color: "#cbd5e1",
                gap: "8px",
                whiteSpace: "nowrap",
                height: "100%" 
              }}
            >
              {copied ? (
                <>
                  <svg width="18" height="18" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                  </svg>
                  <span>Copied!</span>
                </>
              ) : (
                <>
                  <svg width="18" height="18" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                    <path strokeLinecap="round" strokeLinejoin="round"
                      d="M8.684 13.342C8.886 12.938 9 12.482 9 12c0-.482-.114-.938-.316-1.342m0 2.684a3 3 0 110-2.684m0 2.684l6.632 3.316m-6.632-6l6.632-3.316"
                    />
                  </svg>
                  <span>Share</span>
                </>
              )}
            </motion.button>
          </div>


          <div className='h-2' />
        </div>
      </div>


    </motion.div>
  );
}