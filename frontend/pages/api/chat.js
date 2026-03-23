import { generateProof, getHistory, getSnapshot, loanCheck } from './_lib/ghostfiEngine';
import { methodNotAllowed, sendJson, withErrorHandling } from './_lib/http';

function includes(text, value) {
  return text.includes(value);
}

export default withErrorHandling(async function handler(request, response) {
  if (request.method !== 'POST') {
    methodNotAllowed(response, ['POST']);
    return;
  }

  const body = request.body || {};
  const userId = String(body.userId || 'anonymous').trim() || 'anonymous';
  const message = String(body.message || '').trim();

  if (!message) {
    sendJson(response, 400, { ok: false, error: 'message is required.' });
    return;
  }

  const lowered = message.toLowerCase();

  if (includes(lowered, 'credit score')) {
    const snapshot = await getSnapshot({ userId });
    sendJson(response, 200, {
      ok: true,
      action: 'credit-score',
      reply: `Your private score is ${snapshot.creditScore}. I can generate a selective proof without revealing the raw value.`,
      data: snapshot,
      timestamp: Date.now(),
    });
    return;
  }

  if (includes(lowered, 'eligible') || includes(lowered, 'loan')) {
    const result = await loanCheck({ userId, requestedAmount: body.requestedAmount || 2500, termMonths: 12 });
    sendJson(response, 200, {
      ok: true,
      action: 'loan-check',
      reply: result.loan.approved
        ? `Loan approved. Eligible up to ${result.loan.maxEligibleAmount}.`
        : `Loan rejected. ${result.loan.reasons[0] || 'Policy checks did not pass.'}`,
      data: result,
      timestamp: Date.now(),
    });
    return;
  }

  if (includes(lowered, 'generate proof') || includes(lowered, 'proof')) {
    const result = await generateProof({
      userId,
      type: 'score',
      claim: { metric: 'creditScore', operator: 'gt', value: 700 },
      reveal: ['activityFrequency'],
      hide: ['creditScore'],
    });
    sendJson(response, 200, {
      ok: true,
      action: 'generate-proof',
      reply: `Proof ${result.proof.id} generated. Result: ${result.proof.result}. Raw score remains hidden.`,
      data: result,
      timestamp: Date.now(),
    });
    return;
  }

  if (includes(lowered, 'history') || includes(lowered, 'recent proofs')) {
    const result = await getHistory({ userId, limit: 5 });
    sendJson(response, 200, {
      ok: true,
      action: 'history',
      reply: `Retrieved ${result.proofs.length} recent proofs from your private history.`,
      data: result,
      timestamp: Date.now(),
    });
    return;
  }

  sendJson(response, 200, {
    ok: true,
    action: 'fallback',
    reply: 'Ask me to check credit score, run loan eligibility, generate proof, or show history.',
    data: null,
    timestamp: Date.now(),
  });
});

