import { ServiceSchema } from "moleculer";
import { Telegraf, Context as TelegrafContext } from "telegraf";
// TODO: sessions

import {
  MenuTemplate,
  MenuMiddleware,
  createBackMainMenuButtons,
  deleteMenuFromContext,
} from "telegraf-inline-menu";
type MyContext = TelegrafContext & {
  match: RegExpExecArray | undefined;
  // session: any;
  auth: boolean;
};
// TODO: Options for single service or all registry
// TODO: Configure to be event-based
// TODO: Session management
// TODO: Auth
// TODO: session save params
// TODO: service custom functinos for telegram
export interface TelegramActionSettings {
  auth: (ctx: MyContext) => {} | string | boolean;
  default: any;
  params: {
    [K: string]: {
      type: "toggle" | "select" | "interact" | "choose";
    };
  };
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

  function generateMenu(services: ServiceSchema[]): MenuMiddleware<MyContext> {
    const menu = new MenuTemplate<MyContext>("Services");
    services.forEach((service) => {
      const serviceMenu = new MenuTemplate<MyContext>(service.name);
      try {
        Object.entries<any>(service.actions).forEach(
          ([action, { telegram }]) => {
            serviceMenu.interact(action, action, {
              do: async (ctx) => {
                const res = await this.broker.call(action);
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
      async onChange() {
        // await bot.stop();
        const services: Array<ServiceSchema> = this.broker.registry.getServiceList(
          {
            withActions: true,
          }
        );
        const menu = generateMenu.bind(this)(services);
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
