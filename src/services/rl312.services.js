import { API } from "../constants/api";

export const getRumahSakit = async (axiosJWT, id) => {
  const { data } = await axiosJWT.get(`${API.RUMAH_SAKIT}/${id}`);

  return data.data;
};

export const getRL312DataSatuSehat = async ({
  axiosJWT,
  rsId,
  periode,
  pageNumber = 1,
  limit = 50,
}) => {
  const { data } = await axiosJWT.get(API.RL312_SATUSEHAT, {
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

export const syncRL312DataSatuSehat = async (
  axiosJWT,
  rsId,
  periode,
  token,
  CSRFToken,
) => {
  await axiosJWT.post(
    API.RL312_SYNC_SATUSEHAT,
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
