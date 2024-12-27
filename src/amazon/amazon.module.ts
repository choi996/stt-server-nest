import { Module } from '@nestjs/common';
import { AmazonGateway } from './amazon.gateway';

@Module({
  providers: [AmazonGateway],
})
export class AmazonModule {}
