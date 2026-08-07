import { downloadExcel } from "react-export-table-to-excel";
import { MONTHS } from "../constants/date";

export const formatDate = (dateStr) => {
  if (!dateStr) return "-";

  const date = new Date(dateStr);

  const day = date.getDate();
  const month =
    MONTHS.find((m) => m.value === String(date.getMonth() + 1))?.label ?? "-";
  const year = date.getFullYear();

  const hour = String(date.getHours()).padStart(2, "0");
  const minute = String(date.getMinutes()).padStart(2, "0");
  const second = String(date.getSeconds()).padStart(2, "0");

  return `${day} ${month} ${year}, ${hour}.${minute}.${second} WIB`;
};

export const exportRL310ExcelSatuSehat = (data = [], periode) => {
  const header = [
    "No",
    "Jenis Spesialisasi",
    "Bulan",
    "Tahun",
    "Diterima Dari - Puskesmas",
    "Diterima Dari - RS Lain",
    "Diterima Dari - Faskes Lain",
    "Diterima Dari - Total Rujukan Masuk",
    "Dikembalikan Ke - Puskesmas",
    "Dikembalikan Ke - RS Asal",
    "Dikembalikan Ke - Faskes Lain",
    "Dikembalikan Ke - Total Rujukan Masuk Dikembalikan",
    "Dirujuk Keluar - Pasien Rujukan",
    "Dirujuk Keluar - Pasien Datang Sendiri",
    "Dirujuk Keluar - Total Dirujuk Keluar",
    "Dirujuk Keluar - Diterima Kembali",
  ];

  const total = {
    rm_diterima_puskesmas: 0,
    rm_diterima_rs: 0,
    rm_diterima_faskes_lain: 0,
    rm_diterima_total_rm: 0,
    rm_dikembalikan_puskesmas: 0,
    rm_dikembalikan_rs: 0,
    rm_dikembalikan_faskes_lain: 0,
    rm_dikembalikan_total_rm: 0,
    keluar_pasien_rujukan: 0,
    keluar_pasien_datang_sendiri: 0,
    keluar_total_keluar: 0,
    keluar_diterima_kembali: 0,
  };

  // console.log("Periode:", periode);
  const body = data.map((item, index) => {
    Object.keys(total).forEach((key) => {
      total[key] += Number(item[key]) || 0;
    });

    const [tahun, bulan] = periode.split("-");

    const namaBulan =
      MONTHS.find((m) => m.value === String(Number(bulan)))?.label ?? bulan;

    return [
      index + 1,
      item.jenis_spesialisasi?.nama ?? "-",
      tahun,
      namaBulan,
      Number(item.rm_diterima_puskesmas) || 0,
      Number(item.rm_diterima_rs) || 0,
      Number(item.rm_diterima_faskes_lain) || 0,
      Number(item.rm_diterima_total_rm) || 0,
      Number(item.rm_dikembalikan_puskesmas) || 0,
      Number(item.rm_dikembalikan_rs) || 0,
      Number(item.rm_dikembalikan_faskes_lain) || 0,
      Number(item.rm_dikembalikan_total_rm) || 0,
      Number(item.keluar_pasien_rujukan) || 0,
      Number(item.keluar_pasien_datang_sendiri) || 0,
      Number(item.keluar_total_keluar) || 0,
      Number(item.keluar_diterima_kembali) || 0,
    ];
  });

  body.push([
    "",
    "TOTAL",
    "",
    "",
    total.rm_diterima_puskesmas,
    total.rm_diterima_rs,
    total.rm_diterima_faskes_lain,
    total.rm_diterima_total_rm,
    total.rm_dikembalikan_puskesmas,
    total.rm_dikembalikan_rs,
    total.rm_dikembalikan_faskes_lain,
    total.rm_dikembalikan_total_rm,
    total.keluar_pasien_rujukan,
    total.keluar_pasien_datang_sendiri,
    total.keluar_total_keluar,
    total.keluar_diterima_kembali,
  ]);

  downloadExcel({
    fileName: `RL310-Rujukan-${periode}`,
    sheet: "RL310",
    tablePayload: {
      header,
      body,
    },
  });
};
