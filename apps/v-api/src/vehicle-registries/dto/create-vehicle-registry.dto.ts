import { IsString, IsNotEmpty, ValidateNested, IsObject } from 'class-validator';
import { Type } from 'class-transformer';
import { DeviceDto } from './device.dto';

export class CreateVehicleRegistryDto {
  @IsString()
  @IsNotEmpty()
  name: string;

  @IsString()
  @IsNotEmpty()
  vehicleModel: string;

  @IsObject()
  @ValidateNested()
  @Type(() => DeviceDto)
  device: DeviceDto;
}
