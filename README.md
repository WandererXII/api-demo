# Lishogi OAuth app demo

This is an example for a fully client side OAuth app that uses various APIs.

## Features

- Fully client side, no server needed
- Login with Lishogi (OAuth2 PKCE)
- View ongoing games
- Play games
- Challenge the AI opponent
- Challenge a player
- Create a game seek
- Watch Lishogi TV

## Run it on your machine

1. `npm install`
1. `npm run build`
1. `npm run serve` or any other method to serve the app on http://localhost:8000

## Points of interest

- [ND-JSON stream reader](https://github.com/WandererXII/api-demo/blob/master/src/ndJsonStream.ts)
- [OAuth "Login with Lishogi"](https://github.com/WandererXII/api-demo/blob/master/src/auth.ts)
- [Read the main event stream](https://github.com/WandererXII/api-demo/blob/master/src/ctrl.ts)
- [Game play](https://github.com/WandererXII/api-demo/blob/master/src/game.ts)
- [Create a seek and await a game](https://github.com/WandererXII/api-demo/blob/master/src/seek.ts)
- [Challenge a player](https://github.com/WandererXII/api-demo/blob/master/src/challenge.ts)
- [Watch Lishogi TV](https://github.com/WandererXII/api-demo/blob/master/src/tv.ts)

Feel free to reuse and learn from this code when building your own Lishogi API app.
