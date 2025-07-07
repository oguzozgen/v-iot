import { PartialType } from '@nestjs/mapped-types';
import { CreateMissionEventsDto } from './create-mission-events.dto';

export class UpdateMissionEventsDto extends PartialType(CreateMissionEventsDto) {}
