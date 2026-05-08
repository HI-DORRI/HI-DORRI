import { IsString } from 'class-validator';

export class ChargeDorriDto {
  @IsString()
  quoteId!: string;
}
