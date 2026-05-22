import { useState, useEffect, useCallback } from 'react';
import type { ReactElement } from 'react';
import {
  CreditCard, CheckCircle2, Zap, Shield, Building2,
  Calendar, RefreshCw, Loader2, Crown, AlertCircle, ExternalLink,
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
            setTimeout(fetchData, 2000); // slight delay for webhook to process
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
        // Fallback: redirect if Snap JS not loaded
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

  const planIcons: Record<string, ReactElement> = {
    Starter:    <Zap size={22} />,
    Pro:        <Crown size={22} />,
    Enterprise: <Building2 size={22} />,
  };

  return (
    <div className="animate-fade-in flex flex-col gap-8 pb-10">

      {/* Header */}
      <div className="flex items-start justify-between">
        <div>
          <h1 className="text-3xl font-extrabold text-[var(--text-primary)] tracking-tight">Langganan & Billing</h1>
          <p className="text-[var(--text-secondary)] mt-1 font-medium">Kelola paket langganan dan riwayat pembayaran toko Anda.</p>
        </div>
        <button onClick={fetchData} className="p-2 rounded-xl border border-[var(--border)] text-[var(--text-secondary)] hover:text-[var(--accent-primary)] hover:border-[var(--accent-primary)] transition-all" title="Refresh">
          <RefreshCw size={18} />
        </button>
      </div>

      {/* Current subscription card */}
      {data?.subscription && (
        <div className="bg-[var(--bg-surface-elevated)] border border-[var(--accent-primary)]/30 rounded-2xl p-6 shadow-sm">
          <div className="flex flex-col sm:flex-row justify-between gap-4">
            <div>
              <p className="text-xs font-bold text-[var(--text-secondary)] uppercase tracking-wider mb-1">Paket Aktif</p>
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
              <p className="text-[var(--text-secondary)] text-sm mt-1 font-medium">
                {fmt(data.subscription.plan?.monthlyPrice || 0)} / bulan
              </p>
            </div>
            <div className="flex flex-col gap-1.5 text-sm text-right">
              {data.subscription.currentPeriodEnd && (
                <div className="flex items-center gap-2 text-[var(--text-secondary)] justify-end">
                  <Calendar size={14} />
                  <span>Berakhir: <strong className="text-[var(--text-primary)]">
                    {new Date(data.subscription.currentPeriodEnd).toLocaleDateString('id-ID', { day: 'numeric', month: 'long', year: 'numeric' })}
                  </strong></span>
                </div>
              )}
              {data.tenant?.trialEndsAt && subStatus === 'trial' && (
                <div className="flex items-center gap-2 text-[var(--warning)] justify-end">
                  <AlertCircle size={14} />
                  <span>Trial berakhir: <strong>
                    {new Date(data.tenant.trialEndsAt).toLocaleDateString('id-ID', { day: 'numeric', month: 'long' })}
                  </strong></span>
                </div>
              )}
            </div>
          </div>

          {/* Plan limits */}
          {data.subscription.plan && (
            <div className="grid grid-cols-3 gap-3 mt-5 pt-5 border-t border-[var(--border)]">
              {[
                { label: 'Produk', val: data.subscription.plan.maxProducts >= 99999 ? '∞' : data.subscription.plan.maxProducts },
                { label: 'Pengguna', val: data.subscription.plan.maxUsers >= 99999 ? '∞' : data.subscription.plan.maxUsers },
                { label: 'Cabang', val: data.subscription.plan.maxBranches >= 99999 ? '∞' : data.subscription.plan.maxBranches },
              ].map(item => (
                <div key={item.label} className="text-center p-3 rounded-xl bg-[var(--bg-main)] border border-[var(--border)]">
                  <p className="text-xl font-black text-[var(--accent-primary)]">{item.val}</p>
                  <p className="text-xs text-[var(--text-secondary)] font-semibold mt-0.5">{item.label}</p>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Billing cycle toggle */}
      <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
        <h2 className="text-xl font-black text-[var(--text-primary)]">Pilih Paket</h2>
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
          const isCurrent = plan.id === currentPlanId;
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
                  ? 'border-[var(--accent-primary)]/60 bg-[var(--bg-surface-elevated)] shadow-[0_0_30px_rgba(139,92,246,0.1)]'
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
                  <li key={f} className="flex items-center gap-2 text-sm text-[var(--text-secondary)]">
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
                  disabled
                  className="w-full py-3 rounded-xl font-black text-sm text-white opacity-60 cursor-not-allowed"
                  style={{ background: 'var(--accent-gradient)' }}
                >
                  ✓ Paket Saat Ini
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
        <div className="flex items-center gap-2 text-xs text-[var(--text-secondary)]">
          <Shield size={14} className="text-[var(--success)]" />
          <span>Pembayaran aman & terenkripsi oleh Midtrans</span>
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
          <h2 className="text-lg font-black text-[var(--text-primary)] mb-5">🧾 Riwayat Pembayaran</h2>
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
                    <tr key={tx.id} className="hover:bg-[var(--bg-main)] transition-colors">
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
                        {new Date(tx.createdAt).toLocaleDateString('id-ID', { day: 'numeric', month: 'short', year: 'numeric' })}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}
