import {
  FaCalendarAlt,
  FaDatabase,
  FaInfoCircle,
  FaSlidersH,
  FaSyncAlt,
} from "react-icons/fa";
import { HiSaveAs } from "react-icons/hi";
import { formatDate } from "../../utils/rl317.utils";
import { SiMicrosoftexcel } from "react-icons/si";

const SatuSehatCardRow = ({ sync, manualSyncCooldown }) => {
  return (
    <div
      style={{
        display: "flex",
        gap: 14,
        marginBottom: 16,
        flexWrap: "wrap",
      }}
    >
      {/* Card 1: Keterangan Tombol */}
      <div
        style={{
          flex: "1 1 240px",
          border: "1.5px solid #3b82f6",
          borderRadius: 10,
          padding: "14px 16px",
          background: "#fff",
        }}
      >
        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: 7,
            marginBottom: 13,
          }}
        >
          <div
            style={{
              width: 22,
              height: 22,
              borderRadius: "50%",
              background: "#dbeafe",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              flexShrink: 0,
            }}
          >
            <FaInfoCircle size={12} color="#2563eb" />
          </div>
          <span
            style={{
              fontWeight: 700,
              fontSize: 13,
              color: "#2563eb",
              letterSpacing: 0.3,
            }}
          >
            KETERANGAN TOMBOL
          </span>
        </div>

        {[
          {
            icon: <FaSlidersH size={11} />,
            bg: "#1d4ed8",
            label: "FILTER",
            desc: "Menampilkan data dari database SIRS Online",
          },
          {
            icon: <FaSyncAlt size={11} />,
            bg: "#059669",
            label: "SYNC SATUSEHAT",
            desc: "Mengambil data terbaru dari SATUSEHAT",
          },
          {
            icon: <SiMicrosoftexcel size={12} />,
            bg: "#059669",
            label: "DOWNLOAD EXCEL",
            desc: "Mengunduh data hasil filter",
          },
        ].map((item) => (
          <div
            key={item.label}
            style={{
              display: "flex",
              alignItems: "flex-start",
              gap: 9,
              marginBottom: 9,
            }}
          >
            <div
              style={{
                background: item.bg,
                borderRadius: 5,
                width: 26,
                height: 26,
                flexShrink: 0,
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                color: "#fff",
              }}
            >
              {item.icon}
            </div>
            <div style={{ fontSize: 12, color: "#475569", lineHeight: 1.45 }}>
              <strong style={{ fontWeight: 700 }}>{item.label}</strong>
              {" : "}
              {item.desc}
            </div>
          </div>
        ))}
      </div>

      {/* Card 2: Status Sinkronisasi */}
      <div
        style={{
          flex: "1 1 210px",
          border: "1.5px solid #e2e8f0",
          borderRadius: 10,
          padding: "14px 16px",
          background: "#fff",
        }}
      >
        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: 7,
            marginBottom: 14,
          }}
        >
          <FaSyncAlt size={15} color="#059669" />
          <span
            style={{
              fontWeight: 700,
              fontSize: 13,
              color: "#059669",
              letterSpacing: 0.3,
            }}
          >
            STATUS SINKRONISASI
          </span>
        </div>

        <div style={{ display: "flex", flexDirection: "column", gap: 11 }}>
          <div style={{ display: "flex", alignItems: "center", gap: 9 }}>
            <div
              style={{
                width: 28,
                height: 28,
                borderRadius: 6,
                background: "#f1f5f9",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                flexShrink: 0,
              }}
            >
              <FaCalendarAlt size={13} color="#64748b" />
            </div>
            <span style={{ fontSize: 12, color: "#475569" }}>
              Terakhir Sync&nbsp;:&nbsp;
              <strong>{sync.lastSync ? formatDate(sync.lastSync) : "-"}</strong>
            </span>
          </div>
          <div style={{ display: "flex", alignItems: "center", gap: 9 }}>
            <div
              style={{
                width: 28,
                height: 28,
                borderRadius: 6,
                background: "#f1f5f9",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                flexShrink: 0,
              }}
            >
              <span style={{ fontSize: 15, lineHeight: 1, color: "#64748b" }}>
                ⏱
              </span>
            </div>
            <span style={{ fontSize: 12, color: "#475569" }}>
              Interval Sync&nbsp;:&nbsp;
              <strong>{manualSyncCooldown} Menit</strong>
            </span>
          </div>
        </div>
      </div>

      {/* Card 3: Sumber Data */}
      <div
        style={{
          flex: "1 1 180px",
          border: "1.5px solid #e2e8f0",
          borderRadius: 10,
          padding: "14px 16px",
          background: "#fff",
          display: "flex",
          flexDirection: "column",
        }}
      >
        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: 7,
            marginBottom: 12,
          }}
        >
          <FaDatabase size={14} color="#3b82f6" />
          <span
            style={{
              fontWeight: 700,
              fontSize: 13,
              color: "#3b82f6",
              letterSpacing: 0.3,
            }}
          >
            SUMBER DATA
          </span>
        </div>
        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: 14,
            flex: 1,
          }}
        >
          <p
            style={{
              fontSize: 12,
              color: "#475569",
              margin: 0,
              flex: 1,
              lineHeight: 1.6,
            }}
          >
            Data yang ditampilkan bersumber dari  <strong>SATUSEHAT</strong>{" "}
            yang sudah tersimpan dalam database <strong>SIRS</strong>.
          </p>
          <div style={{ position: "relative", flexShrink: 0 }}>
            <FaDatabase size={38} color="#bfdbfe" />
            <div
              style={{
                position: "absolute",
                bottom: -3,
                right: -6,
                background: "#059669",
                color: "#fff",
                borderRadius: "50%",
                width: 18,
                height: 18,
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                fontSize: 11,
                fontWeight: 700,
                lineHeight: 1,
              }}
            >
              ✓
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default SatuSehatCardRow;
