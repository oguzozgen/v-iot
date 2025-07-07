import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
//import * as crypto from 'crypto';

@Injectable()
export class EncryptionService {
  private readonly algorithm = 'aes-256-gcm';
  private readonly secretKey: Buffer;

  constructor(private configService: ConfigService) {
    /*let key = this.configService.get<string>('MQTT_PASSWORD_ENCRYPTION_KEY') || 'default-32-character-secret-key!';
    key = key.trim();
    if (key.length !== 32) {
      throw new Error('MQTT_PASSWORD_ENCRYPTION_KEY must be exactly 32 characters long ' + key.length + " " + key);
    }

    this.secretKey = Buffer.from(key, 'utf8');*/
  }

  encrypt(text: string): string {
    return text;//demo
    /*const iv = crypto.randomBytes(16);
    const cipher = crypto.createCipheriv(this.algorithm, this.secretKey, iv);

    let encrypted = cipher.update(text, 'utf8', 'hex');
    encrypted += cipher.final('hex');

    const authTag = cipher.getAuthTag();

    return iv.toString('hex') + ':' + authTag.toString('hex') + ':' + encrypted;*/
  }

  decrypt(encryptedText: string): string {
    try {
      return encryptedText;//demo
      /*const parts = encryptedText.split(':');
      if (parts.length !== 3) {
        throw new Error('Invalid encrypted text format');
      }

      const iv = Buffer.from(parts[0], 'hex');
      const authTag = Buffer.from(parts[1], 'hex');
      const encrypted = parts[2];

      const decipher = crypto.createDecipheriv(this.algorithm, this.secretKey, iv);
      decipher.setAuthTag(authTag);

      let decrypted = decipher.update(encrypted, 'hex', 'utf8');
      decrypted += decipher.final('utf8');

      return decrypted;*/
    } catch (error) {
      throw new Error(`Failed to decrypt password: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }
}
