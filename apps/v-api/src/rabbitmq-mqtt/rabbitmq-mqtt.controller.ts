import {
  Controller,
  Get,
  Post,
  Delete,
  Patch,
  Body,
  Param,
  HttpCode,
  HttpStatus,
  BadRequestException
} from '@nestjs/common';
import { RabbitmqMqttService, RabbitMQUser, RabbitMQPermission } from './rabbitmq-mqtt.service';

export class CreateMqttUserDto {
  username: string;
  password?: string;
  tags?: string[];
}

export class SetPermissionsDto {
  username: string;
  vhost?: string;
  permissions: RabbitMQPermission;
}

export class UpdatePasswordDto {
  username: string;
  newPassword: string;
}

export class CreateVehicleUserDto {
  vin: string;
}

@Controller('rabbitmq-mqtt')
export class RabbitmqMqttController {
  constructor(private readonly rabbitmqMqttService: RabbitmqMqttService) { }

  @Post('users')
  @HttpCode(HttpStatus.CREATED)
  async createUser(@Body() createUserDto: CreateMqttUserDto): Promise<RabbitMQUser> {
    if (!createUserDto.username) {
      throw new BadRequestException('Username is required');
    }
    return this.rabbitmqMqttService.createUser(
      createUserDto.username,
      createUserDto.password,
      createUserDto.tags
    );
  }

  @Get('users')
  async listUsers(): Promise<string[]> {
    return this.rabbitmqMqttService.listUsers();
  }

  @Get('users/:username')
  async getUser(@Param('username') username: string): Promise<any> {
    return this.rabbitmqMqttService.getUser(username);
  }

  @Delete('users/:username')
  @HttpCode(HttpStatus.NO_CONTENT)
  async deleteUser(@Param('username') username: string): Promise<void> {
    return this.rabbitmqMqttService.deleteUser(username);
  }

  @Patch('users/password')
  @HttpCode(HttpStatus.OK)
  async updateUserPassword(@Body() updatePasswordDto: UpdatePasswordDto): Promise<void> {
    if (!updatePasswordDto.username || !updatePasswordDto.newPassword) {
      throw new BadRequestException('Username and new password are required');
    }
    return this.rabbitmqMqttService.updateUserPassword(
      updatePasswordDto.username,
      updatePasswordDto.newPassword
    );
  }

  @Post('permissions')
  @HttpCode(HttpStatus.CREATED)
  async setUserPermissions(@Body() setPermissionsDto: SetPermissionsDto): Promise<void> {
    if (!setPermissionsDto.username || !setPermissionsDto.permissions) {
      throw new BadRequestException('Username and permissions are required');
    }
    return this.rabbitmqMqttService.setUserPermissions(
      setPermissionsDto.username,
      setPermissionsDto.vhost,
      setPermissionsDto.permissions
    );
  }

  @Get('permissions/:username')
  async getUserPermissions(
    @Param('username') username: string,
    @Body('vhost') vhost?: string
  ): Promise<RabbitMQPermission | null> {
    return this.rabbitmqMqttService.getUserPermissions(username, vhost);
  }

  @Post('vehicles/users')
  @HttpCode(HttpStatus.CREATED)
  async createVehicleUser(@Body() createVehicleUserDto: CreateVehicleUserDto): Promise<RabbitMQUser> {
    if (!createVehicleUserDto.vin) {
      throw new BadRequestException('VIN is required');
    }
    return this.rabbitmqMqttService.createVehicleUser(createVehicleUserDto.vin);
  }

  @Delete('vehicles/:vin/users')
  @HttpCode(HttpStatus.NO_CONTENT)
  async deleteVehicleUser(@Param('vin') vin: string): Promise<void> {
    return this.rabbitmqMqttService.deleteVehicleUser(vin);
  }

  @Get('vehicles/users')
  async listVehicleUsers(): Promise<string[]> {
    return this.rabbitmqMqttService.listVehicleUsers();
  }

  @Patch('vehicles/:vin/permissions')
  @HttpCode(HttpStatus.OK)
  async updateVehicleUserPermissions(@Param('vin') vin: string): Promise<void> {
    return this.rabbitmqMqttService.updateVehicleUserPermissions(vin);
  }

  @Get('health')
  async getHealthStatus(): Promise<{ status: string; mqttEnabled: boolean; users: number }> {
    return this.rabbitmqMqttService.getHealthStatus();
  }

  @Post('vehicles/send-mission-to-device')
  @HttpCode(HttpStatus.OK)
  async sendMissionToVehicle(
    @Body('vin') vin: string,
    @Body('missionCode') missionCode: string
  ): Promise<{ sent: boolean }> {
    console.log(`Sending mission ${missionCode} to vehicle ${vin}`);
    return await this.rabbitmqMqttService.sendMissionToVehicle(vin, missionCode);
  }
}
