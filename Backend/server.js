import express from 'express';
import { WebSocketServer } from 'ws';
import { createServer } from 'http';
import cors from 'cors';
import dotenv from 'dotenv';
import { connectDatabase } from './config/database.js';
import { createPoll, getPoll, submitVote, getPollResults, getAllPolls } from './controllers/pollController.js';
import Poll from './models/Poll.js';
import Vote from './models/Vote.js';

dotenv.config();

const app = express();
const server = createServer(app);
const wss = new WebSocketServer({ server });

app.use(cors());
app.use(express.json());

const pollConnections = new Map();


wss.on('connection', (ws, req) => {
  const url = new URL(req.url, 'https://view-ezh5.onrender.com');
  const pollId = url.searchParams.get('pollId');
  
  if (!pollId) {
    ws.close(1008, 'Poll ID required please');
    return;
  }
  
  if (!pollConnections.has(pollId)) {
    pollConnections.set(pollId, new Set());
  }
  pollConnections.get(pollId).add(ws);
  
  console.log(`📡 WebSocket connected for poll: ${pollId} (${pollConnections.get(pollId).size} viewers)`);
  
  sendPollResults(pollId, ws);
  
  ws.on('close', () => {
    const connections = pollConnections.get(pollId);
    if (connections) {
      connections.delete(ws);
      console.log(`📡 WebSocket disconnected from poll: ${pollId} (${connections.size} viewers remaining)`);
      if (connections.size === 0) {
        pollConnections.delete(pollId);
      }
    }
  });
  
  ws.on('error', (error) => {
    console.error('WebSocket error:', error);
  });
});

async function sendPollResults(pollId, targetWs = null) {
  try {
    const poll = await Poll.findById(pollId).lean();
    if (!poll) return;
    
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
      type: 'results',
      poll: {
        id: poll._id,
        question: poll.question,
        options: poll.options.map(opt => ({
          id: opt.id,
          text: opt.text,
          votes: voteMap[opt.id] || 0
        })),
        totalVotes
      }
    };
    
    const message = JSON.stringify(results);
    
    if (targetWs) {
      if (targetWs.readyState === 1) {
        targetWs.send(message);
      }
    } else {
      const connections = pollConnections.get(pollId);
      if (connections) {
        let sent = 0;
        connections.forEach(client => {
          if (client.readyState === 1) {
            client.send(message);
            sent++;
          }
        });
        console.log(`📤 Broadcast to ${sent} viewers of poll ${pollId}`);
      }
    }
  } catch (error) {
    console.error('Error sending poll results:', error);
  }
}

export function broadcastPollUpdate(pollId) {
  sendPollResults(pollId);
}



app.post('/api/polls', createPoll);
app.get('/api/poll/all', getAllPolls);
app.get('/api/polls/:pollId', getPoll);
app.get('/api/polls/:pollId/results', getPollResults);



app.post('/api/polls/:pollId/vote', async (req, res) => {
  await submitVote(req, res);
  
  if (res.statusCode === 200) {
    broadcastPollUpdate(req.params.pollId);
  }
});

app.get('/health', (req, res) => {
  res.json({ 
    status: 'ok', 
    timestamp: new Date().toISOString(),
    activePolls: pollConnections.size,
    totalViewers: Array.from(pollConnections.values()).reduce((sum, set) => sum + set.size, 0)
  });
});

app.use((req, res) => {
  res.status(404).json({ error: 'Endpoint not found' });
});

app.use((err, req, res, next) => {
  console.error('Server error:', err);
  res.status(500).json({ error: 'Internal server error' });
});



const PORT = process.env.PORT || 3001;

async function startServer() {
  try {
    await connectDatabase();
    
    server.listen(PORT, () => {

      
      console.log('✅ Ready to accept poll creation and real-time voting');
 
    });
  } catch (error) {
    console.error('Failed to start server:', error);
    process.exit(1);
  }
}

startServer();