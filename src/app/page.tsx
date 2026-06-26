"use client";

import { useState, useEffect, useCallback } from "react";
import { Header } from "@/components/layout/Header";
import { Footer } from "@/components/layout/Footer";
import { Container } from "@/components/layout/Container";
import { CaseGrid } from "@/components/case/CaseGrid";
import { CaseFilter } from "@/components/case/CaseFilter";
import { ToastContainer } from "@/components/ui/Toast";

export default function HomePage() {
  const [cases, setCases] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [province, setProvince] = useState("");
  const [city, setCity] = useState("");
  const [district, setDistrict] = useState("");
  const [gender, setGender] = useState("");

  const fetchCases = useCallback(async () => {
    setLoading(true);
    const params = new URLSearchParams();
    if (province) params.set("province", province);
    if (city) params.set("city", city);
    if (district) params.set("district", district);
    if (gender) params.set("gender", gender);
    const res = await fetch(`/api/cases?${params}`);
    const data = await res.json();
    setCases(data);
    setLoading(false);
  }, [province, city, district, gender]);

  useEffect(() => {
    fetchCases();
  }, [fetchCases]);

  return (
    <div className="flex flex-col min-h-full">
      <Header />
      <main className="flex-1 py-6">
        <Container>
          <div className="text-center mb-6">
            <h1 className="text-2xl font-bold text-gray-900 mb-1">我好想你</h1>
            <p className="text-sm text-gray-500">助力每一个家庭团圆</p>
          </div>
          <CaseFilter
            province={province}
            city={city}
            district={district}
            gender={gender}
            onProvinceChange={setProvince}
            onCityChange={setCity}
            onDistrictChange={setDistrict}
            onGenderChange={setGender}
          />
          <CaseGrid items={cases} loading={loading} />
        </Container>
      </main>
      <Footer />
      <ToastContainer />
    </div>
  );
}
