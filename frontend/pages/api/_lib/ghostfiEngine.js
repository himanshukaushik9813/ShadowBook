const MAX_PROOF_HISTORY = 10;
const MAX_TX_HISTORY = 200;
const ACTIVITY_WINDOW_MS = 1000 * 60 * 60 * 24 * 30;

function clamp(value, min, max) {
  return Math.min(max, Math.max(min, value));
}

function toSafeNumber(value, fallback = 0) {
  const numeric = Number(value);
  return Number.isFinite(numeric) ? numeric : fallback;
}

function currentTimestamp() {
  return Date.now();
}

function makeId(prefix, sequence) {
  const stamp = currentTimestamp().toString(36).toUpperCase();
  const seq = String(sequence).padStart(4, '0');
  return `${prefix}-${stamp}-${seq}`;
}

function createEmptyProfile(userId) {
  return {
    userId,
    creditScore: 640,
    incomeTotal: 0,
    expenseTotal: 0,
    activityCount: 0,
    activityTimestamps: [],
    transactions: [],
    proofHistory: [],
    loanHistory: [],
    updatedAt: currentTimestamp(),
  };
}

function activityFrequency(profile, now = currentTimestamp()) {
  const threshold = now - ACTIVITY_WINDOW_MS;
  return profile.activityTimestamps.filter((timestamp) => timestamp >= threshold).length;
}

function sanitizeHistory(profile, now = currentTimestamp()) {
  const threshold = now - ACTIVITY_WINDOW_MS;
  profile.activityTimestamps = profile.activityTimestamps.filter((timestamp) => timestamp >= threshold);
  if (profile.transactions.length > MAX_TX_HISTORY) {
    profile.transactions = profile.transactions.slice(0, MAX_TX_HISTORY);
  }
  if (profile.proofHistory.length > MAX_PROOF_HISTORY) {
    profile.proofHistory = profile.proofHistory.slice(0, MAX_PROOF_HISTORY);
  }
}

function computeCreditScore(profile) {
  const frequency = activityFrequency(profile);
  const incomeBoost = Math.min(220, Math.sqrt(profile.incomeTotal + 1) * 6.2);
  const expensePenalty = Math.min(205, Math.sqrt(profile.expenseTotal + 1) * 5.4);
  const activityBoost = Math.min(95, frequency * 5.5);
  const netBalance = profile.incomeTotal - profile.expenseTotal;
  const balanceBoost = clamp(netBalance / 120, -65, 65);

  const score = 520 + incomeBoost - expensePenalty + activityBoost + balanceBoost;
  return Math.round(clamp(score, 300, 900));
}

function evaluatePredicate(value, operator, target) {
  if (operator === 'gt') return value > target;
  if (operator === 'gte') return value >= target;
  if (operator === 'lt') return value < target;
  if (operator === 'lte') return value <= target;
  if (operator === 'eq') return value === target;
  if (operator === 'neq') return value !== target;
  return false;
}

function readMetric(profile, metricName) {
  if (metricName === 'creditScore') return profile.creditScore;
  if (metricName === 'incomeTotal') return profile.incomeTotal;
  if (metricName === 'expenseTotal') return profile.expenseTotal;
  if (metricName === 'activityFrequency') return activityFrequency(profile);
  return null;
}

function summarizeProfile(profile) {
  return {
    userId: profile.userId,
    creditScore: profile.creditScore,
    totals: {
      income: Number(profile.incomeTotal.toFixed(2)),
      expense: Number(profile.expenseTotal.toFixed(2)),
    },
    activity: {
      totalTransactions: profile.activityCount,
      last30Days: activityFrequency(profile),
    },
    updatedAt: profile.updatedAt,
  };
}

