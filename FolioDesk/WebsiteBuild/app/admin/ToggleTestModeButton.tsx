"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

interface Props {
  entityType: "affiliate" | "deal" | "collection" | "payment_advice";
  entityId: number;
  isTest?: number;
  label?: string;
  size?: "sm" | "md" | "lg";
  onSuccess?: (newMode: number) => void;
}

export default function ToggleTestModeButton({
  entityType,
  entityId,
  isTest = 0,
  label,
  size = "sm",
  onSuccess,
}: Props) {
  const [loading, setLoading] = useState(false);
  const [currentIsTest, setCurrentIsTest] = useState(isTest);
  const router = useRouter();

  const isTester = Number(currentIsTest) === 1;

  const handleToggle = async (e: React.MouseEvent) => {
    e.stopPropagation();
    e.preventDefault();

    const targetModeName = isTester ? "Actual Production Data" : "Tester Data";
    if (!confirm(`Switch this ${entityType} to ${targetModeName}?`)) {
      return;
    }

    setLoading(true);
    try {
      const res = await fetch("/api/admin/toggle-test-mode", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ entityType, entityId, targetMode: isTester ? 0 : 1 }),
      });

      const data = await res.json();
      if (!res.ok || !data.success) {
        alert(data.error || "Failed to update test mode");
      } else {
        setCurrentIsTest(data.is_test);
        if (onSuccess) {
          onSuccess(data.is_test);
        } else {
          router.refresh();
          window.location.reload();
        }
      }
    } catch (err: any) {
      alert("Error updating mode: " + err.message);
    } finally {
      setLoading(false);
    }
  };

  const pad = size === "lg" ? "8px 16px" : size === "md" ? "6px 12px" : "4px 8px";
  const fontSize = size === "lg" ? 14 : size === "md" ? 13 : 11;

  return (
    <button
      type="button"
      onClick={handleToggle}
      disabled={loading}
      className="button secondary"
      title={isTester ? "Click to change mode to Actual Production Data" : "Click to change mode to Tester Data"}
      style={{
        display: "inline-flex",
        alignItems: "center",
        gap: 6,
        padding: pad,
        fontSize,
        fontWeight: 700,
        borderRadius: 6,
        cursor: loading ? "wait" : "pointer",
        background: isTester ? "#fffbeb" : "#f0fdf4",
        color: isTester ? "#b45309" : "#15803d",
        borderColor: isTester ? "#fde68a" : "#bbf7d0",
        whiteSpace: "nowrap",
        opacity: loading ? 0.6 : 1,
      }}
    >
      {loading ? (
        "⏳ Updating..."
      ) : label ? (
        label
      ) : isTester ? (
        "🧪 TESTER DATA ⇄ Switch to Actual"
      ) : (
        "💼 ACTUAL DATA ⇄ Switch to Test"
      )}
    </button>
  );
}
