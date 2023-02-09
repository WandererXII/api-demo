# Lishogi OAuth app demo

This is an example for a fully client side OAuth app that uses various APIs. Default set to local instance of lishogi (`lishogiHost`).

## Features

- Fully client side, no server needed
- Login with Lishogi (OAuth2 PKCE)
- View ongoing games
- Play games
- Challenge the AI opponent
- Challenge a player

## Run it on your machine

1. `npm install`
1. `npm run build`
1. `npm run serve` or any other method to serve the app on http://localhost:8000

## Points of interest

- [ND-JSON stream reader](https://github.com/WandererXII/api-demo/blob/master/src/ndJsonStream.ts)
- [OAuth "Login with Lishogi"](https://github.com/WandererXII/api-demo/blob/master/src/auth.ts)
- [Read the main event stream](https://github.com/WandererXII/api-demo/blob/master/src/ctrl.ts)
- [Game play](https://github.com/WandererXII/api-demo/blob/master/src/game.ts)
- [Challenge a player](https://github.com/WandererXII/api-demo/blob/master/src/challenge.ts)

Feel free to reuse and learn from this code when building your own Lishogi API app.
