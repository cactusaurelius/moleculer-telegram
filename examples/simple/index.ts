/**
 * This example demonstrates how use TelegramMixin
 * */

import { ServiceBroker } from "moleculer";

// ----

import { TelegramMixin } from "../../src";

// Create broker
const broker = new ServiceBroker({});

// Load Service
broker.createService({
  name: "someservice",
  mixins: [TelegramMixin()],
  settings: {
    path: "/api",

    routes: [
      {
        path: "",

        // You should disable body parsers
        bodyParsers: {
          json: false,
          urlencoded: false,
          raw: {
            type: "*/*",
          },
        },

        mergeParams: false,

        aliases: {
          // File upload from HTML form
          "POST /raw": "echo.params",
        },
      },
    ],
  },
});

broker.createService({
  name: "echo",
  actions: {
    params: {
      handler(ctx) {
        return {
          body: ctx.params.body.toString(),
        };
      },
    },
  },
});

// Start server
broker.start();
