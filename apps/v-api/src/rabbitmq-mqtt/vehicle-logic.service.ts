import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { MissionDutyService } from 'src/mission-duty/mission-duty.service';

@Injectable()
export class VehicleLogicService {
    constructor(
        private readonly configService: ConfigService,
        private readonly missionDutyService: MissionDutyService
    ) {
        // Now you can use this.missionDutyService in your methods
    }

    async handleDemandTaskRequest(vin: string): Promise<boolean> {
        const missionRecords = await this.missionDutyService.findByVinDispatched(vin);
        return missionRecords.length > 0;
    }
}