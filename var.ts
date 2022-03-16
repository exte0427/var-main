namespace Var {

    export const make = (tagName: string, states: Array<VarInternal.parser.virtualState>, ...childNodes: Array<VarInternal.parser.virtualDom>): VarInternal.parser.virtualDom => {
        return new VarInternal.parser.virtualDom(tagName, states, childNodes.flat(), ``, new VarInternal.key.keyForm(-1, -1));
    }

    export const text = (value: string) => {
        return new VarInternal.parser.virtualDom(`text`, [], [], value, new VarInternal.key.keyForm(-1, -1));
    }

    export const state = (stateName: string, stateVal: any): VarInternal.parser.virtualState => {
        return new VarInternal.parser.virtualState(stateName, stateVal);
    }

    export class varForm {
        name: string;
        state: any;
        start: any;
        update: any;
        render: any;
        variable: any;

        constructor(name_ = "", start_: any = null, update_: any = null, render_: any = null, variable_ = {}, state_: any = {}) {
            this.name = name_;
            this.state = state_;

            this.start = start_;
            this.update = update_;

            this.render = render_;
            this.variable = variable_;
        }

        getStart(...args: any[]): string | VarInternal.parser.virtualDom {
            let returnData: string | VarInternal.parser.virtualDom;
            if (this.start instanceof Function)
                returnData = this.start(...args);
            else
                returnData = this.start;

            return returnData;
        }

        getUpdate(...args: any[]): string | VarInternal.parser.virtualDom {
            let returnData: string | VarInternal.parser.virtualDom;
            if (this.update instanceof Function)
                returnData = this.update(...args);
            else
                returnData = this.update;

            return returnData;
        }
    }
}

namespace VarInternal {
    export namespace data {
        export const varList: Array<Var.varForm> = [];
    }

    export namespace parser {
        export class virtualState {
            attributeName: string;
            value: string;

            constructor(attributeName_: string, value_: string) {
                this.attributeName = attributeName_;
                this.value = value_;
            }
        }

        export class virtualDom {
            tagName: string;
            attributesList: Array<virtualState>;
            childList: Array<virtualDom>;
            value: string;
            key: key.keyForm;
            var: Var.varForm;

            constructor(tagName_: string, attributesList_: Array<virtualState>, childList_: Array<virtualDom>, value_: string, key_: key.keyForm, var_: Var.varForm = new Var.varForm()) {
                this.tagName = tagName_;
                this.attributesList = attributesList_;
                this.childList = childList_;
                this.value = value_;
                this.key = key_;
                this.var = var_;
            }
        }

        export const getHtml = (): HTMLElement => {
            return <HTMLElement>document.querySelector(`html`);
        }

        export const parseText = (text: string): string => {
            let startNum = -1;
            let endNum = -1;

            for (let i = 0; i < text.length; i++) {
                const nowChar: string = <string>text[i];
                if (nowChar !== `\n` && nowChar !== ` `) {
                    startNum = i;
                    break;
                }
            }

            for (let i = text.length - 1; i >= 0; i--) {
                const nowChar: string = <string>text[i];
                if (nowChar !== `\n` && nowChar !== ` `) {
                    endNum = i;
                    break;
                }
            }

            if (startNum === -1 || endNum == -1)
                return ``;

            return text.slice(startNum, endNum + 1);
        }

        export const texToDom = (text: string): virtualDom => {
            return new virtualDom(`text`, [], [], text, new VarInternal.key.keyForm(-1, -1));
        }

        export const parseAttributes = (attributes: NamedNodeMap): Array<virtualState> => {
            const returningStates: Array<virtualState> = [];
            for (let i = 0; i < attributes.length; i++) {
                const nowAttribute = attributes[i];
                returningStates.push(new virtualState(nowAttribute.name, nowAttribute.value));
            }

            return returningStates;
        }

