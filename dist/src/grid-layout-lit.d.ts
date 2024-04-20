import { LitElement } from 'lit';
import { GridItemStyleType, ActiveGridItemStyleType, GridItemData, ItemData } from './types';
type HtmlPosition = {
    left: number;
    top: number;
};
type GridPosition = {
    x: number;
    y: number;
};
export declare class GridLayoutLit extends LitElement {
    /**
     * @state 相当于数据绑定 有变化触发页面渲染
     * @property 外部可调用 外部传入
     */
    /**
     * 这个属性改动，页面才会render
     */
    RenderIndex: number;
    /**
     * 网格间距,每个间距是一个网格数
     */
    gridMargin: number;
    edit: boolean;
    layoutData: GridItemData[];
    hideToolbar: boolean;
    headerConfigList: never[];
    /**
     * 拖拽布局默认样式
     */
    private $layoutDefaultGridStyle;
    get layoutDefaultGridStyle(): GridItemStyleType;
    i18n: {
        t: (k: string, b: boolean) => string;
        tt: (k: string, b: boolean) => string;
        locale: string;
    };
    set layoutDefaultGridStyle(val: GridItemStyleType);
    /**
     * 拖拽布局总体宽度 像素
     */
    stageWidth: number;
    /**
     * 拖拽布局总体高度 像素
     */
    stageHeight: number;
    /**
     * 是否显示滚动条
     */
    get hasDisplayScrollBar(): boolean;
    /**
     * 宽度最大的网格数
     */
    maxGridItemWidthCount: number;
    /**
     * 高度最大的网格数
     */
    maxGridItemHeightCount: number;
    /**
     * 当前点击弹出菜单的Postion
     */
    curGridItemSubMenuPos: GridPosition;
    /**
     * 显示相关的GridItem 的菜单
     */
    curGridItemSubMenuShow: boolean;
    /**
     * 当前点击弹出菜单GridItem
     */
    curGridItemSubMenuGridData: GridItemData | null;
    showDialogGridStyle: boolean;
    /**
     * 底部占位阴影的数据
     * (所有gridItem共用一个阴影)
     */
    dragData: {
        x: number;
        y: number;
        w: number;
        h: number;
        z: number;
        id: string;
    };
    draggIng: boolean;
    floatStep: number;
    lightningId: string;
    /** resize相关 */
    /**
     * 移动初始位置
     */
    resizeFixPosition: any;
    /**
     * 移动中的位置
     */
    resizeingPosition: any;
    /**
     * 移动初始griditem 数据
     */
    resizeFixGridItemData: GridItemData | null;
    /**
     * 当前移动中的 gridItem 数据
     */
    curResizingGridItemData: any | null;
    /**
     * 暂时无用
     * 存储数据
     */
    dataStore: any[];
    dataStoreIndex: number;
    curMovingGridItemData: any | null;
    movePosition: HtmlPosition;
    transition: boolean;
    /**
     * 默认 每个拖拽项目的宽高 所占的网格数
     */
    defaultGridItemWidth: number;
    defaultGridItemHeight: number;
    defaultRightMargin: number;
    /**
     * 是否禁止滚动条
     */
    get isDisableScrollBars(): boolean;
    /**
     * 正常情况下 有滚动条 的时候 每个网格的宽度所占的像素值
     */
    get griddingWidth(): number;
    /**
     * 计算每个网格的高度所占的像素值
     */
    get griddingHeight(): number;
    /**
     * 选中的GridItem
     */
    get selectedGridItem(): GridItemData | undefined;
    /**
     * 重新渲染
     */
    reRender(): void;
    /**
     * 拖拽阴影dom
     * @returns
     */
    drawDragDataHtml(): import("lit-html").TemplateResult<1>;
    constructor();
    /**
     * 查找GridItem
     * @param id gridItem id
     * @returns
     */
    findGridItemData: (id: any) => GridItemData | undefined;
    /**
     * 添加 gridItem
     * @returns
     */
    addGridItem(): GridItemData;
    /**
     * 闪一下Grid的样式
     * @param grid
     */
    lightningGrid(grid: GridItemData): void;
    /**
     * 移动到这个GridItem的显示屏上
     * @param grid
     */
    focusGridItem(grid: GridItemData): void;
    /**
     * 获取GridItem的元素
     * @param index gridItem的index
     * @returns
     */
    getGridItemElement(index: number): Promise<Element | null | undefined>;
    /**
     * 获取空间的位置
     * @param w
     * @param h
     * @returns { x, y }
     */
    getEmptyBound(w: number, h: number, exceptFloatItem?: boolean): {
        x: number;
        y: number;
    };
    /**
     * 查找存在的最大的重叠交叉项
     * */
    findBigestOverlapItem: (dataList: GridItemData[], x: number, y: number, w: number, h: number, exceptIds: any[], exceptFloatItem?: boolean) => GridItemData | undefined;
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
    findOverlapItem: (dataList: GridItemData[], x: number, y: number, w: number, h: number, exceptIds: any[], overCount?: number, exceptFloatItem?: boolean) => GridItemData[];
    /**
     * Resize start 拖拉grid item 的大小
     * @param event MouseEvent
     */
    gridItemResizeStart(event: MouseEvent): void;
    /**
     * resizeing  中的方法
     * @param event
     */
    gridItemResizeing(event: any): void;
    /**
     * 触发gridItemResize事件
     */
    handDispatchGridItemResizeEvent: any;
    dispatchGridItemResizeEvent(data: GridItemData | undefined | null): void;
    /**
     * 结束改变大小
     * Resize end
     */
    gridItemResizeEnd(): void;
    /**
     * ItemStyle事件
     * @param data GridItemData
     * @returns
     */
    getGridItemStyle(data: GridItemData): string;
    /** 保存Layout */
    saveCurLayout(): void;
    animateGridItem(item: GridItemData, w?: number, h?: number): Promise<unknown>;
    /** 移除GridItem */
    gridItemClose(event: PointerEvent): Promise<void>;
    /**
     * 关闭菜单
     */
    closeGridItemSubMenu(): void;
    /** 移除GridItem */
    gridItemCloseBySubMenu(): Promise<void>;
    getGridItemIndex(target: any): number;
    getGridItem(target: any): GridItemData;
    /**
     * 拖拽开始
     * @param event PointerEvent
     * @returns void
     */
    gridItemDragstart(event: PointerEvent): void;
    /**
     * 转换成的GidPosition
     * @param left style.left
     * @param top style.top
     * @returns {x,y}
     */
    calcNearPosition: (left: number, top: number) => GridPosition;
    /**
     * 获取最近的空间
     * @param grid :GridItemData
     * @returns {x,y}
     */
    getNearEmptyPosition(grid: GridItemData): {
        x: number;
        y: number;
    };
    /** 无用代码
     * 返回 上次的layout
     * @returns JSON
     */
    getBackLayout: () => any;
    /**
     * // 无用代码
     * 打开上次的保存layout
     */
    backLayout: () => void;
    /** 调试代码 无用 下一个layout */
    getForwardLayout: () => any;
    /**
     * 调试代码 无用
     * 打开下一步的layout
     */
    forwardLayout: () => void;
    /**
     * 调试代码, 无用
     * 关闭事件
     */
    close: () => void;
    /**
     * 测试代码 无用
     */
    save: () => void;
    /**
     * 复杂
     * @returns
     */
    gridItemCopyBySubMenu: () => void;
    /**
     * GridLayout的点击事件
     * @param event
     * @returns
     */
    onGridLayoutClick(event: any): void;
    /**
     * 获取GridItem的TOP y坐标 检查上方有没有空间,如果有往上挪动一点
     * @param dataList
     * @param grid
     * @param exceptIds
     * @returns
     */
    getGridItemTopY(dataList: GridItemData[], grid: ItemData, exceptIds: any[]): {
        x: number;
        y: number;
    };
    /**
     * 无用代码,暂时保留
     * 计算两项交叉面积
     * @param data1
     * @param data2
     * @returns
     */
    calcOverArea(data1: ItemData, data2: ItemData): number;
    /**
     * 排序上面有空白的地方
     * @param list
     */
    sortTopSpace(list: GridItemData[]): void;
    /**
     * 排序底部重叠的地方
     * @param list
     */
    sortBottomOver(list: GridItemData[]): void;
    /**
     * 往下压
     * @param list
     * @param item
     * 将每个item 与 其他的item 一个个比较 有无重叠的部分
     */
    pressDownOver(list: GridItemData[], item: GridItemData): void;
    /**
     * 重新排序 将网格重新组合排列
     */
    rearrangement(): void;
    /**
     * 浮动 向上一级
     * @returns
     */
    setZindexUp(): void;
    /**
     * 浮动 向下一级
     * @returns
     */
    setZindexDown(): void;
    /**
     *  无用代码,暂时保留
     * @returns
     */
    getLayoutDefaultGridItemStyle(): any;
    /**
     * 打开样式配置
     * @returns
     */
    openSetStyleBySubMenu(): void;
    /**
     * 弹出右上角的菜单
     * @returns
     */
    openConfigSetBySubMenu(): void;
    /**
     * 当前活动的GridItem
     *
     */
    get curActiveGridItem(): any;
    /**
     * 当前活动的GridItem style
     */
    get curActiveGridItemStyle(): any;
    get curSelectGridItem(): GridItemData | undefined;
    /**
     * 选中的UserStyle;
     */
    get curGridItemSubMenuGridDataActiveStyle(): ActiveGridItemStyleType | undefined;
    /**
     * 计算的舞台虚拟高度 网格数
     */
    get calcStageVirtualHeight(): number;
    /**
     * 计算的舞台实际高度
     */
    get calcStageActualHeight(): number;
    /**
     * 无用代码
     * 关闭
     */
    dialogClose(): void;
    /**
     * resize事件
     */
    boxResizeTime: any;
    boxResize(): void;
    /**
     * 绑定事件
     */
    bindHnd: {
        [s: string]: any;
    };
    bind(obj: any, type: string): any;
    /**
     * 无用代码
     * @param e
     */
    WcVueGridStyleChange(e: any): void;
    /**
     * 生命周期--初始化
     */
    connectedCallback(): void;
    /**
     * 生命周期--销毁
     */
    disconnectedCallback(): void;
    /**
     *  工具栏
     */
    onCLickTool(event: any): void;
    /**
     * 获取title
     */
    getItemTitle(itemId: string): any;
    /**
     * 渲染方法
     * @returns
     */
    render(): import("lit-html").TemplateResult<1>;
    renderToobar(): import("lit-html").TemplateResult<1> | "";
    showGridItemMenu(): import("lit-html").TemplateResult<1>;
    showDialog(): import("lit-html").TemplateResult<1> | "";
    static styles: import("lit").CSSResult;
}
export {};
