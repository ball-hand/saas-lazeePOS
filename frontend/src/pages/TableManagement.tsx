import React, { useState, useEffect, useRef } from 'react';
import { QRCodeSVG } from 'qrcode.react';
import { Plus, X, GripVertical, CheckCircle2, Clock, Trash2, Edit2, Coffee } from 'lucide-react';
import toast from 'react-hot-toast';
import api from '../api/client';
import { useAuth } from '../context/AuthContext';
import { Modal } from '../components/Modal';

interface TableZone {
  id: string;
  name: string;
  tables: TableData[];
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
  const { tenant } = useAuth();
  const [zones, setZones] = useState<TableZone[]>([]);
  const [activeZoneId, setActiveZoneId] = useState<string | null>(null);
  const [selectedTable, setSelectedTable] = useState<TableData | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  const [showAddZoneModal, setShowAddZoneModal] = useState(false);
  const [newZoneName, setNewZoneName] = useState('');

  const [showAddTableModal, setShowAddTableModal] = useState(false);
  const [newTableName, setNewTableName] = useState('');
  const [newTableCapacity, setNewTableCapacity] = useState('4');

  // Dragging state
  const [draggingTable, setDraggingTable] = useState<string | null>(null);
  const [dragOffset, setDragOffset] = useState({ x: 0, y: 0 });
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    fetchZones();
  }, []);

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
      await api.post('/tables', {
        name: newTableName,
        zoneId: activeZoneId,
        capacity: parseInt(newTableCapacity),
        x: 50,
        y: 50
      });
      toast.success('Meja berhasil ditambahkan');
      setShowAddTableModal(false);
      setNewTableName('');
      fetchZones();
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

  // Drag logic
  const handlePointerDown = (e: React.PointerEvent, table: TableData) => {
    if (e.button !== 0) return; // only left click
    e.stopPropagation();
    setSelectedTable(table);
    setDraggingTable(table.id);
    
    const target = e.currentTarget as HTMLElement;
    const rect = target.getBoundingClientRect();
    
    // Calculate offset from mouse to top-left of the table element
    setDragOffset({
      x: e.clientX - rect.left,
      y: e.clientY - rect.top
    });
    
    target.setPointerCapture(e.pointerId);
  };

  const handlePointerMove = (e: React.PointerEvent, table: TableData) => {
    if (draggingTable !== table.id || !containerRef.current) return;
    
    const containerRect = containerRef.current.getBoundingClientRect();
    
    // Calculate new X, Y relative to the container
    let newX = e.clientX - containerRect.left - dragOffset.x;
    let newY = e.clientY - containerRect.top - dragOffset.y;
    
    // Basic bounding box
    if (newX < 0) newX = 0;
    if (newY < 0) newY = 0;
    if (newX > containerRect.width - 80) newX = containerRect.width - 80;
    if (newY > containerRect.height - 80) newY = containerRect.height - 80;

    // Optimistically update UI
    setZones(prev => prev.map(z => z.id === activeZoneId ? {
      ...z,
      tables: z.tables.map(t => t.id === table.id ? { ...t, x: newX, y: newY } : t)
    } : z));
  };

  const handlePointerUp = async (e: React.PointerEvent, table: TableData) => {
    if (draggingTable !== table.id) return;
    setDraggingTable(null);
    e.currentTarget.releasePointerCapture(e.pointerId);
    
    // The final coordinates are already in state due to pointerMove
    // Find them:
    const finalZone = zones.find(z => z.id === activeZoneId);
    const finalTable = finalZone?.tables.find(t => t.id === table.id);
    if (finalTable) {
      try {
        await api.put(`/tables/${table.id}`, { x: finalTable.x, y: finalTable.y });
      } catch {
        toast.error('Gagal menyimpan posisi meja');
      }
    }
  };

  const activeZone = zones.find(z => z.id === activeZoneId);
  const qrUrl = tenant && selectedTable ? `${window.location.protocol}//${window.location.host}/m/${tenant.id}/${selectedTable.id}` : '';

  return (
    <div className="flex h-full bg-[var(--bg-main)] -m-6">
      
      {/* LEFT SIDEBAR: Zones */}
      <div className="w-64 border-r border-[var(--border)] flex flex-col bg-[var(--bg-surface-elevated)] p-4">
        <h2 className="text-lg font-black text-[var(--text-primary)] mb-4 flex items-center gap-2">
          <GripVertical size={18} className="text-[var(--accent-primary)]" />
          Manajemen Meja
        </h2>
        
        <div className="space-y-2 flex-1 overflow-y-auto custom-scrollbar pr-1">
          {zones.map(zone => (
            <div key={zone.id} className="relative group">
              <button
                onClick={() => { setActiveZoneId(zone.id); setSelectedTable(null); }}
                className={`w-full text-left px-4 py-3 rounded-xl text-sm font-bold transition-all flex justify-between items-center ${
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
      <div className="flex-1 flex flex-col relative overflow-hidden bg-[url('data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNDAiIGhlaWdodD0iNDAiIHhtbG5zPSJodHRwOi8vd3d3LnczLm9yZy8yMDAwL3N2ZyI+PGNpcmNsZSBjeD0iMSIgY3k9IjEiIHI9IjEiIGZpbGw9InJnYmEoMTUwLCAxNTAsIDE1MCwgMC4xNSkiLz48L3N2Zz4=')]">
        {activeZone ? (
          <>
            <div className="p-4 flex justify-between items-center bg-[var(--bg-surface-elevated)]/80 backdrop-blur-sm border-b border-[var(--border)] z-10">
              <h3 className="font-bold text-[var(--text-primary)]">Denah: {activeZone.name}</h3>
              <button
                onClick={() => setShowAddTableModal(true)}
                className="px-4 py-2 bg-[var(--accent-primary)] text-white rounded-lg text-xs font-bold flex items-center gap-1.5 shadow-sm hover:shadow-md transition-all"
              >
                <Plus size={14} /> Tambah Meja
              </button>
            </div>

            <div 
              ref={containerRef}
              className="flex-1 relative overflow-hidden"
              onClick={(e) => {
                if (e.target === containerRef.current) setSelectedTable(null);
              }}
            >
              {activeZone.tables.map(table => (
                <div
                  key={table.id}
                  onPointerDown={(e) => handlePointerDown(e, table)}
                  onPointerMove={(e) => handlePointerMove(e, table)}
                  onPointerUp={(e) => handlePointerUp(e, table)}
                  className={`absolute w-20 h-20 rounded-2xl flex flex-col items-center justify-center cursor-grab active:cursor-grabbing transition-all select-none shadow-sm ${
                    table.status === 'AVAILABLE' ? 'bg-[var(--success-transparent)] border-2 border-[var(--success)] text-[var(--success)]' :
                    table.status === 'OCCUPIED' ? 'bg-[var(--danger-transparent)] border-2 border-[var(--danger)] text-[var(--danger)]' :
                    'bg-amber-500/10 border-2 border-amber-500 text-amber-600'
                  } ${selectedTable?.id === table.id ? 'ring-4 ring-[var(--accent-primary)]/50 scale-105 z-20' : 'z-10'} ${draggingTable === table.id ? 'scale-105 opacity-90' : ''}`}
                  style={{ left: table.x, top: table.y, touchAction: 'none' }}
                >
                  <Coffee size={24} className="mb-1 opacity-80" />
                  <span className="font-black text-sm tracking-tight">{table.name}</span>
                  {/* Status Indicator Icon */}
                  <div className="absolute -top-2 -right-2 bg-[var(--bg-main)] rounded-full p-0.5 shadow-sm">
                    {table.status === 'AVAILABLE' && <CheckCircle2 size={14} className="fill-[var(--success)] text-white" />}
                    {table.status === 'OCCUPIED' && <Clock size={14} className="fill-[var(--danger)] text-white" />}
                    {table.status === 'CLEANING' && <Edit2 size={14} className="fill-amber-500 text-white" />}
                  </div>
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

      {/* RIGHT SIDEBAR: Table Details & QR */}
      {selectedTable && (
        <div className="w-80 border-l border-[var(--border)] bg-[var(--bg-surface-elevated)] p-5 flex flex-col z-20 animate-fade-in shadow-xl lg:shadow-none absolute right-0 inset-y-0 lg:relative">
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

          <div className="flex-1 flex flex-col items-center">
            <div className="p-4 bg-white rounded-2xl shadow-sm mb-4">
              <QRCodeSVG 
                value={qrUrl} 
                size={160}
                level="H"
                includeMargin={false}
              />
            </div>
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
            className="mt-6 w-full py-3 bg-[var(--danger-transparent)] text-[var(--danger)] rounded-xl text-xs font-bold hover:bg-[var(--danger)] hover:text-white transition-all flex items-center justify-center gap-2"
          >
            <Trash2 size={16} /> Hapus Meja
          </button>
        </div>
      )}

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
          <button onClick={handleAddZone} className="w-full py-3 bg-[var(--accent-primary)] text-white rounded-xl font-bold hover:shadow-lg transition-all">
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
          <button onClick={handleAddTable} className="w-full py-3 bg-[var(--accent-primary)] text-white rounded-xl font-bold hover:shadow-lg transition-all">
            Simpan Meja
          </button>
        </div>
      </Modal>

    </div>
  );
}
