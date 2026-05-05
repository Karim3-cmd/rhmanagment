import { ApiProperty } from '@nestjs/swagger';
import { IsEmail, IsString, MinLength } from 'class-validator';

export class LoginDto {
  @ApiProperty({ example: 'karim@example.com' })
  @IsEmail()
  email: string;

  @ApiProperty({ example: 'Secure12345' })
  @IsString()
  @MinLength(6)
  password: string;
}
