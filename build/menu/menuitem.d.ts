import { EventLike } from "../common/dom";
import { MenuItem } from "electron";
import { IMenuStyle, IMenuOptions } from "./menu";
import { KeyCode } from "../common/keyCodes";
import { Disposable } from "../common/lifecycle";
export interface IMenuItem {
    render(element: HTMLElement): void;
    isEnabled(): boolean;
    isSeparator(): boolean;
    focus(): void;
    blur(): void;
    dispose(): void;
}
export declare class CETMenuItem extends Disposable implements IMenuItem {
    protected options: IMenuOptions;
    protected menuStyle: IMenuStyle;
    protected container: HTMLElement;
    protected itemElement: HTMLElement;
    private item;
    private radioGroup;
    private labelElement;
    private checkElement;
    private iconElement;
    private mnemonic;
    protected closeSubMenu: () => void;
    protected menuContainer: IMenuItem[];
    private event;
    private currentWindow;
    constructor(item: MenuItem, options?: IMenuOptions, closeSubMenu?: () => void, menuContainer?: IMenuItem[]);
    getContainer(): HTMLElement;
    getItem(): MenuItem;
    isEnabled(): boolean;
    isSeparator(): boolean;
    render(container: HTMLElement): void;
    onClick(event: EventLike): void;
    focus(): void;
    blur(): void;
    setAccelerator(): void;
    updateLabel(): void;
    updateIcon(): void;
    updateTooltip(): void;
    updateEnabled(): void;
    updateVisibility(): void;
    updateChecked(): void;
    updateRadioGroup(): void;
    /** radioGroup index's starts with (previous separator +1 OR menuContainer[0]) and ends with (next separator OR menuContainer[length]) */
    getRadioGroup(): {
        start: number;
        end: number;
    };
    dispose(): void;
    getMnemonic(): KeyCode;
    protected applyStyle(): void;
    style(style: IMenuStyle): void;
}
