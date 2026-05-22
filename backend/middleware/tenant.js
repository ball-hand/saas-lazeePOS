// backend/middleware/tenant.js

// Simulasi database tenant pusat (Nantinya diganti dengan query DB, misal: SELECT * FROM tenants WHERE subdomain = X)
const mockTenantsDB = [
  { id: 101, name: 'Kopi Kenangan Senja', subdomain: 'kenangan', themeMode: 'dark', primaryColor: '#8B5CF6' },
  { id: 102, name: 'Toko Baju Makmur', subdomain: 'makmur', themeMode: 'light', primaryColor: '#10B981' },
];

export function tenantIdentificator(req, res, next) {
  const host = req.headers.host; // Mengambil data host, misal: 'kenangan.lazeepos.com' atau 'localhost:5000'
  
  if (!host) {
    return res.status(400).json({ message: 'Host header tidak ditemukan' });
  }

  // Pisahkan berdasarkan titik (.) untuk mencari subdomain
  const parts = host.split('.');
  
  let subdomain = null;

  // Logika penentuan jika berjalan di lokal (contoh: kenangan.localhost:5000) atau di produksi (kenangan.lazeepos.com)
  if (parts.length >= 3) {
    subdomain = parts[0];
  } else if (parts.length === 2 && parts[1].includes('localhost')) {
    // Penanganan khusus dev lokal jika menggunakan format: nama_subdomain.localhost
    subdomain = parts[0];
  }

  // Jika tidak ada subdomain, atau subdomainnya adalah 'www', berarti sedang mengakses Central Area (Landing Page/Super Admin)
  if (!subdomain || subdomain === 'www' || subdomain === 'localhost') {
    req.isCentral = true;
    req.tenant = null;
    return next();
  }

  // Jika ada subdomain, cari data tenant di database
  const currentTenant = mockTenantsDB.find(t => t.subdomain === subdomain.toLowerCase());

  if (!currentTenant) {
    return res.status(404).json({ 
      message: `Toko dengan subdomain '${subdomain}' tidak ditemukan atau masa berlangganan telah habis.` 
    });
  }

  // Tempelkan data tenant ke objek request agar bisa dipakai oleh controller/route di bawahnya
  req.isCentral = false;
  req.tenant = currentTenant;
  
  next();
}