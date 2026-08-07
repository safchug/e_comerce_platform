import { ApiProperty } from '@nestjs/swagger';
import { UserResponseDto } from './user-response.dto';
import { TokenPairDto } from './token-pair.dto';

export class LoginResponseDto extends TokenPairDto {
  @ApiProperty({ description: 'The authenticated user', type: UserResponseDto })
  user!: UserResponseDto;
}
