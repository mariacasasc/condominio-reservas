import bcrypt from "bcryptjs";
import type { PasswordHasher } from "@/domain/usuario/password-hasher";

const SALT_ROUNDS = 12;

export class BcryptPasswordHasher implements PasswordHasher {
  async hash(passwordPlano: string): Promise<string> {
    return bcrypt.hash(passwordPlano, SALT_ROUNDS);
  }

  async verificar(passwordPlano: string, passwordHash: string): Promise<boolean> {
    return bcrypt.compare(passwordPlano, passwordHash);
  }
}
