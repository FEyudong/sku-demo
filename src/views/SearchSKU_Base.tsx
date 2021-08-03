import React,{useEffect} from 'react';
import {Form,Space,Button} from 'antd';
import {produce} from "immer";
import { useStore } from '../store'
import { AttrList, SkuList } from './type';
function SearchSKU(){
  const {state:{attrList,skuList},dispatch} = useStore();
  console.log([...attrList])
  console.log(skuList)
  // 选择商品选项
  const handleCheck = (rowIndex:number,colIndex:number)=>{
    dispatch({
      type:'setAttrList',
      payLoad:produce(attrList,(draft)=>{
        const attrItem = draft[rowIndex]
        attrItem.options.forEach((item,index)=>{
          if(index === colIndex){
            if(item.isChecked){
              item.isChecked = false;
              attrItem.currentValue= null;
            }else{
              item.isChecked = true;
              attrItem.currentValue= item.value;
            }
          }else{
            item.isChecked = false
          }
        })
        setAttrOptionStatus(draft,skuList)
      })
    })
  }
  
  useEffect(()=>{
    dispatch({
      type:'setAttrList',
      payLoad:produce(attrList,(draft)=>{
        setAttrOptionStatus(draft,skuList)
      })
    })
  // eslint-disable-next-line react-hooks/exhaustive-deps
  },[skuList])

  return <>
        <Form style={{ marginLeft: 50}}>
            <h1>商品属性选择</h1>
            {attrList.map((attrItem,rowIndex) => (
              <Form.Item label={attrItem.attrLabel} key={attrItem.attrLabel}>
                <Space>
                  {attrItem.options.map((option,colIndex) =><Button key={option.value} onClick={()=>handleCheck(rowIndex,colIndex)} disabled={option.disabled} type={option.isChecked?'primary':'default'}>{option.value}</Button>)}
                </Space>
              </Form.Item>
            ))}
      </Form>
    </>
}
export default SearchSKU;
/**
 * @description 属性的选项状态
 * @param attrList 属性列表
 * @param skuList sku列表数据
 * @returns 不会有返回值，因为此函数在immer的produce作用域里执行，所以最终会处理为一个不可变的属性列表数据
 */
function setAttrOptionStatus(attrList:AttrList, skuList:SkuList) {
  // 1.获取已选规格集合{A}
  const selectedSet = attrList.reduce<{[props:string]:string}>((arr, item) => {
      item.currentValue && (arr[item.attrLabel] = item.currentValue);
      return arr
  }, {})
  // 2.遍历所有待选规格
  attrList.forEach((attr) => {
      attr.options.forEach((option) => {
          if (option.isChecked) {
              return
          }
          // 3.待选项{x}与已选项{A}组成新的集合B = {A,x}
          const nextSelectSet = {...selectedSet,[attr.attrLabel]:option.value}
          const keys = Object.keys(nextSelectSet);
          /* 
            4.遍历sku列表，
              看能否找到（1）选项匹配 且(2)有货的sku
              (1)选项匹配：找到sku对应的规格集合C,判断B与C是否具有包含关系 B <= C ?
             （2）判断库存
              查找结果为否，则此按钮需要置灰，反之亦然。
          */
          option.disabled = skuList.findIndex((sku) => {
            return keys.every((attrKey)=> sku.stock > 0 && sku.attrSet.findIndex((option)=>{
              return option.value === nextSelectSet[attrKey]
            }) > -1)
          }) === -1;
      })
   })
   return attrList
}
