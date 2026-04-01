import { MemoryRouter, Route, Routes, Navigate } from "react-router-dom";
import "bootstrap/dist/css/bootstrap.min.css";
import Login from "./components/Login/Login";
import { CSRFTokenProvider } from "./components/Context/CSRFTokenContext.js";

import SSO_Login from "./components/Login/Sso_Login";
import SSO_Verif from "./components/Login/SSO_Verif";
import Layout from "./components/Layout/Layout";
import Footer from "./components/Footer/Footer";

// User
import FormUbahPassword from "./components/User/FormUbahPassword";
import FormTambahUser from "./components/User/FormTambahUser";

// RL 3.2
import RL31 from "./components/RL31/RL31.js";

// RL 3.2
import RL32 from "./components/RL32/RL32.js";
import FormTambahRL32 from "./components/RL32/FormTambahRL32";
import FormUbahRL32 from "./components/RL32/FormUbahRL32";

// RL 3.3
import RL33 from "./components/RL33/RL33.js";
import FormTambahRL33 from "./components/RL33/FormTambahRL33";
import FormUbahRL33 from "./components/RL33/FormUbahRL33";

// RL 3.4
import BrandaRL34 from "./components/RL34/BrandaRL34.js";
import SatuSehatRL34 from "./components/RL34/SatuSehatRL34.js";
import RL34 from "./components/RL34/RL34.js";
import FormTambahRL34 from "./components/RL34/FormTambahRL34";
import FormUbahRL34 from "./components/RL34/FormUbahRL34";
import TabMenu34 from "./components/RL34/RL34danSatuSehat.js";

// RL 3.5
import RL35 from "./components/RL35/RL35.js";
import FormTambahRL35 from "./components/RL35/FormTambahRL35";
import FormUbahRL35 from "./components/RL35/FormUbahRL35";

// RL 3.6
import RL36 from "./components/RL36/RL36.js";
import FormTambahRL36 from "./components/RL36/FormTambahRL36";
import FormUbahRL36 from "./components/RL36/FormUbahRL36";

// RL 3.7
import RL37 from "./components/RL37/RL37.js";
import FormTambahRL37 from "./components/RL37/FormTambahRL37";
import FormUbahRL37 from "./components/RL37/FormUbahRL37";

// RL 3.8
import RL38 from "./components/RL38/RL38";
import FormTambahRL38 from "./components/RL38/FormTambahRL38";
import { FormEditRL38 } from "./components/RL38/FormUbahRL38";

// RL 3.9
import RL39 from "./components/RL39/RL39.js";
import FormTambahRL39 from "./components/RL39/FormTambahRL39.js";
import FormUbahRL39 from "./components/RL39/FormUbahRL39.js";

// RL 3.10
import RL310 from "./components/RL310/RL310.js";
import FormEditRL310 from "./components/RL310/FormEditRL310";
import FormTambahRL310 from "./components/RL310/FormTambahRL310";

// RL 3.11
import RL311 from "./components/RL311/RL311.js";
import FormTambahRL311 from "./components/RL311/FormTambahRL311";
import FormEditRL311 from "./components/RL311/FormUbahRL311";

// RL 3.12
import RL312 from "./components/RL312/RL312.js";
import FormTambahRL312 from "./components/RL312/FormTambahRL312";
import FormEditRL312 from "./components/RL312/FormUbahRL312";

// RL 3.13
import RL313 from "./components/RL313/RL313.js";
import FormTambahRL313 from "./components/RL313/FormTambahRL313";
import FormEditRL313 from "./components/RL313/FormUbahRL313";

// RL 3.14
import RL314 from "./components/RL314/RL314.js";
import FormTambahRL314 from "./components/RL314/FormTambahRL314";
import FormUbahRL314 from "./components/RL314/FormUbahRL314";

// RL 3.15
import RL315 from "./components/RL315/RL315.js";
import FormTambahRL315 from "./components/RL315/FormTambahRL315";
import FormUbahRL315 from "./components/RL315/FormUbahRL315";

