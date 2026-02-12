import axios from "axios";

export const getStatusSatset = async (token) => {
  try {
    const res = await axios.get("/apisirs6v2/status-satset", {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    });

    return res.data?.status_satset ?? 0;
  } catch (error) {
    console.error("Error fetching status_satset:", error);
    return 0;
  }
};
