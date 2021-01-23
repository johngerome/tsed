import {Inject, Injectable} from "@tsed/di";
import {FormioSubmission} from "@tsed/formio";
import {promisify} from "util";
import {FormioTemplate} from "../domain/FormioTemplate";
import {FormioService} from "./FormioService";

const importer = require("formio/src/templates/import");

@Injectable()
export class FormioInstaller {
  @Inject()
  protected formio: FormioService;

  // istanbul ignore next
  protected get importer() {
    return promisify(importer({formio: this.formio.formio}).template);
  }

  async hasForms(): Promise<boolean> {
    const collections = this.formio.db.collection("forms");

    const nbForms: number = await new Promise((resolve, reject) => {
      collections.estimatedDocumentCount((err, response) => {
        err ? reject(err) : resolve(response);
      });
    });

    return nbForms > 0;
  }

  // istanbul ignore next
  async import(template: FormioTemplate) {
    return this.importer(template);
  }

  async createRootUser<User = unknown>(user: {email: string; password: string}, template: FormioTemplate): Promise<FormioSubmission<User>> {
    const hash = await this.formio.encrypt(user.password);

    return new Promise((resolve, reject) => {
      this.formio.resources.submission.model.create(
        {
          form: template.resources.admin._id,
          data: {
            email: user.email,
            password: hash
          },
          roles: [template.roles?.administrator._id].filter(Boolean)
        },
        (err: unknown, item: any) => {
          if (err) {
            return reject(err);
          }

          resolve(item);
        }
      );
    });
  }
}
