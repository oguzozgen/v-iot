import { IsString, IsNotEmpty, IsOptional, IsArray, ValidateNested } from 'class-validator';
import { Type } from 'class-transformer';

class GeoPointDto {
    @IsString()
    @IsNotEmpty()
    type!: 'Point';

    @IsArray()
    @IsNotEmpty()
    coordinates!: [number, number, number]; // [longitude, latitude, altitude]
}

class GeoLineStringDto {
    @IsString()
    @IsNotEmpty()
    type!: 'LineString';

    @IsArray()
    @IsNotEmpty()
    coordinates!: [number, number, number][]; // Array of [longitude, latitude, altitude]
}

export class CreateTaskDto {
    @IsString()
    @IsNotEmpty()
    name: string;

    @ValidateNested()
    @Type(() => GeoPointDto)
    startLocation!: GeoPointDto;

    @ValidateNested()
    @Type(() => GeoPointDto)
    destinationLocation!: GeoPointDto;

    @IsString()
    @IsNotEmpty()
    taskType!: string;

    @IsString()
    @IsOptional()
    taskStatus?: string;

    @IsArray()
    @IsOptional()
    taskAchievements?: string[];

    @ValidateNested()
    @Type(() => GeoLineStringDto)
    taskRouteLineString!: GeoLineStringDto;
}
