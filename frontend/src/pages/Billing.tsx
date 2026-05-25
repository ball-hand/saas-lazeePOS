import { useState, useEffect, useCallback } from 'react';
import type { ReactElement } from 'react';
import {
  CreditCard, CheckCircle2, Zap, Shield, Building2,
  Calendar, RefreshCw, Loader2, Crown, AlertCircle, ExternalLink, HelpCircle, UserCheck, PackageOpen, GitCommit, X
} from 'lucide-react';
import api from '../api/client';
import toast from 'react-hot-toast';
import { useSearchParams } from 'react-router-dom';

const fmt = (val: number | string) =>
  'Rp ' + Math.round(parseFloat(String(val || 0))).toLocaleString('id-ID');

const STATUS_BADGE: Record<string, { label: string; cls: string }> = {
  active:     { label: 'Aktif',    cls: 'bg-[var(--success)]/10 text-[var(--success)] border-[var(--success)]/20' },
  trial:      { label: 'Trial',    cls: 'bg-[var(--info)]/10 text-[var(--info)] border-[var(--info)]/20' },
  suspended:  { label: 'Suspend',  cls: 'bg-[var(--danger)]/10 text-[var(--danger)] border-[var(--danger)]/20' },
  pending:    { label: 'Menunggu', cls: 'bg-[var(--warning)]/10 text-[var(--warning)] border-[var(--warning)]/20' },
  settlement: { label: 'Lunas',    cls: 'bg-[var(--success)]/10 text-[var(--success)] border-[var(--success)]/20' },
  expire:     { label: 'Kadaluarsa', cls: 'bg-[var(--danger)]/10 text-[var(--danger)] border-[var(--danger)]/20' },
  cancel:     { label: 'Dibatalkan', cls: 'bg-[var(--text-secondary)]/10 text-[var(--text-secondary)] border-[var(--border)]' },
};

declare global {
  interface Window { snap: any; }
}

