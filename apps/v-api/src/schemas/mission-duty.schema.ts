import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import mongoose, { HydratedDocument } from 'mongoose';

export type MissionDutyDocument = HydratedDocument<MissionDuty>;

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
export class MissionDuty {
    @Prop({
        type: String,
        unique: true,
        required: true,
    })
    missionCode: string;

    @Prop({
        type: mongoose.Schema.Types.ObjectId,
        required: true,
    })
    taskGeneratedCode: mongoose.Types.ObjectId;

    @Prop({
        type: mongoose.Schema.Types.ObjectId,
        required: true,
    })
    vin: mongoose.Types.ObjectId;
    
    
    @Prop({
        type: String,
        required: false,
        default: 'created',
    })
    status: string;

    @Prop({
        type: Boolean,
        required: false,
        default: false,
    })
    dispatched: boolean;

    @Prop({
        type: Date,
        required: false,
        default: null,
    })
    dispatchedAt: Date;

    @Prop({
        type: {
            taskGeneratedCode: {
                type: mongoose.Schema.Types.ObjectId,
                required: true,
            },
            name: {
                type: String,
                required: false,
            },
            startLocation: {
                type: {
                    type: String,
                    enum: ['Point'],
                    required: true
                },
                coordinates: {
                    type: [Number],
                    required: true
                }
            },
            destinationLocation: {
                type: {
                    type: String,
                    enum: ['Point'],
                    required: true
                },
                coordinates: {
                    type: [Number],
                    required: true
                }
            },
            taskType: {
                type: String,
                required: true,
            },
            taskStatus: {
                type: String,
                required: true,
                default: 'created',
            },
            taskAchievements: {
                type: [String],
                required: false,
                default: [],
            },
            taskRouteLineString: {
                type: {
                    type: String,
                    enum: ['LineString'],
                    required: true
                },
                coordinates: {
                    type: [[Number]],
                    required: true
                }
            }
        },
        required: true,
    })
    taskDispatched: {
        taskGeneratedCode: mongoose.Types.ObjectId;
        name?: string;
        startLocation: GeoPoint;
        destinationLocation: GeoPoint;
        taskType: string;
        taskStatus: string;
        taskAchievements: string[];
        taskRouteLineString: GeoLineString;
    };



}

export const MissionDutySchema = SchemaFactory.createForClass(MissionDuty);

// Create indexes
MissionDutySchema.index({ missionCode: 1 });
MissionDutySchema.index({ taskGeneratedCode: 1 });
MissionDutySchema.index({ vin: 1 });
MissionDutySchema.index({ 'dispatched.startLocation': '2dsphere' });
MissionDutySchema.index({ 'dispatched.destinationLocation': '2dsphere' });
MissionDutySchema.index({ 'dispatched.taskRouteLineString': '2dsphere' });