"use client";

import { useState, useEffect } from "react";
import type { PackageItem } from "../../lib/packages";
import { isValidEmail, isValidPhone } from "../../lib/validation";

export default function PackageSelectForm({
  packages,
  defaultPackageName,
  defaultPackageCount = 1,
  defaultContractValueMyr,
}: {
  packages: PackageItem[];
  defaultPackageName?: string;
  defaultPackageCount?: number;
  defaultContractValueMyr?: number;
}) {
  const activePackages = packages.length > 0 ? packages : [
    { id: 1, package_name: "FolioDesk 5-User Annual License", package_code: "FD-5USER-ANNUAL", unit_price_myr: 60000, billing_cycle: "per annum", is_active: true },
    { id: 2, package_name: "FolioDesk 3-Year 5-User License", package_code: "FD-3YR-5USER", unit_price_myr: 158000, billing_cycle: "3-year term", is_active: true },
    { id: 3, package_name: "Unlimited Master Reseller License", package_code: "FD-MASTER-RESELLER", unit_price_myr: 1200000, billing_cycle: "per annum (unlimited users & companies)", is_active: true },
    { id: 4, package_name: "Design Partner Perpetual License", package_code: "FD-DESIGN-PARTNER-LIFETIME", unit_price_myr: 300000, billing_cycle: "perpetual (unlimited users, 1 company)", is_active: true },
  ];

  const initialPkg = activePackages.find((p) => p.package_name === defaultPackageName) || activePackages[0];
  const [selectedPackageName, setSelectedPackageName] = useState<string>(initialPkg.package_name);
  const [packageCount, setPackageCount] = useState<number>(defaultPackageCount || 1);
  const [contractValueMyr, setContractValueMyr] = useState<string>(
    defaultContractValueMyr !== undefined ? defaultContractValueMyr.toFixed(2) : (initialPkg.unit_price_myr * (defaultPackageCount || 1)).toFixed(2)
  );

  const handlePackageChange = (name: string) => {
    setSelectedPackageName(name);
    const pkg = activePackages.find((p) => p.package_name === name);
    if (pkg) {
      const calculated = (pkg.unit_price_myr * packageCount).toFixed(2);
      setContractValueMyr(calculated);
    }
  };

  const handleCountChange = (count: number) => {
    const validCount = Math.max(1, count || 1);
    setPackageCount(validCount);
    const pkg = activePackages.find((p) => p.package_name === selectedPackageName);
    if (pkg) {
      const calculated = (pkg.unit_price_myr * validCount).toFixed(2);
      setContractValueMyr(calculated);
    }
  };

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
      <div style={{ display: "grid", gridTemplateColumns: "1.5fr 1fr 1fr", gap: 12, alignItems: "start" }}>
        {/* PACKAGE DROPDOWN */}
        <div>
          <label style={{ fontWeight: 600, fontSize: 13, color: "#0f172a" }}>
            Target FolioDesk Package <span style={{ color: "#dc2626" }}>*</span>
          </label>
          <select
            name="packageName"
            value={selectedPackageName}
            onChange={(e) => handlePackageChange(e.target.value)}
            required
            style={{
              width: "100%",
              padding: 8,
              borderRadius: 6,
              border: "1.5px solid #0284c7",
              background: "#ffffff",
              fontSize: 13,
              fontWeight: 600,
              color: "#0f172a",
            }}
          >
            {activePackages.map((pkg) => (
              <option key={pkg.id || pkg.package_code} value={pkg.package_name}>
                {pkg.package_name} (RM {pkg.unit_price_myr.toLocaleString("en-MY", { minimumFractionDigits: 2 })} {pkg.billing_cycle})
              </option>
            ))}
          </select>
        </div>

        {/* PACKAGE COUNT / QUANTITY */}
        <div>
          <label style={{ fontWeight: 600, fontSize: 13, color: "#0f172a" }}>
            No. of Packages <span style={{ color: "#dc2626" }}>*</span>
          </label>
          <input
            name="packageCount"
            type="number"
            min="1"
            step="1"
            value={packageCount}
            onChange={(e) => handleCountChange(parseInt(e.target.value, 10))}
            required
            style={{
              width: "100%",
              padding: 8,
              borderRadius: 6,
              border: "1.5px solid #cbd5e1",
              fontSize: 14,
              fontWeight: 700,
              color: "#0f172a",
            }}
          />
        </div>

        {/* AUTO-CALCULATED CONTRACT VALUE */}
        <div>
          <label style={{ fontWeight: 600, fontSize: 13, color: "#0f172a" }}>
            Est. Contract Value (MYR) <span style={{ color: "#dc2626" }}>*</span>
          </label>
          <input
            name="contractValueMyr"
            type="number"
            step="0.01"
            min="0"
            value={contractValueMyr}
            onChange={(e) => setContractValueMyr(e.target.value)}
            required
            style={{
              width: "100%",
              padding: 8,
              borderRadius: 6,
              border: "1.5px solid #0f766e",
              background: "#f0fdf4",
              fontSize: 14,
              fontWeight: 800,
              color: "#0f766e",
            }}
          />
        </div>
      </div>
      <small style={{ color: "#64748b", fontSize: 11, margin: "-4px 0 0" }}>
        💡 Contract value auto-calculated based on selected package unit price × quantity.
      </small>
    </div>
  );
}

export function ValidatedContactInputs({
  defaultEmail = "",
  defaultPhone = "",
}: {
  defaultEmail?: string;
  defaultPhone?: string;
}) {
  const [email, setEmail] = useState(defaultEmail);
  const [emailTouched, setEmailTouched] = useState(false);
  const [phone, setPhone] = useState(defaultPhone);
  const [phoneTouched, setPhoneTouched] = useState(false);

  const isEmailValid = !emailTouched || isValidEmail(email);
  const isPhoneValid = !phoneTouched || isValidPhone(phone);

  return (
    <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
      <div>
        <label style={{ fontWeight: 600, fontSize: 13, color: "#0f172a" }}>
          Customer Contact Email <span style={{ color: "#dc2626" }}>*</span>
        </label>
        <input
          name="customerEmail"
          type="email"
          required
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          onBlur={() => setEmailTouched(true)}
          placeholder="contact@company.com.my"
          style={{
            width: "100%",
            padding: 8,
            borderRadius: 6,
            border: isEmailValid ? "1px solid #cbd5e1" : "1.5px solid #ef4444",
            background: isEmailValid ? "#ffffff" : "#fef2f2",
          }}
        />
        {!isEmailValid && (
          <p style={{ margin: "2px 0 0", color: "#dc2626", fontSize: 11, fontWeight: 600 }}>
            ⚠️ Please enter a valid email format (e.g. contact@company.com)
          </p>
        )}
      </div>

      <div>
        <label style={{ fontWeight: 600, fontSize: 13, color: "#0f172a" }}>Contact Phone</label>
        <input
          name="customerPhone"
          type="tel"
          value={phone}
          onChange={(e) => setPhone(e.target.value)}
          onBlur={() => setPhoneTouched(true)}
          placeholder="+60 12-345 6789"
          style={{
            width: "100%",
            padding: 8,
            borderRadius: 6,
            border: isPhoneValid ? "1px solid #cbd5e1" : "1.5px solid #ef4444",
            background: isPhoneValid ? "#ffffff" : "#fef2f2",
          }}
        />
        {!isPhoneValid && (
          <p style={{ margin: "2px 0 0", color: "#dc2626", fontSize: 11, fontWeight: 600 }}>
            ⚠️ Phone must be valid digits/format (e.g. +60 12-345 6789)
          </p>
        )}
      </div>
    </div>
  );
}
