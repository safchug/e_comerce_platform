import { ApiProperty } from '@nestjs/swagger';

export class ProductCategoriesResponseDto {
  @ApiProperty({
    description: 'Distinct category values currently in the active catalog',
    example: ['Books', 'Electronics', 'Home & Kitchen'],
    type: [String],
  })
  categories!: string[];
}
