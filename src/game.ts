import { Ctrl } from './ctrl';
import { Game } from './interfaces';
import { Api as SgApi } from 'shogiground/api';
import { Config as SgConfig, Config } from 'shogiground/config';
import { Stream } from './ndJsonStream';
import { Color, Key, Piece } from 'shogiground/types';
import { makeUsi, opposite, parseSquare, parseUsi } from 'shogiops/util';
import { Shogi } from 'shogiops/variant/shogi';
import { makeSfen, parseSfen, initialSfen } from 'shogiops/sfen';
import { shogigroundMoveDests, shogigroundDropDests } from 'shogiops/compat';
import { Role } from 'shogiops';

export interface BoardCtrl {
  shogi: Shogi;
  ground?: SgApi;
  shogigroundConfig: () => SgConfig;
  setGround: (sg: SgApi) => void;
}

export class GameCtrl implements BoardCtrl {
  game: Game;
  pov: Color;
  shogi: Shogi = Shogi.default();
  lastDests?: Key[];
  lastUpdateAt: number = Date.now();
  ground?: SgApi;
  redrawInterval: ReturnType<typeof setInterval>;

  constructor(game: Game, readonly stream: Stream, private root: Ctrl) {
    this.game = game;
    this.pov = this.game.gote.id == this.root.auth.me?.id ? 'gote' : 'sente';
    this.onUpdate();
    this.redrawInterval = setInterval(root.redraw, 100);
  }

  onUnmount = () => {
    this.stream.close();
    clearInterval(this.redrawInterval);
  };

  private onUpdate = () => {
    const sfen = this.game.initialSfen === 'startpos' ? initialSfen('standard') : this.game.initialSfen;
    this.shogi = parseSfen('standard', sfen).unwrap();
    const moves = this.game.state.moves.split(' ').filter((m: string) => m);
    moves.forEach((uci: string) => this.shogi.play(parseUsi(uci)!));
    const lm = moves[moves.length - 1];
    this.lastDests = (lm ? (lm[1] === '*' ? [lm.slice(2)] : [lm[0] + lm[1], lm[2] + lm[3]]) : []) as Key[];
    this.lastUpdateAt = Date.now();
    this.ground?.set(this.shogigroundConfig());
    if (this.shogi.turn == this.pov) this.ground?.playPremove();
  };

  timeOf = (color: Color) => this.game.state[`${color[0]}time`];

  userMove = async (orig: Key, dest: Key, promotion: Boolean) => {
    this.ground?.set({ turnColor: opposite(this.pov) });
    await this.root.auth.fetchBody(`/api/board/game/${this.game.id}/move/${orig}${dest}${promotion ? '+' : ''}`, {
      method: 'POST',
    });
  };

  userDrop = async (piece: Piece, key: Key) => {
    const usi = makeUsi({ role: piece.role as Role, to: parseSquare(key) });
    this.ground?.set({ turnColor: opposite(this.pov) });
    await this.root.auth.fetchBody(`/api/board/game/${this.game.id}/move/${usi}`, {
      method: 'POST',
    });
  };

  resign = async () => {
    await this.root.auth.fetchBody(`/api/board/game/${this.game.id}/resign`, { method: 'POST' });
  };

  playing = () => this.game.state.status == 'started';

  shogigroundConfig: () => Config = () => ({
    orientation: this.pov,
    sfen: { board: makeSfen(this.shogi) },
    hands: {
      inlined: true,
    },
    lastDests: this.lastDests,
    turnColor: this.shogi.turn,
    check: !!this.shogi.isCheck(),
    movable: {
      free: false,
      color: this.playing() ? this.pov : undefined,
      dests: shogigroundMoveDests(this.shogi),
    },
    droppable: {
      free: false,
      color: this.playing() ? this.pov : undefined,
      dests: shogigroundDropDests(this.shogi),
    },
    events: {
      move: this.userMove,
      drop: this.userDrop,
    },
  });

  setGround = (sg: SgApi) => (this.ground = sg);

  static open = (root: Ctrl, id: string): Promise<GameCtrl> =>
    new Promise<GameCtrl>(async resolve => {
      let ctrl: GameCtrl;
      let stream: Stream;
      const handler = (msg: any) => {
        if (ctrl) ctrl.handle(msg);
        else {
          // Gets the gameFull object from the first message of the stream,
          // make a GameCtrl from it, then forward the next messages to the ctrl
          ctrl = new GameCtrl(msg, stream, root);
          resolve(ctrl);
        }
      };
      stream = await root.auth.openStream(`/api/board/game/stream/${id}`, {}, handler);
    });

  private handle = (msg: any) => {
    switch (msg.type) {
      case 'gameFull':
        this.game = msg;
        this.onUpdate();
        this.root.redraw();
        break;
      case 'gameState':
        this.game.state = msg;
        this.onUpdate();
        this.root.redraw();
        break;
      default:
        console.error(`Unknown message type: ${msg.type}`, msg);
    }
  };
}
