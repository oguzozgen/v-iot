import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { HydratedDocument } from 'mongoose';
import * as mongoose from 'mongoose';

export type VehicleRegistriesDocument = HydratedDocument<VehicleRegistries>;

@Schema({
  timestamps: true,
  strict: 'throw',
  versionKey: false,
  autoIndex: false,
})
export class VehicleRegistries {
  @Prop({
    type: mongoose.Schema.Types.ObjectId,
    unique: true,
    required: true,
    auto: true,
  })
  vin: mongoose.Types.ObjectId;

  @Prop({ required: true })
  name: string;

  @Prop({ required: true })
  vehicleModel: string;

  // Add MQTT credentials
  @Prop({
    type: {
      username: { type: String, required: true },
      password: { type: String, required: true }, // Store encrypted
      clientId: { type: String, required: true },
      createdAt: { type: Date, default: Date.now },
    },
    required: false,
    select: true, // Don't include in normal queries for security. FOR DEMO PURPOSES ONLY THIS TRUE
  })
  mqttCredentials?: {
    username: string;
    password: string;
    clientId: string;
    createdAt: Date;
  };

  @Prop({ required: false, default: false })
  isMqttCredentialsSet: boolean;

  @Prop({
    type: {
      name: { type: String, required: true },
      model: { type: String, required: true },
      firmwareVersion: { type: String, required: true },
      platform: { type: String, required: true },
    },
    required: true,
  })
  device: {
    name: string;
    model: string;
    firmwareVersion: string;
    platform: string;
  }
}

export const VehicleRegistriesSchema = SchemaFactory.createForClass(VehicleRegistries);