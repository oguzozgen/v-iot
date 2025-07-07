import {
  Controller,
  Get,
  Post,
  Body,
  Param,
  Delete,
  Patch,
  HttpStatus,
  HttpCode,
  BadRequestException,
} from '@nestjs/common';
import { MosquittoMqttService, MosquittoUser, MosquittoRole } from './mosquitto-mqtt.service';

export class CreateMqttClientDto {
  clientId: string;
  password?: string;
}

export class CreateMqttRoleDto {
  roleName: string;
  acls: {
    acltype: 'publishClientSend' | 'publishClientReceive' | 'subscribePattern' | 'unsubscribePattern';
    topic: string;
    priority: number;
    allow: boolean;
  }[];
}

export class AssignRoleDto {
  clientId: string;
  roleName: string;
}

export class UpdatePasswordDto {
  clientId: string;
  newPassword: string;
}

export class CreateVehicleUserDto {
  vin: string;
}

@Controller('mosquitto')
export class MosquittoMqttController {
  constructor(private readonly mosquittoService: MosquittoMqttService) {}

  @Post('clients')
  @HttpCode(HttpStatus.CREATED)
  async createClient(@Body() createClientDto: CreateMqttClientDto): Promise<MosquittoUser> {
    if (!createClientDto.clientId) {
      throw new BadRequestException('Client ID is required');
    }
    return this.mosquittoService.createClient(createClientDto.clientId, createClientDto.password);
  }

  @Get('clients')
  async listClients(): Promise<string[]> {
    return this.mosquittoService.listClients();
  }

  @Get('clients/:clientId')
  async getClient(@Param('clientId') clientId: string): Promise<any> {
    return this.mosquittoService.getClient(clientId);
  }

  @Delete('clients/:clientId')
  @HttpCode(HttpStatus.NO_CONTENT)
  async deleteClient(@Param('clientId') clientId: string): Promise<void> {
    return this.mosquittoService.deleteClient(clientId);
  }

  @Patch('clients/password')
  @HttpCode(HttpStatus.OK)
  async updateClientPassword(@Body() updatePasswordDto: UpdatePasswordDto): Promise<void> {
    if (!updatePasswordDto.clientId || !updatePasswordDto.newPassword) {
      throw new BadRequestException('Client ID and new password are required');
    }
    return this.mosquittoService.updateClientPassword(
      updatePasswordDto.clientId,
      updatePasswordDto.newPassword
    );
  }

  @Post('roles')
  @HttpCode(HttpStatus.CREATED)
  async createRole(@Body() createRoleDto: CreateMqttRoleDto): Promise<MosquittoRole> {
    if (!createRoleDto.roleName || !createRoleDto.acls) {
      throw new BadRequestException('Role name and ACLs are required');
    }
    return this.mosquittoService.createRole(createRoleDto.roleName, createRoleDto.acls);
  }

  @Get('roles')
  async listRoles(): Promise<string[]> {
    return this.mosquittoService.listRoles();
  }

  @Post('roles/assign')
  @HttpCode(HttpStatus.OK)
  async assignRoleToClient(@Body() assignRoleDto: AssignRoleDto): Promise<void> {
    if (!assignRoleDto.clientId || !assignRoleDto.roleName) {
      throw new BadRequestException('Client ID and role name are required');
    }
    return this.mosquittoService.assignRoleToClient(assignRoleDto.clientId, assignRoleDto.roleName);
  }

  @Post('vehicles/users')
  @HttpCode(HttpStatus.CREATED)
  async createVehicleUser(@Body() createVehicleUserDto: CreateVehicleUserDto): Promise<MosquittoUser> {
    if (!createVehicleUserDto.vin) {
      throw new BadRequestException('VIN is required');
    }
    return this.mosquittoService.createVehicleUser(createVehicleUserDto.vin);
  }

  @Delete('vehicles/:vin/users')
  @HttpCode(HttpStatus.NO_CONTENT)
  async deleteVehicleUser(@Param('vin') vin: string): Promise<void> {
    return this.mosquittoService.deleteVehicleUser(vin);
  }
}
