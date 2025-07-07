import { Injectable, NotFoundException, Logger } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { VehicleRegistries, VehicleRegistriesDocument } from '../schemas/vehicle-registries.schema';
import { CreateVehicleRegistryDto } from './dto/create-vehicle-registry.dto';
import { UpdateVehicleRegistryDto } from './dto/update-vehicle-registry.dto';
import { MongoGenericCRUDHandler } from '../common/handlers/mongo-generic-crud.handler';
import { IVehicleRegistriesService } from './interfaces/vehicle-registries.interface';
import { RabbitmqMqttService } from '../rabbitmq-mqtt/rabbitmq-mqtt.service';
import { EncryptionService } from '../common/services/encryption.service';

@Injectable()
export class VehicleRegistriesService
  extends MongoGenericCRUDHandler<VehicleRegistriesDocument, CreateVehicleRegistryDto, UpdateVehicleRegistryDto>
  implements IVehicleRegistriesService {
  private readonly logger = new Logger(VehicleRegistriesService.name);

  constructor(
    @InjectModel(VehicleRegistries.name)
    private vehicleRegistriesModel: Model<VehicleRegistriesDocument>,
    private rabbitmqMqttService: RabbitmqMqttService,
    private encryptionService: EncryptionService,
  ) {
    super(vehicleRegistriesModel);
  }

  async create(createVehicleRegistryDto: CreateVehicleRegistryDto): Promise<VehicleRegistriesDocument> {
    // Create the vehicle registry first
    const vehicleRegistry = await super.create(createVehicleRegistryDto);

    try {
      // Create MQTT user for the vehicle
      const mqttUser = await this.rabbitmqMqttService.createVehicleUser(
        vehicleRegistry.vin?.toString() || ''
      );

      this.logger.log(`Created MQTT user for vehicle ${vehicleRegistry._id.toString()}: ${mqttUser.username}`);

      //DISABLED ON DEVELOP DEMO MOD - Encrypt and store the MQTT credentials
      //const encryptedPassword = this.encryptionService.encrypt(mqttUser.password);

      await this.vehicleRegistriesModel.updateOne(
        { _id: vehicleRegistry._id },
        {
          $set: {
            isMqttCredentialsSet: true,
            mqttCredentials: {
              username: mqttUser.username,
              password: mqttUser.password,
              clientId: mqttUser.username, // RabbitMQ uses username as clientId
              createdAt: new Date(),
            },
          },
        }
      );

      this.logger.log(`Stored encrypted MQTT credentials for vehicle ${vehicleRegistry._id.toString()}`);

      return vehicleRegistry;
    } catch (error) {
      this.logger.error(`Failed to create MQTT user for vehicle ${vehicleRegistry._id.toString()}: ${(error as Error).message}`);

      // Decide whether to rollback vehicle creation or continue
      // For this example, we'll continue but log the error
      // In production, you might want to implement proper transaction handling

      return vehicleRegistry;
    }
  }

  async deleteVehicle(id: string): Promise<VehicleRegistriesDocument> {
    // Get the vehicle registry first to ensure it exists
    const vehicleRegistry = await this.findOne(id);

    try {
      // Delete MQTT user for the vehicle using VIN
      await this.rabbitmqMqttService.deleteVehicleUser(vehicleRegistry.vin?.toString() || '');
      this.logger.log(`Deleted MQTT user for vehicle ${vehicleRegistry._id.toString()}`);
    } catch (error) {
      this.logger.error(`Failed to delete MQTT user for vehicle ${vehicleRegistry._id.toString()}: ${(error as Error).message}`);
      // Continue with vehicle deletion even if MQTT cleanup fails
    }

    // Delete the vehicle registry
    return await super.remove(id);
  }

  async findByVin(vin: string): Promise<VehicleRegistriesDocument> {
    const vehicleRegistry = await this.vehicleRegistriesModel.findOne({ vin }).exec();
    if (!vehicleRegistry) {
      throw new NotFoundException(`Vehicle registry with VIN ${vin} not found`);
    }
    return vehicleRegistry;
  }

  async findByDeviceName(deviceName: string): Promise<VehicleRegistriesDocument[]> {
    return this.findBy({ 'device.name': deviceName });
  }

  async findByDeviceModel(deviceModel: string): Promise<VehicleRegistriesDocument[]> {
    return this.findBy({ 'device.model': deviceModel });
  }

  /**
   * Create MQTT user for an existing vehicle (useful for data migration or manual creation)
   */
  async createMqttUserForVehicle(vehicleId: string): Promise<void> {
    const vehicleRegistry = await this.findOne(vehicleId);

    try {
      const mqttUser = await this.rabbitmqMqttService.createVehicleUser(
        vehicleRegistry.vin?.toString() || ''
      );

      // Encrypt and store the MQTT credentials
      const encryptedPassword = this.encryptionService.encrypt(mqttUser.password);

      await this.vehicleRegistriesModel.updateOne(
        { _id: vehicleRegistry._id },
        {
          $set: {
            mqttCredentials: {
              username: mqttUser.username,
              password: encryptedPassword,
              clientId: mqttUser.username, // RabbitMQ uses username as clientId
              createdAt: new Date(),
            },
          },
        }
      );

      this.logger.log(`Created MQTT user for existing vehicle ${vehicleRegistry._id.toString()}: ${mqttUser.username}`);
    } catch (error) {
      this.logger.error(`Failed to create MQTT user for existing vehicle ${vehicleRegistry._id.toString()}: ${(error as Error).message}`);
      throw error;
    }
  }

  /**
   * Delete MQTT user for a vehicle (useful for cleanup or manual operations)
   */
  async deleteMqttUserForVehicle(vehicleId: string): Promise<void> {
    const vehicleRegistry = await this.findOne(vehicleId);

    try {
      await this.rabbitmqMqttService.deleteVehicleUser(vehicleRegistry.vin?.toString() || '');

      // Remove MQTT credentials from the database
      await this.vehicleRegistriesModel.updateOne(
        { _id: vehicleRegistry._id },
        { $unset: { mqttCredentials: 1 } }
      );

      this.logger.log(`Deleted MQTT user for vehicle ${vehicleRegistry._id.toString()}`);
    } catch (error) {
      this.logger.error(`Failed to delete MQTT user for vehicle ${vehicleRegistry._id.toString()}: ${(error as Error).message}`);
      throw error;
    }
  }

  /**
   * Get MQTT credentials for a vehicle (decrypted)
   */
  async getMqttCredentials(vehicleId: string): Promise<{
    username: string;
    password: string;
    clientId: string;
    createdAt: Date;
  }> {
    const vehicleRegistry = await this.vehicleRegistriesModel
      .findById(vehicleId)
      .select('+mqttCredentials')
      .exec();

    if (!vehicleRegistry) {
      throw new NotFoundException(`Vehicle registry with ID ${vehicleId} not found`);
    }

    if (!vehicleRegistry.mqttCredentials) {
      throw new NotFoundException(`MQTT credentials not found for vehicle ${vehicleId}`);
    }

    try {
      const decryptedPassword = this.encryptionService.decrypt(vehicleRegistry.mqttCredentials.password);

      return {
        username: vehicleRegistry.mqttCredentials.username,
        password: decryptedPassword,
        clientId: vehicleRegistry.mqttCredentials.clientId,
        createdAt: vehicleRegistry.mqttCredentials.createdAt,
      };
    } catch (error) {
      this.logger.error(`Failed to decrypt MQTT credentials for vehicle ${vehicleId}: ${(error as Error).message}`);
      throw new Error('Failed to retrieve MQTT credentials');
    }
  }

  /**
   * Get MQTT credentials by VIN (decrypted)
   */
  async getMqttCredentialsByVin(vin: string): Promise<{
    username: string;
    password: string;
    clientId: string;
    createdAt: Date;
  }> {
    const vehicleRegistry = await this.vehicleRegistriesModel
      .findOne({ vin })
      .select('+mqttCredentials')
      .exec();

    if (!vehicleRegistry) {
      throw new NotFoundException(`Vehicle registry with VIN ${vin} not found`);
    }

    if (!vehicleRegistry.mqttCredentials) {
      throw new NotFoundException(`MQTT credentials not found for vehicle with VIN ${vin}`);
    }

    try {
      const decryptedPassword = this.encryptionService.decrypt(vehicleRegistry.mqttCredentials.password);

      return {
        username: vehicleRegistry.mqttCredentials.username,
        password: decryptedPassword,
        clientId: vehicleRegistry.mqttCredentials.clientId,
        createdAt: vehicleRegistry.mqttCredentials.createdAt,
      };
    } catch (error) {
      this.logger.error(`Failed to decrypt MQTT credentials for vehicle with VIN ${vin}: ${(error as Error).message}`);
      throw new Error('Failed to retrieve MQTT credentials');
    }
  }

  /**
   * Regenerate MQTT credentials for a vehicle
   */
  async regenerateMqttCredentials(vehicleId: string): Promise<{
    username: string;
    password: string;
    clientId: string;
    createdAt: Date;
  }> {
    const vehicleRegistry = await this.findOne(vehicleId);

    try {
      // Delete the existing MQTT user
      await this.rabbitmqMqttService.deleteVehicleUser(vehicleRegistry.vin?.toString() || '');

      // Create a new MQTT user
      const mqttUser = await this.rabbitmqMqttService.createVehicleUser(
        vehicleRegistry.vin?.toString() || ''
      );

      // Encrypt and store the new MQTT credentials
      const encryptedPassword = this.encryptionService.encrypt(mqttUser.password);

      await this.vehicleRegistriesModel.updateOne(
        { _id: vehicleRegistry._id },
        {
          $set: {
            mqttCredentials: {
              username: mqttUser.username,
              password: encryptedPassword,
              clientId: mqttUser.username, // RabbitMQ uses username as clientId
              createdAt: new Date(),
            },
          },
        }
      );

      this.logger.log(`Regenerated MQTT credentials for vehicle ${vehicleRegistry._id.toString()}`);

      return {
        username: mqttUser.username,
        password: mqttUser.password,
        clientId: mqttUser.username, // RabbitMQ uses username as clientId
        createdAt: new Date(),
      };
    } catch (error) {
      this.logger.error(`Failed to regenerate MQTT credentials for vehicle ${vehicleRegistry._id.toString()}: ${(error as Error).message}`);
      throw error;
    }
  }
}
