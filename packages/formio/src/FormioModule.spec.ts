import {PlatformApplication, PlatformRouteDetails, PlatformTest} from "@tsed/common";
import {expect} from "chai";
import * as faker from "faker";
import Sinon from "sinon";
import {FormioModule} from "./FormioModule";
import {FormioInstaller} from "./services/FormioInstaller";
import {FormioService} from "./services/FormioService";

const sandbox = Sinon.createSandbox();

async function createFormioModuleFixture() {
  const formio = {
    swagger: sandbox.stub(),
    router: sandbox.stub(),
    middleware: {
      restrictRequestTypes: sandbox.stub()
    },
    isInit: sandbox.stub().returns(true),
    init: sandbox.stub()
  };

  const installer = {
    hasForms: sandbox.stub().returns(false),
    import: sandbox.stub(),
    createRootUser: sandbox.stub()
  };

  const app = {
    use: sandbox.stub(),
    getRouter: sandbox.stub().returnsThis()
  };

  const service = await PlatformTest.invoke<FormioModule>(FormioModule, [
    {
      token: FormioInstaller,
      use: installer
    },
    {
      token: FormioService,
      use: formio
    },
    {
      token: PlatformApplication,
      use: app
    }
  ]);

  return {service, app, installer, formio};
}

describe("FormioModule", () => {
  beforeEach(() => PlatformTest.create());
  afterEach(PlatformTest.reset);
  afterEach(() => sandbox.restore());

  describe("$onRoutesInit()", () => {
    it("should run install and create user", async () => {
      const {service, app, installer, formio} = await createFormioModuleFixture();
      const template = {
        forms: {}
      };
      const root = {
        email: faker.internet.email()
      };
      // @ts-ignore
      delete service.template;
      // @ts-ignore
      delete service.root;

      // @ts-ignore
      service.template = template;
      // @ts-ignore
      service.root = root;

      // @ts-ignore
      installer.import.resolves(service.template);

      await service.$onRoutesInit();

      expect(app.getRouter).to.have.been.calledWithExactly();
      expect(app.use).to.have.been.calledWithExactly("/", formio.middleware.restrictRequestTypes, formio.router);
      expect(installer.import).to.have.been.calledWithExactly(template);
      expect(installer.createRootUser).to.have.been.calledWithExactly(root, template);
    });
    it("should skip install", async () => {
      const {service, app, installer, formio} = await createFormioModuleFixture();
      const template = {
        forms: {}
      };
      const root = {
        email: faker.internet.email()
      };

      await service.$onRoutesInit();

      expect(installer.import).to.not.have.been.called;
    });
  });
  describe("$logRoutes()", () => {
    it("should add formio routes", async () => {
      const {service, app, installer, formio} = await createFormioModuleFixture();
      const routes: PlatformRouteDetails[] = [];

      // @ts-ignore
      delete service.baseUrl;
      // @ts-ignore
      service.baseUrl = "/projects";

      formio.swagger.returns({
        paths: {
          "/path/to": {
            get: {
              operationId: "operationId"
            }
          }
        }
      });

      const results = await service.$logRoutes(routes);

      expect(results.map((o) => o.toJSON())).to.deep.eq([
        {
          className: "formio",
          method: "get",
          methodClassName: "operationId",
          name: "operationId",
          parameters: [],
          rawBody: false,
          url: "/projects/path/to"
        }
      ]);
    });
  });
});
