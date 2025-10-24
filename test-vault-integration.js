// Test Vault Integration
// Run with: node test-vault-integration.js

import vaultService from './backend_orchestrator/services/vaultService.js';
import dotenv from 'dotenv';

dotenv.config({ path: './backend_orchestrator/.env' });

const colors = {
  green: '\x1b[32m',
  red: '\x1b[31m',
  yellow: '\x1b[33m',
  blue: '\x1b[36m',
  reset: '\x1b[0m'
};

async function testVaultIntegration() {
  console.log('\n' + '='.repeat(60));
  console.log('🧪 Testing Vault Integration');
  console.log('='.repeat(60) + '\n');

  try {
    // Check environment variables
    console.log(`${colors.blue}📝 Checking configuration...${colors.reset}`);
    console.log(`   VAULT_ADDR: ${process.env.VAULT_ADDR || 'Not set'}`);
    console.log(`   VAULT_ROLE_ID: ${process.env.VAULT_ROLE_ID ? '***' + process.env.VAULT_ROLE_ID.slice(-4) : 'Not set'}`);
    console.log(`   VAULT_SECRET_ID: ${process.env.VAULT_SECRET_ID ? '***' + process.env.VAULT_SECRET_ID.slice(-4) : 'Not set'}`);
    console.log('');

    // Initialize Vault
    console.log(`${colors.blue}🔐 Initializing Vault client...${colors.reset}`);
    await vaultService.initialize();
    console.log(`${colors.green}✅ Vault initialized${colors.reset}\n`);

    // Test retrieving secrets
    console.log(`${colors.blue}📥 Retrieving secrets from Vault...${colors.reset}\n`);

    // JWT Secret
    try {
      const jwtConfig = await vaultService.getJWTConfig();
      console.log(`${colors.green}✅ JWT Config:${colors.reset}`);
      console.log(`   Secret: ${jwtConfig.secret.substring(0, 20)}...`);
      console.log(`   Expires In: ${jwtConfig.expiresIn}`);
    } catch (error) {
      console.log(`${colors.red}❌ Failed to get JWT config: ${error.message}${colors.reset}`);
    }

    console.log('');

    // MongoDB Config
    try {
      const mongoConfig = await vaultService.getMongoConfig();
      console.log(`${colors.green}✅ MongoDB Config:${colors.reset}`);
      console.log(`   URI: ${mongoConfig.uri}`);
      if (mongoConfig.username) console.log(`   Username: ${mongoConfig.username}`);
    } catch (error) {
      console.log(`${colors.red}❌ Failed to get MongoDB config: ${error.message}${colors.reset}`);
    }

    console.log('');

    // Docker Config
    try {
      const dockerConfig = await vaultService.getDockerConfig();
      console.log(`${colors.green}✅ Docker Config:${colors.reset}`);
      console.log(`   Registry: ${dockerConfig.registry}`);
      if (dockerConfig.username) console.log(`   Username: ${dockerConfig.username}`);
    } catch (error) {
      console.log(`${colors.red}❌ Failed to get Docker config: ${error.message}${colors.reset}`);
    }

    console.log('');

    // App Config
    try {
      const appConfig = await vaultService.getAppConfig();
      console.log(`${colors.green}✅ App Config:${colors.reset}`);
      console.log(`   CORS Origin: ${appConfig.corsOrigin}`);
      console.log(`   Node Env: ${appConfig.nodeEnv}`);
      console.log(`   Port: ${appConfig.port}`);
    } catch (error) {
      console.log(`${colors.red}❌ Failed to get App config: ${error.message}${colors.reset}`);
    }

    console.log('');

    // List all secrets
    try {
      const secretsList = await vaultService.listSecrets();
      console.log(`${colors.green}✅ Available Secrets:${colors.reset}`);
      secretsList.forEach(secret => console.log(`   - ${secret}`));
    } catch (error) {
      console.log(`${colors.yellow}⚠️  Could not list secrets: ${error.message}${colors.reset}`);
    }

    console.log('');
    console.log('='.repeat(60));
    console.log(`${colors.green}🎉 Vault integration test completed successfully!${colors.reset}`);
    console.log('='.repeat(60) + '\n');

    process.exit(0);
  } catch (error) {
    console.log('');
    console.log('='.repeat(60));
    console.log(`${colors.red}❌ Vault integration test failed!${colors.reset}`);
    console.log(`   Error: ${error.message}`);
    console.log('='.repeat(60) + '\n');
    
    console.log(`${colors.yellow}💡 Troubleshooting:${colors.reset}`);
    console.log('   1. Check if Vault is running: kubectl get pods -n vault');
    console.log('   2. Check if Vault is unsealed: kubectl exec -n vault <pod> -- vault status');
    console.log('   3. Verify VAULT_ROLE_ID and VAULT_SECRET_ID are set');
    console.log('   4. Check Vault logs: kubectl logs -n vault <pod>');
    console.log('');
    
    process.exit(1);
  }
}

testVaultIntegration();

