import React, { useState, useEffect, useRef } from "react";
import { useCSRFTokenContext } from "../Context/CSRFTokenContext";
import axios from "axios";
import jwt_decode from "jwt-decode";
import { useNavigate, Link } from "react-router-dom";

const MenuRL51 = () => {
  const { CSRFToken } = useCSRFTokenContext();
  const [token, setToken] = useState("");
  const [expire, setExpire] = useState("");
  const navigate = useNavigate();
  const [user, setUser] = useState({});
  useEffect(() => {
    refreshToken();
    // const getLastYear = async () => {
    //   const date = new Date();
    //   setTahun(date.getFullYear());
    //   return date.getFullYear();
    //   // setTahun(date.getFullYear() - 1);
    //   // return date.getFullYear() - 1;
    // };
    // getLastYear().then((results) => {});
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const refreshToken = async () => {
    try {
      const customConfig = {
        headers: {
          "XSRF-TOKEN": CSRFToken,
        },
      };
      const response = await axios.get("/apisirs6v2/token", customConfig);
      setToken(response.data.accessToken);
      const decoded = jwt_decode(response.data.accessToken);
      //   showRumahSakit(decoded.satKerId);
      setExpire(decoded.exp);
      setUser(decoded);
    } catch (error) {
      if (error.response) {
        navigate("/");
      }
    }
  };

  const axiosJWT = axios.create();
  axiosJWT.interceptors.request.use(
    async (config) => {
      const currentDate = new Date();
      if (expire * 1000 < currentDate.getTime()) {
        const customConfig = {
          headers: {
            "XSRF-TOKEN": CSRFToken,
          },
        };
        const response = await axios.get("/apisirs6v2/token", customConfig);
        config.headers.Authorization = `Bearer ${response.data.accessToken}`;
        setToken(response.data.accessToken);
        const decoded = jwt_decode(response.data.accessToken);
        setExpire(decoded.exp);
      }
      return config;
    },
    (error) => {
      return Promise.reject(error);
    }
  );

  return (
    <div
      className="container"
      style={{ marginTop: "70px", marginBottom: "70px" }}
    >
      <div className="row">
        <div className="col-md-12">
          <span style={{ color: "gray" }}>
            <h4>RL 5.1 - Mobiditas Pasien Rawat Jalan</h4>
          </span>
          <div style={{ marginBottom: "10px" }}>
            {user.jenisUserId === 4 ? (
              <>
                <Link
                  className="btn"
                  to={`/rl51/`}
                  style={{
                    marginRight: "5px",
                    fontSize: "18px",
                    backgroundColor: "#779D9E",
                    color: "#FFFFFF",
                  }}
                >
                  SIRS
                </Link>

                <Link
                  className="btn"
                  to={`/RL51SATUSEHAT/`}
                  style={{
                    marginRight: "5px",
                    fontSize: "18px",
                    backgroundColor: "#779D9E",
                    color: "#FFFFFF",
                  }}
                >
                  SatuSehat
                </Link>
              </>
            ) : null}
          </div>
        </div>
      </div>
    </div>
  );
};

export default MenuRL51;
