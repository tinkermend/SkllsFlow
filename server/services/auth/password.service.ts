import bcrypt from 'bcrypt';

export class PasswordService {
  private readonly SALT_ROUNDS = 10;

  /**
   * 哈希密码
   */
  async hash(password: string): Promise<string> {
    return bcrypt.hash(password, this.SALT_ROUNDS);
  }

  /**
   * 验证密码
   */
  async verify(password: string, hash: string): Promise<boolean> {
    return bcrypt.compare(password, hash);
  }

  /**
   * 密码强度验证
   */
  validateStrength(password: string): { valid: boolean; errors: string[] } {
    const errors: string[] = [];

    if (password.length < 8) {
      errors.push('密码长度至少为 8 个字符');
    }

    if (!/[A-Z]/.test(password)) {
      errors.push('密码必须包含至少一个大写字母');
    }

    if (!/[a-z]/.test(password)) {
      errors.push('密码必须包含至少一个小写字母');
    }

    if (!/[0-9]/.test(password)) {
      errors.push('密码必须包含至少一个数字');
    }

    if (!/[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?]/.test(password)) {
      errors.push('密码必须包含至少一个特殊字符');
    }

    return {
      valid: errors.length === 0,
      errors,
    };
  }
}

export const passwordService = new PasswordService();
