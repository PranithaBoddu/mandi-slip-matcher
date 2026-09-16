"use client";

import { useRouter } from "next/navigation";
import { useUploadSession } from "../hooks/useUploadSession";
import { DualDropzone } from "../components/upload/DualDropzone";
import { useEffect, useState } from "react";
import { apiClient } from "../lib/api-client";
import type { AuditLog } from "@shared/types/audit.types";

export default function DashboardPage() {
  const router = useRouter();
  const {
    sessionId, gatePass, weighbridgeSlip,
    isUploadingGatePass, isUploadingWeighbridge, error,
    uploadGatePass, uploadWeighbridgeSlip, bothReady,
    removeGatePass, removeWeighbridgeSlip,
  } = useUploadSession();

  const [recentLogs, setRecentLogs] = useState<AuditLog[]>([]);

  useEffect(() => {
    apiClient.listAuditLogs().then(({ logs }) => setRecentLogs(logs.slice(0, 8))).catch(() => {});
  }, []);

  return (
    <div className="mx-auto max-w-5xl space-y-8 p-6">
      <header>
        <h1 className="text-xl font-bold text-gray-900">Mandi Gate Pass &amp; Weighbridge Slip Matcher</h1>
        <p className="mt-1 text-sm text-gray-500">
          Upload both documents to auto-extract, cross-check, and clear payouts in seconds.
        </p>
      </header>

      <section>
        <DualDropzone
          onGatePassSelected={uploadGatePass}
          onWeighbridgeSelected={uploadWeighbridgeSlip}
          isUploadingGatePass={isUploadingGatePass}
          isUploadingWeighbridge={isUploadingWeighbridge}
          gatePassPreviewUrl={null /* wire to object URL of selected file for instant preview */}
          weighbridgePreviewUrl={null}
          gatePassFileName={gatePass?.document.originalFilename}
          weighbridgeFileName={weighbridgeSlip?.document.originalFilename}
          onRemoveGatePass={removeGatePass}
          onRemoveWeighbridgeSlip={removeWeighbridgeSlip}
          error={error}
        />

        <div className="mt-4 flex justify-end">
          <button
            disabled={!bothReady}
            onClick={() => sessionId && router.push(`/review/${sessionId}`)}
            className="rounded-lg bg-gray-900 px-5 py-2.5 text-sm font-semibold text-white hover:bg-gray-700 disabled:cursor-not-allowed disabled:bg-gray-300"
          >
            {bothReady ? "Review & Reconcile →" : "Upload both documents to continue"}
          </button>
        </div>
      </section>

      <section>
        <h2 className="mb-3 text-sm font-semibold uppercase tracking-wide text-gray-500">Recent Decisions</h2>
        <div className="overflow-hidden rounded-xl border border-gray-200 bg-white">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-gray-100 bg-gray-50 text-left text-xs uppercase tracking-wide text-gray-500">
                <th className="px-4 py-2">Token</th>
                <th className="px-4 py-2">Decision</th>
                <th className="px-4 py-2">Agent</th>
                <th className="px-4 py-2">Decided At</th>
                <th className="px-4 py-2"></th>
              </tr>
            </thead>
            <tbody>
              {recentLogs.map((log) => (
                <tr key={log.id} className="border-b border-gray-50 last:border-0">
                  <td className="px-4 py-2 font-medium text-gray-800">{log.tokenId}</td>
                  <td className="px-4 py-2 capitalize text-gray-600">{log.decision.replace(/_/g, " ")}</td>
                  <td className="px-4 py-2 text-gray-600">{log.decidedBy.agentName}</td>
                  <td className="px-4 py-2 text-gray-500">{new Date(log.decidedAt).toLocaleString()}</td>
                  <td className="px-4 py-2">
                    <button
                      onClick={() => router.push(`/audit/${log.id}`)}
                      className="text-xs font-medium text-blue-600 hover:underline"
                    >
                      View Receipt
                    </button>
                  </td>
                </tr>
              ))}
              {recentLogs.length === 0 && (
                <tr><td colSpan={5} className="px-4 py-6 text-center text-gray-400">No decisions recorded yet.</td></tr>
              )}
            </tbody>
          </table>
        </div>
      </section>
    </div>
  );
}