export declare global {
  namespace Express {
    export interface Request {
      userId: string | null;
      deviceId: string | null;
    }
  }
}
