import {
  Body,
  Controller,
  Delete,
  HttpCode,
  Param,
  Patch,
  Post,
  UseFilters,
  UseGuards,
} from '@nestjs/common';
import {
  ApiBearerAuth,
  ApiConflictResponse,
  ApiCreatedResponse,
  ApiForbiddenResponse,
  ApiNoContentResponse,
  ApiNotFoundResponse,
  ApiOkResponse,
  ApiOperation,
  ApiTags,
  ApiUnauthorizedResponse,
} from '@nestjs/swagger';
import { UserRole } from '../../../user/domain/user-role.enum';
import { JwtAuthGuard } from '../../../user/infrastructure/http/guards/jwt-auth.guard';
import { RolesGuard } from '../../../user/infrastructure/http/guards/roles.guard';
import { Roles } from '../../../user/infrastructure/http/decorators/roles.decorator';
import { ErrorResponseDto } from '../../../../infrastructure/http/dto/error-response.dto';
import { CreateProductUseCase } from '../../application/use-cases/create-product.use-case';
import { UpdateProductUseCase } from '../../application/use-cases/update-product.use-case';
import { DeleteProductUseCase } from '../../application/use-cases/delete-product.use-case';
import { Product } from '../../domain/product.entity';
import { ProductDomainExceptionFilter } from './product-domain-exception.filter';
import { CreateProductDto } from './dto/create-product.dto';
import { UpdateProductDto } from './dto/update-product.dto';
import { ProductResponseDto } from './dto/product-response.dto';

/** Admin-only: catalog browsing endpoints for shoppers land separately with US-015/016. */
@ApiTags('products')
@ApiBearerAuth()
@ApiUnauthorizedResponse({
  description: 'Missing or invalid access token',
  type: ErrorResponseDto,
})
@ApiForbiddenResponse({
  description: 'Caller does not have the ADMIN role',
  type: ErrorResponseDto,
})
@Controller('products')
@UseFilters(ProductDomainExceptionFilter)
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles(UserRole.ADMIN)
export class ProductController {
  constructor(
    private readonly createProductUseCase: CreateProductUseCase,
    private readonly updateProductUseCase: UpdateProductUseCase,
    private readonly deleteProductUseCase: DeleteProductUseCase,
  ) {}

  @Post()
  @ApiOperation({ summary: 'Create a product' })
  @ApiCreatedResponse({
    description: 'The created product',
    type: ProductResponseDto,
  })
  @ApiConflictResponse({
    description: 'SKU already in use',
    type: ErrorResponseDto,
  })
  async create(@Body() dto: CreateProductDto): Promise<ProductResponseDto> {
    const product = await this.createProductUseCase.execute(dto);
    return this.toResponse(product);
  }

  @Patch(':id')
  @ApiOperation({ summary: 'Update a product' })
  @ApiOkResponse({
    description: 'The updated product',
    type: ProductResponseDto,
  })
  @ApiNotFoundResponse({
    description: 'Product not found',
    type: ErrorResponseDto,
  })
  async update(
    @Param('id') id: string,
    @Body() dto: UpdateProductDto,
  ): Promise<ProductResponseDto> {
    const product = await this.updateProductUseCase.execute(id, dto);
    return this.toResponse(product);
  }

  @Delete(':id')
  @HttpCode(204)
  @ApiOperation({ summary: 'Delete a product' })
  @ApiNoContentResponse({ description: 'Product deleted' })
  @ApiNotFoundResponse({
    description: 'Product not found',
    type: ErrorResponseDto,
  })
  async delete(@Param('id') id: string): Promise<void> {
    await this.deleteProductUseCase.execute(id);
  }

  private toResponse(product: Product): ProductResponseDto {
    return {
      id: product.id,
      sku: product.sku,
      name: product.name,
      description: product.description,
      priceCents: product.price.getCents(),
      currency: product.price.getCurrency(),
      active: product.active,
      createdAt: product.createdAt,
      updatedAt: product.updatedAt,
    };
  }
}
