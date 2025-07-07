import { IsString, IsNotEmpty, IsOptional, IsObject } from 'class-validator';

export class CreateMissionDutyDto {
  @IsString()
  @IsNotEmpty()
  missionCode!: string;

  @IsString()
  @IsNotEmpty()
  taskGeneratedCode!: string;

  @IsString()
  @IsNotEmpty()
  vin!: string;

  @IsObject()
  @IsNotEmpty()
  taskDispatched!: any; // You can define a more specific type if needed

  @IsString()
  @IsOptional()
  status?: string;

  @IsOptional()
  dispatched?: boolean;

  @IsOptional()
  dispatchedAt?: Date;
}
