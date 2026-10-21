import 'server-only';
import { randomInt } from 'node:crypto';
import type { ReceiveResult } from './store';

/** Crypto randomness, not a counter: 900,000 possible values. UUIDs remain internal. */
export function generateEnquiryReference(): string {
  return `PBJ-${randomInt(100000, 1000000)}`;
}

/** Only confirmed DB reference collisions are retried. Never change the submission UUID.
 * Receipt and immutable email must be built with the same candidate in one transaction.
 */
export async function receiveWithFriendlyReference(
  receive: (reference: string) => Promise<ReceiveResult>,
  generate: () => string = generateEnquiryReference,
): Promise<ReceiveResult> {
  const deadline = Date.now() + 15000;
  for (let attempt = 0; attempt < 12 && Date.now() < deadline; attempt++) {
    const result = await receive(generate());
    if (result.outcome !== 'reference_collision') return result;
  }
  // Fail closed rather than weakening uniqueness or reusing an issued number.
  throw new Error('reference_allocation_unavailable');
}
