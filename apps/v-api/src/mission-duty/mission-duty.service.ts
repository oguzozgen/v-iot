import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { MissionDuty, MissionDutyDocument } from '../schemas/mission-duty.schema';
import { CreateMissionDutyDto } from './dto/create-mission-duty.dto';
import { UpdateMissionDutyDto } from './dto/update-mission-duty.dto';
import { MongoGenericCRUDHandler } from '../common/handlers/mongo-generic-crud.handler';
import { IMissionDutyService } from './interfaces/mission-duty.interface';

@Injectable()
export class MissionDutyService
    extends MongoGenericCRUDHandler<MissionDutyDocument, CreateMissionDutyDto, UpdateMissionDutyDto>
    implements IMissionDutyService {
    constructor(
        @InjectModel(MissionDuty.name)
        private missionDutyModel: Model<MissionDutyDocument>,
    ) {
        super(missionDutyModel);
    }

    // Custom methods specific to mission-duty
    async findByMissionCode(missionCode: string): Promise<MissionDutyDocument[]> {
        console.log(`Finding MissionDuty by missionCode: ${missionCode}`);
        return this.findBy({ missionCode });
    }

    async findByTaskGeneratedCode(taskGeneratedCode: string): Promise<MissionDutyDocument[]> {
        return this.findBy({ taskGeneratedCode });
    }

    async findByVin(vin: string): Promise<MissionDutyDocument[]> {
        return this.findBy({ vin });
    }

    async findByVinDispatched(vin: string): Promise<MissionDutyDocument[]> {
        return this.findBy({ vin: vin, dispatched: true });
    }

    // Override create method for custom validation
    async create(createMissionDutyDto: CreateMissionDutyDto): Promise<MissionDutyDocument> {
        // Check if missionCode already exists
        const existing = await this.missionDutyModel.findOne({
            missionCode: createMissionDutyDto.missionCode
        }).exec();
        if (existing) {
            throw new Error(`MissionDuty with missionCode ${createMissionDutyDto.missionCode} already exists`);
        }
        return super.create(createMissionDutyDto);
    }

    // Example: find by missionCode and vin
    async findByMissionCodeAndVin(missionCode: string, vin: string): Promise<MissionDutyDocument[]> {
        return this.findBy({ missionCode, vin });
    }

    // Example: statistics for mission-duties
    async getMissionDutyStatistics(): Promise<{
        totalMissionDuties: number;
        dutiesByVin: Record<string, number>;
        dutiesByStatus: Record<string, number>;
    }> {
        const totalMissionDuties = await this.count();
        // By vin
        interface VinCount { _id: string; count: number; }
        const dutiesByVinAgg = await this.missionDutyModel.aggregate<VinCount>([
            { $group: { _id: '$vin', count: { $sum: 1 } } }
        ]).exec();
        const dutiesByVin = dutiesByVinAgg.reduce((acc, item) => {
            acc[item._id] = item.count;
            return acc;
        }, {} as Record<string, number>);
        // By status
        interface StatusCount { _id: string; count: number; }
        const dutiesByStatusAgg = await this.missionDutyModel.aggregate<StatusCount>([
            { $group: { _id: '$status', count: { $sum: 1 } } }
        ]).exec();
        const dutiesByStatus = dutiesByStatusAgg.reduce((acc, item) => {
            acc[item._id] = item.count;
            return acc;
        }, {} as Record<string, number>);
        return {
            totalMissionDuties,
            dutiesByVin,
            dutiesByStatus
        };
    }
}
