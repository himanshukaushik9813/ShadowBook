export function sendJson(response, statusCode, payload) {
  response.status(statusCode).json(payload);
}

export function methodNotAllowed(response, allowed = ['POST']) {
  response.setHeader('Allow', allowed.join(', '));
  sendJson(response, 405, { ok: false, error: `Method not allowed. Use ${allowed.join(' or ')}.` });
}

export function withErrorHandling(handler) {
  return async function wrappedHandler(request, response) {
    try {
      await handler(request, response);
    } catch (error) {
      const message = error?.message || 'Internal server error';
      sendJson(response, 400, { ok: false, error: message });
    }
  };
}

