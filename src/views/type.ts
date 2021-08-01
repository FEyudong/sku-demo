import { Dispatch } from "react"
export type Option = {
  value:string
  isChecked?:boolean
  disabled?:boolean
}
export interface AttrItem{
  currentValue?:string | null
  attrLabel:string
  options:Option[]
}

export type AttrList = AttrItem[]

export interface AttrSetItem{
  label:string
  value:string
}
export interface SkuInfo{
  id:string
  key:string
  attrSet:AttrSetItem[],
  stock:number //库存
}
export type SkuList = SkuInfo[]

export interface StateForStore{
  skuList:SkuList
  attrList:AttrList
}

export interface ReducerAction<PayLoad = any>{
  type:string
  payLoad:PayLoad
}

export interface ContextValue {
  state:StateForStore
  dispatch:Dispatch<ReducerAction>
}