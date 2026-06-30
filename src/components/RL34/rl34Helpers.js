export const getJenisPengunjungName = (value) => {
  const relation = value?.jenis_pengunjung_rl_tiga_titik_tempat;

  if (!relation || typeof relation !== "object") {
    return "Tidak Ada Data";
  }

  return relation.nama || "Tidak Ada Data";
};

export const getRumahSakitName = (rumahSakit) => {
  return rumahSakit?.nama || "Rumah Sakit";
};

export const getSafeDataRL = (data) => {
  return Array.isArray(data) ? data : [];
};
