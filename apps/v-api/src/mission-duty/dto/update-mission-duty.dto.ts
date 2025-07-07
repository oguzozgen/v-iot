import { PartialType } from '@nestjs/mapped-types';
import { CreateMissionDutyDto } from './create-mission-duty.dto';

export class UpdateMissionDutyDto extends PartialType(CreateMissionDutyDto) {}
