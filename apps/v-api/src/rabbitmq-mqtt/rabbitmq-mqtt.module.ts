import { Module } from '@nestjs/common';
import { RabbitmqMqttService } from './rabbitmq-mqtt.service';
import { RabbitmqMqttController } from './rabbitmq-mqtt.controller';
import { VehicleListenerService } from './vehicle-listener.service';
import { SocketModule } from '../socket/socket.module';
import { VehicleLogicService } from './vehicle-logic.service';
import { MissionDutyModule } from 'src/mission-duty/mission-duty.module';
import { MissionEventsModule } from 'src/mission-events/mission-events.module';

@Module({
  imports: [SocketModule, MissionDutyModule, MissionEventsModule],
  controllers: [RabbitmqMqttController],
  providers: [RabbitmqMqttService, VehicleListenerService, VehicleLogicService],
  exports: [RabbitmqMqttService, VehicleListenerService],
})
export class RabbitmqMqttModule { }
