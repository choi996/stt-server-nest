import { Module } from '@nestjs/common';
import { GoogleGateway } from './google.gateway';
import { GoogleService } from './google.service';

@Module({
  providers: [GoogleService, GoogleGateway],
})
export class GoogleModule {}
