import React, { useEffect, useState, useRef } from "react";
import axios from "axios";

const RESEND_INTERVAL_MINUTES = Number(process.env.REACT_APP_OTP_RESEND_INTERVAL_MINUTES || 5);
const OTP_EXPIRY_MINUTES = Number(process.env.REACT_APP_OTP_EXPIRY_MINUTES || 5);

function formatTimeLeft(ms) {
  const totalSec = Math.max(0, Math.floor(ms / 1000));
  const mm = String(Math.floor(totalSec / 60)).padStart(2, "0");
  const ss = String(totalSec % 60).padStart(2, "0");
  return `${mm}:${ss}`;
}

export default function OtpVerification({ userId, email, onVerified }) {
  const [code, setCode] = useState("");
  const [message, setMessage] = useState(null);
  const [resendDisabled, setResendDisabled] = useState(true);
  const [resendTimerMs, setResendTimerMs] = useState(RESEND_INTERVAL_MINUTES * 60 * 1000);
  const [otpTimerMs, setOtpTimerMs] = useState(OTP_EXPIRY_MINUTES * 60 * 1000);
  const resendIntervalRef = useRef(null);
  const otpIntervalRef = useRef(null);

  useEffect(() => {
    // Start both timers on mount
    const start = Date.now();
    setResendDisabled(true);
    setResendTimerMs(RESEND_INTERVAL_MINUTES * 60 * 1000);
    setOtpTimerMs(OTP_EXPIRY_MINUTES * 60 * 1000);

    resendIntervalRef.current = setInterval(() => {
      setResendTimerMs(prev => {
        const next = prev - 1000;
        if (next <= 0) {
          setResendDisabled(false);
          clearInterval(resendIntervalRef.current);
          return 0;
        }
        return next;
      });
    }, 1000);

    otpIntervalRef.current = setInterval(() => {
      setOtpTimerMs(prev => {
        const next = prev - 1000;
        if (next <= 0) {
          clearInterval(otpIntervalRef.current);
          return 0;
        }
        return next;
      });
    }, 1000);

    return () => {
      clearInterval(resendIntervalRef.current);
      clearInterval(otpIntervalRef.current);
    };
  }, [userId, email]);

  const handleVerify = async () => {
    setMessage(null);
    try {
      const resp = await axios.post("/api/auth/verify-otp", { userId, email, code });
      if (resp.data?.success) {
        setMessage({ type: "success", text: resp.data.message || "Verified" });
        if (typeof onVerified === "function") onVerified();
      } else {
        setMessage({ type: "error", text: resp.data?.message || "Verification failed" });
      }
    } catch (err) {
      const text = err?.response?.data?.message || err.message || "Error verifying OTP";
      setMessage({ type: "error", text });
    }
  };

  const handleResend = async () => {
    setMessage(null);
    try {
      const resp = await axios.post("/api/auth/resend-otp", { userId, email });
      if (resp.data?.success) {
        setMessage({ type: "success", text: resp.data.message || "OTP resent" });

        // restart timers
        setResendDisabled(true);
        setResendTimerMs(RESEND_INTERVAL_MINUTES * 60 * 1000);
        setOtpTimerMs(OTP_EXPIRY_MINUTES * 60 * 1000);

        clearInterval(resendIntervalRef.current);
        clearInterval(otpIntervalRef.current);

        resendIntervalRef.current = setInterval(() => {
          setResendTimerMs(prev => {
            const next = prev - 1000;
            if (next <= 0) {
              setResendDisabled(false);
              clearInterval(resendIntervalRef.current);
              return 0;
            }
            return next;
          });
        }, 1000);

        otpIntervalRef.current = setInterval(() => {
          setOtpTimerMs(prev => {
            const next = prev - 1000;
            if (next <= 0) {
              clearInterval(otpIntervalRef.current);
              return 0;
            }
            return next;
          });
        }, 1000);

      } else {
        setMessage({ type: "error", text: resp.data?.message || "Resend failed" });
      }
    } catch (err) {
      const text = err?.response?.data?.message || err.message || "Error resending OTP";
      setMessage({ type: "error", text });
    }
  };

  return (
    <div style={{ maxWidth: 420 }}>
      <h3>Verify your email</h3>
      <p>We sent an OTP to <strong>{email}</strong>. OTP expires in {formatTimeLeft(otpTimerMs)}</p>

      <input
        value={code}
        onChange={(e) => setCode(e.target.value)}
        placeholder="Enter OTP"
        style={{ width: "100%", padding: 8, fontSize: 16, marginBottom: 8 }}
      />

      <button onClick={handleVerify} style={{ width: "100%", padding: 10, marginBottom: 8 }}>
        Verify
      </button>

      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
        <button
          onClick={handleResend}
          disabled={resendDisabled}
          style={{ padding: 8 }}
        >
          {resendDisabled ? `Resend available in ${formatTimeLeft(resendTimerMs)}` : "Resend OTP"}
        </button>

        <small>Resends allowed every {RESEND_INTERVAL_MINUTES} minute(s)</small>
      </div>

      {message && (
        <div style={{ marginTop: 12, color: message.type === "error" ? "red" : "green" }}>
          {message.text}
        </div>
      )}
    </div>
  );
}
