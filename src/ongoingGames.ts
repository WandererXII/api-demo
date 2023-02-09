import { Game } from './interfaces';
import page from 'page';

export default class OngoingGames {
  games: Game[] = [];
  autoStart: Set<string> = new Set();

  onStart = (game: Game) => {
    this.remove(game);
    this.games.push(game);
    if (!this.autoStart.has(game.id)) {
      if (!game.hasMoved) page(`/game/${game.id}`);
    }
    this.autoStart.add(game.id);
  };

  onFinish = (game: Game) => this.remove(game);

  empty = () => {
    this.games = [];
  };

  private remove = (game: Game) => {
    this.games = this.games.filter(g => g.id != game.id);
  };
}
