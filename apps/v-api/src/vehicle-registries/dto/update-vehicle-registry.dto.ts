import { PartialType } from '@nestjs/mapped-types';
import { CreateVehicleRegistryDto } from './create-vehicle-registry.dto';

export class UpdateVehicleRegistryDto extends PartialType(CreateVehicleRegistryDto) {}