function checkLoan(profile, options = {}) {
  const requestedAmount = toSafeNumber(options.requestedAmount, 0);
  const termMonths = Math.max(1, Math.round(toSafeNumber(options.termMonths, 12)));
  const frequency = activityFrequency(profile);
  const disposableRatio = profile.incomeTotal <= 0
    ? 0
    : (profile.incomeTotal - profile.expenseTotal) / profile.incomeTotal;
  const scoreGate = profile.creditScore >= 680;
  const activityGate = frequency >= 3;
  const sustainabilityGate = disposableRatio >= 0.12;

  const approved = scoreGate && activityGate && sustainabilityGate;
  const maxEligibleAmount = Math.max(
    0,
    Math.round((profile.creditScore - 500) * 7 + frequency * 250 + disposableRatio * 6000)
  );

  const reasons = [];
  if (!scoreGate) reasons.push('Credit score below approval threshold.');
  if (!activityGate) reasons.push('Insufficient financial activity frequency.');
  if (!sustainabilityGate) reasons.push('Income-to-expense profile is too constrained.');

  let status = approved ? 'Approved' : 'Rejected';
  if (approved && requestedAmount > maxEligibleAmount) {
    status = 'Rejected';
    reasons.push('Requested amount exceeds current eligible limit.');
  }

  return {
    status,
    approved: status === 'Approved',
    requestedAmount,
    termMonths,
    maxEligibleAmount,
    aprEstimate: approved ? clamp(22 - (profile.creditScore - 650) * 0.04, 9.5, 22) : null,
    reasons: reasons.length ? reasons : ['Profile satisfies private lending policy checks.'],
    evaluatedAt: currentTimestamp(),
  };
}

const runtimeState = globalThis.__ghostfiRuntimeState || {
  users: new Map(),
  proofs: new Map(),
  sequences: {
    proof: 1,
    transaction: 1,
    loan: 1,
  },
};

if (!globalThis.__ghostfiRuntimeState) {
  globalThis.__ghostfiRuntimeState = runtimeState;
}

function ensureProfile(userId) {
  const normalizedUserId = String(userId || 'anonymous').trim() || 'anonymous';
  const existing = runtimeState.users.get(normalizedUserId);
  if (existing) return existing;

  const profile = createEmptyProfile(normalizedUserId);
  runtimeState.users.set(normalizedUserId, profile);
  return profile;
}

export async function addTransaction(payload = {}) {
  const userId = String(payload.userId || 'anonymous').trim() || 'anonymous';
  const kind = payload.kind === 'income' ? 'income' : 'expense';
  const amount = toSafeNumber(payload.amount, NaN);
  if (!Number.isFinite(amount) || amount <= 0) {
    throw new Error('Transaction amount must be a positive number.');
  }

  const profile = ensureProfile(userId);
  const now = currentTimestamp();
  const transaction = {
    id: makeId('TX', runtimeState.sequences.transaction++),
    kind,
    amount: Number(amount.toFixed(2)),
    source: payload.source || 'manual',
    timestamp: now,
    metadata: payload.metadata || {},
  };

  if (kind === 'income') {
    profile.incomeTotal += amount;
  } else {
    profile.expenseTotal += amount;
  }

  profile.activityCount += 1;
  profile.activityTimestamps.unshift(now);
  profile.transactions.unshift(transaction);
  sanitizeHistory(profile, now);
  profile.creditScore = computeCreditScore(profile);
  profile.updatedAt = now;

  return {
    transaction,
    user: summarizeProfile(profile),
  };
}

