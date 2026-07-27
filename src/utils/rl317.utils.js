import { downloadExcel } from "react-export-table-to-excel";

export const calculateTotals = (data = []) => {
  return data.reduce(
    (acc, item) => {
      acc.jumlahItemObat += Number(item.jumlah_item_obat) || 0;

      acc.jumlahItemObatRs += Number(item.jumlah_item_obat_rs) || 0;

      return acc;
    },
    {
      jumlahItemObat: 0,
      jumlahItemObatRs: 0,
    },
  );
};

export const formatDate = (dateStr) => {
  if (!dateStr) return "-";
  return (
    new Date(dateStr).toLocaleString("id-ID", { timeZone: "Asia/Jakarta" }) +
    " WIB"
  );
};

export const exportRL317ExcelSatuSehat = (data = [], tahun) => {
  const header = [
    "No",
    "Golongan Obat",
    "Periode",
    "Jumlah Item Obat",
    "Jumlah Item Obat yang Tersedia di Rumah Sakit",
  ];

  let totalItem = 0;
  let totalItemRS = 0;

  const body = data.map((item, index) => {
    const jumlahItem = Number(item.jumlah_item_obat) || 0;
    const jumlahItemRS = Number(item.jumlah_item_obat_rs) || 0;

    totalItem += jumlahItem;
    totalItemRS += jumlahItemRS;

    return [
      index + 1,
      item.nama_golongan_obat ??
        item.rl_tiga_titik_tujuh_belas_golongan_obat?.nama ??
        "-",
      tahun,
      jumlahItem,
      jumlahItemRS,
    ];
  });

  body.push(["", "TOTAL", "", totalItem, totalItemRS]);

  downloadExcel({
    fileName: `RL317-Farmasi Pengadaan Obat-${tahun}`,
    sheet: "Farmasi Pengadaan Obat",
    tablePayload: {
      header,
      body,
    },
  });
};
