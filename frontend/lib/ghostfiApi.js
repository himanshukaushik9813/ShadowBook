async function parseResponse(response) {
  let payload = null;
  try {
    payload = await response.json();
  } catch (_error) {
    payload = null;
  }

  if (!response.ok || !payload?.ok) {
    const message = payload?.error || `Request failed with status ${response.status}`;
    throw new Error(message);
  }

  return payload;
}

async function request(path, options = {}) {
  const response = await fetch(path, {
    method: options.method || 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: options.body ? JSON.stringify(options.body) : undefined,
  });

  return parseResponse(response);
}

export async function addTransactionApi(payload) {
  return request('/api/add-transaction', { method: 'POST', body: payload });
}

export async function generateProofApi(payload) {
  return request('/api/generate-proof', { method: 'POST', body: payload });
}

export async function verifyProofApi(payload) {
  return request('/api/verify-proof', { method: 'POST', body: payload });
}

export async function loanCheckApi(payload) {
  return request('/api/loan-check', { method: 'POST', body: payload });
}

export async function historyApi(payload) {
  return request('/api/history', { method: 'POST', body: payload });
}

export async function chatApi(payload) {
  return request('/api/chat', { method: 'POST', body: payload });
}

