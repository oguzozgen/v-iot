import { MissionEventsDocument } from '../../schemas/mission-events.schema';
import { CreateMissionEventsDto } from '../dto/create-mission-events.dto';
import { UpdateMissionEventsDto } from '../dto/update-mission-events.dto';
import { ICrudService } from '../../common/interfaces/crud.interface';

export interface IMissionEventsService extends ICrudService<MissionEventsDocument, CreateMissionEventsDto, UpdateMissionEventsDto> {
    findByMissionId(missionId: string): Promise<MissionEventsDocument[]>;
    findByMissionCode(missionCode: string): Promise<MissionEventsDocument[]>;
    findByType(type: string): Promise<MissionEventsDocument[]>;
    findByEvent(event: string): Promise<MissionEventsDocument[]>;
    getMissionEventsStatistics(): Promise<{
        totalMissionEvents: number;
        eventsByType: Record<string, number>;
        eventsByEvent: Record<string, number>;
    }>;
}
