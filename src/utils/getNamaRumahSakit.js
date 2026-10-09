export const getNamaRumahSakit = (...candidates) => {
  const name = candidates.find(
    (candidate) =>
      typeof candidate === "string" &&
      candidate.trim() !== "" &&
      !["-", "rumah sakit"].includes(candidate.trim().toLowerCase())
  );

  return name ? name.trim() : "Rumah Sakit";
};
