"use client";

import Link from "next/link";
import { useState, useEffect } from "react";
import type { CountryItem, StateItem } from "../../lib/db-locations";

interface ApplicationData {
  id: number;
  legal_name: string;
  applicant_type: string;
  company_number: string | null;
  country_code: string;
  state: string | null;
  town: string | null;
  postcode: string | null;
  currency: string;
  address_line1: string | null;
  address_line2: string | null;
  address_line3: string | null;
  phone: string;
  website_url: string | null;
  social_url: string | null;
  market_focus: string;
  audience_description: string;
  promotion_method: string;
  status: string;
  id_doc_path: string | null;
  holding_id_path: string | null;
  affiliate_code: string | null;
  upline_affiliate_code: string | null;
  flag_id_doc_unclear?: number;
  flag_holding_id_unaccepted?: number;
  decision_note?: string | null;
}

export default function ProfileEditForm({
  user,
  application,
  pendingUpdate,
  countries,
  states,
  error,
  success,
}: {
  user: { id: number; full_name: string; email: string };
  application?: ApplicationData;
  pendingUpdate?: any;
  countries: CountryItem[];
  states: StateItem[];
  error?: string;
  success?: string;
}) {
  const initialCountryCode = application?.country_code || countries[0]?.code || "MY";
  const [countryCode, setCountryCode] = useState(initialCountryCode);

  const selectedCountry = countries.find((c) => c.code === countryCode) || countries[0];
  const countryStates = states.filter((s) => s.country_code === countryCode);

  const [stateVal, setStateVal] = useState(application?.state || "");
  const [applicantType, setApplicantType] = useState(application?.applicant_type || "INDIVIDUAL");

  // Password & Confirm Password immediate validation
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [passwordTouched, setPasswordTouched] = useState(false);
  const [confirmPasswordTouched, setConfirmPasswordTouched] = useState(false);
  const [passwordError, setPasswordError] = useState<{ en: string; ms: string } | null>(null);
  const [confirmPasswordError, setConfirmPasswordError] = useState<{ en: string; ms: string } | null>(null);

  const handleCountryChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const newCountryCode = e.target.value;
    setCountryCode(newCountryCode);

    const newCountryStates = states.filter((s) => s.country_code === newCountryCode);
    const isValidStateForNewCountry = newCountryStates.some((s) => s.name === stateVal);

    if (!isValidStateForNewCountry) {
      setStateVal("");
    }
  };

  useEffect(() => {
    if (!passwordTouched && !confirmPasswordTouched) return;

    if (password.length > 0 && password.length < 12) {
      setPasswordError({
        en: "Password must be at least 12 characters",
        ms: "Kata laluan mestilah sekurang-kurangnya 12 aksara",
      });
    } else {
      setPasswordError(null);
    }

    if (confirmPasswordTouched || confirmPassword.length > 0) {
      if (confirmPassword !== password) {
        setConfirmPasswordError({
          en: "Passwords do not match",
          ms: "Kata laluan tidak sepadan",
        });
      } else {
        setConfirmPasswordError(null);
      }
    } else {
      setConfirmPasswordError(null);
    }
  }, [password, confirmPassword, passwordTouched, confirmPasswordTouched]);

  const canEditUpline =
    application &&
    (application.status === "CORRECTION_REQUIRED" || application.status === "INFORMATION_REQUIRED");

  const canEditUploads =
    application &&
    (application.status === "APPROVED" ||
      application.status === "CORRECTION_REQUIRED" ||
      application.status === "INFORMATION_REQUIRED");

  return (
    <form action="/foliodesk/api/profile/update" method="post" encType="multipart/form-data" className="form-card" style={{ maxWidth: "100%" }}>
      {error && <p className="notice error" style={{ marginBottom: 20 }}>{error}</p>}
      {success && <p className="notice success" style={{ marginBottom: 20 }}>{success}</p>}

      {/* REVIEWER REMARKS NOTIFICATION BANNER */}
      {application && (application.status === "CORRECTION_REQUIRED" || application.status === "INFORMATION_REQUIRED") && (
        <div style={{ background: "#fffbeb", border: "1px solid #fde68a", borderRadius: 8, padding: "14px 18px", marginBottom: 24 }}>
          <h4 style={{ margin: "0 0 6px", color: "#92400e", display: "flex", alignItems: "center", gap: 6 }}>
            <span>⚠️</span> Reviewer Feedback ({application.status.replaceAll("_", " ")})
          </h4>
          {application.decision_note && (
            <p style={{ margin: 0, color: "#78350f", fontSize: 14 }}>
              <b>Remarks:</b> {application.decision_note}
            </p>
          )}
        </div>
      )}

      {/* BILINGUAL REQUIRED FIELDS LEGEND */}
      <div
        style={{
          background: "#f8fafc",
          border: "1px solid #e2e8f0",
          borderRadius: 8,
          padding: "10px 16px",
          marginBottom: 20,
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          flexWrap: "wrap",
          gap: 8,
        }}
      >
        <span style={{ fontSize: 13, color: "#475569", fontWeight: 600 }}>
          <span style={{ color: "#dc2626", fontWeight: 800, fontSize: 16 }}>*</span> Fields marked with asterisk are <b>Required</b> / Medan bertanda bintang adalah <b>Wajib</b>.
        </span>
        <span style={{ fontSize: 12, color: "#64748b" }}>Bilingual Form (EN / BM)</span>
      </div>

      <div className="form-grid">
        <div className="field full">
          <h3 style={{ fontSize: 20, marginBottom: 4 }}>1. Account Credentials / Kredensial Akaun</h3>
          <p style={{ color: "#666", fontSize: 14, margin: 0 }}>Update your name, email, or set a new password / Kemas kini nama, e-mel atau kata laluan.</p>
        </div>

        <div className="field">
          <label htmlFor="fullName" style={{ fontWeight: 600 }}>
            Account Full Name / <span style={{ color: "#475569", fontWeight: 500 }}>Nama Penuh Akaun</span> <span style={{ color: "#dc2626" }}>*</span>
          </label>
          <input id="fullName" name="fullName" defaultValue={user.full_name} required />
        </div>
        <div className="field">
          <label htmlFor="email" style={{ fontWeight: 600 }}>
            Email Address / <span style={{ color: "#475569", fontWeight: 500 }}>Alamat E-mel</span> <span style={{ color: "#dc2626" }}>*</span>
          </label>
          <input id="email" name="email" type="email" defaultValue={user.email} required readOnly style={{ background: "#f8fafc" }} />
        </div>

        <div className="field">
          <label htmlFor="password" style={{ fontWeight: 600 }}>
            New Password / <span style={{ color: "#475569", fontWeight: 500 }}>Kata Laluan Baharu</span>{" "}
            <small style={{ fontWeight: "normal", color: "#64748b" }}>(Leave blank to keep current / Biarkan kosong jika kekal)</small>
          </label>
          <input
            id="password"
            name="password"
            type="password"
            minLength={12}
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            onBlur={() => setPasswordTouched(true)}
            placeholder="••••••••••••"
            style={{
              borderColor: passwordError ? "#dc2626" : password.length >= 12 ? "#16a34a" : undefined,
            }}
          />
          {passwordError && (
            <div style={{ marginTop: 4 }}>
              <span style={{ color: "#dc2626", fontSize: 12, fontWeight: 600, display: "block" }}>
                ⚠️ {passwordError.en}
              </span>
              <span style={{ color: "#991b1b", fontSize: 11, display: "block" }}>
                {passwordError.ms}
              </span>
            </div>
          )}
        </div>

        <div className="field">
          <label htmlFor="confirmPassword" style={{ fontWeight: 600 }}>
            Confirm New Password / <span style={{ color: "#475569", fontWeight: 500 }}>Sahkan Kata Laluan Baharu</span>
          </label>
          <input
            id="confirmPassword"
            name="confirmPassword"
            type="password"
            minLength={12}
            value={confirmPassword}
            onChange={(e) => setConfirmPassword(e.target.value)}
            onBlur={() => setConfirmPasswordTouched(true)}
            placeholder="••••••••••••"
            style={{
              borderColor: confirmPasswordError ? "#dc2626" : confirmPassword && !confirmPasswordError ? "#16a34a" : undefined,
            }}
          />
          {confirmPasswordError && (
            <div style={{ marginTop: 4, padding: "6px 10px", background: "#fef2f2", border: "1px solid #fca5a5", borderRadius: 6 }}>
              <span style={{ color: "#dc2626", fontSize: 13, fontWeight: 700, display: "block" }}>
                ⚠️ {confirmPasswordError.en}
              </span>
              <span style={{ color: "#991b1b", fontSize: 12, display: "block" }}>
                {confirmPasswordError.ms}
              </span>
            </div>
          )}
        </div>

        {application && (
          <>
            <div className="field full" style={{ marginTop: 24, paddingTop: 16, borderTop: "1px solid var(--border,#e2e8f0)" }}>
              <h3 style={{ fontSize: 20 }}>2. Affiliate Profile & Location Details / Butiran Profil & Lokasi Ahli Gabungan</h3>
            </div>

            <div className="field">
              <label htmlFor="applicantType" style={{ fontWeight: 600 }}>
                Applicant Type / <span style={{ color: "#475569", fontWeight: 500 }}>Jenis Pemohon</span> <span style={{ color: "#dc2626" }}>*</span>
              </label>
              <select
                id="applicantType"
                name="applicantType"
                value={applicantType}
                onChange={(e) => setApplicantType(e.target.value)}
              >
                <option value="INDIVIDUAL">Individual / Individu</option>
                <option value="COMPANY">Company / Syarikat</option>
              </select>
            </div>

            <div className="field">
              <label htmlFor="legalName" style={{ fontWeight: 600 }}>
                {applicantType === "INDIVIDUAL" ? "Legal Name (as per ID) / Nama Rasmi (mengikut KP)" : "Registered Company Name / Nama Syarikat Berdaftar"} <span style={{ color: "#dc2626" }}>*</span>
              </label>
              <input
                id="legalName"
                name="legalName"
                defaultValue={application.legal_name}
                required
                placeholder={applicantType === "INDIVIDUAL" ? "Your legal name on ID / Passport" : "e.g. Acme Builders Sdn Bhd"}
              />
            </div>

            <div className="field">
              <label htmlFor="companyNumber" style={{ fontWeight: 600 }}>
                {applicantType === "INDIVIDUAL" ? "Personal ID / NRIC / Passport No. / No. KP" : "Company Registration Number / No. Pendaftaran"} <span style={{ color: "#dc2626" }}>*</span>
              </label>
              <input
                id="companyNumber"
                name="companyNumber"
                defaultValue={application.company_number || ""}
                placeholder={applicantType === "INDIVIDUAL" ? "e.g. 900101-14-1234 or Passport No." : "e.g. SSM / UEN Registration No."}
              />
            </div>
            <div className="field">
              <label htmlFor="phone" style={{ fontWeight: 600 }}>
                Telephone / <span style={{ color: "#475569", fontWeight: 500 }}>No. Telefon</span> <span style={{ color: "#dc2626" }}>*</span>
              </label>
              <input id="phone" name="phone" defaultValue={application.phone} required />
            </div>

            {/* UPLINE REFERRAL CODE */}
            <div className="field full">
              <label htmlFor="uplineCode" style={{ fontWeight: 600 }}>
                Upline Affiliate ID / Referral Code / <span style={{ color: "#475569", fontWeight: 500 }}>ID Rujukan Upline</span>{" "}
                <small style={{ fontWeight: "normal", color: "#64748b" }}>(Optional / Pilihan)</small>
              </label>
              {canEditUpline ? (
                <>
                  <input
                    id="uplineCode"
                    name="uplineCode"
                    defaultValue={application.upline_affiliate_code || ""}
                    maxLength={9}
                    placeholder="e.g. K9X2M7P4Q"
                    style={{ textTransform: "uppercase", letterSpacing: "1px", fontWeight: 600 }}
                  />
                  <p style={{ fontSize: 13, color: "#64748b", marginTop: 4 }}>
                    Your application requires info/correction. You may update your 9-character Upline Affiliate ID.
                  </p>
                </>
              ) : (
                <input
                  id="uplineCode"
                  name="uplineCode"
                  value={application.upline_affiliate_code || "None"}
                  readOnly
                  disabled
                  style={{ background: "#f8fafc", cursor: "not-allowed", fontWeight: 600, letterSpacing: "1px" }}
                />
              )}
            </div>

            {/* STRICT FIELD ORDER: Address 1, Address 2, Address 3, Postcode, Town, State, Country */}
            <div className="field full">
              <label htmlFor="addressLine1" style={{ fontWeight: 600 }}>
                Address 1 / <span style={{ color: "#475569", fontWeight: 500 }}>Alamat 1</span> <span style={{ color: "#dc2626" }}>*</span>
              </label>
              <input id="addressLine1" name="addressLine1" defaultValue={application.address_line1 || ""} required />
            </div>
            <div className="field full">
              <label htmlFor="addressLine2" style={{ fontWeight: 600 }}>
                Address 2 / <span style={{ color: "#475569", fontWeight: 500 }}>Alamat 2</span> <small style={{ fontWeight: "normal", color: "#64748b" }}>(Optional / Pilihan)</small>
              </label>
              <input id="addressLine2" name="addressLine2" defaultValue={application.address_line2 || ""} />
            </div>
            <div className="field full">
              <label htmlFor="addressLine3" style={{ fontWeight: 600 }}>
                Address 3 / <span style={{ color: "#475569", fontWeight: 500 }}>Alamat 3</span> <small style={{ fontWeight: "normal", color: "#64748b" }}>(Optional / Pilihan)</small>
              </label>
              <input id="addressLine3" name="addressLine3" defaultValue={application.address_line3 || ""} />
            </div>

            <div className="field">
              <label htmlFor="postcode" style={{ fontWeight: 600 }}>
                Postcode / <span style={{ color: "#475569", fontWeight: 500 }}>Poskod</span> <span style={{ color: "#dc2626" }}>*</span>
              </label>
              <input id="postcode" name="postcode" defaultValue={application.postcode || ""} required />
            </div>
            <div className="field">
              <label htmlFor="town" style={{ fontWeight: 600 }}>
                Town / City / <span style={{ color: "#475569", fontWeight: 500 }}>Bandar</span> <span style={{ color: "#dc2626" }}>*</span>
              </label>
              <input id="town" name="town" defaultValue={application.town || ""} required />
            </div>

            <div className="field">
              <label htmlFor="state" style={{ fontWeight: 600 }}>
                State / <span style={{ color: "#475569", fontWeight: 500 }}>Negeri</span> <span style={{ color: "#dc2626" }}>*</span>
              </label>
              <select id="state" name="state" value={stateVal} onChange={(e) => setStateVal(e.target.value)}>
                <option value="">-- Select State / Pilih Negeri --</option>
                {countryStates.map((st) => (
                  <option key={st.id} value={st.name}>
                    {st.name}
                  </option>
                ))}
              </select>
            </div>

            <div className="field">
              <label htmlFor="countryCode" style={{ fontWeight: 600 }}>
                Country / <span style={{ color: "#475569", fontWeight: 500 }}>Negara</span> <span style={{ color: "#dc2626" }}>*</span>
              </label>
              <select id="countryCode" name="countryCode" value={countryCode} onChange={handleCountryChange}>
                {countries.map((c) => (
                  <option key={c.code} value={c.code}>
                    {c.name} ({c.code})
                  </option>
                ))}
              </select>
            </div>

            <div className="field full">
              <label htmlFor="currency" style={{ fontWeight: 600 }}>
                Currency / <span style={{ color: "#475569", fontWeight: 500 }}>Mata Wang</span>{" "}
                <small style={{ fontWeight: "normal", color: "#64748b" }}>(Auto-populated / Automatik)</small>
              </label>
              <input
                id="currency"
                name="currency"
                value={selectedCountry?.currency || "MYR"}
                readOnly
                style={{ background: "#f1f5f9", cursor: "not-allowed", fontWeight: 600 }}
              />
            </div>

            <div className="field">
              <label htmlFor="websiteUrl" style={{ fontWeight: 600 }}>
                Website / <span style={{ color: "#475569", fontWeight: 500 }}>Laman Web</span>{" "}
                <small style={{ fontWeight: "normal", color: "#64748b" }}>(Optional / Pilihan)</small>
              </label>
              <input id="websiteUrl" name="websiteUrl" type="url" defaultValue={application.website_url || ""} placeholder="https://" />
            </div>
            <div className="field">
              <label htmlFor="socialUrl" style={{ fontWeight: 600 }}>
                Main Social Profile / <span style={{ color: "#475569", fontWeight: 500 }}>Profil Media Sosial</span>{" "}
                <small style={{ fontWeight: "normal", color: "#64748b" }}>(Optional / Pilihan)</small>
              </label>
              <input id="socialUrl" name="socialUrl" type="url" defaultValue={application.social_url || ""} placeholder="https://" />
            </div>

            <div className="field full">
              <label htmlFor="marketFocus" style={{ fontWeight: 600 }}>
                Market Focus / <span style={{ color: "#475569", fontWeight: 500 }}>Fokus Pasaran</span> <span style={{ color: "#dc2626" }}>*</span>
              </label>
              <select id="marketFocus" name="marketFocus" defaultValue={application.market_focus}>
                <option value="MALAYSIA">Malaysia</option>
                <option value="SINGAPORE">Singapore</option>
                <option value="BOTH">Both markets / Kedua-dua pasaran</option>
              </select>
            </div>

            <div className="field full">
              <label htmlFor="audience" style={{ fontWeight: 600 }}>
                Audience Description / <span style={{ color: "#475569", fontWeight: 500 }}>Penerangan Sasaran Khalayak</span> <span style={{ color: "#dc2626" }}>*</span>
              </label>
              <textarea id="audience" name="audience" defaultValue={application.audience_description} required maxLength={3000} />
            </div>

            <div className="field full">
              <label htmlFor="promotion" style={{ fontWeight: 600 }}>
                Promotion Method / <span style={{ color: "#475569", fontWeight: 500 }}>Kaedah Promosi</span> <span style={{ color: "#dc2626" }}>*</span>
              </label>
              <textarea id="promotion" name="promotion" defaultValue={application.promotion_method} required maxLength={3000} />
            </div>

            {/* ID DOCUMENT UPLOADS RULES */}
            <div className="field full" style={{ marginTop: 24, paddingTop: 16, borderTop: "1px solid var(--border,#e2e8f0)" }}>
              <h3 style={{ fontSize: 20, marginBottom: 6 }}>Identity Verification Documents / Dokumen Pengesahan Identiti</h3>
              {canEditUploads ? (
                <p style={{ fontSize: 14, color: "#475569", marginBottom: 16 }}>
                  You may re-upload your ID verification documents below if updated or required for eKYC.
                </p>
              ) : (
                <p style={{ fontSize: 14, color: "#64748b", marginBottom: 16 }}>
                  ID documents are <b>locked</b> in phase status <b>{application.status.replaceAll("_", " ")}</b> and cannot be modified unless additional information is requested by the review team.
                </p>
              )}
            </div>

            <div className="field full">
              <label htmlFor="idDoc" style={{ fontWeight: 600 }}>1. Picture of ID Document / Gambar Dokumen Pengenalan Diri</label>
              {canEditUploads ? (
                <>
                  <p style={{ fontSize: 13, color: "#64748b", marginTop: -2, marginBottom: 6 }}>
                    Re-upload a clear picture/scan of your official Government ID document.
                  </p>
                  <input id="idDoc" name="idDoc" type="file" accept="image/*,.pdf" style={{ padding: "8px 12px" }} />
                </>
              ) : (
                <p style={{ padding: "10px 14px", background: "#f8fafc", borderRadius: 6, color: "#475569", fontSize: 14 }}>
                  🔒 ID Document Picture: {application.id_doc_path ? <a href={application.id_doc_path} target="_blank" rel="noreferrer">View uploaded document</a> : "Uploaded"}
                </p>
              )}
            </div>

            <div className="field full">
              <label htmlFor="holdingId" style={{ fontWeight: 600 }}>2. Photo Holding ID Document / Foto Memegang Dokumen Pengenalan Diri</label>
              {canEditUploads ? (
                <>
                  <p style={{ fontSize: 13, color: "#64748b", marginTop: -2, marginBottom: 6 }}>
                    Re-upload a clear photo of yourself holding your Government ID document next to your face.
                  </p>
                  <input id="holdingId" name="holdingId" type="file" accept="image/*" style={{ padding: "8px 12px" }} />
                </>
              ) : (
                <p style={{ padding: "10px 14px", background: "#f8fafc", borderRadius: 6, color: "#475569", fontSize: 14 }}>
                  🔒 Photo Holding ID: {application.holding_id_path ? <a href={application.holding_id_path} target="_blank" rel="noreferrer">View uploaded photo</a> : "Uploaded"}
                </p>
              )}
            </div>
          </>
        )}
      </div>

      <div style={{ display: "flex", gap: "12px", marginTop: 24, paddingTop: 16, borderTop: "1px solid var(--border,#e2e8f0)" }}>
        <button className="button primary submit" type="submit" disabled={Boolean(confirmPasswordError || passwordError)}>
          {application && application.status !== "APPROVED"
            ? "Edit Application and Resubmit / Kemas Kini & Hantar Semula Permohonan"
            : "Save changes / Simpan perubahan"}
        </button>
        <Link className="button secondary" href="/portal">Cancel / Batal</Link>
      </div>
    </form>
  );
}
