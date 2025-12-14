export interface TokenDto {
  sub: string;
  iat: number;
  exp: number;
  isGlobalLogOut?: string;
  mfaPending?: boolean;
}

export interface ResponseGenerateQrCode {
  otp: string;
  qrCodeImage: string;
}
