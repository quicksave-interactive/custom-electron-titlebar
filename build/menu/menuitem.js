"use strict";
/*--------------------------------------------------------------------------------------------------------
 *  This file has been modified by @AlexTorresSk (http://github.com/AlexTorresSk)
 *  to work in custom-electron-titlebar.
 *
 *  The original copy of this file and its respective license are in https://github.com/Microsoft/vscode/
 *
 *  Copyright (c) 2018 Alex Torres
 *  Licensed under the MIT License. See License in the project root for license information.
 *-------------------------------------------------------------------------------------------------------*/
Object.defineProperty(exports, "__esModule", { value: true });
exports.CETMenuItem = void 0;
const dom_1 = require("../common/dom");
const remote = require("@electron/remote");
const menu_1 = require("./menu");
const keyCodes_1 = require("../common/keyCodes");
const lifecycle_1 = require("../common/lifecycle");
const platform_1 = require("../common/platform");
class CETMenuItem extends lifecycle_1.Disposable {
    constructor(item, options = {}, closeSubMenu = () => { }, menuContainer = undefined) {
        super();
        this.item = item;
        this.options = options;
        this.currentWindow = remote.getCurrentWindow();
        this.closeSubMenu = closeSubMenu;
        this.menuContainer = menuContainer;
        // Set mnemonic
        if (this.item.label && options.enableMnemonics) {
            let label = this.item.label;
            if (label) {
                let matches = menu_1.MENU_MNEMONIC_REGEX.exec(label);
                if (matches) {
                    this.mnemonic = keyCodes_1.KeyCodeUtils.fromString((!!matches[1] ? matches[1] : matches[2]).toLocaleUpperCase());
                }
            }
        }
    }
    getContainer() {
        return this.container;
    }
    getItem() {
        return this.item;
    }
    isEnabled() {
        return this.item.enabled;
    }
    isSeparator() {
        return this.item.type === 'separator';
    }
    render(container) {
        this.container = container;
        this._register(dom_1.addDisposableListener(this.container, dom_1.EventType.MOUSE_DOWN, e => {
            if (this.item.enabled && e.button === 0 && this.container) {
                dom_1.addClass(this.container, 'active');
            }
        }));
        this._register(dom_1.addDisposableListener(this.container, dom_1.EventType.CLICK, e => {
            if (this.item.enabled) {
                this.onClick(e);
            }
        }));
        this._register(dom_1.addDisposableListener(this.container, dom_1.EventType.DBLCLICK, e => {
            dom_1.EventHelper.stop(e, true);
        }));
        [dom_1.EventType.MOUSE_UP, dom_1.EventType.MOUSE_OUT].forEach(event => {
            this._register(dom_1.addDisposableListener(this.container, event, e => {
                dom_1.EventHelper.stop(e);
                dom_1.removeClass(this.container, 'active');
            }));
        });
        this.itemElement = dom_1.append(this.container, dom_1.$('a.action-menu-item'));
        this.itemElement.setAttribute('role', 'menuitem');
        if (this.mnemonic) {
            this.itemElement.setAttribute('aria-keyshortcuts', `${this.mnemonic}`);
        }
        this.checkElement = dom_1.append(this.itemElement, dom_1.$('span.menu-item-check'));
        this.checkElement.setAttribute('role', 'none');
        this.iconElement = dom_1.append(this.itemElement, dom_1.$('span.menu-item-icon'));
        this.iconElement.setAttribute('role', 'none');
        this.labelElement = dom_1.append(this.itemElement, dom_1.$('span.action-label'));
        this.setAccelerator();
        this.updateLabel();
        this.updateIcon();
        this.updateTooltip();
        this.updateEnabled();
        this.updateChecked();
        this.updateVisibility();
    }
    onClick(event) {
        dom_1.EventHelper.stop(event, true);
        this.item.click(this.event, this.currentWindow, this.currentWindow.webContents);
        if (this.item.type === 'checkbox') {
            this.updateChecked();
        }
        else if (this.item.type === 'radio') {
            this.updateRadioGroup();
        }
        else {
            this.closeSubMenu();
        }
    }
    focus() {
        if (this.container) {
            this.container.focus();
            dom_1.addClass(this.container, 'focused');
        }
        this.applyStyle();
    }
    blur() {
        if (this.container) {
            this.container.blur();
            dom_1.removeClass(this.container, 'focused');
        }
        this.applyStyle();
    }
    setAccelerator() {
        var accelerator = null;
        if (this.item.role) {
            switch (this.item.role.toLocaleLowerCase()) {
                case 'undo':
                    accelerator = 'CtrlOrCmd+Z';
                    break;
                case 'redo':
                    accelerator = 'CtrlOrCmd+Y';
                    break;
                case 'cut':
                    accelerator = 'CtrlOrCmd+X';
                    break;
                case 'copy':
                    accelerator = 'CtrlOrCmd+C';
                    break;
                case 'paste':
                    accelerator = 'CtrlOrCmd+V';
                    break;
                case 'selectall':
                    accelerator = 'CtrlOrCmd+A';
                    break;
                case 'minimize':
                    accelerator = 'CtrlOrCmd+M';
                    break;
                case 'close':
                    accelerator = 'CtrlOrCmd+W';
                    break;
                case 'reload':
                    accelerator = 'CtrlOrCmd+R';
                    break;
                case 'forcereload':
                    accelerator = 'CtrlOrCmd+Shift+R';
                    break;
                case 'toggledevtools':
                    accelerator = 'CtrlOrCmd+Shift+I';
                    break;
                case 'togglefullscreen':
                    accelerator = 'F11';
                    break;
                case 'resetzoom':
                    accelerator = 'CtrlOrCmd+0';
                    break;
                case 'zoomin':
                    accelerator = 'CtrlOrCmd+Shift+=';
                    break;
                case 'zoomout':
                    accelerator = 'CtrlOrCmd+-';
                    break;
            }
        }
        if (this.item.label && this.item.accelerator) {
            accelerator = this.item.accelerator;
        }
        if (accelerator !== null) {
            dom_1.append(this.itemElement, dom_1.$('span.keybinding')).textContent = parseAccelerator(accelerator);
        }
    }
    updateLabel() {
        if (this.item.label) {
            let label = this.item.label;
            if (label) {
                const cleanLabel = menu_1.cleanMnemonic(label);
                if (!this.options.enableMnemonics) {
                    label = cleanLabel;
                }
                if (this.labelElement) {
                    this.labelElement.setAttribute('aria-label', cleanLabel.replace(/&&/g, '&'));
                }
                const matches = menu_1.MENU_MNEMONIC_REGEX.exec(label);
                if (matches) {
                    label = escape(label);
                    // This is global, reset it
                    menu_1.MENU_ESCAPED_MNEMONIC_REGEX.lastIndex = 0;
                    let escMatch = menu_1.MENU_ESCAPED_MNEMONIC_REGEX.exec(label);
                    // We can't use negative lookbehind so if we match our negative and skip
                    while (escMatch && escMatch[1]) {
                        escMatch = menu_1.MENU_ESCAPED_MNEMONIC_REGEX.exec(label);
                    }
                    if (escMatch) {
                        label = `${label.substr(0, escMatch.index)}<u aria-hidden="true">${escMatch[3]}</u>${label.substr(escMatch.index + escMatch[0].length)}`;
                    }
                    label = label.replace(/&amp;&amp;/g, '&amp;');
                    if (this.itemElement) {
                        this.itemElement.setAttribute('aria-keyshortcuts', (!!matches[1] ? matches[1] : matches[3]).toLocaleLowerCase());
                    }
                }
                else {
                    label = label.replace(/&&/g, '&');
                }
            }
            if (this.labelElement) {
                this.labelElement.innerHTML = label.trim();
            }
        }
    }
    updateIcon() {
        let icon = null;
        if (this.item.icon) {
            icon = this.item.icon;
        }
        if (icon) {
            const iconE = dom_1.append(this.iconElement, dom_1.$('img'));
            iconE.setAttribute('src', icon.toString());
        }
    }
    updateTooltip() {
        let title = null;
        if (this.item.sublabel) {
            title = this.item.sublabel;
        }
        else if (!this.item.label && this.item.label && this.item.icon) {
            title = this.item.label;
            if (this.item.accelerator) {
                title = parseAccelerator(this.item.accelerator);
            }
        }
        if (title) {
            this.itemElement.title = title;
        }
    }
    updateEnabled() {
        if (this.item.enabled && this.item.type !== 'separator') {
            dom_1.removeClass(this.container, 'disabled');
            this.container.tabIndex = 0;
        }
        else {
            dom_1.addClass(this.container, 'disabled');
        }
    }
    updateVisibility() {
        if (this.item.visible === false && this.itemElement) {
            this.itemElement.remove();
        }
    }
    updateChecked() {
        if (this.item.checked) {
            dom_1.addClass(this.itemElement, 'checked');
            this.itemElement.setAttribute('role', 'menuitemcheckbox');
            this.itemElement.setAttribute('aria-checked', 'true');
        }
        else {
            dom_1.removeClass(this.itemElement, 'checked');
            this.itemElement.setAttribute('role', 'menuitem');
            this.itemElement.setAttribute('aria-checked', 'false');
        }
    }
    updateRadioGroup() {
        if (this.radioGroup === undefined) {
            this.radioGroup = this.getRadioGroup();
        }
        for (let i = this.radioGroup.start; i < this.radioGroup.end; i++) {
            const menuItem = this.menuContainer[i];
            if (menuItem instanceof CETMenuItem && menuItem.item.type === 'radio') {
                // updateChecked() *all* radio buttons in group
                menuItem.updateChecked();
                // set the radioGroup property of all the other radio buttons since it was already calculated
                if (menuItem !== this) {
                    menuItem.radioGroup = this.radioGroup;
                }
            }
        }
    }
    /** radioGroup index's starts with (previous separator +1 OR menuContainer[0]) and ends with (next separator OR menuContainer[length]) */
    getRadioGroup() {
        let startIndex = 0;
        let endIndex = this.menuContainer.length;
        let found = false;
        for (const index in this.menuContainer) {
            const menuItem = this.menuContainer[index];
            if (menuItem === this) {
                found = true;
            }
            else if (menuItem instanceof CETMenuItem && menuItem.isSeparator()) {
                if (found) {
                    endIndex = Number.parseInt(index);
                    break;
                }
                else {
                    startIndex = Number.parseInt(index) + 1;
                }
            }
        }
        return { start: startIndex, end: endIndex };
    }
    dispose() {
        if (this.itemElement) {
            dom_1.removeNode(this.itemElement);
            this.itemElement = undefined;
        }
        super.dispose();
    }
    getMnemonic() {
        return this.mnemonic;
    }
    applyStyle() {
        if (!this.menuStyle) {
            return;
        }
        const isSelected = this.container && dom_1.hasClass(this.container, 'focused');
        const fgColor = isSelected && this.menuStyle.selectionForegroundColor ? this.menuStyle.selectionForegroundColor : this.menuStyle.foregroundColor;
        const bgColor = isSelected && this.menuStyle.selectionBackgroundColor ? this.menuStyle.selectionBackgroundColor : this.menuStyle.backgroundColor;
        this.checkElement.style.backgroundColor = fgColor ? fgColor.toString() : null;
        this.itemElement.style.color = fgColor ? fgColor.toString() : null;
        this.itemElement.style.backgroundColor = bgColor ? bgColor.toString() : null;
    }
    style(style) {
        this.menuStyle = style;
        this.applyStyle();
    }
}
exports.CETMenuItem = CETMenuItem;
function parseAccelerator(a) {
    var accelerator = a.toString();
    if (!platform_1.isMacintosh) {
        accelerator = accelerator.replace(/(Cmd)|(Command)/gi, '');
    }
    else {
        accelerator = accelerator.replace(/(Ctrl)|(Control)/gi, '');
    }
    accelerator = accelerator.replace(/(Or)/gi, '');
    return accelerator;
}
//# sourceMappingURL=menuitem.js.map