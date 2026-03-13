import { Request, Response, NextFunction } from "express";

export type AccessOptions = {
  enabled: boolean;
  expectedAud?: string;
};

// TODO: 在下一版本加入完整 JWT 签名校验（基于 Cloudflare Access JWK）
// 当前骨架：要求存在 Access 头，并可选比对 aud。
export function cloudflareAccessMiddleware(options: AccessOptions) {
  return (req: Request, res: Response, next: NextFunction) => {
    if (!options.enabled) {
      return next();
    }

    const token = req.header("Cf-Access-Jwt-Assertion");
    if (!token) {
      return res.status(401).json({ error: "缺少 Cloudflare Access JWT" });
    }

    if (options.expectedAud && !token.includes(options.expectedAud)) {
      return res.status(403).json({ error: "Access JWT aud 不匹配（骨架校验）" });
    }

    return next();
  };
}
