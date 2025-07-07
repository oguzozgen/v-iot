import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import mongoose, { HydratedDocument } from 'mongoose';

export type TaskDocument = HydratedDocument<Task>;

// GeoJSON Point interface
interface GeoPoint {
    type: 'Point';
    coordinates: [number, number, number]; // [longitude, latitude, altitude]
}

// GeoJSON LineString interface
interface GeoLineString {
    type: 'LineString';
    coordinates: [number, number, number][]; // Array of [longitude, latitude, altitude]
}

@Schema({
    timestamps: true,
    strict: 'throw',
    versionKey: false,
    autoIndex: false,
})
export class Task {
    @Prop({
        type: mongoose.Schema.Types.ObjectId,
        unique: true,
        required: true,
        auto: true,
    })
    taskGeneratedCode: mongoose.Types.ObjectId;

    @Prop({ required: false })
    name: string;

    @Prop({
        type: {
            type: String,
            enum: ['Point'],
            required: true
        },
        coordinates: {
            type: [Number],
            required: true
        }
    })
    startLocation: GeoPoint;

    @Prop({
        type: {
            type: String,
            enum: ['Point'],
            required: true
        },
        coordinates: {
            type: [Number],
            required: true
        }
    })
    destinationLocation: GeoPoint;

    @Prop({ required: true })
    taskType: string;

    @Prop({
        required: true,
        default: 'created',
    })
    taskStatus: string;

    @Prop({
        type: [String],
        required: false,
        default: [],
    })
    taskAchievements: string[];

    @Prop({
        type: {
            type: String,
            enum: ['LineString'],
            required: true
        },
        coordinates: {
            type: [[Number]],
            required: true
        }
    })
    taskRouteLineString: GeoLineString;
}

export const TaskSchema = SchemaFactory.createForClass(Task);

// geospatial indexes
TaskSchema.index({ startLocation: '2dsphere' });
TaskSchema.index({ destinationLocation: '2dsphere' });
TaskSchema.index({ taskRouteLineString: '2dsphere' });