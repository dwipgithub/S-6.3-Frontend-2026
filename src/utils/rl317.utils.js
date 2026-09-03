import * as XLSX from "xlsx-js-style";
import { MONTHS } from "../constants/date";

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

export const exportRL317ExcelSatuSehat = (data = [], tahun) => {
  let totalItem = 0;
  let totalItemRS = 0;

  // ==========================================
  // DATA EXCEL
  // ==========================================

  const excelData = [
    ["SIRS ONLINE RL 3.17 Farmasi Pengadaan Obat - SATUSEHAT"],
    [],
    ["Periode Data"],
    [`Tahun : ${tahun}`],
    [],
    [
      "No",
      "Rumah Sakit",
      "Golongan Obat",
      "Jumlah Item Obat",
      "Jumlah Item Obat yang Tersedia di Rumah Sakit",
    ],
  ];

  // ==========================================
  // DATA
  // ==========================================

  data.forEach((item, index) => {
    const jumlahItem = Number(item.jumlah_item_obat) || 0;

    const jumlahItemRS = Number(item.jumlah_item_obat_rs) || 0;

    totalItem += jumlahItem;
    totalItemRS += jumlahItemRS;

    const namaRumahSakit =
      item.nama_rumah_sakit ??
      item.rumah_sakit ??
      item.nama_rs ??
      item.rs_name ??
      "-";

    const namaGolonganObat =
      item.nama_golongan_obat ??
      item.rl_tiga_titik_tujuh_belas_golongan_obat?.nama ??
      "-";

    excelData.push([
      index + 1,
      namaRumahSakit,
      namaGolonganObat,
      jumlahItem,
      jumlahItemRS,
    ]);
  });

  // ==========================================
  // TOTAL
  // ==========================================

  excelData.push(["", "", "TOTAL", totalItem, totalItemRS]);

  // ==========================================
  // WORKSHEET
  // ==========================================

  const worksheet = XLSX.utils.aoa_to_sheet(excelData);

  // ==========================================
  // MERGE JUDUL
  // A1:E1
  // ==========================================

  worksheet["!merges"] = [
    {
      s: { r: 0, c: 0 },
      e: { r: 0, c: 4 },
    },
  ];

  // ==========================================
  // LEBAR KOLOM
  // ==========================================

  worksheet["!cols"] = [
    { wch: 8 }, // No
    { wch: 30 }, // Rumah Sakit
    { wch: 40 }, // Golongan Obat
    { wch: 20 }, // Jumlah Item Obat
    { wch: 45 }, // Jumlah Item Obat RS
  ];

  // ==========================================
  // BORDER
  // ==========================================

  const thinBorder = {
    top: {
      style: "thin",
      color: { rgb: "000000" },
    },
    bottom: {
      style: "thin",
      color: { rgb: "000000" },
    },
    left: {
      style: "thin",
      color: { rgb: "000000" },
    },
    right: {
      style: "thin",
      color: { rgb: "000000" },
    },
  };

  // ==========================================
  // HEADER TABEL
  // ROW 6
  // ==========================================

  for (let col = 0; col <= 4; col++) {
    const cellAddress = XLSX.utils.encode_cell({
      r: 5,
      c: col,
    });

    if (worksheet[cellAddress]) {
      worksheet[cellAddress].s = {
        font: {
          name: "Calibri",
          sz: 12,
          bold: true,
        },
        alignment: {
          horizontal: "center",
          vertical: "center",
          wrapText: true,
        },
        border: thinBorder,
      };
    }
  }

  // ==========================================
  // DATA TABEL
  // ==========================================

  const totalRow = excelData.length - 1;

  for (let row = 6; row < totalRow; row++) {
    for (let col = 0; col <= 4; col++) {
      const cellAddress = XLSX.utils.encode_cell({
        r: row,
        c: col,
      });

      if (!worksheet[cellAddress]) {
        continue;
      }

      worksheet[cellAddress].s = {
        font: {
          name: "Calibri",
          sz: 12,
        },
        alignment: {
          // No dan angka berada di tengah
          // Rumah Sakit dan Golongan Obat kiri
          horizontal: col === 0 || col >= 3 ? "center" : "left",
          vertical: "center",
          wrapText: true,
        },
        border: thinBorder,
      };
    }
  }

  // ==========================================
  // TOTAL
  // ==========================================

  for (let col = 0; col <= 4; col++) {
    const cellAddress = XLSX.utils.encode_cell({
      r: totalRow,
      c: col,
    });

    if (worksheet[cellAddress]) {
      worksheet[cellAddress].s = {
        font: {
          name: "Calibri",
          sz: 12,
          bold: true,
        },
        alignment: {
          horizontal: "center",
          vertical: "center",
          wrapText: true,
        },
        border: thinBorder,
      };
    }
  }

  // ==========================================
  // JUDUL
  // ==========================================

  worksheet["A1"].s = {
    font: {
      name: "Calibri",
      sz: 16,
      bold: true,
    },
    alignment: {
      horizontal: "left",
      vertical: "center",
    },
  };

  // ==========================================
  // PERIODE DATA
  // ==========================================

  worksheet["A3"].s = {
    font: {
      name: "Calibri",
      sz: 12,
      bold: true,
    },
    alignment: {
      horizontal: "left",
      vertical: "center",
    },
  };

  worksheet["A4"].s = {
    font: {
      name: "Calibri",
      sz: 12,
      bold: true,
    },
    alignment: {
      horizontal: "left",
      vertical: "center",
    },
  };

  // ==========================================
  // TINGGI BARIS
  // ==========================================

  worksheet["!rows"] = [
    { hpt: 25 }, // Row 1
    { hpt: 10 }, // Row 2
    { hpt: 20 }, // Row 3
    { hpt: 20 }, // Row 4
    { hpt: 15 }, // Row 5
    { hpt: 45 }, // Row 6
  ];

  // ==========================================
  // WORKBOOK
  // ==========================================

  const workbook = XLSX.utils.book_new();

  XLSX.utils.book_append_sheet(workbook, worksheet, "Farmasi Pengadaan Obat");

  // ==========================================
  // EXPORT
  // ==========================================

  XLSX.writeFile(workbook, `RL317-Farmasi Pengadaan Obat-${tahun}.xlsx`);
};
