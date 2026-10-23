import * as XLSX from "xlsx-js-style";
import { MONTHS } from "../constants/date";

// ======================================================
// PERHITUNGAN TOTAL
// Dipertahankan untuk kompatibilitas fungsi lain.
// Tidak digunakan untuk menambahkan baris TOTAL Excel.
// ======================================================

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

// ======================================================
// FORMAT TANGGAL
// ======================================================

export const formatDate = (dateStr) => {
  if (!dateStr) return "-";

  const date = new Date(dateStr);

  if (Number.isNaN(date.getTime())) {
    return "-";
  }

  const day = date.getDate();

  const month =
    MONTHS.find((m) => m.value === String(date.getMonth() + 1))?.label ?? "-";

  const year = date.getFullYear();
  const hour = String(date.getHours()).padStart(2, "0");
  const minute = String(date.getMinutes()).padStart(2, "0");
  const second = String(date.getSeconds()).padStart(2, "0");

  return `${day} ${month} ${year}, ${hour}.${minute}.${second} WIB`;
};

// ======================================================
// FORMAT TAHUN LAPORAN
// ======================================================

const getTahunLaporan = (tahun) => {
  if (!tahun) return "-";

  const value = String(tahun).trim();

  if (/^\d{4}$/.test(value)) {
    return value;
  }

  if (/^\d{4}-\d{2}$/.test(value)) {
    return value.split("-")[0];
  }

  return value;
};

// ======================================================
// HELPER FIELD
// ======================================================

const getValue = (...values) =>
  values.find(
    (value) =>
      value !== undefined && value !== null && String(value).trim() !== "",
  ) ?? "-";

const getNamaReferensi = (value) => {
  if (value && typeof value === "object") {
    return getValue(value.nama, value.name, value.label);
  }

  return getValue(value);
};

// ======================================================
// EXPORT RL 3.17 EXCEL SATUSEHAT
// LAPORAN TAHUNAN
// ======================================================

export const exportRL317ExcelSatuSehat = (data = [], tahun) => {
  const tahunLaporan = getTahunLaporan(tahun);

  // ======================================================
  // HEADER EXCEL
  // ======================================================

  const excelData = [
    ["RL 3.17 Farmasi Pengadaan Obat - SATUSEHAT"],
    [],
    ["Periode Data"],
    [`Tahun : ${tahunLaporan}`],
    [],
    [
      "No.",
      "Kode RS",
      "Rumah Sakit",
      "Provinsi",
      "Kabupaten/Kota",
      "Golongan Obat",
      "Jumlah Item Obat",
      "Jumlah Item Obat yang Tersedia di Rumah Sakit",
    ],
  ];

  // ======================================================
  // DATA RUMAH SAKIT
  // ======================================================

  data.forEach((item, index) => {
    // Kode RS
    const kodeRS = getValue(
      item.kodeRs,
      item.kode_rs,
      item.kodeRS,
      item.kd_rs,
      item.kode_rumah_sakit,
      item.rumah_sakit?.kode_rs,
      item.organization?.kode_rs,
    );

    // Nama rumah sakit
    const namaRumahSakit = getValue(
      item.namaRs,
      item.organization_name,
      item.nama_rumah_sakit,
      item.nama_rs,
      item.rs_name,
      item.rumah_sakit?.nama,
      item.rumah_sakit?.nama_rs,
      typeof item.rumah_sakit === "string" ? item.rumah_sakit : undefined,
    );

    // Provinsi
    const provinsi = getNamaReferensi(
      getValue(
        item.provinsiNama,
        item.provinsi_nama,
        item.nama_provinsi,
        item.provinsi_name,
        item.provinsi?.nama,
        item.provinsi?.name,
        typeof item.provinsi === "string" ? item.provinsi : undefined,
      ),
    );

    // Kabupaten/Kota
    const kabupatenKota = getNamaReferensi(
      getValue(
        item.kabKotaNama,
        item.kab_kota_nama,
        item.kabupatenKotaNama,
        item.kabupaten_kota_nama,
        item.nama_kabupaten_kota,
        item.nama_kabupaten,
        item.nama_kota,
        item.kabupaten_kota_name,
        item.kabupaten_kota?.nama,
        item.kabupaten_kota?.name,
        item.kabupaten?.nama,
        item.kabupaten?.name,
        item.kota?.nama,
        item.kota?.name,
        typeof item.kabupaten_kota === "string"
          ? item.kabupaten_kota
          : undefined,
        typeof item.kabupaten === "string" ? item.kabupaten : undefined,
        typeof item.kota === "string" ? item.kota : undefined,
      ),
    );

    // Golongan obat
    const namaGolonganObat = getValue(
      item.nama_golongan_obat,
      item.golongan_obat?.nama,
      item.golongan_obat?.label,
      item.rl_tiga_titik_tujuh_belas_golongan_obat?.nama,
    );

    const jumlahItem = Number(item.jumlah_item_obat) || 0;
    const jumlahItemRS = Number(item.jumlah_item_obat_rs) || 0;

    excelData.push([
      index + 1,
      kodeRS,
      namaRumahSakit,
      provinsi,
      kabupatenKota,
      namaGolonganObat,
      jumlahItem,
      jumlahItemRS,
    ]);
  });

  // ======================================================
  // WORKSHEET
  // ======================================================

  const worksheet = XLSX.utils.aoa_to_sheet(excelData);

  // ======================================================
  // MERGE JUDUL
  // A1:H1
  // ======================================================

  worksheet["!merges"] = [
    {
      s: { r: 0, c: 0 },
      e: { r: 0, c: 7 },
    },
  ];

  // ======================================================
  // LEBAR KOLOM
  // ======================================================

  worksheet["!cols"] = [
    { wch: 8 }, // No.
    { wch: 16 }, // Kode RS
    { wch: 32 }, // Rumah Sakit
    { wch: 22 }, // Provinsi
    { wch: 25 }, // Kabupaten/Kota
    { wch: 40 }, // Golongan Obat
    { wch: 20 }, // Jumlah Item Obat
    { wch: 45 }, // Jumlah Item Obat yang Tersedia di RS
  ];

  // ======================================================
  // BORDER
  // ======================================================

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

  // ======================================================
  // STYLE HEADER TABEL
  // Baris Excel 6 (index 5)
  // Semua header rata tengah
  // ======================================================

  const headerRow = 5;

  for (let col = 0; col <= 7; col++) {
    const cellAddress = XLSX.utils.encode_cell({
      r: headerRow,
      c: col,
    });

    if (!worksheet[cellAddress]) continue;

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

  // ======================================================
  // STYLE DATA TABEL
  // Tidak ada baris TOTAL
  //
  // No.             : rata tengah
  // Kolom teks      : rata kiri
  // Dua kolom angka : rata kanan
  // ======================================================

  const dataStartRow = headerRow + 1;

  for (let row = dataStartRow; row < excelData.length; row++) {
    for (let col = 0; col <= 7; col++) {
      const cellAddress = XLSX.utils.encode_cell({
        r: row,
        c: col,
      });

      if (!worksheet[cellAddress]) continue;

      worksheet[cellAddress].s = {
        font: {
          name: "Calibri",
          sz: 12,
        },
        alignment: {
          horizontal: col === 0 ? "center" : col >= 6 ? "right" : "left",
          vertical: "center",
          wrapText: true,
        },
        border: thinBorder,
      };
    }
  }

  // ======================================================
  // STYLE JUDUL
  // ======================================================

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

  // ======================================================
  // STYLE PERIODE DATA
  // ======================================================

  ["A3", "A4"].forEach((cellAddress) => {
    if (!worksheet[cellAddress]) return;

    worksheet[cellAddress].s = {
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
  });

  // ======================================================
  // TINGGI BARIS
  // ======================================================

  worksheet["!rows"] = [
    { hpt: 25 }, // Row 1 - Judul
    { hpt: 10 }, // Row 2
    { hpt: 20 }, // Row 3 - Periode Data
    { hpt: 20 }, // Row 4 - Tahun
    { hpt: 10 }, // Row 5
    { hpt: 45 }, // Row 6 - Header
  ];

  // ======================================================
  // WORKBOOK
  // ======================================================

  const workbook = XLSX.utils.book_new();

  XLSX.utils.book_append_sheet(workbook, worksheet, "Farmasi Pengadaan Obat");

  // ======================================================
  // EXPORT EXCEL
  // ======================================================

  XLSX.writeFile(workbook, `RL317-Farmasi Pengadaan Obat-${tahunLaporan}.xlsx`);
};
