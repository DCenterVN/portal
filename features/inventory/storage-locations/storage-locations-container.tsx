"use client";

import { useStorageLocations } from "./use-storage-locations";
import { StorageLocationsView } from "./storage-locations-view";

export function StorageLocationsContainer() {
  return <StorageLocationsView {...useStorageLocations()} />;
}
