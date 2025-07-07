import { IsString, IsNotEmpty } from 'class-validator';

export class DeviceDto {
  @IsString()
  @IsNotEmpty()
  name: string;

  @IsString()
  @IsNotEmpty()
  model: string;

  @IsString()
  @IsNotEmpty()
  firmwareVersion: string;

  @IsString()
  @IsNotEmpty()
  platform: string;
}
