import { generateProof } from './_lib/ghostfiEngine';
import { methodNotAllowed, sendJson, withErrorHandling } from './_lib/http';

function normalizeClaim(body) {
  if (body?.claim) return body.claim;

  if (body?.preset === 'score-over-700') {
    return {
      metric: 'creditScore',
      operator: 'gt',
      value: 700,
    };
  }

  return {
    metric: 'creditScore',
    operator: 'gt',
    value: 700,
  };
}

export default withErrorHandling(async function handler(request, response) {
  if (request.method !== 'POST') {
    methodNotAllowed(response, ['POST']);
    return;
  }

  const body = request.body || {};

  const result = await generateProof({
    userId: body.userId,
    type: body.type || 'score',
    claim: normalizeClaim(body),
    reveal: Array.isArray(body.reveal) ? body.reveal : [],
    hide: Array.isArray(body.hide) ? body.hide : [],
  });

  sendJson(response, 200, {
    ok: true,
    ...result,
  });
});

