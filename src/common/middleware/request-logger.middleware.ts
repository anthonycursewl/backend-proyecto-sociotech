import { Injectable, NestMiddleware, Logger } from '@nestjs/common';

const logger = new Logger('RequestLogger');

@Injectable()
export class RequestLoggerMiddleware implements NestMiddleware {
  use(req: any, res: any, next: Function) {
    const { method, originalUrl, body, params, query, headers } = req;
    const timestamp = new Date().toISOString();

    if (body === undefined || body === null) {
      logger.warn(
        `Body is ${body === null ? 'null' : 'undefined'} for ${method} ${originalUrl} — ` +
          `client may have sent no body, empty body, or invalid Content-Type. ` +
          `Content-Type: ${headers['content-type'] || 'none'}`,
      );
    }

    logger.log(`
===========================================
📥 REQUEST ${method} ${originalUrl}
⏰ Time: ${timestamp}
📦 Body: ${body === undefined ? 'undefined (⚠️ no body parsed)' : JSON.stringify(body, null, 2)}
🔍 Params: ${JSON.stringify(params, null, 2)}
❓ Query: ${JSON.stringify(query, null, 2)}
📋 Headers: ${JSON.stringify(
      {
        'user-agent': headers['user-agent'],
        'content-type': headers['content-type'],
        authorization: headers['authorization'] ? '***' : 'none',
        'content-length': headers['content-length'],
      },
      null,
      2,
    )}
===========================================
    `);

    next();
  }
}