        export const parse = (element: HTMLElement | ChildNode | Element, key: number): virtualDom => {

            const children: Array<virtualDom> = [];
            let tagName = ``;
            let attributes: Array<virtualState> = [];
            let text = ``;

            if (element instanceof HTMLElement || element instanceof Element) {
                tagName = element.tagName.toLowerCase();
                attributes = parseAttributes(element.attributes);
                text = element.innerHTML;

                const nowChild = html.getChild(element);

                for (let i = 0; i < nowChild.length; i++) {
                    children.push(parse(nowChild[i], i));
                }
            }
            else if (element != undefined) {
                tagName = `text`;
                text = parseText(<string>element.nodeValue);
            }

            return new virtualDom(tagName, attributes, children, text, new VarInternal.key.keyForm(key, children.length));
        }
    }

    export namespace key {
        export class keyForm {
            myKey: number;
            lastKey: number;

            constructor(myKey_: number, lastKey_: number) {
                this.myKey = myKey_;
                this.lastKey = lastKey_;
            }
        }

        export const getElement = (virtualList: Array<parser.virtualDom>, key: number): parser.virtualDom => {
            const returnData = virtualList.find(element => element.key.myKey === key);
            if (returnData instanceof parser.virtualDom)
                return returnData
            else {
                console.error(`${key} is not found`);
                return new parser.virtualDom("", [], [], "", new VarInternal.key.keyForm(-1, -1));
            }
        }
    }

    export namespace html {
        export const getChild = (parent: ChildNode | Document | HTMLElement): Array<ChildNode> => {
            const childList = [];

            for (let i = 0; i < parent.childNodes.length; i++) {
                const child = parent.childNodes[i];
                if (child.nodeValue === null || parser.parseText(<string>child.nodeValue) !== ``)
                    childList.push(child);
            }

            return childList;
        }
    }

    export namespace main {
        export let firstData: parser.virtualDom | undefined = undefined;
        export let lastData: parser.virtualDom | undefined = undefined;
        export let nowData: parser.virtualDom | undefined = undefined;

        export let delList: Array<HTMLElement> = [];

        export const init = (): void => {
            //start
            console.log(`Var.js`);

            firstData = parser.parse(parser.getHtml(), 0);

            lastData = firstData;
            nowData = firstData;
        }

        export const detectStart = (time: number): void => {
            setInterval(() => {

                //set now data
                nowData = detecter.subVar({ ...(<parser.virtualDom>nowData) });

                detecter.detect(document, lastData, nowData, 1);

                delList.map(element => changer.del(element));
                delList = [];

                //set last data
                lastData = nowData;

            }, time)
        }
    }

    export namespace changer {
        export const make = (data: parser.virtualDom): HTMLElement | Text => {
            if (data.tagName == `text`)
                return document.createTextNode(data.value);
            else {
                const myDom: HTMLElement = document.createElement(data.tagName);

                data.attributesList.map(element => {
                    myDom.setAttribute(element.attributeName, element.value);
                });

                data.childList.map(element => {
                    myDom.append(make(element));
                });

                return myDom;
            }
        }

        export const add = (parent: HTMLElement, data: parser.virtualDom): void => {
            parent.appendChild(make(data));
        }

        export const del = (data: HTMLElement): void => {
            data.remove();
        }

        export const change = (parent: HTMLElement, target: HTMLElement, newData: parser.virtualDom): void => {
            parent.replaceChild(make(newData), target);
        }

        export const attrChange = (target: HTMLElement, lastAttr: Array<parser.virtualState>, nowAttr: Array<parser.virtualState>): void => {
            nowAttr.map((element) => {
                if (lastAttr.find(e => e.attributeName === element.attributeName) == undefined)
                    target.setAttribute(element.attributeName, element.value);
                if (element.value !== lastAttr.find(e => e.attributeName === element.attributeName)?.value)
                    target.setAttribute(element.attributeName, element.value);
            });

            //del
            lastAttr.map(element => {
                if (nowAttr.find(e => e.attributeName === element.attributeName) == undefined)
                    target.removeAttribute(element.attributeName);
            })
        }
    }

