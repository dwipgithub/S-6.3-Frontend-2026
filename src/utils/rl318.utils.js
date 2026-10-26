import * as XLSX from "xlsx-js-style";

// ==========================================================
// HITUNG TOTAL
// ==========================================================

export const calculateTotals = (data = []) => {
  return data.reduce(
    (acc, item) => {
      acc.jumlahRawatInap += Number(item.rawat_inap) || 0;
      acc.jumlahRawatJalan += Number(item.rawat_jalan) || 0;
      acc.jumlahIgd += Number(item.igd) || 0;
      acc.jumlahTotalResep += Number(item.total_resep) || 0;

      return acc;
    },
    {
      jumlahRawatInap: 0,
      jumlahIgd: 0,
      jumlahRawatJalan: 0,
      jumlahTotalResep: 0,
    },
  );
};

// ==========================================================
// AMBIL NILAI DARI FIELD BERTINGKAT
// ==========================================================

const getNestedValue = (item, path) => {
  return path.split(".").reduce((obj, key) => {
    if (obj === null || obj === undefined) return undefined;

    // Mendukung variasi huruf besar/kecil pada nama field.
    if (Object.prototype.hasOwnProperty.call(obj, key)) {
      return obj[key];
    }

    const actualKey = Object.keys(obj).find(
      (existingKey) => existingKey.toLowerCase() === key.toLowerCase(),
    );

    return actualKey ? obj[actualKey] : undefined;
  }, item);
};

// ==========================================================
// NORMALISASI NILAI TEKS
// Mendukung field berbentuk string atau objek
// ==========================================================

const normalizeText = (value) => {
  if (value === null || value === undefined) return undefined;

  if (typeof value === "string" || typeof value === "number") {
    const text = String(value).trim();

    if (!text || text === "-" || text.toLowerCase() === "null") {
      return undefined;
    }

    return text;
  }

  if (typeof value === "object") {
    const nestedFields = [
      "nama",
      "name",
      "label",
      "nama_provinsi",
      "provinsiNama",
      "nama_kabupaten_kota",
      "kabKotaNama",
      "nama_kabupaten",
      "nama_kota",
      "kabupaten_kota",
      "provinsi",
      "kabupaten",
      "kota",
      "value",
    ];

    for (const field of nestedFields) {
      const nestedValue = getNestedValue(value, field);

      if (nestedValue !== undefined && nestedValue !== value) {
        const normalized = normalizeText(nestedValue);

        if (normalized) return normalized;
      }
    }
  }

  return undefined;
};

// ==========================================================
// AMBIL FIELD PERTAMA YANG MEMILIKI NILAI
// ==========================================================

const getValue = (item, fields, fallback = "-") => {
  for (const field of fields) {
    const value = getNestedValue(item, field);
    const normalized = normalizeText(value);

    if (normalized !== undefined) {
      return normalized;
    }
  }

  return fallback;
};

// ==========================================================
// NORMALISASI TAHUN LAPORAN
// ==========================================================

const getTahunLaporan = (tahun) => {
  if (!tahun) return "-";

  const value = String(tahun);
  const match = value.match(/\b\d{4}\b/);

  return match ? match[0] : value;
};

// ==========================================================
// EXPORT EXCEL RL 3.18 SATUSEHAT
// ==========================================================

export const exportRL318ExcelSatuSehat = (data = [], tahun) => {
  const tahunLaporan = getTahunLaporan(tahun);

  const excelData = [
    ["RL 3.18 Farmasi Resep - SATUSEHAT"],
    [],
    ["Periode Data"],
    [`Tahun : ${tahunLaporan}`],
    [],
    [
      "No",
      "Kode RS",
      "Rumah Sakit",
      "Provinsi",
      "Kabupaten/Kota",
      "Golongan Obat",
      "Rawat Jalan",
      "IGD",
      "Rawat Inap",
      "Total Resep",
    ],
  ];

  data.forEach((item, index) => {
    const jumlahRawatJalan = Number(item.rawat_jalan) || 0;
    const jumlahIgd = Number(item.igd) || 0;
    const jumlahRawatInap = Number(item.rawat_inap) || 0;
    const jumlahTotalResep = Number(item.total_resep) || 0;

    // ------------------------------------------------------
    // KODE RS
    // ------------------------------------------------------

    const kodeRS = getValue(item, [
      "kodeRs",
      "kode_rs",
      "kodeRumahSakit",
      "kode_rumah_sakit",
      "kode_satker",
      "kode_baru_faskes",
      "rumahSakit.kodeRs",
      "rumahSakit.kode_rs",
      "organization_id",
    ]);

    // ------------------------------------------------------
    // NAMA RUMAH SAKIT
    // ------------------------------------------------------

    const namaRumahSakit = getValue(item, [
      "namaRs",
      "nama_rs",
      "namaRumahSakit",
      "nama_rumah_sakit",
      "nama",
      "organization_name",
      "rumah_sakit",
      "rs_name",
      "rumahSakit.namaRs",
      "rumahSakit.nama",
    ]);

    // ------------------------------------------------------
    // PROVINSI
    // ------------------------------------------------------

    const namaProvinsi = getValue(item, [
      "provinsiNama",
      "namaProvinsi",
      "nama_provinsi",
      "provinsi_nama",
      "provinsi_name",
      "province_name",
      "provinceName",
      "provinsi.nama",
      "provinsi.name",
      "provinsi.label",
      "provinsi.value",
      "province.nama",
      "province.name",
      "wilayah.provinsi",
      "wilayah.provinsiNama",
      "wilayah.provinsi.nama",
      "alamat.provinsi",
      "alamat.provinsi.nama",
      "rumahSakit.provinsiNama",
      "rumahSakit.nama_provinsi",
      "rumahSakit.provinsi.nama",
      "faskes.provinsiNama",
      "faskes.provinsi.nama",
    ]);

    // ------------------------------------------------------
    // KABUPATEN / KOTA
    // ------------------------------------------------------

    const namaKabupatenKota = getValue(item, [
      "kabKotaNama",
      "kabupatenKotaNama",
      "namaKabupatenKota",
      "nama_kabupaten_kota",
      "kabupaten_kota_nama",
      "kabupatenKota",
      "kabupaten_kota",
      "nama_kabupaten",
      "nama_kota",
      "kabupatenNama",
      "kotaNama",
      "kabupaten_nama",
      "kota_nama",
      "kabupaten_kota.nama",
      "kabupaten_kota.name",
      "kabupatenKota.nama",
      "kabupatenKota.name",
      "kabupaten.nama",
      "kabupaten.name",
      "kota.nama",
      "kota.name",
      "wilayah.kabKotaNama",
      "wilayah.kabupaten_kota",
      "wilayah.kabupatenKota",
      "wilayah.kabupaten_kota.nama",
      "wilayah.kabupaten.nama",
      "wilayah.kota.nama",
      "alamat.kabKotaNama",
      "alamat.kabupaten_kota",
      "alamat.kabupaten_kota.nama",
      "rumahSakit.kabKotaNama",
      "rumahSakit.nama_kabupaten_kota",
      "rumahSakit.kabupaten_kota",
      "rumahSakit.kabupaten_kota.nama",
      "faskes.kabKotaNama",
      "faskes.kabupaten_kota.nama",
    ]);

    // ------------------------------------------------------
    // GOLONGAN OBAT
    // ------------------------------------------------------

    const namaGolonganObat = getValue(item, [
      "nama_golongan_obat",
      "golonganObat.nama",
      "golonganObat.name",
      "rl_tiga_titik_delapan_belas_golongan_obat.nama",
      "golongan_obat.nama",
      "golongan_obat.name",
      "golongan_obat",
    ]);

    excelData.push([
      index + 1,
      kodeRS,
      namaRumahSakit,
      namaProvinsi,
      namaKabupatenKota,
      namaGolonganObat,
      jumlahRawatJalan,
      jumlahIgd,
      jumlahRawatInap,
      jumlahTotalResep,
    ]);
  });

  // ==========================================================
  // WORKSHEET
  // ==========================================================

  const worksheet = XLSX.utils.aoa_to_sheet(excelData);

  // ==========================================================
  // MERGE JUDUL
  // ==========================================================

  worksheet["!merges"] = [
    {
      s: { r: 0, c: 0 },
      e: { r: 0, c: 9 },
    },
  ];

  // ==========================================================
  // LEBAR KOLOM
  // ==========================================================

  worksheet["!cols"] = [
    { wch: 8 },
    { wch: 18 },
    { wch: 32 },
    { wch: 22 },
    { wch: 25 },
    { wch: 35 },
    { wch: 15 },
    { wch: 12 },
    { wch: 15 },
    { wch: 15 },
  ];

  // ==========================================================
  // BORDER
  // ==========================================================

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

  // ==========================================================
  // STYLE HEADER
  // Baris 6 (index 5)
  // Semua header rata tengah
  // ==========================================================

  for (let col = 0; col <= 9; col++) {
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

  // ==========================================================
  // STYLE DATA
  // Mulai baris 7 (index 6)
  //
  // No                  : rata tengah
  // Kolom teks          : rata kiri
  // Rawat Jalan s.d.
  // Total Resep         : rata kanan
  // ==========================================================

  for (let row = 6; row < excelData.length; row++) {
    for (let col = 0; col <= 9; col++) {
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

  // ==========================================================
  // STYLE JUDUL
  // ==========================================================

  if (worksheet["A1"]) {
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
  }

  // ==========================================================
  // STYLE PERIODE
  // ==========================================================

  if (worksheet["A3"]) {
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
  }

  if (worksheet["A4"]) {
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
  }

  // ==========================================================
  // TINGGI BARIS
  // ==========================================================

  worksheet["!rows"] = [
    { hpt: 25 },
    { hpt: 10 },
    { hpt: 20 },
    { hpt: 20 },
    { hpt: 15 },
    { hpt: 40 },
  ];

  // ==========================================================
  // WORKBOOK
  // ==========================================================

  const workbook = XLSX.utils.book_new();

  XLSX.utils.book_append_sheet(workbook, worksheet, "Farmasi Resep");

  // ==========================================================
  // EXPORT
  // ==========================================================

  XLSX.writeFile(workbook, `RL318-Farmasi Resep-${tahunLaporan}.xlsx`);
};
