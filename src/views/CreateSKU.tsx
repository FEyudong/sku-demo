import React from "react";
import { Tag, Form, Space,Table,Row,Col, TableColumnType,InputNumber, Button } from "antd";
import {produce} from "immer";
import AddOptions from "./components/AddCol";
import AddAttrItem from "./components/AddRow";
import {AttrList,SkuList,SkuInfo} from './type';
import {useStore} from '../store';
import {AttrSetItem} from './type';

function CreateSKU() {
  const {state:{skuList,attrList},dispatch} = useStore();

  // 更新sku列表
  const handleUpdateSkuList = (attrList:AttrList)=>{
    dispatch({
      type:'setSkuList',
      payLoad:createSkuList(attrList,skuList)
    })
  }
  // 增加属性
  const handleAddRow = (attrName:string)=>{
    const newAttrList = produce(attrList,(draft)=>{
      draft.push({
        attrLabel:attrName,
        options:[]
      })
    })
    dispatch({
      type:"setAttrList",
      payLoad:newAttrList
    })
    handleUpdateSkuList(newAttrList)
  }
  // 选项-添加
  const handleAddCol = (optionName:string,rowIndex:number)=>{
    const newAttrList = produce(attrList,(draft)=>{
      draft[rowIndex].options.push({
        value:optionName
      })
    })
    dispatch({
      type:"setAttrList",
      payLoad:newAttrList
    })
    handleUpdateSkuList(newAttrList)
  }
  // 选项-删除
  const handleDeleteCol = (rowIndex:number,colIndex:number)=>{
    const newAttrList = produce(attrList,(draft)=>{
      draft[rowIndex].options.splice(colIndex,1)
    })
    dispatch({
      type:"setAttrList",
      payLoad:newAttrList
    })
    handleUpdateSkuList(newAttrList)
  }

  const columns:TableColumnType<SkuInfo>[]= [
    {
      title:'ID',
      dataIndex:'id'
    },
    ...(attrList.map((item,index)=>{
      return {
        title: item.attrLabel,
        dataIndex:item.attrLabel,
        render(_:unknown,row:SkuInfo){
          return row.attrSet.find(({label})=>label === item.attrLabel)?.value
        }
      }
    })),
    {
      title:'库存',
      dataIndex:'stock',
      render(val:number,row){
        return <InputNumber value={val} onChange={(num)=>handleChangeStock(row.key,num)} />
      }
    }
  ]
  
  // 更新库存
  const handleChangeStock = (skuKey:string,stockNum:number)=>{
    dispatch({
      type:'setSkuList',
      payLoad:produce(skuList,(draft)=>{
        const sku = draft.find(({key})=>key === skuKey)
        sku && (sku.stock = stockNum);
      })
    })
  }

  // 快速设置库存,方便调试Mock
  const handleQuickSetSkuStock = ()=>{
    dispatch({
      type:'setSkuList',
      payLoad:produce(skuList,(draft)=>{
        draft.forEach((item)=>{
          // 这里预设的都是没库存的
          const noneStockKeys = [
            '红色_M_男款',
            '红色_M_女款',
          ];
          if(noneStockKeys.includes(item.key)){
              item.stock = 0
          }else{
              item.stock = 10
          }
        })
      })
    })
  }
  return <Row>
        <Col span={12}>
        <Form style={{ marginLeft: 50}}>
        <h1>规格属性</h1>
        {attrList.map((attrItem,rowIndex) => (
          <Form.Item label={attrItem.attrLabel} key={attrItem.attrLabel}>
            <Space>
              {attrItem.options.map((option,colIndex) =><Tag key={option.value} closable onClose={()=>handleDeleteCol(rowIndex,colIndex)}>{option.value}</Tag>)}
              <AddOptions onChange={(val)=>handleAddCol(val,rowIndex)} />
            </Space>
          </Form.Item>
        ))}
        <AddAttrItem onChange={handleAddRow} />
      </Form>
      </Col>
        <Col span={12}>
          <Row justify='space-between'>
            <Col>
               <h1>SKU列表</h1>
            </Col>
            <Col pull={1}>
              <Button onClick={handleQuickSetSkuStock} type='primary'>一键回填库存</Button>
            </Col>
          </Row>
         <Table rowKey='id' columns={columns} dataSource={skuList} size='small' pagination={{showTotal:(num)=>`${num}个`}} />
        </Col>
      </Row>
}
export default CreateSKU;
/**
 * @description 循环版本的SKU全排列组合
 * @param attrs 属性列表
 * @param prevSkuList 上一次的sku列表数据
 * @returns 新的sku列表数据
 */
