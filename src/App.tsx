import React from "react";
import {
  BrowserRouter as Router,
  Switch,
  Route,
  Redirect,
  Link,
} from "react-router-dom";
import "antd/dist/antd.css";
import { Row, Col, Button, Layout, Divider } from "antd";
import CreateSKU from "./views/CreateSKU";
// import SearchSKU from "./views/SearchSKU_Base";
import SearchSKU from "./views/SearchSKU_Map";
import { storeContext, useStoreReducer} from './store'
const { Header } = Layout;

export default function App() {
  const [state,dispatch] = useStoreReducer();
  return (
    <Router>
      <storeContext.Provider value={{state,dispatch}}>
          <Header style={{backgroundColor:'#fff'}}>
            <Row>
              <Col>
                <Button type="primary">
                  <Link to="/create">配置SKU</Link>
                </Button>
              </Col>
              <Col push={2}>
                <Button type="primary">
                  <Link to="/search">查询SKU</Link>
                </Button>
              </Col>
            </Row>
          </Header>
          <Divider/>
            <Switch>
              <Route path="/search">
                <SearchSKU />
              </Route>
              <Route path="/create">
                <CreateSKU />
              </Route>
              <Redirect path="*" to="/search"></Redirect>
            </Switch>
            </storeContext.Provider>
    </Router>
  );
}
