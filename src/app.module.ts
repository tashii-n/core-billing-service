// src/app.module.ts
import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { OrganizationModule } from './organization/organization.module';
import { AuthModule } from './auth/auth.module';
import { config } from '@config/config';
import { validationSchema } from '@config/validation';
import { ServicesModule } from './services/services.module';
import { PlansModule } from './plans/plans.module';
import { PlanPricesModule } from './planPrices/plan_prices.modules';
import { PlanEntitlementsModule } from './planEntitlements/plan_entitlements.module';
import { PlanUsageRateModule } from './planUsageRate/plan_usage_rate.module';
import { SubscriptionsModule } from './subscriptions/subscriptions.module';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      load: [config],
      envFilePath: `${process.cwd()}/.env`,
      validationSchema,
    }),
    AuthModule,
    OrganizationModule,
    ServicesModule,
    PlansModule,
    PlanPricesModule,
    PlanEntitlementsModule,
    PlanUsageRateModule,
    SubscriptionsModule,
  ],
})
export class AppModule {}
