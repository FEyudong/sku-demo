## 前言
商品SKU的创建与查询，是**电商业务**最经典的开发场景之一，也是整个电商系统**最基础**的功能。因为假如缺少了它，那么也许连准确描述定位一件商品，这样最基本的需求，都将变得困难重重，商品的**库存管理**也就无处谈起。 
## 概览
![SKU功能设计流程](https://p9-juejin.byteimg.com/tos-cn-i-k3u1fbpfcp/d473ff1539ea4c9a97e621597273d46e~tplv-k3u1fbpfcp-watermark.image)
如图所示，整体流程可分为两部分:  
1. **运营端**。负责创建与配置SKU，运营通过操作SKU选项，生成一个SKU列表。
2. **用户端**。负责SKU的库存状态查询。  
在商品详情页，需要根据用户已选规格，去SKU列表里进行匹配查找。  
假如用户选择完毕，能够命中一份有库存的SKU数据，就提交一个SKU-ID给到下单流程。
总结: 这是一种**前端为主**的实现方案，SKU的**创建与查询部分**都由前端来完成，后端只负责SKU的**存储**。这也是各大电商平台上的主流实现。  
当然也有**后端为主**的方案，**SKU的创建、查询、存储都交给后端来完成**。**每次操作都可以看作是一次向后端的表单提交**，并且只需要提交必要的操作信息，后端处理完成，**返回前端需要的最终结果就可以了**。这种方案的优势是**库存数据的实时性好**，但无论是运营端动态创建SKU列表，还是用户在详情页点击选项查询库存，都是足够**高频的交互**，每次的异步请求查询，出loading，都会打断使用者的当前操作，**用户体验差**。并且这种实现方式前端工作量很少，所以本文不会涉及。 



**Demo项目简介：**
1. 为了更清晰的内容讲解，笔者整理了一个[sku-demo](https://github.com/FEyudong/sku-demo)，包含了 **（1）怎样在运营端进行SKU的创建；**  **（2）用户端怎样在商品详情页进行SKU的查询**。  
   麻雀虽小，五脏俱全，基本涵盖了前端SKU方面的绝大部分处理场景，读者可以下载并把项目跑起来，对照着来阅读，会理解的更快一些。  
2. 用useContext+useReducer模拟了一个小型的**全局Store**，当做用户端与运营端的共享数据存储，已此来**模拟后台到前台**的一个完整交互。
3. 运营配置页（src/views/CreateSKU.tsx）负责配置两份数据：一份是**属性选项列表**(attrList), 另一份是**SKU列表**（skuList),配置完成后输出到用户端商品详情页（src/views/SearchSKU_xxx.tsx）分别用来渲染选项UI及查询SKU信息，所以将它们都存入Store中，方便共享通信，模拟**SKU从运营端生成=>发送服务端存储=>用户端读取查询的全过程**。

## 一、SKU创建
`npm start`启动项目后，会默认进入一个模拟**运营端**的商品配置页。如下图：
![demo-home](https://p3-juejin.byteimg.com/tos-cn-i-k3u1fbpfcp/7c52348ce9e64e7d9eeef02e1a75cadc~tplv-k3u1fbpfcp-watermark.image)
*tip:* 点击页面左上角的入口按钮可以进行运营端与用户端的切换。  
整体操作：就是运营通过**操作左侧各种规格选项，联动生成右侧的SKU列表**。  
### 需求关键点分析：
运营对规格选项的操作大致可分为两类：
1. 对属性的**具体选项**进行增删改   
   会影响属性选项的个数，需要在SKU列表中适当位置进行插入或者删除操作。  
2. 对**属性**进行增删   
   会影响数据的层数，意味当前所有SKU的选项组合都不是最新的，需要清空，重新组合。 比如原来属性类型只有`颜色，尺寸，款式`，现在增加一组`套餐`属性, 那之前的所有SKU组合都需要和`套餐`再次组合，并且之前配置的库存数据也都失效了。
为了降低设计的复杂度，采用了如下的方案：**不区分操作，无论哪种操作类型，统一都走重新组合生成的逻辑**。（当然如果十分在乎性能，也可以通过区分操作进行优化，类似于vue中针对不同dom操作类型所进行的domDiff效率方面的优化）。    
如下图：将左侧不同类型的规格值，通过**排列组合**的方式，生成右侧这样一个SKU列表。
![SKU生成](https://p3-juejin.byteimg.com/tos-cn-i-k3u1fbpfcp/cbd9ec72212b4da38830908693b533d3~tplv-k3u1fbpfcp-watermark.image)
### 具体实现：
那么问题就抽象为：**求商品规格列表的全排列组合**。这个过程是一个典型的树形结构，需要遍历到这颗树的每一个叶子，最终将叶子收集起来。
![tree](https://p6-juejin.byteimg.com/tos-cn-i-k3u1fbpfcp/20b3cc7637b9430f9d602480db1cf741~tplv-k3u1fbpfcp-watermark.image)
感兴趣的可以看下leetcode上[组合](https://leetcode-cn.com/problems/combinations/)这道题，解题思路很类似。  
对于层数不固定的Tree结构数据，首先可以想到用**递归**的思路求解：
#### 递归版本  
代码位置：src/views/CreateSKU.tsx
```
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
      if(rowIndex === attrList.length - 1){//判断如果是最后一层，那就是组合完整了，将结果收集到全局的容器里
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
```
#### 循环版本   
除了递归，也可以用**循环**来求解。 
但他们本质其实是一样的，都是n^m的时间复杂度，循环只是靠迭代中的临时变量tempList，模拟了递归里栈的概念，所以与递归版本的区别就是使用原生的函数调用栈还是自己代码里的栈。
```
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
```
具体的代码不展开讲解了。但是有一点是需要格外注意的:  
SKU列表里的数据，虽然**每次都重新生成一遍**，但针对之前已经配置过的内容数据（比如库存数量）在**重新生成前后，SKU组合并无改变的情况下，是需要保留的**，不然这些数据就全丢失了，所以在创建时就给每条sku数据定义一个**key**（包含的选项值拼接而成的字符串）。eg：对于选项组合为`[M,红，宽松]`的sku，`M_红_宽松`就作为它的一个唯一key标示，在SKU重新创建时，会拿着新生成的key在旧的sku数据里的查找一样的，如果可以找到，就**复用原来的数据**，这样就避免了重新生成后导致的原数据覆盖丢失。   
这样运营端SKU的生成部分工作就完成了，下边讲用户端SKU的查询。
## 二、SKU查询
![商品详情页](https://p9-juejin.byteimg.com/tos-cn-i-k3u1fbpfcp/60a3112668d342c5967a2df13fc5d276~tplv-k3u1fbpfcp-watermark.image)  
这是SKU查询功能的截图，这里产品经理一般都会提一个交互需求：**希望根据用户当前已选的规格值，能够预判出哪些SKU组合是缺货状态，提前将对应按钮置灰。**  
比如上方截图里，`[红色,M,男款]`缺货，在选择`红色`、`M`后，就需要提前将`男款`置灰。

![选后俩](https://p3-juejin.byteimg.com/tos-cn-i-k3u1fbpfcp/0e3659939fe746359a202ea9cca43755~tplv-k3u1fbpfcp-watermark.image)  
反着选，先选后两行的`M`、`男款`，置灰第一行的`红色`。

![选中间](https://p3-juejin.byteimg.com/tos-cn-i-k3u1fbpfcp/05d3e47ee4d64032ad5543349aac8cac~tplv-k3u1fbpfcp-watermark.image)  

先选前后两行`红色`、`男款`，需要置灰中间的`M`。  
这还是只一个SKU缺货，如果两个SKU缺货呢？  
比如`[红色，M，男款]`、`[红色，M，女款]`缺货，也就是`红色`的`M`号都缺货。 

![](https://p3-juejin.byteimg.com/tos-cn-i-k3u1fbpfcp/73dde146b2d24b3cbceea77b2b3b5627~tplv-k3u1fbpfcp-watermark.image)  
在这种情况下，只选择一个`红色`，就需要判断出`M`不可选。  
1-2个sku缺货已经需要有上边那么多置灰的情况需要判断，那么更多的sku缺货呢，想想就头大，需要判断的情况太多了，或者根本不知道从何判断。
不过通过以上的场景推演，也能总结出一些导致问题变得复杂的原因:
1. 用户**选择路径不一定完整**，在用户全选完整之前，就需要做判断。
2. 用户**选择的先后顺序并不确定**，用户可以跳着选、反着选。 
3. **点击任意选项，都有可能触发其他任意位置的选项置灰与否**  
那么就可以想到一个统一的思路：**无论当前选择了什么，都遍历全部选项，站在每个选项的角度，判断需不需要将自身置灰**。 

动手实现之前，先了解下已知条件:  
1. **attrList: 属性列表**，用来展示选项UI，并且给每个选项自定义了一个disabled字段，用来表示按钮置灰状态。
```
attrList = [
    {
        "attrLabel": "颜色",
        "options": [
            {
                "value": "红色",
                "disabled": true
            },
            {
                "value": "绿色",
                "disabled": true
            },
            {
                "value": "蓝色",
                "disabled": true
            }
        ]
    },
   ...
]
```
2. **skuList: 运营端生成的SKU列表**。判断缺货与否的数据源，stock = 0即为缺货
```
skuList = [
    {
        "id": "1",
        "key": "红色_M_男款",
        "attrSet": [
            {
                "label": "颜色",
                "value": "红色"
            },
            {
                "label": "尺寸",
                "value": "M"
            },
            {
                "label": "款式",
                "value": "男款"
            }
        ],
        "stock": 0
    },
    ...
]
```
根据上边整理的思路，写出以下代码
### 常规的循环匹配法
```
/**
 * @description 属性的选项状态
 * @param attrList 属性列表
 * @param skuList sku列表数据
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
              看能否找到符合以下两种条件的sku
              (1)选项匹配：找到sku对应的规格集合C,判断B与C是否具有包含关系 B <= C ? 
             （2）有货的：判断库存
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
```
1. 获取已选规格集合{A}。  
2. 遍历所有待选规格选项。
3. 将每一个待选项{x}与已选项{A}组成新的集合B = {A,x}
4. 遍历sku列表，看能否找到**同时符合以下两种条件**的sku  
   (1)**有货的**：判断库存stock,是否大于0   
   (2)**规格选项匹配**：找到每个sku对应的规格集合C,判断B与C是否具有包含关系 B <= C ?  
   **查找结果为否，则此按钮需要置灰**，反之亦然。  
尝试分析一下复杂度。假设，有 m 种规格，每一种都有 n 个选项，
步骤 2 需遍历 n x m 次，还可接受。
但是步骤 4 需要在完整遍历SKU列表（长度n^m）过程中，再判断B\C俩集合是否具有包含关系。
却并不是一个简单的过程，所以是优化的重点。  
### Map穷举法
**以空间换时间：** 既然用户选择的路径、顺序、个数都不固定，那么组成的选项集合是难以预测的，那么是不是可以**提前把用户所有可能选到的sku组合都穷举出来**。这样在匹配查询时效率就会快很多了，因为这本质上是因为将遍历查询匹配的工作前置了。    
**具体思路**：就是根据穷举法的思想，提前计算好一个包含任意规格组合（表示用户任意的选择路径）的Map映射。  
首先就是将每个sku组合的进行拆分，比如`[红色，M，男款]`就可以拆成（2^n）也就是8组子选项。这可以抽象为一个求幂集的操作。

![sku拆分](https://p6-juejin.byteimg.com/tos-cn-i-k3u1fbpfcp/960466f49b8c41fcb7a0d306daf06e9d~tplv-k3u1fbpfcp-watermark.image)

```
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
```
有了这个求幂集方法就可以提前计算出这个任意规格组合的Map了
```
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
      if (sku.stock <= 0) {//没货的，不往结果里塞
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
```
计算结果如下:

![skuMap](https://p6-juejin.byteimg.com/tos-cn-i-k3u1fbpfcp/5011f13060bd4e1097602887a70df8f4~tplv-k3u1fbpfcp-watermark.image)  
接下来实现查询主函数
src/views/SearchSKU_Map.tsx
```
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
```
这里的1、2、3步骤与上边的第一种暴力循环法，是一致的，区别是第4步的。不再是去skuList里复杂的遍历匹配，而是**简单的通过判断key（由集合B的选项值按固定的顺序拼成的一个字符串）是否在结果Map中存在**即能知道对应的按钮是否需要缺货置灰。  
**优点:** **查询的时间复杂度降为了O1**，因为复杂的遍历匹配过程简化为了一次map查找,非常快。  
**缺点:** 一次幂集拆分就有2^n个子集。全部sku就有 n^m 乘以 2^n个键值对，最终如上图所示，拆出的键值对非常多，非常陇余。初始化较慢，**计算出的map键值对非常多，造成空间浪费**。  
 ### 无向图（待更新）
 未完待续，更新预告：尝试用无向图这种数据结构来进行求解。
 



