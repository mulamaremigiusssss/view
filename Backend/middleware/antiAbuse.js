import crypto from 'crypto';
import Vote from '../models/Vote.js';


export function generateFingerprint(req) {
  const ip = req.headers['x-forwarded-for']?.split(',')[0]?.trim() || 
             req.headers['x-real-ip'] || 
             req.socket.remoteAddress || '';
  
  const userAgent = req.headers['user-agent'] || '';
  const acceptLang = req.headers['accept-language'] || '';
  const acceptEnc = req.headers['accept-encoding'] || '';
  
  const composite = [ip, userAgent, acceptLang, acceptEnc].join('|');
  
  return crypto.createHash('sha256').update(composite).digest('hex');
}


const RATE_LIMIT_SECONDS = 10;

export async function checkRateLimit(pollId, ipAddress) {
  try {
    const recentVote = await Vote.findOne(
      { pollId, ipAddress },
      { votedAt: 1 }
    ).sort({ votedAt: -1 }).lean();
    
    if (!recentVote) {
      return { allowed: true, waitTime: 0 };
    }
    
    const timeSinceVote = Date.now() - recentVote.votedAt.getTime();
    const requiredWait = RATE_LIMIT_SECONDS * 1000;
    
    if (timeSinceVote < requiredWait) {
      const waitSeconds = Math.ceil((requiredWait - timeSinceVote) / 1000);
      return { 
        allowed: false, 
        waitTime: waitSeconds,
        message: `Please wait ${waitSeconds} seconds before voting again`
      };
    }
    
    return { allowed: true, waitTime: 0 };
  } catch (error) {
    console.error('Rate limit check error:', error);
    return { allowed: true, waitTime: 0 };
  }
}

export async function checkDuplicateVote(pollId, fingerprint) {
  try {
    const existingVote = await Vote.findOne(
      { pollId, fingerprint },
      { optionId: 1 }
    ).lean();
    
    if (existingVote) {
      return {
        isDuplicate: true,
        votedOptionId: existingVote.optionId,
        message: 'You have already voted in this poll'
      };
    }
    
    return { isDuplicate: false };
  } catch (error) {
    return { isDuplicate: false };
  }
}

export function getIpAddress(req) {
  return req.headers['x-forwarded-for']?.split(',')[0]?.trim() || 
         req.headers['x-real-ip'] || 
         req.socket.remoteAddress || 
         'unknown';
}