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
      handler(ctx: Context<any, any>) {
        return `Called with params ${JSON.stringify(ctx.params)} and user: ${
          ctx.meta.user
        }`;
      },
    },
    notPublished: {
      handler(ctx: Context<any, any>) {
        return `Called with params ${JSON.stringify(ctx.params)} and user: ${
          ctx.meta.user
        }`;
      },
    },
    withParams: {
      handler(ctx: Context<any, any>) {
        return `Called with params ${JSON.stringify(ctx.params)} and user: ${
          ctx.meta.user
        }`;
      },
    },
    returnsSmth: {
      handler(ctx: Context<any, any>) {
        return `Called with params ${JSON.stringify(ctx.params)} and user: ${
          ctx.meta.user
        }`;
      },
    },
  },
});

// Start server
broker.start();
