import { from } from "env-var";
import { config } from "dotenv";

config();

export class ConfigService {
  private readonly env = from(process.env);

  public readonly NODE_ENV = this.env.get("NODE_ENV").required().asString();
  public readonly PORT = this.env.get("PORT").required().asPortNumber();
  // JWT
  public readonly JWT_SECRET = this.env.get("JWT_SECRET").required().asString();
  public readonly JWT_REFRESH_SECRET = this.env
    .get("JWT_REFRESH_SECRET")
    .required()
    .asString();
  public readonly JWT_EXPIRED = this.env
    .get("JWT_EXPIRED")
    .required()
    .asString();
  public readonly HASH_SECRET = this.env
    .get("HASH_SECRET")
    .required()
    .asString();

  public readonly WEBSITE_URL = this.env
    .get("WEBSITE_URL")
    .required()
    .asString();

  public readonly EMAIL_HOST = this.env.get("EMAIL_HOST").required().asString();

  public readonly EMAIL_PORT = this.env.get("EMAIL_PORT").required().asString();
  public readonly EMAIL_SECURE = this.env
    .get("EMAIL_SECURE")
    .required()
    .asString();

  public readonly EMAIL_USER = this.env.get("EMAIL_USER").required().asString();
  public readonly EMAIL_PASS = this.env.get("EMAIL_PASS").required().asString();

  public readonly EMAIL_FROM = this.env.get("EMAIL_FROM").required().asString();

  public readonly XENDIT_KEY = this.env.get("XENDIT_KEY").required().asString();

  public readonly API_TYPE = this.NODE_ENV === "production" ? "live" : "test";

  public readonly GROK_API_KEY = this.env
    .get("GROK_API_KEY")
    .required()
    .asString();
  public readonly GROK_API_URL = this.env
    .get("GROK_API_URL")
    .required()
    .asString();

  public get(key: string): string | undefined {
    return this.env.get(key).asString();
  }
}
