import { useState } from 'react';
import { X } from 'lucide-react';
import { useAuthStore } from '../store/authStore';

interface InventoryModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (type: 'machinery' | 'spare-parts' | 'vehicles', data: any) => void;
  activeTab: 'machinery' | 'spare-parts' | 'vehicles';
}

export default function InventoryModal({ isOpen, onClose, onSubmit, activeTab }: InventoryModalProps) {
  const { currentCompany } = useAuthStore();
  const [formData, setFormData] = useState<any>({});

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSubmit(activeTab, formData);
  };

  const handleChange = (field: string, value: any) => {
    setFormData((prev: any) => ({ ...prev, [field]: value }));
  };

  const renderMachineryForm = () => (
    <>
      <div className="grid grid-cols-2 gap-4">
        <div className="col-span-2">
          <label className="label">Product Name</label>
          <input className="input" required onChange={(e) => handleChange('productName', e.target.value)} />
        </div>
        <div>
          <label className="label">Category</label>
          <select className="input" required onChange={(e) => handleChange('category', e.target.value)}>
            <option value="">Select Category</option>
            <option value="TRACTOR">Tractor</option>
            <option value="HARVESTER">Harvester</option>
            <option value="FARM_IMPLEMENT">Farm Implement</option>
          </select>
        </div>
        <div>
          <label className="label">Brand</label>
          <input className="input" required onChange={(e) => handleChange('brand', e.target.value)} />
        </div>
        <div>
          <label className="label">Model</label>
          <input className="input" required onChange={(e) => handleChange('model', e.target.value)} />
        </div>
        <div>
          <label className="label">Serial Number</label>
          <input className="input" onChange={(e) => handleChange('serialNumber', e.target.value)} />
        </div>
        <div>
          <label className="label">Chassis Number</label>
          <input className="input" onChange={(e) => handleChange('chassisNumber', e.target.value)} />
        </div>
        <div>
          <label className="label">Engine Number</label>
          <input className="input" onChange={(e) => handleChange('engineNumber', e.target.value)} />
        </div>
        <div>
          <label className="label">Cost Price</label>
          <input className="input" type="number" required onChange={(e) => handleChange('costPrice', Number(e.target.value))} />
        </div>
        <div>
          <label className="label">Selling Price</label>
          <input className="input" type="number" required onChange={(e) => handleChange('sellingPrice', Number(e.target.value))} />
        </div>
      </div>
    </>
  );

  const renderSparePartForm = () => (
    <>
      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className="label">{currentCompany?.code === 'SECURITY' ? 'Item Code' : 'Part Number'}</label>
          <input className="input" required onChange={(e) => handleChange('partNumber', e.target.value)} />
        </div>
        <div>
          <label className="label">{currentCompany?.code === 'SECURITY' ? 'Item Name' : 'Part Name'}</label>
          <input className="input" required onChange={(e) => handleChange('partName', e.target.value)} />
        </div>
        <div>
          <label className="label">Category</label>
          {currentCompany?.code === 'SECURITY' ? (
            <select className="input" onChange={(e) => handleChange('category', e.target.value)}>
              <option value="">Select Category</option>
              <option value="UNIFORM">Uniforms (Boots, Trousers, etc.)</option>
              <option value="EQUIPMENT">Equipment (Baton, Whistle, etc.)</option>
              <option value="STATIONERY">Stationery</option>
              <option value="OTHER">Other</option>
            </select>
          ) : (
            <input className="input" onChange={(e) => handleChange('category', e.target.value)} />
          )}
        </div>
        <div>
          <label className="label">Initial Quantity</label>
          <input className="input" type="number" required onChange={(e) => handleChange('quantity', Number(e.target.value))} />
        </div>
        <div>
          <label className="label">Cost Price</label>
          <input className="input" type="number" required onChange={(e) => handleChange('costPrice', Number(e.target.value))} />
        </div>
        <div>
          <label className="label">Selling Price</label>
          <input className="input" type="number" required onChange={(e) => handleChange('sellingPrice', Number(e.target.value))} />
        </div>
        <div>
          <label className="label">Reorder Level</label>
          <input className="input" type="number" defaultValue={10} onChange={(e) => handleChange('reorderLevel', Number(e.target.value))} />
        </div>
      </div>
    </>
  );

  const renderVehicleForm = () => (
    <>
      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className="label">Registration Number</label>
          <input className="input" required onChange={(e) => handleChange('registrationNumber', e.target.value)} />
        </div>
        <div>
          <label className="label">Make</label>
          <input className="input" required onChange={(e) => handleChange('make', e.target.value)} />
        </div>
        <div>
          <label className="label">Model</label>
          <input className="input" required onChange={(e) => handleChange('model', e.target.value)} />
        </div>
        <div>
          <label className="label">Year</label>
          <input className="input" type="number" required onChange={(e) => handleChange('year', Number(e.target.value))} />
        </div>
        <div>
          <label className="label">Chassis Number</label>
          <input className="input" onChange={(e) => handleChange('chassisNumber', e.target.value)} />
        </div>
        <div>
          <label className="label">Engine Number</label>
          <input className="input" onChange={(e) => handleChange('engineNumber', e.target.value)} />
        </div>
        <div>
          <label className="label">Purchase Price</label>
          <input className="input" type="number" required onChange={(e) => handleChange('purchasePrice', Number(e.target.value))} />
        </div>
        <div>
          <label className="label">Selling Price</label>
          <input className="input" type="number" required onChange={(e) => handleChange('sellingPrice', Number(e.target.value))} />
        </div>
      </div>
    </>
  );

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-black bg-opacity-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-xl shadow-xl w-full max-w-2xl">
        <div className="flex items-center justify-between p-6 border-b">
          <h2 className="text-xl font-bold capitalize">Add {activeTab.replace('-', ' ')}</h2>
          <button onClick={onClose} className="p-2 hover:bg-gray-100 rounded-full">
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-6">
          {activeTab === 'machinery' && renderMachineryForm()}
          {activeTab === 'spare-parts' && renderSparePartForm()}
          {activeTab === 'vehicles' && renderVehicleForm()}

          <div className="flex justify-end gap-3 pt-6">
            <button type="button" onClick={onClose} className="px-4 py-2 border rounded-lg text-gray-700 hover:bg-gray-50 font-medium">
              Cancel
            </button>
            <button type="submit" className="btn-primary">
              Add to Inventory
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
