import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { MongooseModule } from '@nestjs/mongoose';
import { VehicleRegistriesModule } from './vehicle-registries/vehicle-registries.module';
import { TasksModule } from './tasks/tasks.module';
import { DevicesModule } from './devices/devices.module';
import { RabbitmqMqttModule } from './rabbitmq-mqtt/rabbitmq-mqtt.module';
import { SocketModule } from './socket/socket.module';
import { Pm2DeviceManagementModule } from './pm2-device-management/pm2-device-management.module';
import { MissionDutyModule } from './mission-duty/mission-duty.module';
import { MissionEventsModule } from './mission-events/mission-events.module';
import { InfluxdbModule } from './influxdb/influxdb.module';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      envFilePath: '.env',
    }),
    MongooseModule.forRootAsync({
      imports: [ConfigModule],
      useFactory: (configService: ConfigService) => ({
        uri: configService.get<string>('MONGODB_URI') || 'mongodb://appMainUser:TEMP_PASSWORD_FOR_REPO@localhost/v-iot?authSource=admin&readPreference=primary&directConnection=true&ssl=false',
      }),
      inject: [ConfigService],
    }),
    InfluxdbModule,
    VehicleRegistriesModule,
    TasksModule,
    DevicesModule,
    RabbitmqMqttModule,
    SocketModule,
    Pm2DeviceManagementModule,
    MissionDutyModule,
    MissionEventsModule,
    // MosquittoMqttModule,
  ],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule { }
