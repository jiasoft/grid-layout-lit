import { html, css, LitElement } from 'lit'
import { property, state, customElement } from 'lit/decorators.js'
import {
    GridItemReizeName,
    GridItemStyleType,
    ActiveGridItemStyleType,
    GridItemData,
    ItemData
} from './types'
import { MORE_SVG, TITLE_SVG } from './icon'
// import { generateRandomUID } from '../../lib/api'
const generateRandomUID = () => {
    return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, c => {
        const r = (Math.random() * 16) | 0,
            v = c === 'x' ? r : (r & 0x3) | 0x8
        return v.toString(16)
    })
}
type HtmlPosition = {
    left: number
    top: number
}
type GridPosition = {
    x: number
    y: number
}

const DRAG_ID = '100000'
@customElement('grid-layout-lit')
export class GridLayoutLit extends LitElement {
    /**
     * @state 相当于数据绑定 有变化触发页面渲染
     * @property 外部可调用 外部传入
     */

    /**
     * 这个属性改动，页面才会render
     */
    @state() RenderIndex: number = 0
    /**
     * 网格间距,每个间距是一个网格数
     */
    @property({ type: Number }) gridMargin = 1
    @property({ type: Boolean }) edit = false
    @property({ type: Array }) layoutData: GridItemData[] = []
    @property({ type: Boolean }) hideToolbar = false
    @property({ type: Array }) headerConfigList = []
    /**
     * 拖拽布局默认样式
     */
    private $layoutDefaultGridStyle: GridItemStyleType = {
        borderRadius: 3,
        borderColor: '#c3c3c3',
        borderWidth: 1,
        borderStyle: 'solid',
        titleColor: '',
        contentColor: '',
        disableScrollBars: false
    }
    @property({ type: Object })
    get layoutDefaultGridStyle(): GridItemStyleType {
        return this.$layoutDefaultGridStyle
    }
    @property({ type: Object }) i18n = {
        t: (k:string, b: boolean) => k,
        tt: (k:string, b: boolean) => k,
        locale: 'zh-cn'
    }
    set layoutDefaultGridStyle(val: GridItemStyleType) {
        this.$layoutDefaultGridStyle = val || this.$layoutDefaultGridStyle
        this.style.overflowY = this.isDisableScrollBars ? 'hidden' : 'auto'
    }
    /**
     * 拖拽布局总体宽度 像素
     */
    @property({ type: Number })
    stageWidth: number = 1000
    /**
     * 拖拽布局总体高度 像素
     */
    @property({ type: Number })
    stageHeight: number = 800
    /**
     * 是否显示滚动条
     */
    get hasDisplayScrollBar() {
        if (this.layoutDefaultGridStyle.disableScrollBars) return false
        return this.calcStageActualHeight > this.clientHeight
    }
    // @property({ type: Boolean }) disableScrollBars = false //是否禁止滚动
    /**
     * 宽度最大的网格数
     */
    maxGridItemWidthCount: number = 173
    /**
     * 高度最大的网格数
     */
    maxGridItemHeightCount: number = 86
    /**
     * 当前点击弹出菜单的Postion
     */
    curGridItemSubMenuPos: GridPosition = { x: 0, y: 0 }
    /**
     * 显示相关的GridItem 的菜单
     */
    curGridItemSubMenuShow: boolean = false
    /**
     * 当前点击弹出菜单GridItem
     */
    curGridItemSubMenuGridData: GridItemData | null = null

    // styleMapEditing: boolean = false
    showDialogGridStyle: boolean = false
    /**
     * 底部占位阴影的数据
     * (所有gridItem共用一个阴影)
     */
    dragData = { x: 0, y: 0, w: 60, h: 60, z: 0, id: DRAG_ID }
    draggIng: boolean = false
    floatStep: number = 1
    lightningId: string = ''
    /** resize相关 */

    /**
     * 移动初始位置
     */
    resizeFixPosition: any = { top: 0, left: 0 }
    /**
     * 移动中的位置
     */
    resizeingPosition: any = { top: 0, left: 0 }
    /**
     * 移动初始griditem 数据
     */
    resizeFixGridItemData: GridItemData | null = null
    /**
     * 当前移动中的 gridItem 数据
     */
    curResizingGridItemData: any | null = null

