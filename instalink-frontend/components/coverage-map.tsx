"use client";

import { ChangeEvent, useEffect, useMemo, useState } from "react";
import {
  Circle,
  MapContainer,
  Marker,
  Polyline,
  TileLayer,
  useMap,
} from "react-leaflet";
import L, { LatLngBoundsExpression, LatLngExpression } from "leaflet";

type Coordinate = [number, number];
type CableLine = Coordinate[];
type CustomerLocation = { lat: number; lon: number; label: string };

const DEFAULT_LOCATION: CustomerLocation = {
  lat: -6.8586,
  lon: 107.9236,
  label: "Lokasi awal peta",
};
const COVERAGE_RADIUS_METERS = 50;
const MAX_KML_SIZE_BYTES = 2 * 1024 * 1024;

const customerIcon = L.divIcon({
  className: "",
  html: '<span style="display:block;width:18px;height:18px;border:3px solid white;border-radius:50%;background:#dc2626;box-shadow:0 1px 5px rgba(0,0,0,.45)"></span>',
  iconSize: [18, 18],
  iconAnchor: [9, 9],
});

function parseKml(text: string): CableLine[] {
  const document = new DOMParser().parseFromString(text, "application/xml");
  if (document.querySelector("parsererror")) {
    throw new Error("Format KML tidak valid.");
  }

  return Array.from(document.getElementsByTagName("LineString"))
    .map((line) => line.getElementsByTagName("coordinates")[0]?.textContent ?? "")
    .map((coordinates) =>
      coordinates
        .trim()
        .split(/\s+/)
        .map((coordinate) => coordinate.split(",").map(Number))
        .filter(([lon, lat]) => Number.isFinite(lon) && Number.isFinite(lat))
        .map(([lon, lat]) => [lat, lon] as Coordinate),
    )
    .filter((line) => line.length >= 2);
}

function distanceToSegmentMeters(point: Coordinate, start: Coordinate, end: Coordinate) {
  const earthRadius = 6371000;
  const latitudeScale = (Math.PI / 180) * earthRadius;
  const longitudeScale = latitudeScale * Math.cos((point[0] * Math.PI) / 180);
  const px = (point[1] - point[1]) * longitudeScale;
  const py = (point[0] - point[0]) * latitudeScale;
  const sx = (start[1] - point[1]) * longitudeScale;
  const sy = (start[0] - point[0]) * latitudeScale;
  const ex = (end[1] - point[1]) * longitudeScale;
  const ey = (end[0] - point[0]) * latitudeScale;
  const dx = ex - sx;
  const dy = ey - sy;
  const lengthSquared = dx * dx + dy * dy;
  const projection = lengthSquared === 0 ? 0 : Math.max(0, Math.min(1, ((px - sx) * dx + (py - sy) * dy) / lengthSquared));
  const closestX = sx + projection * dx;
  const closestY = sy + projection * dy;
  return Math.sqrt((px - closestX) ** 2 + (py - closestY) ** 2);
}

function isWithinCoverage(location: CustomerLocation, lines: CableLine[]) {
  return lines.some((line) =>
    line.slice(1).some((point, index) =>
      distanceToSegmentMeters([location.lat, location.lon], line[index], point) <= COVERAGE_RADIUS_METERS,
    ),
  );
}

function MapViewport({ location, lines }: { location: CustomerLocation; lines: CableLine[] }) {
  const map = useMap();
  useEffect(() => {
    map.setView([location.lat, location.lon], Math.max(map.getZoom(), 16));
  }, [location, map]);
  useEffect(() => {
    if (lines.length > 0) {
      const bounds = L.latLngBounds(lines.flat().map(([lat, lon]) => [lat, lon] as [number, number]));
      map.fitBounds(bounds.pad(0.15), { maxZoom: 17 });
    }
  }, [lines, map]);
  return null;
}

