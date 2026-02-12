import { useEffect, useState } from "react";
import axios from "axios";
import jwt_decode from "jwt-decode";
import {
  Link,
  useNavigate,
  useSearchParams,
  useLocation,
} from "react-router-dom";
import { ToastContainer, toast } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import LoadingSpinner from "./LoadingSpinner";
import { useCSRFTokenContext } from "../Context/CSRFTokenContext";

const SSO_Login = () => {
  const [expire, setExpire] = useState("");
  const [user, setUser] = useState({});
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const { simpanCSRFToken, CSRFToken } = useCSRFTokenContext();

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const tokenFromUrl = params.get("token"); // Menarik token dari URL

    if (tokenFromUrl) {
      tokenAPI(tokenFromUrl);
    } else {
      refreshToken();
    }

    // if (params.size != 1) {
    //   refreshToken();
    // } else {
    //   tokenAPI(tokenFromUrl);
    // }
  }, []);

  const refreshToken = async () => {
    try {
      const customConfig = {
        headers: {
          "XSRF-TOKEN": CSRFToken,
        },
      };
      const response = await axios.get("/apisirs6v2/token", customConfig);
      const decoded = jwt_decode(response.data.accessToken);
      setUser(decoded);
      setUser((prevState) => {
        navigate("/beranda");
      });
      setExpire(decoded.exp);
    } catch (error) {
      // window.location.replace(
      //   "https://akun-yankes.kemkes.go.id/?continued=" + window.location.href,
      // );

      // ERROR FORBIDDEN KARNA TIDAK ADA TOKEN dan SESSION
      window.location.replace(
        process.env.REACT_APP_BASE_SSO +
          "?continued=" +
          process.env.REACT_APP_BASE_APP,
      );
    }
  };

  const tokenAPI = async (token) => {
    document.querySelector(".loading-overlay").style.display = "flex";

    setTimeout(() => {
      const loadingOverlay = document.querySelector(".loading-overlay");
      if (loadingOverlay) {
        loadingOverlay.style.display = "none";
      }
    }, 3000);

    try {
      const results = await axios.get("/apisirs6v2/login?token=" + token);
      simpanCSRFToken(results.data.data.csrfToken);
      const urlWithoutToken = window.location.href.split("?")[0];
      window.history.replaceState({}, "", urlWithoutToken);
      navigate("/beranda");
    } catch (error) {
      setLoading(false);

      if (error.response && error.response.status === 404) {
        toast("Akun anda Tidak Aktif Silahkan menghubungi Admin", {
          position: toast.POSITION.TOP_RIGHT,
        });
        setTimeout(() => {
          window.location.replace(
            process.env.REACT_APP_BASE_SSO +
              "?continued=" +
              process.env.REACT_APP_BASE_APP,
          );
        }, 2000);
      } else {
        toast(error.message, {
          position: toast.POSITION.TOP_RIGHT,
        });

        setTimeout(() => {
          window.location.replace(process.env.REACT_APP_BASE_SSO);
          // window.location.replace("https://akun-yankes.kemkes.go.id/");
        }, 2000);

        // window.location.replace(
        //   process.env.REACT_APP_BASE_SSO +
        //     "?continued=" +
        //     process.env.REACT_APP_BASE_APP,
        // );
      }
    }
  };

  return (
    <div
      className="container"
      style={{ marginTop: "70px", marginBottom: "70px" }}
    >
      <div>
        <LoadingSpinner />
      </div>
      <ToastContainer />
    </div>
  );
};

export default SSO_Login;
