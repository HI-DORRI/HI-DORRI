import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { AppController } from './app.controller';
import { ApplicationsModule } from './applications/applications.module';
import { AuthModule } from './auth/auth.module';
import { DorriModule } from './dorri/dorri.module';
import { HomeModule } from './home/home.module';
import { MeetupsModule } from './meetups/meetups.module';
import { OrganizerModule } from './organizer/organizer.module';
import { PrismaModule } from './prisma/prisma.module';
import { UsersModule } from './users/users.module';
import { WalletsModule } from './wallets/wallets.module';
import { XrplModule } from './xrpl/xrpl.module';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      envFilePath: ['.env', '../../.env'],
    }),
    ApplicationsModule,
    AuthModule,
    DorriModule,
    HomeModule,
    MeetupsModule,
    OrganizerModule,
    UsersModule,
    WalletsModule,
    PrismaModule,
    XrplModule,
  ],
  controllers: [AppController],
})
export class AppModule {}
