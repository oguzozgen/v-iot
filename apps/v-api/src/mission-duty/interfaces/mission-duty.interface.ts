import { MissionDutyDocument } from '../../schemas/mission-duty.schema';
import { CreateMissionDutyDto } from '../dto/create-mission-duty.dto';
import { UpdateMissionDutyDto } from '../dto/update-mission-duty.dto';
import { ICrudService } from '../../common/interfaces/crud.interface';

export interface IMissionDutyService
    extends ICrudService<MissionDutyDocument, CreateMissionDutyDto, UpdateMissionDutyDto> {
    findByMissionCode(missionCode: string): Promise<MissionDutyDocument[]>;
    findByTaskGeneratedCode(taskGeneratedCode: string): Promise<MissionDutyDocument[]>;
    findByVin(vin: string): Promise<MissionDutyDocument[]>;
    findByVinDispatched(vin: string): Promise<MissionDutyDocument[]>;
    findByMissionCodeAndVin(missionCode: string, vin: string): Promise<MissionDutyDocument[]>;
    getMissionDutyStatistics(): Promise<{
        totalMissionDuties: number;
        dutiesByVin: Record<string, number>;
        dutiesByStatus: Record<string, number>;
    }>;
}
