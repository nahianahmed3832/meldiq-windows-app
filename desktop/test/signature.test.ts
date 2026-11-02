import { expect, it } from 'vitest';
import { validSignatureResult } from '../main/signature';
it('accepts only a valid Authenticode signature from an approved publisher', () => {
  expect(validSignatureResult(JSON.stringify({ status: 'Valid', type: 'Authenticode', publisher: 'Example Publisher' }), ['Example Publisher'])).toBe(true);
});
it.each([
  '', 'not json', '{}',
  JSON.stringify({ status: 'UnknownError', type: 'Authenticode', publisher: 'Example Publisher' }),
  JSON.stringify({ status: 'NotSigned', type: 'Authenticode', publisher: 'Example Publisher' }),
  JSON.stringify({ status: 'Valid', type: 'Catalog', publisher: 'Example Publisher' }),
  JSON.stringify({ status: 'Valid', type: 'Authenticode', publisher: 'Other Publisher' }),
])('rejects unavailable, invalid or mismatched signatures: %s', output => expect(validSignatureResult(output, ['Example Publisher'])).toBe(false));
