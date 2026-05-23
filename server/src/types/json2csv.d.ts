declare module "json2csv" {
  export class Parser {
    constructor(opts?: { fields?: string[] });
    parse(data: unknown[]): string;
  }
}