    /**
     * 暂时无用
     * 存储数据
     */
    dataStore: any[] = []
    dataStoreIndex: number = 0
    curMovingGridItemData: any | null = null
    movePosition: HtmlPosition = { left: 0, top: 0 }
    // fixPosition: HtmlPosition = { left: 0, top: 0 }
    // oldPosition: HtmlPosition = { left: 0, top: 0 }
    transition: boolean = false
    /**
     * 默认 每个拖拽项目的宽高 所占的网格数
     */
    defaultGridItemWidth: number = 13
    defaultGridItemHeight: number = 7
    /**
     * 是否禁止滚动条
     */
    get isDisableScrollBars(): boolean {
        return this.layoutDefaultGridStyle.disableScrollBars
    }
    /**
     * 正常情况下 有滚动条 的时候 每个网格的宽度所占的像素值
     */
    get griddingWidth(): number {
        return this.stageWidth / this.maxGridItemWidthCount
    }
    /**
     * 计算每个网格的高度所占的像素值
     */
    get griddingHeight(): number {
        //满屏算法  计算没有滚动条的时候 计算出每个网格的高度
        if (!this.edit && this.layoutDefaultGridStyle?.disableScrollBars) {
            const _griddingHeight: number = this.stageHeight / this.calcStageVirtualHeight
            return _griddingHeight < this.griddingWidth ? _griddingHeight : this.griddingWidth
        }
        return this.griddingWidth
    }
    /**
     * 选中的GridItem
     */
    get selectedGridItem() {
        return this.layoutData.find(item => item.selected)
    }
    /**
     * 重新渲染
     */
    reRender() {
        this.RenderIndex++
    }
    /**
     * 拖拽阴影dom
     * @returns
     */
    drawDragDataHtml() {
        return html`<div
            class="grid-item drag"
            drag="${true}"
            style="${this.getGridItemStyle(this.dragData)}"
        ></div>`
    }
    constructor() {
        super()
    }
    /**
     * 查找GridItem
     * @param id gridItem id
     * @returns
     */
    findGridItemData = (id: any): GridItemData | undefined => {
        return this.layoutData.find((item: GridItemData) => item.id === id)
    }
    /**
     * 添加 gridItem
     * @returns
     */
    addGridItem() {
        const w = this.defaultGridItemWidth
        const h = 20
        const { x, y } = this.getEmptyBound(w, h, false)
        const tid = generateRandomUID()
        const floatCount = this.layoutData.filter(item => item.float).length
        const item: GridItemData = {
            x,
            y,
            w,
            h,
            z: floatCount,
            id: tid,
            slot: 'slot_' + tid,
            title: tid
        }
        if (this.isDisableScrollBars) {
            const maxHeight = this.getBoundingClientRect().height
            if ((y + h) * this.griddingWidth >= maxHeight) {
                item.float = true
                if (
                    (this.floatStep + item.w) * this.griddingWidth >= this.stageWidth ||
                    (this.floatStep + item.h) * this.griddingHeight >= maxHeight
                ) {
                    this.floatStep = 1
                }
                item.y = this.floatStep + 1
                item.x = this.floatStep + 1

                this.floatStep = item.y
            }
        }

        this.layoutData.push(item)
        this.reRender()
        this.saveCurLayout()

        return item
    }
    /**
     * 闪一下Grid的样式
     * @param grid
     */
    lightningGrid(grid: GridItemData) {
        this.lightningId = String(grid.id)
        this.reRender()
        this.focusGridItem(grid)
        setTimeout(() => {
            this.lightningId = ''
            this.reRender()
        }, 500)
    }
    /**
     * 移动到这个GridItem的显示屏上
     * @param grid
     */
    focusGridItem(grid: GridItemData) {
        setTimeout(async () => {
            const index: number = this.layoutData.findIndex(item => item.id === grid.id)
            const element: Element | null | undefined = await this.getGridItemElement(index)
            if (!element) return
            const input = document.createElement('input')
            input.style.position = 'absolute'
            input.style.opacity = '0.01'
            element.appendChild(input)
            input.focus()
            setTimeout(() => {
                element.removeChild(input)
            }, 50)
        }, 100)
    }
    /**
     * 获取GridItem的元素
     * @param index gridItem的index
     * @returns
     */
    getGridItemElement(index: number): Promise<Element | null | undefined> {
        return new Promise(resolve => {
            let length = 20
            const loopfindGridItem = () => {
                const ele: Element | null | undefined = this.shadowRoot?.querySelector(
                    `.grid-item[data-index="${index}"]`
                )
                if (ele) {
                    resolve(ele)
                } else {
                    setTimeout(() => {
                        if (--length <= 0) {
                            resolve(null)
                            return
                        }
                        loopfindGridItem()
                    }, 10)
                }
            }
            loopfindGridItem()
        })
    }
    /**
     * 获取空间的位置
     * @param w
     * @param h
     * @returns { x, y }
     */
    getEmptyBound(w: number, h: number, exceptFloatItem: boolean = true) {
        let x = this.gridMargin,
            y = this.gridMargin
        let item = this.findBigestOverlapItem(this.layoutData, x, y, w, h, [], exceptFloatItem)
        while (item) {
            x = item.x + item.w + this.gridMargin
            if (
                (x + this.gridMargin) * this.griddingWidth + w * this.griddingWidth >
                this.stageWidth
            ) {
                y += this.gridMargin
                x = this.gridMargin
            }
            item = this.findBigestOverlapItem(this.layoutData, x, y, w, h, [], exceptFloatItem)
        }
        return { x, y }
    }
    /**
     * 查找存在的最大的重叠交叉项
     * */
    findBigestOverlapItem = (
        dataList: GridItemData[],
        x: number,
        y: number,
        w: number, //每个网格宽度所占的像素值
        h: number, //每个网格高度所占的像素值
        exceptIds: any[],
        exceptFloatItem: boolean = true
    ): GridItemData | undefined => {
        const list = this.findOverlapItem(dataList, x, y, w, h, exceptIds, 0, exceptFloatItem)
        let BigestOverlapArea = -99999999999 //最大的重叠交叉面积
        let BigestOverlapItem: any = undefined
        list.forEach((item: any) => {
            const curItemX = item.x
            const curItemY = item.y
            const curItemW = item.w
            const curItemH = item.h
            const overX1 = Math.max(x, curItemX)
            const overX2 = Math.min(x + w, curItemX + curItemW)
            const overW = overX2 - overX1
            const overY1 = Math.max(y, curItemY)
            const overY2 = Math.min(y + h, curItemY + curItemH)
            const overH = overY2 - overY1
            const overArea = overH * overW
            if (overArea > BigestOverlapArea) {
                BigestOverlapArea = overArea
                BigestOverlapItem = item
            }
        })

        return BigestOverlapItem
    }
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
    findOverlapItem = (
        dataList: GridItemData[],
        x: number,
        y: number,
        w: number,
        h: number,
        exceptIds: any[],
        overCount: number = 0,
        exceptFloatItem: boolean = true
    ): GridItemData[] => {
        const list: GridItemData[] = []
        let data = [...dataList]
        if (exceptFloatItem) data = data.filter((item: any) => !item.float)
        if (this.curActiveGridItem && this.dragData) {
            // 如果有正在拖动的 那么 将正在拖动的项目添加到列表中
            if (!data.find(item => item.id === this.dragData.id)) {
                data = [...data, this.dragData]
            }
        }
        for (let i = 0; i < data.length; i++) {
            const item = data[i]
            // 如果当前项目正在排出列表中 直接跳过循环
            if (exceptIds && exceptIds.indexOf(item.id) >= 0) {
                continue
            }
            // 当前项目的位置 大小 信息
            const curItemX = item.x
            const curItemY = item.y
            const curItemW = item.w
            const curItemH = item.h
            // 对比项目(传入的) 与当前项目 对比 取出较小的
            const x1 = Math.min(curItemX, x)
            // 对比项目(传入的) 与当前项目 对比 取出较大的
            const x2 = Math.max(curItemX + curItemW, x + w)

            const y1 = Math.min(curItemY, y)
            const y2 = Math.max(curItemY + curItemH, y + h)

            //是否存在交叉的算法
            // 假如两个项目重叠  那么 第一个项目的最左侧 + 第二个项目的最右侧 的 宽度 一定小于 两个 项目的宽度和
            // 高度同上
            if (
                x2 - x1 - (curItemW + w) + overCount < this.gridMargin &&
                y2 - y1 - (curItemH + h) + overCount < this.gridMargin
            ) {
                list.push(item)
            }
        }
        return list
    }
    /**
     * Resize start 拖拉grid item 的大小
     * @param event MouseEvent
     */
    gridItemResizeStart(event: MouseEvent) {
        if (!this.edit) return
        event.preventDefault()
        event.stopPropagation()

        // 获取当前 item的索引
        const index = this.getGridItemIndex(event.currentTarget)
        // 当前拖拽项目数据
        this.curResizingGridItemData = this.layoutData[index]
        // 复制当前拖拽项目数据
        this.resizeFixGridItemData = { ...this.layoutData[index] }
        // 鼠标的位置
        // 记录鼠标按下时的位置
        this.resizeFixPosition.left = event.clientX
        this.resizeFixPosition.top = event.clientY
        // 记录鼠标拖动中的位置
        this.resizeingPosition.left = event.clientX
        this.resizeingPosition.top = event.clientY
        // 开启动画效果
        this.transition = true
        // 重新渲染
        this.reRender()
        // 设置dom 今只文字选中
        document.body.setAttribute('onselectstart', 'return false')
        // 设置鼠标为 resize 状态
        document.body.style.cursor = 'se-resize'

        // 鼠标移动方法
        const mouseMove = (event: MouseEvent) => {
            // 鼠标移动的时候方块大小改变
            this.gridItemResizeing(event)
        }
        // 初始化阴影的位置 所有网格共用一个阴影
        const { x, y, w, h, id } = this.curResizingGridItemData
        this.dragData.x = x
        this.dragData.y = y
        this.dragData.w = w
        this.dragData.h = h
        // 释放鼠标左键触发的方法
        const mouseup = () => {
            // 移除选中文字的属性
            document.body.removeAttribute('onselectstart')
            // 去除鼠标箭头样式
            document.body.style.cursor = ''
            // 结束网格 resize 状态
            this.gridItemResizeEnd()
            window.removeEventListener('mousemove', mouseMove)
            window.removeEventListener('mouseup', mouseup)
        }
        // 鼠标移动方法
        window.addEventListener('mousemove', mouseMove)
        // 鼠标松开
        window.addEventListener('mouseup', mouseup)
    }
    /**
     * resizeing  中的方法
     * @param event
     */
    gridItemResizeing(event: any) {
        // 不是编辑状态 不让拖
        if (!this.edit) return
        // 代码保护
        if (!this.curResizingGridItemData) return
        // 记录移动后鼠标的位置
        this.resizeingPosition.left = event.clientX
        this.resizeingPosition.top = event.clientY
        if (!this.resizeFixGridItemData) return
        /**
         * 最终的网格数 = 当前选中的gridItem resize之前的宽度所占的网格数 + 移动过程中 新增/减少 的网格数
         * 移动过程中 新增/减少 的网格数 = (移动后鼠标的位置像素值 - 移动前鼠标的位置像素值) / 每个网格所占的像素值
         */
        let w =
            this.resizeFixGridItemData?.w +
            Math.round(
                (this.resizeingPosition.left - this.resizeFixPosition.left) / this.griddingWidth
            )
        let h =
            this.resizeFixGridItemData?.h +
            Math.round(
                (this.resizeingPosition.top - this.resizeFixPosition.top) / this.griddingHeight
            )
        // 容器最左端 到该网格左上角的位置横向网格数
        const x = this.resizeFixGridItemData?.x
        // 容器的最上端 到该网格左上角的位置纵向网格数
        const y = this.resizeFixGridItemData?.y
        // 暂时无用 浮动代码可能有用
        const z = this.resizeFixGridItemData?.z

        // 调整大小之后 网格 高度的像素值
        const height =
            this.resizeFixGridItemData.h * this.griddingHeight +
            (this.resizeingPosition.top - this.resizeFixPosition.top)
        // 调整大小之后 网格 宽度的像素值
        let width =
            this.resizeFixGridItemData.w * this.griddingWidth +
            (this.resizeingPosition.left - this.resizeFixPosition.left)
        // resize过程中 最多只能拖到容器的最大宽度
        if (width > this.stageWidth - x * this.griddingWidth) {
            width = this.stageWidth - x * this.griddingWidth
        }
        // 当前resizing 实时变化的宽度和高度 位置信息
        this.curResizingGridItemData.style = {
            width,
            height,
            left: x * this.griddingWidth,
            top: y * this.griddingHeight
        }

        // resize 完成 之后
        /** 不允许超出stageWidth */
        w =
            w * this.griddingWidth <= this.stageWidth - (x + this.gridMargin) * this.griddingWidth
                ? w
                : Math.floor(this.stageWidth / this.griddingWidth) - x - this.gridMargin

        if (this.isDisableScrollBars) {
            /** 不允许超出stageHeight */
            h =
                h * this.griddingHeight <=
                this.stageHeight - (y + this.gridMargin) * this.griddingHeight
                    ? h
                    : Math.floor(this.stageHeight / this.griddingHeight) - x - this.gridMargin
        }

        // 最小 的 高度和宽度只能拖到 8 和 4
        w = w < 8 ? 8 : w
        h = h < 4 ? 4 : h
        // 设置拖拽状态
        this.draggIng = true
        // 设置阴影的位置
        this.dragData.x = x
        this.dragData.y = y
        this.dragData.w = w
        this.dragData.h = h
        // 浮动
        if (!this.curResizingGridItemData.float) this.rearrangement()
        // 重新渲染
        this.reRender()
        this.dispatchGridItemResizeEvent(this.curResizingGridItemData)
    }
    /**
     * 触发gridItemResize事件
     */
    handDispatchGridItemResizeEvent: any = 0
    dispatchGridItemResizeEvent(data: GridItemData | undefined | null) {
        clearTimeout(this.handDispatchGridItemResizeEvent)
        // 向外发送resize 事件 60s 防抖
        this.handDispatchGridItemResizeEvent = setTimeout(() => {
            const resize = new CustomEvent(GridItemReizeName, {
                detail: data
            })
            window.dispatchEvent(resize)
        }, 60)
    }
    /**
     * 结束改变大小
     * Resize end
     */
    gridItemResizeEnd() {
        if (!this.edit) return
        this.draggIng = false
        const { x, y, w, h } = this.dragData
        if (!this.curResizingGridItemData) return
        this.curResizingGridItemData.x = x
        this.curResizingGridItemData.y = y
        this.curResizingGridItemData.w = w
        this.curResizingGridItemData.h = h
        delete this.curResizingGridItemData.style
        this.dispatchGridItemResizeEvent({ ...this.curResizingGridItemData })
        this.curResizingGridItemData = null
        this.rearrangement()
        this.transition = false
        this.reRender()
        this.saveCurLayout()
    }
    /**
     * ItemStyle事件
     * @param data GridItemData
     * @returns
     */
    getGridItemStyle(data: GridItemData) {
        // 拖拽时的 占位item 的 z-index
        const ActiveZindex = 888
        // 拖拽底部阴影的z-index
        const DragZInxex = 800
        const FloatZindex = 900
        const css: string[] = []
        // 单个项目的自定义样式
        if (data.activeStyle) {
            const attr: string[] = []
            attr.push(`border-style:${data.activeStyle.borderStyle};`)
            attr.push(`border-width:${data.activeStyle.borderWidth || 0}px;`)
            attr.push(`border-color:${data.activeStyle.borderColor || 'transparent'};`)
            attr.push(`border-radius:${data.activeStyle.borderRadius || 0}px;`)
            css.push(`
                ${attr.join('')}
            `)
            css.push(`background-color:${data.activeStyle.contentColor || 'transparent'};`)
        }
        // 当前活动的样式?
        if (data.style) {
            css.push(`
                transition:none;
                left:${data.style.left}px;
                top:${data.style.top}px;
                z-index:${data.float ? FloatZindex + (data.z || 0) : ActiveZindex};
                width:${data.style.width}px; 
                height:${data.style.height}px`)
            return css.join('')
        }
        // 计算当前item的位置 宽高
        const style = {
            left: data.x * this.griddingWidth,
            top: data.y * this.griddingHeight,
            width: data.w * this.griddingWidth,
            height: data.h * this.griddingHeight
        }
        // 设置z-index
        let zIndex = data.z || 0
        if (data.id === DRAG_ID) zIndex = DragZInxex
        if (data.float) zIndex = FloatZindex + (data.z || 0)

        css.push(`
            left:${style.left}px;
            top:${style.top}px;
            z-index:${zIndex};
            width:${style.width}px; 
            height:${style.height}px;`)

        return css.join('')
    }
    /** 保存Layout */
    saveCurLayout() {
        const jsonstr = JSON.stringify(this.layoutData)
        const json = JSON.stringify(
            JSON.parse(jsonstr).map((item: any) => {
                delete item.selected
                return item
            })
        )
        if (json != this.dataStore[this.dataStoreIndex]) {
            this.dataStoreIndex++
            this.dataStore[this.dataStoreIndex] = json
        }
    }
    animateGridItem(item: GridItemData, w: number = 3, h: number = 2) {
        return new Promise(resolve => {
            let minusW = Math.floor((item.w - w) / 5)
            let minusH = Math.floor((item.h - h) / 5)
            if (minusW < 1) minusW = 1
            if (minusH < 1) minusH = 1
            const animate = () => {
                item.w -= minusW
                item.h -= minusH
                if (item.w < w) {
                    item.w = w
                }
                if (item.h < h) {
                    item.h = h
                }
                this.rearrangement()
                this.reRender()
                if (item.w > w || item.h > h) {
                    window.requestAnimationFrame(() => {
                        animate()
                    })
                } else {
                    resolve(null)
                }
            }
            animate()
        })
    }
    /** 移除GridItem */
    async gridItemClose(event: PointerEvent) {
        const index = this.getGridItemIndex(event.currentTarget)
        const item: GridItemData = this.layoutData[index]

        await this.animateGridItem(item, 3, 3)
        this.layoutData.splice(index, 1)
        this.transition = false
        this.rearrangement()
        this.reRender()
    }
    /**
     * 关闭菜单
     */
    closeGridItemSubMenu() {
        this.curGridItemSubMenuShow = false
        this.curGridItemSubMenuGridData = null
    }
    /** 移除GridItem */
    async gridItemCloseBySubMenu() {
        if (!this.curGridItemSubMenuGridData) return
        const item: GridItemData = this.curGridItemSubMenuGridData
        const index = this.layoutData.findIndex(a => a.id === item.id)
        await this.animateGridItem(item, 3, 3)
        const junkGridItem = this.layoutData.splice(index, 1)[0]
        this.transition = false
        this.closeGridItemSubMenu()
        this.rearrangement()
        this.reRender()
        const emit: any = new Event('removeGridItem')
        emit.detail = junkGridItem
        this.dispatchEvent(emit)
    }
    getGridItemIndex(target: any) {
        const grid: HTMLElement | null = target?.closest('.grid-item') || null
        return Number(grid?.dataset.index || '0')
    }
    getGridItem(target: any) {
        const index = this.getGridItemIndex(target)
        return this.layoutData[index]
    }
    /**
     * 拖拽开始
     * @param event PointerEvent
     * @returns void
     */
    gridItemDragstart(event: PointerEvent) {
        // 如果不是编辑状态 则不让拖动
        if (!this.edit) return
        // 拖动的元素
        const target1: any = event?.target as any
        const target = target1.parentElement as HTMLElement

        // 更多按钮
        if (!target?.closest('.btn-more')) {
            this.closeGridItemSubMenu()
        }
        // 否则 关闭菜单
        this.closeGridItemSubMenu()
        // 移除默认效果
        event.preventDefault()
        // 获取当前grid item 的数据
        const grid = this.getGridItem(target)
        // 设置当前item 为 当前移动的网格item
        this.curMovingGridItemData = grid
        // 代码保护
        if (!this.curMovingGridItemData) return
        // 当前选中项的位置信息
        const { w, h, x, y, id } = this.curMovingGridItemData
        // 当前移动item的位置信息 转换成像素
        this.movePosition = {
            left: this.curMovingGridItemData.x * this.griddingWidth,
            top: this.curMovingGridItemData.y * this.griddingHeight
        }
        // 记住鼠标按下的位置
        const fixPosition: HtmlPosition = { left: 0, top: 0 }
        fixPosition.left = event.clientX
        fixPosition.top = event.clientY
        // 存储以前的位置
        const oldPosition: HtmlPosition = { left: 0, top: 0 }
        oldPosition.left = this.movePosition.left
        oldPosition.top = this.movePosition.top
        // 如果不是当前选中项 那么 移除选中效果
        this.layoutData.forEach(item => {
            if (item.id !== this.curMovingGridItemData.id) delete item.selected
        })
        // 将当前选中项增加选中效果
        this.curMovingGridItemData.selected = true
        // 同步拖拽项 阴影的位置信息
        this.dragData.w = w
        this.dragData.h = h
        this.dragData.x = x
        this.dragData.y = y
        // 添加拖拽项目动画效果
        this.transition = true
        // 重新渲染
        this.reRender()
        // 拖拽中的事件
        const onDragging: any = (event: PointerEvent) => {
            // 代码保护 如果不是当前移动事件 直接退出
            if (!this.edit || !this.curMovingGridItemData) return
            // 选中当前移动的item
            this.curMovingGridItemData.selected = true
            // 移动中的位置 = 旧位置 + 鼠标移动的距离(px)
            this.movePosition.left = oldPosition.left + (event.clientX - fixPosition.left)
            this.movePosition.top = oldPosition.top + (event.clientY - fixPosition.top)

            // 拖拽中的阴影
            this.draggIng = true

            // 当前移动中的item
            const { w, h } = this.curMovingGridItemData
            // 阴影的位置
            this.dragData.w = w
            this.dragData.h = h

            // 计算当前移动item的高度px/宽度px
            const height = this.curMovingGridItemData.h * this.griddingHeight
            const width = this.curMovingGridItemData.w * this.griddingWidth

            // 设置当前移动item的样式
            this.curMovingGridItemData.style = {
                width,
                height,
                left: this.movePosition.left,
                top: this.movePosition.top
            }
            // 将px像素值转成 网格数
            const { x, y } = this.calcNearPosition(this.movePosition.left, this.movePosition.top)

            // 如果是浮动模式 那么 位置在哪里就是哪里
            if (this.curMovingGridItemData.float) {
                this.dragData.x = x
                this.dragData.y = y
            } else {
                // 获取最近的空间 将阴影移动到该位置
                const newPos = this.getNearEmptyPosition({
                    x,
                    y,
                    w,
                    h,
                    id: '9999',
                    z: 0
                })
                if (newPos) {
                    this.dragData.x = newPos.x
                    this.dragData.y = newPos.y
                }
            }

            if (!this.curMovingGridItemData?.float) this.rearrangement()
            this.reRender()
        }
        // 拖拽结束事件
        const onDragEnd: any = () => {
            if (!this.edit) return
            this.draggIng = false
            if (!this.curMovingGridItemData) return
            delete this.curMovingGridItemData.style
            this.curMovingGridItemData.x = this.dragData.x
            this.curMovingGridItemData.y = this.dragData.y
            this.curMovingGridItemData = null
            // 关闭动画
            this.transition = false
            // 重新渲染
            this.reRender()
            // 保存layout 数据
            this.saveCurLayout()
            // 移除禁止选中文字
            document.body.removeAttribute('onselectstart')
            // 移除监听事件
            window.removeEventListener('mousemove', onDragging)
            window.removeEventListener('mouseup', onDragEnd)
        }
        // 将dome 禁止选中文字
        document.body.setAttribute('onselectstart', 'return false')
        // 监听鼠标移动事件
        window.addEventListener('mousemove', onDragging)
        // 监听鼠标松开事件
        window.addEventListener('mouseup', onDragEnd)
    }
    /**
     * 转换成的GidPosition
     * @param left style.left
     * @param top style.top
     * @returns {x,y}
     */
    calcNearPosition = (left: number, top: number): GridPosition => {
        const x = Math.round(left / this.griddingWidth)
        const y = Math.round(top / this.griddingHeight)
        return { x, y }
    }

