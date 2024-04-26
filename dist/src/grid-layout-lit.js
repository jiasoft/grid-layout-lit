import { __decorate } from "tslib";
import { html, css, LitElement } from "lit";
import { property, state, customElement } from "lit/decorators.js";
import { GridItemReizeName, } from "./types.js";
import { MORE_SVG, TITLE_SVG, DELETE_SVG, ADD_SVG, BACK_LAYOUT, FORWARD_LAYOUT, SAVE_LAYOUT, CLOSE_LAYOUT, EDIT_SVG, STYLE_SVG, ZINDEX_UP_SVG, ZINDEX_DOWN_SVG, DELETE_LAYOUT_SVG, } from "./icon.js";
// import { generateRandomUID } from '../../lib/api'
const generateRandomUID = () => {
    return "xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx".replace(/[xy]/g, (c) => {
        const r = (Math.random() * 16) | 0, v = c === "x" ? r : (r & 0x3) | 0x8;
        return v.toString(16);
    });
};
const DRAG_ID = "100000";
let GridLayoutLit = class GridLayoutLit extends LitElement {
    get layoutDefaultGridStyle() {
        return this.$layoutDefaultGridStyle;
    }
    set layoutDefaultGridStyle(val) {
        this.$layoutDefaultGridStyle = val || this.$layoutDefaultGridStyle;
        this.style.overflowY = this.isDisableScrollBars ? "hidden" : "auto";
    }
    /**
     * 是否显示滚动条
     */
    get hasDisplayScrollBar() {
        if (this.layoutDefaultGridStyle.disableScrollBars)
            return false;
        return this.calcStageActualHeight > this.clientHeight;
    }
    /**
     * 是否禁止滚动条
     */
    get isDisableScrollBars() {
        return this.layoutDefaultGridStyle.disableScrollBars;
    }
    /**
     * 正常情况下 有滚动条 的时候 每个网格的宽度所占的像素值
     */
    get griddingWidth() {
        return this.stageWidth / this.maxGridItemWidthCount;
    }
    /**
     * 计算每个网格的高度所占的像素值
     */
    get griddingHeight() {
        var _a;
        //满屏算法  计算没有滚动条的时候 计算出每个网格的高度
        if (!this.edit && ((_a = this.layoutDefaultGridStyle) === null || _a === void 0 ? void 0 : _a.disableScrollBars)) {
            const _griddingHeight = this.stageHeight / this.calcStageVirtualHeight;
            return _griddingHeight < this.griddingWidth
                ? _griddingHeight
                : this.griddingWidth;
        }
        return this.griddingWidth;
    }
    /**
     * 选中的GridItem
     */
    get selectedGridItem() {
        return this.layoutData.find((item) => item.selected);
    }
    /**
     * 重新渲染
     */
    reRender() {
        this.RenderIndex++;
    }
    /**
     * 拖拽阴影dom
     * @returns
     */
    drawDragDataHtml() {
        return html `<div
      class="grid-item drag"
      drag="${true}"
      style="${this.getGridItemStyle(this.dragData)}"
    ></div>`;
    }
    constructor() {
        super();
        /**
         * @state 相当于数据绑定 有变化触发页面渲染
         * @property 外部可调用 外部传入
         */
        /**
         * 这个属性改动，页面才会render
         */
        this.RenderIndex = 0;
        /**
         * 网格间距,每个间距是一个网格数
         */
        this.gridMargin = 1;
        this.edit = false;
        this.layoutData = [];
        this.hideToolbar = false;
        this.headerConfigList = [];
        /**
         * 拖拽布局默认样式
         */
        this.$layoutDefaultGridStyle = {
            borderRadius: 3,
            borderColor: "#c3c3c3",
            borderWidth: 1,
            borderStyle: "solid",
            titleColor: "",
            contentColor: "",
            disableScrollBars: false,
        };
        this.i18n = {
            t: (k, b) => k,
            tt: (k, b) => k,
            locale: "zh-cn",
        };
        /**
         * 拖拽布局总体宽度 像素
         */
        this.stageWidth = 1000;
        /**
         * 拖拽布局总体高度 像素
         */
        this.stageHeight = 800;
        // @property({ type: Boolean }) disableScrollBars = false //是否禁止滚动
        /**
         * 宽度最大的网格数
         */
        this.maxGridItemWidthCount = 173;
        /**
         * 高度最大的网格数
         */
        this.maxGridItemHeightCount = 86;
        /**
         * 当前点击弹出菜单的Postion
         */
        this.curGridItemSubMenuPos = { x: 0, y: 0 };
        /**
         * 显示相关的GridItem 的菜单
         */
        this.curGridItemSubMenuShow = false;
        /**
         * 当前点击弹出菜单GridItem
         */
        this.curGridItemSubMenuGridData = null;
        // styleMapEditing: boolean = false
        this.showDialogGridStyle = false;
        /**
         * 底部占位阴影的数据
         * (所有gridItem共用一个阴影)
         */
        this.dragData = { x: 0, y: 0, w: 60, h: 60, z: 0, id: DRAG_ID };
        this.draggIng = false;
        this.floatStep = 1;
        this.lightningId = "";
        /** resize相关 */
        /**
         * 移动初始位置
         */
        this.resizeFixPosition = { top: 0, left: 0 };
        /**
         * 移动中的位置
         */
        this.resizeingPosition = { top: 0, left: 0 };
        /**
         * 移动初始griditem 数据
         */
        this.resizeFixGridItemData = null;
        /**
         * 当前移动中的 gridItem 数据
         */
        this.curResizingGridItemData = null;
        /**
         * 暂时无用
         * 存储数据
         */
        this.dataStore = [];
        this.dataStoreIndex = 0;
        this.curMovingGridItemData = null;
        this.movePosition = { left: 0, top: 0 };
        // fixPosition: HtmlPosition = { left: 0, top: 0 }
        // oldPosition: HtmlPosition = { left: 0, top: 0 }
        this.transition = false;
        /**
         * 默认 每个拖拽项目的宽高 所占的网格数
         */
        this.defaultGridItemWidth = 13;
        this.defaultGridItemHeight = 7;
        this.defaultRightMargin = 3;
        /**
         * 查找GridItem
         * @param id gridItem id
         * @returns
         */
        this.findGridItemData = (id) => {
            return this.layoutData.find((item) => item.id === id);
        };
        /**
         * 查找存在的最大的重叠交叉项
         * */
        this.findBigestOverlapItem = (dataList, x, y, w, //每个网格宽度所占的像素值
        h, //每个网格高度所占的像素值
        exceptIds, exceptFloatItem = true) => {
            const list = this.findOverlapItem(dataList, x, y, w, h, exceptIds, 0, exceptFloatItem);
            let BigestOverlapArea = -99999999999; //最大的重叠交叉面积
            let BigestOverlapItem = undefined;
            list.forEach((item) => {
                const curItemX = item.x;
                const curItemY = item.y;
                const curItemW = item.w;
                const curItemH = item.h;
                const overX1 = Math.max(x, curItemX);
                const overX2 = Math.min(x + w, curItemX + curItemW);
                const overW = overX2 - overX1;
                const overY1 = Math.max(y, curItemY);
                const overY2 = Math.min(y + h, curItemY + curItemH);
                const overH = overY2 - overY1;
                const overArea = overH * overW;
                if (overArea > BigestOverlapArea) {
                    BigestOverlapArea = overArea;
                    BigestOverlapItem = item;
                }
            });
            return BigestOverlapItem;
        };
        /**
         * 获取交叉的GridItem 列表
         * @param x x
         * @param y y
         * @param w w
         * @param h h
         * @param exceptIds 排除的id
         * @param exceptFloatItem 排除 浮动的项目
         * @param overCount 暂时定为 允许 重叠的网格个数
         * @returns 交叉的GridItem 列表
         */
        this.findOverlapItem = (dataList, x, y, w, h, exceptIds, overCount = 0, exceptFloatItem = true) => {
            const list = [];
            let data = [...dataList];
            if (exceptFloatItem)
                data = data.filter((item) => !item.float);
            if (this.curActiveGridItem && this.dragData) {
                // 如果有正在拖动的 那么 将正在拖动的项目添加到列表中
                if (!data.find((item) => item.id === this.dragData.id)) {
                    data = [...data, this.dragData];
                }
            }
            for (let i = 0; i < data.length; i++) {
                const item = data[i];
                // 如果当前项目正在排出列表中 直接跳过循环
                if (exceptIds && exceptIds.indexOf(item.id) >= 0) {
                    continue;
                }
                // 当前项目的位置 大小 信息
                const curItemX = item.x;
                const curItemY = item.y;
                const curItemW = item.w;
                const curItemH = item.h;
                // 对比项目(传入的) 与当前项目 对比 取出较小的
                const x1 = Math.min(curItemX, x);
                // 对比项目(传入的) 与当前项目 对比 取出较大的
                const x2 = Math.max(curItemX + curItemW, x + w);
                const y1 = Math.min(curItemY, y);
                const y2 = Math.max(curItemY + curItemH, y + h);
                //是否存在交叉的算法
                // 假如两个项目重叠  那么 第一个项目的最左侧 + 第二个项目的最右侧 的 宽度 一定小于 两个 项目的宽度和
                // 高度同上
                if (x2 - x1 - (curItemW + w) + overCount < this.gridMargin &&
                    y2 - y1 - (curItemH + h) + overCount < this.gridMargin) {
                    list.push(item);
                }
            }
            return list;
        };
        /**
         * 触发gridItemResize事件
         */
        this.handDispatchGridItemResizeEvent = 0;
        /**
         * 转换成的GidPosition
         * @param left style.left
         * @param top style.top
         * @returns {x,y}
         */
        this.calcNearPosition = (left, top) => {
            const x = Math.round(left / this.griddingWidth);
            const y = Math.round(top / this.griddingHeight);
            return { x, y };
        };
        /** 无用代码
         * 返回 上次的layout
         * @returns JSON
         */
        this.getBackLayout = () => {
            this.dataStoreIndex--;
            return this.dataStore[this.dataStoreIndex];
        };
        /**
         * // 无用代码
         * 打开上次的保存layout
         */
        this.backLayout = () => {
            const data = this.getBackLayout();
            if (data) {
                this.layoutData = JSON.parse(data);
            }
        };
        /** 调试代码 无用 下一个layout */
        this.getForwardLayout = () => {
            this.dataStoreIndex =
                this.dataStore.length - 1 > this.dataStoreIndex
                    ? this.dataStoreIndex + 1
                    : this.dataStore.length - 1;
            return this.dataStore[this.dataStoreIndex];
        };
        /**
         * 调试代码 无用
         * 打开下一步的layout
         */
        this.forwardLayout = () => {
            const data = this.getForwardLayout();
            if (data) {
                this.layoutData = JSON.parse(data);
            }
        };
        /**
         * 调试代码, 无用
         * 关闭事件
         */
        this.close = () => {
            const emit = new Event("close");
            emit.detail = this.layoutData;
            this.dispatchEvent(emit);
        };
        /**
         * 测试代码 无用
         */
        this.save = () => {
            const emit = new Event("save");
            emit.detail = this.layoutData;
            this.dispatchEvent(emit);
        };
        /**
         * 复杂
         * @returns
         */
        this.gridItemCopyBySubMenu = () => {
            if (!this.curGridItemSubMenuGridData)
                return;
            const emit = new Event("gridItemCopy");
            emit.detail = this.curGridItemSubMenuGridData;
            this.closeGridItemSubMenu();
            this.reRender();
            this.dispatchEvent(emit);
        };
        /**
         * resize事件
         */
        this.boxResizeTime = 0;
        /**
         * 绑定事件
         */
        this.bindHnd = {};
    }
    /**
     * 添加 gridItem
     * @returns
     */
    addGridItem() {
        const w = this.defaultGridItemWidth;
        const h = this.defaultGridItemHeight;
        const { x, y } = this.getEmptyBound(w, h, false);
        const tid = generateRandomUID();
        const floatCount = this.layoutData.filter((item) => item.float).length;
        const item = {
            x,
            y,
            w,
            h,
            z: floatCount,
            id: tid,
            slot: "slot_" + tid,
            title: tid,
        };
        if (this.isDisableScrollBars) {
            const maxHeight = this.getBoundingClientRect().height;
            if ((y + h) * this.griddingWidth >= maxHeight) {
                item.float = true;
                if ((this.floatStep + item.w) * this.griddingWidth >= this.stageWidth ||
                    (this.floatStep + item.h) * this.griddingHeight >= maxHeight) {
                    this.floatStep = 1;
                }
                item.y = this.floatStep + 1;
                item.x = this.floatStep + 1;
                this.floatStep = item.y;
            }
        }
        this.layoutData.push(item);
        this.reRender();
        this.saveCurLayout();
        return item;
    }
    /**
     * 闪一下Grid的样式
     * @param grid
     */
    lightningGrid(grid) {
        this.lightningId = String(grid.id);
        this.reRender();
        this.focusGridItem(grid);
        setTimeout(() => {
            this.lightningId = "";
            this.reRender();
        }, 500);
    }
    /**
     * 移动到这个GridItem的显示屏上
     * @param grid
     */
    focusGridItem(grid) {
        setTimeout(async () => {
            const index = this.layoutData.findIndex((item) => item.id === grid.id);
            const element = await this.getGridItemElement(index);
            if (!element)
                return;
            const input = document.createElement("input");
            input.style.position = "absolute";
            input.style.opacity = "0.01";
            element.appendChild(input);
            input.focus();
            setTimeout(() => {
                element.removeChild(input);
            }, 50);
        }, 100);
    }
    /**
     * 获取GridItem的元素
     * @param index gridItem的index
     * @returns
     */
    getGridItemElement(index) {
        return new Promise((resolve) => {
            let length = 20;
            const loopfindGridItem = () => {
                var _a;
                const ele = (_a = this.shadowRoot) === null || _a === void 0 ? void 0 : _a.querySelector(`.grid-item[data-index="${index}"]`);
                if (ele) {
                    resolve(ele);
                }
                else {
                    setTimeout(() => {
                        if (--length <= 0) {
                            resolve(null);
                            return;
                        }
                        loopfindGridItem();
                    }, 10);
                }
            };
            loopfindGridItem();
        });
    }
    /**
     * 获取空间的位置
     * @param w
     * @param h
     * @returns { x, y }
     */
    getEmptyBound(w, h, exceptFloatItem = true) {
        let x = this.gridMargin, y = this.gridMargin;
        let item = this.findBigestOverlapItem(this.layoutData, x, y, w, h, [], exceptFloatItem);
        while (item) {
            x = item.x + item.w + this.gridMargin;
            if ((x + this.gridMargin) * this.griddingWidth + w * this.griddingWidth >
                this.stageWidth) {
                y += this.gridMargin;
                x = this.gridMargin;
            }
            item = this.findBigestOverlapItem(this.layoutData, x, y, w, h, [], exceptFloatItem);
        }
        return { x, y };
    }
    /**
     * Resize start 拖拉grid item 的大小
     * @param event MouseEvent
     */
    gridItemResizeStart(event) {
        if (!this.edit)
            return;
        event.preventDefault();
        event.stopPropagation();
        // 获取当前 item的索引
        const index = this.getGridItemIndex(event.currentTarget);
        // 当前拖拽项目数据
        this.curResizingGridItemData = this.layoutData[index];
        // 复制当前拖拽项目数据
        this.resizeFixGridItemData = { ...this.layoutData[index] };
        // 鼠标的位置
        // 记录鼠标按下时的位置
        this.resizeFixPosition.left = event.clientX;
        this.resizeFixPosition.top = event.clientY;
        // 记录鼠标拖动中的位置
        this.resizeingPosition.left = event.clientX;
        this.resizeingPosition.top = event.clientY;
        // 开启动画效果
        this.transition = true;
        // 重新渲染
        this.reRender();
        // 设置dom 今只文字选中
        document.body.setAttribute("onselectstart", "return false");
        // 设置鼠标为 resize 状态
        document.body.style.cursor = "se-resize";
        // 鼠标移动方法
        const mouseMove = (event) => {
            // 鼠标移动的时候方块大小改变
            this.gridItemResizeing(event);
        };
        // 初始化阴影的位置 所有网格共用一个阴影
        const { x, y, w, h, id } = this.curResizingGridItemData;
        this.dragData.x = x;
        this.dragData.y = y;
        this.dragData.w = w;
        this.dragData.h = h;
        // 释放鼠标左键触发的方法
        const mouseup = () => {
            // 移除选中文字的属性
            document.body.removeAttribute("onselectstart");
            // 去除鼠标箭头样式
            document.body.style.cursor = "";
            // 结束网格 resize 状态
            this.gridItemResizeEnd();
            window.removeEventListener("mousemove", mouseMove);
            window.removeEventListener("mouseup", mouseup);
        };
        // 鼠标移动方法
        window.addEventListener("mousemove", mouseMove);
        // 鼠标松开
        window.addEventListener("mouseup", mouseup);
    }
    /**
     * resizeing  中的方法
     * @param event
     */
    gridItemResizeing(event) {
        var _a, _b, _c, _d, _e;
        // 不是编辑状态 不让拖
        if (!this.edit)
            return;
        // 代码保护
        if (!this.curResizingGridItemData)
            return;
        // 记录移动后鼠标的位置
        this.resizeingPosition.left = event.clientX;
        this.resizeingPosition.top = event.clientY;
        if (!this.resizeFixGridItemData)
            return;
        /**
         * 最终的网格数 = 当前选中的gridItem resize之前的宽度所占的网格数 + 移动过程中 新增/减少 的网格数
         * 移动过程中 新增/减少 的网格数 = (移动后鼠标的位置像素值 - 移动前鼠标的位置像素值) / 每个网格所占的像素值
         */
        let w = ((_a = this.resizeFixGridItemData) === null || _a === void 0 ? void 0 : _a.w) +
            Math.round((this.resizeingPosition.left - this.resizeFixPosition.left) /
                this.griddingWidth);
        let h = ((_b = this.resizeFixGridItemData) === null || _b === void 0 ? void 0 : _b.h) +
            Math.round((this.resizeingPosition.top - this.resizeFixPosition.top) /
                this.griddingHeight);
        // 容器最左端 到该网格左上角的位置横向网格数
        const x = (_c = this.resizeFixGridItemData) === null || _c === void 0 ? void 0 : _c.x;
        // 容器的最上端 到该网格左上角的位置纵向网格数
        const y = (_d = this.resizeFixGridItemData) === null || _d === void 0 ? void 0 : _d.y;
        // 暂时无用 浮动代码可能有用
        const z = (_e = this.resizeFixGridItemData) === null || _e === void 0 ? void 0 : _e.z;
        // 调整大小之后 网格 高度的像素值
        const height = this.resizeFixGridItemData.h * this.griddingHeight +
            (this.resizeingPosition.top - this.resizeFixPosition.top);
        // 调整大小之后 网格 宽度的像素值
        let width = this.resizeFixGridItemData.w * this.griddingWidth +
            (this.resizeingPosition.left - this.resizeFixPosition.left);
        // resize过程中 最多只能拖到容器的最大宽度
        if (width > this.stageWidth - x * this.griddingWidth) {
            width = this.stageWidth - x * this.griddingWidth;
        }
        // 当前resizing 实时变化的宽度和高度 位置信息
        this.curResizingGridItemData.style = {
            width,
            height,
            left: x * this.griddingWidth,
            top: y * this.griddingHeight,
        };
        // resize 完成 之后
        /** 不允许超出stageWidth */
        w =
            w * this.griddingWidth <=
                this.stageWidth - (x + this.gridMargin) * this.griddingWidth
                ? w
                : Math.floor(this.stageWidth / this.griddingWidth) -
                    x -
                    this.gridMargin;
        if (this.isDisableScrollBars) {
            /** 不允许超出stageHeight */
            h =
                h * this.griddingHeight <=
                    this.stageHeight - (y + this.gridMargin) * this.griddingHeight
                    ? h
                    : Math.floor(this.stageHeight / this.griddingHeight) -
                        x -
                        this.gridMargin;
        }
        // 最小 的 高度和宽度只能拖到 8 和 4
        w = w < 8 ? 8 : w;
        h = h < 4 ? 4 : h;
        // 设置拖拽状态
        this.draggIng = true;
        // 设置阴影的位置
        this.dragData.x = x;
        this.dragData.y = y;
        this.dragData.w = w;
        this.dragData.h = h;
        // 浮动
        if (!this.curResizingGridItemData.float)
            this.rearrangement();
        // 重新渲染
        this.reRender();
        this.dispatchGridItemResizeEvent(this.curResizingGridItemData);
    }
    dispatchGridItemResizeEvent(data) {
        clearTimeout(this.handDispatchGridItemResizeEvent);
        // 向外发送resize 事件 60s 防抖
        this.handDispatchGridItemResizeEvent = setTimeout(() => {
            const resize = new CustomEvent(GridItemReizeName, {
                detail: data,
            });
            window.dispatchEvent(resize);
        }, 60);
    }
    /**
     * 结束改变大小
     * Resize end
     */
    gridItemResizeEnd() {
        if (!this.edit)
            return;
        this.draggIng = false;
        const { x, y, w, h } = this.dragData;
        if (!this.curResizingGridItemData)
            return;
        this.curResizingGridItemData.x = x;
        this.curResizingGridItemData.y = y;
        this.curResizingGridItemData.w = w;
        this.curResizingGridItemData.h = h;
        delete this.curResizingGridItemData.style;
        this.dispatchGridItemResizeEvent({ ...this.curResizingGridItemData });
        this.curResizingGridItemData = null;
        this.rearrangement();
        this.transition = false;
        this.reRender();
        this.saveCurLayout();
    }
    /**
     * ItemStyle事件
     * @param data GridItemData
     * @returns
     */
    getGridItemStyle(data) {
        // 拖拽时的 占位item 的 z-index
        const ActiveZindex = 888;
        // 拖拽底部阴影的z-index
        const DragZInxex = 800;
        const FloatZindex = 900;
        const css = [];
        // 单个项目的自定义样式
        if (data.activeStyle) {
            const attr = [];
            attr.push(`border-style:${data.activeStyle.borderStyle};`);
            attr.push(`border-width:${data.activeStyle.borderWidth || 0}px;`);
            attr.push(`border-color:${data.activeStyle.borderColor || "transparent"};`);
            attr.push(`border-radius:${data.activeStyle.borderRadius || 0}px;`);
            css.push(`
                ${attr.join("")}
            `);
            css.push(`background-color:${data.activeStyle.contentColor || "transparent"};`);
        }
        // 当前活动的样式?
        if (data.style) {
            css.push(`
                transition:none;
                left:${data.style.left}px;
                top:${data.style.top}px;
                z-index:${data.float ? FloatZindex + (data.z || 0) : ActiveZindex};
                width:${data.style.width}px; 
                height:${data.style.height}px`);
            return css.join("");
        }
        // 计算当前item的位置 宽高
        const style = {
            left: data.x * this.griddingWidth,
            top: data.y * this.griddingHeight,
            width: data.w * this.griddingWidth,
            height: data.h * this.griddingHeight,
        };
        // 设置z-index
        let zIndex = data.z || 0;
        if (data.id === DRAG_ID)
            zIndex = DragZInxex;
        if (data.float)
            zIndex = FloatZindex + (data.z || 0);
        css.push(`
            left:${style.left}px;
            top:${style.top}px;
            z-index:${zIndex};
            width:${style.width}px; 
            height:${style.height}px;`);
        return css.join("");
    }
    /** 保存Layout */
    saveCurLayout() {
        const jsonstr = JSON.stringify(this.layoutData);
        const json = JSON.stringify(JSON.parse(jsonstr).map((item) => {
            delete item.selected;
            return item;
        }));
        if (json != this.dataStore[this.dataStoreIndex]) {
            this.dataStoreIndex++;
            this.dataStore[this.dataStoreIndex] = json;
        }
    }
    animateGridItem(item, w = 3, h = 2) {
        return new Promise((resolve) => {
            let minusW = Math.floor((item.w - w) / 5);
            let minusH = Math.floor((item.h - h) / 5);
            if (minusW < 1)
                minusW = 1;
            if (minusH < 1)
                minusH = 1;
            const animate = () => {
                item.w -= minusW;
                item.h -= minusH;
                if (item.w < w) {
                    item.w = w;
                }
                if (item.h < h) {
                    item.h = h;
                }
                this.rearrangement();
                this.reRender();
                if (item.w > w || item.h > h) {
                    window.requestAnimationFrame(() => {
                        animate();
                    });
                }
                else {
                    resolve(null);
                }
            };
            animate();
        });
    }
    /** 移除GridItem */
    async gridItemClose(event) {
        const index = this.getGridItemIndex(event.currentTarget);
        const item = this.layoutData[index];
        await this.animateGridItem(item, 3, 3);
        this.layoutData.splice(index, 1);
        this.transition = false;
        this.rearrangement();
        this.reRender();
    }
    /**
     * 关闭菜单
     */
    closeGridItemSubMenu() {
        this.curGridItemSubMenuShow = false;
        this.curGridItemSubMenuGridData = null;
    }
    /** 移除GridItem */
    async gridItemCloseBySubMenu() {
        if (!this.curGridItemSubMenuGridData)
            return;
        const item = this.curGridItemSubMenuGridData;
        const index = this.layoutData.findIndex((a) => a.id === item.id);
        await this.animateGridItem(item, 3, 3);
        const junkGridItem = this.layoutData.splice(index, 1)[0];
        this.transition = false;
        this.closeGridItemSubMenu();
        this.rearrangement();
        this.reRender();
        const emit = new Event("removeGridItem");
        emit.detail = junkGridItem;
        this.dispatchEvent(emit);
    }
    getGridItemIndex(target) {
        const grid = (target === null || target === void 0 ? void 0 : target.closest(".grid-item")) || null;
        return Number((grid === null || grid === void 0 ? void 0 : grid.dataset.index) || "0");
    }
    getGridItem(target) {
        const index = this.getGridItemIndex(target);
        return this.layoutData[index];
    }
    /**
     * 拖拽开始
     * @param event PointerEvent
     * @returns void
     */
    gridItemDragstart(event) {
        // 如果不是编辑状态 则不让拖动
        if (!this.edit)
            return;
        // 拖动的元素
        const target1 = event === null || event === void 0 ? void 0 : event.target;
        const target = target1.parentElement;
        // 更多按钮
        if (!(target === null || target === void 0 ? void 0 : target.closest(".btn-more"))) {
            this.closeGridItemSubMenu();
        }
        // 否则 关闭菜单
        this.closeGridItemSubMenu();
        // 移除默认效果
        event.preventDefault();
        // 获取当前grid item 的数据
        const grid = this.getGridItem(target);
        // 设置当前item 为 当前移动的网格item
        this.curMovingGridItemData = grid;
        // 代码保护
        if (!this.curMovingGridItemData)
            return;
        // 当前选中项的位置信息
        const { w, h, x, y, id } = this.curMovingGridItemData;
        // 当前移动item的位置信息 转换成像素
        this.movePosition = {
            left: this.curMovingGridItemData.x * this.griddingWidth,
            top: this.curMovingGridItemData.y * this.griddingHeight,
        };
        // 记住鼠标按下的位置
        const fixPosition = { left: 0, top: 0 };
        fixPosition.left = event.clientX;
        fixPosition.top = event.clientY;
        // 存储以前的位置
        const oldPosition = { left: 0, top: 0 };
        oldPosition.left = this.movePosition.left;
        oldPosition.top = this.movePosition.top;
        // 如果不是当前选中项 那么 移除选中效果
        this.layoutData.forEach((item) => {
            if (item.id !== this.curMovingGridItemData.id)
                delete item.selected;
        });
        // 将当前选中项增加选中效果
        this.curMovingGridItemData.selected = true;
        // 同步拖拽项 阴影的位置信息
        this.dragData.w = w;
        this.dragData.h = h;
        this.dragData.x = x;
        this.dragData.y = y;
        // 添加拖拽项目动画效果
        this.transition = true;
        // 重新渲染
        this.reRender();
        // 拖拽中的事件
        const onDragging = (event) => {
            var _a;
            // 代码保护 如果不是当前移动事件 直接退出
            if (!this.edit || !this.curMovingGridItemData)
                return;
            // 选中当前移动的item
            this.curMovingGridItemData.selected = true;
            // 移动中的位置 = 旧位置 + 鼠标移动的距离(px)
            this.movePosition.left =
                oldPosition.left + (event.clientX - fixPosition.left);
            this.movePosition.top =
                oldPosition.top + (event.clientY - fixPosition.top);
            // 拖拽中的阴影
            this.draggIng = true;
            // 当前移动中的item
            const { w, h } = this.curMovingGridItemData;
            // 阴影的位置
            this.dragData.w = w;
            this.dragData.h = h;
            // 计算当前移动item的高度px/宽度px
            const height = this.curMovingGridItemData.h * this.griddingHeight;
            const width = this.curMovingGridItemData.w * this.griddingWidth;
            // 设置当前移动item的样式
            this.curMovingGridItemData.style = {
                width,
                height,
                left: this.movePosition.left,
                top: this.movePosition.top,
            };
            // 将px像素值转成 网格数
            const { x, y } = this.calcNearPosition(this.movePosition.left, this.movePosition.top);
            // 如果是浮动模式 那么 位置在哪里就是哪里
            if (this.curMovingGridItemData.float) {
                this.dragData.x = x;
                this.dragData.y = y;
            }
            else {
                // 获取最近的空间 将阴影移动到该位置
                const newPos = this.getNearEmptyPosition({
                    x,
                    y,
                    w,
                    h,
                    id: "9999",
                    z: 0,
                });
                if (newPos) {
                    this.dragData.x = newPos.x;
                    this.dragData.y = newPos.y;
                }
            }
            if (!((_a = this.curMovingGridItemData) === null || _a === void 0 ? void 0 : _a.float))
                this.rearrangement();
            this.reRender();
        };
        // 拖拽结束事件
        const onDragEnd = () => {
            if (!this.edit)
                return;
            this.draggIng = false;
            if (!this.curMovingGridItemData)
                return;
            delete this.curMovingGridItemData.style;
            this.curMovingGridItemData.x = this.dragData.x;
            this.curMovingGridItemData.y = this.dragData.y;
            this.curMovingGridItemData = null;
            // 关闭动画
            this.transition = false;
            // 重新渲染
            this.reRender();
            // 保存layout 数据
            this.saveCurLayout();
            // 移除禁止选中文字
            document.body.removeAttribute("onselectstart");
            // 移除监听事件
            window.removeEventListener("mousemove", onDragging);
            window.removeEventListener("mouseup", onDragEnd);
        };
        // 将dome 禁止选中文字
        document.body.setAttribute("onselectstart", "return false");
        // 监听鼠标移动事件
        window.addEventListener("mousemove", onDragging);
        // 监听鼠标松开事件
        window.addEventListener("mouseup", onDragEnd);
    }
    /**
     * 获取最近的空间
     * @param grid :GridItemData
     * @returns {x,y}
     */
    getNearEmptyPosition(grid) {
        const overMax = 10;
        let { x, y } = grid;
        const { w, h } = grid;
        // 不能小于一个 item 间距
        if (y < this.gridMargin)
            y = this.gridMargin;
        if (x < this.gridMargin)
            x = this.gridMargin;
        // x = x < this.gridMargin ? this.gridMargin : x
        // 宽度不能超出 整个布局的 宽度
        x =
            x + w + this.gridMargin > Math.floor(this.stageWidth / this.griddingWidth)
                ? Math.floor(this.stageWidth / this.griddingWidth) - this.gridMargin - w
                : x;
        // 获取当前与当前 item 重叠交叉的 gridItem list
        const overList = this.findOverlapItem(this.layoutData, x, y, w, h, [
            this.dragData.id,
            this.curActiveGridItem.id,
        ]);
        overList.forEach((overItem) => {
            // 交叉部分的宽度
            const overW = w +
                overItem.w -
                (Math.max(x + w, overItem.x + overItem.w) - Math.min(x, overItem.x));
            // 交叉部分的高度
            const overH = h +
                overItem.h -
                (Math.max(y + h, overItem.y + overItem.h) - Math.min(y, overItem.y));
            if (overH < overW) {
                if (overH < overMax && overH < overItem.h && overH < h) {
                    if (y < overItem.y) {
                        y = overItem.y - h - this.gridMargin;
                        if (y < this.gridMargin) {
                            y = this.gridMargin;
                        }
                    }
                    else {
                        y = overItem.y + overItem.h + this.gridMargin;
                    }
                }
            }
            else {
                if (overW < overMax && overW < overItem.w && overW < w) {
                    if (x < overItem.x && overItem.x - w > this.gridMargin) {
                        x = overItem.x - w - this.gridMargin;
                    }
                    else if (overItem.x + overItem.w + w + this.gridMargin <
                        Math.floor(this.stageWidth / this.griddingWidth)) {
                        x = overItem.x + overItem.w + this.gridMargin;
                    }
                }
            }
        });
        return { x, y };
    }
    /**
     * GridLayout的点击事件
     * @param event
     * @returns
     */
    onGridLayoutClick(event) {
        var _a, _b, _c, _d, _e;
        if ((_a = event === null || event === void 0 ? void 0 : event.target) === null || _a === void 0 ? void 0 : _a.closest(".toolbar"))
            return;
        if ((_b = event === null || event === void 0 ? void 0 : event.target) === null || _b === void 0 ? void 0 : _b.closest(".grid-item"))
            return;
        if ((_c = event === null || event === void 0 ? void 0 : event.target) === null || _c === void 0 ? void 0 : _c.closest("[slot]"))
            return;
        if ((_d = event === null || event === void 0 ? void 0 : event.target) === null || _d === void 0 ? void 0 : _d.closest(".btn-more"))
            return;
        if ((_e = event === null || event === void 0 ? void 0 : event.target) === null || _e === void 0 ? void 0 : _e.closest(".box-menu"))
            return;
        // 删除所有选中
        this.layoutData.forEach((item) => {
            delete item.selected;
        });
        // this.styleMapEditing = false
        // 关闭编辑下拉框
        this.closeGridItemSubMenu();
        // 重新渲染
        this.reRender();
    }
    /**
     * 获取GridItem的TOP y坐标 检查上方有没有空间,如果有往上挪动一点
     * @param dataList
     * @param grid
     * @param exceptIds
     * @returns
     */
    getGridItemTopY(dataList, grid, exceptIds) {
        const { x, h, w } = grid;
        let { y } = grid;
        let item = this.findBigestOverlapItem(dataList, x, y - this.gridMargin, w, h, exceptIds);
        while (!item) {
            // 一个网格一个网格的找
            y = y - this.gridMargin;
            if (y <= this.gridMargin) {
                // 当间距已经最小了的时候 停止查找,当前项目停在这个位置
                y = this.gridMargin;
                return { x, y };
            }
            // 每次往上挪一点  如果没有重叠的就继续找,找到有重叠的为止 (y - this.gridMargin)这个位置有重叠就返回y
            item = this.findBigestOverlapItem(dataList, x, y - this.gridMargin, w, h, exceptIds);
        }
        return { x, y };
    }
    /**
     * 无用代码,暂时保留
     * 计算两项交叉面积
     * @param data1
     * @param data2
     * @returns
     */
    calcOverArea(data1, data2) {
        const overX1 = Math.max(data1.x, data2.x);
        const overX2 = Math.min(data1.x + data1.w, data2.x + data2.w);
        const overW = overX2 - overX1;
        const overY1 = Math.max(data1.y, data2.y);
        const overY2 = Math.min(data1.y + data1.h, data2.y + data1.h);
        const overH = overY2 - overY1;
        const overArea = overH * overW;
        return overArea;
    }
    /**
     * 排序上面有空白的地方
     * @param list
     */
    sortTopSpace(list) {
        // const maxWidth = this.maxGridItemWidthCount
        // const maxHeight = Math.round(this.calcStageActualHeight / this.griddingHeight)
        // const space = 10
        // for (let sx = this.gridMargin; sx < maxWidth; sx += space) {
        //     for (let sy = this.gridMargin; sy < maxHeight; sy += space) {
        //         const w = space
        //         const h = space
        //         const item = this.findBigestOverlapItem(list, sx, sy, w, h, [
        //             this.curActiveGridItem?.id
        //         ])
        //         if (item) {
        //             const { x, y } = this.getGridItemTopY(list, item, [
        //                 this.curActiveGridItem?.id,
        //                 item.id
        //             ])
        //             item.x = x
        //             item.y = y
        //             sy = item.y + item.h
        //         }
        //     }
        // }
        var _a;
        // 将当前拖动的item和 浮动的item 排除
        let dataList = list.filter((item) => { var _a; return item.id !== ((_a = this.curActiveGridItem) === null || _a === void 0 ? void 0 : _a.id) && !item.float; });
        dataList = dataList.sort((a, b) => {
            if (a.y < b.y) {
                return -1;
            }
            else if (a.y == b.y) {
                //拖拽Grid优先排最前面
                if (a.id === DRAG_ID)
                    return -1;
                if (b.id === DRAG_ID)
                    return 1;
                if (a.x < b.x)
                    return -1;
                return 1;
            }
            else {
                return 1;
            }
        });
        for (let i = 0; i < dataList.length; i++) {
            const item = dataList[i];
            // 拿到上方空白处的y网格数
            const { y } = this.getGridItemTopY(list, item, [
                (_a = this.curActiveGridItem) === null || _a === void 0 ? void 0 : _a.id,
                item.id,
            ]);
            // 如果y比当前item的y小 name 就将 y 赋值给 item.y 将 当前item上移
            if (y < item.y) {
                item.y = y;
                // 然后递归计算
                this.sortTopSpace(list);
                return;
            }
        }
    }
    /**
     * 排序底部重叠的地方
     * @param list
     */
    sortBottomOver(list) {
        var _a;
        let dataList = list.filter((item) => { var _a; return item.id !== ((_a = this.curActiveGridItem) === null || _a === void 0 ? void 0 : _a.id); });
        dataList = dataList.sort((a, b) => {
            if (a.y < b.y) {
                return -1;
            }
            else if (a.y == b.y) {
                //拖拽Grid优先排最前面
                if (a.id === DRAG_ID)
                    return -1;
                if (b.id === DRAG_ID)
                    return 1;
                if (a.x < b.x)
                    return -1;
                return 1;
            }
            else {
                return 1;
            }
        });
        // 遍历每个item
        for (const item of dataList) {
            // 浮动跳过
            if (item.float) {
                continue;
            }
            // 当前移动的项目跳过
            if (((_a = this.curMovingGridItemData) === null || _a === void 0 ? void 0 : _a.id) === item.id) {
                continue;
            }
            this.pressDownOver(list, item);
        }
    }
    /**
     * 往下压
     * @param list
     * @param item
     * 将每个item 与 其他的item 一个个比较 有无重叠的部分
     */
    pressDownOver(list, item) {
        var _a;
        const { id, x, y, w, h } = item;
        // 与item 重叠的 gridItemList
        const newList = this.findOverlapItem(list, x, y, w, h, [
            id,
            // this.dragData?.id,
            (_a = this.curActiveGridItem) === null || _a === void 0 ? void 0 : _a.id,
        ]);
        // 如果有重叠
        if (newList.length) {
            for (let i = 0; i < newList.length; i++) {
                // 将重叠项目往下压
                newList[i].y = y + h + this.gridMargin;
                // 递归 直到所有都没有重叠为止
                this.pressDownOver(list, newList[i]);
            }
        }
    }
    /**
     * 重新排序 将网格重新组合排列
     */
    rearrangement() {
        let list = [...this.layoutData];
        if (this.curActiveGridItem) {
            list = [...list, this.dragData];
        }
        this.sortBottomOver(list);
        this.sortTopSpace(list);
        this.layoutData = list
            .filter((item) => {
            if (item.id === DRAG_ID) {
                this.dragData = item;
                return false;
            }
            return true;
        })
            .map((item) => {
            var _a;
            if (item.id === ((_a = this.curActiveGridItem) === null || _a === void 0 ? void 0 : _a.id)) {
                return this.curActiveGridItem;
            }
            return item;
        });
        this.reRender();
    }
    /**
     * 浮动 向上一级
     * @returns
     */
    setZindexUp() {
        var _a;
        // 首先关闭菜单
        this.closeGridItemSubMenu();
        if (!((_a = this.curSelectGridItem) === null || _a === void 0 ? void 0 : _a.float)) {
            // 如果当前选中的item 不是浮动, 那么重新渲染
            this.reRender();
            return;
        }
        // 找出浮动的item 列表
        let floatGridItems = this.layoutData.filter((item) => item.float);
        // 将浮动的item 列表排序
        floatGridItems = floatGridItems.sort((a, b) => a.z - b.z);
        // 将排序后的浮动的item 的 zIndex 重新赋值
        floatGridItems.forEach((item, i) => {
            item.z = i;
        });
        //找到当前选中的那个item 的 index
        const index = floatGridItems.findIndex((item) => { var _a; return item.id === ((_a = this.curSelectGridItem) === null || _a === void 0 ? void 0 : _a.id); });
        // 如果他是最后一个 即 浮动层级最高的那个 那么不用处理直接渲染
        if (index >= floatGridItems.length - 1) {
            this.reRender();
            return;
        }
        // 删除 当前选中的item
        const item = floatGridItems.splice(index, 1);
        // 将当前的item 插入到 下一个位置
        floatGridItems.splice(index + 1, 0, item[0]);
        // 重新分配zIndex
        floatGridItems.forEach((item, i) => {
            item.z = i;
        });
        // 重新渲染
        this.reRender();
    }
    /**
     * 浮动 向下一级
     * @returns
     */
    setZindexDown() {
        var _a;
        // 关闭菜单
        this.closeGridItemSubMenu();
        if (!((_a = this.curSelectGridItem) === null || _a === void 0 ? void 0 : _a.float)) {
            // 如果当前选中的item 不是浮动, 那么重新渲染
            this.reRender();
            return;
        }
        let floatGridItems = this.layoutData.filter((item) => item.float);
        // 浮动排序
        floatGridItems = floatGridItems.sort((a, b) => a.z - b.z);
        // 重新赋值
        floatGridItems.forEach((item, i) => {
            item.z = i;
        });
        // 查找当前选中的item 的 index
        const index = floatGridItems.findIndex((item) => { var _a; return item.id === ((_a = this.curSelectGridItem) === null || _a === void 0 ? void 0 : _a.id); });
        // 如果是第一个的话 不做处理 已经是最底层了
        if (index === 0) {
            this.reRender();
            return;
        }
        // 取出当前选中的item
        const item = floatGridItems.splice(index, 1);
        // 插入到前一个位置
        floatGridItems.splice(index - 1, 0, item[0]);
        // 重新分配zIndex
        floatGridItems.forEach((item, i) => {
            item.z = i;
        });
        // 关闭菜单 重新渲染
        this.closeGridItemSubMenu();
        this.reRender();
    }
    /**
     *  无用代码,暂时保留
     * @returns
     */
    getLayoutDefaultGridItemStyle() {
        const style = [".grid-layout > .grid-item {"];
        if (this.layoutDefaultGridStyle.borderRadius) {
            style.push(` border-radius: ${this.layoutDefaultGridStyle.borderRadius}px;`);
        }
        if (this.layoutDefaultGridStyle.borderStyle) {
            style.push(`border-style: ${this.layoutDefaultGridStyle.borderStyle};`);
            style.push(`border-color: ${this.layoutDefaultGridStyle.borderColor || "transparent"};`);
            style.push(`border-width: ${this.layoutDefaultGridStyle.borderWidth}px;`);
        }
        if (this.layoutDefaultGridStyle.contentColor)
            style.push(`background-color: ${this.layoutDefaultGridStyle.contentColor};`);
        style.push("}");
        return html `<style>
      ${style.join("")}
    </style>`;
    }
    /**
     * 打开样式配置
     * @returns
     */
    openSetStyleBySubMenu() {
        if (!this.curGridItemSubMenuGridData)
            return;
        const emit = new Event("openSetActiveStyle");
        emit.detail = this.curGridItemSubMenuGridData;
        this.closeGridItemSubMenu();
        this.reRender();
        this.dispatchEvent(emit);
    }
    /**
     * 弹出右上角的菜单
     * @returns
     */
    openConfigSetBySubMenu() {
        if (!this.curGridItemSubMenuGridData)
            return;
        const emit = new Event("openConfigSet");
        emit.detail = this.curGridItemSubMenuGridData;
        this.closeGridItemSubMenu();
        this.reRender();
        this.dispatchEvent(emit);
    }
    /**
     * 当前活动的GridItem
     *
     */
    get curActiveGridItem() {
        return this.curMovingGridItemData || this.curResizingGridItemData || null;
    }
    /**
     * 当前活动的GridItem style
     */
    get curActiveGridItemStyle() {
        var _a;
        return (_a = this.curActiveGridItem) === null || _a === void 0 ? void 0 : _a.style;
    }
    get curSelectGridItem() {
        return this.layoutData.find((item) => item.selected);
    }
    /**
     * 选中的UserStyle;
     */
    get curGridItemSubMenuGridDataActiveStyle() {
        if (!this.curGridItemSubMenuGridData)
            return;
        if (!this.curGridItemSubMenuGridData.activeStyle) {
            const astye = {
                titleStyleVisible: false,
                borderStyle: "",
                borderWidth: 0,
                borderColor: "",
                borderRadius: 0,
                titleColor: "",
                contentColor: "",
                // enbled: true,
                isFloat: this.curGridItemSubMenuGridData.float || false,
            };
            this.curGridItemSubMenuGridData.activeStyle = astye;
        }
        return this.curGridItemSubMenuGridData.activeStyle;
    }
    /**
     * 计算的舞台虚拟高度 网格数
     */
    get calcStageVirtualHeight() {
        let list = [...this.layoutData];
        if (this.dragData) {
            list = [this.dragData, ...list];
        }
        let h = 0;
        list.forEach((item) => {
            h = h < item.y + item.h ? item.y + item.h : h;
        });
        h = h + this.gridMargin;
        return h;
    }
    /**
     * 计算的舞台实际高度
     */
    get calcStageActualHeight() {
        return this.calcStageVirtualHeight * this.griddingHeight;
    }
    /**
     * 无用代码
     * 关闭
     */
    dialogClose() {
        this.showDialogGridStyle = false;
        this.closeGridItemSubMenu();
        this.reRender();
    }
    boxResize() {
        if (this.boxResizeTime)
            clearTimeout(this.boxResizeTime);
        this.boxResizeTime = setTimeout(() => {
            this.stageWidth =
                this.getBoundingClientRect().width - this.defaultRightMargin;
            this.reRender();
            this.dispatchGridItemResizeEvent(null);
        }, 300);
    }
    bind(obj, type) {
        obj.bindHnd[type] = () => {
            const fun = obj[type];
            fun();
        };
        return obj.bindHnd[type];
    }
    /**
     * 无用代码
     * @param e
     */
    WcVueGridStyleChange(e) {
        const { detail } = e;
        const style = detail[0];
        if (this.curGridItemSubMenuGridData) {
            this.curGridItemSubMenuGridData.activeStyle = { ...style.gridStyle };
        }
        this.layoutDefaultGridStyle = { ...style.globalGridStyle };
    }
    /**
     * 生命周期--初始化
     */
    connectedCallback() {
        // 固定写法 调用父类的生命周期
        super.connectedCallback();
        // 默认样式初始化
        this.layoutDefaultGridStyle.borderRadius =
            this.layoutDefaultGridStyle.borderRadius !== undefined
                ? this.layoutDefaultGridStyle.borderRadius
                : 3;
        this.layoutDefaultGridStyle.borderColor =
            this.layoutDefaultGridStyle.borderColor !== undefined
                ? this.layoutDefaultGridStyle.borderColor
                : "#c3c3c3";
        this.layoutDefaultGridStyle.borderWidth =
            this.layoutDefaultGridStyle.borderWidth !== undefined
                ? this.layoutDefaultGridStyle.borderWidth
                : 1;
        this.layoutDefaultGridStyle.borderStyle =
            this.layoutDefaultGridStyle.borderStyle !== undefined
                ? this.layoutDefaultGridStyle.borderStyle
                : "solid";
        this.layoutDefaultGridStyle.titleColor =
            this.layoutDefaultGridStyle.titleColor !== undefined
                ? this.layoutDefaultGridStyle.titleColor
                : "#fff";
        this.layoutDefaultGridStyle.contentColor =
            this.layoutDefaultGridStyle.contentColor !== undefined
                ? this.layoutDefaultGridStyle.contentColor
                : "#fff";
        // getBoundingClientRect 原生方法 获取目标dom 的 宽高位置信息
        const curRect = this.getBoundingClientRect();
        // 设置宽高
        this.stageWidth = curRect.width - this.defaultRightMargin;
        this.stageHeight = curRect.height;
        const layoutHeight = curRect.height;
        // 每一行默认占四个拖拽项目,中间三个间隙 + 两头间隙 一共五个间隙
        // 所以此处((this.maxGridItemWidthCount - this.gridMargin) / 4 就是每一个网格加上间隙的网格树
        // 减去间隙 就是每个 拖拽项目 所占的网格数
        this.defaultGridItemWidth =
            Math.floor((this.maxGridItemWidthCount - this.gridMargin) / 4) -
                this.gridMargin;
        // dom总高度/每个网格所占的像素值 获取整屏网格数
        this.maxGridItemHeightCount = Math.floor(layoutHeight / this.griddingHeight);
        // 用整屏网格数减去间隙 获取每个网格所占的像素值 (通上 宽度计算)
        // 得到每个默认拖拽项目的高度 所占的网格数
        this.defaultGridItemHeight =
            Math.floor((this.maxGridItemHeightCount - this.gridMargin) / 4) -
                this.gridMargin;
        // 看是否禁止滚动条
        this.style.overflowY = this.isDisableScrollBars ? "hidden" : "auto";
        // 监听窗口大小变化
        window.addEventListener("resize", this.bind(this, "boxResize"));
    }
    /**
     * 生命周期--销毁
     */
    disconnectedCallback() {
        window.removeEventListener("resize", this.bindHnd["boxResize"]);
    }
    /**
     *  工具栏
     */
    onCLickTool(event) {
        var _a, _b;
        const target = event.target;
        // 获取dom 元素 的 位置信息
        const rect = target.getBoundingClientRect();
        const parentRect = ((_b = (_a = this.shadowRoot) === null || _a === void 0 ? void 0 : _a.firstElementChild) === null || _b === void 0 ? void 0 : _b.getBoundingClientRect()) || {
            left: 0,
            top: 0,
            width: this.stageWidth,
            height: this.calcStageActualHeight,
        };
        // 设置弹出菜单的位置
        this.curGridItemSubMenuPos.x = rect.left - parentRect.left + rect.width + 3;
        this.curGridItemSubMenuPos.y = rect.top - parentRect.top + rect.height + 3;
        // 显示菜单
        this.curGridItemSubMenuShow = true;
        this.curGridItemSubMenuGridData = this.getGridItem(event.currentTarget);
        // 移除其它的选中效果
        this.layoutData.forEach((item) => {
            delete item.selected;
        });
        // 当前弹出菜单 的item 选中的效果
        this.curGridItemSubMenuGridData.selected = true;
        this.reRender();
    }
    /**
     * 获取title
     */
    getItemTitle(itemId) {
        const item = this.headerConfigList.find((itemConfig) => itemConfig.id === itemId);
        const panelOptions = item === null || item === void 0 ? void 0 : item.PanelOptions;
        return (panelOptions === null || panelOptions === void 0 ? void 0 : panelOptions.title) || "";
    }
    /**
     * 渲染方法
     * @returns
     */
    render() {
        const curRect = this.getBoundingClientRect();
        // 预留有滚动条的宽度
        this.stageWidth = curRect.width - this.defaultRightMargin;
        this.stageHeight = curRect.height;
        // 展示页面
        return html `<div class="grid-layout" @click="${this.onGridLayoutClick}">
        <!-- 如果有滚动条,那么需要加上虚拟高度把页面撑开 -->
        <div
          class="grid-sitting"
          style="height:${this.calcStageActualHeight}px;"
        ></div>
        ${this.edit
            ? html `
              <!-- 测试 开发 的工具栏 -->
              <div class="toolbar" hide="${this.hideToolbar}">
                <i class="el-icon add" @click="${this.addGridItem}">
                  <!--[-->
                  ${ADD_SVG}
                  <!--]-->
                </i>
                <i class="el-icon back" @click="${this.backLayout}">
                  <!--[-->
                  ${BACK_LAYOUT}
                  <!--]-->
                </i>
                <i class="el-icon forward" @click="${this.forwardLayout}">
                  <!--[-->
                  ${FORWARD_LAYOUT}
                  <!--]-->
                </i>
                <i class="el-icon save" @click="${this.save}">
                  <!--[-->
                  ${SAVE_LAYOUT}
                  <!--]-->
                </i>
                <i class="el-icon close" @click="${this.close}">
                  <!--[-->
                  ${CLOSE_LAYOUT}
                  <!--]-->
                </i>
              </div>
              ${this.showGridItemMenu()}
            `
            : ""}
        <!-- 拖拽项目渲染 -->
        ${this.layoutData.map((item, i) => {
            var _a;
            return html `
            <div
              class="grid-item"
              data-index="${i}"
              selected="${item.selected || false}"
              float="${item.float || false}"
              edit="${this.edit}"
              style="${this.getGridItemStyle(item)}"
              transition="${this.transition}"
              lightning-style="${this.lightningId === String(item.id)}"
            >
              <div class="head-tool" @mousedown="${this.gridItemDragstart}">
                <div>
                  <div class="title_cls">
                    ${TITLE_SVG}
                    <div style="margin-left: 5px;">
                      ${((_a = item.activeStyle) === null || _a === void 0 ? void 0 : _a.titleStyleVisible)
                ? this.getItemTitle(item.id)
                : ""}
                    </div>
                  </div>
                </div>
                <div class="tool-btn" @click="${this.onCLickTool}">
                  <i class="el-icon btn-more" style="font-size: 20px;">
                    ${MORE_SVG}
                  </i>
                </div>
              </div>
              <div style="height: calc(100% - 36px);">
                <slot name="${item.slot || ""}"></slot>
              </div>
              <!-- 编辑状态不让点击里面的元素 -->
              <!-- ${this.edit ? html `<div class="move-bg"></div>` : ""} -->
              <!-- 渲染右上角工具菜单 -->
              ${this.renderToobar()}
            </div>
          `;
        })}
        <!-- 拖拽中 -->
        ${this.draggIng ? this.drawDragDataHtml() : ""}
      </div>
      <!-- 无用代码,暂时保留 -->
      ${this.showDialog()} ${this.getLayoutDefaultGridItemStyle()} `;
    }
    // 工具栏 (三个点 和 右下角的 resize图标)
    renderToobar() {
        if (!this.edit)
            return "";
        return html `<div
      class="resize bottom-right"
      @mousedown="${this.gridItemResizeStart}"
    ></div>`;
    }
    // 编辑菜单漂浮窗
    showGridItemMenu() {
        var _a, _b;
        return html `
      <div
        class="box-menu ${this.curGridItemSubMenuShow ? "show" : ""}"
        style="left:${this.curGridItemSubMenuPos.x}px;top:${this
            .curGridItemSubMenuPos.y}px"
      >
        <div class="menu-item" @click="${this.openConfigSetBySubMenu}">
          <i class="el-icon">
            <!--[-->
            ${EDIT_SVG}
            <!--]-->
          </i>
          <span class="el-label">${this.i18n.t("edit", true)}</span>
        </div>
        <div class="menu-item" @click="${this.openSetStyleBySubMenu}">
          <i class="el-icon">
            <!--[-->
            ${STYLE_SVG}
            <!--]-->
          </i>
          <span class="el-label">${this.i18n.t("style", true)}</span>
        </div>
        <div class="menu-item" @click="${this.gridItemCloseBySubMenu}">
          <i class="el-icon close grid-item-close" style="font-size:20px;">
            <!--[-->
            ${DELETE_SVG}
            <!--]-->
          </i>
          <span class="el-label">${this.i18n.t("delete", true)}</span>
        </div>
        <div
          class="menu-item"
          @click="${this.setZindexUp}"
          style="display:${((_a = this.curSelectGridItem) === null || _a === void 0 ? void 0 : _a.float) ? "flex" : "none"}"
        >
          <i class="el-icon">
            <!--[-->
            ${ZINDEX_UP_SVG}
            <!--]-->
          </i>
          <span class="el-label">${this.i18n.t("upperFloor", true)}</span>
        </div>
        <div
          class="menu-item"
          @click="${this.setZindexDown}"
          style="display:${((_b = this.curSelectGridItem) === null || _b === void 0 ? void 0 : _b.float) ? "flex" : "none"}"
        >
          <i class="el-icon">
            <!--[-->
            ${ZINDEX_DOWN_SVG}
            <!--]-->
          </i>
          <span class="el-label">${this.i18n.t("nextFloor", true)}</span>
        </div>
        <div class="menu-item" @click="${this.gridItemCopyBySubMenu}">
          <i class="el-icon">
            <!--[-->
            ${DELETE_LAYOUT_SVG}
            <!--]-->
          </i>
          <span class="el-label">${this.i18n.t("copy", true)}</span>
        </div>
      </div>
    `;
    }
    // 无用代码
    showDialog() {
        if (!this.showDialogGridStyle)
            return "";
        return html `<div class="dialog" open>
      <div class="style-dialog">
        <!-- <wc-vue-grid-style
                    global-config=${JSON.stringify(this.layoutDefaultGridStyle)}
                    config=${JSON.stringify(this.curGridItemSubMenuGridDataActiveStyle)}
                    @change=${this.WcVueGridStyleChange}
                    @close=${this.dialogClose}
                ></wc-vue-grid-style> -->
        <div class="head">Style</div>
        <i class="el-icon close" @click="${this.dialogClose}">
          <!--[-->
          <svg viewBox="0 0 1024 1024" xmlns="http://www.w3.org/2000/svg">
            <path
              fill="currentColor"
              d="M764.288 214.592 512 466.88 259.712 214.592a31.936 31.936 0 0 0-45.12 45.12L466.752 512 214.528 764.224a31.936 31.936 0 1 0 45.12 45.184L512 557.184l252.288 252.288a31.936 31.936 0 0 0 45.12-45.12L557.12 512.064l252.288-252.352a31.936 31.936 0 1 0-45.12-45.184z"
            ></path>
          </svg>
          <!--]-->
        </i>
      </div>
    </div>`;
    }
};
GridLayoutLit.styles = css `
    :host {
      display: block;
      padding: 0px;
      height: 100%;
      overflow-x: hidden;
    }
    :host::-webkit-scrollbar {
      width: 8px;
      background: #b3b3b3;
    }
    :host::-webkit-scrollbar-thumb {
      width: 8px;
      background: #767676;
      border-radius: 5px;
    }
    :host::-webkit-scrollbar-track {
      background: transparent;
      border-radius: 0px;
    }
    .grid-layout {
      position: relative;
      width: 100%;
      height: 100%;
    }
    .toolbar {
      position: absolute;
      right: 5px;
      top: 5px;
      padding: 2px 3px;
      z-index: 999999;
      display: flex;
      background: #000;
      box-shadow: 2px 2px 5px #000;
      border-radius: 3px;
      border: 1px solid rgb(103 103 103);
    }
    .toolbar[hide="true"] {
      display: none;
    }
    .toolbar.vertical {
      top: 20%;
      right: 5px;
      flex-flow: column;
    }
    .toolbar .el-icon svg {
      width: 18px;
      height: 18px;
    }
    .toolbar .el-icon {
      cursor: pointer;
      margin: 3px 3px;
      border: 1px solid #dbdbdb;
      border-radius: 3px;
      padding: 3px;
      display: inline-flex;
      width: 18px;
      height: 18px;
      background-color: #fff;
      color: #333;
    }
    .toolbar .el-icon:hover {
      background-color: #4097e4;
      color: #fff;
      opacity: 0.7;
    }

    .toolbar .el-icon[active="true"] {
      background-color: #4097e4;
      color: #fff;
    }
    .toolbar .el-icon:active {
      background-color: rgb(131 177 217);
      color: #fff;
    }
    .toolbar .el-icon.forward svg {
      transform: scaleX(-1);
    }
    .old-data {
      opacity: 0.3;
    }
    .grid-sitting {
      width: 100%;
      top: 0px;
      position: absolute;
      z-index: -1;
    }
    .grid-item {
      display: block;
      position: absolute;
      min-width: 20px;
      min-height: 10px;
      overflow: hidden;
      box-sizing: border-box;
    }
    .grid-item[transition="true"] {
      transition: all 0.3s;
    }
    .grid-item.move {
      cursor: move;
    }
    .grid-item[edit="true"][selected="true"],
    .grid-item[edit="true"]:hover {
      outline: rgba(124, 165, 208, 0.2) solid 3px;
    }
    .grid-item[edit="true"][float="true"] {
      box-shadow: rgb(0, 0, 0) 5px 5px 30px -25px;
    }
    .grid-item[float="true"] .tool-box .set-float {
      opacity: 1;
      color: #3250a7;
    }
    .grid-item:hover .resize {
      display: flex;
    }
    .grid-item .bottom-right {
      cursor: se-resize;
      right: 4px;
      bottom: 4px;
      width: 6px;
      height: 6px;
      border-right: 2px solid rgb(195, 190, 190);
      border-bottom: 2px solid rgb(195, 190, 190);
    }
    .grid-item .tool-box {
      position: absolute;
      top: 10px;
      right: 10px;
      display: flex;
    }
    .grid-item .tool-box:hover {
      opacity: 0.5;
    }
    .grid-item .tool-box .el-icon.btn-more {
      position: relative;
      display: flex;
      height: 3px;
    }
    .grid-item .tool-box .el-icon.btn-more svg {
      color: #1b1d1f;
      width: 16px;
      height: 16px;
    }
    .grid-item .tool-box .el-icon:hover {
      cursor: pointer;
      opacity: 0.6;
    }
    .grid-item .resize > svg {
      color: rgb(160 160 160);
    }
    .grid-item .resize:hover {
      opacity: 0.6;
    }

    .grid-item[drag="true"] {
      opacity: 0.5;
      background-color: rgb(249, 227, 193);
      box-shadow: none;
      border: none;
      transition: none;
    }
    .grid-item[drag="true"] .close,
    .grid-item[drag="true"] .set-float {
      display: none;
    }
    .grid-item[lightning-style="true"] {
      animation: lightning-style 0.5s;
    }
    @keyframes lightning-style {
      0% {
        box-shadow: 0px 0px 0px -2px #000;
      }
      10% {
        box-shadow: 0px 0px 2px -2px #000;
      }
      20% {
        box-shadow: 0px 0px 4px -2px #000;
      }
      30% {
        box-shadow: 0px 0px 6px -2px #000;
      }
      40% {
        box-shadow: 0px 0px 8px -2px #000;
      }
      50% {
        box-shadow: 0px 0px 10px -2px #000;
      }
      60% {
        box-shadow: 0px 0px 8px -2px #000;
      }
      70% {
        box-shadow: 0px 0px 6px -2px #000;
      }
      80% {
        box-shadow: 0px 0px 4px -5px #000;
      }
      90% {
        box-shadow: 0px 0px 2px -2px #000;
      }
      100% {
        box-shadow: 0px 0px 0px -2px #000;
      }
    }
    .resize {
      position: absolute;
    }
    .toolbar .el-icon.style-update-btn:hover {
      background-color: #fff;
      color: #333;
    }
    .toolbar .el-icon.style-update-btn[active="true"] {
      background-color: #4097e4;
      color: #fff;
    }
    .box-menu {
      display: none;
      min-width: 150px;
      min-height: 32px;
      position: absolute;
      z-index: 1900;
      background-color: #fff;
      box-shadow: 0px 0px 4px 0px rgba(188, 188, 188, 0.5);
      border: 0px solid #e0e0e0;
      border-radius: 6px;
      font-style: normal;
      font-size: 12px;
      color: #1b1d1f;
      transform: translateX(-100%);
      box-sizing: border-box;
      padding: 4px;
    }
    .box-menu.show {
      display: block;
    }
    .box-menu .menu-item {
      display: flex;
      padding: 8px 15px;
      align-items: center;
      cursor: pointer;
      border-radius: 6px;
    }
    .box-menu .menu-item .el-icon {
      width: 14px;
      height: 14px;
      align-items: center;
      display: flex;
      color: #585656;
    }
    .box-menu .menu-item:hover,
    .box-menu .menu-item[selected] {
      background-color: #f6f6f6;
      color: #1b1d1f;
    }
    .box-menu .menu-item:hover .el-icon {
      color: #1b1d1f;
    }
    .box-menu .menu-item span {
      margin-left: 10px;
    }
    .dialog {
      position: absolute;
      z-index: 2000;
      left: 0;
      top: 0;
      right: 0;
      bottom: 0;
      background: rgba(0, 0, 0, 0.3);
    }
    .style-dialog {
      font-size: 12px;
      position: absolute;
      width: 350px;
      top: 50%;
      left: 50%;
      transform: translate(-50%, -50%);
      border: 1px solid #e6e6e6;
      box-shadow: 0px 0px 15px -6px;
      background: white;
      padding: 42px 20px 20px;
      border-radius: 5px;
      max-height: 100%;
    }
    .dialog .close {
      width: 18px;
      height: 18px;
      position: absolute;
      top: 10px;
      right: 10px;
      cursor: pointer;
    }
    .dialog .close:hover {
      opacity: 0.7;
    }
    .style-dialog .head {
      position: absolute;
      top: 0;
      left: 0;
      right: 0;
      padding: 8px;
      border-bottom: 1px solid #dddddd;
    }
    .move-bg {
      position: absolute;
      top: 0;
      left: 0;
      right: 0;
      bottom: 0px;
      background-color: rgba(182, 182, 182, 0);
      // z-index: -1;
      cursor: move;
    }
    .head-tool {
      height: 36px;
      display: flex;
      justify-content: space-between;
      align-items: center;
      cursor: move;
      padding: 0 10px;
    }
    .head-tool:hover {
      background-color: #f6f6f6;
    }
    .grid-layout > .grid-item[edit="false"] .head-tool {
      cursor: default;
    }
    .grid-layout > .grid-item[edit="false"] .head-too:hover {
      background-color: #fff;
    }
    .tool-btn {
      cursor: pointer;
    }
    .grid-layout > .grid-item[edit="false"] .tool-btn {
      display: none;
    }
    .title_cls {
      display: flex;
      align-items: center;
    }
  `;
__decorate([
    state()
], GridLayoutLit.prototype, "RenderIndex", void 0);
__decorate([
    property({ type: Number })
], GridLayoutLit.prototype, "gridMargin", void 0);
__decorate([
    property({ type: Boolean })
], GridLayoutLit.prototype, "edit", void 0);
__decorate([
    property({ type: Array })
], GridLayoutLit.prototype, "layoutData", void 0);
__decorate([
    property({ type: Boolean })
], GridLayoutLit.prototype, "hideToolbar", void 0);
__decorate([
    property({ type: Array })
], GridLayoutLit.prototype, "headerConfigList", void 0);
__decorate([
    property({ type: Object })
], GridLayoutLit.prototype, "layoutDefaultGridStyle", null);
__decorate([
    property({ type: Object })
], GridLayoutLit.prototype, "i18n", void 0);
__decorate([
    property({ type: Number })
], GridLayoutLit.prototype, "stageWidth", void 0);
__decorate([
    property({ type: Number })
], GridLayoutLit.prototype, "stageHeight", void 0);
GridLayoutLit = __decorate([
    customElement("grid-layout-lit")
], GridLayoutLit);
export { GridLayoutLit };
//# sourceMappingURL=grid-layout-lit.js.map