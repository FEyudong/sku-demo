import {createContext, useContext, useReducer} from 'react';
import {createSkuList} from './views/CreateSKU';
import { StateForStore, ReducerAction,ContextValue } from './views/type';
import attrData from "./mock/attrList";

export const initialState:StateForStore = {
  skuList:createSkuList(attrData), 
  attrList:attrData,
}
export const storeContext = createContext<ContextValue>({
  state:initialState,
  dispatch:()=>{},
});

export function storeReducer(state:StateForStore, action:ReducerAction) {
  switch (action.type) {
    case 'setSkuList':
      return {...state,skuList:action.payLoad};
    case 'setAttrList':
      return {...state,attrList:action.payLoad};    
    default:
      throw new Error();
  }
}

export function useStoreReducer(){
  return useReducer(storeReducer,initialState);
}

export function useStore(){
  return useContext(storeContext)
}