# moleculer-telegram

[![NPM](https://nodei.co/npm/moleculer-telegram.png?downloads=true&stars=true)](https://nodei.co/npm/moleculer-telegram/)

[![node](https://img.shields.io/npm/v/moleculer-telegram.svg?style=flat-square)](https://www.npmjs.com/package/moleculer-telegram)

This is a mixin for MoleculerJs to generate a telegram bot UI to easily call discoverable moleculer actions

*Currently in development progress*

## Installation

```
$ npm install moleculer-telegram
```


## Usage

```js
import { Context, ServiceBroker } from "moleculer";

import { TelegramMixin } from 'moleculer-telegram';

broker.createService({
  name: "someservice",
  mixins: [TelegramMixin({ usernames: ["admin telegram username"], botToken: "token" })],
  actions: {
    hello: {
      telegram: true,
      handler() {
        return "Hello World!";
      },
    },
    notPublished: {
      telegram: false,
      handler() {
        return "You are not supposed to see this";
      },
    },
    withParams: {
      telegram: {
        default: {
          name: "Adam",
          from: "Chicago",
        },
        auth: true,
      },
      handler(ctx: Context<{ name: string; from: string }>) {
        return `Hello ${ctx.params.name} from ${ctx.params.from}`;
      },
    },
    returnsSmth: {
      telegram: {
        params: {
          name: { type: "interact" },
          from: { type: "choose" },
          sex: { type: "toggle" },
        },
        auth: false,
      },
      handler() {
        return "Hello World!";
      },
    },
  },
});

// Start server
broker.start();
```

_Coming soon..._
