export interface EventPayload {
  [key: string]: string | number | boolean;
}

export interface DomainEvent {
  streamName: string;
  eventType: string;
  payload: EventPayload;
  timestamp?: Date;
}

export interface IEventBus {
  publish(event: DomainEvent): Promise<void>;
  subscribe(streamName: string, consumerGroup: string, consumerName: string, handler: (event: DomainEvent) => Promise<void>): Promise<void>;
  createConsumerGroup(streamName: string, groupName: string): Promise<void>;
}
