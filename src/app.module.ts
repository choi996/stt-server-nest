import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { GoogleModule } from './google/google.module';
import { AmazonModule } from './amazon/amazon.module';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      envFilePath: '.env',
    }),
    GoogleModule,
    AmazonModule,
  ],
})
export class AppModule {}
