import { IsString, Matches } from 'class-validator';

export class CreateChargeQuoteDto {
  @IsString()
  @Matches(/^[A-Z]{3}$/)
  fiatCurrency!: string;

  @IsString()
  @Matches(/^\d+(\.\d{1,6})?$/)
  fiatAmount!: string;
}
