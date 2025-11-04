import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';
import { prisma } from '../prisma';

const JWT_SECRET = process.env.JWT_SECRET ?? 'change_this_secret';

export class AuthService {
  async register(email: string, username: string, password: string) {
    const exists = await prisma.user.findFirst({ where: { OR: [{ email }, { username }] } });
    if (exists) throw new Error('User already exists');
    const passwordHash = await bcrypt.hash(password, 10);
    const user = await prisma.user.create({
      data: { email, username, password: passwordHash, role: 'admin' }
    });
    return this.tokenResponse(user.id, user.email, user.username, user.role);
  }

  async login(email: string, password: string) {
    const user = await prisma.user.findUnique({ where: { email } });
    if (!user) throw new Error('Invalid credentials');
    const ok = await bcrypt.compare(password, user.password);
    if (!ok) throw new Error('Invalid credentials');
    return this.tokenResponse(user.id, user.email, user.username, user.role);
  }

  private tokenResponse(id: string, email: string, username: string, role: string) {
    const token = jwt.sign({ sub: id, role }, JWT_SECRET, { expiresIn: '7d' });
    return { token, user: { id, email, username, role } };
  }
}
