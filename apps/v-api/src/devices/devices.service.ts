import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { Device, DeviceDocument } from '../schemas/device.schema';
import { CreateDeviceDto } from './dto/create-device.dto';
import { UpdateDeviceDto } from './dto/update-device.dto';
import { MongoGenericCRUDHandler } from '../common/handlers/mongo-generic-crud.handler';
import { IDevicesService } from './interfaces/devices.interface';

@Injectable()
export class DevicesService 
  extends MongoGenericCRUDHandler<DeviceDocument, CreateDeviceDto, UpdateDeviceDto>
  implements IDevicesService
{
  constructor(
    @InjectModel(Device.name)
    private deviceModel: Model<DeviceDocument>,
  ) {
    super(deviceModel);
  }

  // Custom methods specific to devices
  async findByDeviceModel(deviceModel: string): Promise<DeviceDocument[]> {
    return this.findBy({ deviceModel });
  }

  async findByName(name: string): Promise<DeviceDocument> {
    const device = await this.findOneBy({ name });
    if (!device) {
      throw new NotFoundException(`Device with name ${name} not found`);
    }
    return device;
  }

  async findByFrameworkVersion(version: string): Promise<DeviceDocument[]> {
    return this.findBy({ 
      availableFrameworkVersions: { $in: [version] } 
    });
  }

  async findByPlatform(platform: string): Promise<DeviceDocument[]> {
    return this.findBy({ platform });
  }

  async addFrameworkVersion(id: string, version: string): Promise<DeviceDocument> {
    const device = await this.findOne(id);
    const versions = device.availableFrameworkVersions || [];
    
    if (!versions.includes(version)) {
      versions.push(version);
      return this.update(id, { availableFrameworkVersions: versions } as UpdateDeviceDto);
    }
    
    return device;
  }

  async removeFrameworkVersion(id: string, version: string): Promise<DeviceDocument> {
    const device = await this.findOne(id);
    const versions = device.availableFrameworkVersions || [];
    
    const filteredVersions = versions.filter(v => v !== version);
    return this.update(id, { availableFrameworkVersions: filteredVersions } as UpdateDeviceDto);
  }

  // Override create method for custom validation
  async create(createDeviceDto: CreateDeviceDto): Promise<DeviceDocument> {
    // Check if device name already exists
    const existingDevice = await this.deviceModel.findOne({ 
      name: createDeviceDto.name 
    }).exec();
    
    if (existingDevice) {
      throw new Error(`Device with name ${createDeviceDto.name} already exists`);
    }

    // Set default framework versions if not provided
    if (!createDeviceDto.availableFrameworkVersions) {
      createDeviceDto.availableFrameworkVersions = [];
    }

    return super.create(createDeviceDto);
  }

  // Additional device-specific methods
  async findDevicesByModelAndVersion(
    deviceModel: string, 
    frameworkVersion: string
  ): Promise<DeviceDocument[]> {
    return this.findBy({
      deviceModel,
      availableFrameworkVersions: { $in: [frameworkVersion] }
    });
  }

  async getDeviceStatistics(): Promise<{
    totalDevices: number;
    devicesByModel: Record<string, number>;
    devicesByPlatform: Record<string, number>;
    totalFrameworkVersions: number;
  }> {
    const totalDevices = await this.count();
    
    // Type definition for aggregation result
    interface DeviceModelCount {
      _id: string;
      count: number;
    }
    
    const devicesByModelAgg = await this.deviceModel.aggregate<DeviceModelCount>([
      {
        $group: {
          _id: '$deviceModel',
          count: { $sum: 1 }
        }
      }
    ]).exec();

    const devicesByModel = devicesByModelAgg.reduce((acc, item) => {
      acc[item._id] = item.count;
      return acc;
    }, {} as Record<string, number>);

    // Type definition for platform count
    interface DevicePlatformCount {
      _id: string;
      count: number;
    }
    
    const devicesByPlatformAgg = await this.deviceModel.aggregate<DevicePlatformCount>([
      {
        $group: {
          _id: '$platform',
          count: { $sum: 1 }
        }
      }
    ]).exec();

    const devicesByPlatform = devicesByPlatformAgg.reduce((acc, item) => {
      acc[item._id] = item.count;
      return acc;
    }, {} as Record<string, number>);

    // Type definition for framework version count
    interface FrameworkVersionCount {
      total: number;
    }

    const allVersionsAgg = await this.deviceModel.aggregate<FrameworkVersionCount>([
      { $unwind: '$availableFrameworkVersions' },
      { $group: { _id: '$availableFrameworkVersions' } },
      { $count: 'total' }
    ]).exec();

    const totalFrameworkVersions = allVersionsAgg[0]?.total || 0;

    return {
      totalDevices,
      devicesByModel,
      devicesByPlatform,
      totalFrameworkVersions
    };
  }

  async updateDeviceModel(id: string, newModel: string): Promise<DeviceDocument> {
    return this.update(id, { deviceModel: newModel } as UpdateDeviceDto);
  }

  async updatePlatform(id: string, newPlatform: string): Promise<DeviceDocument> {
    return this.update(id, { platform: newPlatform } as UpdateDeviceDto);
  }
}
