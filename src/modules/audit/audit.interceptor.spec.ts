import { Reflector } from '@nestjs/core';
import { CallHandler, ExecutionContext } from '@nestjs/common';
import { of, throwError } from 'rxjs';
import { AuditInterceptor } from './audit.interceptor';
import type { AuditService } from './audit.service';

describe('AuditInterceptor', () => {
  let interceptor: AuditInterceptor;
  let reflector: jest.Mocked<Reflector>;
  let auditService: jest.Mocked<AuditService>;

  const mockUser = { userId: 'u1', email: 'test@test.com', roleName: 'ADMIN' };

  function createMockContext(
    overrides: {
      user?: typeof mockUser | null;
      body?: Record<string, unknown>;
      params?: Record<string, string>;
      method?: string;
      path?: string;
      ip?: string;
      headers?: Record<string, string>;
    } = {},
  ): ExecutionContext {
    const {
      user = mockUser,
      body = {},
      params = { id: 'r1' },
      method = 'PUT',
      path = '/test/r1',
      ip = '127.0.0.1',
      headers = { 'user-agent': 'jest' },
    } = overrides;

    const request = {
      user: user ?? undefined,
      body,
      params,
      method,
      ip,
      route: { path },
      url: path,
      headers,
    } as unknown as Record<string, unknown>;

    return {
      switchToHttp: () => ({
        getRequest: () => request,
        getResponse: () => ({ statusCode: 200 }),
      }),
      getHandler: () => () => {},
      getClass: () => class {},
    } as unknown as ExecutionContext;
  }

  beforeEach(() => {
    reflector = {
      getAllAndOverride: jest.fn(),
    } as unknown as jest.Mocked<Reflector>;
    auditService = {
      record: jest.fn().mockResolvedValue(undefined),
    } as unknown as jest.Mocked<AuditService>;
    interceptor = new AuditInterceptor(reflector, auditService);
  });

  it('passes through when no audit metadata', (done) => {
    reflector.getAllAndOverride.mockReturnValue(null);

    const context = createMockContext();
    const next: CallHandler = { handle: () => of('response') };

    interceptor.intercept(context, next).subscribe({
      next: (val) => {
        expect(val).toBe('response');
        expect(auditService.record).not.toHaveBeenCalled();
        done();
      },
    });
  });

  it('passes through when no user in request', (done) => {
    reflector.getAllAndOverride.mockReturnValue({
      action: 'test:action',
      resourceType: 'Test',
      includeChanges: false,
    });

    const context = createMockContext({ user: null });
    const next: CallHandler = { handle: () => of('response') };

    interceptor.intercept(context, next).subscribe({
      next: (val) => {
        expect(val).toBe('response');
        expect(auditService.record).not.toHaveBeenCalled();
        done();
      },
    });
  });

  it('records audit on success', (done) => {
    reflector.getAllAndOverride.mockReturnValue({
      action: 'test:action',
      resourceType: 'Test',
      includeChanges: false,
    });

    const context = createMockContext();
    const next: CallHandler = { handle: () => of('response') };

    interceptor.intercept(context, next).subscribe({
      next: () => {
        expect(auditService.record).toHaveBeenCalledWith(
          expect.objectContaining({
            action: 'test:action',
            resource: { type: 'Test', id: 'r1' },
            actor: { userId: 'u1', email: 'test@test.com', roleName: 'ADMIN' },
            result: 'success',
            errorMessage: null,
            changes: null,
          }),
        );
        done();
      },
    });
  });

  it('records audit on failure', (done) => {
    reflector.getAllAndOverride.mockReturnValue({
      action: 'test:action',
      resourceType: 'Test',
      includeChanges: false,
    });

    const context = createMockContext();
    const next: CallHandler = {
      handle: () => throwError(() => new Error('fail')),
    };

    interceptor.intercept(context, next).subscribe({
      error: () => {
        expect(auditService.record).toHaveBeenCalledWith(
          expect.objectContaining({
            result: 'failure',
            errorMessage: 'fail',
            changes: null,
          }),
        );
        done();
      },
    });
  });

  it('includes request body when includeChanges is true', (done) => {
    reflector.getAllAndOverride.mockReturnValue({
      action: 'test:update',
      resourceType: 'Test',
      includeChanges: true,
    });

    const context = createMockContext({
      body: { name: 'new name', price: 100 },
    });
    const next: CallHandler = { handle: () => of('response') };

    interceptor.intercept(context, next).subscribe({
      next: () => {
        expect(auditService.record).toHaveBeenCalledWith(
          expect.objectContaining({
            changes: {
              old: null,
              new: { name: 'new name', price: 100 },
            },
          }),
        );
        done();
      },
    });
  });

  it('sets changes.new to empty object when body has no payload', (done) => {
    reflector.getAllAndOverride.mockReturnValue({
      action: 'test:update',
      resourceType: 'Test',
      includeChanges: true,
    });

    const context = createMockContext();
    const next: CallHandler = { handle: () => of('response') };

    interceptor.intercept(context, next).subscribe({
      next: () => {
        expect(auditService.record).toHaveBeenCalledWith(
          expect.objectContaining({
            changes: { old: null, new: {} },
          }),
        );
        done();
      },
    });
  });

  it('uses params.id as resource id', (done) => {
    reflector.getAllAndOverride.mockReturnValue({
      action: 'test:action',
      resourceType: 'Test',
      includeChanges: false,
    });

    const context = createMockContext({ params: { id: 'abc-123' } });
    const next: CallHandler = { handle: () => of('response') };

    interceptor.intercept(context, next).subscribe({
      next: () => {
        expect(auditService.record).toHaveBeenCalledWith(
          expect.objectContaining({
            resource: { type: 'Test', id: 'abc-123' },
          }),
        );
        done();
      },
    });
  });

  it('captures auditSnapshot set by controller as changes.old', (done) => {
    reflector.getAllAndOverride.mockReturnValue({
      action: 'test:update',
      resourceType: 'Test',
      includeChanges: true,
    });

    const context = createMockContext({ body: { name: 'new name' } });
    const request = context.switchToHttp().getRequest() as any;

    const next: CallHandler = {
      handle: () => {
        request.auditSnapshot = { name: 'old name', price: 50 };
        return of('response');
      },
    };

    interceptor.intercept(context, next).subscribe({
      next: () => {
        expect(auditService.record).toHaveBeenCalledWith(
          expect.objectContaining({
            changes: {
              old: { name: 'old name', price: 50 },
              new: { name: 'new name' },
            },
          }),
        );
        done();
      },
    });
  });

  it('uses auditSnapshot null when includeChanges but snapshot not set', (done) => {
    reflector.getAllAndOverride.mockReturnValue({
      action: 'test:update',
      resourceType: 'Test',
      includeChanges: true,
    });

    const context = createMockContext({ body: { name: 'new name' } });
    const next: CallHandler = { handle: () => of('response') };

    interceptor.intercept(context, next).subscribe({
      next: () => {
        expect(auditService.record).toHaveBeenCalledWith(
          expect.objectContaining({
            changes: { old: null, new: { name: 'new name' } },
          }),
        );
        done();
      },
    });
  });

  it('handles missing resource id gracefully', (done) => {
    reflector.getAllAndOverride.mockReturnValue({
      action: 'test:action',
      resourceType: 'Test',
      includeChanges: false,
    });

    const context = createMockContext({ params: {} });
    const next: CallHandler = { handle: () => of('response') };

    interceptor.intercept(context, next).subscribe({
      next: () => {
        expect(auditService.record).toHaveBeenCalledWith(
          expect.objectContaining({
            resource: { type: 'Test', id: null },
          }),
        );
        done();
      },
    });
  });
});