export function createSkuList1(attrList:AttrList,prevSkuList:SkuList = []):SkuList{
    let skuList:SkuList = [];
    let id = 0;//用来生成skuId

    // 旧的skuList转下map，方便下方的复用判断
    const prevSkuMap = skuList2Map(prevSkuList)

    attrList.forEach((row)=>{//1. 遍历规格大类
      if(row.options.length === 0){
        return
      }
      if(skuList.length === 0){// 初始化第一层
        skuList = row.options.map((option)=>{
          id ++
          const attrSet = [{label:row.attrLabel,value:option.value}]
          return {
            id:`${id}`,
            key:attrSet.map(({value})=>value).join('_'),
            attrSet,
            stock:0
          }
        });
      }else{
        const tempList:SkuList = [];
        id = 0;
        skuList.forEach((skuItem)=>{//2. 遍历当前已累积的规格组合
          row.options.forEach((option)=>{//3. 遍历当前规格值，并将值与所有已累积的规格进行拼接
              id ++;
              const attrSet = skuItem.attrSet.concat({label:row.attrLabel,value:option.value});
              const key = attrSet.map(({value})=>value).join('_');
              if(prevSkuMap[key]){// 如果改变前后的sku key相同，复用sku数据,避免覆盖
                tempList.push({
                  ...prevSkuMap[key],
                  id:`${id}`
                })
              }else{
                tempList.push({
                  id:`${id}`,
                  key,
                  attrSet,
                  stock:0
                })
              }
            })
        }); 
        if(row.options.length > 0){
          skuList = tempList
        }  
    }
  })
  return skuList;
}

/**
 * @description 递归版本的SKU全排列组合
 * @param attrList 属性列表
 * @param prevSkuList 上一次的sku列表数据
 * @returns 新的sku列表数据
 */
export function createSkuList(attrList:AttrList,prevSkuList:SkuList = []):SkuList{
  const  skuList:SkuList = [];//收集结果
  let id = 0;//生成skuId
  // 旧的SkuList转map，方便下方的复用判断
  const prevSkuMap = skuList2Map(prevSkuList);
  
  const loop = (rowIndex:number,prevOptions:AttrSetItem[])=>{
    const attrItem = attrList[rowIndex];
    if(attrItem.options.length === 0){
      loop(rowIndex +1,prevOptions)
      return
    }
    for(const option of attrItem.options){
      const curOptions = prevOptions.concat({
        label:attrItem.attrLabel,
        value:option.value
      });
      if(rowIndex === attrList.length - 1){
        id ++;
        const key = curOptions.map(({value})=>value).join('_'); // 将sku的选项值用'_'连接起来组成一个key
        if(prevSkuMap[key]){// 如果改变前后的sku key相同，复用sku数据,避免数据覆盖
          skuList.push({
            ...prevSkuMap[key],
            id:`${id}`
          })
        }else{
          skuList.push({
            id:`${id}`,
            key,
            attrSet:curOptions,
            stock:0
          })
        }
      }else{
        loop(rowIndex +1,curOptions)
      }
    }
  }
  loop(0,[])
  return skuList
}
/**
 * @description sku列表数据转map,方便映射查找，判断sku数据对比复用
 * @param skuList  sku列表
 * @returns skuKey做键,sku数据做值的sku查找映射
 */
function skuList2Map(skuList:SkuList){
  return skuList.reduce<{[skuKey:string]:SkuInfo}>((map,sku)=>{
    map[sku.key] = sku;
    return map
  },{})
}