import { getNamaRumahSakit } from "./getNamaRumahSakit";

const getText = (...values) =>
  values.find(
    (value) => typeof value === "string" && value.trim() !== ""
  )?.trim();

export const getInfoRumahSakitExport = ({
  rumahSakit,
  daftarRumahSakit = [],
  rsId,
  namaUser,
  filterLabels = [],
}) => {
  const rumahSakitTerpilih = (Array.isArray(daftarRumahSakit)
    ? daftarRumahSakit
    : []
  ).find((item) => String(item.id) === String(rsId));
  const detail = rumahSakitTerpilih || rumahSakit || {};
  const namaDariFilter = filterLabels.find((label) =>
    /^(nama )?rumah sakit:/i.test(label)
  )?.replace(/^(nama )?rumah sakit:/i, "").trim();

  return {
    kodeRS:
      getText(
        detail.kode_rs,
        rumahSakit?.kode_rs,
        detail.kode_rs_kemenkes,
        rumahSakit?.kode_rs_kemenkes,
        detail.kodeRS,
        rumahSakit?.kodeRS,
        detail.kode_rumah_sakit,
        rumahSakit?.kode_rumah_sakit,
        detail.kode,
        rumahSakit?.kode
      ) || "-",
    namaRS: getNamaRumahSakit(
      namaDariFilter,
      rumahSakit?.nama,
      rumahSakit?.nama_rumah_sakit,
      rumahSakitTerpilih?.nama,
      namaUser
    ),
    provinsi:
      getText(
        detail.provinsi_nama,
        rumahSakit?.provinsi_nama,
        detail.provinsi?.nama,
        rumahSakit?.provinsi?.nama
      ) || "-",
    kabupatenKota:
      getText(
        detail.kab_kota_nama,
        rumahSakit?.kab_kota_nama,
        detail.kabupaten_kota_nama,
        rumahSakit?.kabupaten_kota_nama,
        detail.kab_kota?.nama,
        rumahSakit?.kab_kota?.nama,
        detail.kabupaten_kota?.nama,
        rumahSakit?.kabupaten_kota?.nama
      ) || "-",
  };
};
