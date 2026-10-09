const namaBulan = [
  "Januari",
  "Februari",
  "Maret",
  "April",
  "Mei",
  "Juni",
  "Juli",
  "Agustus",
  "September",
  "Oktober",
  "November",
  "Desember",
];

export const formatNamaBulan = (bulan) => {
  const nomorBulan = Number(bulan);
  return Number.isInteger(nomorBulan) && nomorBulan >= 1 && nomorBulan <= 12
    ? namaBulan[nomorBulan - 1]
    : "-";
};
