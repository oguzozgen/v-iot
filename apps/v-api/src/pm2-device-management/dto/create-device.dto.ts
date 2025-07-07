import { IsString, IsOptional, IsBoolean } from 'class-validator';

export class CreateDeviceDto {
  @IsString()
  username: string;

  @IsString()
  password: string;

  @IsString()
  vin: string;

  @IsOptional()
  @IsString()
  broker?: string;

  @IsOptional()
  @IsBoolean()
  debug?: boolean;
}
