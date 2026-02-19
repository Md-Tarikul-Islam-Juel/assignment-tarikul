import { Global, Module } from '@nestjs/common';
import { SensitiveDataEncryptionService } from './sensitive-data.encryption.service';

@Global()
@Module({
  providers: [SensitiveDataEncryptionService],
  exports: [SensitiveDataEncryptionService]
})
export class EncryptionModule {}
