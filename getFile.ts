const fs = require(`fs`);
const path = require(`path`);
const nowPath = process.cwd();

export namespace var_main {
    export const getCode = (): string => {
        return fs.readFileSync(path.join(nowPath, `node_modules`, `var-main`, `var.js`), `utf8`);
    };
}