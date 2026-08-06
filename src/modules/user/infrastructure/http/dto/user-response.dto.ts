import { ApiProperty } from '@nestjs/swagger';
import { UserRole } from '../../../domain/user-role.enum';

export class UserResponseDto {
  @ApiProperty({
    description: 'Unique identifier of the user',
    example: '3f6a9b2e-8c1d-4e3a-9f5b-1a2b3c4d5e6f',
  })
  id!: string;

  @ApiProperty({
    description: 'Email address of the user',
    example: 'jane.doe@example.com',
  })
  email!: string;

  @ApiProperty({
    description: 'Role assigned to the user',
    enum: UserRole,
    example: UserRole.CUSTOMER,
  })
  role!: UserRole;
}
