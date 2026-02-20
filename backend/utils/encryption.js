import crypto from 'crypto';

// Ensure ENCRYPTION_KEY is 32 chars
// In production, this MUST be in .env. 
// For dev, we'll use a fallback if not present, but log a warning.
const getAlgorithm = () => 'aes-256-cbc';

const getKey = () => {
  const key = process.env.ENCRYPTION_KEY;
  if (!key) {
    console.warn("⚠️  WARNING: ENCRYPTION_KEY not found in .env. Using insecure default for development.");
    return crypto.scryptSync('default_insecure_salt', 'salt', 32); 
  }
  // If key is provided, ensure it's 32 bytes (or hash it to 32 bytes)
  return crypto.scryptSync(key, 'salt', 32); 
};

export const encrypt = (text) => {
  if (!text) return text;
  try {
    const iv = crypto.randomBytes(16);
    const cipher = crypto.createCipheriv(getAlgorithm(), getKey(), iv);
    let encrypted = cipher.update(text);
    encrypted = Buffer.concat([encrypted, cipher.final()]);
    return iv.toString('hex') + ':' + encrypted.toString('hex');
  } catch (error) {
    console.error("Encryption failed:", error);
    return text; // Return original if failed (or handle error differently)
  }
};

export const decrypt = (text) => {
  if (!text) return text;
  try {
    const textParts = text.split(':');
    if (textParts.length !== 2) return text; // Not encrypted formatted
    
    const iv = Buffer.from(textParts[0], 'hex');
    const encryptedText = Buffer.from(textParts[1], 'hex');
    const decipher = crypto.createDecipheriv(getAlgorithm(), getKey(), iv);
    let decrypted = decipher.update(encryptedText);
    decrypted = Buffer.concat([decrypted, decipher.final()]);
    return decrypted.toString();
  } catch (error) {
    console.error("Decryption failed:", error);
    return text; // Return original (might be already plaintext)
  }
};
