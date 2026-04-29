import { BadRequestException, Injectable, UnauthorizedException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { InjectModel } from '@nestjs/mongoose';
import { randomBytes, scryptSync, timingSafeEqual } from 'crypto';
import { Model, Types } from 'mongoose';
import { User, UserDocument } from '../users/schemas/user.schema';
import { LoginDto } from './dto/login.dto';
import { RegisterDto } from './dto/register.dto';

@Injectable()
export class AuthService {
  constructor(
    @InjectModel(User.name) private readonly userModel: Model<UserDocument>,
    private readonly jwtService: JwtService,
  ) {}

  private hashPassword(password: string) {
    const salt = randomBytes(16).toString('hex');
    const hash = scryptSync(password, salt, 64).toString('hex');
    return `${salt}:${hash}`;
  }

  private verifyPassword(password: string, storedHash: string) {
    const [salt, hash] = storedHash.split(':');
    const verifyHash = scryptSync(password, salt, 64);
    const hashBuffer = Buffer.from(hash, 'hex');
    return timingSafeEqual(hashBuffer, verifyHash);
  }

  private sanitize(user: UserDocument) {
    const { passwordHash, ...safe } = user.toObject();
    return safe;
  }

  async register(dto: RegisterDto) {
    const email = dto.email.toLowerCase();
    const existing = await this.userModel.findOne({ email });
    if (existing) {
      throw new BadRequestException('Email already registered');
    }

    const created = await this.userModel.create({
      _id: new Types.ObjectId().toString(),
      ...dto,
      email,
      passwordHash: this.hashPassword(dto.password),
      department: dto.department || '',
      jobTitle: dto.jobTitle || '',
    });

    return {
      message: 'Account created successfully',
      user: this.sanitize(created),
    };
  }

  async login(dto: LoginDto) {
    const user = await this.userModel.findOne({ email: dto.email.toLowerCase() });
    if (!user || !this.verifyPassword(dto.password, user.passwordHash)) {
      throw new UnauthorizedException('Invalid email or password');
    }

    const payload = {
      sub: user._id,
      email: user.email,
      role: user.role,
      department: user.department,
    };

    return {
      message: 'Login successful',
      access_token: this.jwtService.sign(payload),
      user: this.sanitize(user),
    };
  }
}
