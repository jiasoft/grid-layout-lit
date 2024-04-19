
export const GridItemReizeName = 'gridItemResize' //Grid 拖拽大小事件名称

//TreeView
export interface TreeDataViewType {
    [key: string]: { list: any[] }
}
//GridItem定位信息
export interface GridItemPositionType {
    left: number
    top: number
    width: number
    height: number
}
//ItemData信息
export interface ItemData {
    x: number
    y: number
    w: number
    h: number
}
//GridItem的Data信息
export interface GridItemData extends ItemData {
    id: string
    z: number
    selected?: boolean
    dataSource?: any
    time?: number
    title?: string
    float?: boolean
    slot?: string
    style?: GridItemPositionType
    activeStyle?: ActiveGridItemStyleType
}

// GridItem样式
export interface GridItemStyleType {
    borderRadius: number
    borderWidth: number
    borderStyle: string
    borderColor: string
    titleColor: string
    contentColor: string
    disableScrollBars: boolean
}
//活动样式
export interface ActiveGridItemStyleType {
    // borderStyleVisible: boolean
    borderStyle: string
    borderColor: string
    borderWidth: number
    borderRadius: number
    titleStyleVisible: boolean
    titleColor: string
    contentColor: string
    isFloat: boolean
    // enbled: boolean
}
