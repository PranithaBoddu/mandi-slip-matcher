import { useState, useCallback } from "react";
import { apiClient } from "../lib/api-client";
import type { GatePass } from "@shared/types/gate-pass.types";
import type { WeighbridgeSlip } from "@shared/types/weighbridge.types";

interface UploadSessionState {
  sessionId: string | null;
  gatePass: GatePass | null;
  weighbridgeSlip: WeighbridgeSlip | null;
  isUploadingGatePass: boolean;
  isUploadingWeighbridge: boolean;
  error: string | null;
}

export function useUploadSession() {
  const [state, setState] = useState<UploadSessionState>({
    sessionId: null,
    gatePass: null,
    weighbridgeSlip: null,
    isUploadingGatePass: false,
    isUploadingWeighbridge: false,
    error: null,
  });

  const ensureSession = useCallback(async (): Promise<string> => {
    if (state.sessionId) return state.sessionId;
    const { sessionId } = await apiClient.createSession();
    setState(s => ({ ...s, sessionId }));
    return sessionId;
  }, [state.sessionId]);

  const uploadGatePass = useCallback(async (file: File, captureMode: "camera" | "file_upload" | "scan") => {
    setState(s => ({ ...s, isUploadingGatePass: true, error: null }));
    try {
      const sessionId = await ensureSession();
      const { gatePass } = await apiClient.uploadGatePass(sessionId, file, captureMode);
      setState(s => ({ ...s, gatePass, isUploadingGatePass: false }));
    } catch (err: any) {
      setState(s => ({ ...s, isUploadingGatePass: false, error: err.message ?? "Upload failed" }));
    }
  }, [ensureSession]);

  const uploadWeighbridgeSlip = useCallback(async (file: File, captureMode: "camera" | "file_upload" | "scan") => {
    setState(s => ({ ...s, isUploadingWeighbridge: true, error: null }));
    try {
      const sessionId = await ensureSession();
      const { weighbridgeSlip } = await apiClient.uploadWeighbridgeSlip(sessionId, file, captureMode);
      setState(s => ({ ...s, weighbridgeSlip, isUploadingWeighbridge: false }));
    } catch (err: any) {
      setState(s => ({ ...s, isUploadingWeighbridge: false, error: err.message ?? "Upload failed" }));
    }
  }, [ensureSession]);

  const removeGatePass = useCallback(async () => {
    if (!state.sessionId || !state.gatePass) return;
    try {
      await apiClient.removeGatePass(state.sessionId);
      setState(s => ({ ...s, gatePass: null, error: null }));
    } catch (err: any) {
      setState(s => ({ ...s, error: err.message ?? "Could not remove gate pass" }));
    }
  }, [state.sessionId, state.gatePass]);

  const removeWeighbridgeSlip = useCallback(async () => {
    if (!state.sessionId || !state.weighbridgeSlip) return;
    try {
      await apiClient.removeWeighbridgeSlip(state.sessionId);
      setState(s => ({ ...s, weighbridgeSlip: null, error: null }));
    } catch (err: any) {
      setState(s => ({ ...s, error: err.message ?? "Could not remove weighbridge slip" }));
    }
  }, [state.sessionId, state.weighbridgeSlip]);

  const bothReady = !!state.gatePass && !!state.weighbridgeSlip;

  return { ...state, uploadGatePass, uploadWeighbridgeSlip, removeGatePass, removeWeighbridgeSlip, bothReady };
}