    /**
     * 获取最近的空间
     * @param grid :GridItemData
     * @returns {x,y}
     */
    getNearEmptyPosition(grid: GridItemData) {
        const overMax = 10
        let { x, y } = grid
        const { w, h } = grid
        // 不能小于一个 item 间距
        if (y < this.gridMargin) y = this.gridMargin
        if (x < this.gridMargin) x = this.gridMargin
        // x = x < this.gridMargin ? this.gridMargin : x
        // 宽度不能超出 整个布局的 宽度
        x =
            x + w + this.gridMargin > Math.floor(this.stageWidth / this.griddingWidth)
                ? Math.floor(this.stageWidth / this.griddingWidth) - this.gridMargin - w
                : x
        // 获取当前与当前 item 重叠交叉的 gridItem list
        const overList = this.findOverlapItem(this.layoutData, x, y, w, h, [
            this.dragData.id,
            this.curActiveGridItem.id
        ])
        overList.forEach(overItem => {
            // 交叉部分的宽度
            const overW =
                w +
                overItem.w -
                (Math.max(x + w, overItem.x + overItem.w) - Math.min(x, overItem.x))
            // 交叉部分的高度
            const overH =
                h +
                overItem.h -
                (Math.max(y + h, overItem.y + overItem.h) - Math.min(y, overItem.y))
            if (overH < overW) {
                if (overH < overMax && overH < overItem.h && overH < h) {
                    if (y < overItem.y) {
                        y = overItem.y - h - this.gridMargin
                        if (y < this.gridMargin) {
                            y = this.gridMargin
                        }
                    } else {
                        y = overItem.y + overItem.h + this.gridMargin
                    }
                }
            } else {
                if (overW < overMax && overW < overItem.w && overW < w) {
                    if (x < overItem.x && overItem.x - w > this.gridMargin) {
                        x = overItem.x - w - this.gridMargin
                    } else if (
                        overItem.x + overItem.w + w + this.gridMargin <
                        Math.floor(this.stageWidth / this.griddingWidth)
                    ) {
                        x = overItem.x + overItem.w + this.gridMargin
                    }
                }
            }
        })
        return { x, y }
    }

    /** 无用代码
     * 返回 上次的layout
     * @returns JSON
     */
    getBackLayout = () => {
        this.dataStoreIndex--
        return this.dataStore[this.dataStoreIndex]
    }
    /**
     * // 无用代码
     * 打开上次的保存layout
     */
    backLayout = () => {
        const data = this.getBackLayout()
        if (data) {
            this.layoutData = JSON.parse(data)
        }
    }
    /** 调试代码 无用 下一个layout */
    getForwardLayout = () => {
        this.dataStoreIndex =
            this.dataStore.length - 1 > this.dataStoreIndex
                ? this.dataStoreIndex + 1
                : this.dataStore.length - 1
        return this.dataStore[this.dataStoreIndex]
    }
    /**
     * 调试代码 无用
     * 打开下一步的layout
     */
    forwardLayout = () => {
        const data = this.getForwardLayout()
        if (data) {
            this.layoutData = JSON.parse(data)
        }
    }
    /**
     * 调试代码, 无用
     * 关闭事件
     */
    close = () => {
        const emit: any = new Event('close')
        emit.detail = this.layoutData
        this.dispatchEvent(emit)
    }
    /**
     * 测试代码 无用
     */
    save = () => {
        const emit: any = new Event('save')
        emit.detail = this.layoutData
        this.dispatchEvent(emit)
    }

    /**
     * 复杂
     * @returns
     */
    gridItemCopyBySubMenu = () => {
        if (!this.curGridItemSubMenuGridData) return
        const emit: any = new Event('gridItemCopy')
        emit.detail = this.curGridItemSubMenuGridData
        this.closeGridItemSubMenu()
        this.reRender()
        this.dispatchEvent(emit)
    }
    /**
     * 导出
     */
    gridItemExportBySubMenu = () => {
        this.closeGridItemSubMenu()
        this.reRender()
    }

    /**
     * GridLayout的点击事件
     * @param event
     * @returns
     */
    onGridLayoutClick(event: any) {
        if (event?.target?.closest('.toolbar')) return
        if (event?.target?.closest('.grid-item')) return
        if (event?.target?.closest('[slot]')) return
        if (event?.target?.closest('.btn-more')) return
        if (event?.target?.closest('.box-menu')) return

        // 删除所有选中
        this.layoutData.forEach(item => {
            delete item.selected
        })
        // this.styleMapEditing = false
        // 关闭编辑下拉框
        this.closeGridItemSubMenu()
        // 重新渲染
        this.reRender()
    }

    /**
     * 获取GridItem的TOP y坐标 检查上方有没有空间,如果有往上挪动一点
     * @param dataList
     * @param grid
     * @param exceptIds
     * @returns
     */
    getGridItemTopY(dataList: GridItemData[], grid: ItemData, exceptIds: any[]) {
        const { x, h, w } = grid
        let { y } = grid
        let item: any = this.findBigestOverlapItem(
            dataList,
            x,
            y - this.gridMargin,
            w,
            h,
            exceptIds
        )
        while (!item) {
            // 一个网格一个网格的找
            y = y - this.gridMargin
            if (y <= this.gridMargin) {
                // 当间距已经最小了的时候 停止查找,当前项目停在这个位置
                y = this.gridMargin
                return { x, y }
            }
            // 每次往上挪一点  如果没有重叠的就继续找,找到有重叠的为止 (y - this.gridMargin)这个位置有重叠就返回y
            item = this.findBigestOverlapItem(dataList, x, y - this.gridMargin, w, h, exceptIds)
        }
        return { x, y }
    }
    /**
     * 无用代码,暂时保留
     * 计算两项交叉面积
     * @param data1
     * @param data2
     * @returns
     */
    calcOverArea(data1: ItemData, data2: ItemData) {
        const overX1 = Math.max(data1.x, data2.x)
        const overX2 = Math.min(data1.x + data1.w, data2.x + data2.w)
        const overW = overX2 - overX1
        const overY1 = Math.max(data1.y, data2.y)
        const overY2 = Math.min(data1.y + data1.h, data2.y + data1.h)
        const overH = overY2 - overY1
        const overArea = overH * overW
        return overArea
    }

    /**
     * 排序上面有空白的地方
     * @param list
     */
    sortTopSpace(list: GridItemData[]) {
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

        // 将当前拖动的item和 浮动的item 排除
        let dataList = list.filter(item => item.id !== this.curActiveGridItem?.id && !item.float)
        dataList = dataList.sort((a: GridItemData, b: GridItemData) => {
            if (a.y < b.y) {
                return -1
            } else if (a.y == b.y) {
                //拖拽Grid优先排最前面
                if (a.id === DRAG_ID) return -1
                if (b.id === DRAG_ID) return 1
                if (a.x < b.x) return -1
                return 1
            } else {
                return 1
            }
        })
        for (let i = 0; i < dataList.length; i++) {
            const item = dataList[i]
            // 拿到上方空白处的y网格数
            const { y } = this.getGridItemTopY(list, item, [this.curActiveGridItem?.id, item.id])
            // 如果y比当前item的y小 name 就将 y 赋值给 item.y 将 当前item上移
            if (y < item.y) {
                item.y = y
                // 然后递归计算
                this.sortTopSpace(list)
                return
            }
        }
    }
    /**
     * 排序底部重叠的地方
     * @param list
     */
    sortBottomOver(list: GridItemData[]) {
        let dataList = list.filter(item => item.id !== this.curActiveGridItem?.id)
        dataList = dataList.sort((a: GridItemData, b: GridItemData) => {
            if (a.y < b.y) {
                return -1
            } else if (a.y == b.y) {
                //拖拽Grid优先排最前面
                if (a.id === DRAG_ID) return -1
                if (b.id === DRAG_ID) return 1
                if (a.x < b.x) return -1
                return 1
            } else {
                return 1
            }
        })

        // 遍历每个item
        for (const item of dataList) {
            // 浮动跳过
            if (item.float) {
                continue
            }
            // 当前移动的项目跳过
            if (this.curMovingGridItemData?.id === item.id) {
                continue
            }
            this.pressDownOver(list, item)
        }
    }
    /**
     * 往下压
     * @param list
     * @param item
     * 将每个item 与 其他的item 一个个比较 有无重叠的部分
     */
    pressDownOver(list: GridItemData[], item: GridItemData) {
        const { id, x, y, w, h } = item
        // 与item 重叠的 gridItemList
        const newList = this.findOverlapItem(list, x, y, w, h, [
            id,
            // this.dragData?.id,
            this.curActiveGridItem?.id
        ])

        // 如果有重叠
        if (newList.length) {
            for (let i = 0; i < newList.length; i++) {
                // 将重叠项目往下压
                newList[i].y = y + h + this.gridMargin
                // 递归 直到所有都没有重叠为止
                this.pressDownOver(list, newList[i])
            }
        }
    }