// RL 3.16
import RL316 from "./components/RL316/RL316.js";
import FormTambahRL316 from "./components/RL316/FormTambahRL316";
import FormUbahRL316 from "./components/RL316/FormUbahRL316";

// RL 3.17
import RL317 from "./components/RL317/RL317";
import FormTambahRL317 from "./components/RL317/FormTambahRL317";
import FormUbahRL317 from "./components/RL317/FormUbahRL317";

// RL 3.18
import RL318 from "./components/RL318/RL318";
import FormTambahRL318 from "./components/RL318/FormTambahRL318";
import FormUbahRL318 from "./components/RL318/FormUbahRL318";

// RL 3.19
import RL319 from "./components/RL319/RL319.js";
import FormTambahRL319 from "./components/RL319/FormTambahRL319";
import FormUbahRL319 from "./components/RL319/FormUbahRL319";

// RL 4.1
import RL41 from "./components/RL41/RL41";
import FormTambahRL41 from "./components/RL41/FormTambahRL41";
import { FormUbahRL41 } from "./components/RL41/FormUbahRL41";

// RL 4.2
import RL42 from "./components/RL42/RL42.js";

// RL 4.3
import RL43 from "./components/RL43/RL43.js";

// RL 5.1
import MenuRL51 from "./components/RL51/MenuRL51.js";
import RL51SATUSEHAT from "./components/RL51/RL51SatuSehat.js";
import RL51 from "./components/RL51/RL51.js";
import FormTambahRL51 from "./components/RL51/FormTambahRL51";
import FormEditRL51 from "./components/RL51/FormUbahRL51";
import RL51danSatuSehat from "./components/RL51/RL51danSatuSehat.js";

// RL 5.2
import RL52 from "./components/RL52/RL52.js";

// RL 5.3
import RL53 from "./components/RL53/RL53.js";

// Absensi
import Absensi from "./components/Absensi/absensi.js";

// MAINTENANCE
import MaintenancePage from "./components/MaintenancePage/MaintenancePage.js";

