export interface UserProps {
  id: string;
  email: string;
  passwordHash: string;
  roleId: string;
  firstName: string;
  lastName: string;
  isActive: boolean;
  refreshToken?: string | null;
  refreshTokenExpires?: Date | null;
  createdAt: Date;
  updatedAt: Date;
  permissions?: string[];
  roleName?: string;
}

export class User {
  private readonly props: UserProps;

  constructor(props: UserProps) {
    this.props = { ...props };
  }

  get id(): string { return this.props.id; }
  get email(): string { return this.props.email; }
  get passwordHash(): string { return this.props.passwordHash; }
  get roleId(): string { return this.props.roleId; }
  get firstName(): string { return this.props.firstName; }
  get lastName(): string { return this.props.lastName; }
  get isActive(): boolean { return this.props.isActive; }
  get refreshToken(): string | null | undefined { return this.props.refreshToken; }
  get refreshTokenExpires(): Date | null | undefined { return this.props.refreshTokenExpires; }
  get createdAt(): Date { return this.props.createdAt; }
  get updatedAt(): Date { return this.props.updatedAt; }
  get permissions(): string[] { return this.props.permissions || []; }
  get roleName(): string { return this.props.roleName || ''; }

  update(data: Partial<UserProps>) {
    Object.assign(this.props, data);
  }
}