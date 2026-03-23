import { loanCheck } from './_lib/ghostfiEngine';
import { methodNotAllowed, sendJson, withErrorHandling } from './_lib/http';

export default withErrorHandling(async function handler(request, response) {
  if (request.method !== 'POST') {
    methodNotAllowed(response, ['POST']);
    return;
  }

  const body = request.body || {};
  const result = await loanCheck({
    userId: body.userId,
    requestedAmount: body.requestedAmount,
    termMonths: body.termMonths,
  });

  sendJson(response, 200, {
    ok: true,
    ...result,
  });
});

