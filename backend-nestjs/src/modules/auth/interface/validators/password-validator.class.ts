import {Inject, Injectable} from '@nestjs/common';
import {ValidationArguments, ValidatorConstraint, ValidatorConstraintInterface} from 'class-validator';
import {PasswordValidationService} from '../../application/services/password-validation.service';

/**
 * Password Validator (Framework Adapter)
 * Thin adapter that delegates to PasswordValidationService in application layer
 * Following Clean Architecture: interface layer adapts framework decorators to application services
 */
@ValidatorConstraint({name: 'passwordValidation', async: false})
@Injectable()
export class PasswordValidator implements ValidatorConstraintInterface {
  constructor(
    @Inject(PasswordValidationService)
    private readonly passwordValidationService: PasswordValidationService
  ) {}

  validate(password: string, args: ValidationArguments): boolean {
    // Extract email/username from parent object (DTO) if available
    const parentObject = args.object as { email?: string; username?: string };
    const usernameOrEmail = parentObject?.email || parentObject?.username;
    
    const result = this.passwordValidationService.validatePassword(password, usernameOrEmail);
    return result.isValid;
  }

  defaultMessage(args: ValidationArguments): string {
    const password = (args?.value as string) || '';
    if (!password) {
      return 'Password is required';
    }
    
    // Extract email/username from parent object (DTO) if available
    const parentObject = args.object as { email?: string; username?: string };
    const usernameOrEmail = parentObject?.email || parentObject?.username;
    
    const result = this.passwordValidationService.validatePassword(password, usernameOrEmail);
    return result.error || 'Password validation failed';
  }
}
