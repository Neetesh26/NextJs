import { plainToInstance } from 'class-transformer';
import { validate } from 'class-validator';
import { RegisterDto } from './register.dto';

describe('RegisterDto', () => {
  it('trims valid usernames and accepts valid credentials', async () => {
    const dto = plainToInstance(RegisterDto, {
      username: ' Alice ',
      password: 'strong-pass-1',
    });

    expect(dto.username).toBe('Alice');
    await expect(validate(dto)).resolves.toHaveLength(0);
  });

  it('rejects short passwords and unsupported username characters', async () => {
    const dto = plainToInstance(RegisterDto, {
      username: 'alice@example.com',
      password: 'short',
    });

    await expect(validate(dto)).resolves.toHaveLength(2);
  });
});
