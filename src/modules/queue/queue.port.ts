export const QUEUE_SERVICE = 'QUEUE_SERVICE';

export interface QueueMessage {
  id: string;
  stream: string;
  data: Record<string, unknown>;
  timestamp: Date;
}

export interface IQueueService {
  publish(
    stream: string,
    data: Record<string, unknown>,
  ): Promise<string | null>;
  consume(
    stream: string,
    group: string,
    consumer: string,
    batchSize: number,
  ): Promise<QueueMessage[]>;
  ack(stream: string, group: string, messageId: string): Promise<void>;
  ensureGroup(stream: string, group: string): Promise<void>;
}
