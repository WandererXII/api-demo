import { Shogi, Color } from 'shogiops';
import { Ctrl } from './ctrl';
import { Api as SgApi } from 'shogiground/api';
import { Stream } from './ndJsonStream';
import { parseSfen } from 'shogiops/sfen';
import { Key } from 'shogiground/types';
import { BoardCtrl } from './game';
import { Config } from 'shogiground/config';

interface TvGame {
  id: string;
  orientation: Color;
  players: [TvPlayer, TvPlayer];
  sfen: string;
  lastDests?: string;
}

interface TvPlayer {
  color: Color;
  user: {
    name: string;
    title?: string;
  };
  rating: number;
  seconds?: number;
}

export default class TvCtrl implements BoardCtrl {
  ground?: SgApi;
  shogi: Shogi = Shogi.default();
  lastUpdateAt: number = Date.now();
  redrawInterval: ReturnType<typeof setInterval>;
  constructor(readonly stream: Stream, public game: TvGame, readonly root: Ctrl) {
    this.onUpdate();
    this.redrawInterval = setInterval(root.redraw, 100);
    this.awaitClose();
  }

  awaitClose = async () => {
    await this.stream.closePromise;
  };

  onUnmount = () => {
    this.stream.close();
    clearInterval(this.redrawInterval);
  };

  player = (color: Color) => this.game.players[this.game.players[0].color == color ? 0 : 1];

  static open = (root: Ctrl): Promise<TvCtrl> =>
    new Promise<TvCtrl>(async resolve => {
      let ctrl: TvCtrl;
      let stream: Stream;
      const handler = (msg: any) => {
        if (ctrl) ctrl.handle(msg);
        else {
          // Gets the first game object from the first message of the stream,
          // make a TvCtrl from it, then forward the next messages to the ctrl
          ctrl = new TvCtrl(stream, msg.d, root);
          resolve(ctrl);
        }
      };
      stream = await root.auth.openStream('/tv/feed', {}, handler);
    });

  shogigroundConfig: () => Config = () => {
    const shogi = parseSfen('standard', this.game.sfen).unwrap();
    const lm = this.game.lastDests;
    const lastDests = (lm ? (lm[1] === '@' ? [lm.slice(2)] : [lm[0] + lm[1], lm[2] + lm[3]]) : []) as Key[];
    return {
      orientation: this.game.orientation,
      sfen: { board: this.game.sfen },
      lastDests,
      turnColor: shogi.turn,
      check: !!shogi.isCheck(),
      viewOnly: true,
      movable: { free: false },
      drawable: { visible: false },
    };
  };

  setGround = (sg: SgApi) => (this.ground = sg);

  private onUpdate = () => {
    this.shogi = parseSfen('standard', this.game.sfen).unwrap();
    this.lastUpdateAt = Date.now();
  };

  private handle = (msg: any) => {
    switch (msg.t) {
      case 'featured':
        this.game = msg.d;
        this.onUpdate();
        this.root.redraw();
        break;
      case 'sfen':
        this.game.sfen = msg.d.sfen;
        this.game.lastDests = msg.d.lm;
        this.player('sente').seconds = msg.d.wc;
        this.player('gote').seconds = msg.d.bc;
        this.onUpdate();
        this.ground?.set(this.shogigroundConfig());
        break;
    }
  };
}
