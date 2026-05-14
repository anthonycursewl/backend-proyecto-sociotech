export interface PermissionProps {
  id: string;
  name: string;
  description?: string;
  resource: string;
  action: string;
  createdAt: Date;
}

export class Permission {
  private readonly props: PermissionProps;

  constructor(props: PermissionProps) {
    this.props = { ...props };
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
  get resource(): string {
    return this.props.resource;
  }
  get action(): string {
    return this.props.action;
  }
  get createdAt(): Date {
    return this.props.createdAt;
  }
}
