import { Injectable, NestMiddleware, Logger } from '@nestjs/common';

const logger = new Logger('RequestLogger');

@Injectable()
export class RequestLoggerMiddleware implements NestMiddleware {
  use(req: any, res: any, next: Function) {
    const { method, originalUrl, body, params, query, headers } = req;
    const timestamp = new Date().toISOString();

    logger.log(`
===========================================
📥 REQUEST ${method} ${originalUrl}
⏰ Time: ${timestamp}
📦 Body: ${JSON.stringify(body, null, 2)}
🔍 Params: ${JSON.stringify(params, null, 2)}
❓ Query: ${JSON.stringify(query, null, 2)}
📋 Headers: ${JSON.stringify({
      'user-agent': headers['user-agent'],
      'content-type': headers['content-type'],
      'authorization': headers['authorization'] ? '***' : 'none',
    }, null, 2)}
===========================================
    `);

    next();
  }
}
