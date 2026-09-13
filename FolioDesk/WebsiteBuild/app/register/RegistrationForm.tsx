"use client";

import Link from "next/link";
import { useState } from "react";
import type { CountryItem, StateItem } from "../../lib/db-locations";

export interface ExistingApp {
  id: number;
  user_id: number;
  application_number: string;
  applicant_type: string;
  legal_name: string;
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
  affiliate_code: string | null;
  upline_affiliate_code: string | null;
  id_doc_path: string | null;
  holding_id_path: string | null;
}

interface ExistingUser {
  id: number;
  email: string;
  full_name: string;
}

export default function RegistrationForm({
  countries,
  states,
  initialUpline = "",
  error,
  existingUser,
  existingApp,
}: {
  countries: CountryItem[];
  states: StateItem[];
  initialUpline?: string;
  error?: string;
  existingUser?: ExistingUser | null;
  existingApp?: ExistingApp | null;
}) {
  const isReinstatement = Boolean(
    existingApp && (existingApp.status === "RETRACTED" || existingApp.status === "RETRACTION_ACKNOWLEDGED")
  );

  const defaultCountryCode = existingApp?.country_code || countries[0]?.code || "MY";
  const [countryCode, setCountryCode] = useState(defaultCountryCode);
  const [applicantType, setApplicantType] = useState(existingApp?.applicant_type || "INDIVIDUAL");

  const selectedCountry = countries.find((c) => c.code === countryCode) || countries[0];
  const countryStates = states.filter((s) => s.country_code === countryCode);
  const [stateVal, setStateVal] = useState(existingApp?.state || countryStates[0]?.name || "");

  // Upline Referral Code state from URL GET variable
  const [uplineCode, setUplineCode] = useState(initialUpline || existingApp?.upline_affiliate_code || "");
  const isAutoUpline = Boolean(initialUpline || existingApp?.upline_affiliate_code);

  // Email Validation State
  const [email, setEmail] = useState(existingUser?.email || "");
  const [emailChecking, setEmailChecking] = useState(false);
  const [emailError, setEmailError] = useState<{ en: string; ms: string } | null>(null);
  const [emailIsRetracted, setEmailIsRetracted] = useState(false);

  // Password & Confirm Password State
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [passwordTouched, setPasswordTouched] = useState(false);
  const [confirmPasswordTouched, setConfirmPasswordTouched] = useState(false);
  const passwordError = (passwordTouched || confirmPasswordTouched) && (!isReinstatement || password.length > 0) && password.length > 0 && password.length < 12
    ? { en: "Password must be at least 12 characters", ms: "Kata laluan mestilah sekurang-kurangnya 12 aksara" }
    : null;
  const confirmPasswordError = (confirmPasswordTouched || confirmPassword.length > 0) && confirmPassword !== password
    ? { en: "Passwords do not match", ms: "Kata laluan tidak sepadan" }
    : null;

  // Personal ID / Company Number Validation State
  const [companyNumber, setCompanyNumber] = useState(existingApp?.company_number || "");
  const [companyNumberChecking, setCompanyNumberChecking] = useState(false);
  const [companyNumberError, setCompanyNumberError] = useState<{ en: string; ms: string } | null>(null);

  const handleCountryChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const newCountryCode = e.target.value;
    setCountryCode(newCountryCode);

    const newCountryStates = states.filter((s) => s.country_code === newCountryCode);
    const isValidStateForNewCountry = newCountryStates.some((s) => s.name === stateVal);
    if (!isValidStateForNewCountry) {
      setStateVal(newCountryStates[0]?.name || "");
    }
  };

  // Immediate Email validation on blur
  const validateEmail = async (val: string) => {
    const trimmed = val.trim().toLowerCase();
    if (!trimmed) {
      setEmailError(null);
      setEmailIsRetracted(false);
      return;
    }

    if (!trimmed.includes("@") || !trimmed.includes(".")) {
      setEmailError({
        en: "Please enter a valid email address",
        ms: "Sila masukkan alamat e-mel yang sah",
      });
      setEmailIsRetracted(false);
      return;
    }

    // Skip API check if email is the existing logged-in user's email
    if (existingUser && trimmed === existingUser.email.toLowerCase()) {
      setEmailError(null);
      setEmailIsRetracted(false);
      return;
    }

    setEmailChecking(true);
    try {
      const res = await fetch("/foliodesk/api/validate-field", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ field: "email", value: trimmed }),
      });
      const data = await res.json();
      if (!data.available && data.exists) {
        setEmailError({
          en: data.messageEn || "This email address is already registered.",
          ms: data.messageMs || "Alamat e-mel ini telah didaftarkan.",
        });
        setEmailIsRetracted(Boolean(data.isRetracted));
      } else {
        setEmailError(null);
        setEmailIsRetracted(false);
      }
    } catch {
      // Ignore network failures for graceful degradation
    } finally {
      setEmailChecking(false);
    }
  };

  // Immediate Personal ID / Company Number validation on blur
  const validateCompanyNumber = async (val: string, type: string) => {
    const trimmed = val.trim();
    if (!trimmed) {
      setCompanyNumberError(null);
      return;
    }

    // Skip check if unchanged from existing user's ID
    if (existingApp && trimmed === (existingApp.company_number || "").trim()) {
      setCompanyNumberError(null);
      return;
    }

    setCompanyNumberChecking(true);
    try {
      const res = await fetch("/foliodesk/api/validate-field", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ field: "company_number", value: trimmed, applicantType: type }),
      });
      const data = await res.json();
      if (!data.available && data.exists) {
        setCompanyNumberError({
          en: data.messageEn || "This ID / registration number is already registered.",
          ms: data.messageMs || "No. KP / pendaftaran ini telah didaftarkan.",
        });
      } else {
        setCompanyNumberError(null);
      }
    } catch {
      // Ignore network failures for graceful degradation
    } finally {
      setCompanyNumberChecking(false);
    }
  };

  return (
    <form action="/foliodesk/api/register" method="post" encType="multipart/form-data" className="form-grid">
      {/* HIDDEN REINSTATEMENT FLAG */}
      {isReinstatement && (
        <>
          <input type="hidden" name="isReinstatement" value="1" />
          <input type="hidden" name="existingAppId" value={existingApp?.id} />
        </>
      )}

      {/* REINSTATEMENT BANNER */}
      {isReinstatement && (
        <div
          className="field full"
          style={{
            background: "#eff6ff",
            border: "2px solid #3b82f6",
            borderRadius: 10,
            padding: "16px 20px",
            marginBottom: 8,
          }}
        >
          <h3 style={{ margin: "0 0 6px 0", color: "#1d4ed8", fontSize: 18, display: "flex", alignItems: "center", gap: 8 }}>
            <span>🔄</span> Application Reinstatement / Permohonan Pengembalian Semula
          </h3>
          <p style={{ margin: 0, color: "#1e40af", fontSize: 14, lineHeight: 1.5 }}>
            You are resubmitting your profile for reinstatement. Your previously submitted details have been pre-filled below. Review, update if needed, and submit to reactivate review.
            <br />
            <i style={{ fontSize: 13, color: "#2563eb" }}>
              Anda sedang menghantar semula profil anda untuk pengembalian semula. Sila semak butiran anda di bawah dan hantar untuk memulakan semula semakan.
            </i>
          </p>
        </div>
      )}

      {/* GLOBAL ERROR NOTICE */}
      {error && (
        <div className="field full">
          <p className="notice error">{error}</p>
        </div>
      )}

      {/* BILINGUAL REQUIRED FIELDS LEGEND */}
      <div
        className="field full"
        style={{
          background: "#f8fafc",
          border: "1px solid #e2e8f0",
          borderRadius: 8,
          padding: "10px 16px",
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

      {/* SECTION 1: ACCOUNT CREDENTIALS */}
      <div className="field full" style={{ marginTop: 8 }}>
        <h3 style={{ fontSize: 18, margin: 0, color: "#0f172a" }}>
          1. Account Credentials / Kredensial Akaun
        </h3>
      </div>

      {/* FULL NAME */}
      <div className="field">
        <label htmlFor="fullName" style={{ fontWeight: 600 }}>
          Account Full Name / <span style={{ color: "#475569", fontWeight: 500 }}>Nama Penuh Akaun</span> <span style={{ color: "#dc2626" }}>*</span>
        </label>
        <input
          id="fullName"
          name="fullName"
          defaultValue={existingUser?.full_name || ""}
          required
          maxLength={160}
          placeholder="e.g. Ahmad bin Abdullah / John Doe"
        />
      </div>

      {/* EMAIL */}
      <div className="field">
        <label htmlFor="email" style={{ fontWeight: 600 }}>
          Email Address / <span style={{ color: "#475569", fontWeight: 500 }}>Alamat E-mel</span> <span style={{ color: "#dc2626" }}>*</span>
        </label>
        <input
          id="email"
          name="email"
          type="email"
          required
          value={email}
          onChange={(e) => {
            setEmail(e.target.value);
            if (emailError) setEmailError(null);
          }}
          onBlur={(e) => {
            validateEmail(e.target.value);
          }}
          readOnly={Boolean(isReinstatement)}
          style={{
            borderColor: emailError ? "#dc2626" : undefined,
            background: isReinstatement ? "#f1f5f9" : undefined,
          }}
          placeholder="you@example.com"
        />
        {emailChecking && (
          <small style={{ color: "#64748b", display: "block", marginTop: 4 }}>Checking email availability...</small>
        )}
        {emailError && (
          <div style={{ marginTop: 6, padding: "6px 10px", background: "#fef2f2", border: "1px solid #fca5a5", borderRadius: 6 }}>
            <p style={{ margin: 0, color: "#dc2626", fontSize: 13, fontWeight: 600 }}>
              ⚠️ {emailError.en}
            </p>
            <p style={{ margin: "2px 0 0 0", color: "#991b1b", fontSize: 12 }}>
              {emailError.ms}
            </p>
            {emailIsRetracted && (
              <div style={{ marginTop: 6 }}>
                <Link href="/login" style={{ color: "#2563eb", fontWeight: 700, fontSize: 13, textDecoration: "underline" }}>
                  → Log In to Reinstatement Portal / Log Masuk untuk Pengembalian Semula
                </Link>
              </div>
            )}
            {!emailIsRetracted && (
              <div style={{ marginTop: 4 }}>
                <Link href="/login" style={{ color: "#2563eb", fontWeight: 600, fontSize: 12, textDecoration: "underline" }}>
                  Log in here / Log masuk di sini
                </Link>
              </div>
            )}
          </div>
        )}
      </div>

      {/* PASSWORD */}
      <div className="field">
        <label htmlFor="password" style={{ fontWeight: 600 }}>
          Password / <span style={{ color: "#475569", fontWeight: 500 }}>Kata Laluan</span>{" "}
          {isReinstatement ? (
            <small style={{ fontWeight: 400, color: "#64748b" }}>(Optional / Pilihan)</small>
          ) : (
            <span style={{ color: "#dc2626" }}>*</span>
          )}
        </label>
        <input
          id="password"
          name="password"
          type="password"
          minLength={isReinstatement ? undefined : 12}
          required={!isReinstatement}
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          onBlur={() => setPasswordTouched(true)}
          style={{
            borderColor: passwordError ? "#dc2626" : password.length >= 12 ? "#16a34a" : undefined,
          }}
          placeholder={isReinstatement ? "Leave blank to keep existing password" : "Min. 12 characters / Min. 12 aksara"}
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
        {!passwordError && password.length >= 12 && (
          <small style={{ color: "#16a34a", fontWeight: 600, display: "block", marginTop: 4 }}>
            ✓ Password meets length requirements / Kata laluan memenuhi syarat
          </small>
        )}
      </div>

      {/* CONFIRM PASSWORD */}
      <div className="field">
        <label htmlFor="confirmPassword" style={{ fontWeight: 600 }}>
          Confirm Password / <span style={{ color: "#475569", fontWeight: 500 }}>Sahkan Kata Laluan</span>{" "}
          {isReinstatement ? (
            <small style={{ fontWeight: 400, color: "#64748b" }}>(Optional / Pilihan)</small>
          ) : (
            <span style={{ color: "#dc2626" }}>*</span>
          )}
        </label>
        <input
          id="confirmPassword"
          name="confirmPassword"
          type="password"
          minLength={isReinstatement ? undefined : 12}
          required={!isReinstatement || password.length > 0}
          value={confirmPassword}
          onChange={(e) => setConfirmPassword(e.target.value)}
          onBlur={() => setConfirmPasswordTouched(true)}
          style={{
            borderColor: confirmPasswordError
              ? "#dc2626"
              : confirmPasswordTouched && confirmPassword && !confirmPasswordError
              ? "#16a34a"
              : undefined,
          }}
          placeholder="••••••••••••"
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
        {!confirmPasswordError && confirmPasswordTouched && confirmPassword && (
          <small style={{ color: "#16a34a", fontWeight: 600, display: "block", marginTop: 4 }}>
            ✓ Passwords match / Kata laluan sepadan
          </small>
        )}
      </div>

      {/* SECTION 2: APPLICANT IDENTITY & LEGAL ENTITY */}
      <div className="field full" style={{ marginTop: 16, paddingTop: 16, borderTop: "1px solid #e2e8f0" }}>
        <h3 style={{ fontSize: 18, margin: 0, color: "#0f172a" }}>
          2. Affiliate Legal Identity / Identiti Undang-Undang Ahli Gabungan
        </h3>
      </div>

      {/* APPLICANT TYPE */}
      <div className="field">
        <label htmlFor="applicantType" style={{ fontWeight: 600 }}>
          Applying As / <span style={{ color: "#475569", fontWeight: 500 }}>Memohon Sebagai</span> <span style={{ color: "#dc2626" }}>*</span>
        </label>
        <select
          id="applicantType"
          name="applicantType"
          value={applicantType}
          onChange={(e) => {
            const nextType = e.target.value;
            setApplicantType(nextType);
            if (companyNumber) {
              validateCompanyNumber(companyNumber, nextType);
            }
          }}
        >
          <option value="INDIVIDUAL">Individual / Individu</option>
          <option value="COMPANY">Company / Syarikat</option>
        </select>
      </div>

      {/* LEGAL NAME */}
      <div className="field">
        <label htmlFor="legalName" style={{ fontWeight: 600 }}>
          {applicantType === "INDIVIDUAL" ? (
            <>
              Legal Name (as on ID) / <span style={{ color: "#475569", fontWeight: 500 }}>Nama Rasmi (mengikut KP)</span>
            </>
          ) : (
            <>
              Registered Company Name / <span style={{ color: "#475569", fontWeight: 500 }}>Nama Syarikat Berdaftar</span>
            </>
          )}{" "}
          <span style={{ color: "#dc2626" }}>*</span>
        </label>
        <input
          id="legalName"
          name="legalName"
          defaultValue={existingApp?.legal_name || ""}
          required
          placeholder={applicantType === "INDIVIDUAL" ? "Full legal name as on NRIC / Passport" : "e.g. Apex Engineering Holdings Sdn Bhd"}
        />
      </div>

      {/* PERSONAL ID / COMPANY NUMBER */}
      <div className="field">
        <label htmlFor="companyNumber" style={{ fontWeight: 600 }}>
          {applicantType === "INDIVIDUAL" ? (
            <>
              Personal ID / NRIC / Passport No. / <span style={{ color: "#475569", fontWeight: 500 }}>No. Kad Pengenalan / Pasport</span>
            </>
          ) : (
            <>
              Company Registration No. / <span style={{ color: "#475569", fontWeight: 500 }}>No. Pendaftaran Syarikat</span>
            </>
          )}{" "}
          <span style={{ color: "#dc2626" }}>*</span>
        </label>
        <input
          id="companyNumber"
          name="companyNumber"
          required
          value={companyNumber}
          onChange={(e) => {
            setCompanyNumber(e.target.value);
            if (companyNumberError) setCompanyNumberError(null);
          }}
          onBlur={(e) => {
            validateCompanyNumber(e.target.value, applicantType);
          }}
          style={{
            borderColor: companyNumberError ? "#dc2626" : undefined,
          }}
          placeholder={
            applicantType === "INDIVIDUAL"
              ? "e.g. 900101-14-1234 or Passport No."
              : "e.g. 201801048821 / UEN / SSM No."
          }
        />
        {companyNumberChecking && (
          <small style={{ color: "#64748b", display: "block", marginTop: 4 }}>Checking ID uniqueness...</small>
        )}
        {companyNumberError && (
          <div style={{ marginTop: 6, padding: "6px 10px", background: "#fef2f2", border: "1px solid #fca5a5", borderRadius: 6 }}>
            <p style={{ margin: 0, color: "#dc2626", fontSize: 13, fontWeight: 700 }}>
              ⚠️ {companyNumberError.en}
            </p>
            <p style={{ margin: "2px 0 0 0", color: "#991b1b", fontSize: 12 }}>
              {companyNumberError.ms}
            </p>
          </div>
        )}
      </div>

      {/* TELEPHONE */}
      <div className="field">
        <label htmlFor="phone" style={{ fontWeight: 600 }}>
          Telephone / <span style={{ color: "#475569", fontWeight: 500 }}>No. Telefon</span> <span style={{ color: "#dc2626" }}>*</span>
        </label>
        <input
          id="phone"
          name="phone"
          defaultValue={existingApp?.phone || ""}
          required
          placeholder="+60 12-345 6789"
        />
      </div>

      {/* UPLINE REFERRAL CODE */}
      <div className="field full">
        <label htmlFor="uplineCode" style={{ fontWeight: 600 }}>
          Upline Affiliate ID / Referral Code / <span style={{ color: "#475569", fontWeight: 500 }}>ID Rujukan Upline</span>{" "}
          <small style={{ fontWeight: "normal", color: isAutoUpline ? "#0f766e" : "#64748b" }}>
            {isAutoUpline ? "(🔒 Auto-assigned from URL GET variable / Non-editable)" : "(Optional 9-char code / Pilihan)"}
          </small>
        </label>
        <input
          id="uplineCode"
          name="uplineCode"
          value={uplineCode}
          onChange={(e) => {
            if (!isAutoUpline) {
              setUplineCode(e.target.value.toUpperCase());
            }
          }}
          readOnly={isAutoUpline}
          maxLength={9}
          placeholder="e.g. APEXENG99"
          style={{
            textTransform: "uppercase",
            letterSpacing: "1px",
            fontWeight: 700,
            background: isAutoUpline ? "#f1f5f9" : "#ffffff",
            color: isAutoUpline ? "#0f766e" : "#0f172a",
            cursor: isAutoUpline ? "not-allowed" : "text",
            border: isAutoUpline ? "1.5px solid #0d9488" : "1px solid #cbd5e1",
          }}
        />
        <p style={{ fontSize: 13, color: isAutoUpline ? "#0f766e" : "#64748b", marginTop: 4, fontWeight: isAutoUpline ? 600 : 400 }}>
          {isAutoUpline
            ? `🔒 Upline referrer auto-assigned from GET URL parameter (?upline=${uplineCode}). This referral code is locked.`
            : "If referred by an existing affiliate, enter their 9-character code / Jika dirujuk oleh ahli gabungan sedia ada, masukkan kod 9-aksara di sini."}
        </p>
      </div>

      {/* SECTION 3: ADDRESS & LOCATION */}
      <div className="field full" style={{ marginTop: 16, paddingTop: 16, borderTop: "1px solid #e2e8f0" }}>
        <h3 style={{ fontSize: 18, margin: 0, color: "#0f172a" }}>
          3. Address & Location / Alamat & Lokasi
        </h3>
      </div>

      {/* STRICT ORDER: Address 1, Address 2, Address 3, Postcode, Town, State, Country */}
      <div className="field full">
        <label htmlFor="addressLine1" style={{ fontWeight: 600 }}>
          Address 1 / <span style={{ color: "#475569", fontWeight: 500 }}>Alamat 1</span> <span style={{ color: "#dc2626" }}>*</span>
        </label>
        <input
          id="addressLine1"
          name="addressLine1"
          defaultValue={existingApp?.address_line1 || ""}
          required
          placeholder="Street address, building unit no. / Alamat jalan, no. bangunan"
        />
      </div>

      <div className="field full">
        <label htmlFor="addressLine2" style={{ fontWeight: 600 }}>
          Address 2 / <span style={{ color: "#475569", fontWeight: 500 }}>Alamat 2</span>{" "}
          <small style={{ fontWeight: "normal", color: "#64748b" }}>(Optional / Pilihan)</small>
        </label>
        <input
          id="addressLine2"
          name="addressLine2"
          defaultValue={existingApp?.address_line2 || ""}
          placeholder="Building name, floor, suite / Nama bangunan, tingkat"
        />
      </div>

      <div className="field full">
        <label htmlFor="addressLine3" style={{ fontWeight: 600 }}>
          Address 3 / <span style={{ color: "#475569", fontWeight: 500 }}>Alamat 3</span>{" "}
          <small style={{ fontWeight: "normal", color: "#64748b" }}>(Optional / Pilihan)</small>
        </label>
        <input
          id="addressLine3"
          name="addressLine3"
          defaultValue={existingApp?.address_line3 || ""}
          placeholder="Additional location details / Butiran lokasi tambahan"
        />
      </div>

      <div className="field">
        <label htmlFor="postcode" style={{ fontWeight: 600 }}>
          Postcode / <span style={{ color: "#475569", fontWeight: 500 }}>Poskod</span> <span style={{ color: "#dc2626" }}>*</span>
        </label>
        <input
          id="postcode"
          name="postcode"
          defaultValue={existingApp?.postcode || ""}
          required
          placeholder="e.g. 50450"
        />
      </div>

      <div className="field">
        <label htmlFor="town" style={{ fontWeight: 600 }}>
          Town / City / <span style={{ color: "#475569", fontWeight: 500 }}>Bandar</span> <span style={{ color: "#dc2626" }}>*</span>
        </label>
        <input
          id="town"
          name="town"
          defaultValue={existingApp?.town || ""}
          required
          placeholder="e.g. Kuala Lumpur"
        />
      </div>

      <div className="field">
        <label htmlFor="state" style={{ fontWeight: 600 }}>
          State / Region / <span style={{ color: "#475569", fontWeight: 500 }}>Negeri</span> <span style={{ color: "#dc2626" }}>*</span>
        </label>
        <select id="state" name="state" value={stateVal} onChange={(e) => setStateVal(e.target.value)} required>
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
        <select id="countryCode" name="countryCode" value={countryCode} onChange={handleCountryChange} required>
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

      {/* SECTION 4: PROMOTIONAL & AUDIENCE DETAILS */}
      <div className="field full" style={{ marginTop: 16, paddingTop: 16, borderTop: "1px solid #e2e8f0" }}>
        <h3 style={{ fontSize: 18, margin: 0, color: "#0f172a" }}>
          4. Promotional Reach & Market / Saluran Promosi & Pasaran
        </h3>
      </div>

      <div className="field">
        <label htmlFor="websiteUrl" style={{ fontWeight: 600 }}>
          Website / <span style={{ color: "#475569", fontWeight: 500 }}>Laman Web</span>{" "}
          <small style={{ fontWeight: "normal", color: "#64748b" }}>(Optional / Pilihan)</small>
        </label>
        <input
          id="websiteUrl"
          name="websiteUrl"
          type="url"
          defaultValue={existingApp?.website_url || ""}
          placeholder="https://"
        />
      </div>

      <div className="field">
        <label htmlFor="socialUrl" style={{ fontWeight: 600 }}>
          Main Social Profile / <span style={{ color: "#475569", fontWeight: 500 }}>Profil Media Sosial</span>{" "}
          <small style={{ fontWeight: "normal", color: "#64748b" }}>(Optional / Pilihan)</small>
        </label>
        <input
          id="socialUrl"
          name="socialUrl"
          type="url"
          defaultValue={existingApp?.social_url || ""}
          placeholder="https://"
        />
      </div>

      <div className="field full">
        <label htmlFor="marketFocus" style={{ fontWeight: 600 }}>
          Market Focus / <span style={{ color: "#475569", fontWeight: 500 }}>Fokus Pasaran</span> <span style={{ color: "#dc2626" }}>*</span>
        </label>
        <select id="marketFocus" name="marketFocus" defaultValue={existingApp?.market_focus || "MALAYSIA"}>
          <option value="MALAYSIA">Malaysia</option>
          <option value="SINGAPORE">Singapore</option>
          <option value="BOTH">Both markets / Kedua-dua pasaran</option>
        </select>
      </div>

      <div className="field full">
        <label htmlFor="audience" style={{ fontWeight: 600 }}>
          Target Audience Description / <span style={{ color: "#475569", fontWeight: 500 }}>Penerangan Sasaran Khalayak</span> <span style={{ color: "#dc2626" }}>*</span>
        </label>
        <textarea
          id="audience"
          name="audience"
          required
          maxLength={3000}
          defaultValue={existingApp?.audience_description || ""}
          placeholder="Describe your network, industry contacts, reach and target clients..."
        />
      </div>

      <div className="field full">
        <label htmlFor="promotion" style={{ fontWeight: 600 }}>
          Promotion Method / <span style={{ color: "#475569", fontWeight: 500 }}>Kaedah Promosi</span> <span style={{ color: "#dc2626" }}>*</span>
        </label>
        <textarea
          id="promotion"
          name="promotion"
          required
          maxLength={3000}
          defaultValue={existingApp?.promotion_method || ""}
          placeholder="Describe how you will introduce and recommend FolioDesk to clients..."
        />
      </div>

      {/* SECTION 5: MANDATORY ID VERIFICATION DOCUMENTS */}
      <div className="field full" style={{ marginTop: 16, paddingTop: 16, borderTop: "1px solid #e2e8f0" }}>
        <h3 style={{ fontSize: 18, margin: 0, color: "#0f172a" }}>
          5. Identity Verification Documents / Dokumen Pengesahan Identiti <span style={{ color: "#dc2626" }}>*</span>
        </h3>
        <p style={{ color: "#64748b", fontSize: 14, margin: "6px 0 16px 0" }}>
          {applicantType === "INDIVIDUAL"
            ? "Upload personal government ID (NRIC / Passport) and a photo holding your ID next to your face / Muat naik kad pengenalan dan foto memegang kad pengenalan."
            : "Upload representative's government ID or SSM / ACRA company registration document and photo holding ID."}
        </p>
      </div>

      <div className="field full">
        <label htmlFor="idDoc" style={{ fontWeight: 600 }}>
          {applicantType === "INDIVIDUAL" ? "1. Picture of Personal ID Document" : "1. Picture of Representative ID / Business Reg Document"} /{" "}
          <span style={{ color: "#475569", fontWeight: 500 }}>Gambar Dokumen Pengenalan Diri</span>{" "}
          {isReinstatement && existingApp?.id_doc_path ? (
            <small style={{ color: "#059669", fontWeight: 600 }}>(Document on file / Dokumen dalam fail)</small>
          ) : (
            <span style={{ color: "#dc2626" }}>*</span>
          )}
        </label>
        {isReinstatement && existingApp?.id_doc_path && (
          <p style={{ margin: "4px 0 8px 0", fontSize: 13, color: "#047857" }}>
            📄 Current file: <a href={existingApp.id_doc_path} target="_blank" rel="noreferrer" style={{ textDecoration: "underline" }}>View uploaded ID</a> (Upload new file only if changing / Muat naik hanya jika ingin menukar).
          </p>
        )}
        <input
          id="idDoc"
          name="idDoc"
          type="file"
          accept="image/*,.pdf"
          required={!isReinstatement || !existingApp?.id_doc_path}
          style={{ padding: "8px 12px" }}
        />
      </div>

      <div className="field full">
        <label htmlFor="holdingId" style={{ fontWeight: 600 }}>
          {applicantType === "INDIVIDUAL" ? "2. Photo Holding Personal ID Document" : "2. Photo of Representative Holding ID"} /{" "}
          <span style={{ color: "#475569", fontWeight: 500 }}>Foto Memegang Dokumen Pengenalan Diri</span>{" "}
          {isReinstatement && existingApp?.holding_id_path ? (
            <small style={{ color: "#059669", fontWeight: 600 }}>(Photo on file / Foto dalam fail)</small>
          ) : (
            <span style={{ color: "#dc2626" }}>*</span>
          )}
        </label>
        {isReinstatement && existingApp?.holding_id_path && (
          <p style={{ margin: "4px 0 8px 0", fontSize: 13, color: "#047857" }}>
            📷 Current photo: <a href={existingApp.holding_id_path} target="_blank" rel="noreferrer" style={{ textDecoration: "underline" }}>View photo holding ID</a> (Upload new photo only if changing).
          </p>
        )}
        <input
          id="holdingId"
          name="holdingId"
          type="file"
          accept="image/*"
          required={!isReinstatement || !existingApp?.holding_id_path}
          style={{ padding: "8px 12px" }}
        />
      </div>

      {/* SECTION 6: DECLARATION */}
      <div className="field full" style={{ marginTop: 8, paddingTop: 16, borderTop: "1px solid #e2e8f0" }}>
        <label className="checkbox" style={{ display: "flex", gap: 10, alignItems: "center", cursor: "pointer", background: "#fffbeb", padding: "10px 14px", borderRadius: 8, border: "1px solid #fde68a", marginBottom: 12 }}>
          <input type="checkbox" name="isTest" value="1" defaultChecked={true} />
          <span style={{ fontSize: 13, fontWeight: 700, color: "#92400e" }}>
            🧪 Mark as Tester Data Application / Tandakan Sebagai Data Ujian (Default for testing & verification)
          </span>
        </label>

        <label className="checkbox" style={{ display: "flex", gap: 10, alignItems: "flex-start", cursor: "pointer" }}>
          <input type="checkbox" name="declaration" value="yes" required style={{ marginTop: 4 }} />
          <span style={{ fontSize: 13, lineHeight: 1.5, color: "#334155" }}>
            <b>Declaration / Pengakuan <span style={{ color: "#dc2626" }}>*</span>:</b> I confirm this information is accurate and agree not to use spam, misleading claims, self-referrals or unauthorised FolioDesk brand advertising.
            <br />
            <i style={{ color: "#64748b" }}>
              Saya mengesahkan maklumat ini adalah tepat dan bersetuju untuk mematuhi syarat-syarat program FolioDesk.
            </i>
          </span>
        </label>
      </div>

      <div className="field full" style={{ marginTop: 12 }}>
        <button
          className="button primary submit"
          type="submit"
          disabled={Boolean(emailError || companyNumberError || confirmPasswordError || passwordError)}
          style={{
            padding: "12px 28px",
            fontSize: 16,
            fontWeight: 700,
            opacity: emailError || companyNumberError || confirmPasswordError || passwordError ? 0.6 : 1,
          }}
        >
          {isReinstatement
            ? "Submit Reinstatement Application / Hantar Permohonan Pengembalian Semula"
            : "Submit application / Hantar permohonan"}
        </button>
      </div>
    </form>
  );
}
