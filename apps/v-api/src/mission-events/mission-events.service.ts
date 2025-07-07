import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { MissionEvents, MissionEventsDocument } from '../schemas/mission-events.schema';
import { CreateMissionEventsDto } from './dto/create-mission-events.dto';
import { UpdateMissionEventsDto } from './dto/update-mission-events.dto';
import { MongoGenericCRUDHandler } from '../common/handlers/mongo-generic-crud.handler';
import { IMissionEventsService } from './interfaces/mission-events.interface';

@Injectable()
export class MissionEventsService
    extends MongoGenericCRUDHandler<MissionEventsDocument, CreateMissionEventsDto, UpdateMissionEventsDto>
    implements IMissionEventsService {
    constructor(
        @InjectModel(MissionEvents.name)
        private missionEventsModel: Model<MissionEventsDocument>,
    ) {
        super(missionEventsModel);
    }

    async findByMissionId(missionId: string): Promise<MissionEventsDocument[]> {
        return this.findBy({ missionId });
    }

    async findByMissionCode(missionCode: string): Promise<MissionEventsDocument[]> {
        return this.findBy({ missionCode });
    }

    async findByType(type: string): Promise<MissionEventsDocument[]> {
        return this.findBy({ type });
    }

    async findByEvent(event: string): Promise<MissionEventsDocument[]> {
        return this.findBy({ event });
    }

    async create(createMissionEventsDto: CreateMissionEventsDto): Promise<MissionEventsDocument> {
        // Optionally, add custom validation here
        return super.create(createMissionEventsDto);
    }

    async getMissionEventsStatistics(): Promise<{
        totalMissionEvents: number;
        eventsByType: Record<string, number>;
        eventsByEvent: Record<string, number>;
    }> {
        const totalMissionEvents = await this.count();
        // By type
        interface TypeCount { _id: string; count: number; }
        const eventsByTypeAgg = await this.missionEventsModel.aggregate<TypeCount>([
            { $group: { _id: '$type', count: { $sum: 1 } } }
        ]).exec();
        const eventsByType = eventsByTypeAgg.reduce((acc, item) => {
            acc[item._id] = item.count;
            return acc;
        }, {} as Record<string, number>);
        // By event
        interface EventCount { _id: string; count: number; }
        const eventsByEventAgg = await this.missionEventsModel.aggregate<EventCount>([
            { $group: { _id: '$event', count: { $sum: 1 } } }
        ]).exec();
        const eventsByEvent = eventsByEventAgg.reduce((acc, item) => {
            acc[item._id] = item.count;
            return acc;
        }, {} as Record<string, number>);
        return {
            totalMissionEvents,
            eventsByType,
            eventsByEvent
        };
    }
}