    /**
     * 重新排序 将网格重新组合排列
     */
    rearrangement() {
        let list = [...this.layoutData]
        if (this.curActiveGridItem) {
            list = [...list, this.dragData]
        }
        this.sortBottomOver(list)
        this.sortTopSpace(list)

        this.layoutData = list
            .filter(item => {
                if (item.id === DRAG_ID) {
                    this.dragData = item
                    return false
                }
                return true
            })
            .map(item => {
                if (item.id === this.curActiveGridItem?.id) {
                    return this.curActiveGridItem
                }
                return item
            })
        this.reRender()
    }
    /**
     * 浮动 向上一级
     * @returns
     */
    setZindexUp() {
        // 首先关闭菜单
        this.closeGridItemSubMenu()
        if (!this.curSelectGridItem?.float) {
            // 如果当前选中的item 不是浮动, 那么重新渲染
            this.reRender()
            return
        }
        // 找出浮动的item 列表
        let floatGridItems = this.layoutData.filter(item => item.float)
        // 将浮动的item 列表排序
        floatGridItems = floatGridItems.sort((a: any, b: any) => a.z - b.z)
        // 将排序后的浮动的item 的 zIndex 重新赋值
        floatGridItems.forEach((item, i) => {
            item.z = i
        })
        //找到当前选中的那个item 的 index
        const index = floatGridItems.findIndex(item => item.id === this.curSelectGridItem?.id)
        // 如果他是最后一个 即 浮动层级最高的那个 那么不用处理直接渲染
        if (index >= floatGridItems.length - 1) {
            this.reRender()
            return
        }
        // 删除 当前选中的item
        const item = floatGridItems.splice(index, 1)
        // 将当前的item 插入到 下一个位置
        floatGridItems.splice(index + 1, 0, item[0])
        // 重新分配zIndex
        floatGridItems.forEach((item, i) => {
            item.z = i
        })
        // 重新渲染
        this.reRender()
    }

    /**
     * 浮动 向下一级
     * @returns
     */
    setZindexDown() {
        // 关闭菜单
        this.closeGridItemSubMenu()
        if (!this.curSelectGridItem?.float) {
            // 如果当前选中的item 不是浮动, 那么重新渲染
            this.reRender()
            return
        }
        let floatGridItems = this.layoutData.filter(item => item.float)
        // 浮动排序
        floatGridItems = floatGridItems.sort((a: any, b: any) => a.z - b.z)
        // 重新赋值
        floatGridItems.forEach((item, i) => {
            item.z = i
        })
        // 查找当前选中的item 的 index
        const index = floatGridItems.findIndex(item => item.id === this.curSelectGridItem?.id)
        // 如果是第一个的话 不做处理 已经是最底层了
        if (index === 0) {
            this.reRender()
            return
        }
        // 取出当前选中的item
        const item = floatGridItems.splice(index, 1)
        // 插入到前一个位置
        floatGridItems.splice(index - 1, 0, item[0])
        // 重新分配zIndex
        floatGridItems.forEach((item, i) => {
            item.z = i
        })
        // 关闭菜单 重新渲染
        this.closeGridItemSubMenu()
        this.reRender()
    }

    /**
     *  无用代码,暂时保留
     * @returns
     */
    getLayoutDefaultGridItemStyle(): any {
        const style: string[] = ['.grid-layout > .grid-item {']
        if (this.layoutDefaultGridStyle.borderRadius) {
            style.push(` border-radius: ${this.layoutDefaultGridStyle.borderRadius}px;`)
        }
        if (this.layoutDefaultGridStyle.borderStyle) {
            style.push(`border-style: ${this.layoutDefaultGridStyle.borderStyle};`)
            style.push(`border-color: ${this.layoutDefaultGridStyle.borderColor || 'transparent'};`)
            style.push(`border-width: ${this.layoutDefaultGridStyle.borderWidth}px;`)
        }

        if (this.layoutDefaultGridStyle.contentColor)
            style.push(`background-color: ${this.layoutDefaultGridStyle.contentColor};`)
        style.push('}')
        return html`<style>
            ${style.join('')}
        </style>`
    }

    /**
     * 打开样式配置
     * @returns
     */
    openSetStyleBySubMenu() {
        if (!this.curGridItemSubMenuGridData) return
        const emit: any = new Event('openSetActiveStyle')
        emit.detail = this.curGridItemSubMenuGridData
        this.closeGridItemSubMenu()
        this.reRender()
        this.dispatchEvent(emit)
    }
    /**
     * 弹出右上角的菜单
     * @returns
     */
    openConfigSetBySubMenu() {
        if (!this.curGridItemSubMenuGridData) return
        const emit: any = new Event('openConfigSet')
        emit.detail = this.curGridItemSubMenuGridData
        this.closeGridItemSubMenu()
        this.reRender()
        this.dispatchEvent(emit)
    }

    /**
     * 当前活动的GridItem
     *
     */
    get curActiveGridItem() {
        return this.curMovingGridItemData || this.curResizingGridItemData || null
    }
    /**
     * 当前活动的GridItem style
     */
    get curActiveGridItemStyle() {
        return this.curActiveGridItem?.style
    }
    get curSelectGridItem(): GridItemData | undefined {
        return this.layoutData.find(item => item.selected)
    }
    /**
     * 选中的UserStyle;
     */
    get curGridItemSubMenuGridDataActiveStyle(): ActiveGridItemStyleType | undefined {
        if (!this.curGridItemSubMenuGridData) return
        if (!this.curGridItemSubMenuGridData.activeStyle) {
            const astye: ActiveGridItemStyleType = {
                titleStyleVisible: false,
                borderStyle: '',
                borderWidth: 0,
                borderColor: '',
                borderRadius: 0,
                titleColor: '',
                contentColor: '',
                // enbled: true,
                isFloat: this.curGridItemSubMenuGridData.float || false
            }
            this.curGridItemSubMenuGridData.activeStyle = astye
        }
        return this.curGridItemSubMenuGridData.activeStyle
    }
    /**
     * 计算的舞台虚拟高度 网格数
     */
    get calcStageVirtualHeight(): number {
        let list = [...this.layoutData]
        if (this.dragData) {
            list = [this.dragData, ...list]
        }
        let h: number = 0
        list.forEach(item => {
            h = h < item.y + item.h ? item.y + item.h : h
        })
        h = h + this.gridMargin
        return h
    }
    /**
     * 计算的舞台实际高度
     */
    get calcStageActualHeight(): number {
        return this.calcStageVirtualHeight * this.griddingHeight
    }
    /**
     * 无用代码
     * 关闭
     */
    dialogClose() {
        this.showDialogGridStyle = false
        this.closeGridItemSubMenu()
        this.reRender()
    }
    /**
     * resize事件
     */
    boxResizeTime: any = 0
    boxResize() {
        if (this.boxResizeTime) clearTimeout(this.boxResizeTime)
        this.boxResizeTime = setTimeout(() => {
            this.stageWidth = this.getBoundingClientRect().width
            this.reRender()

            this.dispatchGridItemResizeEvent(null)
        }, 300)
    }
    /**
     * 绑定事件
     */
    bindHnd: {[s: string]: any} = {}
    bind(obj: any, type: string) {
        obj.bindHnd[type] = () => {
            const fun : Function = obj[type]
            fun()
        }
        return obj.bindHnd[type]
    }
    /**
     * 无用代码
     * @param e
     */
    WcVueGridStyleChange(e: any) {
        const { detail }: { detail: any[] } = e
        const style: { gridStyle: any; globalGridStyle: any } = detail[0]
        if (this.curGridItemSubMenuGridData) {
            this.curGridItemSubMenuGridData.activeStyle = { ...style.gridStyle }
        }
        this.layoutDefaultGridStyle = { ...style.globalGridStyle }
    }
    /**
     * 生命周期--初始化
     */
    connectedCallback() {
        // 固定写法 调用父类的生命周期
        super.connectedCallback()
        // 默认样式初始化
        this.layoutDefaultGridStyle.borderRadius =
            this.layoutDefaultGridStyle.borderRadius !== undefined
                ? this.layoutDefaultGridStyle.borderRadius
                : 3
        this.layoutDefaultGridStyle.borderColor =
            this.layoutDefaultGridStyle.borderColor !== undefined
                ? this.layoutDefaultGridStyle.borderColor
                : '#c3c3c3'
        this.layoutDefaultGridStyle.borderWidth =
            this.layoutDefaultGridStyle.borderWidth !== undefined
                ? this.layoutDefaultGridStyle.borderWidth
                : 1
        this.layoutDefaultGridStyle.borderStyle =
            this.layoutDefaultGridStyle.borderStyle !== undefined
                ? this.layoutDefaultGridStyle.borderStyle
                : 'solid'
        this.layoutDefaultGridStyle.titleColor =
            this.layoutDefaultGridStyle.titleColor !== undefined
                ? this.layoutDefaultGridStyle.titleColor
                : '#fff'
        this.layoutDefaultGridStyle.contentColor =
            this.layoutDefaultGridStyle.contentColor !== undefined
                ? this.layoutDefaultGridStyle.contentColor
                : '#fff'
        // getBoundingClientRect 原生方法 获取目标dom 的 宽高位置信息
        const curRect = this.getBoundingClientRect()
        // 设置宽高
        this.stageWidth = curRect.width
        this.stageHeight = curRect.height
        const layoutHeight = curRect.height
        // 每一行默认占四个拖拽项目,中间三个间隙 + 两头间隙 一共五个间隙
        // 所以此处((this.maxGridItemWidthCount - this.gridMargin) / 4 就是每一个网格加上间隙的网格树
        // 减去间隙 就是每个 拖拽项目 所占的网格数
        this.defaultGridItemWidth =
            Math.floor((this.maxGridItemWidthCount - this.gridMargin) / 4) - this.gridMargin
        // dom总高度/每个网格所占的像素值 获取整屏网格数
        this.maxGridItemHeightCount = Math.floor(layoutHeight / this.griddingHeight)
        // 用整屏网格数减去间隙 获取每个网格所占的像素值 (通上 宽度计算)
        // 得到每个默认拖拽项目的高度 所占的网格数
        this.defaultGridItemHeight =
            Math.floor((this.maxGridItemHeightCount - this.gridMargin) / 4) - this.gridMargin
        // 看是否禁止滚动条
        this.style.overflowY = this.isDisableScrollBars ? 'hidden' : 'auto'
        // 监听窗口大小变化
        window.addEventListener('resize', this.bind(this, 'boxResize'))
    }
    /**
     * 生命周期--销毁
     */
    disconnectedCallback() {
        window.removeEventListener('resize', this.bindHnd['boxResize'])
    }

