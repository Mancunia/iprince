import { z } from "zod";

const publicSchema = z.object({
  NEXT_PUBLIC_SUPABASE_URL: z.url(),
  NEXT_PUBLIC_SUPABASE_ANON_KEY: z.string().min(1),
});
const serverSchema = publicSchema.extend({ SUPABASE_SERVICE_ROLE_KEY: z.string().min(1) });
const cronSchema = z.object({ CRON_SECRET: z.string().min(32) });

export type PublicEnv = z.infer<typeof publicSchema>;
export type ServerEnv = z.infer<typeof serverSchema>;

function parse<T>(schema: z.ZodType<T>, input: unknown): T {
  const result = schema.safeParse(input);
  if (!result.success) {
    const names = [...new Set(result.error.issues.map((i) => i.path.join(".")))].join(", ");
    throw new Error(`Invalid environment variables: ${names}. See .env.example.`);
  }
  return result.data;
}

// NEXT_PUBLIC_* must be referenced literally so Next inlines them into client bundles.
export function readPublicEnv(): PublicEnv {
  return parse(publicSchema, {
    NEXT_PUBLIC_SUPABASE_URL: process.env.NEXT_PUBLIC_SUPABASE_URL,
    NEXT_PUBLIC_SUPABASE_ANON_KEY: process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
  });
}

export function readServerEnv(): ServerEnv {
  return parse(serverSchema, {
    NEXT_PUBLIC_SUPABASE_URL: process.env.NEXT_PUBLIC_SUPABASE_URL,
    NEXT_PUBLIC_SUPABASE_ANON_KEY: process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
    SUPABASE_SERVICE_ROLE_KEY: process.env.SUPABASE_SERVICE_ROLE_KEY,
  });
}

// Third-party embed IDs end up in public script URLs, so only plain alphanumeric IDs are accepted.
const embedId = z.string().regex(/^[A-Za-z0-9]{1,64}$/);
const integrationsSchema = z.object({
  COOKIESCRIPT_ID: embedId.optional(),
  TAWK_PROPERTY_ID: embedId.optional(),
  TAWK_WIDGET_ID: embedId.optional(),
  GA_MEASUREMENT_ID: z.string().regex(/^G-[A-Z0-9]{4,20}$/).optional(),
  GOOGLE_SITE_VERIFICATION: z.string().regex(/^[A-Za-z0-9_-]{10,100}$/).optional(),
});

export type Integrations = {
  cookieScriptId: string | null;
  tawk: { propertyId: string; widgetId: string } | null;
  gaId: string | null;
  googleVerification: string | null;
};

/** Optional embeds for the public site. Read at request time on the server, so changing them needs no rebuild. */
export function readIntegrationsEnv(): Integrations {
  const env = parse(integrationsSchema, {
    COOKIESCRIPT_ID: process.env.COOKIESCRIPT_ID || undefined,
    TAWK_PROPERTY_ID: process.env.TAWK_PROPERTY_ID || undefined,
    TAWK_WIDGET_ID: process.env.TAWK_WIDGET_ID || undefined,
    GA_MEASUREMENT_ID: process.env.GA_MEASUREMENT_ID || undefined,
    GOOGLE_SITE_VERIFICATION: process.env.GOOGLE_SITE_VERIFICATION || undefined,
  });
  return {
    cookieScriptId: env.COOKIESCRIPT_ID ?? null,
    tawk: env.TAWK_PROPERTY_ID && env.TAWK_WIDGET_ID ? { propertyId: env.TAWK_PROPERTY_ID, widgetId: env.TAWK_WIDGET_ID } : null,
    gaId: env.GA_MEASUREMENT_ID ?? null,
    googleVerification: env.GOOGLE_SITE_VERIFICATION ?? null,
  };
}

/** Only the cleanup cron route needs this, so local dev without it keeps working. */
export function readCronEnv(): z.infer<typeof cronSchema> {
  return parse(cronSchema, { CRON_SECRET: process.env.CRON_SECRET });
}

const notifySchema = z.object({
  RESEND_API_KEY: z.string().min(1),
  NOTIFY_EMAIL_TO: z.email(),
  NOTIFY_EMAIL_FROM: z.string().min(3).max(200),
});

export type NotifyEnv = z.infer<typeof notifySchema>;

/** Staff notification email via Resend. Off (null) unless all three variables are set. */
export function readNotifyEnv(): NotifyEnv | null {
  const raw = {
    RESEND_API_KEY: process.env.RESEND_API_KEY || undefined,
    NOTIFY_EMAIL_TO: process.env.NOTIFY_EMAIL_TO || undefined,
    NOTIFY_EMAIL_FROM: process.env.NOTIFY_EMAIL_FROM || undefined,
  };
  if (Object.values(raw).some((value) => value === undefined)) return null;
  return parse(notifySchema, raw);
}
