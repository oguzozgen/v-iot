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
  Query,
} from '@nestjs/common';
import { MissionDutyService } from './mission-duty.service';
import { CreateMissionDutyDto } from './dto/create-mission-duty.dto';
import { UpdateMissionDutyDto } from './dto/update-mission-duty.dto';

@Controller('mission-duty')
export class MissionDutyController {
  constructor(private readonly missionDutyService: MissionDutyService) {}

  @Post()
  @HttpCode(HttpStatus.CREATED)
  create(@Body() createMissionDutyDto: CreateMissionDutyDto) {
    return this.missionDutyService.create(createMissionDutyDto);
  }

  @Get()
  findAll() {
    return this.missionDutyService.findAll();
  }

  @Get('by-mission-code/:missionCode')
  findByMissionCode(@Param('missionCode') missionCode: string) {
    return this.missionDutyService.findByMissionCode(missionCode);
  }

  @Get('by-task-generated-code/:taskGeneratedCode')
  findByTaskGeneratedCode(@Param('taskGeneratedCode') taskGeneratedCode: string) {
    return this.missionDutyService.findByTaskGeneratedCode(taskGeneratedCode);
  }

  @Get('by-vin/:vin')
  findByVin(@Param('vin') vin: string) {
    return this.missionDutyService.findByVin(vin);
  }

  @Get('by-mission-code-and-vin')
  findByMissionCodeAndVin(
    @Query('missionCode') missionCode: string,
    @Query('vin') vin: string,
  ) {
    return this.missionDutyService.findByMissionCodeAndVin(missionCode, vin);
  }

  @Get('statistics')
  getMissionDutyStatistics() {
    return this.missionDutyService.getMissionDutyStatistics();
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.missionDutyService.findOne(id);
  }

  @Patch(':id')
  update(@Param('id') id: string, @Body() updateMissionDutyDto: UpdateMissionDutyDto) {
    return this.missionDutyService.update(id, updateMissionDutyDto);
  }

  @Delete(':id')
  @HttpCode(HttpStatus.NO_CONTENT)
  remove(@Param('id') id: string) {
    return this.missionDutyService.remove(id);
  }
}