    /**
     *  工具栏
     */
    onCLickTool(event: any) {
        const target = event.target
        // 获取dom 元素 的 位置信息
        const rect = target.getBoundingClientRect()
        const parentRect = this.shadowRoot?.firstElementChild?.getBoundingClientRect() || {
            left: 0,
            top: 0,
            width: this.stageWidth,
            height: this.calcStageActualHeight
        }
        // 设置弹出菜单的位置
        this.curGridItemSubMenuPos.x = rect.left - parentRect.left + rect.width + 3
        this.curGridItemSubMenuPos.y = rect.top - parentRect.top + rect.height + 3
        // 显示菜单
        this.curGridItemSubMenuShow = true
        this.curGridItemSubMenuGridData = this.getGridItem(event.currentTarget)
        // 移除其它的选中效果
        this.layoutData.forEach(item => {
            delete item.selected
        })
        // 当前弹出菜单 的item 选中的效果
        this.curGridItemSubMenuGridData.selected = true
        this.reRender()
    }
    /**
     * 获取title
     */
    getItemTitle(itemId: string) {
        const item: any = this.headerConfigList.find((itemConfig: any) => itemConfig.id === itemId)
        const panelOptions = item?.PanelOptions

        return panelOptions?.title || ''
    }
    /**
     * 渲染方法
     * @returns
     */
    render() {
        const curRect = this.getBoundingClientRect()
        // 预留有滚动条的宽度
        this.stageWidth = curRect.width - 10
        this.stageHeight = curRect.height
        // 展示页面
        return html`<div class="grid-layout" @click="${this.onGridLayoutClick}">
                <!-- 如果有滚动条,那么需要加上虚拟高度把页面撑开 -->
                <div class="grid-sitting" style="height:${this.calcStageActualHeight}px;"></div>
                ${this.edit
                    ? html`
                          <!-- 测试 开发 的工具栏 -->
                          <div class="toolbar" hide="${this.hideToolbar}">
                              <i class="el-icon add" @click="${this.addGridItem}">
                                  <!--[-->
                                  <svg viewBox="0 0 1024 1024" xmlns="http://www.w3.org/2000/svg">
                                      <path
                                          fill="currentColor"
                                          d="M480 480V128a32 32 0 0 1 64 0v352h352a32 32 0 1 1 0 64H544v352a32 32 0 1 1-64 0V544H128a32 32 0 0 1 0-64h352z"
                                      ></path>
                                  </svg>
                                  <!--]-->
                              </i>
                              <i class="el-icon back" @click="${this.backLayout}">
                                  <!--[-->
                                  <svg
                                      xmlns="http://www.w3.org/2000/svg"
                                      width="16"
                                      height="16"
                                      fill="currentColor"
                                      class="bi bi-reply"
                                      viewBox="0 0 16 16"
                                  >
                                      <path
                                          d="M6.598 5.013a.144.144 0 0 1 .202.134V6.3a.5.5 0 0 0 .5.5c.667 0 2.013.005 3.3.822.984.624 1.99 1.76 2.595 3.876-1.02-.983-2.185-1.516-3.205-1.799a8.74 8.74 0 0 0-1.921-.306 7.404 7.404 0 0 0-.798.008h-.013l-.005.001h-.001L7.3 9.9l-.05-.498a.5.5 0 0 0-.45.498v1.153c0 .108-.11.176-.202.134L2.614 8.254a.503.503 0 0 0-.042-.028.147.147 0 0 1 0-.252.499.499 0 0 0 .042-.028l3.984-2.933zM7.8 10.386c.068 0 .143.003.223.006.434.02 1.034.086 1.7.271 1.326.368 2.896 1.202 3.94 3.08a.5.5 0 0 0 .933-.305c-.464-3.71-1.886-5.662-3.46-6.66-1.245-.79-2.527-.942-3.336-.971v-.66a1.144 1.144 0 0 0-1.767-.96l-3.994 2.94a1.147 1.147 0 0 0 0 1.946l3.994 2.94a1.144 1.144 0 0 0 1.767-.96v-.667z"
                                      />
                                  </svg>
                                  <!--]-->
                              </i>
                              <i class="el-icon forward" @click="${this.forwardLayout}">
                                  <!--[-->
                                  <svg
                                      xmlns="http://www.w3.org/2000/svg"
                                      width="16"
                                      height="16"
                                      fill="currentColor"
                                      class="bi bi-reply"
                                      viewBox="0 0 16 16"
                                  >
                                      <path
                                          d="M6.598 5.013a.144.144 0 0 1 .202.134V6.3a.5.5 0 0 0 .5.5c.667 0 2.013.005 3.3.822.984.624 1.99 1.76 2.595 3.876-1.02-.983-2.185-1.516-3.205-1.799a8.74 8.74 0 0 0-1.921-.306 7.404 7.404 0 0 0-.798.008h-.013l-.005.001h-.001L7.3 9.9l-.05-.498a.5.5 0 0 0-.45.498v1.153c0 .108-.11.176-.202.134L2.614 8.254a.503.503 0 0 0-.042-.028.147.147 0 0 1 0-.252.499.499 0 0 0 .042-.028l3.984-2.933zM7.8 10.386c.068 0 .143.003.223.006.434.02 1.034.086 1.7.271 1.326.368 2.896 1.202 3.94 3.08a.5.5 0 0 0 .933-.305c-.464-3.71-1.886-5.662-3.46-6.66-1.245-.79-2.527-.942-3.336-.971v-.66a1.144 1.144 0 0 0-1.767-.96l-3.994 2.94a1.147 1.147 0 0 0 0 1.946l3.994 2.94a1.144 1.144 0 0 0 1.767-.96v-.667z"
                                      />
                                  </svg>
                                  <!--]-->
                              </i>
                              <i class="el-icon save" @click="${this.save}">
                                  <!--[-->
                                  <svg
                                      xmlns="http://www.w3.org/2000/svg"
                                      width="16"
                                      height="16"
                                      fill="currentColor"
                                      class="bi bi-download"
                                      viewBox="0 0 16 16"
                                  >
                                      <path
                                          d="M.5 9.9a.5.5 0 0 1 .5.5v2.5a1 1 0 0 0 1 1h12a1 1 0 0 0 1-1v-2.5a.5.5 0 0 1 1 0v2.5a2 2 0 0 1-2 2H2a2 2 0 0 1-2-2v-2.5a.5.5 0 0 1 .5-.5z"
                                      />
                                      <path
                                          d="M7.646 11.854a.5.5 0 0 0 .708 0l3-3a.5.5 0 0 0-.708-.708L8.5 10.293V1.5a.5.5 0 0 0-1 0v8.793L5.354 8.146a.5.5 0 1 0-.708.708l3 3z"
                                      />
                                  </svg>
                                  <!--]-->
                              </i>
                              <i class="el-icon close" @click="${this.close}">
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
                          ${this.showGridItemMenu()}
                      `
                    : ''}
                <!-- 拖拽项目渲染 -->
                ${this.layoutData.map((item, i) => {
                    return html`
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
                                            ${item.activeStyle?.titleStyleVisible
                                                ? this.getItemTitle(item.id)
                                                : ''}
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
                                <slot name="${item.slot || ''}"></slot>
                            </div>
                            <!-- 编辑状态不让点击里面的元素 -->
                            <!-- ${this.edit ? html`<div class="move-bg"></div>` : ''} -->
                            <!-- 渲染右上角工具菜单 -->
                            ${this.renderToobar()}
                        </div>
                    `
                })}
                <!-- 拖拽中 -->
                ${this.draggIng ? this.drawDragDataHtml() : ''}
            </div>
            <!-- 无用代码,暂时保留 -->
            ${this.showDialog()} ${this.getLayoutDefaultGridItemStyle()} `
    }
    // 工具栏 (三个点 和 右下角的 resize图标)
    renderToobar() {
        if (!this.edit) return ''
        return html`<div
            class="resize bottom-right"
            @mousedown="${this.gridItemResizeStart}"
        ></div>`
    }
    // 编辑菜单漂浮窗
    showGridItemMenu() {
        return html`
            <div
                class="box-menu ${this.curGridItemSubMenuShow ? 'show' : ''}"
                style="left:${this.curGridItemSubMenuPos.x}px;top:${this.curGridItemSubMenuPos.y}px"
            >
                <div class="menu-item" @click="${this.openConfigSetBySubMenu}">
                    <i class="el-icon">
                        <!--[-->
                        <svg
                            width="12px"
                            height="12px"
                            viewBox="0 0 12 12"
                            version="1.1"
                            xmlns="http://www.w3.org/2000/svg"
                            xmlns:xlink="http://www.w3.org/1999/xlink"
                        >
                            <g stroke="none" stroke-width="1" fill="none" fill-rule="evenodd">
                                <g
                                    transform="translate(-170.000000, -595.000000)"
                                    fill="#1B1D1F"
                                    fill-rule="nonzero"
                                >
                                    <g transform="translate(170.000000, 595.000000)">
                                        <path
                                            d="M4.62175,0 C4.9303878,0.00034235522 5.18534609,0.241039453 5.20343368,0.549146979 C5.22152128,0.857254505 4.99647771,1.12613034 4.69,1.16258334 L4.62175,1.16666667 L2.19916667,1.16666667 C1.66216943,1.16696043 1.21504462,1.57883263 1.17075,2.114 L1.16666667,2.19916667 L1.16666667,9.46866667 C1.16666667,10.01 1.58375001,10.4545 2.114,10.4970833 L2.19916667,10.5 L9.46866667,10.5 C10.0056639,10.4997062 10.4527887,10.087834 10.4970833,9.55266667 L10.5,9.46749999 L10.5,7.04433333 C10.5003423,6.73569553 10.7410394,6.48073724 11.049147,6.46264964 C11.3572545,6.44456205 11.6261303,6.66960562 11.6625833,6.97608333 L11.6666667,7.04433333 L11.6666667,9.46749999 C11.6663707,10.6376437 10.7498274,11.602642 9.58124999,11.6631667 L9.46749999,11.6666667 L2.19858334,11.6666667 C1.02843962,11.6663707 0.0634413082,10.7498274 0.00291667578,9.58124999 L0,9.46749999 L0,2.19858334 C0.000295958352,1.02843962 0.916839257,0.0634413082 2.08541667,0.00291667578 L2.19916667,0 L4.62233333,0 L4.62175,0 Z"
                                        ></path>
                                        <path
                                            d="M8.51814481,0.545955306 C9.21967708,-0.163078359 10.3583737,-0.184182376 11.0856979,0.498369596 C11.8130221,1.18092157 11.8641856,2.31864079 11.2010622,3.06371893 L11.1208695,3.14862712 L6.10882607,8.16056875 C6.01710374,8.25221108 5.89773212,8.31106673 5.76918642,8.32802657 L5.69194199,8.33333333 L3.9229855,8.33333333 C3.6240467,8.33333333 3.37243674,8.10956068 3.33746091,7.81268104 L3.33333333,7.74369314 L3.33333333,5.97477256 C3.33333333,5.84517058 3.37601274,5.71917529 3.45480169,5.61627133 L3.50610143,5.5573073 L8.51814481,0.545365661 L8.51814481,0.545955306 Z M10.2871013,1.37970654 C10.0498877,1.14274823 9.67291118,1.12070771 9.40969888,1.32840785 L9.35191297,1.37970654 L4.51263767,6.2188836 L4.51263767,7.15346331 L5.44723634,7.15346331 L10.2871013,2.31487588 C10.5240644,2.0776671 10.5461054,1.70069824 10.338401,1.43749128 L10.2871013,1.37970654 L10.2871013,1.37970654 Z"
                                        ></path>
                                        <path
                                            d="M7.67084394,1.42088116 C7.87873033,1.21302737 8.20879075,1.19227487 8.44107764,1.37245285 L8.49592762,1.42088116 L10.2464588,3.17130224 C10.4636475,3.38921586 10.4743082,3.73831475 10.270821,3.96907329 C10.0673337,4.19983184 9.71962425,4.23295283 9.47622507,4.04476236 L9.42137509,3.99633405 L7.67084394,2.24591297 C7.44305202,2.01806657 7.44305202,1.64872755 7.67084394,1.42088116 L7.67084394,1.42088116 Z"
                                        ></path>
                                    </g>
                                </g>
                            </g>
                        </svg>
                        <!--]-->
                    </i>
                    <span class="el-label">${this.i18n.t('edit', true)}</span>
                </div>
                <div class="menu-item" @click="${this.openSetStyleBySubMenu}">
                    <i class="el-icon">
                        <!--[-->
                        <svg
                            width="12px"
                            height="12px"
                            viewBox="0 0 12 12"
                            version="1.1"
                            xmlns="http://www.w3.org/2000/svg"
                            xmlns:xlink="http://www.w3.org/1999/xlink"
                        >
                            <title>样式配置</title>
                            <desc>样式配置</desc>
                            <g stroke="none" stroke-width="1" fill="none" fill-rule="evenodd">
                                <g transform="translate(-170.000000, -630.000000)" stroke="#1B1D1F">
                                    <g transform="translate(170.000000, 630.000000)">
                                        <path
                                            d="M6.44738084,2.76639924 L5.52713544,2.76639924 L5.52713544,1.84615385 L6.44738084,1.84615385 L6.44738084,2.76639924 Z M6.44738084,3.68664464 L5.52713544,3.68664464 L5.52713544,4.60689004 L6.44738084,4.60689004 L6.44738084,3.68664464 Z M6.44738084,5.52713544 L5.52713544,5.52713544 L5.52713544,6.44738084 L6.44738084,6.44738084 L6.44738084,5.52713544 Z M6.44738084,7.36762624 L5.52713544,7.36762624 L5.52713544,8.28787164 L6.44738084,8.28787164 L6.44738084,7.36762624 Z M6.44738084,9.20811704 L5.52713544,9.20811704 L5.52713544,10.1283624 L6.44738084,10.1283624 L6.44738084,9.20811704 Z M2.76639924,5.52713544 L1.84615385,5.52713544 L1.84615385,6.44738084 L2.76639924,6.44738084 L2.76639924,5.52713544 Z M4.60689004,5.52713544 L3.68664464,5.52713544 L3.68664464,6.44738084 L4.60689004,6.44738084 L4.60689004,5.52713544 Z M8.28787164,5.52713544 L7.36762624,5.52713544 L7.36762624,6.44738084 L8.28787164,6.44738084 L8.28787164,5.52713544 Z M10.1283624,5.52713544 L9.20811704,5.52713544 L9.20811704,6.44738084 L10.1283624,6.44738084 L10.1283624,5.52713544 Z"
                                            stroke-width="0.2"
                                            fill="#1B1D1F"
                                            fill-rule="nonzero"
                                        ></path>
                                        <rect
                                            stroke-width="1.1"
                                            x="0.55"
                                            y="0.55"
                                            width="10.9"
                                            height="10.9"
                                            rx="2.76923077"
                                        ></rect>
                                    </g>
                                </g>
                            </g>
                        </svg>
                        <!--]-->
                    </i>
                    <span class="el-label">${this.i18n.t('styleConfiguration', true)}</span>
                </div>
                <div class="menu-item" @click="${this.gridItemCloseBySubMenu}">
                    <i class="el-icon close grid-item-close" style="font-size:20px;">
                        <!--[-->
                        <svg
                            width="12px"
                            height="13px"
                            viewBox="0 0 12 13"
                            version="1.1"
                            xmlns="http://www.w3.org/2000/svg"
                            xmlns:xlink="http://www.w3.org/1999/xlink"
                        >
                            <title>删除</title>
                            <g stroke="none" stroke-width="1" fill="none" fill-rule="evenodd">
                                <g
                                    transform="translate(-170.000000, -665.000000)"
                                    fill-rule="nonzero"
                                >
                                    <g id="删除-01" transform="translate(170.000000, 665.000000)">
                                        <path
                                            d="M10.9125,2.03625 L8.86265625,2.03625 L8.86265625,1.38328125 L8.86109375,1.31953125 C8.82703125,0.615625 8.24640625,0.06234375 7.5415625,0.06234375 L3.95828125,0.06234375 L3.89453125,0.06390625 C3.190625,0.09796875 2.63734375,0.67859375 2.63734375,1.3834375 L2.63734375,2.03640625 L0.5875,2.03640625 L0.54375,2.03828125 C0.26828125,2.06109375 0.05640625,2.29125 0.056249923,2.56765625 C0.05609375,2.86109375 0.29390625,3.09921875 0.5875,3.099375 L10.9125,3.099375 L10.95625,3.0975 C11.2317187,3.0746875 11.4435937,2.84453125 11.4437501,2.568125 C11.4439062,2.274375 11.2060937,2.03640625 10.9125,2.03625 Z M7.79984375,2.03625 L3.70015625,2.03625 L3.70015625,1.38328125 L3.70234375,1.35078125 C3.71875,1.221875 3.8284375,1.12515625 3.95828125,1.12515625 L7.54171875,1.12515625 L7.57421875,1.12734375 C7.703125,1.14375 7.79984375,1.2534375 7.79984375,1.38328125 L7.79984375,2.03625 L7.79984375,2.03625 Z"
                                            fill="#1B1D1F"
                                        ></path>
                                        <path
                                            d="M0.5875,3.1521875 C0.26515625,3.15203125 0.003125,2.8896875 0.003125,2.56734375 C0.00328125,2.26578125 0.23875,2.01 0.539375,1.985 L0.5853125,1.983125 L2.58421875,1.983125 L2.58421875,1.38328125 C2.58421875,0.6490625 3.15859375,0.04625 3.89203125,0.01078125 L3.95703125,0.00921875 L7.54171875,0.00921875 C8.2759375,0.00921875 8.87875,0.58359375 8.91421875,1.31703125 L8.91578125,1.38203125 L8.91578125,1.983125 L10.9125,1.983125 C11.2348437,1.98328125 11.496875,2.245625 11.4967188,2.56796875 C11.4965625,2.86953125 11.2610937,3.1253125 10.960625,3.15015625 L10.9146875,3.1521875 L0.5875,3.1521875 L0.5875,3.1521875 Z M0.5875,2.089375 L0.5459375,2.09109375 C0.3021875,2.11140625 0.10953125,2.320625 0.109374915,2.5675 C0.10921875,2.83125 0.32375,3.0459375 0.5875,3.04609375 L10.9125,3.04609375 L10.9540625,3.044375 C11.1978125,3.0240625 11.3904687,2.81484375 11.3906251,2.56796875 C11.3907812,2.30421875 11.17625,2.08953125 10.9125,2.089375 L8.8096875,2.089375 L8.8096875,1.38328125 L8.808125,1.32078125 C8.77546875,0.64546875 8.21921875,0.1153125 7.54171875,0.1153125 L3.95828125,0.1153125 L3.89578125,0.116875 C3.22046875,0.14953125 2.6903125,0.70578125 2.6903125,1.38328125 L2.6903125,2.089375 L0.5875,2.089375 Z M7.85296875,2.089375 L3.64703125,2.089375 L3.6471875,1.37984375 L3.6496875,1.3440625 C3.669375,1.1890625 3.80203125,1.07203125 3.95828125,1.07203125 L7.54515625,1.0721875 L7.5809375,1.0746875 C7.7359375,1.094375 7.85296875,1.22703125 7.85296875,1.38328125 L7.85296875,2.089375 Z M3.75328125,1.983125 L7.74671875,1.983125 L7.74671875,1.38328125 C7.74671875,1.28078125 7.6703125,1.19375 7.5690625,1.18015625 L7.54,1.17828125 L3.95828125,1.17828125 C3.85578125,1.17828125 3.76875,1.25453125 3.75515625,1.3559375 L3.75328125,1.385 L3.75328125,1.983125 L3.75328125,1.983125 Z M10.0015625,3.98171875 C10.278125,3.98171875 10.5084375,4.18421875 10.53125,4.4471875 L10.533125,4.48890625 L10.533125,10.2853125 C10.533125,11.4979688 9.524375,12.4917188 8.254375,12.5303125 L8.1796875,12.5314063 L3.320625,12.5314063 C2.04984375,12.5314063 1.00859375,11.56875 0.96828125,10.3565625 L0.96703125,10.2853125 L0.96703125,4.48890625 C0.9671875,4.20875 1.20515625,3.981875 1.49875,3.981875 C1.77515625,3.98203125 2.0053125,4.18421875 2.028125,4.44703125 L2.03,4.48875 L2.03,10.2851563 C2.03,10.9421875 2.57046875,11.4835938 3.258125,11.5154688 L3.320625,11.516875 L8.17953125,11.516875 C8.86796875,11.516875 9.4353125,11.0010938 9.46859375,10.3448438 L9.47015625,10.2851563 L9.47015625,4.48890625 C9.47,4.20890625 9.708125,3.98171875 10.0015625,3.98171875 Z"
                                            fill="#1B1D1F"
                                        ></path>
                                        <path
                                            d="M3.320625,12.5845312 C2.69265625,12.5845312 2.09828125,12.3546875 1.64703125,11.9375 C1.19515625,11.5196875 0.9353125,10.9589063 0.9153125,10.3582813 L0.9140625,10.2860938 L0.9140625,4.48875 C0.91421875,4.17984375 1.17640625,3.92875 1.49859375,3.92875 L1.49890625,3.92875 C1.8003125,3.92890625 2.05609375,4.15453125 2.08109375,4.4425 L2.083125,4.4865625 L2.083125,10.2853125 C2.083125,10.9148437 2.6003125,11.4320312 3.260625,11.4625 L3.32203125,11.4639063 L8.1796875,11.4639063 C8.84078125,11.4639063 9.38375,10.97125 9.41578125,10.3423438 L9.4171875,10.2839063 L9.4171875,4.48875 C9.4171875,4.17984375 9.679375,3.9284375 10.0017188,3.9284375 C10.3034375,3.9284375 10.5592187,4.15421875 10.5842187,4.4425 L10.58625,4.4865625 L10.58625,10.2853125 C10.58625,10.88625 10.3451563,11.4546875 9.90734375,11.8859375 C9.47015625,12.3167188 8.88375,12.564375 8.25609375,12.5832813 L8.180625,12.584375 L3.320625,12.584375 L3.320625,12.5845312 Z M1.4984375,4.035 C1.2346875,4.035 1.02015625,4.23859375 1.02015625,4.48890625 L1.02015625,10.2853125 L1.02140625,10.3557812 C1.0609375,11.545625 2.0709375,12.4784375 3.320625,12.4784375 L8.17953125,12.4784375 L8.2534375,12.4773437 C9.5015625,12.4395312 10.48,11.4767187 10.48,10.2854687 L10.48,4.48890625 L10.4782813,4.44953125 C10.458125,4.21796875 10.24875,4.03484375 10.0017188,4.03484375 C9.73796875,4.03484375 9.5234375,4.23859375 9.5234375,4.48890625 L9.5234375,10.2853125 L9.521875,10.3464062 C9.48703125,11.0332812 8.8975,11.5701563 8.1796875,11.5701563 L3.320625,11.5701563 L3.256875,11.56875 C2.53859375,11.5354687 1.976875,10.971875 1.976875,10.2853125 L1.976875,4.48890625 L1.97515625,4.44953125 C1.955,4.21828125 1.745625,4.03515625 1.49875,4.03515625 C1.49859375,4.035 1.49859375,4.035 1.4984375,4.035 Z"
                                            fill="#1A1C41"
                                        ></path>
                                        <path
                                            d="M4.3834375,5.1409375 C4.66,5.1409375 4.8903125,5.3434375 4.913125,5.60640625 L4.915,5.648125 L4.915,9.1259375 C4.91484375,9.40609375 4.676875,9.63296875 4.38328125,9.63296875 C4.106875,9.6328125 3.87671875,9.430625 3.85390625,9.1678125 L3.85203125,9.12609375 L3.85203125,5.648125 C3.85203125,5.368125 4.09015625,5.1409375 4.3834375,5.1409375 L4.3834375,5.1409375 Z"
                                            fill="#1B1D1F"
                                        ></path>
                                        <path
                                            d="M4.3834375,9.68609375 L4.383125,9.68609375 C4.08171875,9.6859375 3.8259375,9.4603125 3.8009375,9.17234375 L3.79890625,9.12828125 L3.79890625,5.648125 C3.79890625,5.33921875 4.06109375,5.0878125 4.3834375,5.0878125 C4.68515625,5.0878125 4.94109375,5.31359375 4.9659375,5.601875 L4.96796875,5.6459375 L4.96796875,9.12609375 C4.9678125,9.43484375 4.705625,9.68609375 4.3834375,9.68609375 L4.3834375,9.68609375 Z M4.3834375,5.1940625 C4.1196875,5.1940625 3.90515625,5.3978125 3.90515625,5.648125 L3.90515625,9.1259375 L3.906875,9.1653125 C3.92703125,9.3965625 4.13640625,9.5796875 4.38328125,9.5796875 L4.3834375,9.5796875 C4.64703125,9.5796875 4.8615625,9.37609375 4.86171875,9.12578125 L4.86171875,5.648125 L4.86,5.60875 C4.84,5.3771875 4.63046875,5.1940625 4.3834375,5.1940625 Z"
                                            fill="#1A1C41"
                                        ></path>
                                        <path
                                            d="M7.1165625,5.1409375 C7.393125,5.1409375 7.6234375,5.3434375 7.64625,5.60640625 L7.648125,5.648125 L7.648125,9.1259375 C7.64796875,9.40609375 7.41,9.63296875 7.11640625,9.63296875 C6.84,9.6328125 6.60984375,9.430625 6.58703125,9.1678125 L6.58515625,9.12609375 L6.58515625,5.648125 C6.58515625,5.368125 6.82328125,5.1409375 7.1165625,5.1409375 Z"
                                            id="Path"
                                            fill="#1A1C41"
                                        ></path>
                                        <path
                                            d="M7.1165625,9.68609375 L7.11625,9.68609375 C6.81484375,9.6859375 6.5590625,9.4603125 6.5340625,9.17234375 L6.53203125,9.12828125 L6.53203125,5.648125 C6.53203125,5.33921875 6.79421875,5.0878125 7.1165625,5.0878125 C7.41828125,5.0878125 7.6740625,5.31359375 7.6990625,5.601875 L7.70109375,5.6459375 L7.70109375,9.12609375 C7.7009375,9.43484375 7.43875,9.68609375 7.1165625,9.68609375 Z M7.1165625,5.1940625 C6.8528125,5.1940625 6.63828125,5.3978125 6.63828125,5.648125 L6.63828125,9.1259375 L6.64,9.1653125 C6.66015625,9.3965625 6.86953125,9.5796875 7.11640625,9.5796875 L7.1165625,9.5796875 C7.38015625,9.5796875 7.59484375,9.37609375 7.59484375,9.12578125 L7.59484375,5.648125 L7.593125,5.60875 C7.57296875,5.3771875 7.36359375,5.1940625 7.1165625,5.1940625 Z"
                                            fill="#1B1D1F"
                                        ></path>
                                    </g>
                                </g>
                            </g>
                        </svg>
                        <!--]-->
                    </i>
                    <span class="el-label">${this.i18n.t('delete', true)}</span>
                </div>
                <div
                    class="menu-item"
                    @click="${this.setZindexUp}"
                    style="display:${this.curSelectGridItem?.float ? 'flex' : 'none'}"
                >
                    <i class="el-icon">
                        <!--[-->
                        <svg
                            width="13px"
                            height="13px"
                            viewBox="0 0 13 13"
                            version="1.1"
                            xmlns="http://www.w3.org/2000/svg"
                            xmlns:xlink="http://www.w3.org/1999/xlink"
                        >
                            <!-- Generator: Sketch 61.1 (89650) - https://sketch.com -->
                            <title>上一层</title>
                            <desc>上一层</desc>
                            <g stroke="none" stroke-width="1" fill="none" fill-rule="evenodd">
                                <g
                                    transform="translate(-170.000000, -699.000000)"
                                    fill="#1B1D1F"
                                    fill-rule="nonzero"
                                >
                                    <g
                                        transform="translate(176.500000, 705.500000) scale(-1, 1) translate(-176.500000, -705.500000) translate(170.000000, 699.000000)"
                                    >
                                        <path
                                            d="M12.1395399,3.87065972 C11.8207465,3.1188151 11.3665365,2.44314236 10.7853733,1.86338976 C10.2056207,1.28363715 9.52994792,0.828016493 8.7781033,0.50922309 C7.99945747,0.180555556 7.17285156,0.0126953125 6.31944444,0.0126953125 C5.46603733,0.0126953125 4.63943142,0.180555556 3.86078559,0.50922309 C3.10894097,0.828016493 2.43326823,1.28222656 1.85351563,1.86338976 C1.27376302,2.44314236 0.818142361,3.1188151 0.499348958,3.87065972 C0.169270833,4.64930556 0.00282118056,5.47732205 0.00282118056,6.32931858 C0.00282118056,7.1813151 0.169270833,8.0093316 0.499348958,8.78797743 C0.818142361,9.53982205 1.27235243,10.2154948 1.85351563,10.7952474 C2.43326823,11.375 3.10894097,11.8306207 3.86078559,12.1494141 C4.63943142,12.4794922 5.46744792,12.6459418 6.31944444,12.6459418 C7.17144097,12.6459418 7.99945747,12.4794922 8.7781033,12.1494141 C9.52994792,11.8306207 10.2056207,11.3764106 10.7853733,10.7952474 C11.3651259,10.2154948 11.8207465,9.53982205 12.1395399,8.78797743 C12.4696181,8.0093316 12.6360677,7.1813151 12.6360677,6.32931858 C12.6360677,5.47732205 12.4696181,4.64930556 12.1395399,3.87065972 L12.1395399,3.87065972 Z M6.31944444,11.5047743 C3.46582031,11.5047743 1.14398872,9.18294271 1.14398872,6.32931858 C1.14398872,3.47569444 3.46582031,1.15386285 6.31944444,1.15386285 C9.17306858,1.15386285 11.4949002,3.47569444 11.4949002,6.32931858 C11.4949002,9.18294271 9.17447917,11.5047743 6.31944444,11.5047743 Z"
                                        ></path>
                                        <path
                                            d="M6.77083333,3.37695313 C6.71299913,3.31065538 6.64388021,3.26128472 6.56770833,3.22743056 C6.56629774,3.22743056 6.56488715,3.22601997 6.56347656,3.22601997 L6.54231771,3.21755642 C6.53949653,3.21614583 6.53667535,3.21473524 6.53385417,3.21473524 C6.52821181,3.21191406 6.52256944,3.21050347 6.51692708,3.20909288 C6.51269531,3.20768229 6.50846354,3.2062717 6.50564236,3.20486111 C6.50141059,3.20345052 6.49576823,3.20203993 6.49153646,3.20062934 C6.48730469,3.19921875 6.48166233,3.19780816 6.47743056,3.19639757 C6.47319878,3.19498698 6.46896701,3.19357639 6.46473524,3.19357639 C6.45909288,3.1921658 6.45345052,3.19075521 6.44921875,3.18934462 C6.44498698,3.18793403 6.44075521,3.18793403 6.43793403,3.18652344 C6.43229167,3.18511285 6.42664931,3.18370226 6.42100694,3.18370226 C6.41677517,3.18370226 6.41395399,3.18229167 6.40972222,3.18229167 C6.40407986,3.18088108 6.3984375,3.18088108 6.39279514,3.17947049 C6.38856337,3.17947049 6.3843316,3.1780599 6.38151042,3.1780599 C6.37586806,3.1780599 6.37022569,3.17664931 6.36458333,3.17664931 C6.36035156,3.17664931 6.35611979,3.17664931 6.35188802,3.17523872 L6.29264323,3.17523872 C6.28841146,3.17523872 6.28417969,3.17523872 6.27994792,3.17664931 C6.27430556,3.17664931 6.26866319,3.1780599 6.26302083,3.1780599 C6.25878906,3.1780599 6.25455729,3.17947049 6.25173611,3.17947049 C6.24609375,3.17947049 6.24045139,3.18088108 6.23480903,3.18229167 C6.23057726,3.18229167 6.22775608,3.18370226 6.22352431,3.18370226 C6.21788194,3.18511285 6.21223958,3.18511285 6.20659722,3.18652344 C6.20236545,3.18793403 6.19813368,3.18793403 6.1953125,3.18934462 C6.18967014,3.19075521 6.18402778,3.1921658 6.17979601,3.19357639 C6.17556424,3.19498698 6.17133247,3.19498698 6.16710069,3.19639757 C6.16286892,3.19780816 6.15722656,3.19921875 6.15299479,3.20062934 C6.14876302,3.20203993 6.14312066,3.20345052 6.13888889,3.20486111 C6.13465712,3.2062717 6.13042535,3.20768229 6.12760417,3.20909288 C6.12196181,3.21050347 6.11631944,3.21332465 6.11067708,3.21473524 C6.1078559,3.21614583 6.10503472,3.21755642 6.10221354,3.21755642 L6.08105469,3.22601997 C6.0796441,3.22601997 6.07823351,3.22743056 6.07682292,3.22743056 C6.00206163,3.26128472 5.93153212,3.31065538 5.87369792,3.37695313 L4.1344401,5.34331597 C3.90874566,5.59157986 3.93272569,5.97526042 4.18098958,6.19390191 C4.42925347,6.41395399 4.81152344,6.38997396 5.03157552,6.14171007 L5.72558594,5.35601128 L5.72558594,8.3422309 C5.72558594,8.36056858 5.72699653,8.38031684 5.72840712,8.39865451 C5.72699653,8.41840278 5.72558594,8.43956163 5.72558594,8.46072049 L5.72558594,8.88812934 C5.72558594,9.21538628 5.99359809,9.48339844 6.32085503,9.48339844 C6.64811198,9.48339844 6.91612413,9.21538628 6.91612413,8.88812934 L6.91612413,8.46072049 C6.91612413,8.43815104 6.91471354,8.41699219 6.91189236,8.39442274 C6.91330295,8.37749566 6.91471354,8.36056858 6.91471354,8.3422309 L6.91471354,5.35742188 L7.60872396,6.14171007 C7.82877604,6.38997396 8.21104601,6.41395399 8.4593099,6.19390191 C8.70757378,5.97384983 8.73155382,5.59157986 8.51150174,5.34331597 L6.77083333,3.37695313 Z"
                                        ></path>
                                    </g>
                                </g>
                            </g>
                        </svg>
                        <!--]-->
                    </i>
                    <span class="el-label">${this.i18n.t('upperFloor', true)}</span>
                </div>
                <div
                    class="menu-item"
                    @click="${this.setZindexDown}"
                    style="display:${this.curSelectGridItem?.float ? 'flex' : 'none'}"
                >
                    <i class="el-icon">
                        <!--[-->
                        <svg
                            width="13px"
                            height="13px"
                            viewBox="0 0 13 13"
                            version="1.1"
                            xmlns="http://www.w3.org/2000/svg"
                            xmlns:xlink="http://www.w3.org/1999/xlink"
                        >
                            <title>下一层</title>
                            <desc>下一层</desc>
                            <g stroke="none" stroke-width="1" fill="none" fill-rule="evenodd">
                                <g
                                    transform="translate(-170.000000, -734.000000)"
                                    fill="#1B1D1F"
                                    fill-rule="nonzero"
                                >
                                    <g
                                        transform="translate(176.500000, 740.500000) scale(-1, -1) translate(-176.500000, -740.500000) translate(170.000000, 734.000000)"
                                    >
                                        <path
                                            d="M12.1395399,3.87065972 C11.8207465,3.1188151 11.3665365,2.44314236 10.7853733,1.86338976 C10.2056207,1.28363715 9.52994792,0.828016493 8.7781033,0.50922309 C7.99945747,0.180555556 7.17285156,0.0126953125 6.31944444,0.0126953125 C5.46603733,0.0126953125 4.63943142,0.180555556 3.86078559,0.50922309 C3.10894097,0.828016493 2.43326823,1.28222656 1.85351563,1.86338976 C1.27376302,2.44314236 0.818142361,3.1188151 0.499348958,3.87065972 C0.169270833,4.64930556 0.00282118056,5.47732205 0.00282118056,6.32931858 C0.00282118056,7.1813151 0.169270833,8.0093316 0.499348958,8.78797743 C0.818142361,9.53982205 1.27235243,10.2154948 1.85351563,10.7952474 C2.43326823,11.375 3.10894097,11.8306207 3.86078559,12.1494141 C4.63943142,12.4794922 5.46744792,12.6459418 6.31944444,12.6459418 C7.17144097,12.6459418 7.99945747,12.4794922 8.7781033,12.1494141 C9.52994792,11.8306207 10.2056207,11.3764106 10.7853733,10.7952474 C11.3651259,10.2154948 11.8207465,9.53982205 12.1395399,8.78797743 C12.4696181,8.0093316 12.6360677,7.1813151 12.6360677,6.32931858 C12.6360677,5.47732205 12.4696181,4.64930556 12.1395399,3.87065972 L12.1395399,3.87065972 Z M6.31944444,11.5047743 C3.46582031,11.5047743 1.14398872,9.18294271 1.14398872,6.32931858 C1.14398872,3.47569444 3.46582031,1.15386285 6.31944444,1.15386285 C9.17306858,1.15386285 11.4949002,3.47569444 11.4949002,6.32931858 C11.4949002,9.18294271 9.17447917,11.5047743 6.31944444,11.5047743 Z"
                                            id="Shape"
                                        ></path>
                                        <path
                                            d="M6.77083333,3.37695313 C6.71299913,3.31065538 6.64388021,3.26128472 6.56770833,3.22743056 C6.56629774,3.22743056 6.56488715,3.22601997 6.56347656,3.22601997 L6.54231771,3.21755642 C6.53949653,3.21614583 6.53667535,3.21473524 6.53385417,3.21473524 C6.52821181,3.21191406 6.52256944,3.21050347 6.51692708,3.20909288 C6.51269531,3.20768229 6.50846354,3.2062717 6.50564236,3.20486111 C6.50141059,3.20345052 6.49576823,3.20203993 6.49153646,3.20062934 C6.48730469,3.19921875 6.48166233,3.19780816 6.47743056,3.19639757 C6.47319878,3.19498698 6.46896701,3.19357639 6.46473524,3.19357639 C6.45909288,3.1921658 6.45345052,3.19075521 6.44921875,3.18934462 C6.44498698,3.18793403 6.44075521,3.18793403 6.43793403,3.18652344 C6.43229167,3.18511285 6.42664931,3.18370226 6.42100694,3.18370226 C6.41677517,3.18370226 6.41395399,3.18229167 6.40972222,3.18229167 C6.40407986,3.18088108 6.3984375,3.18088108 6.39279514,3.17947049 C6.38856337,3.17947049 6.3843316,3.1780599 6.38151042,3.1780599 C6.37586806,3.1780599 6.37022569,3.17664931 6.36458333,3.17664931 C6.36035156,3.17664931 6.35611979,3.17664931 6.35188802,3.17523872 L6.29264323,3.17523872 C6.28841146,3.17523872 6.28417969,3.17523872 6.27994792,3.17664931 C6.27430556,3.17664931 6.26866319,3.1780599 6.26302083,3.1780599 C6.25878906,3.1780599 6.25455729,3.17947049 6.25173611,3.17947049 C6.24609375,3.17947049 6.24045139,3.18088108 6.23480903,3.18229167 C6.23057726,3.18229167 6.22775608,3.18370226 6.22352431,3.18370226 C6.21788194,3.18511285 6.21223958,3.18511285 6.20659722,3.18652344 C6.20236545,3.18793403 6.19813368,3.18793403 6.1953125,3.18934462 C6.18967014,3.19075521 6.18402778,3.1921658 6.17979601,3.19357639 C6.17556424,3.19498698 6.17133247,3.19498698 6.16710069,3.19639757 C6.16286892,3.19780816 6.15722656,3.19921875 6.15299479,3.20062934 C6.14876302,3.20203993 6.14312066,3.20345052 6.13888889,3.20486111 C6.13465712,3.2062717 6.13042535,3.20768229 6.12760417,3.20909288 C6.12196181,3.21050347 6.11631944,3.21332465 6.11067708,3.21473524 C6.1078559,3.21614583 6.10503472,3.21755642 6.10221354,3.21755642 L6.08105469,3.22601997 C6.0796441,3.22601997 6.07823351,3.22743056 6.07682292,3.22743056 C6.00206163,3.26128472 5.93153212,3.31065538 5.87369792,3.37695313 L4.1344401,5.34331597 C3.90874566,5.59157986 3.93272569,5.97526042 4.18098958,6.19390191 C4.42925347,6.41395399 4.81152344,6.38997396 5.03157552,6.14171007 L5.72558594,5.35601128 L5.72558594,8.3422309 C5.72558594,8.36056858 5.72699653,8.38031684 5.72840712,8.39865451 C5.72699653,8.41840278 5.72558594,8.43956163 5.72558594,8.46072049 L5.72558594,8.88812934 C5.72558594,9.21538628 5.99359809,9.48339844 6.32085503,9.48339844 C6.64811198,9.48339844 6.91612413,9.21538628 6.91612413,8.88812934 L6.91612413,8.46072049 C6.91612413,8.43815104 6.91471354,8.41699219 6.91189236,8.39442274 C6.91330295,8.37749566 6.91471354,8.36056858 6.91471354,8.3422309 L6.91471354,5.35742188 L7.60872396,6.14171007 C7.82877604,6.38997396 8.21104601,6.41395399 8.4593099,6.19390191 C8.70757378,5.97384983 8.73155382,5.59157986 8.51150174,5.34331597 L6.77083333,3.37695313 Z"
                                            id="Path"
                                        ></path>
                                    </g>
                                </g>
                            </g>
                        </svg>
                        <!--]-->
                    </i>
                    <span class="el-label">${this.i18n.t('nextFloor', true)}</span>
                </div>
                <div class="menu-item" @click="${this.gridItemCopyBySubMenu}">
                    <i class="el-icon">
                        <!--[-->
                        <svg
                            width="13px"
                            height="13px"
                            viewBox="0 0 13 13"
                            version="1.1"
                            xmlns="http://www.w3.org/2000/svg"
                            xmlns:xlink="http://www.w3.org/1999/xlink"
                        >
                            <title>复制</title>
                            <g stroke="none" stroke-width="1" fill="none" fill-rule="evenodd">
                                <g
                                    transform="translate(-170.000000, -769.000000)"
                                    fill="#1B1D1F"
                                    fill-rule="nonzero"
                                >
                                    <g transform="translate(170.000000, 769.000000)">
                                        <path
                                            d="M8.67605331,2.78989931 L0.870564777,2.78989931 C0.393323115,2.78989931 0.00807985547,3.15107167 0.00807985547,3.59849417 L0.00807985547,11.5146378 C0.00807985547,11.9620603 0.393323115,12.3232326 0.870564777,12.3232326 L8.67892827,12.3232326 C9.15616993,12.3232326 9.54141319,11.9620603 9.54141319,11.5146378 L9.54141319,3.59849417 C9.53982912,3.15148392 9.15285788,2.78989931 8.67605331,2.78989931 Z M8.36524512,11.149766 L1.13474652,11.149766 L1.13474652,3.91656598 L8.36812005,3.91656598 L8.36812005,11.149766 L8.36524512,11.149766 Z"
                                        ></path>
                                        <path
                                            d="M10.8327465,0.0078993112 L3.16852431,0.0078993112 C2.85074654,0.0078993112 2.59074652,0.267899311 2.59074652,0.585677083 C2.59074652,0.903454855 2.85074652,1.16345486 3.16852431,1.16345486 L10.8327465,1.16345486 C11.0436354,1.16345486 11.2140799,1.33389929 11.2140799,1.54478819 L11.2140799,10.1652326 C11.2140799,10.4830104 11.4740799,10.7430104 11.7918576,10.7430104 C12.1096354,10.7430104 12.3696354,10.4830104 12.3696354,10.1652326 L12.3696354,1.54478819 C12.3667465,0.695454855 11.679191,0.0078993112 10.8327465,0.0078993112 Z"
                                        ></path>
                                    </g>
                                </g>
                            </g>
                        </svg>
                        <!--]-->
                    </i>
                    <span class="el-label">${this.i18n.t('copy', true)}</span>
                </div>
                <div class="menu-item" @click="${this.gridItemExportBySubMenu}">
                    <i class="el-icon">
                        <!--[-->
                        <svg
                            width="15px"
                            height="13px"
                            viewBox="0 0 15 13"
                            version="1.1"
                            xmlns="http://www.w3.org/2000/svg"
                            xmlns:xlink="http://www.w3.org/1999/xlink"
                        >
                            <title>导出</title>
                            <g stroke="none" stroke-width="1" fill="none" fill-rule="evenodd">
                                <g
                                    transform="translate(-170.000000, -804.000000)"
                                    fill="#1B1D1F"
                                    fill-rule="nonzero"
                                >
                                    <g transform="translate(170.000000, 804.000000)">
                                        <path
                                            d="M5.21459961,9.29614258 C5.00512695,9.34692383 4.77978516,9.14538574 4.71154785,8.92797852 C4.57824707,8.47570801 4.51000977,7.99804688 4.51000977,7.52990723 C4.51000977,5.00036621 6.91418457,2.37084961 9.49450684,1.94238281 L9.49450684,1.85827637 C9.49450684,1.83288574 9.49450684,1.79956055 9.50244141,1.77416992 L9.51037598,1.74084473 C9.5357666,1.5567627 9.60241699,1.12988281 10.0213623,0.861694336 C10.1895752,0.752197266 10.3736572,0.70300293 10.5656738,0.70300293 C10.8005371,0.70300293 10.9925537,0.787109375 11.1099854,0.853759766 C11.135376,0.861694336 11.1512451,0.879150391 11.1766357,0.895019531 L13.6982422,2.88818359 C13.9743652,3.09765625 14.1425781,3.44042969 14.1425781,3.79272461 C14.1425781,4.1529541 13.9743652,4.49572754 13.6903076,4.7052002 L11.1798096,6.6920166 C10.9957275,6.83483887 10.7783203,6.90942383 10.5593262,6.90942383 C10.3673096,6.90942383 10.1816406,6.85070801 10.0070801,6.74121094 C9.67224121,6.52380371 9.50402832,6.18896484 9.50402832,5.71923828 L9.50402832,5.70178223 C7.82824707,5.88745117 5.9699707,7.37915039 5.55895996,8.78515625 C5.48278809,9.01208496 5.34155273,9.29614258 5.21459961,9.29614258 L5.21459961,9.29614258 Z M10.5418701,1.89160156 L10.5418701,2.41210938 C10.5418701,2.68823242 10.3244629,2.91516113 10.0483398,2.93103027 C8.05517578,3.04052734 5.96044922,5.01623535 5.60974121,6.96813965 C6.66503906,5.62878418 8.39794922,4.53857422 10.0562744,4.65600586 C10.3323975,4.67346191 10.5418701,4.89880371 10.5418701,5.17492676 L10.5418701,5.72875977 C10.5418701,5.80334473 10.5498047,5.83825684 10.5498047,5.85412598 L13.0460205,3.87683105 C13.0793457,3.85144043 13.0872803,3.8260498 13.0872803,3.79272461 C13.0872803,3.75939941 13.0698242,3.72607422 13.0460205,3.70861816 L10.5672607,1.75036621 C10.5498047,1.77575684 10.5418701,1.84240723 10.5339355,1.88366699 L10.5418701,1.89160156 L10.5418701,1.89160156 Z"
                                        ></path>
                                        <path
                                            d="M10.3085938,12.8905029 L1.9407959,12.8905029 C0.877563477,12.8905029 0.00634765625,12.0192871 0.00634765625,10.9560547 L0.00634765625,1.94238281 C0.00634765625,0.879150391 0.877563477,0.00793457031 1.9407959,0.00793457031 L8.86767578,0.00793457031 L8.86767578,1.11401367 L1.9407959,1.11401367 C1.48852539,1.11401367 1.11083984,1.48217773 1.11083984,1.94396973 L1.11083984,10.9655762 C1.11083984,11.4178467 1.47900391,11.7955322 1.9407959,11.7955322 L10.3085937,11.7955322 C10.7608643,11.7955322 11.1385498,11.4273682 11.1385498,10.9655762 L11.1385498,7.76318359 L12.2351074,7.76318359 L12.2351074,10.9624023 C12.2351074,12.0192871 11.3718262,12.8905029 10.3085938,12.8905029 Z"
                                        ></path>
                                    </g>
                                </g>
                            </g>
                        </svg>
                        <!--]-->
                    </i>
                    <span class="el-label">${this.i18n.t('export', true)}</span>
                </div>
            </div>
        `
    }
    // 无用代码
    showDialog() {
        if (!this.showDialogGridStyle) return ''
        return html`<div class="dialog" open>
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
        </div>`
    }
    static styles = css`
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
        .toolbar[hide='true'] {
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

        .toolbar .el-icon[active='true'] {
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
        .grid-item[transition='true'] {
            transition: all 0.3s;
        }
        .grid-item.move {
            cursor: move;
        }
        .grid-item[edit='true'][selected='true'],
        .grid-item[edit='true']:hover {
            outline: rgba(124, 165, 208, 0.2) solid 3px;
        }
        .grid-item[edit='true'][float='true'] {
            box-shadow: rgb(0, 0, 0) 5px 5px 30px -25px;
        }
        .grid-item[float='true'] .tool-box .set-float {
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

        .grid-item[drag='true'] {
            opacity: 0.5;
            background-color: rgb(249, 227, 193);
            box-shadow: none;
            border: none;
            transition: none;
        }
        .grid-item[drag='true'] .close,
        .grid-item[drag='true'] .set-float {
            display: none;
        }
        .grid-item[lightning-style='true'] {
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
        .toolbar .el-icon.style-update-btn[active='true'] {
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
        .tool-btn {
            cursor: pointer;
        }
        .title_cls {
            display: flex;
            align-items: center;
        }
    `
}
