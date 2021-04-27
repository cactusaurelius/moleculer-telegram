import { ActionSchema, ServiceSchema } from "moleculer";
import { Telegraf, Context as TelegrafContext } from "telegraf";
import ngrok from "ngrok";
import {
  MenuTemplate,
  MenuMiddleware,
  createBackMainMenuButtons,
  deleteMenuFromContext,
} from "telegraf-inline-menu";
type MyContext = TelegrafContext & { match: RegExpExecArray | undefined };
// TODO: Options for single service or all registry
// TODO: Configure to be event-based
// TODO: Session management
// TODO: Auth
// TODO: session save params
// TODO: service custom functinos for telegram
export interface TelegramActionSettings {
  auth: (ctx: MyContext) => {} | string;
  params: {
    [K: string]: {
      type: "toggle" | "select" | "interact" | "choose";
    };
  };
}
export type TelegramAction = TelegramActionSettings | boolean;
// TODO: Broker custom logger
export function TelegramLogger() {}
export function TelegramMixin(): ServiceSchema {
  const bot = new Telegraf<MyContext>(
    process.env.BOT_TOKEN || "804575218:AAHyzf1CSzLZfRYWaHWonEqZZt6h2G2IY_M"
  );
  bot.use((ctx, next) => {
    if (
      ctx.chat.type == "private" &&
      ctx.chat.username == (process.env.TELEGRAM_SUPER_USER || "amzzak")
    ) {
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

  function addNgrok(): MenuTemplate<MyContext> {
    const ngrokMenu = new MenuTemplate<MyContext>("Ngrok");

    ngrokMenu.interact("connect", "ngrok.connect", {
      do: async (ctx) => {
        await ngrok.kill().catch();
        await ctx.reply(await ngrok.connect(3000));
        await deleteMenuFromContext(ctx);
        return false;
      },
    });
    ngrokMenu.interact("kill", "ngrok.kill", {
      do: async (ctx) => {
        await ngrok.kill().catch();
        return "..";
      },
    });

    ngrokMenu.manualRow(createBackMainMenuButtons());
    return ngrokMenu;
  }
  function generateMenu(services: ServiceSchema[]): MenuMiddleware<MyContext> {
    const menu = new MenuTemplate<MyContext>("Services");
    menu.submenu("Ngrok", "ngrok", addNgrok());

    services.forEach((service) => {
      const serviceMenu = new MenuTemplate<MyContext>(service.name);
      try {
        Object.keys(service.actions).forEach((action) => {
          serviceMenu.interact(
            (service.actions[action] as ActionSchema).name,
            (service.actions[action] as ActionSchema).name,
            {
              do: async (ctx) => {
                const res = await this.broker.call(
                  `${(service.actions[action] as ActionSchema).name}`
                );
                await ctx.reply(res);
                // return '..';
                await deleteMenuFromContext(ctx);
                return false;
              },
            }
          );
        });
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
    // async started() {
    //   bot.launch();
    // },
    async stopped() {
      bot.stop();
    },
  };
}
