import { DeviceDocument } from '../../schemas/device.schema';
import { CreateDeviceDto } from '../dto/create-device.dto';
import { UpdateDeviceDto } from '../dto/update-device.dto';
import { ICrudService } from '../../common/interfaces/crud.interface';

export interface IDevicesService 
  extends ICrudService<DeviceDocument, CreateDeviceDto, UpdateDeviceDto> {
  findByDeviceModel(deviceModel: string): Promise<DeviceDocument[]>;
  findByName(name: string): Promise<DeviceDocument>;
  findByPlatform(platform: string): Promise<DeviceDocument[]>;
  findByFrameworkVersion(version: string): Promise<DeviceDocument[]>;
  addFrameworkVersion(id: string, version: string): Promise<DeviceDocument>;
  removeFrameworkVersion(id: string, version: string): Promise<DeviceDocument>;
}
