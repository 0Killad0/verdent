class MemoryBlacklist {
  constructor() {
    this.tokens = new Map();
    this.cleanupInterval = setInterval(() => this.cleanup(), 60 * 1000); // Clean every minute
  }

  add(token, ttl) {
    const expiresAt = Date.now() + ttl;
    const tokenHash = this.hashToken(token);
    this.tokens.set(tokenHash, expiresAt);
    return true;
  }

  has(token) {
    const tokenHash = this.hashToken(token);
    const expiresAt = this.tokens.get(tokenHash);
    
    if (!expiresAt) return false;
    if (Date.now() > expiresAt) {
      this.tokens.delete(tokenHash);
      return false;
    }
    
    return true;
  }

  hashToken(token) {
    const crypto = require('crypto');
    return crypto.createHash('sha256').update(token).digest('hex');
  }

  cleanup() {
    const now = Date.now();
    for (const [tokenHash, expiresAt] of this.tokens.entries()) {
      if (now > expiresAt) {
        this.tokens.delete(tokenHash);
      }
    }
  }

  size() {
    return this.tokens.size;
  }
}

// Singleton instance
module.exports = new MemoryBlacklist();