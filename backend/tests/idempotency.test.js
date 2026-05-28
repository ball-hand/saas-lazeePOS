import { jest } from '@jest/globals';
import { idempotency } from '../middleware/idempotency.js';

describe('Idempotency Middleware', () => {
  it('should call next if no idempotency key is provided', () => {
    const req = { headers: {} };
    const res = {};
    const next = jest.fn();

    idempotency(req, res, next);

    expect(next).toHaveBeenCalled();
  });
});
