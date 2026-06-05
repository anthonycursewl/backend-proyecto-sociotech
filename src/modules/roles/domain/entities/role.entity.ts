export interface RoleProps {
  id: string;
  name: string;
  description?: string;
  isSystem: boolean;
  deletedAt?: Date | null;
  createdAt: Date;
  updatedAt: Date;
  permissions?: string[];
}

export class Role {
  private readonly props: RoleProps;

  constructor(props: RoleProps) {
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
  get isSystem(): boolean {
    return this.props.isSystem;
  }
  get deletedAt(): Date | null | undefined {
    return this.props.deletedAt;
  }
  get createdAt(): Date {
    return this.props.createdAt;
  }
  get updatedAt(): Date {
    return this.props.updatedAt;
  }
  get permissions(): string[] {
    return this.props.permissions || [];
  }

  toJSON() {
    return {
      id: this.id,
      name: this.name,
      description: this.description,
      isSystem: this.isSystem,
      permissions: this.permissions,
      createdAt: this.createdAt,
      updatedAt: this.updatedAt,
    };
  }

  update(data: Partial<Pick<RoleProps, 'name' | 'description'>>) {
    if (data.name !== undefined) {
      this.props.name = data.name;
    }
    if (data.description !== undefined) {
      this.props.description = data.description;
    }
  }
}