export async function generateProof(payload = {}) {
  const userId = String(payload.userId || 'anonymous').trim() || 'anonymous';
  const profile = ensureProfile(userId);

  const claim = payload.claim || {};
  const metric = claim.metric || 'creditScore';
  const operator = claim.operator || 'gt';
  const target = toSafeNumber(claim.value, metric === 'creditScore' ? 700 : 0);
  const metricValue = readMetric(profile, metric);

  if (metricValue === null) {
    throw new Error(`Unsupported proof metric "${metric}".`);
  }

  const disclosed = Array.isArray(payload.reveal) ? payload.reveal : [];
  const hidden = Array.isArray(payload.hide) ? payload.hide : [];
  const isValid = evaluatePredicate(metricValue, operator, target);

  const selectiveDisclosure = {
    revealed: {},
    hidden,
    redactedCount: hidden.length,
  };

  disclosed.forEach((field) => {
    if (field === 'creditScore') selectiveDisclosure.revealed.creditScore = profile.creditScore;
    if (field === 'activityFrequency') selectiveDisclosure.revealed.activityFrequency = activityFrequency(profile);
    if (field === 'incomeTotal') selectiveDisclosure.revealed.incomeTotal = Number(profile.incomeTotal.toFixed(2));
    if (field === 'expenseTotal') selectiveDisclosure.revealed.expenseTotal = Number(profile.expenseTotal.toFixed(2));
    if (field === 'updatedAt') selectiveDisclosure.revealed.updatedAt = profile.updatedAt;
  });

  const proof = {
    id: makeId('ZK', runtimeState.sequences.proof++),
    userId,
    type: payload.type || 'score',
    result: isValid ? 'valid' : 'invalid',
    status: 'issued',
    timestamp: currentTimestamp(),
    claim: {
      metric,
      operator,
      value: target,
    },
    selectiveDisclosure,
  };

  profile.proofHistory.unshift(proof);
  sanitizeHistory(profile);
  runtimeState.proofs.set(proof.id, proof);
  profile.updatedAt = currentTimestamp();

  return {
    proof,
    user: summarizeProfile(profile),
  };
}

export async function verifyProof(payload = {}) {
  const proofId = String(payload.proofId || '').trim();
  const userId = payload.userId ? String(payload.userId).trim() : null;
  if (!proofId) throw new Error('proofId is required.');

  const proof = runtimeState.proofs.get(proofId);
  if (!proof) {
    return {
      proofId,
      status: 'missing',
      verified: false,
      message: 'Proof not found.',
      timestamp: currentTimestamp(),
    };
  }

  if (userId && proof.userId !== userId) {
    return {
      proofId,
      status: 'denied',
      verified: false,
      message: 'Proof does not belong to this user.',
      timestamp: currentTimestamp(),
    };
  }

  return {
    proofId,
    status: 'verified',
    verified: proof.result === 'valid',
    result: proof.result,
    type: proof.type,
    timestamp: currentTimestamp(),
  };
}

export async function loanCheck(payload = {}) {
  const userId = String(payload.userId || 'anonymous').trim() || 'anonymous';
  const profile = ensureProfile(userId);
  const decision = checkLoan(profile, payload);

  const historyEntry = {
    id: makeId('LN', runtimeState.sequences.loan++),
    ...decision,
  };

  profile.loanHistory.unshift(historyEntry);
  if (profile.loanHistory.length > 10) {
    profile.loanHistory = profile.loanHistory.slice(0, 10);
  }
  profile.updatedAt = currentTimestamp();

  return {
    loan: historyEntry,
    user: summarizeProfile(profile),
  };
}

export async function getHistory(payload = {}) {
  const userId = String(payload.userId || 'anonymous').trim() || 'anonymous';
  const limit = clamp(Math.round(toSafeNumber(payload.limit, 10)), 1, 10);
  const profile = ensureProfile(userId);
  sanitizeHistory(profile);

  return {
    userId,
    proofs: profile.proofHistory.slice(0, limit).map((proof) => ({
      id: proof.id,
      type: proof.type,
      result: proof.result,
      status: proof.status,
      timestamp: proof.timestamp,
    })),
    total: profile.proofHistory.length,
  };
}

export async function getSnapshot(payload = {}) {
  const userId = String(payload.userId || 'anonymous').trim() || 'anonymous';
  const profile = ensureProfile(userId);
  sanitizeHistory(profile);
  return summarizeProfile(profile);
}

