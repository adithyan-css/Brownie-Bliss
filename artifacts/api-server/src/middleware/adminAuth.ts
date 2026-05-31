import { Request, Response, NextFunction } from "express";
import jwt from "jsonwebtoken";

export function adminAuth(req: Request, res: Response, next: NextFunction): void {
  const ADMIN_JWT_SECRET = process.env.ADMIN_JWT_SECRET;

  if (!ADMIN_JWT_SECRET) {
    res.status(500).json({ success: false, message: "Admin auth not configured" });
    return;
  }

  const authHeader = req.headers.authorization || "";
  const parts = authHeader.split(" ");
  const scheme = parts[0];
  const token = parts[1];

  if (scheme !== "Bearer" || !token) {
    res.status(401).json({ success: false, message: "Missing or invalid authorization token" });
    return;
  }

  try {
    const payload = jwt.verify(token, ADMIN_JWT_SECRET);
    (req as any).admin = payload;
    next();
  } catch {
    res.status(401).json({ success: false, message: "Invalid or expired token" });
  }
}
