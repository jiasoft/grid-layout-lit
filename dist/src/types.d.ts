export declare const GridItemReizeName = "gridItemResize";
export interface TreeDataViewType {
    [key: string]: {
        list: any[];
    };
}
export interface GridItemPositionType {
    left: number;
    top: number;
    width: number;
    height: number;
}
export interface ItemData {
    x: number;
    y: number;
    w: number;
    h: number;
}
export interface GridItemData extends ItemData {
    id: string;
    z: number;
    selected?: boolean;
    dataSource?: any;
    time?: number;
    title?: string;
    float?: boolean;
    slot?: string;
    style?: GridItemPositionType;
    activeStyle?: ActiveGridItemStyleType;
}
export interface GridItemStyleType {
    borderRadius: number;
    borderWidth: number;
    borderStyle: string;
    borderColor: string;
    titleColor: string;
    contentColor: string;
    disableScrollBars: boolean;
}
export interface ActiveGridItemStyleType {
    borderStyle: string;
    borderColor: string;
    borderWidth: number;
    borderRadius: number;
    titleStyleVisible: boolean;
    titleColor: string;
    contentColor: string;
    isFloat: boolean;
}
