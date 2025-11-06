import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { AutomationRule } from '../entities/automation-rule.entity';

@Injectable()
export class AutomationService {
  constructor(
    @InjectRepository(AutomationRule)
    private ruleRepository: Repository<AutomationRule>,
  ) {}

  async getRules(serverId: string): Promise<AutomationRule[]> {
    return this.ruleRepository.find({ where: { serverId } });
  }

  async createRule(data: Partial<AutomationRule>): Promise<AutomationRule> {
    const rule = this.ruleRepository.create(data);
    return this.ruleRepository.save(rule);
  }

  async deleteRule(id: string): Promise<void> {
    await this.ruleRepository.delete(id);
  }

  async toggleRule(id: string, enabled: boolean): Promise<AutomationRule> {
    await this.ruleRepository.update(id, { enabled });
    return this.ruleRepository.findOne({ where: { id } });
  }

  async executeRule(rule: AutomationRule): Promise<void> {
    if (!rule.enabled) {
      console.log(`Rule ${rule.name} is disabled, skipping`);
      return;
    }

    console.log(`Executing automation rule: ${rule.name}`);
    
    switch (rule.action) {
      case 'restart_server':
        console.log('Action: Restarting server');
        break;
      case 'send_command':
        console.log('Action: Sending command');
        break;
      case 'create_backup':
        console.log('Action: Creating backup');
        break;
      case 'notify':
        console.log('Action: Sending notification');
        break;
      default:
        console.log('Unknown action:', rule.action);
    }
  }
}
