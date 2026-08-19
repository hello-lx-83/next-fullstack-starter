type LogLevel = "debug" | "info" | "warn" | "error";
type LogFields = Readonly<Record<string, unknown>>;

const SENSITIVE_KEY = /authorization|cookie|password|secret|token|credential|session/i;
const REDACTED = "[REDACTED]";

function sanitize(value: unknown, key = "", seen = new WeakSet<object>()): unknown {
  if (SENSITIVE_KEY.test(key)) return REDACTED;
  if (value === null || value === undefined || typeof value === "string" || typeof value === "number") return value;
  if (typeof value === "boolean" || typeof value === "bigint") return String(value);
  if (value instanceof Date) return value.toISOString();
  if (value instanceof Error) {
    return {
      name: value.name,
      message: value.message,
      stack: process.env.NODE_ENV === "development" ? value.stack : undefined,
    };
  }
  if (typeof value !== "object") return String(value);
  if (seen.has(value)) return "[Circular]";
  seen.add(value);
  if (Array.isArray(value)) return value.map((item) => sanitize(item, key, seen));
  return Object.fromEntries(
    Object.entries(value).map(([entryKey, entryValue]) => [entryKey, sanitize(entryValue, entryKey, seen)]),
  );
}

function write(level: LogLevel, event: string, fields: LogFields = {}) {
  const entry = sanitize({ timestamp: new Date().toISOString(), level, event, ...fields });
  const line = `${JSON.stringify(entry)}\n`;
  if (level === "error" || level === "warn") process.stderr.write(line);
  else process.stdout.write(line);
}

export const logger = {
  debug: (event: string, fields?: LogFields) => write("debug", event, fields),
  info: (event: string, fields?: LogFields) => write("info", event, fields),
  warn: (event: string, fields?: LogFields) => write("warn", event, fields),
  error: (event: string, fields?: LogFields) => write("error", event, fields),
};

export function toErrorFields(error: unknown): LogFields {
  return error instanceof Error ? { error } : { error: String(error) };
}
