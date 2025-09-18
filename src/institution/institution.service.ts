import { Injectable } from '@nestjs/common';
import { randomBytes } from 'crypto';
import { extname } from 'path';
import { CreateInstitutionDto } from './dto/create-institution.dto.js';
import { UpdateInstitutionDto } from './dto/update-institution.dto.js';
import { SupabaseService } from '../supabase/supabase.service.js';
import { PrismaService } from '../prisma/prisma.service.js';

@Injectable()
export class InstitutionService {
  constructor(
    private readonly supabaseService: SupabaseService,
    private readonly prismaService: PrismaService,
  ) {}

  async deleteFile(path: string): Promise<void> {
    const { error } = await this.supabaseService.client.storage
      .from('institution-logos')
      .remove([path]);
    if (error) throw error;
  }

  async uploadFile(file: Express.Multer.File): Promise<string> {
    if (!file) throw new Error('No file provided');
    const ext = extname(file.originalname);
    const randomName = randomBytes(16).toString('hex') + ext;
    const path = `logos/${randomName}`;
    const { error } = await this.supabaseService.client.storage
      .from('institution-logos')
      .upload(path, file.buffer, { upsert: true, contentType: file.mimetype });
    if (error) throw error;
    return path;
  }

  async create(createInstitutionDto: CreateInstitutionDto) {
    const { name, kind, logo_url } = createInstitutionDto;
    return await this.prismaService.institutions.create({
      data: {
        name,
        kind,
        logo_url,
      },
    });
  }

  async findAll() {
    const institutions = await this.prismaService.institutions.findMany();
    return institutions.map((inst) => ({
      ...inst,
      logo_url: inst.logo_url
        ? this.supabaseService.client.storage
            .from('institution-logos')
            .getPublicUrl(inst.logo_url).data.publicUrl
        : null,
    }));
  }

  async findOne(id: string) {
    const institution = await this.prismaService.institutions.findUnique({
      where: { id },
    });
    if (!institution) return null;
    return {
      ...institution,
      logo_url: institution.logo_url
        ? this.supabaseService.client.storage
            .from('institution-logos')
            .getPublicUrl(institution.logo_url).data.publicUrl
        : null,
    };
  }

  async findOneRaw(id: string) {
    return this.prismaService.institutions.findUnique({ where: { id } });
  }

  async update(id: string, updateInstitutionDto: UpdateInstitutionDto) {
    try {
      return await this.prismaService.institutions.update({
        where: { id },
        data: updateInstitutionDto,
      });
    } catch (error) {
      throw new Error(`Institution with id ${id} not found.`);
    }
  }

  async remove(id: string) {
    return await this.prismaService.institutions.delete({
      where: { id },
    });
  }
}
