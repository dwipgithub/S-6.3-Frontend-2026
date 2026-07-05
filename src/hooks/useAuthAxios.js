import { useEffect, useMemo } from "react";
import axios from "axios";
import CryptoJS from "crypto-js";
import jwt_decode from "jwt-decode";
import { API } from "../constants/api";

export const useAuthAxios = ({
  token,
  expire,
  setToken,
  setExpire,
  csrfToken,
}) => {
  // Create axios instance only once
  const axiosJWT = useMemo(() => axios.create(), []);

  useEffect(() => {
    const interceptor = axiosJWT.interceptors.request.use(
      async (config) => {
        let accessToken = token;

        // Refresh token if expired
        if (expire && expire * 1000 < Date.now()) {
          const response = await axios.get(API.TOKEN, {
            headers: {
              "XSRF-TOKEN": csrfToken,
            },
          });

          accessToken = response.data.accessToken;

          setToken(accessToken);

          const decoded = jwt_decode(accessToken);
          setExpire(decoded.exp);
        }

        // Always attach Authorization header
        if (accessToken) {
          config.headers.Authorization = `Bearer ${accessToken}`;
        }

        // Sign only write requests
        if (
          ["post", "put", "patch", "delete"].includes(
            config.method?.toLowerCase(),
          )
        ) {
          const secret = process.env.REACT_APP_HMAC_SECRET;

          if (!secret) {
            throw new Error("REACT_APP_HMAC_SECRET is not defined");
          }

          const timestamp = Date.now().toString();

          const bodyString = JSON.stringify(config.data ?? {});

          const signature = CryptoJS.HmacSHA256(
            timestamp + bodyString,
            secret,
          ).toString();

          config.headers["X-Timestamp"] = timestamp;
          config.headers["X-Signature"] = signature;
        }

        return config;
      },
      (error) => Promise.reject(error),
    );

    // Remove previous interceptor
    return () => {
      axiosJWT.interceptors.request.eject(interceptor);
    };
  }, [axiosJWT, token, expire, csrfToken, setToken, setExpire]);

  return axiosJWT;
};
