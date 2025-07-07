import { IsString, IsNotEmpty, IsOptional, IsArray } from 'class-validator';

export class CreateDeviceDto {
  @IsString()
  @IsNotEmpty()
  name!: string;

  @IsString()
  @IsNotEmpty()
  deviceModel!: string;

  @IsString()
  @IsOptional()
  platform?: string;

  @IsArray()
  @IsString({ each: true })
  @IsOptional()
  availableFrameworkVersions?: string[];
}
