/**
 * Environment Variables Validator (EC-1.1)
 * Ensures all required environment variables are defined before starting the application.
 */
function validateEnv() {
  const requiredEnvVars = ['PORT', 'MONGO_URI', 'JWT_SECRET'];
  const missingVars = [];

  for (const varName of requiredEnvVars) {
    if (!process.env[varName]) {
      missingVars.push(varName);
    }
  }

  if (missingVars.length > 0) {
    console.error('====================================================');
    console.error('FATAL ERROR: Missing required environment variables:');
    missingVars.forEach((v) => console.error(` - ${v}`));
    console.error('Please verify your .env file before launching the server.');
    console.error('====================================================');
    process.exit(1);
  }
}

module.exports = validateEnv;