export function CoverageMap() {
  const [lines, setLines] = useState<CableLine[]>([]);
  const [location, setLocation] = useState<CustomerLocation | null>(null);
  const [hasCheckedCoverage, setHasCheckedCoverage] = useState(false);
  const [address, setAddress] = useState("");
  const [status, setStatus] = useState("Memuat jalur jaringan...");
  const [loadingLocation, setLoadingLocation] = useState(false);
  const [coverageDataAvailable, setCoverageDataAvailable] = useState<boolean | null>(null);

  useEffect(() => {
    fetch("/coverage.kml")
      .then(async (response) => {
        if (!response.ok) throw new Error("File coverage.kml belum tersedia.");
        return parseKml(await response.text());
      })
      .then((parsedLines) => {
        setLines(parsedLines);
        setCoverageDataAvailable(parsedLines.length > 0);
        setStatus(parsedLines.length > 0 ? `${parsedLines.length} jalur jaringan ditampilkan sebagai pemeriksaan indikatif.` : "Jalur KML tidak memiliki jalur yang dapat diperiksa.");
      })
      .catch(() => {
        setCoverageDataAvailable(false);
        setStatus("Unggah file KML jalur kabel untuk menampilkan coverage.");
      });
  }, []);

  const indicativeCoverage = useMemo(
    () => location !== null && isWithinCoverage(location, lines),
    [lines, location],
  );

  const selectLocation = (nextLocation: CustomerLocation) => {
    setLocation(nextLocation);
    setHasCheckedCoverage(true);
    setStatus(lines.length > 0 ? "Lokasi berhasil diperiksa secara indikatif." : "Jalur KML belum dimuat; hasil belum dapat diperiksa.");
  };

  const useDeviceLocation = () => {
    if (!navigator.geolocation) {
      setStatus("Browser ini tidak mendukung pelacakan lokasi perangkat.");
      return;
    }
    setLoadingLocation(true);
    navigator.geolocation.getCurrentPosition(
      ({ coords }) => {
        selectLocation({ lat: coords.latitude, lon: coords.longitude, label: "Perangkat Anda" });
        setLoadingLocation(false);
      },
      () => {
        setStatus("Lokasi perangkat tidak dapat diakses. Periksa izin lokasi browser.");
        setLoadingLocation(false);
      },
      { enableHighAccuracy: true, timeout: 10000, maximumAge: 60000 },
    );
  };

  const searchAddress = async () => {
    if (!address.trim()) return;
    setLoadingLocation(true);
    try {
      const response = await fetch(`https://nominatim.openstreetmap.org/search?format=jsonv2&limit=1&countrycodes=id&q=${encodeURIComponent(address)}`);
      if (!response.ok) throw new Error("Gagal mencari alamat.");
      const result = (await response.json()) as Array<{ lat: string; lon: string; display_name: string }>;
      if (!result[0]) throw new Error("Alamat tidak ditemukan.");
      selectLocation({ lat: Number(result[0].lat), lon: Number(result[0].lon), label: result[0].display_name });
    } catch (error) {
      setStatus(error instanceof Error ? error.message : "Alamat tidak dapat dicari.");
    } finally {
      setLoadingLocation(false);
    }
  };

  const uploadKml = (event: ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;
    if (file.size > MAX_KML_SIZE_BYTES) {
      setStatus("Ukuran KML terlalu besar. Gunakan file maksimal 2 MB.");
      event.target.value = "";
      return;
    }
    const reader = new FileReader();
    reader.onload = () => {
      try {
        const parsedLines = parseKml(String(reader.result));
        if (parsedLines.length === 0) throw new Error("KML tidak memiliki geometry LineString.");
        setLines(parsedLines);
        setCoverageDataAvailable(true);
        setStatus(`${parsedLines.length} jalur jaringan berhasil dimuat.`);
      } catch (error) {
        setStatus(error instanceof Error ? error.message : "File KML tidak dapat dibaca.");
      }
    };
    reader.readAsText(file);
  };

  const mapLocation: LatLngExpression = location ? [location.lat, location.lon] : [DEFAULT_LOCATION.lat, DEFAULT_LOCATION.lon];
  const bounds: LatLngBoundsExpression | undefined = lines.length > 0
    ? lines.flat().map(([lat, lon]) => [lat, lon] as [number, number])
    : undefined;

  return (
    <div className="space-y-4">
      <div className="grid gap-3 md:grid-cols-[1fr_auto]">
        <div className="flex min-w-0 gap-2">
          <input value={address} onChange={(event) => setAddress(event.target.value)} onKeyDown={(event) => event.key === "Enter" && void searchAddress()} placeholder="Cari alamat pemasangan..." className="min-w-0 flex-1 rounded-xl border border-slate-300 px-4 py-3 text-sm outline-none focus:border-cyan-600" />
          <button type="button" onClick={() => void searchAddress()} disabled={loadingLocation} className="shrink-0 rounded-xl bg-slate-950 px-3 py-3 text-xs font-semibold text-white disabled:opacity-50 sm:px-4 sm:text-sm">Cari alamat</button>
        </div>
        <button type="button" onClick={useDeviceLocation} disabled={loadingLocation} className="w-full rounded-xl border border-cyan-700 px-4 py-3 text-sm font-semibold text-cyan-800 disabled:opacity-50 md:w-auto">{loadingLocation ? "Memproses..." : "Gunakan lokasi perangkat"}</button>
      </div>
      <div className="flex flex-wrap items-center justify-between gap-3 text-xs text-slate-500">
        <span>{status}</span>
        <label className="cursor-pointer font-semibold text-cyan-700">Unggah KML<input type="file" accept=".kml,application/vnd.google-earth.kml+xml" onChange={uploadKml} className="sr-only" /></label>
      </div>
      {location && (
        <div className={`rounded-xl px-4 py-3 text-sm font-semibold ${indicativeCoverage ? "bg-emerald-50 text-emerald-800" : "bg-amber-50 text-amber-800"}`}>
          {location.label} — {coverageDataAvailable === false ? "Coverage belum dapat diperiksa karena data jalur belum tersedia." : indicativeCoverage ? "Terindikasi dekat jalur kabel dalam radius 50 meter." : "Belum terindikasi dekat jalur kabel dalam radius 50 meter."}
          <span className="mt-1 block text-xs font-normal">Hasil ini bukan keputusan akhir; konfirmasi alamat diperlukan.</span>
        </div>
      )}
      <div className="relative z-0 h-[28rem] overflow-hidden rounded-2xl border border-slate-200">
        <MapContainer center={mapLocation} zoom={14} bounds={bounds} className="h-full w-full">
          <TileLayer attribution='&copy; OpenStreetMap contributors' url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png" />
          <MapViewport location={location ?? DEFAULT_LOCATION} lines={lines} />
          {hasCheckedCoverage && lines.map((line, index) => <Polyline key={index} positions={line} pathOptions={{ color: "#2563eb", weight: 3 }} />)}
          {location && <><Marker position={[location.lat, location.lon]} icon={customerIcon} /><Circle center={[location.lat, location.lon]} radius={COVERAGE_RADIUS_METERS} pathOptions={{ color: "#dc2626", fillColor: "#dc2626", fillOpacity: 0.08 }} /></>}
        </MapContainer>
      </div>
      <p className="text-xs text-slate-500">Garis biru menunjukkan jalur kabel dari KML. Titik merah menunjukkan <strong>Perangkat Anda</strong>; pemeriksaan indikatif memakai radius 50 meter dan tetap perlu konfirmasi tim.</p>
    </div>
  );
}
