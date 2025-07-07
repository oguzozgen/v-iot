/*eslint-disable */
import { Injectable, Logger, NotFoundException, ConflictException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import * as pm2 from 'pm2';
import { CreateDeviceDto } from './dto/create-device.dto';
import { StopDeviceDto } from './dto/stop-device.dto';
import { CreateDeviceByVinDto } from './dto/create-device-by-vin.dto';
import { VehicleRegistriesService } from '../vehicle-registries/vehicle-registries.service';

@Injectable()
export class Pm2DeviceManagementService {
  private readonly logger = new Logger(Pm2DeviceManagementService.name);
  private deviceCounter = 0;

  constructor(
    private configService: ConfigService,
    private vehicleRegistriesService: VehicleRegistriesService,
  ) { }

  /**
   * Create and start a new v-device instance using PM2
   */
  async createDevice(createDeviceDto: CreateDeviceDto): Promise<{
    processName: string;
    message: string;
    pid?: number;
  }> {
    return new Promise((resolve, reject) => {
      try {
        // Generate unique process name
        const processName = `v-device-${createDeviceDto.vin}-${Date.now()}-${++this.deviceCounter}`;

        // Get v-device path - assuming it's in the same monorepo
        const vDevicePath = process.cwd().replace('/apps/v-api', '/apps/simple-device');
        const scriptPath = `${vDevicePath}/index.js`;

        // Build arguments for v-device
        const args = [
          '--username', createDeviceDto.username,
          '--password', createDeviceDto.password,
          '--vin', createDeviceDto.vin,
        ];

        if (createDeviceDto.broker) {
          args.push('--broker', createDeviceDto.broker);
        }

        if (createDeviceDto.debug) {
          args.push('--debug');
        }

        // PM2 start configuration
        const pm2Config = {
          script: scriptPath,
          name: processName,
          args: args,
          cwd: vDevicePath,
          env: {
            NODE_ENV: 'production',
            ...process.env,
          },
          instances: 1,
          autorestart: true,
          watch: false,
          max_memory_restart: '1G',
          log_date_format: 'YYYY-MM-DD HH:mm:ss Z',
          error_file: `${vDevicePath}/logs/${processName}-error.log`,
          out_file: `${vDevicePath}/logs/${processName}-out.log`,
          log_file: `${vDevicePath}/logs/${processName}-combined.log`,
        };

        this.logger.log(`Starting v-device with PM2: ${processName}`);
        this.logger.debug(`PM2 Config: ${JSON.stringify(pm2Config, null, 2)}`);

        pm2.start(pm2Config, (err: any, proc: any) => {
          if (err) {
            this.logger.error(`Failed to start v-device ${processName}: ${err.message}`);
            return reject(new Error(`Failed to start v-device: ${err.message}`));
          }

          const process = proc?.[0];
          this.logger.log(`Successfully started v-device ${processName} with PID: ${process?.pid || 'unknown'}`);
          resolve({
            processName,
            message: `V-Device '${processName}' has been started successfully`,
            pid: process?.pid,
          });
        });
      } catch (error: any) {
        this.logger.error(`Error creating v-device: ${error.message}`);
        reject(new Error(`Error creating v-device: ${error.message}`));
      }
    });
  }

  /**
   * Stop a v-device instance by process name
   */
  async stopDevice(stopDeviceDto: StopDeviceDto): Promise<{
    message: string;
  }> {
    return new Promise((resolve, reject) => {
      try {
        const { processName } = stopDeviceDto;

        this.logger.log(`Stopping v-device: ${processName}`);

        pm2.stop(processName, (err: any) => {
          if (err) {
            this.logger.error(`Failed to stop v-device ${processName}: ${err.message}`);
            return reject(new Error(`Failed to stop v-device: ${err.message}`));
          }

          this.logger.log(`Successfully stopped v-device ${processName}`);
          resolve({
            message: `V-Device '${processName}' has been stopped successfully`,
          });
        });
      } catch (error: any) {
        this.logger.error(`Error stopping v-device: ${error.message}`);
        reject(new Error(`Error stopping v-device: ${error.message}`));
      }
    });
  }

  /**
   * Delete a v-device instance by process name
   */
  async deleteDevice(processName: string): Promise<{
    message: string;
  }> {
    return new Promise((resolve, reject) => {
      try {
        this.logger.log(`Deleting v-device: ${processName}`);

        pm2.delete(processName, (err: any) => {
          if (err) {
            this.logger.error(`Failed to delete v-device ${processName}: ${err.message}`);
            return reject(new Error(`Failed to delete v-device: ${err.message}`));
          }

          this.logger.log(`Successfully deleted v-device ${processName}`);
          resolve({
            message: `V-Device '${processName}' has been deleted successfully`,
          });
        });
      } catch (error: any) {
        this.logger.error(`Error deleting v-device: ${error.message}`);
        reject(new Error(`Error deleting v-device: ${error.message}`));
      }
    });
  }

  /**
   * Restart a v-device instance by process name
   */
  async restartDevice(processName: string): Promise<{
    message: string;
  }> {
    return new Promise((resolve, reject) => {
      try {
        this.logger.log(`Restarting v-device: ${processName}`);

        pm2.restart(processName, (err: any) => {
          if (err) {
            this.logger.error(`Failed to restart v-device ${processName}: ${err.message}`);
            return reject(new Error(`Failed to restart v-device: ${err.message}`));
          }

          this.logger.log(`Successfully restarted v-device ${processName}`);
          resolve({
            message: `V-Device '${processName}' has been restarted successfully`,
          });
        });
      } catch (error: any) {
        this.logger.error(`Error restarting v-device: ${error.message}`);
        reject(new Error(`Error restarting v-device: ${error.message}`));
      }
    });
  }

  /**
   * List all v-device instances
   */
  async listDevices(): Promise<{
    processes: any[];
    message: string;
  }> {
    return new Promise((resolve, reject) => {
      try {
        pm2.list((err: any, processList: any[]) => {
          if (err) {
            this.logger.error(`Failed to list processes: ${err.message}`);
            return reject(new Error(`Failed to list processes: ${err.message}`));
          }

          // Filter only v-device processes
          const vDeviceProcesses = processList.filter(proc =>
            proc.name?.startsWith('v-device-')
          );

          resolve({
            processes: vDeviceProcesses.map(proc => ({
              name: proc.name,
              pid: proc.pid,
              status: proc.pm2_env?.status,
              cpu: proc.monit?.cpu,
              memory: proc.monit?.memory,
              uptime: proc.pm2_env?.pm_uptime,
              restarts: proc.pm2_env?.restart_time,
            })),
            message: `Found ${vDeviceProcesses.length} v-device processes`,
          });
        });
      } catch (error: any) {
        this.logger.error(`Error listing processes: ${error.message}`);
        reject(new Error(`Error listing processes: ${error.message}`));
      }
    });
  }

  /**
   * Get details of a specific v-device instance
   */
  async getDeviceDetails(processName: string): Promise<{
    process: any;
    message: string;
  }> {
    return new Promise((resolve, reject) => {
      try {
        pm2.describe(processName, (err: any, processList: any[]) => {
          if (err) {
            this.logger.error(`Failed to describe process ${processName}: ${err.message}`);
            return reject(new Error(`Failed to describe process: ${err.message}`));
          }

          if (!processList || processList.length === 0) {
            return reject(new Error(`Process ${processName} not found`));
          }

          const proc = processList[0];
          resolve({
            process: {
              name: proc.name,
              pid: proc.pid,
              status: proc.pm2_env?.status,
              cpu: proc.monit?.cpu,
              memory: proc.monit?.memory,
              uptime: proc.pm2_env?.pm_uptime,
              restarts: proc.pm2_env?.restart_time,
            },
            message: `Process details for ${processName}`,
          });
        });
      } catch (error: any) {
        this.logger.error(`Error getting process details: ${error.message}`);
        reject(new Error(`Error getting process details: ${error.message}`));
      }
    });
  }

  /**
   * Create and start a new v-device instance by VIN
   * Checks if device already exists, if not creates it using vehicle registry data
   */
  async createDeviceByVin(createDeviceByVinDto: CreateDeviceByVinDto): Promise<{
    processName: string;
    message: string;
    pid?: number;
    isExisting?: boolean;
  }> {
    try {
      // First, check if a device with this VIN already exists in PM2
      const existingDevices = await this.listDevices();
      const existingDevice = existingDevices.processes.find(proc =>
        proc.name?.includes(`v-device-${createDeviceByVinDto.vin}-`)
      );

      if (existingDevice) {
        this.logger.log(`Device with VIN ${createDeviceByVinDto.vin} already exists: ${existingDevice.name}`);
        const resultRestart = await this.restartDevice(existingDevice.name);
        return {
          processName: existingDevice.name,
          message: `V-Device with VIN '${createDeviceByVinDto.vin}' already exists and is running and restarted successfully`,
          pid: existingDevice.pid,
          isExisting: true,
        };
      }

      // If not found, get vehicle registry data
      const vehicleRegistry = await this.vehicleRegistriesService.findByVin(createDeviceByVinDto.vin);

      if (!vehicleRegistry.isMqttCredentialsSet || !vehicleRegistry.mqttCredentials) {
        throw new NotFoundException(`Vehicle registry with VIN ${createDeviceByVinDto.vin} does not have MQTT credentials set`);
      }

      // Create device using vehicle registry data
      const createDeviceDto: CreateDeviceDto = {
        username: vehicleRegistry.mqttCredentials.username,
        password: vehicleRegistry.mqttCredentials.password,
        vin: createDeviceByVinDto.vin,
        broker: createDeviceByVinDto.broker,
        debug: createDeviceByVinDto.debug,
      };

      const result = await this.createDevice(createDeviceDto);

      return {
        ...result,
        isExisting: false,
      };
    } catch (error: any) {
      this.logger.error(`Error creating device by VIN: ${error.message}`);
      throw error;
    }
  }
}
/*eslint-enable */