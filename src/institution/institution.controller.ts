import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
  UseInterceptors,
  UploadedFile,
  ParseFilePipe,
  MaxFileSizeValidator,
  FileTypeValidator,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { InstitutionService } from './institution.service';
import { InstitutionPostDto } from './dto/institution-post.dto';
import { UpdateInstitutionDto } from './dto/update-institution.dto';
import { InstitutionPatchDto } from './dto/insitution-patch.dto';
import { UseGuards } from '@nestjs/common';
import { JwtAuthGuard } from 'src/auth/jwt-auth.guard';

@UseGuards(JwtAuthGuard)
@Controller('institution')
export class InstitutionController {
  constructor(private readonly institutionService: InstitutionService) {}

  @Post()
  @UseInterceptors(FileInterceptor('logo'))
  create(
    @Body() institutionPostDto: InstitutionPostDto,
    @UploadedFile(
      new ParseFilePipe({
        fileIsRequired: false,
        validators: [
          new MaxFileSizeValidator({ maxSize: 500_000 }),
          new FileTypeValidator({ fileType: /^image\/(png|jpeg|webp)$/ }),
        ],
      }),
    )
    logo?: Express.Multer.File, // the file
  ) {
    return (async () => {
      let logo_url = '';
      if (logo) {
        logo_url = await this.institutionService.uploadFile(logo);
      }
      const { name, kind } = institutionPostDto;
      return this.institutionService.create({ name, kind, logo_url });
    })();
  }

  @Get()
  findAll() {
    return this.institutionService.findAll();
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.institutionService.findOne(id);
  }

  @Patch(':id')
  @UseInterceptors(FileInterceptor('logo'))
  update(
    @Param('id') id: string,
    @Body() body: InstitutionPatchDto,
    @UploadedFile(
      new ParseFilePipe({
        fileIsRequired: false,
        validators: [
          new MaxFileSizeValidator({ maxSize: 500_000 }),
          new FileTypeValidator({ fileType: /^image\/(png|jpeg|webp)$/ }),
        ],
      }),
    )
    logo?: Express.Multer.File,
  ) {
    return (async () => {
      const { name, kind } = body;
      const updateData: UpdateInstitutionDto = {} as UpdateInstitutionDto;
      if (typeof name !== 'undefined') updateData.name = name as any;
      if (typeof kind !== 'undefined') updateData.kind = kind as any;

      if (logo) {
        const existing = await this.institutionService.findOneRaw(id);
        if (existing?.logo_url) {
          await this.institutionService.deleteFile(existing.logo_url);
        }
        const newPath = await this.institutionService.uploadFile(logo);
        (updateData as any).logo_url = newPath;
      }

      if (Object.keys(updateData).length === 0) {
        return this.institutionService.findOne(id);
      }

      const updated = await this.institutionService.update(id, updateData);
      // Return with public logo URL like findOne
      return this.institutionService.findOne(id);
    })();
  }

  @Delete(':id')
  remove(@Param('id') id: string) {
    return this.institutionService.remove(id);
  }
}
