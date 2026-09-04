import { loadEnvConfig } from "@next/env";

// Standalone commands use development defaults unless NODE_ENV selects production or test.
export function loadLocalEnv(directory = process.cwd()) {
  loadEnvConfig(directory, process.env.NODE_ENV !== "production");
}