function App() {
  return (
    <CSRFTokenProvider>
      <MemoryRouter initialEntries={["/beranda"]}>
        <Routes>
          <Route path="/" element={<SSO_Login />} />
          <Route path="/verif" element={<SSO_Verif />} />
          <Route element={<Layout />}>
            <Route path="/beranda" element={null} />
            <Route path="/user/tambahuser" element={<FormTambahUser />} />
            <Route path="/user/ubahpassword" element={<FormUbahPassword />} />
            <Route path="/rl31" element={<RL31 />} />

            <Route path="/rl32" element={<RL32 />} />
            <Route path="/rl32/tambah" element={<FormTambahRL32 />} />
            <Route path="/rl32/ubah/:id" element={<FormUbahRL32 />} />
            <Route path="/rl33" element={<RL33 />} />
            <Route path="/rl33/tambah" element={<FormTambahRL33 />} />
            <Route path="/rl33/ubah/:id" element={<FormUbahRL33 />} />

            <Route path="/brandarl34" element={<TabMenu34 />} />
            <Route path="/satusehatrl34" element={<SatuSehatRL34 />} />
            <Route path="/rl34" element={<RL34 />} />
            <Route path="/rl34/tambah" element={<FormTambahRL34 />} />
            <Route path="/rl34/ubah/:id" element={<FormUbahRL34 />} />

            <Route path="/rl35" element={<RL35 />} />
            <Route path="/rl35/tambah" element={<FormTambahRL35 />} />
            <Route path="/rl35/ubah/:id" element={<FormUbahRL35 />} />
            <Route path="/rl36" element={<RL36 />} />
            <Route path="/rl36/tambah" element={<FormTambahRL36 />} />
            <Route path="/rl36/ubah/:id" element={<FormUbahRL36 />} />

            <Route path="/rl37" element={<RL37 />} />
            <Route path="/rl37/tambah" element={<FormTambahRL37 />} />
            <Route path="/rl37/ubah/:id" element={<FormUbahRL37 />} />
            <Route path="/rl38" element={<RL38 />} />
            <Route path="/rl38/tambah" element={<FormTambahRL38 />} />
            <Route path="/rl38/ubah/:id" element={<FormEditRL38 />} />

            <Route path="/rl39" element={<RL39 />} />
            <Route path="/rl39/tambah" element={<FormTambahRL39 />} />
            <Route path="/rl39/ubah/:id" element={<FormUbahRL39 />} />
            <Route path="/rl310" element={<RL310 />} />
            <Route path="/rl310/tambah" element={<FormTambahRL310 />} />
            <Route path="/rl310/ubah/:id" element={<FormEditRL310 />} />

            <Route path="/RL311" element={<RL311 />} />
            <Route path="/rl311/tambah" element={<FormTambahRL311 />} />
            <Route path="/rl311/edit/:id" element={<FormEditRL311 />} />
            <Route path="/RL312" element={<RL312 />} />
            <Route path="/rl312/tambah" element={<FormTambahRL312 />} />
            <Route path="/rl312/edit/:id" element={<FormEditRL312 />} />
            <Route path="/RL313" element={<RL313 />} />
            <Route path="/rl313/tambah" element={<FormTambahRL313 />} />
            <Route path="/rl313/edit/:id" element={<FormEditRL313 />} />
            <Route path="/RL314" element={<RL314 />} />
            <Route path="/rl314/tambah" element={<FormTambahRL314 />} />
            <Route path="/rl314/ubah/:id" element={<FormUbahRL314 />} />
            <Route path="/rl315" element={<RL315 />} />
            <Route path="/rl315/tambah" element={<FormTambahRL315 />} />
            <Route path="/rl315/ubah/:id" element={<FormUbahRL315 />} />
            <Route path="/RL316" element={<RL316 />} />
            <Route path="/rl316/tambah" element={<FormTambahRL316 />} />
            <Route path="/rl316/ubah/:id" element={<FormUbahRL316 />} />

            <Route path="/rl317" element={<RL317 />} />
            <Route path="/rl317/tambah" element={<FormTambahRL317 />} />
            <Route path="/rl317/ubah/:id" element={<FormUbahRL317 />} />
            <Route path="/rl318" element={<RL318 />} />
            <Route path="/rl318/tambah" element={<FormTambahRL318 />} />
            <Route path="/rl318/ubah/:id" element={<FormUbahRL318 />} />
            <Route path="/rl319" element={<RL319 />} />
            <Route path="/rl319/tambah" element={<FormTambahRL319 />} />
            <Route path="/rl319/ubah/:id" element={<FormUbahRL319 />} />

            <Route path="/rl41" element={<RL41 />} />
            <Route path="/rl41/tambah" element={<FormTambahRL41 />} />
            <Route path="/rl41/ubah/:id" element={<FormUbahRL41 />} />
            <Route path="/rl42" element={<RL42 />} />
            <Route path="/rl43" element={<RL43 />} />

            <Route path="/MENURL51" element={<RL51danSatuSehat />} />
            {/* <Route path="/RL51" element={<RL51 />} />
            <Route path="/RL51SATUSEHAT" element={<RL51SATUSEHAT />} /> */}
            <Route path="/RL51" element={<Navigate to="/MENURL51" replace />} />
            <Route
              path="/RL51SATUSEHAT"
              element={<Navigate to="/MENURL51" replace />}
            />
            <Route path="/rl51/tambah" element={<FormTambahRL51 />} />
            <Route path="/rl51/edit/:id" element={<FormEditRL51 />} />
            <Route path="/rl52" element={<RL52 />} />
            <Route path="/rl53" element={<RL53 />} />
            <Route path="/absensi" element={<Absensi />} />
          </Route>
          <Route path="*" element={<PageNotFound />} />
        </Routes>
      </MemoryRouter>
    </CSRFTokenProvider>
  );
}

function PageNotFound() {
  return (
    <div className="container mt-3">
      <h3>404 page not found</h3>
      <p>We are sorry but the page you are looking for does not exist.</p>
    </div>
  );
}

export default App;
