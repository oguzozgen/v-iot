import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { VehicleRegistriesService } from './vehicle-registries.service';
import { VehicleRegistriesController } from './vehicle-registries.controller';
import { VehicleRegistries, VehicleRegistriesSchema } from '../schemas/vehicle-registries.schema';
import { RabbitmqMqttModule } from '../rabbitmq-mqtt/rabbitmq-mqtt.module';
import { EncryptionService } from '../common/services/encryption.service';
import { ConfigModule } from '@nestjs/config';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true, // Makes ConfigService available globally
    }),
    MongooseModule.forFeature([
      { name: VehicleRegistries.name, schema: VehicleRegistriesSchema },
    ]),
    RabbitmqMqttModule,
  ],
  controllers: [VehicleRegistriesController],
  providers: [VehicleRegistriesService, EncryptionService],
  exports: [VehicleRegistriesService],
})
export class VehicleRegistriesModule { }
