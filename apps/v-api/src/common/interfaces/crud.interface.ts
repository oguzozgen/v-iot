import { Document, FilterQuery } from 'mongoose';

export interface ICrudService<T extends Document, CreateDto, UpdateDto> {
  create(createDto: CreateDto): Promise<T>;
  findAll(): Promise<T[]>;
  findOne(id: string): Promise<T>;
  update(id: string, updateDto: UpdateDto): Promise<T>;
  remove(id: string): Promise<T>;
}

export interface IPaginationOptions {
  page?: number;
  limit?: number;
  sort?: Record<string, 1 | -1>;
}

export interface IPaginatedResult<T> {
  data: T[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

export type IFilterOptions<T> = FilterQuery<T>;
