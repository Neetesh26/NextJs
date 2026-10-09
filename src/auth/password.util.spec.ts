import { hashPassword, verifyPassword } from './password.util';

describe('password utilities', () => {
  it('hashes passwords and verifies them without storing plaintext', async () => {
    const hash = await hashPassword('strong-pass-1');

    expect(hash).not.toContain('strong-pass-1');
    await expect(verifyPassword('strong-pass-1', hash)).resolves.toBe(true);
    await expect(verifyPassword('wrong-pass', hash)).resolves.toBe(false);
  });

  it('rejects malformed hashes', async () => {
    await expect(verifyPassword('password', 'not-a-hash')).resolves.toBe(false);
  });
});
