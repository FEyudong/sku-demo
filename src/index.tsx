import React from "react";
import ReactDom from "react-dom";
import App from "./App";
import { ConfigProvider } from "antd";
import zhCN from "antd/lib/locale/zh_CN";

ReactDom.render(
  <ConfigProvider locale={zhCN}>
    <App />
  </ConfigProvider>,
  document.querySelector("#root")
);
