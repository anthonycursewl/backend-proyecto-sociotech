export interface ServiceProps {
  id: string;
  name: string;
  description?: string;
  durationMin: number;
  price?: number;
  isActive: boolean;
  createdBy: string;
  createdAt: Date;
  updatedAt: Date;
}

export class Service {
  private readonly props: ServiceProps;

  constructor(props: ServiceProps) {
    this.props = props;
  }

  get id(): string {
    return this.props.id;
  }

  get name(): string {
    return this.props.name;
  }

  get description(): string | undefined {
    return this.props.description;
  }

  get durationMin(): number {
    return this.props.durationMin;
  }

  get price(): number | undefined {
    return this.props.price;
  }

  get isActive(): boolean {
    return this.props.isActive;
  }

  get createdBy(): string {
    return this.props.createdBy;
  }

  get createdAt(): Date {
    return this.props.createdAt;
  }

  get updatedAt(): Date {
    return this.props.updatedAt;
  }

  update(data: Partial<ServiceProps>): void {
    if (data.name !== undefined) this.props.name = data.name;
    if (data.description !== undefined) this.props.description = data.description;
    if (data.durationMin !== undefined) this.props.durationMin = data.durationMin;
    if (data.price !== undefined) this.props.price = data.price;
    if (data.isActive !== undefined) this.props.isActive = data.isActive;
    this.props.updatedAt = new Date();
  }

  toPlain(): ServiceProps {
    return { ...this.props };
  }
}
