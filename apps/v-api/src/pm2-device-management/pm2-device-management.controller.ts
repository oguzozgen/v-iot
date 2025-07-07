import {
  Controller,
  Get,
  Post,
  Delete,
  Body,
  Param,
  HttpStatus,
  HttpCode,
  Patch,
} from '@nestjs/common';
import { Pm2DeviceManagementService } from './pm2-device-management.service';
import { CreateDeviceDto } from './dto/create-device.dto';
import { StopDeviceDto } from './dto/stop-device.dto';
import { CreateDeviceByVinDto } from './dto/create-device-by-vin.dto';

@Controller('pm2-device-management')
export class Pm2DeviceManagementController {
  constructor(private readonly pm2DeviceManagementService: Pm2DeviceManagementService) {}

  /**
   * Create and start a new v-device instance
   */
  @Post('devices')
  @HttpCode(HttpStatus.CREATED)
  async createDevice(@Body() createDeviceDto: CreateDeviceDto) {
    return this.pm2DeviceManagementService.createDevice(createDeviceDto);
  }

  /**
   * Create and start a new v-device instance by VIN
   * Checks if device already exists, if not creates it using vehicle registry data
   */
  @Post('devices/by-vin')
  @HttpCode(HttpStatus.CREATED)
  async createDeviceByVin(@Body() createDeviceByVinDto: CreateDeviceByVinDto) {
    return this.pm2DeviceManagementService.createDeviceByVin(createDeviceByVinDto);
  }

  /**
   * Stop a v-device instance by process name
   */
  @Post('devices/stop')
  @HttpCode(HttpStatus.OK)
  async stopDevice(@Body() stopDeviceDto: StopDeviceDto) {
    return this.pm2DeviceManagementService.stopDevice(stopDeviceDto);
  }

  /**
   * Delete a v-device instance by process name
   */
  @Delete('devices/:processName')
  @HttpCode(HttpStatus.OK)
  async deleteDevice(@Param('processName') processName: string) {
    return this.pm2DeviceManagementService.deleteDevice(processName);
  }

  /**
   * Restart a v-device instance by process name
   */
  @Patch('devices/:processName/restart')
  @HttpCode(HttpStatus.OK)
  async restartDevice(@Param('processName') processName: string) {
    return this.pm2DeviceManagementService.restartDevice(processName);
  }

  /**
   * List all v-device instances
   */
  @Get('devices')
  async listDevices() {
    return this.pm2DeviceManagementService.listDevices();
  }

  /**
   * Get details of a specific v-device instance
   */
  @Get('devices/:processName')
  async getDeviceDetails(@Param('processName') processName: string) {
    return this.pm2DeviceManagementService.getDeviceDetails(processName);
  }
}
