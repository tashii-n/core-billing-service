import { ApiProperty } from "@nestjs/swagger";
import { IsIn, IsInt, IsNotEmpty, IsString } from "class-validator";

export class CreateUsageDto {
  @ApiProperty({
    example: "did:org:test-001",
    description: "Organization DID",
  })
  @IsString()
  @IsNotEmpty()
  orgDid!: string;

  @ApiProperty({
    example: 1,
    description: "Service ID",
  })
  @IsInt()
  serviceId!: number;

  @ApiProperty({
    example: "SUCCESS",
    enum: ["SUCCESS", "FAILED"],
    description: "Result of the usage",
  })
  @IsString()
  @IsIn(["SUCCESS", "FAILED"])
  result!: "SUCCESS" | "FAILED";

  @ApiProperty({
    example: "thread-abc-123",
    description: "Unique thread ID for idempotency",
  })
  @IsString()
  @IsNotEmpty()
  threadId!: string;
}
