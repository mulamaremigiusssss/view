import crypto from 'crypto';
import Vote from '../models/Vote.js';

// ==============================================================================
// ANTI-ABUSE MECHANISM #1: Multi-Factor Cryptographic Fingerprinting
// ==============================================================================
// 
// What it prevents:
// - Multiple votes from same browser/device
// - Session manipulation attacks
// - Cookie clearing circumvention
// - Basic bot attacks
//
// How it works:
// - Combines: IP + User-Agent + Accept-Language + Accept-Encoding
// - Creates SHA-256 hash for strong, unique identification
// - Stored in MongoDB with unique constraint on (pollId, fingerprint)
// - Automatically prevents duplicate votes at database level
//
// Limitations:
// - Bypassed by incognito/private browsing (new session)
// - Different browsers on same device = different fingerprints
// - VPN switching + different browser = multiple votes possible
// - Sophisticated fingerprint spoofing tools can bypass
// - Privacy-focused browsers may randomize headers
//
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

// ==============================================================================
// ANTI-ABUSE MECHANISM #2: Adaptive Rate Limiting with IP Tracking
// ==============================================================================
//
// What it prevents:
// - Rapid-fire voting attempts
// - Automated bot attacks
// - DDoS-style vote manipulation
// - Vote spam from single source
//
// How it works:
// - Tracks last vote timestamp per IP per poll
// - Enforces 10-second cooldown between votes from same IP
// - Uses MongoDB indexed queries for O(log n) performance
// - Returns remaining wait time for user feedback
//
// Limitations:
// - Shared IPs (NAT, corporate networks) affect all users behind same IP
// - VPN/proxy rotation bypasses by changing IP
// - Patient attackers can bypass by waiting between attempts
// - Distributed attacks from multiple IPs not prevented
// - IPv6 rotation may create false new IPs
//
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
    console.error('Duplicate check error:', error);
    return { isDuplicate: false };
  }
}

export function getIpAddress(req) {
  return req.headers['x-forwarded-for']?.split(',')[0]?.trim() || 
         req.headers['x-real-ip'] || 
         req.socket.remoteAddress || 
         'unknown';
}