/**
 * Environment Variables Validator
 * Ensures required environment variables are defined.
 */
function validateEnv() {
  const requiredEnvVars = ['MONGO_URI', 'JWT_SECRET'];
  const missingVars = [];

  for (const varName of requiredEnvVars) {
    if (!process.env[varName]) {
      missingVars.push(varName);
    }
  }

  if (missingVars.length > 0) {
    throw new Error(
      `Missing required environment variables: ${missingVars.join(', ')}`
    );
  }
}

module.exports = validateEnv;