    export namespace varManage {
        export const compile = (vars: any): any => {
            let newVars: any;
            for (const elementName in vars) {
                let newElement;
                const element = { name: elementName, value: vars[elementName] };
                if (!Array.isArray(element.value))
                    element.value = [element.value];

                newElement.name = element.name;
                newElement.value = Var.make(`variable`, [], ...element.value.map(v => {
                    if (v instanceof parser.virtualDom)
                        return v;
                    else
                        return Var.text(v);
                }));

                newVars[newElement.name] = newElement.value;
            }

            return newVars;
        }
    }

    export namespace detecter {

        export const getState = (target: parser.virtualDom) => {
            const myVar = target.var;
            for (const element of Object.keys(target.var.state)) {
                const myValue = target.attributesList.find(e => e.attributeName === element);

                if (myValue === undefined)
                    myVar.state[element] = undefined;
                else
                    myVar.state[element] = myValue.value;
            }

            return myVar.state;
        }

        export const excute = (target: parser.virtualDom, excFir: boolean): parser.virtualDom => {
            const myVar = target.var;
            myVar.state = getState(target);

            if (excFir && myVar.start !== null)
                myVar.variable = myVar.start(myVar.variable, getState(target));

            if (myVar.update !== null)
                myVar.variable = myVar.update(myVar.variable, myVar.state);

            let childList: Array<any> = myVar.render(varManage.compile(myVar.variable), varManage.compile(myVar.state)).childList;
            childList = childList.map(element => subVar(element));

            return new parser.virtualDom(target.tagName, target.attributesList, childList, target.value, target.key, myVar);
        }

        export const subVar = (target: parser.virtualDom): parser.virtualDom => {
            if (target.var.name === "") {
                const myTemplate = templates.find(element => element.name === target.tagName);
                if (myTemplate === undefined) {
                    return new parser.virtualDom(target.tagName, target.attributesList, target.childList.map(element => subVar(element)), target.value, target.key, target.var);
                }
                else {
                    const myVar = new Var.varForm();
                    myVar.name = myTemplate.name;
                    myVar.state = JSON.parse(`{${myTemplate.state.map(element => (`"${element}":""`)).join(`,`)}}`);
                    myVar.variable = JSON.parse(`{${myTemplate.variables.map(element => (`"${element}":""`)).join(`,`)}}`);
                    myVar.start = myTemplate.firFunc;
                    myVar.update = myTemplate.upFunc;
                    myVar.render = myTemplate.render;

                    return excute(new parser.virtualDom(target.tagName, target.attributesList, target.childList, target.value, target.key, myVar), true);
                }
            }
            else {
                return excute(target, false);
            }
        }

        export const detect = (parent: HTMLElement | Document, lastData: parser.virtualDom | undefined, nowData: parser.virtualDom | undefined, index: number): void => {

            if (parent instanceof HTMLElement) {
                const target: HTMLElement = <HTMLElement>(html.getChild(parent)[index]);

                if (!lastData && !nowData)
                    console.error(`unexpected error`);
                else if (!lastData && nowData) {
                    changer.add(parent, nowData);
                    return;
                }

                else if (lastData && !nowData) {
                    main.delList.push(target);
                    return;
                }

                else if (lastData?.tagName !== nowData?.tagName) {
                    changer.change(parent, target, <parser.virtualDom>nowData);
                    return;
                }

                else if (lastData?.tagName === `text` && nowData?.tagName === `text` && lastData.value != nowData.value) {
                    changer.change(parent, target, <parser.virtualDom>nowData);
                    return;
                }

                else if (lastData?.tagName === nowData?.tagName && lastData?.tagName != `text`)
                    changer.attrChange(target, <Array<parser.virtualState>>lastData?.attributesList, <Array<parser.virtualState>>nowData?.attributesList);
            }
            const maxData: Array<parser.virtualDom> | undefined = <number>(lastData?.childList.length) > <number>(nowData?.childList.length) ? lastData?.childList : nowData?.childList;
            if (maxData !== undefined) {
                for (let i = 0; i < maxData.length; i++) {
                    const nowElement = html.getChild(parent)[index];
                    detect(<HTMLElement>(nowElement), lastData?.childList[i], nowData?.childList[i], i);
                }
            }

        }
    }
}

VarInternal.main.init();
VarInternal.main.detectStart(100);