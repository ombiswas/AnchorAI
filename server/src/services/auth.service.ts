import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { config } from '../config';
import { IUser, User } from '../models/user.model';
import { ConflictError, UnauthorizedError, ValidationError } from '../utils/errors';
import { LoginInput, SignupInput, loginSchema, signupSchema } from '../validations/auth.validation';

export interface AuthResponse {
  token: string;
  user: {
    id: string;
    name: string;
    email: string;
    createdAt: Date;
  };
}

export class AuthService {
  /**
   * Generates a signed JSON Web Token
   */
  public generateToken(userId: string, email: string): string {
    return jwt.sign({ userId, email }, config.jwtSecret, {
      expiresIn: config.jwtExpiresIn as jwt.SignOptions['expiresIn'],
    });
  }

  /**
   * Hashes a password using bcrypt with cost factor 12
   */
  public async hashPassword(password: string): Promise<string> {
    return bcrypt.hash(password, config.bcryptSaltRounds);
  }

  /**
   * Registers a new user
   */
  public async signup(input: SignupInput): Promise<AuthResponse> {
    const parseResult = signupSchema.safeParse(input);
    if (!parseResult.success) {
      const issue = parseResult.error.issues[0];
      throw new ValidationError(
        issue ? issue.message : 'Invalid signup data',
        parseResult.error.format()
      );
    }

    const { name, email, password } = parseResult.data;

    const existingUser = await User.findOne({ email });
    if (existingUser) {
      throw new ConflictError('An account with this email already exists');
    }

    // Cost factor 12 hashing
    const passwordHash = await this.hashPassword(password);

    const user: IUser = await User.create({
      name,
      email,
      passwordHash,
      createdAt: new Date(),
    });

    const token = this.generateToken(user._id.toString(), user.email);

    return {
      token,
      user: {
        id: user._id.toString(),
        name: user.name,
        email: user.email,
        createdAt: user.createdAt,
      },
    };
  }

  /**
   * Authenticates user credentials without leaking email existence
   */
  public async login(input: LoginInput): Promise<AuthResponse> {
    const parseResult = loginSchema.safeParse(input);
    if (!parseResult.success) {
      const issue = parseResult.error.issues[0];
      throw new ValidationError(
        issue ? issue.message : 'Invalid login data',
        parseResult.error.format()
      );
    }

    const { email, password } = parseResult.data;

    const user = await User.findOne({ email });

    // Timing-attack mitigation & never leak email existence:
    // If user does not exist, run a dummy bcrypt comparison against a dummy hash
    if (!user) {
      await bcrypt.compare(
        password,
        '$2a$12$e80yq73QZ1gq8w4b4dO77OKcQeZzYfL0k0x9k7k6y1v2g0j0m0m0m'
      );
      throw new UnauthorizedError('Invalid email or password');
    }

    const isMatch = await bcrypt.compare(password, user.passwordHash);
    if (!isMatch) {
      throw new UnauthorizedError('Invalid email or password');
    }

    const token = this.generateToken(user._id.toString(), user.email);

    return {
      token,
      user: {
        id: user._id.toString(),
        name: user.name,
        email: user.email,
        createdAt: user.createdAt,
      },
    };
  }

  /**
   * Fetches user profile by ID
   */
  public async getProfile(userId: string): Promise<AuthResponse['user']> {
    const user = await User.findById(userId);
    if (!user) {
      throw new UnauthorizedError('User not found or session expired');
    }

    return {
      id: user._id.toString(),
      name: user.name,
      email: user.email,
      createdAt: user.createdAt,
    };
  }
}

export const authService = new AuthService();
