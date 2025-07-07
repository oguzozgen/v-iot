import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { MissionEventsService } from './mission-events.service';
import { MissionEventsController } from './mission-events.controller';
import { MissionEvents, MissionEventsSchema } from '../schemas/mission-events.schema';

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: MissionEvents.name, schema: MissionEventsSchema },
    ]),
  ],
  controllers: [MissionEventsController],
  providers: [MissionEventsService],
  exports: [MissionEventsService],
})
export class MissionEventsModule {}
