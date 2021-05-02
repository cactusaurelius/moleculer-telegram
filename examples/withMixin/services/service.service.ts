/**
 * This example demonstrates how use TelegramMixin
 * */

import { Context, ServiceBroker } from "moleculer";

// ----

import telegramMixin from "../mixins/telegram.mixin";

// Create broker
const broker = new ServiceBroker({});

// Load Service
broker.createService({
  name: "someservice",
  mixins: [telegramMixin],
  actions: {
    hello: {
      handler(ctx: Context) {
        return `Called with params ${JSON.stringify(ctx.params)}`;
      },
    },
    notPublished: {
      handler(ctx: Context) {
        return `Called with params ${JSON.stringify(ctx.params)}`;
      },
    },
    withParams: {
      handler(ctx: Context) {
        return `Called with params ${JSON.stringify(ctx.params)}`;
      },
    },
    returnsSmth: {
      handler(ctx: Context) {
        return `Called with params ${JSON.stringify(ctx.params)}`;
      },
    },
  },
});

// Start server
broker.start();
