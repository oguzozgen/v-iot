import { Injectable, Logger, InternalServerErrorException, BadRequestException } from '@nestjs/common';
import { exec } from 'child_process';
import { promisify } from 'util';
import * as crypto from 'crypto';
import { getErrorMessage } from '../common/utils/error.utils';

const execAsync = promisify(exec);

export interface MosquittoUser {
  username: string;
  password: string;
  clientId: string;
  roles: string[];
}

export interface MosquittoRole {
  roleName: string;
  acls: MosquittoACL[];
}

export interface MosquittoACL {
  acltype: 'publishClientSend' | 'publishClientReceive' | 'subscribePattern' | 'unsubscribePattern';
  topic: string;
  priority: number;
  allow: boolean;
}

@Injectable()
export class MosquittoMqttService {
  private readonly logger = new Logger(MosquittoMqttService.name);
  private readonly containerName: string;
  private readonly adminUsername: string;
  private readonly adminPassword: string;
  private readonly host: string;

  constructor() {
    this.containerName = process.env.MOSQUITTO_CONTAINER_NAME || 'infrastructure-mosquitto';
    this.adminUsername = process.env.MOSQUITTO_ADMIN_USERNAME || 'mqtt_admin';
    this.adminPassword = process.env.MOSQUITTO_ADMIN_PASSWORD || 'your-mosquitto-admin-password-here';
    this.host = process.env.MOSQUITTO_HOST || 'localhost';
  }

  /**
   * Generate a secure random password
   */
  private generatePassword(length: number = 16): string {
    const charset = 'abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789!@#$%^&*';
    let password = '';
    for (let i = 0; i < length; i++) {
      password += charset.charAt(crypto.randomInt(0, charset.length));
    }
    return password;
  }

  /**
   * Execute mosquitto_ctrl command in Docker container
   */
  private async executeMosquittoCommand(command: string): Promise<string> {
    const fullCommand = `docker exec ${this.containerName} mosquitto_ctrl -h ${this.host} -u ${this.adminUsername} -P ${this.adminPassword} ${command}`;

    try {
      this.logger.debug(`Executing: ${fullCommand.replace(this.adminPassword, '***')}`);
      const { stdout, stderr } = await execAsync(fullCommand);

      if (stderr) {
        this.logger.warn(`Command stderr: ${stderr}`);
      }

      return stdout.trim();
    } catch (error) {
      const errorMessage = getErrorMessage(error);
      this.logger.error(`Mosquitto command failed: ${errorMessage}`);
      throw new InternalServerErrorException(`Failed to execute Mosquitto command: ${errorMessage}`);
    }
  }

  /**
   * Create a new MQTT client/user
   */
  async createClient(clientId: string, password?: string): Promise<MosquittoUser> {
    if (!clientId || clientId.trim() === '') {
      throw new BadRequestException('Client ID cannot be empty');
    }

    const generatedPassword = password || this.generatePassword();

    try {
      // Create client
      await this.executeMosquittoCommand(`dynsec createClient ${clientId}`);

      // Set password
      await this.executeMosquittoCommand(`dynsec setClientPassword ${clientId} ${generatedPassword}`);

      this.logger.log(`Created MQTT client: ${clientId}`);

      return {
        username: clientId,
        password: generatedPassword,
        clientId: clientId,
        roles: []
      };
    } catch (error) {
      const errorMessage = getErrorMessage(error);
      this.logger.error(`Failed to create MQTT client ${clientId}: ${errorMessage}`);
      throw new InternalServerErrorException(`Failed to create MQTT client: ${errorMessage}`);
    }
  }

  /**
   * Delete an MQTT client/user
   */
  async deleteClient(clientId: string): Promise<void> {
    if (!clientId || clientId.trim() === '') {
      throw new BadRequestException('Client ID cannot be empty');
    }

    try {
      await this.executeMosquittoCommand(`dynsec deleteClient ${clientId}`);
      this.logger.log(`Deleted MQTT client: ${clientId}`);
    } catch (error) {
      const errorMessage = getErrorMessage(error);
      this.logger.error(`Failed to delete MQTT client ${clientId}: ${errorMessage}`);
      throw new InternalServerErrorException(`Failed to delete MQTT client: ${errorMessage}`);
    }
  }

  /**
   * Create a role with specific ACLs
   */
  async createRole(roleName: string, acls: MosquittoACL[]): Promise<MosquittoRole> {
    if (!roleName || roleName.trim() === '') {
      throw new BadRequestException('Role name cannot be empty');
    }

    try {
      // Create role
      await this.executeMosquittoCommand(`dynsec createRole ${roleName}`);

      // Add ACLs to role
      for (const acl of acls) {
        const allowStr = acl.allow ? 'allow' : 'deny';
        await this.executeMosquittoCommand(
          `dynsec addRoleACL ${roleName} ${acl.acltype} ${acl.topic} ${allowStr} ${acl.priority}`
        );
      }

      this.logger.log(`Created MQTT role: ${roleName} with ${acls.length} ACLs`);

      return {
        roleName,
        acls
      };
    } catch (error) {
      const errorMessage = getErrorMessage(error);
      this.logger.error(`Failed to create MQTT role ${roleName}: ${errorMessage}`);
      throw new InternalServerErrorException(`Failed to create MQTT role: ${errorMessage}`);
    }
  }

