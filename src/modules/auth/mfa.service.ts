import { Injectable } from "@nestjs/common";
import * as speakeasy from "speakeasy";
import * as QRCode from "qrcode";

@Injectable()
export class MfaService {
  generateSecret(userEmail: string): { secret: string; otpauthUrl: string } {
    const secret: speakeasy.GeneratedSecret = speakeasy.generateSecret({
      name: `EduMentor:${userEmail}`,
      issuer: "EduMentor",
    });

    return {
      secret: secret.base32,
      otpauthUrl: secret.otpauth_url ?? "",
    };
  }

  async generateQRCode(otpauthUrl: string): Promise<string> {
    try {
      const dataUrl: string = await QRCode.toDataURL(otpauthUrl);
      return dataUrl;
    } catch (err: unknown) {
      const message =
        err instanceof Error ? err.message : "Unknown QR generation error";
      throw new Error(`Failed to generate QR code: ${message}`);
    }
  }

  verifyToken(secret: string, token: string): boolean {
    const isValid: boolean = speakeasy.totp.verify({
      secret,
      encoding: "base32",
      token,
      window: 1,
    });

    return isValid;
  }
}
