import React,{useEffect, useMemo} from 'react';
import {Form,Space,Button} from 'antd';
import {produce} from "immer";
import { useStore } from '../store'
import { AttrList, SkuList } from './type';

function SearchSKU(){
  const {state:{attrList,skuList},dispatch} = useStore();
  console.log(skuList)
  const skuMap = useMemo(()=>computedSkuResultMap(skuList),[skuList])
  console.log(skuMap)
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
        setAttrOptionStatus(draft,skuMap)
      })
    })
  }
  
  useEffect(()=>{
    dispatch({
      type:'setAttrList',
      payLoad:produce(attrList,(draft)=>{
        setAttrOptionStatus(draft,skuMap)
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

interface AnyOptionSkuMap{
  [key:string]:SkuList
}
/**
 * @description 计算一个包含任意规格组合的sku映射
 * @param skuList sku列表数据
 * @returns 
 */
function computedSkuResultMap(skuList:SkuList) {
  const map:AnyOptionSkuMap = {}

  skuList.forEach((sku) => {
      if (sku.stock <= 0) {
          return
      }

      const ids = sku.attrSet.map((item) => item.value)
      const keysArr = powerset(ids);

      keysArr.forEach((keyArr) => {
          const key = keyArr.join('_')
          const v = map[key];

          map[key] = v ? [...v, sku] : [sku]
      })
  })

  return map
}
/**
 * @description js求幂集
 * @param arr
 * @returns
 */
 function powerset(arr:string[]) {
  const ps:string[][] = [[]];

  for (let i = 0; i < arr.length; i++) {
      for (let j = 0, len = ps.length; j < len; j++) {
          ps.push(ps[j].concat(arr[i]));
      }
  }

  return ps;
}
/**
* @description 根据当前所选属性值，更新属性按钮的禁用状态 => map版本
* @param saleAttrs
* @param skuList
* @returns
*/
function setAttrOptionStatus(attrList:AttrList, skuMap:AnyOptionSkuMap) {
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
          /* 
            4.将集合B的元素值拼一个字符串的key,去提前计算好的skuMap字典里查找
              若无查找结果，则此按钮需要置灰，反之亦然。
          */
          const valueArr = attrList.map(({ attrLabel }) => nextSelectSet[attrLabel]).filter(Boolean)
          const sku = skuMap[valueArr.join('_')]
          option.disabled = sku === undefined;
      })
   })
}