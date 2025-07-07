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
import { VehicleRegistriesService } from './vehicle-registries.service';
import { CreateVehicleRegistryDto } from './dto/create-vehicle-registry.dto';
import { UpdateVehicleRegistryDto } from './dto/update-vehicle-registry.dto';

@Controller('vehicle-registries')
export class VehicleRegistriesController {
  constructor(private readonly vehicleRegistriesService: VehicleRegistriesService) {}

  @Post()
  @HttpCode(HttpStatus.CREATED)
  create(@Body() createVehicleRegistryDto: CreateVehicleRegistryDto) {
    return this.vehicleRegistriesService.create(createVehicleRegistryDto);
  }

  @Get()
  findAll() {
    return this.vehicleRegistriesService.findAll();
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.vehicleRegistriesService.findOne(id);
  }

  @Get('vin/:vin')
  findByVin(@Param('vin') vin: string) {
    return this.vehicleRegistriesService.findByVin(vin);
  }

  @Get('device/name/:deviceName')
  findByDeviceName(@Param('deviceName') deviceName: string) {
    return this.vehicleRegistriesService.findByDeviceName(deviceName);
  }

  @Get('device/model/:deviceModel')
  findByDeviceModel(@Param('deviceModel') deviceModel: string) {
    return this.vehicleRegistriesService.findByDeviceModel(deviceModel);
  }

  @Patch(':id')
  update(@Param('id') id: string, @Body() updateVehicleRegistryDto: UpdateVehicleRegistryDto) {
    return this.vehicleRegistriesService.update(id, updateVehicleRegistryDto);
  }

  @Delete(':id')
  @HttpCode(HttpStatus.NO_CONTENT)
  remove(@Param('id') id: string) {
    return this.vehicleRegistriesService.deleteVehicle(id);
  }

  @Post(':id/mqtt/create')
  @HttpCode(HttpStatus.CREATED)
  async createMqttUser(@Param('id') id: string) {
    await this.vehicleRegistriesService.createMqttUserForVehicle(id);
    return { message: 'MQTT user created successfully' };
  }

  @Delete(':id/mqtt')
  @HttpCode(HttpStatus.NO_CONTENT)
  async deleteMqttUser(@Param('id') id: string) {
    await this.vehicleRegistriesService.deleteMqttUserForVehicle(id);
    return { message: 'MQTT user deleted successfully' };
  }

  @Get(':id/mqtt/credentials')
  async getMqttCredentials(@Param('id') id: string) {
    const credentials = await this.vehicleRegistriesService.getMqttCredentials(id);
    return {
      message: 'MQTT credentials retrieved successfully',
      credentials,
    };
  }

  @Get('vin/:vin/mqtt/credentials')
  async getMqttCredentialsByVin(@Param('vin') vin: string) {
    const credentials = await this.vehicleRegistriesService.getMqttCredentialsByVin(vin);
    return {
      message: 'MQTT credentials retrieved successfully',
      credentials,
    };
  }

  @Post(':id/mqtt/regenerate')
  @HttpCode(HttpStatus.CREATED)
  async regenerateMqttCredentials(@Param('id') id: string) {
    const credentials = await this.vehicleRegistriesService.regenerateMqttCredentials(id);
    return {
      message: 'MQTT credentials regenerated successfully',
      credentials,
    };
  }
}
