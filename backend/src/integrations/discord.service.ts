import { Injectable } from '@nestjs/common';

export interface DiscordWebhookConfig {
  webhookUrl: string;
  events: {
    serverStart: boolean;
    serverStop: boolean;
    playerJoin: boolean;
    playerLeave: boolean;
    chat: boolean;
  };
}

@Injectable()
export class DiscordService {
  private webhooks = new Map<string, DiscordWebhookConfig>();

  /**
   * Register Discord webhook for a server
   */
  registerWebhook(serverId: string, config: DiscordWebhookConfig) {
    this.webhooks.set(serverId, config);
    console.log(`✅ [DISCORD] Webhook registered for server ${serverId}`);
  }

  /**
   * Send server start notification
   */
  async notifyServerStart(serverId: string, serverName: string) {
    const config = this.webhooks.get(serverId);
    if (!config?.events.serverStart) return;

    await this.sendWebhook(config.webhookUrl, {
      embeds: [{
        title: '🟢 Server Started',
        description: `**${serverName}** is now online!`,
        color: 0x00ff00,
        timestamp: new Date().toISOString()
      }]
    });
  }

  /**
   * Send server stop notification
   */
  async notifyServerStop(serverId: string, serverName: string) {
    const config = this.webhooks.get(serverId);
    if (!config?.events.serverStop) return;

    await this.sendWebhook(config.webhookUrl, {
      embeds: [{
        title: '🔴 Server Stopped',
        description: `**${serverName}** is now offline.`,
        color: 0xff0000,
        timestamp: new Date().toISOString()
      }]
    });
  }

  /**
   * Send player join notification
   */
  async notifyPlayerJoin(serverId: string, playerName: string) {
    const config = this.webhooks.get(serverId);
    if (!config?.events.playerJoin) return;

    await this.sendWebhook(config.webhookUrl, {
      content: `👋 **${playerName}** joined the game`
    });
  }

  /**
   * Send player leave notification
   */
  async notifyPlayerLeave(serverId: string, playerName: string) {
    const config = this.webhooks.get(serverId);
    if (!config?.events.playerLeave) return;

    await this.sendWebhook(config.webhookUrl, {
      content: `👋 **${playerName}** left the game`
    });
  }

  /**
   * Bridge chat messages to Discord
   */
  async bridgeChat(serverId: string, playerName: string, message: string) {
    const config = this.webhooks.get(serverId);
    if (!config?.events.chat) return;

    await this.sendWebhook(config.webhookUrl, {
      content: `💬 **${playerName}**: ${message}`
    });
  }

  /**
   * Send webhook request
   */
  private async sendWebhook(url: string, payload: any) {
    try {
      const https = require('https');
      const urlObj = new URL(url);
      
      const postData = JSON.stringify(payload);
      
      const options = {
        hostname: urlObj.hostname,
        path: urlObj.pathname + urlObj.search,
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Content-Length': Buffer.byteLength(postData)
        }
      };

      return new Promise((resolve, reject) => {
        const req = https.request(options, (res: any) => {
          if (res.statusCode === 204) {
            resolve(true);
          } else {
            reject(new Error(`Discord webhook failed: ${res.statusCode}`));
          }
        });

        req.on('error', reject);
        req.write(postData);
        req.end();
      });
    } catch (error) {
      console.error('❌ [DISCORD] Failed to send webhook:', error);
    }
  }
}
