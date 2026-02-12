export const getDataSatusehat = async (axiosJWT, token, rsId, tahun, bulan) => {
  try {
    const customConfig = {
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
      params: {
        rsId: rsId,
        periode: `${tahun}-${bulan}`,
      },
    };

    const results = await axiosJWT.get(
      "/apisirs6v2/rllimatitiksatusatusehat",
      customConfig
    );
    return results.data;
  } catch (error) {
    return {
      status: false,
      message: error.response?.data?.message || "Gagal mengambil data",
      code: error.response?.status || 500,
    };
  }
};
