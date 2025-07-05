import { Module } from '@nestjs/common';
import { KeyTokenService } from './key-token.service';

@Module({
  providers: [KeyTokenService],
  exports: [KeyTokenService]
})
export class KeyTokenModule {}
