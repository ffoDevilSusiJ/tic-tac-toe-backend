import { Controller, Post, Body, HttpCode, HttpStatus } from '@nestjs/common';
import { GameResultDto } from './dto/game-result.dto';
import { ConfigService } from '@nestjs/config';

@Controller('api')
export class GameResultController {
  private readonly telegramApiUrl: string;

  constructor(private configService: ConfigService) {
    this.telegramApiUrl =
      this.configService.get<string>('TELEGRAM_API_URL') ||
      'http://localhost:8000';
  }

  @Post('game-result')
  @HttpCode(HttpStatus.OK)
  async handleGameResult(@Body() gameResultDto: GameResultDto) {
    const { username, isWin } = gameResultDto;

    console.log(
      `📊 Game result received: ${username} - ${isWin ? 'WIN' : 'LOSS'}`,
    );

    if (isWin) {
      // Generate random 5-character promo code
      const promoCode = this.generatePromoCode();

      // Send to Telegram bot
      await this.sendToTelegram(username, promoCode);

      return {
        success: true,
        message: 'Victory notification sent',
        promoCode,
      };
    } else {
      // Send loss notification
      await this.sendToTelegram(username, null);

      return {
        success: true,
        message: 'Loss notification sent',
      };
    }
  }

  private generatePromoCode(): string {
    const characters = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
    let result = '';
    for (let i = 0; i < 5; i++) {
      result += characters.charAt(
        Math.floor(Math.random() * characters.length),
      );
    }
    return result;
  }

  private async sendToTelegram(username: string, promoCode: string | null) {
    try {
      const payload: any = {
        username,
      };

      if (promoCode) {
        payload.text = `Победа! Промокод выдан: ${promoCode}`;
        payload.qr_message = promoCode;
      } else {
        payload.text = 'Поражение. Попробуйте еще раз!';
      }

      const response = await fetch(
        `${this.telegramApiUrl}/api/send_message/`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(payload),
        },
      );

      if (!response.ok) {
        console.error('Failed to send to Telegram:', response.statusText);
      } else {
        console.log(`✅ Telegram notification sent to ${username}`);
      }
    } catch (error) {
      console.error('Error sending to Telegram:', error);
    }
  }
}
