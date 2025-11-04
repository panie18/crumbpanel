import { IsString, IsInt, IsOptional, IsBoolean, Min, Max } from 'class-validator';

export class CreateServerDto {
  @IsString()
  name: string;

  @IsString()
  @IsOptional()
  host?: string = 'localhost';

  @IsInt()
  @Min(1024)
  @Max(65535)
  port: number;

  @IsInt()
  @Min(1024)
  @Max(65535)
  rconPort: number;

  @IsString()
  rconPassword: string;

  @IsString()
  version: string;

  @IsInt()
  @IsOptional()
  maxRam?: number = 2048;

  @IsString()
  @IsOptional()
  javaArgs?: string;

  @IsBoolean()
  @IsOptional()
  autoStart?: boolean = false;
}

export class UpdateServerDto {
  @IsString()
  @IsOptional()
  name?: string;

  @IsInt()
  @IsOptional()
  port?: number;

  @IsInt()
  @IsOptional()
  rconPort?: number;

  @IsString()
  @IsOptional()
  rconPassword?: string;

  @IsInt()
  @IsOptional()
  maxRam?: number;

  @IsString()
  @IsOptional()
  javaArgs?: string;

  @IsBoolean()
  @IsOptional()
  autoStart?: boolean;
}
