import vault from 'node-vault';

class VaultService {
  constructor() {
    this.client = null;
    this.token = null;
    this.initialized = false;
  }

  async initialize() {
    try {
      // Initialize Vault client
      this.client = vault({
        apiVersion: 'v1',
        endpoint: process.env.VAULT_ADDR || 'http://vault.vault.svc.cluster.local:8200',
        requestOptions: {
          timeout: 5000
        }
      });

      // Authenticate with AppRole
      await this.authenticate();
      
      this.initialized = true;
      console.log('✅ Vault client initialized and authenticated');
    } catch (error) {
      console.error('❌ Vault initialization failed:', error.message);
      throw error;
    }
  }

  async authenticate() {
    try {
      const roleId = process.env.VAULT_ROLE_ID;
      const secretId = process.env.VAULT_SECRET_ID;

      if (!roleId || !secretId) {
        throw new Error('VAULT_ROLE_ID and VAULT_SECRET_ID must be set');
      }

      // Login with AppRole
      const result = await this.client.approleLogin({
        role_id: roleId,
        secret_id: secretId
      });

      this.token = result.auth.client_token;
      this.client.token = this.token;

      console.log('✅ Vault authenticated successfully');
      console.log(`   Token TTL: ${result.auth.lease_duration}s`);
      
      // Schedule token renewal
      this.scheduleTokenRenewal(result.auth.lease_duration);
    } catch (error) {
      console.error('❌ Vault authentication failed:', error.message);
      throw error;
    }
  }

  scheduleTokenRenewal(leaseDuration) {
    // Renew token before it expires (80% of lease duration)
    const renewalTime = (leaseDuration * 0.8) * 1000;
    
    setTimeout(async () => {
      try {
        await this.client.tokenRenewSelf();
        console.log('✅ Vault token renewed');
        this.scheduleTokenRenewal(leaseDuration);
      } catch (error) {
        console.error('❌ Token renewal failed:', error.message);
        // Re-authenticate if renewal fails
        await this.authenticate();
      }
    }, renewalTime);
  }

  async getSecret(path) {
    if (!this.initialized) {
      throw new Error('Vault not initialized. Call initialize() first');
    }

    try {
      const result = await this.client.read(`orchestrator/data/${path}`);
      return result.data.data;
    } catch (error) {
      console.error(`❌ Failed to read secret ${path}:`, error.message);
      throw error;
    }
  }

  async getJWTSecret() {
    const secrets = await this.getSecret('jwt');
    return secrets.secret;
  }

  async getJWTConfig() {
    const secrets = await this.getSecret('jwt');
    return {
      secret: secrets.secret,
      expiresIn: secrets.expires_in || '24h'
    };
  }

  async getMongoURI() {
    const secrets = await this.getSecret('mongodb');
    return secrets.uri;
  }

  async getMongoConfig() {
    const secrets = await this.getSecret('mongodb');
    return {
      uri: secrets.uri,
      username: secrets.username,
      password: secrets.password
    };
  }

  async getDockerConfig() {
    const secrets = await this.getSecret('docker');
    return {
      registry: secrets.registry,
      username: secrets.username,
      password: secrets.password
    };
  }

  async getAppConfig() {
    const secrets = await this.getSecret('app');
    return {
      corsOrigin: secrets.cors_origin,
      nodeEnv: secrets.node_env,
      port: secrets.port
    };
  }

  async getAllSecrets() {
    const [jwt, mongodb, docker, app] = await Promise.all([
      this.getSecret('jwt'),
      this.getSecret('mongodb'),
      this.getSecret('docker'),
      this.getSecret('app')
    ]);

    return { jwt, mongodb, docker, app };
  }

  async storeSecret(path, data) {
    if (!this.initialized) {
      throw new Error('Vault not initialized. Call initialize() first');
    }

    try {
      await this.client.write(`orchestrator/data/${path}`, { data });
      console.log(`✅ Secret stored: ${path}`);
    } catch (error) {
      console.error(`❌ Failed to store secret ${path}:`, error.message);
      throw error;
    }
  }

  async deleteSecret(path) {
    if (!this.initialized) {
      throw new Error('Vault not initialized. Call initialize() first');
    }

    try {
      await this.client.delete(`orchestrator/metadata/${path}`);
      console.log(`✅ Secret deleted: ${path}`);
    } catch (error) {
      console.error(`❌ Failed to delete secret ${path}:`, error.message);
      throw error;
    }
  }

  async listSecrets() {
    if (!this.initialized) {
      throw new Error('Vault not initialized. Call initialize() first');
    }

    try {
      const result = await this.client.list('orchestrator/metadata');
      return result.data.keys;
    } catch (error) {
      console.error('❌ Failed to list secrets:', error.message);
      throw error;
    }
  }
}

// Singleton instance
const vaultService = new VaultService();

export default vaultService;

