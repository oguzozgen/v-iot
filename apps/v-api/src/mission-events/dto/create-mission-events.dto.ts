import { IsString, IsNotEmpty } from 'class-validator';
import mongoose from 'mongoose';

export class CreateMissionEventsDto {
  @IsString()
  @IsNotEmpty()
  missionId!: mongoose.Types.ObjectId;

  @IsString()
  @IsNotEmpty()
  missionCode!: string;

  @IsString()
  @IsNotEmpty()
  type!: string;

  @IsString()
  @IsNotEmpty()
  event!: string;


  data: any;
}
