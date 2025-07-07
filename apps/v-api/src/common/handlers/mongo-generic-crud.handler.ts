import { Injectable, NotFoundException } from '@nestjs/common';
import { Model, Document, Types, FilterQuery, UpdateQuery } from 'mongoose';
import { ICrudService, IPaginationOptions, IPaginatedResult, IFilterOptions } from '../interfaces/crud.interface';

@Injectable()
export abstract class MongoGenericCRUDHandler<T extends Document, CreateDto, UpdateDto>
  implements ICrudService<T, CreateDto, UpdateDto>
{
  constructor(protected readonly model: Model<T>) {}

  async create(createDto: CreateDto): Promise<T> {
    const createdDocument = new this.model(createDto as any);
    return createdDocument.save();
  }

  async findAll(): Promise<T[]> {
    return this.model.find().exec() as Promise<T[]>;
  }

  async findAllWithOptions(
    filters: IFilterOptions<T> = {},
    pagination?: IPaginationOptions,
  ): Promise<T[] | IPaginatedResult<T>> {
    const query = this.model.find(filters);

    if (pagination) {
      const { page = 1, limit = 10, sort = { createdAt: -1 } } = pagination;
      const skip = (page - 1) * limit;

      const [data, total] = await Promise.all([
        query.sort(sort).skip(skip).limit(limit).exec(),
        this.model.countDocuments(filters).exec(),
      ]);

      return {
        data: data as T[],
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit),
      };
    }

    return query.exec() as Promise<T[]>;
  }

  async findOne(id: string): Promise<T> {
    if (!Types.ObjectId.isValid(id)) {
      throw new NotFoundException(`Document with ID ${id} not found`);
    }

    const document = await this.model.findById(id).exec();
    if (!document) {
      throw new NotFoundException(`Document with ID ${id} not found`);
    }
    return document as T;
  }

  async findBy(filters: IFilterOptions<T>): Promise<T[]> {
    return this.model.find(filters).exec() as Promise<T[]>;
  }

  async findOneBy(filters: IFilterOptions<T>): Promise<T> {
    const document = await this.model.findOne(filters).exec();
    if (!document) {
      throw new NotFoundException(`Document not found with the provided filters`);
    }
    return document as T;
  }

  async update(id: string, updateDto: UpdateDto): Promise<T> {
    if (!Types.ObjectId.isValid(id)) {
      throw new NotFoundException(`Document with ID ${id} not found`);
    }

    const updatedDocument = await this.model
      .findByIdAndUpdate(id, updateDto as UpdateQuery<T>, { new: true })
      .exec();

    if (!updatedDocument) {
      throw new NotFoundException(`Document with ID ${id} not found`);
    }
    return updatedDocument as T;
  }

  async remove(id: string): Promise<T> {
    if (!Types.ObjectId.isValid(id)) {
      throw new NotFoundException(`Document with ID ${id} not found`);
    }

    const deletedDocument = await this.model.findByIdAndDelete(id).exec();
    if (!deletedDocument) {
      throw new NotFoundException(`Document with ID ${id} not found`);
    }
    return deletedDocument as T;
  }

  async exists(id: string): Promise<boolean> {
    if (!Types.ObjectId.isValid(id)) {
      return false;
    }
    const document = await this.model.findById(id).select('_id').exec();
    return !!document;
  }

  async count(filters: IFilterOptions<T> = {}): Promise<number> {
    return this.model.countDocuments(filters).exec();
  }

  async bulkCreate(createDtos: CreateDto[]): Promise<T[]> {
    return this.model.insertMany(createDtos as any[]) as Promise<T[]>;
  }

  async bulkDelete(ids: string[]): Promise<void> {
    const validIds = ids.filter(id => Types.ObjectId.isValid(id));
    await this.model.deleteMany({ _id: { $in: validIds } } as FilterQuery<T>).exec();
  }
}
