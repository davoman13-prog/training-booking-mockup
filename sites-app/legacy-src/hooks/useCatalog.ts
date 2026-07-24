import { useEffect, useState } from "react";
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

  useEffect(() => {
    const controller = new AbortController();

    fetch("/api/catalog", { signal: controller.signal })
      .then((response) => {
        if (!response.ok) throw new Error("Catalogue request failed");
        return response.json() as Promise<Catalog>;
      })
      .then((data) => {
        setCatalog(data);
        setIsLive(true);
      })
      .catch((error: unknown) => {
        if (error instanceof DOMException && error.name === "AbortError") return;
        setIsLive(false);
      });

    return () => controller.abort();
  }, []);

  return { ...catalog, isLive };
}
