import React from "react";
import ReactDOM from "react-dom/client";
import App from "./App";
import axios from "axios";
axios.defaults.withCredentials = true;
axios.defaults.baseURL = process.env.REACT_APP_BASE_URL;

const root = ReactDOM.createRoot(document.getElementById("root"));
root.render(
  // <React.StrictMode basename="">
  <App />,
  // </React.StrictMode>
);
