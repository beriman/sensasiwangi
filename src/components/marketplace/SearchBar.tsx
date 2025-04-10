import React, { useState } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Search, Filter, ChevronDown } from "lucide-react";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
  SheetFooter,
  SheetClose,
} from "@/components/ui/sheet";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Slider } from "@/components/ui/slider";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";

interface SearchBarProps {
  onSearch?: (query: string, filters: any) => void;
}

export default function SearchBar({ onSearch }: SearchBarProps) {
  const navigate = useNavigate();
  const location = useLocation();
  const searchParams = new URLSearchParams(location.search);
  
  const [searchQuery, setSearchQuery] = useState(searchParams.get("q") || "");
  const [category, setCategory] = useState(searchParams.get("category") || "all");
  const [priceRange, setPriceRange] = useState<[number, number]>([0, 1000000]);
  const [sortBy, setSortBy] = useState(searchParams.get("sort") || "newest");
  const [inStock, setInStock] = useState(searchParams.get("inStock") === "true");
  const [freeShipping, setFreeShipping] = useState(searchParams.get("freeShipping") === "true");
  const [rating, setRating] = useState(parseInt(searchParams.get("rating") || "0"));

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    
    const params = new URLSearchParams();
    if (searchQuery) params.set("q", searchQuery);
    if (category && category !== "all") params.set("category", category);
    if (sortBy && sortBy !== "newest") params.set("sort", sortBy);
    if (inStock) params.set("inStock", "true");
    if (freeShipping) params.set("freeShipping", "true");
    if (rating > 0) params.set("rating", rating.toString());
    if (priceRange[0] > 0) params.set("minPrice", priceRange[0].toString());
    if (priceRange[1] < 1000000) params.set("maxPrice", priceRange[1].toString());
    
    const queryString = params.toString();
    navigate(`/marketplace${queryString ? `?${queryString}` : ""}`);
    
    if (onSearch) {
      onSearch(searchQuery, {
        category: category !== "all" ? category : undefined,
        minPrice: priceRange[0] > 0 ? priceRange[0] : undefined,
        maxPrice: priceRange[1] < 1000000 ? priceRange[1] : undefined,
        sortBy,
        inStock,
        freeShipping,
        rating: rating > 0 ? rating : undefined,
      });
    }
  };

  const formatPrice = (price: number) => {
    return new Intl.NumberFormat("id-ID", {
      style: "currency",
      currency: "IDR",
      minimumFractionDigits: 0,
    }).format(price);
  };

  const handleReset = () => {
    setSearchQuery("");
    setCategory("all");
    setPriceRange([0, 1000000]);
    setSortBy("newest");
    setInStock(false);
    setFreeShipping(false);
    setRating(0);
  };

  return (
    <div className="bg-white rounded-lg shadow-sm p-4 mb-6">
      <form onSubmit={handleSearch} className="flex flex-col md:flex-row gap-4">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
          <Input
            placeholder="Cari parfum, bahan parfum, atau alat perfumery..."
            className="pl-10 border-gray-200"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </div>
        <Button type="submit" className="bg-purple-600 hover:bg-purple-700 text-white">
          Cari
        </Button>
        
        <Sheet>
          <SheetTrigger asChild>
            <Button variant="outline" className="flex items-center" type="button">
              <Filter className="h-4 w-4 mr-2" />
              Filter
              <ChevronDown className="h-4 w-4 ml-2" />
            </Button>
          </SheetTrigger>
          <SheetContent className="w-[300px] sm:w-[400px] overflow-y-auto">
            <SheetHeader>
              <SheetTitle>Filter Produk</SheetTitle>
              <SheetDescription>
                Sesuaikan pencarian Anda dengan filter berikut
              </SheetDescription>
            </SheetHeader>
            
            <div className="py-6 space-y-6">
              <div className="space-y-2">
                <Label>Kategori</Label>
                <Select value={category} onValueChange={setCategory}>
                  <SelectTrigger>
                    <SelectValue placeholder="Pilih kategori" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Semua Kategori</SelectItem>
                    <SelectItem value="parfum">Parfum Jadi</SelectItem>
                    <SelectItem value="bahan">Bahan Baku</SelectItem>
                    <SelectItem value="alat">Alat Perfumery</SelectItem>
                    <SelectItem value="sambatan">Sambatan</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              
              <div className="space-y-2">
                <Label>Rentang Harga</Label>
                <div className="pt-4">
                  <Slider
                    defaultValue={[0, 1000000]}
                    max={1000000}
                    step={10000}
                    value={priceRange}
                    onValueChange={(value) => setPriceRange(value as [number, number])}
                    className="mb-6"
                  />
                  <div className="flex justify-between text-sm text-gray-500">
                    <span>{formatPrice(priceRange[0])}</span>
                    <span>{formatPrice(priceRange[1])}</span>
                  </div>
                </div>
              </div>
              
              <div className="space-y-2">
                <Label>Urutkan Berdasarkan</Label>
                <Select value={sortBy} onValueChange={setSortBy}>
                  <SelectTrigger>
                    <SelectValue placeholder="Urutkan berdasarkan" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="newest">Terbaru</SelectItem>
                    <SelectItem value="price_asc">Harga: Rendah ke Tinggi</SelectItem>
                    <SelectItem value="price_desc">Harga: Tinggi ke Rendah</SelectItem>
                    <SelectItem value="rating">Rating Tertinggi</SelectItem>
                    <SelectItem value="popularity">Popularitas</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              
              <div className="space-y-4">
                <Label>Opsi Lainnya</Label>
                <div className="flex items-center space-x-2">
                  <Checkbox 
                    id="inStock" 
                    checked={inStock}
                    onCheckedChange={(checked) => setInStock(checked as boolean)}
                  />
                  <label
                    htmlFor="inStock"
                    className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
                  >
                    Hanya tampilkan produk yang tersedia
                  </label>
                </div>
                
                <div className="flex items-center space-x-2">
                  <Checkbox 
                    id="freeShipping" 
                    checked={freeShipping}
                    onCheckedChange={(checked) => setFreeShipping(checked as boolean)}
                  />
                  <label
                    htmlFor="freeShipping"
                    className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
                  >
                    Gratis ongkir
                  </label>
                </div>
              </div>
              
              <div className="space-y-2">
                <Label>Rating Minimum</Label>
                <div className="flex items-center space-x-2 pt-2">
                  {[1, 2, 3, 4, 5].map((star) => (
                    <Button
                      key={star}
                      type="button"
                      variant={rating >= star ? "default" : "outline"}
                      className={`h-8 w-8 p-0 ${rating >= star ? "bg-yellow-500 hover:bg-yellow-600" : ""}`}
                      onClick={() => setRating(star === rating ? 0 : star)}
                    >
                      {star}
                    </Button>
                  ))}
                  {rating > 0 && (
                    <span className="text-sm text-gray-500 ml-2">
                      {rating}+ bintang
                    </span>
                  )}
                </div>
              </div>
            </div>
            
            <SheetFooter className="flex flex-row justify-between sm:justify-between gap-2 pt-4">
              <Button 
                variant="outline" 
                onClick={handleReset}
                className="flex-1"
              >
                Reset
              </Button>
              <SheetClose asChild>
                <Button 
                  type="button" 
                  className="flex-1 bg-purple-600 hover:bg-purple-700"
                  onClick={handleSearch}
                >
                  Terapkan Filter
                </Button>
              </SheetClose>
            </SheetFooter>
          </SheetContent>
        </Sheet>
      </form>
    </div>
  );
}
