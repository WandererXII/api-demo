import { Auth } from './auth';
import { GameCtrl } from './game';
import { Page } from './interfaces';
import { Stream } from './ndJsonStream';
import { formData } from './util';
import OngoingGames from './ongoingGames';
import { SeekCtrl } from './seek';
import ChallengeCtrl from './challenge';
import TvCtrl from './tv';

export class Ctrl {
  auth: Auth = new Auth();
  stream?: Stream;
  page: Page = 'home';
  games = new OngoingGames();
  game?: GameCtrl;
  seek?: SeekCtrl;
  challenge?: ChallengeCtrl;
  tv?: TvCtrl;

  constructor(readonly redraw: () => void) {}

  openHome = async () => {
    this.page = 'home';
    if (this.auth.me) {
      await this.stream?.close();
      this.games.empty();
      this.redraw();
      this.stream = await this.auth.openStream('/api/stream/event', {}, msg => {
        switch (msg.type) {
          case 'gameStart':
            this.games.onStart(msg.game);
            break;
          case 'gameFinish':
            this.games.onFinish(msg.game);
            break;
          default:
            console.warn(`Unprocessed message of type ${msg.type}`, msg);
        }
        this.redraw();
      });
    }
    this.redraw();
  };

  openGame = async (id: string) => {
    this.page = 'game';
    this.game = undefined;
    this.redraw();
    this.game = await GameCtrl.open(this, id);
    this.redraw();
  };

  playAi = async () => {
    this.game = undefined;
    this.page = 'game';
    this.redraw();
    await this.auth.fetchBody('/api/challenge/ai', {
      method: 'POST',
      body: formData({
        level: 1,
        'clock.limit': 60 * 10,
        'clock.increment': 10,
        'clock.byoyomi': 0,
        'clock.periods': 0,
        variant: 'standard',
        color: 'sente',
      }),
    });
  };

  playRandom = async () => {
    this.challenge = await ChallengeCtrl.make(
      {
        username: 'random',
        rated: false,
        'clock.limit': 60 * 5,
        'clock.increment': 2,
        'clock.byoyomi': 0,
        'clock.periods': 0,
        variant: 'standard',
        color: 'sente',
      },
      this
    );
    this.page = 'challenge';
    this.redraw();
  };

  watchTv = async () => {
    this.page = 'tv';
    this.redraw();
    this.tv = await TvCtrl.open(this);
    this.redraw();
  };
}
