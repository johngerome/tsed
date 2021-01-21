import {MongooseDocument} from "@tsed/mongoose";
import {Schema} from "mongoose";

export type FormioMongooseSchema<T> = Schema<T> & {
  machineName(document: MongooseDocument<T>, done: Function): void;
};

export interface FormioBaseModel<T = any> {
  schema: Schema<T>;
}

export interface FormioModel<T = any> extends FormioBaseModel<T> {
  schema: FormioMongooseSchema<T>;
}
