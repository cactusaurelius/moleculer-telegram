import { ServiceActionsSchema, ServiceSchema } from "moleculer";
import { Telegraf, Context as TelegrafContext } from "telegraf";
// TODO: sessions

import {
  MenuTemplate,
  MenuMiddleware,
  createBackMainMenuButtons,
  deleteMenuFromContext,
} from "telegraf-inline-menu";
// import TelegrafStatelessQuestion from "telegraf-stateless-question";

// TODO: Session management
// TODO: Auth
// TODO: session save params
// TODO: service custom functinos for telegram
export interface TelegramActionSettings {
  auth: (ctx: MyContext) => {} | string | boolean;
  defParam: any;
  params: {
    [K: string]: {
      type: "toggle" | "select" | "interact" | "choose";
    };
  };
  name: string;
}
export type TelegramAction = TelegramActionSettings | boolean;
// TODO: Broker custom logger
export function TelegramLogger() {}

export function TelegramMixin({
  botToken = process.env.TELEGRAM_BOT_TOKEN,
  usernames,
}: {
  botToken?: string;
  usernames: string[];
}): ServiceSchema {
  const bot = new Telegraf<MyContext>(botToken);

  // const myQuestion = new TelegrafStatelessQuestion<MyContext>(
  //   "unique",
  //   async (context, additionalState) => {
  //     const answer = context.message.text;
  //     console.log("user responded with", answer);
  //     await replyMenuToContext(menuTemplate, context, additionalState);
  //   }
  // );
  // bot.use(myQuestion.middleware());

  bot.use((ctx, next) => {
    if (ctx.chat.type == "private" && usernames.includes(ctx.chat.username)) {
      return next();
    } else {
      return ctx.reply(`You're Not Authorized 👎🏾`);
    }
  });
  bot.use(async (ctx, next) => {
    if (ctx.callbackQuery && "data" in ctx.callbackQuery) {
      console.log(
        "another callbackQuery happened",
        ctx.callbackQuery.data.length,
        ctx.callbackQuery.data
      );
    }
    return next();
  });

  function generateMenuFromAction(
    actin: string,
    settings: ServiceActionsSchema
  ) {}
  function generateTelegramMenu(
    services: ServiceSchema[]
  ): MenuMiddleware<MyContext> {
    const menu = new MenuTemplate<MyContext>("Services");
    services.forEach((service) => {
      const serviceMenu = new MenuTemplate<MyContext>(service.name);
      try {
        Object.entries<any>(service.actions).forEach(
          ([action, { telegram }]) => {
            if (!telegram) return;
            const { defParam } = telegram;
            // TODO: parse default params
            serviceMenu.interact(action, action, {
              do: async (ctx) => {
                this.logger.info(`Calling Action ${action} from Telegram`);
                const res = await this.broker.call(action, defParam || {});
                await ctx.reply(res);
                await deleteMenuFromContext(ctx);
                return false;
              },
            });
          }
        );
        serviceMenu.manualRow(createBackMainMenuButtons());
        menu.submenu(service.name, service.name, serviceMenu);
      } catch {}
    });
    const menuMiddleware = new MenuMiddleware<MyContext>("/", menu);
    this.logger.info(menuMiddleware.tree());
    return menuMiddleware;
  }
  return {
    name: "",
    events: {
      "$services.changed": function () {
        this.onChange();
      },
    },
    methods: {
      generateTelegramMenu,
      async onChange() {
        const services: Array<ServiceSchema> = this.broker.registry.getServiceList(
          {
            withActions: true,
          }
        );
        const menu = this.generateTelegramMenu.bind(this)(services);
        bot.command("start", async (ctx) => menu.replyToContext(ctx));
        bot.use(menu.middleware());
        bot.catch((error) => {
          console.log("telegraf error", error);
        });
        await bot.launch();
        console.log(new Date(), "Bot started as", bot.botInfo?.username);
      },
    },
    async stopped() {
      bot.stop();
    },
  };
}
