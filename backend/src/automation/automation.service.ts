import { Injectable } from '@nestjs/common';
import { Cron } from '@nestjs/schedule';

export interface AutomationRule {
  id: string;
  serverId: string;
  name: string;
  trigger: 'player_join' | 'player_leave' | 'server_start' | 'tps_low' | 'schedule';
  condition?: {
    playerName?: string;
    tps?: number;
    cronExpression?: string;
  };
  action: 'run_command' | 'send_webhook' | 'restart_server' | 'broadcast_message';
  actionData: {
    command?: string;
    webhookUrl?: string;
    message?: string;
  };
  enabled: boolean;
}

@Injectable()
export class AutomationService {
  private rules = new Map<string, AutomationRule>();

  /**
   * Register automation rule
   */
  registerRule(rule: AutomationRule) {
    this.rules.set(rule.id, rule);
    console.log(`✅ [AUTOMATION] Rule registered: ${rule.name}`);
  }

  /**
   * Trigger automation based on event
   */
  async triggerEvent(serverId: string, event: string, data: any) {
    const rules = Array.from(this.rules.values())
      .filter(r => r.serverId === serverId && r.trigger === event && r.enabled);

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
    const rules = Array.from(this.rules.values())
      .filter(r => r.trigger === 'schedule' && r.action === 'restart_server' && r.enabled);

    for (const rule of rules) {
      await this.executeRule(rule, {});
    }
  }
}
