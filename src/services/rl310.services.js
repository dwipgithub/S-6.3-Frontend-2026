import { API } from "../constants/api";

export const getRumahSakit = async (axiosJWT, id) => {
  const { data } = await axiosJWT.get(`${API.RUMAH_SAKIT}/${id}`);

  return data.data;
};

export const getRL310DataSatuSehat = async ({
  axiosJWT,
  rsId,
  periode,
  pageNumber = 1,
  limit = 50,
}) => {
  const { data } = await axiosJWT.get(API.RL310_SATUSEHAT, {
    params: {
      rsId,
      periode,
      page: pageNumber,
      limit,
    },
  });

  // console.log("SERVICE RESPONSE:", data);

  return data;
};

export const syncRL310DataSatuSehat = async (
  axiosJWT,
  rsId,
  periode,
  token,
  CSRFToken,
) => {
  await axiosJWT.post(
    API.RL310_SYNC_SATUSEHAT,
    {
      rsId,
      periode,
    },
    {
      headers: {
        Authorization: `Bearer ${token}`,
        "XSRF-TOKEN": CSRFToken,
      },
    },
  );
};
