import React, { useState, useEffect, useRef } from 'react';

import { QRCodeSVG } from 'qrcode.react';
import { Plus, X, GripVertical, CheckCircle2, Clock, Trash2, Edit2, Coffee, Map, UtensilsCrossed, Bath, DoorOpen, MonitorSmartphone, Square, Printer, Minus, ChefHat } from 'lucide-react';
import toast from 'react-hot-toast';
import api, { getMediaUrl } from '../api/client';
import { useAuth } from '../context/AuthContext';
import { useTheme } from '../context/ThemeContext';
import { Modal } from '../components/Modal';

type LayoutObjectType = 'wall' | 'kitchen' | 'bathroom' | 'cashier' | 'entrance' | 'custom';

interface LayoutObject {
  id: string;
  type: LayoutObjectType;
  x: number;
  y: number;
  width: number;
  height: number;
  label?: string;
  rotation?: number;
}

interface TableZone {
  id: string;
  name: string;
  tables: TableData[];
  layoutData?: LayoutObject[];
}

interface TableData {
  id: string;
  name: string;
  x: number;
  y: number;
  status: 'AVAILABLE' | 'OCCUPIED' | 'CLEANING';
  capacity: number;
  zoneId: string;
}

export function TableManagement() {
  const { user } = useAuth();
  const { storeName, logoUrl } = useTheme();
  const tenant = user?.tenant;
  const [zones, setZones] = useState<TableZone[]>([]);
  const [activeZoneId, setActiveZoneId] = useState<string | null>(null);
  const [selectedTable, setSelectedTable] = useState<TableData | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isEditMode, setIsEditMode] = useState(false);
  const [activeTableOrders, setActiveTableOrders] = useState<any[]>([]);
  const [isLoadingOrders, setIsLoadingOrders] = useState(false);

  const [showAddZoneModal, setShowAddZoneModal] = useState(false);
  const [newZoneName, setNewZoneName] = useState('');
  const [showVerificationSuccessModal, setShowVerificationSuccessModal] = useState(false);

  const [showAddTableModal, setShowAddTableModal] = useState(false);
  const [newTableName, setNewTableName] = useState('');
  const [newTableCapacity, setNewTableCapacity] = useState('4');

  // Dragging state for Tables
  const [draggingTable, setDraggingTable] = useState<string | null>(null);
  const [dragOffset, setDragOffset] = useState({ x: 0, y: 0 });

  // Layout Object State
  const [selectedLayoutObject, setSelectedLayoutObject] = useState<string | null>(null);
  const [draggingLayout, setDraggingLayout] = useState<string | null>(null);
  const [resizingLayout, setResizingLayout] = useState<{ id: string, dir: string } | null>(null);

  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    fetchZones();
  }, []);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Don't trigger if user is typing in an input
      if (e.target instanceof HTMLInputElement || e.target instanceof HTMLTextAreaElement) return;

      if ((e.key === 'Delete' || e.key === 'Backspace') && isEditMode) {
        if (selectedLayoutObject) {
          handleDeleteLayoutObject(selectedLayoutObject);
        } else if (selectedTable) {
          handleDeleteTable(selectedTable.id);
        }
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isEditMode, selectedLayoutObject, selectedTable, activeZoneId, zones]);

  useEffect(() => {
    if (selectedTable) {
      setIsLoadingOrders(true);
      api.get(`/tables/${selectedTable.id}/orders`)
        .then(res => setActiveTableOrders(res.data.orders || []))
        .catch(err => console.error('Gagal memuat pesanan:', err))
        .finally(() => setIsLoadingOrders(false));
    } else {
      setActiveTableOrders([]);
    }
  }, [selectedTable?.id]);

  const fetchZones = async () => {
    try {
      const { data } = await api.get('/tables/zones');
      setZones(data.zones || []);
      
      if (data.zones.length > 0 && !activeZoneId) {
        setActiveZoneId(data.zones[0].id);
      }
    } catch (err) {
      toast.error('Gagal memuat data zona/meja');
    } finally {
      setIsLoading(false);
    }
  };

  const handleAddZone = async () => {
    if (!newZoneName) return;
    try {
      await api.post('/tables/zones', { name: newZoneName });
      toast.success('Zona berhasil ditambahkan');
      setShowAddZoneModal(false);
      setNewZoneName('');
      fetchZones();
    } catch (err) {
      toast.error('Gagal menambahkan zona');
    }
  };

  const handleDeleteZone = async (id: string) => {
    if (!confirm('Hapus zona beserta semua meja di dalamnya?')) return;
    try {
      await api.delete(`/tables/zones/${id}`);
      toast.success('Zona berhasil dihapus');
      if (activeZoneId === id) setActiveZoneId(null);
      fetchZones();
    } catch {
      toast.error('Gagal menghapus zona');
    }
  };

  const handleAddTable = async () => {
    if (!activeZoneId || !newTableName) return;
    try {
      const { data } = await api.post('/tables', {
        name: newTableName,
        zoneId: activeZoneId,
        capacity: parseInt(newTableCapacity),
        x: 40,
        y: 40
      });
      toast.success('Meja berhasil ditambahkan');
      setShowAddTableModal(false);
      setNewTableName('');
      
      // Prevent resetting unsaved layout by directly injecting to local state
      setZones(prev => prev.map(z => z.id === activeZoneId ? {
        ...z,
        tables: [...z.tables, data.table]
      } : z));
      
    } catch (err) {
      toast.error('Gagal menambahkan meja');
    }
  };

  const handleDeleteTable = async (id: string) => {
    if (!confirm('Hapus meja ini?')) return;
    try {
      await api.delete(`/tables/${id}`);
      toast.success('Meja dihapus');
      setSelectedTable(null);
      fetchZones();
    } catch {
      toast.error('Gagal menghapus meja');
    }
  };

  const handleUpdateTableStatus = async (id: string, status: string) => {
    try {
      await api.put(`/tables/${id}`, { status });
      toast.success(`Status meja diubah menjadi ${status}`);
      if (selectedTable?.id === id) setSelectedTable({ ...selectedTable, status: status as any });
      fetchZones();
    } catch {
      toast.error('Gagal mengubah status');
    }
  };

  const handleVerifyPayment = async (orderId: string) => {
    try {
      await api.put(`/tables/orders/${orderId}/verify`);
      setShowVerificationSuccessModal(true);
      // Refresh orders
      if (selectedTable) {
        api.get(`/tables/${selectedTable.id}/orders`)
          .then(res => setActiveTableOrders(res.data.orders))
          .catch(console.error);
      }
    } catch (err: any) {
      toast.error(err.response?.data?.message || 'Gagal memverifikasi pembayaran');
    }
  };

  // Layout Object Handlers
  const handleAddLayoutObject = (type: LayoutObjectType, x = 40, y = 40) => {
    if (!activeZoneId) return;
    
    // Snap to grid
    x = Math.max(0, Math.round(x / 20) * 20);
    y = Math.max(0, Math.round(y / 20) * 20);
    
    const newObj: LayoutObject = {
      id: 'lo_' + Date.now().toString(),
      type,
      x,
      y,
      width: type === 'wall' ? 120 : 80,
      height: type === 'wall' ? 10 : 80,
      label: type === 'kitchen' ? 'Dapur' : type === 'cashier' ? 'Kasir' : type === 'bathroom' ? 'Toilet' : type === 'entrance' ? 'Masuk' : type === 'custom' ? 'Custom' : 'Sekat',
      rotation: 0
    };

    setZones(prev => prev.map(z => z.id === activeZoneId ? {
      ...z,
      layoutData: [...(z.layoutData || []), newObj]
    } : z));
  };

  const handleDeleteLayoutObject = (id: string) => {
    setZones(prev => prev.map(z => z.id === activeZoneId ? {
      ...z,
      layoutData: (z.layoutData || []).filter(o => o.id !== id)
    } : z));
    setSelectedLayoutObject(null);
  };

  // Generic Drag Logic
  const handlePointerDown = (e: React.PointerEvent, id: string, type: 'table' | 'layout') => {
    if (e.button !== 0) return; // only left click
    
    if (!isEditMode) {
      if (type === 'table') {
        setSelectedTable(activeZone?.tables.find(t => t.id === id) || null);
        setSelectedLayoutObject(null);
      }
      return;
    }

    e.stopPropagation();
    
    if (type === 'table') {
      setSelectedTable(activeZone?.tables.find(t => t.id === id) || null);
      setSelectedLayoutObject(null);
      setDraggingTable(id);
    } else {
      setSelectedLayoutObject(id);
      setSelectedTable(null);
      setDraggingLayout(id);
    }
    
    const target = e.currentTarget as HTMLElement;
    const rect = target.getBoundingClientRect();
    setDragOffset({ x: e.clientX - rect.left, y: e.clientY - rect.top });
    target.setPointerCapture(e.pointerId);
  };

  const handlePointerMove = (e: React.PointerEvent, id: string, type: 'table' | 'layout') => {
    if ((type === 'table' && draggingTable !== id) || (type === 'layout' && draggingLayout !== id)) return;
    if (!containerRef.current) return;
    
    const containerRect = containerRef.current.getBoundingClientRect();
    let newX = e.clientX - containerRect.left - dragOffset.x;
    let newY = e.clientY - containerRect.top - dragOffset.y;
    
    // Snap to grid (grid size 20px) for layout objects, table can also snap
    newX = Math.round(newX / 20) * 20;
    newY = Math.round(newY / 20) * 20;

    if (newX < 0) newX = 0;
    if (newY < 0) newY = 0;

    setZones(prev => prev.map(z => z.id === activeZoneId ? {
      ...z,
      ...(type === 'table' ? { tables: z.tables.map(t => t.id === id ? { ...t, x: newX, y: newY } : t) } : {}),
      ...(type === 'layout' ? { layoutData: (z.layoutData || []).map(o => o.id === id ? { ...o, x: newX, y: newY } : o) } : {})
    } : z));
  };

  const handlePointerUp = (e: React.PointerEvent, _id: string, type: 'table' | 'layout') => {
    if (type === 'table') setDraggingTable(null);
    else setDraggingLayout(null);
    e.currentTarget.releasePointerCapture(e.pointerId);
  };

  // Save full layout
  const saveFullLayout = async () => {
    const finalZone = zones.find(z => z.id === activeZoneId);
    if (!finalZone) return;

    try {
      const toastId = toast.loading('Menyimpan tata letak...');
      
      // Save tables
      await Promise.all(finalZone.tables.map(t => api.put(`/tables/${t.id}`, { x: t.x, y: t.y })));
      
      // Save layout objects
      await api.put(`/tables/zones/${activeZoneId}/layout`, { layoutData: finalZone.layoutData || [] });
      
      toast.success('Denah & Tata Ruang berhasil disimpan!', { id: toastId });
      setIsEditMode(false);
    } catch (err) {
      toast.error('Gagal menyimpan tata ruang');
    }
  };

  const activeZone = zones.find(z => z.id === activeZoneId);
  const qrUrl = tenant && selectedTable ? `${window.location.protocol}//${window.location.host}/m/${tenant.id}/${selectedTable.id}` : '';

  if (isLoading) {
    return (
      <div className="flex h-full items-center justify-center text-[var(--text-secondary)]">
        Memuat data meja...
      </div>
    );
  }

  return (
    <div className="flex h-full gap-4 md:gap-6 relative">
      
      {/* LEFT SIDEBAR: Zones */}
      <div className="w-64 flex flex-col bg-[var(--bg-surface-elevated)] p-4 border border-[var(--border)] rounded-3xl shadow-sm overflow-hidden">
        <h2 className="text-lg font-black text-[var(--text-primary)] mb-4 flex items-center gap-2">
          <Map size={18} className="text-[var(--accent-primary)]" />
          Denah & Tata Ruang
        </h2>
        
        <div className="space-y-2 flex-1 overflow-y-auto custom-scrollbar pr-1">
          {zones.map(zone => (
            <div key={zone.id} className="relative group">
              <button
                onClick={() => { setActiveZoneId(zone.id); setSelectedTable(null); }}
                className={`w-full text-left px-4 py-2.5 rounded-xl text-sm font-bold transition-all flex justify-between items-center ${
                  activeZoneId === zone.id
                    ? 'bg-[var(--accent-primary)] text-white shadow-md'
                    : 'bg-[var(--bg-main)] text-[var(--text-secondary)] hover:border-[var(--accent-primary)] border border-[var(--border)]'
                }`}
              >
                {zone.name}
                <span className={`text-[10px] px-2 py-0.5 rounded-full ${activeZoneId === zone.id ? 'bg-white/20' : 'bg-[var(--bg-surface-elevated)]'}`}>
                  {zone.tables.length}
                </span>
              </button>
              <button 
                onClick={() => handleDeleteZone(zone.id)}
                className="absolute right-2 top-1/2 -translate-y-1/2 p-1.5 opacity-0 group-hover:opacity-100 text-white/70 hover:text-red-300 transition-all z-10"
                style={{ display: activeZoneId === zone.id ? 'block' : 'none' }}
              >
                <Trash2 size={14} />
              </button>
            </div>
          ))}
        </div>

        <button
          onClick={() => setShowAddZoneModal(true)}
          className="mt-4 w-full py-2.5 border-2 border-dashed border-[var(--border)] rounded-xl text-sm font-bold text-[var(--text-secondary)] hover:text-[var(--accent-primary)] hover:border-[var(--accent-primary)] transition-all flex items-center justify-center gap-2"
        >
          <Plus size={16} /> Tambah Ruangan
        </button>
      </div>

      {/* CENTER: Free-form Canvas */}
      <div className={`flex-1 flex flex-col relative overflow-hidden transition-all border border-[var(--border)] rounded-3xl shadow-sm ${isEditMode ? "bg-[url('data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMjAiIGhlaWdodD0iMjAiIHhtbG5zPSJodHRwOi8vd3d3LnczLm9yZy8yMDAwL3N2ZyI+PHBhdGggZD0iTSAyMCAwIEwgMCAwIDAgMjAiIGZpbGw9Im5vbmUiIHN0cm9rZT0icmdiYSgxNTAsMTUwLDE1MCwwLjI1KSIgc3Ryb2tlLXdpZHRoPSIxIi8+PC9zdmc+')] bg-[var(--bg-main)]" : "bg-[var(--bg-surface-elevated)]"}`}>
        {activeZone ? (
          <>
            <div className="p-4 flex justify-between items-center bg-[var(--bg-surface-elevated)]/80 backdrop-blur-sm border-b border-[var(--border)] z-10">
              <h3 className="font-bold text-[var(--text-primary)]">Denah: {activeZone.name}</h3>
              <div className="flex items-center gap-2">
                <button
                  onClick={() => {
                    if (isEditMode) {
                      saveFullLayout();
                    } else {
                      setIsEditMode(true);
                    }
                  }}
                  className={`px-4 py-2 rounded-lg text-xs font-bold flex items-center gap-1.5 transition-all ${
                    isEditMode ? 'bg-amber-500 text-white shadow-md' : 'bg-[var(--bg-main)] text-[var(--text-secondary)] border border-[var(--border)] hover:bg-[var(--bg-surface-elevated)]'
                  }`}
                >
                  <Edit2 size={14} /> {isEditMode ? 'Simpan Layout' : 'Edit Denah'}
                </button>
                {isEditMode && (
                  <button
                    onClick={() => setShowAddTableModal(true)}
                    className="px-4 py-2 bg-[var(--accent-primary)] text-white rounded-lg text-xs font-bold flex items-center gap-1.5 shadow-sm hover:shadow-md transition-all"
                  >
                    <Plus size={14} /> Tambah Meja
                  </button>
                )}
              </div>
            </div>

            <div 
              ref={containerRef}
              className="flex-1 relative overflow-hidden"
              onClick={(e) => {
                if (e.target === containerRef.current) setSelectedTable(null);
              }}
              onDragOver={(e) => {
                if (!isEditMode) return;
                e.preventDefault();
              }}
              onDrop={(e) => {
                if (!isEditMode || !containerRef.current) return;
                e.preventDefault();
                const layoutType = e.dataTransfer.getData('layoutType') as LayoutObjectType;
                if (!layoutType) return;
                
                const rect = containerRef.current.getBoundingClientRect();
                const x = e.clientX - rect.left - 40; // Center object on mouse
                const y = e.clientY - rect.top - 40;
                handleAddLayoutObject(layoutType, x, y);
              }}
            >
              {activeZone.tables.map(table => (
                <div
                  key={table.id}
                  onPointerDown={(e) => handlePointerDown(e, table.id, 'table')}
                  onPointerMove={(e) => handlePointerMove(e, table.id, 'table')}
                  onPointerUp={(e) => handlePointerUp(e, table.id, 'table')}
                  className={`absolute w-20 h-20 rounded-2xl flex flex-col items-center justify-center transition-all select-none shadow-sm ${
                    isEditMode ? 'cursor-grab active:cursor-grabbing hover:scale-105' : 'cursor-pointer hover:scale-105 hover:shadow-md'
                  } ${
                    table.status === 'AVAILABLE' ? 'bg-[var(--success-transparent)] border-2 border-[var(--success)] text-[var(--success)]' :
                    table.status === 'OCCUPIED' ? 'bg-[var(--danger-transparent)] border-2 border-[var(--danger)] text-[var(--danger)]' :
                    'bg-amber-500/10 border-2 border-amber-500 text-amber-600'
                  } ${selectedTable?.id === table.id ? 'ring-4 ring-[var(--accent-primary)]/50 scale-105 z-20' : 'z-10'} ${draggingTable === table.id ? 'scale-105 opacity-90' : ''}`}
                  style={{ left: table.x, top: table.y, touchAction: 'none' }}
                >
                  <Coffee size={24} className="mb-1 opacity-80" />
                  <span className="font-black text-sm tracking-tight">{table.name}</span>
                  {/* Status Indicator Icon */}
                  <div className="absolute top-0 right-0 p-4 space-y-3 pointer-events-none" style={{ zIndex: 50 }}>    
                    {table.status === 'AVAILABLE' && <CheckCircle2 size={14} className="fill-[var(--success)] text-white" />}
                    {table.status === 'OCCUPIED' && <Clock size={14} className="fill-[var(--danger)] text-white" />}
                    {table.status === 'CLEANING' && <Edit2 size={14} className="fill-amber-500 text-white" />}
                  </div>
                </div>
              ))}
              {/* Layout Objects Render */}
              {(activeZone.layoutData || []).map(obj => (
                <div
                  key={obj.id}
                  onPointerDown={(e) => handlePointerDown(e, obj.id, 'layout')}
                  onPointerMove={(e) => handlePointerMove(e, obj.id, 'layout')}
                  onPointerUp={(e) => handlePointerUp(e, obj.id, 'layout')}
                  className={`absolute flex flex-col items-center justify-center transition-all select-none shadow-sm overflow-hidden ${
                    isEditMode ? 'cursor-grab active:cursor-grabbing hover:ring-2 hover:ring-[var(--accent-primary)]' : 'cursor-default pointer-events-none'
                  } ${selectedLayoutObject === obj.id ? 'ring-4 ring-[var(--accent-primary)]/50 z-20' : 'z-0'} ${draggingLayout === obj.id ? 'opacity-80 scale-[1.02]' : ''} ${
                    obj.type === 'wall' ? 'bg-gray-300 border-2 border-gray-400 rounded-md' :
                    obj.type === 'kitchen' ? 'bg-red-500/20 border-2 border-red-500/40 text-red-700 rounded-2xl' :
                    obj.type === 'cashier' ? 'bg-green-500/20 border-2 border-green-500/40 text-green-700 rounded-2xl' :
                    obj.type === 'bathroom' ? 'bg-blue-500/20 border-2 border-blue-500/40 text-blue-700 rounded-2xl' :
                    obj.type === 'entrance' ? 'bg-amber-500/20 border-2 border-amber-500/40 text-amber-700 rounded-2xl' :
                    obj.type === 'custom' ? 'bg-indigo-500/20 border-2 border-indigo-500/40 text-indigo-700 rounded-2xl' :
                    'bg-gray-200 rounded-md'
                  }`}
                  style={{ left: obj.x, top: obj.y, width: obj.width, height: obj.height, touchAction: 'none', transform: `rotate(${obj.rotation || 0}deg)` }}
                >
                  {obj.type === 'kitchen' && <UtensilsCrossed size={20} className="mb-1 opacity-70" />}
                  {obj.type === 'cashier' && <MonitorSmartphone size={20} className="mb-1 opacity-70" />}
                  {obj.type === 'bathroom' && <Bath size={20} className="mb-1 opacity-70" />}
                  {obj.type === 'entrance' && <DoorOpen size={20} className="mb-1 opacity-70" />}
                  {obj.label && <span className="font-bold text-[10px] uppercase tracking-wider text-center px-1 leading-none">{obj.label}</span>}
                  
                  {isEditMode && selectedLayoutObject === obj.id && (
                    <div className="absolute -bottom-1 -right-1 w-5 h-5 bg-[var(--accent-primary)] rounded-full cursor-se-resize z-30 flex items-center justify-center shadow-md border-2 border-white"
                         onPointerDown={(e) => {
                           e.stopPropagation();
                           setResizingLayout({ id: obj.id, dir: 'se' });
                           const target = e.currentTarget as HTMLElement;
                           target.setPointerCapture(e.pointerId);
                         }}
                         onPointerMove={(e) => {
                           if (resizingLayout?.id !== obj.id) return;
                           if (!containerRef.current) return;
                           const rect = containerRef.current.getBoundingClientRect();
                           let newW = e.clientX - rect.left - obj.x;
                           let newH = e.clientY - rect.top - obj.y;
                           newW = Math.max(20, Math.round(newW / 20) * 20);
                           newH = Math.max(20, Math.round(newH / 20) * 20);
                           
                           setZones(prev => prev.map(z => z.id === activeZoneId ? {
                             ...z,
                             layoutData: (z.layoutData || []).map(o => o.id === obj.id ? { ...o, width: newW, height: newH } : o)
                           } : z));
                         }}
                         onPointerUp={(e) => {
                           setResizingLayout(null);
                           e.currentTarget.releasePointerCapture(e.pointerId);
                         }}
                    />
                  )}
                </div>
              ))}
            </div>
          </>
        ) : (
          <div className="flex-1 flex flex-col items-center justify-center text-[var(--text-secondary)] opacity-50">
            <GripVertical size={48} className="mb-4" />
            <p className="font-bold">Pilih atau buat ruangan terlebih dahulu</p>
          </div>
        )}
      </div>

      {/* RIGHT SIDEBAR: Table Details OR Layout Drawer */}
      {isEditMode ? (
        <div className="w-72 flex flex-col bg-[var(--bg-surface-elevated)] p-4 border border-[var(--border)] rounded-3xl z-20 overflow-y-auto animate-fade-in shadow-sm">
          <h3 className="font-black text-sm text-[var(--text-primary)] mb-2 flex items-center gap-2">
            <Map size={16} className="text-[var(--accent-primary)]" />
            Komponen Layout
          </h3>
          <p className="text-[10px] font-medium text-[var(--text-secondary)] mb-5">Seret (Drag & Drop) komponen di bawah ini ke dalam denah. Objek dapat ditarik dan diubah ukurannya di kanvas.</p>
          
          <div className="grid grid-cols-2 gap-2 mb-6">
            <button draggable onDragStart={(e) => e.dataTransfer.setData('layoutType', 'wall')} onClick={() => {
              if (containerRef.current) {
                handleAddLayoutObject('wall', containerRef.current.clientWidth / 2 - 60, containerRef.current.clientHeight / 2 - 5);
              } else handleAddLayoutObject('wall');
            }} className="w-full p-2 bg-[var(--bg-main)] border border-[var(--border)] rounded-xl flex items-center gap-2 hover:border-[var(--accent-primary)] transition-all group cursor-grab active:cursor-grabbing">
              <div className="w-7 h-7 rounded-lg bg-gray-200 text-gray-500 flex items-center justify-center shrink-0">
                <Minus size={14} strokeWidth={4} />
              </div>
              <div className="text-left min-w-0">
                <p className="font-bold text-[10px] text-[var(--text-primary)] truncate">Tembok</p>
              </div>
            </button>
            <button draggable onDragStart={(e) => e.dataTransfer.setData('layoutType', 'kitchen')} onClick={() => {
              if (containerRef.current) {
                handleAddLayoutObject('kitchen', containerRef.current.clientWidth / 2 - 40, containerRef.current.clientHeight / 2 - 40);
              } else handleAddLayoutObject('kitchen');
            }} className="w-full p-2 bg-[var(--bg-main)] border border-[var(--border)] rounded-xl flex items-center gap-2 hover:border-[var(--accent-primary)] transition-all group cursor-grab active:cursor-grabbing">
              <div className="w-7 h-7 rounded-lg bg-red-500/10 text-red-600 flex items-center justify-center shrink-0">
                <UtensilsCrossed size={14} />
              </div>
              <div className="text-left min-w-0">
                <p className="font-bold text-[10px] text-[var(--text-primary)] truncate">Dapur</p>
              </div>
            </button>
            <button draggable onDragStart={(e) => e.dataTransfer.setData('layoutType', 'cashier')} onClick={() => {
              if (containerRef.current) {
                handleAddLayoutObject('cashier', containerRef.current.clientWidth / 2 - 40, containerRef.current.clientHeight / 2 - 40);
              } else handleAddLayoutObject('cashier');
            }} className="w-full p-2 bg-[var(--bg-main)] border border-[var(--border)] rounded-xl flex items-center gap-2 hover:border-[var(--accent-primary)] transition-all group cursor-grab active:cursor-grabbing">
              <div className="w-7 h-7 rounded-lg bg-green-500/10 text-green-600 flex items-center justify-center shrink-0">
                <MonitorSmartphone size={14} />
              </div>
              <div className="text-left min-w-0">
                <p className="font-bold text-[10px] text-[var(--text-primary)] truncate">Kasir</p>
              </div>
            </button>
            <button draggable onDragStart={(e) => e.dataTransfer.setData('layoutType', 'bathroom')} onClick={() => {
              if (containerRef.current) {
                handleAddLayoutObject('bathroom', containerRef.current.clientWidth / 2 - 40, containerRef.current.clientHeight / 2 - 40);
              } else handleAddLayoutObject('bathroom');
            }} className="w-full p-2 bg-[var(--bg-main)] border border-[var(--border)] rounded-xl flex items-center gap-2 hover:border-[var(--accent-primary)] transition-all group cursor-grab active:cursor-grabbing">
              <div className="w-7 h-7 rounded-lg bg-blue-500/10 text-blue-600 flex items-center justify-center shrink-0">
                <Bath size={14} />
              </div>
              <div className="text-left min-w-0">
                <p className="font-bold text-[10px] text-[var(--text-primary)] truncate">Toilet</p>
              </div>
            </button>
            <button draggable onDragStart={(e) => e.dataTransfer.setData('layoutType', 'entrance')} onClick={() => {
              if (containerRef.current) {
                handleAddLayoutObject('entrance', containerRef.current.clientWidth / 2 - 40, containerRef.current.clientHeight / 2 - 40);
              } else handleAddLayoutObject('entrance');
            }} className="w-full p-2 bg-[var(--bg-main)] border border-[var(--border)] rounded-xl flex items-center gap-2 hover:border-[var(--accent-primary)] transition-all group cursor-grab active:cursor-grabbing">
              <div className="w-7 h-7 rounded-lg bg-amber-500/10 text-amber-600 flex items-center justify-center shrink-0">
                <DoorOpen size={14} />
              </div>
              <div className="text-left min-w-0">
                <p className="font-bold text-[10px] text-[var(--text-primary)] truncate">Pintu Masuk</p>
              </div>
            </button>
            <button draggable onDragStart={(e) => e.dataTransfer.setData('layoutType', 'custom')} onClick={() => {
              if (containerRef.current) {
                handleAddLayoutObject('custom', containerRef.current.clientWidth / 2 - 40, containerRef.current.clientHeight / 2 - 40);
              } else handleAddLayoutObject('custom');
            }} className="w-full p-2 bg-[var(--bg-main)] border border-[var(--border)] rounded-xl flex items-center gap-2 hover:border-[var(--accent-primary)] transition-all group cursor-grab active:cursor-grabbing">
              <div className="w-7 h-7 rounded-lg bg-indigo-500/10 text-indigo-600 flex items-center justify-center shrink-0">
                <Square size={14} />
              </div>
              <div className="text-left min-w-0">
                <p className="font-bold text-[10px] text-[var(--text-primary)] truncate">Kustom</p>
              </div>
            </button>
          </div>

          {selectedLayoutObject && (() => {
            const obj = activeZone?.layoutData?.find(o => o.id === selectedLayoutObject);
            if (!obj) return null;
            return (
              <div className="mt-6 p-4 bg-[var(--bg-main)] rounded-xl border border-[var(--border)] animate-fade-in flex flex-col gap-4">
                <div>
                  <h4 className="text-xs font-bold text-[var(--text-primary)] border-b border-[var(--border)] pb-2 mb-3">Edit Properti Objek</h4>
                  
                  <label className="text-[10px] font-bold text-[var(--text-secondary)] uppercase tracking-wider mb-1 block">Label / Teks</label>
                  <input
                    type="text"
                    value={obj.label || ''}
                    onChange={(e) => {
                      setZones(prev => prev.map(z => z.id === activeZoneId ? {
                        ...z,
                        layoutData: (z.layoutData || []).map(o => o.id === obj.id ? { ...o, label: e.target.value } : o)
                      } : z));
                    }}
                    className="w-full px-3 py-2 rounded-lg bg-[var(--bg-surface-elevated)] border border-[var(--border)] text-[var(--text-primary)] text-xs font-bold outline-none focus:border-[var(--accent-primary)] transition-all mb-3"
                    placeholder="Nama Objek"
                  />

                  <label className="text-[10px] font-bold text-[var(--text-secondary)] uppercase tracking-wider mb-1 block">Rotasi</label>
                  <div className="flex gap-2">
                    {[0, 90, 180, 270].map(deg => (
                      <button
                        key={deg}
                        onClick={() => {
                          setZones(prev => prev.map(z => z.id === activeZoneId ? {
                            ...z,
                            layoutData: (z.layoutData || []).map(o => o.id === obj.id ? { ...o, rotation: deg } : o)
                          } : z));
                        }}
                        className={`flex-1 py-1.5 rounded-lg text-[10px] font-bold transition-all ${obj.rotation === deg ? 'bg-[var(--accent-primary)] text-white' : 'bg-[var(--bg-surface-elevated)] border border-[var(--border)] text-[var(--text-secondary)] hover:text-[var(--text-primary)]'}`}
                      >
                        {deg}°
                      </button>
                    ))}
                  </div>
                </div>

                <div className="pt-3 border-t border-[var(--border)]">
                  <button onClick={() => handleDeleteLayoutObject(selectedLayoutObject)} className="w-full py-2 bg-[var(--danger-transparent)] text-[var(--danger)] rounded-lg text-xs font-bold hover:bg-[var(--danger)] hover:text-white transition-all shadow-sm">
                    Hapus Objek
                  </button>
                </div>
              </div>
            );
          })()}
        </div>
      ) : selectedTable ? (
        <div className="w-80 flex flex-col bg-[var(--bg-surface-elevated)] p-5 z-20 animate-fade-in shadow-2xl lg:shadow-sm border border-[var(--border)] rounded-3xl absolute right-0 inset-y-0 lg:relative overflow-y-auto custom-scrollbar">
          <div className="flex justify-between items-start mb-6">
            <div>
              <h3 className="text-xl font-black text-[var(--text-primary)]">{selectedTable.name}</h3>
              <p className="text-xs font-bold text-[var(--text-secondary)] uppercase tracking-wider mt-1">Kapasitas: {selectedTable.capacity} Orang</p>
            </div>
            <button onClick={() => setSelectedTable(null)} className="p-2 hover:bg-[var(--bg-main)] rounded-lg text-[var(--text-secondary)]">
              <X size={18} />
            </button>
          </div>

          <div className="mb-6 p-4 rounded-xl bg-[var(--bg-main)] border border-[var(--border)]">
            <p className="text-xs font-bold text-[var(--text-secondary)] mb-2 uppercase">Status Saat Ini</p>
            <div className="flex gap-2">
              {(['AVAILABLE', 'OCCUPIED', 'CLEANING'] as const).map(s => (
                <button
                  key={s}
                  onClick={() => handleUpdateTableStatus(selectedTable.id, s)}
                  className={`flex-1 py-2 rounded-lg text-[10px] font-black transition-all ${
                    selectedTable.status === s
                      ? s === 'AVAILABLE' ? 'bg-[var(--success)] text-white shadow-md' :
                        s === 'OCCUPIED' ? 'bg-[var(--danger)] text-white shadow-md' :
                        'bg-amber-500 text-white shadow-md'
                      : 'bg-transparent border border-[var(--border)] text-[var(--text-secondary)] hover:bg-[var(--bg-surface-elevated)]'
                  }`}
                >
                  {s === 'AVAILABLE' ? 'KOSONG' : s === 'OCCUPIED' ? 'TERISI' : 'KOTOR'}
                </button>
              ))}
            </div>
          </div>

          <div className="mb-6">
            <h4 className="text-xs font-bold text-[var(--text-secondary)] uppercase tracking-wider mb-3">Pesanan Aktif</h4>
            {isLoadingOrders ? (
              <div className="p-4 text-center text-xs text-[var(--text-secondary)]">Memuat pesanan...</div>
            ) : activeTableOrders.length > 0 ? (
              <div className="space-y-3">
                {activeTableOrders.map((order, idx) => (
                  <div key={order.id} className="p-3 bg-[var(--bg-main)] rounded-xl border border-[var(--border)] relative group overflow-hidden">
                    <div className="flex justify-between items-start mb-2">
                      <span className="font-bold text-xs text-[var(--text-primary)]">{order.customerName || `Pelanggan #${idx+1}`}</span>
                      <span className="text-[10px] font-bold text-[var(--accent-primary)] bg-[var(--accent-primary-transparent)] px-2 py-0.5 rounded-full">{new Date(order.createdAt).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}</span>
                    </div>
                    
                    {/* Payment Status Badge */}
                    <div className="mb-2">
                      {order.paymentStatus === 'PAID' ? (
                        <span className="text-[10px] font-bold text-[var(--success)] bg-[var(--success-transparent)] px-2 py-0.5 rounded-full inline-block">Lunas (Terverifikasi)</span>
                      ) : order.paymentStatus === 'VERIFYING' ? (
                        <span className="text-[10px] font-bold text-amber-600 bg-amber-500/10 px-2 py-0.5 rounded-full inline-block">Menunggu Verifikasi</span>
                      ) : (
                        <span className="text-[10px] font-bold text-[var(--danger)] bg-[var(--danger-transparent)] px-2 py-0.5 rounded-full inline-block">Belum Dibayar</span>
                      )}
                    </div>

                    <div className="space-y-1 mb-2">
                      {(order.items || []).map((item: any, i: number) => (
                        <div key={i} className="flex justify-between text-[10px] text-[var(--text-secondary)]">
                          <span>{item.quantity || item.qty}x {item.name}</span>
                          <span className="font-medium">Rp {((item.price || 0) * (item.quantity || item.qty || 1)).toLocaleString('id-ID')}</span>
                        </div>
                      ))}
                    </div>
                    <div className="pt-2 border-t border-[var(--border)] flex justify-between items-center mb-3">
                      <span className="text-[10px] font-bold text-[var(--text-secondary)]">Total</span>
                      <span className="text-xs font-black text-[var(--text-primary)]">Rp {(order.totalAmount || 0).toLocaleString('id-ID')}</span>
                    </div>

                    {order.paymentStatus === 'VERIFYING' && order.paymentProofUrl && (
                      <div className="flex flex-col gap-2 pt-2 border-t border-[var(--border)]">
                        <div className="w-full bg-[var(--bg-main)] rounded-lg overflow-hidden border border-[var(--border)] relative group">
                          <img 
                            src={getMediaUrl(order.paymentProofUrl)} 
                            alt="Bukti Transfer" 
                            className="w-full h-32 object-contain"
                          />
                          <a 
                            href={getMediaUrl(order.paymentProofUrl)} 
                            target="_blank" 
                            rel="noreferrer"
                            className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 flex items-center justify-center transition-all cursor-zoom-in"
                          >
                            <span className="text-white text-[10px] font-bold bg-black/50 px-2 py-1 rounded">Perbesar</span>
                          </a>
                        </div>
                        <button
                          onClick={() => handleVerifyPayment(order.id)}
                          className="w-full py-1.5 text-[10px] font-bold text-white bg-[var(--accent-primary)] rounded-lg hover:brightness-110 shadow-sm transition-all"
                        >
                          Verifikasi Sah
                        </button>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            ) : (
              <div className="p-4 border-2 border-dashed border-[var(--border)] rounded-xl text-center">
                <p className="text-[10px] font-medium text-[var(--text-secondary)]">Tidak ada pesanan aktif di meja ini.</p>
              </div>
            )}
          </div>

          <div className="flex-1 flex flex-col items-center">
            <div className="p-4 bg-white rounded-2xl shadow-sm mb-4">
              <QRCodeSVG 
                value={qrUrl} 
                size={160}
                level="H"
                includeMargin={false}
                id={`qr-${selectedTable.id}`}
              />
            </div>

            <button
              onClick={() => {
                const svg = document.getElementById(`qr-${selectedTable.id}`);
                if (svg) {
                  const printWindow = window.open('', '_blank');
                  if (printWindow) {
                    printWindow.document.write(`
                      <html>
                        <head>
                          <title>Cetak QR - ${selectedTable.name}</title>
                          <style>
                            body { font-family: system-ui, sans-serif; display: flex; flex-direction: column; align-items: center; justify-content: center; height: 100vh; margin: 0; }
                            .card { border: 3px dashed #333; padding: 2rem 3rem; border-radius: 1.5rem; text-align: center; }
                            .branding { margin-bottom: 2rem; display: flex; flex-direction: column; items-center; justify-content: center; }
                            .logo { max-height: 60px; max-width: 150px; margin: 0 auto 0.5rem auto; object-fit: contain; }
                            .store-name { font-size: 1.2rem; font-weight: 800; color: #111; margin: 0; text-transform: uppercase; letter-spacing: 1px; }
                            h1 { margin: 0 0 0.5rem 0; font-size: 3rem; font-weight: 900; letter-spacing: -1px; }
                            p { color: #555; margin: 0 0 2rem 0; font-weight: 800; font-size: 1.2rem; letter-spacing: 2px; }
                            svg { width: 250px; height: 250px; }
                          </style>
                        </head>
                        <body>
                          <div class="card">
                            <div class="branding">
                              ${logoUrl ? `<img src="${getMediaUrl(logoUrl)}" class="logo" alt="Logo" />` : ''}
                              <div class="store-name">${storeName || 'Toko Kami'}</div>
                            </div>
                            <h1>${selectedTable.name}</h1>
                            <p>SCAN & PESAN</p>
                            ${svg.outerHTML}
                          </div>
                          <script>
                            setTimeout(() => { window.print(); window.close(); }, 500);
                          </script>
                        </body>
                      </html>
                    `);
                    printWindow.document.close();
                  }
                }
              }}
              className="w-full mb-3 py-2.5 bg-[var(--accent-primary-transparent)] text-[var(--accent-primary)] rounded-xl text-xs font-bold hover:bg-[var(--accent-primary)] hover:text-white transition-all flex justify-center items-center gap-2"
            >
              <Printer size={16} /> Cetak QR Code Meja
            </button>

            <p className="text-[10px] text-center text-[var(--text-secondary)] mb-4">
              Scan QR Code ini untuk membuka Menu Digital dan memesan langsung dari meja.
            </p>
            
            <a 
              href={qrUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="w-full py-2.5 border-2 border-[var(--border)] rounded-xl text-xs font-bold text-[var(--text-primary)] hover:border-[var(--accent-primary)] hover:text-[var(--accent-primary)] transition-all flex items-center justify-center gap-2 mb-auto"
            >
              Buka Link Menu
            </a>
          </div>

          <button
            onClick={() => handleDeleteTable(selectedTable.id)}
            className="mt-6 w-full py-2.5 bg-[var(--danger-transparent)] text-[var(--danger)] rounded-xl text-xs font-bold hover:bg-[var(--danger)] hover:text-white transition-all flex items-center justify-center gap-2"
          >
            <Trash2 size={16} /> Hapus Meja
          </button>
        </div>
      ) : null}

      {/* MODALS */}
      <Modal isOpen={showAddZoneModal} onClose={() => setShowAddZoneModal(false)} title="Tambah Lantai/Ruangan">
        <div className="space-y-4">
          <div>
            <label className="text-xs font-bold text-[var(--text-secondary)]">Nama Ruangan</label>
            <input 
              type="text" 
              className="w-full mt-1.5 px-3.5 py-2.5 rounded-xl bg-[var(--bg-main)] border border-[var(--border)] text-[var(--text-primary)] focus:border-[var(--accent-primary)] outline-none text-sm"
              placeholder="Contoh: Lantai 2 Outdoor"
              value={newZoneName}
              onChange={e => setNewZoneName(e.target.value)}
            />
          </div>
          <button onClick={handleAddZone} className="w-full py-2.5 bg-[var(--accent-primary)] text-white rounded-xl font-bold hover:shadow-lg transition-all">
            Simpan Ruangan
          </button>
        </div>
      </Modal>

      <Modal isOpen={showAddTableModal} onClose={() => setShowAddTableModal(false)} title="Tambah Meja Baru">
        <div className="space-y-4">
          <div>
            <label className="text-xs font-bold text-[var(--text-secondary)]">Nomor / Nama Meja</label>
            <input 
              type="text" 
              className="w-full mt-1.5 px-3.5 py-2.5 rounded-xl bg-[var(--bg-main)] border border-[var(--border)] text-[var(--text-primary)] focus:border-[var(--accent-primary)] outline-none text-sm"
              placeholder="Contoh: 12"
              value={newTableName}
              onChange={e => setNewTableName(e.target.value)}
            />
          </div>
          <div>
            <label className="text-xs font-bold text-[var(--text-secondary)]">Kapasitas Kursi</label>
            <input 
              type="number" 
              className="w-full mt-1.5 px-3.5 py-2.5 rounded-xl bg-[var(--bg-main)] border border-[var(--border)] text-[var(--text-primary)] focus:border-[var(--accent-primary)] outline-none text-sm"
              value={newTableCapacity}
              onChange={e => setNewTableCapacity(e.target.value)}
            />
          </div>
          <button onClick={handleAddTable} className="w-full py-2.5 bg-[var(--accent-primary)] text-white rounded-xl font-bold hover:shadow-lg transition-all">
            Simpan Meja
          </button>
        </div>
      </Modal>

      {/* Success Modal */}
      <Modal isOpen={showVerificationSuccessModal} onClose={() => setShowVerificationSuccessModal(false)} title="Verifikasi Berhasil" size="sm">
        <div className="flex flex-col items-center justify-center p-6 text-center">
          <div className="w-20 h-20 bg-green-100 rounded-full flex items-center justify-center mb-6">
            <ChefHat size={40} className="text-green-600" />
          </div>
          <h2 className="text-xl font-black text-[var(--text-primary)] mb-2">Pembayaran Sah!</h2>
          <p className="text-[var(--text-secondary)] font-bold text-sm mb-8">
            Pesanan telah dilunasi dan otomatis diteruskan ke <strong>Antrean Dapur</strong> untuk segera diproses.
          </p>
          <button
            onClick={() => setShowVerificationSuccessModal(false)}
            className="w-full py-3 bg-[var(--accent-primary)] text-white font-black rounded-xl shadow-sm hover:brightness-110 active:scale-95 transition-all"
          >
            Selesai
          </button>
        </div>
      </Modal>
    </div>
  );
}
