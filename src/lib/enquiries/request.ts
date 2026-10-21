import { submissionSchema, fieldErrors } from './schema';
/** Request boundary: bounds streamed input, validates the server payload and rejects honeypots. */
export async function parseSubmission(request: Request) {
  if (!request.headers.get('content-type')?.startsWith('application/json'))
    return { ok: false as const, status: 415, body: { code: 'invalid' } };
  const reader = request.body?.getReader();
  if (!reader)
    return { ok: false as const, status: 400, body: { code: 'invalid' } };
  const chunks: Uint8Array[] = [];
  let size = 0;
  while (true) {
    const { done, value } = await reader.read();
    if (done) break;
    size += value.length;
    if (size > 24000) {
      await reader.cancel();
      return { ok: false as const, status: 413, body: { code: 'invalid' } };
    }
    chunks.push(value);
  }
  let json: unknown;
  try {
    json = JSON.parse(Buffer.concat(chunks).toString('utf8'));
  } catch {
    return { ok: false as const, status: 400, body: { code: 'invalid' } };
  }
  const result = submissionSchema.safeParse(json);
  if (!result.success) {
    const errors = fieldErrors(result.error);
    return {
      ok: false as const,
      status: 422,
      body: {
        code: 'validation',
        errors: Object.fromEntries(
          Object.entries(errors)
            .filter(([key]) => key.startsWith('brief.'))
            .map(([key, value]) => [key.slice(6), value]),
        ),
      },
    };
  }
  if (result.data.website.trim())
    return { ok: false as const, status: 403, body: { code: 'spam' } };
  return { ok: true as const, data: result.data };
}
