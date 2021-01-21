import {Constant, PlatformContext} from "@tsed/common";
import {join} from "path";
import {Alter} from "../decorators/alter";
import {AlterHook} from "../domain/AlterHook";

@Alter("skip")
export class AlterSkip implements AlterHook {
  @Constant("formio.baseUrl", "/")
  baseUrl: string;

  @Constant("formio.whiteList", ["/spec.json"])
  whiteList: string[];

  transform(value: any, ctx: PlatformContext): any {
    if (value) {
      return true;
    }

    const {request} = ctx;
    const url = request.url.split("?")[0];

    return !!this.whiteList.find((entry) => {
      return join(this.baseUrl, entry) === url;
    });
  }
}
