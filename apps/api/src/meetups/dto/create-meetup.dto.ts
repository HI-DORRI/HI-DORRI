import { MeetupStatus, MeetupType } from '@prisma/client';
import {
  IsArray,
  IsEnum,
  IsInt,
  IsISO8601,
  IsOptional,
  IsString,
  Matches,
  Min,
} from 'class-validator';

export class CreateMeetupDto {
  @IsString()
  title!: string;

  @IsString()
  description!: string;

  @IsOptional()
  @IsString()
  imageUrl?: string;

  @IsString()
  locationName!: string;

  @IsString()
  address!: string;

  @IsOptional()
  @IsString()
  mapImageUrl?: string;

  @IsISO8601()
  startsAt!: string;

  @IsISO8601()
  endsAt!: string;

  @IsEnum(MeetupType)
  type!: MeetupType;

  @IsOptional()
  @IsString()
  @Matches(/^\d+(\.\d{1,6})?$/)
  depositDorri?: string;

  @IsOptional()
  @IsString()
  @Matches(/^\d+(\.\d{1,6})?$/)
  entryFeeDorri?: string;

  @IsInt()
  @Min(1)
  capacity!: number;

  @IsOptional()
  @IsEnum(MeetupStatus)
  status?: MeetupStatus;

  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  tags?: string[];
}
