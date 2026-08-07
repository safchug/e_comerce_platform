import { ApiProperty } from '@nestjs/swagger';

export class ErrorResponseDto {
  @ApiProperty({ description: 'HTTP status code', example: 400 })
  statusCode!: number;

  @ApiProperty({
    description: 'Human-readable error message',
    oneOf: [
      { type: 'string' },
      { type: 'array', items: { type: 'string' } },
    ],
    example: 'Invalid email or password',
  })
  message!: string | string[];
}
