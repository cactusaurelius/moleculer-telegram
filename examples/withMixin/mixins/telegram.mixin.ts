import { Context as TelegramContext, TelegramMixin } from "../../../src";

const botToken = process.env.TELEGRAM_BOT_TOKEN || "token";

export default {
  mixins: [TelegramMixin({ botToken })],
  settings: {
    telegram: {
      authentication(ctx: TelegramContext) {
        if (ctx.from.username == "telegram username") {
          return Promise.resolve({
            id: "idididid",
            email: "abdo.zak.amz@gmail.com",
            type: "admin",
          });
        }
      },
    },
  },
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
