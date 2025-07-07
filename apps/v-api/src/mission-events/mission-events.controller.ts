import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
  HttpStatus,
  HttpCode,
} from '@nestjs/common';
import { MissionEventsService } from './mission-events.service';
import { CreateMissionEventsDto } from './dto/create-mission-events.dto';
import { UpdateMissionEventsDto } from './dto/update-mission-events.dto';

@Controller('mission-events')
export class MissionEventsController {
  constructor(private readonly missionEventsService: MissionEventsService) {}

  @Post()
  @HttpCode(HttpStatus.CREATED)
  create(@Body() createMissionEventsDto: CreateMissionEventsDto) {
    return this.missionEventsService.create(createMissionEventsDto);
  }

  @Get()
  findAll() {
    return this.missionEventsService.findAll();
  }

  @Get('by-mission-id/:missionId')
  findByMissionId(@Param('missionId') missionId: string) {
    return this.missionEventsService.findByMissionId(missionId);
  }

  @Get('by-mission-code/:missionCode')
  findByMissionCode(@Param('missionCode') missionCode: string) {
    return this.missionEventsService.findByMissionCode(missionCode);
  }

  @Get('by-type/:type')
  findByType(@Param('type') type: string) {
    return this.missionEventsService.findByType(type);
  }

  @Get('by-event/:event')
  findByEvent(@Param('event') event: string) {
    return this.missionEventsService.findByEvent(event);
  }

  @Get('statistics')
  getMissionEventsStatistics() {
    return this.missionEventsService.getMissionEventsStatistics();
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.missionEventsService.findOne(id);
  }

  @Patch(':id')
  update(@Param('id') id: string, @Body() updateMissionEventsDto: UpdateMissionEventsDto) {
    return this.missionEventsService.update(id, updateMissionEventsDto);
  }

  @Delete(':id')
  @HttpCode(HttpStatus.NO_CONTENT)
  remove(@Param('id') id: string) {
    return this.missionEventsService.remove(id);
  }
}
