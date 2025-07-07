import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import mongoose, { HydratedDocument } from 'mongoose';

export type MissionEventsDocument = HydratedDocument<MissionEvents>;

@Schema({
    timestamps: true,
    strict: 'throw',
    versionKey: false,
    autoIndex: false,
})
export class MissionEvents {
    @Prop({
        type: mongoose.Schema.Types.ObjectId,
        required: true,
    })
    missionId: mongoose.Types.ObjectId;

    @Prop({
        type: String,
        required: true,
    })
    missionCode: string;

    @Prop({
        type: String,
        required: true,
    })
    type: string;

    @Prop({
        type: String,
        required: true,
    })
    event: string;
    
    @Prop({
        type: mongoose.Schema.Types.Mixed,
        required: true,
    })
    data: any;
}

export const MissionEventsSchema = SchemaFactory.createForClass(MissionEvents);