export function Billing() {
  const [searchParams] = useSearchParams();
  const [data, setData] = useState<any>(null);
  const [plans, setPlans] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [billingCycle, setBillingCycle] = useState<'monthly' | 'yearly'>('monthly');
  const [isUpgrading, setIsUpgrading] = useState<number | null>(null);
  const [selectedTx, setSelectedTx] = useState<any>(null);

  /* Load Midtrans Snap JS */
  useEffect(() => {
    const isProd = import.meta.env.VITE_MIDTRANS_ENV === 'production';
    const clientKey = import.meta.env.VITE_MIDTRANS_CLIENT_KEY || '';
    const src = isProd
      ? 'https://app.midtrans.com/snap/snap.js'
      : 'https://app.sandbox.midtrans.com/snap/snap.js';

    if (!document.querySelector(`script[src="${src}"]`)) {
      const script = document.createElement('script');
      script.src = src;
      script.setAttribute('data-client-key', clientKey);
      document.head.appendChild(script);
    }
  }, []);

  /* Handle Midtrans redirect callbacks */
  useEffect(() => {
    const status = searchParams.get('status');
    if (status === 'finish') {
      toast.success('Pembayaran berhasil! Langganan Anda sedang diperbarui.');
      fetchData();
    } else if (status === 'error') {
      toast.error('Terjadi kesalahan saat pembayaran. Silakan coba lagi.');
    } else if (status === 'pending') {
      toast('Pembayaran pending. Selesaikan pembayaran Anda.', { icon: '⏳' });
    }
  }, [searchParams]);

  const fetchData = useCallback(async () => {
    setIsLoading(true);
    try {
      const [subRes, planRes] = await Promise.all([
        api.get('/payment/subscription'),
        api.get('/payment/plans'),
      ]);
      setData(subRes.data);
      setPlans(planRes.data.plans || []);
    } catch {
      toast.error('Gagal memuat info langganan.');
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => { fetchData(); }, [fetchData]);

  /* Initiate upgrade via Midtrans Snap */
  const handleUpgrade = async (planId: number) => {
    setIsUpgrading(planId);
    try {
      const { data: txData } = await api.post('/payment/create-transaction', {
        planId,
        billingCycle,
      });

      // Free plan upgrade
      if (txData.free) {
        toast.success(txData.message);
        fetchData();
        return;
      }

      // Open Midtrans Snap popup
      if (window.snap && txData.snapToken) {
        window.snap.pay(txData.snapToken, {
          onSuccess: () => {
            toast.success('Pembayaran berhasil! 🎉');
            setTimeout(fetchData, 2000);
          },
          onPending: () => {
            toast('Pembayaran pending. Cek email atau aplikasi bankmu.', { icon: '⏳' });
          },
          onError: () => {
            toast.error('Pembayaran gagal. Coba lagi.');
          },
          onClose: () => {
            toast('Popup ditutup sebelum selesai.', { icon: 'ℹ️' });
          },
        });
      } else if (txData.snapRedirectUrl) {
        window.open(txData.snapRedirectUrl, '_blank');
      }
    } catch (err: any) {
      toast.error(err?.response?.data?.message || 'Gagal memulai pembayaran.');
    } finally {
      setIsUpgrading(null);
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 size={32} className="animate-spin text-[var(--accent-primary)]" />
      </div>
    );
  }

  const currentPlanId = data?.subscription?.planId;
  const subStatus = data?.subscription?.status || data?.tenant?.status;
  const planLimits = data?.subscription?.plan;
  
  // Usage variables
  const productCount = data?.productCount || 0;
  const activeUsers = data?.activeUsers || 0;

  const planIcons: Record<string, ReactElement> = {
    Starter:    <Zap size={22} />,
    Pro:        <Crown size={22} />,
    Enterprise: <Building2 size={22} />,
  };

  return (
    <div className="animate-fade-in flex flex-col gap-8 pb-10">
      <div className="sticky top-[-16px] md:top-[-24px] lg:top-[-32px] z-20 bg-[var(--bg-main)] pt-4 md:pt-6 lg:pt-8 pb-4 -mt-4 md:-mt-6 lg:-mt-8 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 border-b border-[var(--border)] mb-4">
        <div>
          <h1 className="text-3xl font-extrabold text-[var(--text-primary)] tracking-tight">Langganan & Penagihan</h1>
          <p className="text-[var(--text-secondary)] mt-1 font-medium">Kelola paket aktif Anda dan riwayat tagihan.</p>
        </div>
        <button onClick={fetchData} className="p-2 rounded-xl border border-[var(--border)] text-[var(--text-secondary)] hover:text-[var(--accent-primary)] hover:border-[var(--accent-primary)] transition-all" title="Refresh">
          <RefreshCw size={18} />
        </button>
      </div>

      {/* Beginner Step-by-Step Guide Onboarding Panel */}
      <div className="p-5 rounded-2xl bg-[var(--accent-primary-transparent)] border border-[var(--accent-primary)]/20 flex gap-4 items-start shadow-sm">
        <HelpCircle size={24} className="text-[var(--accent-primary)] flex-shrink-0 mt-0.5" />
        <div className="space-y-2 text-xs leading-relaxed text-[var(--text-secondary)]">
          <h3 className="font-black text-sm text-[var(--text-primary)]">💡 Panduan Memulai & Cara Aktivasi Paket</h3>
          <p>Bagi pemilik toko baru, berikut langkah mudah untuk melakukan langganan paket premium LazeePOS:</p>
          <ol className="list-decimal list-inside space-y-1 font-medium pl-1 text-[var(--text-primary)]">
            <li>Pilih siklus pembayaran: <strong className="text-[var(--accent-primary)]">Bulanan</strong> atau <strong className="text-[var(--success)]">Tahunan (Hemat 15%)</strong> pada tombol pilihan di bawah.</li>
            <li>Klik tombol <strong className="text-[var(--accent-primary)]">Bayar Sekarang</strong> pada paket yang Anda inginkan (Cth: Paket Pro untuk fitur terlengkap).</li>
            <li>Pop-up aman Midtrans akan otomatis terbuka. Selesaikan pembayaran menggunakan QRIS, GoPay, OVO, atau Transfer Bank.</li>
            <li>Setelah pembayaran sukses, paket Anda akan otomatis aktif secara real-time dan kuota limit fitur Anda akan langsung bertambah!</li>
          </ol>
        </div>
      </div>

      {/* Current subscription card */}
      {data?.subscription && (
        <div className="bg-[var(--bg-surface-elevated)] border border-[var(--border)] rounded-2xl p-6 shadow-sm">
          <div className="flex flex-col md:flex-row justify-between gap-6">
            <div className="flex-1">
              <p className="text-[10px] font-bold text-[var(--text-secondary)] uppercase tracking-wider mb-1">Paket Aktif Saat Ini</p>
              <div className="flex items-center gap-3">
                <h2 className="text-2xl font-black text-[var(--text-primary)]">
                  {data.subscription.plan?.name || 'Starter'}
                </h2>
                {STATUS_BADGE[subStatus] && (
                  <span className={`px-2.5 py-1 rounded-full text-xs font-bold border ${STATUS_BADGE[subStatus].cls}`}>
                    {STATUS_BADGE[subStatus].label}
                  </span>
                )}
              </div>
              <p className="text-[var(--text-secondary)] text-sm mt-1 font-semibold">
                {fmt(data.subscription.plan?.monthlyPrice || 0)} / bulan
              </p>
            </div>
            
            <div className="flex flex-col gap-1.5 text-xs md:text-right text-[var(--text-secondary)] font-medium justify-center">
              {data.subscription.currentPeriodEnd && (
                <div className="flex items-center gap-2 md:justify-end">
                  <Calendar size={14} className="text-[var(--accent-primary)]" />
                  <span>Periode Aktif Berakhir: <strong className="text-[var(--text-primary)]">
                    {new Date(data.subscription.currentPeriodEnd).toLocaleDateString('id-ID', { day: 'numeric', month: 'long', year: 'numeric' })}
                  </strong></span>
                </div>
              )}
              {data.tenant?.trialEndsAt && subStatus === 'trial' && (
                <div className="flex items-center gap-2 md:justify-end text-[var(--warning)]">
                  <AlertCircle size={14} />
                  <span>Masa Uji Coba Berakhir: <strong>
                    {new Date(data.tenant.trialEndsAt).toLocaleDateString('id-ID', { day: 'numeric', month: 'long', year: 'numeric' })}
                  </strong></span>
                </div>
              )}
            </div>
          </div>

          {/* Plan limit utilization progress meters */}
          {planLimits && (
            <div className="mt-6 pt-6 border-t border-[var(--border)] space-y-4">
              <h3 className="text-xs font-bold text-[var(--text-primary)] uppercase tracking-wider mb-1">📊 Utilisasi Limit Kuota Toko Anda</h3>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-5">
                
                {/* Products utilization */}
                <div className="space-y-1.5 p-3 rounded-xl bg-[var(--bg-main)] border border-[var(--border)]">
                  <div className="flex justify-between items-center text-xs">
                    <span className="text-[var(--text-secondary)] font-semibold flex items-center gap-1"><PackageOpen size={13} /> Produk</span>
                    <span className="font-bold text-[var(--text-primary)]">
                      {productCount} / {planLimits.maxProducts >= 99999 ? '∞' : planLimits.maxProducts}
                    </span>
                  </div>
                  <div className="w-full bg-[var(--border)] h-2 rounded-full overflow-hidden">
                    <div 
                      className="bg-[var(--accent-primary)] h-full rounded-full transition-all duration-500"
                      style={{ width: `${planLimits.maxProducts >= 99999 ? 100 : Math.min((productCount / planLimits.maxProducts) * 100, 100)}%` }}
                    />
                  </div>
                </div>

                {/* Users utilization */}
                <div className="space-y-1.5 p-3 rounded-xl bg-[var(--bg-main)] border border-[var(--border)]">
                  <div className="flex justify-between items-center text-xs">
                    <span className="text-[var(--text-secondary)] font-semibold flex items-center gap-1"><UserCheck size={13} /> Pengguna/Staf</span>
                    <span className="font-bold text-[var(--text-primary)]">
                      {activeUsers} / {planLimits.maxUsers >= 99999 ? '∞' : planLimits.maxUsers}
                    </span>
                  </div>
                  <div className="w-full bg-[var(--border)] h-2 rounded-full overflow-hidden">
                    <div 
                      className="bg-[var(--accent-primary)] h-full rounded-full transition-all duration-500"
                      style={{ width: `${planLimits.maxUsers >= 99999 ? 100 : Math.min((activeUsers / planLimits.maxUsers) * 100, 100)}%` }}
                    />
                  </div>
                </div>

                {/* Branches utilization */}
                <div className="space-y-1.5 p-3 rounded-xl bg-[var(--bg-main)] border border-[var(--border)]">
                  <div className="flex justify-between items-center text-xs">
                    <span className="text-[var(--text-secondary)] font-semibold flex items-center gap-1"><GitCommit size={13} /> Cabang Toko</span>
                    <span className="font-bold text-[var(--text-primary)]">
                      1 / {planLimits.maxBranches >= 99999 ? '∞' : planLimits.maxBranches}
                    </span>
                  </div>
                  <div className="w-full bg-[var(--border)] h-2 rounded-full overflow-hidden">
                    <div 
                      className="bg-[var(--accent-primary)] h-full rounded-full transition-all duration-500"
                      style={{ width: `${planLimits.maxBranches >= 99999 ? 100 : Math.min((1 / planLimits.maxBranches) * 100, 100)}%` }}
                    />
                  </div>
                </div>

              </div>
            </div>
          )}
        </div>
      )}

      {/* Billing cycle toggle */}
      <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
        <h2 className="text-xl font-black text-[var(--text-primary)]">Pilih Paket Langganan</h2>
        <div className="flex items-center gap-2 bg-[var(--bg-surface-elevated)] border border-[var(--border)] p-1 rounded-xl">
          {(['monthly', 'yearly'] as const).map(c => (
            <button
              key={c}
              onClick={() => setBillingCycle(c)}
              className={`px-4 py-2 rounded-lg text-sm font-bold transition-all ${
                billingCycle === c ? 'text-white shadow' : 'text-[var(--text-secondary)] hover:text-[var(--text-primary)]'
              }`}
              style={billingCycle === c ? { background: 'var(--accent-gradient)' } : {}}
            >
              {c === 'monthly' ? 'Bulanan' : (
                <span className="flex items-center gap-1.5">
                  Tahunan
                  <span className="bg-[var(--success)]/20 text-[var(--success)] text-[10px] font-black px-1.5 py-0.5 rounded-full border border-[var(--success)]/30">
                    Hemat 15%
                  </span>
                </span>
              )}
            </button>
          ))}
        </div>
      </div>

      {/* Plan cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
        {plans.map(plan => {
          const isCurrent = plan.id === currentPlanId && data?.subscription?.billingCycle === billingCycle;
          const monthlyPrice = parseFloat(plan.monthlyPrice);
          const displayPrice = billingCycle === 'yearly'
            ? Math.round(monthlyPrice * 12 * 0.85)
            : Math.round(monthlyPrice);
          const isFree = monthlyPrice === 0;
          const isPro = plan.name === 'Pro';
          const icon = planIcons[plan.name] || <Zap size={22} />;

          const rawFeatures = typeof plan.features === 'string'
            ? JSON.parse(plan.features)
            : (plan.features || {});
          const features: string[] = rawFeatures
            ? Object.entries(rawFeatures as Record<string, boolean>)
                .filter(([, v]) => v)
                .map(([k]) => {
                  const map: Record<string, string> = {
                    pos: 'Terminal POS',
                    reports: 'Laporan Penjualan',
                    inventory: 'Manajemen Stok',
                    multiUser: 'Multi Pengguna',
                    multiBranch: 'Multi Cabang',
                    api: 'API Akses',
                    prioritySupport: 'Prioritas Support',
                  };
                  return map[k] || k;
                })
            : [];

          return (
            <div
              key={plan.id}
              className={`relative flex flex-col rounded-2xl border p-6 shadow-sm transition-all ${
                isPro
                  ? 'border-[var(--accent-primary)]/65 bg-[var(--bg-surface-elevated)] shadow-[0_0_30px_rgba(139,92,246,0.08)]'
                  : 'border-[var(--border)] bg-[var(--bg-surface-elevated)]'
              }`}
            >
              {isPro && (
                <div className="absolute -top-3 left-1/2 -translate-x-1/2">
                  <span className="px-3 py-1 rounded-full text-xs font-black text-white shadow-md whitespace-nowrap" style={{ background: 'var(--accent-gradient)' }}>
                    ⭐ Paling Populer
                  </span>
                </div>
              )}

              {/* Plan header */}
              <div className="flex items-center gap-3 mb-4">
                <div className="w-10 h-10 rounded-xl flex items-center justify-center text-white" style={{ background: 'var(--accent-gradient)' }}>
                  {icon}
                </div>
                <div>
                  <h3 className="font-black text-[var(--text-primary)] text-lg">{plan.name}</h3>
                  <p className="text-xs text-[var(--text-secondary)]">{plan.description}</p>
                </div>
              </div>

              {/* Price */}
              <div className="mb-5">
                {isFree ? (
                  <p className="text-3xl font-black text-[var(--text-primary)]">Gratis</p>
                ) : (
                  <>
                    <p className="text-3xl font-black text-[var(--text-primary)]">
                      {fmt(displayPrice)}
                    </p>
                    <p className="text-xs text-[var(--text-secondary)] mt-0.5 font-medium">
                      {billingCycle === 'yearly' ? '/ tahun' : '/ bulan'}
                      {billingCycle === 'yearly' && (
                        <span className="ml-2 text-[var(--text-secondary)] line-through">{fmt(monthlyPrice * 12)}</span>
                      )}
                    </p>
                  </>
                )}
              </div>

              {/* Limits */}
              <div className="grid grid-cols-3 gap-2 mb-5 text-center">
                {[
                  { label: 'Produk', val: plan.maxProducts >= 99999 ? '∞' : plan.maxProducts },
                  { label: 'User', val: plan.maxUsers >= 99999 ? '∞' : plan.maxUsers },
                  { label: 'Cabang', val: plan.maxBranches >= 99999 ? '∞' : plan.maxBranches },
                ].map(item => (
                  <div key={item.label} className="p-2 rounded-lg bg-[var(--bg-main)] border border-[var(--border)]">
                    <p className="font-black text-[var(--accent-primary)] text-sm">{item.val}</p>
                    <p className="text-[10px] text-[var(--text-secondary)] font-semibold">{item.label}</p>
                  </div>
                ))}
              </div>

              {/* Features */}
              <ul className="flex flex-col gap-2 mb-6 flex-1">
                {features.map(f => (
                  <li key={f} className="flex items-center gap-2 text-sm text-[var(--text-secondary)] font-medium">
                    <CheckCircle2 size={15} className="text-[var(--success)] flex-shrink-0" />
                    {f}
                  </li>
                ))}
              </ul>

              {/* CTA */}
              {plan.name === 'Enterprise' ? (
                <a
                  href="mailto:support@lazeepos.com?subject=Enterprise Plan Inquiry"
                  className="w-full py-3 rounded-xl font-black text-sm text-center border border-[var(--accent-primary)] text-[var(--accent-primary)] hover:bg-[var(--accent-primary-transparent)] transition-all flex items-center justify-center gap-2"
                >
                  <ExternalLink size={15} /> Hubungi Kami
                </a>
              ) : isCurrent ? (
                <button
                  onClick={() => isFree ? null : handleUpgrade(plan.id)}
                  disabled={isUpgrading !== null || isFree}
                  className={`w-full py-3 rounded-xl font-black text-sm flex items-center justify-center gap-2 transition-all ${
                    isFree 
                      ? 'text-white opacity-60 cursor-not-allowed shadow-none' 
                      : 'text-[var(--accent-primary)] border border-[var(--accent-primary)] hover:bg-[var(--accent-primary-transparent)]'
                  }`}
                  style={isFree ? { background: 'var(--accent-gradient)' } : {}}
                >
                  {isUpgrading === plan.id ? (
                    <><Loader2 size={15} className="animate-spin" /> Memproses...</>
                  ) : isFree ? (
                    '✓ Paket Saat Ini'
                  ) : (
                    <><RefreshCw size={15} /> Perpanjang Langganan</>
                  )}
                </button>
              ) : (
                <button
                  onClick={() => handleUpgrade(plan.id)}
                  disabled={isUpgrading !== null}
                  className="w-full py-3 rounded-xl font-black text-sm text-white flex items-center justify-center gap-2 shadow-lg hover:shadow-xl transition-all hover:-translate-y-0.5 disabled:opacity-50 disabled:cursor-not-allowed"
                  style={{ background: 'var(--accent-gradient)' }}
                >
                  {isUpgrading === plan.id ? (
                    <><Loader2 size={15} className="animate-spin" /> Memproses...</>
                  ) : isFree ? (
                    'Pilih Paket Ini'
                  ) : (
                    <><CreditCard size={15} /> Bayar Sekarang</>
                  )}
                </button>
              )}
            </div>
          );
        })}
      </div>

      {/* Payment badges */}
      <div className="flex flex-col items-center gap-3">
        <div className="flex items-center gap-2 text-xs text-[var(--text-secondary)] font-medium">
          <Shield size={14} className="text-[var(--success)] animate-pulse" />
          <span>Pembayaran aman & terenkripsi otomatis oleh Midtrans</span>
        </div>
        <div className="flex flex-wrap items-center justify-center gap-3">
          {['GoPay', 'OVO', 'DANA', 'QRIS', 'BCA', 'Mandiri', 'BNI', 'BRI', 'Visa', 'Mastercard'].map(m => (
            <span
              key={m}
              className="px-3 py-1.5 text-xs font-bold rounded-lg bg-[var(--bg-surface-elevated)] border border-[var(--border)] text-[var(--text-secondary)]"
            >
              {m}
            </span>
          ))}
        </div>
      </div>

      {/* Transaction history */}
      {data?.recentTransactions?.length > 0 && (
        <div className="bg-[var(--bg-surface-elevated)] border border-[var(--border)] rounded-2xl p-6 shadow-sm">
          <h2 className="text-lg font-black text-[var(--text-primary)] mb-5">🧾 Riwayat Transaksi Pembayaran</h2>
          <div className="overflow-x-auto -mx-6 px-6">
            <table className="w-full text-sm text-left min-w-[540px]">
              <thead>
                <tr className="text-[var(--text-secondary)] border-b border-[var(--border)] text-xs uppercase tracking-wider">
                  <th className="pb-3 font-semibold">Order ID</th>
                  <th className="pb-3 font-semibold">Paket</th>
                  <th className="pb-3 font-semibold">Jumlah</th>
                  <th className="pb-3 font-semibold">Metode</th>
                  <th className="pb-3 font-semibold">Status</th>
                  <th className="pb-3 font-semibold text-right">Tanggal</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[var(--border)]">
                {data.recentTransactions.map((tx: any) => {
                  const badge = STATUS_BADGE[tx.status] || STATUS_BADGE['pending'];
                  return (
                    <tr 
                      key={tx.id} 
                      className="hover:bg-[var(--bg-main)] transition-colors cursor-pointer"
                      onClick={() => setSelectedTx(tx)}
                    >
                      <td className="py-3 font-mono text-xs text-[var(--text-secondary)]">{tx.orderId}</td>
                      <td className="py-3 font-semibold text-[var(--text-primary)]">{tx.plan?.name || '—'}</td>
                      <td className="py-3 font-bold text-[var(--text-primary)]">{fmt(tx.amount)}</td>
                      <td className="py-3 text-[var(--text-secondary)]">{tx.paymentType || '—'}</td>
                      <td className="py-3">
                        <span className={`px-2.5 py-1 rounded-full text-xs font-bold border ${badge.cls}`}>
                          {badge.label}
                        </span>
                      </td>
                      <td className="py-3 text-right text-[var(--text-secondary)] text-xs">
                        {new Date(tx.createdAt).toLocaleString('id-ID', { day: 'numeric', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' })}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Transaction Detail Modal */}
      {selectedTx && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 animate-fade-in" onClick={() => setSelectedTx(null)}>
          <div 
            className="bg-[var(--bg-surface-elevated)] w-full max-w-md rounded-2xl shadow-2xl border border-[var(--border)] overflow-hidden"
            onClick={e => e.stopPropagation()}
          >
            <div className="flex justify-between items-center p-5 border-b border-[var(--border)]">
              <h3 className="font-bold text-lg text-[var(--text-primary)]">Detail Transaksi</h3>
              <button onClick={() => setSelectedTx(null)} className="p-1 rounded-lg text-[var(--text-secondary)] hover:bg-[var(--bg-main)] transition-colors">
                <X size={20} />
              </button>
            </div>
            <div className="p-5 space-y-4 text-sm text-[var(--text-primary)]">
              <div className="flex justify-between pb-2 border-b border-[var(--border)]">
                <span className="text-[var(--text-secondary)]">Status</span>
                <span className={`px-2 py-0.5 rounded text-xs font-bold ${STATUS_BADGE[selectedTx.status]?.cls || ''}`}>
                  {STATUS_BADGE[selectedTx.status]?.label || selectedTx.status}
                </span>
              </div>
              <div className="flex justify-between pb-2 border-b border-[var(--border)]">
                <span className="text-[var(--text-secondary)]">Order ID</span>
                <span className="font-mono font-semibold">{selectedTx.orderId}</span>
              </div>
              <div className="flex justify-between pb-2 border-b border-[var(--border)]">
                <span className="text-[var(--text-secondary)]">Tanggal Transaksi</span>
                <span>{new Date(selectedTx.createdAt).toLocaleString('id-ID', { dateStyle: 'medium', timeStyle: 'short' })}</span>
              </div>
              <div className="flex justify-between pb-2 border-b border-[var(--border)]">
                <span className="text-[var(--text-secondary)]">Metode Pembayaran</span>
                <span className="font-semibold uppercase">{selectedTx.paymentType?.replace(/_/g, ' ') || '—'}</span>
              </div>
              <div className="flex justify-between pb-2 border-b border-[var(--border)]">
                <span className="text-[var(--text-secondary)]">Paket</span>
                <span className="font-bold text-[var(--accent-primary)]">
                  {selectedTx.plan?.name || '—'} ({selectedTx.billingCycle === 'yearly' ? 'Tahunan' : 'Bulanan'})
                </span>
              </div>
              <div className="flex justify-between pb-2 border-b border-[var(--border)]">
                <span className="text-[var(--text-secondary)]">Total Pembayaran</span>
                <span className="font-black text-lg">{fmt(selectedTx.amount)}</span>
              </div>
              
              {selectedTx.status === 'settlement' && selectedTx.activeFrom && selectedTx.activeUntil && (
                <div className="mt-4 p-4 rounded-xl bg-[var(--accent-primary)]/10 border border-[var(--accent-primary)]/20">
                  <div className="text-xs text-[var(--accent-primary)] font-bold uppercase mb-1">Masa Aktif Paket</div>
                  <div className="text-[var(--text-primary)] font-semibold flex items-center justify-between text-sm">
                    <span>{new Date(selectedTx.activeFrom).toLocaleDateString('id-ID', { dateStyle: 'medium' })}</span>
                    <span className="text-[var(--text-secondary)] text-xs">s/d</span>
                    <span>{new Date(selectedTx.activeUntil).toLocaleDateString('id-ID', { dateStyle: 'medium' })}</span>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