  /**
   * Assign a role to a client
   */
  async assignRoleToClient(clientId: string, roleName: string): Promise<void> {
    if (!clientId || clientId.trim() === '') {
      throw new BadRequestException('Client ID cannot be empty');
    }
    if (!roleName || roleName.trim() === '') {
      throw new BadRequestException('Role name cannot be empty');
    }

    try {
      await this.executeMosquittoCommand(`dynsec addClientRole ${clientId} ${roleName}`);
      this.logger.log(`Assigned role ${roleName} to client ${clientId}`);
    } catch (error) {
      const errorMessage = getErrorMessage(error);
      this.logger.error(`Failed to assign role ${roleName} to client ${clientId}: ${errorMessage}`);
      throw new InternalServerErrorException(`Failed to assign role to client: ${errorMessage}`);
    }
  }

  /**
   * Create a vehicle-specific MQTT user with appropriate permissions
   */
  async createVehicleUser(vin: string): Promise<MosquittoUser> {
    const clientId = `vehicle_${vin}`;
    const roleName = `vehicle_role_${vin}`;

    try {
      // Create vehicle-specific role with ACLs
      const acls: MosquittoACL[] = [
        {
          acltype: 'publishClientSend',
          topic: `vehicle/${vin}/telemetry`,
          priority: 1,
          allow: true
        },
        {
          acltype: 'publishClientSend',
          topic: `vehicle/${vin}/heartbeat-status`,
          priority: 1,
          allow: true
        },
        {
          acltype: 'publishClientSend',
          topic: `vehicle/${vin}/mission-events`,
          priority: 1,
          allow: true
        },
        {
          acltype: 'publishClientSend',
          topic: `vehicle/${vin}/location`,
          priority: 1,
          allow: true
        },
        {
          acltype: 'subscribePattern',
          topic: `vehicle/${vin}/commands`,
          priority: 1,
          allow: true
        }
      ];

      // Create role
      await this.createRole(roleName, acls);

      // Create client
      const user = await this.createClient(clientId);

      // Assign role to client
      await this.assignRoleToClient(clientId, roleName);

      user.roles = [roleName];

      this.logger.log(`Created vehicle MQTT user for VIN: ${vin}`);

      return user;
    } catch (error) {
      const errorMessage = getErrorMessage(error);
      this.logger.error(`Failed to create vehicle MQTT user for VIN ${vin}: ${errorMessage}`);
      throw new InternalServerErrorException(`Failed to create vehicle MQTT user: ${errorMessage}`);
    }
  }

  /**
   * Delete a vehicle-specific MQTT user and role
   */
  async deleteVehicleUser(vin: string): Promise<void> {
    const clientId = `vehicle_${vin}`;
    const roleName = `vehicle_role_${vin}`;

    try {
      // Delete client
      await this.deleteClient(clientId);

      // Delete role
      await this.executeMosquittoCommand(`dynsec deleteRole ${roleName}`);

      this.logger.log(`Deleted vehicle MQTT user and role for vehicle with VIN: ${vin}`);
    } catch (error) {
      const errorMessage = getErrorMessage(error);
      this.logger.error(`Failed to delete vehicle MQTT user for VIN ${vin}: ${errorMessage}`);
      throw new InternalServerErrorException(`Failed to delete vehicle MQTT user: ${errorMessage}`);
    }
  }

  /**
   * List all clients
   */
  async listClients(): Promise<string[]> {
    try {
      const output = await this.executeMosquittoCommand('dynsec listClients');
      const clients = output.split('\n').filter(line => line.trim() !== '');
      return clients;
    } catch (error) {
      const errorMessage = getErrorMessage(error);
      this.logger.error(`Failed to list clients: ${errorMessage}`);
      throw new InternalServerErrorException(`Failed to list clients: ${errorMessage}`);
    }
  }

  /**
   * List all roles
   */
  async listRoles(): Promise<string[]> {
    try {
      const output = await this.executeMosquittoCommand('dynsec listRoles');
      const roles = output.split('\n').filter(line => line.trim() !== '');
      return roles;
    } catch (error) {
      const errorMessage = getErrorMessage(error);
      this.logger.error(`Failed to list roles: ${errorMessage}`);
      throw new InternalServerErrorException(`Failed to list roles: ${errorMessage}`);
    }
  }

  /**
   * Get client details
   */
  async getClient(clientId: string): Promise<any> {
    try {
      const output = await this.executeMosquittoCommand(`dynsec getClient ${clientId}`);
      return JSON.parse(output);
    } catch (error) {
      const errorMessage = getErrorMessage(error);
      this.logger.error(`Failed to get client ${clientId}: ${errorMessage}`);
      throw new InternalServerErrorException(`Failed to get client: ${errorMessage}`);
    }
  }

  /**
   * Update client password
   */
  async updateClientPassword(clientId: string, newPassword: string): Promise<void> {
    if (!clientId || clientId.trim() === '') {
      throw new BadRequestException('Client ID cannot be empty');
    }
    if (!newPassword || newPassword.trim() === '') {
      throw new BadRequestException('Password cannot be empty');
    }

    try {
      await this.executeMosquittoCommand(`dynsec setClientPassword ${clientId} ${newPassword}`);
      this.logger.log(`Updated password for MQTT client: ${clientId}`);
    } catch (error) {
      const errorMessage = getErrorMessage(error);
      this.logger.error(`Failed to update password for client ${clientId}: ${errorMessage}`);
      throw new InternalServerErrorException(`Failed to update client password: ${errorMessage}`);
    }
  }
}
