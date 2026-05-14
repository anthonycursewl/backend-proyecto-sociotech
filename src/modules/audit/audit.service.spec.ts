import { AuditService } from './audit.service';
import type { IQueueService } from '../queue/queue.port';

describe('AuditService', () => {
  let service: AuditService;
  let queue: jest.Mocked<IQueueService>;

  const validEvent = {
    actor: { userId: 'u1', email: 'a@b.com', roleName: 'ADMIN' },
    action: 'test:action',
    resource: { type: 'Test', id: 'r1' },
    context: { ip: '::1', userAgent: 'jest', method: 'PUT', path: '/test/r1' },
    changes: null,
    result: 'success' as const,
    errorMessage: null,
  };

  beforeEach(() => {
    queue = {
      publish: jest.fn().mockResolvedValue('msg-id'),
    } as unknown as jest.Mocked<IQueueService>;
    service = new AuditService(queue);
  });

  it('publishes event to audit:stream', async () => {
    await service.record(validEvent);
    expect(queue.publish).toHaveBeenCalledWith(
      'audit:stream',
      expect.objectContaining({
        action: 'test:action',
        result: 'success',
      }),
    );
  });

  it('adds eventId and timestamp', async () => {
    await service.record(validEvent);
    const data = queue.publish.mock.calls[0][1];
    expect(data.eventId).toBeDefined();
    expect(typeof data.eventId).toBe('string');
    expect(data.timestamp).toBeDefined();
    expect(typeof data.timestamp).toBe('string');
  });

  it('does not throw when queue publish fails', async () => {
    queue.publish.mockRejectedValue(new Error('queue down'));
    await expect(service.record(validEvent)).resolves.toBeUndefined();
  });
});
