import {
  registerDecorator,
  ValidationOptions,
  ValidationArguments,
} from 'class-validator';

export function IsUuidString(validationOptions?: ValidationOptions) {
  return function (object: object, propertyName: string) {
    registerDecorator({
      name: 'isUuidString',
      target: object.constructor,
      propertyName,
      options: {
        message: `${propertyName} must be a valid UUID string (xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx)`,
        ...validationOptions,
      },
      validator: {
        validate(value: any) {
          if (typeof value !== 'string') return false;
          return /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(
            value,
          );
        },
      },
    });
  };
}
