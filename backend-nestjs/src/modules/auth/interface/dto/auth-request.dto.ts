import { ApiProperty } from '@nestjs/swagger';
import { IsBoolean, IsEmail, IsIn, IsNotEmpty, IsOptional, IsString, Length, Matches, MinLength } from 'class-validator';
import { PasswordValidation } from '../validators/password-decorator.decorator';
import { EmailDto } from './auth-base.dto';

// =================================================================
//----------------------------SIGN UP-------------------------------
// =================================================================
export class SignupDto extends EmailDto {
  @ApiProperty({example: 'password', description: 'The password for the account'})
  @PasswordValidation()
  password!: string;

  @ApiProperty({example: 'John', description: 'The first name of the user', required: false})
  @IsString()
  @IsOptional()
  firstName?: string;

  @ApiProperty({example: 'Doe', description: 'The last name of the user', required: false})
  @IsString()
  @IsOptional()
  lastName?: string;

  @ApiProperty({
    example: false,
    description: 'Enable MFA for the account',
    required: false,
    default: false
  })
  @IsBoolean()
  @IsOptional()
  mfaEnabled?: boolean;
}

// =================================================================
//----------------------------SIGN IN-------------------------------
// =================================================================
export class SigninDto extends EmailDto {
  @ApiProperty({example: 'password', description: 'The password for the account'})
  @IsString()
  @IsNotEmpty({message: 'Password is required'})
  password!: string;
}

// =================================================================
//----------------------------OAUTH---------------------------------
// =================================================================
export class OAuthDto extends EmailDto {
  @ApiProperty({example: 'John', description: 'The first name of the user', required: false})
  @IsString()
  @IsOptional()
  firstName!: string;

  @ApiProperty({example: 'Doe', description: 'The last name of the user', required: false})
  @IsString()
  @IsOptional()
  lastName!: string;

  @ApiProperty({example: 'google', description: 'The login source of the user (google or facebook)', required: false})
  @IsString()
  @IsOptional()
  @IsIn(['google', 'facebook'], {message: 'Login source must be either google or facebook'})
  loginSource: string = 'google';

  @ApiProperty({
    example: false,
    description: 'Enable MFA for the account',
    required: false,
    default: false
  })
  @IsBoolean()
  @IsOptional()
  mfaEnabled?: boolean;
}

// =================================================================
//-----------------------------RESEND-------------------------------
// =================================================================
export class ResendDto extends EmailDto {}

// =================================================================
//-------------------------VERIFICATION-----------------------------
// =================================================================
export class VerificationDto extends EmailDto {
  @ApiProperty({
    example: '123456',
    description: 'A six-digit OTP (One-Time Password)'
  })
  @Matches(/^\d{6}$/, {
    message: 'OTP must be a 6-digit number'
  })
  otp!: string;
}

// =================================================================
//------------------------FORGET PASSWORD---------------------------
// =================================================================
export class ForgetPasswordDto extends EmailDto {}

// =================================================================
//------------------------CHANGE PASSWORD---------------------------
// =================================================================
export class ChangePasswordDto {
  @ApiProperty({
    example: 'oldPassword123',
    description: 'The old password (if changing)'
  })
  @IsString()
  @IsOptional()
  @PasswordValidation()
  oldPassword?: string;

  @ApiProperty({
    example: 'newPassword123',
    description: 'The new password'
  })
  @IsString()
  @IsNotEmpty({message: 'New password is required'})
  @PasswordValidation()
  newPassword!: string;
}

export class RefreshTokenDto {
  @ApiProperty()
  @IsString()
  refreshToken!: string;
}

export class ResetPasswordDto {
  @ApiProperty()
  @IsEmail()
  email!: string;

  @ApiProperty()
  @IsString()
  @Length(6, 6)
  otp!: string;

  @ApiProperty()
  @IsString()
  @MinLength(8)
  newPassword!: string;
}

// =================================================================
//----------------------------ADMIN: CREATE STAFF--------------------
// =================================================================

/** DTO for admin creating an employee. Staff do not sign up; admin creates their account. */
export class CreateEmployeeDto {
  @ApiProperty({ example: 'employee@bank.com', description: 'Email for the new employee' })
  @IsEmail()
  email!: string;

  @ApiProperty({ example: 'SecurePass1!', description: 'Password for the new employee' })
  @PasswordValidation()
  password!: string;

  @ApiProperty({ example: 'Jane', description: 'First name', required: false })
  @IsString()
  @IsOptional()
  firstName?: string;

  @ApiProperty({ example: 'Smith', description: 'Last name', required: false })
  @IsString()
  @IsOptional()
  lastName?: string;
}

/** DTO for admin creating another admin. */
export class CreateAdminDto {
  @ApiProperty({ example: 'admin2@bank.com', description: 'Email for the new admin' })
  @IsEmail()
  email!: string;

  @ApiProperty({ example: 'SecurePass1!', description: 'Password for the new admin' })
  @PasswordValidation()
  password!: string;

  @ApiProperty({ example: 'John', description: 'First name', required: false })
  @IsString()
  @IsOptional()
  firstName?: string;

  @ApiProperty({ example: 'Admin', description: 'Last name', required: false })
  @IsString()
  @IsOptional()
  lastName?: string;
}
