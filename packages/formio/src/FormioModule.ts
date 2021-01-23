import {Constant, Inject, InjectorService, OnReady, OnRoutesInit, PlatformApplication, PlatformRouteDetails} from "@tsed/common";
import {Module} from "@tsed/di";
import {join} from "path";
import {AlterActions} from "./components/AlterActions";
import {AlterAudit} from "./components/AlterAudit";
import {AlterHost} from "./components/AlterHost";
import {AlterLog} from "./components/AlterLog";
import {AlterSkip} from "./components/AlterSkip";
import {FormioConfig} from "./domain/FormioConfig";
import {FormioTemplate} from "./domain/FormioTemplate";
import {FormioInstaller} from "./services/FormioInstaller";
import {FormioService} from "./services/FormioService";

@Module({
  imports: [FormioService, AlterActions, AlterHost, AlterAudit, AlterLog, AlterSkip]
})
export class FormioModule implements OnRoutesInit, OnReady {
  @Inject()
  protected formio: FormioService;

  @Inject()
  protected installer: FormioInstaller;

  @Inject()
  protected app: PlatformApplication;

  @Inject()
  protected injector: InjectorService;

  @Constant("formio", {})
  protected settings: FormioConfig;

  @Constant("formio.baseUrl", "/")
  protected baseUrl: string;

  @Constant("formio.skipInstall", false)
  protected skipInstall: boolean;

  @Constant("formio.template")
  protected template?: FormioTemplate;

  @Constant("formio.root")
  protected root?: any;

  $onInit() {
    return this.formio.init(this.settings);
  }

  async $onRoutesInit() {
    if (this.formio.isInit()) {
      const {injector} = this;

      this.app.getRouter().use(this.baseUrl, this.formio.middleware.restrictRequestTypes, this.formio.router);
      const hasForms = this.installer.hasForms();

      if (this.template && !(hasForms || this.skipInstall)) {
        injector.logger.info("Install formio template...");
        const template = await this.installer.import(this.template);

        if (this.root) {
          injector.logger.info("Create root user...");
          await this.installer.createRootUser(this.root, template);
        }

        // TODO add submissions import
      } else {
        injector.logger.info(
          `Form.io installation skipped... (template: ${!!this.template}, hasForm: ${String(hasForms)}, skipInstall: ${String(
            this.skipInstall
          )})`
        );
      }
    }
  }

  async $logRoutes(routes: PlatformRouteDetails[]): Promise<PlatformRouteDetails[]> {
    if (this.formio.isInit()) {
      const spec = (await this.formio.swagger(
        {
          $ctx: {
            request: {
              protocol: "http",
              host: "localhost"
            }
          }
        },
        this.formio.router
      )) as any;
      const {baseUrl} = this;

      Object.entries(spec.paths).forEach(([path, methods]: [string, any]) => {
        Object.entries(methods).forEach(([method, operation]: [string, any]) => {
          routes.push({
            toJSON() {
              return {
                method,
                name: operation.operationId,
                url: join(baseUrl, path.replace(/\/{(.*)}/gi, "/:$1")),
                className: "formio",
                methodClassName: operation.operationId,
                parameters: [],
                rawBody: false
              };
            }
          } as any);
        });
      });
    }

    return routes;
  }

  // istanbul ignore next
  $onReady(): void | Promise<any> {
    if (this.formio.isInit()) {
      const {injector} = this;
      const {httpsPort, httpPort} = injector.settings;

      const displayLog = (host: any) => {
        const url = [`${host.protocol}://${host.address}`, typeof host.port === "number" && host.port].filter(Boolean).join(":");

        injector.logger.info(`Form.io API is available on ${url}${this.baseUrl || "/"}`);
      };

      /* istanbul ignore next */
      if (httpsPort) {
        (this.formio.config as any).protocol = "https";
        const host = injector.settings.getHttpsPort();
        displayLog({protocol: "https", ...host});
      } else if (httpPort) {
        (this.formio.config as any).protocol = "http";
        const host = injector.settings.getHttpPort();
        displayLog({protocol: "http", ...host});
      }
    }
  }
}
