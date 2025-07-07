import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { MissionDutyService } from './mission-duty.service';
import { MissionDutyController } from './mission-duty.controller';
import { MissionDuty, MissionDutySchema } from '../schemas/mission-duty.schema';

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: MissionDuty.name, schema: MissionDutySchema },
    ]),
  ],
  controllers: [MissionDutyController],
  providers: [MissionDutyService],
  exports: [MissionDutyService],
})
export class MissionDutyModule {}
