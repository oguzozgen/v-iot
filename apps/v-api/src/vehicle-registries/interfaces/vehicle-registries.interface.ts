import { VehicleRegistriesDocument } from '../../schemas/vehicle-registries.schema';
import { CreateVehicleRegistryDto } from '../dto/create-vehicle-registry.dto';
import { UpdateVehicleRegistryDto } from '../dto/update-vehicle-registry.dto';
import { ICrudService } from '../../common/interfaces/crud.interface';

export interface IVehicleRegistriesService 
  extends ICrudService<VehicleRegistriesDocument, CreateVehicleRegistryDto, UpdateVehicleRegistryDto> {
  findByVin(vin: string): Promise<VehicleRegistriesDocument>;
  findByDeviceName(deviceName: string): Promise<VehicleRegistriesDocument[]>;
  findByDeviceModel(deviceModel: string): Promise<VehicleRegistriesDocument[]>;
}
