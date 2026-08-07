import { ApiProperty } from '@nestjs/swagger';

export class AdminMessageDto {
  @ApiProperty({ example: 'Admin access confirmed' })
  message!: string;
}
