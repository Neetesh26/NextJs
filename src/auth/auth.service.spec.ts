import { ConflictException, UnauthorizedException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { UsersService } from '../users/users.service';
import { AuthService } from './auth.service';
import { hashPassword } from './password.util';

jest.mock('@nestjs/jwt', () => ({
  JwtService: class JwtService {},
}));
jest.mock('../users/users.service', () => ({
  UsersService: class UsersService {},
}));

describe('AuthService', () => {
  let service: AuthService;
  let usersService: {
    findByUsername: jest.Mock;
    create: jest.Mock;
  };
  let jwtService: { signAsync: jest.Mock };

  beforeEach(() => {
    usersService = {
      findByUsername: jest.fn(),
      create: jest.fn(),
    };
    jwtService = { signAsync: jest.fn().mockResolvedValue('signed-token') };
    service = new AuthService(
      usersService as unknown as UsersService,
      jwtService as unknown as JwtService,
    );
  });

  it('creates users with normalized usernames and hashed passwords', async () => {
    usersService.create.mockImplementation(
      (username: string, passwordHash: string) =>
        Promise.resolve({
          _id: { toString: () => 'user-id' },
          username,
          passwordHash,
        }),
    );

    await expect(
      service.register({ username: ' Alice ', password: 'strong-pass-1' }),
    ).resolves.toEqual({ id: 'user-id', username: 'alice' });

    expect(usersService.create).toHaveBeenCalledWith(
      'alice',
      expect.stringMatching(/^scrypt\$/),
    );
  });

  it('rejects an already registered username', async () => {
    usersService.findByUsername.mockResolvedValue({ username: 'alice' });

    await expect(
      service.register({ username: 'alice', password: 'strong-pass-1' }),
    ).rejects.toBeInstanceOf(ConflictException);
    expect(usersService.create).not.toHaveBeenCalled();
  });

  it('returns a bearer token for a valid password', async () => {
    usersService.findByUsername.mockResolvedValue({
      _id: { toString: () => 'user-id' },
      username: 'alice',
      passwordHash: await hashPassword('strong-pass-1'),
    });

    await expect(
      service.login({ username: 'Alice', password: 'strong-pass-1' }),
    ).resolves.toEqual({
      access_token: 'signed-token',
      token_type: 'Bearer',
    });
    expect(usersService.findByUsername).toHaveBeenCalledWith('alice', true);
    expect(jwtService.signAsync).toHaveBeenCalledWith({
      username: 'alice',
      sub: 'user-id',
    });
  });

  it('rejects invalid credentials without revealing which field failed', async () => {
    usersService.findByUsername.mockResolvedValue(null);

    await expect(
      service.login({ username: 'alice', password: 'wrong-pass' }),
    ).rejects.toBeInstanceOf(UnauthorizedException);
    expect(jwtService.signAsync).not.toHaveBeenCalled();
  });
});
