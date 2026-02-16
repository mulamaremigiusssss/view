import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { createPoll, ApiError } from '../utils/api';

export default function CreatePollModal({ isOpen, onClose, onPollCreated }) {
  const [question, setQuestion] = useState('');
  const [options, setOptions] = useState(['', '']);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    if (isOpen) {
      setQuestion('');
      setOptions(['', '']);
      setError('');
      setIsSubmitting(false);
    }
  }, [isOpen]);

  const handleAddOption = () => {
    if (options.length < 10) {
      setOptions([...options, '']);
    }
  };

  const handleRemoveOption = (index) => {
    if (options.length > 2) {
      setOptions(options.filter((_, i) => i !== index));
    }
  };

  const handleOptionChange = (index, value) => {
    const newOptions = [...options];
    newOptions[index] = value;
    setOptions(newOptions);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    if (!question.trim()) {
      setError('Please enter a question');
      return;
    }

    const validOptions = options.filter(opt => opt.trim());
    if (validOptions.length < 2) {
      setError('Please provide at least 2 options');
      return;
    }

    setIsSubmitting(true);

    try {
      const data = await createPoll(question.trim(), validOptions.map(opt => opt.trim()));
      onPollCreated(data.pollId);
    } catch (err) {
      if (err instanceof ApiError) {
        setError(err.message);
      } else {
        setError('Failed to create poll. Please try again.');
      }
      setIsSubmitting(false);
    }
  };

  const handleBackdropClick = (e) => {
    if (e.target === e.currentTarget && !isSubmitting) {
      onClose();
    }
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.3 }}
          onClick={handleBackdropClick}
          className="fixed inset-0 bg-black/40 backdrop-blur-sm flex items-center justify-center p-4 z-50"
        >
          

          <motion.div
            initial={{ opacity: 0, scale: 0.9, y: 30 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.9, y: 30 }}
            transition={{ 
              duration: 0.4,
              ease: [0.22, 1, 0.36, 1]
            }}
            className="relative bg-linear-to-br from-slate-900 via-slate-800 to-slate-900 w-full max-w-2xl max-h-[90vh] overflow-hidden shadow-2xl shadow-black/60"
            onClick={(e) => e.stopPropagation()}
            
          >
            
            <div className="sticky top-0 bg-linear-to-b from-slate-900/95 to-slate-900/80 backdrop-blur-xl border-b border-slate-700/50 px-8 py-6 flex items-center justify-between z-10" style={{padding:10}}>
              <div>
                <h2 className="text-2xl font-light text-slate-100">
                  Create New Poll
                </h2>
                <p className="text-sm text-slate-400 mt-1 font-light tracking-wide">
                  Ask a question and add options
                </p>
              </div>
              <motion.button
                whileHover={{ scale: 1.1, rotate: 90 }}
                whileTap={{ scale: 0.9 }}
                onClick={onClose}
                disabled={isSubmitting}
                className="w-10 h-10 flex items-center justify-center border border-slate-700 hover:border-amber-500/50 text-slate-400 hover:text-amber-400 transition-all duration-300 disabled:opacity-50"
                aria-label="Close modal"
              >
                <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                </svg>
              </motion.button>
            </div>

            <div className="overflow-y-auto max-h-[calc(90vh-200px)] px-8 py-6" style={{padding:10}}>
              <form onSubmit={handleSubmit} className="space-y-8">
                <div className="space-y-3">
                  <label 
                    htmlFor="modal-question" 
                    className="block text-xs uppercase tracking-[0.2em] text-amber-400 font-medium"
                  >
                    Your Question <span className="text-rose-400">*</span>
                  </label>
                  <div className="relative group" style={{paddingTop:6}}>
                    <input
                      id="modal-question"
                      type="text"
                      value={question}
                      onChange={(e) => setQuestion(e.target.value)}
                      placeholder="What would you like to ask?"
                      maxLength={500}
                      className="relative w-full px-6 py-4 bg-slate-950/60 border border-slate-700 text-slate-100 placeholder:text-slate-500 outline-none focus:border-amber-500/50 transition-all duration-300 text-lg font-light"
                      disabled={isSubmitting}
                      autoFocus
                      style={{padding:6}}
                    />
                  </div>
                  <div className="flex justify-between items-center" style={{paddingTop:6}}>
                    <p className="text-xs text-slate-500 font-light">Press Tab to move to options</p>
                    <p className="text-xs text-slate-500">
                      <span className={question.length > 450 ? 'text-amber-400' : ''}>{question.length}</span>/500
                    </p>
                  </div>
                </div>

                <div className="space-y-4" style={{paddingTop:10}}>
                  <div className="flex items-center justify-between">
                    <label className="block text-xs uppercase tracking-[0.2em] text-amber-400 font-medium" style={{paddingTop:6}}>
                      Options <span className="text-rose-400">*</span>
                      <span className="text-slate-500 font-light normal-case tracking-normal ml-2 text-xs">(min. 2, max. 10)</span>
                    </label>
                    {options.length < 10 && (
                      <motion.button
                        whileHover={{ scale: 1.05 }}
                        whileTap={{ scale: 0.95 }}
                        type="button"
                        onClick={handleAddOption}
                        className="flex items-center gap-2 px-3 py-1.5 text-xs text-amber-400 hover:text-amber-300 border border-amber-500/30 hover:border-amber-500/50 transition-all duration-300"
                        disabled={isSubmitting}
                        style={{padding:6}}
                      >
                        <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                          <path strokeLinecap="round" strokeLinejoin="round" d="M12 4v16m8-8H4" />
                        </svg>
                        Add Option
                      </motion.button>
                    )}
                  </div>

                  <div className="space-y-3" style={{paddingTop:10}}>
                    <AnimatePresence mode="popLayout">
                      {options.map((option, index) => (
                        <motion.div
                          key={index}
                          initial={{ opacity: 0, x: -30, scale: 0.95 }}
                          animate={{ opacity: 1, x: 0, scale: 1 }}
                          exit={{ opacity: 0, x: 30, scale: 0.95 }}
                          transition={{ 
                            duration: 0.3,
                            ease: [0.22, 1, 0.36, 1]
                          }}
                          className="flex gap-3 group/input"
                          style={{paddingTop:6}}
                        >
                          <div className="flex-1 relative">
                            <input
                              type="text"
                              value={option}
                              onChange={(e) => handleOptionChange(index, e.target.value)}
                              placeholder={`Choice ${index + 1}`}
                              maxLength={200}
                              className="relative w-full px-5 py-4 bg-slate-950/40 border border-slate-700 text-slate-100 placeholder:text-slate-600 outline-none focus:border-amber-500/50 transition-all duration-300 font-light"
                              disabled={isSubmitting}
                              style={{padding:6}}
                            />
                          </div>
                          {options.length > 2 && (
                            <motion.button
                              whileHover={{ scale: 1.05 }}
                              whileTap={{ scale: 0.95 }}
                              type="button"
                              onClick={() => handleRemoveOption(index)}
                              className="w-14 h-14 flex items-center justify-center bg-rose-500/10 border border-rose-500/30 hover:bg-rose-500/20 hover:border-rose-500/50 transition-all duration-300"
                              disabled={isSubmitting}
                              aria-label="Remove option"
                            >
                              <svg className="w-5 h-5 text-rose-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                                <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                              </svg>
                            </motion.button>
                          )}
                        </motion.div>
                      ))}
                    </AnimatePresence>
                  </div>
                </div>

                <AnimatePresence>
                  {error && (
                    <motion.div
                      initial={{ opacity: 0, height: 0 }}
                      animate={{ opacity: 1, height: 'auto' }}
                      exit={{ opacity: 0, height: 0 }}
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
              </form>
            </div>

            <div className="sticky bottom-0 bg-linear-to-t from-slate-900/95 to-slate-900/80 backdrop-blur-xl border-t border-slate-700/50 px-8 py-6" style={{padding:10}}>
              <div className="flex gap-4">
                <motion.button
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  type="button"
                  onClick={onClose}
                  disabled={isSubmitting}
                  className="flex-1 px-6 py-4 border border-slate-700 text-slate-300 font-medium hover:bg-slate-800/50 hover:border-slate-600 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-300"
                  style={{padding:6}}
                >
                  Cancel
                </motion.button>
                <motion.button
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  type="submit"
                  onClick={handleSubmit}
                  disabled={isSubmitting}
                  className="relative flex-1 group/btn overflow-hidden"
                
                >
                  <div className="absolute inset-0 bg-linear-to-r from-amber-500 to-orange-500 transition-transform duration-500 group-hover/btn:scale-105"></div>
                  <div className="absolute inset-0 bg-linear-to-r from-amber-400 to-orange-400 opacity-0 group-hover/btn:opacity-100 transition-opacity duration-500"></div>
                  <div className="relative px-6 py-4 text-slate-900 font-semibold tracking-wide disabled:opacity-50" style={{padding:6}}>
                    {isSubmitting ? (
                      <span className="flex items-center justify-center gap-3">
                        <svg className="animate-spin h-5 w-5" fill="none" viewBox="0 0 24 24">
                          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                        </svg>
                        Creating Poll...
                      </span>
                    ) : (
                      'Create Poll'
                    )}
                  </div>
                </motion.button>
              </div>
            </div>
          </motion.div>
        </motion.div>
      )}

     
    </AnimatePresence>
  );
}