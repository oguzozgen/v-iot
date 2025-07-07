import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { Pm2DeviceManagementService } from './pm2-device-management.service';
import { Pm2DeviceManagementController } from './pm2-device-management.controller';
import { VehicleRegistriesModule } from '../vehicle-registries/vehicle-registries.module';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
    }),
    VehicleRegistriesModule,
  ],
  controllers: [Pm2DeviceManagementController],
  providers: [Pm2DeviceManagementService],
  exports: [Pm2DeviceManagementService],
})
export class Pm2DeviceManagementModule {}
