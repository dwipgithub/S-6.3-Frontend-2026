import { API } from "../constants/api";

export const getRumahSakit = async (axiosJWT, id) => {
  const { data } = await axiosJWT.get(`${API.RUMAH_SAKIT}/${id}`);

  return data.data;
};

export const getRL311DataSatuSehat = async ({
  axiosJWT,
  rsId,
  tahun,
  pageNumber = 1,
  limit = 50,
}) => {
  const { data } = await axiosJWT.get(API.RL311_SATUSEHAT, {
    params: {
      rsId,
      periode: tahun,
      page: pageNumber,
      limit,
    },
  });

  // console.log("SERVICE RESPONSE:", data);

  return data;
};

export const syncRL311DataSatuSehat = async (
  axiosJWT,
  rsId,
  tahun,
  token,
  CSRFToken,
) => {
  await axiosJWT.post(
    API.RL311_SYNC_SATUSEHAT,
    {
      rsId,
      periode: tahun,
    },
    {
      headers: {
        Authorization: `Bearer ${token}`,
        "XSRF-TOKEN": CSRFToken,
      },
    },
  );
};
