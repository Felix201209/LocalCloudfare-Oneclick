import { z } from "zod";

export const MutableAdminConfigSchema = z.object({
  appPort: z.number().int().min(1).max(65535),
  adminPort: z.number().int().min(1).max(65535),
  websocketPort: z.number().int().min(1).max(65535),
  allowedOrigins: z.array(z.string().min(1)).default([]),
  siteTitle: z.string().min(1).max(120),
  rateLimitPerMinute: z.number().int().min(1).max(6000),
});

export const LocalCloudflareConfigSchema = z.object({
  projectName: z.string().min(1),
  cloudflare: z.object({
    accountId: z.string().min(1),
    zoneId: z.string().min(1),
    zoneName: z.string().min(1),
    apiTokenEnv: z.string().min(1).default("CLOUDFLARE_API_TOKEN"),
  }),
  tunnel: z.object({
    name: z.string().min(1),
    tunnelId: z.string().min(1),
    credentialsFile: z.string().min(1),
    configFile: z.string().min(1),
  }),
  hostnames: z.object({
    app: z.string().min(1),
    admin: z.string().min(1),
  }),
  admin: MutableAdminConfigSchema,
  security: z.object({
    requireCloudflareAccessForAdmin: z.boolean().default(true),
    accessAud: z.string().optional(),
  }),
  updatedAt: z.string().datetime(),
});

export type MutableAdminConfig = z.infer<typeof MutableAdminConfigSchema>;
export type LocalCloudflareConfig = z.infer<typeof LocalCloudflareConfigSchema>;
