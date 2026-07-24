import { useCallback, useEffect, useState } from "react";
import { AttendanceRecord, Booking, Certificate, Course, Delegate, Invoice, Location, Session, Trainer } from "../types";

interface Catalog {
  courses: Course[];
  locations: Location[];
  sessions: Session[];
  trainers: Trainer[];
  delegates: Delegate[];
  bookings: Booking[];
  attendanceRecords: AttendanceRecord[];
  invoices: Invoice[];
  certificates: Certificate[];
}

const emptyCatalog: Catalog = {
  courses: [], locations: [], sessions: [], trainers: [], delegates: [], bookings: [],
  attendanceRecords: [], invoices: [], certificates: [],
};

export default function useCatalog() {
  const [catalog, setCatalog] = useState<Catalog>(emptyCatalog);
  const [isLive, setIsLive] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [loadError, setLoadError] = useState("");

  const refresh = useCallback(async (signal?: AbortSignal) => {
    setIsLoading(true);
    setLoadError("");
    try {
      const response = await fetch("/api/catalog", {
        signal,
        cache: "no-store",
      });
      if (!response.ok) throw new Error("Catalogue request failed");
      const data = await response.json() as Catalog;
      setCatalog(data);
      setIsLive(true);
      return data;
    } catch (error: unknown) {
      if (error instanceof DOMException && error.name === "AbortError") return;
      setIsLive(false);
      setLoadError("The live catalogue could not be loaded. Please try again.");
      throw error;
    } finally {
      if (!signal?.aborted) setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    const controller = new AbortController();
    // The initial request deliberately drives this hook's loading state.
    // eslint-disable-next-line react-hooks/set-state-in-effect
    void refresh(controller.signal).catch(() => undefined);
    return () => controller.abort();
  }, [refresh]);

  return { ...catalog, isLive, isLoading, loadError, refresh };
}
