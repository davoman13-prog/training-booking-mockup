import { useCallback, useEffect, useState } from "react";
import {
  courses as fallbackCourses,
  locations as fallbackLocations,
  sessions as fallbackSessions,
  trainers as fallbackTrainers,
} from "../data/mockData";
import { Course, Location, Session, Trainer } from "../types";

interface Catalog {
  courses: Course[];
  locations: Location[];
  sessions: Session[];
  trainers: Trainer[];
}

const fallbackCatalog: Catalog = {
  courses: fallbackCourses,
  locations: fallbackLocations,
  sessions: fallbackSessions,
  trainers: fallbackTrainers,
};

export default function useCatalog() {
  const [catalog, setCatalog] = useState<Catalog>(fallbackCatalog);
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
    void refresh(controller.signal).catch(() => undefined);
    return () => controller.abort();
  }, [refresh]);

  return { ...catalog, isLive, isLoading, loadError, refresh };
}
