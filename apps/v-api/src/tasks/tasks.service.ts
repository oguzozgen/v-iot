import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import mongoose from 'mongoose';
import { Task, TaskDocument } from '../schemas/task.schema';
import { CreateTaskDto } from './dto/create-task.dto';
import { UpdateTaskDto } from './dto/update-task.dto';
import { MongoGenericCRUDHandler } from '../common/handlers/mongo-generic-crud.handler';
import { ITasksService } from './interfaces/tasks.interface';

@Injectable()
export class TasksService 
  extends MongoGenericCRUDHandler<TaskDocument, CreateTaskDto, UpdateTaskDto>
  implements ITasksService
{
  constructor(
    @InjectModel(Task.name)
    private taskModel: Model<TaskDocument>,
  ) {
    super(taskModel);
  }

  // Custom methods specific to tasks
  async findByStatus(status: string): Promise<TaskDocument[]> {
    return this.findBy({ taskStatus: status });
  }

  async findByTaskType(taskType: string): Promise<TaskDocument[]> {
    return this.findBy({ taskType });
  }

  // Updated to handle ObjectId instead of string
  async findByTaskGeneratedCode(code: string): Promise<TaskDocument> {
    let taskId: mongoose.Types.ObjectId;
    
    try {
      taskId = new mongoose.Types.ObjectId(code);

    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    } catch (e) {
      throw new NotFoundException(`Invalid task code format: ${code}`);
    }
    
    const task = await this.findOneBy({ taskGeneratedCode: taskId });
    if (!task) {
      throw new NotFoundException(`Task with code ${code} not found`);
    }
    return task;
  }

  async findActiveTasks(): Promise<TaskDocument[]> {
    return this.findBy({ 
      taskStatus: { $nin: ['completed', 'cancelled', 'failed'] } 
    });
  }

  async findTasksNearLocation(
    longitude: number, 
    latitude: number, 
    maxDistance: number = 1000
  ): Promise<TaskDocument[]> {
    return this.taskModel.find({
      $or: [
        {
          startLocation: {
            $near: {
              $geometry: { type: 'Point', coordinates: [longitude, latitude] },
              $maxDistance: maxDistance
            }
          }
        },
        {
          destinationLocation: {
            $near: {
              $geometry: { type: 'Point', coordinates: [longitude, latitude] },
              $maxDistance: maxDistance
            }
          }
        }
      ]
    }).exec() as Promise<TaskDocument[]>;
  }

  // Updated create method - remove taskGeneratedCode validation since it's auto-generated
  async create(createTaskDto: CreateTaskDto): Promise<TaskDocument> {
    // Remove the check for existing task code since it's auto-generated and unique
    // The database will handle uniqueness automatically
    
    // Set default status if not provided
    if (!createTaskDto.taskStatus) {
      createTaskDto.taskStatus = 'created';
    }

    return super.create(createTaskDto);
  }

  // Additional geospatial methods
  async findTasksAlongRoute(
    startLng: number, 
    startLat: number, 
    endLng: number, 
    endLat: number,
    bufferDistance: number = 500
  ): Promise<TaskDocument[]> {
    return this.taskModel.find({
      $or: [
        {
          startLocation: {
            $geoWithin: {
              $centerSphere: [[startLng, startLat], bufferDistance / 6378100]
            }
          }
        },
        {
          destinationLocation: {
            $geoWithin: {
              $centerSphere: [[endLng, endLat], bufferDistance / 6378100]
            }
          }
        }
      ]
    }).exec() as Promise<TaskDocument[]>;
  }

  async updateTaskStatus(id: string, status: string): Promise<TaskDocument> {
    return this.update(id, { taskStatus: status } as UpdateTaskDto);
  }

  async addTaskAchievement(id: string, achievement: string): Promise<TaskDocument> {
    const task = await this.findOne(id);
    const achievements = task.taskAchievements || [];
    
    if (!achievements.includes(achievement)) {
      achievements.push(achievement);
      return this.update(id, { taskAchievements: achievements } as UpdateTaskDto);
    }
    
    return task;
  }
}
