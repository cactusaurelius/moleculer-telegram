import { ServiceActionsSchema, ServiceSchema } from "moleculer";
import { Telegraf, Context as TelegrafContext } from "telegraf";
// TODO: sessions

import {
  MenuTemplate,
  MenuMiddleware,
  createBackMainMenuButtons,
  deleteMenuFromContext,
  // getMenuOfPath,
  // replyMenuToContext,
} from "telegraf-inline-menu";
// import TelegrafStatelessQuestion from "telegraf-stateless-question";

// TODO: Session management
// TODO: Auth Middleware
// TODO: service custom functinos for telegram

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

  return {
    name: "",
    events: {
      "$services.changed": function () {
        this.onChange();
      },
    },
    methods: {
      generateTelegramMenu(
        services: ServiceSchema[]
      ): MenuMiddleware<MyContext> {
        const menu = new MenuTemplate<MyContext>("Services");
        services.forEach((service) => {
          // if (!service.settings.telegram) return;
          if (typeof service.actions === "object" && service.actions !== null) {
            const serviceMenu = new MenuTemplate<MyContext>(service.name);
            try {
              Object.entries<any>(service.actions).forEach(
                ([action, settings]: [
                  string,
                  { telegram: TelegramActionSettings; rawName: string }
                ]) => {
                  const { telegram } = settings;
                  if (!telegram) return;

                  const { defParam } = telegram;
                  if (!(typeof telegram.params === "object"))
                    serviceMenu.interact(
                      telegram?.name || settings.rawName,
                      settings.rawName,
                      {
                        do: async (ctx) => {
                          this.logger.info(
                            `Calling Action ${action} from Telegram`
                          );
                          const res = await this.broker.call(
                            action,
                            defParam || {}
                          );
                          await ctx.reply(res);
                          await deleteMenuFromContext(ctx);
                          return false;
                        },
                      }
                    );
                  if (
                    typeof telegram.params === "object" &&
                    telegram.params !== null
                  ) {
                    const actionMenu = new MenuTemplate<MyContext>(
                      settings.rawName
                    );

                    /**
                     * Params Menu
                     */
                    // const paramsMenu = new MenuTemplate<MyContext>(
                    //   `${settings.rawName}.params`
                    // );

                    // Object.entries(telegram.params).forEach(
                    //   ([param, settings]) => {
                    //     const { type } = settings;
                    //     if (type === "toggle") {
                    //       paramsMenu.toggle(param, param, {
                    //         isSet: (ctx) => true,
                    //         set: (ctx, newState) => {
                    //           ctx.session.isFunny = newState;
                    //           return newState;
                    //         },
                    //       });
                    //     }

                    //   }
                    // );
                    // paramsMenu.manualRow(createBackMainMenuButtons());
                    // actionMenu.submenu("Params", "params", paramsMenu);

                    /**
                     * Action Call Button
                     */
                    actionMenu.interact("Call", `${settings.rawName}`, {
                      do: async (ctx) => {
                        this.logger.info(
                          `Calling Action ${action} from Telegram`
                        );
                        const params = ctx.session?.actions[action]?.params;

                        const res = this.broker.call(action, {
                          ...(defParam || {}),
                          ...(params || {}),
                        });

                        if (telegram.async) {
                          await ctx.reply("Action Called");
                        } else {
                          await ctx.reply(await res);
                        }
                        return "..";
                      },
                    });
                    actionMenu.manualRow(createBackMainMenuButtons());

                    serviceMenu.submenu(
                      telegram?.name || settings.rawName,
                      settings.rawName,
                      actionMenu
                    );
                  }
                }
              );
              serviceMenu.manualRow(createBackMainMenuButtons());
              menu.submenu(service.name, service.name, serviceMenu);
            } catch (err) {
              throw err;
            }
          }
        });
        const menuMiddleware = new MenuMiddleware<MyContext>("/", menu);
        this.logger.info(menuMiddleware.tree());
        return menuMiddleware;
      },
      async onChange() {
        const services: Array<ServiceSchema> = this.broker.registry.getServiceList(
          {
            withActions: true,
          }
        );
        const menu = this.generateTelegramMenu(services);
        bot.command("start", async (ctx) => menu.replyToContext(ctx));
        bot.use(menu.middleware());
        bot.catch((error) => {
          this.logger.error("telegraf error", error);
        });
        await bot.launch();
        this.logger.info(new Date(), "Bot started as", bot.botInfo?.username);
      },
    },
    async stopped() {
      bot.stop();
    },
  };
}

export interface TelegramActionSettings {
  auth: (ctx: MyContext) => {} | string | boolean;
  defParam: any;
  params: {
    [K: string]: {
      type: "toggle" | "select" | "choose" | "question";
      settings: any;
    };
  };
  name: string;
  async: boolean;
}
export type TelegramAction = TelegramActionSettings | boolean;

type MyContext = TelegrafContext & {
  match: RegExpExecArray | undefined;
  session?: any;
  auth: boolean;
  message: { text: string };
};
