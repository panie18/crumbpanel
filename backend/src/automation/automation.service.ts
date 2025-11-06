import { Injectable } from '@nestjs/common';
import { Cron } from '@nestjs/schedule';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { AutomationRule } from '../entities/automation-rule.entity';

@Injectable()
export class AutomationService {
  constructor(
    @InjectRepository(AutomationRule)
    private ruleRepository: Repository<AutomationRule>,
  ) {}

  /**
   * Register automation rule
   */
  registerRule(rule: AutomationRule) {
    this.ruleRepository.save(rule);
    console.log(`✅ [AUTOMATION] Rule registered: ${rule.name}`);
  }

  /**
   * Trigger automation based on event
   */
  async triggerEvent(serverId: string, event: string, data: any) {
    const rules = await this.ruleRepository.find({ where: { serverId, trigger: event, enabled: true } });

    for (const rule of rules) {
      await this.executeRule(rule, data);
    }
  }

  /**
   * Execute automation rule
   */
  private async executeRule(rule: AutomationRule, eventData: any) {
    console.log(`🤖 [AUTOMATION] Executing rule: ${rule.name}`);

    switch (rule.action) {
      case 'run_command':
        if (rule.actionData.command) {
          console.log(`📝 [AUTOMATION] Running command: ${rule.actionData.command}`);
          // TODO: Send command to server
        }
        break;

      case 'broadcast_message':
        if (rule.actionData.message) {
          console.log(`📢 [AUTOMATION] Broadcasting: ${rule.actionData.message}`);
          // TODO: Broadcast to server
        }
        break;

      case 'send_webhook':
        if (rule.actionData.webhookUrl) {
          console.log(`🔔 [AUTOMATION] Sending webhook notification`);
          // TODO: Send webhook
        }
        break;

      case 'restart_server':
        console.log(`🔄 [AUTOMATION] Restarting server`);
        // TODO: Restart server
        break;
    }
  }

  /**
   * Example: Auto-restart every 6 hours
   */
  @Cron('0 */6 * * *')
  async scheduledRestart() {
    const rules = await this.ruleRepository.find({ where: { trigger: 'schedule', action: 'restart_server', enabled: true } });

    for (const rule of rules) {
      await this.executeRule(rule, {});
    }
  }
}
