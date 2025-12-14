import { from } from "env-var";
import { config } from "dotenv";

config();

export class ConfigService {
  private readonly env = from(process.env);

  public readonly NODE_ENV = this.env.get("NODE_ENV").default('development').asString();
  public readonly PORT = this.env.get("PORT").default(3000).asPortNumber();

  public readonly JWT_SECRET = this.env.get("JWT_SECRET").required().asString();
  public readonly JWT_REFRESH_SECRET = this.env
    .get("JWT_REFRESH_SECRET")
    .required()
    .asString();
  public readonly JWT_EXPIRED = this.env
    .get("JWT_EXPIRED")
    .default('1h')
    .asString();
  public readonly HASH_SECRET = this.env
    .get("HASH_SECRET")
    .required()
    .asString();

  public readonly DB_HOST = this.env.get('DB_HOST').default('localhost').asString();
  public readonly DB_PORT = this.env.get('DB_PORT').default('3306').asPortNumber();
  public readonly DB_USERNAME = this.env.get('DB_USERNAME').default('root').asString();
  public readonly DB_PASSWORD = this.env.get('DB_PASSWORD').default('').asString();
  public readonly DB_DATABASE = this.env.get('DB_DATABASE').default('trello_lite').asString();
  public readonly DB_SYNC = this.env.get('DB_SYNC').default('false').asBool();
  public readonly DB_LOGGING = this.env.get('DB_LOGGING').default('false').asBool();

  public readonly DB_HOST_SECONDARY = this.env.get('DB_HOST_SECONDARY').default('localhost').asString();
  public readonly DB_PORT_SECONDARY = this.env.get('DB_PORT_SECONDARY').default('3307').asPortNumber();
  public readonly DB_USERNAME_SECONDARY = this.env.get('DB_USERNAME_SECONDARY').default('root').asString();
  public readonly DB_PASSWORD_SECONDARY = this.env.get('DB_PASSWORD_SECONDARY').default('').asString();
  public readonly DB_DATABASE_SECONDARY = this.env.get('DB_DATABASE_SECONDARY').default('trello_lite_secondary').asString();
  public readonly DB_SYNC_SECONDARY = this.env.get('DB_SYNC_SECONDARY').default('false').asBool();

  get(key: string, defaultValue?: string): string {
    return this.env.get(key).default(defaultValue || '').asString();
  }

  getNumber(key: string, defaultValue?: number): number {
    return this.env.get(key).default(defaultValue || 0).asPortNumber();
  }

  getBoolean(key: string, defaultValue = false): boolean {
    return this.env.get(key).default(String(defaultValue)).asBool();
  }
}
