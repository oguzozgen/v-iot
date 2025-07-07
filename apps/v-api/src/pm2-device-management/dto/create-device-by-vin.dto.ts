import { IsString, IsOptional, IsBoolean } from 'class-validator';

export class CreateDeviceByVinDto {
  @IsString()
  vin: string;

  @IsOptional()
  @IsString()
  broker?: string;

  @IsOptional()
  @IsBoolean()
  debug?: boolean;
}
