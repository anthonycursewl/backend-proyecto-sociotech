import { Injectable, Logger } from '@nestjs/common';
import type { IQueueService, QueueMessage } from './queue.port';

@Injectable()
export class InMemoryQueueService implements IQueueService {
  private readonly logger = new Logger(InMemoryQueueService.name);
  private readonly streams = new Map<string, QueueMessage[]>();

  publish(stream: string, data: Record<string, unknown>): Promise<string> {
    if (!this.streams.has(stream)) {
      this.streams.set(stream, []);
    }

    const id = `${Date.now()}-${Math.random().toString(36).substring(2, 8)}`;
    const message: QueueMessage = {
      id,
      stream,
      data,
      timestamp: new Date(),
    };

    this.streams.get(stream)!.push(message);
    return Promise.resolve(id);
  }

  consume(
    stream: string,
    _group: string,
    _consumer: string,
    batchSize: number,
  ): Promise<QueueMessage[]> {
    const queue = this.streams.get(stream);
    if (!queue || queue.length === 0) return Promise.resolve([]);

    const batch = queue.splice(0, batchSize);
    return Promise.resolve(batch);
  }

  ack(_stream: string, _group: string, _messageId: string): Promise<void> {
    return Promise.resolve();
  }

  ensureGroup(_stream: string, _group: string): Promise<void> {
    return Promise.resolve();
  }
}
