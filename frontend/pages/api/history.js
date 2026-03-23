import { getHistory } from './_lib/ghostfiEngine';
import { methodNotAllowed, sendJson, withErrorHandling } from './_lib/http';

function resolveInput(request) {
  if (request.method === 'GET') {
    return {
      userId: request.query.userId,
      limit: request.query.limit,
    };
  }
  return {
    userId: request.body?.userId,
    limit: request.body?.limit,
  };
}

export default withErrorHandling(async function handler(request, response) {
  if (request.method !== 'GET' && request.method !== 'POST') {
    methodNotAllowed(response, ['GET', 'POST']);
    return;
  }

  const input = resolveInput(request);
  const result = await getHistory(input);

  sendJson(response, 200, {
    ok: true,
    ...result,
  });
});

