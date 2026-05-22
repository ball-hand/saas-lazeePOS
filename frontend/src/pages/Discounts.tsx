import { useState, useEffect } from 'react';
import { Plus, Tags, Trash2, Edit2 } from 'lucide-react';
import api from '../api/client';
import { useAuth } from '../context/AuthContext';
import { Modal } from '../components/Modal';
import toast from 'react-hot-toast';

export function Discounts() {
  const [discounts, setDiscounts] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const { user } = useAuth();
  
  // Modal state
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingId, setEditingId] = useState<number | null>(null);
  
  // Form state
  const [formData, setFormData] = useState({
    name: '',
    discountType: 'percentage',
    discountValue: '',
    appliesTo: 'all',
    appliesToCategory: '',
    minQuantity: '1',
    minOrderAmount: '',
    isActive: true
  });

  const fetchDiscounts = async () => {
    try {
      const { data } = await api.get('/discounts');
      setDiscounts(data.discounts);
    } catch (error) {
      toast.error('Failed to load discount rules');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchDiscounts();
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      if (editingId) {
        await api.put(`/discounts/${editingId}`, formData);
        toast.success('Discount rule updated');
      } else {
        await api.post('/discounts', formData);
        toast.success('Discount rule created');
      }
      setIsModalOpen(false);
      fetchDiscounts();
    } catch (error: any) {
      toast.error(error.response?.data?.message || 'Failed to save discount rule');
    }
  };

  const handleDelete = async (id: number) => {
    if (!window.confirm('Are you sure you want to delete this discount rule?')) return;
    try {
      await api.delete(`/discounts/${id}`);
      toast.success('Discount deleted');
      fetchDiscounts();
    } catch (error) {
      toast.error('Failed to delete discount');
    }
  };

  const openAddModal = () => {
    setEditingId(null);
    setFormData({
      name: '', discountType: 'percentage', discountValue: '', appliesTo: 'all', appliesToCategory: '', minQuantity: '1', minOrderAmount: '', isActive: true
    });
    setIsModalOpen(true);
  };

  const openEditModal = (d: any) => {
    setEditingId(d.id);
    setFormData({
      name: d.name,
      discountType: d.discountType,
      discountValue: d.discountValue.toString(),
      appliesTo: d.appliesTo,
      appliesToCategory: d.appliesToCategory || '',
      minQuantity: d.minQuantity.toString(),
      minOrderAmount: d.minOrderAmount?.toString() || '',
      isActive: d.isActive
    });
    setIsModalOpen(true);
  };

  if (user?.role !== 'admin') {
    return <div className="text-center py-20 text-danger h2">Unauthorized Access</div>;
  }

  return (
    <div className="animate-fade-in flex flex-col gap-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="h1 text-white mb-2">Discount Engine</h1>
          <p className="text-secondary">Create conditional pricing and promotional rules.</p>
        </div>
        
        <button onClick={openAddModal} className="btn btn-primary">
          <Plus size={18} /> Create Rule
        </button>
      </div>

      <div className="glass-panel p-6">
        <div className="table-container">
          <table>
            <thead>
              <tr>
                <th>Rule Name</th>
                <th>Type & Value</th>
                <th>Conditions</th>
                <th>Status</th>
                <th className="text-right">Actions</th>
              </tr>
            </thead>
            <tbody>
              {isLoading ? (
                <tr><td colSpan={5} className="text-center py-8">Loading...</td></tr>
              ) : discounts.length === 0 ? (
                <tr>
                  <td colSpan={5} className="text-center py-12 text-muted flex flex-col items-center gap-4">
                    <Tags size={48} className="opacity-20" />
                    <span>No active discount rules.</span>
                  </td>
                </tr>
              ) : (
                discounts.map((d: any) => (
                  <tr key={d.id} className={!d.isActive ? 'opacity-50' : ''}>
                    <td className="font-medium text-white">{d.name}</td>
                    <td>
                      <span className="badge badge-primary font-mono text-sm">
                        {d.discountType === 'percentage' ? `${parseFloat(d.discountValue)}% OFF` : 
                         d.discountType === 'fixed_amount' ? `$${parseFloat(d.discountValue)} OFF` : 
                         'BOGO'}
                      </span>
                    </td>
                    <td className="text-sm text-secondary">
                      <div className="flex flex-col gap-1">
                        <span>Applies to: <strong className="text-white capitalize">{d.appliesTo} {d.appliesTo === 'category' ? `(${d.appliesToCategory})` : ''}</strong></span>
                        {d.minQuantity > 1 && <span>Min Qty: <strong className="text-white">{d.minQuantity}</strong></span>}
                        {d.minOrderAmount && <span>Min Order: <strong className="text-white">${parseFloat(d.minOrderAmount).toFixed(2)}</strong></span>}
                      </div>
                    </td>
                    <td>
                      {d.isActive ? <span className="badge badge-success">Active</span> : <span className="badge badge-warning text-muted">Disabled</span>}
                    </td>
                    <td className="text-right">
                      <div className="flex justify-end gap-2">
                        <button onClick={() => openEditModal(d)} className="p-2 text-secondary hover:text-white bg-[rgba(255,255,255,0.05)] rounded-lg">
                          <Edit2 size={16} />
                        </button>
                        <button onClick={() => handleDelete(d.id)} className="p-2 text-danger hover:bg-[rgba(239,68,68,0.1)] rounded-lg">
                          <Trash2 size={16} />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      <Modal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} title={editingId ? 'Edit Discount Rule' : 'New Discount Rule'}>
        <form onSubmit={handleSubmit} className="flex flex-col gap-4">
          <div>
            <label className="block text-sm font-medium text-secondary mb-1">Rule Name *</label>
            <input required type="text" className="input-field" placeholder="e.g. 10% Off Beverages" value={formData.name} onChange={e => setFormData({...formData, name: e.target.value})} />
          </div>
          
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-secondary mb-1">Discount Type *</label>
              <select className="input-field bg-surface-elevated" value={formData.discountType} onChange={e => setFormData({...formData, discountType: e.target.value})}>
                <option value="percentage">Percentage (%)</option>
                <option value="fixed_amount">Fixed Amount ($)</option>
                <option value="bogo">Buy 1 Get 1 Free</option>
              </select>
            </div>
            
            {formData.discountType !== 'bogo' && (
              <div>
                <label className="block text-sm font-medium text-secondary mb-1">Discount Value *</label>
                <input required type="number" step="0.01" min="0" className="input-field" placeholder={formData.discountType === 'percentage' ? 'e.g. 10' : 'e.g. 5.00'} value={formData.discountValue} onChange={e => setFormData({...formData, discountValue: e.target.value})} />
              </div>
            )}
          </div>

          <div className="border-t border-[rgba(255,255,255,0.05)] my-2"></div>
          <h4 className="text-sm font-semibold text-white">Conditions</h4>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-secondary mb-1">Applies To</label>
              <select className="input-field bg-surface-elevated" value={formData.appliesTo} onChange={e => setFormData({...formData, appliesTo: e.target.value})}>
                <option value="all">All Products</option>
                <option value="category">Specific Category</option>
              </select>
            </div>
            
            {formData.appliesTo === 'category' && (
              <div>
                <label className="block text-sm font-medium text-secondary mb-1">Category Name *</label>
                <input required type="text" className="input-field" placeholder="e.g. Beverages" value={formData.appliesToCategory} onChange={e => setFormData({...formData, appliesToCategory: e.target.value})} />
              </div>
            )}
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-secondary mb-1">Minimum Item Quantity</label>
              <input type="number" min="1" className="input-field" value={formData.minQuantity} onChange={e => setFormData({...formData, minQuantity: e.target.value})} />
            </div>
            
            <div>
              <label className="block text-sm font-medium text-secondary mb-1">Minimum Cart Total ($)</label>
              <input type="number" step="0.01" min="0" className="input-field" placeholder="Leave empty for none" value={formData.minOrderAmount} onChange={e => setFormData({...formData, minOrderAmount: e.target.value})} />
            </div>
          </div>

          <div className="mt-2">
            <label className="flex items-center gap-3 cursor-pointer p-3 rounded-lg border border-[rgba(255,255,255,0.1)] bg-[rgba(255,255,255,0.02)]">
              <input type="checkbox" className="w-4 h-4 rounded accent-primary" checked={formData.isActive} onChange={e => setFormData({...formData, isActive: e.target.checked})} />
              <span className="text-sm font-medium text-white">Rule is Active</span>
            </label>
          </div>

          <div className="flex justify-end gap-3 mt-4">
            <button type="button" onClick={() => setIsModalOpen(false)} className="btn btn-secondary">Cancel</button>
            <button type="submit" className="btn btn-primary">{editingId ? 'Save Changes' : 'Create Rule'}</button>
          </div>
        </form>
      </Modal>
    </div>
  );
}
