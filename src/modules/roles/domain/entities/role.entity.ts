export interface RoleProps {
  id: string;
  name: string;
  description?: string;
  isSystem: boolean;
  createdAt: Date;
  updatedAt: Date;
  permissions?: string[];
}

export class Role {
  private readonly props: RoleProps;

  constructor(props: RoleProps) {
    this.props = { ...props };
  }

  get id(): string { return this.props.id; }
  get name(): string { return this.props.name; }
  get description(): string | undefined { return this.props.description; }
  get isSystem(): boolean { return this.props.isSystem; }
  get createdAt(): Date { return this.props.createdAt; }
  get updatedAt(): Date { return this.props.updatedAt; }
  get permissions(): string[] { return this.props.permissions || []; }

  update(data: Partial<Pick<RoleProps, 'description'>>) {
    if (data.description !== undefined) {
      this.props.description = data.description;
    }
  }
}