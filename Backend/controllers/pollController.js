import crypto from 'crypto';
import Poll from '../models/Poll.js';
import Vote from '../models/Vote.js';
import { generateFingerprint, checkRateLimit, checkDuplicateVote, getIpAddress } from '../middleware/antiAbuse.js';

function generatePollId() {
  return crypto.randomBytes(8).toString('hex');
}

export async function createPoll(req, res) {
  try {
    const { question, options } = req.body;

    
    if (!question || typeof question !== 'string' || question.trim().length === 0) {
      return res.status(400).json({ 
        error: 'Question is required and must be a non-empty string' 
      });
    }
    
    if (!Array.isArray(options) || options.length < 2) {
      return res.status(400).json({ 
        error: 'At least 2 options are required' 
      });
    }
    
    const validOptions = options
      .filter(opt => opt && typeof opt === 'string' && opt.trim().length > 0)
      .map(opt => opt.trim());
    
    if (validOptions.length < 2) {
      return res.status(400).json({ 
        error: 'At least 2 valid options are required' 
      });
    }
    
    if (validOptions.length > 10) {
      return res.status(400).json({ 
        error: 'Maximum 10 options allowed' 
      });
    }
    
    const pollId = generatePollId();
    const formattedOptions = validOptions.map(text => ({
      id: crypto.randomBytes(6).toString('hex'),
      text
    }));
    
    const poll = new Poll({
      _id: pollId,
      question: question.trim(),
      options: formattedOptions
    });
    
    await poll.save();
    
    res.status(201).json({
      pollId,
      shareUrl: `/poll/${pollId}`
    });
  } catch (error) {
    res.status(500).json({ error: 'Failed to create poll' });
  }
}

export async function getPoll(req, res) {
  try {
    const { pollId } = req.params;
    
    const poll = await Poll.findById(pollId).lean();
    
    if (!poll) {
      return res.status(404).json({ error: 'Poll not found' });
    }
    
    const voteCounts = await Vote.aggregate([
      { $match: { pollId } },
      { $group: { _id: '$optionId', count: { $sum: 1 } } }
    ]);
    
    const voteMap = {};
    let totalVotes = 0;
    voteCounts.forEach(v => {
      voteMap[v._id] = v.count;
      totalVotes += v.count;
    });
    
    const fingerprint = generateFingerprint(req);
    const userVote = await Vote.findOne(
      { pollId, fingerprint },
      { optionId: 1 }
    ).lean();
    
    const pollData = {
      id: poll._id,
      question: poll.question,
      options: poll.options.map(opt => ({
        id: opt.id,
        text: opt.text,
        votes: voteMap[opt.id] || 0
      })),
      totalVotes
    };
    
    res.json({
      poll: pollData,
      hasVoted: !!userVote,
      userVote: userVote?.optionId || null
    });
  } catch (error) {
    res.status(500).json({ error: 'Failed to retrieve poll' });
  }
}

export async function submitVote(req, res) {
  try {
    const { pollId } = req.params;
    const { optionId } = req.body;
    
    if (!optionId) {
      return res.status(400).json({ error: 'Option ID is required' });
    }
    
    const poll = await Poll.findById(pollId).lean();
    if (!poll) {
      return res.status(404).json({ error: 'Poll not found' });
    }
    
    const validOption = poll.options.find(opt => opt.id === optionId);
    if (!validOption) {
      return res.status(400).json({ error: 'Invalid option' });
    }
    
    const fingerprint = generateFingerprint(req);
    const ipAddress = getIpAddress(req);
    const userAgent = req.headers['user-agent'] || 'unknown';
    
    const duplicateCheck = await checkDuplicateVote(pollId, fingerprint);
    if (duplicateCheck.isDuplicate) {
      return res.status(403).json({ 
        error: duplicateCheck.message,
        mechanism: 'fingerprint',
        votedOption: duplicateCheck.votedOptionId
      });
    }
    
    const rateLimitCheck = await checkRateLimit(pollId, ipAddress);
    if (!rateLimitCheck.allowed) {
      return res.status(429).json({ 
        error: rateLimitCheck.message,
        mechanism: 'rate-limit',
        waitTime: rateLimitCheck.waitTime
      });
    }
    
    const vote = new Vote({
      pollId,
      optionId,
      fingerprint,
      ipAddress,
      userAgent,
      votedAt: new Date()
    });
    
    await vote.save();
    
    res.json({ success: true, optionId });
  } catch (error) {
    if (error.code === 11000) {
      return res.status(403).json({ 
        error: 'You have already voted in this poll',
        mechanism: 'fingerprint'
      });
    }
    res.status(500).json({ error: 'Failed to submit vote' });
  }
}

export async function getPollResults(req, res) {
  try {
    const { pollId } = req.params;
    
    const poll = await Poll.findById(pollId).lean();
    if (!poll) {
      return res.status(404).json({ error: 'Poll not found' });
    }
    
    const voteCounts = await Vote.aggregate([
      { $match: { pollId } },
      { $group: { _id: '$optionId', count: { $sum: 1 } } }
    ]);
    
    const voteMap = {};
    let totalVotes = 0;
    voteCounts.forEach(v => {
      voteMap[v._id] = v.count;
      totalVotes += v.count;
    });
    
    const results = {
      id: poll._id,
      question: poll.question,
      options: poll.options.map(opt => ({
        id: opt.id,
        text: opt.text,
        votes: voteMap[opt.id] || 0
      })),
      totalVotes
    };
    
    res.json(results);
  } catch (error) {
    res.status(500).json({ error: 'Failed to retrieve results' });
  }
}

export async function getAllPolls(req, res) {
  try {
    const polls = await Poll.find()
      .sort({ createdAt: -1 })
      .limit(50)
      .lean();
     

    const pollsWithVotes = await Promise.all(
      polls.map(async (poll) => {
        const voteCounts = await Vote.aggregate([
          { $match: { pollId: poll._id } },
          { $group: { _id: '$optionId', count: { $sum: 1 } } }
        ]);
        
        const voteMap = {};
        let totalVotes = 0;
        voteCounts.forEach(v => {
          voteMap[v._id] = v.count;
          totalVotes += v.count;
        });
        
        return {
          id: poll._id,
          question: poll.question,
          options: poll.options.map(opt => ({
            id: opt.id,
            text: opt.text,
            votes: voteMap[opt.id] || 0
          })),
          totalVotes,
          createdAt: poll.createdAt
        };
      })
    );
    
    res.json({ polls: pollsWithVotes });
  } catch (error) {
    res.status(500).json({ error: 'Failed to retrieve polls' });
  }
}