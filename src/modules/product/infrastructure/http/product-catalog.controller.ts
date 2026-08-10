import { Controller, Get, Query, UseFilters } from '@nestjs/common';
import { ApiOkResponse, ApiOperation, ApiTags } from '@nestjs/swagger';
import { ListProductsUseCase } from '../../application/use-cases/list-products.use-case';
import { ListProductsQueryDto } from './dto/list-products-query.dto';
import { PaginatedProductsResponseDto } from './dto/paginated-products-response.dto';
import { toProductResponseDto } from './dto/product-response.dto';
import { ProductDomainExceptionFilter } from './product-domain-exception.filter';

/** Public catalog browsing for shoppers - no auth required. Admin CRUD lives in {@link ProductController}. */
@ApiTags('products')
@Controller('products')
@UseFilters(ProductDomainExceptionFilter)
export class ProductCatalogController {
  constructor(private readonly listProductsUseCase: ListProductsUseCase) {}

  @Get()
  @ApiOperation({ summary: 'Browse active products (paginated)' })
  @ApiOkResponse({
    description: 'A page of active products',
    type: PaginatedProductsResponseDto,
  })
  async list(
    @Query() query: ListProductsQueryDto,
  ): Promise<PaginatedProductsResponseDto> {
    const result = await this.listProductsUseCase.execute({
      page: query.page,
      limit: query.limit,
      name: query.name,
      category: query.category,
      minPriceCents: query.minPriceCents,
      maxPriceCents: query.maxPriceCents,
    });

    return {
      data: result.items.map((product) => toProductResponseDto(product)),
      meta: {
        total: result.total,
        page: result.page,
        limit: result.limit,
        totalPages: result.totalPages,
        hasNextPage: result.page * result.limit < result.total,
      },
    };
  }
}
