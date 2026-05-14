import { Reflector } from '@nestjs/core';
import { AUDIT_KEY, Audit, type AuditOptions } from './audit.decorator';

describe('Audit decorator', () => {
  function applyDecorator(
    action: string,
    resourceType: string,
    includeChanges?: boolean,
  ) {
    class Target {
      @Audit(action, resourceType, includeChanges)
      method() {}
    }
    return Target;
  }

  it('sets metadata with action and resourceType', () => {
    const Target = applyDecorator('test:action', 'Test');
    const reflector = new Reflector();
    const meta = reflector.get<AuditOptions>(
      AUDIT_KEY,
      Target.prototype.method,
    );
    expect(meta).toEqual({
      action: 'test:action',
      resourceType: 'Test',
      includeChanges: false,
    });
  });

  it('sets includeChanges default to false', () => {
    const Target = applyDecorator('test:action', 'Test');
    const reflector = new Reflector();
    const meta = reflector.get<AuditOptions>(
      AUDIT_KEY,
      Target.prototype.method,
    );
    expect(meta.includeChanges).toBe(false);
  });

  it('sets includeChanges to true when provided', () => {
    const Target = applyDecorator('test:update', 'Test', true);
    const reflector = new Reflector();
    const meta = reflector.get<AuditOptions>(
      AUDIT_KEY,
      Target.prototype.method,
    );
    expect(meta).toEqual({
      action: 'test:update',
      resourceType: 'Test',
      includeChanges: true,
    });
  });
});
