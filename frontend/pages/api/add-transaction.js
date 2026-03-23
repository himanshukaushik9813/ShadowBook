import { addTransaction } from './_lib/ghostfiEngine';
import { methodNotAllowed, sendJson, withErrorHandling } from './_lib/http';

export default withErrorHandling(async function handler(request, response) {
  if (request.method !== 'POST') {
    methodNotAllowed(response, ['POST']);
    return;
  }

  const body = request.body || {};
  const result = await addTransaction({
    userId: body.userId,
    kind: body.kind,
    amount: body.amount,
    source: body.source,
    metadata: body.metadata,
  });

  sendJson(response, 200, {
    ok: true,
    ...result,
  });
});

