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
import { DevicesService } from './devices.service';
import { CreateDeviceDto } from './dto/create-device.dto';
import { UpdateDeviceDto } from './dto/update-device.dto';

@Controller('devices')
export class DevicesController {
  constructor(private readonly devicesService: DevicesService) {}

  @Post()
  @HttpCode(HttpStatus.CREATED)
  create(@Body() createDeviceDto: CreateDeviceDto) {
    return this.devicesService.create(createDeviceDto);
  }

  @Get()
  findAll() {
    return this.devicesService.findAll();
  }

  @Get('statistics')
  getDeviceStatistics() {
    return this.devicesService.getDeviceStatistics();
  }

  @Get('model/:deviceModel')
  findByDeviceModel(@Param('deviceModel') deviceModel: string) {
    return this.devicesService.findByDeviceModel(deviceModel);
  }

  @Get('name/:name')
  findByName(@Param('name') name: string) {
    return this.devicesService.findByName(name);
  }

  @Get('framework-version/:version')
  findByFrameworkVersion(@Param('version') version: string) {
    return this.devicesService.findByFrameworkVersion(version);
  }

  @Get('platform/:platform')
  findByPlatform(@Param('platform') platform: string) {
    return this.devicesService.findByPlatform(platform);
  }

  @Get('search')
  findDevicesByModelAndVersion(
    @Query('model') deviceModel: string,
    @Query('version') frameworkVersion: string,
  ) {
    return this.devicesService.findDevicesByModelAndVersion(deviceModel, frameworkVersion);
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.devicesService.findOne(id);
  }

  @Patch(':id')
  update(@Param('id') id: string, @Body() updateDeviceDto: UpdateDeviceDto) {
    return this.devicesService.update(id, updateDeviceDto);
  }

  @Patch(':id/model')
  updateDeviceModel(
    @Param('id') id: string,
    @Body('deviceModel') deviceModel: string,
  ) {
    return this.devicesService.updateDeviceModel(id, deviceModel);
  }

  @Patch(':id/platform')
  updatePlatform(
    @Param('id') id: string,
    @Body('platform') platform: string,
  ) {
    return this.devicesService.updatePlatform(id, platform);
  }

  @Patch(':id/framework-version/add')
  addFrameworkVersion(
    @Param('id') id: string,
    @Body('version') version: string,
  ) {
    return this.devicesService.addFrameworkVersion(id, version);
  }

  @Patch(':id/framework-version/remove')
  removeFrameworkVersion(
    @Param('id') id: string,
    @Body('version') version: string,
  ) {
    return this.devicesService.removeFrameworkVersion(id, version);
  }

  @Delete(':id')
  @HttpCode(HttpStatus.NO_CONTENT)
  remove(@Param('id') id: string) {
    return this.devicesService.remove(id);
  }
}
