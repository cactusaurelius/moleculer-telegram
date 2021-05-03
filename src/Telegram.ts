import { ServiceActionsSchema, ServiceSchema } from "moleculer";
import { Telegraf, Context as TelegrafContext } from "telegraf";
import session from "./session";
import * as _ from "lodash";
// TODO: sessions

import {
  MenuTemplate,
  MenuMiddleware,
  createBackMainMenuButtons,
  deleteMenuFromContext,
  // getMenuOfPath,
  // replyMenuToContext,
} from "telegraf-inline-menu";
import { isObject } from "telegraf-inline-menu/dist/source/generic-types";
// import TelegrafStatelessQuestion from "telegraf-stateless-question";

// TODO: Session management
// TODO: Auth Middleware
// TODO: service custom functinos for telegram

// TODO: Broker custom logger

export function TelegramLogger() {}

export function TelegramMixin({
  botToken = process.env.TELEGRAM_BOT_TOKEN,
}: {
  botToken?: string;
  authMiddleware?: (
    ctx: Context,
    next: (A: any) => Promise<any>
  ) => Promise<any>;
} = {}): ServiceSchema {
  const bot = new Telegraf<Context>(botToken);
  bot.use(
    session({
      property: "session",
    })
  );

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
      generateTelegramMenu(services: ServiceSchema[]): MenuMiddleware<Context> {
        const menu = new MenuTemplate<Context>("Services");
        services.forEach((service) => {
          // if (!service.settings.telegram) return;
          if (typeof service.actions === "object" && service.actions !== null) {
            const serviceMenu = new MenuTemplate<Context>(service.name);
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
                          const res = this.broker.call(action, defParam || {});
                          if (telegram.async) {
                            await ctx.reply("Action Called");
                          } else {
                            await ctx.reply(await res);
                          }
                          // await deleteMenuFromContext(ctx);
                          return false;
                        },
                      }
                    );

                  /**
                   * Params Menu
                   */
                  if (
                    typeof telegram.params === "object" &&
                    telegram.params !== null
                  ) {
                    const actionMenu = new MenuTemplate<Context>(
                      settings.rawName
                    );

                    /**
                     * Params Menu
                     */
                    const paramsMenu = new MenuTemplate<Context>("params");

                    Object.entries(telegram.params).forEach(
                      ([param, settings]) => {
                        const { type } = settings;
                        if (type === "toggle") {
                          paramsMenu.toggle(param, param, {
                            isSet: (ctx) =>
                              ctx.session?.actions?.[action]?.[param],
                            set: (ctx, newState) => {
                              _.set(
                                ctx.session,
                                ["actions", action, param],
                                newState
                              );
                              return true;
                            },
                          });
                        }

                        if (type === "select") {
                          paramsMenu.select(param, settings.choices, {
                            isSet: (ctx, key) =>
                              ctx.session?.actions?.[action]?.[param] === key,
                            set: (ctx, key) => {
                              _.set(
                                ctx.session,
                                ["actions", action, param],
                                key
                              );
                              return true;
                            },
                          });
                        }
                      }
                    );
                    paramsMenu.manualRow(createBackMainMenuButtons());
                    actionMenu.submenu("Params", "params", paramsMenu);

                    /**
                     * Action Call Button
                     */
                    actionMenu.interact("Call", `${settings.rawName}`, {
                      do: async (ctx) => {
                        this.logger.info(
                          `Calling Action ${action} from Telegram`
                        );
                        const params = ctx.session.actions?.[action];

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
        const menuMiddleware = new MenuMiddleware<Context>("/", menu);
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
    async started() {
      /**
       * Adding Authentication Middleware
       */
      if (typeof this.settings?.telegram?.authentication == "function") {
        bot.use(async (ctx, next) => {
          try {
            const { authentication } = this.settings.telegram;
            const user = await authentication(ctx);
            if (!user) {
              ctx.reply("You're Not Authorized 👎🏾 ");
              throw "Telegram Authorization Error";
            }
            ctx.user = user;
            return next();
          } catch {
            throw "Telegram Authorization Error";
          }
        });
      }
    },
    async stopped() {
      bot.stop();
    },
  };
}

export interface TelegramActionSettings {
  auth: (ctx: Context) => {} | string | boolean;
  defParam: any;
  params: {
    [K: string]: {
      type: "toggle" | "select" | "question";
      [K: string]: any;
    };
  };
  name: string;
  async: boolean;
}
export type TelegramAction = TelegramActionSettings | boolean;

export type Context = TelegrafContext & {
  match: RegExpExecArray | undefined;
  session?: any;
  auth: boolean;
  user: any;
  message: { text: string };
};
