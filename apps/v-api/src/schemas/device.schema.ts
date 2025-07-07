import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { HydratedDocument } from 'mongoose';
import * as mongoose from 'mongoose';

export type DeviceDocument = HydratedDocument<Device>;

@Schema({
  timestamps: true,
  strict: 'throw',
  versionKey: false,
  autoIndex: false,
})
export class Device {
  @Prop({
    type: mongoose.Schema.Types.ObjectId,
    unique: true,
    required: true,
    auto: true,
  })
  deviceId: mongoose.Types.ObjectId;

  @Prop({ required: true })
  name: string;

  @Prop({ required: true })
  deviceModel: string;
  
  @Prop({ required: false, default: "JS" })
  platform: string;

  @Prop({
    type: [String],
    required: false,
    default: [],
  })
  availableFrameworkVersions: string[];
}

export const DeviceSchema = SchemaFactory.createForClass(Device);