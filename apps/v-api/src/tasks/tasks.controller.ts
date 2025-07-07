import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
  HttpStatus,
  HttpCode,
  Query,
  ParseFloatPipe,
  ParseIntPipe,
} from '@nestjs/common';
import { TasksService } from './tasks.service';
import { CreateTaskDto } from './dto/create-task.dto';
import { UpdateTaskDto } from './dto/update-task.dto';

@Controller('tasks')
export class TasksController {
  constructor(private readonly tasksService: TasksService) {}

  @Post()
  @HttpCode(HttpStatus.CREATED)
  create(@Body() createTaskDto: CreateTaskDto) {
    return this.tasksService.create(createTaskDto);
  }

  @Get()
  findAll() {
    return this.tasksService.findAll();
  }

  @Get('active')
  findActiveTasks() {
    return this.tasksService.findActiveTasks();
  }

  @Get('status/:status')
  findByStatus(@Param('status') status: string) {
    return this.tasksService.findByStatus(status);
  }

  @Get('type/:taskType')
  findByTaskType(@Param('taskType') taskType: string) {
    return this.tasksService.findByTaskType(taskType);
  }

  // Updated to handle ObjectId parameter
  @Get('code/:code')
  findByTaskGeneratedCode(@Param('code') code: string) {
    return this.tasksService.findByTaskGeneratedCode(code);
  }

  @Get('near')
  findTasksNearLocation(
    @Query('longitude', ParseFloatPipe) longitude: number,
    @Query('latitude', ParseFloatPipe) latitude: number,
    @Query('maxDistance', new ParseIntPipe({ optional: true })) maxDistance?: number,
  ) {
    return this.tasksService.findTasksNearLocation(longitude, latitude, maxDistance);
  }

  @Get('along-route')
  findTasksAlongRoute(
    @Query('startLng', ParseFloatPipe) startLng: number,
    @Query('startLat', ParseFloatPipe) startLat: number,
    @Query('endLng', ParseFloatPipe) endLng: number,
    @Query('endLat', ParseFloatPipe) endLat: number,
    @Query('bufferDistance', new ParseIntPipe({ optional: true })) bufferDistance?: number,
  ) {
    return this.tasksService.findTasksAlongRoute(startLng, startLat, endLng, endLat, bufferDistance);
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.tasksService.findOne(id);
  }

  @Patch(':id')
  update(@Param('id') id: string, @Body() updateTaskDto: UpdateTaskDto) {
    return this.tasksService.update(id, updateTaskDto);
  }

  @Patch(':id/status')
  updateTaskStatus(
    @Param('id') id: string,
    @Body('status') status: string,
  ) {
    return this.tasksService.updateTaskStatus(id, status);
  }

  @Patch(':id/achievement')
  addTaskAchievement(
    @Param('id') id: string,
    @Body('achievement') achievement: string,
  ) {
    return this.tasksService.addTaskAchievement(id, achievement);
  }

  @Delete(':id')
  @HttpCode(HttpStatus.NO_CONTENT)
  remove(@Param('id') id: string) {
    return this.tasksService.remove(id);
  }
}
