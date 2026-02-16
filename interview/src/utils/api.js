const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3001';

class ApiError extends Error {
  constructor(message, status, data) {
    super(message);
    this.name = 'ApiError';
    this.status = status;
    this.data = data;
  }
}

async function handleResponse(response) {
  const data = await response.json();
  
  if (!response.ok) {
    throw new ApiError(
      data.error || 'Request failed',
      response.status,
      data
    );
  }
  
  return data;
}

export async function createPoll(question, options) {
  const response = await fetch(`${API_URL}/api/polls`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ question, options })
  });
  
  return handleResponse(response);
}

export async function getPoll(pollId) {
  const response = await fetch(`${API_URL}/api/polls/${pollId}`);
  return handleResponse(response);
}



export async function submitVote(pollId, optionId) {
  const response = await fetch(`${API_URL}/api/polls/${pollId}/vote`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ optionId })
  });
  
  return handleResponse(response);
}

export { ApiError };