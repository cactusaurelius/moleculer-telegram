import { TelegramMixin } from "../../../src";

const botToken = process.env.TELEGRAM_BOT_TOKEN || "token";

export default {
  mixins: [TelegramMixin({ botToken, usernames: ["amzzak"] })],
  settings: { telegram: true },
  actions: {
    hello: {
      telegram: true,
    },
    notPublished: {
      telegram: false,
    },
    withParams: {
      telegram: {
        name: "Say Hello",
        defParam: {
          name: "Adam",
          from: "Chicago",
          // TODO: stateful stateless
          // isHappy: (ctx: Context) => UserModel.findOne({name: "Adam"}).then((adam) => adam.isHappy)
        },
        auth: true,
        async: false,
      },
    },
    returnsSmth: {
      telegram: {
        name: "Say Only Hello",
        params: {
          name: { type: "interact" },
          from: { type: "choose" },
          sex: { type: "toggle" },
        },
        auth: false,
        async: true,
      },
    },
  },
};
