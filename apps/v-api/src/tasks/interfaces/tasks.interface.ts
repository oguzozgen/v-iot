import { TaskDocument } from '../../schemas/task.schema';
import { CreateTaskDto } from '../dto/create-task.dto';
import { UpdateTaskDto } from '../dto/update-task.dto';
import { ICrudService } from '../../common/interfaces/crud.interface';

export interface ITasksService 
  extends ICrudService<TaskDocument, CreateTaskDto, UpdateTaskDto> {
  findByStatus(status: string): Promise<TaskDocument[]>;
  findByTaskType(taskType: string): Promise<TaskDocument[]>;
  findByTaskGeneratedCode(code: string): Promise<TaskDocument>;
  findActiveTasks(): Promise<TaskDocument[]>;
  findTasksNearLocation(longitude: number, latitude: number, maxDistance: number): Promise<TaskDocument[]>;
}
