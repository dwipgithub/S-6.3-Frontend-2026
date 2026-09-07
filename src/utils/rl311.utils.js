import * as XLSX from "xlsx-js-style";
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

export const calculateTotals = (data = []) => {
  return data.reduce(
    (acc, item) => {
      acc.jumlah += Number(item.jumlah) || 0;

      return acc;
    },
    {
      jumlah: 0,
    },
  );
};

export const exportRL311ExcelSatuSehat = (data = [], periode) => {
  let totalJumlah = 0;

  // ==========================================
  // DATA EXCEL
  // ==========================================

  const excelData = [
    ["SIRS ONLINE RL 3.11 Gigi dan Mulut - SATUSEHAT"],
    [],
    ["Periode Data"],
    [`Tahun : ${periode}`],
    [],
    ["No", "Rumah Sakit", "Jenis Kegiatan", "Jumlah"],
  ];

  // ==========================================
  // DATA
  // ==========================================

  data.forEach((item, index) => {
    const jumlah = Number(item.jumlah) || 0;

    totalJumlah += jumlah;

    const namaRumahSakit =
      item.organization_name ??
      item.nama_rumah_sakit ??
      item.rumah_sakit ??
      item.nama_rs ??
      item.rs_name ??
      "-";

    const jenisKegiatan =
      item.rl_tiga_titik_sebelas_jenis_kegiatan?.nama_jenis_kegiatan ?? "-";

    excelData.push([index + 1, namaRumahSakit, jenisKegiatan, jumlah]);
  });

  // ==========================================
  // TOTAL
  // ==========================================

  const totalRow = excelData.length;

  excelData.push(["TOTAL", "", "", totalJumlah]);

  // ==========================================
  // WORKSHEET
  // ==========================================

  const worksheet = XLSX.utils.aoa_to_sheet(excelData);

  // ==========================================
  // MERGE JUDUL
  // A1:D1
  // ==========================================

  worksheet["!merges"] = [
    // ==========================================
    // JUDUL
    // A1:D1
    // ==========================================
    {
      s: { r: 0, c: 0 },
      e: { r: 0, c: 3 },
    },

    // ==========================================
    // FOOTER TOTAL
    // No. + Rumah Sakit + Jenis Kegiatan
    // A:C
    // ==========================================
    {
      s: { r: totalRow, c: 0 },
      e: { r: totalRow, c: 2 },
    },
  ];

  // ==========================================
  // LEBAR KOLOM
  // ==========================================

  worksheet["!cols"] = [
    { wch: 8 }, // No
    { wch: 30 }, // Rumah Sakit
    { wch: 45 }, // Jenis Kegiatan
    { wch: 15 }, // Jumlah
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

  for (let col = 0; col <= 3; col++) {
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

  for (let row = 6; row < totalRow; row++) {
    for (let col = 0; col <= 3; col++) {
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
          // No dan Jumlah = tengah
          // Rumah Sakit dan Jenis Kegiatan = kiri
          horizontal: col === 0 || col === 3 ? "center" : "left",
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

  for (let col = 0; col <= 3; col++) {
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
    { hpt: 35 }, // Row 6
  ];

  // ==========================================
  // WORKBOOK
  // ==========================================

  const workbook = XLSX.utils.book_new();

  XLSX.utils.book_append_sheet(workbook, worksheet, "RL311");

  // ==========================================
  // EXPORT
  // ==========================================

  XLSX.writeFile(workbook, `RL311-Gigi dan Mulut-${periode}.xlsx`);
};
