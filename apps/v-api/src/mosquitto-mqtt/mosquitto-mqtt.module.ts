import { Module } from '@nestjs/common';
import { MosquittoMqttService } from './mosquitto-mqtt.service';
import { MosquittoMqttController } from './mosquitto-mqtt.controller';

@Module({
  controllers: [MosquittoMqttController],
  providers: [MosquittoMqttService],
  exports: [MosquittoMqttService],
})
export class MosquittoMqttModule {}
