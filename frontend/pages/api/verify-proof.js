import { verifyProof } from './_lib/ghostfiEngine';
import { methodNotAllowed, sendJson, withErrorHandling } from './_lib/http';

export default withErrorHandling(async function handler(request, response) {
  if (request.method !== 'POST') {
    methodNotAllowed(response, ['POST']);
    return;
  }

  const body = request.body || {};
  const result = await verifyProof({
    userId: body.userId,
    proofId: body.proofId,
  });

  sendJson(response, 200, {
    ok: true,
    ...result,
  });
});

