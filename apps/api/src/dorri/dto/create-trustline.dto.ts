import { IsOptional, IsString, Matches } from 'class-validator';

export class CreateTrustLineDto {
  @IsOptional()
  @IsString()
  @Matches(/^\d+(\.\d{1,6})?$/)
  limit?: string;
}
