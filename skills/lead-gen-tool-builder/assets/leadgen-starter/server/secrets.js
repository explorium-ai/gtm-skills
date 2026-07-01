import 'dotenv/config'

// Loads API credentials from environment variables (a local .env file).
// Copy .env.example to .env and fill in your own keys — nothing is hardcoded.
export async function getSecrets() {
  return process.env
}

export async function getKey(name) {
  const v = process.env[name]
  if (!v) {
    throw new Error(`Missing required env var: ${name}. Copy .env.example to .env and fill it in.`)
  }
  return v
}
