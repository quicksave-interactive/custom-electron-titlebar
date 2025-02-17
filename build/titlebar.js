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
exports.Titlebar = void 0;
const platform_1 = require("./common/platform");
const color_1 = require("./common/color");
const dom_1 = require("./common/dom");
const menubar_1 = require("./menubar");
const remote = require("@electron/remote");
const themebar_1 = require("./themebar");
const INACTIVE_FOREGROUND_DARK = color_1.Color.fromHex('#222222');
const ACTIVE_FOREGROUND_DARK = color_1.Color.fromHex('#333333');
const INACTIVE_FOREGROUND = color_1.Color.fromHex('#EEEEEE');
const ACTIVE_FOREGROUND = color_1.Color.fromHex('#FFFFFF');
const IS_MAC_BIGSUR_OR_LATER = platform_1.isMacintosh && parseInt(process.getSystemVersion().split(".")[0]) >= 11;
const BOTTOM_TITLEBAR_HEIGHT = '60px';
const TOP_TITLEBAR_HEIGHT_MAC = IS_MAC_BIGSUR_OR_LATER ? '28px' : '22px';
const TOP_TITLEBAR_HEIGHT_WIN = '30px';
const defaultOptions = {
    backgroundColor: color_1.Color.fromHex('#444444'),
    iconsTheme: themebar_1.Themebar.win,
    shadow: false,
    menu: remote.Menu.getApplicationMenu(),
    minimizable: true,
    maximizable: true,
    closeable: true,
    enableMnemonics: true,
    hideWhenClickingClose: false,
    unfocusEffect: true,
    overflow: "auto",
};
class Titlebar extends themebar_1.Themebar {
    constructor(options) {
        super();
        this.closeMenu = () => {
            if (this.menubar) {
                this.menubar.blur();
            }
        };
        this.currentWindow = remote.getCurrentWindow();
        this._options = Object.assign(Object.assign({}, defaultOptions), options);
        this.registerListeners();
        this.createTitlebar();
        this.updateStyles();
        this.registerTheme(this._options.iconsTheme);
        window.addEventListener('beforeunload', () => {
            this.removeListeners();
        });
    }
    registerListeners() {
        this.events = {};
        this.events[dom_1.EventType.FOCUS] = () => this.onDidChangeWindowFocus(true);
        this.events[dom_1.EventType.BLUR] = () => this.onDidChangeWindowFocus(false);
        this.events[dom_1.EventType.MAXIMIZE] = () => this.onDidChangeMaximized(true);
        this.events[dom_1.EventType.UNMAXIMIZE] = () => this.onDidChangeMaximized(false);
        this.events[dom_1.EventType.ENTER_FULLSCREEN] = () => this.onDidChangeFullscreen(true);
        this.events[dom_1.EventType.LEAVE_FULLSCREEN] = () => this.onDidChangeFullscreen(false);
        for (const k in this.events) {
            this.currentWindow.on(k, this.events[k]);
        }
    }
    // From https://github.com/panjiang/custom-electron-titlebar/commit/825bff6b15e9223c1160208847b4c5010610bcf7
    removeListeners() {
        for (const k in this.events) {
            this.currentWindow.removeListener(k, this.events[k]);
        }
        this.events = {};
    }
    createTitlebar() {
        // Content container
        this.container = dom_1.$('div.container-after-titlebar');
        if (this._options.menuPosition === 'bottom') {
            this.container.style.top = BOTTOM_TITLEBAR_HEIGHT;
            this.container.style.bottom = '0px';
        }
        else {
            this.container.style.top = platform_1.isMacintosh ? TOP_TITLEBAR_HEIGHT_MAC : TOP_TITLEBAR_HEIGHT_WIN;
            this.container.style.bottom = '0px';
        }
        this.container.style.right = '0';
        this.container.style.left = '0';
        this.container.style.position = 'absolute';
        this.container.style.overflow = this._options.overflow;
        while (document.body.firstChild) {
            dom_1.append(this.container, document.body.firstChild);
        }
        dom_1.append(document.body, this.container);
        document.body.style.overflow = 'hidden';
        document.body.style.margin = '0';
        // Titlebar
        this.titlebar = dom_1.$('div.titlebar');
        dom_1.addClass(this.titlebar, platform_1.isWindows ? 'cet-windows' : platform_1.isLinux ? 'cet-linux' : 'cet-mac');
        if (this._options.order) {
            dom_1.addClass(this.titlebar, this._options.order);
        }
        if (this._options.shadow) {
            this.titlebar.style.boxShadow = `0 2px 1px -1px rgba(0, 0, 0, .2), 0 1px 1px 0 rgba(0, 0, 0, .14), 0 1px 3px 0 rgba(0, 0, 0, .12)`;
        }
        this.dragRegion = dom_1.append(this.titlebar, dom_1.$('div.titlebar-drag-region'));
        // App Icon (Windows/Linux)
        if (!platform_1.isMacintosh && this._options.icon) {
            this.appIcon = dom_1.append(this.titlebar, dom_1.$('div.window-appicon'));
            this.updateIcon(this._options.icon);
        }
        // Menubar
        this.menubarContainer = dom_1.append(this.titlebar, dom_1.$('div.menubar'));
        this.menubarContainer.setAttribute('role', 'menubar');
        if (this._options.menu) {
            this.updateMenu(this._options.menu);
            this.updateMenuPosition(this._options.menuPosition);
        }
        // Title
        this.title = dom_1.append(this.titlebar, dom_1.$('div.window-title'));
        if (!platform_1.isMacintosh) {
            this.title.style.cursor = 'default';
        }
        if (IS_MAC_BIGSUR_OR_LATER) {
            this.title.style.fontWeight = "600";
            this.title.style.fontSize = "13px";
        }
        this.updateTitle();
        this.setHorizontalAlignment(this._options.titleHorizontalAlignment);
        // Maximize/Restore on doubleclick
        if (platform_1.isMacintosh) {
            let isMaximized = this.currentWindow.isMaximized();
            this._register(dom_1.addDisposableListener(this.titlebar, dom_1.EventType.DBLCLICK, () => {
                isMaximized = !isMaximized;
                this.onDidChangeMaximized(isMaximized);
            }));
        }
        // Window Controls (Windows/Linux)
        if (!platform_1.isMacintosh) {
            this.windowControls = dom_1.append(this.titlebar, dom_1.$('div.window-controls-container'));
            // Minimize
            const minimizeIconContainer = dom_1.append(this.windowControls, dom_1.$('div.window-icon-bg'));
            minimizeIconContainer.title = "Minimize";
            const minimizeIcon = dom_1.append(minimizeIconContainer, dom_1.$('div.window-icon'));
            dom_1.addClass(minimizeIcon, 'window-minimize');
            if (!this._options.minimizable) {
                dom_1.addClass(minimizeIconContainer, 'inactive');
            }
            else {
                this._register(dom_1.addDisposableListener(minimizeIcon, dom_1.EventType.CLICK, e => {
                    this.currentWindow.minimize();
                }));
            }
            // Restore
            const restoreIconContainer = dom_1.append(this.windowControls, dom_1.$('div.window-icon-bg'));
            this.maxRestoreControl = dom_1.append(restoreIconContainer, dom_1.$('div.window-icon'));
            dom_1.addClass(this.maxRestoreControl, 'window-max-restore');
            if (!this._options.maximizable) {
                dom_1.addClass(restoreIconContainer, 'inactive');
            }
            else {
                this._register(dom_1.addDisposableListener(this.maxRestoreControl, dom_1.EventType.CLICK, e => {
                    if (this.currentWindow.isMaximized()) {
                        this.currentWindow.unmaximize();
                        this.onDidChangeMaximized(false);
                    }
                    else {
                        this.currentWindow.maximize();
                        this.onDidChangeMaximized(true);
                    }
                }));
            }
            // Close
            const closeIconContainer = dom_1.append(this.windowControls, dom_1.$('div.window-icon-bg'));
            closeIconContainer.title = "Close";
            dom_1.addClass(closeIconContainer, 'window-close-bg');
            const closeIcon = dom_1.append(closeIconContainer, dom_1.$('div.window-icon'));
            dom_1.addClass(closeIcon, 'window-close');
            if (!this._options.closeable) {
                dom_1.addClass(closeIconContainer, 'inactive');
            }
            else {
                this._register(dom_1.addDisposableListener(closeIcon, dom_1.EventType.CLICK, e => {
                    if (this._options.hideWhenClickingClose) {
                        this.currentWindow.hide();
                    }
                    else {
                        this.currentWindow.close();
                    }
                }));
            }
            // Resizer
            this.resizer = {
                top: dom_1.append(this.titlebar, dom_1.$('div.resizer.top')),
                left: dom_1.append(this.titlebar, dom_1.$('div.resizer.left'))
            };
            this.onDidChangeMaximized(this.currentWindow.isMaximized());
        }
        dom_1.prepend(document.body, this.titlebar);
    }
    onBlur() {
        this.isInactive = true;
        this.updateStyles();
    }
    onFocus() {
        this.isInactive = false;
        this.updateStyles();
    }
    onMenubarVisibilityChanged(visible) {
        if (platform_1.isWindows || platform_1.isLinux) {
            // Hide title when toggling menu bar
            if (visible) {
                // Hack to fix issue #52522 with layered webkit-app-region elements appearing under cursor
                dom_1.hide(this.dragRegion);
                setTimeout(() => dom_1.show(this.dragRegion), 50);
            }
        }
    }
    onMenubarFocusChanged(focused) {
        if (platform_1.isWindows || platform_1.isLinux) {
            if (focused) {
                dom_1.hide(this.dragRegion);
            }
            else {
                dom_1.show(this.dragRegion);
            }
        }
    }
    onDidChangeWindowFocus(hasFocus) {
        if (this.titlebar) {
            if (hasFocus) {
                dom_1.removeClass(this.titlebar, 'inactive');
                this.onFocus();
            }
            else {
                dom_1.addClass(this.titlebar, 'inactive');
                this.closeMenu();
                this.onBlur();
            }
        }
    }
    onDidChangeMaximized(maximized) {
        if (this.maxRestoreControl) {
            if (maximized) {
                dom_1.removeClass(this.maxRestoreControl, 'window-maximize');
                this.maxRestoreControl.title = "Restore Down";
                dom_1.addClass(this.maxRestoreControl, 'window-unmaximize');
            }
            else {
                dom_1.removeClass(this.maxRestoreControl, 'window-unmaximize');
                this.maxRestoreControl.title = "Maximize";
                dom_1.addClass(this.maxRestoreControl, 'window-maximize');
            }
        }
        if (this.resizer) {
            if (maximized) {
                dom_1.hide(this.resizer.top, this.resizer.left);
            }
            else {
                dom_1.show(this.resizer.top, this.resizer.left);
            }
        }
    }
    onDidChangeFullscreen(fullscreen) {
        if (!platform_1.isMacintosh) {
            if (fullscreen) {
                dom_1.hide(this.appIcon, this.title, this.windowControls);
            }
            else {
                dom_1.show(this.appIcon, this.title, this.windowControls);
            }
        }
    }
    updateStyles() {
        if (this.titlebar) {
            if (this.isInactive) {
                dom_1.addClass(this.titlebar, 'inactive');
            }
            else {
                dom_1.removeClass(this.titlebar, 'inactive');
            }
            const titleBackground = this.isInactive && this._options.unfocusEffect
                ? this._options.backgroundColor.lighten(.45)
                : this._options.backgroundColor;
            this.titlebar.style.backgroundColor = titleBackground.toString();
            let titleForeground;
            if (titleBackground.isLighter()) {
                dom_1.addClass(this.titlebar, 'light');
                titleForeground = this.isInactive && this._options.unfocusEffect
                    ? INACTIVE_FOREGROUND_DARK
                    : ACTIVE_FOREGROUND_DARK;
            }
            else {
                dom_1.removeClass(this.titlebar, 'light');
                titleForeground = this.isInactive && this._options.unfocusEffect
                    ? INACTIVE_FOREGROUND
                    : ACTIVE_FOREGROUND;
            }
            this.titlebar.style.color = titleForeground.toString();
            const backgroundColor = this._options.backgroundColor.darken(.16);
            const foregroundColor = backgroundColor.isLighter()
                ? INACTIVE_FOREGROUND_DARK
                : INACTIVE_FOREGROUND;
            const bgColor = !this._options.itemBackgroundColor || this._options.itemBackgroundColor.equals(backgroundColor)
                ? new color_1.Color(new color_1.RGBA(0, 0, 0, .14))
                : this._options.itemBackgroundColor;
            const fgColor = bgColor.isLighter() ? ACTIVE_FOREGROUND_DARK : ACTIVE_FOREGROUND;
            if (this.menubar) {
                this.menubar.setStyles({
                    backgroundColor: backgroundColor,
                    foregroundColor: foregroundColor,
                    selectionBackgroundColor: bgColor,
                    selectionForegroundColor: fgColor,
                    separatorColor: foregroundColor
                });
            }
        }
    }
    /**
     * get the options of the titlebar
     */
    get options() {
        return this._options;
    }
    /**
     * Update the background color of the title bar
     * @param backgroundColor The color for the background
     */
    updateBackground(backgroundColor) {
        this._options.backgroundColor = backgroundColor;
        this.updateStyles();
    }
    /**
     * Update the item background color of the menubar
     * @param itemBGColor The color for the item background
     */
    updateItemBGColor(itemBGColor) {
        this._options.itemBackgroundColor = itemBGColor;
        this.updateStyles();
    }
    /**
   * Update the title of the title bar.
   * You can use this method if change the content of `<title>` tag on your html.
   * @param title The title of the title bar and document.
   */
    updateTitle(title) {
        if (this.title) {
            if (title) {
                document.title = title;
            }
            else {
                title = document.title;
            }
            this.title.innerText = title;
        }
    }
    /**
     * It method set new icon to title-bar-icon of title-bar.
     * @param path path to icon
     */
    updateIcon(path) {
        if (path === null || path === '') {
            return;
        }
        if (this.appIcon) {
            this.appIcon.style.backgroundImage = `url("${path}")`;
        }
    }
    /**
     * Update the default menu or set a new menu.
     * @param menu The menu.
     */
    // Menu enhancements, moved menu to bottom of window-titlebar. (by @MairwunNx) https://github.com/AlexTorresSk/custom-electron-titlebar/pull/9
    updateMenu(menu) {
        if (!platform_1.isMacintosh) {
            if (this.menubar) {
                this.menubar.dispose();
                if (!menu) {
                    return;
                }
                this._options.menu = menu;
            }
            this.menubar = new menubar_1.Menubar(this.menubarContainer, this._options, this.closeMenu);
            this.menubar.setupMenubar();
            this._register(this.menubar.onVisibilityChange(e => this.onMenubarVisibilityChanged(e)));
            this._register(this.menubar.onFocusStateChange(e => this.onMenubarFocusChanged(e)));
            this.updateStyles();
        }
        else {
            remote.Menu.setApplicationMenu(menu);
        }
    }
    /**
     * Update the position of menubar.
     * @param menuPosition The position of the menu `left` or `bottom`.
     */
    updateMenuPosition(menuPosition) {
        this._options.menuPosition = menuPosition;
        if (platform_1.isMacintosh) {
            this.titlebar.style.height = this._options.menuPosition && this._options.menuPosition === 'bottom' ? BOTTOM_TITLEBAR_HEIGHT : TOP_TITLEBAR_HEIGHT_MAC;
            this.container.style.top = this._options.menuPosition && this._options.menuPosition === 'bottom' ? BOTTOM_TITLEBAR_HEIGHT : TOP_TITLEBAR_HEIGHT_MAC;
        }
        else {
            this.titlebar.style.height = this._options.menuPosition && this._options.menuPosition === 'bottom' ? BOTTOM_TITLEBAR_HEIGHT : TOP_TITLEBAR_HEIGHT_WIN;
            this.container.style.top = this._options.menuPosition && this._options.menuPosition === 'bottom' ? BOTTOM_TITLEBAR_HEIGHT : TOP_TITLEBAR_HEIGHT_WIN;
        }
        this.titlebar.style.webkitFlexWrap = this._options.menuPosition && this._options.menuPosition === 'bottom' ? 'wrap' : null;
        if (this._options.menuPosition === 'bottom') {
            dom_1.addClass(this.menubarContainer, 'bottom');
        }
        else {
            dom_1.removeClass(this.menubarContainer, 'bottom');
        }
    }
    /**
     * Horizontal alignment of the title.
     * @param side `left`, `center` or `right`.
     */
    // Add ability to customize title-bar title. (by @MairwunNx) https://github.com/AlexTorresSk/custom-electron-titlebar/pull/8
    setHorizontalAlignment(side) {
        if (this.title) {
            if (side === 'left' || (side === 'right' && this._options.order === 'inverted')) {
                this.title.style.marginLeft = '8px';
                this.title.style.marginRight = 'auto';
            }
            if (side === 'right' || (side === 'left' && this._options.order === 'inverted')) {
                this.title.style.marginRight = '8px';
                this.title.style.marginLeft = 'auto';
            }
            if (side === 'center' || side === undefined) {
                this.title.style.marginRight = 'auto';
                this.title.style.marginLeft = 'auto';
            }
        }
    }
    /**
     * Remove the titlebar, menubar and all methods.
     */
    dispose() {
        if (this.menubar)
            this.menubar.dispose();
        dom_1.removeNode(this.titlebar);
        while (this.container.firstChild) {
            dom_1.append(document.body, this.container.firstChild);
        }
        dom_1.removeNode(this.container);
        this.removeListeners();
        super.dispose();
    }
}
exports.Titlebar = Titlebar;
//# sourceMappingURL=titlebar.js.map