import bcrypt from 'bcryptjs';

export function hashPassword(password: string): string {
  const salt = bcrypt.genSaltSync(12);
  return bcrypt.hashSync(password, salt);
}

export function verifyPassword(password: string, passwordHash: string): boolean {
  return bcrypt.compareSync(password, passwordHash);
}
