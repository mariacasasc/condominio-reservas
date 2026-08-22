/**
 * Port: hashing algorithm is an infrastructure concern (bcrypt today, could
 * change later). The domain and application layers only see this contract.
 */
export interface PasswordHasher {
  hash(passwordPlano: string): Promise<string>;
  verificar(passwordPlano: string, passwordHash: string): Promise<boolean>;
}
