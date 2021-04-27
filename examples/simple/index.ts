/**
 * This example demonstrates how use TelegramMixin
 * */

import { Context, ServiceBroker } from "moleculer";

// ----

import { TelegramMixin } from "../../src";

// Create broker
const broker = new ServiceBroker({});
process.env.TELEGRAM_BOT_TOKEN = "Token";

// Load Service
broker.createService({
  name: "someservice",
  mixins: [TelegramMixin({ usernames: ["amzzak"] })],
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
