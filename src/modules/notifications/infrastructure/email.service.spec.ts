import { Test, TestingModule } from '@nestjs/testing';
import { EmailService } from './email.service';
import { RATE_LIMIT_MAX_PER_MINUTE } from '../domain/notification.types';

jest.mock('resend', () => ({
  Resend: jest.fn().mockImplementation(() => ({
    emails: {
      send: jest.fn().mockResolvedValue({ error: null }),
    },
  })),
}));

describe('EmailService', () => {
  let service: EmailService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [EmailService],
    }).compile();

    service = module.get<EmailService>(EmailService);
  });

  afterEach(() => {
    delete process.env.RESEND_API_KEY;
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('when RESEND_API_KEY is not set', () => {
    beforeEach(() => {
      delete process.env.RESEND_API_KEY;
    });

    it('should return success true (mock mode)', async () => {
      const result = await service.send('test@test.com', 'Test', '<p>test</p>');
      expect(result).toEqual({ success: true });
    });
  });

  describe('when RESEND_API_KEY is set', () => {
    beforeEach(() => {
      process.env.RESEND_API_KEY = 're_test';
    });

    it('should return success for emails under rate limit', async () => {
      const result = await service.send('test@test.com', 'Test', '<p>test</p>');
      expect(result.success).toBe(true);
    });

    it('should return rate limit error when exceeding limit', async () => {
      const promises: Promise<{ success: boolean; error?: string }>[] = [];
      for (let i = 0; i < RATE_LIMIT_MAX_PER_MINUTE + 5; i++) {
        promises.push(service.send('test@test.com', 'Test', '<p>test</p>'));
      }
      const results = await Promise.all(promises);
      const rateLimited = results.filter((r) => !r.success);
      expect(rateLimited.length).toBeGreaterThan(0);
      expect(rateLimited[0].error).toBe('Rate limit exceeded');
    });
  });

  describe('rate limit edge', () => {
    beforeEach(() => {
      process.env.RESEND_API_KEY = 're_test';
    });

    it(`should allow exactly ${RATE_LIMIT_MAX_PER_MINUTE} emails`, async () => {
      const results = await Promise.all(
        Array.from({ length: RATE_LIMIT_MAX_PER_MINUTE }, (_, i) =>
          service.send(`test${i}@test.com`, 'Test', '<p>test</p>'),
        ),
      );

      const succeeded = results.filter((r) => r.success);
      expect(succeeded.length).toBe(RATE_LIMIT_MAX_PER_MINUTE);
    });
  });
});
