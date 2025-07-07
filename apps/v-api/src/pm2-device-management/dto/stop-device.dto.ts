import { IsString } from 'class-validator';

export class StopDeviceDto {
  @IsString()
  processName: string;
}
