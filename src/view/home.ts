import { Shogiground } from 'shogiground';
import { h } from 'snabbdom';
import { Ctrl } from '../ctrl';
import { Game, Renderer } from '../interfaces';
import OngoingGames from '../ongoingGames';
import { href } from '../routing';

export const renderHome: Renderer = ctrl => (ctrl.auth.me ? userHome(ctrl) : anonHome());

const userHome = (ctrl: Ctrl) => [
  h('div', [
    h('div.btn-group.mt-5', [
      h(
        'button.btn.btn-outline-primary.btn-lg',
        {
          attrs: { type: 'button' },
          on: { click: ctrl.playAi },
        },
        'Play the Lishogi AI'
      ),
      h(
        'button.btn.btn-outline-primary.btn-lg',
        {
          attrs: { type: 'button' },
          on: { click: () => ctrl.playRandom() },
        },
        'Play a casual game with a random BOT'
      ),
    ]),
    h('h2.mt-5', 'Games in progress'),
    h('div.games', renderGames(ctrl.games)),
    h('h2.mt-5.mb-3', 'About'),
    renderAbout(),
  ]),
];

const renderGames = (ongoing: OngoingGames) =>
  ongoing.games.length ? ongoing.games.map(renderGameWidget) : [h('p', 'No ongoing games at the moment')];

const renderGameWidget = (game: Game) =>
  h(
    `a.game-widget.text-decoration-none.game-widget--${game.id}`,
    {
      attrs: href(`/game/${game.id}`),
    },
    [
      h('span.game-widget__opponent', [
        h('span.game-widget__opponent__name', game.opponent.username || 'Anon'),
        game.opponent.rating && h('span.game-widget__opponent__rating', game.opponent.rating),
      ]),
      h(
        'span.game-widget__board.sg-wrap',
        {
          hook: {
            insert(vnode) {
              const el = vnode.elm as HTMLElement;
              Shogiground(
                {
                  sfen: { board: game.sfen },
                  orientation: game.color,
                  lastDests: game.lastDests.match(/.{1,2}/g),
                  viewOnly: true,
                  movable: { free: false },
                  drawable: { visible: false },
                },
                { board: el }
              );
            },
          },
        },
        'board'
      ),
    ]
  );

const anonHome = () => [
  h('div.login.text-center', [
    renderAbout(),
    h('div.big', [h('p', 'Please log in to continue.')]),
    h(
      'a.btn.btn-primary.btn-lg.mt-5',
      {
        attrs: href('/login'),
      },
      'Login with Lishogi'
    ),
  ]),
];

const renderAbout = () =>
  h('div.about', [
    h('p', 'This is an example for a fully client side OAuth app that uses various Lishogi APIs.'),
    h('ul', [
      h(
        'li',
        h(
          'a',
          {
            attrs: { href: 'https://github.com/WandererXII/api-demo' },
          },
          'Source code of this demo'
        )
      ),
      h(
        'li',
        h(
          'a',
          {
            attrs: {
              href: 'https://github.com/WandererXII/api-demo#lishogi-oauth-app-demo',
            },
          },
          'README'
        )
      ),
      h(
        'li',
        h(
          'a',
          {
            attrs: { href: 'https://lishogi.org/api' },
          },
          'Lishogi.org API documentation'
        )
      ),
    ]),
    h('p', [
      'Press ',
      h('code', '<Ctrl+Shift+j>'),
      ' to open your browser console and view incoming events.',
      h('br'),
      'Check out the network tab as well to view API calls.',
    ]),
  ]);
