/**
 * This example demonstrates how use TelegramMixin
 * */

import { Context, ServiceBroker } from "moleculer";

// ----

import { TelegramMixin } from "../../src";

// Create broker
const broker = new ServiceBroker({});
process.env.TELEGRAM_BOT_TOKEN = "token";

// Load Service
broker.createService({
  name: "someservice",
  mixins: [TelegramMixin({ usernames: ["amzzak"] })],
  actions: {
    hello: {
      telegram: true,
      handler(ctx: Context) {
        return `Called with params ${JSON.stringify(ctx.params)}`;
      },
    },
    notPublished: {
      telegram: false,
      handler(ctx: Context) {
        return `Called with params ${JSON.stringify(ctx.params)}`;
      },
    },
    withParams: {
      telegram: {
        name: "Say Hello",
        defParam: {
          name: "Adam",
          from: "Chicago",
          // TODO:
          // isHappy: (ctx: Context) => UserModel.findOne({name: "Adam"}).then((adam) => adam.isHappy)
        },
        auth: true,
        async: true,
      },
      handler(ctx: Context) {
        return `Called with params ${JSON.stringify(ctx.params)}`;
      },
    },
    returnsSmth: {
      telegram: {
        name: "Say Only Hello",
        params: {
          name: { type: "interact" },
          sex: { type: "select", choices: ["Male", "Female"] },
          hungry: { type: "toggle" },
        },
        auth: false,
        async: false,
      },
      handler(ctx: Context) {
        return `Called with params ${JSON.stringify(ctx.params)}`;
      },
    },
  },
});

// Start server
broker.start();
